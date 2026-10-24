<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

// Before and after, split by a divider (a Vue port of the ImageCompare React
// component the design brief points to). Drag anywhere to move it: the line
// follows 1:1, rubber-bands past the edges and stays where it is let go. A
// press on the image springs the divider there; on touch the press waits for a
// sideways drag so the page still scrolls. Arrow keys step 1% (Shift 10%),
// Home and End reveal one side fully, a double-click on the handle springs it
// back to the middle. Captions fade as the divider reaches them.

const props = withDefaults(defineProps<{
  /** Divider position in percent from the left (v-model:position). */
  position?: number;
  /** Captions over each side; false hides them. */
  labels?: [string, string] | false;
  /** Accessible name of the divider. */
  label?: string;
}>(), {
  position: 50,
  labels: () => ["Before", "After"],
  label: "Before and after",
});
const emit = defineEmits<{ "update:position": [value: number] }>();

// Rubber-band travel past an edge, the handle's inset from the frame, how far
// it gives inside that inset, and a key press at a limit.
const STRETCH = 9;
const MARGIN = 42;
const GIVE = 12;
const BUMP_PX = 150;
const INSET = 12;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
/** iOS-style resistance: travel past a limit gives less and less, never more than `limit` pixels. */
const rubber = (distance: number, limit = STRETCH) =>
  Math.sign(distance) * (1 - 1 / ((Math.abs(distance) * 0.55) / limit + 1)) * limit;
/** The handle keeps the line's pace in the middle and slows smoothly near an edge. */
const give = (distance: number) => GIVE * (1 - 1 / (distance / GIVE + 1));
const soften = (at: number, size: number) =>
  at < MARGIN ? MARGIN - give(MARGIN - at) : at > size - MARGIN ? size - MARGIN + give(at - size + MARGIN) : at;
const fade = (room: number) => clamp(room / 28, 0, 1);

/** A spring written as stiffness and damping, settling far below a pixel. */
const springFor = (visualDuration: number, bounce: number) => {
  const root = (2 * Math.PI) / (visualDuration * 1.2);
  return { stiffness: root * root, damping: 2 * (1 - bounce) * root };
};
const MOVE = springFor(0.35, 0.12);
const KICK = springFor(0.45, 0.3);

/** One animatable number with velocity, stepped by a spring on rAF. */
class Spring {
  value: number;
  velocity = 0;
  private target = 0;
  private config = MOVE;
  private frame = 0;
  private last = 0;
  constructor(value: number, private readonly onChange: () => void) {
    this.value = value;
  }

  jump(value: number) {
    this.stop();
    this.value = value;
    this.velocity = 0;
    this.onChange();
  }

  to(target: number, config = MOVE, velocity = this.velocity) {
    this.target = target;
    this.config = config;
    this.velocity = velocity;
    if (reduced.value) return this.jump(target);
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.step);
    }
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private step = (now: number) => {
    let dt = Math.min(0.064, (now - this.last) / 1000);
    this.last = now;
    // Small fixed sub-steps keep the stiff spring stable at any frame rate.
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      const force = -this.config.stiffness * (this.value - this.target) - this.config.damping * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
      dt -= h;
    }
    if (Math.abs(this.value - this.target) < 0.002 && Math.abs(this.velocity) < 0.02) {
      this.value = this.target;
      this.velocity = 0;
      this.frame = 0;
    } else {
      this.frame = requestAnimationFrame(this.step);
    }
    this.onChange();
  };
}

const root = ref<HTMLElement | null>(null);
const handle = ref<HTMLElement | null>(null);
const beforeChip = ref<HTMLElement | null>(null);
const afterChip = ref<HTMLElement | null>(null);
const reduced = ref(false);
const dragging = ref(false);
const quiet = ref(false);

// The divider is a committed position plus a catch-up offset: a press springs
// the offset to zero while the pointer moves the position 1:1, so the divider
// glides to the finger and never trails it.
const tick = ref(0);
const redraw = () => { tick.value++; };
const pos = new Spring(clamp(props.position, 0, 100), redraw);
const lag = new Spring(0, redraw);
const size = ref({ w: 0, h: 0, bw: 0, aw: 0 });

let latest = clamp(props.position, 0, 100);
let goal = latest;
let pressedHandle = false;
type Drag = { pointer: number; grab: number; press: boolean; started: boolean; x: number; y: number; raw: number };
let drag: Drag | null = null;

