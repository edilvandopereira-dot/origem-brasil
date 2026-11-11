from pathlib import Path
import json,re,hashlib,collections
R=Path(__file__).resolve().parents[1];rows=json.loads((R/'data/igs.json').read_text());ev=json.loads((R/'data/evidencias.json').read_text())
assert len(rows)==172
assert collections.Counter(r['type'] for r in rows)=={'IP':137,'DO':35}
assert len({r['id'] for r in rows})==172
assert sum(r['category']!='Serviços' for r in rows)==171
assert len(set(s for r in rows for s in r['states']))==26
assert len([r for r in rows if r['category']=='Cafés' and 'MG' in r['states']])==10
assert next(r for r in rows if r['id']=='BR402014000002-6')['date']=='2018-06-12'
assert next(r for r in rows if r['id']=='IG201009')['type_date']=='2025-06-10'
assert all(any(r['id']==i for r in rows) for e in ev for i in e['ids'])
assert len([e for e in ev if e['status']=='relatado'])==3
for kind,n in [('ip',138),('do',45)]:
 raw=(R/f'data/raw/{kind}.txt').read_text().replace('\f','')
 assert len(re.findall(r'(?m)^Número\s+',raw))==n
assert not any(ord(c)<32 for r in rows for v in r.values() if isinstance(v,str) for c in v)
report={'date':'2026-10-27','checks':'passed','records':172,'products':171,'services':1,'IP':137,'DO':35,'states':26,'evidence_cases_reported':3,'evidence_cases_prospective':1,'sha256':{str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((R/'data/raw').glob('*.pdf'))}}
(R/'data/verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
