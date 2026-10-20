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

  // 히어로 배경 영상: 재생되면 포스터 → 영상으로 전환, 화면 밖이면 정지, 스크롤 페이드 폴백
  var hv = document.querySelector('.hero-video');
  if (hv) {
    var hbg = hv.parentNode, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { hv.removeAttribute('autoplay'); hv.pause(); }
    else {
      hv.addEventListener('playing', function () { hv.classList.add('playing'); hbg.classList.add('video-on'); }, { once: true });
      var hp = hv.play(); if (hp && hp.catch) hp.catch(function () {});
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { var p2 = hv.play(); if (p2 && p2.catch) p2.catch(function () {}); } else { hv.pause(); } });
        }, { threshold: 0.05 }).observe(hv);
      }
      if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'))) {
        var hero = hbg.parentNode;
        var fadeBg = function () {
          var h = hero.offsetHeight || window.innerHeight, top = hero.getBoundingClientRect().top;
          var p = Math.min(1, Math.max(0, -top / (h * 0.75)));
          hbg.style.opacity = String(1 - p); hbg.style.transform = 'translateY(' + (-p * 12) + '%)';
        };
        window.addEventListener('scroll', fadeBg, { passive: true }); fadeBg();
      }
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
