(async function () {
  const params = new URLSearchParams(location.search); const id = params.get('quiz') || 'sample';
  const data = await fetch(`quizzes/${id}.json`, { cache: 'no-store' }).then(r => r.json());
  const mount = document.getElementById('quizMount'); const nav = document.getElementById('navActions'); const prevBtn = document.getElementById('prevBtn'); const nextBtn = document.getElementById('nextBtn'); document.getElementById('qTitle').textContent = data.title || "Sunday Quiz";
  const STORAGE_KEY = `quiz:${id}`; let saved = null; try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { }
function renderAnswersView(obj) {
  mount.innerHTML = '<h2>All Answers</h2>';

  const list = document.createElement('ol');
  const qs = data.questions;

  let youRightAboutAbby = 0;   // your guess of Abby's answer equals Abby's actual answer
  let abbyRightAboutYou = 0;   // Abby's guess of your answer equals your actual answer

  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const myAns     = q.authorAnswer;           // your actual answer (index)
    const myGuess   = q.authorGuessForAbby;     // what you guessed Abby would pick (index)
    const abbyAns   = obj.answers[i];           // Abby's actual answer (index)
    const abbyGuess = obj.guesses[i];           // Abby's guess of your answer (index)

    const youGotRight   = (myGuess === abbyAns);
    const abbyGotRight  = (abbyGuess === myAns);

    if (youGotRight)  youRightAboutAbby++;
    if (abbyGotRight) abbyRightAboutYou++;

    const li = document.createElement('li');
    li.innerHTML = `
      <p><strong>${q.text}</strong></p>
      <p>You answered: <em>${q.options[abbyAns] ?? "—"}</em></p>
      <p>You guessed I answered: <em>${q.options[abbyGuess] ?? "—"}</em> ${abbyGotRight ? "✅" : "❌"}</p>
      <p>What I actually answered: <strong>${q.options[myAns]}</strong></p>
      <p><small>I guessed you would pick: <em>${q.options[myGuess]}</em> ${youGotRight ? "✅" : "❌"}</small></p>
      <hr/>
    `;
    list.appendChild(li);
  }

  mount.appendChild(list);

  // ----- Summary block -----
  const total = qs.length;
  const pctYou  = Math.round((youRightAboutAbby / total) * 100);
  const pctAbby = Math.round((abbyRightAboutYou / total) * 100);

  let winnerText = "It's a tie! 💖";
  if (youRightAboutAbby > abbyRightAboutYou) winnerText = "Maddie wins! 🎉";
  else if (abbyRightAboutYou > youRightAboutAbby) winnerText = "Abby wins! 🎉";

  const summary = document.createElement('section');
  summary.className = 'summary';
  summary.innerHTML = `
    <h3 style="margin:0 0 8px 0;">Summary</h3>

    <div class="row">
      <div><strong>Maddie about Abby:</strong> ${youRightAboutAbby}/${total} (${pctYou}%)</div>
    </div>
    <div class="progress" aria-label="Maddie about Abby">
      <span id="barYou" style="width:0%"></span>
    </div>

    <div class="row" style="margin-top:10px">
      <div><strong>Abby about Maddie:</strong> ${abbyRightAboutYou}/${total} (${pctAbby}%)</div>
    </div>
    <div class="progress" aria-label="Abby about Maddie">
      <span id="barAbby" style="width:0%"></span>
    </div>

    <div class="winner" style="text-align:center;margin-top:12px;">
      <span class="badge">${winnerText}</span>
    </div>
  `;
  mount.appendChild(summary);

  // Animate / set bar widths
  requestAnimationFrame(() => {
    summary.querySelector('#barYou').style.width  = pctYou + '%';
    summary.querySelector('#barAbby').style.width = pctAbby + '%';
  });

  // Back row
  const backRow = document.createElement('div');
  backRow.className = 'actions';
  backRow.innerHTML = `<a class="btn" href="${returnUrl}">Back</a>`;
  mount.appendChild(backRow);
}

  if (saved && Array.isArray(saved.answers) && Array.isArray(saved.guesses)) { mount.innerHTML = ''; const btn = document.createElement('button'); btn.className = 'btn primary'; btn.textContent = 'View all answers'; btn.addEventListener('click', () => renderAnswersView(saved)); mount.appendChild(btn); nav.style.display = 'none'; return; }
  let step = 0; const answers = []; const guesses = [];
  function renderQuestion(i) {
    const q = data.questions[i]; mount.innerHTML = ''; const h = document.createElement('h2'); h.textContent = `Q${i + 1}. ${q.text}`; mount.appendChild(h);
    const secMe = document.createElement('section'); secMe.innerHTML = '<div><strong>Your answer</strong></div>'; q.options.forEach((opt, idx) => { const label = document.createElement('label'); label.style.display = 'block'; label.innerHTML = `<input type="radio" name="me-${i}" value="${idx}"> ${opt}`; secMe.appendChild(label); }); mount.appendChild(secMe);
    const secGuess = document.createElement('section'); secGuess.innerHTML = '<div><strong>Guess what I answered</strong></div>'; q.options.forEach((opt, idx) => { const label = document.createElement('label'); label.style.display = 'block'; label.innerHTML = `<input type="radio" name="guess-${i}" value="${idx}"> ${opt}`; secGuess.appendChild(label); }); mount.appendChild(secGuess);
    nav.style.display = 'flex'; prevBtn.disabled = (i === 0); nextBtn.textContent = (i === data.questions.length - 1) ? 'See results →' : 'Next →';
    if (answers[i] != null) { const r = mount.querySelector(`input[name="me-${i}"][value="${answers[i]}"]`); if (r) r.checked = true; }
    if (guesses[i] != null) { const r = mount.querySelector(`input[name="guess-${i}"][value="${guesses[i]}"]`); if (r) r.checked = true; }
  }
  function capture(i) { const me = mount.querySelector(`input[name="me-${i}"]:checked`); const g = mount.querySelector(`input[name="guess-${i}"]:checked`); answers[i] = me ? parseInt(me.value, 10) : null; guesses[i] = g ? parseInt(g.value, 10) : null; }
  prevBtn.addEventListener('click', () => { capture(step); if (step > 0) { step--; renderQuestion(step); } }); nextBtn.addEventListener('click', () => { capture(step); if (answers[step] == null || guesses[step] == null) { alert('Please answer both parts!'); return; } if (step < data.questions.length - 1) { step++; renderQuestion(step); } else { showResults(); } });
  function showResults() { const payload = { answers, guesses, savedAt: new Date().toISOString(), version: 1 }; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { } mount.innerHTML = '<h2>Results</h2><p>Nice! Your answers are saved.</p>'; const btn = document.createElement('button'); btn.className = 'btn primary'; btn.textContent = 'View all answers'; btn.addEventListener('click', () => renderAnswersView(payload)); mount.appendChild(btn); nav.style.display = 'none'; const actions = document.createElement('div'); actions.className = 'actions'; actions.innerHTML = `<a class="btn" href="history.html">Back</a> <a class="btn" href="index.html">Home</a>`; mount.appendChild(actions); }
  renderQuestion(step);
})();