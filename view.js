(async function(){
  const params=new URLSearchParams(location.search); const iso=params.get('date'); const from=params.get('from');
  const title=document.getElementById('title'); const content=document.getElementById('content'); const backBtn=document.getElementById('backBtn'); backBtn.href=(from==='history')?'history.html':'index.html';
  const schedule=await fetch('schedule.json',{cache:'no-store'}).then(r=>r.json());
  const extras={"2025-08-31":"🧪 Test Sunday — try the test quiz here: <a href='quiz.html?quiz=test'>Play test quiz</a>","2025-08-24":"🧪 Test Sunday (Aug 24) — another fake page","2025-08-17":"🧪 Test Sunday (Aug 17) — another fake page"}; const all=Object.assign({}, extras, schedule);
  function pretty(iso){ const d=new Date(iso); return d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
  if(!iso || !all[iso]){ title.textContent="Not found"; content.textContent="No surprise scheduled for this date."; return; }
  title.textContent=pretty(iso); content.innerHTML=all[iso];
  if(!localStorage.getItem('read:'+iso)){ localStorage.setItem('read:'+iso,'1'); }
})();