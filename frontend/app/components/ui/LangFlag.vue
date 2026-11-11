<script setup lang="ts">
// A language's flag, drawn in code (Windows shows no flag emoji), 3:2 and
// filling its box: English by the Union Jack, Russian by Russia's tricolour.
// Any other code shows as its letters. Decorative: the language's name is
// always given next to it or in a label.
defineProps<{ code: string }>();
</script>

<template>
  <svg v-if="code === 'en'" class="lang-flag" viewBox="0 0 60 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="60" height="40" fill="#012169" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#c8102e" stroke-width="2.6" />
    <path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="12" />
    <path d="M30 0V40M0 20H60" stroke="#c8102e" stroke-width="7" />
  </svg>
  <svg v-else-if="code === 'ru'" class="lang-flag" viewBox="0 0 9 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect width="9" height="2" fill="#fff" />
    <rect y="2" width="9" height="2" fill="#0039a6" />
    <rect y="4" width="9" height="2" fill="#d52b1e" />
  </svg>
  <span v-else class="lang-flag lang-flag--code" aria-hidden="true">{{ code }}</span>
</template>

<style scoped>
.lang-flag {
  display: block;
  width: 100%;
  height: 100%;
}

.lang-flag--code {
  display: grid;
  place-items: center;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}
</style>
