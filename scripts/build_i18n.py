"""Build locale dictionaries from the authored HTML and reviewed translation tables."""
import json,re
from pathlib import Path
r=Path(__file__).resolve().parents[1]
s=(r/'docs/index.html').read_text()
d={'pt':{},'en':{},'zh':{}}
for m in re.finditer(r'<([\w-]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>(.*?)</\1>',s,re.S):
 d['pt'][m[2]]=m[3]
for m in re.finditer(r'<[^>]*\bdata-i18n-(aria|placeholder)="([^"]+)"[^>]*>',s):
 attr='aria-label' if m[1]=='aria' else 'placeholder'
 val=re.search(r'\b'+attr+r'="([^"]*)"',m[0])
 if val:d['pt'][m[2]]=val[1]
for line in (r/'data/interface_translations.tsv').read_text().splitlines():
 if not line:continue
 k,en,zh=line.split('|');d['en'][k]=en;d['zh'][k]=zh
for line in (r/'data/dynamic_translations.tsv').read_text().splitlines():
 if not line:continue
 k,pt,en,zh=line.split('|');d['pt'][k]=pt;d['en'][k]=en;d['zh'][k]=zh
for l in ['en','zh']:
 assert set(d[l])==set(d['pt']), (l,set(d['pt'])-set(d[l]),set(d[l])-set(d['pt']))
 for k,v in d['pt'].items():
  assert set(re.findall(r'\{\w+\}',v))==set(re.findall(r'\{\w+\}',d[l][k])),(l,k)
(r/'docs/i18n.js').write_text('window.TRANSLATIONS='+json.dumps(d,ensure_ascii=False)+';\n')
print('Validated',len(d['pt']),'keys in all 3 languages.')
data=json.loads((r/'data/igs.json').read_text());products={'en':{},'zh':{}};cats={'en':{},'zh':{}}
for line in (r/'data/product_translations.tsv').read_text().splitlines():
 if not line:continue
 i,en,zh=line.split('|');item=data[int(i)];products['en'][item['id']]=en;products['zh'][item['id']]=zh
assert all(len(products[l])==len(data) for l in products)
for line in (r/'data/category_translations.tsv').read_text().splitlines():
 k,en,zh=line.split('|');cats['en'][k]=en;cats['zh'][k]=zh
assert set(cats['en'])=={x['category'] for x in data}
with (r/'docs/i18n.js').open('a') as f:
 f.write('window.PRODUCT_TRANSLATIONS='+json.dumps(products,ensure_ascii=False)+';\n')
 f.write('window.CATEGORY_TRANSLATIONS='+json.dumps(cats,ensure_ascii=False)+';\n')
 f.write('window.EVIDENCE_TRANSLATIONS='+json.dumps(json.loads((r/'data/evidence_translations.json').read_text()),ensure_ascii=False)+';\n')
print('Validated',len(data),'product translations and',len(cats['en']),'product families per language.')
