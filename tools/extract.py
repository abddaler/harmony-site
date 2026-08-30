"""Извлекает видимый текст index.html с точными смещениями.
Один и тот же файл всегда даёт одни и те же ID — по ним возвращаем правки."""
import json, re, sys

SKIP = {'script','style','svg','noscript'}
VOID = {'br','img','input','meta','link','hr','area','base','col','embed','source','track','wbr'}
SECTION_NAMES = {
 'head':'Вкладка браузера','header':'Шапка сайта','hero':'Первый экран','marquee':'Бегущая строка','tracks':'Направления',
 'first':'Первое занятие','method':'Как мы учим','teachers':'Педагоги',
 'reviews':'Ученики и концерты','prices':'Цены','app':'Приложение',
 'faq':'Вопросы','contacts':'Контакты','footer':'Футер'}

src = open(sys.argv[1], encoding='utf-8').read()
TAG = re.compile(r'<(/?)([a-zA-Z][\w-]*)([^>]*?)(/?)>|<!--[\s\S]*?-->')

class N:
    __slots__=('tag','attrs','inner_start','inner_end','kids','text')
    def __init__(s,tag,attrs,inner_start):
        s.tag=tag; s.attrs=attrs; s.inner_start=inner_start
        s.inner_end=None; s.kids=[]; s.text=''

root = N('#root', {}, 0); stack=[root]; skip=0; pos=0
for m in TAG.finditer(src):
    if m.group(0).startswith('<!--'):
        pos = m.end(); continue
    closing, tag, raw, selfclose = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
    if not skip and src[pos:m.start()].strip():
        stack[-1].text += src[pos:m.start()]
    pos = m.end()
    if tag in SKIP:
        skip = skip + 1 if not closing else max(0, skip-1); continue
    if skip or tag in VOID or selfclose: continue
    if closing:
        for i in range(len(stack)-1, 0, -1):
            if stack[i].tag == tag:
                stack[i].inner_end = m.start(); del stack[i:]; break
    else:
        attrs = dict(re.findall(r'([\w:-]+)\s*=\s*"([^"]*)"', raw))
        n = N(tag, attrs, m.end()); stack[-1].kids.append(n); stack.append(n)

rows=[]
def walk(n, sec, chain=()):
    if n.tag=='section' and n.attrs.get('id'): sec = n.attrs['id']
    elif n.tag=='header' and n.attrs.get('id')=='header': sec='header'
    elif n.tag=='footer': sec='footer'
    elif 'marquee' in n.attrs.get('class',''): sec='marquee'
    cls = n.attrs.get('class','')
    me = n.tag + ('.'+cls.split()[0] if cls else '')
    if n.text.strip() and n.inner_end is not None:
        rows.append({'section':sec, 'el': me, 'parents': list(chain)[-3:],
                     'start':n.inner_start, 'end':n.inner_end,
                     'html': src[n.inner_start:n.inner_end].strip()})
        return
    nxt = chain + (me,) if cls else chain
    for k in n.kids: walk(k, sec, nxt)
walk(root, 'head', ())

# бегущая строка продублирована для бесшовной прокрутки — вторую копию не показываем
seen=set(); out=[]
for r in rows:
    if r['section']=='marquee':
        if r['html'] in seen: continue
        seen.add(r['html'])
    out.append(r)
rows=out

cnt={}
for r in rows:
    k=r['section']; cnt[k]=cnt.get(k,0)+1
    PREFIX={'head':'TITLE','header':'MENU','hero':'HERO','marquee':'MARQ','tracks':'TRACK',
            'first':'FIRST','method':'METHOD','teachers':'TEACH','reviews':'REV',
            'prices':'PRICE','app':'APP','faq':'FAQ','contacts':'CONT','footer':'FOOT'}
    r['id']='%s-%02d'%(PREFIX.get(k, k.upper()[:4]), cnt[k])
    r['name']=SECTION_NAMES.get(k,k)
json.dump(rows, open(sys.argv[2],'w',encoding='utf-8'), ensure_ascii=False, indent=1)
print('фрагментов:', len(rows))
for s in dict.fromkeys(r['section'] for r in rows):
    print('  %-10s %d' % (s, sum(1 for r in rows if r['section']==s)))
