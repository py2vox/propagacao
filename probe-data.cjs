'use strict';
// Explicit opt-in live sample probes. Never reads localStorage or personal keys.
const fs=require('fs');
if(!process.argv.includes('--live'))throw Error('Use --live to authorize public read-only requests');
const targets=[
 ['SFI','https://services.swpc.noaa.gov/products/summary/10cm-flux.json'],
 ['Kp','https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'],
 ['Dst','https://services.swpc.noaa.gov/products/kyoto-dst.json'],
 ['R12','https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json'],
 ['Bz','https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json'],
 ['X-ray','https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json'],
 ['GIRO relay','https://ionocast.org/api/kc2g'],
 ['USGS','https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'],
 ['RainViewer','https://api.rainviewer.com/public/weather-maps.json'],
 ['Open-Meteo public reference point','https://api.open-meteo.com/v1/forecast?latitude=38.9&longitude=-77.04&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m'],
 ['WSPR sample','https://db1.wspr.live/?query='+encodeURIComponent('SELECT time, band, frequency, power, snr, code, tx_sign, rx_sign, tx_loc, rx_loc, tx_lat, tx_lon, rx_lat, rx_lon FROM wspr.rx WHERE band = 1 AND time > subtractHours(now(),2) AND code IN (1,2) ORDER BY time DESC LIMIT 1 FORMAT JSON')]
];
async function main(){
 const results=[];
 // Two concurrent requests at most; just one time/band-filtered WSPR query.
 let next=0;async function worker(){while(next<targets.length){const [provider,url]=targets[next++],at=new Date().toISOString();try{
   const r=await fetch(url,{signal:AbortSignal.timeout(20000)}),text=await r.text();
   let j=null;try{j=JSON.parse(text);}catch(_){}
   const list=Array.isArray(j)?j:Array.isArray(j?.data)?j.data:Array.isArray(j?.features)?j.features:null;
   results.push({provider,url,at,httpStatus:r.status,cors:r.headers.get('access-control-allow-origin'),json:j!==null,records:list?.length??null,
    keys:j&&!Array.isArray(j)?Object.keys(j):list?.[0]&&!Array.isArray(list[0])?Object.keys(list[0]):list?.[0]||[],
    sampleTime:list?.[0]?.time||list?.[0]?.time_tag||j?.current?.time||j?.timestamp||null});
 }catch(e){results.push({provider,url,at,error:e.message});}}}
 await Promise.all([worker(),worker()]);
 fs.writeFileSync(process.argv[2],JSON.stringify({scope:'Server-side response/schema samples; not browser or predictive validation. No personal key used.',unverified:['NASA DONKI authenticated request','GLM object download and WASM decode','Radar tile rendering','continuous uptime'],results},null,2));
 console.log(JSON.stringify(results.map(({provider,httpStatus,json,error})=>({provider,httpStatus,json,error})),null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
