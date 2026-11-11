from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[1]
data=json.loads((R/'data/igs.json').read_text())
codes={'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'}
names={'RO':'Rondônia','AC':'Acre','AM':'Amazonas','RR':'Roraima','PA':'Pará','AP':'Amapá','TO':'Tocantins','MA':'Maranhão','PI':'Piauí','CE':'Ceará','RN':'Rio Grande do Norte','PB':'Paraíba','PE':'Pernambuco','AL':'Alagoas','SE':'Sergipe','BA':'Bahia','MG':'Minas Gerais','ES':'Espírito Santo','RJ':'Rio de Janeiro','SP':'São Paulo','PR':'Paraná','SC':'Santa Catarina','RS':'Rio Grande do Sul','MS':'Mato Grosso do Sul','MT':'Mato Grosso','GO':'Goiás','DF':'Distrito Federal'}
geo=json.loads((R/'data/raw/brazil_states.geojson').read_text())
def project(pt):
 x,y=pt[:2];return [(x+74)*15+22,(6-y)*15+20]
paths=[]
for f in geo['features']:
 uf=codes[f['properties']['codarea']]; polys=f['geometry']['coordinates'] if f['geometry']['type']=='MultiPolygon' else [f['geometry']['coordinates']]
 seg=[]
 for poly in polys:
  for ring in poly:
   pts=[project(pt) for pt in ring];seg.append('M'+'L'.join(f'{p[0]:.1f},{p[1]:.1f}' for p in pts)+'Z')
 paths.append({'uf':uf,'name':names[uf],'d':''.join(seg)})
sebrae='https://agenciasebrae.com.br/wp-content/uploads/2023/01/indicacao-geografica-dez-2022.pdf'
evidence=[
 {'ids':['IG200002'],'name':'Vale dos Vinhedos','product':'Vinhos · RS','low':20,'high':30,'kind':'Estudo de caso','status':'relatado','year':2013,'metric':'Acréscimo de preço relatado','description':'Molinari e Padula descrevem um diferencial de preço de 20% a 30% para os vinhos que atendiam às exigências da IP.','limit':'Pesquisa qualitativa. Sem comparação controlada; a faixa não é uma estimativa causal nem uma cotação atual.','source':'https://www.scielo.br/j/resr/a/jyW4VgjpJtbxcmhCmXR8kvD/?lang=pt','label':'RESR · Molinari & Padula, 2013'},
 {'ids':['IG201002'],'name':'Canastra','product':'Queijo · MG','low':214,'high':214,'kind':'Levantamento divulgado','status':'relatado','year':2022,'metric':'Valorização acumulada divulgada','description':'Infográfico do Sebrae de dezembro de 2022 informa aumento acumulado de 214% no preço do queijo.','limit':'Não informa nesta peça a amostra, os preços inicial e final, a janela exata ou ajuste pela inflação. Não isola o papel do selo.','source':sebrae,'label':'Sebrae · infográfico, dez. 2022'},
 {'ids':['BR402014000002-6'],'name':'Venda Nova do Imigrante','product':'Socol · ES','low':535,'high':535,'kind':'Levantamento divulgado','status':'relatado','year':2022,'metric':'Valorização acumulada divulgada','description':'O mesmo infográfico informa valorização acumulada de 535% para o socol.','limit':'A peça cita IG desde 2013, mas a lista oficial INPI registra 12/06/2018. Período e amostra não informados; manter a divergência visível. Não atribuir o aumento integral à IG.','source':sebrae,'label':'Sebrae · infográfico, dez. 2022'},
 {'ids':['IG200902'],'name':'Região do Jalapão','product':'Capim dourado · TO','low':20,'high':50,'kind':'Expectativa declarada','status':'potencial','year':2026,'metric':'Potencial mencionado por pesquisador','description':'Notícia da UFT de abril de 2026 cita uma possibilidade de aumento de 20% a 50% no preço final.','limit':'É expectativa, não ganho medido. A notícia relata entraves para implementação do selo; não confirma sua resolução após abril de 2026.','source':'https://www.uft.edu.br/noticias/capim-dourado-selo-de-origem-pode-proteger-tradicao-e-impulsionar-desenvolvimento-regional','label':'UFT · notícia de pesquisa, abr. 2026'}]
for e in evidence:
 assert all(any(r['id']==i for r in data) for i in e['ids'])
(R/'data/evidencias.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2))
(R/'docs/data.js').write_text('window.IG_DATA='+json.dumps(data,ensure_ascii=False)+';\nwindow.MAP_PATHS='+json.dumps(paths,ensure_ascii=False)+';\nwindow.STATE_NAMES='+json.dumps(names,ensure_ascii=False)+';\nwindow.EVIDENCE='+json.dumps(evidence,ensure_ascii=False)+';')
print('Prepared',len(data),'records,',len(paths),'states,',len(evidence),'case sources')
