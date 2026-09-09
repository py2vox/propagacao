'use strict';
// Real propagation core + DOM emulation. No browser, map drawing or live APIs.
// node verify-overview-welcome.cjs [index.html] [report.json] [linkedom-module]
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const {parseHTML}=require(process.argv[4]||'linkedom');
const file=process.argv[2]||path.join(__dirname,'index.html'),reportFile=process.argv[3]||path.join(__dirname,'overview-welcome-results.json');
const html=fs.readFileSync(file,'utf8'),{document}=parseHTML(html);
const app=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(s=>!s[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
const NativeDate=Date;let clock=NativeDate.parse('2026-09-09T15:30:00Z'),fetchCount=0;
class FixedDate extends NativeDate{constructor(...a){super(...(a.length?a:[clock]));}static now(){return clock;}}
const errors=[],checks=[],snapshots={},cases=[];
const sandbox={document,Date:FixedDate,console:{log(){},warn(){},error:(...a)=>errors.push(a.join(' ')),table(){}},
  navigator:{onLine:false},location:{protocol:'file:',hostname:'',href:'file:///index.html'},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){}},
  setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){},requestAnimationFrame:f=>setTimeout(f,0),addEventListener(){},
  MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},
  fetch:async()=>{fetchCount++;throw Error('Network disabled');},URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
  atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
