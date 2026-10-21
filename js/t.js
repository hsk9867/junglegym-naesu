/* 정글짐 방문 통계 — 익명 ID(localStorage jg_vid)로만 구분, 개인정보 없음.
   관리자 페이지에 로그인한 적 있는 브라우저(jg_admin_vault 존재)는 집계하지 않는다. */
(function () {
  var END = 'https://junglegym-stats.hsk9867.workers.dev/t';
  if (navigator.webdriver) return;
  try { if (localStorage.getItem('jg_admin_vault') || localStorage.getItem('jg_admin_token')) return; } catch (e) {}
  if (/^\/(junglegym-naesu\/)?admin/.test(location.pathname)) return;
  var vid = '';
  try {
    vid = localStorage.getItem('jg_vid') || '';
    if (!/^[a-f0-9]{16}$/.test(vid)) {
      var a = new Uint8Array(8); (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256 | 0; });
      vid = Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      localStorage.setItem('jg_vid', vid);
    }
  } catch (e) { vid = ''; }
  function send(e) {
    try {
      var d = { p: location.pathname, r: document.referrer || '', q: location.search || '', s: screen.width + 'x' + screen.height, l: navigator.language || '', v: vid };
      if (e) d.e = e;
      var body = JSON.stringify(d);
      // text/plain 이어야 다른 출처(workers.dev)로 preflight 없이 보낼 수 있다
      if (navigator.sendBeacon && navigator.sendBeacon(END, new Blob([body], { type: 'text/plain' }))) return;
      fetch(END, { method: 'POST', body: body, headers: { 'content-type': 'text/plain' }, keepalive: true, mode: 'cors' }).catch(function () {});
    } catch (err) {}
  }
  send();
  document.addEventListener('click', function (ev) {
    var t = ev.target, a = t && t.closest ? t.closest('a,button') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '', name = '';
    if (href.indexOf('tel:') === 0) name = 'tel';
    else if (href.indexOf('talk.naver.com') >= 0) name = 'naver_talk';
    else if (href.indexOf('kakao.com') >= 0) name = 'kakao';
    else if (href.indexOf('placePath=/review') >= 0) name = 'naver_review';
    else if (href.indexOf('map.naver.com') >= 0 || href.indexOf('place.naver.com') >= 0 || href.indexOf('naver.me') >= 0) name = 'naver_map';
    else if (/(^|\/)pt\.html/.test(href)) name = 'pt_page';
    else if (/(^|\/)center\.html/.test(href)) name = 'center_page';
    else if (/(^|\/)price\.html/.test(href)) name = 'price_page';
    if (name) send(name);
  }, true);
})();
