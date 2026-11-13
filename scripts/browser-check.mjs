import {chromium} from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
console.log(JSON.stringify({title:await page.title(),heading:await page.locator('h1').allTextContents(),images:await page.locator('img').evaluateAll(xs=>xs.map(x=>({alt:x.alt,ok:x.complete&&x.naturalWidth>0}))),errors},null,2));
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});
console.log('Overflow mobile: '+await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));await browser.close();
