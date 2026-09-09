'use strict';
/* Reproducible arithmetic, invariants and DOM emulation. NOT browser testing,
   NOT field validation. node verify-p1147.cjs html report linkedom fixtures */
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const {parseHTML}=require(process.argv[4]||'linkedom');
const html=fs.readFileSync(process.argv[2],'utf8'),{document,window:dom}=parseHTML(html);
// linkedom lacks the select.value setter/default first-option behavior.
// Model that standard browser contract explicitly; this is test infrastructure.
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,
  get(){return (this.querySelector('option[selected]')||this.options[0])?.value||'';},
  set(v){for(const option of this.options)option.removeAttribute('selected');const match=[...this.options].find(o=>o.value===String(v));if(match)match.setAttribute('selected','');}});
const app=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
const checks=[],errors=[],snapshots={};let calls=0;
const NativeDate=Date;class FixedDate extends Date{constructor(...v){super(...(v.length?v:['2026-09-09T03:00:00Z']));}static now(){return NativeDate.parse('2026-09-09T03:00:00Z');}}
const ctx={document,Date:FixedDate,console:{log(){},warn(){},error:(...x)=>errors.push(x.join(' '))},navigator:{onLine:false},
  location:{protocol:'file:',hostname:'',href:'file:///index.html'},screen:{width:1280,height:720},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},
  MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},
  fetch:async()=>{calls++;throw Error('Network disabled');},
  URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
  atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);const cut=app.lastIndexOf('\ninitMap();');
new vm.Script(app.slice(0,cut)).runInContext(ctx,{timeout:30000});
const run=c=>vm.runInContext(c,ctx,{timeout:60000}),check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
const close=(a,b,t=1e-8)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t;
const fixtures=JSON.parse(fs.readFileSync(process.argv[5],'utf8'));
for(const [i,f] of fixtures.budget.entries()){
  const r=run(`p1147Budget(${JSON.stringify(f.input)})`);
  check('Python budget fixture '+i,r.ok&&Object.entries(f.expected).every(([k,v])=>close(r[k],v)),r.ok?undefined:r);
}
for(const [i,f] of fixtures.solar.entries()){
  const at=run(`p1147SolarEvent({lat:${f.lat},lon:${f.lon}},new Date('${f.date}T00:00:00Z'),${f.rise})`);
  check('Python sunrise/sunset fixture '+i,f.utc===null?at===null:Math.abs(at-new NativeDate(f.utc))<=2);
}
run("globalThis.base={band:'mf',distanceKm:1000,powerW:100,efficiency:1,gv:0,gh:0,gs:0,lp:0,lt:0,r12:72,region:'general',phis:[50]};");
const base=run('p1147Budget(base)');
for(const [change,delta] of [[{powerW:1000},10],[{efficiency:.5},10*Math.log10(.5)],[{gv:3},3],[{gh:3},3],[{gs:3},3],[{lp:3},-3],[{lt:3},-3]])
  check('Budget sensitivity '+JSON.stringify(change),close(run(`p1147Budget({...base,...${JSON.stringify(change)}}).field`)-base.field,delta));
