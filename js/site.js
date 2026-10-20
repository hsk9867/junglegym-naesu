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

  // 인트로 영상(고정) : 첫 화면에서 재생, 스크롤하면 메인 화면이 위로 올라와 덮고 영상은 페이드·정지
  var introSec = document.getElementById('intro'), introFixed = introSec && introSec.querySelector('.intro-fixed'), iv = introSec && introSec.querySelector('.intro-video');
  var heroSec = document.querySelector('.hero');
  if (introSec && introFixed && iv) {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { iv.removeAttribute('autoplay'); iv.pause(); }
    else { var ip = iv.play(); if (ip && ip.catch) ip.catch(function () {}); }
    var hasViewTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    function introScroll() {
      var r = introSec.getBoundingClientRect(), h = r.height || window.innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / h)); // 0: 영상 전체 보임, 1: 메인 화면이 완전히 덮음
      if (!hasViewTimeline && !reduce) { introFixed.style.opacity = String(1 - p); introFixed.style.transform = 'scale(' + (1 - p * 0.1) + ')'; }
      if (p >= 0.35 && heroSec) heroSec.classList.add('in');
      if (p >= 1) { introFixed.classList.add('off'); if (!iv.paused) iv.pause(); }
      else { introFixed.classList.remove('off'); if (iv.paused && !reduce) { var p3 = iv.play(); if (p3 && p3.catch) p3.catch(function () {}); } }
    }
    window.addEventListener('scroll', introScroll, { passive: true });
    window.addEventListener('resize', introScroll);
    introScroll();
  }
  if (heroSec) {
    if (!('IntersectionObserver' in window)) heroSec.classList.add('in');
    else new IntersectionObserver(function (es, obs) { es.forEach(function (e) { if (e.isIntersecting) { heroSec.classList.add('in'); obs.disconnect(); } }); }, { threshold: 0.35 }).observe(heroSec);
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
