import { nextTick, onBeforeUnmount, onMounted, type Ref } from "vue";

type GsapContext = {
  revert: () => void;
};

type CinematicRevealMotionRefs = {
  copyRef: Ref<HTMLElement | null>;
  logosRef: Ref<HTMLElement | null>;
  numberRef: Ref<HTMLElement | null>;
  rootRef: Ref<HTMLElement | null>;
  windowRef: Ref<HTMLElement | null>;
};

export const useCinematicRevealMotion = ({
  copyRef,
  logosRef,
  numberRef,
  rootRef,
  windowRef,
}: CinematicRevealMotionRefs) => {
  let context: GsapContext | null = null;

  onMounted(async () => {
    await nextTick();

    const root = rootRef.value;
    const revealWindow = windowRef.value;
    const number = numberRef.value;
    const targets = [logosRef.value, copyRef.value].filter(
      (element): element is HTMLElement => element !== null
    );

    if (!root || !revealWindow || !number) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);

    gsap.registerPlugin(ScrollTrigger);

    context = gsap.context(() => {
      gsap.fromTo(
        number,
        { y: "11vh", scale: 0.84, opacity: 0.18 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: revealWindow,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 1,
          },
        }
      );

      if (targets.length) {
        gsap.fromTo(
          targets,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: revealWindow,
              start: "top 78%",
              end: "bottom bottom",
              scrub: 1,
            },
          }
        );
      }

      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, root);
  });

  onBeforeUnmount(() => {
    context?.revert();
    context = null;
  });
};
