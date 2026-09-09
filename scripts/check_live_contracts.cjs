// Read-only sample API probes using public reference coordinates, not the user's QTH.
const fs=require('fs');
const path=require('path');
async function main(){
  const providers=[
    ['NWS','https://api.weather.gov/alerts/active?point=38.9,-77.04','json'],
    ['ECCC','https://api.weather.gc.ca/collections/weather-alerts/items?f=json&lang=en&limit=100&bbox=-75.72,45.40,-75.68,45.44','json'],
    ['NWS schema sample','https://api.weather.gov/alerts/active','json'],
    ['ECCC schema sample','https://api.weather.gc.ca/collections/weather-alerts/items?f=json&lang=en&limit=1','json'],
    ['INMET','https://apiprevmet3.inmet.gov.br/avisos/rss','xml']
  ];
  const results=await Promise.all(providers.map(async([provider,url,type])=>{
    const start=Date.now();try{
      const r=await fetch(url,{headers:{'User-Agent':'AGHIP-scientific-review/2026.09.08 (py2vox.com)','Accept':type==='json'?'application/geo+json, application/json':'application/rss+xml, application/xml'},signal:AbortSignal.timeout(20000)});
      const result={provider,url,checkedAt:new Date().toISOString(),status:r.status,elapsedMs:Date.now()-start,accessControlAllowOrigin:r.headers.get('access-control-allow-origin'),contentType:r.headers.get('content-type')};
      const body=await r.text();
      if(r.ok&&type==='json'){const j=JSON.parse(body);result.type=j.type;result.featureCount=Array.isArray(j.features)?j.features.length:null;result.propertyKeys=Object.keys(j.features?.[0]?.properties||{});result.hasNext=!!j.pagination?.next||(j.links||[]).some(l=>l.rel==='next');}
      if(r.ok&&type==='xml'){
        result.looksLikeRSS=/<rss[\s>]/i.test(body)&&/<channel[\s>]/i.test(body);result.itemCount=(body.match(/<item[\s>]/gi)||[]).length;
        const first=body.match(/<item[\s>][\s\S]*?<\/item>/i)?.[0],link=first?.match(/<link>([^<]+)<\/link>/)?.[1];
        if(link&&new URL(link).hostname.endsWith('.inmet.gov.br')){
          const cap=await fetch(link,{signal:AbortSignal.timeout(12000)}),text=await cap.text();
          result.bulletinSample={url:link,status:cap.status,contentType:cap.headers.get('content-type'),hasCAP:/<(?:\w+:)?alert[\s>]/i.test(text),hasPolygon:/<(?:\w+:)?polygon[\s>]/i.test(text),hasMunicipalList:/Munic[ií]pios/i.test(text)};
        }
      }
      return result;
    }catch(e){return {provider,url,checkedAt:new Date().toISOString(),elapsedMs:Date.now()-start,error:e.message};}
  }));
  const report={scope:'Server-side read-only sample probes. Not browser/CORS or end-to-end coverage validation.',results};
  // Keep the dated delivery evidence intact and work from any current directory.
  const output=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'live-api-check-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
  fs.writeFileSync(output,JSON.stringify(report,null,2),{flag:'wx'});
  console.log(JSON.stringify({output,...report},null,2));
  if(results.some(r=>r.error||r.status!==200||(r.type!==undefined&&r.type!=='FeatureCollection')||(r.looksLikeRSS!==undefined&&!r.looksLikeRSS)))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
