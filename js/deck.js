(function () {
  'use strict';

  var TOTAL = 12;
  var cur = 1;

  var pipsEl = document.getElementById('pips');
  var ctrEl = document.getElementById('counter');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  for (var i = 1; i <= TOTAL; i++) {
    var p = document.createElement('div');
    p.className = 'pip';
    p.onclick = (function (n) { return function () { go(n); }; })(i);
    pipsEl.appendChild(p);
  }

  function go(n) {
    var slides = document.querySelectorAll('.slide');
    slides.forEach(function (s) { s.classList.remove('active'); });
    cur = Math.max(1, Math.min(TOTAL, n));
    var activeSlide = document.getElementById('s' + cur);
    activeSlide.classList.add('active');
    activeSlide.scrollTop = 0;
    var pips = pipsEl.querySelectorAll('.pip');
    pips.forEach(function (p, i) { p.classList.toggle('active', i + 1 === cur); });
    ctrEl.textContent = String(cur).padStart(2, '0') + ' / ' + String(TOTAL).padStart(2, '0');
    prevBtn.disabled = cur === 1;
    nextBtn.disabled = cur === TOTAL;
  }

  window.go = go;

  prevBtn.onclick = function () { go(cur - 1); };
  nextBtn.onclick = function () { go(cur + 1); };

  var cards = document.querySelectorAll('.prog-card[data-slide]');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      go(parseInt(card.dataset.slide, 10));
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(cur - 1); }
  });

  go(1);
})();
