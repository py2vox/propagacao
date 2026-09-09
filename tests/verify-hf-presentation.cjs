'use strict';
/* DOM-only regression tests, not real-browser, visual or API certification.
   node verify-hf-presentation.cjs [index.html] [report.json] [linkedom-module]
   Development dependency only: linkedom 0.18.12. The HTML does not depend on it. */
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const {parseHTML}=require(process.argv[4]||'linkedom');
const file=process.argv[2]||path.join(__dirname,'index.html');
const reportFile=process.argv[3]||path.join(__dirname,'hf-presentation-results.json');
const html=fs.readFileSync(file,'utf8'),{document}=parseHTML(html);
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const app=scripts.filter(s=>!s[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
const errors=[],checks=[],snapshots={},storage=new Map();let fetchCount=0;
const NativeDate=Date;
class FixedDate extends NativeDate{constructor(...args){super(...(args.length?args:['2026-09-08T17:50:00Z']));}static now(){return NativeDate.parse('2026-09-08T17:50:00Z');}}
const sandbox={document,Date:FixedDate,console:{log(){},warn(){},error:(...x)=>errors.push(x.join(' ')),table(){}},
 navigator:{onLine:false},screen:{width:1280,height:720},location:{protocol:'file:',hostname:'',href:'file:///index.html'},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
 setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},
 MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},
 fetch:async()=>{fetchCount++;throw Error('Network disabled in DOM test');},
 Chart:class{constructor(_canvas,config){this.config=config;}destroy(){}},
 URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
 atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
const cut=app.lastIndexOf('\ninitMap();');if(cut<0)throw Error('Bootstrap not found');
new vm.Script(app.slice(0,cut)).runInContext(sandbox,{timeout:30000});
const run=code=>vm.runInContext(code,sandbox,{timeout:60000});
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
const root=document.getElementById('panel-hf');
const order=['forecast','windows','wspr','kp','bz','cme','gyro','topband160','listening'];
const actual=[...root.children].filter(e=>e.hasAttribute('data-hf-card')).map(e=>e.getAttribute('data-hf-card'));
check('Nine panels in requested DOM order',JSON.stringify(order)===JSON.stringify(actual),actual);
for(const id of ['heatmap','band-detail','gt-status','gt-tbody','gt-resumo','kpChart','bz-log-status','bz-log-table','bz-trend-alert','cme-analysis','gyrofreq-160','radioescuta-panel','explicacao-bandas','perfil-caminho','iono-panel','geomag-panel','m-sfi','m-kp','m-dst','m-bz','m-aidx','m-r12','m-xray'])check('Preserved binding '+id,document.querySelectorAll('#'+id).length===1);
check('Advanced calculation details retained under radio listening',document.getElementById('iono-panel').closest('[data-hf-card]').getAttribute('data-hf-card')==='listening');
check('Advanced details initially collapsed',!document.getElementById('hf-path-details').hasAttribute('open'));
run("S.r12=72;S.sfi=107;S.kp=2;S.dst=-8;S.bz=-1;QTH.lat=-22.8541666667;QTH.lon=-47.125;S.kpHist=[{t:'2026-09-08T12:00:00Z',kp:2},{t:'2026-09-08T15:00:00Z',kp:5}];S.cmePresentation={kind:'data',data:[{speed:800,time21_5:'2026-09-08T12:00Z'}],dataSource:'cache',sourceTime:Date.now()-60000};");
for(const locale of ['pt','en','pt','en']){
  run(`S.idioma='${locale}';S.mode='${locale==='en'?'US':'BR'}';renderHF(false);renderCmePresentation();renderBzLog([{t:'2026-09-08T17:49:00Z',bz:-3.2,level:'ATENCAO'}]);`);
  if(locale==='en')run('localizeUsTree(document.getElementById("panel-hf"))');
  snapshots[locale]=root.textContent;
  const headings=[...root.querySelectorAll('h2')].map(e=>e.textContent.trim());
  check(locale+' has nine intact panel headings',headings.length===9,headings);
  check(locale+' first heading matches catalog',headings[0]===run('hfCopy("forecastTitle")'));
  check(locale+' no generic translation fallback',!root.textContent.includes('Translation unavailable'));
  check(locale+' no dBW claimed for S/N',!/S\/N (?:é|is)\s*(?:an? )?(?:absolute )?dBW/.test(root.textContent));
  check(locale+' window factors accessible by keyboard/touch',document.querySelectorAll('#band-detail details summary').length>0);
  check(locale+' localized Kp tooltip',run("kpChartObj.config.options.plugins.tooltip.callbacks.label({parsed:{y:5}})")===('Kp 5.0 — '+(locale==='en'?'G1 Minor':'G1 Menor')));
  check(locale+' localized canvas alternative',document.getElementById('kpChart').textContent===run('hfCopy("kpChart")'));
  check(locale+' localized time-zone waiting state',document.getElementById('utc-offset-note').textContent.includes(locale==='en'?'Local time-zone reference':'Referência de fuso local'));
  check(locale+' Bz summary avoids singular/plural mismatch',document.getElementById('bz-log-status').textContent.startsWith(locale==='en'?'Stored summaries: 1':'Resumos armazenados: 1'));
  check(locale+' Bz history localized',document.getElementById('bz-log-table').textContent.includes(locale==='en'?'Decreasing':'Em queda'));
  check(locale+' CME explicitly illustrative',document.getElementById('cme-analysis').textContent.includes(locale==='en'?'ILLUSTRATIVE ESTIMATE':'ESTIMATIVA ILUSTRATIVA'));
  check(locale+' 160 m does not claim favorable propagation',!/severe extra absorption|condição favorável|favourable/.test(document.getElementById('gyrofreq-160').textContent));
  check(locale+' listening options are not PT/EN slash pairs',![...document.getElementById('listen-noise').options].some(o=>o.textContent.includes('/')));
  check(locale+' measured-noise placeholder localized',document.getElementById('listen-noise-measured').getAttribute('placeholder')===(locale==='en'?'optional':'opcional'));
}
// A real language change must not create a WSPR/NASA request or rewrite nearby
// headings through the obsolete previous/nextElementSibling bindings.
// linkedom does not implement the details.open IDL reflection; set the actual
// HTML attribute as a browser does when the operator opens the disclosure.
run("document.getElementById('hf-path-details').setAttribute('open','');setIdioma('pt',true);setIdioma('en',true);");
check('Language changes keep details open',document.getElementById('hf-path-details').hasAttribute('open'));
check('Language changes keep selected antenna',document.getElementById('listen-ant').value==='cmp_dipole_050');
check('Language changes do not query providers',fetchCount===0,fetchCount);
check('Language changes keep CME heading',document.getElementById('hf-cme-title').textContent==='Estimated solar-ejection arrival');
check('No console errors during tested HF renders',errors.length===0,errors);
const report={artifact:path.basename(file),htmlSha256:crypto.createHash('sha256').update(html).digest('hex'),generatedAt:new NativeDate().toISOString(),
 summary:{checks:checks.length,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length},checks,
 limitations:['DOM emulation, not a real browser or pixel/layout validation','No live API calls','No scientific predictive validation'],snapshots};
fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({summary:report.summary,failures:checks.filter(c=>!c.ok)},null,2));
if(report.summary.failed)process.exitCode=1;
