'use strict';
// 店の言葉を、店の設定（window.CAFE。店ごとに1つ。index.html の最初のスクリプト）から画面に入れる。
// index.html には店ごとの言葉を持たない（同じ仕組みを2つの店で使う 2026-11-16）。店先.js と 店.js より先に読む
//
// window.CAFE の形（無い物は index.html の既定の字のまま）
//   key       端末に覚える物の名前の頭（localStorage・sessionStorage の「<key>-cafe-visited」など）
//   title     ページの題
//   sample    yt の無いアルバムに流す見本の動画（無ければ null）
//   heads     上映の見出し { juke, stage, album, albumMedley, albumOmakase }：かたまり3つ（差し込みは fill の vars）
//   shelfTitle 棚の一覧の見出し
//   labels    spots・panel・jacket・next・back・menuTitle・tracksMedley・tracksOmakase・tracksPick・tracksBack・resumeGo・resumeNo
//   front     店先の説明書き { head, items }（文字列は折ってよい所で自動で分ける。「｜」で指定してもよい）
//   drinks    { coffee, wine, soda, cocktail } ごとに { name, note, ask, serve }
//   guide     入店の案内（ジュークボックス・棚・舞台のピアノ・メニュー）
//   lines     マスターのセリフ（鍵ごとに言葉の並び）
//   albums    アルバムごとの一言 { <id>: { go, after } }（無くてよい）
//   books     左のテーブルに置く本 { title（一覧の見出し）, aria, tag, box?, list: [{ src, title, note, kind, cover, say }] }。
//             押すと本の一覧、選ぶと店の上に重ねて開く窓（店.js の openBooks・openBook）。
//             kind は絵の形（album・booklet）、cover は表紙の色。無い店では出ない
//   book      1冊だけの形 { src, title, box, aria, tag }（絵には描かず、押す所だけ。押すとすぐ窓）
//   lines の ask は、手すきの話に回す問いかけ。bookAfter は窓を閉じた時のひとこと。suggestBook はテーブルの本をすすめるひとこと
//             （本を置く店だけ suggest に混ぜて回る。縦の画面では、言う時にカメラがテーブルへ寄る＝店.js の glanceBooks。どれも無くてよい）
//   credit    工房へ戻る小さなクレジット { text, href }（公開の店だけ。無い店には何も出さない）。同じタブで開く
window.cafeText = (() => {
  const CAFE = window.CAFE || {};
  const L = CAFE.labels || {};
  const $ = (s) => document.querySelector(s);

  // 差し込み：{no} などを vars の値に。知らない差し込みは空にする（画面に {x} や undefined を出さない）
  const fill = (tpl, vars = {}) => String(tpl == null ? '' : tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : String(vars[k])));

  // 言葉のかたまりに分ける（スマホの狭い幅で、言葉の途中で折らない。折るのはかたまりの間だけ）。
  // 折ってよい所：空白のあと・句読点や閉じ括弧のあと・開き括弧の前・「助詞（の も含む）のあとに漢字・カナ・英数」・かなや漢字と英字の境。
  // 「｜」があれば、そこだけで分ける（画面には出さない）
  const WORD = /[一-龥々ァ-ヴーA-Za-z0-9]/;
  const CJK = /[ぁ-ゖァ-ヴー一-龥々]/;
  const OPEN = '（「『【〔〈《(';
  const AFTER = '、。，．,！？!?・：；;）」』】〕〉》)';
  const NOSTART = '、。，．,！？!?）」』】〕〉》)ー・…';
  function canBreak(a, b) {
    if (/\s/.test(b) || NOSTART.includes(b)) return false;
    if (/\s/.test(a) || AFTER.includes(a)) return true;
    if (OPEN.includes(b) && !OPEN.includes(a)) return true;
    if ('とでがをにはへもばての'.includes(a) && WORD.test(b)) return true;
    if (a === 'て' && 'いおく'.includes(b)) return true;
    return (CJK.test(a) && /[A-Za-z]/.test(b)) || (/[A-Za-z]/.test(a) && CJK.test(b));
  }
  function chunks(v) {
    if (Array.isArray(v)) return v.map(String).filter((s) => s !== '');
    const s = String(v == null ? '' : v);
    if (s.includes('｜')) return s.split('｜').filter((t) => t !== '');
    const out = [];
    let cur = '';
    for (let i = 0; i < s.length; i++) {
      cur += s[i];
      if (i + 1 < s.length && canBreak(s[i], s[i + 1])) {
        out.push(cur);
        cur = '';
      }
    }
    if (cur) out.push(cur);
    return out;
  }
  // かたまりを、折らない箱（.w）に入れて並べる。空白は箱の外に出す（空白で折れる）。ほかの切れ目は wbr
  function put(el, v) {
    const kids = [];
    chunks(v).forEach((c, i, all) => {
      const body = c.replace(/\s+$/, '');
      if (body) {
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = body;
        kids.push(s);
      }
      if (body !== c) kids.push(document.createTextNode(' '));
      else if (i + 1 < all.length) kids.push(document.createElement('wbr'));
    });
    el.replaceChildren(...kids);
    return el;
  }
  // 字の並びを wbr でつなぐ（縦の画面の下のボタン。字の中では折らない＝CSS の keep-all）
  function joined(list) {
    const kids = [];
    (list || []).forEach((t, i) => {
      if (i) kids.push(document.createElement('wbr'));
      kids.push(document.createTextNode(t));
    });
    return kids;
  }
  // 大きい字と添え書き（<small>）のボタン
  function twoLine(el, main, sub) {
    const kids = Array.isArray(main) ? joined(main) : [document.createTextNode(main || '')];
    if (sub != null && sub !== '') {
      const sm = document.createElement('small');
      sm.append(...(Array.isArray(sub) ? joined(sub) : [document.createTextNode(sub)]));
      kids.push(sm);
    }
    el.replaceChildren(...kids);
  }
  const text = (sel, v) => {
    const el = $(sel);
    if (el && v != null) el.textContent = v;
  };

  if (CAFE.title) document.title = CAFE.title;
  const SPOT = { juke: '#spotJuke', shelf: '#spotShelf', stage: '#spotStage', menu: '#spotMenu' };
  for (const [k, sel] of Object.entries(SPOT)) {
    const s = (L.spots || {})[k], el = $(sel);
    if (!s || !el) continue;
    if (s.aria) el.setAttribute('aria-label', s.aria);
    const [b, sm] = s.tag || [];
    el.querySelector('.tag b').textContent = b || '';
    el.querySelector('.tag small').textContent = sm || '';
  }
  for (const [k, v] of Object.entries(L.panel || {})) {
    const el = document.querySelector(`#panel button[data-go="${k}"]`);
    if (el && v) twoLine(el, v[0], v[1]);
  }
  for (const [k, d] of Object.entries(CAFE.drinks || {})) {
    const el = document.querySelector(`#menu [data-drink="${k}"]`);
    if (el && d.name) twoLine(el, d.name, d.note);
  }
  text('#menu h2', L.menuTitle);
  text('#shelf h2', CAFE.shelfTitle);
  text('#playerNext', L.next);
  if (L.back) {
    for (const sel of ['#menuBack', '#shelfBack', '#playerClose']) text(sel, L.back);
    text('#bookClose', '‹ ' + L.back);
  }
  const modes = { medley: L.tracksMedley, omakase: L.tracksOmakase };
  for (const [k, v] of Object.entries(modes)) {
    const el = document.querySelector(`#tracks [data-mode="${k}"]`);
    if (el && v) twoLine(el, Array.isArray(v) ? v[0] : v, Array.isArray(v) ? v[1] : null);
  }
  text('#tracks .pick', L.tracksPick || '');
  text('#tracksBack', L.tracksBack || '');
  text('#resumeNo', L.resumeNo || '');

  // 店先の説明書き（見出しと、番号つきの使い方）
  const F = CAFE.front;
  if (F) {
    const head = $('#frontBoard .head');
    if (head && F.head) put(head, F.head);
    const ol = $('#frontBoard ol');
    if (ol && F.items) {
      ol.replaceChildren(...F.items.map((item, i) => {
        const li = document.createElement('li');
        const no = document.createElement('b');
        no.textContent = '１２３４５６７８９'[i] + '．';
        const t = document.createElement('span');
        t.className = 't';
        li.append(no, put(t, item));
        return li;
      }));
    }
  }

  // 工房へ戻るクレジット（店の設定の credit）。店先は説明書きの看板に添え（置き場は index.html の .kobo-credit）、
  // 店の中はボタンの列の後ろに置く（縦の画面はボタンの列の下・広い画面は右下の隅）。工房から来た人は端末の「戻る」で店へ戻れる
  const CR = CAFE.credit;
  if (CR && CR.text && String(CR.href || '').startsWith('https://')) {
    const link = (id) => {
      const a = document.createElement('a');
      a.id = id;
      a.className = 'kobo-credit';
      a.href = CR.href;
      a.rel = 'noopener noreferrer';
      a.textContent = CR.text;
      return a;
    };
    const board = $('#frontBoard'), panel = $('#panel');
    if (board) board.append(link('frontCredit'));
    if (panel) panel.after(link('shopCredit'));
    document.body.classList.add('credit');
  }

  return { CAFE, fill, chunks, put, twoLine };
})();
