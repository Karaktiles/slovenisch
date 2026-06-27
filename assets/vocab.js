/* vocab.js — Vokabeltrainer-Engine. Erwartet VOCAB + THEMES aus vocab-data.js
   und die DOM-Struktur aus vocab.html.
   Leichtes Leitner-Spaced-Repetition: jede Vokabel hat eine "Box" 0..5 in
   localStorage. Höhere Box = seltener gezogen. "Znam" hebt, "Spet" senkt. */

(function () {
  const KEY = "sl-vocab-boxes-v1";
  const boxes = JSON.parse(localStorage.getItem(KEY) || "{}");
  const save = () => localStorage.setItem(KEY, JSON.stringify(boxes));
  const box = (w) => boxes[w.sl] ?? 0;

  let pool = VOCAB.slice();         // aktuell aktiver Satz (nach Thema gefiltert)
  let dir = "de2sl";                // de2sl = Deutsch zeigen, Slowenisch abrufen (Produktion)
  let current = null, last = null, revealed = false;
  let seen = 0, known = 0;

  const $ = (id) => document.getElementById(id);
  const elPrompt = $("prompt"), elAnswer = $("answer"), elGender = $("gender"),
        elForvo = $("forvo"), elTheme = $("themeLabel"), elCard = $("card"),
        elSeen = $("seen"), elKnown = $("known"), elMastered = $("mastered"),
        elReveal = $("revealHint"), elButtons = $("buttons");

  function pickWeighted() {
    // Gewicht = 6 - box  →  schwache Wörter häufiger. Direkte Wiederholung vermeiden.
    let candidates = pool.filter((w) => w !== last);
    if (!candidates.length) candidates = pool;
    const weights = candidates.map((w) => 6 - box(w));
    let total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function masteredCount() {
    return pool.filter((w) => box(w) >= 4).length;
  }

  function render() {
    current = pickWeighted();
    revealed = false;
    const front = dir === "de2sl" ? current.de : current.sl;
    const back = dir === "de2sl" ? current.sl : current.de;
    elPrompt.textContent = front;
    elAnswer.textContent = back;
    elGender.textContent = current.g ? current.g + "." : "";
    elTheme.textContent = (THEMES[current.t] || current.t).split(" · ")[0];
    elForvo.href = "https://forvo.com/word/" + encodeURIComponent(current.sl) + "/#sl";
    elCard.classList.remove("show");
    elReveal.style.display = "";
    elButtons.style.visibility = "hidden";
    elMastered.textContent = masteredCount();
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    elCard.classList.add("show");
    elReveal.style.display = "none";
    elButtons.style.visibility = "visible";
  }

  function mark(good) {
    if (!revealed) { reveal(); return; }
    const b = box(current);
    boxes[current.sl] = good ? Math.min(5, b + 1) : 0;
    save();
    seen++; if (good) known++;
    elSeen.textContent = seen;
    elKnown.textContent = known;
    last = current;
    render();
  }

  function applyTheme(t) {
    pool = t === "all" ? VOCAB.slice() : VOCAB.filter((w) => w.t === t);
    last = null;
    render();
  }

  // — UI-Verdrahtung —
  elCard.addEventListener("click", () => (revealed ? null : reveal()));
  $("again").addEventListener("click", () => mark(false));
  $("know").addEventListener("click", () => mark(true));
  $("dirBtn").addEventListener("click", () => {
    dir = dir === "de2sl" ? "sl2de" : "de2sl";
    $("dirBtn").textContent = dir === "de2sl" ? "DE → SL" : "SL → DE";
    render();
  });
  $("reset").addEventListener("click", () => {
    if (confirm("Lernfortschritt (Boxen) zurücksetzen?")) {
      for (const k in boxes) delete boxes[k];
      save(); seen = known = 0; elSeen.textContent = 0; elKnown.textContent = 0;
      render();
    }
  });

  // Themen-Dropdown füllen
  const sel = $("theme");
  sel.innerHTML = '<option value="all">Vse teme · alle (' + VOCAB.length + ")</option>";
  for (const key in THEMES) {
    const n = VOCAB.filter((w) => w.t === key).length;
    sel.innerHTML += `<option value="${key}">${THEMES[key]} (${n})</option>`;
  }
  sel.addEventListener("change", () => applyTheme(sel.value));

  // Tastatur: Space/Enter = aufdecken, 1/←=Spet, 2/→=Znam
  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); revealed ? null : reveal(); }
    else if (e.key === "1" || e.key === "ArrowLeft") mark(false);
    else if (e.key === "2" || e.key === "ArrowRight") mark(true);
  });

  render();
})();
