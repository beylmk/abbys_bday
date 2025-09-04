(async function () {
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

  const params = new URLSearchParams(location.search);
  const iso = params.get('date');
  const from = params.get('from');

  const title = document.getElementById('title');
  const content = document.getElementById('content');
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.href = (from === 'history') ? 'history.html' : 'index.html';

  const [schedule, extras] = await Promise.all([
    fetch('schedule.json', { cache: 'no-store' }).then(r => r.json()),
    fetch('extras.json',   { cache: 'no-store' }).then(r => r.ok ? r.json() : {})
  ]);

  const all = Object.assign({}, extras, schedule);

  if (!iso || !all[iso]) {
    title.textContent = 'Not found';
    content.textContent = 'No surprise scheduled for this date.';
    return;
  }

  title.textContent = prettyDate(iso);
  content.innerHTML = all[iso];

  const key = 'read:' + iso;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
  }
})();