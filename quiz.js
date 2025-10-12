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

  const mount   = document.getElementById('quizMount');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const titleEl = document.getElementById('qTitle');

  if (titleEl) titleEl.textContent = data.title || "Sunday Quiz";

  const STORAGE_KEY = `quiz:${id}`;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}

  // persistent state (answers: number for MCQ/either, string for freeform)
  if (!saved || typeof saved !== 'object') {
    saved = { index: 0, answers: [], guesses: [], revealed: [] };
  }
  if (!Array.isArray(saved.answers))  saved.answers  = [];
  if (!Array.isArray(saved.guesses))  saved.guesses  = [];   // used by MCQ-with-guess style
  if (!Array.isArray(saved.revealed)) saved.revealed = [];   // used by freeform

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // start index from ?q= or saved
  const urlQ = Number(params.get('q'));
  let qIndex = Number.isFinite(urlQ)
    ? clamp(urlQ, 0, data.questions.length - 1)
    : clamp(Number(saved.index || 0), 0, data.questions.length - 1);

  // ---------- History sync ----------
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
    try { saved.index = qIndex; localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch {}
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => (
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]
    ));
  }

  // Helpers to detect type
  function isFreeformQ(q){ return (q.type === 'freeform') || (!Array.isArray(q.options) && !isEitherQ(q)); }
  function isEitherQ(q){ return q.type === 'either' || q.type === 'me-or-her' || q.type === 'shoe'; }

  // ---------- Renderers ----------
  function renderQuestion(idx) {
    const q = data.questions[idx];
    if (!q) { renderDone(); return; }

    const progressHTML = `<p class="muted" style="margin-top:8px">Question ${idx+1} of ${data.questions.length}</p>`;
    const yourAns      = saved.answers[idx];
    const yourGuess    = saved.guesses[idx];     // used by MCQ-with-guess style
    const revealed     = !!saved.revealed[idx];

    if (isFreeformQ(q)) {
      // ----- FREEFORM -----
      if (!revealed) {
        mount.innerHTML = `
          <h2 style="margin-top:0">${q.text}</h2>
          <textarea id="ffInput" rows="6" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.12)"
            placeholder="Write your thoughts here...">${typeof yourAns === 'string' ? yourAns : ''}</textarea>
          <div class="actions" style="margin-top:12px">
            <button id="ffSubmit" class="btn primary">Submit</button>
          </div>
          ${progressHTML}
        `;
        if (nextBtn) nextBtn.disabled = true; // next appears after submit
        document.getElementById('ffSubmit')?.addEventListener('click', () => {
          const val = String(document.getElementById('ffInput').value || '').trim();
          saved.answers[idx] = val;
          saved.revealed[idx] = true;  // reveal after submit
          saveState();
          renderQuestion(idx);
        });
      } else {
        const yourText   = (typeof yourAns === 'string' && yourAns.trim()) ? yourAns.trim() : '<em>(no answer)</em>';
        const authorText = (q.authorText || q.authorAnswerText || q.authorAnswer || '').toString() || '<em>(no reply yet)</em>';
        const isLast = (idx === data.questions.length - 1);
        mount.innerHTML = `
          <h2 style="margin-top:0">${q.text}</h2>
          <div class="card" style="background:#fff7; padding:12px; border-radius:12px;">
            <p><strong>Your note:</strong></p>
            <p>${escapeHtml(yourText).replace(/\n/g,'<br>')}</p>
          </div>
          <div class="card" style="background:#fff7; padding:12px; border-radius:12px; margin-top:10px;">
            <p><strong>My note:</strong></p>
            <p>${escapeHtml(authorText).replace(/\n/g,'<br>')}</p>
          </div>
          <div class="actions" style="margin-top:12px">
            <button id="ffNext" class="btn primary">${isLast ? 'Finish' : 'Next question'}</button>
          </div>
          ${progressHTML}
        `;
        document.getElementById('ffNext')?.addEventListener('click', (e) => {
          e.preventDefault();
          if (!isLast) { qIndex = idx + 1; renderQuestion(qIndex); }
          else { renderDone(); }
        });
        if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = isLast ? 'Finish' : 'Next'; }
      }
      if (prevBtn) prevBtn.textContent = (idx > 0) ? 'Back' : 'Exit';
      syncHistory(); saveState(); return;
    }

