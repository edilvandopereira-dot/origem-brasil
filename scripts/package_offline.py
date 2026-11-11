from pathlib import Path
import re
r=Path(__file__).resolve().parents[1];d=r/'docs'
s=re.sub(r'<p><a href="offline.html".*?</a></p>','',(d/'index.html').read_text());css=(d/'style.css').read_text();css=re.sub(r"@import url\([^;]+;",'',css)
s=s.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
for file in ['chart.umd.min.js','data.js','i18n.js','app.js']:
 js=(d/file).read_text().replace('</script','<\\/script')
 s=s.replace(f'<script defer src="{file}"></script>','')
 s=s.replace('</body>','<script>'+js+'</script></body>')
# Browser-local JSON downloads also work in the standalone file.
s=s.replace('href="igs.json" download','href="data:application/json;charset=utf-8,'+__import__('urllib.parse',fromlist=['quote']).quote((d/'igs.json').read_text())+'" download="igs.json"')
s=s.replace('href="evidencias.json" download','href="data:application/json;charset=utf-8,'+__import__('urllib.parse',fromlist=['quote']).quote((d/'evidencias.json').read_text())+'" download="evidencias.json"')
(r/'Origem_Brasil_painel_offline.html').write_text(s)
(d/'offline.html').write_text(s)
print('Standalone offline HTML saved:',len(s.encode()),'bytes')
