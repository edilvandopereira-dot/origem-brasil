const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('docs/app.js','utf8'),start=js.indexOf('function calc('),end=js.indexOf('\nfunction simulate()',start),box={};vm.createContext(box);vm.runInContext(js.slice(start,end)+';this.calculate=calc',box);
const base={price:20,volume:10000,share:40,cost:1.5,fixed:5000,premium:20};
let r=box.calculate(base);assert.equal(r.gross,16000);assert.equal(r.costs,11000);assert.equal(r.net,5000);assert.equal(r.breakEven,13.75);
r=box.calculate({...base,share:0});assert.equal(r.net,-5000);assert.equal(r.breakEven,null);
r=box.calculate({...base,premium:0});assert.equal(r.net,-11000);
r=box.calculate({...base,premium:-20});assert.equal(r.net,-27000);
r=box.calculate({...base,volume:0,fixed:0});assert.equal(r.net,0);assert.equal(r.breakEven,null);
console.log('Calculation checks passed: baseline, zero adoption, zero premium, negative premium, zero volume.');