if (isEitherQ(q)) {
  // ----- EITHER/ME-OR-HER (auto-advance) -----
  const choices = Array.isArray(q.choices) && q.choices.length === 2 ? q.choices : ['Abby', 'Maddie'];
  const selected = Number.isFinite(yourAns) ? yourAns : -1;
  const isLast = (idx === data.questions.length - 1);

  mount.innerHTML = `
    <h2 style="margin-top:0">${q.text}</h2>
    <div class="actions" data-group="either">
      ${choices.map((label, i) => `
        <button type="button" class="btn option ${selected === i ? 'selected' : ''}" data-idx="${i}">
          ${escapeHtml(label)}
        </button>`).join('')}
    </div>
    ${progressHTML}
  `;

  const group = mount.querySelector('[data-group="either"]');
  group?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-idx]');
    if (!b) return;
    const i = Number(b.getAttribute('data-idx'));

    // Save selection
    saved.answers[idx] = i;
    saveState();

    // Visual feedback
    group.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    b.classList.add('selected');

    // Auto-advance after a brief beat
    setTimeout(() => {
      if (!isLast) {
        qIndex = idx + 1;
        renderQuestion(qIndex);
      } else {
        renderDone();
      }
    }, 120);
  });

  // We don’t rely on the global Next button, but keep it consistent if present
  if (nextBtn) {
    nextBtn.disabled = selected < 0;
    nextBtn.textContent = isLast ? 'Finish' : 'Next';
  }
  if (prevBtn) prevBtn.textContent = (idx > 0) ? 'Back' : 'Exit';

  syncHistory();
  saveState();
  return;
}


    // ----- MULTIPLE CHOICE (existing MCQ with "guess my answer") -----
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
    const guessGroup  = mount.querySelector('[data-group="guess"]');

    answerGroup?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-idx]'); if (!b) return;
      const i = Number(b.getAttribute('data-idx'));
      saved.answers[idx] = i; saveState();
      answerGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      b.classList.add('selected');
    });

    guessGroup?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-idx]'); if (!b) return;
      const i = Number(b.getAttribute('data-idx'));
      saved.guesses[idx] = i; saveState();
      guessGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      b.classList.add('selected');
    });

    if (nextBtn) nextBtn.textContent = (idx === data.questions.length - 1) ? 'Finish' : 'Next';
    if (prevBtn) prevBtn.textContent = (idx > 0) ? 'Back' : 'Exit';

    syncHistory(); saveState();
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

  // Results page: handles MCQ, Freeform, and Either (shoe-game)
  function renderAnswersView(obj) {
    mount.innerHTML = '<h2>All Answers</h2>';
    const list = document.createElement('ol');
    const qs = data.questions;

    let eitherTotal = 0;
    let eitherMatches = 0;

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const li = document.createElement('li');

      if (isFreeformQ(q)) {
        const abbyText  = obj.answers[i] ?? '';
        const authorTxt = (q.authorText || q.authorAnswerText || q.authorAnswer || '');
        li.innerHTML = `
          <p><strong>${q.text}</strong></p>
          <p>You wrote: <em>${escapeHtml(abbyText || '(no answer)')}</em></p>
          <p>My note: <strong>${escapeHtml(authorTxt || '(no reply yet)')}</strong></p>
          <hr/>
        `;
      } else if (isEitherQ(q)) {
        const choices = Array.isArray(q.choices) && q.choices.length === 2 ? q.choices : ['Abby','Maddie'];
        const abbyPick   = obj.answers[i];   // index
        const authorPick = q.authorPick;     // index
        const abbyLabel  = (abbyPick != null) ? choices[abbyPick] : '—';
        const myLabel    = (authorPick != null) ? choices[authorPick] : '—';

        eitherTotal++;
        if (abbyPick != null && authorPick != null && abbyPick === authorPick) eitherMatches++;

        li.innerHTML = `
          <p><strong>${q.text}</strong></p>
          <p>You picked: <em>${escapeHtml(abbyLabel)}</em></p>
          <p>My pick: <strong>${escapeHtml(myLabel)}</strong> ${abbyPick === authorPick ? '✅' : '❌'}</p>
          <hr/>
        `;
      } else {
        // MCQ (with guess)
        const myAns     = q.authorAnswer;
        const myGuess   = q.authorGuessForAbby;
        const abbyAns   = obj.answers[i];
        const abbyGuess = obj.guesses[i];
        const correct   = (abbyGuess === myAns);
        const match     = (abbyAns === myAns);
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

    // Shoe-game summary
    if (eitherTotal > 0) {
      const summary = document.createElement('section');
      summary.className = 'summary';
      const pct = Math.round((eitherMatches / eitherTotal) * 100);
      summary.innerHTML = `
        <h3 style="margin:0 0 8px 0;">Shoe-Game Summary</h3>
        <div><strong>Matches:</strong> ${eitherMatches}/${eitherTotal} (${pct}%)</div>
        <div class="progress" style="margin-top:6px"><span style="width:${pct}%;display:block;height:10px;background:var(--accent,#7c4dff);border-radius:999px;"></span></div>
      `;
      mount.appendChild(summary);
    }

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
