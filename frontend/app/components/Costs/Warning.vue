<template>
  <div class="bg-black">
    <div class="lastComp containerr">
      <div class="flex gap-[16px] pb-[30px]">
        <div><img src="/Costs/carbon_warning (1).png" alt="" /></div>
        <div>
          <h1
            class="text-[#808080]  font-normal text-[24px] leading-[25px] tracking-normal align-middle"
          >
            {{ $t("warning.title") }}
          </h1>
        </div>
      </div>
      <p
        class="text-[#FFFFFF]  font-normal text-[16px] leading-[120%] tracking-normal"
      >
        {{ $t("warning.text") }}
      </p>
    </div>
  </div>
</template>
