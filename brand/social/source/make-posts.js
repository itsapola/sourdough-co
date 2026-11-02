const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const R = require('path').resolve(__dirname, '../../..') + '/';
const b64 = f => 'data:image/' + (f.endsWith('.webp') ? 'webp' : 'png') + ';base64,' + fs.readFileSync(R + f).toString('base64');
const BG = { sq: b64('brand/ads/ad-background-square.png'), st: b64('brand/ads/ad-background-story.png'), ls: b64('brand/ads/ad-background-landscape.png') };
const LOGO = b64('assets/logo.webp');
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:1em;height:1em"><path d="M3 12h17M14 6l6 6-6 6"/></svg>';
const css = `
*{box-sizing:border-box;margin:0}
body{width:var(--w);height:var(--h);overflow:hidden;font-family:'DM Sans',sans-serif;color:#392B23}
.post{position:relative;width:var(--w);height:var(--h);background:#F2D675 center/cover no-repeat}
h1{font-family:'Bowlby One',sans-serif;font-weight:400;line-height:.98;letter-spacing:-.01em}
.rule{display:block;height:var(--rule,10px);width:var(--rulew,170px);background:#355DC5;border-radius:99px}
.sub{font-weight:500}
.logo{display:block;height:auto}
.cta{display:inline-flex;align-items:center;gap:.5em;background:#355DC5;color:#F7F3E8;font-weight:600;padding:.7em 1.15em;border-radius:2px}
.eyebrow{font-weight:600;letter-spacing:.28em;text-transform:uppercase}
`;
const posts = [
 { name:'square-made-slowly', w:1080, h:1080, bg:BG.sq, html:`
   <div style="position:absolute;left:84px;top:84px;width:900px">
     <h1 style="font-size:86px">Made slowly.<br>Gone quickly.</h1>
     <span class="rule" style="margin:28px 0 22px"></span>
     <p class="sub" style="font-size:28px;line-height:1.3">Handmade sourdough from our home kitchen.</p>
   </div>
   <img class="logo" src="${LOGO}" style="position:absolute;left:84px;bottom:80px;width:150px">`},
 { name:'square-good-things', w:1080, h:1080, bg:BG.sq, html:`
   <div style="position:absolute;left:84px;top:80px;width:900px">
     <p class="eyebrow" style="font-size:20px;margin-bottom:20px">Next Dough Bakehouse</p>
     <h1 style="font-size:72px">Good things<br>take their time.</h1>
     <span class="rule" style="margin:24px 0 24px"></span>
     <span class="cta" style="font-size:24px">See what’s baking ${arrow}</span>
   </div>
   <img class="logo" src="${LOGO}" style="position:absolute;left:84px;bottom:80px;width:150px">`},
 { name:'story-loaf-with-your-name', w:1080, h:1920, bg:BG.st, html:`
   <img class="logo" src="${LOGO}" style="position:absolute;left:92px;top:140px;width:200px">
   <div style="position:absolute;left:92px;right:92px;top:330px">
     <h1 style="font-size:116px">There’s a loaf with your name on it.</h1>
     <span class="rule" style="margin:36px 0 36px;--rule:12px;--rulew:220px"></span>
     <span class="cta" style="font-size:36px">Order at the link in bio ${arrow}</span>
   </div>`},
 { name:'story-home-to-table', w:1080, h:1920, bg:BG.st, html:`
   <img class="logo" src="${LOGO}" style="position:absolute;left:92px;top:140px;width:200px">
   <div style="position:absolute;left:92px;right:92px;top:350px">
     <p class="eyebrow" style="font-size:26px;margin-bottom:28px">Handmade at home.</p>
     <h1 style="font-size:128px">From our home to your table.</h1>
     <span class="rule" style="margin:36px 0 0;--rule:12px;--rulew:220px"></span>
   </div>`},
 { name:'landscape-your-neighbor', w:1200, h:630, bg:BG.ls, html:`
   <div style="position:absolute;left:64px;top:52px;width:500px">
     <img class="logo" src="${LOGO}" style="width:112px;margin-bottom:30px">
     <h1 style="font-size:54px">Your neighbor makes good bread.</h1>
     <span class="rule" style="margin:22px 0 20px;--rule:8px;--rulew:110px"></span>
     <p class="sub" style="font-size:20px;line-height:1.35;margin-bottom:22px">Handmade sourdough from our home kitchen.</p>
     <span class="cta" style="font-size:20px">Get your next loaf ${arrow}</span>
   </div>`},
 { name:'landscape-made-slowly', w:1200, h:630, bg:BG.ls, html:`
   <div style="position:absolute;left:64px;top:70px;width:520px">
     <p class="eyebrow" style="font-size:16px;margin-bottom:22px">Bold. Warm. Neighborly.</p>
     <h1 style="font-size:80px">Made slowly. Gone quickly.</h1>
     <span class="rule" style="margin:28px 0 0;--rule:8px;--rulew:120px"></span>
   </div>
   <img class="logo" src="${LOGO}" style="position:absolute;left:64px;bottom:56px;width:130px">`},
];
(async () => {
  const b = await chromium.launch();
  const out = R + 'brand/social/posts/'; fs.mkdirSync(out, { recursive: true });
  for (const p of posts) {
    const page = await b.newPage({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=DM+Sans:opsz,wght@9..40,500;9..40,600&display=block" rel="stylesheet"><style>${css}</style></head>
      <body style="--w:${p.w}px;--h:${p.h}px"><div class="post" style="background-image:url('${p.bg}')">${p.html}</div></body></html>`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const ok = await page.evaluate(() => document.fonts.check('40px "Bowlby One"') && document.fonts.check('500 40px "DM Sans"'));
    await page.screenshot({ path: out + p.name + '.png' });
    console.log(p.name, p.w + 'x' + p.h, 'fonts', ok);
  }
  await b.close();
})();
