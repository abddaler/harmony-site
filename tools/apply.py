"""Возвращает правки из таблицы обратно в index.html.
Запуск: apply.py <правленая-таблица.md> [--dry]"""
import json, re, sys, subprocess

S='tools/'
subprocess.run([sys.executable, 'tools/extract.py', 'index.html', S+'rows.json'],
               check=True, capture_output=True)
rows = {r['id']: r for r in json.load(open(S+'rows.json', encoding='utf-8'))}
src  = open('index.html', encoding='utf-8').read()

# читаем правленую таблицу
edits, unknown = {}, []
for line in open(sys.argv[1], encoding='utf-8'):
    m = re.match(r'\|\s*((?:META|TITLE|MENU|HERO|MARQ|TRACK|FIRST|METHOD|TEACH|REV|PRICE|APP|FAQ|CONT|FOOT)-\d+)\s*\|[^|]*\|(.*)\|\s*$', line)
    if not m: continue
    rid, txt = m.group(1), m.group(2).strip().replace('\\|','|')
    edits[rid] = txt

changed, deleted = [], []
META_PAT = {
 'META-01': r'(<meta name="description" content=")([^"]*)(")',
 'META-02': r'(<meta property="og:title" content=")([^"]*)(")',
 'META-03': r'(<meta property="og:description" content=")([^"]*)(")',
 'META-04': r'(<meta name="twitter:description" content=")([^"]*)(")',
}
for rid, txt in edits.items():
    if rid in META_PAT:
        m = re.search(META_PAT[rid], src)
        if m and m.group(2) != txt:
            src = src[:m.start(2)] + txt + src[m.end(2):]
            changed.append((rid, m.group(2), txt))
        continue
    if rid not in rows: unknown.append(rid)

# текстовые узлы — с конца, чтобы смещения не поехали
for rid in sorted([r for r in edits if r in rows], key=lambda i: -rows[i]['start']):
    r, txt = rows[rid], edits[rid]
    cur = re.sub(r'\s+',' ', r['html']).strip()
    if txt == cur: continue
    if txt.upper() == 'УДАЛИТЬ':
        deleted.append((rid, cur)); continue
    src = src[:r['start']] + txt + src[r['end']:]
    changed.append((rid, cur, txt))
    # у заголовков текст продублирован в data-text для эффекта потёртости
    before = src[max(0, r['start']-200):r['start']]
    m = re.search(r'data-text="([^"]*)"[^<>]*>$', before)
    if m and m.group(1) == cur:
        a = r['start']-200+m.start(1) if r['start']>200 else m.start(1)
        src = src[:a] + txt + src[a+len(m.group(1)):]

if '--dry' not in sys.argv:
    open('index.html','w',encoding='utf-8').write(src)
print('строк в таблице: %d | изменено: %d | помечено УДАЛИТЬ: %d | неизвестных ID: %s'
      % (len(edits), len(changed), len(deleted), unknown or 'нет'))
for rid, a, b in changed[:12]:
    print('  %-10s %s\n             -> %s' % (rid, a[:60], b[:60]))
if deleted:
    print('\nтребуют ручного удаления (нельзя просто стереть текст, останется пустой блок):')
    for rid, a in deleted: print('  %-10s %s' % (rid, a[:70]))
