(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const make = (tag, className) => {
    const el = document.createElement(tag);
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    return el;
  };

  document.body.classList.add('flow-enhanced');

  const story = $('#story');
  const photo = $('.photo-story');
  const date = $('#dateScene');
  const event = $('#event');
  const gallery = $('#gallery');
  const rsvp = $('#rsvp');
  const guestbook = $('#guestbook');

  /* Story thread */
  if (story) {
    const handoff = make('div', 'flow-handoff story-thread-handoff');
    const caption = make('span', 'flow-caption');
    caption.textContent = 'follow the thread';
    handoff.appendChild(caption);
    story.appendChild(handoff);
  }
  if (photo) photo.appendChild(make('div', 'flow-handoff photo-thread-arrival'));

  /* Memory dust */
  if (photo) {
    const dust = make('div', 'flow-handoff photo-memory-dust');
    const positions = [-88,-56,-25,0,31,61,92];
    positions.forEach((x, index) => {
      const span = document.createElement('span');
      span.style.setProperty('--dust-x', `${x}px`);
      span.style.setProperty('--dust-x2', `${x + (index % 2 ? 18 : -16)}px`);
      span.style.setProperty('--dust-delay', `${index * 70}ms`);
      dust.appendChild(span);
    });
    photo.appendChild(dust);
  }

  if (date) {
    const receiver = make('div', 'flow-handoff date-star-receiver');
    [8,18,5,24,13].forEach((y,index) => {
      const span = document.createElement('span');
      span.style.setProperty('--star-y', `${y}px`);
      span.style.setProperty('--star-delay', `${index * 90}ms`);
      receiver.appendChild(span);
    });
    date.appendChild(receiver);

    const fall = make('div', 'flow-handoff starfall-handoff');
    [-94,-67,-43,-18,14,39,66,94].forEach((x,index) => {
      const span = document.createElement('span');
      span.style.setProperty('--fall-x', `${x}px`);
      span.style.setProperty('--fall-x2', `${Math.round(x * .34)}px`);
      span.style.setProperty('--fall-delay', `${index * 55}ms`);
      fall.appendChild(span);
    });
    date.appendChild(fall);
  }

  /* Paper to film */
  if (event) {
    const ribbons = make('div', 'flow-handoff paper-ribbon-handoff');
    ribbons.innerHTML = '<span></span><span></span><span></span>';
    event.appendChild(ribbons);
  }
  if (gallery) {
    const film = make('div', 'flow-handoff film-entry-handoff');
    film.innerHTML = '<span></span><span></span><span></span><span></span>';
    gallery.appendChild(film);

    const exit = make('div', 'flow-handoff gallery-line-exit');
    gallery.appendChild(exit);
  }

  /* Gallery to RSVP */
  if (rsvp) {
    rsvp.appendChild(make('div', 'flow-handoff rsvp-line-entry'));
    const lights = make('div', 'flow-handoff answer-light-handoff');
    lights.innerHTML = '<span></span><span></span><span></span><span></span><span></span>';
    rsvp.appendChild(lights);
  }

  if (guestbook) {
    const sky = make('div', 'flow-handoff guest-sky-entry');
    [10,28,6,21,13].forEach((y,index) => {
      const span = document.createElement('span');
      span.style.setProperty('--sky-y', `${y}px`);
      span.style.setProperty('--sky-delay', `${index * 85}ms`);
      sky.appendChild(span);
    });
    guestbook.appendChild(sky);
  }

  /* Section arrival state */
  const seenObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('flow-seen');
    });
  }, { threshold: .12, rootMargin: '0px 0px -16% 0px' });
  [photo,date,event,gallery,rsvp,guestbook].filter(Boolean).forEach((el) => seenObserver.observe(el));

  /* Photo exit dust only once when the lower part approaches the viewport. */
  if (photo) {
    const dust = $('.photo-memory-dust', photo);
    const sentinel = document.createElement('span');
    sentinel.style.cssText = 'position:absolute;bottom:12%;left:50%;width:1px;height:1px;pointer-events:none';
    sentinel.setAttribute('aria-hidden', 'true');
    photo.appendChild(sentinel);
    const dustObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        dust?.classList.add('live');
        observer.disconnect();
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    dustObserver.observe(sentinel);
  }

  /* Observe interactions produced by the chapter layer. */
  if (date && event) {
    const syncDate = () => {
      const complete = date.classList.contains('constellation-complete');
      date.classList.toggle('flow-constellation-complete', complete);
      if (complete) {
        event.classList.add('flow-star-incoming');
        window.setTimeout(() => event.classList.remove('flow-star-incoming'), 1500);
      }
    };
    new MutationObserver(syncDate).observe(date, { attributes:true, attributeFilter:['class'] });
    syncDate();
  }

  if (event && gallery) {
    const syncEvent = () => {
      const opened = event.classList.contains('event-unsealed');
      event.classList.toggle('flow-paper-open', opened);
      if (opened) gallery.classList.add('flow-film-ready');
    };
    new MutationObserver(syncEvent).observe(event, { attributes:true, attributeFilter:['class'] });
    syncEvent();
  }

  if (rsvp && guestbook) {
    rsvp.addEventListener('click', (eventTarget) => {
      if (!eventTarget.target.closest('.rsvp-option')) return;
      guestbook.classList.add('flow-answer-incoming');
      window.setTimeout(() => guestbook.classList.remove('flow-answer-incoming'), 1400);
    });
  }

  /* One rAF updates all continuous boundary progress values. */
  const pairs = [
    { from: story, variable: '--flow-story' },
    { from: photo, variable: '--flow-photo' },
    { from: event, variable: '--flow-event' },
    { from: gallery, variable: '--flow-gallery' },
    { from: rsvp, variable: '--flow-rsvp' },
  ].filter((item) => item.from);

  let raf = 0;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const paint = () => {
    raf = 0;
    const vh = Math.max(1, window.innerHeight);
    pairs.forEach(({ from, variable }) => {
      const rect = from.getBoundingClientRect();
      const start = vh * .98;
      const end = vh * .22;
      const progress = clamp((start - rect.bottom) / (start - end));
      document.documentElement.style.setProperty(variable, progress.toFixed(4));
    });
  };
  const requestPaint = () => {
    if (!raf) raf = requestAnimationFrame(paint);
  };
  window.addEventListener('scroll', requestPaint, { passive:true });
  window.addEventListener('resize', requestPaint, { passive:true });
  paint();

  if (reducedMotion) {
    document.documentElement.style.setProperty('--flow-story', '.72');
    document.documentElement.style.setProperty('--flow-photo', '.72');
    document.documentElement.style.setProperty('--flow-event', '.72');
    document.documentElement.style.setProperty('--flow-gallery', '.72');
    document.documentElement.style.setProperty('--flow-rsvp', '.72');
  }
})();
