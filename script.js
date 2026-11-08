(function () {
  'use strict';

  /* ---------- Ano no rodapé ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ---------- Menu mobile ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('menu');
  function closeMenu() {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Abrir menu');
  }
  menuBtn.addEventListener('click', function () {
    var open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });

  /* ---------- Abas (método, princípios, fora do estande) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = t.classList.contains('is-on') ? 0 : -1;
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, j = -1;
        if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = tabs.length - 1;
        if (j >= 0) { e.preventDefault(); select(tabs[j], true); }
      });
    });
  });

  /* ---------- Desafio do alvo ---------- */
  var stage = document.getElementById('stage');
  if (!stage) return;
  var paper = document.getElementById('paper');
  var anchor = document.getElementById('anchor');
  var breath = document.getElementById('breath');
  var tremor = document.getElementById('tremor');
  var aim = document.getElementById('aim');
  var holesEl = document.getElementById('holes');
  var mpiEl = document.getElementById('mpi');
  var flash = document.getElementById('flash');
  var hint = document.getElementById('hint');
  var slotsEl = document.getElementById('slots');
  var totalEl = document.getElementById('total');
  var lastEl = document.getElementById('last');
  var statusEl = document.getElementById('status');
  var resultEl = document.getElementById('result');
  var resetBtn = document.getElementById('reset');

  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var TOUCH_OFFSET = 72; // a mira fica acima do dedo para não ser coberta
  if (coarse) hint.querySelector('span').textContent = 'TOQUE, ARRASTE PARA MIRAR E SOLTE PARA DISPARAR';

  var state = { shots: [], level: 1, hand: 0 };

  var DIRS = ['Alto', 'Alto · direita', 'Direita', 'Baixo · direita', 'Baixo', 'Baixo · esquerda', 'Esquerda', 'Alto · esquerda'];
  var DIAG = [
    ['Antecipação do recuo', 'O ponto médio subiu: sinal típico de levantar o punho ou a frente da arma antes do disparo, antecipando o recuo.'],
    ['Empurrar com a base da mão', 'Esse quadrante costuma indicar a base da mão empurrando a arma no disparo, antecipando o recuo.'],
    ['Pressão do polegar', 'Deslocamento para o lado do polegar sugere força do polegar sobre a arma durante o acionamento do gatilho.'],
    ['Punho cedendo para baixo', 'Esse quadrante é associado ao punho quebrando para baixo no momento do disparo.'],
    ['Flinch: antecipação para baixo', 'Tiros baixos são a assinatura clássica do flinch: empurrar a arma para baixo esperando o recuo.'],
    ['Mão inteira apertando o gatilho', 'O erro mais comum: apertar a mão toda junto com o gatilho, em vez de isolar o movimento do dedo.'],
    ['Dedo demais no gatilho', 'Deslocamento para esse lado indica dedo muito enfiado no gatilho, puxando a arma lateralmente.'],
    ['Falta de acompanhamento', 'Esse quadrante costuma vir de reagir ao disparo sem sustentar a visada até o fim (follow-through).']
  ];

  function setLevel(l) {
    state.level = l;
    breath.className = 'br' + (l + 1);
    tremor.className = 'tr' + (l + 1);
  }
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // força reflow para reiniciar a animação
    el.classList.add(cls);
  }
  function placeReticle(x, y) {
    anchor.style.left = x + 'px';
    anchor.style.top = y + 'px';
  }
  function showReticle(on) { anchor.classList.toggle('is-on', on && state.shots.length < 5); }

  function fire(px, py) {
    if (state.shots.length >= 5) return;
    var r = stage.getBoundingClientRect();
    var a = anchor.getBoundingClientRect();
    var b = aim.getBoundingClientRect();
    var ox = (b.left + b.width / 2) - a.left;
    var oy = (b.top + b.height / 2) - a.top;
    var sx = Math.min(Math.max(px + ox, 0), r.width);
    var sy = Math.min(Math.max(py + oy, 0), r.height);
    var R = r.width * 0.47;
    var nx = (sx - r.width / 2) / R;
    var ny = (sy - r.height / 2) / R;
    var d = Math.sqrt(nx * nx + ny * ny);
    var score = d >= 1 ? 0 : 10 - Math.floor(d * 10);
    state.shots.push({ nx: nx, ny: ny, score: score, x: d < 0.05 });
    restart(paper, 'kick');
    restart(flash, 'go');
    if (navigator.vibrate && coarse) { try { navigator.vibrate(18); } catch (e) {} }
    render(true);
  }

  // Mouse: mira segue o cursor, clique dispara
  // Toque: encosta para aparecer a mira, arrasta para ajustar, solta para disparar
  var touchActive = false;
  function local(e) {
    var r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  stage.addEventListener('pointermove', function (e) {
    var p = local(e);
    if (e.pointerType === 'mouse') { placeReticle(p.x, p.y); showReticle(true); hint.hidden = true; }
    else if (touchActive) { placeReticle(p.x, p.y - TOUCH_OFFSET); }
  });
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') showReticle(false); });
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    if (state.shots.length >= 5) return;
    touchActive = true;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    var p = local(e);
    placeReticle(p.x, p.y - TOUCH_OFFSET);
    showReticle(true);
    hint.hidden = true;
  });
  stage.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'mouse') {
      if (e.button !== 0) return;
      var p = local(e);
      fire(p.x, p.y);
      return;
    }
    if (!touchActive) return;
    touchActive = false;
    var q = local(e);
    fire(q.x, q.y - TOUCH_OFFSET);
    setTimeout(function () { showReticle(false); }, 120);
  });
  stage.addEventListener('pointercancel', function () { touchActive = false; showReticle(false); });

  document.querySelectorAll('[data-level]').forEach(function (b) {
    b.addEventListener('click', function () {
      setLevel(Number(b.getAttribute('data-level')));
      document.querySelectorAll('[data-level]').forEach(function (o) {
        var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', String(on));
      });
    });
  });
  document.querySelectorAll('[data-hand]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.hand = Number(b.getAttribute('data-hand'));
      document.querySelectorAll('[data-hand]').forEach(function (o) {
        var on = o === b; o.classList.toggle('is-on', on); o.setAttribute('aria-pressed', String(on));
      });
      if (state.shots.length >= 5) render(false);
    });
  });
  resetBtn.addEventListener('click', function () {
    state.shots = [];
    render(false);
    hint.hidden = false;
  });

  function pct(v) { return (50 + v * 47).toFixed(2) + '%'; }

  function render(justShot) {
    var shots = state.shots;
    var done = shots.length >= 5;

    holesEl.innerHTML = shots.map(function (p, i) {
      return '<div class="hole" style="left:' + pct(p.nx) + ';top:' + pct(p.ny) + '"></div>' +
             '<span class="hole-n" style="left:' + pct(p.nx) + ';top:' + pct(p.ny) + '">' + (i + 1) + '</span>';
    }).join('');

    var html = '';
    for (var i = 0; i < 5; i++) {
      var s = shots[i];
      html += s ? '<span class="slot is-hit">' + s.score + '</span>' : '<span class="slot">–</span>';
    }
    slotsEl.innerHTML = html;

    var total = shots.reduce(function (a, p) { return a + p.score; }, 0);
    totalEl.textContent = String(total);
    if (justShot) restart(totalEl, 'pop');

    var last = shots[shots.length - 1];
    lastEl.textContent = !last ? 'AGUARDANDO O PRIMEIRO DISPARO'
      : (last.score === 0 ? 'ÚLTIMO DISPARO: FORA' : 'ÚLTIMO DISPARO: ' + (last.x ? '10 X' : last.score));

    stage.classList.toggle('is-done', done);
    statusEl.hidden = done;
    resultEl.hidden = !done;
    resetBtn.hidden = shots.length === 0;
    if (done) showReticle(false);

    if (!done) { mpiEl.innerHTML = ''; resultEl.innerHTML = ''; return; }

    var n = shots.length;
    var mx = shots.reduce(function (a, p) { return a + p.nx; }, 0) / n;
    var my = shots.reduce(function (a, p) { return a + p.ny; }, 0) / n;
    var spread = shots.reduce(function (a, p) { return a + Math.hypot(p.nx - mx, p.ny - my); }, 0) / n;
    var off = Math.hypot(mx, my);
    var size = Math.max(spread * 2 * 47, 4).toFixed(2) + '%';
    mpiEl.innerHTML = '<div class="mpi-ring" style="left:' + pct(mx) + ';top:' + pct(my) + ';width:' + size + ';height:' + size + '"></div>' +
                      '<div class="mpi-x" style="left:' + pct(mx) + ';top:' + pct(my) + '"></div>';

    var spreadLabel = spread < 0.12 ? 'Fechada' : (spread < 0.25 ? 'Média' : 'Aberta');
    var dirLabel, title, text;
    if (off < 0.15) {
      dirLabel = 'Centro';
      if (spread < 0.15) { title = 'Central e fechado'; text = 'Fundamentos consistentes. O próximo passo é manter esse agrupamento com tempo e sob pressão.'; }
      else { title = 'Centrado, mas aberto'; text = 'O ponto médio está bom, mas os tiros se espalham: visada, respiração e ritmo de gatilho variam de um disparo para outro.'; }
    } else {
      var sector = function (dx) { return ((Math.round(Math.atan2(dx, -my) * 180 / Math.PI / 45) % 8) + 8) % 8; };
      dirLabel = DIRS[sector(mx)];
      var dk = sector(state.hand === 1 ? -mx : mx);
      title = DIAG[dk][0]; text = DIAG[dk][1];
    }
    var grade = total >= 45 ? 'NÍVEL ELITE' : total >= 38 ? 'BOM CONTROLE' : total >= 28 ? 'BASE EM CONSTRUÇÃO' : 'BORA PRO ESTANDE';

    resultEl.innerHTML =
      '<span class="mono gold">' + grade + ' · ' + total + ' PONTOS</span>' +
      '<h3>' + title + '</h3>' +
      '<p>' + text + '</p>' +
      '<div class="result__grid">' +
        '<div><span class="mono">PONTO MÉDIO</span><strong>' + dirLabel + '</strong></div>' +
        '<div><span class="mono">DISPERSÃO</span><strong>' + spreadLabel + '</strong></div>' +
      '</div>' +
      '<small>Leitura indicativa, baseada na tabela clássica de correção para pistola. O diagnóstico de verdade é feito no estande, vendo você atirar.</small>' +
      '<a class="btn btn--gold btn--md" href="https://ig.me/m/fernando.parise" target="_blank" rel="noopener">Quero corrigir isso numa aula</a>';
  }

  setLevel(1);
  render(false);
})();
