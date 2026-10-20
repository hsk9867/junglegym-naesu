// 정글짐 내수점 방문 통계 Worker
//  POST /t              : 홈페이지(js/t.js)가 보내는 방문·클릭 기록 → D1 hits
//  GET  /stats?from&to  : 관리자 대시보드용 집계 (Authorization: Bearer <GitHub 토큰> — 저장소 쓰기 권한이 있으면 관리자)
//  GET  /export?from&to : CSV
// 개인정보는 저장하지 않는다. 방문자 구분은 브라우저 localStorage 의 무작위 ID(jg_vid), 없으면 당일 한정 해시.

const REPO = 'hsk9867/junglegym-naesu';
const ALLOWED = new Set([
  'https://xn--bj0bp80c9gb.com', 'http://xn--bj0bp80c9gb.com',
  'https://www.xn--bj0bp80c9gb.com', 'http://www.xn--bj0bp80c9gb.com',
  'https://hsk9867.github.io',
]);
const SELF_HOSTS = new Set(['xn--bj0bp80c9gb.com', 'www.xn--bj0bp80c9gb.com', 'hsk9867.github.io', 'localhost', '127.0.0.1']);
const KST = 9 * 3600;
const BOT_RE = /bot|crawl|spider|slurp|yeti|daumoa|kakaotalk-scrap|facebookexternalhit|headless|lighthouse|pagespeed|preview|monitor|python|curl\/|wget|httpclient|go-http|java\/|okhttp|scrapy|phantom|puppeteer|playwright|gptbot|claudebot|perplexitybot|bytespider|petalbot|semrush|ahrefs|mj12|dataforseo|screaming/i;

const SOURCE_RULES = [
  [/(^|\.)m?\.?place\.naver\.com$|(^|\.)map\.naver\.com$|(^|\.)pcmap\.place\.naver\.com$/, '네이버 플레이스·지도'],
  [/(^|\.)search\.naver\.com$/, '네이버 검색'],
  [/(^|\.)blog\.naver\.com$/, '네이버 블로그'],
  [/(^|\.)cafe\.naver\.com$/, '네이버 카페'],
  [/(^|\.)talk\.naver\.com$/, '네이버 톡톡'],
  [/(^|\.)(naver\.com|naver\.me)$/, '네이버'],
  [/(^|\.)google\./, '구글'],
  [/(^|\.)daum\.net$/, '다음'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)kakao\.com$/, '카카오톡'],
  [/instagram\.com$/, '인스타그램'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, '페이스북'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, '유튜브'],
  [/(chatgpt\.com|openai\.com)$/, 'ChatGPT'],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, 'X(트위터)'],
  [/threads\.(net|com)$/, 'Threads'],
  [/(^|\.)(zum\.com|nate\.com|yahoo\.|duckduckgo\.com)/, '기타 검색'],
];
const UTM_NAMES = { naver: '네이버', google: '구글', kakao: '카카오톡', kakaotalk: '카카오톡', instagram: '인스타그램', facebook: '페이스북', youtube: '유튜브', blog: '블로그', sms: '문자', qr: 'QR코드', namecard: '명함', banner: '현수막', flyer: '전단', place: '네이버 플레이스' };

