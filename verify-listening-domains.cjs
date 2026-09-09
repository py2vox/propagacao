'use strict';
/* Deterministic diagnostics tests. No APIs, browser, or predictive certification.
   node verify-listening-domains.cjs index.html report.json /path/to/linkedom */
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const {parseHTML}=require(process.argv[4]||'linkedom');
const file=process.argv[2]||path.join(__dirname,'index.html');
const reportFile=process.argv[3]||path.join(__dirname,'listening-domains-results.json');
const html=fs.readFileSync(file,'utf8'),{document}=parseHTML(html);
const app=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(s=>!s[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
const checks=[],errors=[],snapshots={};let fetchCount=0;
const ctx={document,Date,console:{log(){},warn(){},error:(...x)=>errors.push(x.join(' '))},
  navigator:{onLine:false},location:{protocol:'file:',hostname:'',href:'file:///index.html'},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},
  MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},
  fetch:async()=>{fetchCount++;throw Error('No network in test');},
  URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
  atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
const cut=app.lastIndexOf('\ninitMap();');if(cut<0)throw Error('No bootstrap boundary');
new vm.Script(app.slice(0,cut)).runInContext(ctx,{timeout:30000});
const run=code=>vm.runInContext(code,ctx,{timeout:60000});
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
const close=(a,b,tol=1e-8)=>Number.isFinite(a)&&Math.abs(a-b)<=tol;
const bounds={p1147:[50,12000],lfVerified:[50,7500],p1546Upper:[0,1000],p1812:[0.25,3000],es:[500,2200],ms:[300,2200],tep:[2500,9000]};
for(const [key,[lo,hi]] of Object.entries(bounds)){
  for(const d of [lo-.001,lo,lo+.001,hi-.001,hi,hi+.001])check(key+' boundary '+d,run(`listeningDomainEligibility(${d}).${key}`)===(d>=lo&&d<=hi));
  for(const d of ['NaN','Infinity','-1'])check(key+' rejects '+d,run(`listeningDomainEligibility(${d}).${key}`)===false);
}
run("globalThis.fixed=new Date('2026-09-09T15:30:00Z');globalThis.site={lat:-22.8541666667,lon:-47.125};globalThis.target={lat:40,lon:-75};QTH.lat=site.lat;QTH.lon=site.lon;");
check('Limits object immutable',run('Object.isFrozen(LISTENING_DOMAIN_LIMITS)'));
const baseline=run("listeningReferenceNoise(1,2400,'city',fixed,site)");
check('Actual MF climatology finite',baseline.source==='CLIMATOLOGY'&&Number.isFinite(baseline.faDb)&&Number.isFinite(baseline.noiseDbm),baseline);
const wider=run("listeningReferenceNoise(1,4800,'city',fixed,site)");
check('Double bandwidth raises noise by 3.0102999566 dB',close(wider.noiseDbm-baseline.noiseDbm,10*Math.log10(2)));
check('Bandwidth does not change Fa',wider.faDb===baseline.faDb);
check('Quiet rural noise differs from city',run("listeningReferenceNoise(1,2400,'quietrural',fixed,site).faDb")!==baseline.faDb);
check('Invalid category never substituted',run("listeningReferenceNoise(1,2400,'invalid',fixed,site).source")==='UNAVAILABLE');
for(const bw of ['0','-1','NaN','Infinity'])check('Noise rejects bandwidth '+bw,run(`listeningReferenceNoise(1,${bw},'city',fixed,site).reason`)==='INVALID_INPUT');
for(const f of ['0','-1','NaN','Infinity'])check('Noise rejects frequency '+f,run(`listeningReferenceNoise(${f},2400,'city',fixed,site).reason`)==='INVALID_INPUT');
check('Invalid date explicit',run("listeningReferenceNoise(1,2400,'city',new Date('invalid'),site).reason")==='INVALID_INPUT');
for(const p of ['null','{lat:NaN,lon:0}','{lat:91,lon:0}','{lat:0,lon:181}'])check('Noise rejects coordinates '+p,run(`listeningReferenceNoise(1,2400,'city',fixed,${p}).reason`)==='INVALID_INPUT');
run('globalThis.savedNoise=p372RuidoTotal;globalThis.noiseCalls=0;p372RuidoTotal=(...args)=>{noiseCalls++;globalThis.noiseArgs=args;return {FamT:76.9};};');
const fixture=run("listeningReferenceNoise(1,2400,'city',fixed,site)");
check('Independent 76.9 dB / 2400 Hz arithmetic fixture',close(fixture.noiseDbm,-63.29788758288393));
const args=run('noiseArgs');
check('Noise inputs UTC September/hour 15',args[0]===8&&args[1]===15);
check('Noise inputs longitude and latitude converted to radians',close(args[2],-47.125*Math.PI/180)&&close(args[3],-22.8541666667*Math.PI/180));
check('LF excludes incomplete total',run("listeningReferenceNoise(.198,2400,'city',fixed,site).reason")==='MAN_MADE_EXPRESSION_LOWER_BOUND');
check('LF does not call out-of-domain coefficients',run('noiseCalls')===1);
for(const value of ['null','{FamT:NaN}','{FamT:Infinity}']){
  run(`p372RuidoTotal=()=>(${value});`);
  check('Bad coefficients are missing, not zero: '+value,run("listeningReferenceNoise(1,2400,'city',fixed,site).noiseDbm")===null);
}
run('p372RuidoTotal=()=>{throw Error("fixture");};');
check('Coefficient exception explicit',run("listeningReferenceNoise(1,2400,'city',fixed,site).reason")==='NOISE_CALCULATION_UNAVAILABLE');
run('p372RuidoTotal=savedNoise;');
const g=run('listeningRouteGeometry(site,target,fixed)');
check('Route geometry finite',g.distanceKm>0&&g.sunElevationDeg.every(Number.isFinite));
const reverse=run('listeningRouteGeometry(target,site,fixed)');
check('Route distance reciprocal',close(g.distanceKm,reverse.distanceKm));
check('Endpoint solar geometry follows coordinates',close(g.sunElevationDeg[0],reverse.sunElevationDeg[2])&&close(g.sunElevationDeg[2],reverse.sunElevationDeg[0]));
check('Midpoint solar geometry reciprocal',close(g.sunElevationDeg[1],reverse.sunElevationDeg[1]));
const anti=run('listeningRouteGeometry({lat:0,lon:0},{lat:0,lon:180},fixed)');
check('Antipodal midpoint not invented',anti.midpointAmbiguous&&anti.sunElevationDeg[1]===null);
const same=run('listeningRouteGeometry(site,site,fixed)');
check('Same location handled',same.distanceKm===0&&same.sunElevationDeg.every(x=>close(x,same.sunElevationDeg[0])));
const dateline=run('listeningRouteGeometry({lat:0,lon:179},{lat:0,lon:-179},fixed)');
check('Dateline short path approximately 222 km',close(dateline.distanceKm,6371*Math.PI/90,1e-6));
check('Different UTC changes geometric context',run("listeningRouteGeometry(site,target,new Date('2026-09-09T03:30:00Z')).sunElevationDeg[0]")!==g.sunElevationDeg[0]);
for(const p of ['null','{lat:NaN,lon:0}','{lat:0,lon:181}'])check('Route rejects invalid target '+p,run(`listeningRouteGeometry(site,${p},fixed)`)==null);
check('Route rejects invalid date',run("listeningRouteGeometry(site,target,new Date('invalid'))")===null);

const host=document.createElement('div');document.body.appendChild(host);
for(const en of [false,true]){
  document.getElementById('vhf-dest-grid').value='PM95';
  host.innerHTML=run('radioescutaOutrosDominios(target,100,"city",2400,fixed,'+en+')');
  check((en?'EN':'PT')+' VHF-only legacy adapter',host.querySelectorAll('[data-listen-domain]').length===1&&!!host.querySelector('[data-listen-domain="vhf"]'));
  check((en?'EN':'PT')+' VHF no fallback',!host.textContent.includes('Translation unavailable'));
  check((en?'EN':'PT')+' VHF distant route remains unranked',host.textContent.includes(en?'outside the available distance screens':'fora das triagens de distância'));
  check((en?'EN':'PT')+' VHF separate from HF destination',host.textContent.includes('PM95'));
  check((en?'EN':'PT')+' VHF no probability',!host.textContent.includes('/100'));
  check((en?'EN':'PT')+' table caption and scoped headers',host.querySelectorAll('table caption').length===1&&host.querySelectorAll('th:not([scope])').length===0);
}
document.getElementById('vhf-dest-grid').value='GG67KD';
host.innerHTML=run('radioescutaOutrosDominios(target,100,"city",2400,fixed,true)');
check('Short VHF path invites terrestrial analysis',host.textContent.includes('Terrestrial analysis still required'));
document.getElementById('vhf-dest-grid').value='BAD<script>';
host.innerHTML=run('radioescutaOutrosDominios(target,100,"city",2400,fixed,true)');
check('Invalid VHF grid requests valid destination',host.textContent.includes('Enter the other station'));
check('Invalid grid cannot inject markup',host.querySelectorAll('script').length===0);
check('Foundations issue no API calls',fetchCount===0);
check('No console errors',errors.length===0,errors);
const report={htmlSha256:crypto.createHash('sha256').update(html).digest('hex'),generatedAt:new Date().toISOString(),
summary:{checks:checks.length,passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length},checks,
limitations:['Domains/noise/geometry regression plus VHF DOM adapter. LF/MF UI now tested in verify-p1147.cjs.','No real-browser, live-provider or predictive-accuracy validation']};
fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({summary:report.summary,failures:checks.filter(x=>!x.ok)},null,2));if(report.summary.failed)process.exitCode=1;
