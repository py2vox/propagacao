'use strict';
// Stage a release directory only. No upload, deletion, credential or deployment.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(spawnSync(process.execPath,[path.join(__dirname,'verify-repository.cjs')],{cwd:root,stdio:'inherit',windowsHide:true}).status!==0)process.exit(1);
const htmlHash=sha(fs.readFileSync(path.join(root,'index.html'))),runs=path.join(root,'.audit-runs');
const successful=fs.existsSync(runs)?fs.readdirSync(runs).sort().reverse().map(n=>path.join(runs,n,'audit-summary.json')).filter(f=>fs.existsSync(f)).find(f=>{
 const r=JSON.parse(fs.readFileSync(f,'utf8'));return r.htmlSha256===htmlHash&&r.summary.passedSuites===9&&r.summary.failedSuites===0;
}):null;
if(!successful)throw Error('Run pnpm test successfully against this exact HTML before packaging');
const out=path.join(root,'dist',new Date().toISOString().replace(/[:.]/g,'-')+'-'+process.pid);fs.mkdirSync(out,{recursive:true});
const mappings=[['index.html','index.html'],['LICENSE','LICENSE'],['CITATION.cff','CITATION.cff'],['README.md','README.md'],['docs/SCIENTIFIC-STATUS.md','docs/SCIENTIFIC-STATUS.md'],['docs/SUBMISSION-REVIEW.md','docs/SUBMISSION-REVIEW.md'],['provenance.json','provenance.json']];
for(const [from,to] of mappings){const target=path.join(out,to);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,from),target);}
fs.copyFileSync(successful,path.join(out,'audit-summary.json'));
const files=[];function walk(dir){for(const n of fs.readdirSync(dir)){const f=path.join(dir,n);if(fs.statSync(f).isDirectory())walk(f);else files.push({path:path.relative(out,f).replaceAll('\\','/'),sha256:sha(fs.readFileSync(f))});}}walk(out);
fs.writeFileSync(path.join(out,'checksums.json'),JSON.stringify({runtimeSha256:htmlHash,note:'Identity only, not certification; excludes this manifest',files},null,2));
console.log('Release staged locally: '+out);
