'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
// Reuse only the sandbox bootstrap, not the assertions under investigation.
const bootstrap=fs.readFileSync(path.join(__dirname,'verify-submission.cjs'),'utf8').split('async function main(){')[0];
const env=new Function('require','process',bootstrap+'\nreturn {run,ctx,document};')(require,process);
const {run,ctx,document}=env,findings=[];
async function main(){
  run("globalThis.rx={lat:40,lon:-75};globalThis.tx={lat:50,lon:0};globalThis.now=new Date();");
  let throws=false;try{run('topband160SelectSpots([null],rx,tx,now)');}catch(_){throws=true;}
  findings.push({id:'TOPBAND_NULL_ROW',reproduced:throws});
  run('topband160Geometry=(dest,at)=>({ok:true,shadow90Fraction:at.getTime()===now.getTime()+86400000?1:0});');
  findings.push({id:'ZERO_DURATION_WINDOW',reproduced:run('topband160Windows(tx,now,rx).windows.some(w=>w.start===w.end)')});
  run("renderGroundTruth=()=>{};globalThis.pending=[];fetchWithTimeout=url=>new Promise(resolve=>pending.push({url,resolve}));document.getElementById('dest-sel').value='0';globalThis.a=loadGroundTruth(DESTINATIONS[0]);document.getElementById('dest-sel').value='1';globalThis.b=loadGroundTruth(DESTINATIONS[1]);");
  run('pending[1].resolve({ok:true,json:async()=>({data:[]})});');await ctx.b;
  run("pending[0].resolve({ok:true,json:async()=>({data:[{band:7,snr:-20,power:null,time:'2026-09-09 02:58:00'}]})});");await ctx.a;
  findings.push({id:'LATE_HF_RESPONSE',reproduced:run('S.groundTruth[7]?.count')===1});
  findings.push({id:'NULL_POWER_AS_ZERO',reproduced:run('S.groundTruth[7]?.spots[0]?.pot')===0});
  run("globalThis.pending=[];fetchWithTimeout=url=>new Promise(resolve=>pending.push({url,resolve}));QTH.lat=40;globalThis.a=loadWeather();QTH.lat=45;globalThis.b=loadWeather();globalThis.wx={current:{temperature_2m:20,relative_humidity_2m:50,wind_speed_10m:10,wind_gusts_10m:20,time:'2026-09-09T03:00'}};");
  run('pending[1].resolve({ok:true,json:async()=>wx});');await ctx.b;
  run('pending[0].resolve({ok:true,json:async()=>({current:{...wx.current,temperature_2m:99}})});');await ctx.a;
  findings.push({id:'LATE_WEATHER_RESPONSE',reproduced:document.getElementById('w-temp').textContent==='99.0°C'});
  run("globalThis.pending=[];fetchWithTimeout=url=>new Promise(resolve=>pending.push({url,resolve}));QTH.lat=40;globalThis.a=loadTropo();QTH.lat=45;globalThis.b=loadTropo();");
  run('pending[1].resolve({ok:false});');await ctx.b;document.getElementById('tropo-verdict').textContent='NEW ROUTE';
  run('pending[0].resolve({ok:false});');await ctx.a;
  findings.push({id:'LATE_TROPO_FAILURE',reproduced:document.getElementById('tropo-verdict').textContent===''});
  const hash=crypto.createHash('sha256').update(fs.readFileSync(process.argv[2])).digest('hex');
  fs.writeFileSync(process.argv[3],JSON.stringify({htmlSha256:hash,scope:'Synthetic failure reproduction on sealed r10; no live observations invented',findings},null,2));console.log(JSON.stringify(findings));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
