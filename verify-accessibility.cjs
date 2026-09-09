'use strict';
/* DOM contracts and WCAG sRGB contrast arithmetic. NOT a browser/screen-reader
   conformance audit. No network, external AI, or predictions are added. */
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const file=process.argv[2],reportFile=process.argv[3];
const {parseHTML}=require(process.argv[4]||'linkedom');
const html=fs.readFileSync(file,'utf8'),{document}=parseHTML(html);
const app=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!m[1].includes('data-aghip-vendor')).sort((a,b)=>b[2].length-a[2].length)[0][2];
const checks=[],errors=[],intervals=[],storage=new Map();let requests=0;
const check=(name,ok,detail)=>checks.push({name,ok:!!ok,...(detail===undefined?{}:{detail})});
const sandbox={document,console:{log(){},warn(){},error:(...v)=>errors.push(v.join(' '))},navigator:{onLine:false},
 location:{protocol:'file:',hostname:'',href:'file:///index.html'},screen:{width:1280,height:720},
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 setTimeout:()=>0,clearTimeout(){},setInterval:cb=>{intervals.push(cb);return intervals.length;},clearInterval(){},requestAnimationFrame:()=>0,addEventListener(){},
 MutationObserver:class{observe(){}disconnect(){}},NodeFilter:{SHOW_TEXT:4},fetch:async()=>{requests++;throw Error('Network disabled');},
 matchMedia:()=>({matches:false,addEventListener(){}}),
 Chart:class{constructor(canvas,config){this.config=config;this.options=config.options;}destroy(){}update(){}},
 URL,URLSearchParams,AbortController,TextEncoder,TextDecoder,atob:x=>Buffer.from(x,'base64').toString('binary'),btoa:x=>Buffer.from(x,'binary').toString('base64')};
