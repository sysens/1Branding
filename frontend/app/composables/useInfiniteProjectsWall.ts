import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type CSSProperties,
  type Ref,
} from "vue";

type WallMetrics = {
  baseHeight: number;
  baseWidth: number;
  gap: number;
  tileHeight: number;
  tileWidth: number;
};

type GridCopies = {
  columns: number;
  rows: number;
};

type InfiniteWall = {
  containerRef: Ref<HTMLElement | null>;
  gridCopies: Readonly<Ref<GridCopies>>;
  isDragging: Ref<boolean>;
  onClick: (event: MouseEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onWheel: (event: WheelEvent) => void;
  planeRef: Ref<HTMLElement | null>;
  wallStyle: Readonly<Ref<CSSProperties>>;
};

const COLUMN_COUNT = 4;
const ROW_COUNT = 5;
const WHEEL_INERTIA = 0.0036; // wheel px → velocity kick, in px per ms
const VELOCITY_LIMIT = 4.5; // px per ms
const GLIDE_DECAY = 0.95; // momentum kept per 60fps frame after release
const DRAG_PAUSE_MS = 90; // pointer still this long while held → momentum resets
const POINTER_CAPTURE_THRESHOLD = 4; // px of drag before pointer capture engages

// Auto-scroll speed (pixels per 60fps frame) — diagonal: right + up
const AUTO_SCROLL_X = 0.6;  // move right
const AUTO_SCROLL_Y = -0.4; // move up

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const wrap = (value: number, span: number): number => {
  if (span <= 0) return value;
  return ((value % span) + span) % span - span;
};

const getMetrics = (width: number): WallMetrics => {
  // Past 1920px the whole site grows with the root size (8.889px + 1/270 of
  // the width, see html in tailwind.css): the tiles grow by the same factor.
  const scale = Math.max(1, (8.889 + width / 270) / 16);
  const tileWidth = (width <= 640 ? 285 : width <= 1024 ? 390 : 500) * scale;
  const tileHeight = tileWidth * (9 / 16);
  const gap = 20 * scale;

  return {
    tileWidth,
    tileHeight,
    gap,
    baseWidth: COLUMN_COUNT * (tileWidth + gap),
    baseHeight: ROW_COUNT * (tileHeight + gap),
  };
};

export const useInfiniteProjectsWall = (): InfiniteWall => {
  const containerRef = ref<HTMLElement | null>(null);
  const planeRef = ref<HTMLElement | null>(null);
  const isDragging = ref(false);
  const metrics = ref<WallMetrics>(getMetrics(1280));
  // The plane is drawn from one base grid left of and above the screen, so it
  // needs enough copies of the grid to reach the far edges of wide or tall
  // screens (3x3 covers up to one base grid, ~2080px).
  const gridCopies = ref<GridCopies>({ columns: 3, rows: 3 });

  let offsetX = 0;
  let offsetY = 0;
  let velocityX = 0; // px per ms
  let velocityY = 0; // px per ms
  let animationFrame = 0;
  let lastFrameTime = 0;
  let lastMoveTime = 0;
  let pointerId: number | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let dragDistance = 0;
  let capturedPointer = false;
  let suppressClickUntil = 0;
  let resizeObserver: ResizeObserver | null = null;

  const wallStyle = computed<CSSProperties>(() => ({
    "--project-base-width": `${metrics.value.baseWidth}px`,
    "--project-base-height": `${metrics.value.baseHeight}px`,
    "--project-tile-width": `${metrics.value.tileWidth}px`,
    "--project-tile-height": `${metrics.value.tileHeight}px`,
    "--project-wall-gap": `${metrics.value.gap}px`,
    "--project-grid-width": `${metrics.value.baseWidth - metrics.value.gap}px`,
    "--project-grid-height": `${metrics.value.baseHeight - metrics.value.gap}px`,
    "--project-copy-columns": gridCopies.value.columns,
    "--project-copy-rows": gridCopies.value.rows,
  }));

  const render = (): void => {
    if (!planeRef.value) return;

    offsetX = wrap(offsetX, metrics.value.baseWidth);
    offsetY = wrap(offsetY, metrics.value.baseHeight);
    const x = -metrics.value.baseWidth + offsetX;
    const y = -metrics.value.baseHeight + offsetY;
    planeRef.value.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const stopAnimation = (): void => {
    if (!animationFrame) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const animate = (now: number): void => {
    animationFrame = 0;
    const frameMs = lastFrameTime ? Math.min(64, now - lastFrameTime) : 16.7;
    lastFrameTime = now;
    const dt = frameMs / 16.7;

    if (isDragging.value) {
      // Held still: drop momentum so releasing later doesn't fling from a stale velocity
      if (now - lastMoveTime > DRAG_PAUSE_MS) {
        velocityX = 0;
        velocityY = 0;
      }
      animationFrame = requestAnimationFrame(animate);
      return;
    }

    // Continuous auto-scroll (marquee) blended with residual drag/wheel momentum,
    // so a release glides smoothly into the marquee drift instead of stopping first
    offsetX += AUTO_SCROLL_X * dt + velocityX * frameMs;
    offsetY += AUTO_SCROLL_Y * dt + velocityY * frameMs;
    velocityX *= Math.pow(GLIDE_DECAY, dt);
    velocityY *= Math.pow(GLIDE_DECAY, dt);
    if (Math.abs(velocityX) < 0.003) velocityX = 0;
    if (Math.abs(velocityY) < 0.003) velocityY = 0;

    render();
    animationFrame = requestAnimationFrame(animate);
  };

  const startAnimation = (): void => {
    if (animationFrame) return;
    lastFrameTime = 0;
    animationFrame = requestAnimationFrame(animate);
  };

  const resize = (): void => {
    const container = containerRef.value;
    if (!container) return;

    const previous = metrics.value;
    const next = getMetrics(container.clientWidth);
    offsetX = previous.baseWidth
      ? (offsetX / previous.baseWidth) * next.baseWidth
      : -next.tileWidth * 0.42;
    offsetY = previous.baseHeight
      ? (offsetY / previous.baseHeight) * next.baseHeight
      : -next.tileHeight * 0.35;
    metrics.value = next;
    gridCopies.value = {
      columns: Math.max(3, Math.ceil(container.clientWidth / next.baseWidth) + 2),
      rows: Math.max(3, Math.ceil(container.clientHeight / next.baseHeight) + 2),
    };
    render();
  };

  const normalizeWheel = (value: number, mode: number): number => {
    if (mode === WheelEvent.DOM_DELTA_LINE) return value * 16;
    if (mode === WheelEvent.DOM_DELTA_PAGE) {
      return value * (containerRef.value?.clientHeight || 800);
    }
    return value;
  };

  const onWheel = (event: WheelEvent): void => {
    if (event.ctrlKey) return;
    event.preventDefault();

    const rawX = normalizeWheel(event.deltaX, event.deltaMode);
    const rawY = normalizeWheel(event.deltaY, event.deltaMode);
    const deltaX = event.shiftKey && rawX === 0 ? rawY : rawX;
    const deltaY = event.shiftKey ? 0 : rawY;

    offsetX -= deltaX;
    offsetY -= deltaY;
    velocityX = clamp(velocityX - deltaX * WHEEL_INERTIA, -VELOCITY_LIMIT, VELOCITY_LIMIT);
    velocityY = clamp(velocityY - deltaY * WHEEL_INERTIA, -VELOCITY_LIMIT, VELOCITY_LIMIT);
    render();
    startAnimation();
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    dragDistance = 0;
    capturedPointer = false;
    velocityX = 0;
    velocityY = 0;
    lastMoveTime = event.timeStamp;
    isDragging.value = true;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!isDragging.value || event.pointerId !== pointerId) return;
    const now = event.timeStamp;
    const deltaMs = Math.max(1, now - lastMoveTime);
    const deltaX = event.clientX - pointerX;
    const deltaY = event.clientY - pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    lastMoveTime = now;
    dragDistance += Math.hypot(deltaX, deltaY);
    // Capture only once a real drag starts: capturing on pointerdown would
    // retarget the tap's click to the wall and break card navigation
    if (!capturedPointer && dragDistance > POINTER_CAPTURE_THRESHOLD) {
      capturedPointer = true;
      containerRef.value?.setPointerCapture(event.pointerId);
    }
    offsetX += deltaX;
    offsetY += deltaY;
    velocityX = clamp(
      velocityX + (deltaX / deltaMs - velocityX) * 0.4,
      -VELOCITY_LIMIT,
      VELOCITY_LIMIT
    );
    velocityY = clamp(
      velocityY + (deltaY / deltaMs - velocityY) * 0.4,
      -VELOCITY_LIMIT,
      VELOCITY_LIMIT
    );
    render();
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    if (
      capturedPointer &&
      containerRef.value?.hasPointerCapture(event.pointerId)
    ) {
      containerRef.value.releasePointerCapture(event.pointerId);
    }
    capturedPointer = false;
    if (dragDistance > 8) suppressClickUntil = performance.now() + 250;
    pointerId = null;
    isDragging.value = false;
    startAnimation();
  };

  const onClick = (event: MouseEvent): void => {
    if (performance.now() < suppressClickUntil) event.preventDefault();
  };

  // The marquee only runs while the wall is on screen and the tab is visible.
  let inView = true;
  let viewObserver: IntersectionObserver | null = null;
  const runWhenVisible = (): void => {
    if (inView && !document.hidden) startAnimation();
    else stopAnimation();
  };

  onMounted(() => {
    offsetX = -getMetrics(window.innerWidth).tileWidth * 0.42;
    offsetY = -getMetrics(window.innerWidth).tileHeight * 0.35;
    resizeObserver = new ResizeObserver(resize);
    if (containerRef.value) resizeObserver.observe(containerRef.value);
    resize();
    viewObserver = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      runWhenVisible();
    });
    if (containerRef.value) viewObserver.observe(containerRef.value);
    document.addEventListener("visibilitychange", runWhenVisible);
    startAnimation(); // begin continuous marquee
  });

  onBeforeUnmount(() => {
    stopAnimation();
    resizeObserver?.disconnect();
    resizeObserver = null;
    viewObserver?.disconnect();
    viewObserver = null;
    document.removeEventListener("visibilitychange", runWhenVisible);
  });

  return {
    containerRef,
    gridCopies,
    isDragging,
    onClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    planeRef,
    wallStyle,
  };
};