const shown = computed(() => {
  void tick.value; // the springs live outside Vue; tick re-runs this per frame
  return pos.value + lag.value;
});
const afterShare = computed(() => Math.round(100 - clamp(shown.value, 0, 100)));
const clipPath = computed(() => `inset(0 ${(100 - clamp(shown.value, 0, 100)).toFixed(3)}% 0 0)`);
const handleShift = computed(() => {
  const { w } = size.value;
  if (!w) return 0;
  const x = (shown.value / 100) * w;
  return soften(x, w) - x;
});
const beforeOpacity = computed(() => {
  const { w, bw } = size.value;
  return w ? fade((clamp(shown.value, 0, 100) / 100) * w - (INSET + bw + 8)) : 1;
});
const afterOpacity = computed(() => {
  const { w, aw } = size.value;
  return w ? fade(w - INSET - aw - 8 - (clamp(shown.value, 0, 100) / 100) * w) : 1;
});

function commit(next: number, live = false) {
  if (live && Math.round(next) === Math.round(latest)) return;
  const value = Number(next.toFixed(2));
  if (value === latest) return;
  latest = value;
  emit("update:position", value);
}

// Positions that arrive from outside a drag (the prop, keys, a double-click)
// spring the divider there.
watch(() => props.position, (value) => {
  const current = clamp(value, 0, 100);
  latest = current;
  if (drag?.started || goal === current) return;
  goal = current;
  const from = pos.value + lag.value;
  lag.jump(0);
  pos.jump(from);
  pos.to(current);
});

const rect = () => root.value!.getBoundingClientRect();
const percentAt = (event: PointerEvent) => {
  const box = rect();
  return ((event.clientX - box.left) / (box.width || 1)) * 100;
};
const axisSize = () => root.value?.getBoundingClientRect().width || 1;

/** Focus that follows a pointer keeps the handle quiet: no ring until a key is pressed. */
function focusQuietly() {
  const node = handle.value;
  if (!node || document.activeElement === node) return;
  quiet.value = true;
  node.focus({ preventScroll: true });
}

function start(state: Drag, at: number) {
  const from = pos.value + lag.value;
  state.started = true;
  state.grab = state.press ? 0 : at - from;
  lag.jump(0);
  pos.jump(from);
  dragging.value = true;
  focusQuietly();
  follow(state, at, true);
}

/** Puts the line under the pointer, with resistance past the edges. */
function follow(state: Drag, at: number, first = false) {
  const raw = at - state.grab;
  const width = axisSize();
  const edge = clamp(raw, 0, 100);
  const placed = reduced.value ? edge : edge + (rubber(((raw - edge) / 100) * width) / width) * 100;
  state.raw = raw;
  if (first && state.press && !reduced.value) {
    const from = pos.value;
    pos.jump(placed);
    lag.jump(from - placed);
    lag.to(0);
  } else {
    pos.jump(placed);
  }
  commit(edge, true);
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !event.isPrimary || !root.value) return;
  const onHandle = !!(event.target as HTMLElement).closest("[data-handle]");
  pressedHandle = onHandle;
  root.value.setPointerCapture(event.pointerId);
  const state: Drag = { pointer: event.pointerId, grab: 0, press: !onHandle, started: false, x: event.clientX, y: event.clientY, raw: 0 };
  drag = state;
  // A finger on the photo might be scrolling the page, so it waits for a
  // sideways drag; a mouse or the handle answers at once.
  if (event.pointerType !== "touch" || onHandle) start(state, percentAt(event));
}

function onPointerMove(event: PointerEvent) {
  const state = drag;
  if (!state || state.pointer !== event.pointerId) return;
  if (!state.started) {
    const along = Math.abs(event.clientX - state.x);
    const across = Math.abs(event.clientY - state.y);
    if (along < 6 && across < 6) return;
    if (across > along) {
      drag = null;
      return;
    }
    start(state, percentAt(event));
    return;
  }
  follow(state, percentAt(event));
}

function onPointerEnd(event: PointerEvent) {
  const state = drag;
  if (!state || state.pointer !== event.pointerId) return;
  drag = null;
  // A tap on the photo moves the divider there.
  if (!state.started) {
    if (event.type === "pointerup") {
      focusQuietly();
      const target = clamp(percentAt(event), 0, 100);
      goal = target;
      pos.to(target);
      commit(target);
    }
    return;
  }
  // The divider stays where it was let go. Past an edge, or still catching up
  // to a press, it springs on with the speed it had.
  const from = pos.value + lag.value;
  const velocity = lag.velocity;
  const target = clamp(lag.value !== 0 ? state.raw : from, 0, 100);
  lag.jump(0);
  pos.jump(from);
  goal = Number(target.toFixed(2));
  if (from !== target) pos.to(target, MOVE, velocity);
  commit(target);
  dragging.value = false;
}

