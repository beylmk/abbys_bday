(async function () {
  // Treat "YYYY-MM-DD" as LOCAL dates (no UTC shift)
  function parseLocalISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function prettyDate(iso) {
    const d = parseLocalISO(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  function isRead(iso) {
    return localStorage.getItem('read:' + iso) === '1';
  }

  const list = document.getElementById('historyList');

  // Load both JSON files
  const [schedule, extras] = await Promise.all([
    fetch('schedule.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('extras.json',   { cache: 'no-store' }).then(r => r.ok ? r.json() : {})
  ]);

  // Merge: extras first, then schedule (schedule wins on key conflicts)
  const all = Object.assign({}, extras, schedule);

  // Only show dates up to today (local)
  const today = new Date(); today.setHours(0,0,0,0);

  const dates = Object.keys(all)
    .filter(iso => parseLocalISO(iso) <= today)
    .sort(); // ISO sort is chronological

  // Build full-row clickable list
  for (const iso of dates) {
    const li = document.createElement('li');
    li.className = 'row-li';

    const link = document.createElement('a');
    link.className = 'row';
    link.href = `view.html?date=${iso}&from=history`;
    link.setAttribute('aria-label', `Open surprise for ${prettyDate(iso)}`);

    const left = document.createElement('span');
    left.className = 'label';
    left.innerHTML = prettyDate(iso) + (isRead(iso) ? ' ✅' : '');

    const right = document.createElement('span');
    right.className = 'chev';
    right.textContent = '›';

    link.appendChild(left);
    link.appendChild(right);
    li.appendChild(link);
    list.appendChild(li);
  }
})();