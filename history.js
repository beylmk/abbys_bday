(async function () {
  // Parse "YYYY-MM-DD" as a LOCAL date (no UTC shift)
  function parseLocalISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d); // month is 0-based
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

  const list = document.getElementById('historyList');
  const schedule = await fetch('schedule.json', { cache: 'no-store' }).then(r => r.json());

  // Your test extras still use ISO strings, so this works for both.
  const extras = {
    "2025-08-31": "🧪 Test Sunday — try the test quiz here: <a href='quiz.html?quiz=test'>Play test quiz</a>",
    "2025-08-24": "🧪 Test Sunday (Aug 24) — another fake page",
    "2025-08-17": "🧪 Test Sunday (Aug 17) — another fake page"
  };

  const all = Object.assign({}, extras, schedule);

  // Today at local midnight for clean comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter to past-or-today Sundays (compare using LOCAL dates)
  const dates = Object.keys(all)
    .filter(iso => parseLocalISO(iso) <= today)
    // ISO strings sort chronologically already, so simple lexicographic sort works
    .sort();

  function isRead(iso) {
    return localStorage.getItem('read:' + iso) === '1';
  }

  for (const iso of dates) {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.innerHTML = prettyDate(iso) + (isRead(iso) ? ' ✅' : '');

    const a = document.createElement('a');
    a.href = `view.html?date=${iso}&from=history`;
    a.textContent = 'Open';

    li.appendChild(span);
    li.appendChild(a);
    list.appendChild(li);
  }
})();
