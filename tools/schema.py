"""Пересобирает микроразметку для поисковиков из самого index.html.

Так разметка не расходится с текстом: правите тексты — прогоняете скрипт,
и в JSON-LD попадает ровно то, что написано на странице.

    python3 tools/schema.py index.html

Собирает два блока и вставляет их между маркерами SCHEMA-AUTO:
  * FAQPage  — из <details class="faq__item"> (вопрос + ответ);
  * ItemList из Course — из карточек <article class="track">.

Блок MusicSchool в <head> ведётся руками: там адреса, цены и координаты,
которых в видимом тексте нет.
"""
import json, re, sys, html

BEGIN = '<!-- SCHEMA-AUTO:BEGIN — собрано tools/schema.py, руками не править -->'
END   = '<!-- SCHEMA-AUTO:END -->'

def clean(s):
    s = re.sub(r'<[^>]+>', '', s)          # разметка внутрь описаний не нужна
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

def faq(src):
    out = []
    for m in re.finditer(r'<details class="faq__item[^"]*">\s*'
                         r'<summary>(.*?)</summary>\s*'
                         r'<p>(.*?)</p>', src, re.S):
        out.append({
            "@type": "Question",
            "name": clean(m.group(1)),
            "acceptedAnswer": {"@type": "Answer", "text": clean(m.group(2))}
        })
    return out

def courses(src):
    out = []
    for m in re.finditer(r'<article class="track[^"]*">(.*?)</article>', src, re.S):
        block = m.group(1)
        t = re.search(r'<h3 class="track__title">(.*?)</h3>', block, re.S)
        sub = re.search(r'<p class="track__sub">(.*?)</p>', block, re.S)
        if not t:
            continue
        items = [clean(x) for x in re.findall(r'<li>(.*?)</li>', block, re.S)]
        desc = clean(sub.group(1)) if sub else ''
        if items:
            desc = (desc + '. Чему учим: ' + '; '.join(items) + '.').lstrip('. ')
        out.append({
            "@type": "Course",
            "name": clean(t.group(1)),
            "description": desc,
            "provider": {"@type": "MusicSchool", "name": "Harmony Vocal Mastery Studio",
                         "sameAs": "https://harmonyvocal.uz/"},
            # занятия очные, один на один, по расписанию — это и описываем
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "onsite",
                "courseWorkload": "PT1H",
                "location": {"@type": "Place", "address": {
                    "@type": "PostalAddress", "addressLocality": "Ташкент",
                    "addressCountry": "UZ"}}
            }
        })
    return out

def build(src):
    blocks = []
    q = faq(src)
    if q:
        blocks.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": q})
    c = courses(src)
    if c:
        blocks.append({"@context": "https://schema.org", "@type": "ItemList",
                       "itemListElement": [
                           {"@type": "ListItem", "position": i + 1, "item": x}
                           for i, x in enumerate(c)]})
    parts = []
    for b in blocks:
        parts.append('<script type="application/ld+json">\n'
                     + json.dumps(b, ensure_ascii=False, indent=1)
                     + '\n</script>')
    return q, c, BEGIN + '\n' + '\n'.join(parts) + '\n' + END

def main(path):
    src = open(path, encoding='utf-8').read()
    q, c, block = build(src)
    if BEGIN in src:
        src = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), lambda _: block, src, flags=re.S)
    else:
        # первый запуск — ставим перед </head>
        src = src.replace('</head>', block + '\n</head>', 1)
    open(path, 'w', encoding='utf-8').write(src)
    print(f'вопросов в FAQ: {len(q)}, направлений: {len(c)}')
    for x in q: print('  ?', x['name'][:70])
    for x in c: print('  ·', x['name'])

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'index.html')
