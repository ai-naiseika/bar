'use strict';
// 店先（店に入る前の画面）。本人 2026-11-09「喫茶店に入る前に、入り口の影絵を付けて。OPEN の札と説明書きあり、雰囲気のよい店先を」。
// 絵は本人の Gemini の切り絵（店先.jpg。店先の絵を作る.py が、絵の札と立て看板を消して作る）。座標は店と同じ 1600×893。
// 説明書きは、立て看板に読める大きさで収まれば扉の右に立てた看板の上に（看板はコードで、絵と同じ白い切り込みの線で描く）。
// 収まらない画面（スマホ）では、絵には看板を描かず、絵の下（横向きは右）の黒板そのものを店の前に立つ看板にする
// （看板が2枚に見えた 本人 2026-11-10「スマホで見ると看板がおかしい」）。
// 狭い画面は指で左右に動かして見わたせる（本人 2026-11-10「店先もここから動かない」）。
// 扉（か「店に入る」）を押すと扉が開き、中の灯りへ寄って店の中へ。店.js が attach で、入った時・外へ戻った時の手当てを渡す
window.cafeFront = (() => {
  const W = 1600, H = 893;
  const FAST = new URLSearchParams(location.search).has('fast') ? 6 : 1;
  const INK = '#120b08', CREAM = '#fff0c8', CUT = 'rgba(246, 230, 200, 0.82)';
  const PI = Math.PI, TAU = PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (u) => u * u * (3 - 2 * u);
  // 扉（上がアーチ。絵の扉に合わせた形）と、コードで描く立て看板の面。札のフックと壁灯は絵から測った位置（店先の位置.js）
  const DOOR = { x0: 640, x1: 800, cy: 420, r: 80, y1: 860 };
  const BOARD = { x0: 862, y0: 455, x1: 1158, y1: 800 };
  const HOOK = { x: FRONT_ART.hook[0], y: FRONT_ART.hook[1] };
  const LAMP = { x: FRONT_ART.lamp[0], y: FRONT_ART.lamp[1], r: FRONT_ART.lamp[2] };
  // 開いた時に必ず見せる所。絵に看板を描く画面は扉と立て看板と軒の看板の字、黒板の画面は扉と軒の看板の字
  const FOCUS_BOARD = { x0: 512, x1: 1208, y0: 230, y1: 893 };
  const FOCUS_CARD = { x0: 470, x1: 1010, y0: 150, y1: 893 };
  // 黒板の画面で、扉と看板に添えて見せたい所の左の端（窓と鉢植え＝窓辺）
  const SILL = 150;
  // 黒板の看板は、絵の下に取っ手の分（TOP）空けて立てる。絵にはかぶせない（石畳にかけたら、店の下の方が隠れた
  // 本人 2026-11-10「看板置きすぎて、店の下の方が見えないね」）。取っ手と脚の高さは index.html の ::before・::after と同じ
  const TOP = 26, LEGS = 30;
  // 看板の上の字がこれより小さくなる画面では、絵の下の黒板に書く
  const MIN_BOARD_FONT = 12.5;
  // 指で動かしたことを覚える名前（頭は店の設定の key）
  const PAN_KEY = window.CAFE.key + '-front-panned';

  const root = document.getElementById('front');
  const skip = !!window.__noFront || !root;
  let hooks = { log() {}, entered() {} };
  if (skip) {
    if (root) root.hidden = true;
    return { enabled: false, covering: () => false, attach: (h) => (hooks = h), show() {} };
  }
  const cv = document.getElementById('frontC');
  const c = cv.getContext('2d', { alpha: false });
  const board = document.getElementById('frontBoard');
  const doorBtn = document.getElementById('frontDoor');
  const enterBtn = document.getElementById('frontEnter');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 絵が届くまでは夜空の色だけ（説明書きと扉の札は先に出る）
  const art = new Image();
  art.src = '店先.jpg';
  const artReady = () => art.complete && art.naturalWidth > 0;

  const waitEl = document.getElementById('frontWait');
  const hintEl = document.getElementById('frontHint');
  let covering = true, entering = false, running = false, waiting = false;
  let S = 1, dpr = 1, ox = 0, oy = 0, card = false, focus = FOCUS_BOARD, artW = 0;
  let baked = null, bakedKey = '';
  // 札は振り子。ときどき風が吹き、扉を押すと大きく揺れる
  const sign = { a: 0.09, v: 0, gust: 2.5 };
  let open = 0, zoom = 0, t = 0, lastNow = 0;

  /* ---------- 描く（動かない所は1枚に焼いておく） ---------- */

  function doorPath(g, d) {
    g.beginPath();
    g.moveTo(d.x0, d.y1);
    g.lineTo(d.x0, d.cy);
    g.arc((d.x0 + d.x1) / 2, d.cy, d.r, PI, 0);
    g.lineTo(d.x1, d.y1);
    g.closePath();
  }

  function cutLine(g, w = 2, a = 0.42) {
    g.strokeStyle = `rgba(255, 236, 196, ${a})`;
    g.lineWidth = w;
    g.stroke();
  }

  // 店の中の灯り（扉の向こう）。上の吊り灯りのまわりが明るい
  function roomLight(g, x0, y0, x1, y1, lx, ly) {
    const lin = g.createLinearGradient(0, y0, 0, y1);
    lin.addColorStop(0, '#ffdc92');
    lin.addColorStop(1, '#e8973a');
    g.fillStyle = lin;
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const rad = g.createRadialGradient(lx, ly, 4, lx, ly, (x1 - x0) * 0.7);
    rad.addColorStop(0, 'rgba(255, 250, 225, 0.95)');
    rad.addColorStop(1, 'rgba(255, 250, 225, 0)');
    g.fillStyle = rad;
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  function hangingLamp(g, x, y, s) {
    g.fillStyle = INK;
    g.fillRect(x - 1, y - 40 * s, 2, 40 * s);
    g.beginPath();
    g.moveTo(x - 16 * s, y);
    g.lineTo(x + 16 * s, y);
    g.lineTo(x + 28 * s, y + 20 * s);
    g.lineTo(x - 28 * s, y + 20 * s);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255, 252, 232, 0.95)';
    g.beginPath();
    g.ellipse(x, y + 22 * s, 9 * s, 4 * s, 0, 0, TAU);
    g.fill();
  }

  function bake() {
    const k = Math.min(2, S * dpr);
    const key = `${k.toFixed(3)}|${card}|${artReady()}`;
    if (baked && bakedKey === key) return;
    bakedKey = key;
    baked = document.createElement('canvas');
    baked.width = Math.round(W * k);
    baked.height = Math.round(H * k);
    const g = baked.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.fillStyle = FRONT_ART.sky;
    g.fillRect(0, 0, W, H);
    if (artReady()) g.drawImage(art, 0, 0, W, H);
    if (!card) aBoard(g);
  }

  // 扉の右の立て看板（A 型の黒板）。絵の切り絵に合わせて、黒い板に白い切り込みの線。字は HTML で重ねる
  function aBoard(g) {
    g.fillStyle = INK;
    g.beginPath();
    g.moveTo(820, 860);
    g.lineTo(845, 430);
    g.lineTo(1175, 430);
    g.lineTo(1200, 860);
    g.closePath();
    g.fill();
    g.fillStyle = '#17130f';
    g.fillRect(BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0);
    const smudge = g.createRadialGradient(990, 600, 20, 990, 600, 220);
    smudge.addColorStop(0, 'rgba(240, 236, 220, 0.06)');
    smudge.addColorStop(1, 'rgba(240, 236, 220, 0)');
    g.fillStyle = smudge;
    g.fillRect(BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0);
    g.strokeStyle = CUT;
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(822, 862);
    g.lineTo(846, 432);
    g.lineTo(1174, 432);
    g.lineTo(1198, 862);
    g.moveTo(852, 862);
    g.lineTo(860, 818);
    g.lineTo(1160, 818);
    g.lineTo(1168, 862);
    g.stroke();
    g.lineWidth = 2.5;
    g.strokeRect(BOARD.x0 - 6, BOARD.y0 - 6, BOARD.x1 - BOARD.x0 + 12, BOARD.y1 - BOARD.y0 + 12);
    g.beginPath();
    g.arc(1010, 430, 18, PI, 0);
    g.stroke();
  }

  let glow = null;
  function glowSprite() {
    if (glow) return glow;
    glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    const g = glow.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255, 214, 140, 1)');
    r.addColorStop(0.35, 'rgba(255, 180, 90, 0.4)');
    r.addColorStop(1, 'rgba(255, 180, 90, 0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return glow;
  }

  // 扉の向こう（開いた時だけ見える）：明るい店の中に、吊り灯りとカウンターの端
  function doorway(g) {
    g.save();
    doorPath(g, DOOR);
    g.clip();
    roomLight(g, DOOR.x0, DOOR.cy - DOOR.r, DOOR.x1, DOOR.y1, 712, 470);
    hangingLamp(g, 706, 452, 0.8);
    g.fillStyle = INK;
    g.fillRect(DOOR.x0, 700, DOOR.x1 - DOOR.x0, 160);
    g.fillRect(744, 650, 34, 9);
    g.fillRect(758, 659, 6, 56);
    g.beginPath();
    g.moveTo(DOOR.x0, 704);
    g.lineTo(DOOR.x1, 704);
    cutLine(g, 2, 0.5);
    g.restore();
  }

  // 扉の板と OPEN の札。蝶番は左。開く間は絵の扉を切り出して、内へ回るように細く暗く
  function doorPanel(g) {
    const sx = 1 - 0.86 * open;
    g.save();
    g.translate(DOOR.x0, 0);
    g.scale(sx, 1);
    g.translate(-DOOR.x0, 0);
    if (open > 0 && artReady()) {
      g.save();
      doorPath(g, DOOR);
      g.clip();
      g.drawImage(art, 0, 0, W, H);
      g.restore();
    }
    // OPEN の札（フックから2本の紐で吊るす）
    g.translate(HOOK.x, HOOK.y);
    g.rotate(sign.a);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-30, 32);
    g.lineTo(0, 0);
    g.lineTo(30, 32);
    g.stroke();
    g.fillStyle = '#1c110b';
    g.beginPath();
    g.roundRect(-42, 30, 84, 34, 4);
    g.fill();
    g.beginPath();
    g.roundRect(-38, 34, 76, 26, 3);
    cutLine(g, 1.4, 0.55);
    g.fillStyle = CREAM;
    g.font = '700 21px Georgia, "Times New Roman", serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('OPEN', 0, 48);
    g.fillStyle = INK;
    g.beginPath();
    g.arc(0, 0, 3.5, 0, TAU);
    g.fill();
    g.restore();
    if (open > 0) {
      g.save();
      g.globalAlpha = open * 0.45;
      g.fillStyle = INK;
      g.fillRect(DOOR.x0, DOOR.cy - DOOR.r, (DOOR.x1 - DOOR.x0) * sx, DOOR.y1 - DOOR.cy + DOOR.r);
      g.restore();
    }
  }

  function draw() {
    // 寄る時は、扉の中ほどを画面のまん中へ運びながら大きく（左右に動かした後でも、扉へ寄る）
    const cx = (DOOR.x0 + DOOR.x1) / 2, cy = 600;
    const z = 1 + 7 * zoom * zoom * zoom, m = smooth(zoom);
    const sx = (1 - m) * (cx - ox) * S * dpr + m * cv.width / 2;
    const sy = (1 - m) * (cy - oy) * S * dpr + m * cv.height / 2;
    const a = dpr * S * z;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = FRONT_ART.sky;
    c.fillRect(0, 0, cv.width, cv.height);
    c.setTransform(a, 0, 0, a, sx - a * cx, sy - a * cy);
    c.drawImage(baked, 0, 0, W, H);
    // 壁灯の灯りが、かすかにゆらぐ
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.16 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 13.1 + 1);
    const R = LAMP.r * 4.5;
    c.drawImage(glowSprite(), LAMP.x - R, LAMP.y - R, R * 2, R * 2);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    if (open > 0) doorway(c);
    doorPanel(c);
    if (open > 0) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(240, 165, 75, ${0.32 * open})`;
      c.beginPath();
      c.moveTo(DOOR.x0, 860);
      c.lineTo(DOOR.x1, 860);
      c.lineTo(900, H);
      c.lineTo(560, H);
      c.fill();
      c.globalCompositeOperation = 'source-over';
    }
    if (zoom > 0.55) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = `rgba(255, 238, 200, ${smooth((zoom - 0.55) / 0.45)})`;
      c.fillRect(0, 0, cv.width, cv.height);
    }
  }

  function swing(dt) {
    sign.gust -= dt;
    if (sign.gust <= 0) {
      sign.v += (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.18);
      sign.gust = 5 + Math.random() * 5;
    }
    // ふだんも、そよ風でかすかに揺れ続ける（風の合間に止まって、揺れていない札に見えた）
    const w = TAU / 1.5, breeze = 0.35 * Math.sin(t * 0.9) + 0.2 * Math.sin(t * 2.3 + 1);
    for (let n = Math.ceil(dt / 0.02), h = dt / n; n > 0; n--) {
      sign.v += (-w * w * sign.a - 0.7 * sign.v + breeze) * h;
      sign.a += sign.v * h;
    }
  }

  // ふだんは1秒25枚。扉が開いて寄る間だけ、なめらかに（光の中で待つ間は、絵が変わらないので間引く）
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.1, (now - lastNow) / 1000 || 0.04) * FAST;
    lastNow = now;
    t += dt;
    swing(dt);
    draw();
    setTimeout(() => requestAnimationFrame(frame), waiting ? 250 : entering ? 0 : 40);
  }
  function run() {
    if (running) return;
    running = true;
    lastNow = 0;
    requestAnimationFrame(frame);
  }

  /* ---------- 並べる ---------- */

  function px(x, y) {
    return [(x - ox) * S, (y - oy) * S];
  }

  function placeBox(el, x0, y0, x1, y1) {
    const [l, tp] = px(x0, y0), [r, b] = px(x1, y1);
    el.style.left = l + 'px';
    el.style.top = tp + 'px';
    el.style.width = r - l + 'px';
    el.style.height = b - tp + 'px';
  }

  // 看板の面に収まるいちばん大きな字（行は「助詞の後」のかたまりの間でだけ折れる）
  function fitBoardFont() {
    let lo = 8, hi = 30;
    for (let i = 0; i < 9; i++) {
      const f = (lo + hi) / 2;
      board.style.fontSize = f + 'px';
      if (board.scrollHeight <= board.clientHeight + 1 && board.scrollWidth <= board.clientWidth + 1) lo = f;
      else hi = f;
    }
    board.style.fontSize = lo + 'px';
    return lo;
  }

  function fit() {
    const vw = innerWidth, vh = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    // まず、絵を画面いっぱいにして看板に書く形で試す（扉と看板が真ん中に来るよう寄せる）
    card = false;
    focus = FOCUS_BOARD;
    hintEl.hidden = true;
    root.classList.remove('card', 'side');
    board.removeAttribute('style');
    S = Math.max(vw / W, vh / H);
    ox = clamp((focus.x0 + focus.x1) / 2 - vw / S / 2, 0, W - vw / S);
    oy = clamp(H - vh / S, 0, H);
    artW = vw;
    let artH = vh;
    const pad = 10;
    placeBox(board, BOARD.x0 + pad, BOARD.y0 + pad, BOARD.x1 - pad, BOARD.y1 - pad);
    const seesFocus = (focus.x0 - ox) * S >= -1 && (focus.x1 - ox) * S <= vw + 1;
    if (!seesFocus || fitBoardFont() < MIN_BOARD_FONT) {
      // 絵の下（横に長い画面は右）の黒板に書き、絵には看板を描かない。絵は扉と軒の看板が入る大きさに
      card = true;
      focus = FOCUS_CARD;
      board.removeAttribute('style');
      const side = vw > vh;
      root.classList.add('card');
      root.classList.toggle('side', side);
      if (side) {
        const w = clamp(vw * 0.42, 290, 420);
        board.style.width = w + 'px';
        // 黒板の右の余白（index.html の right: 12px）の分も、絵から引く
        artW = vw - w - 12;
        artH = vh;
      } else {
        artW = vw;
        artH = Math.max(vh - board.offsetHeight - LEGS - TOP, vh * 0.42);
        board.style.top = artH + TOP + 'px';
      }
      // 窓辺から軒の看板の右の端までが収まる大きさを目指す。扉と看板だけに寄ると、扉の右の何も無い黒い壁が画面の半分ちかくになった
      // （本人 2026-11-10「スマホの入り口だと、デフォルトの位置が黒い壁がほとんどになって、ちょっと寂しい」）
      S = Math.min(artW / (focus.x1 - SILL), artH / (focus.y1 - focus.y0));
      // 絵の上の端より上（絵の無い所）は見せない。足りない時は寄せて、窓辺の左の方から切る。左右は指で見わたす
      S = Math.max(S, artH / H);
      const span = artW / S;
      ox = clamp(Math.max((SILL + focus.x1) / 2 - span / 2, focus.x1 - span), 0, Math.max(0, W - span));
      oy = H - artH / S;
      // 狭い画面は、指で左右に動かして見わたせることを、まだ動かしたことのない人にだけ知らせる
      // 案内は絵のいちばん上（屋根の上）に。軒の看板の字と扉の札にかぶらない所
      if (canPan() && !panned()) {
        hintEl.style.left = artW / 2 + 'px';
        hintEl.style.top = Math.max(6, (150 - oy) * S - 40) + 'px';
        hintEl.hidden = false;
      }
    }
    cv.style.width = artW + 'px';
    cv.style.height = artH + 'px';
    cv.width = Math.round(artW * dpr);
    cv.height = Math.round(artH * dpr);
    placeBox(doorBtn, DOOR.x0, DOOR.cy - DOOR.r, DOOR.x1, DOOR.y1);
    bake();
    draw();
  }

  /* ---------- 指で左右に見わたす（絵をつかんで引っぱる向き） ---------- */

  const canPan = () => artW / S < W - 1;
  function panned() {
    try {
      return localStorage.getItem(PAN_KEY) === '1';
    } catch (e) {
      return false;
    }
  }
  const drag = { id: null, x0: 0, ox0: 0, moved: false, until: 0 };
  function dragStart(e) {
    if (entering || !canPan() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    Object.assign(drag, { id: e.pointerId, x0: e.clientX, ox0: ox, moved: false });
  }
  function dragMove(e) {
    if (e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) < 8) return;
    if (!drag.moved) {
      drag.moved = true;
      hintEl.hidden = true;
      hooks.log({ ev: 'frontPan' });
      try {
        localStorage.setItem(PAN_KEY, '1');
      } catch (err) {
        /* 次も知らせるだけ */
      }
    }
    ox = clamp(drag.ox0 - dx / S, 0, W - artW / S);
    placeBox(doorBtn, DOOR.x0, DOOR.cy - DOOR.r, DOOR.x1, DOOR.y1);
  }
  function dragEnd(e) {
    if (e.pointerId !== drag.id) return;
    drag.id = null;
    // 動かした指を離した時の押しは、扉を押したことにしない
    if (drag.moved) drag.until = performance.now() + 400;
  }
  for (const el of [cv, doorBtn]) {
    el.addEventListener('pointerdown', dragStart);
    el.addEventListener('pointermove', dragMove);
    el.addEventListener('pointerup', dragEnd);
    el.addEventListener('pointercancel', dragEnd);
  }

  /* ---------- 入る・戻る ---------- */

  function tween(sec, f) {
    return new Promise((done) => {
      const t0 = performance.now(), ms = (sec * 1000) / FAST;
      const step = (now) => {
        const u = Math.min(1, (now - t0) / ms);
        f(u);
        if (u < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
  }

  // 店の絵がまだ届いていなければ、扉の向こうの光の中で待つ（くるくると、ことばと、届いた割合）
  async function waitInside() {
    if (!hooks.ready) return;
    const p = hooks.ready();
    if (p === true) return;
    waiting = true;
    waitEl.hidden = false;
    hooks.log({ ev: 'wait' });
    const bar = waitEl.querySelector('b');
    const tick = setInterval(() => (bar.style.width = Math.round(hooks.progress() * 100) + '%'), 200);
    await p;
    clearInterval(tick);
    waitEl.hidden = true;
    waiting = false;
  }

  async function enter() {
    if (!covering || entering) return;
    entering = true;
    hintEl.hidden = true;
    hooks.log({ ev: 'enter' });
    root.classList.add('entering');
    sign.v += 1.2;
    await tween(reduce ? 0.2 : 0.9, (u) => (open = smooth(u)));
    root.classList.add('zooming');
    if (!reduce) await tween(1.1, (u) => (zoom = u));
    await waitInside();
    // 店が描きはじめてから、店先を薄くして消す
    covering = false;
    hooks.log({ ev: 'opened' });
    hooks.entered();
    root.classList.add('gone');
    await tween(0.85, () => {});
    running = false;
    root.hidden = true;
    root.classList.remove('entering', 'zooming', 'gone');
    open = 0;
    zoom = 0;
    entering = false;
    hooks.log({ ev: 'inside' });
  }

  // 店の中から「戻る」で外へ出た時
  function show() {
    if (covering || entering) return;
    covering = true;
    root.classList.add('gone');
    root.hidden = false;
    fit();
    run();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('gone')));
    hooks.log({ ev: 'front' });
  }

  doorBtn.addEventListener('click', () => performance.now() > drag.until && enter());
  enterBtn.addEventListener('click', enter);
  // LINE の中のブラウザはページから全画面にできない（本人 2026-11-10「特にLINEだと全画面にならず見づらい」）。
  // 住所に openExternalBrowser=1 を付けて開くと、LINE はいつものブラウザ（Chrome・Safari）で開く
  const outside = document.getElementById('frontOutside');
  if (/\sLine\//i.test(navigator.userAgent)) {
    const u = new URL(location.href);
    u.searchParams.set('openExternalBrowser', '1');
    outside.href = u.href;
    outside.hidden = false;
  }
  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => covering && fit(), 150);
  });
  fit();
  run();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => covering && fit());
  // 絵が届いたら焼き直す
  if (!artReady()) art.addEventListener('load', () => covering && fit());

  return {
    enabled: true,
    covering: () => covering,
    attach: (h) => (hooks = h),
    show,
    // 試す.py が見る
    state: () => {
      const box = (x0, y0, x1, y1) => {
        const [l, tp] = px(x0, y0), [r, b] = px(x1, y1);
        return { l, t: tp, r, b };
      };
      return { card, font: parseFloat(getComputedStyle(board).fontSize), sign: sign.a, open, zoom, covering, art: artReady(),
        board: box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y1), focus: box(focus.x0, focus.y0, focus.x1, focus.y1),
        ox, span: artW / S, canPan: canPan(), hint: !hintEl.hidden };
    },
  };
})();
