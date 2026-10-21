// 메인 운영 원칙: 왼쪽 원형 다이어그램 + 오른쪽 카드. data/features.json(관리자 페이지에서 편집)으로 그린다.
(function () {
  var root = document.getElementById('features');
  if (!root) return;
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var ICONS = [
    '<path d="M12 3l1.8 4.6L18.4 9l-4.6 1.8L12 15.4l-1.8-4.6L5.6 9l4.6-1.4z"/><path d="M5 17l.9 2.1L8 20l-2.1.9L5 23l-.9-2.1L2 20l2.1-.9z"/><path d="M19 15l.6 1.4L21 17l-1.4.6L19 19l-.6-1.4L17 17l1.4-.6z"/>',
    '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
    '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    '<path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7.5"/><path d="M8 11v1.5L5.6 10a1.6 1.6 0 0 0-2.3 2.2l4.2 5.6A6 6 0 0 0 12.3 20H13a4 4 0 0 0 4-4v-2.5"/>',
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    '<path d="M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>'
  ];
  function short(it) {
    if (it.short) return it.short;
    var t = String(it.title || '').replace(/[.!]/g, '');
    return t.length > 7 ? t.slice(0, 7) : t;
  }
  function render(d) {
    var items = (d && d.items || []).filter(function (it) { return it && (it.title || it.text); });
    if (!items.length) return;
    var n = items.length, C = 200, R = 142, NR = 40, gap = Math.asin((NR + 6) / R);
    var pos = items.map(function (_, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return { a: a, x: C + R * Math.cos(a), y: C + R * Math.sin(a) }; });
    var arcs = items.map(function (_, i) {
      var a1 = pos[i].a + gap, a2 = pos[(i + 1) % n].a - gap + (i === n - 1 ? 2 * Math.PI : 0);
      if (n === 1) return '';
      var x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1), x2 = C + R * Math.cos(a2), y2 = C + R * Math.sin(a2);
      var large = (a2 - a1) > Math.PI ? 1 : 0;
      return '<path class="arc' + (i === n - 1 ? ' back' : '') + '" d="M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" marker-end="url(#feat-arrow)"/>';
    }).join('');
    var nodes = items.map(function (it, i) {
      var num = (i + 1 < 10 ? '0' : '') + (i + 1);
      return '<g class="node" style="--i:' + i + '"><circle cx="' + pos[i].x.toFixed(1) + '" cy="' + pos[i].y.toFixed(1) + '" r="' + NR + '"/>' +
        '<text class="nn" x="' + pos[i].x.toFixed(1) + '" y="' + (pos[i].y - 9).toFixed(1) + '" text-anchor="middle">' + num + '</text>' +
        '<text class="nt" x="' + pos[i].x.toFixed(1) + '" y="' + (pos[i].y + 11).toFixed(1) + '" text-anchor="middle">' + esc(short(it)) + '</text></g>';
    }).join('');
    var svg = '<svg class="loop" viewBox="0 0 400 400" role="img" aria-label="정글짐 운영 원칙 ' + n + '가지 순환 다이어그램">' +
      '<defs><radialGradient id="feat-core" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff4a55"/><stop offset=".55" stop-color="#c8141f"/><stop offset="1" stop-color="#6e0a12"/></radialGradient>' +
      '<marker id="feat-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>' +
      '<circle class="halo" cx="200" cy="200" r="190"/><circle class="halo" cx="200" cy="200" r="168"/><circle class="ring" cx="200" cy="200" r="' + R + '"/>' +
      arcs +
      '<circle class="core" cx="200" cy="200" r="88"/>' +
      '<text class="ct" x="200" y="186" text-anchor="middle">JUNGLE GYM</text>' +
      '<text class="cm" x="200" y="210" text-anchor="middle">' + n + '가지 운영 원칙</text>' +
      '<text class="cs" x="200" y="231" text-anchor="middle">회원을 위한 약속</text>' +
      nodes + '</svg>';
    var cards = items.map(function (it, i) {
      var num = (i + 1 < 10 ? '0' : '') + (i + 1);
      return '<li class="feat rv in" style="--i:' + i + '"><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[i % ICONS.length] + '</svg></span>' +
        '<div class="fb"><span class="n">' + num + '</span><h3>' + esc(it.title) + (it.en ? ' <em>' + esc(it.en) + '</em>' : '') + '</h3><p>' + esc(it.text) + '</p></div></li>';
    }).join('');
    root.innerHTML = '<div class="feat-diagram">' + svg + '</div><ol class="feat-cards">' + cards + '</ol>';
  }
  if (window.JG_FEATURES) render(window.JG_FEATURES);
  if (!window.fetch) return;
  fetch('data/features.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.items && JSON.stringify(d.items) !== JSON.stringify((window.JG_FEATURES || {}).items)) render(d); })
    .catch(function () {});
})();
