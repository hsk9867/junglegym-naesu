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

  // 인트로 영상: 자동재생 보장 + 화면 밖이면 정지, 스크롤 페이드 폴백
  var iv = document.querySelector('.intro-video');
  var stage = document.querySelector('.intro-stage');
  if (iv) {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { iv.removeAttribute('autoplay'); iv.pause(); }
    else { var pp = iv.play(); if (pp && pp.catch) pp.catch(function () {}); }
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var p2 = iv.play(); if (p2 && p2.catch) p2.catch(function () {}); } else { iv.pause(); } });
      }, { threshold: 0.05 }).observe(iv);
    }
    if (stage && !reduce && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'))) {
      var fade = function () {
        var h = stage.offsetHeight || window.innerHeight;
        var p = Math.min(1, Math.max(0, window.scrollY / (h * 0.8)));
        stage.style.opacity = String(1 - p);
        stage.style.transform = 'scale(' + (1 - p * 0.08) + ') translateY(' + (-p * 8) + '%)';
      };
      window.addEventListener('scroll', fade, { passive: true }); fade();
    }
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
