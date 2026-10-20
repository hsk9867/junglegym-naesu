// 메인 특징 카드: data/features.json 으로 내용 갱신, 자동으로 흐르고 손으로 끌 수 있음
(function () {
  var root = document.getElementById('features');
  if (!root) return;
  var track = root.querySelector('.feat-track');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function render(items, v) {
    var html = items.map(function (it) {
      return '<article class="fcard"><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p>' +
        (it.src ? '<div class="fimg"><img src="' + esc(it.src) + v + '" alt="' + esc(it.alt) + '" loading="lazy" draggable="false"></div>' : '') + '</article>';
    }).join('');
    track.innerHTML = '<div class="feat-set">' + html + '</div><div class="feat-set" aria-hidden="true">' + html + '</div>';
    measure();
  }
  if (window.fetch) {
    fetch('data/features.json?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.items && d.items.length) render(d.items, d.updated ? '?v=' + encodeURIComponent(d.updated) : ''); })
      .catch(function () {});
  }

  // ---- 슬라이드 ----
  var x = 0, setW = 0, vel = 0, dragging = false, hover = false, idleUntil = 0, lastX = 0, lastT = 0, moved = 0;
  var SPEED = 0.45; // px/frame (약 27px/s)
  function measure() { setW = track.scrollWidth / 2; }
  function wrap() { if (setW > 0) { while (x <= -setW) x += setW; while (x > 0) x -= setW; } }
  function frame(now) {
    if (!dragging) {
      if (Math.abs(vel) > 0.05) { x += vel; vel *= 0.94; }
      else if (!reduce && !hover && now > idleUntil) { x -= SPEED; }
    }
    wrap();
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
    requestAnimationFrame(frame);
  }
  measure();
  if (document.readyState === 'complete') measure(); else window.addEventListener('load', measure);
  window.addEventListener('resize', measure);
  requestAnimationFrame(frame);

  root.addEventListener('mouseenter', function () { hover = true; });
  root.addEventListener('mouseleave', function () { hover = false; });
  root.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; moved = 0; vel = 0; lastX = e.clientX; lastT = e.timeStamp;
    root.classList.add('dragging');
    try { root.setPointerCapture(e.pointerId); } catch (err) {}
  });
  root.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dt = Math.max(1, e.timeStamp - lastT);
    x += dx; moved += Math.abs(dx);
    vel = dx / dt * 16; // px/frame 환산
    lastX = e.clientX; lastT = e.timeStamp;
  });
  function release(e) {
    if (!dragging) return;
    dragging = false; root.classList.remove('dragging');
    idleUntil = performance.now() + 2500; // 놓고 2.5초 뒤 자동 흐름 재개
    if (Math.abs(vel) > 12) vel = 12 * Math.sign(vel);
  }
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);
  root.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) idleUntil = performance.now() + 500; });
})();
