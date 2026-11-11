'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const box={window:{}};vm.createContext(box);vm.runInContext(fs.readFileSync('docs/i18n.js','utf8'),box);
const {TRANSLATIONS:T,PRODUCT_TRANSLATIONS:P,CATEGORY_TRANSLATIONS:C,EVIDENCE_TRANSLATIONS:E}=box.window;
const data=JSON.parse(fs.readFileSync('data/igs.json','utf8')),evidence=JSON.parse(fs.readFileSync('data/evidencias.json','utf8'));
for(const locale of ['en','zh']){
 assert.deepEqual(Object.keys(T[locale]).sort(),Object.keys(T.pt).sort());
 for(const [key,value] of Object.entries(T.pt)){
  assert.equal(typeof T[locale][key],'string');assert.ok(T[locale][key].trim());
  assert.deepEqual((value.match(/\{\w+\}/g)||[]).sort(),(T[locale][key].match(/\{\w+\}/g)||[]).sort(),key);
 }
 for(const row of data){assert.ok(P[locale][row.id],`${locale} product ${row.id}`);assert.ok(C[locale][row.category],`${locale} category ${row.category}`);}
 assert.equal(E[locale].length,evidence.length);
 for(const entry of E[locale]) for(const key of ['product','kind','metric','description','limit','label'])assert.ok(entry[key]);
}
const app=fs.readFileSync('docs/app.js','utf8'),html=fs.readFileSync('docs/index.html','utf8');
for(const match of html.matchAll(/data-i18n(?:-aria|-placeholder)?="([^"]+)"/g)) assert.ok(T.pt[match[1]],match[1]);
for(const match of app.matchAll(/\bt\('([^']+)'/g))assert.ok(T.pt[match[1]],match[1]);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'duplicate HTML ids');
for(const match of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),`missing element ${match[1]}`);
const countStart=app.indexOf('function countBy('),countEnd=app.indexOf('\nfunction evidenceFor',countStart);
const insightStart=app.indexOf('function deriveInsights('),insightEnd=app.indexOf('\nfunction renderInsights',insightStart);
vm.runInContext(app.slice(countStart,countEnd)+app.slice(insightStart,insightEnd)+';this.derive=deriveInsights;',box);
const fixture=[{states:['A','B'],year:2022,type:'IP'},{states:['A','C'],year:2021,type:'DO'},{states:['D'],year:2026,type:'DO'},{states:['E'],year:2010,type:'IP'}];
let s=box.derive(fixture,2026);assert.equal(s.covered,2,'multi-state records must not double-count');assert.equal(s.concentration,50);assert.equal(s.recent,2);assert.equal(s.recentShare,50);assert.equal(s.doShare,50);assert.equal(s.ranking[0][0],'A');assert.equal(s.ranking[0][1],2);
s=box.derive([],2026);assert.equal(s.total,0);assert.equal(s.concentration,0);assert.equal(s.recentShare,0);assert.equal(s.doShare,0);
s=box.derive([{states:['MT'],year:2026,type:'DO'}],2026);assert.equal(s.top.length,1);assert.equal(s.concentration,100);assert.equal(s.doShare,100);
const products=data.filter(r=>r.category!=='Serviços'),actual=box.derive(products,2026);assert.equal(actual.total,171);assert.ok(actual.concentration<=100);assert.ok(actual.covered<=171);
const standalone=fs.readFileSync('docs/offline.html','utf8');assert.ok(standalone.includes('window.TRANSLATIONS='));assert.ok(!/<script[^>]+src=/.test(standalone));assert.ok(!standalone.includes('@import url('));
console.log(JSON.stringify({result:'passed',languages:Object.keys(T),interfaceKeys:Object.keys(T.pt).length,translatedProducts:data.length,productFamilies:Object.keys(C.en).length,insights:{top:actual.top,covered:actual.covered,concentration:actual.concentration,recent:actual.recent,doShare:actual.doShare},checks:['locale coverage','placeholder parity','DOM references','unique HTML ids','multi-state deduplication','five-year window','empty selection','single-state selection','standalone dependencies']},null,2));
