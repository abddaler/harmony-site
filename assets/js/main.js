/* ===========================================================
   HARMONY — main.js
   Интерфейс: прелоадер, меню, слайдер, карта филиалов, FAQ
   =========================================================== */
(function () {
  'use strict';

  var $  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ================= ПРЕЛОАДЕР ================= */
  var preloader = $('#preloader');

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('is-hidden');
    document.body.classList.add('is-loaded');
    setTimeout(function () {
      if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 600);
  }

  window.addEventListener('load', function () { setTimeout(hidePreloader, 380); });
  // страховка: если что-то не догрузилось — не держим экран
  setTimeout(hidePreloader, 4000);

  /* ================= ХЕДЕР ПРИ СКРОЛЛЕ ================= */
  var header = $('#header');
  var lastY = -1;

  function onScroll() {
    var y = window.pageYOffset;
    if (y === lastY) return;
    lastY = y;
    if (header) header.classList.toggle('is-stuck', y > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ================= МОБИЛЬНОЕ МЕНЮ ================= */
  var burger = $('#burger');
  var nav = $('#nav');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    });
    $$('.nav__link, .nav__cta', nav).forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ================= АКТИВНЫЙ ПУНКТ МЕНЮ ================= */
  var navLinks = $$('.nav__link');
  var sections = navLinks
    .map(function (l) { return document.getElementById(l.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ================= СЛАЙДЕР СКРИНШОТОВ ================= */
  /* Прокрутка нативная (scroll-snap), JS добавляет стрелки и точки.
     Без JS слайдер всё равно листается свайпом. */
  (function initSlider() {
    var slider = $('#platformSlider');
    if (!slider) return;

    var viewport = $('[data-slider-viewport]', slider);
    var slides = $$('.slide', viewport);
    var dotsBox = $('[data-slider-dots]');
    var prev = $('[data-slider-prev]');
    var next = $('[data-slider-next]');
    if (!viewport || slides.length < 2) return;

    var dots = [];
    if (dotsBox) {
      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Экран ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsBox.appendChild(dot);
        dots.push(dot);
      });
    }

    function current() {
      return Math.round(viewport.scrollLeft / viewport.clientWidth);
    }

    function goTo(i) {
      var index = Math.max(0, Math.min(slides.length - 1, i));
      viewport.scrollTo({ left: index * viewport.clientWidth, behavior: 'smooth' });
    }

    function sync() {
      var i = current();
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === i); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }

    if (prev) prev.addEventListener('click', function () { goTo(current() - 1); });
    if (next) next.addEventListener('click', function () { goTo(current() + 1); });

    var ticking = false;
    viewport.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });

    window.addEventListener('resize', sync);
    sync();
  })();

  /* ================= ПОЯВЛЕНИЕ БЛОКОВ ================= */
  /* Нативный IntersectionObserver вместо ScrollTrigger: он гарантированно
     срабатывает даже при очень быстрой прокрутке, поэтому блоки не остаются
     полупрозрачными. Сама анимация — CSS-переход по opacity. */
  (function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('js-anim');

    // элементы одной группы проявляются друг за другом
    var groups = new Map();
    $$('.reveal-stagger').forEach(function (el) {
      var list = groups.get(el.parentNode) || [];
      list.push(el);
      groups.set(el.parentNode, list);
    });
    groups.forEach(function (list) {
      list.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i, 5) * 90 + 'ms';
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    $$('.reveal, .reveal-stagger').forEach(function (el) {
      if (el.closest('#hero')) return;   // первый экран ведёт таймлайн
      io.observe(el);
    });
  })();

  /* ================= КНОПКИ ЗАПИСИ ================= */
  /* Кнопки ведут на страницу онлайн-записи Altegio и открываются в новой
     вкладке. Здесь только закрываем мобильное меню, чтобы при возврате
     на сайт оно не осталось раскрытым. */
  $$('[data-booking]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeNav(); });
  });

  /* ================= КАРТА ФИЛИАЛОВ ================= */
  /* Грузится лениво: iframe появляется, когда блок подходит к экрану.
     Вкладки переключают филиал. */
  (function initMap() {
    var frame = $('[data-map-frame]');
    var tabs = $$('.map__tab');
    if (!frame || !tabs.length) return;

    var loaded = false;

    function show(tab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      var iframe = $('iframe', frame);
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.title = 'Карта — как добраться до студии Harmony';
        iframe.loading = 'lazy';
        iframe.setAttribute('allowfullscreen', '');
        frame.innerHTML = '';
        frame.appendChild(iframe);
      }
      iframe.src = tab.dataset.map;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { show(tab); });
    });

    function load() {
      if (loaded) return;
      loaded = true;
      show(tabs[0]);
    }

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries, o) {
        entries.forEach(function (e) { if (e.isIntersecting) { load(); o.disconnect(); } });
      }, { rootMargin: '300px' });
      obs.observe(frame);
    } else {
      load();
    }
  })();

  /* ================= FAQ ================= */
  /* Аккордеон нативный (<details>), JS нужен только чтобы пересчитать
     позиции ScrollTrigger после изменения высоты страницы. */
  $$('.faq__item').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  /* ================= МЕЛОЧИ ================= */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Плавный скролл с учётом фиксированного хедера (для браузеров без scroll-padding)
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      // виджет Altegio уже обработал клик — не мешаем ему
      if (e.defaultPrevented) return;
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeNav();
      var top = target.getBoundingClientRect().top + window.pageYOffset - (window.innerWidth >= 900 ? 80 : 64);
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });
})();
