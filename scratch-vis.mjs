import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await p.addInitScript(() => localStorage.setItem('theme','dark'));
await p.goto('http://localhost:4399/', { waitUntil: 'networkidle' });
await p.waitForTimeout(4000);
await p.screenshot({ path:'/tmp/fixed.png', clip:{x:380,y:340,width:680,height:300} });
await b.close();
