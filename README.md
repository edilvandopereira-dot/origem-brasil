# Origem Brasil

Portal interativo de inteligência de indicações geográficas brasileiras. Atlas, filtros, insights e simulador de cenários em **português, inglês e chinês simplificado**.

## O portal

- Mapa interativo por estado e linha do tempo de primeiros registros.
- Filtros por produto, território, família, tipo de reconhecimento e escopo.
- Insights de concentração territorial, registros recentes e composição IP/DO.
- Evidências publicadas sobre valorização, com fontes e limitações.
- Simulador de receita adicional, custos incrementais e prêmio de equilíbrio.
- Consulta dos registros, exportação CSV e versão autônoma offline.

## Dados e limites

Fotografia das listas oficiais do INPI: IP até 29/09/2026 e DO até 20/10/2026. São 172 registros brasileiros (137 IP e 35 DO), sendo 171 de produtos e um de serviços, excluído no filtro inicial. Consulta e extração em 27/10/2026. A base não se atualiza automaticamente.

A unidade de análise é o número de registro do INPI. Produtos ou espécies distintos com o mesmo nome geográfico permanecem separados. Uma ocorrência multiestadual conta uma vez no total nacional e em cada UF abrangida. Na concentração dos três estados líderes, o percentual usa registros únicos. Contagens não medem produção, receita ou qualidade. Famílias de produtos são classificação editorial. A linha do tempo considera a primeira data informada nas listas atuais, não o estoque histórico integral.

Quatro casos de valorização foram curados: Vale dos Vinhedos, Canastra, socol de Venda Nova do Imigrante e capim dourado do Jalapão. Relatos e expectativas medem coisas distintas e não isolam efeitos causais. A divergência da data de registro do socol na divulgação do Sebrae está sinalizada. Ausência de evidência é não estimada, nunca zero.

O simulador mantém o volume total constante e desconta apenas custos incrementais. Não calcula lucro total, retorno sobre capital nem valor adicionado das Contas Nacionais. Os valores permanecem em reais brasileiros (BRL), independentemente do idioma.

## Idiomas

Seletor disponível no topo. Links podem incluir `?lang=pt`, `?lang=en` ou `?lang=zh`. A preferência é preservada no navegador. São 200 mensagens da interface, 172 descrições de produtos, 17 famílias e quatro casos de evidência. Traduções informativas; nomes próprios e textos oficiais de requerentes, delimitação e alterações são preservados em português para conferência com o INPI.

## Estrutura

- `docs/`: site pronto para hospedagem no GitHub Pages.
- `data/`: registros, evidências, traduções e fontes oficiais utilizadas.
- `scripts/`: preparação dos dados, traduções, validação e versão offline.

Site estático em HTML, CSS e JavaScript; sem servidor de aplicação, banco de dados ou chaves de API. Chart.js distribuído localmente. As fontes Google Fonts são opcionais e têm alternativas locais.

## Executar e validar

Requisitos para os scripts: Python 3 e Node.js. A execução do portal requer apenas um navegador moderno.

```sh
python3 scripts/build_i18n.py
python3 scripts/package_offline.py
python3 scripts/verify.py
node scripts/verify_calc.cjs
node scripts/verify_portal.cjs
node --check docs/app.js
python3 -m http.server 8000 --directory docs
```

Abra `http://localhost:8000`. Alternativamente, abra `docs/offline.html` diretamente no navegador.

## Atualizar os dados

Revise os PDFs em `data/raw/`, suas extrações de texto e os casos de conversão IP→DO antes de executar `scripts/build_data.py`. O parser contém correções documentadas para o layout de Vales da Uva Goethe e hifenização de Triângulo Mineiro. Revise as traduções de produtos: seus índices seguem a ordem de `data/igs.json`. Os testes de contagem são vinculados à fotografia de outubro de 2026 e devem ser revistos numa atualização da base.

Depois de revisar os dados:

```sh
python3 scripts/prepare_assets.py
cp data/igs.json docs/igs.json
cp data/evidencias.json docs/evidencias.json
python3 scripts/build_i18n.py
python3 scripts/package_offline.py
```

A malha de UFs é do IBGE, simplificada. Não representa os polígonos das IGs. Fonte original: https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF

## GitHub Pages

Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e pasta `/docs`. Os caminhos dos recursos são relativos e funcionam em um site de projeto. Não é necessário domínio próprio.

## Créditos e fontes

Projeto de Edilvando Pereira Eufrazio. Fontes citadas no portal: INPI, IBGE, RESR, Sebrae e UFT. Este é um projeto independente de exploração e análise de dados, sem caráter de publicação oficial desses órgãos. Os documentos e componentes de terceiros conservam seus direitos e condições de uso. Consulte `THIRD_PARTY_NOTICES.md`.
