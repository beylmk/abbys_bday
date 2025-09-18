(async function () {
  const params = new URLSearchParams(location.search);
  const storyId = params.get('story') || 'sample';
  const returnUrl =
    params.get('return') ||
    sessionStorage.getItem('story:returnUrl') ||
    (document.referrer || '') ||
    'index.html';
  sessionStorage.setItem('story:returnUrl', returnUrl);

  const mount = document.getElementById('storyMount');
  const titleEl = document.getElementById('storyTitle');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const topBackBtn = document.getElementById('topBackBtn');

  const manifest = await fetch('story-manifest.json', { cache: 'no-store' }).then(r => r.json());
  const pages = manifest[storyId];
  if (!Array.isArray(pages) || pages.length === 0) {
    mount.textContent = 'Story not found.'; return;
  }

  titleEl.textContent = params.get('title') || 'Story';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let index = clamp(Number(params.get('i') || 0), 0, pages.length - 1);

  function syncHistory() {
    const url = new URL(location.href);
    url.searchParams.set('i', String(index));
    history.replaceState({ i: index }, '', url);
  }

  async function render() {
    try {
      const html = await fetch(pages[index], { cache: 'no-store' }).then(r => r.text());
      mount.innerHTML = html;
      document.querySelector('.app-scroll')?.scrollTo({ top: 0, behavior: 'instant' });
    } catch {
      mount.textContent = 'Error loading story page.';
    }
    prevBtn.textContent = index > 0 ? 'Back' : 'Exit';
    nextBtn.textContent = index < pages.length - 1 ? 'Next' : 'Finish';
    syncHistory();
  }

  function exitStory() {
    if (returnUrl && !/story\.html/i.test(returnUrl)) {
      location.href = returnUrl;
    } else if (history.length > 1) {
      history.back();
    } else {
      location.href = 'index.html';
    }
  }

  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (index > 0) { index -= 1; render(); }
    else { exitStory(); }
  });

  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (index < pages.length - 1) { index += 1; render(); }
    else { exitStory(); }
  });

  topBackBtn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (index > 0) { index -= 1; render(); }
    else { exitStory(); }
  });

  window.addEventListener('popstate', (e) => {
    const i = e.state?.i;
    if (typeof i === 'number') {
      if (i < 0 || (i === 0 && index === 0)) { exitStory(); return; }
      index = clamp(i, 0, pages.length - 1); render();
    } else {
      if (index === 0) exitStory();
    }
  });

  render();
})();