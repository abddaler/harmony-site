/* ===========================================================
   HARMONY — main.js
   Интерфейс: прелоадер, меню, модалка записи, форма, карта
   =========================================================== */
(function () {
  'use strict';

  /* -----------------------------------------------------------
     НАСТРОЙКИ — то, что нужно поменять после генерации сайта
     ----------------------------------------------------------- */

  // true  — кнопки «Записаться» открывают модалку с виджетом Altegio
  // false — кнопки просто скроллят к секции #booking с инлайн-виджетом
  // Поставьте false, если embed Altegio вставлен только в секцию.
  var USE_MODAL = true;

  // ЗАМЕНИТЬ: логин Telegram студии (без @) — используется формой раннего доступа
  var TELEGRAM_USERNAME = 'harmonyvocal';

  /* ----------------------------------------------------------- */

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
    if (e.key === 'Escape') { closeNav(); closeModal(); }
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

  /* ================= МОДАЛКА ЗАПИСИ (ALTEGIO) ================= */
  var modal = $('#bookingModal');
  var lastFocused = null;

  function openModal() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    // следующий кадр — чтобы отработал transition
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    document.body.classList.add('nav-open');
    var closeBtn = $('.modal__close', modal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    setTimeout(function () { modal.hidden = true; }, 300);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (modal) {
    $$('[data-close]', modal).forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    // фокус не уходит за пределы модалки
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = $$('button, [href], input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])', modal)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  $$('[data-booking]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      if (!USE_MODAL) return; // обычный якорный переход к секции #booking
      e.preventDefault();
      closeNav();
      openModal();
    });
  });

  /* ================= ФОРМА РАННЕГО ДОСТУПА ================= */
  /* ВСТАВИТЬ ИНТЕГРАЦИЮ: замените обработчик на отправку в Formspree /
     Google Forms / свой Telegram-бот. Сейчас — без бэкенда: собираем текст
     и открываем чат в Telegram. */
  var form = $('#earlyForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#earlyName');
      var contact = $('#earlyContact');
      var msg = $('#earlyMsg');
      var ok = true;

      [name, contact].forEach(function (field) {
        var empty = !field.value.trim();
        field.classList.toggle('is-error', empty);
        if (empty) ok = false;
      });

      if (!ok) {
        msg.textContent = 'Заполните оба поля.';
        msg.style.color = '#ff8a8a';
        return;
      }

      var text = 'Ранний доступ к приложению Harmony. Имя: ' + name.value.trim() +
                 '. Контакт: ' + contact.value.trim();
      var url = 'https://t.me/' + TELEGRAM_USERNAME + '?text=' + encodeURIComponent(text);

      msg.style.color = '';
      msg.textContent = 'Открываем Telegram — отправьте сообщение, и мы добавим вас в список.';
      window.open(url, '_blank', 'noopener');
      form.reset();
    });

    $$('input', form).forEach(function (input) {
      input.addEventListener('input', function () { input.classList.remove('is-error'); });
    });
  }

  /* ================= ЛЕНИВАЯ ЗАГРУЗКА КАРТЫ ================= */
  /* ВСТАВИТЬ КАРТУ: добавьте на .contacts__map атрибут
     data-map-src="URL iframe Яндекс.Карт или Google Maps" —
     карта подгрузится только когда секция появится на экране. */
  var mapBox = $('.contacts__map');
  if (mapBox && mapBox.dataset.mapSrc && 'IntersectionObserver' in window) {
    var mapObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var iframe = document.createElement('iframe');
        iframe.src = mapBox.dataset.mapSrc;
        iframe.loading = 'lazy';
        iframe.title = 'Карта — как добраться до студии Harmony';
        iframe.setAttribute('allowfullscreen', '');
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        mapBox.innerHTML = '';
        mapBox.appendChild(iframe);
        obs.disconnect();
      });
    }, { rootMargin: '250px' });
    mapObserver.observe(mapBox);
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
      if (id === '#' || (link.hasAttribute('data-booking') && USE_MODAL)) return;
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
