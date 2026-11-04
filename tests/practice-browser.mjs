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
  assert.equal(await page.locator('#catch-banner').isHidden(),true);
  assert.equal(await page.locator('.game-hud').isVisible(),true);
  assert.match(await page.locator('.game-hud').innerText(),/CUNCUN FISHING WORLD/);
  assert.match(await page.locator('#practice-level').innerText(),/Cấp 1/);
  const xpResponse = await page.request.get('http://127.0.0.1:8791/fishing-progression.js');
  assert.equal(xpResponse.status(),200);
  assert.equal(await page.locator('#equipment-panel').isHidden(),true);
  await page.locator('#inventory-toggle').click();
  assert.equal(await page.locator('#equipment-panel').isVisible(),true);
  const rod=page.locator('#equip-rod');
  assert.equal(await rod.locator('option').count(),2);
  await rod.selectOption({index:1});
  assert.match(await page.locator('#equipment-status').innerText(),/Đã thay rod/);
  // A native select retains focus after changing equipment; return focus to the game before using shortcuts.
  await page.locator('#lake').click({position:{x:12,y:12}});
  await page.keyboard.press('c');
  assert.equal(await page.locator('#cast').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Đã thả câu/);
  // A synthetic duplicate click bypasses the disabled button. The game logic
  // itself must reject it rather than restarting the bite countdown.
  await page.locator('#cast').evaluate(button=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  assert.equal(await page.locator('#cast').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Đã thả câu/);
  // Simulate browser backgrounding deterministically: headless tab scheduling
  // is platform-dependent, so relying on a second tab makes CI flaky.
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  assert.equal(await page.locator('#cast').isEnabled(),true);
  assert.match(await page.locator('#status').innerText(),/Đã tạm dừng/);
  // The cancelled attempt must not produce a late bite event.
  await page.waitForTimeout(1900);
  assert.equal(await page.locator('#hook').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Đã tạm dừng/);
  await page.keyboard.press('c');
  assert.equal(await page.locator('#cast').isDisabled(),true);
  await page.keyboard.press('r');
  assert.equal(await page.locator('#cast').isEnabled(),true);
  assert.match(await page.locator('#status').innerText(),/Sẵn sàng tập câu/);
  // An explicit reset must also discard the old bite timer.
  await page.waitForTimeout(6500);
  assert.equal(await page.locator('#hook').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Sẵn sàng tập câu/);
  // Full first half of the fishing loop: cast -> bite -> hook -> fight -> reset.
  await page.locator('#cast').click();
  await page.waitForFunction(()=>document.querySelector('#hook')?.disabled===false,null,{timeout:9000});
  assert.match(await page.locator('#status').innerText(),/PHAO CHÌM/);
  await page.locator('#hook').click();
  assert.equal(await page.locator('#reel').isEnabled(),true);
  assert.match(await page.locator('#status').innerText(),/Dính cá/);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#cast').isEnabled(),true);
  assert.equal(await page.locator('#reel').isDisabled(),true);
  assert.match(await page.locator('#practice-level').innerText(),/0 cá/);
  // Missing the 1.6-second hook window must return to idle without EXP.
  await page.locator('#cast').click();
  await page.waitForFunction(()=>document.querySelector('#hook')?.disabled===false,null,{timeout:9000});
  await page.waitForFunction(()=>document.querySelector('#hook')?.disabled===true,null,{timeout:5000});
  assert.equal(await page.locator('#cast').isEnabled(),true);
  assert.equal(await page.locator('#reel').isDisabled(),true);
  assert.match(await page.locator('#status').innerText(),/Cá đã nhả mồi/);
  assert.match(await page.locator('#practice-level').innerText(),/0 cá/);
  // Holding the reel continuously must break the line, not award a fish.
  await page.locator('#cast').click();
  await page.waitForFunction(()=>document.querySelector('#hook')?.disabled===false,null,{timeout:9000});
  await page.locator('#hook').click();
  const reelBox=await page.locator('#reel').boundingBox();
  await page.mouse.move(reelBox.x+reelBox.width/2,reelBox.y+reelBox.height/2);
  await page.mouse.down();
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Đứt dây'),null,{timeout:7000});
  await page.mouse.up();
  assert.equal(await page.locator('#cast').isEnabled(),true);
  assert.equal(await page.locator('#reel').isDisabled(),true);
  assert.match(await page.locator('#practice-level').innerText(),/0 cá/);
  await page.locator('#camera').click();
  assert.match(await page.locator('#camera').innerText(),/Cận phao/);
  const profileLink = page.locator('a[href="./profile-demo.html"]');
  assert.equal(await profileLink.count(),1);
  await profileLink.click();
  await page.waitForURL('**/profile-demo.html');
  assert.match(await page.locator('h1').innerText(),/Hồ sơ cần thủ/);
  await page.goBack({waitUntil:'networkidle'});
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
