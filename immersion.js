(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const gallery = $('#galleryTrack');
  const cards = gallery ? $$('.gallery-card', gallery) : [];
  const photoStory = $('.photo-story');
  if (!cards.length && !photoStory) return;

  document.body.classList.add('immersion-ready');

  const memoryLines = [
    'Some moments are quiet enough that only the photograph remembers them.',
    'Nothing spectacular happened here. That is exactly why we kept it.',
    'A tiny promise hiding inside an ordinary afternoon.',
    'We kept looking at the same horizon and somehow saw the same future.',
  ];

  /* ---------------------------------------------------------
   * Enhance the existing full-photo interlude.
   * ------------------------------------------------------ */
  if (photoStory) {
    let depthCopy = $('.photo-story-depth-copy', photoStory);
    if (!depthCopy) {
      depthCopy = document.createElement('div');
      depthCopy.className = 'photo-story-depth-copy';
      depthCopy.textContent = 'A photograph freezes a second. Somehow, this one kept moving with us.';
      photoStory.appendChild(depthCopy);
    }

    const syncDepth = () => {
      photoStory.classList.toggle('photo-story-depth', photoStory.classList.contains('photo-secret-open'));
    };

    new MutationObserver(syncDepth).observe(photoStory, {
      attributes: true,
      attributeFilter: ['class'],
    });
    syncDepth();
  }

  if (!cards.length) return;

  /* ---------------------------------------------------------
   * Tactile card affordances + long press memories.
   * ------------------------------------------------------ */
  cards.forEach((card, index) => {
    if (!$('.gallery-touch-hint', card)) {
      const hint = document.createElement('span');
      hint.className = 'gallery-touch-hint';
      hint.textContent = '↗';
      hint.setAttribute('aria-hidden', 'true');
      card.appendChild(hint);
    }

    if (!$('.memory-peek-note', card)) {
      const note = document.createElement('div');
      note.className = 'memory-peek-note';
      note.textContent = memoryLines[index] || 'A little memory we decided to keep.';
      card.appendChild(note);
    }

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Buka foto ${index + 1} dalam mode layar penuh`);
  });

  let longPressTimer = 0;
  let longPressCard = null;
  let longPressStartX = 0;
  let longPressStartY = 0;
  let suppressNextClick = false;

  const clearLongPress = () => {
    window.clearTimeout(longPressTimer);
    longPressTimer = 0;
    longPressCard = null;
  };

  cards.forEach((card) => {
    card.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      clearLongPress();
      longPressCard = card;
      longPressStartX = event.clientX;
      longPressStartY = event.clientY;
      longPressTimer = window.setTimeout(() => {
        suppressNextClick = true;
        card.classList.add('memory-peek');
        try { navigator.vibrate?.(9); } catch (_) { /* optional */ }
        window.setTimeout(() => card.classList.remove('memory-peek'), 2100);
        clearLongPress();
      }, 540);
    }, { passive: true });

    card.addEventListener('pointermove', (event) => {
      if (!longPressTimer) return;
      if (Math.hypot(event.clientX - longPressStartX, event.clientY - longPressStartY) > 12) clearLongPress();
    }, { passive: true });

    card.addEventListener('pointerup', clearLongPress, { passive: true });
    card.addEventListener('pointercancel', clearLongPress, { passive: true });
    card.addEventListener('pointerleave', clearLongPress, { passive: true });
  });

  /* ---------------------------------------------------------
   * Build viewer once.
   * ------------------------------------------------------ */
  const viewer = document.createElement('div');
  viewer.className = 'immersion-viewer';
  viewer.setAttribute('aria-hidden', 'true');
  viewer.innerHTML = `
    <div class="viewer-topbar">
      <span class="viewer-kicker">Captured moments · swipe to explore</span>
      <div class="viewer-actions">
        <button class="viewer-icon-button viewer-motion" type="button" aria-label="Aktifkan motion depth" aria-pressed="false">◌</button>
        <button class="viewer-icon-button viewer-close" type="button" aria-label="Tutup galeri">×</button>
      </div>
    </div>
    <div class="viewer-stage">
      <div class="viewer-ambient" aria-hidden="true"></div>
      <div class="viewer-media">
        <div class="viewer-image-wrap">
          <img class="viewer-image" alt="" draggable="false" />
        </div>
      </div>
      <button class="viewer-hit viewer-prev-hit" type="button" aria-label="Foto sebelumnya"></button>
      <button class="viewer-hit viewer-next-hit" type="button" aria-label="Foto berikutnya"></button>
      <span class="viewer-arrow prev" aria-hidden="true">‹</span>
      <span class="viewer-arrow next" aria-hidden="true">›</span>
    </div>
    <div class="viewer-footer">
      <div>
        <p class="viewer-caption"></p>
        <p class="viewer-memory"></p>
      </div>
      <span class="viewer-counter"></span>
    </div>
    <span class="viewer-gesture-hint">Swipe sideways · pull down to close · hold for memory</span>
  `;
  document.body.appendChild(viewer);

  const stage = $('.viewer-stage', viewer);
  const media = $('.viewer-media', viewer);
  const image = $('.viewer-image', viewer);
  const caption = $('.viewer-caption', viewer);
  const memory = $('.viewer-memory', viewer);
  const counter = $('.viewer-counter', viewer);
  const closeButton = $('.viewer-close', viewer);
  const motionButton = $('.viewer-motion', viewer);
  const prevButton = $('.viewer-prev-hit', viewer);
  const nextButton = $('.viewer-next-hit', viewer);

  let currentIndex = 0;
  let isOpen = false;
  let switching = false;
  let sourceCard = null;

  const itemFor = (index) => {
    const card = cards[index];
    const img = $('img', card);
    const figcaption = $('figcaption', card);
    return {
      card,
      img,
      src: img?.currentSrc || img?.src || '',
      alt: img?.alt || 'Wedding memory',
      caption: figcaption?.textContent?.trim() || 'A memory',
      memory: memoryLines[index] || 'A little memory we decided to keep.',
    };
  };

  const preloadAdjacent = (index) => {
    [-1, 1].forEach((offset) => {
      const item = itemFor((index + offset + cards.length) % cards.length);
      if (!item.src) return;
      const preload = new Image();
      preload.decoding = 'async';
      preload.src = item.src;
    });
  };

  const updateMeta = (index) => {
    const item = itemFor(index);
    caption.textContent = item.caption;
    memory.textContent = item.memory;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    image.alt = item.alt;
  };

  const resetGestureTransform = () => {
    viewer.style.setProperty('--viewer-x', '0px');
    viewer.style.setProperty('--viewer-y', '0px');
    viewer.style.setProperty('--viewer-rot', '0deg');
    viewer.style.setProperty('--viewer-scale', '1');
    viewer.classList.remove('dragging');
  };

  const animateFlightIn = async (item) => {
    if (reducedMotion || !item.img) return;
    const sourceRect = item.img.getBoundingClientRect();
    if (sourceRect.width < 4 || sourceRect.height < 4) return;

    image.style.opacity = '0';
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const targetRect = image.getBoundingClientRect();
    if (targetRect.width < 4 || targetRect.height < 4) {
      image.style.opacity = '';
      return;
    }

    const flight = document.createElement('img');
    flight.className = 'immersion-flight';
    flight.src = item.src;
    flight.alt = '';
    flight.style.left = `${targetRect.left}px`;
    flight.style.top = `${targetRect.top}px`;
    flight.style.width = `${targetRect.width}px`;
    flight.style.height = `${targetRect.height}px`;
    flight.style.objectFit = 'contain';
    document.body.appendChild(flight);

    const dx = sourceRect.left - targetRect.left;
    const dy = sourceRect.top - targetRect.top;
    const sx = sourceRect.width / targetRect.width;
    const sy = sourceRect.height / targetRect.height;

    const animation = flight.animate([
      {
        transformOrigin: 'top left',
        transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`,
        borderRadius: '0px',
        filter: 'brightness(.92)',
      },
      {
        transformOrigin: 'top left',
        transform: 'translate3d(0,0,0) scale(1,1)',
        borderRadius: '0px',
        filter: 'brightness(1)',
      },
    ], {
      duration: 720,
      easing: 'cubic-bezier(.16,1,.3,1)',
      fill: 'forwards',
    });

    try { await animation.finished; } catch (_) { /* interrupted */ }
    flight.remove();
    image.style.opacity = '';
  };

  const openViewer = async (index, card) => {
    if (isOpen) return;
    isOpen = true;
    currentIndex = index;
    sourceCard = card;
    const item = itemFor(index);

    updateMeta(index);
    image.src = item.src;
    viewer.classList.remove('memory-visible');
    document.body.classList.add('immersive-open');
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden', 'false');
    resetGestureTransform();

    try {
      if (image.decode) await image.decode();
    } catch (_) { /* cached or cross-origin decode can reject harmlessly */ }

    animateFlightIn(item);
    preloadAdjacent(index);
    closeButton.focus({ preventScroll: true });
    try { navigator.vibrate?.(5); } catch (_) { /* optional */ }
  };

  const closeViewer = async () => {
    if (!isOpen) return;
    isOpen = false;
    resetGestureTransform();
    viewer.classList.remove('memory-visible');

    const item = itemFor(currentIndex);
    const target = item.card === sourceCard ? item.img : item.img;
    const targetRect = target?.getBoundingClientRect();
    const viewerRect = image.getBoundingClientRect();
    const canReturn = !reducedMotion && targetRect && viewerRect && targetRect.bottom > 0 && targetRect.top < window.innerHeight;

    if (canReturn) {
      image.style.opacity = '0';
      const flight = document.createElement('img');
      flight.className = 'immersion-flight';
      flight.src = item.src;
      flight.alt = '';
      flight.style.left = `${viewerRect.left}px`;
      flight.style.top = `${viewerRect.top}px`;
      flight.style.width = `${viewerRect.width}px`;
      flight.style.height = `${viewerRect.height}px`;
      flight.style.objectFit = 'contain';
      document.body.appendChild(flight);

      const dx = targetRect.left - viewerRect.left;
      const dy = targetRect.top - viewerRect.top;
      const sx = targetRect.width / viewerRect.width;
      const sy = targetRect.height / viewerRect.height;
      const animation = flight.animate([
        { transformOrigin: 'top left', transform: 'translate3d(0,0,0) scale(1,1)', opacity: 1 },
        { transformOrigin: 'top left', transform: `translate3d(${dx}px,${dy}px,0) scale(${sx},${sy})`, opacity: .82 },
      ], {
        duration: 520,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'forwards',
      });
      viewer.classList.remove('open');
      try { await animation.finished; } catch (_) { /* interrupted */ }
      flight.remove();
      image.style.opacity = '';
    } else {
      viewer.classList.remove('open');
    }

    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('immersive-open');
    sourceCard?.focus?.({ preventScroll: true });
    sourceCard = null;
  };

  const showIndex = (nextIndex, direction = 1) => {
    if (!isOpen || switching) return;
    switching = true;
    const normalized = (nextIndex + cards.length) % cards.length;
    const item = itemFor(normalized);
    viewer.classList.remove('memory-visible');

    media.animate([
      { transform: `translate3d(0,0,0) scale(1)` , opacity: 1 },
      { transform: `translate3d(${direction * -34}px,0,0) scale(.985)`, opacity: .18 },
    ], {
      duration: reducedMotion ? 1 : 190,
      easing: 'ease',
      fill: 'forwards',
    }).finished.catch(() => {}).then(async () => {
      currentIndex = normalized;
      updateMeta(currentIndex);
      image.classList.add('switching');
      image.src = item.src;
      try { if (image.decode) await image.decode(); } catch (_) { /* harmless */ }
      image.classList.remove('switching');
      resetGestureTransform();
      media.animate([
        { transform: `translate3d(${direction * 30}px,0,0) scale(.985)`, opacity: .18 },
        { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
      ], {
        duration: reducedMotion ? 1 : 360,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'forwards',
      });
      preloadAdjacent(currentIndex);
      switching = false;
      try { navigator.vibrate?.(4); } catch (_) { /* optional */ }
    });
  };

  /* Capture gallery clicks so the older card click behavior cannot compete. */
  gallery.addEventListener('click', (event) => {
    const card = event.target.closest('.gallery-card');
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    const index = cards.indexOf(card);
    if (index >= 0) openViewer(index, card);
  }, true);

  gallery.addEventListener('keydown', (event) => {
    const card = event.target.closest('.gallery-card');
    if (!card || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    const index = cards.indexOf(card);
    if (index >= 0) openViewer(index, card);
  });

  closeButton.addEventListener('click', closeViewer);
  prevButton.addEventListener('click', () => showIndex(currentIndex - 1, -1));
  nextButton.addEventListener('click', () => showIndex(currentIndex + 1, 1));

  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) closeViewer();
  });

  window.addEventListener('keydown', (event) => {
    if (!isOpen) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowLeft') showIndex(currentIndex - 1, -1);
    if (event.key === 'ArrowRight') showIndex(currentIndex + 1, 1);
    if (event.key.toLowerCase() === 'm') viewer.classList.toggle('memory-visible');
  });

  /* ---------------------------------------------------------
   * Swipe, pull-down close, and hold-for-memory.
   * ------------------------------------------------------ */
  let gesturePointer = null;
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dy = 0;
  let holdTimer = 0;
  let held = false;

  const cancelHold = () => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  };

  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    gesturePointer = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dx = 0;
    dy = 0;
    held = false;
    viewer.classList.add('dragging');
    try { stage.setPointerCapture(event.pointerId); } catch (_) { /* optional */ }

    cancelHold();
    holdTimer = window.setTimeout(() => {
      if (Math.hypot(dx, dy) > 10) return;
      held = true;
      viewer.classList.toggle('memory-visible');
      try { navigator.vibrate?.(10); } catch (_) { /* optional */ }
    }, 560);
  });

  stage.addEventListener('pointermove', (event) => {
    if (gesturePointer !== event.pointerId) return;
    dx = event.clientX - startX;
    dy = event.clientY - startY;
    if (Math.hypot(dx, dy) > 10) cancelHold();

    const verticalIntent = Math.abs(dy) > Math.abs(dx) * .72 && dy > 0;
    const x = verticalIntent ? dx * .18 : dx * .72;
    const y = verticalIntent ? dy * .72 : dy * .12;
    const rotation = Math.max(-4, Math.min(4, dx / 85));
    const scale = verticalIntent ? Math.max(.9, 1 - dy / 1200) : Math.max(.94, 1 - Math.abs(dx) / 1700);

    viewer.style.setProperty('--viewer-x', `${x.toFixed(1)}px`);
    viewer.style.setProperty('--viewer-y', `${y.toFixed(1)}px`);
    viewer.style.setProperty('--viewer-rot', `${rotation.toFixed(2)}deg`);
    viewer.style.setProperty('--viewer-scale', scale.toFixed(3));
  }, { passive: true });

  const finishGesture = (event) => {
    if (gesturePointer !== event.pointerId) return;
    cancelHold();
    gesturePointer = null;
    viewer.classList.remove('dragging');

    if (!held && dy > 92 && Math.abs(dy) > Math.abs(dx) * .78) {
      closeViewer();
      return;
    }
    if (!held && Math.abs(dx) > 68 && Math.abs(dx) > Math.abs(dy) * .82) {
      showIndex(currentIndex + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
      return;
    }
    resetGestureTransform();
  };

  stage.addEventListener('pointerup', finishGesture);
  stage.addEventListener('pointercancel', finishGesture);

  /* ---------------------------------------------------------
   * Optional device orientation depth. Permission is requested only
   * from the explicit user gesture on the motion button.
   * ------------------------------------------------------ */
  let motionEnabled = false;
  let orientationRaf = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;

  const paintOrientation = () => {
    orientationRaf = 0;
    if (!isOpen || !motionEnabled) return;
    viewer.style.setProperty('--tilt-x', `${targetTiltX.toFixed(2)}deg`);
    viewer.style.setProperty('--tilt-y', `${targetTiltY.toFixed(2)}deg`);
  };

  const onOrientation = (event) => {
    const beta = Math.max(-12, Math.min(12, Number(event.beta) || 0));
    const gamma = Math.max(-12, Math.min(12, Number(event.gamma) || 0));
    targetTiltX = beta * -.065;
    targetTiltY = gamma * .075;
    if (!orientationRaf) orientationRaf = requestAnimationFrame(paintOrientation);
  };

  const setMotion = (enabled) => {
    motionEnabled = enabled;
    motionButton.setAttribute('aria-pressed', String(enabled));
    motionButton.setAttribute('aria-label', enabled ? 'Matikan motion depth' : 'Aktifkan motion depth');
    if (enabled) window.addEventListener('deviceorientation', onOrientation, { passive: true });
    else {
      window.removeEventListener('deviceorientation', onOrientation);
      viewer.style.setProperty('--tilt-x', '0deg');
      viewer.style.setProperty('--tilt-y', '0deg');
    }
  };

  if (!('DeviceOrientationEvent' in window) || reducedMotion) {
    motionButton.hidden = true;
  } else {
    motionButton.addEventListener('click', async () => {
      if (motionEnabled) {
        setMotion(false);
        return;
      }

      const Orientation = window.DeviceOrientationEvent;
      try {
        if (typeof Orientation.requestPermission === 'function') {
          const permission = await Orientation.requestPermission();
          if (permission !== 'granted') return;
        }
        setMotion(true);
        try { navigator.vibrate?.(5); } catch (_) { /* optional */ }
      } catch (_) {
        setMotion(false);
      }
    });
  }
})();
