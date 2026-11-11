'use strict';
const $=id=>document.getElementById(id), DATA=window.IG_DATA, EV=window.EVIDENCE;
const LOCALES={pt:'pt-BR',en:'en-US',zh:'zh-CN'}, HTML_LANGS={pt:'pt-BR',en:'en',zh:'zh-Hans'};
let lang='pt';
try{const requested=new URL(location.href).searchParams.get('lang');const saved=localStorage.getItem('origem-brasil-language');lang=LOCALES[requested]?requested:(LOCALES[saved]?saved:'pt');}catch{}
const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=(key,vars={})=>(window.TRANSLATIONS[lang][key]??window.TRANSLATIONS.pt[key]??key).replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');
const num=(n,d=0)=>new Intl.NumberFormat(LOCALES[lang],{maximumFractionDigits:d}).format(n);
const pct=n=>num(n,1);
const currency=(n,d=0)=>new Intl.NumberFormat(LOCALES[lang],{style:'currency',currency:'BRL',minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const date=s=>new Intl.DateTimeFormat(LOCALES[lang],{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const categoryLabel=s=>window.CATEGORY_TRANSLATIONS[lang]?.[s]??s;
const product=r=>window.PRODUCT_TRANSLATIONS[lang]?.[r.id]??r.product;
const evidenceText=e=>({...e,...window.EVIDENCE_TRANSLATIONS[lang]?.[EV.indexOf(e)]});
let filtered=[],sortField='name',sortDir=1,page=0,timer=null,catChart,sensChart,detailId=null;
const pageSize=12,reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
Chart.defaults.font.family='DM Sans, Noto Sans SC, Arial, sans-serif';Chart.defaults.color='#64746d';Chart.defaults.animation.duration=reduceMotion?0:350;
function countBy(rows,fn){return rows.reduce((o,r)=>{for(const k of fn(r))o[k]=(o[k]||0)+1;return o;},{});}
function evidenceFor(id){return EV.find(e=>e.ids.includes(id));}
function rowPass(r,skipState=false){
 const q=norm($('search').value.trim());
 return ($('scope').value==='all'||r.category!=='Serviços')&&(!$('category').value||r.category===$('category').value)&&
 (skipState||!$('state').value||r.states.includes($('state').value))&&(!$('type').value||r.type===$('type').value)&&r.year<=+$('year').value&&
 (!q||norm([r.name,r.product,product(r),r.category,categoryLabel(r.category),window.PRODUCT_TRANSLATIONS.en[r.id],window.PRODUCT_TRANSLATIONS.zh[r.id],r.territory,r.id,...r.states.map(x=>STATE_NAMES[x]),...r.states].join(' ')).includes(q));
}
function translatePage(){
 document.documentElement.lang=HTML_LANGS[lang];$('language').value=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>{el.innerHTML=t(el.dataset.i18n);});
 document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
 document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
 document.title='Origem Brasil · '+({pt:'Inteligência de Indicações Geográficas',en:'Geographical Indication Intelligence',zh:'地理标志数据洞察'}[lang]);
 document.querySelector('meta[name="description"]').content=t('heroText');
 [...$('category').options].forEach(o=>{if(o.value)o.textContent=categoryLabel(o.value);});
 $('play').setAttribute('aria-label',t(timer?'pause':'play'));
}
function setLanguage(next){if(!LOCALES[next])return;lang=next;try{localStorage.setItem('origem-brasil-language',lang);const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url);}catch{}translatePage();apply(false);simulate();if($('detail').open&&detailId)detail(detailId);}
function setup(){
 [...new Set(DATA.map(r=>r.category))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>$('category').add(new Option(categoryLabel(x),x)));
 Object.entries(STATE_NAMES).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).forEach(([uf,n])=>$('state').add(new Option(`${n} · ${uf}`,uf)));
 $('hero-total').textContent=num(DATA.filter(r=>r.category!=='Serviços').length);
 $('hero-map').innerHTML=MAP_PATHS.map(p=>`<path d="${p.d}"/>`).join('');
 $('map').innerHTML=MAP_PATHS.map(p=>`<path d="${p.d}" data-uf="${p.uf}" tabindex="0" role="button" aria-label="${esc(p.name)}"><title>${esc(p.name)}</title></path>`).join('');
 for(const path of $('map').querySelectorAll('path')){
  const uf=path.dataset.uf;
  path.addEventListener('click',()=>{pause();$('state').value=$('state').value===uf?'':uf;apply();});
  path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();path.dispatchEvent(new Event('click'));}});
  const tip=()=>{const counts=countBy(DATA.filter(r=>rowPass(r,true)),r=>r.states);$('map-tip').textContent=STATE_NAMES[uf]+' · '+t('recordCount',{n:num(counts[uf]||0)});};
  path.addEventListener('mouseenter',tip);path.addEventListener('focus',tip);
  const box=path.getBBox(),label=document.createElementNS('http://www.w3.org/2000/svg','text');
  label.setAttribute('x',box.x+box.width/2);label.setAttribute('y',box.y+box.height/2);label.setAttribute('text-anchor','middle');label.textContent=uf;$('map').appendChild(label);
 }
 for(const id of ['category','state','type','scope'])$(id).addEventListener('change',()=>{pause();apply();});
 $('language').addEventListener('change',e=>setLanguage(e.target.value));
 $('search').addEventListener('input',()=>{pause();apply();});$('year').addEventListener('input',()=>{pause();apply();});
 $('reset').onclick=()=>{pause();['search','category','state','type'].forEach(id=>$(id).value='');$('scope').value='products';$('year').value=2026;apply();};
 $('play').onclick=()=>{if(timer){pause();return;}if(+$('year').value>=2026)$('year').value=2002;apply();$('play').textContent='Ⅱ';$('play').setAttribute('aria-label',t('pause'));timer=setInterval(()=>{if(+$('year').value>=2026){pause();return;}$('year').value=+$('year').value+1;apply();},1000);};
 document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{sortDir=sortField===b.dataset.sort?-sortDir:1;sortField=b.dataset.sort;page=0;renderTable();});
 $('prev').onclick=()=>{page--;renderTable();};$('next').onclick=()=>{page++;renderTable();};$('export').onclick=exportCsv;
 $('detail').querySelector('.dialog-close').onclick=()=>$('detail').close();$('detail').addEventListener('close',()=>detailId=null);
 $('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}};
 ['price','volume','share','cost','fixed','premium'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='premium')$('premium-range').value=Math.min(100,Math.max(-20,+$('premium').value));simulate();}));
 $('premium-range').addEventListener('input',()=>{$('premium').value=$('premium-range').value;simulate();});
 $('reset-sim').onclick=()=>{Object.entries({price:20,volume:10000,share:40,cost:1.5,fixed:5000,premium:20,'premium-range':20}).forEach(([k,v])=>$(k).value=v);simulate();};
 $('source-ip').href=DATA.find(r=>r.type==='IP').source;$('source-do').href=DATA.find(r=>r.type==='DO').source;
 translatePage();apply();simulate();
}
function pause(){if(timer)clearInterval(timer);timer=null;$('play').textContent='▶';$('play').setAttribute('aria-label',t('play'));}
function apply(resetPage=true){
 filtered=DATA.filter(r=>rowPass(r));if(resetPage)page=0;
 const types=countBy(filtered,r=>[r.type]),states=new Set(filtered.flatMap(r=>r.states)),cats=countBy(filtered,r=>[r.category]);
 $('k-total').textContent=num(filtered.length);$('k-types').textContent=`${num(types.IP||0)} IP · ${num(types.DO||0)} DO`;
 $('k-states').textContent=num(states.size);$('k-cats').textContent=num(Object.keys(cats).length);
 const eligible=EV.filter(e=>e.ids.some(id=>filtered.some(r=>r.id===id))),reported=eligible.filter(e=>e.status==='relatado');
 const evidenceRecords=filtered.filter(r=>reported.some(e=>e.ids.includes(r.id))).length;
 $('k-evidence').textContent=num(reported.length);$('k-coverage').textContent=filtered.length?t('coverage',{pct:pct(100*evidenceRecords/filtered.length)}):t('noRecords');
 $('year-label').textContent=$('year').value;$('map-year').textContent=t('until',{year:$('year').value});
 $('filter-context').textContent=t($('state').value?'filterSelected':'filterAll',{state:STATE_NAMES[$('state').value],scope:t($('scope').value==='products'?'products':'productsServices'),year:$('year').value})+($('category').value?' · '+categoryLabel($('category').value):'')+($('type').value?' · '+$('type').value:'');
 renderMap();renderCategories(cats);renderInsights();renderEvidence(eligible);renderTable();
 const sorted=Object.entries(cats).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 $('insight').innerHTML=sorted.length?`<b>${esc(categoryLabel(sorted[0][0]))}</b><p>${esc(t('leadingFamily',{n:num(sorted[0][1]),pct:pct(100*sorted[0][1]/filtered.length)}))}</p>`:esc(t('emptyFilters'));
 $('chart-context').textContent=t('chartContext',{state:$('state').value?STATE_NAMES[$('state').value]:t('allBrazil'),year:$('year').value});
}
function renderMap(){
 const counts=countBy(DATA.filter(r=>rowPass(r,true)),r=>r.states),max=Math.max(1,...Object.values(counts));
 $('map').querySelectorAll('path').forEach(path=>{const uf=path.dataset.uf,n=counts[uf]||0,ratio=n/max;path.style.fill=n?`rgb(${Math.round(226-192*ratio)},${Math.round(234-126*ratio)},${Math.round(215-138*ratio)})`:'#edf0e6';path.style.opacity=$('state').value&&$('state').value!==uf?'.45':'1';path.classList.toggle('selected',$('state').value===uf);path.setAttribute('aria-pressed',String($('state').value===uf));path.setAttribute('aria-label',t('mapFilterAria',{state:STATE_NAMES[uf],n:num(n)}));path.querySelector('title').textContent=STATE_NAMES[uf]+' · '+t('recordCount',{n:num(n)});});
 $('map-tip').textContent=$('state').value?t('mapSelected',{state:STATE_NAMES[$('state').value]}):t('mapSelect');
}
function renderCategories(cats){
 const entries=Object.entries(cats).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));
 const config={type:'bar',data:{labels:entries.map(e=>categoryLabel(e[0])),datasets:[{data:entries.map(e=>e[1]),backgroundColor:entries.map((_,i)=>i===0?'#b65b3b':'#39785a'),borderRadius:4,barThickness:12}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>t('recordCount',{n:num(c.raw)})}}},scales:{x:{beginAtZero:true,ticks:{precision:0,font:{size:9}},grid:{color:'#e8ece2'},border:{display:false}},y:{grid:{display:false},ticks:{font:{size:lang==='zh'?11:10}},border:{display:false}}},onClick:(e,els)=>{if(els.length){$('category').value=entries[els[0].index][0];pause();apply();}}}};
 if(catChart)catChart.destroy();catChart=new Chart($('categories'),config);
}
function deriveInsights(rows,year){
 const stateCounts=countBy(rows,r=>r.states),ranking=Object.entries(stateCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),top=ranking.slice(0,3).map(x=>x[0]);
 const covered=rows.filter(r=>r.states.some(s=>top.includes(s))).length,recent=rows.filter(r=>r.year>=year-4&&r.year<=year).length,types=countBy(rows,r=>[r.type]);
 return {ranking,top,covered,recent,types,total:rows.length,concentration:rows.length?100*covered/rows.length:0,recentShare:rows.length?100*recent/rows.length:0,doShare:rows.length?100*(types.DO||0)/rows.length:0};
}
function renderInsights(){
 const year=+$('year').value,s=deriveInsights(filtered,year);
 const cards=s.total?[
 ['insightConcentration',pct(s.concentration)+'%',t('concentrationTitle',{n:s.top.length}),t('concentrationText',{states:s.top.map(x=>STATE_NAMES[x]).join(' · '),n:num(s.covered)}),'concentrationLimit'],
 ['insightRecent',num(s.recent),t('recentTitle',{from:year-4,to:year}),t('recentText',{pct:pct(s.recentShare)}),'recentLimit'],
 ['insightTypes',pct(s.doShare)+'%',t('mixTitle'),t('mixText',{ip:num(s.types.IP||0),do:num(s.types.DO||0)}),'mixLimit']
 ]:[];
 $('insight-cards').innerHTML=cards.length?cards.map(([label,n,title,body,note])=>`<article class="insight-card"><span class="mini-label">${esc(t(label))}</span><strong>${esc(n)}</strong><h3>${esc(title)}</h3><p>${esc(body)}</p><small>${esc(t(note))}</small></article>`).join(''):`<div class="empty">${esc(t('emptyFilters'))}</div>`;
 const max=s.ranking[0]?.[1]||1;
 $('state-ranking').innerHTML=s.ranking.length?s.ranking.slice(0,5).map(([uf,n],i)=>`<button class="rank-row" data-state="${uf}" aria-label="${esc(t('mapFilterAria',{state:STATE_NAMES[uf],n:num(n)}))}"><span class="rank-no">0${i+1}</span><span class="rank-name">${esc(STATE_NAMES[uf])}</span><span class="rank-track" aria-hidden="true"><i style="width:${n/max*100}%"></i></span><strong>${num(n)}</strong></button>`).join(''):`<p class="muted">${esc(t('noRecords'))}</p>`;
 $('state-ranking').querySelectorAll('[data-state]').forEach(b=>b.onclick=()=>{pause();$('state').value=$('state').value===b.dataset.state?'':b.dataset.state;apply();});
}
function renderEvidence(list){
 $('evidence-cards').innerHTML=list.length?list.map(original=>{const e=evidenceText(original);return `<article class="evidence-card ${e.status==='potencial'?'potential':''}"><span class="tag">${esc(e.kind.toLocaleUpperCase(LOCALES[lang]))} · ${e.year}</span><h3>${esc(e.name)}</h3><span class="location">${esc(e.product)}</span><strong class="percent">+${num(e.low)}${e.high!==e.low?'–'+num(e.high):''}%</strong><span class="metric">${esc(e.metric)}</span><p>${esc(e.description)}</p><p class="limit"><strong>${esc(t('evidenceLimit'))}</strong> ${esc(e.limit)}</p><a href="${esc(e.source)}" target="_blank" rel="noopener">${esc(e.label)} ↗</a></article>`;}).join(''):`<div class="empty">${esc(t('evidenceEmpty'))}</div>`;
 $('evidence-note').textContent=t('evidenceNote',{n:num(list.length)});
}
function sortedRows(){return [...filtered].sort((a,b)=>String(sortField==='product'?product(a):a[sortField]).localeCompare(String(sortField==='product'?product(b):b[sortField]),LOCALES[lang])*sortDir);}
function renderTable(){
 const rows=sortedRows(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.max(0,Math.min(page,pages-1));
 $('table-count').textContent=t('tableCount',{n:num(rows.length)});
 $('rows').innerHTML=rows.length?rows.slice(page*pageSize,(page+1)*pageSize).map(r=>{const ev=evidenceFor(r.id),p=product(r);return `<tr><td><button class="origin-button" data-id="${esc(r.id)}">${esc(r.name)} ↗</button></td><td>${esc(p.length>120?p.slice(0,117)+'…':p)}</td><td>${r.states.join(' / ')}</td><td><span class="type-badge ${r.type==='DO'?'do':''}" title="${esc(t(r.type==='DO'?'do':'ip'))}">${r.type}</span></td><td>${date(r.date)}</td><td>${ev?`<a href="#valor" class="evidence-link">${esc(t(ev.status==='potencial'?'expectation':'reported'))} ↗</a>`:`<span class="muted">${esc(t('unestimated'))}</span>`}</td></tr>`;}).join(''):`<tr><td colspan="6">${esc(t('emptyFilters'))}</td></tr>`;
 $('rows').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>detail(b.dataset.id));
 $('prev').disabled=page===0;$('next').disabled=page>=pages-1;$('page-info').textContent=t('pageInfo',{page:page+1,pages,n:num(rows.length)});
 document.querySelectorAll('[data-sort]').forEach(b=>b.closest('th').setAttribute('aria-sort',b.dataset.sort===sortField?(sortDir===1?'ascending':'descending'):'none'));
}
function detail(id){
 const r=DATA.find(r=>r.id===id);if(!r)return;detailId=id;const original=evidenceFor(id),e=original?evidenceText(original):null;
 $('detail-body').innerHTML=`<span class="eyebrow">${esc(r.id)} · ${esc(t(r.type==='IP'?'ip':'do'))}</span><h2>${esc(r.name)}</h2><p>${r.states.map(uf=>esc(STATE_NAMES[uf])).join(' · ')}</p><div class="dialog-meta"><span>${esc(t('firstRegistration',{date:date(r.date)}))}</span><span>${esc(t('currentType',{type:r.type}))}</span></div><h4>${esc(t('productService'))}</h4><p>${esc(product(r))}</p><h4>${esc(t('applicant'))}</h4><p lang="pt-BR">${esc(r.applicant)}</p><h4>${esc(t('valueEvidence'))}</h4><p>${e?esc(e.metric)+': +'+num(e.low)+(e.high!==e.low?'–'+num(e.high):'')+'%. '+esc(e.limit):esc(t('noEvidenceDetail'))}</p><details class="official-record"><summary>${esc(t('officialText'))}</summary><p class="original-note">${esc(t('originalNote'))}</p><h4>${esc(t('productService'))}</h4><p lang="pt-BR">${esc(r.product)}</p><h4>${esc(t('registrationChanges'))}</h4><p lang="pt-BR">${esc(r.date_text)}</p><h4>${esc(t('territory'))}</h4><p class="dialog-territory" lang="pt-BR">${esc(r.territory)}</p></details><a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(t('officialSource'))}</a>`;
 if(!$('detail').open)$('detail').showModal();
}
function calc(v){const units=v.volume*v.share/100,gross=v.price*v.premium/100*units,costs=v.cost*units+v.fixed;return {units,gross,costs,net:gross-costs,breakEven:v.price*units>0?100*costs/(v.price*units):null,priceWith:v.price*(1+v.premium/100)};}
function simulate(){
 const ids=['price','volume','share','cost','fixed','premium'],v=Object.fromEntries(ids.map(k=>[k,+$(k).value]));
 const valid=ids.every(k=>$(k).value!==''&&Number.isFinite(v[k])&&$(k).checkValidity());
 $('sim-error').textContent=valid?'':t('simInvalid');
 if(!valid){['sim-net','sim-gross','sim-costs','breakeven'].forEach(k=>$(k).textContent='—');$('sim-summary').textContent=t('simAdjust');$('sim-decision').textContent=t('simAdjust');if(sensChart){sensChart.destroy();sensChart=null;}return;}
 const c=calc(v);$('premium-label').textContent=pct(v.premium)+'%';$('sim-net').textContent=currency(c.net);$('sim-net').classList.toggle('negative',c.net<0);$('sim-gross').textContent=currency(c.gross);$('sim-costs').textContent=currency(c.costs);$('sim-summary').textContent=t('simSummary',{units:num(c.units,2),price:currency(c.priceWith,2)})+' '+t(c.net<0?'simNegative':'simPositive');
 $('breakeven').textContent=c.breakEven===null?t('breakEvenNA'):t('breakEven',{pct:num(c.breakEven,2)});
 const gap=c.breakEven===null?null:v.premium-c.breakEven;
 $('sim-decision').textContent=gap===null?t('simNoUnits'):Math.abs(gap)<0.000001?t('simAt'):t(gap>0?'simAbove':'simBelow',{gap:num(Math.abs(gap),2)});
 const ps=[-20,0,10,20,30,40,50,75,100,v.premium].sort((a,b)=>a-b).filter((x,i,a)=>i===0||x!==a[i-1]);
 if(sensChart)sensChart.destroy();sensChart=new Chart($('sensitivity'),{type:'line',data:{datasets:[{label:t('netLabel'),data:ps.map(p=>({x:p,y:calc({...v,premium:p}).net})),borderColor:'#367251',borderWidth:2,pointRadius:ps.map(p=>p===v.premium?5:2),pointBackgroundColor:ps.map(p=>p===v.premium?'#b65b3b':'#367251'),fill:false,tension:0},{label:t('zeroLabel'),data:ps.map(p=>({x:p,y:0})),borderColor:'#9caa99',borderDash:[4,4],pointRadius:0,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:c=>t('premiumTooltip',{pct:pct(c[0].parsed.x)}),label:c=>currency(c.parsed.y)}}},scales:{x:{type:'linear',title:{display:true,text:t('premiumAxis'),font:{size:10}},ticks:{font:{size:9}},grid:{display:false}},y:{ticks:{font:{size:9},callback:x=>t('thousands',{n:num(x/1000,1)})},grid:{color:'#e8ece2'},border:{display:false}}}}});
}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportCsv(){
 const cols=['id','name','product','product_original_pt','category','states','type','first_registration','registration_text_original_pt','applicant_original_pt','territory_original_pt','source','evidence_status','evidence_low_pct','evidence_high_pct','evidence_metric','evidence_year','evidence_limit','evidence_source','language'];
 const rows=sortedRows().map(r=>{const original=evidenceFor(r.id),e=original?evidenceText(original):null;return {...r,product:product(r),product_original_pt:r.product,category:categoryLabel(r.category),states:r.states.join('/'),first_registration:r.date,registration_text_original_pt:r.date_text,applicant_original_pt:r.applicant,territory_original_pt:r.territory,evidence_status:e?t(e.status==='potencial'?'expectation':'reported'):t('unestimated'),evidence_low_pct:e?.low??'',evidence_high_pct:e?.high??'',evidence_metric:e?.metric??'',evidence_year:e?.year??'',evidence_limit:e?.limit??'',evidence_source:e?.source??'',language:HTML_LANGS[lang]};});
 const cell=x=>'"'+String(x??'').replaceAll('"','""')+'"';download(t('csvName')+'-'+lang+'.csv','\ufeff'+[cols,...rows.map(r=>cols.map(c=>r[c]))].map(r=>r.map(cell).join(';')).join('\r\n'),'text/csv;charset=utf-8');
}
window.OrigemBrasil={calc,deriveInsights,get filtered(){return filtered;},evidenceFor,setLanguage,get language(){return lang;}};
setup();
