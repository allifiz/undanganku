(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const photo = $('.photo-story');
  const dateScene = $('#dateScene');
  const eventSection = $('#event');
  const envelope = $('#envelope');
  const gallery = $('#gallery');
  const rsvp = $('#rsvp');
  const guestbook = $('#guestbook');

  const fx = document.createElement('div');
  fx.className = 'continuity-fx-layer';
  fx.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fx);

  const createDot = () => {
    const dot = document.createElement('span');
    dot.className = 'continuity-dot';
    fx.appendChild(dot);
    return dot;
  };

  const removeLater = (element, ms) => window.setTimeout(() => element.remove(), ms);

  function launchDustFrom(rect, options = {}) {
    if (reducedMotion || !rect) return;
    const count = options.count ?? 10;
    const originX = options.x ?? (rect.left + rect.width / 2);
    const originY = options.y ?? Math.min(window.innerHeight - 80, rect.top + rect.height * .72);
    const travel = options.travel ?? 180;

    for (let index = 0; index < count; index += 1) {
      const dot = createDot();
      const startX = originX + ((index % 2 ? 1 : -1) * (8 + index * 7));
      const driftX = ((index % 3) - 1) * (24 + index * 4);
      const driftY = travel + (index % 4) * 18;
      dot.style.transform = `translate3d(${startX}px,${originY}px,0) scale(.45)`;
      dot.animate([
        { opacity: 0, transform: `translate3d(${startX}px,${originY}px,0) scale(.45)` },
        { opacity: .96, offset: .25 },
        { opacity: .68, offset: .65 },
        { opacity: 0, transform: `translate3d(${startX + driftX}px,${originY + driftY}px,0) scale(1.2)` },
      ], {
        duration: 1450 + index * 55,
        delay: index * 45,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'forwards',
      });
      removeLater(dot, 2350);
    }
  }

  function launchDownwardStars(rect) {
    if (reducedMotion || !rect) return;
    const originX = rect.left + rect.width / 2;
    const originY = Math.min(window.innerHeight - 120, rect.bottom - 24);

    for (let index = 0; index < 9; index += 1) {
      const dot = createDot();
      const spread = (index - 4) * 16;
      const startX = originX + spread;
      const endX = originX + spread * .32;
      const endY = originY + Math.min(window.innerHeight * .42, 300);
      dot.style.transform = `translate3d(${startX}px,${originY}px,0) scale(.45)`;
      dot.animate([
        { opacity: 0, transform: `translate3d(${startX}px,${originY}px,0) scale(.45)` },
        { opacity: 1, offset: .22 },
        { opacity: .82, offset: .58 },
        { opacity: 0, transform: `translate3d(${endX}px,${endY}px,0) scale(.9)` },
      ], {
        duration: 1350 + index * 45,
        delay: index * 55,
        easing: 'cubic-bezier(.2,.72,.2,1)',
        fill: 'forwards',
      });
      removeLater(dot, 2300);
    }
  }

  function launchRibbon(rect) {
    if (reducedMotion || !rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    [-12, 0, 12].forEach((offset, index) => {
      const ribbon = document.createElement('span');
      ribbon.className = 'continuity-ribbon';
      fx.appendChild(ribbon);
      ribbon.style.transform = `translate3d(${cx - 10}px,${cy + offset}px,0) rotate(${(index - 1) * 5}deg) scaleX(.08)`;
      ribbon.animate([
        {
          opacity: 0,
          transform: `translate3d(${cx - 10}px,${cy + offset}px,0) rotate(${(index - 1) * 5}deg) scaleX(.08)`,
        },
        {
          opacity: .95,
          offset: .30,
          transform: `translate3d(${cx - 34}px,${cy + 45 + offset}px,0) rotate(${(index - 1) * 8}deg) scaleX(.85)`,
        },
        {
          opacity: .76,
          offset: .68,
          transform: `translate3d(${cx - 44}px,${cy + 105 + offset}px,0) rotate(${(index - 1) * 11}deg) scaleX(1.35)`,
        },
        {
          opacity: 0,
          transform: `translate3d(${cx - 48}px,${cy + 180 + offset}px,0) rotate(${(index - 1) * 14}deg) scaleX(1.65)`,
        },
      ], {
        duration: 1500,
        delay: index * 90,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'forwards',
      });
      removeLater(ribbon, 2200);
    });
  }

  function launchAnswerLights(button) {
    if (reducedMotion || !button) return;
    const rect = button.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let index = 0; index < 9; index += 1) {
      const dot = createDot();
      const spreadX = (index - 4) * 13;
      const sway = (index % 2 ? 1 : -1) * (16 + index * 3);
      const startX = cx + spreadX;
      const endY = Math.min(window.innerHeight - 28, cy + 230 + (index % 3) * 22);
      dot.style.transform = `translate3d(${startX}px,${cy}px,0) scale(.5)`;
      dot.animate([
        { opacity: 0, transform: `translate3d(${startX}px,${cy}px,0) scale(.5)` },
        { opacity: 1, offset: .20 },
        { opacity: .82, offset: .58 },
        { opacity: 0, transform: `translate3d(${startX + sway}px,${endY}px,0) scale(1.2)` },
      ], {
        duration: 1450 + index * 40,
        delay: index * 55,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'forwards',
      });
      removeLater(dot, 2350);
    }
  }

  /* ----------------------------------------------------------------------
   * Build persistent receivers inside target sections.
   * ------------------------------------------------------------------- */
  if (dateScene && !$('.continuity-star-arrival', dateScene)) {
    const arrival = document.createElement('div');
    arrival.className = 'continuity-star-arrival';
    arrival.setAttribute('aria-hidden', 'true');
    [10, 27, 44, 62, 78, 91].forEach((x, index) => {
      const star = document.createElement('i');
      star.style.setProperty('--x', `${x}%`);
      star.style.setProperty('--i', index);
      star.style.setProperty('--drift', `${index % 2 ? 9 : -8}px`);
      arrival.appendChild(star);
    });
    dateScene.appendChild(arrival);
  }

  if (eventSection && !$('.continuity-paper-echo', eventSection)) {
    const echo = document.createElement('div');
    echo.className = 'continuity-paper-echo';
    echo.setAttribute('aria-hidden', 'true');
    [4, -2, -6].forEach((rotation, index) => {
      const line = document.createElement('i');
      line.style.setProperty('--i', index);
      line.style.setProperty('--r', `${rotation}deg`);
      echo.appendChild(line);
    });
    const copy = document.createElement('small');
    copy.textContent = 'paper becomes memory';
    echo.appendChild(copy);
    eventSection.appendChild(echo);
  }

  if (gallery && !$('.continuity-film-arrival', gallery)) {
    const film = document.createElement('div');
    film.className = 'continuity-film-arrival';
    film.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 4; index += 1) {
      const frame = document.createElement('i');
      frame.style.setProperty('--i', index);
      film.appendChild(frame);
    }
    gallery.appendChild(film);
  }

  if (rsvp && !$('.continuity-answer-echo', rsvp)) {
    const echo = document.createElement('div');
    echo.className = 'continuity-answer-echo';
    echo.setAttribute('aria-hidden', 'true');
    [12, 29, 47, 66, 86].forEach((x, index) => {
      const light = document.createElement('i');
      light.style.setProperty('--x', `${x}%`);
      light.style.setProperty('--y', `${8 + (index % 3) * 12}px`);
      light.style.setProperty('--i', index);
      echo.appendChild(light);
    });
    rsvp.appendChild(echo);
  }

  if (guestbook && !$('.continuity-sky-arrival', guestbook)) {
    const arrival = document.createElement('div');
    arrival.className = 'continuity-sky-arrival';
    arrival.setAttribute('aria-hidden', 'true');
    [9, 24, 39, 57, 73, 90].forEach((x, index) => {
      const star = document.createElement('i');
      star.style.setProperty('--x', `${x}%`);
      star.style.setProperty('--i', index);
      star.style.setProperty('--drift', `${index % 2 ? 10 : -9}px`);
      arrival.appendChild(star);
    });
    guestbook.appendChild(arrival);
  }

  if (photo && !$('.continuity-photo-dust-label', photo)) {
    const label = document.createElement('div');
    label.className = 'continuity-photo-dust-label';
    label.textContent = 'memory becomes light';
    label.setAttribute('aria-hidden', 'true');
    photo.appendChild(label);
  }

  /* ----------------------------------------------------------------------
   * PHOTO -> DATE: visible dust in the current viewport, then receiving stars.
   * ------------------------------------------------------------------- */
  let photoPlayed = false;
  if (photo) {
    const photoObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || photoPlayed) return;
        const rect = photo.getBoundingClientRect();
        if (rect.bottom > window.innerHeight * 1.15) return;
        photoPlayed = true;
        photo.classList.add('continuity-dusting');
        launchDustFrom(rect, {
          count: 12,
          y: Math.min(window.innerHeight * .76, rect.bottom - 90),
          travel: 190,
        });
        window.setTimeout(() => dateScene?.classList.add('continuity-stars-armed'), 650);
        observer.disconnect();
      });
    }, { threshold: .22, rootMargin: '0px 0px -4% 0px' });
    photoObserver.observe(photo);
  }

  if (dateScene) {
    const dateObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (photoPlayed || dateScene.classList.contains('continuity-stars-armed')) {
          dateScene.classList.add('continuity-stars-live');
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -16% 0px' });
    dateObserver.observe(dateScene);
  }

  /* ----------------------------------------------------------------------
   * CONSTELLATION -> SEAL: falling stars now visibly play in viewport.
   * ------------------------------------------------------------------- */
  let constellationPlayed = false;
  let sealPending = false;
  const syncConstellation = () => {
    if (!dateScene || constellationPlayed || !dateScene.classList.contains('constellation-complete')) return;
    constellationPlayed = true;
    sealPending = true;
    const constellation = $('.constellation', dateScene);
    const rect = constellation?.getBoundingClientRect();
    if (rect) launchDownwardStars(rect);
  };

  if (dateScene) {
    new MutationObserver(syncConstellation).observe(dateScene, {
      attributes: true,
      attributeFilter: ['class'],
    });
    syncConstellation();
  }

  if (eventSection) {
    const eventObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !sealPending) return;
        sealPending = false;
        eventSection.classList.remove('continuity-seal-live');
        requestAnimationFrame(() => eventSection.classList.add('continuity-seal-live'));
      });
    }, { threshold: .14, rootMargin: '0px 0px -16% 0px' });
    eventObserver.observe(eventSection);
  }

  /* ----------------------------------------------------------------------
   * ENVELOPE -> GALLERY: ribbon is emitted immediately from the envelope,
   * then film frames arrive when Gallery enters view.
   * ------------------------------------------------------------------- */
  let envelopePlayed = false;
  let filmPending = false;

  const syncEnvelope = () => {
    if (!envelope || !envelope.classList.contains('open') || envelopePlayed) return;
    envelopePlayed = true;
    filmPending = true;
    const seal = $('.wax-seal', envelope);
    launchRibbon(seal?.getBoundingClientRect() || envelope.getBoundingClientRect());
    eventSection?.classList.add('continuity-paper-live');
  };

  if (envelope) {
    new MutationObserver(syncEnvelope).observe(envelope, {
      attributes: true,
      attributeFilter: ['class'],
    });
    syncEnvelope();
  }

  if (gallery) {
    const galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || (!filmPending && !envelopePlayed)) return;
        filmPending = false;
        gallery.classList.remove('continuity-film-live');
        requestAnimationFrame(() => gallery.classList.add('continuity-film-live'));
      });
    }, { threshold: .10, rootMargin: '0px 0px -12% 0px' });
    galleryObserver.observe(gallery);
  }

  /* ----------------------------------------------------------------------
   * RSVP -> GUESTBOOK: answer visibly turns into little lights now.
   * ------------------------------------------------------------------- */
  let skyPending = false;
  if (rsvp) {
    $$('.rsvp-option', rsvp).forEach((button) => {
      button.addEventListener('click', () => {
        skyPending = true;
        launchAnswerLights(button);
      });
    });
  }

  if (guestbook) {
    const guestObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !skyPending) return;
        skyPending = false;
        guestbook.classList.remove('continuity-sky-live');
        requestAnimationFrame(() => guestbook.classList.add('continuity-sky-live'));
      });
    }, { threshold: .10, rootMargin: '0px 0px -12% 0px' });
    guestObserver.observe(guestbook);
  }
})();
