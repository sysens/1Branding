<template>
  <!-- The whole proposal as one bounded sheet on a grey mat; edge to edge on
       phones. It is the size container: fluid sizes below are in cqi of it,
       and --gap is the page's side gutter. -->
  <div
    class="ertex-site mx-auto my-6 w-[min(1520px,calc(100%_-_48px))] rounded-xl border border-[#d5dce4] bg-white shadow-[0_10px_38px_rgb(12_31_52/9%)] [--gap:clamp(24px,5.2cqi,92px)] [container-type:inline-size] max-[900px]:my-3 max-[900px]:w-[calc(100%_-_24px)] max-[690px]:m-0 max-[690px]:w-full max-[690px]:rounded-none max-[690px]:border-0 max-[690px]:shadow-none max-[690px]:[--gap:21px]"
  >
    <a
      class="sr-only focus:not-sr-only focus:absolute focus:left-[18px] focus:top-[15px] focus:z-[12] focus:bg-white focus:px-[14px] focus:py-2 focus:text-ertex-ink"
      href="#idea"
    >К содержанию</a>
    <slot />
  </div>
</template>
