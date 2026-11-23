<script setup lang="ts">
import { useCrm } from "../../composables/useCrm";
import CrmCaption from "./CrmCaption.vue";
import CrmChart from "./CrmChart.vue";
import CrmDealDialog from "./CrmDealDialog.vue";
import CrmDealsTable from "./CrmDealsTable.vue";
import CrmIntro from "./CrmIntro.vue";
import CrmMetrics from "./CrmMetrics.vue";
import CrmMonitor from "./CrmMonitor.vue";
import CrmPipeline from "./CrmPipeline.vue";
import CrmSidebar from "./CrmSidebar.vue";
import CrmTopbar from "./CrmTopbar.vue";

// A working mock-up of a sales CRM for fabric samples and orders.
const crm = reactive(useCrm());

const dialogOpen = ref(false);
function openDeal(id: string) {
  crm.selectedId = id;
  dialogOpen.value = true;
}
</script>

<template>
  <section
    id="crm"
    class="ertex-crm relative isolate overflow-hidden bg-[#080c14] pb-[84px] pt-[118px] font-ertex-ui text-[#edf3ff] before:pointer-events-none before:absolute before:-left-[8%] before:top-[5%] before:-z-[1] before:h-[850px] before:w-[80%] before:bg-[radial-gradient(ellipse_at_25%_40%,rgba(23,87,216,.2),transparent_65%)] max-[760px]:pb-[55px] max-[760px]:pt-[76px]"
    aria-labelledby="er-crm-heading"
  >
    <div class="mx-auto w-[min(1320px,calc(100%_-_96px))] max-[1050px]:w-[calc(100%_-_48px)] max-[760px]:w-[calc(100%_-_32px)] max-[460px]:w-[calc(100%_-_20px)]">
      <CrmIntro />

      <CrmMonitor>
        <CrmSidebar :view="crm.view" :counts="crm.counts" @select="crm.selectView" />

        <div
          class="min-w-0 bg-[linear-gradient(130deg,rgba(24,35,55,.25),transparent_47%)] px-[30px] pb-[26px] pt-7 min-[1500px]:px-9 min-[1500px]:pb-[30px] min-[1500px]:pt-[34px] max-[1050px]:px-5 max-[1050px]:py-6 max-[760px]:px-[18px] max-[760px]:py-[22px] max-[460px]:px-3 max-[460px]:py-[21px]"
        >
          <CrmTopbar v-model:days="crm.days" :title="crm.title" :range="crm.rangeLabel" />

          <CrmMetrics
            :total="crm.total"
            :active-deals="crm.inPeriod.length"
            :volume="crm.volumeInWork"
            :samples="crm.counts.samples"
          />

          <div class="mb-[22px] mt-[26px] grid grid-cols-[1.65fr_1fr] gap-[22px] max-[1050px]:grid-cols-[1.8fr_1fr] max-[1050px]:gap-[14px] max-[760px]:grid-cols-1 max-[760px]:gap-[23px]">
            <CrmPipeline :counts="crm.counts" :active="crm.stage" @toggle="crm.toggleStage" @reset="crm.resetFilters" />
            <CrmChart :bins="crm.chart" :label="crm.chartLabel" />
          </div>

          <CrmDealsTable :deals="crm.visible" @open="openDeal" />
        </div>
      </CrmMonitor>

      <CrmCaption />
    </div>

    <CrmDealDialog v-model:open="dialogOpen" :deal="crm.selected" @advance="crm.advanceSelected" />
  </section>
</template>
