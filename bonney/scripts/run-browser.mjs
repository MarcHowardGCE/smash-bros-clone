import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../package.json',import.meta.url)),{chromium}=require('playwright');
const browser=await chromium.launch({headless:true}),page=await browser.newPage();
try{
 await page.goto('http://127.0.0.1:4174/?test=1&mode=full');await page.waitForFunction(()=>window.__bonney?.loaded);
 await page.getByRole('button',{name:'Start playing'}).click();
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.vx),105);
 await page.keyboard.down('Shift');await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.vx),168);
 await page.keyboard.up('Shift');await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>window.__bonney.game.player.vx),105);
 await page.keyboard.up('ArrowRight');
 console.log('PASS: keyboard Shift accelerates movement and release restores walking.');
}finally{await browser.close();}
