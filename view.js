(async function(){
  function pretty(iso){
    const d=parseLocalISO(iso);
    return d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  }
  async function loadMap(){
    const sch = await fetch('schedule.json',{cache:'no-store'}).then(r=>r.json());
    if(INCLUDE_EXTRAS){
      const ex = await fetch('extras.json',{cache:'no-store'}).then(r=>r.ok?r.json():{});
      return Object.assign({}, ex, sch);
    }
    return sch;
  }

  const params=new URLSearchParams(location.search);
  const iso=params.get('date'); const from=params.get('from');

  const title=document.getElementById('title');
  const content=document.getElementById('content');
  const backBtn=document.getElementById('backBtn');
  backBtn.href = (from==='history')?'history.html':'index.html';

  const map = await loadMap();
  if(!iso || !map[iso]){
    title.textContent='Not found';
    content.textContent='No page found for this date.';
    return;
  }

  title.textContent = pretty(iso);

  // fetch the HTML file for this date and inject it
  try{
    const html = await fetch(map[iso], {cache:'no-store'}).then(r=>r.text());
    content.innerHTML = html;
  }catch(e){
    content.textContent = 'Error loading page.';
  }

  if(!localStorage.getItem('read:'+iso)) localStorage.setItem('read:'+iso,'1');
})();
