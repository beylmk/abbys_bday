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
  li.className = 'row-li';

  const link = document.createElement('a');
  link.className = 'row';
  link.href = `view.html?date=${iso}&from=history`;
  link.setAttribute('aria-label', `Open surprise for ${prettyDate(iso)}`);

  // Left label + right chevron
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
