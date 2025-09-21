(async function(){
  // todo set this to sept 7
  const LAUNCH_ISO = '2025-09-07';

  async function loadMap(){
    const sch = await fetch('schedule.json',{cache:'no-store'}).then(r=>r.json());
    if(INCLUDE_EXTRAS){
      const ex = await fetch('extras.json',{cache:'no-store'}).then(r=>r.ok?r.json():{});
      return Object.assign({}, ex, sch); // extras + official
    }
    return sch;
  }

  function fmtCountdown(ms){
    const s=Math.floor(ms/1000), d=Math.floor(s/86400),
          h=Math.floor((s%86400)/3600), m=Math.floor((s%3600)/60),
          sec=s%60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  }

  const map = await loadMap();
  const today = new Date(); 
  today.setHours(0,0,0,0);

  const nonSunday = document.getElementById('nonSunday');
  const sundayWelcome = document.getElementById('sundayWelcome');
  const countdownSpan = document.getElementById('countdown');
  const viewBtn = document.getElementById('viewSurprise');


  function confetti() {
    const cvs = document.getElementById('confetti'); 
    if (!cvs) return; 
    const ctx = cvs.getContext('2d'); 
    function resize() { cvs.width = innerWidth; cvs.height = innerHeight; } 
    addEventListener('resize', resize); resize();
    const C = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff9a9e', '#fbc2eb', '#a1c4fd']; 
    const TAU = Math.PI * 2, g = .18, drag = .005; 
    let pcs = []; 
    function burst(x, y, n = 200) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = 5 + Math.random() * 7;
        pcs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, w: 6 + Math.random() * 8, h: 10 + Math.random() * 14, rot: Math.random() * TAU, vr: (Math.random() - .5) * .25, c: C[(Math.random() * C.length) | 0], t: Math.random() * TAU, vt: (Math.random() * .2) + .05, alpha: 1 });
      }
    }
    let raf;
    function tick() {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      for (const p of pcs) {
        p.vx *= (1 - drag);
        p.vy += g; p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.t += p.vt;
        if (p.y > cvs.height - 20) p.alpha -= .02; ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const sy = Math.sin(p.t); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2 * sy, p.w, p.h * Math.max(.2, Math.abs(sy))); ctx.restore();
      } pcs = pcs.filter(p => p.alpha > 0 && p.x > -50 && p.x < cvs.width + 50 && p.y < cvs.height + 50); if (pcs.length) raf = requestAnimationFrame(tick); else cancelAnimationFrame(raf), raf = null;
    } 
    burst(innerWidth / 2, innerHeight * .25, 220); 
    if (!raf) raf = requestAnimationFrame(tick);
  }



  if(isSunday(today) && map[isoOf(today)]){
    sundayWelcome.hidden = false;
    confetti(); 
    document.getElementById('viewSurprise').addEventListener('click',()=>{ const iso=isoOf(today); 
      location.href=`view.html?date=${iso}`; },{passive:true}); 
  } else {
    nonSunday.hidden = false;
    const canShowHistory = today >= parseLocalISO(LAUNCH_ISO);
    const btn = document.getElementById('seeHistory');
    document.getElementById('seeHistory').addEventListener('click',()=>location.href='history.html',{passive:true});
    btn.style.display = canShowHistory ? 'inline-block' : 'none';
    function tick(){
      const ms = nextSunday().getTime() - Date.now();
      countdownSpan.textContent = fmtCountdown(Math.max(0,ms));
    }
    tick(); setInterval(tick,1000);
  }
})();
