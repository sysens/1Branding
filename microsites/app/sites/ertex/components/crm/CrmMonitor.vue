<template>
  <!-- A desktop monitor: the screen (slot), its chin, the neck and the foot. -->
  <div class="relative mx-auto max-w-[1210px] drop-shadow-[0_35px_60px_rgba(0,0,0,.45)]">
    <div
      class="relative grid grid-cols-[166px_1fr] overflow-hidden rounded-t-[20px] border-[7px] border-b-[3px] border-[#0a0c10] bg-[#0b101a] shadow-[0_0_0_1px_#344157,0_0_0_3px_#111722,0_-1px_1px_3px_rgba(161,183,227,.11),-40px_-45px_140px_-40px_rgba(33,94,237,.22)] before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-0 before:z-[1] before:h-[350px] before:bg-[radial-gradient(ellipse_at_0%_0%,rgba(93,136,223,.13),transparent_68%)] max-[1050px]:grid-cols-[136px_1fr] max-[760px]:grid-cols-1 max-[760px]:rounded-t-[14px] max-[760px]:border-[5px] max-[760px]:border-b-2"
    >
      <slot />
    </div>
    <div class="flex h-[18px] items-center justify-center rounded-b-[17px] border border-t-0 border-[#263143] bg-[linear-gradient(#101723,#080c13)] shadow-[0_12px_30px_#05080e] max-[760px]:h-[13px]">
      <span class="block h-[2px] w-[17px] rounded-[2px] bg-[#374459]" />
    </div>
    <div
      class="mx-auto h-[46px] w-[118px] bg-[linear-gradient(90deg,#0c111b,#242e3c_44%,#111925_75%,#080d16)] [clip-path:polygon(25%_0,75%_0,83%_100%,17%_100%)] max-[760px]:h-[31px]"
      aria-hidden="true"
    />
    <div
      class="mx-auto h-2 w-[244px] rounded-[55%_55%_4px_4px] bg-[linear-gradient(#354152,#111925)] shadow-[0_13px_25px_5px_rgba(0,0,0,.45)] max-[760px]:w-[175px]"
      aria-hidden="true"
    />
  </div>
</template>
