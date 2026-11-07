/**
 * Whether the quick-request modal (components/contacts/ContactModal.vue) is
 * open. Shared state, so any button can open it; the modal itself is mounted
 * once, on the contact page.
 */
export const useContactModal = () => {
  const isOpen = useState("contact-modal-open", () => false);
  return {
    isOpen,
    open: () => { isOpen.value = true; },
    close: () => { isOpen.value = false; },
  };
};
