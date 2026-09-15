(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  document.body.classList.add('chapter-enhanced');

  /* -------------------------------------------------------
   * Chapter labels + scene curtains
   * ----------------------------------------------------- */
  const chapterScenes = [
    { selector: '.photo-story', label: 'Interlude · A memory' },
    { selector: '#dateScene', label: 'Chapter II · The date' },
    { selector: '#event', label: 'Chapter III · The invitation' },
    { selector: '#gallery', label: 'Chapter IV · Captured moments' },
    { selector: '#rsvp', label: 'Chapter V · Your answer' },
    { selector: '#guestbook', label: 'Chapter VI · The sky' },
  ];

  const curtainObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('chapter-entered');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -18% 0px' });

  chapterScenes.forEach(({ selector, label }) => {
    const section = $(selector);
    if (!section) return;
    if (!section.querySelector(':scope > .scene-curtain')) {
      const curtain = document.createElement('div');
      curtain.className = 'scene-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      section.appendChild(curtain);
    }
    if (!section.querySelector(':scope > .scene-chapter-label')) {
      const marker = document.createElement('div');
      marker.className = 'scene-chapter-label';
      marker.textContent = label;
      marker.setAttribute('aria-hidden', 'true');
      section.appendChild(marker);
    }
    curtainObserver.observe(section);
  });

  /* -------------------------------------------------------
   * Our Story: active chapter + memory cards
   * ----------------------------------------------------- */
  const timelineItems = $$('.timeline-item');
  const memoryNotes = [
    'We did not know each other yet. Somehow, the road was already getting shorter.',
    'A small hello became the kind of moment we kept replaying in our heads.',
    'Some promises do not need a grand stage. Just two people choosing the same direction.',
  ];

  timelineItems.forEach((item, index) => {
    const badge = document.createElement('span');
    badge.className = 'timeline-index';
    badge.textContent = `${String(index + 1).padStart(2, '0')} / ${String(timelineItems.length).padStart(2, '0')}`;
    badge.setAttribute('aria-hidden', 'true');
    item.appendChild(badge);

    const frame = $('.photo-frame', item);
    if (frame && memoryNotes[index]) {
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      frame.setAttribute('aria-expanded', 'false');
      frame.setAttribute('aria-label', 'Buka catatan kenangan');

      const note = document.createElement('div');
      note.className = 'memory-note';
      note.textContent = memoryNotes[index];

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'memory-card-toggle';
      toggle.setAttribute('aria-label', 'Buka catatan foto');

      frame.append(note, toggle);

      const setOpen = (open) => {
        frame.classList.toggle('memory-open', open);
        frame.setAttribute('aria-expanded', String(open));
      };

      const toggleMemory = (event) => {
        event?.stopPropagation();
        setOpen(!frame.classList.contains('memory-open'));
      };

      toggle.addEventListener('click', toggleMemory);
      frame.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        toggleMemory(event);
      });
      frame.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleMemory(event);
        }
      });
    }
  });

  const finale = $('.timeline-item.finale .timeline-copy');
  if (finale) {
    const sigil = document.createElement('div');
    sigil.className = 'timeline-finale-sigil';
    sigil.textContent = '∞';
    sigil.setAttribute('aria-hidden', 'true');
    finale.appendChild(sigil);
  }

  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('chapter-active', entry.isIntersecting);
    });
  }, { threshold: 0.52, rootMargin: '-14% 0px -28% 0px' });

  timelineItems.forEach((item) => timelineObserver.observe(item));

  /* -------------------------------------------------------
   * Scroll-linked depth, one rAF for all story motion
   * ----------------------------------------------------- */
  const photoStory = $('.photo-story');
  let scrollRaf = 0;

  const paintStoryDepth = () => {
    scrollRaf = 0;
    if (reducedMotion) return;
    const vh = Math.max(1, window.innerHeight);

    timelineItems.forEach((item) => {
      const frame = $('.photo-frame', item);
      if (!frame) return;
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > vh + 120) return;
      const center = rect.top + rect.height / 2;
      const normalized = Math.max(-1, Math.min(1, (center - vh / 2) / vh));
      frame.style.setProperty('--memory-pan', `${(normalized * -10).toFixed(2)}px`);
    });

    if (photoStory) {
      const rect = photoStory.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < vh) {
        const normalized = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
        photoStory.style.setProperty('--photo-copy-y', `${(normalized * 12).toFixed(2)}px`);
      }
    }
  };

  const requestStoryPaint = () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(paintStoryDepth);
  };

  window.addEventListener('scroll', requestStoryPaint, { passive: true });
  window.addEventListener('resize', requestStoryPaint, { passive: true });
  requestStoryPaint();

  /* -------------------------------------------------------
   * Photo interlude secret note
   * ----------------------------------------------------- */
  if (photoStory) {
    const panel = document.createElement('div');
    panel.className = 'photo-secret-panel';
    panel.innerHTML = `
      <button class="photo-secret-toggle" type="button" aria-expanded="false">Tap to reveal a little note</button>
      <div class="photo-secret-note">Some photos remember what words forget.</div>
    `;
    photoStory.appendChild(panel);

    const toggle = $('.photo-secret-toggle', panel);
    toggle?.addEventListener('click', () => {
      const open = !photoStory.classList.contains('photo-secret-open');
      photoStory.classList.toggle('photo-secret-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Hide the note' : 'Tap to reveal a little note';
      try { navigator.vibrate?.(7); } catch (_) { /* optional */ }
    });
  }

  /* -------------------------------------------------------
   * Playable constellation
   * ----------------------------------------------------- */
  const dateScene = $('#dateScene');
  const constellation = $('.constellation', dateScene || document);
  if (dateScene && constellation) {
    constellation.removeAttribute('aria-hidden');
    const svg = $('svg', constellation);
    const circles = $$('circle', svg || constellation);
    const viewBox = svg?.viewBox?.baseVal;
    const width = viewBox?.width || 600;
    const height = viewBox?.height || 260;

    const hint = document.createElement('p');
    hint.className = 'constellation-play-hint';
    hint.innerHTML = `Touch the stars · <span class="constellation-count">0/${circles.length}</span>`;
    constellation.insertAdjacentElement('afterend', hint);

    const completeNote = document.createElement('div');
    completeNote.className = 'date-complete-note';
    completeNote.textContent = 'It was written in the stars.';
    const dateNote = $('.date-note', dateScene);
    dateNote?.insertAdjacentElement('beforebegin', completeNote);

    let litCount = 0;
    const countEl = $('.constellation-count', hint);

    circles.forEach((circle, index) => {
      const x = Number(circle.getAttribute('cx') || 0);
      const y = Number(circle.getAttribute('cy') || 0);
      const hit = document.createElement('button');
      hit.type = 'button';
      hit.className = 'star-hit';
      hit.style.left = `${(x / width) * 100}%`;
      hit.style.top = `${(y / height) * 100}%`;
      hit.setAttribute('aria-label', `Nyalakan bintang ${index + 1}`);
      constellation.appendChild(hit);

      hit.addEventListener('click', () => {
        if (hit.classList.contains('lit')) return;
        hit.classList.add('lit');
        circle.style.opacity = '1';
        circle.style.transform = 'scale(1.35)';
        litCount += 1;
        if (countEl) countEl.textContent = `${litCount}/${circles.length}`;
        try { navigator.vibrate?.(6); } catch (_) { /* optional */ }

        if (litCount === circles.length) {
          dateScene.classList.add('constellation-complete');
          hint.setAttribute('aria-hidden', 'true');
          try { navigator.vibrate?.([10, 30, 10]); } catch (_) { /* optional */ }
        }
      });
    });
  }

  /* -------------------------------------------------------
   * Envelope aftermath
   * ----------------------------------------------------- */
  const eventSection = $('#event');
  const envelope = $('#envelope');
  if (eventSection && envelope) {
    const syncEnvelopeState = () => {
      eventSection.classList.toggle('event-unsealed', envelope.classList.contains('open'));
    };
    envelope.addEventListener('click', () => requestAnimationFrame(syncEnvelopeState));
    new MutationObserver(syncEnvelopeState).observe(envelope, { attributes: true, attributeFilter: ['class'] });
    syncEnvelopeState();
  }

  /* -------------------------------------------------------
   * Gallery live film state
   * ----------------------------------------------------- */
  const gallerySection = $('#gallery');
  const gallery = $('#galleryTrack');
  if (gallerySection && gallery) {
    const cards = $$('.gallery-card', gallery);
    const meta = document.createElement('div');
    meta.className = 'gallery-meta';
    meta.innerHTML = `
      <span class="gallery-live-caption"></span>
      <span class="gallery-live-count">01 / ${String(cards.length).padStart(2, '0')}</span>
    `;
    gallery.insertAdjacentElement('beforebegin', meta);

    const captionEl = $('.gallery-live-caption', meta);
    const countEl = $('.gallery-live-count', meta);
    let galleryRaf = 0;

    const paintGallery = () => {
      galleryRaf = 0;
      const bounds = gallery.getBoundingClientRect();
      const center = bounds.left + bounds.width / 2;
      let nearest = 0;
      let nearestDistance = Infinity;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = index;
        }
      });

      cards.forEach((card, index) => card.classList.toggle('chapter-current', index === nearest));
      const active = cards[nearest];
      if (captionEl) captionEl.textContent = $('figcaption', active)?.textContent || 'A memory';
      if (countEl) countEl.textContent = `${String(nearest + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    };

    gallery.addEventListener('scroll', () => {
      if (!galleryRaf) galleryRaf = requestAnimationFrame(paintGallery);
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!galleryRaf) galleryRaf = requestAnimationFrame(paintGallery);
    }, { passive: true });

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const willFocus = !card.classList.contains('gallery-focus');
        cards.forEach((other) => other.classList.remove('gallery-focus'));
        card.classList.toggle('gallery-focus', willFocus);
      });
    });
    paintGallery();
  }

  /* -------------------------------------------------------
   * RSVP ambience response
   * ----------------------------------------------------- */
  const rsvpSection = $('#rsvp');
  const rsvpInner = $('.rsvp-inner', rsvpSection || document);
  if (rsvpSection && rsvpInner) {
    const echo = document.createElement('div');
    echo.className = 'rsvp-answer-echo';
    echo.setAttribute('aria-live', 'polite');
    rsvpInner.appendChild(echo);

    $$('.rsvp-option', rsvpSection).forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.rsvp;
        rsvpSection.classList.add('rsvp-answered');
        rsvpSection.classList.toggle('rsvp-hadir', value === 'hadir');
        rsvpSection.classList.toggle('rsvp-tidak', value === 'tidak');
        echo.textContent = value === 'hadir'
          ? 'Then this chapter will be brighter with you in it.'
          : 'Your warm wishes still become part of the story.';
      });
    });
  }
})();
