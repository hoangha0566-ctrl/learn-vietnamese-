(function () {
  'use strict';
  const D = window.APP_DATA;

  /* ---------- Tiện ích ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const verbColor = (v) => (D.verbs.find((x) => x.verb === v) || {}).color || '#888';

  const store = {
    get(k, d) { try { const v = localStorage.getItem('lvc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lvc_' + k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };

  /* ---------- Phát âm (Web Speech API, giọng vi-VN nếu máy có) ---------- */
  const Speech = {
    voice: null,
    init() {
      if (!('speechSynthesis' in window)) return;
      const pick = () => { this.voice = speechSynthesis.getVoices().find((v) => /^vi/i.test(v.lang)) || null; };
      pick();
      speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pick);
    },
    say(text) {
      if (!Sfx.on || !('speechSynthesis' in window)) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'vi-VN'; u.rate = 0.9;
        if (this.voice) u.voice = this.voice;
        speechSynthesis.speak(u);
      } catch (e) { /* bỏ qua */ }
    }
  };

  /* ---------- Hiệu ứng âm thanh (WebAudio, không cần file) ---------- */
  const Sfx = {
    on: store.get('sound', true),
    ctx: null,
    tone(freqs, dur = 0.12, type = 'sine', vol = 0.18) {
      if (!this.on) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const c = this.ctx; let t = c.currentTime;
        freqs.forEach((f) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = type; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          o.connect(g).connect(c.destination);
          o.start(t); o.stop(t + dur + 0.03);
          t += dur * 0.75;
        });
      } catch (e) { /* bỏ qua */ }
    },
    good() { this.tone([523, 659, 784], 0.11, 'triangle'); },
    bad() { this.tone([233, 185], 0.16, 'square', 0.08); },
    click() { this.tone([660], 0.05, 'sine', 0.06); },
    win() { this.tone([523, 659, 784, 1047, 1319], 0.14, 'triangle'); }
  };

  const soundBtn = $('#soundBtn');
  const paintSound = () => { soundBtn.textContent = Sfx.on ? '🔊' : '🔇'; soundBtn.setAttribute('aria-pressed', String(Sfx.on)); };
  soundBtn.addEventListener('click', () => {
    Sfx.on = !Sfx.on; store.set('sound', Sfx.on); paintSound();
    if (!Sfx.on && 'speechSynthesis' in window) speechSynthesis.cancel();
  });
  paintSound();
  Speech.init();

  // Nút đọc dùng chung: <button data-say="...">
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) { e.stopPropagation(); Speech.say(b.dataset.say); }
  });

  /* ---------- Điều hướng ---------- */
  const SECS = ['flash', 'verbs', 'ex', 'game'];
  function paintVisited() {
    const v = store.get('visited', []);
    $$('#tabs button').forEach((b) => b.classList.toggle('visited', v.includes(b.dataset.sec)));
  }
  function show(sec, scroll = true) {
    if (!SECS.includes(sec)) sec = store.get('lastSec', 'flash');
    if (!SECS.includes(sec)) sec = 'flash';
    SECS.forEach((s) => { $('#sec-' + s).hidden = s !== sec; });
    $$('#tabs button').forEach((b) => {
      const on = b.dataset.sec === sec;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const v = store.get('visited', []);
    if (!v.includes(sec)) { v.push(sec); store.set('visited', v); }
    store.set('lastSec', sec);
    paintVisited();
    if (location.hash !== '#' + sec) history.replaceState(null, '', '#' + sec);
    if (scroll) window.scrollTo({ top: 0 });
    document.dispatchEvent(new CustomEvent('section:show', { detail: sec }));
  }
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-sec]'); if (b) show(b.dataset.sec); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) show(b.dataset.go); });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  /* ---------- PHẦN 1: FLASHCARD ---------- */
  const FC = {
    cards: D.flashcards,
    known: new Set(store.get('fcKnown', [])),
    weak: new Set(store.get('fcWeak', [])),
    order: [], pos: 0,
    el: {},
    init() {
      ['flashcard', 'fcEmoji', 'fcWord', 'fcEn', 'fcColl', 'fcEx', 'fcExEn', 'fcBadge', 'fcCount', 'fcProgText', 'fcProgBar']
        .forEach((id) => { this.el[id] = $('#' + id); });
      this.buildOrder(false);
      this.el.flashcard.addEventListener('click', () => this.flip());
      this.el.flashcard.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.flip(); } });
      $('#fcFlip').addEventListener('click', () => this.flip());
      $('#fcPrev').addEventListener('click', () => this.go(-1));
      $('#fcNext').addEventListener('click', () => this.go(1));
      $('#fcYes').addEventListener('click', () => this.mark(true));
      $('#fcNo').addEventListener('click', () => this.mark(false));
      $('#fcShuffle').addEventListener('click', () => { this.buildOrder(true); this.render(); Sfx.click(); });
      $('#fcSpeak').addEventListener('click', () => {
        const c = this.cur();
        Speech.say(this.el.flashcard.classList.contains('flipped') ? c.example : c.word);
      });
      $('#fcReset').addEventListener('click', () => {
        this.known.clear(); this.weak.clear(); this.save(); this.buildOrder(false); this.render();
      });
      document.addEventListener('keydown', (e) => {
        if ($('#sec-flash').hidden || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
        if (e.key === 'ArrowRight') this.go(1);
        if (e.key === 'ArrowLeft') this.go(-1);
      });
      this.render();
    },
    // Thẻ "chưa thuộc" xuất hiện 2 lần khi xáo trộn
    buildOrder(doShuffle) {
      const idx = this.cards.map((_, i) => i);
      let order = doShuffle ? shuffle(idx) : idx;
      if (doShuffle) {
        const weak = shuffle(idx.filter((i) => this.weak.has(this.cards[i].word)));
        weak.forEach((i) => { const at = Math.min(order.length, order.indexOf(i) + 3 + ((Math.random() * 4) | 0)); order.splice(at, 0, i); });
      }
      this.order = order; this.pos = 0;
    },
    cur() { return this.cards[this.order[this.pos]]; },
    save() { store.set('fcKnown', [...this.known]); store.set('fcWeak', [...this.weak]); },
    flip() { this.el.flashcard.classList.toggle('flipped'); Sfx.click(); },
    go(d) {
      this.pos = (this.pos + d + this.order.length) % this.order.length;
      this.render();
    },
    mark(ok) {
      if (this.busy) return;
      this.busy = true;
      const c = this.cur(), id = this.order[this.pos];
      if (ok) { this.known.add(c.word); this.weak.delete(c.word); Sfx.good(); }
      else {
        this.known.delete(c.word); this.weak.add(c.word); Sfx.bad();
        // chèn lại thẻ này sau 3 thẻ nữa
        if (!this.order.slice(this.pos + 1, this.pos + 4).includes(id)) this.order.splice(Math.min(this.pos + 3, this.order.length), 0, id);
      }
      this.save();
      const card = this.el.flashcard;
      card.classList.add(ok ? 'swipe-right' : 'swipe-left');
      setTimeout(() => { card.classList.remove('swipe-right', 'swipe-left'); this.busy = false; this.go(1); }, 260);
    },
    render() {
      const c = this.cur(), el = this.el;
      el.flashcard.classList.remove('flipped');
      el.fcEmoji.textContent = c.emoji;
      el.fcWord.textContent = c.word;
      el.fcEn.textContent = c.en;
      el.fcColl.innerHTML = `<span class="vtag" style="--vc:${verbColor(c.verb)}">${esc(c.verb)}</span> ${esc(c.word)}`;
      el.fcEx.innerHTML = `${esc(c.example)} <button class="speak sm" type="button" data-say="${esc(c.example)}" aria-label="Nghe câu ví dụ">🔊</button>`;
      el.fcExEn.textContent = c.exampleEn;
      const k = this.known.has(c.word), w = this.weak.has(c.word);
      el.fcBadge.textContent = k ? '✓ Đã thuộc' : w ? '↻ Ôn lại' : '';
      el.fcBadge.className = 'fc-badge ' + (k ? 'is-good' : w ? 'is-bad' : '');
      el.fcCount.textContent = `Thẻ ${this.pos + 1} / ${this.order.length}`;
      const n = this.known.size, total = this.cards.length;
      el.fcProgText.innerHTML = n >= total
        ? `🎉 <b>Đã thuộc ${n}/${total}</b> — tuyệt vời! Sang phần Học động từ nhé.`
        : `Đã thuộc <b>${n}/${total}</b>`;
      el.fcProgBar.style.width = (n / total) * 100 + '%';
    }
  };

  /* ---------- PHẦN 2: HỌC ĐỘNG TỪ ---------- */
  function highlightVerb(sentence, verb) {
    const re = new RegExp(`(^|[\\s,])(${verb})(?=[\\s.,!?]|$)`, 'giu');
    return esc(sentence).replace(re, '$1<b class="hl">$2</b>');
  }
  function renderVerbs() {
    $('#verbNote').innerHTML = '⚠️ ' + D.verbNote;
    $('#verbGrid').innerHTML = D.verbs.map((v) => `
      <article class="verb-card" style="--vc:${v.color}">
        <div class="verb-top">
          <h3 class="verb-word">${esc(v.verb)}</h3>
          <button class="speak" type="button" data-say="${esc(v.verb)}" aria-label="Nghe ${esc(v.verb)}">🔊</button>
        </div>
        <p class="verb-en">${esc(v.en)}</p>
        <p class="verb-tip">${esc(v.tip)}</p>
        <div class="verb-items">${v.items.map((i) => `<span class="chip">${i.emoji} ${esc(i.name)}</span>`).join('')}</div>
        <div class="verb-ex">
          <button class="speak sm" type="button" data-say="${esc(v.example)}" aria-label="Nghe câu ví dụ">🔊</button>
          <div><p>${highlightVerb(v.example, v.verb)}</p><small>${esc(v.exampleEn)}</small></div>
        </div>
      </article>`).join('');
  }

  /* ---------- PHẦN 3: BÀI TẬP ---------- */
  const VERB_LIST = D.verbs.map((v) => v.verb);
  const selectHTML = (i) => `<select class="vsel" data-i="${i}" aria-label="Chọn động từ"><option value="">— chọn —</option>${VERB_LIST.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;

  function exShell(id, ex, bodyHTML, withCheck = true) {
    return `
      <div class="ex-head"><h3>${esc(ex.title)}</h3><p>${esc(ex.instruction)}</p></div>
      <div class="ex-body">${bodyHTML}</div>
      <div class="ex-foot">
        ${withCheck ? '<button class="btn primary" type="button" data-act="check">✓ Kiểm tra</button>' : ''}
        <button class="btn" type="button" data-act="reset">↺ Làm lại</button>
        <div class="ex-score" aria-live="polite"></div>
      </div>`;
  }

  function selectExercise(root, ex, kind) {
    const render = () => {
      let body = '';
      if (kind === 'fill') {
        body = `<ol class="ex-list">${ex.items.map((q, i) => {
          const [a, b] = q.text.split('___');
          return `<li class="ex-row" data-i="${i}"><span class="sent">${esc(a)}${selectHTML(i)}${esc(b)}</span><span class="fix"></span></li>`;
        }).join('')}</ol>`;
      } else if (kind === 'match') {
        body = `<div class="match">${ex.items.map((q, i) => `
          <div class="ex-row match-row" data-i="${i}">
            <span class="m-item"><span class="m-emoji">${q.emoji || ''}</span>${esc(q.item)}</span>
            <span class="m-line" aria-hidden="true"></span>${selectHTML(i)}<span class="fix"></span>
          </div>`).join('')}</div>`;
      } else {
        body = `<div class="pic-grid">${ex.items.map((q, i) => `
          <div class="ex-row pic-card" data-i="${i}">
            <div class="pic-emoji" aria-label="Hình ${i + 1}">${q.emoji}</div>
            <div class="pic-name" data-name="${esc(q.item)}">?</div>
            ${selectHTML(i)}<span class="fix"></span>
          </div>`).join('')}</div>`;
      }
      root.innerHTML = exShell(root.id, ex, body);
    };
    root.addEventListener('change', (e) => {
      const s = e.target.closest('.vsel');
      if (s) { s.style.setProperty('--vc', s.value ? verbColor(s.value) : ''); s.classList.toggle('chosen', !!s.value); }
    });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'reset') { render(); return; }
      let ok = 0;
      $$('.ex-row', root).forEach((row) => {
        const i = +row.dataset.i, q = ex.items[i], s = $('.vsel', row), fix = $('.fix', row);
        const right = s.value === q.answer;
        row.classList.remove('ok', 'no');
        row.classList.add(right ? 'ok' : 'no');
        s.disabled = true;
        fix.innerHTML = right ? '✓' : `✗ → <b>${esc(q.answer)}</b>`;
        const nm = $('.pic-name', row); if (nm) nm.textContent = nm.dataset.name;
        if (right) ok++;
      });
      b.disabled = true;
      showScore(root, ok, ex.items.length);
    });
    render();
  }

  function showScore(root, ok, total) {
    const sc = $('.ex-score', root);
    const pct = ok / total;
    sc.className = 'ex-score show ' + (pct === 1 ? 'is-good' : pct >= 0.6 ? 'is-mid' : 'is-bad');
    sc.innerHTML = `Điểm: <b>${ok}/${total}</b> ${pct === 1 ? '🎉 Xuất sắc!' : pct >= 0.6 ? '👍 Khá tốt!' : '💪 Cố lên!'}`;
    pct === 1 ? Sfx.win() : Sfx.good();
  }

  function mcqExercise(root, ex) {
    let answered = 0, ok = 0;
    const render = () => {
      answered = 0; ok = 0;
      const body = `<ol class="mcq">${ex.items.map((q, i) => `
        <li class="mcq-q" data-i="${i}">
          <p class="sent">${esc(q.text).replace('___', '<span class="blank">___</span>')}</p>
          <div class="mcq-opts">${q.options.map((o) => `<button class="opt" type="button" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
          <p class="mcq-fb" aria-live="polite"></p>
        </li>`).join('')}</ol>`;
      root.innerHTML = exShell(root.id, ex, body, false);
    };
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="reset"]')) { render(); return; }
      const b = e.target.closest('.opt');
      if (!b) return;
      const li = b.closest('.mcq-q');
      if (li.classList.contains('done')) return;
      const q = ex.items[+li.dataset.i], right = b.dataset.v === q.answer;
      li.classList.add('done', right ? 'ok' : 'no');
      $$('.opt', li).forEach((o) => {
        o.disabled = true;
        if (o.dataset.v === q.answer) o.classList.add('right');
      });
      if (!right) b.classList.add('wrong');
      $('.blank', li).textContent = q.answer;
      $('.blank', li).classList.add(right ? 'is-good' : 'is-bad');
      $('.mcq-fb', li).innerHTML = right ? '✓ Đúng rồi!' : `✗ Sai rồi. Đáp án đúng: <b>${esc(q.answer)}</b>`;
      right ? Sfx.good() : Sfx.bad();
      answered++; if (right) ok++;
      if (answered === ex.items.length) setTimeout(() => showScore(root, ok, ex.items.length), 250);
    });
    render();
  }

  function renderExercises() {
    const E = D.exercises;
    const defs = [['ex1', E.fill, 'fill'], ['ex2', E.match, 'match'], ['ex3', E.picture, 'pic'], ['ex4', E.mcq, 'mcq']];
    $('#exList').innerHTML = defs.map(([id]) => `<div class="ex-card" id="${id}"></div>`).join('');
    $('#exJump').innerHTML = defs.map(([id, ex]) => `<button class="chip-btn" type="button" data-jump="${id}">${esc(ex.title.split('·')[0].trim())}</button>`).join('');
    $('#exJump').addEventListener('click', (e) => {
      const b = e.target.closest('[data-jump]');
      if (b) $('#' + b.dataset.jump).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    defs.forEach(([id, ex, kind]) => {
      const root = $('#' + id);
      kind === 'mcq' ? mcqExercise(root, ex) : selectExercise(root, ex, kind);
    });
  }

  /* ---------- Khởi động ---------- */
  window.App = { D, $, $$, esc, shuffle, store, Speech, Sfx, verbColor };
  FC.init();
  renderVerbs();
  renderExercises();
  // game.js chạy sau và gọi App.show lần đầu
  window.App.show = show;
  document.addEventListener('DOMContentLoaded', () => show(location.hash.slice(1), false));
})();