function kst(ts) { const d = new Date((ts + KST) * 1000); return { day: d.toISOString().slice(0, 10), hour: d.getUTCHours() }; }
async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
function corsHeaders(origin) {
  const h = { 'cache-control': 'no-store', vary: 'origin' };
  if (origin && ALLOWED.has(origin)) {
    h['access-control-allow-origin'] = origin;
    h['access-control-allow-methods'] = 'GET, POST, OPTIONS';
    h['access-control-allow-headers'] = 'authorization, content-type';
    h['access-control-max-age'] = '86400';
  }
  return h;
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', ...corsHeaders(origin) } });
}
function parseUA(ua) {
  const device = /iPad|Tablet|SM-T\d/i.test(ua) ? '태블릿' : /Mobi|Android|iPhone/i.test(ua) ? '모바일' : 'PC';
  const os = /Windows/i.test(ua) ? 'Windows' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Mac OS/i.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/i.test(ua) ? 'Linux' : '기타';
  const browser = /KAKAOTALK/i.test(ua) ? '카카오톡 인앱' : /Instagram/i.test(ua) ? '인스타그램 인앱' : /NAVER\(inapp/i.test(ua) ? '네이버 앱' : /FBAN|FBAV/.test(ua) ? '페이스북 인앱' : /Whale\//.test(ua) ? '웨일' : /SamsungBrowser/.test(ua) ? '삼성 인터넷' : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '기타';
  return { device, os, browser };
}
function classifySource(refHost, utmSource, ua) {
  if (utmSource) return UTM_NAMES[utmSource.toLowerCase()] || utmSource.slice(0, 40);
  const h = (refHost || '').toLowerCase();
  if (!h) {
    if (/KAKAOTALK/i.test(ua)) return '카카오톡';
    if (/Instagram/i.test(ua)) return '인스타그램';
    if (/NAVER\(inapp/i.test(ua)) return '네이버 앱';
    return '직접 유입';
  }
  for (const [re, name] of SOURCE_RULES) if (re.test(h)) return name;
  return '기타 사이트';
}

// ---------- 방문 기록 ----------
async function track(request, env, ctx, origin) {
  if (!env.DB) return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (!origin || !ALLOWED.has(origin)) return new Response(null, { status: 403 });
  const ua = request.headers.get('user-agent') || '';
  if (!ua || BOT_RE.test(ua)) return new Response(null, { status: 204, headers: corsHeaders(origin) });
  let b;
  try {
    const text = await request.text();
    if (text.length > 4096) throw 0;
    b = JSON.parse(text);
  } catch { return new Response(null, { status: 204, headers: corsHeaders(origin) }); }
  if (!b || typeof b !== 'object') return new Response(null, { status: 204, headers: corsHeaders(origin) });

  let path = typeof b.p === 'string' ? b.p.split('?')[0].split('#')[0] : '';
  if (!path.startsWith('/') || path.length > 200) return new Response(null, { status: 204, headers: corsHeaders(origin) });
  path = path.replace(/^\/junglegym-naesu/, '') || '/';          // github.io 경로 접두어 제거
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (/^\/admin/.test(path)) return new Response(null, { status: 204, headers: corsHeaders(origin) });
  const type = b.e ? 'event' : 'view';
  const name = b.e ? String(b.e).slice(0, 40) : null;

  let refHost = null, refUrl = null;
  if (typeof b.r === 'string' && b.r) {
    try {
      const r = new URL(b.r);
      if (!SELF_HOSTS.has(r.hostname.toLowerCase())) { refHost = r.hostname.toLowerCase().replace(/^www\./, ''); refUrl = (r.origin + r.pathname + r.search).slice(0, 500); }
    } catch {}
  }
  let utmSource = null, medium = null, campaign = null;
  if (typeof b.q === 'string' && b.q) {
    const q = new URLSearchParams(b.q);
    utmSource = (q.get('utm_source') || '').slice(0, 60) || null;
    medium = (q.get('utm_medium') || '').slice(0, 60) || null;
    campaign = (q.get('utm_campaign') || '').slice(0, 80) || null;
  }
  const source = classifySource(refHost, utmSource, ua);
  const { device, os, browser } = parseUA(ua);
  const cf = request.cf || {};
  const ts = Math.floor(Date.now() / 1000);
  const { day, hour } = kst(ts);
  const ip = request.headers.get('cf-connecting-ip') || '0';
  const vid = typeof b.v === 'string' && /^[a-f0-9]{16}$/.test(b.v) ? b.v : (await sha256hex(day + '|' + ip + '|' + ua)).slice(0, 16);
  const stmt = env.DB.prepare('INSERT INTO hits (ts, day, hour, type, name, path, ref_host, ref_url, source, medium, campaign, device, browser, os, country, city, vid, screen, lang) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(ts, day, hour, type, name, path, refHost, refUrl, source, medium, campaign, device, browser, os, cf.country || null, cf.city ? String(cf.city).slice(0, 60) : null, vid, typeof b.s === 'string' ? b.s.slice(0, 20) : null, typeof b.l === 'string' ? b.l.slice(0, 10) : null);
  ctx.waitUntil(stmt.run().catch(() => {}));
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ---------- 관리자 인증: GitHub 토큰으로 저장소 쓰기 권한 확인 ----------
const authCache = new Map(); // sha256(token) -> { ok, exp }
async function isAdmin(request) {
  const m = (request.headers.get('authorization') || '').match(/^Bearer\s+(\S+)$/i);
  if (!m) return false;
  const token = m[1];
  const key = await sha256hex(token);
  const c = authCache.get(key);
  if (c && c.exp > Date.now()) return c.ok;
  let ok = false;
  try {
    const r = await fetch('https://api.github.com/repos/' + REPO, { headers: { authorization: 'Bearer ' + token, accept: 'application/vnd.github+json', 'user-agent': 'junglegym-stats', 'x-github-api-version': '2022-11-28' } });
    if (r.ok) { const j = await r.json(); ok = !!(j.permissions && (j.permissions.push || j.permissions.admin || j.permissions.maintain)); }
  } catch {}
  authCache.set(key, { ok, exp: Date.now() + (ok ? 10 : 1) * 60 * 1000 });
  return ok;
}

// ---------- 집계 ----------
function dayStr(d) { return d.toISOString().slice(0, 10); }
function validDay(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
function shiftDay(s, n) { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return dayStr(d); }
function rangeOf(url) {
  const today = kst(Math.floor(Date.now() / 1000)).day;
  let from = url.searchParams.get('from'), to = url.searchParams.get('to');
  if (!validDay(to)) to = today;
  if (!validDay(from)) from = shiftDay(to, -6);
  if (from > to) [from, to] = [to, from];
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  if (days > 400) from = shiftDay(to, -399);
  return { from, to, days, today };
}
async function stats(env, url) {
  const { from, to, days, today } = rangeOf(url);
  const pFrom = shiftDay(from, -days), pTo = shiftDay(from, -1);
  const now = Math.floor(Date.now() / 1000);
  const q = (sql, ...a) => env.DB.prepare(sql).bind(...a);
  const rows = await env.DB.batch([
    q(`SELECT COUNT(*) pv, COUNT(DISTINCT vid) uv, COUNT(DISTINCT day || vid) visits FROM hits WHERE type='view' AND day BETWEEN ? AND ?`, from, to),
    q(`SELECT COUNT(*) pv, COUNT(DISTINCT vid) uv, COUNT(DISTINCT day || vid) visits FROM hits WHERE type='view' AND day BETWEEN ? AND ?`, pFrom, pTo),
    q(`SELECT COUNT(*) c, COUNT(DISTINCT vid) u FROM hits WHERE type='event' AND day BETWEEN ? AND ?`, from, to),
    q(`SELECT COUNT(*) c, COUNT(DISTINCT vid) u FROM hits WHERE type='event' AND day BETWEEN ? AND ?`, pFrom, pTo),
    q(`SELECT day, SUM(type='view') pv, COUNT(DISTINCT CASE WHEN type='view' THEN vid END) uv, SUM(type='event') ev FROM hits WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day`, from, to),
    q(`SELECT hour, SUM(type='view') pv, COUNT(DISTINCT CASE WHEN type='view' THEN vid END) uv FROM hits WHERE day BETWEEN ? AND ? GROUP BY hour ORDER BY hour`, from, to),
    q(`SELECT source, COUNT(*) pv, COUNT(DISTINCT vid) uv FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY source ORDER BY uv DESC, pv DESC`, from, to),
    q(`SELECT ref_host, ref_url, COUNT(*) pv, COUNT(DISTINCT vid) uv FROM hits WHERE type='view' AND ref_host IS NOT NULL AND day BETWEEN ? AND ? GROUP BY ref_url ORDER BY uv DESC, pv DESC LIMIT 30`, from, to),
    q(`SELECT source, medium, campaign, COUNT(*) pv, COUNT(DISTINCT vid) uv FROM hits WHERE type='view' AND (medium IS NOT NULL OR campaign IS NOT NULL) AND day BETWEEN ? AND ? GROUP BY source, medium, campaign ORDER BY uv DESC LIMIT 30`, from, to),
    q(`SELECT path, COUNT(*) pv, COUNT(DISTINCT vid) uv FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY path ORDER BY pv DESC LIMIT 30`, from, to),
    q(`SELECT path, COUNT(*) c FROM (SELECT path, MIN(ts) m FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY day, vid) GROUP BY path ORDER BY c DESC LIMIT 20`, from, to),
    q(`SELECT 'device' dim, device k, COUNT(DISTINCT vid) uv, COUNT(*) pv FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY device
       UNION ALL SELECT 'browser', browser, COUNT(DISTINCT vid), COUNT(*) FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY browser
       UNION ALL SELECT 'os', os, COUNT(DISTINCT vid), COUNT(*) FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY os
       UNION ALL SELECT 'country', country, COUNT(DISTINCT vid), COUNT(*) FROM hits WHERE type='view' AND day BETWEEN ? AND ? GROUP BY country
       UNION ALL SELECT 'city', city, COUNT(DISTINCT vid), COUNT(*) FROM hits WHERE type='view' AND city IS NOT NULL AND day BETWEEN ? AND ? GROUP BY city
       ORDER BY dim, uv DESC`, from, to, from, to, from, to, from, to, from, to),
    q(`SELECT name, COUNT(*) c, COUNT(DISTINCT vid) u FROM hits WHERE type='event' AND day BETWEEN ? AND ? GROUP BY name ORDER BY c DESC`, from, to),
    q(`SELECT COUNT(DISTINCT vid) n FROM hits WHERE ts > ?`, now - 1800),
    q(`SELECT ts, type, name, path, source, ref_host, device, browser, country, city FROM hits ORDER BY ts DESC LIMIT 40`),
    q(`SELECT COUNT(*) n FROM (SELECT vid, MIN(day) d0 FROM hits WHERE type='view' GROUP BY vid) WHERE d0 BETWEEN ? AND ?`, from, to),
    q(`SELECT COUNT(*) n FROM (SELECT vid, MIN(day) d0 FROM hits WHERE type='view' GROUP BY vid) WHERE d0 BETWEEN ? AND ?`, pFrom, pTo),
  ]);
  const r = rows.map((x) => x.results || []);
  const dims = {};
  for (const row of r[11]) (dims[row.dim] = dims[row.dim] || []).push({ k: row.k || '알 수 없음', uv: row.uv, pv: row.pv });
  return {
    range: { from, to, days, prevFrom: pFrom, prevTo: pTo, today },
    totals: { ...r[0][0], events: r[2][0].c, eventUsers: r[2][0].u, newUsers: r[15][0].n },
    prev: { ...r[1][0], events: r[3][0].c, eventUsers: r[3][0].u, newUsers: r[16][0].n },
    daily: r[4], hourly: r[5], sources: r[6], referrers: r[7], campaigns: r[8], pages: r[9], landing: r[10],
    dims, events: r[12], live: r[13][0].n, recent: r[14],
  };
}
async function exportCsv(env, url, origin) {
  const { from, to } = rangeOf(url);
  const { results } = await env.DB.prepare('SELECT ts, day, hour, type, name, path, ref_host, ref_url, source, medium, campaign, device, browser, os, country, city, vid, screen, lang FROM hits WHERE day BETWEEN ? AND ? ORDER BY ts LIMIT 50000').bind(from, to).all();
  const cols = ['ts', 'day', 'hour', 'type', 'name', 'path', 'ref_host', 'ref_url', 'source', 'medium', 'campaign', 'device', 'browser', 'os', 'country', 'city', 'vid', 'screen', 'lang'];
  const cell = (v) => { if (v == null) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [cols.join(',')];
  for (const row of results) lines.push(cols.map((c) => cell(row[c])).join(','));
  return new Response('﻿' + lines.join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="junglegym-visits-${from}_${to}.csv"`, ...corsHeaders(origin) } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    const p = url.pathname.replace(/\/+$/, '') || '/';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (p === '/t') return request.method === 'POST' ? track(request, env, ctx, origin) : new Response(null, { status: 405 });
    if (p === '/health') return json({ ok: true, db: !!env.DB }, 200, origin);
    if (p === '/stats' || p === '/export') {
      if (request.method !== 'GET') return new Response(null, { status: 405 });
      if (!(await isAdmin(request))) return json({ error: 'unauthorized' }, 401, origin);
      if (!env.DB) return json({ error: 'D1 데이터베이스가 연결되지 않았습니다.' }, 503, origin);
      try {
        if (p === '/export') return await exportCsv(env, url, origin);
        return json(await stats(env, url), 200, origin);
      } catch (e) { return json({ error: '서버 오류: ' + String(e && e.message || e) }, 500, origin); }
    }
    return json({ error: 'not found' }, 404, origin);
  },
};
