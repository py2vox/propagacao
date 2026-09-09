'use strict';
// Deterministic fault injection and state/locale integration. Not a browser.
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const {parseHTML}=require(process.argv[4]);
const file=process.argv[2],reportFile=process.argv[3],html=fs.readFileSync(file,'utf8');
const {document,window:dom}=parseHTML(html),checks=[],errors=[];
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return(this.querySelector('option[selected]')||this.options[0])?.value||'';},set(value){for(const o of this.options)o.removeAttribute('selected');const o=[...this.options].find(o=>o.value===String(value));if(o)o.setAttribute('selected','');}});
class FixedDate extends Date{constructor(...v){super(...(v.length?v:['2026-09-09T03:00:00Z']));}static now(){return Date.parse('2026-09-09T03:00:00Z');}}
const ctx={document,Date:FixedDate,navigator:{onLine:false},screen:{width:1280,height:720},location:{protocol:'file:',hostname:'',href:'file:///index.html'},console:{log(){},warn(){},error(...s){errors.push(s.join(' '));}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},fetch:async()=>{throw Error('Network prohibited');},URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64')};
ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
const app=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
vm.runInContext(app.slice(0,app.lastIndexOf('\ninitMap();')),ctx,{timeout:30000});
const run=s=>vm.runInContext(s,ctx,{timeout:60000});
async function main(){
  run("globalThis.rx={lat:40,lon:-75};globalThis.tx={lat:50,lon:0};globalThis.now=new Date();");
  for(const value of ['null','{}','false','""']){
    check('160 m rejects invalid collection '+value,run(`topband160SelectSpots(${value},rx,tx,now).rejected.INVALID_COLLECTION`)===1);
  }
  check('160 m malformed rows do not crash',run('topband160SelectSpots([null,undefined,[],42,false],rx,tx,now).rejected.INVALID_ROW')===5);
  run('globalThis.originalGeometry=topband160Geometry;topband160Geometry=(dest,at)=>({ok:true,shadow90Fraction:at.getTime()===now.getTime()+86400000?1:0});');
  check('No zero-duration shadow window at horizon boundary',run('topband160Windows(tx,now,rx).windows.length')===0);
  run('topband160Geometry=originalGeometry;');
  run("globalThis.spot={band:7,snr:-20,power:0,time:'2026-09-09 02:58:00',code:1,frequency:7038600,tx_sign:'W1ABC',rx_sign:'VE3ABC'};");
  check('Declared zero dBm preserved',run('groundTruthSelectRows([spot],Date.now()).bands[7].spots[0].pot')===0);
  for(const value of ['null','undefined','""','false','NaN'])check('HF rejects absent power '+value,run(`groundTruthSelectRows([{...spot,power:${value}}],Date.now()).rejected.POWER`)===1);
  for(const time of [null,'2026-09-09T04:00:00Z','2026-09-08 18:00:00','2026-02-30 02:00:00',''])check('HF rejects invalid time '+time,run(`groundTruthSelectRows([{...spot,time:${JSON.stringify(time)}}],Date.now()).rejected.TIME`)===1);
  check('UTC Z timestamp accepted once',run("groundTruthSelectRows([{...spot,time:'2026-09-09T02:58:00Z'}],Date.now()).bands[7].count")===1);
  check('Non-WSPR mode excluded',run('groundTruthSelectRows([{...spot,code:3}],Date.now()).rejected.BAND_MODE_SNR')===1);
  check('Malformed HF rows skipped',run('groundTruthSelectRows([null,[],false],Date.now()).rejected.ROW')===3);
  check('Exact duplicate excluded',run('groundTruthSelectRows([spot,spot],Date.now()).rejected.DUPLICATE')===1);
  check('Regional box wraps date line',run("groundTruthBoxSql('tx',{lat:0,lon:179})").includes(' OR '));
  check('Regional box clamps latitude',run("groundTruthBoxSql('rx',{lat:89,lon:0})").includes('BETWEEN 80 AND 90'));
  // Existing public mode switch, with expensive renders and network suppressed;
  // dedicated presentation suites exercise the unstubbed renderers separately.
  run('renderHF=()=>{};renderWelcomeBands=()=>{};updateQthRegionAndAlerts=()=>{};meteoIniciado=true;');
  for(const mode of ['US','BR','US','BR']){
    run(`setMode('${mode}',true);`);const lang=mode==='US'?'en-US':'pt-BR';
    check('Document locale '+mode+checks.length,document.documentElement.lang===lang);
    check('Tagline language updated '+mode+checks.length,[...document.querySelectorAll('[data-aghip-tagline]')].every(el=>el.lang===lang));
    check('Tagline text updated '+mode+checks.length,[...document.querySelectorAll('[data-aghip-tagline]')].every(el=>el.textContent.startsWith(mode==='US'?'An integrated':'Um ambiente')));
    for(const tab of ['mapa','meteo','hf','vhf','eme','info']){
      run(`switchTab('${tab}');`);
      check(mode+' active tab '+tab,document.getElementById('tab-'+tab).getAttribute('aria-selected')==='true'&&!document.getElementById('panel-'+tab).hidden);
      check(mode+' exactly one selected tab '+tab,document.querySelectorAll('[role="tab"][aria-selected="true"]').length===1);
    }
  }
  check('No fabricated DOI metadata',!document.querySelector('meta[name="citation_doi"]'));
  // Exercise the actual WSPR adapter with responses delivered out of order.
  run("globalThis.originalGT=renderGroundTruth;renderGroundTruth=()=>{};globalThis.pending=[];fetchWithTimeout=url=>new Promise(resolve=>pending.push({url,resolve}));document.getElementById('dest-sel').value='0';globalThis.a=loadGroundTruth(DESTINATIONS[0]);document.getElementById('dest-sel').value='1';globalThis.b=loadGroundTruth(DESTINATIONS[1]);");
  run('pending[1].resolve({ok:true,json:async()=>({data:[]})});');await ctx.b;
  const key=run('S.groundTruthMeta.routeKey');
  run('pending[0].resolve({ok:true,json:async()=>({data:[spot]})});');await ctx.a;
  check('HF late result cannot replace new route',run('S.groundTruthMeta.routeKey')===key&&run('Object.keys(S.groundTruth).length')===0);
  run("fetchWithTimeout=async()=>({ok:false,status:503});globalThis.fail=loadGroundTruth(DESTINATIONS[1]);");await ctx.fail;
  check('HF failure is unavailable rather than zero',run('S.groundTruthMeta.status')==='UNAVAILABLE');
  run('renderGroundTruth=originalGT;renderGroundTruth(DESTINATIONS[1]);');
  check('Unavailable HF table does not say no spots',document.getElementById('gt-tbody').textContent.includes('indisponíveis'));
  // Actual meteorology request lifecycles; no numerical weather API invoked.
  run("globalThis.pending=[];fetchWithTimeout=url=>new Promise(resolve=>pending.push({url,resolve}));QTH.lat=40;QTH.lon=-75;globalThis.a=loadWeather();QTH.lat=45;QTH.lon=-76;globalThis.b=loadWeather();globalThis.wx={current:{temperature_2m:20,relative_humidity_2m:50,wind_speed_10m:10,wind_gusts_10m:20,time:'2026-09-09T03:00'}};");
  run('pending[1].resolve({ok:true,json:async()=>wx});');await ctx.b;
  run('pending[0].resolve({ok:true,json:async()=>({current:{...wx.current,temperature_2m:99}})});');await ctx.a;
  check('Weather late response ignored',document.getElementById('w-temp').textContent==='20.0°C');
  run('fetchWithTimeout=async()=>({ok:true,json:async()=>({current:{...wx.current,wind_gusts_10m:null}})});globalThis.fail=loadWeather();');await ctx.fail;
  check('Missing gust clears old values',document.getElementById('w-temp').textContent==='—'&&document.getElementById('wind-safety').textContent==='');
  run("fetchWithTimeout=async()=>({ok:true,json:async()=>({current:{...wx.current,time:'2026-09-08T03:00'}})});globalThis.fail=loadWeather();");await ctx.fail;
  check('Old model time not displayed as current',document.getElementById('w-temp').textContent==='—');
  run("globalThis.pending=[];fetchWithTimeout=url=>new Promise(resolve=>pending.push({url,resolve}));QTH.lat=40;globalThis.a=loadTropo();QTH.lat=45;globalThis.b=loadTropo();");
  run('pending[1].resolve({ok:false});');await ctx.b;
  document.getElementById('tropo-verdict').textContent='NEW ROUTE SENTINEL';
  run('pending[0].resolve({ok:false});');await ctx.a;
  check('Old tropo failure cannot clear new route',document.getElementById('tropo-verdict').textContent==='NEW ROUTE SENTINEL');
  run("fetchWithTimeout=async()=>({ok:true,json:async()=>({elevation:0,hourly:{time:['2026-09-09T03:00'],temperature_2m:[null],relative_humidity_2m:[null],surface_pressure:[null]}})});globalThis.fail=loadTropo();");await ctx.fail;
  check('Null vertical profile not converted to measurements',document.getElementById('tropo-verdict').textContent==='');
  check('Tropo missing intervals split anomaly windows',String(ctx.loadTropo).includes('if(!c){if(atual)janelas.push(atual);atual=null;return;}'));
  check('Tropo time strip retains unavailable hours',String(ctx.loadTropo).includes('Missing profile — not assessed'));
  check('English subrefraction label is mapped from same classifier',String(ctx.loadTropo).includes("'Sub-refração':'Subrefraction'"));
  check('Accessible classification agrees with reference threshold',String(ctx.a11yTropoTable).includes("g>=DNDH_REFERENCIA_P453?'sub':'normal'"));
  check('Kp strict finite gate',String(ctx.loadAllData).includes('Number.isFinite(h.kp)&&h.kp>=0&&h.kp<=9'));
  check('Dst strict finite gate',String(ctx.loadAllData).includes('Number.isFinite(h.dst)'));
  check('R12 strict null gate',String(ctx.loadAllData).includes('topband160Number(x.smoothed_ssn)!==null'));
  check('X-ray strictly positive numeric flux',String(ctx.loadAllData).includes('Number.isFinite(row.flux)&&row.flux>0'));
  check('No console errors in exercised states',errors.length===0,errors);
  const summary={checks:checks.length,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length};
  fs.writeFileSync(reportFile,JSON.stringify({htmlSha256:crypto.createHash('sha256').update(html).digest('hex'),summary,checks,scope:'Deterministic fault injection and DOM state emulation; not live, visual, predictive or expert validation'},null,2));
  console.log(JSON.stringify({summary,failures:checks.filter(c=>!c.ok)},null,2));if(summary.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
