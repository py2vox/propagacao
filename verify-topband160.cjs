'use strict';
// Deterministic numerical and DOM-emulation checks. No claims of field validation.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const {parseHTML}=require(path.resolve(process.argv[4]));
const root=path.resolve(process.argv[2]),parentPath=path.resolve(process.argv[3]);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),parent=fs.readFileSync(parentPath,'utf8');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const scripts=x=>[...x.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const checks=[],check=(name,ok,detail)=>checks.push({name,passed:!!ok,...(detail===undefined?{}:{detail})});
const close=(a,b,t=1e-9)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t;
function environment(text){
  const {document,window:dom}=parseHTML(text),errors=[],requests=[];
  Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return(this.querySelector('option[selected]')||this.options[0])?.value||'';},set(value){for(const o of this.options)o.removeAttribute('selected');const o=[...this.options].find(o=>o.value===String(value));if(o)o.setAttribute('selected','');}});
  class FixedDate extends Date{constructor(...v){super(...(v.length?v:['2026-09-09T03:00:00Z']));}static now(){return Date.parse('2026-09-09T03:00:00Z');}}
  const ctx={document,Date:FixedDate,navigator:{onLine:false},location:{protocol:'file:',hostname:'',href:'file:///index.html'},screen:{width:1280,height:720},
    console:{log(){},warn(){},error(...s){errors.push(s.join(' '));}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},
    fetch:async url=>{requests.push(url);throw Error('Network disabled');},URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,
    atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64')};
  ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);
  const app=scripts(text).filter(m=>!m[1].includes('data-aghip-vendor')&&!/type=["']module["']/.test(m[1])).sort((a,b)=>b[2].length-a[2].length)[0][2];
  vm.runInContext(app.slice(0,app.lastIndexOf('\ninitMap();')),ctx,{timeout:30000});
  return{ctx,document,errors,requests,run:s=>vm.runInContext(s,ctx,{timeout:60000})};
}
async function main(){
  const env=environment(html),old=environment(parent),run=env.run;
  run("globalThis.now=new Date('2026-09-09T03:00:00Z');");
  const changed=new Set(['topband160Median','topband160Geometry','topband160Observation','topband160Noise','renderTopband160','renderHF','p1147Predict','loadGroundTruth','estatGroundTruth','renderGroundTruth','topband160Windows','topband160SelectSpots','loadWeather','loadTropo','loadAllData','classificarRefracao','a11yTropoTable']);
  const unchanged=Object.keys(old.ctx).filter(k=>typeof old.ctx[k]==='function'&&!changed.has(k));
  check('Existing functions outside declared scope unchanged',unchanged.every(k=>String(old.ctx[k])===String(env.ctx[k])),{compared:unchanged.length});
  check('HF P.533 equations unchanged',String(old.ctx.p533_ModoF2)===String(env.ctx.p533_ModoF2));
  check('P.1147 budget equations unchanged',String(old.ctx.p1147Budget)===String(env.ctx.p1147Budget));
  check('WSPR provider hardened with request identity',String(env.ctx.loadGroundTruth).includes('groundTruthRequestEpoch'));
  check('All vendor scripts unchanged',JSON.stringify(scripts(parent).filter(s=>s[1].includes('data-aghip-vendor')).map(s=>s[0]))===JSON.stringify(scripts(html).filter(s=>s[1].includes('data-aghip-vendor')).map(s=>s[0])));
  check('P1147 1836 kHz rejected',run("p1147Predict({tx:{lat:40,lon:-75},rx:{lat:35,lon:-80},now,fKHz:1836,powerW:100,efficiency:1,gh:0,region:'general'}).reason")==='FREQUENCY_DOMAIN');
  check('P533 1.836 MHz rejected',run('p533FrequencyInDomain(1.836)')===false);
  for(const [input,expected] of [[null,null],['',null],[' ',null],['x',null],['0',0],[0,0],['10',10],[false,null]])check('Strict number '+JSON.stringify(input),run('topband160Number('+JSON.stringify(input)+')')===expected);
  for(const input of ['',null,'2026-09-09','2026-02-30T03:00:00Z','2026-09-09T99:00:00Z'])check('Reject invalid UTC '+input,run('topband160Utc('+JSON.stringify(input)+')')===null);
  check('UTC SQL string equals ISO Z',run("topband160Utc('2026-09-09 03:00:00')===topband160Utc('2026-09-09T03:00:00Z')"));
  for(const factor of [.01,.1,.5,1,2,10,100]){
    const a=run(`topband160Normalize(-20,10,${10*factor},2500,2500)`);
    check('Power ratio '+factor,close(a.snrDb,-20+10*Math.log10(factor)));
    const b=run(`topband160Normalize(-20,10,10,2500,${2500*factor})`);
    check('Bandwidth ratio '+factor,close(b.snrDb,-20-10*Math.log10(factor)));
  }
  check('10 dB additional noise reduces SNR by 10 dB',close(run('topband160Normalize(-20,10,10,2500,2500,10).snrDb'),-30));
  for(const invalid of ['null','NaN','Infinity','0','-1'])check('Reject invalid power '+invalid,run(`topband160Normalize(-20,${invalid},100,2500,500)` )===null);
  run("globalThis.ref={sameSystem:true,exactTransmitter:true,routeKey:'route',antennaKey:'antenna',frequencyMHz:1.836,at:now.getTime(),noiseDbm:null,snrDb:-20,powerW:10,bwHz:2500};globalThis.scenario={...ref,powerW:100,bwHz:500};");
  check('Conditional reference 10x power and 5x narrower bandwidth',close(run('topband160Transfer(ref,scenario,now).snrDb'),-3.010299956639812));
  for(const [patch,reason] of [[{sameSystem:false},'SYSTEM_CONFIRMATION_REQUIRED'],[{exactTransmitter:false},'TRANSMITTER_GRID_REQUIRED'],[{routeKey:'different'},'CONFIGURATION_CHANGED'],[{antennaKey:'other'},'CONFIGURATION_CHANGED'],[{frequencyMHz:1.9},'FREQUENCY_MISMATCH'],[{at:null},'REFERENCE_TIME'],[{at:Date.parse('2026-09-09T03:00:01Z')},'REFERENCE_TIME'],[{at:Date.parse('2026-09-09T02:29:59Z')},'REFERENCE_TIME'],[{noiseDbm:-100},'PAIRED_NOISE_REQUIRED'],[{snrDb:null},'INVALID_NUMERIC_INPUT']])check('Reference gate '+reason+JSON.stringify(patch),run(`topband160Transfer({...ref,...${JSON.stringify(patch)}},scenario,now).reason`)===reason);
  check('Noise measured at same RBW adjusts SNR',close(run('topband160Transfer({...ref,noiseDbm:-100},{...scenario,noiseDbm:-94},now).noiseDensityChangeDb'),6));
  run('globalThis.equinox={decl:0,sunLon:0};');
  const geom=(a,b)=>run(`topband160Geometry(${JSON.stringify(b)},now,${JSON.stringify(a)},equinox)`);
  const half=geom({lat:0,lon:60},{lat:0,lon:120});
  check('Analytical equatorial arc half in night',close(half.darkFraction,.5));
  check('90 km shadow boundary angle',close(half.horizonDepressionDeg,Math.acos(6371/6461)*180/Math.PI));
  check('90 km shadow fraction less than surface night',half.shadow90Fraction<half.darkFraction);
  const lit=geom({lat:0,lon:0},{lat:0,lon:60}),dark=geom({lat:0,lon:120},{lat:0,lon:-120});
  check('Fully sunlit arc has zero night/shadow',lit.darkFraction===0&&lit.shadow90Fraction===0);
  check('Date-line short arc fully shadowed',close(dark.darkFraction,1)&&close(dark.shadow90Fraction,1));
  check('Sol above horizon is not night',!geom({lat:0,lon:89},{lat:0,lon:89.5}).qthNight);
  check('Exact antipodes refused',geom({lat:0,lon:0},{lat:0,lon:180}).reason==='ANTIPODAL_PATH_AMBIGUOUS');
  check('Coincident points finite',geom({lat:0,lon:120},{lat:0,lon:120}).ok);
  // Independent dense Cartesian-vector sampling of solar zenith cosine.
  function numerical(a,b){
    const rad=Math.PI/180,v=p=>[Math.cos(p.lat*rad)*Math.cos(p.lon*rad),Math.cos(p.lat*rad)*Math.sin(p.lon*rad),Math.sin(p.lat*rad)];
    const u=v(a),w=v(b),theta=Math.acos(u.reduce((s,x,i)=>s+x*w[i],0)),threshold=-Math.sqrt(1-(6371/6461)**2);
    let night=0,shadow=0,N=12000;
    for(let i=0;i<N;i++){const f=(i+.5)/N,x=(u[0]*Math.sin((1-f)*theta)+w[0]*Math.sin(f*theta))/Math.sin(theta);night+=x<0;shadow+=x<threshold;}
    return{night:night/N,shadow:shadow/N};
  }
  for(let i=0;i<20;i++){
    const a={lat:-70+i*6.2,lon:-179+i*11.3},b={lat:65-i*5.1,lon:140-i*7.3},g=geom(a,b),reverse=geom(b,a),n=numerical(a,b);
    check('Arc integration vs 12000-point independent sample '+i,close(g.darkFraction,n.night,2/12000)&&close(g.shadow90Fraction,n.shadow,2/12000));
    check('Arc reversal invariant '+i,close(g.darkFraction,reverse.darkFraction,1e-8)&&close(g.shadow90Fraction,reverse.shadow90Fraction,1e-8));
    check('Shadow subset of night '+i,g.shadow90Fraction<=g.darkFraction+1e-9);
  }
  run("globalThis.rx={lat:40,lon:-75};globalThis.tx={lat:50,lon:0};globalThis.spot={time:'2026-09-09T02:50:00Z',band:1,code:1,frequency:1836600,power:37,snr:-20,tx_sign:'G0ABC',rx_sign:'W1ABC',tx_loc:'JO00',rx_loc:'FN20',tx_lat:50,tx_lon:0,rx_lat:40,rx_lon:-75};");
  check('Valid incoming spot kept',run('topband160SelectSpots([spot],rx,tx,now).spots[0].direction')==='TOWARD_QTH');
  for(const [patch,reason] of [[{time:null},'MISSING_FUTURE_OR_OLD_TIME'],[{time:'2026-09-09T03:01:00Z'},'MISSING_FUTURE_OR_OLD_TIME'],[{time:'2026-09-09T00:59:59Z'},'MISSING_FUTURE_OR_OLD_TIME'],[{power:null},'METADATA'],[{snr:''},'METADATA'],[{rx_lat:null},'METADATA'],[{tx_sign:'<script>'},'METADATA'],[{frequency:1700000},'BAND_FREQUENCY_MODE'],[{code:3},'BAND_FREQUENCY_MODE'],[{rx_lat:20},'ENDPOINT_DISTANCE']])check('Spot rejection '+JSON.stringify(patch),run(`topband160SelectSpots([{...spot,...${JSON.stringify(patch)}}],rx,tx,now).rejected['${reason}']`)===1);
  check('Zero dBm is valid declared power',run('topband160SelectSpots([{...spot,power:0}],rx,tx,now).spots.length')===1);
  check('Duplicate excluded',run('topband160SelectSpots([spot,spot],rx,tx,now).rejected.DUPLICATE')===1);
  check('Reverse path is separate',run('topband160SelectSpots([{...spot,tx_lat:40,tx_lon:-75,rx_lat:50,rx_lon:0}],rx,tx,now).spots[0].direction')==='FROM_QTH');
  check('Antimeridian SQL handles wrap',run("topband160BoxSql('rx',{lat:0,lon:179.9})").includes(' OR '));
  check('Polar box needs no longitude filter',!run("topband160BoxSql('rx',{lat:89.9,lon:0})").includes('_lon'));
  run("renderTopband160(DESTINATIONS[0],now);");
  for(const en of [true,false,true,false]){
    run("S.idioma='"+(en?'en':'pt')+"';renderTopband160(DESTINATIONS[0],now);");
    const text=env.document.getElementById('hf-topband160-card').textContent;
    check('Native title '+en+checks.length,text.includes(en?'160 meters — reception and geometry laboratory':'160 m — laboratório de recepção e geometria'));
    check('No fallback placeholder in new panel '+en+checks.length,!text.includes('Translation unavailable'));
    check('P1147 limits remain visible '+en+checks.length,text.includes('1,700')||text.includes('1.700'));
  }
  for(const lang of ['en','pt']){
    run("S.idioma='"+lang+"';S.mode='"+(lang==='en'?'US':'BR')+"';applyOperationalPresentation();renderHF(false);");
    check('Full HF render keeps Top Band panel '+lang,env.document.getElementById('topband160-result').textContent.length>200);
    check('Scientific identity preserved '+lang,env.document.title==='AGHIP — Analysis of Geospace and High-frequency Ionospheric Propagation');
  }
  run("document.getElementById('topband-tx-grid').value='JO00AA';document.getElementById('topband-ref-snr').value='-20';document.getElementById('topband-ref-time').value='2026-09-09T03:00:00Z';document.getElementById('topband-ref-same').checked=true;topband160SaveReference();");
  check('UI reference produces conditional result',run('topband160LastResult.conditionalResult.ok'));
  run("document.getElementById('topband-tx-grid').value='FN31';renderTopband160(null,now);");
  check('Changing transmitter invalidates calibration',run('topband160LastResult.conditionalResult.reason')==='CONFIGURATION_CHANGED');
  run("document.getElementById('topband-tx-grid').value='INVALID';renderTopband160(null,now);");
  check('Invalid transmitter suppresses stale output',run('topband160LastResult')===null);
  // Simulated asynchronous responses test actual adapter, without any live API.
  run("document.getElementById('topband-tx-grid').value='JO00AA';globalThis.pending=[];fetchWithTimeout=(url)=>new Promise(resolve=>pending.push({url,resolve}));globalThis.requestA=loadTopband160();document.getElementById('topband-tx-grid').value='FN31';globalThis.requestB=loadTopband160();");
  check('Adapter requests its own band-specific data',run("pending.length===2&&decodeURIComponent(pending[0].url).includes('WHERE band = 1')"));
  run("pending[1].resolve({ok:true,json:async()=>({data:[]})});");await env.ctx.requestB;
  const key=run('S.topband160Meta.routeKey');
  run("pending[0].resolve({ok:true,json:async()=>({data:[spot]})});");await env.ctx.requestA;
  check('Late old-grid response ignored',run('S.topband160Meta.routeKey')===key&&run('S.topband160Raw.length')===0);
  run("fetchWithTimeout=async()=>({ok:false,status:503});globalThis.failed=loadTopband160();");await env.ctx.failed;
  check('HTTP failure is unavailable, not zero reception',run('S.topband160Meta.status')==='UNAVAILABLE');
  check('No console errors in exercised rendering',env.errors.length===0,env.errors);
  check('No actual network calls during deterministic checks',env.requests.length===0);
  const summary={passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length};
  fs.writeFileSync(path.join(root,'topband160-results.json'),JSON.stringify({release:"AGHIP-review-2026.09.09-r11-doi.1",htmlSha256:hash(html),summary,
    limits:{realBrowser:false,liveApi:false,predictiveValidation:false,p1147Figure4:'OPEN'},checks},null,2));
  console.log(JSON.stringify({summary,failures:checks.filter(x=>!x.passed)}));if(summary.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
