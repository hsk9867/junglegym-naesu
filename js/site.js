(function () {
  var menu = document.getElementById('menu'), openBtn = document.getElementById('menuOpen'), closeBtn = document.getElementById('menuClose');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeBtn.focus(); else openBtn.focus();
  }
  openBtn.addEventListener('click', function () { setMenu(true); });
  closeBtn.addEventListener('click', function () { setMenu(false); });
  menu.querySelectorAll('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) { panel.hidden = !on; if (on) panel.classList.add('in'); }
        });
      });
    });
  });

  // 인트로 영상 오버레이: 계속 재생, 위로 드래그(스와이프)·휠·키보드로 닫기
  var intro = document.getElementById('intro');
  if (intro && !document.documentElement.classList.contains('intro-skip')) {
    var ivid = intro.querySelector('.intro-video'), istage = intro.querySelector('.intro-stage');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var H = function () { return intro.offsetHeight || window.innerHeight; };
    var closed = false, down = false, startY = 0, lastY = 0, lastT = 0, vy = 0, dy = 0;
    if (ivid) { var pp = ivid.play(); if (pp && pp.catch) pp.catch(function () {}); }
    function setDrag(y) {
      dy = y; var p = Math.min(1, Math.abs(y) / (H() * 0.6));
      istage.style.transform = 'translate3d(0,' + y + 'px,0) scale(' + (1 - p * 0.06) + ')';
      istage.style.opacity = String(1 - p * 0.7);
    }
    function close(dir) {
      if (closed) return; closed = true;
      intro.classList.remove('dragging'); intro.classList.add('leaving');
      istage.style.transform = 'translate3d(0,' + (dir < 0 ? -110 : 110) + '%,0) scale(.94)';
      istage.style.opacity = '0';
      document.documentElement.classList.remove('intro-open');
      document.documentElement.classList.add('intro-done');
      try { sessionStorage.setItem('jg_intro_seen', '1'); } catch (e) {}
      var done = function () { if (ivid) ivid.pause(); if (intro.parentNode) intro.parentNode.removeChild(intro); };
      istage.addEventListener('transitionend', done, { once: true });
      setTimeout(done, reduce ? 400 : 900);
    }
    function snapBack() { intro.classList.remove('dragging'); istage.style.transform = ''; istage.style.opacity = ''; }
    intro.addEventListener('pointerdown', function (e) {
      if (closed || (e.pointerType === 'mouse' && e.button !== 0)) return;
      down = true; startY = lastY = e.clientY; lastT = e.timeStamp; vy = 0;
      intro.classList.add('dragging');
      try { intro.setPointerCapture(e.pointerId); } catch (err) {}
    });
    intro.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dt = Math.max(1, e.timeStamp - lastT); vy = (e.clientY - lastY) / dt; lastY = e.clientY; lastT = e.timeStamp;
      setDrag(e.clientY - startY);
    });
    function release() {
      if (!down) return; down = false;
      if (Math.abs(dy) > H() * 0.22 || (Math.abs(dy) > 48 && Math.abs(vy) > 0.6)) close(dy < 0 ? -1 : 1);
      else snapBack();
      dy = 0;
    }
    intro.addEventListener('pointerup', release);
    intro.addEventListener('pointercancel', release);
    intro.addEventListener('wheel', function (e) { e.preventDefault(); if (Math.abs(e.deltaY) > 20) close(e.deltaY > 0 ? -1 : 1); }, { passive: false });
    intro.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('keydown', function (e) {
      if (closed) return;
      if (['ArrowDown', 'PageDown', ' ', 'Enter', 'Escape', 'ArrowUp'].indexOf(e.key) > -1) { e.preventDefault(); close(-1); }
    });
    var skip = document.getElementById('introSkip');
    if (skip) skip.addEventListener('click', function (e) { e.stopPropagation(); close(-1); });
    intro.focus({ preventScroll: true });
  }

  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.indexOf('static') > -1) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
