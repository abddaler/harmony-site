import json, re, sys, html as H

S='tools/'
rows = json.load(open(S+'rows.json', encoding='utf-8'))
src  = open('index.html', encoding='utf-8').read()

BY_EL = {
 'title':'Заголовок вкладки браузера','p.kicker':'Надзаголовок секции',
 'h2.section__title':'ЗАГОЛОВОК СЕКЦИИ','p.section__lead':'Подзаголовок секции',
 'a.nav__link':'Пункт меню','a.btn':'Кнопка','p.hero__lead':'Текст под заголовком',
 'span.display__line':'Строка главного заголовка','span.hero__scroll-text':'Подпись «вниз»',
 'span.track__tag':'Метка над названием','h3.track__title':'Название направления',
 'p.track__sub':'Описание направления','p.track__meta':'Примечание под списком',
 'div.track__badge':'Бейдж на карточке','span.step__num':'Номер шага',
 'p.first__honest':'Абзац про пробное занятие','h3.myths__title':'Заголовок блока мифов',
 'p.myth__wrong':'Миф (зачёркнут)','p.myth__right':'Как на самом деле',
 'h3.teacher__name':'Имя педагога','p.teacher__role':'Специализация',
 'p.teacher__text':'Описание педагога','p.teacher__likes':'Строка «Слушает»',
 'p.teacher__time':'Расписание','p.teacher__place':'Филиал',
 'p.polaroid__author':'Подпись под отзывом','h3.gig__title':'Заголовок про концерты',
 'p.reviews__note':'Примечание про Instagram','div.price__badge':'Бейдж скидки',
 'h3.price__title':'Название тарифа','p.price__sub':'Что входит в тариф',
 'span.price__label':'Название строки цены','b.price__value':'Сумма',
 'p.price__save':'Выгода','h3.sub__title':'Заголовок про абонемент',
 'p.sub__lead':'Как считается абонемент','p.sub__example':'Пример расчёта',
 'h3.terms__title':'Заголовок условий','p.prices__pay':'Способы оплаты',
 'div.app__status':'Плашка «входит в занятия»','span.place__num':'Номер филиала',
 'h3.place__title':'Название филиала','p.place__addr':'Адрес',
 'p.place__text':'Как найти','p.place__metro':'Ориентир',
 'p.place__who':'Педагоги филиала','a.place__route':'Ссылка на маршрут',
 'span.contacts__label':'Подпись контакта','p.contacts__value':'Значение контакта',
 'a.social':'Соцсеть','button.map__tab':'Вкладка карты',
 'p.footer__tagline':'Описание в футере',
}
BY_PARENT = {
 'ul.track__list':'Пункт списка направления','details.faq__item':None,
 'div.marquee__track':'Слово в бегущей строке','nav.footer__nav':'Пункт меню в футере',
 'ul.terms__list':'Пункт условий','ul.app__features':'Пункт списка приложения',
 'ul.hero__facts':'Цифра на первом экране','li.step':None,'article.card':None,
 'figure.gig__photo':'Подпись под фото концерта','p.first__price-line':'Цифра под шагами',
 'p.sub__formula':'Формула абонемента','div.footer__socials':'Соцсеть в футере',
 'div.gig__text':'Текст про концерты','p.contacts__value':'Телефон',
 'div.map-stub':'Надпись при загрузке карты','p.footer__phone':'Телефон в футере',
}
def label(r):
    if r['el'] in BY_EL: return BY_EL[r['el']]
    par = r['parents'][-1] if r['parents'] else ''
    if par == 'details.faq__item':
        return 'Вопрос' if r['el']=='summary' else 'Ответ'
    if par == 'li.step':
        return 'Шаг: заголовок' if r['el'].startswith('h3') else 'Шаг: текст'
    if par == 'article.card':
        return 'Карточка: заголовок' if r['el'].startswith('h3') else 'Карточка: текст'
    if par == 'ul.hero__facts':
        return 'Цифра' if r['el'].startswith('b') else 'Подпись к цифре'
    if par == 'p.first__price-line':
        return 'Цифра' if r['el'].startswith('b') else 'Подпись к цифре'
    if par in BY_PARENT and BY_PARENT[par]: return BY_PARENT[par]
    return r['el']

# метатеги правятся отдельно — это не текстовые узлы
META = []
for name, pat, note in [
  ('META-01', r'<meta name="description" content="([^"]*)"', 'Описание сайта в поиске Google'),
  ('META-02', r'<meta property="og:title" content="([^"]*)"', 'Заголовок при отправке ссылки'),
  ('META-03', r'<meta property="og:description" content="([^"]*)"', 'Описание при отправке ссылки'),
  ('META-04', r'<meta name="twitter:description" content="([^"]*)"', 'Описание для Twitter/X'),
]:
    m = re.search(pat, src)
    if m: META.append((name, note, m.group(1)))

def cell(t):
    t = re.sub(r'\s+', ' ', t).strip()
    return t.replace('|', '\\|')

L = []
L.append('# Тексты сайта Harmony — таблица для правок\n')
L.append('Здесь весь текст, который виден на сайте, в том порядке, в каком человек его читает.\n')
L.append('**Как править:**\n')
L.append('1. Меняйте только колонку «Текст». Колонку «ID» не трогайте — по ней текст вернётся на своё место.')
L.append('2. Строку можно оставить как есть, если правка не нужна.')
L.append('3. Если внутри текста есть теги `<b>…</b>` или `<a href="…">…</a>` — сохраните их, это выделение и ссылки.')
L.append('4. Не удаляйте строки. Если фрагмент лишний — напишите в тексте `УДАЛИТЬ`.')
L.append('5. Длину держите близко к исходной: это карточки и кнопки, вёрстка рассчитана на текущий объём.\n')
L.append('---\n')
L.append('## Метатеги (не видны на странице, важны для поиска и ссылок)\n')
L.append('| ID | Что это | Текст |')
L.append('|---|---|---|')
for i,n,t in META: L.append('| %s | %s | %s |' % (i, n, cell(t)))

order = ['head','header','hero','marquee','tracks','first','method','teachers',
         'reviews','prices','app','faq','contacts','footer']
for sec in order:
    rs = [r for r in rows if r['section']==sec]
    if not rs: continue
    L.append('\n## %s\n' % rs[0]['name'])
    L.append('| ID | Что это | Текст |')
    L.append('|---|---|---|')
    for r in rs:
        L.append('| %s | %s | %s |' % (r['id'], label(r), cell(r['html'])))

open('harmony-texts.md','w',encoding='utf-8').write('\n'.join(L)+'\n')
print('строк в таблице:', len(rows)+len(META))
