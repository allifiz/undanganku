(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
   * Intro reveals
   * ----------------------------------------------------- */
  window.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      $$('.reveal-up').forEach((el, index) => {
        window.setTimeout(() => el.classList.add('visible'), reducedMotion ? 0 : 180 + index * 130);
      });
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
  );

  $$('.reveal-on-scroll').forEach((el) => revealObserver.observe(el));

  /* -------------------------------------------------------
   * Lightweight star field. DPR is capped deliberately.
   * ----------------------------------------------------- */
  const canvas = $('#starfield');
  const ctx = canvas?.getContext('2d', { alpha: true });
  let stars = [];
  let starAnimation = 0;
  let lastStarFrame = 0;

  function resizeStarfield() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = window.innerWidth < 700 ? 34 : 52;
    stars = Array.from({ length: count }, (_, index) => ({
      x: ((index * 83.13) % 100) / 100 * window.innerWidth,
      y: ((index * 47.71 + 13) % 100) / 100 * window.innerHeight,
      radius: 0.45 + ((index * 7) % 10) / 12,
      phase: (index * 0.71) % (Math.PI * 2),
      speed: 0.00045 + ((index % 5) * 0.00007),
    }));
    drawStars(performance.now());
  }

  function drawStars(time) {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stars.forEach((star) => {
      const pulse = reducedMotion ? 0.55 : 0.42 + Math.sin(time * star.speed + star.phase) * 0.2;
      ctx.beginPath();
      ctx.fillStyle = `rgba(231, 207, 161, ${Math.max(0.15, pulse)})`;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function starLoop(time) {
    if (time - lastStarFrame > 45) {
      drawStars(time);
      lastStarFrame = time;
    }
    starAnimation = requestAnimationFrame(starLoop);
  }

  function startStars() {
    cancelAnimationFrame(starAnimation);
    if (!reducedMotion && document.visibilityState === 'visible') {
      starAnimation = requestAnimationFrame(starLoop);
    } else {
      drawStars(performance.now());
    }
  }

  resizeStarfield();
  startStars();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeStarfield, 120);
  }, { passive: true });

  document.addEventListener('visibilitychange', startStars);

  /* -------------------------------------------------------
   * Menu
   * ----------------------------------------------------- */
  const menuButton = $('#menuButton');
  const menuClose = $('#menuClose');
  const menuOverlay = $('#menuOverlay');

  function setMenu(open) {
    if (!menuOverlay || !menuButton) return;
    menuOverlay.classList.toggle('open', open);
    menuOverlay.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }

  menuButton?.addEventListener('click', () => setMenu(true));
  menuClose?.addEventListener('click', () => setMenu(false));
  $$('.menu-inner a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenu(false);
      closeSecret();
    }
  });

  /* -------------------------------------------------------
   * Two paths interaction
   * ----------------------------------------------------- */
  const pathsStage = $('#pathsStage');
  const dotLeft = $('#dotLeft');
  const dotRight = $('#dotRight');
  const namesReveal = $('#namesReveal');
  const dragCopy = $('#dragCopy');
  let united = false;

  const dragState = new WeakMap();

  function makeDotDraggable(dot, direction) {
    if (!dot || !pathsStage) return;
    dragState.set(dot, { offset: 0, direction, pointer: null, startX: 0, startOffset: 0 });

    dot.addEventListener('pointerdown', (event) => {
      if (united) return;
      const state = dragState.get(dot);
      state.pointer = event.pointerId;
      state.startX = event.clientX;
      state.startOffset = state.offset;
      dot.setPointerCapture(event.pointerId);
    });

    dot.addEventListener('pointermove', (event) => {
      const state = dragState.get(dot);
      if (united || state.pointer !== event.pointerId) return;

      const stageWidth = pathsStage.clientWidth;
      const maxTravel = stageWidth * 0.39;
      const rawDelta = event.clientX - state.startX;
      const directionalDelta = direction === 'left' ? rawDelta : -rawDelta;
      state.offset = Math.max(0, Math.min(maxTravel, state.startOffset + directionalDelta));
      const signedOffset = direction === 'left' ? state.offset : -state.offset;
      dot.style.setProperty('--x', `${signedOffset}px`);
      checkMeeting();
    });

    const release = (event) => {
      const state = dragState.get(dot);
      if (state.pointer !== event.pointerId) return;
      state.pointer = null;
      try { dot.releasePointerCapture(event.pointerId); } catch (_) { /* pointer already released */ }
    };

    dot.addEventListener('pointerup', release);
    dot.addEventListener('pointercancel', release);
  }

  function checkMeeting() {
    if (united || !dotLeft || !dotRight || !pathsStage) return;
    const leftRect = dotLeft.getBoundingClientRect();
    const rightRect = dotRight.getBoundingClientRect();
    const leftCenter = leftRect.left + leftRect.width / 2;
    const rightCenter = rightRect.left + rightRect.width / 2;
    if (Math.abs(rightCenter - leftCenter) <= 105) unitePaths();
  }

  function unitePaths() {
    if (united || !pathsStage) return;
    united = true;
    pathsStage.classList.add('united');

    [dotLeft, dotRight].forEach((dot) => {
      if (!dot) return;
      dot.style.transition = 'left .7s cubic-bezier(.22,1,.36,1), right .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1), opacity .4s ease';
      dot.style.left = '50%';
      dot.style.right = 'auto';
      dot.style.setProperty('--x', '-50%');
      dot.style.opacity = '.35';
      dot.style.pointerEvents = 'none';
    });

    dragCopy && (dragCopy.textContent = 'Two paths. One story.');
    window.setTimeout(() => {
      namesReveal?.classList.add('show');
      namesReveal?.setAttribute('aria-hidden', 'false');
    }, reducedMotion ? 0 : 420);
  }

  makeDotDraggable(dotLeft, 'left');
  makeDotDraggable(dotRight, 'right');

  // Keyboard / tap fallback so the concept is not dependent on dragging ability.
  [dotLeft, dotRight].forEach((dot) => {
    dot?.addEventListener('click', () => {
      if (!united) unitePaths();
    });
  });

  /* -------------------------------------------------------
   * Timeline progress and subtle photo parallax.
   * One scroll listener, scheduled through rAF.
   * ----------------------------------------------------- */
  const timeline = $('.timeline');
  const photoStory = $('.photo-story');
  const storyBackdrop = $('.story-backdrop');
  let ticking = false;

  function updateScrollEffects() {
    ticking = false;

    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const viewport = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (viewport * 0.72 - rect.top) / (rect.height + viewport * 0.25)));
      timeline.style.setProperty('--timeline-progress', `${progress * 100}%`);
    }

    if (!reducedMotion && photoStory && storyBackdrop) {
      const rect = photoStory.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const translate = (progress - 0.5) * 28;
        storyBackdrop.style.transform = `translate3d(0, ${translate}px, 0) scale(1.055)`;
      }
    }
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollEffects);
  }, { passive: true });

  updateScrollEffects();

  /* -------------------------------------------------------
   * Envelope
   * ----------------------------------------------------- */
  const envelope = $('#envelope');
  let envelopePointerStart = null;

  function openEnvelope() {
    if (!envelope) return;
    const isOpen = envelope.classList.toggle('open');
    envelope.setAttribute('aria-expanded', String(isOpen));
  }

  envelope?.addEventListener('click', openEnvelope);
  envelope?.addEventListener('pointerdown', (event) => {
    envelopePointerStart = { x: event.clientX, y: event.clientY };
  });
  envelope?.addEventListener('pointerup', (event) => {
    if (!envelopePointerStart) return;
    const dy = envelopePointerStart.y - event.clientY;
    const dx = Math.abs(envelopePointerStart.x - event.clientX);
    if (dy > 38 && dx < 80 && !envelope.classList.contains('open')) openEnvelope();
    envelopePointerStart = null;
  });

  /* -------------------------------------------------------
   * Gallery. Native overflow does the actual movement.
   * ----------------------------------------------------- */
  const galleryTrack = $('#galleryTrack');
  const galleryProgress = $('#galleryProgress');

  function updateGalleryProgress() {
    if (!galleryTrack || !galleryProgress) return;
    const max = galleryTrack.scrollWidth - galleryTrack.clientWidth;
    const ratio = max <= 0 ? 1 : galleryTrack.scrollLeft / max;
    galleryProgress.style.transform = `scaleX(${Math.max(.12, ratio)})`;
  }

  galleryTrack?.addEventListener('scroll', () => requestAnimationFrame(updateGalleryProgress), { passive: true });
  updateGalleryProgress();

  /* -------------------------------------------------------
   * RSVP local prototype
   * ----------------------------------------------------- */
  const rsvpButtons = $$('.rsvp-option');
  const rsvpResponse = $('#rsvpResponse');

  function setRsvp(value) {
    rsvpButtons.forEach((button) => button.classList.toggle('selected', button.dataset.rsvp === value));
    localStorage.setItem('undanganku:rsvp', value);

    if (rsvpResponse) {
      rsvpResponse.textContent = value === 'hadir'
        ? 'Kami akan menunggumu di sana. Terima kasih sudah menjadi bagian dari hari kami ♡'
        : 'Cintamu tetap sampai. Terima kasih sudah mengirimkan doa terbaikmu ♡';
    }
  }

  rsvpButtons.forEach((button) => button.addEventListener('click', () => setRsvp(button.dataset.rsvp)));
  const savedRsvp = localStorage.getItem('undanganku:rsvp');
  if (savedRsvp) setRsvp(savedRsvp);

  /* -------------------------------------------------------
   * Guestbook constellation (localStorage prototype)
   * ----------------------------------------------------- */
  const wishSky = $('#wishSky');
  const wishForm = $('#wishForm');
  const guestName = $('#guestName');
  const guestMessage = $('#guestMessage');

  const defaultWishes = [
    { name: 'Dita', message: 'Semoga bahagia selalu, kalian berdua ♡' },
    { name: 'Raka', message: 'Semoga rumah tangganya selalu dipenuhi cerita baik.' },
    { name: 'Salsa', message: 'Selamat memulai petualangan paling panjang bersama.' },
    { name: 'Ari', message: 'Semoga selalu saling memilih, bahkan di hari yang biasa.' },
    { name: 'Nadine', message: 'To a lifetime of tiny beautiful moments.' },
  ];

  function loadWishes() {
    try {
      const stored = JSON.parse(localStorage.getItem('undanganku:wishes') || 'null');
      return Array.isArray(stored) && stored.length ? stored : defaultWishes;
    } catch (_) {
      return defaultWishes;
    }
  }

  let wishes = loadWishes();

  function hashWish(wish, index) {
    const text = `${wish.name}-${wish.message}-${index}`;
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  function renderWishes() {
    if (!wishSky) return;
    wishSky.innerHTML = '<div class="wish-popover" id="wishPopover"><p></p><small></small></div>';
    const popover = $('#wishPopover', wishSky);

    wishes.slice(-42).forEach((wish, index) => {
      const hash = hashWish(wish, index);
      const x = 7 + (hash % 86);
      const y = 7 + ((hash >> 7) % 82);
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'wish-star';
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.setProperty('--twinkle', `${3 + (hash % 30) / 10}s`);
      star.setAttribute('aria-label', `Ucapan dari ${wish.name}`);

      const showWish = () => {
        if (!popover) return;
        $('p', popover).textContent = `“${wish.message}”`;
        $('small', popover).textContent = `— ${wish.name}`;
        const skyRect = wishSky.getBoundingClientRect();
        const leftPx = Math.min(Math.max(14, (x / 100) * skyRect.width - 100), skyRect.width - 274);
        const topPx = Math.min(Math.max(14, (y / 100) * skyRect.height + 18), skyRect.height - 120);
        popover.style.left = `${leftPx}px`;
        popover.style.top = `${topPx}px`;
        popover.classList.add('show');
      };

      star.addEventListener('click', showWish);
      star.addEventListener('focus', showWish);
      wishSky.appendChild(star);
    });
  }

  wishForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = guestName?.value.trim();
    const message = guestMessage?.value.trim();
    if (!name || !message) return;

    wishes.push({ name, message });
    wishes = wishes.slice(-60);
    localStorage.setItem('undanganku:wishes', JSON.stringify(wishes));
    wishForm.reset();
    renderWishes();

    requestAnimationFrame(() => {
      const stars = $$('.wish-star', wishSky);
      const newest = stars[stars.length - 1];
      newest?.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(2.6)', opacity: 1, offset: .55 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration: reducedMotion ? 1 : 850, easing: 'cubic-bezier(.22,1,.36,1)' },
      );
    });
  });

  renderWishes();

  /* -------------------------------------------------------
   * Optional music control. No autoplay, no network request
   * until a real source is added and the visitor taps play.
   * ----------------------------------------------------- */
  const musicControl = $('#musicControl');
  const musicLabel = $('#musicLabel');
  const backgroundMusic = $('#backgroundMusic');

  musicControl?.addEventListener('click', async () => {
    if (!backgroundMusic?.getAttribute('src') && !backgroundMusic?.querySelector('source')) {
      if (musicLabel) musicLabel.textContent = 'Add your music file';
      return;
    }

    if (backgroundMusic.paused) {
      try {
        backgroundMusic.volume = 0;
        await backgroundMusic.play();
        musicControl.setAttribute('aria-pressed', 'true');
        if (musicLabel) musicLabel.textContent = 'Pause Music';
        const fade = window.setInterval(() => {
          backgroundMusic.volume = Math.min(.55, backgroundMusic.volume + .05);
          if (backgroundMusic.volume >= .55) clearInterval(fade);
        }, 80);
      } catch (_) {
        if (musicLabel) musicLabel.textContent = 'Tap again to play';
      }
    } else {
      backgroundMusic.pause();
      musicControl.setAttribute('aria-pressed', 'false');
      if (musicLabel) musicLabel.textContent = 'Play Music';
    }
  });

  /* -------------------------------------------------------
   * Easter egg: five taps on footer signature
   * ----------------------------------------------------- */
  const secretTrigger = $('#secretTrigger');
  const secretModal = $('#secretModal');
  const secretClose = $('#secretClose');
  let secretCount = 0;
  let secretTimer;

  function openSecret() {
    if (!secretModal) return;
    secretModal.classList.add('open');
    secretModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeSecret() {
    if (!secretModal) return;
    secretModal.classList.remove('open');
    secretModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  secretTrigger?.addEventListener('click', () => {
    secretCount += 1;
    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => { secretCount = 0; }, 2600);
    if (secretCount >= 5) {
      secretCount = 0;
      openSecret();
    }
  });

  secretClose?.addEventListener('click', closeSecret);
  secretModal?.addEventListener('click', (event) => {
    if (event.target === secretModal) closeSecret();
  });
})();
