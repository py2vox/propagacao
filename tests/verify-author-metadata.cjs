'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const YAML=require('yaml'),{parseHTML}=require('linkedom');
function verify(root){
 const read=f=>fs.readFileSync(path.join(root,f),'utf8');
 const p=JSON.parse(read('provenance.json')),a=p.authorMetadata,html=read('index.html');
 const cff=YAML.parse(read('CITATION.cff')),zen=JSON.parse(read('.zenodo.json')),pkg=JSON.parse(read('package.json'));
 const {document}=parseHTML(html);
 let total=0;const check=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);total++;};
 check(a.orcid,'https://orcid.org/0009-0005-9657-7254','Author-supplied ORCID');
 // ISO 7064 MOD 11-2 checks transcription, not ownership of the ORCID record.
 const digits=a.orcid.split('/').pop().replaceAll('-','');let n=0;for(const c of digits.slice(0,15))n=(n+Number(c))*2;
 const remainder=(12-n%11)%11;check(digits[15],remainder===10?'X':String(remainder),'ORCID check digit');
 check(cff.authors[0].orcid,a.orcid,'CFF ORCID');check(cff.authors[0].affiliation,a.affiliation,'CFF affiliation');
 check(zen.creators[0].orcid,a.orcid.split('/').pop(),'Zenodo ORCID');check(zen.creators[0].affiliation,a.affiliation,'Zenodo affiliation');
 check(pkg.author.email,a.email,'Package email');check(pkg.author.url,a.orcid,'Package author URL');
 check(document.querySelector('meta[name="citation_author_orcid"]')?.getAttribute('content'),a.orcid,'HTML ORCID metatag');
 check(document.querySelector('meta[name="citation_author_institution"]')?.getAttribute('content'),a.affiliation,'HTML affiliation');
 check(document.querySelector('meta[name="citation_doi"]')?.getAttribute('content'),a.doi,'HTML DOI');
 const en=JSON.parse(html.match(/const US_INFO_HTML=([^\n]+);/)[1]);
 for(const [language,source] of [['pt-BR',html.slice(0,html.indexOf('<script'))],['en-US',en]]){
   for(const value of [a.orcid,a.repository,a.archive,a.email])check(source.includes(value),true,language+' '+value);
 }
 const {restorePublication}=require('./verify-source-language.cjs');
 const zero=s=>s.replace(/const SCIENTIFIC_BUNDLE_SHA256 = '[a-f0-9]{64}';/,'DIGEST');
 const before=read(a.baseline);check(crypto.createHash('sha256').update(before).digest('hex'),a.baselineSha256,'Prior artifact identity');
 check(zero(restorePublication(html,p).replaceAll(p.runtimeRelease,a.baselineRelease)),zero(before),'Exact reverse of all declared HTML edits');
 for(const folder of ['', 'docs'])for(const f of fs.readdirSync(path.join(root,folder)).filter(f=>f.endsWith('.md'))){const s=read(path.join(folder,f));for(const value of [a.orcid,a.repository,a.archive,a.email])check(s.includes(value),true,'Current metadata in '+folder+'/'+f);}
 const report={status:'PASS',checks:total,htmlSha256:p.runtimeSha256,orcid:a.orcid,scope:'Metadata consistency and checksum only; not external registration or ownership verification'};
 console.log(JSON.stringify(report,null,2));return report;
}
module.exports={verify};if(require.main===module)verify(path.resolve(__dirname,'..'));
