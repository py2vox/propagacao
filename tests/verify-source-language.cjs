'use strict';
// Node 24's bundled Acorn is used only by development verification, never by the runtime HTML.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm'),assert=require('assert/strict');
const mod={exports:{}};
const parserSource=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
if(!parserSource)throw Error('Use the documented Node 24 toolchain: bundled Acorn unavailable');
vm.runInNewContext(parserSource,{exports:mod.exports,module:mod});const acorn=mod.exports;
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function ast(s,sourceType='script'){return JSON.stringify(acorn.parse(s,{ecmaVersion:'latest',sourceType}),(key,value)=>['start','end','loc','range','raw'].includes(key)?undefined:typeof value==='bigint'?value.toString():value);}
function assertEquivalentScripts(a,b,sourceType='script'){assert.equal(ast(a,sourceType),ast(b,sourceType),'Executable AST changed beyond declared release/digest fields');}
const scripts=s=>[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const zero=s=>s.replace(/const SCIENTIFIC_BUNDLE_SHA256 = '[a-f0-9]{64}';/,"const SCIENTIFIC_BUNDLE_SHA256 = '"+'0'.repeat(64)+"';");
function assertEquivalentDocuments(a,b){const x=scripts(a),y=scripts(b);assert.equal(x.length,y.length);x.forEach((m,i)=>{assert.equal(m[1],y[i][1]);assertEquivalentScripts(zero(m[2]),zero(y[i][2]),/type\s*=\s*["']module["']/.test(m[1])?'module':'script');});}
function markup(s){return s.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi,'<script$1></script>').replace(/<!--([\s\S]*?)-->/g,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,m=>m.replace(/\/\*[\s\S]*?\*\//g,''));}
function restorePublication(html,p){
 if(!p.authorMetadata)return html;
 for(const e of [...p.authorMetadata.htmlEdits].reverse()){if(!html.includes(e.after))throw Error('Declared publication metadata missing');html=html.replace(e.after,e.before);}
 return html;
}
function verify(root){
 const negativeControls=[['const x=1+2','const x=1-2'],['f(2)','f(3)'],['const a="PT"','const a="EN"'],['let a=1','let b=1']];
 for(const [a,b] of negativeControls)assert.throws(()=>assertEquivalentScripts(a,b),'Changed code must be rejected');
 assertEquivalentScripts('const x=1;// old comment','const x=1;// new comment');
 const p=JSON.parse(fs.readFileSync(path.join(root,'provenance.json'),'utf8'));
 const before=fs.readFileSync(path.join(root,p.sourceLanguage.baseline),'utf8'),after=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.equal(sha(before),p.sourceLanguage.baselineSha256,'Source baseline identity');
 const normalized=restorePublication(after,p).replaceAll(p.runtimeRelease,p.sourceLanguage.baselineRelease);
 const a=scripts(before),b=scripts(normalized);assert.equal(a.length,b.length);
 let vendor=0,application=0;
 a.forEach((x,i)=>{assert.equal(x[1],b[i][1],'Script attributes unchanged');if(x[1].includes('data-aghip-vendor')){assert.equal(x[2],b[i][2],'Vendor bytes unchanged');vendor++;}else{assertEquivalentScripts(zero(x[2]),zero(b[i][2]),/type\s*=\s*["']module["']/.test(x[1])?'module':'script');application++;}});
 // Source comments are removed; all other markup/style bytes must remain identical.
 assert.equal(markup(before),markup(normalized),'Non-comment HTML/CSS changed');
 const report={status:'PASS',baselineSha256:sha(before),htmlSha256:sha(after),applicationScripts:application,vendorScripts:vendor,negativeControls:negativeControls.length,commentOnlyControl:'PASS',declaredPublicationEdits:p.authorMetadata?.htmlEdits.length||0,checks:['Full JavaScript AST equality after reversing exact declared author/publication edits and normalizing release/digest','Embedded vendor source byte equality','Non-comment HTML and CSS equality after reversing exact declared author/publication edits','Preserved source baseline SHA-256'],scope:'Source-documentation and metadata regression; not live-provider, full-browser or independent scientific validation'};
 console.log(JSON.stringify(report,null,2));return report;
}
module.exports={assertEquivalentScripts,assertEquivalentDocuments,verify,restorePublication};
if(require.main===module)verify(path.resolve(__dirname,'..'));
