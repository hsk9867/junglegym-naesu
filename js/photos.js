// <body data-photos="data/xxx.json"> 에 적힌 파일을 읽어 [data-slot] 자리의 사진·문구를 채운다.
// 관리자 페이지(admin.html)가 이 json 과 images/<page>/ 사진을 갱신한다.
(function () {
  var file = document.body.getAttribute('data-photos');
  var slots = document.querySelectorAll('[data-slot]');
  if (!file || !slots.length || !window.fetch) return;
  fetch(file + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      var v = d.updated ? '?v=' + encodeURIComponent(d.updated) : '';
      var map = {};
      if (d.hero) map.hero = d.hero;
      ['steps', 'gallery', 'items'].forEach(function (k) { (d[k] || []).forEach(function (s) { if (s && s.id) map[s.id] = s; }); });
      slots.forEach(function (el) {
        var item = map[el.getAttribute('data-slot')];
        if (!item) return;
        var img = el.querySelector(':scope > img');
        if (img && item.src) {
          var cur = img.getAttribute('src') || '';
          if (cur.split('?')[0] !== item.src || img.hidden) {
            img.onload = function () { el.classList.add('has-photo'); img.hidden = false; };
            img.src = item.src + v;
          } else { el.classList.add('has-photo'); }
          if (item.alt && el.getAttribute('aria-hidden') !== 'true') img.alt = item.alt;
        }
        var t = el.querySelector('.cap-title'); if (t && item.title) t.textContent = item.title;
        var l = el.querySelector('.cap-label'); if (l && item.label) l.textContent = item.label;
      });
    })
    .catch(function () {});
})();
