/* ===========================================================
   HARMONY — animations.js
   GSAP + ScrollTrigger. Если GSAP не загрузился — контент
   остаётся видимым, сайт работает как обычная статика.
   =========================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined' || reduced) return;

  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  var q  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var qa = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var isDesktop = window.matchMedia('(min-width: 900px)').matches;

  /* ================= HERO: вступление ================= */

  // Заголовок анимируется построчно, поэтому сам h1 прячем не целиком —
  // иначе строки «проявятся» внутри невидимого родителя.
  var heroTitle = q('#hero .hero__title');
  var heroBits = qa('#hero .reveal').filter(function (el) { return el !== heroTitle; });
  var heroLines = qa('#hero .display__line');

  gsap.set(heroBits, { opacity: 0, y: 26 });
  gsap.set(heroLines, { opacity: 0, y: 40, rotateX: -35 });
  gsap.set('.hero__mic', { opacity: 0, y: 40, scale: .94 });
  gsap.set('.hero__glow', { opacity: 0, scale: .7 });
  gsap.set('.hero__scroll', { opacity: 0 });

  function playHero() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero__glow', { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to('.hero__mic', { opacity: 1, y: 0, scale: 1, duration: 1.2 }, .1)
      .to(qa('#hero .kicker'), { opacity: 1, y: 0, duration: .6 }, .15)
      .to(heroLines, { opacity: 1, y: 0, rotateX: 0, duration: .9, stagger: .11 }, .25)
      .to(qa('#hero .hero__lead, #hero .hero__cta, #hero .hero__facts'),
          { opacity: 1, y: 0, duration: .8, stagger: .12 }, .7)
      .to('.hero__scroll', { opacity: 1, duration: .6 }, 1.2);

    // Полоски логотипа «дышат» один раз при входе
    tl.from('.header .logo__eq rect', {
      scaleY: .2, transformOrigin: 'center', duration: .6, stagger: .06, ease: 'back.out(2)'
    }, .2);
  }

  // Ждём, пока уйдёт прелоадер
  window.addEventListener('load', function () { setTimeout(playHero, 500); });
  setTimeout(function () {
    // страховка на случай долгой загрузки внешних ресурсов
    if (gsap.getProperty('.hero__mic', 'opacity') < 1) playHero();
  }, 4200);

  if (typeof ScrollTrigger === 'undefined') return;

  /* ================= ПАРЯЩИЕ ЗАГОЛОВКИ СЕКЦИЙ ================= */

  qa('.section__head').forEach(function (head) {
    var parts = qa('.kicker, .section__title, .section__lead', head);
    gsap.from(parts, {
      opacity: 0,
      y: 44,
      duration: .9,
      ease: 'power3.out',
      stagger: .1,
      scrollTrigger: { trigger: head, start: 'top 82%' }
    });
  });

  /* ================= ОДИНОЧНЫЕ БЛОКИ ================= */

  qa('.reveal').forEach(function (el) {
    if (el.closest('#hero') || el.closest('.section__head')) return;
    gsap.from(el, {
      opacity: 0,
      y: 34,
      duration: .85,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ================= STAGGER-ГРУППЫ ================= */
  /* Карточки метода, треки, преподаватели, полароиды */

  var groups = {};
  qa('.reveal-stagger').forEach(function (el) {
    var key = el.parentNode;
    var idx = groups.list ? groups.list.indexOf(key) : -1;
    if (!groups.list) { groups.list = []; groups.items = []; }
    if (idx === -1) { groups.list.push(key); groups.items.push([el]); }
    else { groups.items[idx].push(el); }
  });

  if (groups.list) {
    groups.list.forEach(function (parent, i) {
      var items = groups.items[i];
      gsap.from(items, {
        opacity: 0,
        y: 56,
        scale: .97,
        duration: .8,
        ease: 'power3.out',
        stagger: .12,
        scrollTrigger: { trigger: parent, start: 'top 82%' }
      });
    });
  }

  /* ================= ПОЛАРОИДЫ: лёгкий доворот ================= */

  qa('.polaroid').forEach(function (card, i) {
    gsap.from(card, {
      rotate: i % 2 ? 9 : -9,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 88%' }
    });
  });

  /* ================= ПАРАЛЛАКС ФОНА И ДЕКОРА ================= */

  qa('[data-parallax]').forEach(function (el) {
    var speed = parseFloat(el.dataset.parallax) || .1;
    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el.closest('section') || document.body,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  // Круги медленно вращаются на десктопе
  if (isDesktop) {
    gsap.to('.bg-decor__rings', {
      rotate: 26,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.2 }
    });
  }

  /* ================= БЕГУЩАЯ СТРОКА: реакция на скролл ================= */

  var marqueeTrack = q('.marquee__track');
  if (marqueeTrack) {
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        var v = 1 + Math.min(Math.abs(self.getVelocity()) / 3000, 2.2);
        gsap.to(marqueeTrack, { timeScale: v, duration: .3, overwrite: true });
      }
    });
  }

  /* ================= ТЕЛЕФОН: наклон при скролле ================= */

  var phone = q('.phone');
  if (phone && isDesktop) {
    gsap.fromTo(phone,
      { rotateX: 9, rotateY: -11, y: 40 },
      {
        rotateX: 0, rotateY: 0, y: -20,
        ease: 'none',
        scrollTrigger: { trigger: '.app', start: 'top bottom', end: 'bottom top', scrub: .6 }
      }
    );
  }

  /* Пересчёт после подгрузки шрифтов/картинок */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
