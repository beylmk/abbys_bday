(async function () {
  function parseLocalISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function prettyDate(iso) {
    const d = parseLocalISO(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const params = new URLSearchParams(location.search);
  const iso = params.get('date');
  const from = params.get('from');

  const title = document.getElementById('title');
  const content = document.getElementById('content');
  const backBtn = document.getElementById('backBtn');

  backBtn.href = (from === 'history') ? 'history.html' : 'index.html';

  const schedule = await fetch('schedule.json', { cache: 'no-store' }).then(r => r.json());
  const extras = {
    "2025-08-31": "🧪 Test Sunday — try the test quiz here: <a href='quiz.html?quiz=test'>Play test quiz</a>",
    "2025-08-24": "🧪 Test Sunday (Aug 24) — another fake page",
    "2025-08-17": "🧪 Test Sunday (Aug 17) — another fake page"
  };
  const all = Object.assign({}, extras, schedule);

  if (!iso || !all[iso]) {
    title.textContent = 'Not found';
    content.textContent = 'No surprise scheduled for this date.';
    return;
  }

  title.textContent = prettyDate(iso);
  content.innerHTML = all[iso];

  // Auto-mark read on first open
  const key = 'read:' + iso;
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
  }
})();
