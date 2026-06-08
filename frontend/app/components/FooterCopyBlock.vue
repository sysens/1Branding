<script setup lang="ts">
type FooterCopy = {
  headingLead: string;
  headingAccent: string;
  description: string;
  support: string;
  contactLabel: string;
};

type FooterLinks = {
  telegram: string;
  instagram: string;
  behance: string;
  contactTo: string;
};

defineProps<{
  copy: FooterCopy;
  links: FooterLinks;
}>();

const footerIcons = {
  telegram: "/footer/Vector(7).png",
  instagram: "/footer/Vector(8).png",
  behance: "/footer/Vector(9).png",
};
</script>

<template>
  <div class="footer-copy">
    <h3>
      {{ copy.headingLead }}
      <span>{{ copy.headingAccent }}</span>
    </h3>

    <p class="footer-copy__description">
      {{ copy.description }}
    </p>

    <p class="footer-copy__support">
      {{ copy.support }}
    </p>

    <div class="footer-copy__actions" aria-label="Social links">
      <a
        :href="links.telegram"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
      >
        <img :src="footerIcons.telegram" alt="" />
      </a>

      <a
        :href="links.instagram"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <img :src="footerIcons.instagram" alt="" />
      </a>

      <a
        :href="links.behance"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Behance"
      >
        <img :src="footerIcons.behance" alt="" />
      </a>

      <NuxtLink class="footer-copy__contact" :to="links.contactTo">
        {{ copy.contactLabel }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.footer-copy {
  align-self: center;
  max-width: 36rem;
  padding-bottom: clamp(2rem, 5vw, 5rem);
}

.footer-copy h3 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(2.05rem, 3.8vw, 3.4rem);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: 0;
}

.footer-copy h3 span {
  color: #03cb00;
}

.footer-copy__description {
  max-width: 34rem;
  margin: clamp(0.7rem, 1.2vw, 1rem) 0 0;
  color: #ffffff;
  font-size: clamp(1rem, 1.15vw, 1.2rem);
  font-weight: 500;
  line-height: 1.45;
}

.footer-copy__support {
  max-width: 30rem;
  margin: clamp(1.8rem, 3vw, 2.8rem) 0 0;
  color: #03cb00;
  font-size: clamp(1rem, 1.25vw, 1.25rem);
  font-weight: 500;
  line-height: 1.38;
}

.footer-copy__actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-top: clamp(1.2rem, 2vw, 1.8rem);
}

.footer-copy__actions a {
  display: inline-grid;
  min-width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.45rem;
  background: #45dd33;
  color: #000000;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.footer-copy__actions a:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 1.5rem rgba(3, 203, 0, 0.42);
}

.footer-copy__actions img {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
}

.footer-copy__contact {
  min-width: 8.5rem;
  padding-inline: 1.5rem;
  font-size: 1.125rem;
  font-weight: 500;
  text-transform: lowercase;
}

@media (max-width: 900px) {
  .footer-copy {
    justify-self: center;
    max-width: 34rem;
    padding-bottom: 0;
    text-align: center;
  }

  .footer-copy__support,
  .footer-copy__description {
    margin-inline: auto;
  }

  .footer-copy__actions {
    justify-content: center;
  }
}
</style>
