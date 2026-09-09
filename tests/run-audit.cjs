'use strict';
// Usage: node run-audit.cjs /absolute/path/to/linkedom /new/report-directory
// All reports go to a NEW directory. The release is never overwritten.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn}=require('child_process');
const root=__dirname,dep=path.resolve(process.argv[2]||''),out=path.resolve(process.argv[3]||'');
if(!process.argv[2]||!process.argv[3])throw Error('Supply linkedom module and a NEW report directory');
if(fs.existsSync(out))throw Error('Report directory exists: preserve previous evidence');
require(dep);fs.mkdirSync(out,{recursive:true});
const html=path.join(root,'..','index.html'),hash=crypto.createHash('sha256').update(fs.readFileSync(html)).digest('hex');
// Topband inherited harness writes next to its input; stage a byte-identical copy.
const stage=path.join(out,'topband-stage');fs.mkdirSync(stage);fs.copyFileSync(html,path.join(stage,'index.html'));
const suites=[
 ['scientific',['--experimental-vm-modules',path.join(root,'audit-scientific.cjs'),html,path.join(out,'scientific.json')]],
 ['p1147',[path.join(root,'verify-p1147.cjs'),html,path.join(out,'p1147.json'),dep,path.join(root,'p1147-reference-fixtures.json')]],
 ['screening',[path.join(root,'verify-screening-monotonicity.cjs'),html,path.join(root,'screening-fixture.json'),path.join(out,'screening.json')]],
 ...['hf-presentation','overview-welcome','accessibility','listening-domains','submission'].map(name=>[name,[path.join(root,'verify-'+name+'.cjs'),html,path.join(out,name+'.json'),dep]]),
 ['topband',[path.join(root,'verify-topband160.cjs'),stage,path.join(root,'fixtures/r9-reference.html'),dep]]
];
const results=[];let next=0;
async function worker(){while(next<suites.length){const [name,args]=suites[next++];console.log('START '+name);const log=fs.createWriteStream(path.join(out,name+'.log'));
 const code=await new Promise(resolve=>{const child=spawn(process.execPath,args,{cwd:root,windowsHide:true});child.stdout.pipe(log);child.stderr.pipe(log);child.on('error',e=>{log.write(e.message);resolve(-1);});child.on('close',resolve);});
 const report=name==='topband'?path.join(stage,'topband160-results.json'):path.join(out,name+'.json');let r=null;try{r=JSON.parse(fs.readFileSync(report,'utf8'));}catch(_){}
 const bound=(r?.htmlSha256||r?.sha256)===hash,passed=code===0&&bound&&r?.summary?.failed===0;
 results.push({name,passed,exitCode:code,artifactHashMatches:bound,summary:r?.summary||null,report:path.relative(out,report)});console.log('END '+name+' '+(passed?'PASS':'FAIL'));
}}
Promise.all([worker(),worker()]).then(()=>{const summary={suites:results.length,passedSuites:results.filter(x=>x.passed).length,failedSuites:results.filter(x=>!x.passed).length,passedChecks:results.reduce((s,r)=>s+(r.summary?.passed||0),0),failedChecks:results.reduce((s,r)=>s+(r.summary?.failed||0),0)};
 fs.writeFileSync(path.join(out,'audit-summary.json'),JSON.stringify({htmlSha256:hash,at:new Date().toISOString(),summary,results,scope:'Internal deterministic and DOM-emulated regression; embedded subassertions not double-counted; no live or predictive validation'},null,2));console.log(JSON.stringify(summary));if(summary.failedSuites)process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1;});
