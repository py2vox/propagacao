/* Reproducible, offline checks of the actual HTML application script.
   Usage: node --experimental-vm-modules audit-scientific.cjs index.html [report.json]
   DOM/browser rendering, real API coverage and predictive calibration are NOT tested. */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),path=require('path');
async function main(){
const input=process.argv[2]||path.join(__dirname,'index.html');
const html=fs.readFileSync(input,'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(m=>({attrs:m[1],code:m[2]}));
const app=scripts.filter(s=>!s.attrs.includes('data-aghip-vendor')).sort((a,b)=>b.code.length-a.code.length)[0].code;
const checks=[];function check(name,ok,detail){checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});}
for(const [i,s] of scripts.entries()){
  try{if(s.attrs.includes('type="module"')){if(!vm.SourceTextModule)throw Error('Run with --experimental-vm-modules');new vm.SourceTextModule(s.code);}else new vm.Script(s.code);check('JavaScript syntax '+(i+1),true);}
  catch(e){check('JavaScript syntax '+(i+1),false,e.message);}
}
const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
const ids=[...markup.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]);
check('Unique static DOM IDs',new Set(ids).size===ids.length);
check('One document declaration',(html.match(/<!DOCTYPE html>/g)||[]).length===1);
check('No external classic script tags',!scripts.some(s=>/\bsrc\s*=/.test(s.attrs)));
check('No relative manifest or service worker dependency',!html.includes('serviceWorker.register')&&!markup.includes('href="manifest.json"'));
check('No translation-unavailable placeholder',!html.includes('Translation unavailable for this scientific detail'));
const declaredHash=app.match(/const SCIENTIFIC_BUNDLE_SHA256 = '([a-f0-9]{64})';/)?.[1];
const hashInput=scripts.filter(s=>!s.attrs.includes('data-aghip-vendor')).map(s=>s.code.replace(/const SCIENTIFIC_BUNDLE_SHA256 = '[a-f0-9]{64}';/,"const SCIENTIFIC_BUNDLE_SHA256 = '"+'0'.repeat(64)+"';")).join('\n');
check('Embedded application-script SHA-256 matches actual code',declaredHash===crypto.createHash('sha256').update(hashInput).digest('hex'));
const logs=[],storage=new Map();
const document={getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},body:{dataset:{}},documentElement:{lang:'pt-BR'},hidden:true};
const sandbox={console:{log:(...x)=>logs.push(x.join(' ')),warn:()=>{},error:(...x)=>logs.push(x.join(' ')),table:()=>{}},
  document,navigator:{onLine:false},location:{protocol:'file:',hostname:'',href:'file:///AGHIP-FINAL.html'},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  setTimeout:()=>0,setInterval:()=>0,clearTimeout:()=>{},clearInterval:()=>{},requestAnimationFrame:()=>0,addEventListener:()=>{},
  MutationObserver:class{observe(){}disconnect(){}},fetch:async()=>{throw Error('Network intentionally disabled');},
  URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
  atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
const boot=app.lastIndexOf('\ninitMap();');if(boot<0)throw Error('Bootstrap boundary missing');
new vm.Script(app.slice(0,boot),{filename:'actual-application-core.js'}).runInContext(sandbox,{timeout:30000});
const run=code=>vm.runInContext(code,sandbox,{timeout:30000});
check('Actual numerical core loads without network',true);
const wmm=run('validarWMM()'),noise=run('validarP372()'),screen=run('validarP533Blindagem()');
check('WMM official embedded vectors',wmm.falhas===0,{assertions:wmm.assercoes,points:wmm.pontos,maxError:wmm.erroMaximo});
for(const t of noise.testes)check('P.372 / '+t.nome,t.pass,{expected:t.esp,actual:t.calc,tolerance:t.tol});
check('Embedded P.533 boundary suite',screen.ok,screen);
const fixtures=JSON.parse(fs.readFileSync(path.join(__dirname,'mirror-height-fixtures.json'),'utf8'));
for(const [i,f] of fixtures.cases.entries()){
  const [foF2,foE,M3,mhz,km,r12]=f.inputs;
  const value=run(`p533MirrorHeight(${JSON.stringify({foF2,foE,M3})},${mhz},${km},${r12})`);
  check('P.533 mirror height / fixture '+i,Math.abs(value-f.expectedKm)<=fixtures.toleranceKm,{expectedKm:f.expectedKm,actualKm:value});
}
check('Missing height input is rejected',run('Number.isNaN(p533MirrorHeight({foF2:NaN,foE:2,M3:3},14,1000,72))'));
for(const [d,regime] of [[6999,'curto'],[7000,'curto'],[7001,'interp'],[8999,'interp'],[9000,'longo'],[9001,'longo']])
  check('P.533 regime '+d,run(`validadeMetodoP533(${d},{El:20,Gr:2.15}).regime===${JSON.stringify(regime)}`));
check('7000 km needs no long-path contribution',run('validadeMetodoP533(7000,null).ok'));
check('7001 km missing long-path result is not accepted',run('!validadeMetodoP533(7001,null).ok'));
check('S/N power equation',Math.abs(run('p533_SNR(-130,30,2400)')-10.19788758288394)<1e-9);
for(const grid of ['GG67KD','FN31PR','FN03FR','AA00AA','RR99XX','QF56OD','PM95AA'])for(const precision of [4,6,8]){
  const g=grid.slice(0,precision)+(precision===8?'55':'');
  check('Grid center round-trip '+g,run(`(()=>{const p=gridToLatLon('${g}');return p&&latLonToGrid(p.lat,p.lon,${precision})==='${g}';})()`));
}
check('Invalid grid rejected',run("gridToLatLon('ZZ99ZZ')===null"));
check('Antipodal distance finite',Number.isFinite(run('greatCircleDist(48.3,-123.8,-48.3,56.2)')));
check('Coincident distance zero',run('greatCircleDist(0,0,0,0)===0'));
check('Special antenna excluded from scientific ranking',run("!scientificAntennaAvailable('cmp_k9ay')&&scientificAntennaAvailable('cmp_dipole_050')"));
const moon=run("moonMeeus(new Date('1992-04-12T00:00:00Z'))");
check('Meeus example: ecliptic longitude',Math.abs(moon.lam-133.162655)<.0001,moon.lam);
check('Meeus example: ecliptic latitude',Math.abs(moon.bet-(-3.229126))<.0001,moon.bet);
check('Meeus example: distance',Math.abs(moon.dist-368409.7)<.1,moon.dist);
// This fixture checks the chapter-47 series at its example epoch, not UTC/TT
// conversion, topocentric refraction or full-epoch ephemeris accuracy.
check('P.453 modified refractivity units',run('Math.abs(modifiedRefractivityM(300,1000)-457)<1e-12'));
check('P.453 zero water vapor',run('Math.abs(refractivityN(1000,20,0)-77.6*1000/293.15)<1e-6'));

run("S.r12=72;QTH.lat=-22.8541666667;QTH.lon=-47.125;S.idioma='en';");
const circuits=[];
for(const [name,lat,lon] of [['Brazil',-15.8,-47.9],['US',40,-77],['Canada',43.7,-79.4],['Europe',51,0],['Japan',35.7,139.7]])for(const hour of [0,12])for(const band of [3,7,14,21,28]){
  sandbox.args={name,lat,lon,hour,band};
  const v=run(`(()=>{const cfg={PtdBkW:-10,Gt:2.15,Gr:2.15,perfilTx:'constant',perfilRx:'cmp_dipole_050',catRuido:'city',latRx:QTH.lat,lonRx:QTH.lon,W:100,bwHz:2400};
    const when=new Date(Date.UTC(2026,8,8,args.hour));const a=enlaceAbsolutoCore(args.lat,args.lon,args.band,when,cfg);
    const b=enlaceAbsolutoCore(args.lat,args.lon,args.band,when,{...cfg,PtdBkW:0,W:1000});
    const c=enlaceAbsolutoCore(args.lat,args.lon,args.band,when,{...cfg,bwHz:4800});
    return {distance:a?.dk,snr:a?.snr,reason:a?.reason,blocked:a?.bloqueado,regime:a?.validade?.regime,
      finite:Number.isFinite(a?.snr),powerStep:b?.snr-a?.snr,bandwidthStep:c?.snr-a?.snr,
      modeCount:a?.nModos,notNaN:!!a&&(a.snr===null||!Number.isNaN(a.snr))};})()`);
  circuits.push({name,hour,band,...v});check('Finite/explicit state '+name+'/'+hour+'/'+band,v.notNaN,v.reason||v.regime);
  if(v.finite){check('10x power gives 10 dB '+name+'/'+hour+'/'+band,Math.abs(v.powerStep-10)<1e-8,v.powerStep);check('2x bandwidth gives -3.0103 dB '+name+'/'+hour+'/'+band,Math.abs(v.bandwidthStep+10*Math.log10(2))<1e-8,v.bandwidthStep);}
}
check('Circuit fixtures exercised finite S/N',circuits.filter(c=>c.finite).length>=20,circuits.filter(c=>c.finite).length);
check('P.533 equation 42 reconstructs the interpolated field',run(`(()=>{
 const cfg={PtdBkW:-10,Gt:2.15,Gr:2.15,perfilTx:'constant',perfilRx:'cmp_dipole_050',catRuido:'city',latRx:QTH.lat,lonRx:QTH.lon,W:100,bwHz:2400};
 const e=enlaceAbsolutoCore(40,-77,14,new Date('2026-09-08T12:00:00Z'),cfg);
 if(e?.validade?.regime!=='interp'||!e.modos.length)return false;
 const f=BAND_FREQ[14],Es=10*Math.log10(e.modos.reduce((sum,m)=>sum+10**((m.Pr-m.GrTOA+20*Math.log10(f)+107.2)/10),0));
 const weight=(e.dk-7000)/2000;
 const expected=100*Math.log10((1-weight)*10**(Es/100)+weight*10**(e.longPath.El/100));
 return Math.abs(e.pathField-expected)<1e-8;
})()`));
check('160 m is not extrapolated through P.533',run("enlaceAbsolutoCore(40,-77,1,new Date('2026-09-08T12:00:00Z'),{PtdBkW:-10}).reason==='FREQUENCY_OUTSIDE_P533_2_TO_30_MHZ'"));
check('Screening fails when required foE is missing',run(`(()=>{const fn=p1239FoEInterpolado;p1239FoEInterpolado=()=>NaN;try{return p533ScreeningContext(0,0,0,27,3000,8,12,72).unavailable;}finally{p1239FoEInterpolado=fn;}})()`));
check('Table 1a missing control cannot be silently replaced',run(`(()=>{const fn=ccirFoF2;let calls=0;ccirFoF2=(...args)=>++calls===2?NaN:fn(...args);try{return !p533F2PathContext(0,0,0,70,7783,8,12,72).ok;}finally{ccirFoF2=fn;}})()`));
check('Symmetric short circuit has reciprocal received power for equal stations',run(`(()=>{const a=[QTH.lat,QTH.lon];try{
  const cfg={PtdBkW:-10,Gt:2.15,Gr:2.15,perfilTx:'constant',perfilRx:'constant',catRuido:'city',latRx:0,lonRx:0};
  const t=new Date('2026-09-08T12:00:00Z');const p=enlaceAbsolutoCore(-15.8,-47.9,14,t,cfg);
  QTH.lat=-15.8;QTH.lon=-47.9;const q=enlaceAbsolutoCore(a[0],a[1],14,t,cfg);return Number.isFinite(p?.Pr)&&Math.abs(p.Pr-q.Pr)<1e-7;
 }finally{[QTH.lat,QTH.lon]=a;}})()`));
check('Below-fL long-distance fit is evaluated (not cut off)',run("(()=>{const p=p533_LongPath(-22.85,-47.125,40,-77,8338,3.6,8,12,72,-10,2.15,2.15,'constant','constant');return p&&Number.isFinite(p.El)&&p.belowFL;})()"));
check('R12 restored after exception',run(`(()=>{const old=enlaceAbsolutoCore,r=S.r12;let calls=0;
  enlaceAbsolutoCore=()=>{if(++calls>1)throw Error('injected');return {snr:10};};
  try{incertezaSNR(40,-77,6,new Date('2026-09-08T12:00:00Z'),{});}catch(_){}finally{enlaceAbsolutoCore=old;}
  return S.r12===r&&calls>1;})()`));
for(const [mode,country,provider] of [['BR','BR','INMET'],['US','US','NWS'],['US','CA','ECCC']]){
  run(`S.mode='${mode}';S.country='${country}';S.regionalProvider='${provider}';S.regionalEpoch=9;`);
  for(const p of ['INMET','NWS','ECCC'])check('Provider isolation '+provider+'/'+p,run(`regionalRequestCurrent('${p}',9)===${p===provider}`));
  check('Stale epoch '+provider,run(`!regionalRequestCurrent('${provider}',8)`));
}
for(const [name,payload,provider,valid] of [
 ['valid zero',{type:'FeatureCollection',features:[]},'NWS',true],
 ['error payload',{title:'server failure'},'NWS',false],
 ['pagination',{type:'FeatureCollection',features:[],links:[{rel:'next',href:'next'}]},'ECCC',false],
 ['missing NWS expiry',{type:'FeatureCollection',features:[{type:'Feature',properties:{status:'Actual',event:'Tornado Warning'}}]},'NWS',false],
 ['missing CA geometry',{type:'FeatureCollection',features:[{type:'Feature',properties:{}}]},'ECCC',false],
 ['invalid CA polygon',{type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[]}}]},'ECCC',false]]){
  sandbox.payload=payload;const actual=run(`(()=>{try{validateAlertCollection(payload,'${provider}');return true;}catch(_){return false;}})()`);check('Alert payload / '+name,actual===valid);
}
check('Polygon boundary is covered',run('pointInRing(0,1,[[0,0],[2,0],[2,2],[0,2],[0,0]])'));
check('Dateline polygon excludes Greenwich',run('!pointInRing(0,0,[[179,-1],[-179,-1],[-179,1],[179,1],[179,-1]])'));
check('Dateline polygon includes both sides',run('pointInRing(179.5,0,[[179,-1],[-179,-1],[-179,1],[179,1],[179,-1]])&&pointInRing(-179.5,0,[[179,-1],[-179,-1],[-179,1],[179,1],[179,-1]])'));
check('Polygon holes remain excluded',run("!pointInGeometry(1,1,{type:'Polygon',coordinates:[[[0,0],[3,0],[3,3],[0,3],[0,0]],[[.5,.5],[2,.5],[2,2],[.5,2],[.5,.5]]]})"));
const races=await run(`(async()=>{
 const originalFetch=fetchWithTimeout,originalGet=document.getElementById;
 const status={textContent:'before'},list={innerHTML:'before'};let count=0;
 document.getElementById=id=>id==='alert-status'?status:id==='alert-list'?list:null;
 try{
  S.mode='BR';S.country='BR';S.regionalProvider='INMET';S.regionalEpoch=21;
  fetchWithTimeout=async()=>{count++;throw Error('must not fetch');};
  await loadAvisosNWS(40,-77,21);const isolated=count===0&&list.innerHTML==='before';
  S.mode='US';S.country='US';S.regionalProvider='NWS';S.regionalEpoch=22;
  fetchWithTimeout=async()=>({ok:true,json:async()=>{S.country='CA';S.regionalProvider='ECCC';S.regionalEpoch=23;list.innerHTML='CANADIAN-PANEL';return {type:'FeatureCollection',features:[]};}});
  await loadAvisosNWS(40,-77,22);const ignored=list.innerHTML==='CANADIAN-PANEL';
  return {isolated,ignored};
 }finally{fetchWithTimeout=originalFetch;document.getElementById=originalGet;}
})()`);
check('Actual NWS loader does not fetch in BR mode',races.isolated);
check('Actual NWS loader ignores a late response after country change',races.ignored);
const report={artifact:path.basename(input),sha256:crypto.createHash('sha256').update(html).digest('hex'),
  generatedAt:new Date().toISOString(),scope:'Offline equation/reference-vector checks, synthetic contract tests and circuit invariants; not browser or live-service validation',
  summary:{checks:checks.length,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length,wmmAssertions:wmm.assercoes,p533EmbeddedAssertions:screen.total},
  wmm,noise,checks,circuits,limitations:['No independent peer review','No complete ITURHFProp golden master','No live browser/end-to-end API verification','No calibrated reception-probability claim']};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify({summary:report.summary,failures:checks.filter(c=>!c.ok)},null,2));
if(report.summary.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
