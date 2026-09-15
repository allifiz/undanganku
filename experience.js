(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  document.documentElement.classList.add('experience-ready');

  /* -------------------------------------------------------
   * Personalized cover
   * ----------------------------------------------------- */
  const params = new URLSearchParams(window.location.search);
  const rawGuest = params.get('to') || params.get('guest') || '';
  const guestName = rawGuest.trim().slice(0, 72) || 'Tamu Undangan';
  const skipCover = params.get('open') === '1';

  const cover = document.createElement('section');
  cover.className = 'invitation-cover';
  cover.setAttribute('aria-label', 'Sampul undangan pernikahan');
  cover.innerHTML = `
    <div class="cover-orbit" aria-hidden="true">
      <span class="cover-orbit-dot"></span>
      <span class="cover-orbit-dot"></span>
      <span class="cover-orbit-dot"></span>
    </div>
    <div class="cover-flash" aria-hidden="true"></div>
    <div class="cover-inner">
      <p class="cover-kicker">The Wedding Of</p>
      <h1 class="cover-names"><span>Alief</span><em>&</em><span>Naya</span></h1>
      <p class="cover-date">12 · 12 · 2026</p>
      <div class="cover-guest">
        <span class="cover-guest-label">Kepada Yth.</span>
        <strong class="cover-guest-name"></strong>
      </div>
      <button class="cover-seal-button" type="button" aria-label="Buka undangan">
        <span class="cover-seal-core">A/N</span>
      </button>
      <span class="cover-open-copy">Open Invitation</span>
      <p class="cover-hint">A small story is waiting inside</p>
    </div>
  `;

  const guestNameEl = $('.cover-guest-name', cover);
  if (guestNameEl) guestNameEl.textContent = guestName;

  const progress = document.createElement('div');
  progress.className = 'story-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';

  const memoryHud = document.createElement('div');
  memoryHud.className = 'memory-hud';
  memoryHud.setAttribute('aria-hidden', 'true');
  memoryHud.innerHTML = `
    <span class="memory-hud-label">Little lights</span>
    <span class="memory-hud-dots"><i></i><i></i><i></i></span>
  `;

  const toast = document.createElement('div');
  toast.className = 'memory-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  document.body.prepend(cover);
  document.body.append(progress, memoryHud, toast);

  if (!skipCover) {
    document.body.classList.add('invite-locked');
  } else {
    cover.remove();
    document.body.classList.add('experience-open');
  }

  document.documentElement.classList.remove('experience-loading');

  const openButton = $('.cover-seal-button', cover);
  let opening = false;

  function createTapSpark(x, y) {
    if (reducedMotion) return;
    if ($$('.tap-spark').length > 8) return;
    const spark = document.createElement('span');
    spark.className = 'tap-spark';
    spark.style.setProperty('--sx', `${x}px`);
    spark.style.setProperty('--sy', `${y}px`);
    document.body.appendChild(spark);
    window.setTimeout(() => spark.remove(), 760);
  }

  async function openInvitation() {
    if (opening || skipCover) return;
    opening = true;
    cover.classList.add('is-opening');
    try { navigator.vibrate?.(12); } catch (_) { /* optional haptic */ }

    const buttonRect = openButton?.getBoundingClientRect();
    if (buttonRect) {
      const cx = buttonRect.left + buttonRect.width / 2;
      const cy = buttonRect.top + buttonRect.height / 2;
      createTapSpark(cx - 22, cy - 6);
      createTapSpark(cx + 18, cy + 12);
      createTapSpark(cx + 2, cy - 24);
    }

    await wait(reducedMotion ? 80 : 620);
    document.body.classList.remove('invite-locked');
    document.body.classList.add('experience-open');
    cover.classList.add('is-gone');
    window.scrollTo({ top: 0, behavior: 'auto' });

    const audio = document.getElementById('backgroundMusic');
    if (audio?.getAttribute('src')) {
      audio.volume = 0;
      audio.play().then(() => {
        let volume = 0;
        const fade = window.setInterval(() => {
          volume = Math.min(.72, volume + .06);
          audio.volume = volume;
          if (volume >= .72) window.clearInterval(fade);
        }, 70);
      }).catch(() => { /* browser or missing media source */ });
    }

    window.dispatchEvent(new CustomEvent('invitation:opened'));
    await wait(reducedMotion ? 80 : 650);
    cover.remove();
  }

  openButton?.addEventListener('click', openInvitation);

  if (finePointer && openButton && !reducedMotion) {
    let sealRaf = 0;
    let sx = 0;
    let sy = 0;
    const renderSeal = () => {
      sealRaf = 0;
      openButton.style.setProperty('--seal-x', `${sx.toFixed(1)}px`);
      openButton.style.setProperty('--seal-y', `${sy.toFixed(1)}px`);
    };
    openButton.addEventListener('pointermove', (event) => {
      const rect = openButton.getBoundingClientRect();
      sx = ((event.clientX - rect.left) / rect.width - .5) * 9;
      sy = ((event.clientY - rect.top) / rect.height - .5) * 9;
      if (!sealRaf) sealRaf = requestAnimationFrame(renderSeal);
    }, { passive: true });
    openButton.addEventListener('pointerleave', () => {
      sx = 0;
      sy = 0;
      if (!sealRaf) sealRaf = requestAnimationFrame(renderSeal);
    });
  }

  cover.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    createTapSpark(event.clientX, event.clientY);
  }, { passive: true });

  /* -------------------------------------------------------
   * Scroll progress. One transform write per animation frame.
   * ----------------------------------------------------- */
  let progressRaf = 0;
  const paintProgress = () => {
    progressRaf = 0;
    const root = document.documentElement;
    const max = Math.max(1, root.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    progress.style.setProperty('--xp-scroll', ratio.toFixed(4));
  };
  window.addEventListener('scroll', () => {
    if (!progressRaf) progressRaf = requestAnimationFrame(paintProgress);
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (!progressRaf) progressRaf = requestAnimationFrame(paintProgress);
  }, { passive: true });
  paintProgress();

  /* -------------------------------------------------------
   * Three hidden memory lights. Tiny, optional, never blocks content.
   * ----------------------------------------------------- */
  const sparkTargets = [
    { selector: '#story', id: 'story' },
    { selector: '#dateScene', id: 'date' },
    { selector: '#gallery', id: 'gallery' },
  ];
  const found = new Set();

  try {
    const saved = JSON.parse(sessionStorage.getItem('undanganku:lights') || '[]');
    if (Array.isArray(saved)) saved.forEach((id) => found.add(id));
  } catch (_) { /* fresh session */ }

  function updateMemoryHud() {
    const dots = $$('.memory-hud-dots i', memoryHud);
    dots.forEach((dot, index) => dot.classList.toggle('on', index < found.size));
    if (found.size > 0) memoryHud.classList.add('visible');
    if (found.size === sparkTargets.length) {
      toast.textContent = 'You found our little constellation ✦';
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 2800);
    }
  }

  sparkTargets.forEach(({ selector, id }) => {
    const section = $(selector);
    if (!section) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `memory-spark${found.has(id) ? ' found' : ''}`;
    button.dataset.memory = id;
    button.setAttribute('aria-label', 'Cahaya tersembunyi');
    section.appendChild(button);

    button.addEventListener('click', () => {
      if (found.has(id)) return;
      found.add(id);
      button.classList.add('found');
      try { sessionStorage.setItem('undanganku:lights', JSON.stringify([...found])); } catch (_) { /* optional */ }
      try { navigator.vibrate?.(8); } catch (_) { /* optional */ }
      const rect = button.getBoundingClientRect();
      createTapSpark(rect.left + rect.width / 2, rect.top + rect.height / 2);
      updateMemoryHud();
    });
  });
  updateMemoryHud();

  /* -------------------------------------------------------
   * Playful spark feedback on empty dark-space taps.
   * ----------------------------------------------------- */
  document.addEventListener('pointerup', (event) => {
    if (!document.body.classList.contains('experience-open')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('button,a,input,textarea,label,.gallery-track,.envelope')) return;
    const darkScene = event.target.closest('.section.dark, .photo-story');
    if (!darkScene) return;
    createTapSpark(event.clientX, event.clientY);
  }, { passive: true });

  /* -------------------------------------------------------
   * Desktop drag-to-scroll for gallery, touch keeps native momentum.
   * ----------------------------------------------------- */
  const gallery = document.getElementById('galleryTrack');
  if (gallery && finePointer) {
    let dragging = false;
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;

    gallery.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') return;
      dragging = true;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = gallery.scrollLeft;
      gallery.setPointerCapture(event.pointerId);
      gallery.classList.add('xp-dragging');
    });

    gallery.addEventListener('pointermove', (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      gallery.scrollLeft = startScroll - (event.clientX - startX) * 1.1;
    });

    const releaseGallery = (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      gallery.classList.remove('xp-dragging');
      try { gallery.releasePointerCapture(event.pointerId); } catch (_) { /* already released */ }
    };
    gallery.addEventListener('pointerup', releaseGallery);
    gallery.addEventListener('pointercancel', releaseGallery);
  }

  /* -------------------------------------------------------
   * Small RSVP celebration. No confetti engine required.
   * ----------------------------------------------------- */
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.rsvp-option');
    if (!button) return;
    button.classList.remove('xp-celebrate');
    // Force only this tiny animation to restart on repeated choice.
    void button.offsetWidth;
    button.classList.add('xp-celebrate');
    window.setTimeout(() => button.classList.remove('xp-celebrate'), 820);
  });
})();
