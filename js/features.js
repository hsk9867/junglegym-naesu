// 메인 운영 원칙 목록: data/features.json 의 제목·설명으로 갱신 (관리자 페이지에서 편집)
(function () {
  var root = document.getElementById('features');
  if (!root || !window.fetch) return;
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  fetch('data/features.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.items || !d.items.length) return;
      root.innerHTML = d.items.map(function (it, i) {
        var n = (i + 1 < 10 ? '0' : '') + (i + 1);
        return '<li class="feat rv in"><span class="n">' + n + '</span><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></li>';
      }).join('');
    })
    .catch(function () {});
})();
