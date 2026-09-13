/* ===========================================================
   HARMONY — animations.js
   GSAP + ScrollTrigger. Если GSAP не загрузился — контент
   остаётся видимым, сайт работает как обычная статика.

   Правило, которое здесь нельзя нарушать: никаких сдвигов по
   вертикали у блоков контента. Раньше блоки выезжали снизу и
   на iOS зависали в промежуточном положении, наезжая друг на
   друга. Двигаем только прозрачность, размытие и масштаб —
   они не влияют на поток вёрстки.
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

  /* ================= ПЕРВЫЙ ЭКРАН ================= */

  // Заголовок анимируется построчно, поэтому сам h1 прячем не целиком —
  // иначе строки «проявятся» внутри невидимого родителя.
  var heroTitle = q('#hero .hero__title');
  var heroBits = qa('#hero .reveal').filter(function (el) { return el !== heroTitle; });
  var heroLines = qa('#hero .display__line');

  gsap.set(heroBits, { opacity: 0 });
  gsap.set(heroLines, { opacity: 0, filter: 'blur(14px)' });
  gsap.set('.hero__mic', { opacity: 0, scale: .93 });
  gsap.set('.hero__scroll', { opacity: 0 });

  function playHero() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero__mic', { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0)
      .to(qa('#hero .kicker'), { opacity: 1, duration: .6 }, .15)
      // строки заголовка выходят из расфокуса — как будто наводят резкость
      .to(heroLines, { opacity: 1, filter: 'blur(0px)', duration: 1, stagger: .13 }, .25)
      .to(qa('#hero .hero__lead, #hero .hero__cta, #hero .hero__facts'),
          { opacity: 1, duration: .8, stagger: .12 }, .75)
      .to('.hero__scroll', { opacity: 1, duration: .6 }, 1.3)
      .add(countUp, .9);

    tl.from('.header .logo__img', { opacity: 0, duration: .7 }, .1);
  }

  /* Цифры на первом экране набегают до своего значения */
  function countUp() {
    qa('.hero__facts b').forEach(function (el) {
      var target = el.textContent.trim();
      var num = parseInt(target.replace(/\D/g, ''), 10);
      if (!num || target.indexOf(':') !== -1) return;   // «1:1» не считаем
      var box = { v: 0 };
      el.style.minWidth = el.getBoundingClientRect().width + 'px';
      gsap.to(box, {
        v: num, duration: 1.1, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(box.v); },
        onComplete: function () { el.textContent = target; }
      });
    });
  }

  // Ждём, пока уйдёт прелоадер
  window.addEventListener('load', function () { setTimeout(playHero, 500); });
  setTimeout(function () {
    // страховка на случай долгой загрузки внешних ресурсов
    if (gsap.getProperty('.hero__mic', 'opacity') < 1) playHero();
  }, 4200);

  if (typeof ScrollTrigger === 'undefined') return;

  /* ================= ПАРАЛЛАКС ПОДСВЕТОК ================= */

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

  /* ================= БЛИК ЗА КУРСОРОМ ================= */
  /* Стеклянные карточки подсвечиваются там, где курсор. Только на
     десктопе и только при наведении — на телефонах смысла нет. */
  if (isDesktop && window.matchMedia('(hover: hover)').matches) {
    var glassCards = qa('.card, .track, .price, .teacher, .step, .sub, .terms, .gig');
    var pending = null;
    glassCards.forEach(function (el) {
      el.classList.add('has-sheen');
      var sheen = document.createElement('span');
      sheen.className = 'sheen';
      el.appendChild(sheen);
      el.addEventListener('pointermove', function (e) {
        if (pending) return;
        pending = requestAnimationFrame(function () {
          pending = null;
          var r = el.getBoundingClientRect();
          el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '50%');
        el.style.setProperty('--my', '-20%');
      });
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
