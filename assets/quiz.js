/* quiz.js — reusable self-check widgets for Slowenisch lessons.
   Two widgets, both giving immediate, automatic feedback (tight loop):
   1. Multiple-choice .quiz  — declared via data attributes, see below.
   2. Flip cards .flip       — click to reveal; "think first, then check".

   Multiple choice markup:
   <div class="quiz">
     <div class="q" data-answer="1">
       <div class="prompt">Question?</div>
       <div class="opts">
         <button class="opt">wrong</button>
         <button class="opt">right</button>   // index 1 = data-answer
       </div>
       <div class="fb" data-correct="why right" data-wrong="why wrong"></div>
     </div>
   </div>
*/
document.addEventListener("click", (e) => {
  // Flip cards
  const flip = e.target.closest(".flip");
  if (flip) { flip.classList.toggle("open"); return; }

  // Multiple choice
  const btn = e.target.closest(".quiz button.opt");
  if (!btn) return;
  const q = btn.closest(".q");
  if (q.dataset.done) return;                 // lock after first answer
  const opts = [...q.querySelectorAll("button.opt")];
  const answer = parseInt(q.dataset.answer, 10);
  const picked = opts.indexOf(btn);
  const fb = q.querySelector(".fb");

  opts[answer].classList.add("correct");
  if (picked !== answer) btn.classList.add("wrong");
  q.dataset.done = "1";

  if (fb) {
    fb.textContent = picked === answer
      ? "✓ " + (fb.dataset.correct || "Pravilno!")
      : "✗ " + (fb.dataset.wrong || "Še enkrat poglej.");
    fb.classList.add("show");
  }
});
