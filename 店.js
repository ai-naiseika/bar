'use strict';
// 影絵の喫茶店。背景は Gemini の切り絵（背景.jpg）、マスターと灯りの動きはコードで重ねる。座標は 1600×893
(() => {
  const W = 1600, H = 893, HIP = 215;
  const INK = '#0e0908', WINE = '#8c2e2c', SLEEVE = '#e6b676', SLEEVE_FAR = '#b98a52', PALE = '#f4dfb4', CUT = 'rgba(244, 223, 180, 0.62)';
  const FAST = new URLSearchParams(location.search).has('fast') ? 6 : 1;
  // 店ごとに違う物（言葉・アルバム・端末に覚える物の名前・見本の動画）は、店の設定（window.CAFE。形は 言葉.js の頭）から。
  // この仕組みは2つの店で同じ物を使い、店ごとに違う物は店の設定だけにする（2026-11-16）
  const CAFE = window.CAFE, T = window.cafeText, KEY = CAFE.key, LABELS = CAFE.labels || {};
  // yt の無いアルバムに流す見本の動画（店の設定の sample。無い店では流せない旨を出す）
  const SAMPLE_VIDEO = CAFE.sample || '';
  const LABEL = ['#e8574a', '#f2a13c', '#f0d24f', '#62b983', '#5aa3dd', '#a26cc8', '#ec8fa6', '#7fc9c4'];
  // 背景の絵から測った位置
  const P = {
    // platter は絵の盤のまん中（ラベルの中心。本人 2026-11-09「レコードが盤上から少し浮いている」：7 上に描いていた）
    slot: { x: 548, y: 532 }, platter: { x: 756.5, y: 504.5 },
    seat: { x: 1349, y: 606 }, keysL: { x: 1376, y: 571 }, keysR: { x: 1408, y: 575 }, sizeK: 1,
    clock: { x: 1225.5, y: 370.5 }, clockFace: '#e4c79c', floorSay: { x: 915, y: 775 },
  };
  const HOME_X = 955;
  // 右の2つのグラス（絵から消して描き直す。素材を作る.py の ERASED）。マスターが磨いて入れ替える。足はカウンターの上。
  // 磨く間は、どちらか1つがマスターの手にある（開いた時は右の1つ）。手を空ける時は PARK に置く
  const SLOTS = ERASED.glassX.map((x, i) => ({ x, y: 535, full: i === 0 }));
  const PARK = { x: 878, y: 535 };
  const ROW_X = 1072;
  // ジュークボックスの上の猫（絵から消して描き直す）。B は前足の先。皿は前足の右の天板の上
  const CAT_B = { x: ERASED.cat[2] - 6, y: ERASED.cat[3] - 1 };
  const jukeTopAt = (x) => {
    const pts = ERASED.jukeTop;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
    return pts[pts.length - 1][1];
  };
  const DISH = { x: CAT_B.x + 11, y: 0 };
  DISH.y = jukeTopAt(DISH.x);
  const CAT_STAND = 562;
  // 蓄音機の腕（音を拾う箱と針）。絵の腕は消して描き直す。針の先は、盤の外（out＝面の始め）から内（in＝面の終わり）へ進む
  // 針の先は盤の面（盤の楕円の中）に下りる
  const ARM = { pivot: { x: 723, y: 491 }, out: { x: 735, y: 502 }, in: { x: 752, y: 503 } };
  // ピアノの調律：鍵盤の奥、譜面台の下のピン
  const TUNE_PIN = { x: 1392, y: 552 };
  // 鍵盤（絵から測った左の端 A0 から右の端 C8 まで）。鍵 m を押す手の位置（鍵の少し上）
  const keyAt = (m) => {
    const u = Math.min(1, Math.max(0, (m - 21) / 87));
    return { x: 1333 + 99 * u, y: 566 + 13 * u };
  };
  // ?chore=名前 で、その手すきの仕事だけを続けて見せる（本人が待たずに確かめる）。piano は面が終わった所から
  const ONLY = new URLSearchParams(location.search).get('chore');
  // 通り道：x ごとの足の高さと大きさ。手前へ出ると大きく、舞台の奥へ上がると小さい（遠近）
  // 舞台の大きさは椅子と鍵盤の高さから決めた：床から鍵盤まで 100（72cm）＝ 1cm 1.39 → 背丈 165cm は 230 ＝ 0.54 倍。
  // 舞台の前の縁は (1287, 672) から (1365, 722) への斜めの線。椅子の左横（x 1295）の足は、縁から 8 より内側（前の 1300 の
  // 足 676 は縁の 4 内側で、宙に浮いて見えた 本人 2026-11-17）。大きさは床の遠近（床の消える高さ y 400）から
  const PATH = [[560, 676, 0.58], [590, 676, 0.58], [702, 676, 0.55], [1158, 676, 0.55], [1200, 684, 0.6], [1265, 684, 0.6], [1295, 665, 0.535], [1349, 672, 0.54], [1600, 672, 0.54]];
  // ピアノの椅子の左横（幕の前の舞台の上）。会釈・鍵盤を拭く・調律の支度はここで（椅子の真上に立つと、脚が椅子の脚に重なり、
  // 宙に浮いたように見えた 本人 2026-11-17）。靴の先が椅子の左の端（x 1328）にかからない所。座る時は、ここから椅子の前へ
  // 一歩寄ってから（toBench）
  const STAGE_STAND = 1295;
  // カウンターの手前（お客の側）の床。丸イスを拭く時だけ出る。出入りは、カウンターの左の端とソファの間だけ
  // （本人 2026-11-12「掃除にならない華麗な感じで立ち回りましょう」）。in は奥の通り道、mid でソファの横をまっすぐ手前へ
  // 丸イスより手前まで出て、out は手前の床。大きさは床の遠近（床の消える高さ y 400 から測る。奥の通り道 y 676 で 0.55）
  const FLOOR = { y: 740, s: (0.55 * (740 - 400)) / (676 - 400) };
  const AISLE = { in: 692, mid: 694, out: 710 };
  // 手前の物（マスターがこの後ろを通る）
  // カウンター・手前のソファ・床のメニューの立て看板（形が単純なので多角形で）
  const FRONT = [
    [[702, 536], [1160, 536], [1162, 680], [702, 680]],
    // ソファの上の縁は、背もたれの上の丸いクッション（白い縫い目の線より上の帯）の上の端＝奥の手すりのバラスターの下の端まで。
    // 縫い目の線までにしていた時（11-12〜）は、その帯が背景のままで、後ろの通り道を歩くマスターの脚が背もたれの手前に描かれた
    //（本人 2026-11-20「赤で囲った背もたれの部分が背景になっていておかしい。この部分はソファでしょ？」。帯を手すりの土台と
    // 読み違えていた）。背もたれを整える手は、帯の上の縁に当てる（SOFA_AT）。右の縁は絵の黒い所の端（x 678。右へ広げると、横に立つ
    // マスターに白い床の筋がかかる）、下は背もたれの床の線まで（y 710 で切ると、カウンターの左の端の間を下りるマスターの脚が、
    // 奥にいるのにソファの前に出た）
    [[585, 656], [595, 648], [601, 641], [607, 637], [611, 634], [618, 626], [630, 620], [642, 608], [654, 600], [666, 590], [678, 581],
      [678, 772], [672, 782], [660, 788], [634, 838], [585, 838]],
    [[1156, 650], [1277, 656], [1308, 826], [1148, 826]],
  ];
  // 左のソファの前のテーブルの天板。四隅（手前の左・手前の右・奥の右・奥の左）は絵の白い切り込みの線から測った。上に置く物の
  // 位置は、幅 100・奥行き 50 の目盛り（手前の縁が 0）で書く。box は押せる所（天板と手前の厚み。ジュークボックスの台より下）
  const TABLE = { fl: [270, 733], fr: [416, 734], br: [505, 677], bl: [352, 684], w: 100, d: 50, box: [262, 668, 250, 84] };
  // テーブルの本（店の設定の books。無い店には何も置かない）。1冊だけの形（book）は、絵に描かずに押せる所だけ作る
  const TABLE_BOOKS = CAFE.books || (CAFE.book ? { aria: CAFE.book.aria, tag: CAFE.book.tag, box: CAFE.book.box, list: [CAFE.book] } : null);
  const BOOK_LIST = (TABLE_BOOKS && TABLE_BOOKS.list) || [];
  // 本の形（店の設定の kind）。size は目盛りの幅と奥行き、thick は厚み（絵の画素）、frame は表紙の色の外の黒い縁の割合、
  // leaves は小口の紙の線の数、label は表紙の札
  const BOOK_KIND = {
    album: { size: [34, 26], thick: 8, frame: 0.13, leaves: 2, label: true },
    booklet: { size: [17, 23], thick: 2.6, frame: 0.2, leaves: 0 },
  };
  // 本の置き場（並びの順に使う。on はその番の本の上に重ねる）。本が増えたら、店の設定に1行足すだけでここから順に置かれる
  const BOOK_SLOTS = [{ x: 31, y: 21, rot: -0.12 }, { x: 66, y: 22, rot: -0.06 }, { x: 25, y: 33, rot: 0.42 },
    { x: 30, y: 22, rot: 0.1, on: 0 }, { x: 26, y: 33, rot: 0.3, on: 2 }, { x: 68, y: 21, rot: 0.14, on: 1 }];
  // 店の絵は、店先を出してから読む（店先が最初の画面。開くまでに読む量を減らす）。art で並べ、loadArt で読みはじめる
  const ART = [];
  const art = (src) => {
    const im = new Image();
    ART.push([im, src]);
    return im;
  };
  // 蓄音機とカウンターの上の道具は、絵から画素単位で切り出した物を貼る（素材を作る.py の FRONT_PARTS。置く位置は 切り出し.js）。
  // 多角形だと、まわりの壁まで手前に来て、後ろを通るマスターが壁の形に欠けた。本人 2026-11-08「縁取りをギリギリまで」
  const FRONT_PARTS = Object.entries(FRONT_AT).map(([src, [x, y]]) => ({ im: art(src), x, y }));
  // サイフォンは、奥（サイフォンを消した壁）を背景に焼き、手前に縁だけ（枠・フラスコ）を置いて、中身はその間に今の量で描く
  const SIPHON_BOX = SIPHON_SHAPE.box;
  const siphonImg = {};
  for (const [k, f] of [['back', '奥'], ['frame', '枠'], ['flask', 'フラスコ']]) siphonImg[k] = art(`サイフォン_${f}.png`);
  const ready = (im) => im.complete && im.naturalWidth;
  const JUKE = [[398, 668], [398, 520], [420, 468], [478, 438], [536, 468], [560, 520], [560, 668]];
  // 蓄音機のラッパ（レコードが回ると灯る所）
  const HORN = [[726, 462], [738, 442], [741, 418], [750, 400], [770, 391], [792, 396], [806, 412], [819, 440], [821, 468], [808, 484]];
  const LAMPS = [[860, 275, 40], [475, 284, 44], [800, 427, 34], [1130, 272, 38], [1222, 186, 36]];
  const FLAMES = [[1255, 678], [1298, 697], [1337, 731], [1397, 748], [1470, 750]];
  const ALBUMS = window.ALBUMS;
  // 流す単位は曲（YouTube の動画1本）。ALBUMS[i].tracks の無いアルバムは、アルバム1つ＝曲1つ（yt 1本）として扱う。
  // order（流す並び）は SONGS の番号の並び。曲の中身は流す時に ALBUMS から読む（試す.py が開いた後に yt を外す）
  const SONGS = ALBUMS.flatMap((a, i) => (a.tracks && a.tracks.length ? a.tracks : [null]).map((_, t) => ({ album: i, t })));
  const trackOf = (s) => {
    const a = ALBUMS[s.album];
    return a.tracks && a.tracks.length ? a.tracks[s.t] : { id: a.id, yt: a.yt, title: a.title, short: a.sub };
  };
  const songKey = (j) => `${ALBUMS[SONGS[j].album].id}/${trackOf(SONGS[j]).id}`;
  const albumSongs = (i) => SONGS.map((_, j) => j).filter((j) => SONGS[j].album === i);
  // ジュークボックスと舞台のピアノがかけるのは、medley の（false でない）アルバムの曲だけ。棚の順・曲の順に
  const medleyPool = () => SONGS.map((_, j) => j).filter((j) => ALBUMS[SONGS[j].album].medley !== false);
  // 差し込み（言葉.js の fill）に渡す値。{no} アルバムの番号・{albums} アルバムの数・{title} {sub}・{tracks} 曲の数
  function albumVars(i) {
    const a = ALBUMS[i];
    return { no: i + 1, albums: ALBUMS.length, title: a.title, sub: a.sub, tracks: albumSongs(i).length };
  }
  // 流している曲の値。{k} {n} 並びの何番目と数・{short} {song} 曲の短い題と題・{t} アルバムの中の何曲目
  function songVars(order, k) {
    const s = SONGS[order[k]], tr = trackOf(s);
    return { ...albumVars(s.album), k: k + 1, n: order.length, short: tr.short || tr.title, song: tr.title, t: s.t + 1 };
  }
  // 店先（店先.js）。出ている間は、店を止めておく
  const storefront = window.cafeFront;
  const $ = (s) => document.querySelector(s);
  const PI = Math.PI, TAU = PI * 2;
  const mix = (a, b, u) => a + (b - a) * u;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (u) => u * u * (3 - 2 * u);

  // z は奥の通り道（0）から手前の床（1）まで
  function pathAt(x, z = M.z) {
    let a = PATH[0], b = PATH[PATH.length - 1];
    for (let i = 0; i + 1 < PATH.length; i++) {
      if (x >= PATH[i][0] && x <= PATH[i + 1][0]) {
        a = PATH[i];
        b = PATH[i + 1];
        break;
      }
    }
    const u = clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
    return { y: mix(mix(a[1], b[1], u), FLOOR.y, z), s: mix(mix(a[2], b[2], u), FLOOR.s, z) * P.sizeK * D.k };
  }

  const canvas = $('#c');
  const ctx = canvas.getContext('2d', { alpha: false });
  let S = 1, K = 1, camX = 0, viewW = W, tall = false;
  let back = null, front = null, frontRects = [], nearer = [];
  const bg = art('背景.jpg');
  const sprites = {};

  function bake() {
    const make = () => {
      const cv = document.createElement('canvas');
      cv.width = Math.round(W * K);
      cv.height = Math.round(H * K);
      return cv;
    };
    back = make();
    // 不透明と伝えておくと、毎コマ貼る時に下と混ぜる計算をしない（全面に絵が描いてあるので、見た目は同じ）
    const b = back.getContext('2d', { alpha: false });
    b.drawImage(bg, 0, 0, back.width, back.height);
    b.setTransform(K, 0, 0, K, 0, 0);
    if (ready(siphonImg.back)) b.drawImage(siphonImg.back, SIPHON_BOX[0], SIPHON_BOX[1]);
    // テーブルの本は動かない飾りなので、背景に焼く（毎コマ描かない）
    drawTableBooks(b);
    front = make();
    const f = front.getContext('2d');
    f.setTransform(K, 0, 0, K, 0, 0);
    f.beginPath();
    for (const poly of FRONT) {
      poly.forEach(([x, y], i) => (i ? f.lineTo(x, y) : f.moveTo(x, y)));
      f.closePath();
    }
    f.save();
    f.clip();
    f.drawImage(bg, 0, 0, W, H);
    f.restore();
    for (const p of FRONT_PARTS) {
      if (ready(p.im)) f.drawImage(p.im, p.x, p.y);
    }
    // 手前の層は、物のある所（多角形と切り抜きの外枠）だけを毎コマ貼る（層の残りは透明で、貼っても絵は変わらない。
    // 全面を貼ると、安いスマホで1コマの3分の1を食った 2026-11-12）。枠は画面の画素にそろえ、横の帯に分けて重ならないように
    // する（同じ所へ2回貼ると、物の縁の半透明が濃くなる）
    const boxes = FRONT.map((poly) => [Math.min(...poly.map((p) => p[0])), Math.min(...poly.map((p) => p[1])),
      Math.max(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[1]))]);
    for (const p of FRONT_PARTS) if (ready(p.im)) boxes.push([p.x, p.y, p.x + p.im.naturalWidth, p.y + p.im.naturalHeight]);
    const dev = boxes.map(([x0, y0, x1, y1]) => [Math.max(0, Math.floor(x0 * K) - 2), Math.max(0, Math.floor(y0 * K) - 2),
      Math.min(front.width, Math.ceil(x1 * K) + 2), Math.min(front.height, Math.ceil(y1 * K) + 2)]);
    const ys = [...new Set(dev.flatMap((d) => [d[1], d[3]]))].sort((a, b) => a - b);
    frontRects = [];
    for (let i = 0; i + 1 < ys.length; i++) {
      const y0 = ys[i], y1 = ys[i + 1];
      const spans = dev.filter((d) => d[1] < y1 && d[3] > y0).sort((a, b) => a[0] - b[0]);
      for (const [x0, , x1] of spans) {
        const last = frontRects[frontRects.length - 1];
        if (last && last.y === y0 && x0 <= last.x + last.w) last.w = Math.max(last.w, x1 - last.x);
        else frontRects.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      }
    }
    // 手前の床に出たマスターの上に重ねる物（ソファと床の立て看板）。その形の四角の分だけ
    nearer = FRONT.slice(1).map((poly) => {
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      const x0 = Math.floor(Math.min(...xs)), y0 = Math.floor(Math.min(...ys));
      const cv = document.createElement('canvas');
      cv.width = Math.ceil((Math.max(...xs) - x0) * K) + 1;
      cv.height = Math.ceil((Math.max(...ys) - y0) * K) + 1;
      const g = cv.getContext('2d');
      g.setTransform(K, 0, 0, K, -x0 * K, -y0 * K);
      polyPath(g, poly);
      g.clip();
      g.drawImage(bg, 0, 0, W, H);
      return { cv, x0, y0 };
    });
    bakeLamps();
  }

  // テーブルの目盛り（x 幅・y 奥行き）を絵の座標へ（天板の四隅の間をならす）
  function onTable(x, y) {
    const a = x / TABLE.w, d = y / TABLE.d;
    const fx = mix(TABLE.fl[0], TABLE.fr[0], a), fy = mix(TABLE.fl[1], TABLE.fr[1], a);
    const bx = mix(TABLE.bl[0], TABLE.br[0], a), by = mix(TABLE.bl[1], TABLE.br[1], a);
    return [mix(fx, bx, d), mix(fy, by, d)];
  }
  // テーブルに置く本の形（絵の座標）。表紙の四隅（top）と、下へ伸ばすと見える側面の辺（sides）。描く順は、奥の本から手前へ、
  // 重ねた本はその下の本のすぐ後（手前の本が、奥の本に重ねた本を隠せるように）
  function tableBookShapes() {
    const out = [], z = [], drawn = BOOK_LIST.map((bk, i) => (bk.kind && BOOK_SLOTS[i] ? i : -1)).filter((i) => i >= 0);
    const put = (i) => {
      const bk = BOOK_LIST[i], k = BOOK_KIND[bk.kind] || BOOK_KIND.booklet, s = BOOK_SLOTS[i];
      const base = s.on != null ? z[s.on] || 0 : 0, [w, d] = k.size, h = k.thick, ca = Math.cos(s.rot), sa = Math.sin(s.rot);
      const at = (u, v) => {
        const [x, y] = onTable(s.x + u * ca - v * sa, s.y + u * sa + v * ca);
        return [x, y - base - h];
      };
      const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
      const top = corners.map(([u, v]) => at(u, v));
      // 天板に着いている所（重ねた本は、下の本の上）
      const foot = top.map(([x, y]) => [x, y + h]);
      const cx = top.reduce((a, p) => a + p[0], 0) / 4, cy = top.reduce((a, p) => a + p[1], 0) / 4;
      const sides = [];
      top.forEach((p, j) => {
        const q = top[(j + 1) % 4];
        let nx = p[1] - q[1], ny = q[0] - p[0];
        if (nx * ((p[0] + q[0]) / 2 - cx) + ny * ((p[1] + q[1]) / 2 - cy) < 0) ny = -ny;
        if (ny > 0) sides.push([p, q]);
      });
      z[i] = base + h;
      out.push({ i, kind: bk.kind, color: bk.cover || LABEL[i % LABEL.length], k, top, foot, base, sides, h, at, c: [cx, cy] });
      drawn.filter((j) => BOOK_SLOTS[j].on === i).forEach(put);
    };
    drawn.filter((i) => BOOK_SLOTS[i].on == null).sort((i, j) => BOOK_SLOTS[j].y - BOOK_SLOTS[i].y).forEach(put);
    return out;
  }
  // 影絵の本：黒い本に、表紙の色のセロハンと、灯りの縁（手前の縁の切り込みの線）。側面には小口の紙の線
  function drawTableBooks(c) {
    const path = (pts) => {
      c.beginPath();
      pts.forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
    };
    const toward = (pts, [cx, cy], u) => pts.map(([x, y]) => [mix(x, cx, u), mix(y, cy, u)]);
    c.save();
    c.lineJoin = 'round';
    c.lineCap = 'round';
    for (const bk of tableBookShapes()) {
      const { top, sides, h, k } = bk;
      c.fillStyle = INK;
      for (const [p, q] of sides) {
        path([p, q, [q[0], q[1] + h], [p[0], p[1] + h]]);
        c.fill();
      }
      path(top);
      c.fill();
      c.strokeStyle = 'rgba(244, 223, 180, 0.42)';
      c.lineWidth = 0.8;
      for (const [p, q] of sides) {
        for (let n = 1; n <= k.leaves; n++) {
          const t = (n / (k.leaves + 1)) * h;
          c.beginPath();
          c.moveTo(p[0], p[1] + t);
          c.lineTo(q[0], q[1] + t);
          c.stroke();
        }
      }
      c.globalAlpha = 0.92;
      c.fillStyle = bk.color;
      path(toward(top, bk.c, k.frame));
      c.fill();
      c.globalAlpha = 1;
      const [w, d] = k.size;
      if (k.label) {
        const lab = [[-0.28, -0.12], [0.28, -0.12], [0.28, 0.18], [-0.28, 0.18]].map(([u, v]) => bk.at(u * w, v * d));
        c.fillStyle = INK;
        path(lab);
        c.fill();
        c.fillStyle = 'rgba(244, 223, 180, 0.85)';
        path(toward(lab, [lab.reduce((a, p) => a + p[0], 0) / 4, lab.reduce((a, p) => a + p[1], 0) / 4], 0.3));
        c.fill();
      }
      c.strokeStyle = 'rgba(244, 223, 180, 0.78)';
      c.lineWidth = 1;
      for (const [p, q] of sides) {
        c.beginPath();
        c.moveTo(p[0], p[1]);
        c.lineTo(q[0], q[1]);
        c.stroke();
      }
    }
    c.restore();
  }

  // 灯り（LAMPS）は、色の焼き込み（color-dodge）で明るくなる分を焼いておき、毎コマは今の濃さで足すだけにする（毎コマ掛けると、
  // 安いスマホで1コマの1割を食った 2026-11-12）。color-dodge で明るくなる分は重ねる濃さに比例するので、濃さ1で掛けた絵と背景の
  // 差（difference。焼き込みは暗くしないので差＝明るくなった分）を、濃さ g で足せば（lighter）、毎コマ掛けるのと同じ絵になる
  // （8ビットの丸めの差だけ）。灯りの外は差が0で、何も足さない。絵の画素は読み出さない（ファイルを直接開くと読み出せない）
  let lampPatches = [];
  function bakeLamps() {
    const warm = glowSprite('rgba(255, 170, 90, 1)');
    lampPatches = LAMPS.map(([x, y, r]) => {
      const X0 = (x - r * 1.7) * K, Y0 = (y - r * 1.7) * K, n = r * 3.4 * K;
      const ix = Math.floor(X0), iy = Math.floor(Y0), w = Math.ceil(X0 + n) - ix, h = Math.ceil(Y0 + n) - iy;
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const g = cv.getContext('2d');
      g.drawImage(back, ix, iy, w, h, 0, 0, w, h);
      // 画面で描くのと同じ画素の位置で描く（ix, iy は画素の整数、カメラも画素の整数なので、灯りの絵の拾い方が同じ）
      g.globalCompositeOperation = 'color-dodge';
      g.setTransform(K, 0, 0, K, -ix, -iy);
      g.drawImage(warm, x - r * 1.7, y - r * 1.7, r * 3.4, r * 3.4);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'difference';
      g.drawImage(back, ix, iy, w, h, 0, 0, w, h);
      return { cv, x: ix, y: iy };
    });
  }

  function glowSprite(color) {
    if (sprites[color]) return sprites[color];
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color);
    g.addColorStop(0.45, color.replace(/[\d.]+\)$/, '0.32)'));
    g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return (sprites[color] = cv);
  }

  function ellipseFill(c, x, y, rx, ry, color) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fillStyle = color;
    c.fill();
  }

  function polyPath(c, poly) {
    c.beginPath();
    poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  }

  /* ---------- マスター（鋲でつないだ紙の人形） ---------- */

  const M = {
    x: HOME_X, f: -1, walk: 0, stride: 0, lean: 0, head: 0, sit: 0, play: 0, carry: null, back: false,
    disc: null, discFrom: null, discBack: false, hold: 0, wipe: 0, place: 0, stow: 0, sync: 0,
    front: false, nod: 0, crouch: 0, z: 0, foot: { x: 0, y: 0 },
    near: { x: 0, y: 0, w: 0 }, far: { x: 0, y: 0, w: 0 }, hand: { x: 0, y: 0 }, handF: { x: 0, y: 0 },
    // 前かけのポケット（布と調律の道具をしまう）と目の高さ。毎コマ drawSide が世界の座標で書く
    pocket: { x: 0, y: 0 }, eye: { x: 0, y: 0 },
    // bench はピアノの椅子へ一歩寄って座る間・立って椅子の横へ下がる間（椅子に重なってよい間）。
    // body は脚（腰から靴の先まで）・胴・頭の外枠と腕の点（両腕の肩・肘・手）、box はその全部の外枠、knees は膝（まん中と
    // 太さの半分）。どれも世界の座標で、毎コマ drawSide・drawFront が書く。試す.py が立ち位置を見る
    bench: false, body: null, box: null, knees: null,
  };

  // 人形の体の中の点の並びから、外枠（世界の座標）を出す。toWorld は体の中の座標を世界の座標へ
  function boxOf(pts, toWorld) {
    const w = pts.map(toWorld), xs = w.map((p) => p.x), ys = w.map((p) => p.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  function setBody(legs, torso, head, arms) {
    M.body = { legs, torso, head, arms };
    const all = [legs, torso, head];
    M.box = { x0: Math.min(...all.map((b) => b.x0), ...arms.map((p) => p.x)), x1: Math.max(...all.map((b) => b.x1), ...arms.map((p) => p.x)),
      y0: Math.min(...all.map((b) => b.y0), ...arms.map((p) => p.y)), y1: Math.max(...all.map((b) => b.y1), ...arms.map((p) => p.y)) };
  }

  function ik(a, b, l1, l2, side) {
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const max = l1 + l2 - 0.5;
    if (d > max) {
      dx *= max / d;
      dy *= max / d;
      d = max;
    }
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const mx = a.x + (dx * along) / d, my = a.y + (dy * along) / d;
    return { j: { x: mx + (side * dy * h) / d, y: my - (side * dx * h) / d }, end: { x: a.x + dx, y: a.y + dy } };
  }

  function limb(c, a, b, ra, rb, line) {
    const an = Math.atan2(b.y - a.y, b.x - a.x);
    c.beginPath();
    c.arc(a.x, a.y, ra, an + PI / 2, an - PI / 2);
    c.arc(b.x, b.y, rb, an - PI / 2, an + PI / 2);
    c.closePath();
    c.fill();
    if (line) c.stroke();
  }

  function shoe(c, ank, ground) {
    c.beginPath();
    c.moveTo(ank.x - 13, ank.y - 6);
    c.lineTo(ank.x - 15, ground);
    c.lineTo(ank.x + 44, ground);
    c.quadraticCurveTo(ank.x + 44, ground - 11, ank.x + 22, ground - 15);
    c.lineTo(ank.x + 11, ank.y - 6);
    c.closePath();
    c.fill();
  }

  function footRel(u, A) {
    u = ((u % 1) + 1) % 1;
    if (u < 0.5) return { rel: A * (1 - 4 * u), lift: 0 };
    const v = (u - 0.5) * 2;
    return { rel: -A + 2 * A * smooth(v), lift: 20 * Math.sin(PI * v) };
  }

  // 盤。k は面の見える幅（1＝正面。下の段から抜いた盤は、背だけの細さから回って正面になる）。
  // spine は下の段の袋の背の色：縁だけが見える間、背の帯を描く（回るにつれて薄れる）。px は絵の1画素の大きさ
  function drawDisc(c, x, y, r, i, k = 1, spine = null, px = 1) {
    ellipseFill(c, x, y, r * k, r, INK);
    if (k > 0.3) {
      c.strokeStyle = CUT;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y, r * 0.72 * k, r * 0.72, 0, -0.9, 0.5);
      c.stroke();
    }
    ellipseFill(c, x, y, r * 0.34 * k, r * 0.34, labelOf(i));
    ellipseFill(c, x, y, 2.4 * k, 2.4, INK);
    const a = spine ? clamp(1 - (k - 0.08) / 0.5, 0, 1) : 0;
    if (a > 0) {
      c.globalAlpha = a;
      c.fillStyle = spine;
      c.fillRect(x - 1.1 * px, y - r + 4 * px, 2.2 * px, 2 * r - 5 * px);
      c.globalAlpha = 1;
    }
  }
  // 店の BGM のレコード（アルバムとは別の1枚。ラベルは金）
  const BGM_DISC = 'bgm';
  const labelOf = (i) => (i === BGM_DISC ? '#d9b26a' : LABEL[i % LABEL.length]);

  // 案ごとの部品。胴は腰を原点（上が負）、頭は頭の真ん中を原点、後ろ姿も腰を原点に描く
  function shape(c, color, fn, line) {
    c.fillStyle = color;
    c.beginPath();
    fn();
    c.closePath();
    c.fill();
    if (line) c.stroke();
  }

  function cutLines(c, fn, width = 1.6, alpha = 0.8, color = PALE) {
    c.save();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.globalAlpha = alpha;
    c.beginPath();
    fn();
    c.stroke();
    c.restore();
  }

  function bowTie(c, p, color) {
    shape(c, color, () => {
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + 12, p.y - 7);
      c.lineTo(p.x + 12, p.y + 7);
      c.closePath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x - 10, p.y - 6);
      c.lineTo(p.x - 10, p.y + 6);
    });
  }

  // 胸を張って腰が締まった胴
  function dandyTorso(c, color) {
    shape(c, color, () => {
      c.moveTo(-24, 12);
      c.bezierCurveTo(-27, -30, -34, -100, -28, -146);
      c.bezierCurveTo(-18, -164, 12, -166, 24, -156);
      c.bezierCurveTo(38, -136, 38, -104, 30, -76);
      c.bezierCurveTo(25, -52, 25, -30, 27, -16);
      c.lineTo(29, 14);
    }, true);
  }

  function shirtV(c) {
    shape(c, PALE, () => {
      c.moveTo(8, -158);
      c.lineTo(27, -150);
      c.lineTo(29, -118);
      c.lineTo(17, -104);
    });
  }

  function longApron(c, hip, swing, color) {
    shape(c, color, () => {
      c.moveTo(hip.x - 14, hip.y - 24);
      c.lineTo(hip.x + 28, hip.y - 26);
      c.quadraticCurveTo(hip.x + 36 + swing * 4, hip.y + 60, hip.x + 36 + swing * 8, hip.y + 130);
      c.lineTo(hip.x - 18 + swing * 6, hip.y + 126);
    });
  }

  // 横顔：まっすぐな鼻、しっかりした顎
  function faceProfile(c) {
    shape(c, INK, () => {
      c.moveTo(-12, 44);
      c.lineTo(-12, 30);
      c.bezierCurveTo(-25, 22, -32, 4, -30, -14);
      c.bezierCurveTo(-29, -34, -10, -44, 10, -43);
      c.bezierCurveTo(22, -42, 28, -36, 28, -27);
      c.bezierCurveTo(28, -23, 27, -19, 27, -15);
      c.lineTo(26, -11);
      c.lineTo(35, 3);
      c.bezierCurveTo(36, 5, 34, 7, 30, 7);
      c.lineTo(29, 9);
      c.bezierCurveTo(33, 10, 33, 14, 29, 14);
      c.lineTo(28, 16);
      c.bezierCurveTo(30, 18, 32, 24, 30, 29);
      c.bezierCurveTo(28, 33, 20, 35, 14, 33);
      c.bezierCurveTo(8, 32, 8, 34, 9, 44);
    }, true);
  }

  // 銀髪：前髪を少し立て、えり足はハサミで切った毛先に（丸い縁だとターバンや毛糸の帽子に見えた）
  function silverHair(c) {
    shape(c, '#c0bbab', () => {
      c.moveTo(-4, 6);
      c.bezierCurveTo(-8, -4, -3, -12, 6, -17);
      c.bezierCurveTo(14, -21, 24, -22, 29, -29);
      c.bezierCurveTo(33, -36, 30, -46, 18, -49);
      c.bezierCurveTo(-4, -54, -30, -42, -34, -18);
      c.lineTo(-37, -10);
      c.lineTo(-32, -7);
      c.lineTo(-35, 3);
      c.lineTo(-29, 3);
      c.lineTo(-30, 13);
      c.lineTo(-24, 11);
      c.lineTo(-22, 22);
      c.lineTo(-16, 15);
      c.bezierCurveTo(-12, 12, -8, 9, -4, 6);
    });
    cutLines(c, () => {
      c.moveTo(27, -34);
      c.bezierCurveTo(10, -42, -14, -36, -29, -12);
      c.moveTo(20, -26);
      c.bezierCurveTo(4, -32, -12, -24, -23, 0);
    }, 1.1, 0.45, INK);
  }

  function featureLines(c) {
    cutLines(c, () => {
      // 眉と目
      c.moveTo(11, -14);
      c.lineTo(24, -14);
      c.moveTo(15, -8);
      c.lineTo(22, -8);
      // 耳
      c.moveTo(-10, -6);
      c.quadraticCurveTo(-17, -2, -10, 7);
    }, 1.7, 0.95);
    // 整えたひげ：45度の顔（frontHead）と同じ、銀の口ひげと顎の短いひげ
    shape(c, '#c0bbab', () => {
      c.moveTo(21, 9.5);
      c.quadraticCurveTo(26, 8, 30.5, 8.8);
      c.quadraticCurveTo(32, 11, 29, 12.2);
      c.quadraticCurveTo(25, 11.8, 21, 11.6);
      c.closePath();
      c.moveTo(22, 18.5);
      c.quadraticCurveTo(26, 19, 28.6, 17.5);
      c.bezierCurveTo(30.5, 21, 31, 25, 29.6, 28.5);
      c.bezierCurveTo(27, 31.5, 22, 32.5, 18.5, 32.5);
      c.quadraticCurveTo(18.5, 25, 22, 18.5);
    });
  }

  // 斜め後ろ45度の胴。背中が左、右わきが手前に見える（鍵盤は右奥にある）
  function seatTorso(c, color) {
    shape(c, color, () => {
      c.moveTo(-24, 14);
      c.bezierCurveTo(-25, -18, -23, -46, -29, -80);
      c.bezierCurveTo(-34, -104, -39, -124, -34, -138);
      c.quadraticCurveTo(-28, -150, -10, -152);
      c.lineTo(12, -153);
      c.quadraticCurveTo(28, -150, 32, -136);
      c.bezierCurveTo(35, -116, 30, -96, 25, -74);
      c.bezierCurveTo(22, -50, 26, -18, 28, 14);
    }, true);
    cutLines(c, () => {
      c.moveTo(-8, -146);
      c.bezierCurveTo(-12, -110, -11, -70, -8, -40);
      c.moveTo(16, -126);
      c.bezierCurveTo(18, -96, 14, -60, 17, -38);
    }, 1.4, 0.6);
  }

  function seatApron(c, color) {
    c.fillStyle = color;
    c.fillRect(-25, -40, 52, 7);
    c.beginPath();
    c.ellipse(-17, -36, 9, 5, 0.3, 0, TAU);
    c.ellipse(-3, -36, 9, 5, -0.3, 0, TAU);
    c.fill();
    c.fillRect(-14, -33, 3.5, 22);
    c.fillRect(-7, -33, 3.5, 20);
  }

  // 斜め後ろ45度の頭：耳とほおと鼻先だけが見える
  function seatHead(c) {
    c.save();
    c.translate(7, -188);
    shape(c, PALE, () => {
      c.moveTo(-15, 40);
      c.quadraticCurveTo(0, 47, 15, 38);
      c.lineTo(13, 28);
      c.lineTo(-13, 28);
    });
    shape(c, INK, () => {
      c.moveTo(-12, 38);
      c.bezierCurveTo(-22, 22, -26, 2, -23, -12);
      c.bezierCurveTo(-19, -30, -4, -36, 8, -33);
      c.bezierCurveTo(18, -30, 24, -22, 25, -12);
      c.lineTo(25, -6);
      c.lineTo(30, 3);
      c.lineTo(25, 7);
      c.bezierCurveTo(25, 14, 24, 21, 20, 27);
      c.bezierCurveTo(15, 31, 11, 31, 8, 29);
      c.lineTo(10, 38);
    }, true);
    shape(c, '#c0bbab', () => {
      c.moveTo(9, -35);
      c.bezierCurveTo(-5, -38, -21, -31, -26, -12);
      c.bezierCurveTo(-29, 5, -25, 22, -13, 32);
      c.bezierCurveTo(-8, 20, -3, 10, 1, -1);
      c.bezierCurveTo(5, -10, 14, -16, 23, -20);
      c.bezierCurveTo(21, -28, 15, -33, 9, -35);
    });
    cutLines(c, () => {
      c.moveTo(14, -27);
      c.bezierCurveTo(0, -30, -14, -18, -19, 6);
      c.moveTo(4, -32);
      c.bezierCurveTo(-8, -30, -19, -18, -22, 0);
    }, 1.1, 0.42, INK);
    // 耳と、もみあげから顎へのひげ
    cutLines(c, () => {
      c.ellipse(4, -3, 3.6, 6.5, 0.1, 0, TAU);
      c.moveTo(6, 6);
      c.bezierCurveTo(8, 16, 13, 23, 21, 23);
      c.moveTo(19, -11);
      c.lineTo(25, -11);
    }, 1.6, 0.92);
    c.restore();
  }

  // マスターの姿（本人 2026-11-08「イケオジは銀髪オールバックで」）
  const D = {
    k: 1.04, headK: 0.72, sleeve: PALE, far: '#c6a976', fore: INK, leg: 0.88,
    torso(c) {
      dandyTorso(c, INK);
      shirtV(c);
      // 懐中時計の鎖
      cutLines(c, () => {
        c.moveTo(2, -60);
        c.quadraticCurveTo(14, -48, 24, -62);
      }, 1.6, 1, '#e8b64a');
    },
    head(c) {
      faceProfile(c);
      silverHair(c);
      featureLines(c);
    },
    neck: (c, p) => bowTie(c, p, INK),
    over(c, hip, swing) {
      longApron(c, hip, swing, INK);
      cutLines(c, () => {
        c.moveTo(hip.x + 33, hip.y + 14);
        c.lineTo(hip.x + 33 + swing * 8, hip.y + 126);
      }, 1.6, 0.7);
    },
    seat(c) {
      seatTorso(c, INK);
      seatApron(c, INK);
      cutLines(c, () => {
        c.moveTo(-25, -40);
        c.lineTo(27, -40);
      }, 1.3, 0.7);
      seatHead(c);
    },
  };

  // 手の中で少しよれた白い布（p は人形の中の手の位置）
  function drawCloth(c, p, t, a) {
    c.save();
    c.translate(p.x + 2, p.y + 2);
    c.rotate(0.3 + Math.sin(t * 4.2) * 0.25);
    c.globalAlpha = Math.min(1, a * 2);
    shape(c, PALE, () => {
      c.moveTo(-11, -7);
      c.quadraticCurveTo(0, -11, 12, -6);
      c.lineTo(10, 8);
      c.quadraticCurveTo(-1, 12, -12, 7);
    });
    cutLines(c, () => {
      c.moveTo(-8, -1);
      c.quadraticCurveTo(0, 2, 8, -1);
    }, 1.1, 0.5, INK);
    c.restore();
  }

  // 横向きの歩く姿
  function drawSide(c, t) {
    const path = pathAt(M.x), ms = path.s;
    const s = M.f >= 0 ? 1 : -1;
    const fx = Math.abs(M.f) < 0.08 ? 0.08 * s : M.f;
    const A = 52 * M.stride;
    const bob = 5 * M.stride * Math.abs(Math.sin(M.walk * TAU));
    const breathe = Math.sin(t * 1.5) * 1.2 * (1 - M.stride);
    // かがむ（膝を曲げて腰を下ろす）と、手がカウンターの下まで届く。足はカウンターの陰
    const hipY = -HIP - bob + breathe * 0.4 + M.crouch * 64;
    const hip = { x: 2, y: hipY };
    // 背筋を伸ばす（少しも前かがみにしない）
    const lean = M.lean + M.stride * 0.03;
    const rot = (px, py, a = lean) => ({ x: hip.x + px * Math.cos(a) - py * Math.sin(a), y: hip.y + px * Math.sin(a) + py * Math.cos(a) });
    const swing = Math.sin(M.walk * TAU) * M.stride;

    const local = (p) => ({ x: ((p.x - M.x) * s) / ms, y: (p.y - path.y) / ms });
    const armTarget = (name) => {
      const near = name === 'near';
      let p = near ? { x: 6 + swing * 30, y: hipY + 21 } : { x: 8 - swing * 30, y: hipY + 20 };
      const h = M[name];
      if (h.w > 0) {
        const q = local(h);
        p = { x: mix(p.x, q.x, h.w), y: mix(p.y, q.y, h.w) };
      }
      return p;
    };
    const farArm = ik(rot(6, -146), armTarget('far'), 88, 84, -1);
    const nearArm = ik(rot(-3, -146), armTarget('near'), 88, 84, -1);
    M.hand = { x: M.x + fx * ms * nearArm.end.x, y: path.y + ms * nearArm.end.y };
    M.handF = { x: M.x + fx * ms * farArm.end.x, y: path.y + ms * farArm.end.y };
    M.elbow = { x: M.x + fx * ms * nearArm.j.x, y: path.y + ms * nearArm.j.y, s: ms };
    // 肩・肘・手と顔のまん中（体の中の座標。x が前）。試す.py が、人の体で曲がらない向きに腕が折れていないかを見る
    const hb0 = rot(4, -160), ha = lean * 0.6 + M.head, hk = D.headK;
    M.arms = { f: fx, near: [rot(-3, -146), nearArm.j, nearArm.end], far: [rot(6, -146), farArm.j, farArm.end],
      face: { x: hb0.x + hk * (6 * Math.cos(ha) + 36 * Math.sin(ha)), y: hb0.y + hk * (6 * Math.sin(ha) - 36 * Math.cos(ha)) } };
    // ポケットは前かけの腰の高さ（低いと手が届かない）
    M.pocket = { x: M.x + fx * ms * 26, y: path.y + ms * (hipY + 16) };
    const eye = rot(18, -186);
    M.eye = { x: M.x + fx * ms * eye.x, y: path.y + ms * eye.y };

    const fa = footRel(M.walk, A), fb = footRel(M.walk + 0.5, A);
    const nearAnk = { x: 9 + fa.rel, y: -fa.lift * M.stride - 11 }, farAnk = { x: -7 + fb.rel, y: -fb.lift * M.stride - 11 };
    const hipN = { x: hip.x + 3, y: hip.y + 4 }, hipF = { x: hip.x - 2, y: hip.y + 3 };
    const nearLeg = ik(hipN, nearAnk, 108, 100, 1), farLeg = ik(hipF, farAnk, 108, 100, 1);
    const toW = (p) => ({ x: M.x + fx * ms * p.x, y: path.y + ms * p.y });
    M.knees = [nearLeg.j, farLeg.j].map((p) => ({ ...toW(p), r: ms * 17 * D.leg }));
    // 外枠：靴・膝・胴（形の制御点）・前かけ・頭（形の四隅）・両腕
    const hc = { x: hb0.x + hk * 6 * Math.cos(ha) + hk * 36 * Math.sin(ha), y: hb0.y + hk * 6 * Math.sin(ha) - hk * 36 * Math.cos(ha) };
    const headPts = [[-32, -49], [36, -49], [36, 44], [-32, 44]].map(([px, py]) => ({
      x: hc.x + hk * (px * Math.cos(ha) - py * Math.sin(ha)), y: hc.y + hk * (px * Math.sin(ha) + py * Math.cos(ha)) }));
    setBody(boxOf([...[nearLeg, farLeg].flatMap((l) => [l.end, { x: l.end.x - 15, y: 0 }, { x: l.end.x + 44, y: 0 }, l.j]), hipN, hipF,
      { x: hip.x - 18, y: hip.y + 126 }, { x: hip.x + 36 + swing * 8, y: hip.y + 130 }], toW),
    boxOf([[-24, 12], [-34, -100], [-28, -146], [-18, -164], [12, -166], [38, -136], [38, -104], [29, 14]].map(([px, py]) => rot(px, py)), toW),
    boxOf(headPts, toW), [...M.arms.near, ...M.arms.far].map(toW));

    const world = c.getTransform();
    c.save();
    c.translate(M.x, path.y);
    c.scale(fx * ms, ms);
    c.strokeStyle = CUT;
    c.lineWidth = 2;

    // 奥の腕（と奥の手に持った物）→ 奥の足 → 手前の足 → 胴 → 頭 → 前かけ → 手前の腕
    c.fillStyle = D.far;
    limb(c, rot(6, -146), farArm.j, 11, 9);
    if (D.fore) c.fillStyle = D.fore;
    limb(c, farArm.j, farArm.end, 9, 6.5, true);
    ellipseFill(c, farArm.end.x, farArm.end.y, 8.5, 8.5, INK);
    // 奥の手の布（棚を拭く時）は、奥の手と一緒に体の奥
    if (bar.far === 'cloth') drawCloth(c, farArm.end, t, 1);
    if (bar.far && FAR_BEHIND.has(bar.far)) {
      c.save();
      c.setTransform(world);
      drawHeld(c, bar.far, M.handF, bar.tiltF);
      c.restore();
    }

    c.fillStyle = INK;
    const lk = D.leg;
    limb(c, hipF, farLeg.j, 25 * lk, 17 * lk, true);
    limb(c, farLeg.j, farLeg.end, 17 * lk, 10.5 * lk, true);
    shoe(c, farLeg.end, -fb.lift * M.stride);
    limb(c, hipN, nearLeg.j, 25 * lk, 17 * lk, true);
    limb(c, nearLeg.j, nearLeg.end, 17 * lk, 10.5 * lk, true);
    shoe(c, nearLeg.end, -fa.lift * M.stride);

    c.save();
    c.translate(hip.x, hip.y);
    c.rotate(lean);
    D.torso(c);
    c.restore();

    const hb = rot(4, -160);
    c.save();
    c.translate(hb.x, hb.y);
    c.rotate(lean * 0.6 + M.head);
    c.scale(D.headK, D.headK);
    c.translate(6, -36);
    D.head(c, t);
    c.restore();
    c.strokeStyle = CUT;
    c.lineWidth = 2;

    D.neck(c, rot(23, -156));
    D.over(c, hip, swing);
    c.fillStyle = INK;
    c.fillRect(hip.x - 26, hip.y - 30, 56, 6);

    // 磨くグラス：外側を拭く間は、手前の手（布）の奥に描く。縁の内側を拭く間・運ぶ間は drawCounter が手の前に描く
    if (polished(bar.far) && !work.glassFront) {
      c.save();
      c.setTransform(world);
      drawHeld(c, bar.far, M.handF, bar.tiltF);
      c.restore();
    }

    // 抱えたレコードは胴の前、手前の腕の奥（奥の手は盤の陰で縁を支える）
    if (M.disc && M.carry !== null) {
      const q = local(M.disc);
      drawDisc(c, q.x, q.y, 38, M.carry);
    }
    // 下の段から棚の外へ抜いた盤も、胴の前・手前の腕の奥（棚の中にある間は drawJackets が棚の前に描く）
    if (low.i >= 0 && low.out >= 1) {
      const d0 = lowDisc(), q = local(d0);
      drawDisc(c, q.x, q.y, 38, low.i, d0.k, d0.color, 1 / ms);
    }
    const shoulder = rot(-3, -146);
    c.fillStyle = D.sleeve;
    limb(c, shoulder, nearArm.j, 12, 9.5);
    if (D.fore) c.fillStyle = D.fore;
    limb(c, nearArm.j, nearArm.end, 9.5, 7, true);
    const an = Math.atan2(nearArm.end.y - nearArm.j.y, nearArm.end.x - nearArm.j.x);
    c.save();
    c.translate(nearArm.end.x, nearArm.end.y);
    c.rotate(an);
    c.fillStyle = INK;
    c.fillRect(-11, -8, 6, 16);
    c.beginPath();
    c.ellipse(4, 0, 11, 7.5, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(5, -5, 6.5, 2.8, -0.5, 0, TAU);
    c.fill();
    c.restore();
    // 拭く布（手の中で少しよれた白い布）。グラスを磨く布はポケットから出し入れする（bar.near）
    const cloth = bar.near === 'cloth' ? 1 : M.wipe;
    if (cloth > 0.02) drawCloth(c, nearArm.end, t, cloth);

    const rivet = (p) => ellipseFill(c, p.x, p.y, 2.6, 2.6, PALE);
    rivet(shoulder);
    rivet(nearArm.j);
    rivet(nearLeg.j);
    c.restore();
  }

  // レコードを胸の前で両手に抱える（本人 2026-11-08「身体の前に抱えて、布で拭きながら大事に抱えたほうがいい」）。
  // hold＝棚から胸へ、wipe＝手前の手の布で盤の面を円を描いて拭く、place＝胸から蓄音機の盤へ下ろす
  function holdRecord(t) {
    if (low.i >= 0) lowHands();
    if (!M.disc) return;
    const p = pathAt(M.x), s = p.s, d = M.f >= 0 ? 1 : -1, r = 38 * s;
    const chest = { x: M.x + d * 50 * s, y: p.y - 318 * s };
    // stow＝かがんで、胸から台の下（カウンターの陰）へ
    const under = { x: M.x + d * 40 * s, y: 612 };
    const at = M.place > 0
      ? { x: mix(chest.x, P.platter.x, M.place), y: mix(chest.y, P.platter.y - 3, M.place) }
      : M.stow > 0
        ? { x: mix(chest.x, under.x, M.stow), y: mix(chest.y, under.y, M.stow) }
        : { x: mix(M.discFrom.x, chest.x, M.hold), y: mix(M.discFrom.y, chest.y, M.hold) };
    M.disc.x = at.x;
    M.disc.y = at.y;
    const k = 1 - M.place;
    const rim = { x: d * r * 0.2 * M.hold, y: r * 0.9 * M.hold };
    const wipe = { x: Math.cos(t * 4.2) * r * 0.45, y: Math.sin(t * 4.2) * r * 0.35 };
    M.near.x = at.x + mix(rim.x, wipe.x, M.wipe) * k;
    M.near.y = at.y + mix(rim.y, wipe.y, M.wipe) * k;
    // 奥の手も盤の下の縁に添える（体の側の縁を持たせると、ひじが背中から突き出た）
    M.far.x = at.x - d * r * 0.1 * k * M.hold;
    M.far.y = at.y + r * 0.8 * k * M.hold;
    // 奥の壁の棚から取る盤（discBack）は、奥の手で引き出し、胸へ寄せるにつれて手前の手を添える（手前の手は体より手前で、
    // 奥の棚には届かない 本人 2026-11-09「これも物理法則」）。カウンターの上の蓄音機の盤は、手前の手から
    const back = M.discBack && M.place === 0;
    M.near.w = back ? M.hold : 1;
    M.far.w = M.place > 0 ? 1 - M.place : back ? 1 : M.hold;
  }

  // 下の段から引き出す間の手（奥の壁の棚なので、棚の中の盤に触るのは奥の手だけ）：奥の手の指は盤の上の縁（背の上）にかけ、
  // 棚から出たら手前の手を下の縁に添える。面をこちらへ向けて胸へ寄せるにつれ、両手は胸に抱えた時の所（holdRecord の hold 1）へ
  function lowHands() {
    const q = lowDisc(), d = M.f >= 0 ? 1 : -1, u = smooth(low.turn), r = q.r;
    Object.assign(M.far, { x: q.x - d * r * 0.1 * u, y: q.y + mix(-r - 1, r * 0.8, u), w: 1 });
    Object.assign(M.near, { x: q.x + d * mix(2, r * 0.2, u), y: q.y + mix(r * 0.95, r * 0.9, u), w: low.both });
  }

  // ピアノに向かう姿は斜め後ろ45度（本人 2026-11-08「今の画角なら斜め45度から」）。鍵盤は右奥、椅子は左手前。
  // 大きさは椅子と鍵盤の高さに合わせる。座ると腿は右奥へ短く見え、すねが鍵盤の下へ入る
  function drawSeat(c, t) {
    const path = pathAt(M.x), ms = path.s;
    const fx = Math.max(0.08, Math.abs(M.f));
    const hipY = mix(-HIP, (P.seat.y - path.y) / ms, M.sit);
    const sway = Math.sin(t * 2.3) * 0.03 * M.play;
    const shY = hipY - 146;
    const local = (p) => ({ x: (p.x - M.x) / ms, y: (p.y - path.y) / ms });
    const near = { x: 27, y: shY + 14 }, far = { x: -18, y: shY + 12 };
    const key = (h, rest, wob) => {
      const q = local(h);
      return { x: mix(rest.x, q.x + wob.x, h.w), y: mix(rest.y, q.y + wob.y, h.w) };
    };
    // 上映の演奏は手が鍵盤の上を揺れる。手すきの演奏（M.sync）は、音の時刻どおりに手を置くので揺らさない
    const wob = M.play * (1 - M.sync);
    const lWob = { x: Math.sin(t * 1.7) * 7 * wob, y: Math.abs(Math.sin(t * 6.1)) * 7 * wob };
    const rWob = { x: Math.sin(t * 1.3 + 1) * 11 * wob, y: Math.abs(Math.sin(t * 5.3 + 1)) * 7 * wob };
    const farHand = key(M.far, { x: -24, y: hipY + 20 }, lWob), nearHand = key(M.near, { x: 28, y: hipY + 20 }, rWob);
    const armF = ik(far, farHand, 82, 76, -1), armN = ik(near, nearHand, 82, 76, -1);
    M.hand = { x: M.x + fx * ms * armN.end.x, y: path.y + ms * armN.end.y };
    M.handF = { x: M.x + fx * ms * armF.end.x, y: path.y + ms * armF.end.y };
    // 座った時のポケットは、手前の腿の付け根の前かけ
    M.pocket = { x: M.x + fx * ms * 24, y: path.y + ms * (hipY - 6) };
    M.seated = { hip: path.y + ms * hipY, foot: path.y, head: path.y + ms * (shY - 76), shoulder: path.y + ms * shY, height: ms * (HIP + 146 + 76) };
    M.body = M.box = M.knees = null;

    c.save();
    c.translate(M.x, path.y);
    c.scale(fx * ms, ms);
    c.strokeStyle = CUT;
    c.lineWidth = 2;

    // 足：立つ時は真下、座ると右奥のペダルへ
    const ankF = { x: mix(-6, 104, M.sit), y: mix(-11, -18, M.sit) }, ankN = { x: mix(10, 84, M.sit), y: -11 };
    const hipF = { x: 8, y: hipY + 4 }, hipN = { x: 12, y: hipY + 6 };
    const legF = ik(hipF, ankF, 92, 100, 1), legN = ik(hipN, ankN, 92, 100, 1);
    const lk = D.leg;
    c.fillStyle = INK;
    limb(c, hipF, legF.j, 23 * lk, 16 * lk, true);
    limb(c, legF.j, legF.end, 16 * lk, 10 * lk, true);
    shoe(c, legF.end, ankF.y + 11);

    // 奥の腕は胴の向こうを通り、手だけが右に出る
    c.fillStyle = D.far;
    limb(c, far, armF.j, 11, 9);
    c.fillStyle = D.fore;
    limb(c, armF.j, armF.end, 9, 6.5, true);
    ellipseFill(c, armF.end.x, armF.end.y, 8.5, 6.5, INK);

    c.fillStyle = INK;
    limb(c, hipN, legN.j, 25 * lk, 17 * lk, true);
    limb(c, legN.j, legN.end, 17 * lk, 10.5 * lk, true);
    shoe(c, legN.end, 0);

    c.save();
    c.translate(0, hipY);
    c.rotate(sway);
    D.seat(c);
    c.restore();
    // 腿の上の前かけ
    c.fillStyle = INK;
    c.beginPath();
    c.moveTo(-6, hipY - 30);
    c.lineTo(28, hipY - 30);
    c.quadraticCurveTo(mix(32, 52, M.sit), hipY + 10, legN.j.x + 12, legN.j.y + 4);
    c.lineTo(legN.j.x - 16, legN.j.y + 24);
    c.lineTo(-4, hipY + 24);
    c.closePath();
    c.fill();
    c.stroke();

    // 手前の腕は胴の前
    c.fillStyle = D.sleeve;
    limb(c, near, armN.j, 12, 9.5);
    if (D.fore) c.fillStyle = D.fore;
    limb(c, armN.j, armN.end, 9.5, 7, true);
    ellipseFill(c, armN.end.x, armN.end.y, 8.5, 6.5, INK);

    const rivet = (p) => ellipseFill(c, p.x, p.y, 2.6, 2.6, PALE);
    rivet(near);
    rivet(armN.j);
    rivet(legN.j);
    c.restore();
  }

  // お客の方へ斜め45度に向いた立ち姿（本人 2026-11-08「こちらに斜め45度に向いて会釈」）。
  // M.f が正なら右前を向く：右肩（画面の左）が手前、左肩（画面の右）は胴の陰。会釈は頭を下げて胸を少し沈める
  // u はお辞儀の深さ。頭の形はつぶさない（縦に縮めると、顔がつぶれて見えた 本人 2026-11-08）。
  // 頭が手前へ傾くと、額が短く見えて髪の生え際が下がり、目鼻と鼻先が下へ寄る。傾き自体は drawFront が首を軸に回す
  function frontHead(c, u = 0) {
    const h = 10 * u, f = 6 * u;
    // 頭の形（髪のふくらみを含む）。髪も顔もこの中だけに描く
    const outline = () => {
      c.beginPath();
      c.moveTo(-30, -8);
      c.bezierCurveTo(-33, -36, -12, -50, 8, -48);
      c.bezierCurveTo(25, -46, 34, -32, 33, -14 + f * 0.5);
      c.lineTo(36, -2 + f);
      c.lineTo(39, 8 + f);
      c.lineTo(33, 12 + f);
      c.bezierCurveTo(33, 22, 27, 33, 15, 39);
      c.bezierCurveTo(4, 44, -11, 40, -19, 30);
      c.bezierCurveTo(-27, 21, -31, 8, -30, -8);
      c.closePath();
    };
    c.fillStyle = INK;
    outline();
    c.fill();
    // 銀髪は頭の形で切り抜く（形より大きく描いて上に載せると、かつらがずれたように見えた 本人 2026-11-08）。
    // 額の生え際から後ろへなでつけ、もみあげは耳の前、えり足はハサミで切った毛先に
    c.save();
    outline();
    c.clip();
    shape(c, '#c0bbab', () => {
      c.moveTo(60, -70);
      c.lineTo(60, -27 + h);
      c.lineTo(31, -27 + h);
      c.bezierCurveTo(18, -36 + h, 0, -35 + h * 0.8, -10, -24 + h * 0.5);
      c.bezierCurveTo(-14, -16, -14, -6, -13, 4);
      c.lineTo(-18, 8);
      c.lineTo(-20, 17);
      c.lineTo(-24, 11);
      c.lineTo(-27, 19);
      c.lineTo(-31, 12);
      c.lineTo(-60, 12);
      c.lineTo(-60, -70);
    });
    // なでつけた髪の筋。倒れるほど、生え際から頭のてっぺんへ向かう筋が見える
    cutLines(c, () => {
      c.moveTo(24, -33 + h);
      c.bezierCurveTo(8, -42 + h * 0.5, -14, -38, -26, -16);
      c.moveTo(14, -30 + h);
      c.bezierCurveTo(-2, -34 + h * 0.5, -16, -26, -22, -6);
      if (u > 0.2) {
        c.moveTo(4, -29 + h);
        c.bezierCurveTo(-8, -40 + h * 0.4, -22, -36, -28, -22);
      }
    }, 1.1, 0.45, INK);
    // ひげは髪と同じ銀の形で：整えた口ひげ（端を少し上げる）と、顎の短いひげ。間の黒い所が口に見える。
    // 1本の線で描くと、口ひげはへの字の口に、もみあげから顎への線はあご紐に見えた
    // （本人 2026-11-10「45度正面むいたときのマスターの顔が悲し気ですね」「あごひげが何か別なものに見えます」）
    const fm = f * 0.6;
    shape(c, '#c0bbab', () => {
      c.moveTo(12, 17 + fm);
      c.quadraticCurveTo(17, 12.5 + fm, 23, 13 + fm);
      c.quadraticCurveTo(28, 12 + fm, 32, 15 + fm);
      c.quadraticCurveTo(28, 17.5 + fm, 23, 16.5 + fm);
      c.quadraticCurveTo(17, 18.5 + fm, 12, 17 + fm);
      c.moveTo(13, 25 + fm);
      c.quadraticCurveTo(21, 28 + fm, 30, 23 + fm);
      c.lineTo(40, 30);
      c.lineTo(20, 50);
      c.lineTo(4, 46);
      c.quadraticCurveTo(9, 33, 13, 25 + fm);
    });
    c.restore();
    outline();
    c.stroke();
    // 耳はもみあげの後ろ、髪の上に
    shape(c, INK, () => c.ellipse(-21, 2, 4.6, 8, 0.08, 0, TAU));
    cutLines(c, () => {
      // 眉はゆるい山なり、目は少し上へふくらむ細めた線（眉の内側が上がると、困った顔に見えた）
      c.moveTo(-6, -16 + f);
      c.quadraticCurveTo(1, -19.5 + f, 8, -17.5 + f);
      c.moveTo(16, -17.5 + f);
      c.quadraticCurveTo(21.5, -20 + f, 27, -17 + f);
      c.moveTo(-3, -7 + f);
      c.quadraticCurveTo(2, -9 + f, 7, -7.5 + f);
      c.moveTo(18, -7.5 + f);
      c.quadraticCurveTo(21.5, -9 + f, 25, -7 + f);
      // 鼻筋
      c.moveTo(22, -4 + f);
      c.lineTo(29, 8 + f);
      c.lineTo(25, 10 + f);
      // 耳
      c.moveTo(-19, -5);
      c.quadraticCurveTo(-26, 1, -19, 9);
    }, 1.7, 0.95);
  }

  function drawFront(c, t) {
    const path = pathAt(M.x), ms = path.s;
    const s = M.f >= 0 ? 1 : -1;
    const fx = Math.abs(M.f) < 0.08 ? 0.08 * s : M.f;
    const breathe = Math.sin(t * 1.5) * 1.2;
    const hipY = -HIP + breathe * 0.4;
    // お辞儀は、上体がこちらへ倒れる。影絵の紙は倒せないので、胴を短く少し幅広く（手前に来る）、
    // 肩を下げて少し前へ出し、頭は首を軸に前へ傾ける（本人 2026-11-08「うまく手前に倒れている表現が欲しい」）
    const u = M.nod, sy = 1 - 0.15 * u, sx = 1 + 0.06 * u, fwd = 5 * u;
    const top = (y) => hipY + y * sy;
    const shoulderN = { x: -34 * sx + fwd, y: top(-140) }, shoulderF = { x: 28 * sx + fwd, y: top(-142) };
    const local = (p) => ({ x: ((p.x - M.x) * s) / ms, y: (p.y - path.y) / ms });
    const hand = (h, rest) => (h.w > 0 ? { x: mix(rest.x, local(h).x, h.w), y: mix(rest.y, local(h).y, h.w) } : rest);
    // 肘は下の外側へ曲げる（上へ曲げると、胸に手を当てた時に肘が肩の高さに張り出した）。
    // カウンターの上で両手を使う時（奥の手を伸ばしている時）は、前へ出した前腕が斜めから見て短く見えるので短く描き、
    // 奥の腕の肘も外へ（腕の長さのまま描くと、肘が大きく張り出し、奥の腕が胸を横切って両腕がX字に交差した）
    const fw = M.far.w, farFront = fw > 0.01;
    const armN = ik(shoulderN, hand(M.near, { x: -40, y: hipY + 26 }), mix(86, 74, fw), mix(82, 44, fw), -1);
    const armF = ik(shoulderF, hand(M.far, { x: 36, y: hipY + 24 }), mix(86, 74, fw), mix(82, 44, fw), farFront ? 1 : -1);
    M.hand = { x: M.x + fx * ms * armN.end.x, y: path.y + ms * armN.end.y };
    M.handF = { x: M.x + fx * ms * armF.end.x, y: path.y + ms * armF.end.y };
    // 試す.py が、ひじの先が体の外を向いているかを見る（奥の腕は胴の前に出ている時だけ）
    M.arms = { view: 'front', f: fx, near: [shoulderN, armN.j, armN.end], far: farFront ? [shoulderF, armF.j, armF.end] : null };
    // 外枠（drawSide と同じ）：胴（形の点）・前かけ・靴・頭（形の四隅）・両腕
    const torsoAt = ([px, py]) => ({ x: sx * px - (fwd / 150) * py, y: hipY + sy * py });
    const hr = 0.24 * u, hT = { x: 5 * sx + fwd, y: top(-158) + 4 * u };
    const headAt = ([px, py]) => {
      const qx = D.headK * px, qy = -30 + D.headK * py;
      return { x: hT.x + qx * Math.cos(hr) - qy * Math.sin(hr), y: hT.y + qx * Math.sin(hr) + qy * Math.cos(hr) };
    };
    M.knees = null;
    const toW = (p) => ({ x: M.x + fx * ms * p.x, y: path.y + ms * p.y });
    setBody(boxOf([{ x: 13, y: hipY + 4 }, { x: -11, y: hipY + 4 }, { x: 31, y: hipY + 128 }, { x: -29, y: hipY + 130 },
      ...[[17, 0.94], [-14, 1]].flatMap(([ax, w]) => [{ x: ax + 9 - 17 * w, y: -6 }, { x: ax + 9 + 17 * w, y: -6 }, { x: ax + 9, y: 1 }])], toW),
    boxOf([...[[-26, 14], [-36, -100], [-42, -134], [-40, -152], [-20, -156], [14, -158], [32, -155], [36, -108], [26, 14]].map(torsoAt),
      { x: -25, y: hipY - 28 }], toW),
    boxOf([[-33, -50], [39, -50], [39, 44], [-33, 44]].map(headAt), toW), [shoulderN, armN.j, armN.end, shoulderF, armF.j, armF.end].map(toW));

    c.save();
    c.translate(M.x, path.y);
    c.scale(fx * ms, ms);
    c.strokeStyle = CUT;
    c.lineWidth = 2;
    const lk = D.leg;

    // 奥の腕（胴の陰から手だけが出る）→ 足 → 胴 → 前かけ → 頭 → 手前の腕。
    // カウンターの上で両手を使う時（奥の手を伸ばしている時）は、奥の腕も胴の前に（胴の陰に手が隠れない）
    const farArm = () => {
      c.fillStyle = D.far;
      limb(c, shoulderF, armF.j, 11, 9);
      c.fillStyle = D.fore;
      limb(c, armF.j, armF.end, 9, 6.5, true);
      ellipseFill(c, armF.end.x, armF.end.y, 8, 7, INK);
    };
    if (!farFront) farArm();

    c.fillStyle = INK;
    for (const [hx, ax, w] of [[13, 17, 0.94], [-11, -14, 1]]) {
      limb(c, { x: hx, y: hipY + 4 }, { x: ax, y: -12 }, 24 * lk * w, 12 * lk * w, true);
      c.beginPath();
      c.ellipse(ax + 9, -6, 17 * w, 7, 0.12, 0, TAU);
      c.fill();
    }

    c.save();
    c.translate(0, hipY);
    // 上ほど前へ（肩・頭と同じ向き。逆に傾けると、頭だけが胴から前へずれた）
    c.transform(sx, 0, -fwd / 150, sy, 0, 0);
    shape(c, INK, () => {
      c.moveTo(-26, 14);
      c.bezierCurveTo(-28, -30, -36, -100, -42, -134);
      c.quadraticCurveTo(-40, -152, -20, -156);
      c.lineTo(14, -158);
      c.quadraticCurveTo(32, -155, 35, -138);
      c.bezierCurveTo(36, -108, 27, -70, 24, -30);
      c.lineTo(26, 14);
    }, true);
    // シャツの襟元とベストの釦、懐中時計の鎖
    shape(c, PALE, () => {
      c.moveTo(-9, -157);
      c.lineTo(19, -157);
      c.lineTo(6, -112);
    });
    for (const by of [-100, -84, -68]) ellipseFill(c, 7, by, 2.2, 2.2, PALE);
    cutLines(c, () => {
      c.moveTo(7, -72);
      c.quadraticCurveTo(18, -60, 30, -70);
    }, 1.6, 1, '#e8b64a');
    c.restore();
    bowTie(c, { x: 5 * sx + fwd, y: top(-154) }, INK);
    // 長い前かけ
    shape(c, INK, () => {
      c.moveTo(-25, hipY - 28);
      c.lineTo(25, hipY - 28);
      c.quadraticCurveTo(29, hipY + 60, 31, hipY + 128);
      c.lineTo(-29, hipY + 130);
      c.quadraticCurveTo(-27, hipY + 60, -25, hipY - 28);
    }, true);
    c.fillRect(-27, hipY - 32, 54, 6);

    // 頭は首の付け根を軸に、前（向いている側）へ傾けて少し手前に下ろす。大きさはそのまま
    c.save();
    c.translate(5 * sx + fwd, top(-158) + 4 * u);
    c.rotate(0.24 * u);
    c.translate(0, -30);
    c.scale(D.headK, D.headK);
    frontHead(c, u);
    c.restore();
    c.strokeStyle = CUT;
    c.lineWidth = 2;
    if (farFront) farArm();

    c.fillStyle = D.sleeve;
    limb(c, shoulderN, armN.j, 12, 9.5);
    c.fillStyle = D.fore;
    limb(c, armN.j, armN.end, 9.5, 7, true);
    ellipseFill(c, armN.end.x, armN.end.y, 9, 7.5, INK);
    const rivet = (p) => ellipseFill(c, p.x, p.y, 2.6, 2.6, PALE);
    rivet(shoulderN);
    rivet(armN.j);
    c.restore();
  }

  /* ---------- 動く部品 ---------- */

  // 蓄音機にはいつも BGM のレコードがのっている（本人 2026-11-09「店の BGM はマスターがレコードで鳴らしている」）。
  // arm の u は針の進み（0＝面の始め・1＝面の終わり）、lift は持ち上げた分、held はマスターが持っている間
  const deck = { disc: BGM_DISC, spin: 0, angle: 0 };
  const arm = { u: 0, lift: 0, held: false };
  const armTip = () => ({ x: mix(ARM.out.x, ARM.in.x, arm.u), y: mix(ARM.out.y, ARM.in.y, arm.u) - 6 * arm.lift });
  // 手でつまむのは、針の上の箱
  const armGrip = () => {
    const p = armTip();
    return { x: p.x, y: p.y - 6 };
  };
  const juke = { on: 0, coin: 0 };
  const scene = { dim: 0, bloom: 0, bloomAt: { x: 800, y: 400 }, spot: 0 };
  const smallJackets = ALBUMS.map((a) => art(`小/${encodeURIComponent(a.id)}.jpg`));
  let pop = -1, popU = 0;

  // 棚の上の段（真ん中の柱で2つに分かれている）にジャケットを並べるのは、はじめの UPPER 冊まで。9冊の大きさのまま、増えても
  // 縮めない（本人 2026-11-17：10番目からは真ん中のジャケットを無理に並べない）。数の少ない店は大きく
  const UPPER = 9;
  function jacketBoxes() {
    const L = [824, 947], R = [957, 1104], gap = 3, n = Math.min(ALBUMS.length, UPPER);
    const fits = (w, s) => Math.floor((w + gap) / (s + gap));
    let s = 44;
    while (s > 14 && fits(L[1] - L[0], s) + fits(R[1] - R[0], s) < n) s--;
    const inL = Math.min(fits(L[1] - L[0], s), n);
    return ALBUMS.slice(0, n).map((_, i) => {
      const left = i < inL, col = left ? i : i - inL;
      const room = left ? L : R, count = left ? inL : n - inL;
      const start = room[0] + (room[1] - room[0] - (count * s + (count - 1) * gap)) / 2;
      return { x: start + col * (s + gap), y: 462 - s - (i === pop ? popU * 6 : 0), w: s };
    });
  }

  // UPPER 番目より後（ALBUMS の添字 UPPER から）は、蓄音機の右の下の段に縦に並んだ袋の背（背景の絵）から引き出す（本人 2026-11-17「左下の縦に入れている
  // レコード群から引っ張り出すようなしぐさで」）。背は絵の画素で測った、まっすぐ立った背の x と色。袋は y 475〜517（上に 4 の
  // すき間）。斜めの背と、上の端が蓄音機の切り抜きの裏になる左の背（x 818 より左）は使わない。冊ごとに違う背から
  const LOW = { top: 475, bottom: 517, backs: [[859.8, '#e9b395'], [828.4, '#63aaab'], [871.6, '#7da8b1'], [821.8, '#dfd5c7'],
    [854, '#d95e39'], [876.8, '#eac6b5'], [865.2, '#cec0ae']] };
  const lowBack = (i) => LOW.backs[(i - UPPER) % LOW.backs.length];
  // 引き出している1枚：i は冊（いなければ -1）。lift＝背の上に指をかけて少し引き上げる・out＝手前へ抜く・both＝手前の手を添える・
  // turn＝盤の面をこちらへ向けて胸へ。gap は抜いた後の空いた所の冊（上映から店へ戻った時＝見ていない間に、盤と一緒に戻す）
  const low = { i: -1, lift: 0, out: 0, both: 0, turn: 0, gap: -1 };

  // 引き出している盤の、いまの真ん中・半径・面の見える幅 k（世界の座標）。胸は holdRecord と同じ所
  function lowDisc() {
    const p = pathAt(M.x), s = p.s, d = M.f >= 0 ? 1 : -1, [bx, color] = lowBack(low.i);
    const slot = { x: bx, y: (LOW.top + LOW.bottom) / 2 - 4 * low.lift };
    const out = { x: bx - d * 14, y: slot.y - 2 }, chest = { x: M.x + d * 50 * s, y: p.y - 318 * s };
    const u = smooth(low.turn);
    const x = mix(mix(slot.x, out.x, low.out), chest.x, u), y = mix(mix(slot.y, out.y, low.out), chest.y, u);
    return { x, y, r: 38 * s, k: mix(0.08, 1, u), color };
  }

  function drawJackets(c) {
    jacketBoxes().forEach((b, i) => {
      c.fillStyle = INK;
      c.fillRect(b.x - 1.5, b.y - 1.5, b.w + 3, b.w + 3);
      const im = smallJackets[i];
      if (im.complete && im.naturalWidth) {
        c.drawImage(im, b.x, b.y, b.w, b.w);
      } else {
        c.fillStyle = LABEL[i % LABEL.length];
        c.fillRect(b.x, b.y, b.w, b.w);
      }
    });
    // 下の段の抜いた所は、奥の暗がり。棚から出るまでの盤は、棚の前（マスターの奥の手の奥）に
    const g = low.i >= 0 ? low.i : low.gap;
    if (g >= 0) {
      c.fillStyle = INK;
      c.fillRect(lowBack(g)[0] - 2.5, LOW.top, 5, LOW.bottom - LOW.top);
    }
    if (low.i >= 0 && low.out < 1) {
      const q = lowDisc();
      drawDisc(c, q.x, q.y, q.r, low.i, q.k, q.color);
    }
  }

  // 見ている人の端末の時刻。12時を0度に時計まわり
  function clockAngles() {
    const d = new Date();
    const sec = d.getSeconds(), min = d.getMinutes() + sec / 60, hour = (d.getHours() % 12) + min / 60;
    return { hour: hour * 30, min: min * 6, sec: sec * 6 };
  }

  function drawClock(c, t) {
    // 絵に描かれた針を文字盤の色で隠して、本物の時刻の針を描く
    const { x: fx, y: fy } = P.clock, deg = clockAngles();
    ellipseFill(c, fx, fy, 12.6, 12.6, P.clockFace);
    const hand = (angle, len, width, color) => {
      const a = (angle * PI) / 180;
      c.strokeStyle = color;
      c.lineWidth = width;
      c.beginPath();
      c.moveTo(fx - Math.sin(a) * len * 0.14, fy + Math.cos(a) * len * 0.14);
      c.lineTo(fx + Math.sin(a) * len, fy - Math.cos(a) * len);
      c.stroke();
    };
    hand(deg.hour, 7.6, 2.5, INK);
    hand(deg.min, 11.6, 1.7, INK);
    hand(deg.sec, 12, 0.8, '#c8362f');
    ellipseFill(c, fx, fy, 1.7, 1.7, INK);

    // 振り子の軸は文字盤の中心の少し下（本人 2026-11-08）。棒は窓から見える所だけ。揺れ幅は窓に収まる角度で
    const a = Math.sin(t * PI) * 0.12, top = { x: 1224, y: 376 }, L = 51;
    const bx = top.x + Math.sin(a) * L, by = top.y + Math.cos(a) * L;
    c.fillStyle = INK;
    c.fillRect(1211, 398, 26, 39);
    c.save();
    c.beginPath();
    c.rect(1211, 398, 26, 39);
    c.clip();
    c.strokeStyle = '#e8c58e';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(top.x, top.y);
    c.lineTo(bx, by);
    c.stroke();
    ellipseFill(c, bx, by, 6.5, 6.5, '#e8c58e');
    c.restore();
  }

  // 黒はそのまま、色のセロハンと灯りだけが明るくなる重ね方（color-dodge）
  function drawLights(c, t, px) {
    c.save();
    // 灯りは、焼いておいた明るくなる分（bakeLamps）を今の濃さで足す。画面の画素で貼る
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'lighter';
    lampPatches.forEach((p, i) => {
      c.globalAlpha = 0.16 + Math.sin(t * 0.9 + i * 1.7) * 0.05;
      c.drawImage(p.cv, p.x - px, p.y);
    });
    c.setTransform(K, 0, 0, K, -px, 0);
    c.globalCompositeOperation = 'color-dodge';
    // ジュークボックス：色の波が通る
    c.save();
    polyPath(c, JUKE);
    c.clip();
    const speed = 0.7 + juke.on * 1.6;
    const cols = ['rgba(255, 90, 80, 1)', 'rgba(255, 200, 80, 1)', 'rgba(90, 210, 255, 1)', 'rgba(190, 110, 255, 1)'];
    cols.forEach((col, i) => {
      const a = t * speed + (i * TAU) / cols.length;
      c.globalAlpha = 0.3 + juke.on * 0.3;
      c.drawImage(glowSprite(col), 478 + Math.cos(a) * 62 - 72, 540 + Math.sin(a) * 88 - 72, 144, 144);
    });
    c.restore();
    // 蓄音機のラッパ：レコードが回ると灯る
    if (deck.spin > 0) {
      c.save();
      polyPath(c, HORN);
      c.clip();
      c.globalAlpha = deck.spin * (0.42 + Math.sin(t * 2.6) * 0.14) * (deck.disc === BGM_DISC ? 0.6 : 1);
      c.drawImage(glowSprite('rgba(255, 190, 90, 1)'), 700, 370, 150, 130);
      c.restore();
    }
    c.restore();
    // 足もとの灯りのゆらぎ（まわりの黒も少し照らす）
    c.save();
    c.globalCompositeOperation = 'lighter';
    const warm = glowSprite('rgba(255, 170, 90, 1)');
    FLAMES.forEach(([x, y], i) => {
      c.globalAlpha = 0.2 + Math.sin(t * 7 + i * 2.1) * 0.08 + Math.sin(t * 11.3 + i) * 0.04 + scene.spot * 0.14;
      c.drawImage(warm, x - 24, y - 28, 48, 56);
    });
    c.restore();
  }

  function drawDeck(c) {
    const { x, y } = P.platter;
    // 絵に描かれた腕（箱と管）を盤の暗がりに沈め、今の位置に描き直す
    c.fillStyle = INK;
    c.beginPath();
    c.ellipse(753, 494, 8, 7.5, 0, 0, TAU);
    c.fill();
    c.fillRect(ARM.pivot.x + 3, 488.5, 28, 8);
    // 盤の大きさは絵の盤に合わせる（手前の縁が蓄音機の箱の縁の線にかからない）
    if (deck.disc !== null) {
      ellipseFill(c, x, y, 28, 5, INK);
      c.strokeStyle = CUT;
      c.lineWidth = 1.3;
      c.beginPath();
      c.ellipse(x, y, 20.5, 3.7, 0, deck.angle, deck.angle + 1.1);
      c.stroke();
      c.beginPath();
      c.ellipse(x, y, 20.5, 3.7, 0, deck.angle + PI, deck.angle + PI + 1.1);
      c.stroke();
      ellipseFill(c, x, y, 9.3, 1.8, labelOf(deck.disc));
    }
    // 管は軸から箱まで。箱は針の上
    const tip = armTip(), box = { x: tip.x, y: tip.y - 6 };
    c.lineCap = 'round';
    c.strokeStyle = INK;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(ARM.pivot.x, ARM.pivot.y);
    c.lineTo(box.x, box.y);
    c.stroke();
    c.strokeStyle = SLEEVE;
    c.lineWidth = 3;
    c.stroke();
    c.lineWidth = 1.4;
    c.strokeStyle = INK;
    c.beginPath();
    c.moveTo(tip.x, box.y + 4);
    c.lineTo(tip.x, tip.y);
    c.stroke();
    ellipseFill(c, box.x, box.y, 5.6, 6.6, INK);
    ellipseFill(c, box.x, box.y, 4, 5, SLEEVE);
    ellipseFill(c, box.x, box.y, 1.3, 1.3, INK);
    // 腕をつまむ前腕と指。マスターの体は蓄音機の奥なので、蓄音機の上へ伸ばした前腕から先を、蓄音機の上に描きなおす
    // （手が絵の裏に隠れて、腕がひとりでに動いて見えた）
    if (arm.held && M.near.w > 0.9 && M.elbow && Math.hypot(M.hand.x - box.x, M.hand.y - box.y) < 4) {
      c.fillStyle = INK;
      c.strokeStyle = CUT;
      c.lineWidth = 2 * M.elbow.s;
      limb(c, M.elbow, M.hand, 9.5 * M.elbow.s, 7 * M.elbow.s, true);
      c.save();
      c.translate(M.hand.x + 2, M.hand.y - 2);
      c.rotate(0.5);
      ellipseFill(c, 0, 0, 6, 4, INK);
      ellipseFill(c, -3, 3, 3, 2, INK);
      c.restore();
    }
  }

  // 磨くグラス：列のワイングラス（wglass）と、台の下から出す別の形（g_rocks・g_tall・g_cocktail）
  const polished = (k) => k === 'wglass' || (!!k && k.startsWith('g_'));
  // 磨くグラス（絵のワイングラスの形）。p は脚をつまむ所、足はその 9 下。tilt はつまんだ所を軸に傾ける
  function wineGlass(c, p, tilt = 0, shine = 0) {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(tilt);
    c.translate(0, 9);
    c.beginPath();
    c.moveTo(-8, -40);
    c.bezierCurveTo(-11.5, -33, -11, -22, -2.5, -17);
    c.lineTo(2.5, -17);
    c.bezierCurveTo(11, -22, 11.5, -33, 8, -40);
    c.closePath();
    c.fillStyle = GLASS_TINT;
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = INK;
    c.fillRect(-1.2, -17, 2.4, 15);
    c.fillRect(-6, -2.5, 12, 2.5);
    cutLines(c, () => {
      c.moveTo(-6.5, -35);
      c.quadraticCurveTo(-8, -29, -6, -24);
    }, 1.2, 0.5 + shine * 0.5, '#fffaf0');
    if (shine > 0) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = shine * 0.7;
      c.drawImage(glowSprite('rgba(255, 236, 190, 1)'), -16, -46, 32, 32);
    }
    c.restore();
  }

  // ジュークボックスの上の猫（看板猫）。絵の猫と同じ形で座り、撫でると頭を手に寄せ、ミルクがあれば身をかがめて飲む。
  // ひとりの時は、ときどき寝そべる・伸びをする・前足をなめる（本人 2026-11-09「ただ座っているだけより、時々寝そべったり、
  // 伸びをしたり、足をなめたり」）。drink＝かがむ度合い、nuzzle＝撫でる手に頭を寄せる度合い、tail＝しっぽを立てる度合い、
  // lie・stretch・lick＝それぞれのしぐさの度合い、act はいまのしぐさ、left はその残りの秒
  const cat = { drink: 0, nuzzle: 0, tail: 0, petted: 0, act: 'sit', left: 8, lie: 0, stretch: 0, lick: 0 };
  const dish = { on: false, milk: 0 };
  // 猫の形（前足の先 CAT_B を原点、右が顔の向き、y＝0 がジュークボックスの天板）。影絵の人形のように部品で組む：
  // hip・chest＝腰と胸の楕円（x・y・横・縦・傾き）、back＝腰と胸をつなぐ胴の太さ、hind＝後ろ足（ひざ・足先）、
  // far・near＝前足（肩・足先）、neck＝首の付け根、head＝頭（x・y・傾き）、tail＝しっぽ（根元・2つの曲がり・先・巻いた先）。
  // 輪郭の点を混ぜる作りでは、寝そべりと伸びとその途中で形が溶けた（本人 2026-11-10「猫の形が大きく崩れている」）。
  // 部品の位置を混ぜるので、途中も猫の形のまま動く。天板の平らな所（x −57〜+7）の外へ足を出さない（前は前足が宙に浮いた）。
  // 腰と胸の丸は天板より下まで描いて天板の線で切り、座った時と寝そべった時の底を平らにする。
  // 部品は重ねて塗らず、部品からの距離をなめらかに混ぜて1枚の影にする（catBodyPath）。丸と棒を重ねただけでは、
  // つなぎ目ごとに切れ込みが残り、首がくびれて見えた（本人 2026-11-10「変に首が後ろでくびれている」）
  const CAT_POSES = {
    sit: { hip: [-25, -15, 15.5, 17, 0.12], chest: [-8, -26, 8.5, 15, -0.04], back: 0.95, hind: [-20, -7, -14, -1],
      far: [-7, -20, -5, -1], near: [-3, -20, 0, -1], neck: [-13, -32], head: [-8.5, -50, 0],
      tail: [-40, -6, -49, -12, -46, -24, -47, -36, -53, -39] },
    lie: { hip: [-38, -8, 15, 10, 0], chest: [-12, -9, 10, 10, 0], back: 0.95, hind: [-30, -5, -26, -1],
      far: [-8, -6, 0, -1], near: [-6, -6, 3, -1], neck: [-10, -12], head: [-3, -25, 0.05],
      tail: [-52, -6, -60, -6, -64, -14, -60, -22, -56, -24] },
    stretch: { hip: [-36, -27, 11, 10, -0.3], chest: [-8, -10, 9, 8, 0.3], back: 0.85, hind: [-34, -13, -38, -1],
      far: [-7, -7, 0, -1], near: [-5, -7, 3, -1], neck: [-7, -10], head: [0, -17, 0.1],
      tail: [-45, -31, -52, -40, -48, -52, -52, -60, -57, -58] },
    lick: { hip: [-25, -15, 15.5, 17, 0.12], chest: [-8, -26, 8.5, 15, -0.04], back: 0.95, hind: [-20, -7, -14, -1],
      far: [-7, -20, -5, -1], near: [-2, -26, 7, -33], neck: [-11, -31], head: [-2, -45, 0.28],
      tail: [-40, -6, -49, -12, -46, -24, -47, -36, -53, -39] },
    drink: { hip: [-26, -11, 15, 13, 0.1], chest: [-3, -18, 9, 11, 0.45], back: 0.9, hind: [-20, -6, -14, -1],
      far: [-4, -12, -1, -1], near: [-1, -12, 3, -1], neck: [-1, -15], head: [11, -10, 0.7],
      tail: [-39, -6, -50, -10, -50, -22, -51, -34, -57, -37] },
  };
  function catPose() {
    const d = smooth(clamp(cat.drink, 0, 1));
    const w = { drink: d, lie: smooth(cat.lie), stretch: smooth(cat.stretch), lick: smooth(cat.lick) };
    w.sit = Math.max(0, 1 - w.drink - w.lie - w.stretch - w.lick);
    const sum = w.sit + w.drink + w.lie + w.stretch + w.lick, out = {};
    for (const k of Object.keys(CAT_POSES.sit)) {
      const v = CAT_POSES.sit[k];
      out[k] = Array.isArray(v) ? v.map((_, i) => Object.keys(w).reduce((s, p) => s + CAT_POSES[p][k][i] * w[p], 0) / sum)
        : Object.keys(w).reduce((s, p) => s + CAT_POSES[p][k] * w[p], 0) / sum;
    }
    return out;
  }
  // 猫の体の影：部品（楕円と、太さの変わる棒）からの距離を測り、胴と頭はなめらかに混ぜて（CAT_KT）、足は少しだけ混ぜる（CAT_KL）。
  // 混ぜる幅を広げると耳まで丸く溶け、狭めるとうなじに切れ込みが残った（4・6・9 で比べた）
  const CAT_KT = 6, CAT_KL = 2, CAT_ST = 1;
  const catBody = new Map();
  // 部品ごとの距離の式。部品で決まる値（向き・長さ）は先に求めておく（格子の点ごとに求めると、形の変わる間の猫が
  // 安いスマホで1コマ5ms かかった 2026-11-12）
  function sdEllipse(cx, cy, rx, ry, rot) {
    const co = Math.cos(rot), si = Math.sin(rot), rx2 = rx * rx, ry2 = ry * ry, inside = -Math.min(rx, ry);
    return (px, py) => {
      const x = (px - cx) * co + (py - cy) * si, y = -(px - cx) * si + (py - cy) * co;
      const ax = x / rx, ay = y / ry, bx = x / rx2, by = y / ry2;
      const k0 = Math.sqrt(ax * ax + ay * ay), k1 = Math.sqrt(bx * bx + by * by);
      return k1 < 1e-9 ? inside : (k0 * (k0 - 1)) / k1;
    };
  }
  function sdLimb(a, b, r1, r2) {
    const ax = a.x, ay = a.y, bx = b.x, by = b.y;
    let dx = bx - ax, dy = by - ay;
    const h = Math.hypot(dx, dy);
    if (h < 1e-6 || Math.abs(r1 - r2) >= h) return (px, py) => Math.min(Math.hypot(px - ax, py - ay) - r1, Math.hypot(px - bx, py - by) - r2);
    dx /= h;
    dy /= h;
    const s = (r1 - r2) / h, co = Math.sqrt(1 - s * s), end = co * h;
    return (px, py) => {
      const qy = (px - ax) * dx + (py - ay) * dy, qx = Math.abs((px - ax) * dy - (py - ay) * dx), k = -s * qx + co * qy;
      if (k < 0) return Math.sqrt(qx * qx + qy * qy) - r1;
      if (k > end) return Math.sqrt(qx * qx + (qy - h) * (qy - h)) - r2;
      return qx * co + qy * s - r1;
    };
  }
  function smin(a, b, k) {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  }
  let catTB = new Float64Array(0), catLG = new Float64Array(0);
  function catBodyPath(q, head, hr, nearP) {
    // 部品ごとに、混ぜる幅より遠い所は測らない（測っても境の線は変わらない）
    const parts = [], M = CAT_KT + 1;
    const ell = (cx, cy, rx, ry, rot, leg) => {
      const r = Math.max(rx, ry);
      parts.push({ leg, x0: cx - r, x1: cx + r, y0: cy - r, y1: cy + r, f: sdEllipse(cx, cy, rx, ry, rot) });
    };
    const bar = (a, b, r1, r2, leg) => {
      const r = Math.max(r1, r2);
      parts.push({ leg, x0: Math.min(a.x, b.x) - r, x1: Math.max(a.x, b.x) + r, y0: Math.min(a.y, b.y) - r,
        y1: Math.max(a.y, b.y) + r, f: sdLimb(a, b, r1, r2) });
    };
    const H = { x: q.hip[0], y: q.hip[1] }, C = { x: q.chest[0], y: q.chest[1] }, K = { x: q.hind[0], y: q.hind[1] };
    const F = { x: q.hind[2], y: q.hind[3] }, fp = { x: q.far[2], y: q.far[3] };
    ell(H.x, H.y, q.hip[2], q.hip[3], q.hip[4], false);
    ell(C.x, C.y, q.chest[2], q.chest[3], q.chest[4], false);
    bar(H, C, q.hip[3] * q.back, q.chest[3] * q.back, false);
    bar({ x: q.neck[0], y: q.neck[1] }, head, 10.5, 8.5, false);
    ell(head.x, head.y, 10.5, 10, hr, false);
    bar(H, K, 7, 4.2, true);
    bar(K, F, 3.6, 3, true);
    ell(F.x + 2, F.y - 1.6, 4.4, 2.2, 0, true);
    bar({ x: q.far[0], y: q.far[1] }, fp, 3.8, 2.9, true);
    ell(fp.x + 1.2, fp.y - 1.5, 3.8, 2.1, 0, true);
    bar({ x: q.near[0], y: q.near[1] }, nearP, 4, 3, true);
    ell(nearP.x + 1.2, nearP.y - 1.5, 3.9, 2.2, 0, true);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9;
    for (const p of parts) {
      bx0 = Math.min(bx0, p.x0);
      bx1 = Math.max(bx1, p.x1);
      by0 = Math.min(by0, p.y0);
      p.x0 -= M;
      p.x1 += M;
      p.y0 -= M;
      p.y1 += M;
    }
    // 格子で距離を測り、内側の升を1本の道にする。升の境は距離から割り出すので、角も段も出ない。
    // 格子は CAT_ST の倍数にそろえる（体が動いた時に、境の線がちらつかない）
    const st = CAT_ST, x0 = Math.floor((bx0 - 2) / st) * st, y0 = Math.floor((by0 - 2) / st) * st;
    const nx = Math.ceil((bx1 + 2 - x0) / st) + 1, ny = Math.ceil((1 - y0) / st) + 1, n = nx * ny, v = new Float32Array(n);
    // 部品ごとに、その外枠の中の格子の点だけを測る（点ごとに全部の部品を調べない）。点ごとに混ぜる順は部品の順のまま
    if (catTB.length < n) {
      catTB = new Float64Array(n);
      catLG = new Float64Array(n);
    }
    const tb = catTB.fill(M, 0, n), lg = catLG.fill(M, 0, n);
    for (const p of parts) {
      const i0 = Math.max(0, Math.ceil((p.x0 - x0) / st) - 1), i1 = Math.min(nx - 1, Math.floor((p.x1 - x0) / st) + 1);
      const j0 = Math.max(0, Math.ceil((p.y0 - y0) / st) - 1), j1 = Math.min(ny - 1, Math.floor((p.y1 - y0) / st) + 1);
      for (let j = j0; j <= j1; j++) {
        const y = y0 + j * st;
        if (y < p.y0 || y > p.y1) continue;
        for (let i = i0; i <= i1; i++) {
          const x = x0 + i * st;
          if (x < p.x0 || x > p.x1) continue;
          const k = j * nx + i, d = p.f(x, y);
          if (p.leg) lg[k] = Math.min(lg[k], d);
          else tb[k] = smin(tb[k], d, CAT_KT);
        }
      }
    }
    // 天板（y＝0）より下は切る。座った時と寝そべった時の底が平らになる
    for (let j = 0; j < ny; j++) {
      const y = y0 + j * st;
      for (let i = 0; i < nx; i++) v[j * nx + i] = Math.max(smin(tb[j * nx + i], lg[j * nx + i], CAT_KL), y);
    }
    const path = new Path2D();
    for (let j = 0; j < ny - 1; j++) {
      let run = -1;
      for (let i = 0; i < nx - 1; i++) {
        const a = v[j * nx + i], b = v[j * nx + i + 1], cc = v[(j + 1) * nx + i + 1], dd = v[(j + 1) * nx + i];
        if (a < 0 && b < 0 && cc < 0 && dd < 0) {
          if (run < 0) run = i;
          continue;
        }
        if (run >= 0) {
          path.rect(x0 + run * st, y0 + j * st, (i - run) * st, st);
          run = -1;
        }
        if (a >= 0 && b >= 0 && cc >= 0 && dd >= 0) continue;
        const X = x0 + i * st, Y = y0 + j * st, cs = [[X, Y, a], [X + st, Y, b], [X + st, Y + st, cc], [X, Y + st, dd]];
        let first = true;
        const to = (px, py) => {
          if (first) path.moveTo(px, py);
          else path.lineTo(px, py);
          first = false;
        };
        for (let k = 0; k < 4; k++) {
          const [px, py, pv] = cs[k], [qx, qy, qv] = cs[(k + 1) % 4];
          if (pv < 0) to(px, py);
          if (pv < 0 !== qv < 0) {
            const u = pv / (pv - qv);
            to(px + (qx - px) * u, py + (qy - py) * u);
          }
        }
        path.closePath();
      }
      if (run >= 0) path.rect(x0 + run * st, y0 + j * st, (nx - 1 - run) * st, st);
    }
    return path;
  }
  function drawCat(c, t) {
    const d = smooth(clamp(cat.drink, 0, 1)), n = smooth(clamp(cat.nuzzle, 0, 1)), q = catPose();
    c.save();
    c.translate(CAT_B.x, CAT_B.y);
    c.fillStyle = INK;
    c.strokeStyle = INK;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // しっぽ：根元から立ち上がって、先が左へ巻く。ふだんはゆっくり揺れ、撫でると立って細かく揺れる
    const sw = Math.sin(t * 1.1) * 1.6 + Math.sin(t * 7) * 0.8 * cat.tail, up = cat.tail * 5, T = q.tail;
    c.lineWidth = 4.6;
    c.beginPath();
    c.moveTo(T[0], T[1]);
    c.bezierCurveTo(T[2], T[3], T[4] + sw * 0.4, T[5] - up, T[6] + sw, T[7] - up);
    c.quadraticCurveTo(T[6] + sw - 2, T[7] - up - 6, T[8] + sw * 1.2, T[9] - up);
    c.stroke();
    // なめる時は、上げた前足を小さく動かし、頭も前足に沿って動く。頭は、座ると肩の上、飲む時は皿の上へ。
    // 撫でると手の方へ少し傾けて寄せる。なめる・飲む小さな往復は 0.2 刻み（1画素より細かい）にして、同じ形を使い回す
    const lk = Math.round(Math.sin(t * 8) * 5.5 * smooth(cat.lick)) / 5;
    const nearP = { x: q.near[2], y: q.near[3] + lk * 0.4 };
    const lap = d > 0.95 && dish.milk > 0.03 ? Math.round(Math.sin(t * 9) * 3.5) / 5 : 0;
    const head = { x: q.head[0] + n * 2 + lk * 0.5, y: q.head[1] - n * 2 + lap + lk }, hr = q.head[2] + n * 0.22;
    // 体の影は、形が変わった時だけ作り直す（座っている間・なめる往復の2回目からは、作った影を使い回す）
    const key = [q.hip, q.chest, q.hind, q.far, q.near, q.neck, q.back, head.x, head.y, hr, nearP.y].flat().map((v) => v.toFixed(2)).join();
    let body = catBody.get(key);
    if (!body) {
      body = catBodyPath(q, head, hr, nearP);
      catBody.set(key, body);
      if (catBody.size > 40) catBody.delete(catBody.keys().next().value);
    }
    c.fill(body);
    // 耳は、頭の傾きのまま上に重ねる（影に混ぜると、角が丸まって耳に見えない）
    c.save();
    c.translate(head.x, head.y);
    c.rotate(hr);
    c.beginPath();
    c.moveTo(-10.5, -3);
    c.lineTo(-10, -12.5);
    c.lineTo(-3.5, -8.5);
    c.closePath();
    c.moveTo(1, -9.5);
    c.lineTo(7.5, -15);
    c.lineTo(10, -3.5);
    c.closePath();
    c.fill();
    c.restore();
    c.restore();
    if (dish.on) drawDish(c, DISH, dish.milk);
  }

  // 浅い皿（p は皿の底の真ん中）。ミルクの面は減ると小さくなる。
  // 皿は淡い器の色に黒の縁取り（黒い影絵の皿は、ジュークボックスの天板の黒い縁に溶けて、ミルクの粒しか見えなかった
  // 本人 2026-11-20「もっとしっかりお皿を台の上に置いてないと見えない」）。右の縁は p.x + 9（手で持つ所）
  function drawDish(c, p, milk) {
    c.save();
    c.fillStyle = '#c9d3d8';
    c.strokeStyle = INK;
    c.lineWidth = 1.3;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(p.x - 9, p.y - 4.5);
    c.lineTo(p.x + 9, p.y - 4.5);
    c.lineTo(p.x + 5.5, p.y);
    c.lineTo(p.x - 5.5, p.y);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
    if (milk > 0.02) ellipseFill(c, p.x, p.y - 4.4, 7.4 * (0.45 + 0.55 * milk), 1.5, COLOR.cream);
  }

  // 仕込みのまな板（x はまん中、y は板の底）。のせた物は k（work.kit）：残りのレモン・切った輪切りの数・包丁を置いているか
  function drawBoard(c, x, y, k) {
    c.fillStyle = '#c9a06a';
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    c.beginPath();
    c.rect(x - 24, y - 5, 48, 5);
    c.fill();
    c.stroke();
    // 輪切りは左へ少しずつ重ねて立てかける。残りのレモンは右に、切り口が見える
    for (let i = 0; i < k.slices; i++) {
      ellipseFill(c, x - 6 - i * 2.8, y - 8.4, 3.4, 3.4, '#e2b92e');
      ellipseFill(c, x - 6 - i * 2.8, y - 8.4, 2.3, 2.3, '#f8e690');
    }
    if (k.lemon > 0) {
      const rx = 3 + 7 * k.lemon, cx = x + 18 - rx;
      ellipseFill(c, cx, y - 9.2, rx, 4.2, '#e2b92e');
      if (k.slices) ellipseFill(c, cx - rx + 0.9, y - 9.2, 1.1, 3.6, '#f8e690');
    }
    if (k.knife) drawKnife(c, { x: x - 15, y: y - 2.5 }, -PI / 2);
  }
  // 包丁（p は柄の真ん中をにぎる所。刃は下へ、tilt で回す）
  function drawKnife(c, p, tilt) {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(tilt);
    c.fillStyle = '#5a3a22';
    c.fillRect(-1.7, -5, 3.4, 9);
    c.beginPath();
    c.moveTo(-1.5, 4);
    c.lineTo(2, 4);
    c.lineTo(1.2, 16);
    c.lineTo(-1.5, 14.5);
    c.closePath();
    c.fillStyle = '#ece6da';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 0.9;
    c.stroke();
    c.restore();
  }

  // 猫は自分の時間で動く（マスターの芝居が止められても、途中で固まらない）
  function catTick(dt) {
    const away = M.x > CAT_STAND + 30;
    // 気ままなしぐさ：座る → 寝そべる・前足をなめる・伸び のどれか → 座る。寝そべった後は、起きる時にたいてい伸びをする。
    // マスターがそばに来た時（撫でる・ミルク・ジュークボックス）と、皿にミルクがある時は、起き上がって座る
    const busy = M.x < CAT_STAND + 40 || (dish.on && dish.milk > 0.03) || cat.petted > 0;
    if (busy && cat.act !== 'sit') {
      cat.act = 'sit';
      cat.left = 6;
    }
    cat.left -= dt;
    if (cat.left <= 0 && !busy) {
      if (cat.act === 'sit') {
        const r = Math.random();
        cat.act = r < 0.35 ? 'lie' : r < 0.7 ? 'lick' : 'stretch';
        cat.left = cat.act === 'lie' ? 18 + Math.random() * 20 : cat.act === 'lick' ? 4 + Math.random() * 2 : 3;
      } else if (cat.act === 'lie' && Math.random() < 0.6) {
        cat.act = 'stretch';
        cat.left = 3;
      } else {
        cat.act = 'sit';
        cat.left = 8 + Math.random() * 12;
      }
    }
    for (const k of ['lie', 'stretch', 'lick']) cat[k] += ((cat.act === k ? 1 : 0) - cat[k]) * Math.min(1, dt * 1.6);
    const thirsty = dish.on && dish.milk > 0.03 && away && cat.lie + cat.stretch + cat.lick < 0.15;
    cat.drink = clamp(cat.drink + (thirsty ? 1 : -1) * dt * 0.9, 0, 1);
    if (thirsty && cat.drink > 0.98) dish.milk = Math.max(0, dish.milk - dt * 0.07);
    cat.nuzzle = clamp(cat.nuzzle + (cat.petted > 0 ? 1 : -1) * dt * 2.5, 0, 1);
    cat.petted = Math.max(0, cat.petted - dt);
    cat.tail = clamp(cat.tail + (cat.nuzzle > 0.3 ? 1 : -0.4) * dt * 1.5, 0, 1);
  }

  const motes = (() => {
    let s = 5;
    const r = () => {
      s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6D2B79F5 | 0;
      return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
    const list = [];
    for (let i = 0; i < 16; i++) list.push({ x: 180 + r() * 1200, y: 220 + r() * 420, p: r() * TAU, sp: 0.2 + r() * 0.4, z: 1.2 + r() * 1.6 });
    return list;
  })();

  function drawMotes(c, t) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = 'rgba(255, 196, 110, 0.55)';
    for (const m of motes) {
      c.beginPath();
      c.arc(m.x + Math.sin(t * m.sp + m.p) * 26, m.y + Math.cos(t * m.sp * 0.7 + m.p) * 16, m.z, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  const notes = [];

  function drawNotes(c, dt) {
    if (M.play > 0.5 && notes.length < 8 && Math.random() < dt * 2.4) {
      notes.push({ x: 1370 + Math.random() * 90, y: 540, age: 0, col: LABEL[Math.floor(Math.random() * 6)], p: Math.random() * TAU });
    }
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i];
      n.age += dt;
      if (n.age > 3.2) {
        notes.splice(i, 1);
        continue;
      }
      const x = n.x + Math.sin(n.age * 1.5 + n.p) * 12, y = n.y - n.age * 46;
      c.globalAlpha = smooth(Math.min(1, n.age * 3)) * (1 - smooth(clamp(n.age - 2.2, 0, 1)));
      c.fillStyle = n.col;
      c.strokeStyle = n.col;
      c.lineWidth = 2.4;
      c.beginPath();
      c.ellipse(x, y, 6, 4.5, -0.4, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(x + 5, y - 1);
      c.lineTo(x + 5, y - 21);
      c.quadraticCurveTo(x + 11, y - 16, x + 13, y - 10);
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  /* ---------- 時間の進み ---------- */

  let tasks = [];
  // until があれば、それが真になった時に途中で終わる（手すきの仕事の歩きを、押された時に止める）
  function tween(dur, fn, ease = smooth, until = null) {
    return new Promise((res) => tasks.push({ t: 0, dur, fn, ease, res, until }));
  }
  const wait = (s) => tween(s, () => {});
  // 手すきの仕事（state が idle の間の芝居）は、押した時の芝居よりゆったり（本人 2026-11-09「とにかく落ち着いた動きで
  // 全体の雰囲気を出します」）。動きの長さは 1/IDLE_PACE 倍。押されたら、その時から元の速さ
  const IDLE_PACE = 0.7;

  function tick(dt) {
    for (const k of tasks.slice()) {
      if (k.until && k.until()) {
        tasks.splice(tasks.indexOf(k), 1);
        k.res();
        continue;
      }
      k.t += dt;
      const u = Math.min(1, k.t / k.dur);
      k.fn(k.ease(u));
      if (u >= 1) {
        tasks.splice(tasks.indexOf(k), 1);
        k.res();
      }
    }
  }

  async function turnTo(dir) {
    if (Math.sign(M.f) === dir) return;
    const a = M.f;
    await tween(0.55, (u) => (M.f = mix(a, dir, u)));
  }

  // 横向きとお客へ斜めに向いた姿を、紙の向きを変えるように少し細くなって切りかえる
  async function faceFront(on) {
    if (M.front === on) return;
    const a = Math.sign(M.f) || 1;
    await tween(0.24, (u) => (M.f = mix(a, a * 0.6, u)));
    M.front = on;
    await tween(0.24, (u) => (M.f = mix(a * 0.6, a, u)));
  }

  // 向きを変えずに半歩ずれる（足はカウンターの陰。体が少し上下する）
  async function shuffle(x, dur = 0.9) {
    const from = M.x;
    await tween(dur, (u) => {
      M.x = mix(from, x, u);
      M.walk = u * 0.5;
      M.stride = 0.35 * Math.sin(u * PI);
    });
    M.stride = 0;
    M.walk = 0;
  }

  // speed は1秒に進む量、step は歩幅（大事な物を抱えている時は、ゆっくり小さく）。
  // floor は手前の床を歩く時だけ。ほかは、手前の床にいたら先に奥の通り道へ戻る（カウンターを突き抜けない）
  async function walkTo(x, speed = 78, step = 1, until = null, floor = false) {
    if (M.z > 0 && !floor) await stepIn();
    await faceFront(false);
    const from = M.x, d = Math.abs(x - from);
    if (d < 2) return;
    await turnTo(x > from ? 1 : -1);
    const dur = Math.max(0.7, d / speed);
    let last = from;
    await tween(dur, (u) => {
      M.x = mix(from, x, u);
      M.walk += Math.abs(M.x - last) / (208 * pathAt(M.x).s * step);
      last = M.x;
      M.stride = step * Math.min(1, Math.min(u, 1 - u) * 9);
      if (tall) follow(M.x);
    }, smooth, until);
    M.stride = 0;
    M.walk = 0;
  }

  // カウンターの左の端とソファの間を通って、手前の床へ出る（to 1）・奥の通り道へ戻る（to 0）。まずソファの横をまっすぐ
  // 手前へ（丸イスより手前まで）、それから斜めに。足はカウンターにも丸イスにもかからない（試す.py の through が見る）。
  // 行き先 end は丸イスの所か、ソファの横（SOFA_SIDE）。戻る時は、出た時の行き先から（across）。across は出る前に決めてよい
  // （ソファの横へは、セリフが消えるのを待ってから出る。待つ間も話さない）
  let across = null;
  async function crossAisle(to, end = { x: AISLE.out, z: 1 }) {
    if (to) across = end;
    const e = across || end;
    await turnTo(to ? 1 : -1);
    let lx = M.x, ly = pathAt(M.x).y;
    await tween(1.7 * Math.max(1, e.z), (u) => {
      const v = to ? u : 1 - u;
      M.x = v < 0.5 ? mix(AISLE.in, AISLE.mid, v * 2) : mix(AISLE.mid, e.x, v * 2 - 1);
      M.z = v * e.z;
      const p = pathAt(M.x);
      M.walk += Math.hypot(M.x - lx, p.y - ly) / (208 * p.s);
      lx = M.x;
      ly = p.y;
      M.stride = Math.min(1, Math.min(u, 1 - u) * 8);
      if (tall) follow(M.x);
    }, (u) => u);
    M.stride = 0;
    M.walk = 0;
    if (!to) across = null;
  }
  async function stepIn() {
    if (M.z <= 0) return;
    await walkTo(across.x, 78, 1, null, true);
    await crossAisle(0);
  }

  function reach(name, p, dur = 0.6) {
    const h = M[name], w0 = h.w, x0 = h.x, y0 = h.y;
    if (w0 === 0) {
      h.x = p.x;
      h.y = p.y;
    }
    return tween(dur, (u) => {
      h.w = mix(w0, 1, u);
      if (w0 > 0) {
        h.x = mix(x0, p.x, u);
        h.y = mix(y0, p.y, u);
      }
    });
  }

  function release(name, dur = 0.5) {
    const h = M[name], w0 = h.w;
    return tween(dur, (u) => (h.w = mix(w0, 0, u)));
  }

  function setKey(key, to, dur) {
    const from = M[key];
    return tween(dur, (u) => (M[key] = mix(from, to, u)));
  }

  /* ---------- 押した時の芝居 ---------- */

  const log = [];
  const logEv = (ev, data = {}) => log.push(Object.assign({ ev, hx: M.hand.x, hy: M.hand.y }, data));
  let state = 'idle', pending = null, camGoal = 0, camVel = 0;

  // 読む時間は字の数から（1秒に7字＋眺める間）
  // セリフの行分け。句読点で区切り、1行 LINE_MAX 字より長い句は、まん中に近い「助詞のあとに漢字・カナ・数字」で分けてから、
  // 1行に詰める。幅で折り返すと「メニュ／ー」「1枚／ずつ」、助詞だけで分けると「ありが／とう」と、言葉の途中で折れた。
  // 床の明るい所に収まるのは3行まで（試す.py の say_all）
  const LINE_MAX = 15, WORD = /[一-龥ァ-ヶーA-Za-z0-9]/;
  function splitPhrase(s) {
    if (s.length <= LINE_MAX) return [s];
    let best = -1;
    for (let i = 3; i <= s.length - 3; i++) {
      const a = s[i - 1], b = s[i];
      const ok = ('とでがをにはへもばて'.includes(a) && WORD.test(b)) || (a === 'て' && 'いおく'.includes(b));
      if (ok && (best < 0 || Math.abs(i - s.length / 2) < Math.abs(best - s.length / 2))) best = i;
    }
    return best < 0 ? [s] : [...splitPhrase(s.slice(0, best)), ...splitPhrase(s.slice(best))];
  }
  function sayLines(text) {
    const lines = [];
    let cur = '';
    for (const p of (text.match(/[^、。]+[、。]?/g) || [text]).flatMap(splitPhrase)) {
      if (cur && cur.length + p.length > LINE_MAX) {
        lines.push(cur);
        cur = p;
      } else cur += p;
    }
    lines.push(cur);
    return lines.join('\n');
  }
  const sayFor = (text, sec = 0) => Math.max(sec, 1.4 + text.length / 7);
  function say(text, sec = 0) {
    const el = $('#say');
    el.textContent = sayLines(text);
    el.style.opacity = text ? 1 : 0;
    clearTimeout(say.t);
    if (text) say.t = setTimeout(() => (el.style.opacity = 0), (sayFor(text, sec) * 1000) / FAST);
  }

  // セリフは店の設定の lines（鍵ごとに言葉の並び。手すきの仕事の合間の一言は、していることを読み上げず、お客との自然な会話に 本人 2026-11-09）
  const LINES = CAFE.lines;
  // テーブルの本をすすめるひとこと（店の設定の suggestBook）は、本を置く店だけ、おすすめ（suggest）に混ぜて回す。言う時は glanceBooks
  const BOOK_SUGGEST = (TABLE_BOOKS && LINES.suggestBook) || [];
  if (BOOK_SUGGEST.length) LINES.suggest = [...(LINES.suggest || []), ...BOOK_SUGGEST];
  const lastPick = {};
  function pick(key) {
    const list = LINES[key];
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && i === lastPick[key]) i = (i + 1) % list.length;
    lastPick[key] = i;
    return list[i];
  }

  // 縦の画面のカメラはマスターを追う。見る人が指で左右に動かした後しばらく（lookUntil まで）は、手すきの仕事では戻さない。
  // 押して頼んだ時（start・goHome）は、すぐマスターを追う。panned は、カメラが見る人の置いた所にある間（またマスターを追うまで）。
  // glance は、本をすすめてテーブルへ寄せている間（手すきの間だけ。頼まれたら、すぐマスターを追う）
  let lookUntil = 0, panned = false, glance = null;
  function follow(x) {
    if (clock < lookUntil || (glance && state === 'idle')) return;
    camGoal = clamp(x - viewW / 2, 0, W - viewW);
    panned = false;
  }

  // 上映から店へ戻った時（見ていない間に）、蓄音機は BGM のレコードに戻り、針は止めた所にある
  function resetProps() {
    deck.disc = BGM_DISC;
    deck.spin = 0;
    arm.held = false;
    arm.lift = 0;
    juke.on = 0;
    juke.coin = 0;
    scene.spot = 0;
    M.play = M.sync = 0;
    M.carry = null;
    M.disc = null;
    M.hold = M.wipe = M.place = M.stow = 0;
    M.discBack = false;
    pop = -1;
    // 下の段から抜いた盤も、盤の台が BGM の盤に戻るのと一緒に、元の背の所へ
    Object.assign(low, { i: -1, lift: 0, out: 0, both: 0, turn: 0, gap: -1 });
  }

  // ピアノの椅子の左横（STAGE_STAND）から椅子の前へ一歩寄り、奥のピアノへ向き直る（紙の向きを変えるように、少し細くなって
  // 斜め後ろ45度の姿へ）。寄ってから座るまでと、立って横へ下がるまでは椅子に重なる（M.bench）
  async function toBench() {
    M.bench = true;
    await walkTo(P.seat.x, 40, 0.5);
    await turnTo(1);
    await tween(0.26, (u) => (M.f = mix(1, 0.62, u)));
    M.back = true;
    await tween(0.26, (u) => (M.f = mix(0.62, 1, u)));
    M.bench = false;
  }

  async function standUp() {
    if (!M.back) return;
    M.play = M.sync = 0;
    await Promise.all([release('near', 0.4), release('far', 0.4)]);
    await setKey('sit', 0, 0.8);
    M.bench = true;
    await tween(0.26, (u) => (M.f = mix(1, 0.62, u)));
    M.back = false;
    await tween(0.26, (u) => (M.f = mix(0.62, 1, u)));
    // 立ったら、椅子の前から椅子の左横へ一歩下がる（椅子に重なったまま次の仕事へ向かわない）
    await walkTo(STAGE_STAND, 40, 0.5);
    M.bench = false;
  }

  async function prepare() {
    resetProps();
    M.lean = 0;
    M.head = 0;
    M.stride = 0;
    if (!M.back) {
      M.near.w = 0;
      M.far.w = 0;
    }
    await standUp();
  }

  // 会釈はお客の方へ。機械に向いたまま傾くと、顔を寄せてキスしたように見えた（本人 2026-11-08）。
  // 機械と反対の側へ向き直ってから、お客へ斜め45度に向いて、胸に手を当てて頭を下げる。line は会釈に合わせて言う
  async function bow(machineX, line) {
    await turnTo(M.x > machineX ? 1 : -1);
    await faceFront(true);
    const p = pathAt(M.x);
    log.push({ ev: 'bow', f: Math.sign(M.f), x: M.x, machineX, front: M.front });
    await reach('near', { x: M.x - Math.sign(M.f) * 2 * p.s, y: p.y - 300 * p.s }, 0.5);
    if (line) say(line);
    await setKey('nod', 1, 0.55);
    await wait(0.45);
    await setKey('nod', 0, 0.5);
    await release('near', 0.4);
  }

  async function bloomFrom(p) {
    scene.bloomAt = p;
    // 店が暗くなるのに合わせて、BGM を静かに下げて止める
    bgmStop('album', 1);
    await tween(1.1, (u) => (scene.dim = u));
    await tween(1.15, (u) => (scene.bloom = u));
  }

  function start(text, plan, act) {
    if (state === 'acting' || state === 'mv') {
      if (state === 'acting' && pending) skip();
      return;
    }
    // 上映と、店の上の窓・本の一覧は同時に開かない（窓の裏の物をキーボードで押されても始めない）
    if (!bookEl.hidden || booksOpen()) return;
    // 選び直したら、前の続きは忘れる（頭から流すのは選び直した時だけ）
    if (!plan.resume) dropResume();
    stopGuide();
    lookUntil = 0;
    // メドレーは、押したそのタップで全画面に入る（ブラウザは押した時にしか全画面にできない）
    if (plan.full) enterFull();
    // 手すきの仕事は、持っている物を置いて両手を空けてから（グラスが宙で消えない）
    const halted = haltWork();
    state = 'acting';
    pending = plan;
    document.body.classList.add('busy');
    say(text);
    halted.then(act).then(() => openFirst());
  }

  function skip() {
    tasks = [];
    openFirst();
  }

  function openFirst() {
    if (state !== 'acting' || !pending) return;
    const { order, kind, k = 0, at = 0 } = pending;
    pending = null;
    openPlayer(order, kind, k, at);
  }

  function pressJuke() {
    start(pick('juke'), { order: medleyPool(), kind: 'juke', full: true }, async () => {
      await prepare();
      if (tall) follow(560);
      await walkTo(590);
      await turnTo(-1);
      const p = pathAt(M.x);
      await reach('near', { x: M.x - 14 * p.s, y: p.y - 250 * p.s }, 0.45);
      await reach('near', P.slot, 0.75);
      logEv('coin', { x: P.slot.x, y: P.slot.y });
      await tween(0.6, (u) => (juke.on = u));
      await release('near', 0.45);
      await wait(0.25);
      await bow(P.slot.x, pick('jukeGo'));
      await bloomFrom({ x: 478, y: 540 });
    });
  }

  // 棚から取ってかける時の一言：そのアルバムの一言（店の設定の albums.<id>.go）か、lines の albumAsk（差し込みつき）
  function albumAsk(i) {
    const own = CAFE.albums && CAFE.albums[ALBUMS[i].id];
    const list = own && own.go && own.go.length ? own.go : null;
    return T.fill(list ? list[Math.floor(Math.random() * list.length)] : pick('albumAsk'), albumVars(i));
  }

  // 棚の前に立つ所：取る物（ジャケット・背）の 42 右（右の端の9番目でも同じ。右の端を 1110 で止めて 20 右に立つと、
  // 目の高さのジャケットへ伸ばした奥の手が顔の前を横切った 2026-11-17）。右は体の後ろの端がカウンターの陰に収まる所まで
  const shelfStand = (x) => clamp(x + 42, 846, 1134);

  // 上の段のジャケットから：奥の手でそっと引き出し、両手で胸の前に抱える
  async function fromUpper(i) {
    const b = jacketBoxes()[i], target = { x: b.x + b.w / 2, y: b.y + b.w / 2 };
    await walkTo(shelfStand(target.x));
    await turnTo(-1);
    // 棚は奥の壁なので、奥の手で取る（手前の手は体より手前で届かない）
    await reach('far', target, 0.8);
    logEv('grab', { ...target, hx: M.handF.x, hy: M.handF.y });
    pop = i;
    await tween(0.5, (u) => (popU = u));
    M.carry = i;
    M.discBack = true;
    M.discFrom = { ...target };
    M.disc = { ...target };
    await tween(1.0, (u) => (M.hold = u));
    await tween(0.3, (u) => (popU = 1 - u));
    pop = -1;
  }

  // 下の段の背から（UPPER 番目より後）：奥の手の指を背の上にかけて少し引き上げ、手前へ抜く。棚から出たら手前の手を添えて
  // 両手で持ち、背を一度見てから、盤の面をこちらへ向けて胸に抱える（そこからは上の段の盤と同じ）
  async function fromLower(i) {
    const hook = { x: lowBack(i)[0], y: LOW.top - 1 };
    await walkTo(shelfStand(hook.x));
    await turnTo(-1);
    await reach('far', hook, 0.8);
    logEv('grab', { ...hook, hx: M.handF.x, hy: M.handF.y });
    Object.assign(low, { i, lift: 0, out: 0, both: 0, turn: 0, gap: i });
    await tween(0.6, (u) => (low.lift = u));
    await tween(0.8, (u) => (low.out = u));
    log.push({ ev: 'lowOut' });
    await Promise.all([tween(0.5, (u) => (low.both = u)), setKey('head', -0.14, 0.5)]);
    await wait(0.9);
    await Promise.all([tween(1.0, (u) => (low.turn = u)), setKey('head', 0, 0.9)]);
    // 胸に抱えた盤へ、同じ所・同じ手のまま受け渡す
    const p = pathAt(M.x);
    M.carry = i;
    M.discBack = false;
    M.discFrom = { x: M.x + Math.sign(M.f) * 50 * p.s, y: p.y - 318 * p.s };
    M.disc = { ...M.discFrom };
    M.hold = 1;
    low.i = -1;
  }

  // plan は流す並び（棚の1曲・アルバムの曲を順に・アルバムの中をおまかせ）。どれも、棚から取って蓄音機に置き、針を下ろしてから
  function pressAlbum(i, plan = { order: [albumSongs(i)[0]], kind: 'album' }) {
    start(albumAsk(i), plan, async () => {
      await prepare();
      await takeOffBgm();
      // 棚からそっと引き出し、両手で胸の前に抱える。布でひと拭きしてから、ゆっくり運ぶ
      if (i < UPPER) await fromUpper(i);
      else await fromLower(i);
      log.push({ ev: 'held' });
      await tween(0.35, (u) => (M.wipe = u));
      log.push({ ev: 'wipe' });
      await wait(1.9);
      await tween(0.35, (u) => (M.wipe = 1 - u));
      await walkTo(846, 40, 0.6);
      await turnTo(-1);
      await setKey('lean', 0.1, 0.4);
      await tween(0.9, (u) => (M.place = u));
      logEv('place', { x: P.platter.x, y: P.platter.y });
      M.disc = null;
      M.carry = null;
      M.discBack = false;
      M.hold = 0;
      M.place = 0;
      M.far.w = 0;
      deck.disc = i;
      // 上げておいた腕を、盤の外の縁（面の始め）へ運んで針を下ろす（腕まで手が届くよう、一歩寄る）
      await walkTo(830, 40, 0.5);
      await turnTo(-1);
      await moveArm(0, 0.8);
      logEv('needle', armGrip());
      arm.held = false;
      await tween(0.9, (u) => (deck.spin = u));
      await release('near', 0.5);
      await setKey('lean', 0, 0.4);
      await wait(0.3);
      await bow(P.platter.x, pick('albumGo'));
      await bloomFrom({ x: 770, y: 450 });
    });
  }

  // 舞台のピアノは、ジュークボックスと同じ曲を全部、マスターのおまかせの順で（本人 2026-11-09「全冊をお任せの順で」）。
  // 棚の順と同じになったら混ぜ直す（ジュークボックスと同じ流れにしない）。アルバムの中のおまかせも同じ混ぜ方で
  function masterOrder(pool = medleyPool()) {
    return shuffled(pool.length).map((k) => pool[k]);
  }
  function shuffled(n) {
    for (;;) {
      const o = Array.from({ length: n }, (_, k) => k);
      for (let k = n - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [o[k], o[j]] = [o[j], o[k]];
      }
      if (n < 2 || o.some((v, k) => v !== k)) return o;
    }
  }

  function pressStage() {
    start(pick('stage'), { order: masterOrder(), kind: 'stage', full: true }, async () => {
      await prepare();
      if (tall) follow(1349);
      await walkTo(STAGE_STAND);
      // 座る前に、椅子の左横でお客へ会釈して始まりを告げる
      await bow(P.keysR.x + 60, pick('stageGo'));
      await faceFront(false);
      await toBench();
      await setKey('sit', 1, 0.9);
      await Promise.all([reach('near', P.keysR, 0.6), reach('far', P.keysL, 0.6)]);
      logEv('keys', { x: P.keysR.x, y: P.keysR.y });
      await tween(0.9, (u) => {
        M.play = u;
        scene.spot = u;
      });
      await wait(2.4);
      await bloomFrom({ x: 1380, y: 560 });
    });
  }

  /* ---------- 飲み物（本人 2026-11-08「飲み物によって動きにもバリエーションを」） ---------- */

  // 頼まれた時（ask）と出す時（serve）の言葉は店の設定の drinks
  const DRINKS = CAFE.drinks;
  // 飲み物は蓄音機の右の空いた所（SERVE）で作って出す。右の端は手前に物があって見づらかった（本人 2026-11-08）。
  // マスターは左を向き、注ぐ腕が伸ばせる距離に立つ（器のすぐ右に立つと、傾けた瓶の手が肩の横に来て、ひじが張り出した）。
  // コーヒーだけはサイフォンに手が届く所に立つ
  // サイフォンは絵に描かれた物（中心 x 1025）。マスターはその左に立ち、右を向いて扱い、左を向いて注ぐ。
  // メニューは床の立て看板（x 1150〜1305・y 650〜825）
  const SERVE = { x: 915, y: 535 }, SIPHON = { x: 1025, y: 545 }, MENU = { x: 1228, y: 740 };
  const STAND = { coffee: 985, wine: 990, soda: 990, cocktail: 990 };
  let PREP_X = STAND.wine;
  // 器の中（置いた所から上へ：口の高さ・底の高さ）。注ぐ流れも中身も、この底より下へ行かない
  // （流れを台の近くまで引いて、ワインとカクテルでグラスの足を突き抜けた 本人 2026-11-08）
  const BOWL = { cup: [13, 1], wine: [34, 16], tall: [40, 2], cocktail: [32, 16], rocks: [24, 5] };
  const surfaceOf = (cup) => cup.y - BOWL[cup.kind][1] - (BOWL[cup.kind][0] - BOWL[cup.kind][1]) * cup.fill;
  // 手から注ぎ口まで（フラスコは持つ底から首まで・シェーカーはこし器の先まで）
  const SPOUT = { bottle: 42, soda: 42, spirit: 42, flask: 25, shaker: 33 };
  // 器の口から注ぎ口までのすき間。丸いフラスコは大きく傾けるので、体が器に当たらないよう高く
  const GAP = { flask: 16 };
  // 奥の手に持つ物のうち、体より奥に描く物（器にのせる小物は、器の上に描くので除く）。
  // 前に描くと、奥の手の瓶が手前の腕や胸・顔の前に出た
  const FAR_BEHIND = new Set(['bottle', 'spirit', 'soda', 'cork', 'cap', 'lid']);
  // 台の下（カウンターの陰）。物はここから出し、ここへしまう（宙で現れたり消えたりしない）
  // 台の下は体の前（右を向いてサイフォンを扱う時も）
  const UNDER = () => ({ x: M.x + Math.sign(M.f) * 34, y: 592 });
  // サイフォンは開いた時から「いれる前」（下のフラスコに水・上のロートは空）。brew はお湯がコーヒーになった度合い
  const bar = { cup: null, siphon: { low: 0.8, up: 0, flame: 0, brewTop: 0, brewLow: 0, held: false }, near: null, far: null, tilt: 0, tiltF: 0, drops: [], pour: null,
    aim: null, aimFrom: null, aimU: 0, lid: 'open', ice: 0, scoop: 0, item: null, streams: [] };
  const COLOR = { coffee: '#9a5a26', wine: '#a01d36', soda: '#3dbb68', cocktail: '#f2884e', cream: '#fbf2dc' };

  // カウンターの上の物と、手に持つ物。切り絵の黒い縁に、色のセロハンの中身
  function glassShape(c, kind, x, y, k = 1) {
    c.beginPath();
    if (kind === 'cup') {
      c.moveTo(x - 10 * k, y - 13 * k);
      c.lineTo(x + 10 * k, y - 13 * k);
      c.quadraticCurveTo(x + 9 * k, y - 1, x, y - 1);
      c.quadraticCurveTo(x - 9 * k, y - 1, x - 10 * k, y - 13 * k);
    } else if (kind === 'wine') {
      c.moveTo(x - 8 * k, y - 34 * k);
      c.lineTo(x + 8 * k, y - 34 * k);
      c.quadraticCurveTo(x + 8 * k, y - 18 * k, x, y - 16 * k);
      c.quadraticCurveTo(x - 8 * k, y - 18 * k, x - 8 * k, y - 34 * k);
    } else if (kind === 'tall') {
      c.moveTo(x - 8 * k, y - 40 * k);
      c.lineTo(x + 8 * k, y - 40 * k);
      c.lineTo(x + 6 * k, y - 2);
      c.lineTo(x - 6 * k, y - 2);
    } else if (kind === 'rocks') {
      c.moveTo(x - 11 * k, y - 24 * k);
      c.lineTo(x + 11 * k, y - 24 * k);
      c.lineTo(x + 10 * k, y - 1);
      c.lineTo(x - 10 * k, y - 1);
    } else {
      c.moveTo(x - 14 * k, y - 32 * k);
      c.lineTo(x + 14 * k, y - 32 * k);
      c.lineTo(x, y - 16 * k);
    }
    c.closePath();
  }

  // 中身は、器の形で切り抜いた中を下から u まで塗る
  function liquid(c, kind, x, y, u, color) {
    if (u <= 0) return;
    const [top, bottom] = BOWL[kind].map((d) => y - d);
    c.save();
    glassShape(c, kind, x, y);
    c.clip();
    c.fillStyle = color;
    const h = (bottom - top) * u;
    c.fillRect(x - 16, bottom - h, 32, h + 1);
    c.restore();
  }

  // 氷の i 個目の左上。空のグラスでは底に積み、注ぐと浮かんで液面の下に寄り集まる（一番上の氷が液面から少し出る）
  const ICE = 5;
  function icePos(it, i) {
    const stack = it.y - BOWL.tall[1] - 1 - ICE * (i + 1);
    const float = surfaceOf(it) - 1 + ICE * (it.ice - 1 - i);
    return { x: it.x - 5 + (i % 2) * 4, y: Math.min(stack, float) };
  }

  function drawVessel(c, it, t) {
    const { kind, x, y } = it;
    liquid(c, kind, x, y, it.fill, it.color);
    if (kind === 'tall' && it.ice) {
      c.fillStyle = 'rgba(240, 250, 255, 0.8)';
      for (let i = 0; i < it.ice; i++) {
        const p = icePos(it, i);
        c.fillRect(p.x, p.y, ICE, ICE);
      }
    }
    if (it.bubbles) {
      c.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.6 + i / 4) % 1;
        ellipseFill(c, x - 3 + i * 2, y - 4 - u * 30, 1.1, 1.1, 'rgba(255, 255, 255, 0.75)');
      }
    }
    c.strokeStyle = INK;
    c.lineWidth = 2;
    glassShape(c, kind, x, y);
    c.stroke();
    c.fillStyle = INK;
    if (kind === 'cup') {
      c.fillRect(x - 15, y - 2, 30, 3);
      c.beginPath();
      c.arc(x + 12, y - 9, 4, -1.2, 1.2);
      c.stroke();
    } else if (kind === 'wine' || kind === 'cocktail') {
      c.fillRect(x - 1.2, y - 16, 2.4, 15);
      c.fillRect(x - 7, y - 2, 14, 2.5);
    } else if (kind === 'rocks') {
      c.fillRect(x - 10, y - 5, 20, 4);
    }
    if (it.cream) ellipseFill(c, x, y - 41, 8.5 * it.cream, 6.5 * it.cream, COLOR.cream);
    if (it.cherry) ellipseFill(c, x + 3, y - 48, 3.2, 3.2, '#d8283a');
    if (it.straw) {
      c.strokeStyle = '#e8574a';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x - 2, y - 6);
      c.lineTo(x + 7, y - 54);
      c.stroke();
    }
    if (it.garnish) ellipseFill(c, x + 12, y - 33, 4.5, 4.5, '#f2d24f');
    if (it.steam) {
      c.strokeStyle = 'rgba(90, 58, 34, 0.32)';
      c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i <= 8; i++) {
        const u = i / 8, px = x + Math.sin(u * 5 + t * 1.3) * (1.5 + u * 4), py = y - 16 - u * 30;
        if (i) c.lineTo(px, py);
        else c.moveTo(px, py);
      }
      c.stroke();
    }
  }

  // 絵のサイフォン。中の形は 切り出し.js（ロート・フラスコ）。液面はいつも水平で、形の中の下から割合 u の高さまで
  const GLASS_TINT = 'rgba(255, 247, 229, 0.25)', WATER = [206, 226, 236], BREW = { top: [170, 78, 15], bottom: [121, 32, 0] };
  const FLASK_GRIP = { x: SIPHON_SHAPE.flaskC[0], y: 532 };
  function fillIn(c, pts, u, color) {
    if (u <= 0) return;
    const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]);
    const lo = Math.max(...ys), hi = Math.min(...ys), x0 = Math.min(...xs);
    c.save();
    polyPath(c, pts);
    c.clip();
    c.fillStyle = color;
    c.fillRect(x0 - 1, lo - (lo - hi) * u, Math.max(...xs) - x0 + 2, (lo - hi) * u + 1);
    c.restore();
  }
  const fluid = (s, part) => {
    const u = part === 'top' ? s.brewTop : s.brewLow;
    return `rgba(${WATER.map((w, i) => Math.round(mix(w, BREW[part][i], u))).join(', ')}, 0.95)`;
  };

  // 手前の層の上に：ガラスの中の色 → 中身 → 縁（枠・フラスコ）。後ろを通るマスターは、ガラスの所で透けて見える
  function drawSiphon(c, t) {
    const s = bar.siphon, X = SIPHON.x;
    fillIn(c, SIPHON_SHAPE.bowl, 1, GLASS_TINT);
    fillIn(c, SIPHON_SHAPE.bowl, s.up, fluid(s, 'top'));
    if (s.flame > 0 && s.up > 0.2) {
      c.save();
      polyPath(c, SIPHON_SHAPE.bowl);
      c.clip();
      for (let i = 0; i < 3; i++) ellipseFill(c, X - 4 + i * 4, 498 - ((t * 30 + i * 7) % 19), 1.1, 1.1, 'rgba(255, 255, 255, 0.85)');
      c.restore();
    }
    if (!s.held) {
      fillIn(c, SIPHON_SHAPE.flask, 1, GLASS_TINT);
      fillIn(c, SIPHON_SHAPE.flask, s.low, fluid(s, 'bottom'));
    }
    if (ready(siphonImg.frame)) c.drawImage(siphonImg.frame, SIPHON_BOX[0], SIPHON_BOX[1]);
    if (!s.held && ready(siphonImg.flask)) c.drawImage(siphonImg.flask, SIPHON_BOX[0], SIPHON_BOX[1]);
    if (s.flame > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = s.flame * (0.75 + Math.sin(t * 19) * 0.2);
      c.drawImage(glowSprite('rgba(255, 150, 60, 1)'), X - 9, 522, 18, 18);
      c.restore();
    }
  }

  // 持ったフラスコ：絵のフラスコの縁を、持つ所（底）を手に合わせて傾ける。中身の液面は、傾けても水平のまま
  function drawHeldFlask(c, p, tilt) {
    const s = bar.siphon, co = Math.cos(tilt), si = Math.sin(tilt);
    const pts = SIPHON_SHAPE.flask.map(([x, y]) => {
      const dx = x - FLASK_GRIP.x, dy = y - FLASK_GRIP.y;
      return [p.x + dx * co - dy * si, p.y + dx * si + dy * co];
    });
    fillIn(c, pts, 1, GLASS_TINT);
    fillIn(c, pts, s.low, fluid(s, 'bottom'));
    if (!ready(siphonImg.flask)) return;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(tilt);
    c.drawImage(siphonImg.flask, SIPHON_BOX[0] - FLASK_GRIP.x, SIPHON_BOX[1] - FLASK_GRIP.y);
    c.restore();
  }

  // 手に持つ物（M.hand・M.handF に付いて動く。bar.tilt で傾けて注ぐ）
  function drawHeld(c, kind, p, tilt) {
    if (kind === 'flask') return drawHeldFlask(c, p, tilt);
    // グラス（中身ごと）：足や底を指でつまむ。置いた時と同じ絵
    if (kind === 'glass') return drawVessel(c, { ...bar.item, x: p.x, y: p.y + 8 }, 0);
    if (kind === 'wglass') return wineGlass(c, p, tilt, work.shine);
    // 台の下から出して磨くグラス（形は g_ の後ろ）。底の 8 上をつまみ、つまんだ所を軸に傾ける
    if (kind.startsWith('g_')) {
      const g = kind.slice(2);
      c.save();
      c.translate(p.x, p.y);
      c.rotate(tilt);
      // 黒いベストの前でも形が読めるよう、ワイングラスと同じ淡いガラスの色と、口の縁の光
      glassShape(c, g, 0, 8);
      c.fillStyle = GLASS_TINT;
      c.fill();
      drawVessel(c, { kind: g, fill: 0, x: 0, y: 8 }, 0);
      const w = rimW(kind) - 2, top = 8 - BOWL[g][0] + 1.5;
      cutLines(c, () => {
        c.moveTo(-w, top);
        c.lineTo(w, top);
      }, 1.3, 0.75, '#fffaf0');
      if (work.shine > 0) {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = work.shine * 0.7;
        const h = BOWL[g][0];
        c.drawImage(glowSprite('rgba(255, 236, 190, 1)'), -16, 8 - h * 0.7 - 16, 32, 32);
      }
      c.restore();
      return;
    }
    // 皿は右の縁を持つ（底の真ん中は手の 9 左・2 下）
    if (kind === 'saucer') return drawDish(c, { x: p.x - 9, y: p.y + 2 }, dish.milk);
    if (kind === 'cloth') return;
    // まな板は右の端を持つ（まん中は手の 22 左・底は 3 下）
    if (kind === 'board') return drawBoard(c, p.x - 22, p.y + 3, work.kit);
    if (kind === 'knife') return drawKnife(c, p, tilt);
    c.save();
    c.translate(p.x, p.y);
    c.rotate(tilt);
    c.fillStyle = INK;
    c.strokeStyle = INK;
    c.lineWidth = 2;
    if (kind === 'bottle' || kind === 'soda' || kind === 'spirit') {
      const col = { bottle: '#6e1426', soda: '#2f9a55', spirit: '#d98a2b' }[kind];
      c.fillRect(-6, -30, 12, 32);
      c.fillRect(-2.5, -42, 5, 13);
      c.fillStyle = col;
      c.fillRect(-4, -22, 8, 12);
    } else if (kind === 'paddle') {
      c.fillRect(-1.5, -40, 3, 42);
      c.fillRect(-3.5, -46, 7, 8);
    } else if (kind === 'shaker') {
      // 胴は口が開いたまま（洋酒を受ける）。振る時はこし器とふた、注ぐ時はふただけ外してこし器から
      c.beginPath();
      c.moveTo(-7, 6);
      c.lineTo(-8, -24);
      c.lineTo(8, -24);
      c.lineTo(7, 6);
      c.closePath();
      c.fill();
      if (bar.lid !== 'open') {
        c.beginPath();
        c.moveTo(-8, -24);
        c.lineTo(-3, -32);
        c.lineTo(3, -32);
        c.lineTo(8, -24);
        c.closePath();
        c.fill();
      }
      if (bar.lid === 'cap') c.fillRect(-2.5, -38, 5, 7);
      cutLines(c, () => {
        c.moveTo(-6, -14);
        c.lineTo(6, -14);
      }, 1.2, 0.8);
    } else if (kind === 'scoop') {
      // 柄は右上へ（玉をグラスにのせる時、柄がグラスの中に入らない）
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(3, -10);
      c.lineTo(17, -21);
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -8, 6, PI * 1.05, PI * 1.95);
      c.stroke();
      if (bar.scoop) ellipseFill(c, 0, -8, 7, 6, COLOR.cream);
    } else if (kind === 'ice') {
      // つまんだ氷（残りの数だけ）
      c.fillStyle = 'rgba(240, 250, 255, 0.9)';
      for (let i = 0; i < bar.ice; i++) c.fillRect(-6 + (i % 2) * 6, -7 - Math.floor(i / 2) * 5, ICE, ICE);
    } else if (kind === 'cube') {
      // 落ちていく氷1つ（点は氷の底の真ん中）
      c.fillStyle = 'rgba(240, 250, 255, 0.9)';
      c.fillRect(-ICE / 2, -ICE, ICE, ICE);
    } else if (kind === 'lid') {
      // こし器とふた（下の縁がシェーカーの口に合う）
      c.beginPath();
      c.moveTo(-8, 0);
      c.lineTo(-3, -8);
      c.lineTo(3, -8);
      c.lineTo(8, 0);
      c.closePath();
      c.fill();
      c.fillRect(-2.5, -14, 5, 7);
    } else if (kind === 'cap') {
      c.fillRect(-2.5, -7, 5, 7);
    } else if (kind === 'cherry') {
      ellipseFill(c, 0, -6, 3.2, 3.2, '#d8283a');
    } else if (kind === 'lemon') {
      ellipseFill(c, 0, -6, 4.5, 4.5, '#f2d24f');
    } else if (kind === 'straw') {
      c.strokeStyle = '#e8574a';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(1, -4);
      c.lineTo(-8, 44);
      c.stroke();
    } else if (kind === 'cork') {
      c.fillStyle = '#b98a52';
      c.fillRect(-2.5, -8, 5, 8);
    } else if (kind === 'lever') {
      // 調律のハンマー：握りから左下へ軸、先の口をピンにかぶせる。黒いピアノの上で見えるよう、金物は明るく
      c.strokeStyle = PALE;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-5, 9);
      c.stroke();
      c.fillStyle = PALE;
      c.fillRect(-7, 8, 4, 4);
      c.fillStyle = '#c98f4e';
      c.fillRect(-5, -3, 11, 5);
    }
    c.restore();
  }

  // 注ぎ口の位置（持った物の口を、傾けた分だけ回す）
  function spout(kind, p, tilt) {
    const len = SPOUT[kind] || 30;
    return { x: p.x + Math.sin(tilt) * len, y: p.y - Math.cos(tilt) * len };
  }

  // 注ぐ間は、傾けても口が器の真上に来るように手を動かす（瓶の口とグラスがずれて、液体が斜めに流れた 本人 2026-11-08）
  function aimPour() {
    if (!bar.aim || !bar.near) return;
    const len = SPOUT[bar.near] || 30;
    const h = { x: bar.aim.x - Math.sin(bar.tilt) * len, y: bar.aim.y + Math.cos(bar.tilt) * len };
    M.near.x = mix(bar.aimFrom.x, h.x, bar.aimU);
    M.near.y = mix(bar.aimFrom.y, h.y, bar.aimU);
    M.near.w = 1;
  }

  // 傾き tilt で持った時に、注ぎ口が at に来る手の位置
  const handFor = (kind, at, tilt) => ({ x: at.x - Math.sin(tilt) * SPOUT[kind], y: at.y + Math.cos(tilt) * SPOUT[kind] });

  async function pour(kind, color, amount, dur, tilt) {
    const len = SPOUT[kind];
    const aim = { x: bar.cup.x + 2, y: bar.cup.y - BOWL[bar.cup.kind][0] - (GAP[kind] || 8) };
    // まず器の右上で、まっすぐ持つ。そこから傾けながら、口を器の真上へ
    const from = { x: aim.x + len * 0.75, y: aim.y - len * 0.7 };
    await reach('near', from, 0.6);
    bar.aim = aim;
    bar.aimFrom = from;
    await tween(0.6, (u) => {
      bar.aimU = u;
      bar.tilt = tilt * u;
    });
    await pourInto(kind, color, amount, dur);
    await tween(0.45, (u) => {
      bar.aimU = 1 - u;
      bar.tilt = tilt * (1 - u);
    });
    bar.aim = null;
    bar.aimU = 0;
  }

  // 流れは口から真下の液面まで（口は器の真上に来ている）。描いた流れは bar.streams に残す（試す.py が器と比べる）
  function stream(c, from, to, color, width, into) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.lineTo(from.x, to);
    c.stroke();
    bar.streams.push({ x: from.x, y0: from.y, y1: to, into });
  }

  function drawCounter(c, t) {
    bar.streams = [];
    for (const s of SLOTS) if (s.full) wineGlass(c, { x: s.x, y: s.y - 9 });
    if (work.parked) wineGlass(c, { x: PARK.x, y: PARK.y - 9 });
    if (bar.cup) drawVessel(c, bar.cup, t);
    if (bar.pour && bar.cup) {
      const from = spout(bar.pour, M.hand, bar.tilt);
      stream(c, from, Math.max(from.y + 2, surfaceOf(bar.cup)), bar.pourColor, 2.4, 'cup');
    }
    // 奥の手で傾けた洋酒は、開いたシェーカーの口へ（中は見えないので、口で止める）
    if (bar.far && Math.abs(bar.tiltF) > 2.3 && bar.near === 'shaker' && bar.lid === 'open') {
      const from = spout(bar.far, M.handF, bar.tiltF);
      stream(c, from, M.hand.y - 24, bar.far === 'spirit' ? '#d98a2b' : '#7a1a2c', 2, 'shaker');
    }
    for (const d of bar.drops) drawHeld(c, d.kind, d, 0);
    if (work.board) drawBoard(c, work.board.x, work.board.y, work.kit);
  }

  // マスターが手に持つ物（マスターのすぐ後に描く。手前の床に出ている時は、カウンターの層の上）
  function drawHands(c) {
    const behind = (k) => FAR_BEHIND.has(k) || (polished(k) && !work.glassFront && !M.back && !M.front);
    if (bar.far && !behind(bar.far)) drawHeld(c, bar.far, M.handF, bar.tiltF);
    if (bar.near) drawHeld(c, bar.near, M.hand, bar.tilt);
  }

  function drawMaster(c, t) {
    if (M.back) drawSeat(c, t);
    else if (M.front) drawFront(c, t);
    else drawSide(c, t);
    M.foot = { x: M.x, y: pathAt(M.x).y };
  }

  // 手前の層の上に描く物：サイフォン（中身と縁）
  function drawCounterTop(c, t) {
    drawSiphon(c, t);
  }

  // 手を物へ伸ばす。p は世界の座標
  const dropInto = (kind, from, to) => {
    const d = { kind, x: from.x, y: from.y };
    bar.drops.push(d);
    return tween(0.35, (u) => {
      d.x = mix(from.x, to.x, u);
      d.y = mix(from.y, to.y, u * u);
    }, (u) => u).then(() => bar.drops.splice(bar.drops.indexOf(d), 1));
  };

  async function pourInto(kind, color, amount, dur) {
    bar.pour = kind;
    bar.pourColor = color;
    const f0 = bar.cup.fill, s = bar.siphon, low0 = s.low;
    // フラスコから注いだ分、フラスコの中は減る（口より下に残った分は出ない）
    await tween(dur, (u) => {
      bar.cup.fill = mix(f0, amount, u);
      if (kind === 'flask') s.low = mix(low0, 0.25, u);
    }, (u) => u);
    bar.pour = null;
  }

  // 物は宙から現れず、宙で消えない（本人 2026-11-08「あからさまな物理法則の矛盾は先に解消」）。
  // 台の下（カウンターの陰）でかがんで手に取り、器やシェーカーの右上の空いた所（CLEAR）を通って出す。しまう時も逆の順
  // 胸より下（高いと、持った物がマスターの口元を通って、飲んでいるように見えた）。奥の手はさらに下
  // （奥の手の物は顔より手前に描かれるので、顔の前を通ると、奥にあるはずの物が顔にかぶった）
  const CLEAR = (name = 'near') => ({ x: SERVE.x + 45, y: SERVE.y - (name === 'far' ? 35 : 45) });
  async function fromUnder(name, kind, to, via = CLEAR(name), dur = 0.45) {
    await Promise.all([setKey('crouch', 1, dur), reach(name, UNDER(), dur)]);
    bar[name] = kind;
    logEv('take', { hand: name, kind });
    await Promise.all([setKey('crouch', 0, dur), reach(name, via || to, dur)]);
    if (via) await reach(name, to, dur);
  }
  async function toUnder(name, via = CLEAR(name), dur = 0.45) {
    if (via) await reach(name, via, dur);
    await Promise.all([setKey('crouch', 1, dur), reach(name, UNDER(), dur)]);
    logEv('stow', { hand: name, kind: bar[name] });
    bar[name] = null;
    await Promise.all([setKey('crouch', 0, dur), release(name, dur)]);
  }
  // 手に持った物を、その場に置く（手の位置＝置く所）。置いた物は bar.cup の飾りになる
  async function setDown(name, apply) {
    logEv('setDown', { hand: name, kind: bar[name] });
    bar[name] = null;
    apply();
    await release(name, 0.4);
  }

  // グラスは台の下から出して、空いた所（SERVE）に置く。指は足や底（グラスの底の 8 上）
  async function placeGlass(kind, extra) {
    bar.item = { kind, fill: 0, ...extra };
    await fromUnder('near', 'glass', { x: SERVE.x, y: SERVE.y - 8 });
    await setDown('near', () => {
      bar.cup = { ...bar.item, x: SERVE.x, y: SERVE.y };
      bar.item = null;
    });
  }
  // 前のお客のグラスは、中身ごと少し持ち上げて、そのまま台の下へ下げる（溶けるように消さない。
  // 胸の高さへ持ち上げると、口元を通って飲んでいるように見えた）
  async function clearGlass() {
    const cup = bar.cup;
    await reach('near', { x: cup.x, y: cup.y - 8 }, 0.5);
    bar.item = cup;
    bar.cup = null;
    bar.near = 'glass';
    logEv('take', { hand: 'near', kind: 'glass' });
    await reach('near', { x: cup.x, y: cup.y - 18 }, 0.3);
    await toUnder('near', null);
    bar.item = null;
  }
  // 小さな物を器の上から真下へ下ろして置く（横から入れると、グラスの壁を突き抜けた）
  async function lowerOnto(name, at, apply) {
    await reach(name, { x: at.x, y: at.y - 40 }, 0.45);
    await reach(name, at, 0.35);
    await setDown(name, apply);
  }

  const RECIPES = {
    async coffee() {
      const s = bar.siphon, X = SIPHON.x;
      await placeGlass('cup', { color: COLOR.coffee });
      // サイフォンの左に立ち、右を向いて扱う
      await turnTo(1);
      await reach('far', { x: X - 2, y: 534 }, 0.6);
      await tween(0.4, (u) => (s.flame = u));
      await release('far', 0.4);
      // 湯気の力でお湯が上のロートへ上がる（フラスコの水が減った分だけ）。その間に、右を向いたまま半歩下がる
      // （サイフォンの近くでは体の前に空きがなく、竹べらを持つ手が額の前に来た 本人 2026-11-11「異常な方向へ腕が曲がっている」）
      const low0 = s.low;
      await Promise.all([tween(1.8, (u) => {
        s.low = mix(low0, 0.1, u);
        s.up = mix(0, 0.85, u);
      }), shuffle(STAND.coffee - 30)]);
      // 竹べらは体の前の台の下から出し、スタンドの柱の手前で持ち上げ、上を通ってロートの真上へ、上から入れて粉と混ぜる
      // （ロートの縁やスタンドを突き抜けない。台の下が背中の側にあると、腕が頭の後ろへ回った）
      bar.tilt = PI;
      const lift = [{ x: M.x + 40, y: 490 }, { x: M.x + 40, y: 445 }], over = { x: X - 17, y: 420 };
      await fromUnder('near', 'paddle', lift[1], lift[0]);
      await reach('near', over, 0.35);
      await reach('near', { x: X, y: 420 }, 0.3);
      await reach('near', { x: X, y: 452 }, 0.35);
      const c0 = { ...M.near };
      await tween(2.2, (u) => {
        M.near.x = c0.x + Math.cos(u * TAU * 4) * 3;
        M.near.y = c0.y + Math.sin(u * TAU * 4) * 1.5;
        s.brewTop = Math.min(1, u * 2);
      }, (u) => u);
      await reach('near', { x: X, y: 420 }, 0.35);
      await reach('near', over, 0.3);
      await reach('near', lift[1], 0.35);
      await toUnder('near', lift[0]);
      bar.tilt = 0;
      await shuffle(STAND.coffee);
      await reach('far', { x: X - 2, y: 534 }, 0.5);
      await tween(0.4, (u) => (s.flame = 1 - u));
      await release('far', 0.4);
      // 火を止めると、コーヒーが下のフラスコへ落ちてくる（残っていたお湯と混ざる）
      await tween(1.8, (u) => {
        s.up = mix(0.85, 0, u);
        s.low = mix(0.1, 0.8, u);
        s.brewLow = Math.min(1, u * 5);
      });
      // フラスコを外して、体の前に持ったまま左を向き（手も体と一緒に向こう側の前へ）、空いた所のカップへ。
      // 手をサイフォンに残したまま向きを変えると、腕が背中の側へ回った（2026-11-11）。ロートの下を通る高さで
      const hug = (d) => ({ x: M.x + d * 22, y: 515 });
      await reach('near', FLASK_GRIP, 0.6);
      s.held = true;
      bar.near = 'flask';
      logEv('take', { hand: 'near', kind: 'flask' });
      await reach('near', hug(1), 0.5);
      await Promise.all([turnTo(-1), reach('near', hug(-1), 0.55)]);
      await pour('flask', COLOR.coffee, 0.85, 1.6, -2.0);
      // 残りを捨てて洗い、水を入れ直す（台の下で）。体の前へ持ち上げ、持ったまま右を向いて、サイフォンへ戻す
      await reach('near', CLEAR(), 0.45);
      await Promise.all([setKey('crouch', 1, 0.45), reach('near', UNDER(), 0.45)]);
      s.brewLow = 0;
      s.low = 0.8;
      await Promise.all([setKey('crouch', 0, 0.5), reach('near', hug(-1), 0.5)]);
      await Promise.all([turnTo(1), reach('near', hug(1), 0.55)]);
      await reach('near', FLASK_GRIP, 0.6);
      s.held = false;
      await setDown('near', () => {});
      await turnTo(-1);
      bar.cup.steam = true;
    },
    async wine() {
      await placeGlass('wine', { color: COLOR.wine });
      await fromUnder('near', 'bottle', { x: SERVE.x + 40, y: SERVE.y - 50 });
      // 栓を抜いて、台の下へ
      await reach('far', { x: M.hand.x, y: M.hand.y - 43 }, 0.5);
      bar.far = 'cork';
      logEv('take', { hand: 'far', kind: 'cork' });
      await reach('far', { x: M.hand.x + 8, y: M.hand.y - 70 }, 0.35);
      await toUnder('far');
      await pour('bottle', COLOR.wine, 0.5, 1.7, -1.75);
      await toUnder('near');
    },
    async soda() {
      await placeGlass('tall', { color: COLOR.soda, ice: 0 });
      // 氷を3つ台の下からつまみ、グラスの上から1つずつ落とす（空のグラスでは底に積もる）
      bar.ice = 3;
      await fromUnder('near', 'ice', { x: SERVE.x + 4, y: SERVE.y - 62 });
      for (let i = 0; i < 3; i++) {
        bar.ice--;
        const k = bar.ice, p = icePos({ ...bar.cup, ice: i + 1 }, i);
        const from = { x: M.hand.x - 6 + (k % 2) * 6 + ICE / 2, y: M.hand.y - 7 - Math.floor(k / 2) * 5 + ICE };
        await dropInto('cube', from, { x: p.x + ICE / 2, y: p.y + ICE });
        bar.cup.ice = i + 1;
      }
      bar.near = null;
      await fromUnder('near', 'soda', { x: SERVE.x + 40, y: SERVE.y - 50 });
      await pour('soda', COLOR.soda, 0.86, 1.5, -1.7);
      await toUnder('near');
      // アイスは、すくった玉がグラスの上（玉の中心＝のせる所）に来てから離す
      bar.scoop = 1;
      await fromUnder('near', 'scoop', { x: SERVE.x, y: SERVE.y - 75 });
      await reach('near', { x: SERVE.x, y: SERVE.y - 33 }, 0.45);
      bar.cup.cream = 1;
      bar.scoop = 0;
      await reach('near', { x: SERVE.x, y: SERVE.y - 75 }, 0.4);
      await toUnder('near');
      await fromUnder('far', 'cherry', { x: SERVE.x + 3, y: SERVE.y - 90 });
      await lowerOnto('far', { x: SERVE.x + 3, y: SERVE.y - 42 }, () => (bar.cup.cherry = 1));
      // ストローは長いので、グラスの右をまっすぐ上げてから口の上へ（斜めに運ぶと、下の端がグラスの壁を横切った）
      await fromUnder('far', 'straw', { x: SERVE.x + 6, y: SERVE.y - 100 }, { x: SERVE.x + 35, y: SERVE.y - 105 });
      await lowerOnto('far', { x: SERVE.x + 6, y: SERVE.y - 50 }, () => (bar.cup.straw = 1));
      bar.cup.bubbles = true;
    },
    async cocktail() {
      await placeGlass('cocktail', { color: COLOR.cocktail });
      // シェーカーを台の下から出し、グラスのすぐ右で持つ（黒い胴に重なると見えなかった・グラスに重ねない・
      // 体に近いと、奥の手で傾けた瓶が顔にかぶった）
      bar.lid = 'open';
      await fromUnder('near', 'shaker', { x: SERVE.x + 26, y: SERVE.y - 32 }, null);
      // 洋酒を2本、ほぼ逆さに傾けて、口が開いたシェーカーの口の真上に来る所で注ぐ。
      // 瓶はシェーカーの左（グラスの上の空いた所）から傾ける（右から傾けると、奥の手の瓶が顔にかかった）
      for (const kind of ['spirit', 'bottle']) {
        await fromUnder('far', kind, handFor(kind, { x: M.hand.x, y: M.hand.y - 34 }, 2.6));
        await tween(0.35, (u) => (bar.tiltF = 2.6 * u));
        await wait(0.6);
        await tween(0.3, (u) => (bar.tiltF = 2.6 * (1 - u)));
        await toUnder('far');
      }
      // こし器とふたを口にかぶせ、両手で持って肩の高さで振る（奥の手はふたを押さえたまま）
      // ふたはグラスの上の空いた所を通して口へ（体の側を通すと、奥の手のふたが顔にかぶった）
      await fromUnder('far', 'lid', { x: M.hand.x - 25, y: M.hand.y - 50 });
      await reach('far', { x: M.hand.x, y: M.hand.y - 24 }, 0.45);
      logEv('setDown', { hand: 'far', kind: 'lid' });
      bar.far = null;
      bar.lid = 'cap';
      await Promise.all([reach('near', { x: PREP_X - 40, y: 440 }, 0.6), reach('far', { x: PREP_X - 40, y: 440 - 30 }, 0.6)]);
      const n0 = { ...M.near }, f0 = { ...M.far };
      await tween(2.4, (u) => {
        const w = Math.sin(u * TAU * 9) * 13;
        M.near.x = n0.x + w * 0.6;
        M.near.y = n0.y + w;
        M.far.x = f0.x + w * 0.6;
        M.far.y = f0.y + w;
      }, (u) => u);
      // 小さなふただけ外して台の下へ。こし器から注ぐ
      await reach('far', { x: M.hand.x, y: M.hand.y - 31 }, 0.3);
      bar.lid = 'strainer';
      bar.far = 'cap';
      logEv('take', { hand: 'far', kind: 'cap' });
      await reach('far', { x: M.hand.x - 25, y: M.hand.y - 50 }, 0.35);
      await toUnder('far');
      await pour('shaker', COLOR.cocktail, 0.85, 1.3, -1.8);
      await toUnder('near');
      bar.lid = 'open';
      await fromUnder('far', 'lemon', { x: SERVE.x + 12, y: SERVE.y - 75 });
      await lowerOnto('far', { x: SERVE.x + 12, y: SERVE.y - 27 }, () => (bar.cup.garnish = 1));
    },
  };

  function order(kind) {
    if (state === 'acting' || state === 'mv') return;
    closeMenu();
    stopGuide();
    const halted = haltWork();
    state = 'acting';
    document.body.classList.add('busy');
    log.push({ ev: 'order', kind });
    const d = DRINKS[kind];
    say(d.ask);
    (async () => {
      await halted;
      await prepare();
      PREP_X = STAND[kind];
      await walkTo(PREP_X);
      await turnTo(-1);
      if (bar.cup) await clearGlass();
      await RECIPES[kind]();
      bar.tilt = bar.tiltF = 0;
      log.push({ ev: 'served', kind, fill: bar.cup && bar.cup.fill });
      say(d.serve);
      await wait(1.6);
      await bow(SERVE.x + 400, pick('served_' + kind));
      await wait(0.6);
      goHome();
    })();
  }

  const menuEl = $('#menu');
  let menuOpenedAt = 0;
  function openMenu() {
    if (state === 'mv' || state === 'acting') return;
    stopGuide();
    menuEl.hidden = false;
    menuOpenedAt = performance.now();
  }
  function closeMenu() {
    menuEl.hidden = true;
  }

  /* ---------- MV を流す ---------- */
  // 全編は YouTube を、店の中に埋め込んで流す（本人 2026-11-09「埋め込む」：店の外へ出ず、ジュークボックスは
  // 見終わると次の曲へ）。終わりを知るため、YouTube の部品（iframe_api）を初めて流す時に読む（読みこみ元は youtube.com、
  // 再生は youtube-nocookie.com）。読めない・流せない時は、その旨と「YouTube で開く」で外へ。yt の無い曲は見本の動画

  const player = $('#player'), video = $('#player video'), white = $('#white');
  const ytBox = $('#ytBox'), ytNote = $('#ytNote'), ytLink = $('#playerYT');
  let current = null;
  const ytId = (u) => ((u || '').match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/) || [])[1];
  const yt = { api: null, player: null };
  function ytApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (!yt.api) {
      yt.api = new Promise((res, rej) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prev) prev();
          res(window.YT);
        };
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.onerror = () => rej(new Error('yt'));
        document.head.append(s);
        setTimeout(() => rej(new Error('yt timeout')), 10000);
      }).catch((e) => {
        yt.api = null;
        throw e;
      });
    }
    return yt.api;
  }
  function ytFailed(why) {
    log.push({ ev: 'yt', act: 'failed', why });
    ytBox.hidden = true;
    ytNote.hidden = false;
  }
  async function playYT(id, at = 0) {
    const my = current;
    video.hidden = true;
    ytNote.hidden = true;
    ytBox.hidden = false;
    let YT;
    try {
      YT = await ytApi();
    } catch (e) {
      if (current === my) ytFailed('api');
      return;
    }
    if (current !== my || player.hidden) return;
    if (yt.player) {
      if (at > 0) yt.player.loadVideoById(id, at);
      else yt.player.loadVideoById(id);
      log.push({ ev: 'yt', act: 'load', id, at });
      return;
    }
    yt.player = new YT.Player('yt', {
      host: 'https://www.youtube-nocookie.com',
      videoId: id,
      playerVars: at > 0 ? { autoplay: 1, playsinline: 1, rel: 0, start: Math.floor(at) } : { autoplay: 1, playsinline: 1, rel: 0 },
      events: {
        onReady: (e) => {
          log.push({ ev: 'yt', act: 'ready', id });
          if (!player.hidden) e.target.playVideo();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED && current && !player.hidden) {
            log.push({ ev: 'yt', act: 'ended' });
            nextAlbum();
          }
        },
        onError: (e) => ytFailed('code ' + e.data),
      },
    });
    log.push({ ev: 'yt', act: 'load', id });
  }
  function ytStop() {
    if (yt.player && yt.player.stopVideo) yt.player.stopVideo();
  }
  // YouTube のページへ出る時は、その場で止める（外で開いた後も店で鳴り続けない）。戻った時のために、止めた所を覚える
  ytLink.addEventListener('click', () => {
    saveResume();
    if (yt.player && yt.player.pauseVideo) yt.player.pauseVideo();
  });

  function setWhite(v, sec = 0.7) {
    white.style.transitionDuration = sec / FAST + 's';
    white.style.opacity = v;
  }

  // order は流す曲の並び（SONGS の番号。ジュークボックスは棚の順に全部・棚は1曲かアルバムの曲・ピアノはおまかせの順で全部）、
  // k はその何番目か、at は始める位置（秒。続きから）
  function showAlbum(order, k, kind, at = 0) {
    const s = SONGS[order[k]], i = s.album, a = ALBUMS[i], tr = trackOf(s), medley = order.length > 1;
    current = { order, k, kind, medley };
    log.push({ ev: 'play', id: a.id, no: i + 1, medley, kind, k, track: tr.id, at });
    // 見出しは店の設定の heads の書き方で、かたまり3つ（番号・題・添え書きなど）ごとに折り返す（狭い画面で「（い／つでも会おうよ！）」と
    // 言葉の途中で折れた）。おまかせの順は、何曲目かも添える
    const vars = songVars(order, k);
    const parts = [...(CAFE.heads[kind] || CAFE.heads.album), '', '', ''].slice(0, 3).map((p) => {
      const span = document.createElement('span');
      span.textContent = T.fill(p, vars);
      return span;
    });
    $('#playerTitle').replaceChildren(parts[0], '　', parts[1], ' ', parts[2]);
    $('#playerNext').hidden = k + 1 >= order.length;
    const id = ytId(tr.yt);
    ytLink.hidden = !id;
    if (id) {
      ytLink.href = tr.yt;
      video.pause();
      playYT(id, at);
      return;
    }
    ytStop();
    ytBox.hidden = true;
    ytNote.hidden = true;
    video.hidden = false;
    // 置き場によっては途中から読む頼みに応えず、iPhone が動画を流さないので、丸ごと読んで端末の中の写しから
    const my = current;
    if (!SAMPLE_VIDEO) {
      video.hidden = true;
      ytNote.hidden = false;
      return;
    }
    blobUrl(SAMPLE_VIDEO).then((src) => {
      if (current !== my || player.hidden) return;
      video.src = src;
      if (at > 0) video.addEventListener('loadedmetadata', () => (video.currentTime = at), { once: true });
      const p = video.play();
      if (p) p.catch(() => {});
    });
  }

  /* ---------- 全画面（本人 2026-11-10「メドレーで聞くときに全画面ができるようにしてほしい」「自動で全画面にしたいね」） ----------
     ブラウザは押した時にしか全画面にできないので、ジュークボックス・ピアノ（メドレー）を押したそのタップで入る。
     全画面はページごと（映像の部品ごとにすると、曲が変わる時に解ける）。店にもどったら解く。Android は上映の間だけ横に固定。
     iPhone（Safari・LINE の中）はページから全画面にも横向きにもできないので、横に倒すと映像が画面いっぱいになるようにし
     （index.html）、縦のままメドレーが始まったら一度だけ「横に倒すと…」と知らせる */
  const fsRoot = document.documentElement, turnHintEl = $('#turnHint'), fullBtn = $('#playerFull');
  const canFull = !!(fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen) && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const touchy = matchMedia('(pointer: coarse)').matches;
  function enterFull() {
    if (!canFull || isFull()) return;
    try {
      const p = (fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen).call(fsRoot, { navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});
      log.push({ ev: 'full', act: 'enter' });
    } catch (e) {
      /* 全画面にできないだけ（そのまま流す） */
    }
  }
  function lockLand() {
    if (touchy && isFull() && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  }
  function exitFull() {
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) {
      /* 向きを戻せないだけ */
    }
    if (!isFull()) return;
    const p = (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    if (p && p.catch) p.catch(() => {});
    log.push({ ev: 'full', act: 'exit' });
  }
  function turnHint() {
    if (canFull || !touchy || innerWidth > innerHeight) return;
    try {
      if (sessionStorage.getItem(KEY + '-turn-hint')) return;
      sessionStorage.setItem(KEY + '-turn-hint', '1');
    } catch (e) {
      /* 毎回知らせるだけ */
    }
    turnHintEl.hidden = false;
    log.push({ ev: 'turnHint' });
  }
  fullBtn.hidden = !canFull;
  fullBtn.addEventListener('click', () => (isFull() ? exitFull() : enterFull()));
  // 横に倒したら、知らせはもう要らない
  addEventListener('resize', () => innerWidth > innerHeight && (turnHintEl.hidden = true));
  for (const name of ['fullscreenchange', 'webkitfullscreenchange']) {
    document.addEventListener(name, () => {
      fullBtn.textContent = isFull() ? 'もとの大きさ' : '全画面';
      if (isFull() && !player.hidden) lockLand();
    });
  }

  function openPlayer(order, kind, k = 0, at = 0) {
    state = 'mv';
    bgmStop('album');
    say('');
    setWhite(1, 0.01);
    try {
      history.pushState({ cafe: 'mv' }, '');
    } catch (e) {
      /* 戻るが効かないだけで、閉じるボタンはある */
    }
    player.hidden = false;
    showAlbum(order, k, kind, at);
    if (order.length > 1) {
      lockLand();
      turnHint();
    }
    setTimeout(() => setWhite(0, 0.9), 60 / FAST);
  }

  function nextAlbum() {
    if (!current) return;
    const { order, k, kind } = current;
    if (k + 1 < order.length) {
      setWhite(1, 0.6);
      setTimeout(() => {
        showAlbum(order, k + 1, kind);
        setWhite(0, 0.9);
      }, 620 / FAST);
    } else {
      current.finished = true;
      leavePlayer();
    }
  }

  // 閉じるのはその場で。上映の分の「戻る」の記録は、閉じてから1つ戻す（戻った知らせを待って閉じると、閉じるを続けて2回押した時や
  // YouTube の見終わりが2回届いた時に2回戻り、店を通り越して店先まで出た 2026-11-11）
  function leavePlayer() {
    if (player.hidden) return;
    const inMv = history.state && history.state.cafe === 'mv';
    closePlayer();
    if (inMv) history.back();
  }

  // 閉じた直後の押しは、店の物を押したことにしない（スマホで閉じるを続けて2回押すと、2回目が下のボタンに抜けて
  // ピアノのおまかせが始まった 2026-11-11）
  let closedAt = -1e9;
  addEventListener('click', (e) => {
    if (performance.now() - closedAt < 500 / FAST) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  function closePlayer() {
    if (player.hidden) return;
    closedAt = performance.now();
    video.pause();
    video.removeAttribute('src');
    video.load();
    ytStop();
    exitFull();
    turnHintEl.hidden = true;
    player.hidden = true;
    // 見終わった・途中でやめた・メドレーを全部、で一言を変える。途中でやめた時は、止めた所を覚える（続きから）
    const done = current && current.finished;
    if (done) dropResume();
    else saveResume();
    const own = done && current.kind !== 'juke' && current.kind !== 'stage' && CAFE.albums && CAFE.albums[ALBUMS[SONGS[current.order[0]].album].id];
    const line = own && own.after && own.after.length ? own.after[Math.floor(Math.random() * own.after.length)]
      : pick(!done ? 'afterStop' : current.kind === 'stage' ? 'afterStage' : current.medley ? 'afterAll' : 'after');
    current = null;
    scene.bloom = 0;
    log.push({ ev: 'closed', line });
    setWhite(1, 0.01);
    setTimeout(() => setWhite(0, 0.8), 40 / FAST);
    goHome(line);
  }

  // line があれば、持ち場へ戻ってからお客へ斜めに向いて、軽くうなずきながら言う
  function goHome(line) {
    state = 'home';
    lookUntil = 0;
    tasks = [];
    document.body.classList.remove('busy');
    (async () => {
      const d0 = scene.dim;
      await tween(0.9, (u) => (scene.dim = mix(d0, 0, u)));
      resetProps();
      // 店に戻ったら、BGM を止めた所から。蓄音機に BGM の盤を戻した後で鳴らす（時刻で鳴らすと、1枚の後はまだアルバムの盤が
      // のっていて鳴らなかった。本人 2026-11-11「マスターに1曲頼んで聞いてbarにもどっても、BGMが復活しない」）
      if (bgm.el.paused) bgmPlay();
      if (!M.back) {
        M.near.w = 0;
        M.far.w = 0;
      }
      M.lean = 0;
      M.nod = 0;
      await standUp();
      await walkTo(HOME_X);
      if (line) {
        await turnTo(-1);
        await faceFront(true);
        say(line);
        log.push({ ev: 'after', line });
        await setKey('nod', 0.6, 0.45);
        await setKey('nod', 0, 0.45);
        await wait(1.2);
        await faceFront(false);
      }
      await turnTo(-1);
      if (tall) follow(M.x);
      state = 'idle';
      lastTalk = clock;
      log.push({ ev: 'home' });
      startWork();
    })();
  }

  /* ---------- 入店の案内と、手すきの話（本人 2026-11-08「店のどこに何があって何ができるか案内」「何もない時も小話や豆知識」） ---------- */

  const GUIDE = [
    { spot: '#spotJuke', go: 'juke', to: { x: 478, y: 540 }, line: CAFE.guide[0] },
    { spot: '#spotShelf', go: 'shelf', to: { x: 960, y: 430 }, line: CAFE.guide[1] },
    { spot: '#spotStage', go: 'stage', to: { x: 1420, y: 560 }, line: CAFE.guide[2] },
    { spot: '#spotMenu', go: 'menu', to: MENU, line: CAFE.guide[3] },
  ];
  // guideHold：案内で、手を差し出したままセリフを読ませている間（マスターは止まっている）
  let guideToken = 0, guideHold = false, lastTalk = 0, talkTurn = 0;
  const unlight = () => document.querySelectorAll('.lit').forEach((e) => e.classList.remove('lit'));

  function stopGuide() {
    if (state !== 'guide') return;
    guideToken++;
    guideHold = false;
    tasks = [];
    unlight();
    M.near.w = 0;
    M.nod = 0;
    state = 'idle';
    document.body.classList.remove('busy');
    log.push({ ev: 'guideStopped' });
  }

  function remembered() {
    try {
      return localStorage.getItem(KEY + '-cafe-visited') === '1';
    } catch (e) {
      return false;
    }
  }

  async function runGuide() {
    try {
      localStorage.setItem(KEY + '-cafe-visited', '1');
    } catch (e) {
      /* 覚えられなくても、次も案内するだけ */
    }
    // 開いてすぐ何かを押した人には案内しない（後から始めると、押した流れを乗っ取った）
    if (state !== 'idle' || !shelf.hidden || !menuEl.hidden) return;
    if (!bookEl.hidden || booksOpen()) return;
    const token = ++guideToken;
    const alive = () => token === guideToken;
    state = 'guide';
    document.body.classList.add('busy');
    log.push({ ev: 'guide' });
    say(pick('welcome'));
    await freeHands();
    await wait(1.0);
    for (const g of GUIDE) {
      if (!alive()) return;
      const dir = g.to.x < M.x ? -1 : 1;
      if (tall) follow(g.to.x);
      await turnTo(dir);
      const p = pathAt(M.x);
      unlight();
      $(g.spot).classList.add('lit');
      const btn = document.querySelector(`#panel button[data-go="${g.go}"]`);
      if (btn) btn.classList.add('lit');
      say(g.line);
      log.push({ ev: 'guideStep', spot: g.spot });
      // 手のひらを上に、その場所の方へ差し出す
      await reach('near', { x: M.x + dir * 70 * p.s, y: p.y - 300 * p.s + (g.to.y < 470 ? -40 * p.s : 0) }, 0.6);
      guideHold = true;
      await wait(1.4 + g.line.length / 7 - 1.2);
      guideHold = false;
      await release('near', 0.45);
    }
    if (!alive()) return;
    unlight();
    if (tall) follow(M.x);
    await turnTo(-1);
    await faceFront(true);
    say(pick('guideEnd'));
    await setKey('nod', 1, 0.5);
    await setKey('nod', 0, 0.5);
    await wait(0.6);
    await faceFront(false);
    if (!alive()) return;
    state = 'idle';
    lastTalk = clock;
    document.body.classList.remove('busy');
    log.push({ ev: 'guideDone' });
    startWork();
    lookHint();
  }

  /* ---------- 縦の画面は、指で左右に店の中を見わたす（本人 2026-11-10「中の部屋もピアノとジュークボックスも、
     マスターが動かないと見えないのね」）。絵をつかんで引っぱる向き ---------- */

  const look = { id: null, x0: 0, cam0: 0, moved: false, until: 0 };
  const sceneEl = $('#scene'), lookHintEl = $('#lookHint');
  function looked() {
    try {
      return localStorage.getItem(KEY + '-cafe-looked') === '1';
    } catch (e) {
      return false;
    }
  }
  // まだ動かしたことのない人にだけ、一度知らせる
  function lookHint() {
    if (tall && !looked()) lookHintEl.hidden = false;
  }
  sceneEl.addEventListener('pointerdown', (e) => {
    if (!tall || (e.pointerType === 'mouse' && e.button !== 0)) return;
    Object.assign(look, { id: e.pointerId, x0: e.clientX, cam0: camX, moved: false });
  });
  sceneEl.addEventListener('pointermove', (e) => {
    if (e.pointerId !== look.id) return;
    const dx = e.clientX - look.x0;
    if (!look.moved && Math.abs(dx) < 8) return;
    if (!look.moved) {
      look.moved = true;
      sceneEl.setPointerCapture(e.pointerId);
      lookHintEl.hidden = true;
      log.push({ ev: 'look' });
      try {
        localStorage.setItem(KEY + '-cafe-looked', '1');
      } catch (err) {
        /* 次も知らせるだけ */
      }
    }
    camX = camGoal = clamp(look.cam0 - dx / S, 0, W - viewW);
    camVel = 0;
    lookUntil = clock + 15;
    panned = true;
    glance = null;
  });
  const lookEnd = (e) => {
    if (e.pointerId !== look.id) return;
    look.id = null;
    if (look.moved) look.until = performance.now() + 400;
  };
  sceneEl.addEventListener('pointerup', lookEnd);
  sceneEl.addEventListener('pointercancel', lookEnd);
  // 動かした指を離した時の押しは、押したことにしない（ジュークボックス・棚・マスター）
  sceneEl.addEventListener('click', (e) => {
    if (performance.now() < look.until) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  // 手すきの時は、30秒ごとに小話・おすすめ・豆知識・問いかけ（店の設定に ask がある店だけ）を順に。マスターを押すとすぐ話す
  const TALKS = ['chat', 'suggest', 'trivia', 'ask'].filter((k) => LINES[k] && LINES[k].length);
  function talk() {
    const kind = TALKS[talkTurn++ % TALKS.length];
    const line = pick(kind);
    say(line);
    lastTalk = clock;
    log.push({ ev: 'talk', kind, line });
    if (BOOK_SUGGEST.includes(line)) glanceBooks(line);
  }

  // テーブルの本をすすめた時、縦の画面で本が画面の外なら、カメラの行き先をなめらかな S 字（GLIDE 秒）でテーブルへ運び、ばねがそれを
  // 追う（行き先を一度に動かすと、ばねは動き出しがいちばん速い）。セリフの間そこに留まり、同じ S 字でマスターを追う所へ戻す。
  // 見る人が指で動かして置いた所（panned）からは寄せない（成果物の基本 4。押して頼むか、手すきの仕事がまた追うまで）
  const GLIDE = 1.6, GLANCE_PAD = 40;
  function glanceBooks(line) {
    if (!tall || !bookSpot || panned || look.id !== null || state !== 'idle') return;
    const [bx, , bw] = TABLE_BOOKS.box || TABLE.box;
    const to = clamp(clamp(camGoal, bx + bw + GLANCE_PAD - viewW, bx - GLANCE_PAD), 0, W - viewW);
    if (Math.abs(to - camGoal) < 1) return;
    glance = { t0: clock, from: camGoal, to, stay: Math.max(GLIDE + 2.5, sayFor(line)) };
    log.push({ ev: 'glance', to });
  }
  // 寄せて留まっている間は、テーブルの本の札を案内と同じ光で灯す（縦の画面は札を出さないので、本が押せると分からなかった
  // 2026-11-17。下のボタンの列の本のボタンも一緒に灯す）。戻りはじめたら・頼まれたら・指で動かしたら消す（毎コマ glance から決める）
  let beckoned = false;
  function beckonBook(on) {
    if (!bookSpot || on === beckoned) return;
    beckoned = on;
    bookSpot.classList.toggle('beckon', on);
    $('#panel button[data-go="books"]')?.classList.toggle('beckon', on);
    log.push({ ev: 'beckon', on, t: clock });
  }
  // 寄せている間の行き先（毎コマ）。頼まれたらやめる（見る人が指で動かした時は、指の受け口がやめる）
  function glanceStep() {
    const t = clock - glance.t0;
    if (state !== 'idle') glance = null;
    else if (t < glance.stay) camGoal = mix(glance.from, glance.to, smooth(Math.min(1, t / GLIDE)));
    else if (t < glance.stay + GLIDE) camGoal = mix(glance.to, clamp(M.x - viewW / 2, 0, W - viewW), smooth((t - glance.stay) / GLIDE));
    else {
      glance = null;
      follow(M.x);
    }
  }

  function idleTalk() {
    // ピアノを弾いている間と、ソファの横（セリフの字が出る床）に立つ間は話しかけない
    if (state === 'idle' && shelf.hidden && menuEl.hidden && bookEl.hidden && !booksOpen() && !work.piano && !aside() && clock - lastTalk > 30) talk();
  }

  /* ---------- 手すきの仕事（本人 2026-11-09「グラスの縁などを正確にきちんと拭いて、時々光に透かして見たり、棚のグラスと
     入れ替えたり」「猫の様子を見たり、ミルクをあげたり、棚の整理をしたり、ピアノの調律をしたり」
     「BGM はマスターがレコードで鳴らしており、リピートする時（3曲に一度）に針を置きかえる」） ---------- */
  // 仕事は区切りごとに、止めてよいかを見る。押された時は、持っている物を置いて両手を空けてから止まる（宙で消さない）。
  // pose は毎コマ手の位置を決める（拭く手の円など）。phase と rim は試す.py が見る（拭く手が本当に縁にあるか）
  // only は ?chore= の仕事。pianoOdds は面が終わった時にピアノを弾く割合（残りはすぐ針を戻す）。
  // lightOdds は列のグラスを磨いた後に光に透かす割合。underLight は台の下のグラスを光に透かす割合、smudgeOdds は透かして
  // 曇りを見つける割合。shelfPick は棚の整理で整える冊（-1 はくじ。試す.py が右の端まで1枚ずつ見る時）
  const work = { token: 0, stop: false, done: null, pose: null, phase: '', touch: null, rim: null, glassFront: true, shine: 0,
    parked: false, next: null, last: '', only: null, slot: 0, under: 0, pianoOdds: 0.6, lightOdds: 0.6, pianoTurn: 0,
    interlude: false, piano: null, board: null, kit: null, shelfPick: -1, underLight: 0.4, smudgeOdds: 0.4 };
  const working = (tok) => tok === work.token && !work.stop;
  // 手すきの間の待ちは、押されたらすぐ切り上げる
  const linger = (sec, tok) => tween(sec, () => {}, smooth, () => !working(tok));
  const MILK_X = 860;
  // 仕事の合間のひとことも、手すきの話の1つ（次の小話はここから30秒後）。店の上に窓を開いている間は話しかけない
  const mutter = (key) => {
    if (!bookEl.hidden) return;
    const line = pick(key);
    say(line);
    lastTalk = clock;
    log.push({ ev: 'talk', kind: key, line });
  };

  function startWork() {
    if (window.__noWork) return;
    const tok = ++work.token;
    work.stop = false;
    work.done = workLoop(tok);
  }

  async function haltWork() {
    work.stop = true;
    const d = work.done;
    work.done = null;
    if (d) await d;
    else tasks = [];
    await freeHands();
  }

  // 体に対する位置（d は向き。歩く間も手がついてくる）
  const bodyAt = (lx, ly) => {
    const p = pathAt(M.x);
    return { x: M.x + M.f * lx * p.s, y: p.y + p.s * ly };
  };
  // グラスを磨く所：胸の前（出す所 SERVE のグラスに重ならない）。縁は、つまむ所からワイングラスは 31 上、
  // 台の下のグラスは口の高さ（底の 8 上をつまむ）。縁の半分の幅で、布を回す大きさを決める
  const polishAt = () => bodyAt(44, -HIP - 90);
  const rimH = (k) => (k === 'wglass' ? 31 : BOWL[k.slice(2)][0] - 8);
  const rimW = (k) => ({ wglass: 8, g_tall: 8, g_cocktail: 14, g_rocks: 11 })[k];
  const rimOf = () => {
    const h = rimH(bar.far);
    return { x: M.handF.x + Math.sin(bar.tiltF) * h, y: M.handF.y - Math.cos(bar.tiltF) * h };
  };

  async function fromPocket(name, kind) {
    await reach(name, M.pocket, 0.4);
    logEv('pocketOut', { kind, x: M.pocket.x, y: M.pocket.y });
    bar[name] = kind;
  }
  async function toPocket(name = 'near') {
    await reach(name, M.pocket, 0.4);
    logEv('pocketIn', { kind: bar[name], x: M.pocket.x, y: M.pocket.y });
    bar[name] = null;
    await release(name, 0.35);
  }

  // グラスは置き場の真上から下ろし、真上へ持ち上げる（出す所のグラスや器をよけて、高い所を通る）
  const HIGH = 470;
  async function setGlass(spot) {
    work.pose = null;
    work.glassFront = true;
    bar.tiltF = 0;
    const g = { x: spot.x, y: spot.y - 9 };
    await reach('far', { x: M.handF.x, y: Math.min(M.handF.y, HIGH) }, 0.3);
    await reach('far', { x: g.x, y: HIGH }, 0.45);
    await reach('far', g, 0.4);
    logEv('glassDown', { x: g.x, y: g.y, hx: M.handF.x, hy: M.handF.y });
    bar.far = null;
    if (spot === PARK) work.parked = true;
    else spot.full = true;
    await reach('far', { x: g.x, y: HIGH }, 0.35);
  }
  async function takeGlass(spot) {
    work.glassFront = true;
    const g = { x: spot.x, y: spot.y - 9 };
    await reach('far', { x: g.x, y: HIGH }, 0.4);
    await reach('far', g, 0.4);
    logEv('glassUp', { x: g.x, y: g.y, hx: M.handF.x, hy: M.handF.y });
    if (spot === PARK) work.parked = false;
    else spot.full = false;
    bar.far = 'wglass';
    await reach('far', { x: g.x, y: HIGH }, 0.4);
    const p = polishAt();
    await reach('far', { x: p.x, y: HIGH }, 0.35);
    await reach('far', p, 0.3);
  }
  // 持っているグラスを置く：グラスの列の前なら空いた所へ、ほかは持ち場の左（PARK）へ
  async function putGlass() {
    const free = SLOTS.find((s) => !s.full);
    if (free && Math.abs(M.x - ROW_X) < 40) {
      await turnTo(1);
      return setGlass(free);
    }
    if (Math.abs(M.x - HOME_X) > 4) await walkTo(HOME_X);
    await turnTo(-1);
    await setGlass(PARK);
  }

  // 運ぶ間は、持った物が体の前についてくる
  const carry = (name, lx, ly) => (work.pose = () => Object.assign(M[name], bodyAt(lx, ly), { w: 1 }));

  // 両手を空ける：グラスは置き場へ（台の下のグラスは台の下へ）、布と調律の道具はポケットへ、皿は台の下へ。
  // ピアノの前なら、弾いている音を止めて立ってから
  async function freeHands() {
    pianoStop();
    work.pose = null;
    work.phase = '';
    work.touch = null;
    work.rim = null;
    work.shine = 0;
    work.glassFront = true;
    if (pop >= 0) {
      const u0 = popU;
      await tween(0.25, (u) => (popU = u0 * (1 - u)));
      pop = -1;
    }
    if (arm.held) {
      // 針を持ち上げたままにしない（今いる所で下ろす）
      const l0 = arm.lift;
      await tween(0.3, (u) => {
        arm.lift = l0 * (1 - u);
        Object.assign(M.near, armGrip(), { w: 1 });
      });
      arm.held = false;
    }
    if (M.back) await standUp();
    await Promise.all([setKey('head', 0, 0.3), setKey('lean', 0, 0.3), setKey('crouch', 0, 0.3)]);
    if (work.board || bar.near === 'board' || bar.near === 'knife') await putAwayBoard();
    if (M.front) await faceFront(false);
    if (bar.far === 'wglass') await putGlass();
    if (polished(bar.far)) await stowGlass();
    if (bar.near === 'saucer') await stowDish();
    if (bar.near === 'cloth' || bar.near === 'lever') await toPocket('near');
    if (bar.far === 'cloth') await toPocket('far');
    bar.tilt = bar.tiltF = 0;
    await Promise.all([release('near', 0.3), release('far', 0.3)]);
    // 手前の床（丸イスの所）にいたら、カウンターの奥へ戻ってから応じる
    if (M.z > 0) await stepIn();
  }

  // グラス磨きの1回り（本人 2026-11-09「拭くしぐさをもっとゆっくり」）：縁の内側 → 外側 → 脚 → ときどき光に透かす
  // （曇りがあれば、そこをもう一度）。どのグラスも、奥の手でつまんで胸の前に持つ
  async function polishCycle(tok, light) {
    const t0 = clock, k = bar.far, w = rimW(k), h = rimH(k);
    await reach('far', polishAt(), 0.5);
    // 縁の内側：布をグラスの口に入れ、グラスを少しずつ回しながら、ゆっくり円を描く。グラスは布の手前（布が中に見える）。
    // 円は口の幅いっぱい近くまで、グラスも大きく傾けて回す（円が 2〜3px だと、PC で手が宙で止まって見えた 本人 2026-11-17
    // 「いつもの作業しないで手だけが空中で止まっているよ」）
    work.glassFront = true;
    work.phase = 'rim';
    const inRim = (t) => {
      const r = rimOf(), a = (t - t0) * 2.2;
      return { x: r.x + Math.cos(a) * w * 0.75, y: r.y + 5 + Math.sin(a) * 4.8 };
    };
    await reach('near', inRim(clock), 0.6);
    // グラスを持つ手も、布に当てて回すように小さく前と上下へ動かす（縦のスマホは絵が小さく、拭く手の円だけでは画面で 7px 四方に
    // 収まり、両手が止まって見えた 2026-11-20。試す.py の hands_move）。体の側へ寄せると、拭く腕が折れすぎる
    const p0 = { x: M.far.x, y: M.far.y };
    work.pose = (t) => {
      const b = (t - t0) * 1.1;
      bar.tiltF = Math.sin((t - t0) * 0.8) * 0.18;
      Object.assign(M.far, { x: p0.x + M.f * (1 - Math.cos(b)) * 4, y: p0.y + Math.sin(b) * 3, w: 1 });
      Object.assign(M.near, inRim(t), { w: 1 });
      work.rim = rimOf();
    };
    await linger(4.2, tok);
    if (!working(tok)) return;
    // 外側：布を口の縁から胴の下へ、右・左となでる。布はグラスの手前
    work.pose = null;
    work.rim = null;
    work.phase = 'outside';
    work.glassFront = false;
    for (const side of [-1, 1, -1]) {
      const r = rimOf();
      await reach('near', { x: r.x + side * w * 1.1, y: r.y + 3 }, 0.55);
      await reach('near', { x: r.x + side * w * 0.5, y: r.y + h * 0.5 }, 0.75);
    }
    // 脚（脚のあるグラスだけ）：つまんだ指の上から足まで
    if (k === 'wglass' || k === 'g_cocktail') {
      work.phase = 'stem';
      await reach('near', { x: M.handF.x + M.f * 3, y: M.handF.y - 8 }, 0.4);
      await reach('near', { x: M.handF.x + M.f * 3, y: M.handF.y + 8 }, 0.75);
    }
    if (light && working(tok)) await holdToLight(tok);
    work.phase = '';
  }

  // 光に透かす：グラスを目の高さより上へ、灯りの方へかかげ、少し回しながら見上げる
  async function holdToLight(tok) {
    work.phase = 'light';
    work.glassFront = true;
    await release('near', 0.5);
    const up = bodyAt(58, -HIP - 205);
    await Promise.all([reach('far', up, 0.9), setKey('head', -0.22, 0.9)]);
    const t0 = clock;
    // 回して見る間、グラスを持つ手も少し動く（かかげた手を止めたままにすると、手が宙で止まって見えた 2026-11-17）
    work.pose = (t) => {
      const a = (t - t0) * 1.6;
      bar.tiltF = Math.sin((t - t0) * 0.8) * 0.12;
      work.shine = Math.min(1, (t - t0) * 1.5);
      Object.assign(M.far, { x: up.x + M.f * Math.sin(a) * 9, y: up.y - (1 - Math.cos(a)) * 4, w: 1 });
    };
    await linger(2.0, tok);
    work.pose = null;
    work.shine = 0;
    const smudge = Math.random() < work.smudgeOdds;
    await Promise.all([reach('far', polishAt(), 0.8), setKey('head', 0, 0.8)]);
    bar.tiltF = 0;
    if (!working(tok)) return;
    if (smudge) {
      // 曇りを見つけたら、そこだけもう一度こする（小さな円だと手が止まって見えたので、胴の上で見える大きさに 2026-11-17）
      work.phase = 'outside';
      work.glassFront = false;
      const r = rimOf(), spot = { x: r.x - M.f * rimW(bar.far) * 0.4, y: r.y + 8 };
      await reach('near', spot, 0.5);
      const t1 = clock;
      work.pose = (t) => Object.assign(M.near, { x: spot.x + Math.cos((t - t1) * 3.8) * 6, y: spot.y + Math.sin((t - t1) * 3.8) * 4, w: 1 });
      await wait(2.2);
      work.pose = null;
    } else if (Math.random() < 0.3) mutter('light');
  }

  // 列のワイングラスを1つ（前に磨かなかった方を）取って、持ち場で磨き、列へ戻す。手を空けた時に持ち場の左へ置いたなら、そこから
  async function polishGlass(tok) {
    if (bar.far !== 'wglass') {
      if (work.parked) {
        if (Math.abs(M.x - HOME_X) > 4) await walkTo(HOME_X, 78, 1, () => !working(tok));
        if (!working(tok)) return;
        await turnTo(-1);
        await takeGlass(PARK);
      } else {
        await walkTo(ROW_X, 78, 1, () => !working(tok));
        if (!working(tok)) return;
        await turnTo(1);
        const i = SLOTS[work.slot ^ 1].full ? work.slot ^ 1 : work.slot;
        work.slot = i;
        await takeGlass(SLOTS[i]);
        carry('far', 40, -HIP - 104);
        await walkTo(HOME_X, 70);
        await turnTo(-1);
        work.pose = null;
      }
    }
    if (bar.near !== 'cloth') await fromPocket('near', 'cloth');
    await polishCycle(tok, Math.random() < work.lightOdds);
    if (!working(tok)) return;
    // 磨いたら列へ戻す（布は手前の手に持ったまま運び、置いてからポケットへ）
    work.phase = 'swap';
    work.glassFront = true;
    await release('near', 0.4);
    carry('far', 40, -HIP - 104);
    await walkTo(ROW_X, 70, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(1);
    const free = SLOTS.find((s) => !s.full);
    work.slot = SLOTS.indexOf(free);
    await setGlass(free);
    await toPocket('near');
    await release('far', 0.4);
    work.phase = '';
  }

  // 台の下のグラス（本人 2026-11-09「カウンターの下の見えない位置から、別な形のグラスを拭いたり」）：
  // かがんで台の下から出し、持ち場で磨いて、また台の下へ。出し入れは手がカウンターの陰にある間だけ
  const UNDER_GLASS = ['g_rocks', 'g_tall', 'g_cocktail'];
  const lowAt = () => ({ x: M.x + Math.sign(M.f) * 30, y: 594 });
  // かがむ・立つ間、布を持った手前の手は腰の前へ下ろし、体と一緒に動かす（手を磨いていた所の宙に残すと、かがんだ体に対して
  // 顔の高さに来て、前腕が顔の前を横切った 2026-11-17）
  const clothHip = () => bodyAt(30, -HIP + M.crouch * 64 + 8);
  function nearWithBody(dur) {
    if (bar.near !== 'cloth' || M.near.w <= 0) return Promise.resolve();
    const h = M.near, x0 = h.x, y0 = h.y;
    return tween(dur, (u) => {
      const p = clothHip();
      Object.assign(h, { x: mix(x0, p.x, u), y: mix(y0, p.y, u), w: 1 });
    });
  }
  async function takeGlassUnder(kind) {
    await Promise.all([setKey('crouch', 1, 0.6), reach('far', lowAt(), 0.6), nearWithBody(0.6)]);
    logEv('take', { hand: 'far', kind, x: lowAt().x, y: lowAt().y, hx: M.handF.x, hy: M.handF.y });
    bar.far = kind;
    await Promise.all([setKey('crouch', 0, 0.6), reach('far', polishAt(), 0.6), nearWithBody(0.6)]);
  }
  async function stowGlass() {
    work.pose = null;
    work.glassFront = true;
    bar.tiltF = 0;
    await Promise.all([setKey('crouch', 1, 0.6), reach('far', lowAt(), 0.6), nearWithBody(0.6)]);
    logEv('stow', { hand: 'far', kind: bar.far, x: lowAt().x, y: lowAt().y, hx: M.handF.x, hy: M.handF.y });
    bar.far = null;
    await Promise.all([setKey('crouch', 0, 0.5), release('far', 0.5), nearWithBody(0.5)]);
  }
  // 持ち場の少し右で（出したお客の器 SERVE の上を、グラスが縦に通らない）
  async function underGlass(tok) {
    await freeHands();
    await walkTo(HOME_X + 25, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(-1);
    await fromPocket('near', 'cloth');
    const n = Math.random() < 0.5 ? 2 : 1;
    for (let i = 0; i < n && working(tok); i++) {
      await takeGlassUnder(UNDER_GLASS[work.under++ % UNDER_GLASS.length]);
      if (i === 0 && Math.random() < 0.4) mutter('under');
      await polishCycle(tok, Math.random() < work.underLight);
      await stowGlass();
    }
    await toPocket('near');
  }

  // 仕込み（本人 2026-11-09「カウンターの下に手を入れて前後に手を動かすのは、別の仕草に見えるのでやめよう。斜め45度こちらに
  // 向いて、カウンターで何か仕込んでいるのが分かるように」）：まな板（レモンと包丁ごと）を台の下から出してカウンターに置き、
  // お客へ斜めに向いて、レモンを1枚ずつゆっくり輪切りにする。手元はいつもカウンターの上で見える。切り終えたら、まな板ごと台の下へ。
  // 右を向いて置くので、斜めに向くと手前の手（包丁）が左、奥の手（レモンを押さえる）が右
  const BOARD = { x: HOME_X, y: 535 };
  const boardGrip = () => ({ x: BOARD.x + 22, y: BOARD.y - 3 });
  const knifeAt = () => ({ x: BOARD.x - 15, y: BOARD.y - 2.5 });
  // レモンは右の端が動かず、切るたびに左の切り口が右へ寄る
  const lemonOf = (k) => {
    const rx = 3 + 7 * k.lemon;
    return { rx, cx: BOARD.x + 18 - rx, cut: BOARD.x + 18 - 2 * rx };
  };
  async function prepWork(tok) {
    await freeHands();
    await walkTo(BOARD.x, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(1);
    work.kit = { lemon: 1, slices: 0, knife: true };
    const low = { x: boardGrip().x, y: 594 };
    await Promise.all([setKey('crouch', 1, 0.6), reach('near', low, 0.6)]);
    logEv('take', { hand: 'near', kind: 'board', x: low.x, y: low.y });
    bar.near = 'board';
    await Promise.all([setKey('crouch', 0, 0.6), reach('near', { x: low.x, y: 512 }, 0.6)]);
    await reach('near', boardGrip(), 0.5);
    logEv('boardDown', boardGrip());
    bar.near = null;
    work.board = { ...BOARD };
    await release('near', 0.4);
    if (!working(tok)) return;
    // お客へ斜めに向き、少し身をかがめて手元を見る。奥の手でレモンを押さえ、手前の手で包丁を取る
    work.phase = 'prep';
    await faceFront(true);
    const k = work.kit, hold = () => ({ x: lemonOf(k).cx + 1, y: BOARD.y - 16 });
    await Promise.all([reach('far', hold(), 0.7), setKey('nod', 0.18, 0.7)]);
    await reach('near', knifeAt(), 0.6);
    logEv('knifeUp', knifeAt());
    k.knife = false;
    bar.near = 'knife';
    if (Math.random() < 0.5) mutter('prep');
    // 1枚ずつ：切る所の上へ → ゆっくり下ろして切る → 上げる。2枚目の後で、包丁を板の上に休めて顔を上げ、お客を見る。
    // 切るのは3枚（5枚だと1回の仕込みが42秒あり、ほかの仕事より長かった 2026-11-12）。包丁はレモンの上まで持ち上げてから
    // 下ろす（刃先がレモンに触れる所から 8 だけ動かすと、手が止まって見えた 2026-11-17）
    for (let i = 0; i < 3 && working(tok); i++) {
      const x = lemonOf(k).cut - 0.5;
      await Promise.all([reach('near', { x, y: BOARD.y - 40 }, 0.5), reach('far', hold(), 0.5)]);
      await reach('near', { x, y: BOARD.y - 21 }, 0.7);
      k.slices++;
      k.lemon = Math.max(0, k.lemon - 0.17);
      await reach('near', { x, y: BOARD.y - 40 }, 0.6);
      await linger(0.4, tok);
      if (i === 1 && working(tok)) {
        await Promise.all([setKey('nod', 0, 0.5), reach('near', { x: x - 8, y: BOARD.y - 22 }, 0.5)]);
        await linger(1.0, tok);
        await Promise.all([setKey('nod', 0.18, 0.5), reach('near', { x, y: BOARD.y - 40 }, 0.5)]);
      }
    }
    work.phase = '';
    await putAwayBoard();
  }
  // 包丁をまな板に置き、まな板ごと台の下へしまう（手を空ける時も同じ）
  async function putAwayBoard() {
    if (bar.near === 'knife') {
      await reach('near', knifeAt(), 0.5);
      logEv('knifeDown', knifeAt());
      bar.near = null;
      work.kit.knife = true;
    }
    // 手前の手は、お客へ向いたまま、まな板の右の端へ（横向きに戻ってから動かすと、手が包丁の所＝背中の側に残り、
    // 腕が後ろへ回った 2026-11-11）
    await Promise.all([release('far', 0.4), setKey('nod', 0, 0.4), work.board ? reach('near', boardGrip(), 0.45) : null]);
    if (M.front) await faceFront(false);
    await turnTo(1);
    if (work.board) {
      await reach('near', boardGrip(), 0.2);
      logEv('boardUp', boardGrip());
      work.board = null;
      bar.near = 'board';
    }
    if (bar.near === 'board') {
      const low = { x: boardGrip().x, y: 594 };
      await reach('near', { x: low.x, y: 512 }, 0.5);
      await Promise.all([setKey('crouch', 1, 0.6), reach('near', low, 0.6)]);
      logEv('stow', { hand: 'near', kind: 'board', x: low.x, y: low.y });
      bar.near = null;
      work.kit = null;
      await Promise.all([setKey('crouch', 0, 0.5), release('near', 0.5)]);
    }
  }

  // カウンターを拭く（本人 2026-11-09「テーブルとかカウンターなどをさっと拭くようなしぐさ」）：布を出し、サイフォンの手前から
  // 蓄音機の右まで、天板の上を往復しながら歩いて拭いていく（体が蓄音機のラッパに隠れない所まで）。置いてある物
  // （持ち場の左のグラス・出したお客の器）の所は拭かず、布を持ち上げて越える（物の上で手を止めると、つかむように見えた）。
  // テーブルはカウンターの外のソファの奥で、店の並びでは歩いて行けないので拭かない
  const WIPE = { from: 815, to: 985, y: 533, reach: 30 };
  // 天板の拭く区切り（置いてある物の所を抜いた残り）を、右から左の順に。items は越える物（口の高さ top）
  function wipeSegments() {
    const items = [];
    if (work.parked) items.push({ x: PARK.x, w: 10, top: PARK.y - 40 });
    if (bar.cup) items.push({ x: bar.cup.x, w: 16, top: bar.cup.y - BOWL[bar.cup.kind][0] });
    let segs = [{ a: WIPE.from, b: WIPE.to }];
    for (const it of items) {
      const l = it.x - it.w - 10, r = it.x + it.w + 10;
      segs = segs.flatMap((s) => (r <= s.a || l >= s.b ? [s] : [{ a: s.a, b: l }, { a: r, b: s.b }]).filter((q) => q.b - q.a > 12));
    }
    return { segs: segs.sort((p, q) => q.b - p.b), items };
  }
  async function wipeCounter(tok) {
    await freeHands();
    const { segs, items } = wipeSegments();
    await walkTo(segs[0].b + WIPE.reach, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(-1);
    await fromPocket('near', 'cloth');
    await Promise.all([reach('near', { x: segs[0].b, y: WIPE.y }, 0.8), setKey('lean', 0.06, 0.8), setKey('head', 0.12, 0.8)]);
    work.phase = 'wipe';
    if (Math.random() < 0.4) mutter('wipe');
    const t0 = clock;
    for (let i = 0; i < segs.length && working(tok); i++) {
      const s = segs[i];
      // 手は体の少し前で、大きくゆったりした楕円を描いて拭き上げながら左へ進む（体も一緒にゆっくり歩く）。区切りの外へは出ない
      // （本人 2026-11-09「後掃除の時も、動きは少しゆったりと、優雅に拭き上げるといい」）
      work.pose = (t) => {
        const a = (t - t0) * 2.0;
        const x = clamp(M.x - WIPE.reach + Math.cos(a) * 18, s.a, s.b);
        Object.assign(M.near, { x, y: WIPE.y - 0.8 + Math.sin(a) * 1.2, w: 1 });
      };
      await walkTo(s.a + WIPE.reach, 14, 0.35, () => !working(tok));
      const next = segs[i + 1];
      if (!next || !working(tok)) break;
      // 物の上は、布を持ち上げて越える（間にある物のいちばん高い口より上を通る）
      work.pose = null;
      const x0 = M.near.x, top = Math.min(WIPE.y - 20, ...items.filter((it) => it.x > next.b && it.x < s.a).map((it) => it.top - 12));
      await Promise.all([walkTo(next.b + WIPE.reach, 30, 0.45), tween(1.2, (u) => {
        M.near.x = mix(x0, next.b, smooth(u));
        M.near.y = WIPE.y - (WIPE.y - top) * Math.min(1, Math.sin(u * PI) * 2.2);
      })]);
    }
    work.pose = null;
    work.phase = '';
    await Promise.all([setKey('lean', 0, 0.5), setKey('head', 0, 0.5)]);
    if (working(tok)) await toPocket('near');
  }

  // 皿：台の下（蓄音機の右の空いた所）から出し、ジュークボックスの上の猫の前へ。空いたら下げて台の下へ
  const dishGrip = () => ({ x: DISH.x + 9, y: DISH.y - 2 });
  async function giveMilk(tok) {
    await freeHands();
    await walkTo(MILK_X, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(-1);
    const under = { x: MILK_X - 30, y: 592 };
    await Promise.all([setKey('crouch', 1, 0.45), reach('near', under, 0.45)]);
    dish.milk = 1;
    bar.near = 'saucer';
    logEv('take', { hand: 'near', kind: 'saucer' });
    await Promise.all([setKey('crouch', 0, 0.45), reach('near', { x: under.x, y: 505 }, 0.45)]);
    // ここから置くまでは止めない（皿を持ったまま止まると、皿の置き場に困る）
    carry('near', 55, -HIP - 95);
    await walkTo(CAT_STAND, 55, 0.7);
    await turnTo(-1);
    work.pose = null;
    await setKey('lean', 0.1, 0.35);
    const g = dishGrip();
    await reach('near', { x: g.x + 8, y: g.y - 14 }, 0.5);
    await reach('near', g, 0.35);
    logEv('dishDown', { x: g.x, y: g.y });
    bar.near = null;
    dish.on = true;
    await reach('near', { x: g.x + 10, y: g.y - 10 }, 0.3);
    await release('near', 0.4);
    await setKey('lean', 0, 0.3);
    if (Math.random() < 0.7) mutter('milk');
    // 少し下がって、猫が飲みはじめるのを見守る
    await walkTo(CAT_STAND + 50, 45, 0.6, () => !working(tok));
    await turnTo(-1);
    await linger(2.4, tok);
  }
  async function collectDish() {
    await setKey('lean', 0.1, 0.35);
    const g = dishGrip();
    await reach('near', { x: g.x + 8, y: g.y - 12 }, 0.5);
    await reach('near', g, 0.3);
    logEv('dishUp', { x: g.x, y: g.y });
    dish.on = false;
    bar.near = 'saucer';
    await reach('near', { x: g.x + 10, y: g.y - 14 }, 0.35);
    await setKey('lean', 0, 0.3);
    await stowDish();
  }
  async function stowDish() {
    carry('near', 55, -HIP - 95);
    await walkTo(MILK_X, 70, 0.8);
    await turnTo(-1);
    work.pose = null;
    const under = { x: MILK_X - 30, y: 592 };
    await reach('near', { x: under.x, y: 505 }, 0.35);
    await Promise.all([setKey('crouch', 1, 0.45), reach('near', under, 0.45)]);
    logEv('stow', { hand: 'near', kind: 'saucer' });
    bar.near = null;
    await Promise.all([setKey('crouch', 0, 0.45), release('near', 0.45)]);
  }

  // 猫の様子を見る：見上げて、頭から背中へ撫でる（猫は手に頭を寄せ、しっぽを立てる）。空いた皿があれば下げる
  async function petCat(tok) {
    await freeHands();
    await walkTo(CAT_STAND, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(-1);
    await Promise.all([setKey('head', -0.18, 0.4), setKey('lean', 0.12, 0.5)]);
    const head = { x: CAT_B.x - 9, y: CAT_B.y - 58 };
    await reach('near', head, 0.7);
    // pose は猫のしぐさ（寝そべる・伸び・なめる）の残り。撫でる時は座り直している（試す.py が見る）
    logEv('pet', { ...head, pose: cat.lie + cat.stretch + cat.lick });
    for (let k = 0; k < 3 && working(tok); k++) {
      cat.petted = 1.6;
      await reach('near', { x: CAT_B.x - 21, y: CAT_B.y - 45 }, 0.45);
      await reach('near', { x: CAT_B.x - 32, y: CAT_B.y - 35 }, 0.4);
      await reach('near', { x: head.x, y: head.y - 3 }, 0.5);
    }
    if (Math.random() < 0.6) mutter('cat');
    await release('near', 0.5);
    await Promise.all([setKey('head', 0, 0.4), setKey('lean', 0, 0.4)]);
    if (working(tok) && dishDone()) await collectDish();
  }

  // 猫が飲み終えた皿は、次の仕事で必ず下げに行く（本人 2026-11-09「お皿を戻すしぐさが見られない」：猫の様子を見る仕事の
  // ついでにしか下げず、くじで猫が選ばれるまで皿が置きっぱなしだった）
  const dishDone = () => dish.on && dish.milk <= 0.03 && cat.drink < 0.05;
  async function clearDish(tok) {
    await freeHands();
    await walkTo(CAT_STAND, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(-1);
    await setKey('head', -0.12, 0.5);
    if (Math.random() < 0.7) mutter('dishDone');
    await setKey('head', 0, 0.4);
    await collectDish();
  }

  // 棚の整理：アルバムを1枚少し引き出して背の上を布でなで、戻して、棚板のほこりを払う。
  // 棚は体の奥の壁にあるので、触るのは奥の手だけ（本人 2026-11-09「手前の手が身体より手前にあるのに棚を拭いているような
  // しぐさになるのはおかしい。逆の手を使うか、身体に重ならない位置までのふき取りに。これも物理法則」）。
  // 布も奥の手に持ち、棚板を払うのは体に重ならない所まで
  async function tidyShelf(tok) {
    await freeHands();
    // 整えるのは上の段のジャケット（下の段の背は引き出さない）
    const n = jacketBoxes().length, i = work.shelfPick >= 0 ? work.shelfPick % n : Math.floor(Math.random() * n), b0 = jacketBoxes()[i];
    work.shelfPick = -1;
    await walkTo(shelfStand(b0.x + b0.w / 2), 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(-1);
    await fromPocket('far', 'cloth');
    work.phase = 'shelf';
    const c0 = { x: b0.x + b0.w / 2, y: b0.y + b0.w * 0.55 };
    await reach('far', c0, 0.6);
    logEv('shelf', { x: c0.x, y: c0.y, hx: M.handF.x, hy: M.handF.y });
    pop = i;
    await tween(0.5, (u) => {
      popU = u * 0.8;
      M.far.y = c0.y - popU * 6;
    });
    const top = jacketBoxes()[i].y - 3;
    for (let k = 0; k < 3; k++) {
      await reach('far', { x: b0.x + 2, y: top }, 0.45);
      await reach('far', { x: b0.x + b0.w - 2, y: top }, 0.45);
    }
    await reach('far', c0, 0.4);
    await tween(0.45, (u) => {
      popU = 0.8 * (1 - u);
      M.far.y = c0.y - popU * 6;
    });
    pop = -1;
    const edge = M.x - 22 * pathAt(M.x).s / 0.57;
    await reach('far', { x: b0.x - 24, y: 465 }, 0.5);
    await reach('far', { x: Math.min(b0.x + 54, edge), y: 465 }, 0.9);
    await reach('far', { x: b0.x - 6, y: 465 }, 0.7);
    work.phase = '';
    if (Math.random() < 0.4) mutter('shelf');
    await toPocket('far');
  }

  // 面が終わってレコードが止まっている間の、ピアノの調律と軽い演奏（本人 2026-11-09「ピアノの調律はもう少し時間かけて、
  // 軽い演奏などして調整してよい」）。音は PIANO（ピアノを作る.py）を BGM の再生器で鳴らす（レコードが止まっている間だけ
  // なので BGM とぶつからない）。手は音の時刻に合わせる：調律は奥の手で同じ鍵をたたき、手前の手のハンマーでピンを回す。
  // 弾く間は、左手・右手がそれぞれの鍵を押す。時刻は、鳴っていれば再生器の時刻、鳴らせなければ店の時計で進める
  const pressAt = (d) => (d < 0 ? 0 : d < 0.05 ? d / 0.05 : Math.max(0, 1 - (d - 0.05) / 0.2));
  // 調律でたたく指の持ち上げ（いちばん近い打鍵からの秒で決める。たたく時は 0）
  const tuneLift = (away) => 12 * smooth(clamp((away - 0.1) / 0.45, 0, 1));
  function pianoPose(pn, t) {
    const el = bgm.el, prev = pn.tau, dt = t - pn.last;
    if (bgm.piano === pn.clip && !el.paused) {
      pn.tau = el.currentTime;
      pn.heard = true;
    } else if (pn.heard) pn.dead = true;
    else pn.tau += dt;
    pn.last = t;
    const tau = pn.tau, keys = pn.clip.keys;
    // 1つの手でいっしょに押す鍵（同時か、0.15 秒以内に続けて弾く和音）の、まん中の高さ
    const chordAt = (h, t0) => {
      const g = keys.filter((k) => k.h === h && Math.abs(k.t - t0) <= 0.15);
      return g.reduce((s, k) => s + k.m, 0) / g.length;
    };
    // その手の、いま押している（か 0.25 秒後に押す）鍵（和音はまん中）へ手を寄せ、押した瞬間に沈める
    const put = (name, h) => {
      let t0 = null, press = 0, away = 9;
      for (const k of keys) {
        if (k.h !== h) continue;
        away = Math.min(away, Math.abs(tau - k.t));
        if (k.t > tau + 0.25) {
          if (t0 === null) t0 = k.t;
          break;
        }
        t0 = k.t;
        press = Math.max(press, pressAt(tau - k.t));
      }
      if (t0 === null) return;
      const m = chordAt(h, t0);
      const k = keyAt(m), s = pn.at[name] || (pn.at[name] = { x: M[name].x, y: M[name].y });
      const f = Math.min(1, dt * 25);
      s.x += (k.x - s.x) * f;
      s.y += (k.y - s.y) * f;
      // 調律は1つの鍵を強めにたたく（黒い鍵盤の上で、たたく手が見えるように）。たたく合間は指を持ち上げ、上から鍵へ下ろす
      // （鍵の上に置いたまま沈めるだけだと、調律の間ずっと手が宙で止まって見えた 2026-11-17）
      const lift = h === 'T' ? tuneLift(away) : 0;
      Object.assign(M[name], { x: s.x, y: s.y - lift + press * (h === 'T' ? 6 : 3.5), w: 1 });
    };
    if (work.phase === 'tune') {
      put('far', 'T');
      let a = 0;
      for (const r of pn.clip.turns) {
        if (tau >= r.t1) a = r.to;
        else {
          if (tau > r.t0) a = mix(a, r.to, smooth((tau - r.t0) / (r.t1 - r.t0)));
          break;
        }
      }
      bar.tilt = a;
      Object.assign(M.near, { x: pn.handle.x + a * 10, y: pn.handle.y - Math.abs(a) * 3, w: 1 });
      // たたいた瞬間を記録（試す.py が、手が鍵に届いているかを見る）。和音は1回に、手を置くまん中と比べる。
      // 描いた手の位置は1コマ遅れて分かるので、たたいたコマを描いた後（次のコマ）に記録する
      for (const p of pn.struck.splice(0)) logEv('strike', { m: p.m, x: p.x, y: p.y, hx: M.handF.x, hy: M.handF.y });
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k.h === 'T' && k.t > prev && k.t <= tau && !(i && keys[i - 1].h === 'T' && k.t - keys[i - 1].t < 0.3)) {
          const m = chordAt('T', k.t);
          pn.struck.push({ m, ...keyAt(m) });
        }
      }
    } else if (work.phase === 'play') {
      put('far', 'L');
      put('near', 'R');
    }
  }

  async function playPiano(tok) {
    await freeHands();
    const clip = PIANO[work.pianoTurn++ % PIANO.length];
    const url = blobUrl(clip.src);
    if (tall) follow(P.seat.x);
    await walkTo(STAGE_STAND, 78, 1, () => !working(tok));
    if (!working(tok)) return;
    await turnTo(1);
    if (Math.random() < 0.7) mutter('piano');
    await fromPocket('near', 'lever');
    await toBench();
    await setKey('sit', 1, 0.9);
    const handle = { x: TUNE_PIN.x + 5, y: TUNE_PIN.y - 9 }, key0 = keyAt(clip.keys[0].m);
    await Promise.all([reach('near', handle, 0.6), reach('far', { x: key0.x, y: key0.y - tuneLift(clip.keys[0].t) }, 0.6)]);
    logEv('tune', handle);
    if (!working(tok)) return;
    const pn = { clip, tau: 0, last: clock, heard: false, dead: false, at: { far: { ...key0 } }, handle, struck: [] };
    work.piano = pn;
    work.phase = 'tune';
    await bgmPiano(clip, await url);
    pn.last = clock;
    work.pose = (t) => pianoPose(pn, t);
    const until = (T) => tween(999, () => {}, (u) => u, () => !working(tok) || pn.dead || pn.tau >= T);
    await until(4.4);
    if (working(tok) && !pn.dead && Math.random() < 0.6) mutter('tune');
    await until(clip.tuneEnd);
    if (!working(tok) || pn.dead) return;
    // ハンマーをポケットへしまって、両手を鍵盤へ
    work.phase = 'ready';
    bar.tilt = 0;
    await toPocket('near');
    const firstOf = (h) => keyAt(clip.keys.find((k) => k.h === h && k.t >= clip.playAt - 0.01).m);
    await Promise.all([reach('near', firstOf('R'), 0.5), reach('far', firstOf('L'), 0.5)]);
    pn.at = {};
    await until(clip.playAt - 0.15);
    if (!working(tok) || pn.dead) return;
    work.phase = 'play';
    log.push({ ev: 'piano', act: 'play' });
    M.sync = 1;
    M.play = 1;
    await until(clip.playEnd);
    if (!working(tok) || pn.dead) return;
    // 弾き終えたら、余韻の間に手を膝へ下ろし、響きが消えてから立つ
    work.phase = 'after';
    M.play = 0;
    await Promise.all([release('near', 0.9), release('far', 0.9)]);
    M.sync = 0;
    await until(clip.len - 1.2);
    if (working(tok) && Math.random() < 0.6) mutter('pianoEnd');
    work.pose = null;
    work.phase = '';
    work.piano = null;
    log.push({ ev: 'piano', act: 'done' });
    await standUp();
  }
  function pianoStop() {
    work.piano = null;
    M.sync = 0;
    if (bgm.piano) bgmStop('piano');
  }

  // 針を置きかえる：面の終わりで回っている盤の、針の箱をつまんで持ち上げ、外の縁へ運んで下ろす
  async function moveArm(to, dur, keepUp = false) {
    await reach('near', armGrip(), 0.5);
    arm.held = true;
    const follow = () => Object.assign(M.near, armGrip(), { w: 1 });
    if (arm.lift < 1) {
      if (deck.disc === BGM_DISC && !bgm.el.paused) bgmStop('arm', 0.25);
      const l0 = arm.lift;
      await tween(0.35, (u) => {
        arm.lift = mix(l0, 1, u);
        follow();
      });
    }
    const u0 = arm.u;
    await tween(dur, (u) => {
      arm.u = mix(u0, to, u);
      follow();
    });
    if (!keepUp) {
      await tween(0.35, (u) => {
        arm.lift = 1 - u;
        follow();
      });
    }
  }
  async function needleBack() {
    await freeHands();
    if (tall) follow(760);
    await walkTo(830);
    await turnTo(-1);
    await setKey('lean', 0.1, 0.4);
    // ピアノの後なら、針を戻すことはもう言ってある
    if (!work.interlude && Math.random() < 0.6) mutter('needle');
    await moveArm(0, 1.0);
    logEv('needleBack', armGrip());
    arm.held = false;
    bgm.runout = false;
    work.interlude = false;
    bgmPlay();
    await release('near', 0.4);
    await setKey('lean', 0, 0.3);
  }

  // アルバムをかける前に、BGM のレコードの針を上げて外へよけ、盤を両手で持ち上げて台の下へしまう（盤が2枚重ならない）
  async function takeOffBgm() {
    if (deck.disc !== BGM_DISC) return;
    if (tall) follow(760);
    await walkTo(830);
    await turnTo(-1);
    await setKey('lean', 0.1, 0.4);
    // 上げた腕は盤の外に置いたまま（held のまま。曲の進みで戻らない）
    await moveArm(-0.2, 0.5, true);
    logEv('armUp', armGrip());
    await release('near', 0.4);
    await wait(0.4);
    M.carry = BGM_DISC;
    M.discFrom = { x: P.platter.x, y: P.platter.y - 3 };
    M.disc = { ...M.discFrom };
    deck.disc = null;
    await tween(0.8, (u) => (M.hold = u));
    await Promise.all([setKey('crouch', 1, 0.6), tween(0.6, (u) => (M.stow = u))]);
    log.push({ ev: 'stowDisc' });
    M.disc = null;
    M.carry = null;
    M.hold = M.stow = 0;
    await Promise.all([setKey('crouch', 0, 0.5), release('near', 0.4), release('far', 0.4), setKey('lean', 0, 0.4)]);
  }

  /* ---------- 店の中を立ち回る仕事（本人 2026-11-12「時計拭いたり、カーテン整えたり、イスやテーブルを拭いたり、ピアノ拭いたり、
     手すり拭いたり、掃除にならない華麗な感じで立ち回りましょう」） ---------- */
  // 背筋は伸ばしたまま、布をひと振りしてから、ひと筆でさっと拭く（ごしごしこすらない）。手を当てる間は phase 'touch'、
  // touch はその手（試す.py が、手が物の上にあるか＝宙を拭いていないかを見る）。奥の壁や舞台の物に触るのは奥の手。
  // レコードの面が終わったら、区切りで切り上げて戻る（BGM が鳴らないまま外で仕事を続けない）
  const roaming = (tok) => working(tok) && !(bgm.runout && bgm.on && bgm.started);
  const touching = (hand) => {
    work.phase = 'touch';
    work.touch = hand;
  };
  const untouch = () => {
    work.phase = '';
    work.touch = null;
  };
  // 布をひと振り（手首を返して、小さく上へ払う）
  async function flick(name) {
    const h = name === 'near' ? M.hand : M.handF, d = Math.sign(M.f) || 1, x = h.x, y = h.y;
    await reach(name, { x: x + 10 * d, y: y - 16 }, 0.28);
    await reach(name, { x: x + 3 * d, y: y - 5 }, 0.3);
  }
  // 手で点の並びをなめらかにたどる（拭くひと筆）。押されたら、そこでやめる
  function stroke(name, pts, dur, until) {
    const h = M[name];
    return tween(dur, (u) => {
      const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), v = f - i;
      Object.assign(h, { x: mix(pts[i].x, pts[i + 1].x, v), y: mix(pts[i].y, pts[i + 1].y, v), w: 1 });
    }, smooth, until);
  }

  // 時計：文字盤の左下に立って見上げ、ガラスを布でゆっくり2回まわして拭く。半歩下がって見上げ、小さくうなずく。
  // 腕をほぼ伸ばして届く所に立つ（近いと肘が深く曲がり、肘の鋲が口の前に来て、腕があごから出て見えた 2026-11-12）。
  // 振り子の窓は顔の高さで、横向きの手が顔の前を横切るので拭かない
  const CLOCK_AT = { stand: 1186, x: 1225, y: 370, r: 7 };
  async function wipeClock(tok) {
    await freeHands();
    await walkTo(CLOCK_AT.stand, 78, 1, () => !working(tok));
    if (!roaming(tok)) return;
    await turnTo(1);
    await Promise.all([fromPocket('far', 'cloth'), setKey('head', -0.2, 0.6)]);
    await flick('far');
    await reach('far', { x: CLOCK_AT.x - CLOCK_AT.r, y: CLOCK_AT.y }, 0.7);
    touching('far');
    if (Math.random() < 0.4) mutter('clock');
    await tween(3.4, (u) => {
      const a = PI + u * 2 * TAU;
      Object.assign(M.far, { x: CLOCK_AT.x + Math.cos(a) * CLOCK_AT.r, y: CLOCK_AT.y + Math.sin(a) * CLOCK_AT.r * 0.9, w: 1 });
    }, (u) => u, () => !roaming(tok));
    untouch();
    if (!working(tok)) return;
    await reach('far', { x: CLOCK_AT.x - 12, y: CLOCK_AT.y + 34 }, 0.5);
    await toPocket('far');
    if (!roaming(tok)) return;
    await shuffle(CLOCK_AT.stand - 14, 0.8);
    await setKey('head', -0.26, 0.5);
    await linger(1.0, tok);
    await setKey('head', -0.12, 0.35);
    await setKey('head', 0, 0.5);
  }

  // カーテン：舞台の左の幕の左に立って幕へ向き、留め紐をそっと持ち上げて形を直してから、ひだを上から下へ手のひらでなでおろす
  // （2本）。幕の右に立つと、幕のほとんどと手が体に隠れて、何をしているか読めなかった（2026-11-12）
  const CURTAIN_AT = { stand: 1250, tie: { x: 1287, y: 505 },
    folds: [[{ x: 1285, y: 522 }, { x: 1284, y: 540 }, { x: 1284, y: 555 }], [{ x: 1294, y: 522 }, { x: 1293, y: 538 }, { x: 1293, y: 552 }]] };
  async function smoothCurtain(tok) {
    await freeHands();
    await walkTo(CURTAIN_AT.stand, 78, 1, () => !working(tok));
    if (!roaming(tok)) return;
    await turnTo(1);
    await Promise.all([reach('far', CURTAIN_AT.tie, 0.7), setKey('head', -0.06, 0.6)]);
    await reach('far', { x: CURTAIN_AT.tie.x + 2, y: CURTAIN_AT.tie.y - 4 }, 0.35);
    await reach('far', CURTAIN_AT.tie, 0.35);
    if (Math.random() < 0.4) mutter('curtain');
    for (const f of CURTAIN_AT.folds) {
      if (!roaming(tok)) break;
      await reach('far', f[0], 0.45);
      touching('far');
      await stroke('far', f, 1.4, () => !roaming(tok));
      untouch();
      await reach('far', { x: f[2].x - 6, y: f[2].y - 6 }, 0.3);
    }
    untouch();
    await Promise.all([release('far', 0.5), setKey('head', 0, 0.4)]);
  }

  // ピアノ：椅子の左横（STAGE_STAND。椅子に重ならない所）に立ち、身を傾けて、鍵盤の奥の板の左の方を左から右へ、
  // 布でひと筆ずつ2回。筋は、ほぼ伸ばした腕が届く所まで（椅子の上に立って拭いていた時は 1380 まで）。
  // 椅子の右へは回らない（椅子をすり抜ける）。鍵は押さない（音を立てない。弾く流れとぶつからない）
  const KEYS_AT = { stand: STAGE_STAND, lean: 0.25,
    strokes: [[{ x: 1335, y: 540 }, { x: 1348, y: 540 }, { x: 1361, y: 541 }], [{ x: 1336, y: 549 }, { x: 1344, y: 549 }, { x: 1352, y: 550 }]] };
  async function wipeKeys(tok) {
    await freeHands();
    await walkTo(KEYS_AT.stand, 78, 1, () => !working(tok));
    if (!roaming(tok)) return;
    await turnTo(1);
    await fromPocket('far', 'cloth');
    await flick('far');
    await setKey('lean', KEYS_AT.lean, 0.5);
    for (const s of KEYS_AT.strokes) {
      if (!roaming(tok)) break;
      await reach('far', s[0], 0.6);
      touching('far');
      await stroke('far', s, 1.6, () => !roaming(tok));
      untouch();
      await reach('far', { x: s[2].x - 6, y: s[2].y - 14 }, 0.35);
    }
    untouch();
    if (!working(tok)) return;
    if (roaming(tok) && Math.random() < 0.4) mutter('keys');
    await Promise.all([setKey('lean', 0, 0.5), toPocket('far')]);
  }

  // 手すり：カウンターの左の斜めの手すりを、上の端から下へ。布を当てたまま、手すりに沿ってゆっくり歩いて下りる
  const RAIL_AT = { a: { x: 614, y: 528 }, b: { x: 700, y: 492 }, lead: 30 };
  const railY = (x) => RAIL_AT.a.y + ((RAIL_AT.b.y - RAIL_AT.a.y) * (x - RAIL_AT.a.x)) / (RAIL_AT.b.x - RAIL_AT.a.x) + 1;
  async function wipeRail(tok) {
    await freeHands();
    await walkTo(RAIL_AT.b.x + RAIL_AT.lead - 2, 78, 1, () => !working(tok));
    if (!roaming(tok)) return;
    await turnTo(-1);
    await fromPocket('far', 'cloth');
    await flick('far');
    const hx = () => clamp(M.x - RAIL_AT.lead, RAIL_AT.a.x + 8, RAIL_AT.b.x - 4);
    await reach('far', { x: hx(), y: railY(hx()) }, 0.6);
    touching('far');
    if (Math.random() < 0.4) mutter('rail');
    work.pose = () => Object.assign(M.far, { x: hx(), y: railY(hx()), w: 1 });
    await walkTo(RAIL_AT.a.x + RAIL_AT.lead + 10, 16, 0.4, () => !roaming(tok));
    work.pose = null;
    untouch();
    if (!working(tok)) return;
    if (roaming(tok)) await flick('far');
    await toPocket('far');
  }

  // 丸イス：カウンターの左の端とソファの間からお客の側へ出て、左のイスから順に、座面を布でひと払いずつ。
  // 終わったら同じ所から、カウンターの奥へ戻る
  const STOOL_X = [747, 837, 929, 1020, 1113], SEAT_Y = 592;
  async function wipeStools(tok) {
    await freeHands();
    await walkTo(AISLE.in, 78, 1, () => !working(tok));
    if (!roaming(tok)) return;
    await crossAisle(1);
    await fromPocket('far', 'cloth');
    await flick('far');
    if (Math.random() < 0.4) mutter('stools');
    for (const x of STOOL_X) {
      if (!roaming(tok)) break;
      await walkTo(x - 38, 60, 0.8, () => !working(tok), true);
      await turnTo(1);
      await reach('far', { x: x - 16, y: SEAT_Y - 2 }, 0.45);
      touching('far');
      await stroke('far', [{ x: x - 16, y: SEAT_Y - 2 }, { x, y: SEAT_Y }, { x: x + 16, y: SEAT_Y - 1 }], 0.9, () => !roaming(tok));
      untouch();
      await reach('far', { x: x + 12, y: SEAT_Y - 18 }, 0.3);
      await release('far', 0.35);
    }
    untouch();
    if (!working(tok)) return;
    await toPocket('far');
    await stepIn();
  }

  // ソファ：通り道に面した手前のソファの背もたれを、通路の側から整える（本人 2026-11-12 テーブルの代わりに「それでいい」。
  // テーブルはソファに囲まれて通れる道が無い）。カウンターの左の端とソファの間を手前へ下り、背もたれの右の端の横の白い床に立って、
  // 左を向き、手前の手の布で右の端の上の縁をなで、角を軽く2度たたいて形を直す。縁は腰の高さなので、膝は曲げず腰から少し倒すだけ。
  // 足は背もたれの床の角（y 784）より少し奥、体はソファの黒い所（x 678 まで）にかからない所。背もたれの後ろ（x 608）で
  // かがんでいた時は、そこが絵の上ではソファの厚みの中で、体の下半分がソファに埋もれた（本人 2026-11-17「足がソファより手前に
  // 乗ってしまっている」「まだ半分本当に埋もれている」）。立つ所はセリフの字が出る床なので、字が消えてから出て、横にいる間は
  // 話さない（ひとことは戻ってから）。お客に呼ばれて字が出たら、そこで切り上げて戻る
  const SOFA_AT = { x: 727, foot: 770, lean: 0.15, top: [{ x: 675, y: 579 }, { x: 669, y: 583.5 }, { x: 663, y: 588 }] };
  const SOFA_SIDE = { x: SOFA_AT.x, z: (SOFA_AT.foot - pathAt(SOFA_AT.x, 0).y) / (FLOOR.y - pathAt(SOFA_AT.x, 0).y) };
  const aside = () => across === SOFA_SIDE;
  const talking = () => $('#say').style.opacity === '1';
  // セリフの字が出ている間は待つ（消えていく 0.5 秒も）
  async function hush(tok) {
    if (!talking()) return;
    await tween(60, () => {}, (u) => u, () => !working(tok) || !talking());
    await linger(0.6, tok);
  }
  async function smoothSofa(tok) {
    await freeHands();
    await walkTo(AISLE.in, 78, 1, () => !working(tok));
    if (!roaming(tok)) return;
    across = SOFA_SIDE;
    await hush(tok);
    if (!roaming(tok)) {
      across = null;
      return;
    }
    await crossAisle(1, SOFA_SIDE);
    const tidy = () => roaming(tok) && !talking();
    if (tidy()) {
      await turnTo(-1);
      await fromPocket('near', 'cloth');
      await flick('near');
      await Promise.all([setKey('lean', SOFA_AT.lean, 0.8), reach('near', SOFA_AT.top[0], 0.8)]);
      touching('near');
      for (let k = 0; k < 2 && tidy(); k++) {
        await stroke('near', SOFA_AT.top, 1.2, () => !tidy());
        await stroke('near', [...SOFA_AT.top].reverse(), 0.9, () => !tidy());
      }
      untouch();
      const c0 = SOFA_AT.top[0];
      for (let k = 0; k < 2 && tidy(); k++) {
        await reach('near', { x: c0.x, y: c0.y - 7 }, 0.25);
        await reach('near', c0, 0.2);
      }
      // 呼ばれた時は、身を起こして布を持ったまま、すぐ戻る（布は戻ってからしまう）
      if (tidy()) await Promise.all([setKey('lean', 0, 0.7), reach('near', { x: c0.x + 20, y: c0.y - 30 }, 0.7)]);
      else await Promise.all([setKey('lean', 0, 0.4), release('near', 0.4)]);
    }
    if (!working(tok)) return;
    if (tidy() && bar.near === 'cloth') await toPocket('near');
    await stepIn();
    if (bar.near === 'cloth') await toPocket('near');
    if (roaming(tok) && !talking() && Math.random() < 0.4) mutter('sofa');
  }

  const CHORES = { polish: polishGlass, under: underGlass, prep: prepWork, wipe: wipeCounter, cat: petCat, milk: giveMilk,
    dish: clearDish, shelf: tidyShelf, piano: playPiano, needle: needleBack,
    clock: wipeClock, curtain: smoothCurtain, keys: wipeKeys, rail: wipeRail, stools: wipeStools, sofa: smoothSofa };
  // 仕事の重み（本人 2026-11-09「マスターグラス拭きすぎですね」）。同じ仕事・似た仕事（SIMILAR）は続けない。
  // ミルクは皿が下がってから。ピアノと針は、面が終わった時だけ（workLoop）。
  // 仕込みは 2 だと、グラス拭きの後に選べる中でいちばん重く、くじの 17%・手すきの時間の 24% を占めた
  // （本人 2026-11-12「マスターレモン切る回数多すぎですね」）。1回 32 秒と長いので、短い仕事（立ち回る仕事）が増えた後も
  // 時間でほかの仕事を超えないよう 0.8 に。立ち回る仕事6つは合わせて、仕事の4回に1回ほど（続けて外へは出ない）
  const WEIGHT = { polish: 2.5, under: 1.5, prep: 0.8, wipe: 1.6, cat: 1.4, milk: 1, shelf: 1.2,
    clock: 0.8, curtain: 0.8, keys: 0.8, rail: 0.8, stools: 1, sofa: 0.8 };
  // 続けない似た仕事：グラスを拭く・店の中を立ち回る・家具を拭く（カウンターと丸イス）
  const SIMILAR = [new Set(['polish', 'under']), new Set(['clock', 'curtain', 'keys', 'rail', 'stools', 'sofa']), new Set(['wipe', 'stools'])];
  function pickChore(last = work.last, dishOn = dish.on) {
    const ok = (n) => n !== last && !SIMILAR.some((g) => g.has(n) && g.has(last)) && !(n === 'milk' && dishOn);
    const list = Object.keys(WEIGHT).filter(ok);
    let r = Math.random() * list.reduce((s, n) => s + WEIGHT[n], 0);
    for (const n of list) if ((r -= WEIGHT[n]) < 0) return n;
    return list[list.length - 1];
  }
  async function doChore(name, tok) {
    log.push({ ev: 'chore', name, t: clock });
    work.last = name;
    await CHORES[name](tok);
    log.push({ ev: 'choreDone', name, t: clock });
  }

  // 面が終わっていれば、ときどきピアノを弾いてから針を戻す。ほかは重みで仕事を選び、合間に少し手を休める
  async function workLoop(tok) {
    if (bar.far === 'wglass' && !work.next) work.next = 'polish';
    while (working(tok)) {
      if (bgm.runout && bgm.on && bgm.started) {
        if (!work.interlude && (work.only === 'piano' || Math.random() < work.pianoOdds)) {
          work.interlude = true;
          await doChore('piano', tok);
        }
        if (working(tok)) await doChore('needle', tok);
      } else if (work.only === 'piano') {
        // ?chore=piano：音を鳴らせるのは押した後なので、押されるまで手を休めて待つ
        await linger(0.5, tok);
        continue;
      } else {
        // ?chore=milk は、猫が飲んでいる間は持ち場でグラスを磨き（そばにいると猫が飲まない）、飲み終えたら皿を下げて、またミルク
        const name = work.next || (dishDone() ? 'dish' : null) || (work.only === 'milk' && dish.on ? 'polish' : work.only) || pickChore();
        work.next = null;
        await doChore(name, tok);
      }
      // 面が終わっていたら、ひと休みせずにレコードへ（店が静かなままにしない）
      if (working(tok) && !(bgm.runout && bgm.on && bgm.started)) await linger(1 + Math.random() * 1.5, tok);
    }
  }

  /* ---------- 棚の一覧 ---------- */

  const shelf = $('#shelf');
  let shelfOpenedAt = 0;

  function openShelf() {
    if (state === 'mv') return;
    stopGuide();
    const box = shelf.querySelector('.jackets');
    box.innerHTML = '';
    ALBUMS.forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'jacket';
      const img = document.createElement('img');
      img.src = `大/${encodeURIComponent(a.id)}.jpg`;
      img.alt = '';
      const vars = albumVars(i), jk = LABELS.jacket || ['{no}', '{title}', '{sub}'];
      const no = document.createElement('span');
      no.className = 'no';
      T.put(no, T.fill(jk[0], vars));
      const ti = document.createElement('span');
      ti.className = 'ti';
      T.put(ti, T.fill(jk[1], vars));
      const sub = document.createElement('span');
      sub.className = 'ti';
      T.put(sub, T.fill(jk[2], vars));
      b.append(img, no, ti, sub);
      b.addEventListener('click', () => {
        if (performance.now() - shelfOpenedAt < 450 / FAST) return;
        if (albumSongs(i).length > 1) {
          openTracks(i);
          return;
        }
        closeShelf();
        pressAlbum(i);
      });
      box.append(b);
    });
    shelf.hidden = false;
    shelfOpenedAt = performance.now();
  }

  function closeShelf() {
    shelf.hidden = true;
  }

  /* ---------- 曲の一覧（棚の次の段。曲が2本以上のアルバム） ----------
     1曲ずつ（一覧の曲を押す）・順にメドレー・マスターのおまかせ（このアルバムの中を順不同）を選ぶ。どれを選んでも、マスターが
     棚からアルバムを取って蓄音機に置き、針を下ろしてから流す。メドレーの2つは、押したそのタップで全画面に入る。
     開く時に履歴へ1段積み、端末の「戻る」と「棚にもどる」で棚へ戻る（成果物の基本 5） */
  const tracksEl = $('#tracks');
  let tracksOpenedAt = 0, tracksAlbum = -1, ownBack = 0;
  function openTracks(i) {
    if (state === 'mv') return;
    const a = ALBUMS[i], jacket = `大/${encodeURIComponent(a.id)}.jpg`;
    tracksAlbum = i;
    tracksEl.querySelector('.head img').src = jacket;
    T.put(tracksEl.querySelector('.head h2'), a.title);
    T.put(tracksEl.querySelector('.head p'), a.sub || '');
    tracksEl.querySelector('ol').replaceChildren(...albumSongs(i).map((j) => {
      const tr = trackOf(SONGS[j]), li = document.createElement('li'), b = document.createElement('button');
      const img = document.createElement('img'), name = document.createElement('span');
      b.className = 'track';
      b.dataset.song = j;
      img.alt = '';
      img.decoding = 'async';
      // サムネ（曲/<動画id>.jpg）が無ければ、アルバムのジャケット
      img.addEventListener('error', () => (img.src = jacket), { once: true });
      img.src = `曲/${encodeURIComponent(tr.id)}.jpg`;
      T.put(name, tr.short || tr.title);
      b.append(img, name);
      b.addEventListener('click', () => chooseTracks(i, [j], 'album'));
      li.append(b);
      return li;
    }));
    tracksEl.hidden = false;
    tracksEl.scrollTop = 0;
    tracksOpenedAt = performance.now();
    try {
      history.pushState({ cafe: 'tracks' }, '');
    } catch (e) {
      /* 戻るで棚へ戻れないだけで、「棚にもどる」はある */
    }
    log.push({ ev: 'tracks', id: a.id });
  }
  // 閉じるのはその場で。積んだ1段は自分で戻し、その戻った知らせは1回だけ聞き流す（成果物の基本 5「自分で履歴を戻した知らせは遅れて届く」）
  function closeTracks(viaPop = false) {
    if (tracksEl.hidden) return;
    tracksEl.hidden = true;
    tracksAlbum = -1;
    if (!viaPop && history.state && history.state.cafe === 'tracks') {
      ownBack++;
      history.back();
    }
  }
  function chooseTracks(i, order, kind) {
    if (performance.now() - tracksOpenedAt < 450 / FAST || state === 'acting' || state === 'mv') return;
    closeTracks();
    closeShelf();
    pressAlbum(i, { order, kind, full: order.length > 1 });
  }
  for (const b of tracksEl.querySelectorAll('[data-mode]')) {
    b.addEventListener('click', () => {
      const i = tracksAlbum;
      if (i < 0) return;
      if (b.dataset.mode === 'medley') chooseTracks(i, albumSongs(i), 'albumMedley');
      else chooseTracks(i, masterOrder(albumSongs(i)), 'albumOmakase');
    });
  }
  $('#tracksBack').addEventListener('click', () => closeTracks());

  /* ---------- 店の上に重ねて開く窓（店の設定の books・book。絵の中の物から、別のページを開く受け口） ----------
     中は同じ住所のページを iframe で開く。開いている間も BGM は鳴り続け、マスターは手すきのまま（話しかけない）。
     端末の「戻る」・「‹ 店にもどる」で閉じる。中のページからは parent.cafeBook.close() で閉じられる。
     窓は開くたびに作り、閉じたら外す（iframe の src を書きかえると、端末の履歴に1段増える）。
     窓の中のページは、端末の履歴に自分で段を積まない。冊をひらく・写真を大きく・ほかのページへ、と段を進める時は、店が履歴に
     1段積み（cafeBook.push・go。中のページの受け渡しは、本のページの 店の窓.js）、端末の「戻る」は店に届いてから、窓の中のページへ
     popstate として渡す。閉じる時は、窓で積んだ段ごと1回で戻す。窓の中で積むと、窓を外した後に中の段が残り、閉じた後の「戻る」が
     空振りした（Chromium で2つのやり方を比べた 2026-11-17） */
  const bookEl = $('#book');
  // bookGen は開くたびに増やす印（前に開いた窓の段と見分ける）。bookRestore は、戻るで別のページへ戻した時に渡す、その段の様子。
  // bookBackAt は窓の中のページが1段戻した時刻（着くまで）、bookOwe は、それが着く前に窓を閉じた印（着いてから窓の段ごと戻す）
  let bookSpot = null, bookGen = 0, bookRestore = null, bookBackAt = -1e9, bookOwe = false;
  const bookFrame = () => bookEl.querySelector('iframe');
  const bookEntry = (st) => !!st && st.cafe === 'book' && st.g === bookGen;
  function openBook(src = BOOK_LIST.length === 1 ? BOOK_LIST[0].src : '', title = BOOK_LIST.length === 1 ? BOOK_LIST[0].title || '' : '') {
    if (!src || state === 'mv' || state === 'acting' || !bookEl.hidden || storefront.covering()) return false;
    stopGuide();
    closeShelf();
    closeTracks(true);
    closeMenu();
    // 本の一覧から選んだ時は、一覧の段をこの窓の段に置きかえる（窓を閉じると店へ）
    const fromList = booksOpen();
    if (booksEl) booksEl.hidden = true;
    const frame = document.createElement('iframe');
    frame.title = title;
    frame.src = src;
    bookFrame().replaceWith(frame);
    bookEl.hidden = false;
    document.body.classList.add('book');
    bookGen++;
    bookRestore = null;
    bookOwe = false;
    const entry = { cafe: 'book', g: bookGen, d: 0, s: null, u: frame.src };
    try {
      if (fromList && history.state && history.state.cafe === 'books') history.replaceState(entry, '');
      else history.pushState(entry, '');
    } catch (e) {
      /* 戻るで閉じられないだけで、「店にもどる」はある */
    }
    log.push({ ev: 'book', act: 'open', src });
    return true;
  }
  function closeBook(viaPop = false) {
    if (bookEl.hidden) return;
    bookEl.hidden = true;
    document.body.classList.remove('book');
    bookRestore = null;
    const blank = document.createElement('iframe');
    blank.title = '';
    bookFrame().replaceWith(blank);
    // 閉じた直後の押し（2回目のタップ）を、下の店の物に抜けさせない
    closedAt = performance.now();
    log.push({ ev: 'book', act: 'close' });
    if (!viaPop && bookEntry(history.state)) {
      // 窓の中のページが戻した段がまだ着いていない時は、着いてから戻す（今戻すと、着いた段からさらに戻って行き過ぎる）
      if (performance.now() - bookBackAt < 1000) bookOwe = true;
      else {
        ownBack++;
        history.go(-(history.state.d + 1));
      }
    }
    // 戻ったら、マスターはひとこと（手すきの話は、ここから数える）
    lastTalk = clock;
    if (state === 'idle' && LINES.bookAfter && LINES.bookAfter.length) say(pick('bookAfter'));
  }
  // 端末の「戻る」「進む」で着いた段が、いま開いている窓の段なら、窓の中のページへ渡す。別のページの段なら、そのページに置きかえて
  // 読み、段の様子は読んだページが受け取る（restore）
  function bookStep(st) {
    if (!bookEntry(st)) return false;
    try {
      const w = bookFrame().contentWindow;
      if (st.u && new URL(st.u).pathname !== w.location.pathname) {
        bookRestore = { u: st.u, s: st.s };
        w.location.replace(st.u);
      } else {
        if (st.u) w.history.replaceState(st.s, '', st.u);
        else w.history.replaceState(st.s, '');
        w.dispatchEvent(new w.PopStateEvent('popstate', { state: st.s }));
      }
    } catch (e) {
      /* 窓の中が読めない時は、店の側の段だけ動く */
    }
    log.push({ ev: 'book', act: 'step', d: st.d });
    return true;
  }
  $('#bookClose').addEventListener('click', () => closeBook());
  // 窓の中のページの「閉じて」の知らせ（受け口を直接呼べない時）。同じ住所の、この窓のページからだけ受ける
  addEventListener('message', (e) => {
    const f = bookFrame();
    if (bookEl.hidden || e.origin !== location.origin || !f || e.source !== f.contentWindow) return;
    if (e.data && e.data.type === 'hon:close') closeBook();
  });
  window.cafeBook = {
    open: openBook,
    close: () => closeBook(),
    isOpen: () => !bookEl.hidden,
    // ここから下は窓の中のページから（本のページの 店の窓.js）。push は段を1つ積み（s はその段の様子、u はその時のページの住所）、
    // replace は今の段の様子を書きかえ、back は1段戻る。go は同じ住所のほかのページへ段を1つ積んで置きかえる
    push(s, u) {
      if (bookEl.hidden || !bookEntry(history.state)) return false;
      const d = history.state.d + 1;
      history.pushState({ cafe: 'book', g: bookGen, d, s: s == null ? null : s, u: String(u || '') }, '');
      log.push({ ev: 'book', act: 'push', d });
      return true;
    },
    replace(s, u) {
      if (bookEl.hidden || !bookEntry(history.state)) return false;
      history.replaceState({ ...history.state, s: s == null ? null : s, u: String(u || history.state.u) }, '');
      return true;
    },
    back() {
      if (bookEl.hidden) return;
      bookBackAt = performance.now();
      history.back();
    },
    go(u) {
      if (bookEl.hidden || !bookEntry(history.state)) return false;
      const url = new URL(u, bookFrame().src);
      if (url.origin !== location.origin) return false;
      const d = history.state.d + 1;
      bookRestore = null;
      history.pushState({ cafe: 'book', g: bookGen, d, s: null, u: url.href }, '');
      bookFrame().contentWindow.location.replace(url.href);
      log.push({ ev: 'book', act: 'go', d });
      return true;
    },
    restore(href) {
      const r = bookRestore;
      bookRestore = null;
      return r && r.u === href ? r.s : null;
    },
  };

  /* ---------- テーブルの本の一覧（店の設定の本が2冊以上の店だけ。棚の一覧と同じ地の色と字） ----------
     押すと本の一覧を出し（履歴に1段）、選ぶと窓でひらく */
  let booksEl = null, booksOpenedAt = 0;
  const booksOpen = () => !!booksEl && !booksEl.hidden;
  function openBooks() {
    if (!booksEl || state === 'mv' || state === 'acting' || !bookEl.hidden || booksOpen() || storefront.covering()) return false;
    stopGuide();
    closeShelf();
    closeMenu();
    booksEl.hidden = false;
    booksEl.scrollTop = 0;
    booksOpenedAt = performance.now();
    try {
      history.pushState({ cafe: 'books' }, '');
    } catch (e) {
      /* 戻るで閉じられないだけで、「店にもどる」はある */
    }
    log.push({ ev: 'books', act: 'open' });
    return true;
  }
  function closeBooks(viaPop = false) {
    if (!booksOpen()) return;
    booksEl.hidden = true;
    closedAt = performance.now();
    if (!viaPop && history.state && history.state.cafe === 'books') {
      ownBack++;
      history.back();
    }
  }
  function chooseBook(i) {
    if (!booksOpen() || performance.now() - booksOpenedAt < 450 / FAST) return;
    const bk = BOOK_LIST[i];
    log.push({ ev: 'books', act: 'pick', i });
    openBook(bk.src, bk.title || '');
  }
  if (BOOK_LIST.length > 1) {
    booksEl = document.createElement('div');
    booksEl.id = 'books';
    booksEl.hidden = true;
    const head = document.createElement('h2');
    head.textContent = TABLE_BOOKS.title || '';
    const list = document.createElement('div');
    list.className = 'list';
    BOOK_LIST.forEach((bk, i) => {
      const b = document.createElement('button');
      b.dataset.book = i;
      const cover = document.createElement('i');
      cover.className = `cover ${bk.kind || 'booklet'}`;
      cover.style.setProperty('--c', bk.cover || LABEL[i % LABEL.length]);
      const words = document.createElement('span');
      words.append(T.put(document.createElement('b'), bk.title || ''));
      if (bk.note) words.append(T.put(document.createElement('small'), bk.note));
      b.append(cover, words);
      b.addEventListener('click', () => chooseBook(i));
      list.append(b);
    });
    const back = document.createElement('button');
    back.id = 'booksBack';
    back.textContent = $('#menuBack').textContent;
    back.addEventListener('click', () => closeBooks());
    booksEl.append(head, list, back);
    document.body.append(booksEl);
  }
  // 窓を開く所（絵の上の押せる所）は、本を置く店だけに作る。box は絵の座標 [x, y, 幅, 高さ]（無ければテーブル）。
  // 1冊なら押すとすぐ窓、2冊からは本の一覧
  if (BOOK_LIST.length) {
    bookSpot = document.createElement('button');
    bookSpot.className = 'spot';
    bookSpot.id = 'spotBook';
    const tag = TABLE_BOOKS.tag || [];
    if (TABLE_BOOKS.aria) bookSpot.setAttribute('aria-label', TABLE_BOOKS.aria);
    bookSpot.innerHTML = '<span class="tag"><b></b><small></small></span>';
    bookSpot.querySelector('b').textContent = tag[0] || '';
    bookSpot.querySelector('small').textContent = tag[1] || '';
    bookSpot.addEventListener('click', () => (booksEl ? openBooks() : openBook()));
    $('#spots').append(bookSpot);
    // 縦の画面の下のボタンの列にも、テーブルの本を1つ（本人 2026-11-20）
    const bookBtn = $('#panel button[data-go="books"]');
    if (bookBtn) {
      bookBtn.hidden = false;
      $('#panel').classList.add('five');
      if (TABLE_BOOKS.aria) bookBtn.setAttribute('aria-label', TABLE_BOOKS.aria);
    }
  }

  /* ---------- 続きから（成果物の基本 5「曲・動画・メドレーは、止めた所を覚えて続きから」） ----------
     上映の途中で YouTube へ出た・アプリを切り替えた・読み直した・店にもどった時、聞いていた並び（曲の名前で）・何曲目・位置を
     タブの中（sessionStorage）に覚える。店に戻ったらマスターが「続きを…」と聞き、札を押した時だけ続きから流す（音は押してから）。
     頭から流すのは、選び直した時だけ。最後まで見終えたら忘れる */
  const RESUME_KEY = KEY + '-cafe-resume', resumeEl = $('#resume'), resumeGoBtn = $('#resumeGo');
  let resumeAt = null;
  function playPos() {
    if (!current) return 0;
    if (!ytBox.hidden && yt.player && yt.player.getCurrentTime) return Number(yt.player.getCurrentTime()) || 0;
    return video.hidden ? 0 : video.currentTime || 0;
  }
  function saveResume() {
    if (!current || current.finished) return;
    // 少し前から（どこで止めたか分かるよう）
    const r = { songs: current.order.map(songKey), k: current.k, kind: current.kind, at: Math.max(0, Math.floor(playPos()) - 2) };
    resumeAt = { order: current.order, k: r.k, kind: r.kind, at: r.at };
    try {
      sessionStorage.setItem(RESUME_KEY, JSON.stringify(r));
    } catch (e) {
      /* このページを開いている間だけ覚える */
    }
    log.push({ ev: 'resume', act: 'save', k: r.k, at: r.at });
  }
  function dropResume() {
    resumeAt = null;
    resumeEl.hidden = true;
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch (e) {
      /* 覚えていないだけ */
    }
  }
  // 読み直した時：覚えた曲の名前を、今のアルバムの並びの番号に戻す（並びが変わって無い曲があれば、続きは出さない）
  try {
    const r = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null');
    if (r && Array.isArray(r.songs)) {
      const order = r.songs.map((key) => SONGS.findIndex((_, j) => songKey(j) === key));
      if (order.length && order.every((j) => j >= 0) && r.k >= 0 && r.k < order.length) resumeAt = { order, k: r.k, kind: r.kind, at: r.at || 0 };
    }
  } catch (e) {
    /* 続きは出さない */
  }
  const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  // 札は、店で手すきの時（棚・メニュー・曲の一覧・窓が閉じている時）だけ。毎コマ見て、変わった時だけ書く
  function resumeTick() {
    const want = !!resumeAt && state === 'idle' && shelf.hidden && menuEl.hidden && tracksEl.hidden && bookEl.hidden && !booksOpen() && !storefront.covering();
    if (want === !resumeEl.hidden) return;
    if (want) {
      const g = LABELS.resumeGo || ['', ''];
      T.twoLine(resumeGoBtn, g[0], T.chunks(T.fill(g[1], { ...songVars(resumeAt.order, resumeAt.k), time: mmss(resumeAt.at) })));
    }
    resumeEl.hidden = !want;
    log.push({ ev: 'resume', act: want ? 'show' : 'hide' });
  }
  function pressResume() {
    const r = resumeAt;
    if (!r) return;
    start(pick('resumeGo'), { order: r.order, k: r.k, at: r.at, kind: r.kind, full: r.order.length > 1, resume: true }, async () => {
      await prepare();
      await bow(P.platter.x, null);
      await bloomFrom({ x: 770, y: 450 });
    });
  }
  resumeGoBtn.addEventListener('click', pressResume);
  $('#resumeNo').addEventListener('click', () => {
    dropResume();
    if (state === 'idle') say(pick('resumeNo'));
    log.push({ ev: 'resume', act: 'no' });
  });

  /* ---------- 画面の大きさ ---------- */

  let lastK = 0, fitPanelH = 0;
  // 横に倒したスマホ（背の低い画面。上映の操作の並び＝index.html の @media と同じ条件）。店の絵ぜんたいが小さく写るので、札は
  // 絵の倍率（--s）に合わせて小さく1行に、セリフは和紙の札にして札の無い床へ（本人 2026-11-17「スマホで横長にするとマスターの
  // メッセージも埋まり、各種メニュー欄も画像を隠しすぎる」）。FLAT_SAY はテーブルの本の札とメニューの札の間、ジュークボックスと
  // 棚の札より下（試す.py の flat_layout が、全部のセリフで札とクレジットに重ならないかを見る）
  const FLAT = matchMedia('(orientation: landscape) and (max-height: 520px) and (pointer: coarse)');
  const FLAT_SAY = { x: 824, y: 775 };
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    tall = vw / vh < 1.1;
    const flat = !tall && FLAT.matches;
    document.body.classList.toggle('tall', tall);
    document.body.classList.toggle('flat', flat);
    // 本のボタンのある列は、上に3つ・下に2つ。スマホの文字を大きくしていて上の3つに字が収まらない時だけ、2つずつ（本は1段まるごと）に
    // （幅360・文字大きめで「マスターに」がボタンからはみ出した 2026-11-20）
    const panel = $('#panel');
    if (tall && panel.classList.contains('five')) {
      panel.classList.remove('narrow');
      if ([...panel.querySelectorAll('button')].some((b) => !b.hidden && b.scrollWidth > b.clientWidth + 1)) panel.classList.add('narrow');
    }
    const panelH = tall ? $('#panel').offsetHeight : 0;
    fitPanelH = panelH;
    // 縦の画面の店の絵とセリフは、ボタンの列の本当の上の端までに収める（画面の高さから引いて決めると、ずれた時に裏へもぐる）
    const avail = tall ? $('#panel').getBoundingClientRect().top : vh;
    S = tall ? Math.max(0.3, avail / H) : Math.min(vw / W, vh / H);
    const cssW = Math.min(vw, W * S), cssH = H * S;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const sceneEl = $('#scene');
    sceneEl.style.width = cssW + 'px';
    sceneEl.style.height = cssH + 'px';
    sceneEl.style.setProperty('--s', S);
    sceneEl.style.top = tall ? '0px' : Math.max(0, (vh - cssH) / 2) + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    K = S * dpr;
    viewW = cssW / S;
    camGoal = clamp(tall ? M.x - viewW / 2 : 0, 0, W - viewW);
    camX = camGoal;
    // 並べ直すとカメラはマスターの所へ戻るので、本へ寄せている途中の眺めと、見る人の置いた所の印も消す
    glance = null;
    panned = false;
    // 縦から横に回した時、縦の画面でカメラを動かした分のずれを札に残さない（横向きで札が左へ飛んだ 本人 2026-11-10）
    $('#spots').style.transform = tall ? `translateX(${-camX * S}px)` : '';
    // 大きさが少しでも変わったら焼き直す（焼いた絵と手前の層は、焼いた時の大きさのまま貼る。2% より小さい時に焼き直さずにいて、
    // スマホのアドレスバーやボタンの列で高さが 10px 動くだけで、ソファが二重に見え、マスターの脚が背もたれの上を通った
    // 本人 2026-11-20「まだBARのソファの背もたれの抜けが解消してないね」。試す.py の small_resize）
    if (K !== lastK) {
      lastK = K;
      bake();
    }
    const place = (id, x, y, w, h) => {
      const el = $(id);
      el.style.left = x * S + 'px';
      el.style.top = y * S + 'px';
      el.style.width = w * S + 'px';
      el.style.height = h * S + 'px';
    };
    // セリフは床の明るい所へ。縦の画面はカメラが動いて床が映らない時があるので、画面のまん中に和紙の札で。
    // 縦の画面は札の下の端を店の絵の下の端にそろえ、長いセリフは上へ伸ばす（床の高さを真ん中にすると、スマホの字の大きさで
    // 下のボタンの列に隠れた 本人 2026-11-10「スマホだとマスターのセリフもメニューに隠れちゃう」）
    const sayEl = $('#say');
    const floor = flat ? FLAT_SAY : P.floorSay;
    sayEl.style.left = tall ? '50%' : floor.x * S + 'px';
    sayEl.style.top = tall ? 'auto' : floor.y * S + 'px';
    // 店の絵が短い画面でボタンの列の裏までのびる時（S の下限）も、セリフはボタンの列の上の端より上に
    sayEl.style.bottom = tall ? Math.max(10, cssH - avail + 10) + 'px' : '';
    sayEl.classList.toggle('low', tall);
    // 1行 15 字（sayLines）が、床の明るい所の幅（手前のソファと、床のメニューの立て看板の間）に収まる大きさ。行は自分で分ける。
    // 横に倒したスマホは、テーブルの本の札とメニューの札の間に収まる大きさ（12px より小さくしない）
    sayEl.style.fontSize = (flat ? Math.max(12, 30 * S) : Math.max(15, 27 * S)) + 'px';
    place('#spotJuke', 392, 430, 176, 245);
    place('#spotShelf', 714, 400, 392, 136);
    place('#spotStage', 1300, 410, 210, 300);
    place('#spotMenu', 1150, 645, 158, 182);
    if (bookSpot) place('#spotBook', ...(TABLE_BOOKS.box || TABLE.box));
  }

  /* ---------- 毎コマ ---------- */

  let lastT = 0, clock = 0, outside = false;
  function loop(now) {
    // 店先が出ている間は、店ごと止めておく（入ったら、止めた所から）
    if (storefront.covering()) {
      lastT = now;
      setTimeout(() => requestAnimationFrame(loop), 200);
      return;
    }
    // じっとしている間は1秒15枚（影絵の人形の速さ）、マスターが動く間だけ1秒30枚。
    // 案内で手を差し出してセリフを読ませている間も、カメラが止まっていれば15枚（案内の間ずっと30枚で描くと、安いスマホで
    // 主スレッドが5割を超えた 2026-11-12）。次のコマの時刻から待つ（決まった間だけ待つと、画面の書き換えの拍に合わせて30枚を超えた）
    // 本へ寄せる間（戻る間も）、カメラが動いていれば30枚（マスターが止まっていても、15枚では1コマで画面が大きく跳んだ）
    const held = state === 'guide' && guideHold && (!tall || (Math.abs(camVel) < 2 && Math.abs(camGoal - camX) < 1));
    const glide = !!glance && Math.abs(camVel) + Math.abs(camGoal - camX) > 1;
    const due = now + ((state === 'idle' || held) && M.stride === 0 && !glide ? 1000 / 15 : 1000 / 30);
    setTimeout(() => requestAnimationFrame(loop), Math.max(0, due - performance.now() - 8));
    const dt = Math.min(0.1, (now - lastT) / 1000 || 0.033) * FAST;
    lastT = now;
    clock += dt;
    const t = clock;
    tick(state === 'idle' ? dt * IDLE_PACE : dt);
    holdRecord(t);
    aimPour();
    if (work.pose) work.pose(t);
    catTick(dt);
    idleTalk();
    resumeTick();
    // BGM のレコードは、鳴っている間（面の終わりの空回りも）回り、針は曲の進みにつれて内へ
    if (deck.disc === BGM_DISC) {
      const on = bgm.runout || bgmWanted();
      deck.spin += ((on ? 1 : 0) - deck.spin) * Math.min(1, dt * 1.5);
      if (!arm.held) {
        const el = bgm.el, n = BGM_TRACKS.length || 1;
        arm.u = bgm.runout ? 1 : clamp((bgm.i + (el.duration ? el.currentTime / el.duration : 0)) / n, 0, 1);
      }
    }
    deck.angle += dt * deck.spin * 3.4;

    beckonBook(!!glance && glance.t0 + glance.stay > clock);
    if (tall) {
      if (glance) glanceStep();
      // ばねは 1/30 秒ずつ進める（1コマが長いと、一度に進めた分だけ行き過ぎて、カメラが絵の端へ飛んだ。試す.py の早送りで
      // 1コマ 0.2〜0.6 秒の時に、マスターが画面の外に数秒いた 2026-11-12）
      const n = Math.ceil(dt / (1 / 30));
      for (let k = 0; k < n; k++) {
        const h = dt / n, a = (camGoal - camX) * 7 - camVel * 5;
        camVel += a * h;
        camX = clamp(camX + camVel * h, 0, W - viewW);
      }
      $('#spots').style.transform = `translateX(${-camX * S}px)`;
    }

    // 店の上に窓を開いている間は、店は動かし続け（BGM の針を戻す・手すきの仕事）、描くのだけ休む（窓の下で見えない）
    if (!bookEl.hidden) return;
    // 描く時は、カメラを画面の画素にそろえる（画素の途中だと、背景と手前の層を毎コマ全面なめらかに引き伸ばして描き直し、
    // 安いスマホで1コマの3分の2を食った 2026-11-12）。ばねの位置（camX）はそのまま
    const px = Math.round(camX * K), cx = px / K;
    const c = ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(back, -px, 0);
    c.setTransform(K, 0, 0, K, -px, 0);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    drawLights(c, t, px);
    drawClock(c, t);
    drawJackets(c);
    // 猫は、画面に入っている時だけ（体の影を作り直す計算が重い。縦の画面では見えていない時が多い）
    if (CAT_B.x + 70 > cx && CAT_B.x - 110 < cx + viewW) drawCat(c, t);
    // 手前の床に出ている時は、カウンターとその上の物の後に描き、ソファと床の立て看板だけをその上に重ねる
    const out = M.z > 0.5;
    // お客の側（カウンターの手前）へ出ている間は、棚の札を薄くする（札がマスターに重なる）。ソファの背もたれの後ろは別
    const away = M.z > 0.3 && M.x >= AISLE.in - 8;
    if (away !== outside) {
      outside = away;
      document.body.classList.toggle('outside', outside);
    }
    if (!out) drawMaster(c, t);
    drawCounter(c, t);
    if (!out) drawHands(c);
    c.setTransform(1, 0, 0, 1, 0, 0);
    const cw = canvas.width;
    for (const r of frontRects) {
      if (r.x + r.w > px && r.x < px + cw) c.drawImage(front, r.x, r.y, r.w, r.h, r.x - px, r.y, r.w, r.h);
    }
    c.setTransform(K, 0, 0, K, -px, 0);
    drawCounterTop(c, t);
    drawDeck(c);
    if (out) {
      drawMaster(c, t);
      drawHands(c);
      c.setTransform(1, 0, 0, 1, 0, 0);
      for (const n of nearer) c.drawImage(n.cv, Math.round(n.x0 * K) - px, Math.round(n.y0 * K));
      c.setTransform(K, 0, 0, K, -px, 0);
    }
    drawNotes(c, dt);
    drawMotes(c, t);
    if (scene.dim > 0) {
      c.fillStyle = `rgba(14, 8, 6, ${scene.dim * 0.55})`;
      c.fillRect(cx, 0, viewW, H);
    }
    if (scene.bloom > 0) {
      const u = scene.bloom, R = 60 + u * u * 2200;
      c.globalAlpha = Math.min(1, u * 1.6);
      c.drawImage(glowSprite('rgba(255, 253, 246, 1)'), scene.bloomAt.x - R, scene.bloomAt.y - R, R * 2, R * 2);
      if (u > 0.72) {
        c.globalAlpha = (u - 0.72) / 0.28;
        c.fillStyle = '#fffdf6';
        c.fillRect(cx, 0, viewW, H);
      }
      c.globalAlpha = 1;
    }
  }

  /* ---------- 店のBGM ---------- */
  // アルバムをかけていない間、BGM_TRACKS（BGMを作る.py が書く）を決まった順にくり返す（本人 2026-11-08）。
  // 音は audio 要素で鳴らし、Web Audio に通さない（スマホで音が途切れない）。大きさと低音はファイルに焼いてある（-22 LUFS）。
  // スマホは触れるまで鳴らせないので、最初にどこかを押した時に始める。上映の間は止め、閉じたら止めた所から続ける。
  // 置き場によっては途中から読めず iPhone が流さないので、1曲ずつ丸ごと読んで端末の中の写しから流す
  const bgm = { el: new Audio(), i: 0, urls: {}, on: true, started: false, fade: 0, resume: null, runout: false, piano: null };
  try {
    bgm.on = localStorage.getItem(KEY + '-cafe-bgm') !== 'off';
    bgm.resume = JSON.parse(sessionStorage.getItem(KEY + '-cafe-bgm-at') || 'null');
    if (bgm.resume) bgm.i = bgm.resume.i % BGM_TRACKS.length;
  } catch (e) {
    /* 覚えられないだけ（最初の曲から流れる） */
  }
  function blobUrl(src) {
    // ファイルを直接開いた時（手元の確かめ）は読みこめないので、そのまま流す
    if (location.protocol === 'file:') return Promise.resolve(src);
    if (!bgm.urls[src]) {
      bgm.urls[src] = fetch(src)
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((b) => URL.createObjectURL(b))
        .catch(() => src);
    }
    return bgm.urls[src];
  }
  const bgmUrl = (i) => blobUrl(BGM_TRACKS[i]);
  // 鳴るのは、蓄音機に BGM のレコードがのり、針が下りている時だけ（面が終わったら、マスターが針を置きなおすまで鳴らない）
  const bgmWanted = () => bgm.on && bgm.started && state !== 'mv' && !document.hidden && !storefront.covering() && BGM_TRACKS.length > 0 &&
    deck.disc === BGM_DISC && arm.lift === 0 && !bgm.runout;
  function bgmSave() {
    try {
      sessionStorage.setItem(KEY + '-cafe-bgm-at', JSON.stringify({ i: bgm.i, t: bgm.runout ? 0 : bgm.el.currentTime || 0 }));
    } catch (e) {
      /* 覚えられないだけ */
    }
  }
  // 音量を変えられる端末では、少しずつ上げ下げする（iPhone は音量を変えられないので、そのまま止まる・始まる）
  function bgmRamp(to, sec, then) {
    clearInterval(bgm.fade);
    const el = bgm.el, from = el.volume, t0 = performance.now();
    bgm.fade = setInterval(() => {
      const u = Math.min(1, (performance.now() - t0) / (sec * 1000));
      el.volume = clamp(mix(from, to, u), 0, 1);
      if (u >= 1) {
        clearInterval(bgm.fade);
        if (then) then();
      }
    }, 50);
  }
  async function bgmPlay() {
    if (!bgmWanted()) return;
    const url = await bgmUrl(bgm.i);
    if (!bgmWanted()) return;
    const el = bgm.el;
    if (el.dataset.src !== url) {
      el.defaultPlaybackRate = 1;
      el.src = url;
      el.dataset.src = url;
      const t = bgm.resume && bgm.resume.i === bgm.i ? bgm.resume.t : 0;
      if (t > 0) el.addEventListener('loadedmetadata', () => (el.currentTime = t), { once: true });
    }
    bgm.resume = null;
    clearInterval(bgm.fade);
    el.volume = 0;
    const p = el.play();
    if (!p) return;
    p.then(() => {
      log.push({ ev: 'bgm', act: 'play', i: bgm.i });
      bgmRamp(1, 1.2);
      // 次の曲を前もって読んでおく（つなぎ目で待たせない）
      bgmUrl((bgm.i + 1) % BGM_TRACKS.length);
    }).catch(() => {});
  }
  function bgmStop(why, sec = 0) {
    const el = bgm.el;
    // ピアノも同じ再生器なので、止めたらピアノは終わり（見えない間・♪で止めた時・上映）
    bgm.piano = null;
    const done = () => {
      el.pause();
      el.volume = 1;
      bgmSave();
    };
    if (el.paused) return;
    log.push({ ev: 'bgm', act: 'stop', i: bgm.i, why });
    if (sec > 0) bgmRamp(0, sec, done);
    else {
      clearInterval(bgm.fade);
      done();
    }
  }
  // BGM の全曲（BGM_TRACKS）で盤の片面。面が終わると針は内側の溝を回り続け、マスターが手すきの時に、外の縁へ置きなおす（本人 2026-11-09）
  bgm.el.addEventListener('ended', () => {
    if (bgm.piano) {
      bgm.piano = null;
      log.push({ ev: 'bgm', act: 'pianoEnd' });
      return;
    }
    if (bgm.i + 1 >= BGM_TRACKS.length) {
      bgm.i = 0;
      bgm.runout = true;
      log.push({ ev: 'bgm', act: 'runout' });
      bgmSave();
      return;
    }
    bgm.i += 1;
    log.push({ ev: 'bgm', act: 'next', i: bgm.i });
    bgmPlay();
  });
  // 面が終わって止まっている間に、マスターが弾くピアノを同じ再生器で鳴らす（スマホが一度鳴らしてよいと覚えた再生器なので、
  // 押した時でなくても鳴る）。見えない間・♪で止めている間・上映の間は鳴らさない
  async function bgmPiano(clip, url) {
    if (!bgm.on || !bgm.started || document.hidden || state !== 'idle') return false;
    const el = bgm.el;
    clearInterval(bgm.fade);
    el.defaultPlaybackRate = FAST;
    el.src = url;
    el.dataset.src = url;
    el.volume = 1;
    bgm.piano = clip;
    try {
      await el.play();
      log.push({ ev: 'bgm', act: 'piano', n: PIANO.indexOf(clip) });
      return true;
    } catch (e) {
      bgm.piano = null;
      return false;
    }
  }
  // 最初にどこかを押した時に始める（音のボタンは、そのボタンの働きに任せる）。店の中で止まったままなら、触った時に鳴らし直す
  // （スマホが鳴らすのを断った時。本人 2026-11-11「何処か画面を触ってもダメで」）。
  // 工房へ出るクレジットと、ご利用にあたってのタップでは鳴らさない（出る操作のタップで音を始めない）
  function bgmTouch(e) {
    if (e.target.closest && e.target.closest('#bgmBtn, .kobo-credit, .kobo-terms, #playerTerms')) return;
    if (!bgm.started) {
      bgm.started = true;
      bgmPlay();
    } else if (bgm.el.paused && (state === 'idle' || state === 'home')) bgmPlay();
  }
  addEventListener('pointerdown', bgmTouch, true);
  addEventListener('keydown', bgmTouch, true);
  // 見えていない間・ページを離れる時は鳴らさない（戻ったら続きから）
  // 上映中の YouTube も、見えない間・離れる時は止める（戻ったら続きは「再生」で）
  const ytPause = () => yt.player && yt.player.pauseVideo && yt.player.pauseVideo();
  const keepPlace = () => state === 'mv' && saveResume();
  document.addEventListener('visibilitychange', () => (document.hidden ? (bgmStop('hidden'), keepPlace(), ytPause()) : bgmPlay()));
  addEventListener('pagehide', () => {
    bgmStop('pagehide');
    keepPlace();
    ytPause();
  });
  document.addEventListener('freeze', () => bgmStop('freeze'));
  const bgmBtn = $('#bgmBtn');
  function bgmLabel() {
    bgmBtn.classList.toggle('off', !bgm.on);
    bgmBtn.setAttribute('aria-label', bgm.on ? 'BGM を止める' : 'BGM を流す');
    bgmBtn.title = bgm.on ? 'BGM を止める' : 'BGM を流す';
  }
  bgmBtn.addEventListener('click', () => {
    bgm.on = !bgm.on;
    try {
      localStorage.setItem(KEY + '-cafe-bgm', bgm.on ? 'on' : 'off');
    } catch (e) {
      /* このページを開いている間だけ効く */
    }
    bgmLabel();
    if (bgm.on) {
      bgm.started = true;
      bgmPlay();
    } else bgmStop('off', 0.4);
  });
  bgmLabel();

  /* ---------- つなぐ ---------- */

  const pressShelf = () => (state === 'acting' ? pending && skip() : openShelf());
  $('#spotJuke').addEventListener('click', pressJuke);
  $('#spotShelf').addEventListener('click', pressShelf);
  $('#spotStage').addEventListener('click', pressStage);
  $('#spotMenu').addEventListener('click', openMenu);
  $('#shelfBack').addEventListener('click', closeShelf);
  $('#menuBack').addEventListener('click', closeMenu);
  for (const b of document.querySelectorAll('#menu [data-drink]')) {
    b.addEventListener('click', () => {
      if (performance.now() - menuOpenedAt < 450 / FAST) return;
      order(b.dataset.drink);
    });
  }
  for (const b of document.querySelectorAll('#panel button')) {
    b.addEventListener('click', () => {
      const go = b.dataset.go;
      if (go === 'juke') pressJuke();
      else if (go === 'stage') pressStage();
      else if (go === 'menu') openMenu();
      else if (go === 'books') (booksEl ? openBooks() : openBook());
      else pressShelf();
    });
  }
  // マスターに声をかけると、アルバムを1枚ずつかけてくれる（店先の説明書き 本人 2026-11-09）。棚を開いて、どれかを選んでもらう
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / S + camX, y = (e.clientY - r.top) / S;
    const p = pathAt(M.x);
    if (state === 'idle' && Math.abs(x - M.x) < 60 * p.s / 0.57 && y > p.y - 300 * p.s && y < p.y) {
      log.push({ ev: 'ask' });
      openShelf();
    }
  });
  video.addEventListener('ended', nextAlbum);
  $('#playerNext').addEventListener('click', nextAlbum);
  $('#playerClose').addEventListener('click', leavePlayer);
  // 戻る：上映中は店へ。店の中では店先へ出る（もう一度戻ると、来る前のページへ）
  addEventListener('popstate', () => {
    // 自分で戻した（曲の一覧・窓・本の一覧を閉じた）知らせは聞き流す
    if (ownBack > 0) {
      ownBack--;
      return;
    }
    bookBackAt = -1e9;
    // 窓の中のページの「戻る」が着く前に窓を閉じていた：着いた段から、窓の段ごと戻す
    if (bookOwe) {
      bookOwe = false;
      if (bookEntry(history.state)) {
        ownBack++;
        history.go(-(history.state.d + 1));
      }
      return;
    }
    // 窓の中の段なら、窓の中のページへ渡す。窓の段より前へ戻ったら、窓を閉じる
    if (!bookEl.hidden && bookStep(history.state)) return;
    if (!bookEl.hidden) return closeBook(true);
    if (booksOpen()) return closeBooks(true);
    if (!tracksEl.hidden) return closeTracks(true);
    if (!player.hidden) closePlayer();
    else if (!(history.state && history.state.cafe)) goOutside();
  });
  function goOutside() {
    if (!storefront.enabled || storefront.covering()) return;
    closeTracks(true);
    closeBook(true);
    closeBooks(true);
    closeShelf();
    closeMenu();
    bgmStop('front', 0.5);
    storefront.show();
  }
  // 店に入った時：初めての人には店の案内、2回目からは短いあいさつだけ（押せばいつでも案内を飛ばせる）。
  // 店先から入り直した時は、あいさつと BGM だけ
  let cafeReady = false, welcomed = false, cafeReadyNow = null;
  const cafeReadyP = new Promise((done) => (cafeReadyNow = done));
  function welcome() {
    if (!cafeReady) return;
    bgmPlay();
    // 続きを覚えていれば、あいさつの代わりに「続きを…」と聞く（札は resumeTick）
    const greet = () => say(pick(resumeAt ? 'resume' : 'again'));
    if (welcomed) {
      if (state === 'idle') greet();
      return;
    }
    welcomed = true;
    if (work.only) startWork();
    else if (remembered()) {
      greet();
      startWork();
      setTimeout(lookHint, 1500 / FAST);
    } else setTimeout(runGuide, 700 / FAST);
  }
  storefront.attach({
    log: (e) => log.push(e),
    // 扉の向こうで、店の絵が届くのを待つ（届いた割合を出す）
    ready: () => {
      loadArt();
      return cafeReady || cafeReadyP;
    },
    progress: () => ART.filter(([im]) => im.src && im.complete && im.naturalWidth).length / ART.length,
    entered() {
      try {
        history.pushState({ cafe: 'in' }, '');
      } catch (e) {
        /* 戻るで店先へ出られないだけ */
      }
      welcome();
    },
  });
  // 読み直した時は店先から（前に入っていた印は消す）
  if (storefront.enabled && history.state && history.state.cafe) {
    try {
      history.replaceState(null, '');
    } catch (e) {
      /* そのまま */
    }
  }
  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 180);
  });
  // 縦の画面の下のボタンの列の高さが、開いた後で変わったら（スマホの文字サイズ・書体）、店の絵とセリフを並べ直す
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (cafeReady && tall && Math.abs($('#panel').offsetHeight - fitPanelH) > 1) fit();
    }).observe($('#panel'));
  }

  bg.onload = async () => {
    // 手前の切り抜きが読めてから、手前の層を作る（読めなければ、その物の後ろを通る時に隠れないだけ）
    await Promise.all([...FRONT_PARTS.map((p) => p.im), ...Object.values(siphonImg)].map((im) => im.decode().catch(() => {})));
    // 絵が届く前に並べ直していたら（初めて開いた時の、スマホのアドレスバーの出入りなど）、絵の無い下絵が焼いてあるので、
    // 大きさが同じでも必ず焼き直す（店が真っ黒・動く物が尾を引いた 本人 2026-11-10「クッキーがない状態でブラウザで開いたときも
    // 真っ黒になる時がありますね」）
    lastK = 0;
    fit();
    // 開いた時は、持ち場でグラスを磨いている（試す.py が止めた時と ?chore= の時は、グラスを置いて手を空けた姿）。
    // ?chore=piano は、来た時にはレコードの面が終わっていた所から（押して音が鳴らせるようになったら弾く）
    work.only = ONLY in CHORES && ONLY !== 'needle' ? ONLY : null;
    if (work.only === 'piano' && BGM_TRACKS.length) bgm.runout = true;
    if (window.__noWork || work.only) work.parked = true;
    else {
      bar.far = 'wglass';
      bar.near = 'cloth';
      Object.assign(M.far, polishAt(), { w: 1 });
      Object.assign(M.near, { x: M.far.x, y: M.far.y - 26, w: 1 });
    }
    requestAnimationFrame(loop);
    // 店先から入る前に読み終わっていれば、入った時に。入った後なら、いま
    cafeReady = true;
    cafeReadyNow();
    if (!storefront.covering()) welcome();
    window.__cafe.ready = true;
  };
  // 試す.py が見る（ready は店の絵が読めて店が動きだしてから）
  window.__cafe = {
    ready: false, log, P, M, bar, jacketBoxes, smallJackets, clockAngles, talk, state: () => state, say, LINES, DRINKS, GUIDE, bgm,
    SLOTS, PARK, DISH, CAT_B, TUNE_PIN, work, cat, dish, arm, deck, armGrip, chore: (name) => (work.next = name), pick: pickChore, FRONT,
    keyAt, clock: () => clock, BOARD, popped: () => pop >= 0 || (low.i >= 0 && low.out < 1), UPPER, LOW,
    // 下の段から引き出している盤（真ん中・半径・面の幅と段の進み）と、抜いた所の冊
    low: () => (low.i >= 0 ? { ...lowDisc(), i: low.i, lift: low.lift, out: low.out, both: low.both, turn: low.turn } : null),
    lowGap: () => low.gap, dim: () => scene.dim,
    SONGS, medleyPool, albumSongs, songKey, resume: () => resumeAt, openBook, closeBook, mutter, openBooks, TABLE, TALKS,
    // テーブルに描いた本の形（絵の座標。表紙の四隅・下へ伸ばした側面の辺・厚み）
    tableBooks: () => tableBookShapes().map(({ i, kind, color, top, foot, base, sides, h, c }) => ({ i, kind, color, top, foot, base, sides, h, c })),
    ytState: () => (yt.player && yt.player.getPlayerState ? yt.player.getPlayerState() : null),
    front: () => (storefront.state ? storefront.state() : null),
    // 猫だけを s 倍で描いた絵と、頭・首の付け根の位置（絵の画素）を返す。首のくびれを測る
    catLook: (w, s) => {
      const keep = { ...cat }, dishOn = dish.on;
      Object.assign(cat, { drink: 0, nuzzle: 0, lie: 0, stretch: 0, lick: 0, tail: 0 }, w);
      dish.on = false;
      const q = catPose(), cv2 = document.createElement('canvas');
      cv2.width = 160 * s;
      cv2.height = 110 * s;
      const g = cv2.getContext('2d');
      g.scale(s, s);
      g.translate(100 - CAT_B.x, 95 - CAT_B.y);
      drawCat(g, 0);
      Object.assign(cat, keep);
      dish.on = dishOn;
      const at = (x, y) => [(100 + x) * s, (95 + y) * s];
      return { png: cv2.toDataURL(), head: at(q.head[0], q.head[1]), neck: at(q.neck[0], q.neck[1]) };
    },
    // 猫だけを白い紙に描き、影がいくつに分かれるか・天板に着いた所の左右の端（CAT_B から）を返す
    catShape: (w) => {
      const keep = { ...cat }, dishOn = dish.on;
      Object.assign(cat, { drink: 0, nuzzle: 0, lie: 0, stretch: 0, lick: 0, tail: 0 }, w);
      dish.on = false;
      const cv2 = document.createElement('canvas');
      cv2.width = 160;
      cv2.height = 110;
      const g = cv2.getContext('2d');
      g.translate(100 - CAT_B.x, 95 - CAT_B.y);
      drawCat(g, 0);
      Object.assign(cat, keep);
      dish.on = dishOn;
      const a = g.getImageData(0, 0, 160, 110).data, ink = (i) => a[i * 4 + 3] > 128, seen = new Uint8Array(160 * 110);
      let parts = 0, g0 = 999, g1 = -999;
      for (let i = 0; i < 160 * 110; i++) {
        if (!ink(i)) continue;
        const y = Math.floor(i / 160) - 95;
        if (y >= -2) {
          g0 = Math.min(g0, (i % 160) - 100);
          g1 = Math.max(g1, (i % 160) - 100);
        }
        if (seen[i]) continue;
        parts++;
        const stack = [i];
        seen[i] = 1;
        while (stack.length) {
          const j = stack.pop(), x = j % 160;
          for (const k of [x > 0 ? j - 1 : -1, x < 159 ? j + 1 : -1, j - 160, j + 160]) {
            if (k >= 0 && k < 160 * 110 && !seen[k] && ink(k)) {
              seen[k] = 1;
              stack.push(k);
            }
          }
        }
      }
      return { parts, ground: [g0, g1] };
    },
    view: () => ({ from: camX, to: camX + viewW, master: M.x, glance: !!glance }),
    sizes: () => M.seated,
  };
  // 店の絵を読みはじめる。店先がある時は、店先が出そろってから（扉を先に押されたら、その時に）
  let artLoading = false;
  function loadArt() {
    if (artLoading) return;
    artLoading = true;
    for (const [im, src] of ART) im.src = src;
  }
  if (!storefront.covering()) loadArt();
  else if (document.readyState === 'complete') setTimeout(loadArt, 50);
  else addEventListener('load', () => setTimeout(loadArt, 50), { once: true });
})();
