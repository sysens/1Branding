<script setup lang="ts">
// /showcase was the page of how OneBranding builds brands: it is the Branding &
// rebranding service page (pages/services/[slug].vue on the showcase template),
// so the old address goes there for good.
import { toSiteLocale } from "~/utils/locales";
import { servicePath } from "~/utils/servicePages";

const { locale } = useI18n();
await navigateTo(servicePath("branding", toSiteLocale(locale.value)), { redirectCode: 301, replace: true });
</script>

<template>
  <div />
</template>
