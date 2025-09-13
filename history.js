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

  const list = document.getElementById('historyList');
  const map = await loadMap();
  const today = new Date(); today.setHours(0,0,0,0);

  const dates = Object.keys(map).filter(iso=>parseLocalISO(iso)<=today).sort();

  function isRead(iso){ return localStorage.getItem('read:'+iso)==='1'; }

  for(const iso of dates){
    const li=document.createElement('li');
    const link=document.createElement('a');
    link.className='row';
    link.href=`view.html?date=${iso}&from=history`;
    link.setAttribute('aria-label',`Open surprise for ${pretty(iso)}`);
    const left=document.createElement('span'); left.className='label';
    left.innerHTML=pretty(iso)+(isRead(iso)?' ✅':'');
    const right=document.createElement('span'); right.className='chev'; right.textContent='›';
    link.appendChild(left); link.appendChild(right);
    li.appendChild(link); list.appendChild(li);
  }
})();
