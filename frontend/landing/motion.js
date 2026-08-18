(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function addMotionClasses() {
    document.querySelectorAll('.section-head').forEach(function (el, index) {
      el.classList.add('motion-reveal', index % 2 === 0 ? 'motion-left' : 'motion-right');
    });

    document.querySelectorAll('.value-strip, .problem-grid, .brand-wall, .unit-grid, .battery-compare, .gallery, .sector-grid, .flow').forEach(function (el) {
      el.classList.add('motion-stagger');
    });

    document.querySelectorAll('.battery-note, .bottom-box, .brand-note').forEach(function (el) {
      el.classList.add('motion-reveal', 'motion-scale');
    });

    document.querySelectorAll('.section h2').forEach(function (heading) {
      if (heading.dataset.motionReady === '1') return;
      var text = (heading.textContent || '').trim();
      if (!text) return;

      heading.dataset.motionReady = '1';
      heading.setAttribute('aria-label', text);
      heading.classList.add('motion-words');
      heading.innerHTML = text.split(/\s+/).map(function (word) {
        return '<span class="motion-word" aria-hidden="true">' + word.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
      }).join(' ');
    });
  }

  function setupObserver() {
    var targets = document.querySelectorAll('.motion-reveal, .motion-stagger, .motion-words');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: '0px 0px -8% 0px'
    });

    targets.forEach(function (el) { observer.observe(el); });
  }

  function setupScrollMotion() {
    if (reduceMotion) {
      document.body.style.setProperty('--scroll-progress', '1');
      return;
    }

    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      var heroOffset = Math.min(window.scrollY * 0.055, 24);

      document.body.style.setProperty('--scroll-progress', progress.toFixed(4));
      document.body.style.setProperty('--hero-parallax', heroOffset.toFixed(2) + 'px');
      document.body.classList.toggle('scrolled', window.scrollY > 24);
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
  }

  function setupPointerDepth() {
    if (reduceMotion || !window.matchMedia('(pointer:fine)').matches) return;

    document.querySelectorAll('.unit-card, .battery-card, .gallery-item').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-y * 2.4).toFixed(2) + 'deg) rotateY(' + (x * 2.4).toFixed(2) + 'deg) translateY(-3px)';
      });

      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  function init() {
    addMotionClasses();
    setupObserver();
    setupScrollMotion();
    setupPointerDepth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
