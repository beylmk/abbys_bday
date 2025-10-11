(async function () {
  // ---------- Setup & data ----------
  const params = new URLSearchParams(location.search);
  const id = params.get('quiz') || 'sample';

  // Where to go when backing out on the first question
  const returnUrl =
    params.get('return') ||
    sessionStorage.getItem('quiz:returnUrl') ||
    (document.referrer || '') ||
    'index.html';
  sessionStorage.setItem('quiz:returnUrl', returnUrl);

  const data = await fetch(`quizzes/${id}.json`, { cache: 'no-store' }).then(r => r.json());

  const mount = document.getElementById('quizMount');
  const nav = document.getElementById('navActions');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const titleEl = document.getElementById('qTitle');

  if (titleEl) titleEl.textContent = data.title || "Sunday Quiz";

  const STORAGE_KEY = `quiz:${id}`;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { }

  // persistent state
  if (!saved || typeof saved !== 'object') {
    saved = { index: 0, answers: [], guesses: [], revealed: [] };
  }
  if (!Array.isArray(saved.answers)) saved.answers = [];
  if (!Array.isArray(saved.guesses)) saved.guesses = [];
  if (!Array.isArray(saved.revealed)) saved.revealed = [];

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // start index from ?q= or saved
  const urlQ = Number(params.get('q'));
  let qIndex = Number.isFinite(urlQ)
    ? clamp(urlQ, 0, data.questions.length - 1)
    : clamp(Number(saved.index || 0), 0, data.questions.length - 1);

  // ---------- History sync (so hardware back mirrors UI) ----------
  function syncHistory() {
    const url = new URL(location.href);
    url.searchParams.set('q', String(qIndex));
    history.replaceState({ q: qIndex }, '', url);
  }
  syncHistory();

  window.addEventListener('popstate', (e) => {
    const q = e.state?.q;
    if (typeof q === 'number') {
      if (q < 0 || (q === 0 && qIndex === 0)) { exitQuiz(); return; }
      qIndex = clamp(q, 0, data.questions.length - 1);
      renderQuestion(qIndex);
    } else {
      if (qIndex === 0) exitQuiz();
    }
  });

  function exitQuiz() {
    if (returnUrl && !/quiz\.html/i.test(returnUrl)) {
      location.href = returnUrl;
    } else if (history.length > 1) {
      history.back();
    } else {
      location.href = 'index.html';
    }
  }

  function saveState() {
    try { saved.index = qIndex; localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]
    ));
  }

  // ---------- Renderers ----------
  function renderQuestion(idx) {
    const q = data.questions[idx];
    if (!q) { renderDone(); return; }

    const isFreeform = (q.type === 'freeform') || (!Array.isArray(q.options));
    const yourAns = saved.answers[idx];    // number for MCQ, string for freeform
    const yourGuess = saved.guesses[idx];
    const isRevealed = !!saved.revealed[idx];

    const progressHTML = `<p class="muted" style="margin-top:8px">Question ${idx + 1} of ${data.questions.length}</p>`;

    if (isFreeform) {
      // ----- FREEFORM -----
      if (!isRevealed) {
        // Entry form
        mount.innerHTML = `
          <h2 style="margin-top:0">${q.text}</h2>
          <textarea id="ffInput" rows="6" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.12)"
            placeholder="Write your thoughts here...">${typeof yourAns === 'string' ? yourAns : ''}</textarea>
          <div class="actions" style="margin-top:12px">
            <button id="ffSubmit" class="btn primary">Submit</button>
          </div>
          ${progressHTML}
        `;
        if (nextBtn) nextBtn.disabled = true; // next only after submit

        document.getElementById('ffSubmit')?.addEventListener('click', () => {
          const val = String(document.getElementById('ffInput').value || '').trim();
          saved.answers[idx] = val;
          saved.revealed[idx] = true;  // reveal after submit
          saveState();
          renderQuestion(idx);
        });
      } else {
        // Reveal view (your text + author's text)
        const yourText = (typeof yourAns === 'string' && yourAns.trim()) ? yourAns.trim() : '<em>(no answer)</em>';
        const authorText = (q.authorText || q.authorAnswerText || q.authorAnswer || '').toString() || '<em>(no reply yet)</em>';
        const isLast = (idx === data.questions.length - 1);

        mount.innerHTML = `
    <h2 style="margin-top:0">${q.text}</h2>
    <div class="card" style="background:#fff7; padding:12px; border-radius:12px;">
      <p><strong>Your note:</strong></p>
      <p>${escapeHtml(yourText).replace(/\\n/g, '<br>')}</p>
    </div>
    <div class="card" style="background:#fff7; padding:12px; border-radius:12px; margin-top:10px;">
      <p><strong>My note:</strong></p>
      <p>${escapeHtml(authorText).replace(/\\n/g, '<br>')}</p>
    </div>

    <div class="actions" style="margin-top:12px">
      <button id="ffNext" class="btn primary">${isLast ? 'Finish' : 'Next question'}</button>
    </div>

    ${progressHTML}
  `;

        // Local "Next" button always present on reveal view
        document.getElementById('ffNext')?.addEventListener('click', (e) => {
          e.preventDefault();
          if (!isLast) {
            qIndex = idx + 1;
            renderQuestion(qIndex);
          } else {
            renderDone();
          }
        });

        // Also sync the global next button if you have one
        if (nextBtn) {
          nextBtn.disabled = false;
          nextBtn.textContent = isLast ? 'Finish' : 'Next';
        }
      }

    } else {
      // ----- MULTIPLE CHOICE (existing behavior) -----
      const options = q.options || [];
      const optionButtons = (name, selectedIdx) => `
        <div class="actions" data-group="${name}">
          ${options.map((opt, i) => `
            <button type="button" class="btn option ${selectedIdx === i ? 'selected' : ''}" data-idx="${i}">
              ${opt}
            </button>`).join('')}
        </div>
      `;

      mount.innerHTML = `
        <h2 style="margin-top:0">${q.text}</h2>
        <h3>Your answer</h3>
        ${optionButtons('answer', yourAns)}
        <h3>Your guess of my answer</h3>
        ${optionButtons('guess', yourGuess)}
        ${progressHTML}
      `;

      const answerGroup = mount.querySelector('[data-group="answer"]');
      const guessGroup = mount.querySelector('[data-group="guess"]');

      answerGroup?.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-idx]');
        if (!b) return;
        const i = Number(b.getAttribute('data-idx'));
        saved.answers[idx] = i;
        saveState();
        answerGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        b.classList.add('selected');
      });

      guessGroup?.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-idx]');
        if (!b) return;
        const i = Number(b.getAttribute('data-idx'));
        saved.guesses[idx] = i;
        saveState();
        guessGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
        b.classList.add('selected');
      });

      if (nextBtn) nextBtn.textContent = (idx === data.questions.length - 1) ? 'Finish' : 'Next';
    }

    if (prevBtn) prevBtn.textContent = (idx > 0) ? 'Back' : 'Exit';

    syncHistory();
    saveState();
  }

  function renderDone() {
    mount.innerHTML = `
      <h2>Nice! You finished this quiz.</h2>
      <div class="actions">
        <button id="viewAllBtn" class="btn">View all answers</button>
        <a class="btn" href="${returnUrl}">Back</a>
        <a class="btn" href="index.html">Home</a>
      </div>
    `;
    document.getElementById('viewAllBtn')?.addEventListener('click', () => renderAnswersView(saved));
  }

  // Results page: supports both MCQ and freeform (no scoring for freeform)
  function renderAnswersView(obj) {
    mount.innerHTML = '<h2>All Answers</h2>';
    const list = document.createElement('ol');
    const qs = data.questions;

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const isFreeform = (q.type === 'freeform') || (!Array.isArray(q.options));
      const li = document.createElement('li');

      if (isFreeform) {
        const abbyText = obj.answers[i] ?? '';
        const authorTxt = (q.authorText || q.authorAnswerText || q.authorAnswer || '');
        li.innerHTML = `
          <p><strong>${q.text}</strong></p>
          <p>You wrote: <em>${escapeHtml(abbyText || '(no answer)')}</em></p>
          <p>My note: <strong>${escapeHtml(authorTxt || '(no reply yet)')}</strong></p>
          <hr/>
        `;
      } else {
        const myAns = q.authorAnswer;
        const myGuess = q.authorGuessForAbby;
        const abbyAns = obj.answers[i];
        const abbyGuess = obj.guesses[i];
        const correct = (abbyGuess === myAns);
        const match = (abbyAns === myAns);
        const iGuessedRight = (myGuess === abbyAns);
        li.innerHTML = `
          <p><strong>${q.text}</strong></p>
          <p>You answered: <em>${q.options[abbyAns] ?? "—"}</em></p>
          <p>You guessed I answered: <em>${q.options[abbyGuess] ?? "—"}</em> ${correct ? "✅" : "❌"}</p>
          <p>What I actually answered: <strong>${q.options[myAns]}</strong></p>
          <p><small>I guessed you would pick: <em>${q.options[myGuess]}</em></small></p>
          <hr/>
          <p><small>Match? ${match ? "💖 Yes!" : "Not this time"} · Did I guess yours right? ${iGuessedRight ? "🔮 Yes!" : "Nope 😅"}</small></p>
        `;
      }
      list.appendChild(li);
    }
    mount.appendChild(list);

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.innerHTML = `
      <a class="btn" href="${returnUrl}">Back</a>
      <a class="btn" href="index.html">Home</a>
    `;
    mount.appendChild(actions);
  }

  // ---------- Nav buttons ----------
  prevBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (qIndex > 0) { qIndex -= 1; renderQuestion(qIndex); }
    else { exitQuiz(); }
  });

  nextBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (qIndex < data.questions.length - 1) { qIndex += 1; renderQuestion(qIndex); }
    else { renderDone(); }
  });

  // ---------- First render ----------
  renderQuestion(qIndex);
})();