sandbox.window=sandbox;sandbox.self=sandbox;vm.createContext(sandbox);
new vm.Script(app.slice(0,app.lastIndexOf('\ninitMap();'))).runInContext(sandbox,{timeout:30000});
const run=code=>vm.runInContext(code,sandbox,{timeout:60000});
check('Application parses with accessibility code',true);
check('No external script tags added',document.querySelectorAll('script[src]').length===0);
check('One h1 and main landmark',document.querySelectorAll('h1').length===1&&document.querySelectorAll('main').length===1);
check('Skip link targets main',document.querySelector('.skip-link').getAttribute('href')==='#main-content');
check('Inactive shared fields initially hidden',['hf-dest-wrap','eme-window-wrap'].every(id=>document.getElementById(id).hasAttribute('hidden')));
check('Grid Enter handler does not blur focus',!document.getElementById('qth-input').getAttribute('onkeydown').includes('blur'));
check('Radar avoids application role',document.getElementById('radar-map').getAttribute('role')==='region');
check('Both locales have identical accessibility keys',run("JSON.stringify(Object.keys(A11Y_COPY.pt).sort())===JSON.stringify(Object.keys(A11Y_COPY.en).sort())"));
check('No invented confidence percentage in accessible copy',!run('JSON.stringify(A11Y_COPY)').includes('87%'));
run('a11yInit();');
for(const locale of ['pt','en','pt']){
 run(`S.idioma='${locale}';a11yPresentation();`);
 const pairs=[['a11y-tools','tools'],['a11y-coordinates','coordinates']];
 for(const [id,key] of pairs)check(locale+' native '+id,document.querySelector('#'+id+' summary').textContent===run(`a11yCopy('${key}')`));
 check(locale+' localized navigation',document.querySelector('nav').getAttribute('aria-label')===run("a11yCopy('nav')"));
 check(locale+' all static data-copy nodes rendered',[...document.querySelectorAll('[data-a11y-copy]')].every(el=>el.textContent===run(`a11yCopy('${el.getAttribute('data-a11y-copy')}')`)));
 check(locale+' no empty form labels',[...document.querySelectorAll('input,select')].every(el=>!!el.closest('label')||!!document.querySelector('label[for="'+el.id+'"]')?.textContent.trim()));
 if(locale==='en'){
   run('localizeUsTree(document.getElementById("a11y-tools"));localizeUsTree(document.getElementById("a11y-coordinates"));');
   check('Native accessibility copy survives legacy translator',document.querySelector('#a11y-tools summary').textContent==='Reading and navigation');
 }
}
const focusEvents=[];
for(const tab of document.querySelectorAll('.tab-btn'))tab.focus=()=>{Object.defineProperty(document,'activeElement',{configurable:true,value:tab});focusEvents.push(tab.id);};
run("document.getElementById('tab-mapa').focus();tabKeyNav({key:'End',preventDefault(){}});");
check('End selects last tab',document.getElementById('tab-info').getAttribute('aria-selected')==='true'&&document.activeElement.id==='tab-info');
run("tabKeyNav({key:'Home',preventDefault(){}});");
check('Home selects first tab',document.getElementById('tab-mapa').getAttribute('aria-selected')==='true');
run("switchTab('hf');");
check('HF reveals only its shared field',!document.getElementById('hf-dest-wrap').hidden&&document.getElementById('eme-window-wrap').hidden);
run("switchTab('eme');");
check('EME hides HF field from keyboard',document.getElementById('hf-dest-wrap').hidden&&!document.getElementById('eme-window-wrap').hidden);
check('Open shared section has no fixed-height clipping',document.getElementById('eme-window-wrap').style.maxHeight==='none');
check('One selected tab and one visible panel',document.querySelectorAll('.tab-btn[aria-selected="true"]').length===1&&[...document.querySelectorAll('.tab-panel')].filter(p=>!p.hidden).length===1);
run("S.idioma='en';a11yHeatmapTable([{band:'20m',utc:'2026-09-09T15:30:00Z',value:-8.25},{band:'10m',utc:'2026-09-10T00:30:00Z',value:NaN}]);");
check('Heatmap table preserves mean and exact date',document.getElementById('a11y-heat-data').textContent.includes('-8.3')&&document.getElementById('a11y-heat-data').textContent.includes('2026-09-10 00:30 UTC'));
check('Missing heatmap value is not a favorable condition',document.getElementById('a11y-heat-data').textContent.includes('— Unavailable'));
check('Operational index not relabeled as absolute S/N',document.getElementById('a11y-heat-data').textContent.includes('Operational index'));
check('Heatmap capture uses existing avg only',app.includes('value:avg}')&&!app.match(/function a11yHeatmapTable[\s\S]*?\n}/)[0].includes('pathQualityAt'));
run("S.kpHist=[{t:'2026-09-09 12:00:00',kp:2},{t:'2026-09-09T15:00:00Z',kp:5},{t:'2026-09-09T18:00:00Z',kp:7}];drawKpChart();");
check('Kp table includes all plotted values',document.querySelectorAll('#a11y-kp-data tbody tr').length===3&&document.getElementById('a11y-kp-data').textContent.includes('G3'));
check('Zone-less provider time explicitly UTC',document.getElementById('a11y-kp-data').textContent.includes('2026-09-09 12:00 UTC'));
check('Kp threshold patterns distinct',run('JSON.stringify(kpChartObj.config.data.datasets[1].borderDash)!==JSON.stringify(kpChartObj.config.data.datasets[2].borderDash)'));
run("a11yTropoCapture([{dNdh:-40},null,{dNdh:-100},{dNdh:-160},{dNdh:20}],['2026-09-09T21:00','2026-09-09T22:00','2026-09-09T23:00','2026-09-10T00:00','2026-09-10T01:00']);");
check('Tropospheric table retains missing hour and midnight date',document.querySelectorAll('#a11y-tropo-data tbody tr').length===5&&document.getElementById('a11y-tropo-data').textContent.includes('2026-09-10 00:00 UTC'));
check('Tropospheric categories include text',document.getElementById('a11y-tropo-data').textContent.includes('Superrefraction')&&document.getElementById('a11y-tropo-data').textContent.includes('Unavailable'));
run('a11yTropoReset();');
check('New tropo request clears previous table',document.querySelectorAll('#a11y-tropo-data tbody tr').length===0);
run("earthquakeData=[{place:'<test & source>',lat:42,lon:-70,mag:4.6}];a11yQuakeTable();");
check('Source names escaped in table',document.getElementById('a11y-quake-data').textContent.includes('<test & source>')&&document.querySelectorAll('#a11y-quake-data test').length===0);
run("earthquakeData.push({place:'Incomplete source record',lat:null,lon:undefined,mag:null});a11yQuakeTable();");
check('Incomplete earthquake record remains explicit without throwing',document.getElementById('a11y-quake-data').textContent.includes('—, —'));
for(const id of ['a11y-heat-data','a11y-kp-data','a11y-quake-data']){
 check(id+' has caption, scoped headers and scroll entry point',!!document.querySelector('#'+id+' caption')&&!!document.querySelector('#'+id+' th[scope="col"]')&&!!document.querySelector('#'+id+' th[scope="row"]')&&document.getElementById(id).getAttribute('tabindex')==='0');
}
for(const id of ['qth-input','vhf-dest-grid','eme-other-grid']){
 run(`document.getElementById('${id}').value='ZZ99';a11yValidateGrid(document.getElementById('${id}'));`);
 check(id+' localized associated error',document.getElementById(id).getAttribute('aria-invalid')==='true'&&document.getElementById(id+'-error').textContent.startsWith('Invalid grid.'));
 run(`document.getElementById('${id}').value='FN31PR';a11yValidateGrid(document.getElementById('${id}'));`);
 check(id+' clears error after correction',document.getElementById(id).getAttribute('aria-invalid')==='false'&&document.getElementById(id+'-error').textContent==='');
}
const originalQth=run('JSON.stringify(QTH)');
run("document.getElementById('a11y-lat').value='91';document.getElementById('a11y-lon').value='0';a11yApplyCoordinates();");
check('Invalid coordinates do not change QTH',run('JSON.stringify(QTH)')===originalQth&&document.getElementById('a11y-lat').getAttribute('aria-invalid')==='true');
run("document.getElementById('a11y-lat').value='';a11yApplyCoordinates();");
check('Blank coordinate is not coerced to zero',run('JSON.stringify(QTH)')===originalQth);
// Isolate the interaction adapter from all network/model re-renders.
run("var manualRefreshes=0;loadAllData=()=>{manualRefreshes++;};drawMapOverlay=()=>{};updateQthMapPin=()=>{};document.getElementById('a11y-lat').value='45.4215';document.getElementById('a11y-lon').value='-75.6972';a11yApplyCoordinates();");
check('Coordinate action retains exact point and generates 8-character grid',run("QTH.lat===45.4215&&QTH.lon===-75.6972&&S.grid===latLonToGrid(45.4215,-75.6972,8)&&S.grid.length===8"));
check('Coordinate action uses one existing refresh',run('manualRefreshes')===1);
run("document.getElementById('a11y-mute').checked=true;a11ySetPreferences();");
check('Explicit mute silences status and alert regions',document.getElementById('global-status').getAttribute('aria-live')==='off'&&document.getElementById('tornado-threat-panel').getAttribute('aria-live')==='off');
run("document.getElementById('a11y-mute').checked=false;a11ySetPreferences();");
check('Unmute restores original urgency',document.getElementById('global-status').getAttribute('aria-live')==='polite'&&document.getElementById('tornado-threat-panel').getAttribute('aria-live')==='assertive');
run("document.getElementById('a11y-motion').checked=true;a11ySetPreferences();drawKpChart();");
check('Reduced motion disables canvas animation',run('kpChartObj.config.options.animation')===false);
run("document.getElementById('a11y-pause').checked=true;a11ySetPreferences();var ticks=0;a11yPeriodic(()=>{ticks++;},1000);");intervals.at(-1)();
check('Pause blocks periodic callback with visible outdated-data warning',run('ticks')===0&&document.getElementById('a11y-update-note').textContent.includes('outdated'));
run("document.getElementById('a11y-pause').checked=false;a11ySetPreferences();");intervals.at(-1)();
check('Resume permits periodic callback',run('ticks')===1);
check('Bootstrap uses controlled periodic scheduling',!app.slice(app.lastIndexOf('\ninitMap();')).includes('setInterval('));
check('Visibility-triggered refresh honors pause',app.includes('if(document.hidden||a11yPeriodicPaused) return;'));
check('OS reduced-motion covers pseudo-elements and animation',html.includes('*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'));
check('Forced-colors fallback present',html.includes('@media(forced-colors:active)'));
check('No provider requested by presentation tests',requests===0,requests);
check('No console errors',errors.length===0,errors);
for(const locale of ['pt','en']){
 run(`S.idioma='${locale}';renderVHF();renderEME();a11yPresentation();`);
 for(const panel of ['mapa','hf','vhf','eme','meteo','info']){
  check(locale+' '+panel+' has scientific heading navigation',document.querySelectorAll('#panel-'+panel+' h2').length>0);
 }
 check(locale+' EME Faraday row headers',document.querySelectorAll('#eme-faraday-scale th[scope="row"]').length===4);
}
check('No errors in VHF/EME presentation renders',errors.length===0,errors);
check('Invalid remote grid still invokes original renderer',document.getElementById('eme-other-grid').getAttribute('onchange')==='a11yValidateGrid(this);renderEME()'&&document.getElementById('vhf-dest-grid').getAttribute('onchange')==='a11yValidateGrid(this);renderVHF()');
// WCAG relative luminance, sRGB 0.04045 breakpoint; compare unrounded ratios.
function luminance(hex){const channels=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;}
function ratio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
check('WCAG arithmetic black/white reference',ratio('#000000','#ffffff')===21);
const tokenPairs=[];
const light={surfaces:['#ffffff','#f5f4f0','#faf9f6'],text:['#1a1a1a','#50504b','#62625b','#166534','#0f6660','#92400e','#a41530','#1855a0'],border:'#74746b',focus:'#1855a0'};
const dark={surfaces:['#262624','#1e1e1c','#191918'],text:['#f2f1ed','#d2d1c9','#b8b7ae','#86efac','#7cddd3','#ffd166','#ffa4b2','#8ecaff'],border:'#a5a59a',focus:'#ffd166'};
for(const [theme,tokens] of [['light',light],['dark',dark]]){
 for(const fg of tokens.text)for(const bg of tokens.surfaces)tokenPairs.push({theme,kind:'text',fg,bg,minimum:4.5});
 for(const bg of tokens.surfaces)for(const kind of ['border','focus'])tokenPairs.push({theme,kind,fg:tokens[kind],bg,minimum:3});
}
for(const bg of ['#62625b','#166534','#0f6660','#92400e','#a41530'])tokenPairs.push({theme:'both',kind:'heatmap text',fg:'#ffffff',bg,minimum:4.5});
for(const [fg,bg] of [['#166534','#dcfce7'],['#92400e','#fef3c7'],['#9a3412','#ffedd5'],['#991b1b','#fee2e2'],['#86efac','#14532d'],['#fde68a','#78350f'],['#ffedd5','#7c2d12'],['#fca5a5','#7f1d1d']])tokenPairs.push({theme:'status',kind:'text',fg,bg,minimum:4.5});
for(const pair of tokenPairs){pair.ratio=ratio(pair.fg,pair.bg);check(`${pair.theme} ${pair.kind} ${pair.fg} / ${pair.bg}`,pair.ratio>=pair.minimum,pair);}
const report={artifact:path.basename(file),htmlSha256:crypto.createHash('sha256').update(html).digest('hex'),generatedAt:new Date().toISOString(),
 summary:{checks:checks.length,passed:checks.filter(c=>c.ok).length,failed:checks.filter(c=>!c.ok).length},checks,contrast:{method:'WCAG 2.2 relative luminance, opaque sRGB',pairs:tokenPairs},
 limitations:['DOM emulation, not a real browser or assistive-technology test','Token-pair contrasts, not computed-style coverage of every inline state or third-party tile','Radar raster cells lack equivalent quantitative text from the provider','Pause stops future periodic callbacks, not already-started requests or manual actions','No certification of WCAG AA, predictive accuracy, or live API availability']};
fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({summary:report.summary,failures:checks.filter(c=>!c.ok)},null,2));if(report.summary.failed)process.exitCode=1;
