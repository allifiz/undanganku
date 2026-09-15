(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const sections = [...document.querySelectorAll('.section')];

  document.documentElement.classList.add('premium-ready');

  document.querySelectorAll('.section').forEach((section) => {
    section.querySelectorAll('.reveal-on-scroll, .reveal-up').forEach((element, index) => {
      element.style.setProperty('--motion-index', String(Math.min(index, 8)));
    });
  });

  sections.forEach((section) => {
    if (section.querySelector(':scope > .scene-veil')) return;
    const veil = document.createElement('div');
    veil.className = 'scene-veil';
    veil.setAttribute('aria-hidden', 'true');
    section.appendChild(veil);
  });

  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = entry.target;
      if (entry.isIntersecting) section.classList.add('scene-active', 'scene-seen');
      else section.classList.remove('scene-active');
    });
  }, { root: null, rootMargin: '-18% 0px -18% 0px', threshold: 0.08 });
  sections.forEach((section) => sceneObserver.observe(section));

  if (!reducedMotion && finePointer) {
    let raf = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight * 0.4;
    const paintPointer = () => {
      raf = 0;
      const x = Math.max(0, Math.min(100, (pointerX / window.innerWidth) * 100));
      const y = Math.max(0, Math.min(100, (pointerY / window.innerHeight) * 100));
      document.documentElement.style.setProperty('--mx', `${x.toFixed(2)}%`);
      document.documentElement.style.setProperty('--my', `${y.toFixed(2)}%`);
    };
    window.addEventListener('pointermove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!raf) raf = requestAnimationFrame(paintPointer);
    }, { passive: true });
  }

  const gallery = document.getElementById('galleryTrack');
  if (gallery && !reducedMotion) {
    let galleryRaf = 0;
    const updateGalleryDepth = () => {
      galleryRaf = 0;
      const bounds = gallery.getBoundingClientRect();
      const center = bounds.left + bounds.width / 2;
      gallery.querySelectorAll('.gallery-card').forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.min(1, Math.abs(cardCenter - center) / Math.max(1, bounds.width * 0.72));
        const scale = 1 - distance * 0.035;
        const opacity = 1 - distance * 0.16;
        card.style.setProperty('--gallery-scale', scale.toFixed(3));
        card.style.opacity = String(opacity.toFixed(3));
      });
    };
    gallery.addEventListener('scroll', () => {
      if (!galleryRaf) galleryRaf = requestAnimationFrame(updateGalleryDepth);
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!galleryRaf) galleryRaf = requestAnimationFrame(updateGalleryDepth);
    }, { passive: true });
    requestAnimationFrame(updateGalleryDepth);
  }

  if (!reducedMotion && finePointer) {
    document.querySelectorAll('.event-card').forEach((card) => {
      let raf = 0;
      let rx = 0;
      let ry = 0;
      const render = () => {
        raf = 0;
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0,-2px,0)`;
      };
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        ry = nx * 2.2;
        rx = ny * -2.2;
        if (!raf) raf = requestAnimationFrame(render);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        rx = 0;
        ry = 0;
        card.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1), box-shadow .7s ease';
        if (!raf) raf = requestAnimationFrame(render);
        window.setTimeout(() => { card.style.transition = ''; }, 720);
      });
    });
  }
})();

(() => {
  const html = document.documentElement;
  html.classList.add('experience-loading');
  const critical = document.createElement('style');
  critical.id = 'experience-critical';
  critical.textContent = `html.experience-loading body{overflow:hidden!important}html.experience-loading body>main,html.experience-loading .site-header{opacity:0!important}`;
  document.head.appendChild(critical);

  const loadScript = () => {
    const script = document.createElement('script');
    script.src = './experience.js?v=4';
    script.async = false;
    script.onload = () => critical.remove();
    script.onerror = () => {
      html.classList.remove('experience-loading');
      critical.remove();
    };
    document.head.appendChild(script);
  };

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './experience.css?v=4';
  stylesheet.onload = loadScript;
  stylesheet.onerror = () => {
    html.classList.remove('experience-loading');
    critical.remove();
  };
  document.head.appendChild(stylesheet);
})();

(() => {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './chapters.css?v=2';
  stylesheet.onload = () => {
    const script = document.createElement('script');
    script.src = './chapters.js?v=2';
    script.async = false;
    document.head.appendChild(script);
  };
  document.head.appendChild(stylesheet);
})();
