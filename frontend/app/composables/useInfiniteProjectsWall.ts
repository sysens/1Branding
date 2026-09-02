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

type InfiniteWall = {
  containerRef: Ref<HTMLElement | null>;
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
const WHEEL_INERTIA = 0.06;
const VELOCITY_LIMIT = 72;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const wrap = (value: number, span: number): number => {
  if (span <= 0) return value;
  return ((value % span) + span) % span - span;
};

const getMetrics = (width: number): WallMetrics => {
  const tileWidth = width <= 640 ? 285 : width <= 1024 ? 390 : 500;
  const tileHeight = tileWidth * (9 / 16);
  const gap = 38;

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

  let offsetX = 0;
  let offsetY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let animationFrame = 0;
  let pointerId: number | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let dragDistance = 0;
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

  const animate = (): void => {
    animationFrame = 0;
    if (isDragging.value) return;

    offsetX += velocityX;
    offsetY += velocityY;
    velocityX *= 0.88;
    velocityY *= 0.88;
    render();

    if (Math.abs(velocityX) > 0.05 || Math.abs(velocityY) > 0.05) {
      animationFrame = requestAnimationFrame(animate);
    }
  };

  const startAnimation = (): void => {
    if (!animationFrame) animationFrame = requestAnimationFrame(animate);
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
    stopAnimation();
    pointerId = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    dragDistance = 0;
    velocityX = 0;
    velocityY = 0;
    isDragging.value = true;
    containerRef.value?.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!isDragging.value || event.pointerId !== pointerId) return;
    const deltaX = event.clientX - pointerX;
    const deltaY = event.clientY - pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    dragDistance += Math.hypot(deltaX, deltaY);
    offsetX += deltaX;
    offsetY += deltaY;
    velocityX = deltaX * 0.72;
    velocityY = deltaY * 0.72;
    render();
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    if (containerRef.value?.hasPointerCapture(event.pointerId)) {
      containerRef.value.releasePointerCapture(event.pointerId);
    }
    if (dragDistance > 8) suppressClickUntil = performance.now() + 250;
    pointerId = null;
    isDragging.value = false;
    startAnimation();
  };

  const onClick = (event: MouseEvent): void => {
    if (performance.now() < suppressClickUntil) event.preventDefault();
  };

  onMounted(() => {
    offsetX = -getMetrics(window.innerWidth).tileWidth * 0.42;
    offsetY = -getMetrics(window.innerWidth).tileHeight * 0.35;
    resizeObserver = new ResizeObserver(resize);
    if (containerRef.value) resizeObserver.observe(containerRef.value);
    resize();
  });

  onBeforeUnmount(() => {
    stopAnimation();
    resizeObserver?.disconnect();
    resizeObserver = null;
  });

  return {
    containerRef,
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
