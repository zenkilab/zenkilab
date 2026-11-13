const fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const cfg=require('../../src/lib/automotive-preview-config.json');
const base='https://feature-automotive-keytags-l.zenkilab.pages.dev';
(async()=>{const browser=await chromium.launch();try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const viewports=[];
 for(const width of [320,390,768,1024,1440]){
  await p.setViewportSize({width,height:1000});const r=await p.goto(base+'/preview/automotive-keytags/'+cfg.id);assert.equal(r.status(),200);
  await p.getByRole('button',{name:'Prepare package for review'}).waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  viewports.push({width,http:200,noOverflow:true});
 }
 await p.setViewportSize({width:390,height:1000});await p.getByLabel('Registration',{exact:true}).fill('NEW 1234');
 await p.getByRole('button',{name:'Prepare package for review'}).click();await p.getByText('Client CAD generated.',{exact:false}).waitFor();
 await p.screenshot({path:'automotive-logo-catalog/reports/shared-submissions/live-mercedes-prepared.png',fullPage:true});
 await p.getByLabel('Vehicle brand',{exact:true}).selectOption('toyota');await p.getByRole('button',{name:'Prepare package for review'}).click();
 await p.getByText('Inquiry package prepared.',{exact:false}).waitFor();
 const backend=await p.evaluate(async()=>{const r=await fetch('/api/submissions');return{status:r.status,body:await r.json()}});
 assert.equal(backend.status,503);assert.equal(backend.body.ready,false);assert(backend.body.missing.includes('SUBMISSIONS_DB'));assert(backend.body.missing.includes('SUBMISSIONS_FILES'));assert(backend.body.missing.includes('RESEND_API_KEY'));
 const legacy=await p.evaluate(async()=>{const r=await fetch('/api/hub/keytag-order',{method:'POST',body:new FormData()});return{status:r.status,body:await r.json()}});assert.equal(legacy.status,503);
 await p.goto(base+'/store/key-tag');await p.getByRole('checkbox',{name:'I reviewed this design and my contact details. Manufacturing review is still required.'}).waitFor();
 assert.deepEqual(errors,[]);
 const report={verifiedAt:new Date().toISOString(),codeCommit:process.env.VERIFY_COMMIT,url:base+'/preview/automotive-keytags/'+cfg.id,publiclyAccessible:true,viewports,mercedesNewRegistrationClientGeneration:true,pendingBrandInquiryPreparation:true,existingCustomKeytagLoaded:true,backend,legacyInvalidForm:legacy,browserErrors:errors,validLiveSubmissionSent:false,realEmailSent:false,remotePersistenceVerified:false,deliveryVerified:false};
 fs.writeFileSync('automotive-logo-catalog/reports/shared-submissions/live.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