check('Solar activity increases loss',run('p1147Budget({...base,r12:144}).field')<base.field);
check('Missing required R12 rejected',run('p1147Budget({...base,r12:null}).reason')==='R12_REQUIRED');
check('Missing R12 not required at equatorial MF',run('p1147Budget({...base,r12:null,phis:[0]}).ok'));
check('LF independent of R12',close(run("p1147Budget({...base,band:'lf',r12:null}).field"),run("p1147Budget({...base,band:'lf',r12:500}).field")));
for(const v of ['NaN','null','Infinity','0','-1'])check('Invalid radiated-power input '+v,!run(`p1147Budget({...base,powerW:${v}}).ok`));
for(const p of [[],[0,20],[91],[-91]])check('Invalid section geometry '+JSON.stringify(p),!run(`p1147Budget({...base,phis:${JSON.stringify(p)}}).ok`));
const tables=run('P1147_TABLES');
for(const [key,pts] of Object.entries(tables.antenna)){
  check('Figure1 ascending '+key,pts.every((p,i)=>i===0||p[0]>pts[i-1][0]));
  const index=Math.floor(pts.length/2),p=pts[index];
  check('Figure1 exact vertex '+key,close(run(`p1147Vertical('${key}',${p[0]})`),p[1]));
  check('Figure1 no clipped extrapolation '+key,run(`p1147Vertical('${key}',${pts[0][0]-.01})`)===null);
  check('Figure1 long-distance note '+key,close(run(`p1147Vertical('${key}',10000)`),run(`p1147Vertical('${key}',12000)`)));
}
const sea=run("p1147Sea('mf',1000,7000,{mode:'coastal',s1:10,s2:25,alpha:.5})");
check('Sea eq5 r1=1000 G0 squared/(Qf)',close(sea.r1,100000/1400));
check('Sea c1 is linear, not squared',close(sea.c1,1.4));
check('Sea eq6 second radius',close(sea.r2,100000/1200));
check('Sea eq6 correction',close(sea.c2,3.5));
check('Sea net example 5.1 dB',close(sea.gain,5.1));
check('Coast with no intervening land reaches MF cap',close(run("p1147Sea('mf',1000,7000,{mode:'coastal',s1:0,s2:10000,alpha:0}).gain"),10));
check('LF cap 4.1 dB',close(run("p1147Sea('lf',198,7000,{mode:'coastal',s1:0,s2:10000,alpha:0}).gain"),4.1));
check('Sea loss floors gain to zero',run("p1147Sea('mf',1000,7000,{mode:'coastal',s1:1000,s2:2000,alpha:.5}).gain")===0);
check('Incomplete coastal data rejected',run("p1147Sea('mf',1000,7000,{mode:'coastal',s1:null,s2:null,alpha:.5})")===null);
check('Sea next land cannot precede coast',run("p1147Sea('mf',1000,7000,{mode:'coastal',s1:50,s2:20,alpha:.5})")===null);
check('Eq8 magnetic equator E-W 28 dB',close(run('p1147Polarization(0,0,90).loss'),28));
check('Eq8 high dip zero',run('p1147Polarization(45.01,0,90).loss')===0);
check('Eq8 hemispheric symmetry',close(run('p1147Polarization(30,10,80).loss'),run('p1147Polarization(-30,10,80).loss')));
check('Eq8 axial symmetry',close(run('p1147Polarization(30,10,80).loss'),run('p1147Polarization(30,10,260).loss')));
check('Eq8 literal negative edge retained',run('p1147Polarization(45,0,0).loss')<0);
for(const lat of [-65,65,89])check('Appendix latitude guard '+lat,run(`p1147HourlyAtPoint({lat:${lat},lon:0},new Date()).ok`)===false);
run("globalThis.cfg={tx:{lat:-20,lon:-44},rx:{lat:-22.8541667,lon:-47.125},now:new Date(),fKHz:1000,powerW:100,efficiency:1,vertical:'short',gh:0,region:'general',r12:72,seaTx:{mode:'inland'},seaRx:{mode:'inland'}};");
const prediction=run('p1147Predict(cfg)');snapshots.circuit=prediction;
check('Full LF/MF component chain finite',prediction.ok&&Number.isFinite(prediction.field),prediction.reason);
check('Local night circuit recognized',prediction.hourly.phase==='NIGHT');
check('Two terminal polarization corrections',prediction.polarization.length===2);
check('Distance/geomagnetic reciprocity',close(prediction.field,run('p1147Predict({...cfg,tx:cfg.rx,rx:cfg.tx}).field'),1e-7));
check('LF omits excess polarization',run('p1147Predict({...cfg,fKHz:198}).polarization.length')===0);
for(const f of [149.99,1700.01])check('Published frequency guard '+f,run(`p1147Predict({...cfg,fKHz:${f}}).reason`)==='FREQUENCY_DOMAIN');
for(const f of [150,299.99,300,1700])check('Published boundary included '+f,run(`p1147Predict({...cfg,fKHz:${f}}).ok`));
for(const d of [49.99,50,1999.99,2000,2000.01,3000,3000.01,7500,7500.01,12000,12000.01]){
  run(`globalThis.caseD={...cfg,tx:{lat:0,lon:0},rx:{lat:0,lon:${d/6371*180/Math.PI}}};`);
  const r=run('p1147Predict(caseD)');
  if(d<50||d>12000)check('Distance exclusion '+d,r.reason==='DISTANCE_DOMAIN');
  else{
    check('Distance inclusion '+d,r.ok,r.reason);
    if(r.ok){check('Hourly CP count '+d,r.hourly.points.length===(d<=2000?1:2));check('Geomagnetic section count '+d,r.phis.length===(d<=3000?1:2));}
  }
}
check('Identical QTH rejected',run('p1147Predict({...cfg,tx:cfg.rx}).reason')==='DISTANCE_DOMAIN');
check('Antipodal QTH rejected',run('p1147Predict({...cfg,tx:{lat:0,lon:0},rx:{lat:0,lon:180}}).reason')==='DISTANCE_DOMAIN');
check('WMM date guard',run("p1147Predict({...cfg,now:new Date('2030-01-01T00:00Z')}).reason")==='GEOMAGNETIC_MODEL_DATE');
const recv=run('p1147Receiver(50,10,-100,2400,2400)');
check('50 ohm voltage-to-power fixture',close(recv.powerDbm,-66.98970004336019));
check('Conditional SNR fixture',close(recv.snrDb,33.01029995663981));
check('AF worsened by 3 dB lowers SNR by 3',close(run('p1147Receiver(50,13,-100,2400,2400).snrDb')-recv.snrDb,-3));
check('Double BW reduces SNR by 3.0103 dB',close(run('p1147Receiver(50,10,-100,2400,4800).snrDb')-recv.snrDb,-10*Math.log10(2)));
check('Missing AF does not imply zero',run('p1147Receiver(50,null,-100,2400,2400)')===null);
check('Missing noise does not imply zero',run('p1147Receiver(50,10,null,2400,2400)')===null);
// Deterministic UI, including the real HF render with unsupported antenna.
run('QTH.lat=cfg.rx.lat;QTH.lon=cfg.rx.lon;S.r12=72;renderRadioescuta();');
const set=(id,value)=>{document.getElementById(id).value=String(value);};
set('p1147-grid','GG70AA');run('renderP1147Listening()');
check('Separate LF/MF controls created',!!document.getElementById('p1147-panel'));
check('Default radiation efficiency 100%',document.getElementById('p1147-eff').value==='100');
check('LF/MF followed by VHF card',[...document.querySelectorAll('#p1147-panel [data-listen-domain]')].map(x=>x.dataset.listenDomain).join(',')==='lf,mf,vhf');
check('No automatic fabricated SNR',document.querySelector('[data-p1147-output]').textContent.includes('S/N não determinado'));
set('p1147-mf-af',10);set('p1147-mf-noise',-100);run('renderP1147Listening()');
check('Calibrated SNR available',document.querySelector('[data-listen-domain="mf"]').textContent.includes('S/N '));
for(const en of [true,false,true]){
  run(`S.idioma='${en?'en':'pt'}';renderP1147Listening();`);
  const panel=document.getElementById('p1147-panel'),txt=panel.textContent;snapshots[en?'en':'pt']=txt;
  check((en?'EN':'PT')+' native section',panel.hasAttribute('data-hf-native'));
  check((en?'EN':'PT')+' no fallback',!txt.includes('Translation unavailable'));
  check((en?'EN':'PT')+' retains calibration',document.getElementById('p1147-mf-af').value==='10');
  check((en?'EN':'PT')+' no unlabeled controls',[...panel.querySelectorAll('input,select')].every(x=>panel.querySelector(`label[for="${x.id}"]`)));
  check((en?'EN':'PT')+' scoped table headers',panel.querySelectorAll('th:not([scope])').length===0);
  check((en?'EN':'PT')+' current plus next 24 hours',panel.querySelectorAll('[data-listen-domain="mf"] table tbody tr').length===32);
  check((en?'EN':'PT')+' Figure4 caveat visible in disclosure',txt.includes(en?'Figure 4':'Figura 4'));
  check((en?'EN':'PT')+' duplicate IDs absent',new Set([...document.querySelectorAll('[id]')].map(x=>x.id)).size===document.querySelectorAll('[id]').length);
}
check('EN no Portuguese leftovers',!/previsão|ruído|não |potência|ondas médias|próximas/.test(snapshots.en));
check('PT no characteristic EN leftovers',!/not determined|your QTH|calibrated receiving|upcoming times/.test(snapshots.pt));
set('p1147-mf-freq',1100);run('renderP1147Listening()');
check('Frequency change invalidates AF/noise',document.getElementById('p1147-mf-af').value===''&&document.getElementById('p1147-mf-noise').value==='');
set('p1147-mf-af',10);set('p1147-mf-noise',-100);run('renderP1147Listening()');set('p1147-grid','GG80AA');run('renderP1147Listening()');
check('Route change invalidates calibration',document.getElementById('p1147-mf-af').value==='');
set('p1147-grid','<script>');run('renderP1147Listening()');
check('Invalid transmitter grid no fallback',document.querySelector('[data-p1147-output]').textContent.includes('Invalid LF/MF grid'));
check('Grid injection escaped',document.querySelector('[data-p1147-output]').querySelectorAll('script').length===0);
set('p1147-grid','GG70AA');set('listen-ant','cmp_beverage');run('renderRadioescuta()');
check('Invalid HF antenna does not hide LF/MF predictions',document.getElementById('listen-results').textContent.includes('NO VALIDATED INSTALLATION PATTERN')&&document.querySelectorAll('#p1147-panel [data-listen-domain]').length===3);
check('No additional API calls',calls===0);check('No console errors',errors.length===0,errors);
check('Single HTML has no external script sources',document.querySelectorAll('script[src]').length===0);
check('Open reference discrepancy retained',fixtures.figure4Check?.status==='OPEN_DISCREPANCY_NOT_TUNED_AWAY'&&fixtures.figure4Check.points.some(x=>Math.abs(x.differenceDb)>.2));
const report={htmlSha256:crypto.createHash('sha256').update(html).digest('hex'),generatedAt:new Date().toISOString(),
  summary:{checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length},checks,snapshots,
  externalReference:fixtures.figure4Check,limitations:['Internal invariants and separately transcribed Python equations, not independent predictive validation','Figure 4 discrepancy OPEN; not a confirmed ITU erratum','DOM emulation only; no browser or real receiver tests','No live provider availability tests']};
fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify({summary:report.summary,failed:checks.filter(x=>!x.ok)},null,2));if(report.summary.failed)process.exitCode=1;
