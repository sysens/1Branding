import type { Ref } from "vue";

/**
 * Drives a native <dialog> from a boolean: showModal() when it turns true,
 * close() when it turns false. Esc, the close button and a click on the
 * backdrop all set it back to false.
 */
export function useModal(open: Ref<boolean>, options: { lockScroll?: boolean } = {}) {
  const dialog = ref<HTMLDialogElement>();

  const lock = (value: boolean) => {
    if (options.lockScroll) document.body.classList.toggle("overflow-hidden", value);
  };

  watch(open, (value) => {
    const element = dialog.value;
    if (!element) return;
    if (value && !element.open) element.showModal();
    if (!value && element.open) element.close();
    lock(value);
  });

  function onClose() {
    open.value = false;
  }

  function onClick(event: MouseEvent) {
    const element = dialog.value;
    if (!element || event.target !== element) return;
    const box = element.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) element.close();
  }

  onBeforeUnmount(() => lock(false));

  return { dialog, onClose, onClick, close: () => dialog.value?.close() };
}
