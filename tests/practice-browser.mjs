// Browser smoke test for free practice. Run with: node tests/practice-browser.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
try {
  const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {if(response.url().includes('/practice-3d.js') && response.status()!==200) errors.push('Practice script HTTP '+response.status())});
  const response = await page.goto('http://127.0.0.1:8791/practice.html',{waitUntil:'networkidle',timeout:30000});
  assert.equal(response.status(),200);
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('#render-error').isVisible(),false,'WebGL initialization failed');
  await page.waitForFunction(() => document.querySelector('#cast')?.disabled === false, null, {timeout:10000});
  assert.equal(await page.locator('#cast').isEnabled(),true);
  assert.match(await page.locator('#practice-level').innerText(),/Cấp 1/);
  const xpResponse = await page.request.get('http://127.0.0.1:8791/fishing-progression.js');
  assert.equal(xpResponse.status(),200);
  await page.locator('#cast').click();
  assert.equal(await page.locator('#cast').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Đã thả câu/);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#cast').isEnabled(),true);
  await page.locator('#camera').click();
  assert.match(await page.locator('#camera').innerText(),/Cận phao/);
  const dimensions=await page.locator('#lake').boundingBox();
  assert.ok(dimensions.width<=390,'canvas overflows iPhone viewport');
  assert.deepEqual(errors,[],'Unexpected JavaScript errors');
  const jsResponse = await page.request.get('http://127.0.0.1:8791/practice-3d.js');
  assert.equal(jsResponse.status(),200);
  assert.match(jsResponse.headers()['content-type'],/javascript/);
  console.log('PASS: iPhone-size practice browser smoke test');
} finally {
  await browser.close();
}
