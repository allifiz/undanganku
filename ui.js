(() => {
  'use strict';

  let active = null;
  const focusable = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex="0"]';

  // Each overlay is a direct child of body. Preserve previous inert states,
  // including hidden overlays, instead of making every sibling interactive.
  function openDialog(dialog, initialFocus) {
    if (active?.dialog === dialog) return;
    if (active) closeDialog(active.dialog);
    const previousFocus = document.activeElement;
    const siblings = [...document.body.children]
      .filter((element) => element !== dialog)
      .map((element) => ({ element, inert: element.inert }));
    siblings.forEach(({ element }) => { element.inert = true; });
    dialog.inert = false;
    active = { dialog, previousFocus, siblings };
    // Wait for the opening class/visibility to be applied by the caller.
    requestAnimationFrame(() => {
      if (active?.dialog === dialog) initialFocus?.focus({ preventScroll: true });
    });
  }

  function closeDialog(dialog, returnFocus) {
    if (active?.dialog !== dialog) return;
    const { previousFocus, siblings } = active;
    active = null;
    dialog.inert = true;
    siblings.forEach(({ element, inert }) => { element.inert = inert; });
    const target = returnFocus || previousFocus;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || !active) return;
    const controls = [...active.dialog.querySelectorAll(focusable)]
      .filter((element) => !element.closest('[inert]') && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    if (!controls.length) { event.preventDefault(); return; }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !active.dialog.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !active.dialog.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  });

  window.InvitationUI = {
    openDialog,
    closeDialog,
    load(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    save(key, value) {
      try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
    },
  };
})();
