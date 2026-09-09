'use strict';
/* Dedicated counterfactual test of the actual application, independent of
   audit-scientific.cjs. No network, modeled ionosphere functions are not mocked.
   Usage: node verify-screening-monotonicity.cjs [index.html] [fixture.json]
          [report.json] [optional-original-r1.html]
   Only Table 1b foE varies; antenna, geometry, UTC, R12 and noise remain fixed.
   This verifies a software invariant, not predictive accuracy or ITU conformity. */
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const file=process.argv[2]||path.join(__dirname,'index.html');
const fixtureFile=process.argv[3]||path.join(__dirname,'screening-fixture.json');
const reportFile=process.argv[4]||path.join(__dirname,'screening-monotonicity-results.json');
const fixtureBytes=fs.readFileSync(fixtureFile),fixture=JSON.parse(fixtureBytes);
const checks=[];
function check(name,ok,detail){checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});}
function environment(htmlFile){
  const html=fs.readFileSync(htmlFile,'utf8');
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const app=scripts.filter(s=>!s[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
  const cut=app.lastIndexOf('\ninitMap();');if(cut<0)throw Error('Application bootstrap boundary not found');
  const sandbox={document:{getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},body:{dataset:{}},documentElement:{lang:'pt-BR'},hidden:true},
    navigator:{onLine:false},location:{protocol:'file:',hostname:'',href:'file:///index.html'},
    localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},
    MutationObserver:class{observe(){}disconnect(){}},fetch:async()=>{throw Error('Network disabled in invariant test');},
    console:{log(){},warn(){},error(){},table(){}},URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
    atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
  sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
  vm.runInContext(app.slice(0,cut),sandbox,{timeout:30000});
  const run=code=>vm.runInContext(code,sandbox,{timeout:30000});
  run(`globalThis.fixture=${JSON.stringify(fixture)};
    (function freeze(x){Object.freeze(x);for(const v of Object.values(x))if(v&&typeof v==='object')freeze(v);})(fixture);
    S.r12=fixture.r12;QTH.lat=fixture.qth.lat;QTH.lon=fixture.qth.lon;S.idioma='en';
    globalThis.fixedConfig=Object.freeze({...fixture.station,latRx:fixture.qth.lat,lonRx:fixture.qth.lon});`);
  return {run,html,hash:sha(html)};
}
const env=environment(file),run=env.run;
const invariantKeys=['Pr','Lb','Li','Lm','BMUF','ele','GtTOA','GrTOA','Ew'];
const identity=m=>m.camada+m.n;
const near=(a,b)=>a===b||(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=fixture.toleranceDb);
const aggregate=(modes,key)=>10*Math.log10(modes.reduce((sum,m)=>sum+10**(m[key]/10),0));
const productionSignature=result=>{
  const copy=JSON.parse(JSON.stringify(result,(_key,value)=>typeof value==='number'&&!Number.isFinite(value)?String(value):value));
  if(copy){
    delete copy.Es;delete copy.screeningAudit;delete copy.auditOnly;
    // Root Ew existed in r1 and MUST still be compared. Only modal Ew is new.
    for(const mode of copy.modos||[])delete mode.Ew;
  }
  return JSON.stringify(copy);
};
const comparisons=[];
check('Fixture frequency matches actual band mapping',run('BAND_FREQ[fixture.band]===fixture.frequencyMHz'));
check('Named domain has inclusive cited bounds',run("Object.isFrozen(P533_FREQUENCY_DOMAIN)&&P533_FREQUENCY_DOMAIN.minMHz===2&&P533_FREQUENCY_DOMAIN.maxMHz===30&&P533_FREQUENCY_DOMAIN.reference.includes('recommends 1')"));
for(const [input,expected] of [['1.999999',false],['2',true],['30',true],['30.000001',false],['NaN',false],['Infinity',false],["'7'",false]]){
  check('Domain boundary '+input,run(`p533FrequencyInDomain(${input})`)===expected);
  const actual=run(`(()=>{const saved=BAND_FREQ[fixture.band];try{BAND_FREQ[fixture.band]=${input};return enlaceAbsolutoCore(-15.8,-47.9,fixture.band,new Date(fixture.utc),fixedConfig);}finally{BAND_FREQ[fixture.band]=saved;}})()`);
  check('Core consumes domain boundary '+input,expected?!!actual&&!actual.scientificUnavailable:actual===null||actual.reason==='FREQUENCY_OUTSIDE_P533_2_TO_30_MHZ');
}
for(const [index,circuit] of fixture.circuits.entries()){
  run(`globalThis.circuit=fixture.circuits[${index}];`);
  const call=`enlaceAbsolutoCore(circuit.lat,circuit.lon,fixture.band,new Date(fixture.utc),fixedConfig`;
  const before=run(call+')');
  const stateBefore=run('JSON.stringify({qth:[QTH.lat,QTH.lon],r12:S.r12,fixture,fixedConfig})');
  const context=run(`p533F2PathContext(QTH.lat,QTH.lon,circuit.lat,circuit.lon,greatCircleDist(QTH.lat,QTH.lon,circuit.lat,circuit.lon),8,17+50/60,S.r12)`);
  check(circuit.id+' / real ionosphere context valid',context.ok);
  const stages=[];
  for(const foE of fixture.foEStagesMHz){
    const result=run(call+`,{fixtureId:fixture.id,screeningFoEEvaluator:()=>${foE}})`);
    check(circuit.id+' / '+foE+' MHz injection reached correct points',result.auditOnly===true&&result.screeningAudit?.observations.length===circuit.expectedControlPoints&&result.screeningAudit.observations.every(p=>p.foEMHz===foE));
    check(circuit.id+' / '+foE+' MHz valid result',!result.scientificUnavailable&&Number.isFinite(result.Pr)&&Number.isFinite(result.Es));
    check(circuit.id+' / '+foE+' MHz power sum',near(result.Pr,aggregate(result.modos,'Pr')));
    check(circuit.id+' / '+foE+' MHz field sum',near(result.Es,aggregate(result.modos,'Ew')));
    check(circuit.id+' / '+foE+' MHz noise fixed',near(result.Fa,before.Fa));
    const pool=stages[0];
    if(pool){
      const expected=pool.result.modos.filter(m=>m.camada==='E'||fixture.frequencyMHz>m.fs*foE/pool.foEMHz).map(identity);
      check(circuit.id+' / '+foE+' MHz expected screened set',JSON.stringify(result.modos.map(identity))===JSON.stringify(expected),{expected,actual:result.modos.map(identity)});
      check(circuit.id+' / '+foE+' MHz retained contributions unchanged',result.modos.every(m=>{const old=pool.result.modos.find(n=>identity(n)===identity(m));return old&&invariantKeys.every(k=>near(old[k],m[k]));}));
      check(circuit.id+' / '+foE+' MHz E modes unchanged',JSON.stringify(result.modos.filter(m=>m.camada==='E'))===JSON.stringify(pool.result.modos.filter(m=>m.camada==='E')));
      const prev=stages.at(-1).result;
      check(circuit.id+' / '+foE+' MHz modal subset',result.modos.every(m=>prev.modos.some(n=>identity(n)===identity(m))));
      for(const key of ['Es','Pr','snr'])check(circuit.id+' / '+foE+' MHz nonincreasing '+key,result[key]<=prev[key]+fixture.toleranceDb,{before:prev[key],after:result[key]});
    }
    stages.push({foEMHz:foE,result});
  }
  const first=stages[0].result,last=stages.at(-1).result;
  check(circuit.id+' / discriminating F2 removal',first.modos.some(m=>m.camada==='F2')&&last.modos.every(m=>m.camada==='E')&&last.nModos<first.nModos,{before:first.modos.map(identity),after:last.modos.map(identity)});
  check(circuit.id+' / discriminating power and field decrease',last.Pr<first.Pr-fixture.toleranceDb&&last.Es<first.Es-fixture.toleranceDb,{powerChangeDb:last.Pr-first.Pr,fieldChangeDb:last.Es-first.Es});
  const natural=run(call+`,{fixtureId:fixture.id,screeningFoEEvaluator:(lat,lon)=>p1239FoEInterpolado(lat,lon,8,17+50/60,fixture.r12)})`);
  check(circuit.id+' / natural evaluator identical to default',productionSignature(natural)===productionSignature(before));
  const after=run(call+')');
  check(circuit.id+' / default output unchanged after interventions',JSON.stringify(after)===JSON.stringify(before));
  check(circuit.id+' / no persistent input changes',stateBefore===run('JSON.stringify({qth:[QTH.lat,QTH.lon],r12:S.r12,fixture,fixedConfig})'));
  check(circuit.id+' / production result has no audit flag',before.auditOnly===undefined);
  comparisons.push({circuit,before,ionosphere:context,stages});
}
for(const [label,evaluator] of [['NaN','()=>NaN'],['zero','()=>0'],['negative','()=>-1'],['exception',"()=>{throw Error('fixture failure');}"],['missing second point','(_a,_b,index)=>index===0?3:NaN']]){
  const result=run(`enlaceAbsolutoCore(-5.7945,-35.211,fixture.band,new Date(fixture.utc),fixedConfig,{fixtureId:fixture.id,screeningFoEEvaluator:${evaluator}})`);
  check('Injected '+label+' fails explicitly',result.auditOnly&&result.scientificUnavailable&&result.reason==='REQUIRED_FOE_UNAVAILABLE');
}
check('Audit requires frozen UTC argument',run("enlaceAbsolutoCore(-15.8,-47.9,fixture.band,undefined,fixedConfig,{fixtureId:fixture.id,screeningFoEEvaluator:()=>3}).reason==='INVALID_SCREENING_AUDIT_CONFIGURATION'"));
check('Audit rejects malformed options',run("enlaceAbsolutoCore(-15.8,-47.9,fixture.band,new Date(fixture.utc),fixedConfig,{}).reason==='INVALID_SCREENING_AUDIT_CONFIGURATION'"));
check('No audit callback outside screening range',run(`(()=>{let calls=0;const result=enlaceAbsolutoCore(40,-77,fixture.band,new Date(fixture.utc),fixedConfig,{fixtureId:fixture.id,screeningFoEEvaluator:()=>{calls++;throw Error('must not read');}});return calls===0&&result.auditOnly&&result.screeningAudit.observations.length===0&&!result.screeningAudit.evaluatorFailed;})()`));
let regression=null;
const baselineFile=path.join(__dirname,'production-r1-baseline.json');
if(process.argv[5]){
  const previous=environment(process.argv[5]);
  if(previous.hash!=='d814af72db3a9cb1ee4f9a778ac48f22a96ff654162adfcd9967214c018bc813')throw Error('Baseline is not the independently verified r1 artifact');
  const samples=[];
  for(const dest of [[-15.8,-47.9],[-5.7945,-35.211],[40,-77],[43.7,-79.4],[51,0],[35.7,139.7]])for(const band of [3,7,14,21,28]){
    const expression=`enlaceAbsolutoCore(${dest[0]},${dest[1]},${band},new Date(fixture.utc),fixedConfig)`;
    const a=previous.run(expression),b=run(expression);
    // Es and modal Ew are new diagnostics; all pre-existing result fields match.
    const same=productionSignature(a)===productionSignature(b);
    check('r1 default numeric regression '+dest+'/'+band,same);
    samples.push({destination:dest,band,expected:JSON.parse(productionSignature(a)),identical:same});
  }
  regression={previousHash:previous.hash,fixtureSha256:sha(fixtureBytes),samples};
  const frozen={sourceHtmlSha256:previous.hash,fixtureSha256:sha(fixtureBytes),
    scope:'Regression against r1, not an independent scientific oracle. Pre-existing fields retained; new Es and modal Ew excluded.',
    samples:samples.map(({identical,...sample})=>sample)};
  if(!fs.existsSync(baselineFile))fs.writeFileSync(baselineFile,JSON.stringify(frozen,null,2),{flag:'wx'});
  else if(JSON.stringify(JSON.parse(fs.readFileSync(baselineFile,'utf8')))!==JSON.stringify(frozen))throw Error('Frozen r1 baseline differs; refusing to overwrite');
}else{
  const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
  if(baseline.fixtureSha256!==sha(fixtureBytes)||baseline.sourceHtmlSha256!=='d814af72db3a9cb1ee4f9a778ac48f22a96ff654162adfcd9967214c018bc813')throw Error('Frozen r1 baseline metadata mismatch');
  regression={previousHash:baseline.sourceHtmlSha256,fixtureSha256:baseline.fixtureSha256,source:'bundled frozen r1 results',samples:[]};
  for(const sample of baseline.samples){
    const actual=run(`enlaceAbsolutoCore(${sample.destination[0]},${sample.destination[1]},${sample.band},new Date(fixture.utc),fixedConfig)`);
    const same=productionSignature(actual)===JSON.stringify(sample.expected);
    check('r1 default numeric regression '+sample.destination+'/'+sample.band,same);
    regression.samples.push({...sample,identical:same});
  }
}
const report={artifact:path.basename(file),htmlSha256:env.hash,fixtureSha256:sha(fixtureBytes),fixture,
  generatedAt:new Date().toISOString(),summary:{checks:checks.length,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length},
  checks,comparisons,regression,limitations:['Synthetic screening intervention, not observed foE','No empirical prediction validation','No full ITURHFProp comparison','No browser/UI test']};
fs.writeFileSync(reportFile,JSON.stringify(report,(_k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2));
console.log(JSON.stringify({summary:report.summary,failures:checks.filter(c=>!c.ok),circuits:comparisons.map(c=>({id:c.circuit.id,distanceKm:c.before.dk,stages:c.stages.map(s=>({foEMHz:s.foEMHz,modes:s.result.modos.map(identity),Es:s.result.Es,Pr:s.result.Pr,snr:s.result.snr}))}))},null,2));
if(report.summary.failed)process.exitCode=1;
