(function () {
  var root = document.documentElement;
  var unhide = function () { root.classList.remove('js-anim'); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header */
  var head = document.querySelector('.site-head');
  var onScroll = function () { head && head.classList.toggle('is-solid', window.scrollY > 20 || !document.querySelector('.hero')); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      var mn=document.querySelector('.mnav'); if(open) mn.removeAttribute('inert'); else mn.setAttribute('inert','');
      head.classList.add('is-solid');
      if (!open) onScroll();
    });
    document.querySelectorAll('.mnav a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); document.querySelector('.mnav').setAttribute('inert',''); });
    });
  }

  /* prepare stroke lengths */
  document.querySelectorAll('.draw path').forEach(function (p) {
    var l = Math.ceil(p.getTotalLength()) + 2;
    p.style.setProperty('--len', l);
    p.style.strokeDasharray = l;
  });

  /* reveal */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* retention field: 19 of 20 strokes stay */
  var field = document.querySelector('.retain svg');
  if (field) {
    var num = document.querySelector('.retain__num');
    var io2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io2.disconnect();
      setTimeout(function () { field.querySelector('.h--lost').classList.add('is-lost'); }, reduce ? 0 : 700);
      if (num && !reduce) {
        var t0 = performance.now();
        (function tick(t) {
          var k = Math.min((t - t0) / 1600, 1), e = 1 - Math.pow(1 - k, 3);
          num.textContent = Math.round(e * 95) + '%';
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      }
    }, { threshold: 0.5 });
    io2.observe(field);
  }

  /* tabs */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
        panel.hidden = !on; panel.classList.toggle('is-in', on);
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n); }
      });
    });
  });

  /* draggable strips (mouse); touch uses native swipe; page scroll untouched */
  document.querySelectorAll('.drag').forEach(function (el) {
    var down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; el.classList.add('is-dragging'); }
      el.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () { down = false; setTimeout(function () { el.classList.remove('is-dragging'); }, 0); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* gallery filter + lightbox */
  var items = [].slice.call(document.querySelectorAll('.gitem'));
  document.querySelectorAll('.filters .tab').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.filters .tab').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var f = b.dataset.f;
      items.forEach(function (it) { it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat.indexOf(f) < 0); });
    });
  });
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var img = lb.querySelector('img'), cur = 0, last = null;
    var vis = function () { return items.filter(function (i) { return !i.classList.contains('is-hidden'); }); };
    var show = function (i) { var v = vis(); cur = (i + v.length) % v.length; var s = v[cur].querySelector('img'); img.src = s.src; img.alt = s.alt; };
    var close = function () { lb.classList.remove('is-open'); lb.setAttribute('inert', ''); if (last) last.focus(); };
    items.forEach(function (it) {
      it.addEventListener('click', function () { last = it; show(vis().indexOf(it)); lb.classList.add('is-open'); lb.removeAttribute('inert'); lb.querySelector('.lb-close').focus(); });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
  }

  /* GSAP moments */
  if (!window.gsap || reduce) {
    unhide();
    document.querySelectorAll('.draw path').forEach(function (p) { p.style.strokeDashoffset = 0; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var mm = gsap.matchMedia();
  mm.add({ all: 'all', wide: '(min-width: 901px)' }, function (ctx) {
    var wide = ctx.conditions.wide;
    var hero = document.querySelector('.hero');
    if (hero) {
      var lines = hero.querySelectorAll('h1 .ln > span');
      var browPaths = hero.querySelectorAll('.hero__brow path');
      gsap.set(lines, { y: 0, yPercent: 125 });
      gsap.set('.hero__lead, .hero .cta-row, .hero__award, .hero__tag', { opacity: 0, y: 18 });
      gsap.set('.hero__photo', { clipPath: 'inset(0% 0% 0% 100%)' });
      browPaths.forEach(function (p) { gsap.set(p, { strokeDashoffset: p.style.getPropertyValue('--len') }); });
      unhide();
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.hero__photo', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
        .fromTo('.hero__photo img', { scale: 1.14 }, { scale: 1, duration: 2, ease: 'power2.out' }, 0)
        .to(lines, { yPercent: 0, duration: 1.1, stagger: .1 }, .15)
        .to('.hero__lead, .hero .cta-row, .hero__award', { opacity: 1, y: 0, duration: .9, stagger: .08 }, .55)
        .to(browPaths, { strokeDashoffset: 0, duration: .55, stagger: .018, ease: 'power1.inOut' }, .8)
        .to('.hero__tag', { opacity: 1, y: 0, duration: .8 }, 1.3);
      if (wide) {
        gsap.to('.hero__photo img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      }
    } else {
      unhide();
    }

    /* inner page brows draw on load */
    document.querySelectorAll('.phero__brow path').forEach(function (p) { gsap.set(p, { strokeDashoffset: p.style.getPropertyValue('--len') }); });
    gsap.to('.phero__brow path', { strokeDashoffset: 0, duration: .5, stagger: .015, ease: 'power1.inOut', delay: .2 });

    /* strips rise one after another */
    if (document.querySelector('.strips')) {
      gsap.from('.strip', { y: 80, opacity: 0, duration: 1.1, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.strips', start: 'top 82%' } });
    }
    if (wide && document.querySelector('.collage')) {
      gsap.to('.collage .c2', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.collage .c3', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });
  setTimeout(unhide, 3000);
})();
