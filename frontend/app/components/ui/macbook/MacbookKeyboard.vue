<script setup lang="ts">
import MacbookKeypad from "./MacbookKeypad.vue";

withDefaults(defineProps<{ showGradient?: boolean }>(), { showGradient: false });
</script>

<template>
  <div class="macbook-base" aria-hidden="true">
    <div class="macbook-hinge"><div /></div>
    <div class="macbook-keyboard-area">
      <div class="macbook-speaker" />
      <div class="macbook-keyboard"><MacbookKeypad /></div>
      <div class="macbook-speaker" />
    </div>
    <div class="macbook-trackpad" />
    <div class="macbook-notch" />
    <div v-if="showGradient" class="macbook-base__fade" />
    <div v-if="$slots.badge" class="macbook-badge"><slot name="badge" /></div>
  </div>
</template>

<style scoped>
.macbook-base {
  position: relative;
  z-index: -10;
  width: 32rem;
  height: 22rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #e5e7eb;
}
.macbook-hinge {
  position: relative;
  width: 100%;
  height: 2.5rem;
}
.macbook-hinge > div { position: absolute; inset-inline: 0; width: 80%; height: 1rem; margin-inline: auto; background: #050505; }
.macbook-keyboard-area { position: relative; display: flex; }
.macbook-speaker {
  width: 10%;
  height: 10rem;
  margin: 0.5rem auto 0;
  padding-inline: 0.5px;
  overflow: hidden;
  flex-shrink: 0;
  background-image: radial-gradient(circle, #08080a 0.5px, transparent 0.5px);
  background-size: 3px 3px;
}
.macbook-keyboard { width: 80%; height: 100%; margin-inline: auto; }
.macbook-trackpad {
  width: 40%;
  height: 8rem;
  margin: 0.25rem auto;
  border-radius: 0.75rem;
  box-shadow: 0 0 1px 1px #00000020 inset;
}
.macbook-notch {
  position: absolute;
  inset: auto 0 0;
  width: 5rem;
  height: 0.5rem;
  margin-inline: auto;
  border-radius: 1.5rem 1.5rem 0 0;
  background: linear-gradient(to top, #272729, #050505);
}
.macbook-badge { position: absolute; bottom: 1rem; left: 1rem; }
.macbook-base__fade { position: absolute; inset: auto 0 0; z-index: 50; height: 10rem; background: linear-gradient(to top, white, white, transparent); pointer-events: none; }
</style>
