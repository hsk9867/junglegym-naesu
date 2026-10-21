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

  // 인트로 영상 오버레이: 재생 중 화면을 클릭(탭)하면 사라지고 메인 페이지. 휠·스와이프·키보드로도 닫힘
  var intro = document.getElementById('intro');
  if (intro && !document.documentElement.classList.contains('intro-skip')) {
    var ivid = intro.querySelector('.intro-video'), istage = intro.querySelector('.intro-stage');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, closed = false, touchY = null;
    if (ivid && ivid.play) { var ipl = ivid.play(); if (ipl && ipl.catch) ipl.catch(function () {}); }
    function closeIntro() {
      if (closed) return; closed = true;
      intro.classList.add('leaving');
      document.documentElement.classList.remove('intro-open');
      document.documentElement.classList.add('intro-done');
      try { sessionStorage.setItem('jg_intro_seen', '1'); } catch (e) {}
      var done = function () { if (ivid && ivid.pause) ivid.pause(); if (intro.parentNode) intro.parentNode.removeChild(intro); };
      istage.addEventListener('transitionend', done, { once: true });
      setTimeout(done, reduce ? 400 : 1000);
    }
    intro.addEventListener('click', closeIntro);
    intro.addEventListener('wheel', function (e) { e.preventDefault(); if (Math.abs(e.deltaY) > 10) closeIntro(); }, { passive: false });
    intro.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    intro.addEventListener('touchmove', function (e) { e.preventDefault(); if (touchY !== null && Math.abs(e.touches[0].clientY - touchY) > 40) closeIntro(); }, { passive: false });
    document.addEventListener('keydown', function (e) {
      if (closed) return;
      if (['ArrowDown', 'PageDown', ' ', 'Enter', 'Escape', 'ArrowUp'].indexOf(e.key) > -1) { e.preventDefault(); closeIntro(); }
    });
    intro.focus({ preventScroll: true });
  }

  // 타이포 효과: 섹션 제목을 단어·글자로 나눠 아래에서 올라오게 (reveal 과 함께 동작)
  document.querySelectorAll('.h2, .track h3, .track .desc + .btn').forEach(function (el) {
    if (!el.matches('.h2, h3') || el.children.length || el.classList.contains('split')) return;
    var text = el.textContent, n = 0, html = '';
    text.split(' ').forEach(function (word, wi) {
      if (wi) html += ' ';
      html += '<span class="w">' + Array.prototype.map.call(word, function (ch) { return '<span class="ch" style="--i:' + (n++) + '">' + ch.replace(/[&<>]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; }) + '</span>'; }).join('') + '</span>';
    });
    el.setAttribute('aria-label', text);
    el.innerHTML = html;
    el.classList.add('split');
  });

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