new vm.Script(app.slice(0,app.lastIndexOf('\ninitMap();'))).runInContext(sandbox,{timeout:30000});
const run=code=>vm.runInContext(code,sandbox,{timeout:60000});
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
function grid(value){document.getElementById('qth-input').value=value;run(`QTH=gridToLatLon(${JSON.stringify(value)});S.grid=${JSON.stringify(value)};`);}
function input(id,value){let el=document.getElementById(id);if(!el){el=document.createElement('input');el.id=id;document.body.appendChild(el);}el.value=value;}
async function render(){return await run('renderWelcomeBands()');}
async function main(){
  check('Only target title replaced',!document.querySelector('#panel-mapa').textContent.includes('Melhor banda HF por destino — próximas 3 horas'));
  for(const id of ['map-container','map-list-tbody','gi-kp','gi-moon','gi-eclipse','quake-status'])check('Preserved overview binding '+id,document.querySelectorAll('#'+id).length===1);
  check('Nine amateur HF bands, excluding unsupported 160m and CB',run('WELCOME_BANDS.length===9&&!WELCOME_BANDS.includes(1)&&!WELCOME_BANDS.includes(27)'));
  check('Explicit English destination names cover entire map',run('WELCOME_DEST_EN.length===DESTINATIONS.length'));
  const synthetic=run(`(()=>{const e=s=>({snr:s,Pr:-110,Fa:40,validade:{ok:true}});return rankWelcomeRows([
    {band:14,destination:0,e:e(4)},{band:14,destination:1,e:e(10)},{band:7,destination:0,e:e(8)},
    {band:21,destination:2,e:e(7)},{band:28,destination:3,e:e(1)},
    {band:1,destination:0,e:e(99)},{band:27,destination:0,e:e(99)},
    {band:5,destination:0,e:{...e(99),validade:{ok:false}}},{band:3,destination:0,e:{...e(99),auditOnly:true}}
  ]).map(x=>[x.band,x.destination,x.e.snr]);})()`);
  check('Distinct bands sorted by maximum valid endpoint S/N',JSON.stringify(synthetic)===JSON.stringify([[14,1,10],[7,0,8],[21,2,7]]),synthetic);
  check('Unfavorable finite values are not fabricated as favorable',run('rankWelcomeRows([{band:14,destination:0,e:{snr:-80,Pr:-160,Fa:60,validade:{ok:true}}}])[0].e.snr===-80'));
  check('Non-finite and blocked results rejected',run('!welcomeValidResult({snr:Infinity,Pr:-100,Fa:40,validade:{ok:true}})&&!welcomeValidResult({snr:20,Pr:-100,Fa:40,bloqueado:true,validade:{ok:true}})'));
  input('listen-ant','cmp_dipole_050');input('listen-power','100');input('listen-noise','city');input('listen-mode','2400');
  grid('GG67KD');run('S.r12=null');await render();
  check('R12 missing: no invented recommendations',run("welcomeState.status==='unavailable'&&welcomeState.reason==='R12'")&&document.querySelectorAll('#welcome-bands li').length===0);
  document.getElementById('qth-input').value='INVALID';await render();
  check('Invalid grid clears earlier result',run("welcomeState.reason==='GRID'")&&document.querySelectorAll('#welcome-bands li').length===0);
  grid('GG67KD');run('S.r12=72');
  for(const [g,locale] of [['GG67KD','pt'],['FN31PR','en'],['FN03FR','en']]){
    grid(g);run(`S.idioma='${locale}';`);const start=Date.now(),result=await render();
    check(g+' calculation completes',result?.status==='ready');
    check(g+' three distinct bands',result.top.length===3&&new Set(result.top.map(x=>x.band)).size===3);
    check(g+' descending current S/N',result.top.every((x,k,a)=>!k||a[k-1].e.snr>=x.e.snr));
    check(g+' all rows use valid methods',result.top.every(x=>x.e.validade.ok&&!x.e.auditOnly));
    check(g+' UTC minute is frozen across circuit evaluations',result.input.at===clock);
    check(g+' displayed grid and current time',document.getElementById('welcome-context').textContent.includes(g)&&document.getElementById('welcome-context').textContent.includes('2026-09-09 15:30 UTC'));
    check(g+' localized welcome',document.getElementById('welcome-title').textContent===(locale==='en'?'Welcome to AGHIP!':'Bem-vindo ao AGHIP!'));
    check(g+' three ranked cards rendered',document.querySelectorAll('#welcome-bands li').length===3);
    // Fresh independent call through the same physical core, not the map cache.
    const residual=run(`(()=>{const r=welcomeState.top[0];const e=enlaceAbsolutoCore(r.dest.lat,r.dest.lon,r.band,new Date(welcomeState.input.at),welcomeState.input.cfg);return Math.abs(e.snr-r.e.snr);})()`);
    check(g+' headline equals fresh link-budget calculation',residual<1e-10,residual);
    cases.push({grid:g,elapsedMs:Date.now()-start,top:result.top.map(x=>({band:x.band,destination:x.dest.name,snr:x.e.snr,distanceKm:x.e.dk})),valid:result.valid,attempts:result.attempts});
    snapshots[g]=document.getElementById('overview-welcome').textContent;
  }
  const cached=await render();run("S.idioma='pt'");const translated=await render();
  check('Language-only render reuses numeric result',cached===translated);
  check('Language switch relocalizes all welcome text',document.getElementById('welcome-title').textContent==='Bem-vindo ao AGHIP!'&&!document.getElementById('overview-welcome').textContent.includes('Reference destination'));
  const before=translated;input('listen-power','1000');const powered=await render();
  check('Power change invalidates summary cache',powered.input.key!==before.input.key);
  check('10x power gives +10 dB in top results',powered.top.every((x,k)=>x.band===before.top[k].band&&Math.abs(x.e.snr-before.top[k].e.snr-10)<1e-8));
  input('listen-mode','4800');const wider=await render();
  check('Bandwidth change refreshes S/N',wider.top.every((x,k)=>Math.abs(x.e.snr-powered.top[k].e.snr+10*Math.log10(2))<1e-8));
  input('listen-ant','cmp_k9ay');await render();
  check('Unvalidated antenna fails closed',run("welcomeState.reason==='ANTENNA'")&&document.querySelectorAll('#welcome-bands li').length===0);
  input('listen-ant','cmp_dipole_050');input('listen-noise','quietrural');const quiet=await render();
  check('Noise category participates in identity',quiet.input.cfg.catRuido==='quietrural'&&quiet.input.key!==wider.input.key);
  input('listen-noise-measured','-110');input('listen-noise-bw','2400');input('listen-noise-freq','14.1');const measured=await render();
  check('Measured noise participates in identity and core',measured.input.measured.dbm===-110&&measured.top.every(x=>x.e.origemRuido==='OBSERVADO'));
  // Cancel pending work for BR before switching to CA. The previous grid must
  // neither publish stale rows nor overwrite the new state after its await.
  grid('GG67KD');const old=render();grid('FN03FR');const current=render();await Promise.all([old,current]);
  check('Rapid grid switches reject stale calculation',run("welcomeState.input.grid==='FN03FR'&&welcomeState.status==='ready'")&&document.getElementById('welcome-context').textContent.includes('FN03FR'));
  const oldKey=run('welcomeState.input.key');clock+=60000;const fresh=await render();
  check('Current minute changes cache identity',fresh.input.key!==oldKey&&fresh.input.at===clock);
  check('No API requests from welcome feature',fetchCount===0,fetchCount);
  check('No console errors',errors.length===0,errors);
  const report={htmlSha256:crypto.createHash('sha256').update(html).digest('hex'),generatedAt:new NativeDate().toISOString(),summary:{checks:checks.length,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length},checks,cases,snapshots,limitations:['DOM emulation, not real-browser visual or accessibility validation','No live APIs or predictive-accuracy validation','Ranking rule is an AGHIP policy over fixed reference destinations, not an ITU reliability method']};
  fs.writeFileSync(reportFile,JSON.stringify(report,null,2));console.log(JSON.stringify({summary:report.summary,cases,failures:checks.filter(c=>!c.ok)},null,2));
  if(report.summary.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
