(async function(){
  // tdo set this to sept 7
  const LAUNCH_ISO = '2025-08-31';

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
  const today = new Date(); today.setHours(0,0,0,0);

  const nonSunday = document.getElementById('nonSunday');
  const sundayWelcome = document.getElementById('sundayWelcome');
  const countdownSpan = document.getElementById('countdown');
  const viewBtn = document.getElementById('viewSurprise');

  if(isSunday(today) && map[isoOf(today)]){
    sundayWelcome.hidden = false;
    viewBtn.href = `view.html?date=${isoOf(today)}`;
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
