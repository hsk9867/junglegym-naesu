// data/pt.json 에 등록된 사진을 각 자리(data-slot)에 채운다. 없으면 PHOTO COMING SOON 자리표시자를 그대로 둔다.
(function () {
  var slots = document.querySelectorAll('[data-slot]');
  if (!slots.length || !window.fetch) return;
  fetch('data/pt.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d) return;
      var v = d.updated ? '?v=' + encodeURIComponent(d.updated) : '';
      var map = {};
      if (d.hero) map.hero = d.hero;
      (d.steps || []).forEach(function (s) { if (s && s.id) map[s.id] = s; });
      slots.forEach(function (el) {
        var item = map[el.getAttribute('data-slot')];
        if (!item || !item.src) return;
        var img = el.firstElementChild; // 자리마다 첫 번째 img 가 실제 사진 자리
        if (!img || img.tagName !== 'IMG') return;
        img.onload = function () { el.classList.add('has-photo'); img.hidden = false; };
        if (item.alt && el.getAttribute('aria-hidden') !== 'true') img.alt = item.alt;
        img.src = item.src + v;
      });
    })
    .catch(function () {});
})();