function onKeyDown(event: KeyboardEvent) {
  const large = event.shiftKey ? 10 : 1;
  const toward: Record<string, number> = {
    ArrowLeft: -large, ArrowRight: large, ArrowUp: -large, ArrowDown: large, PageUp: -10, PageDown: 10,
  };
  let next: number;
  if (event.key === "Home") next = 100;
  else if (event.key === "End") next = 0;
  else if (event.key in toward) next = Math.round(latest) + toward[event.key]!;
  else return;
  event.preventDefault();
  quiet.value = false;
  const clamped = clamp(next, 0, 100);
  if (clamped === latest) {
    if (!reduced.value && next !== clamped) pos.to(goal, KICK, ((Math.sign(next - clamped) * BUMP_PX) / axisSize()) * 100);
    return;
  }
  goal = clamped;
  pos.to(clamped);
  commit(clamped);
}

function onDoubleClick() {
  // Pointer capture sends the double-click to the frame, so check where the presses began.
  if (pressedHandle && latest !== 50) {
    goal = 50;
    pos.to(50);
    commit(50);
  }
}

let observer: ResizeObserver | undefined;
let media: MediaQueryList | undefined;
const syncReduced = () => { reduced.value = !!media?.matches; };
onMounted(async () => {
  media = window.matchMedia("(prefers-reduced-motion: reduce)");
  syncReduced();
  media.addEventListener("change", syncReduced);
  await nextTick();
  const measure = () => {
    size.value = {
      w: root.value?.clientWidth ?? 0,
      h: root.value?.clientHeight ?? 0,
      bw: beforeChip.value?.offsetWidth ?? 0,
      aw: afterChip.value?.offsetWidth ?? 0,
    };
  };
  observer = new ResizeObserver(measure);
  [root.value, beforeChip.value, afterChip.value].forEach((node) => node && observer!.observe(node));
  measure();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  media?.removeEventListener("change", syncReduced);
  pos.stop();
  lag.stop();
});
</script>

<template>
  <div
    ref="root"
    class="compare"
    :data-dragging="dragging || undefined"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @lostpointercapture="onPointerEnd"
    @mousedown.prevent
    @dragstart.prevent
    @dblclick="onDoubleClick"
  >
    <div class="compare__layer"><slot name="after" /></div>
    <div class="compare__layer" :style="{ clipPath }"><slot name="before" /></div>
    <template v-if="labels">
      <span ref="beforeChip" class="compare__chip" :style="{ opacity: beforeOpacity }" aria-hidden="true">{{ labels[0] }}</span>
      <span ref="afterChip" class="compare__chip compare__chip--end" :style="{ opacity: afterOpacity }" aria-hidden="true">{{ labels[1] }}</span>
    </template>
    <div class="compare__pivot" :style="{ left: `${shown}%` }">
      <span class="compare__line" />
      <span class="compare__slot" :style="{ transform: `translateX(${handleShift}px)` }">
        <span
          ref="handle"
          data-handle=""
          :data-quiet="quiet || undefined"
          class="compare__handle"
          role="slider"
          tabindex="0"
          :aria-label="label"
          aria-orientation="horizontal"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="afterShare"
          :aria-valuetext="`${afterShare}% after`"
          @keydown="onKeyDown"
          @blur="quiet = false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6 3 12l6 6M15 6l6 6-6 6" /></svg>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.compare {
  --compare-line: #00f02a;
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  cursor: ew-resize;
  isolation: isolate;
}

.compare__layer {
  position: absolute;
  inset: 0;
}

.compare__layer :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* "Before" / "After": the caption step at the label weight. */
.compare__chip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 0.3em 0.75em;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.55);
  color: #fff;
  font-family: var(--app-font-sans);
  font-size: var(--type-caption-size);
  font-weight: 600;
  line-height: var(--type-caption-lh);
  letter-spacing: var(--type-caption-ls);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.compare__chip--end {
  left: auto;
  right: 12px;
}

.compare__pivot {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 0;
  pointer-events: none;
}

.compare__line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--compare-line-width, 8px);
  translate: -50% 0;
  background: var(--compare-line);
}

.compare__slot {
  position: absolute;
  top: 50%;
  left: 0;
}

.compare__handle {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--compare-line);
  color: #062b10;
  box-shadow: 0 4px 18px rgb(0 0 0 / 0.25);
  translate: -50% -50%;
  pointer-events: auto;
  cursor: grab;
  transition: width 0.25s ease, height 0.25s ease;
}

.compare[data-dragging] .compare__handle {
  width: 40px;
  height: 26px;
  cursor: grabbing;
}

.compare__handle svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.compare__handle:focus-visible:not([data-quiet]) {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.compare__handle:focus {
  outline: none;
}
</style>
