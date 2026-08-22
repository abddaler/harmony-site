/* ===========================================================
   HARMONY — animations.js
   GSAP + ScrollTrigger. Если GSAP не загрузился — контент
   остаётся видимым, сайт работает как обычная статика.
   =========================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined' || reduced) return;

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    // iOS Safari меняет высоту вьюпорта при скролле (адресная строка).
    // Без этого ScrollTrigger пересчитывает позиции на ходу и блоки «прыгают».
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  var q  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var qa = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  var isDesktop = window.matchMedia('(min-width: 900px)').matches;

  /* ================= HERO: вступление ================= */

  // Заголовок анимируется построчно, поэтому сам h1 прячем не целиком —
  // иначе строки «проявятся» внутри невидимого родителя.
  var heroTitle = q('#hero .hero__title');
  var heroBits = qa('#hero .reveal').filter(function (el) { return el !== heroTitle; });
  var heroLines = qa('#hero .display__line');

  gsap.set(heroBits, { opacity: 0 });
  gsap.set(heroLines, { opacity: 0 });
  gsap.set('.hero__mic', { opacity: 0, scale: .94 });
  gsap.set('.hero__rings span', { opacity: 0, scale: .82 });
  gsap.set('.hero__scroll', { opacity: 0 });

  function playHero() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero__rings span', { opacity: 1, scale: 1, duration: 1.3, stagger: .12, ease: 'power2.out' }, 0)
      .to('.hero__mic', { opacity: 1, scale: 1, duration: 1.2 }, .1)
      .to(qa('#hero .kicker'), { opacity: 1, duration: .6 }, .15)
      .to(heroLines, { opacity: 1, duration: .9, stagger: .11 }, .25)
      .to(qa('#hero .hero__lead, #hero .hero__cta, #hero .hero__facts'),
          { opacity: 1, duration: .8, stagger: .12 }, .7)
      .to('.hero__scroll', { opacity: 1, duration: .6 }, 1.2);

    // Логотип проявляется вместе с первым экраном
    tl.from('.header .logo__img', { opacity: 0, duration: .7 }, .1);
  }

  // Ждём, пока уйдёт прелоадер
  window.addEventListener('load', function () { setTimeout(playHero, 500); });
  setTimeout(function () {
    // страховка на случай долгой загрузки внешних ресурсов
    if (gsap.getProperty('.hero__mic', 'opacity') < 1) playHero();
  }, 4200);

  if (typeof ScrollTrigger === 'undefined') return;

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
        // строка едет CSS-анимацией, поэтому ускоряем её через playbackRate
        if (!marqueeTrack.getAnimations) return;
        var v = 1 + Math.min(Math.abs(self.getVelocity()) / 3000, 2.2);
        marqueeTrack.getAnimations().forEach(function (a) { a.playbackRate = v; });
      }
    });
  }

  /* Пересчёт после подгрузки шрифтов/картинок */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
