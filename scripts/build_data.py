from pathlib import Path
import re,json,csv,unicodedata,hashlib
ROOT=Path(__file__).resolve().parents[1]
fields={'Número':'id','Requerente':'applicant','Nº de fls.':'pages','Nome geográfico/Gentílico':'name','País/UF':'country','Produto/Serviço':'product','Espécie':'type','Data do registro':'date_text','Delimitação':'territory'}
records=[];all_counts={}
for kind in ['ip','do']:
 text=(ROOT/f'data/raw/{kind}.txt').read_text().replace('\f','')
 chunks=re.split(r'(?m)^Número\s+',text)[1:]
 all_counts[kind]=len(chunks)
 for chunk in chunks:
  row={'id':chunk.splitlines()[0].strip(),'source_kind':kind,'source_page':None}
  current=None
  for line in chunk.splitlines()[1:]:
   line=line[:145]
   match=next((k for k in fields if re.match('^'+re.escape(k)+r'\s+',line)),None)
   if match:
    current=fields[match];row[current]=re.sub('^'+re.escape(match)+r'\s+','',line).strip()
   elif current and line.strip() and not line.strip().isdigit() and not re.match(r'^(Total|Nacionais|Estrangeiras)',line.strip()):
    # Column 149 onwards contains graphical presentation captions.
    val=line[:145].strip()
    if val: row[current]+=' '+val
  for k in row:
   if isinstance(row[k],str):row[k]=re.sub(r'\s{3,}.*$','',row[k]).strip()
  if not row.get('country','').startswith('BR'):continue
  row['states']=re.findall(r'\b(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b',row['country'])
  if row['id']=='IG201009':
   row['product']+=' '+row['type']+' '+row['date_text']
   row['date_text']='14/02/2012 como Indicação de Procedência, alterado em 10/06/2025 para Denominação de Origem'
   row['territory']=row['territory'].split('A área geográfica',1)[-1]
  dates=re.findall(r'\d{2}/\d{2}/\d{4}',row.get('date_text',''))
  row['date']= '-'.join(dates[0].split('/')[::-1]) if dates else None
  row['year']=int(dates[0][-4:]) if dates else None
  row['type']=kind.upper()
  row['type_date']='-'.join(dates[-1].split('/')[::-1]) if kind=='do' and 'para Denominação de Origem' in row.get('date_text','') else row['date']
  p=unicodedata.normalize('NFKD',row.get('product','')).encode('ascii','ignore').decode().lower()
  cats=[('Hortaliças e raízes',r'inhame|hortifruti|palmito|alho roxo'),('Outras culturas e extrativismo',r'guarana|warana|ginseng|urucum'),('Artesanato e manufaturas',r'algodao'),('Rochas e gemas',r'cristais'),('Doces e panificação',r'kasekuchen|melado|broas'),('Farinhas e grãos',r'polvilho|beiju'),('Especiarias e ervas',r'camomila'),('Frutas e derivados',r'laranjas'),('Pratos tradicionais',r'barreado'),('Serviços',r'servico|tecnolog'),('Destilados e bebidas',r'cerveja'),('Rochas e gemas',r'opala'),('Cafés',r'cafe'),('Vinhos e espumantes',r'vinho|espumante'),('Queijos e laticínios',r'queijo|leite'),('Cacau e chocolate',r'cacau|chocolate'),('Mel e própolis',r'\bmel\b|propolis'),('Destilados e bebidas',r'cachaca|aguardente|tiquira|destilado|cajuina'),('Artesanato e manufaturas',r'artesana|renda|bordado|panela|ceramica|pecas|tecido|couro|calcado|redes|texteis|argila'),('Rochas e gemas',r'marmore|granito|opala|gnaisse|quartzito|pedra'),('Carnes e pescados',r'carne|linguica|socol|peixe|pirarucu|camaro|camarao|ostras|tilapia|tambaqui|embutido'),('Frutas e derivados',r'\buva|manga|banana|abacaxi|goiaba|melao|morango|jabuticaba|limao|acai|\bmaca\b|pessego|caju|maracuja|tangerina'),('Farinhas e grãos',r'farinha|arroz|feijao'),('Doces e panificação',r'doce|biscoito|torta|pao|bolacha'),('Especiarias e ervas',r'erva|pimenta|curcuma|açafrao|acafrao|baunilha'),('Serviços',r'servico|tecnolog')]
  row['category']=next((cat for cat,pat in cats if re.search(pat,p)),'Outros produtos')
  row['source']='https://www.gov.br/inpi/pt-br/servicos/indicacoes-geograficas/arquivos/status-pedidos/'+('LISTADASINDICAESDEPROCEDNCIARECONHECIDAS.At29Setembro2026.pdf' if kind=='ip' else 'LISTADASDENOMINAESDEORIGEMRECONHECIDAS.At20Outubro2026.pdf')
  row['territory']=row['territory'].replace('Triân lo Mineiro','Triângulo Mineiro')
  row.pop('pages',None);records.append(row)
assert len({r['id'] for r in records})==len(records)
assert all(r['states'] and r['date'] and r.get('name') and r.get('product') for r in records)
(ROOT/'data/igs.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('Source totals:',all_counts,'BR',len(records))
for kind in ['IP','DO']:print(kind,len([r for r in records if r['type']==kind]))
for r in records:print(r['id'],r['name'],r['states'],r['year'],r['product'][:95],r['category'])
