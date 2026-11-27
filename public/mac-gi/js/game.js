/*
 * GAME: Mặc đồ cho Nam
 * - Máy tính: kéo món đồ thả vào nhân vật (hoặc bấm chọn rồi bấm nhân vật).
 * - Điện thoại: chạm món đồ, rồi chạm nhân vật.
 * - Màn B: có thể chạm thẳng vào món đồ trên người nhân vật để cởi.
 * Sau đó chọn 1 trong 7 động từ.
 */
(function () {
  'use strict';
  const { D, $, $$, esc, store, Speech, Sfx, verbColor } = window.App;
  const G = D.game;
  const root = $('#gameRoot');

  /* ---------- Nhân vật (SVG nhiều lớp, mỗi món đồ là một <g class="wear">) ---------- */
  function charSVG() {
    return `
<svg class="char" id="charSvg" viewBox="0 0 300 470" role="img" aria-label="Nhân vật Nam">
  <defs>
    <pattern id="pScarf" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="14" height="14" fill="#e63946"/><rect width="14" height="5" fill="#fff4e6"/>
    </pattern>
    <pattern id="pSock" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#ff6b81"/><rect y="6" width="10" height="3" fill="#fff"/>
    </pattern>
    <radialGradient id="gCheekCold"><stop offset="0" stop-color="#7fb2ff" stop-opacity=".8"/><stop offset="1" stop-color="#7fb2ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="gCheekWarm"><stop offset="0" stop-color="#ff7a8a" stop-opacity=".75"/><stop offset="1" stop-color="#ff7a8a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gCheekHot"><stop offset="0" stop-color="#ff3b3b" stop-opacity=".8"/><stop offset="1" stop-color="#ff3b3b" stop-opacity="0"/></radialGradient>
  </defs>

  <ellipse class="shadow" cx="150" cy="452" rx="84" ry="10"/>

  <g class="body-shake">
    <!-- Cơ thể -->
    <rect class="skin" x="114" y="256" width="32" height="150" rx="14"/>
    <rect class="skin" x="154" y="256" width="32" height="150" rx="14"/>
    <ellipse class="skin" cx="126" cy="408" rx="20" ry="10"/>
    <ellipse class="skin" cx="174" cy="408" rx="20" ry="10"/>
    <rect class="skin" x="80" y="146" width="28" height="120" rx="14"/>
    <rect class="skin" x="192" y="146" width="28" height="120" rx="14"/>
    <circle class="skin" cx="93" cy="273" r="13"/>
    <circle class="skin" cx="207" cy="273" r="13"/>
    <rect class="skin" x="140" y="122" width="20" height="24"/>
    <path class="singlet" d="M106 152 Q106 136 124 136 H176 Q194 136 194 152 V262 H106 Z"/>
    <path class="skin" d="M134 136 Q150 156 166 136 Z"/>
    <path class="briefs" d="M108 248 H192 V276 Q192 286 182 286 H160 L150 276 L140 286 H118 Q108 286 108 276 Z"/>

    <!-- ĐỒ MẶC (thứ tự vẽ = thứ tự lớp) -->
    <g class="wear" data-item="tat">
      <rect x="113" y="360" width="34" height="48" rx="10" fill="url(#pSock)"/>
      <rect x="153" y="360" width="34" height="48" rx="10" fill="url(#pSock)"/>
      <ellipse cx="126" cy="409" rx="21" ry="11" fill="#ff6b81"/>
      <ellipse cx="174" cy="409" rx="21" ry="11" fill="#ff6b81"/>
      <rect x="113" y="360" width="34" height="7" rx="3" fill="#fff"/>
      <rect x="153" y="360" width="34" height="7" rx="3" fill="#fff"/>
    </g>
    <g class="wear" data-item="quanDai">
      <path d="M106 244 H194 L193 400 H154 L150 294 L146 400 H107 Z" fill="#3d4f6b"/>
      <rect x="106" y="244" width="88" height="11" rx="3" fill="#2a3850"/>
      <path d="M150 256 V292 M128 300 V396 M172 300 V396" stroke="#2a3850" stroke-width="2" opacity=".6"/>
      <rect x="107" y="390" width="39" height="10" fill="#2a3850"/><rect x="154" y="390" width="39" height="10" fill="#2a3850"/>
    </g>
    <g class="wear" data-item="quanDui">
      <path d="M106 244 H194 L198 320 H155 L150 290 L145 320 H102 Z" fill="#14b8a6"/>
      <rect x="106" y="244" width="88" height="10" rx="3" fill="#0f8f82"/>
      <path d="M110 308 H144 M156 308 H192" stroke="#fff" stroke-width="4" opacity=".55"/>
      <path d="M150 254 V286" stroke="#0f8f82" stroke-width="2"/>
    </g>
    <g class="wear" data-item="giay">
      <path d="M100 416 V404 Q100 391 115 391 H134 Q148 392 148 406 V416 Z" fill="#e03131"/>
      <path d="M200 416 V404 Q200 391 185 391 H166 Q152 392 152 406 V416 Z" fill="#e03131"/>
      <rect x="98" y="412" width="52" height="8" rx="4" fill="#f8f9fa"/>
      <rect x="150" y="412" width="52" height="8" rx="4" fill="#f8f9fa"/>
      <path d="M112 398 l14 6 M118 395 l14 6 M188 398 l-14 6 M182 395 l-14 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <g class="wear" data-item="aoCoc">
      <path d="M74 178 L84 148 Q90 136 110 134 H190 Q210 136 216 148 L226 178 L196 188 V264 H104 V188 Z" fill="#ffb627"/>
      <path class="skin" d="M134 134 Q150 152 166 134 Z"/>
      <path d="M132 134 Q150 154 168 134" fill="none" stroke="#e08e00" stroke-width="5"/>
      <path d="M150 196 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2 Z" fill="#fff" opacity=".75"/>
    </g>
    <g class="wear" data-item="aoKhoac">
      <rect x="73" y="140" width="38" height="130" rx="17" fill="#2563eb"/>
      <rect x="189" y="140" width="38" height="130" rx="17" fill="#2563eb"/>
      <path d="M99 154 Q99 131 124 129 H176 Q201 131 201 154 V292 H99 Z" fill="#3b82f6"/>
      <path d="M150 140 V292" stroke="#1e3a8a" stroke-width="3"/>
      <rect x="111" y="240" width="26" height="20" rx="5" fill="#2563eb"/>
      <rect x="163" y="240" width="26" height="20" rx="5" fill="#2563eb"/>
      <rect x="72" y="254" width="40" height="15" rx="7" fill="#f1f3f5"/>
      <rect x="188" y="254" width="40" height="15" rx="7" fill="#f1f3f5"/>
      <rect x="99" y="282" width="102" height="12" rx="5" fill="#f1f3f5"/>
      <path d="M114 130 Q150 168 186 130 Q192 146 178 152 Q150 168 122 152 Q108 146 114 130 Z" fill="#f1f3f5"/>
    </g>
    <g class="wear" data-item="gangTay">
      <circle cx="93" cy="274" r="15" fill="#8b5cf6"/><ellipse cx="80" cy="266" rx="6" ry="9" fill="#8b5cf6"/>
      <circle cx="207" cy="274" r="15" fill="#8b5cf6"/><ellipse cx="220" cy="266" rx="6" ry="9" fill="#8b5cf6"/>
      <rect x="79" y="255" width="28" height="9" rx="4" fill="#a78bfa"/><rect x="193" y="255" width="28" height="9" rx="4" fill="#a78bfa"/>
    </g>
    <g class="wear" data-item="dongHo">
      <rect x="78" y="242" width="32" height="10" rx="4" fill="#343a40"/>
      <circle cx="94" cy="247" r="9" fill="#ffd43b" stroke="#343a40" stroke-width="2.5"/>
      <path d="M94 247 V241 M94 247 h4" stroke="#343a40" stroke-width="1.6" stroke-linecap="round"/>
    </g>

    <!-- Quạt (khi nóng) -->
    <g class="fan">
      <path d="M207 262 L178 206 Q206 188 238 204 Z" fill="#ff8fab" stroke="#c9184a" stroke-width="2"/>
      <path d="M207 262 L190 200 M207 262 L207 196 M207 262 L224 199" stroke="#c9184a" stroke-width="1.5"/>
      <circle cx="207" cy="262" r="4" fill="#c9184a"/>
    </g>

    <!-- Đầu -->
    <circle class="skin" cx="104" cy="94" r="9"/><circle class="skin" cx="196" cy="94" r="9"/>
    <circle class="skin" cx="150" cy="88" r="46"/>
    <path class="hair" d="M103 94 Q98 40 150 38 Q202 40 197 94 Q193 70 178 62 Q152 76 120 63 Q107 72 103 94 Z"/>

    <!-- Nét mặt -->
    <g class="face face-cold">
      <path d="M124 78 L140 83 M176 78 L160 83" class="line"/>
      <circle cx="134" cy="92" r="5" class="ink"/><circle cx="166" cy="92" r="5" class="ink"/>
      <ellipse cx="121" cy="107" rx="11" ry="7" fill="url(#gCheekCold)"/><ellipse cx="179" cy="107" rx="11" ry="7" fill="url(#gCheekCold)"/>
      <circle cx="150" cy="103" r="5" fill="#ff8787"/>
      <path d="M134 117 l4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4" class="line"/>
      <g class="breath"><circle cx="176" cy="122" r="5"/><circle cx="188" cy="116" r="7"/><circle cx="202" cy="108" r="9"/></g>
    </g>
    <g class="face face-ok">
      <circle cx="134" cy="92" r="5" class="ink"/><circle cx="166" cy="92" r="5" class="ink"/>
      <ellipse cx="121" cy="107" rx="10" ry="6" fill="url(#gCheekWarm)" opacity=".6"/><ellipse cx="179" cy="107" rx="10" ry="6" fill="url(#gCheekWarm)" opacity=".6"/>
      <path d="M150 97 q-4 6 1 8" class="line thin"/>
      <path d="M138 114 Q150 121 162 114" class="line"/>
    </g>
    <g class="face face-happy">
      <path d="M127 93 Q134 84 141 93 M159 93 Q166 84 173 93" class="line"/>
      <ellipse cx="121" cy="106" rx="12" ry="8" fill="url(#gCheekWarm)"/><ellipse cx="179" cy="106" rx="12" ry="8" fill="url(#gCheekWarm)"/>
      <path d="M150 97 q-4 6 1 8" class="line thin"/>
      <path d="M134 110 Q150 132 166 110 Z" fill="#9b2c2c"/><path d="M140 121 Q150 127 160 121" fill="#ff8787"/>
    </g>
    <g class="face face-hot">
      <path d="M126 82 Q134 78 142 84 M174 82 Q166 78 158 84" class="line"/>
      <path d="M128 93 H140 M160 93 H172" class="line"/>
      <ellipse cx="121" cy="107" rx="13" ry="8" fill="url(#gCheekHot)"/><ellipse cx="179" cy="107" rx="13" ry="8" fill="url(#gCheekHot)"/>
      <path d="M150 97 q-4 6 1 8" class="line thin"/>
      <ellipse cx="150" cy="117" rx="8" ry="7" fill="#9b2c2c"/><path d="M145 120 Q150 128 155 120" fill="#ff8787"/>
      <g class="sweat">
        <path d="M112 66 q-5 8 0 11 q5 -3 0 -11 Z"/><path d="M190 72 q-5 8 0 11 q5 -3 0 -11 Z"/><path d="M182 116 q-4 6 0 9 q4 -3 0 -9 Z"/>
      </g>
    </g>

    <g class="wear" data-item="khan">
      <rect x="110" y="122" width="80" height="26" rx="13" fill="url(#pScarf)"/>
      <path d="M158 138 H180 L186 212 H162 Z" fill="url(#pScarf)"/>
      <path d="M163 212 v9 M169 212 v9 M175 212 v9 M181 212 v9" stroke="#e63946" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g class="wear" data-item="kinh">
      <circle cx="134" cy="92" r="12" fill="#bfe3ff" fill-opacity=".35" stroke="#212529" stroke-width="3.5"/>
      <circle cx="166" cy="92" r="12" fill="#bfe3ff" fill-opacity=".35" stroke="#212529" stroke-width="3.5"/>
      <path d="M146 91 Q150 87 154 91 M122 89 L104 85 M178 89 L196 85" stroke="#212529" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </g>
    <g class="wear" data-item="mu">
      <path d="M100 74 Q100 24 150 22 Q200 24 200 74 Z" fill="#20c997"/>
      <path d="M120 30 V66 M135 24 V66 M150 22 V66 M165 24 V66 M180 30 V66" stroke="#12b886" stroke-width="3"/>
      <rect x="96" y="60" width="108" height="20" rx="9" fill="#0ca678"/>
      <path d="M106 64 v12 M116 64 v12 M126 64 v12 M136 64 v12 M146 64 v12 M156 64 v12 M166 64 v12 M176 64 v12 M186 64 v12 M196 64 v12" stroke="#099268" stroke-width="2.5"/>
      <circle cx="150" cy="20" r="12" fill="#f8f9fa"/>
    </g>
  </g>
</svg>`;
  }

  /* ---------- Khung giao diện game ---------- */
  root.innerHTML = `
    <div class="scene-tabs" role="tablist" aria-label="Chọn màn">
      <button class="scene-tab" type="button" role="tab" data-scene="A">❄️ Màn A · Mùa đông</button>
      <button class="scene-tab" type="button" role="tab" data-scene="B">☀️ Màn B · Mùa hè</button>
    </div>
    <div class="game" id="game">
      <div class="stage" id="stage">
        <div class="sky sky-1"></div><div class="sky sky-2"></div>
        <div class="sun"><div class="rays"></div></div>
        <div class="snow" id="snow" aria-hidden="true"></div>
        <div class="wind" id="wind" aria-hidden="true"></div>
        <div class="ground"><div class="ground-snow"></div></div>
        <div class="hud">
          <div class="meter">
            <div class="meter-top"><span id="meterName"></span><b id="meterVal">0%</b></div>
            <div class="meter-bar"><div class="meter-fill" id="meterFill"></div></div>
          </div>
          <div class="err-chip" id="errChip">❌ Lỗi: 0</div>
        </div>
        <div class="char-wrap" id="charWrap" tabindex="0" role="button" aria-label="Nhân vật Nam — thả hoặc chạm để dùng món đồ đã chọn">
          ${charSVG()}
          <div class="drop-ring" aria-hidden="true"></div>
        </div>
        <div class="sel-banner" id="selBanner" aria-live="polite"></div>
        <div class="gtoast" id="gToast" aria-live="polite"></div>
        <div class="fx" id="fx" aria-hidden="true"></div>
      </div>
      <div class="panel">
        <div class="mission" id="mission"></div>
        <div id="tray"></div>
        <div class="game-actions">
          <button class="btn" type="button" id="gReset">↺ Chơi lại</button>
          <span class="best" id="gBest"></span>
        </div>
      </div>
    </div>

    <div class="overlay" id="verbSheet" hidden>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
        <button class="sheet-x" type="button" id="sheetX" aria-label="Đóng">✕</button>
        <div class="sheet-item" id="sheetItem"></div>
        <h3 id="sheetTitle"></h3>
        <div class="verb-btns" id="verbBtns"></div>
        <div class="sheet-fb" id="sheetFb" aria-live="polite"></div>
      </div>
    </div>

    <div class="overlay" id="resultModal" hidden>
      <div class="sheet result" role="dialog" aria-modal="true" aria-labelledby="resTitle"><div id="resultBody"></div></div>
    </div>`;

  const el = {
    game: $('#game'), stage: $('#stage'), svg: $('#charSvg'), charWrap: $('#charWrap'), tray: $('#tray'),
    mission: $('#mission'), meterName: $('#meterName'), meterVal: $('#meterVal'), meterFill: $('#meterFill'),
    errChip: $('#errChip'), selBanner: $('#selBanner'), toast: $('#gToast'), fx: $('#fx'), best: $('#gBest'),
    sheet: $('#verbSheet'), sheetItem: $('#sheetItem'), sheetTitle: $('#sheetTitle'), verbBtns: $('#verbBtns'), sheetFb: $('#sheetFb'),
    result: $('#resultModal'), resultBody: $('#resultBody')
  };

  // Tuyết + gió (trang trí)
  $('#snow').innerHTML = Array.from({ length: 46 }, () => {
    const s = 6 + Math.random() * 14;
    return `<i style="left:${Math.random() * 100}%;font-size:${s}px;animation-duration:${5 + Math.random() * 7}s;animation-delay:${-Math.random() * 10}s;--dx:${(Math.random() * 60 - 30).toFixed(0)}px">${Math.random() < 0.5 ? '❄' : '•'}</i>`;
  }).join('');
  $('#wind').innerHTML = Array.from({ length: 7 }, (_, i) =>
    `<i style="top:${12 + i * 11}%;animation-delay:${-i * 0.7}s;animation-duration:${2.6 + (i % 3) * 0.8}s;width:${60 + (i % 4) * 30}px"></i>`).join('') +
    Array.from({ length: 5 }, (_, i) => `<b style="top:${20 + i * 14}%;animation-delay:${-i * 1.1}s">🍃</b>`).join('');

  /* ---------- Trạng thái ---------- */
  let S = null;
  const sc = () => G.scenes[S.id];
  const item = (id) => G.items[id];
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function start(id) {
    S = { id, worn: new Set(sc0(id).startWorn || []), errors: 0, sel: null, done: false, sheet: null };
    store.set('gameScene', id);
    el.game.dataset.scene = id;
    el.stage.dataset.scene = id;
    $$('.scene-tab', root).forEach((b) => { const on = b.dataset.scene === id; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
    // đặt đồ ban đầu, không hiệu ứng
    el.svg.classList.add('no-anim');
    $$('.wear', el.svg).forEach((g) => g.classList.toggle('on', S.worn.has(g.dataset.item)));
    void el.svg.getBoundingClientRect();
    requestAnimationFrame(() => el.svg.classList.remove('no-anim'));
    el.fx.innerHTML = '';
    el.toast.classList.remove('show');
    closeSheet(); el.result.hidden = true;
    el.meterName.textContent = sc().meter;
    renderMission(); renderTray(); setSel(null); update();
    const best = store.get('gameBest', {})[id];
    el.best.textContent = best != null ? `🏆 Kỷ lục: ${best} lỗi` : '';
  }
  const sc0 = (id) => G.scenes[id];

  function progress() {
    const s = sc();
    if (S.id === 'A') {
      return Math.min(100, s.items.reduce((sum, it) => sum + (S.worn.has(it.id) ? it.points : 0), 0));
    }
    const removed = s.removeItems.filter((id) => !S.worn.has(id)).length;
    const put = s.wearItems.filter((id) => S.worn.has(id)).length;
    const total = s.removeItems.length + s.wearItems.length;
    return ((removed + put) / total) * 100;
  }
  const remainingWarm = () => (S.id === 'B' ? sc().removeItems.filter((id) => S.worn.has(id)).length : 0);
  const pointsOf = (id) => (sc().items || []).find((x) => x.id === id)?.points || 0;

  function update() {
    const p = progress();
    el.meterFill.style.width = p + '%';
    el.meterVal.textContent = Math.round(p) + '%';
    el.stage.style.setProperty('--p', (p / 100).toFixed(3));
    el.errChip.textContent = `❌ Lỗi: ${S.errors}`;
    let mood;
    if (S.id === 'A') mood = p >= 100 ? 'happy' : p >= 45 ? 'ok' : 'cold';
    else mood = p >= 100 ? 'happy' : p >= 67 ? 'ok' : 'hot';
    el.svg.dataset.mood = mood;
    el.charWrap.classList.toggle('shiver', S.id === 'A' && p < 80);
    el.charWrap.classList.toggle('shiver-hard', S.id === 'A' && p < 40);
    el.charWrap.classList.toggle('fanning', S.id === 'B' && p < 100);
    el.charWrap.classList.toggle('bounce', p >= 100);
    if (p >= 100 && !S.done) { S.done = true; setTimeout(win, 650); }
  }

  /* ---------- Bảng nhiệm vụ & tủ đồ ---------- */
  function renderMission() {
    const how = coarse
      ? '👆 <b>Chạm</b> một món đồ, rồi <b>chạm vào Nam</b>.'
      : '🖱️ <b>Kéo</b> món đồ thả vào Nam — hoặc bấm món đồ rồi bấm vào Nam.';
    const extra = S.id === 'B' ? '<br>👕 Mẹo: có thể chạm thẳng vào món đồ trên người Nam để cởi.' : '';
    el.mission.innerHTML = `<h3>${esc(sc().title)}</h3><p>${sc().intro}</p><p class="how">${how}${extra}</p>`;
  }

  function itemBtn(id, opts) {
    const it = item(id);
    const cls = ['item', opts.done && 'done', opts.locked && 'locked', S.sel === id && 'sel'].filter(Boolean).join(' ');
    return `<button type="button" class="${cls}" data-id="${id}" ${opts.done ? 'disabled' : ''} aria-pressed="${S.sel === id}"
      aria-label="${esc(it.name)}${opts.state ? ' — ' + esc(opts.state) : ''}">
      <span class="it-emoji" aria-hidden="true">${it.emoji}</span>
      <span class="it-name">${esc(it.name)}</span>
      <span class="it-en">${esc(it.en)}</span>
      ${opts.badge ? `<span class="it-badge ${opts.badgeCls || ''}">${opts.badge}</span>` : ''}
    </button>`;
  }

  function renderTray() {
    const s = sc();
    if (S.id === 'A') {
      el.tray.innerHTML = `<h4 class="tray-h">🧺 Tủ đồ mùa đông</h4><div class="items">${s.items.map((x) => {
        const done = S.worn.has(x.id);
        return itemBtn(x.id, { done, state: done ? 'đã mặc' : '', badge: done ? '✓' : `🔥${x.points}`, badgeCls: done ? 'b-good' : x.points ? '' : 'b-zero' });
      }).join('')}</div>`;
    } else {
      const left = remainingWarm();
      const step1 = s.removeItems.length - left;
      const step2 = s.wearItems.filter((id) => S.worn.has(id)).length;
      el.tray.innerHTML = `
        <h4 class="tray-h ${left ? 'now' : 'ok'}"><i>Bước 1 · <b>Cởi</b> đồ ấm</i><span>${step1}/${s.removeItems.length}</span></h4>
        <div class="items">${s.removeItems.map((id) => {
          const on = S.worn.has(id);
          return itemBtn(id, { done: !on, state: on ? 'đang mặc trên người' : 'đã cởi', badge: on ? 'đang mặc' : '✓ đã cởi', badgeCls: on ? 'b-warm' : 'b-good' });
        }).join('')}</div>
        <h4 class="tray-h ${left ? 'lock' : step2 < s.wearItems.length ? 'now' : 'ok'}"><i>Bước 2 · <b>Mặc</b> đồ mát</i><span>${step2}/${s.wearItems.length}</span></h4>
        <div class="items">${s.wearItems.map((id) => {
          const on = S.worn.has(id);
          return itemBtn(id, { done: on, locked: !on && left > 0, state: on ? 'đã mặc' : left ? 'khoá — cởi đồ ấm trước' : '', badge: on ? '✓' : left ? '🔒' : '🍃', badgeCls: on ? 'b-good' : '' });
        }).join('')}</div>
        <p class="hint">${s.hint}</p>`;
    }
  }

  /* ---------- Chọn món đồ ---------- */
  function blockReason(id) {
    if (S.done) return 'Xong màn rồi! Bấm “Chơi lại” để chơi tiếp.';
    if (S.id === 'A' && S.worn.has(id)) return `Nam đã mặc ${item(id).name} rồi.`;
    if (S.id === 'B' && sc().wearItems.includes(id) && !S.worn.has(id) && remainingWarm() > 0)
      return `🔒 Cởi hết đồ ấm trước đã nhé! (Còn ${remainingWarm()} món)`;
    if (S.id === 'B' && sc().wearItems.includes(id) && S.worn.has(id)) return `Nam đã mặc ${item(id).name} rồi.`;
    return null;
  }

  function setSel(id) {
    S.sel = id;
    $$('.item', el.tray).forEach((b) => { const on = b.dataset.id === id; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on)); });
    el.charWrap.classList.toggle('armed', !!id);
    if (id) {
      const it = item(id);
      el.selBanner.innerHTML = `<span>${it.emoji}</span> Đã chọn <b>${esc(it.name)}</b> — ${coarse ? 'chạm' : 'bấm'} vào Nam 👆`;
      el.selBanner.classList.add('show');
    } else el.selBanner.classList.remove('show');
  }

  function choose(id) {
    const why = blockReason(id);
    if (why) { toast(why, 'warn'); return; }
    Sfx.click();
    setSel(S.sel === id ? null : id);
  }

  el.tray.addEventListener('click', (e) => {
    if (suppressClick) return;
    const b = e.target.closest('.item');
    if (b && !b.disabled) choose(b.dataset.id);
  });

  function actOnCharacter(e) {
    if (S.done) return;
    if (S.sel) { openSheet(S.sel); return; }
    const g = e && e.target.closest && e.target.closest('.wear.on');
    if (g && S.id === 'B') { openSheet(g.dataset.item); return; }
    if (g && S.id === 'A') { toast(`Nam đang ${item(g.dataset.item).verb} ${item(g.dataset.item).name}. Ấm quá! 😊`); return; }
    toast(coarse ? 'Chạm một món đồ bên dưới trước nhé 👇' : 'Chọn hoặc kéo một món đồ trước nhé 👉');
  }
  el.charWrap.addEventListener('click', (e) => { if (!suppressClick) actOnCharacter(e); });
  el.charWrap.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); actOnCharacter(e); } });

  /* ---------- Kéo thả (chuột / bút) ---------- */
  let drag = null, ghost = null, suppressClick = false;
  const overChar = (x, y) => {
    const r = el.charWrap.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  el.tray.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    const b = e.target.closest('.item');
    if (!b || b.disabled) return;
    e.preventDefault(); // không bôi đen chữ
    drag = { id: b.dataset.id, x: e.clientX, y: e.clientY, on: false, btn: b };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
      const why = blockReason(drag.id);
      if (why) { drag = null; toast(why, 'warn'); return; }
      drag.on = true;
      setSel(null);
      const it = item(drag.id);
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.innerHTML = `<span>${it.emoji}</span><b>${esc(it.name)}</b>`;
      document.body.appendChild(ghost);
      document.body.classList.add('is-dragging');
      drag.btn.classList.add('dragging');
      el.charWrap.classList.add('armed');
    }
    ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    el.charWrap.classList.toggle('over', overChar(e.clientX, e.clientY));
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.on) return;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    const hit = e.type === 'pointerup' && overChar(e.clientX, e.clientY);
    ghost && ghost.remove(); ghost = null;
    document.body.classList.remove('is-dragging');
    d.btn.classList.remove('dragging');
    el.charWrap.classList.remove('over', 'armed');
    if (hit) openSheet(d.id);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* ---------- Bảng 7 động từ ---------- */
  // Động từ đúng khi mặc: "verb" + các động từ trong "alt" (vd. găng tay: đi / đeo)
  const wearVerbs = (id) => [item(id).verb, ...(item(id).alt || [])];
  function actionFor(id) {
    return S.worn.has(id) ? { type: 'remove', verb: 'cởi', ok: ['cởi'] } : { type: 'wear', verb: item(id).verb, ok: wearVerbs(id) };
  }

  function openSheet(id) {
    const why = blockReason(id);
    if (why) { toast(why, 'warn'); setSel(null); return; }
    const it = item(id), act = actionFor(id);
    S.sheet = { id, act };
    el.sheetItem.innerHTML = `<span class="si-emoji">${it.emoji}</span><span><b>${esc(it.name)}</b><small>${esc(it.en)}${act.type === 'remove' ? ' · đang ở trên người Nam' : ''}</small></span>`;
    el.sheetTitle.innerHTML = act.type === 'remove'
      ? `Muốn bỏ <b>${esc(it.name)}</b> ra, ta dùng động từ nào?`
      : `Ta dùng động từ nào với <b>${esc(it.name)}</b>?`;
    el.verbBtns.innerHTML = G.verbs.map((v) =>
      `<button type="button" class="vbtn" data-v="${esc(v)}" style="--vc:${verbColor(v)}">${esc(v)}</button>`).join('');
    el.sheetFb.className = 'sheet-fb'; el.sheetFb.innerHTML = '';
    el.sheet.hidden = false;
    requestAnimationFrame(() => el.sheet.classList.add('open'));
    const first = $('.vbtn', el.verbBtns); first && first.focus({ preventScroll: true });
  }
  function closeSheet() {
    el.sheet.classList.remove('open');
    el.sheet.hidden = true;
    if (S) S.sheet = null;
  }
  $('#sheetX').addEventListener('click', () => { closeSheet(); });
  el.sheet.addEventListener('click', (e) => { if (e.target === el.sheet) closeSheet(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!el.sheet.hidden) closeSheet(); else if (!el.result.hidden) el.result.hidden = true; }
  });

  el.verbBtns.addEventListener('click', (e) => {
    const b = e.target.closest('.vbtn');
    if (!b || b.disabled || !S.sheet) return;
    const v = b.dataset.v, { id, act } = S.sheet, it = item(id);
    if (act.ok.includes(v)) {
      b.classList.add('right');
      setTimeout(() => { closeSheet(); apply(id, { ...act, verb: v }); }, 280);
      if (act.ok.length > 1) setTimeout(() => toast(`👍 Với ${esc(it.name)}, “${act.ok.map(esc).join('” hay “')}” đều đúng.`, 'good'), 1500);
      return;
    }
    // Sai: không trừ điểm, ghi 1 lỗi, cho thử lại
    S.errors++;
    el.errChip.textContent = `❌ Lỗi: ${S.errors}`;
    el.errChip.classList.remove('bump'); void el.errChip.offsetWidth; el.errChip.classList.add('bump');
    b.classList.add('wrong'); b.disabled = true;
    Sfx.bad();
    const V = (x) => `<span class="vtag" style="--vc:${verbColor(x)}">${esc(x)}</span>`;
    const VV = act.ok.map(V).join(' hoặc ');
    const ex = `“${esc(act.verb)} ${esc(it.name)}”`;
    let msg;
    if (act.type === 'wear') {
      msg = v === 'cởi'
        ? `Nam chưa có ${esc(it.name)} trên người nên chưa cởi được.<br>Với <b>${esc(it.name)}</b>, ta dùng ${VV} → ${ex}.`
        : `Chưa đúng. Với <b>${esc(it.name)}</b>, ta dùng ${VV} → ${ex}.`;
    } else {
      msg = wearVerbs(id).includes(v)
        ? `Nam đang ${esc(v)} ${esc(it.name)} rồi! Muốn bỏ ra, ta dùng ${V('cởi')} → “cởi ${esc(it.name)} ra”.`
        : `Chưa đúng. Muốn bỏ <b>${esc(it.name)}</b> ra, ta dùng ${V('cởi')}.<br><small>(Khi mặc vào thì dùng “${wearVerbs(id).map(esc).join(' / ')} ${esc(it.name)}”.)</small>`;
    }
    el.sheetFb.className = 'sheet-fb bad show';
    el.sheetFb.innerHTML = `<span class="fb-ico">✗</span><span>${msg}<br><small>Thử lại nhé!</small></span>`;
  });

  /* ---------- Áp dụng hành động ---------- */
  function apply(id, act) {
    const it = item(id);
    const g = $(`.wear[data-item="${id}"]`, el.svg);
    if (act.type === 'wear') { S.worn.add(id); g && g.classList.add('on'); }
    else { S.worn.delete(id); g && g.classList.remove('on'); }
    Sfx.good();
    Speech.say(act.type === 'wear' ? `${act.verb} ${it.name}` : `cởi ${it.name} ra`);

    // Chữ bay lên
    let label;
    if (S.id === 'A') {
      const pts = pointsOf(id);
      label = pts ? `+${pts}% 🔥` : '+0 🔥';
      toast(pts
        ? `✓ <span class="vtag" style="--vc:${verbColor(act.verb)}">${esc(act.verb)}</span> ${esc(it.name)}`
        : `✓ ${esc(act.verb)} ${esc(it.name)} — đúng rồi! Nhưng ${esc(it.name)} không làm ấm 😅`, 'good');
    } else {
      const total = sc().removeItems.length + sc().wearItems.length;
      label = `+${Math.round(100 / total)}% 🍃`;
      toast(act.type === 'remove'
        ? `✓ <span class="vtag" style="--vc:${verbColor('cởi')}">cởi</span> ${esc(it.name)} ra`
        : `✓ <span class="vtag" style="--vc:${verbColor(act.verb)}">${esc(act.verb)}</span> ${esc(it.name)}`, 'good');
      if (act.type === 'remove' && remainingWarm() === 0) setTimeout(() => toast('🎉 Đã cởi hết đồ ấm! Giờ <b>mặc</b> quần đùi và áo cộc nhé.', 'good'), 1400);
    }
    floatText(label, act.type === 'remove' ? 'fly-off' : '');
    sparkle(it.emoji, act.type);
    setSel(null);
    renderTray();
    update();
  }

  /* ---------- Hiệu ứng ---------- */
  function floatText(text, extra) {
    const f = document.createElement('div');
    f.className = 'float-txt ' + (extra || '');
    f.textContent = text;
    el.fx.appendChild(f);
    setTimeout(() => f.remove(), 1400);
  }
  function sparkle(emoji, type) {
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.textContent = i === 0 ? emoji : (type === 'remove' ? '💨' : '✨');
      const a = (Math.PI * 2 * i) / 10, r = 70 + Math.random() * 50;
      s.style.setProperty('--tx', Math.cos(a) * r + 'px');
      s.style.setProperty('--ty', Math.sin(a) * r - 30 + 'px');
      el.fx.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }
  function confetti() {
    const colors = ['#f03e3e', '#fab005', '#40c057', '#228be6', '#be4bdb', '#fd7e14'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.6 + 's';
      c.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
      c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      el.fx.appendChild(c);
      setTimeout(() => c.remove(), 3800);
    }
  }
  let toastTimer = 0;
  function toast(html, kind) {
    el.toast.className = 'gtoast show ' + (kind || '');
    el.toast.innerHTML = html;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
  }

  /* ---------- Kết thúc màn ---------- */
  function win() {
    const s = sc();
    Sfx.win(); confetti();
    setSel(null);
    const bests = store.get('gameBest', {});
    const isRecord = bests[S.id] == null || S.errors < bests[S.id];
    if (isRecord) { bests[S.id] = S.errors; store.set('gameBest', bests); }
    el.best.textContent = `🏆 Kỷ lục: ${bests[S.id]} lỗi`;
    const stars = S.errors === 0 ? 3 : S.errors <= 2 ? 2 : 1;
    const other = S.id === 'A' ? 'B' : 'A';
    const bonus = s.bonus ? `
      <div class="bonus">
        <p class="bonus-q">❓ ${esc(s.bonus.question)}</p>
        <div class="bonus-opts">${s.bonus.options.map((o, i) => `<button type="button" class="opt" data-i="${i}">${esc(o.text)}</button>`).join('')}</div>
        <p class="bonus-fb" aria-live="polite"></p>
      </div>` : '';
    el.resultBody.innerHTML = `
      <div class="res-emoji">${s.winEmoji}</div>
      <h3 id="resTitle">${esc(s.winTitle)}</h3>
      <p>${esc(s.winText)}</p>
      <div class="stars" aria-label="${stars} sao">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
      <p class="res-err">Số lỗi: <b>${S.errors}</b>${isRecord ? ' · 🏆 Kỷ lục mới!' : ''}</p>
      ${S.errors === 0 ? '<p class="res-note">Không sai lần nào — giỏi quá! 🎉</p>' : ''}
      ${S.id === 'A' ? `<p class="res-tip">💡 Đồng hồ và kính: ta <b>đeo</b>, nhưng chúng không làm ấm (+0%).</p>` : ''}
      ${bonus}
      <div class="res-btns">
        <button type="button" class="btn" data-res="again">↺ Chơi lại</button>
        <button type="button" class="btn primary" data-res="next">${other === 'B' ? 'Sang Màn B ☀️' : 'Về Màn A ❄️'}</button>
      </div>`;
    el.result.hidden = false;
    $('.res-btns .primary', el.resultBody).focus({ preventScroll: true });
  }
  el.result.addEventListener('click', (e) => {
    if (e.target === el.result) { el.result.hidden = true; return; }
    const r = e.target.closest('[data-res]');
    if (r) { start(r.dataset.res === 'again' ? S.id : (S.id === 'A' ? 'B' : 'A')); return; }
    const o = e.target.closest('.bonus .opt');
    if (o) {
      const bonus = sc().bonus, opt = bonus.options[+o.dataset.i];
      const box = o.closest('.bonus');
      if (box.classList.contains('done')) return;
      box.classList.add('done');
      $$('.opt', box).forEach((b) => { b.disabled = true; if (bonus.options[+b.dataset.i].correct) b.classList.add('right'); });
      if (!opt.correct) o.classList.add('wrong');
      opt.correct ? Sfx.good() : Sfx.bad();
      $('.bonus-fb', box).innerHTML = (opt.correct ? '✓ Đúng rồi! ' : '✗ Chưa đúng. ') + bonus.explain;
    }
  });

  /* ---------- Nút điều khiển ---------- */
  $$('.scene-tab', root).forEach((b) => b.addEventListener('click', () => start(b.dataset.scene)));
  $('#gReset').addEventListener('click', () => start(S.id));

  start(store.get('gameScene', 'A') === 'B' ? 'B' : 'A');
})();
