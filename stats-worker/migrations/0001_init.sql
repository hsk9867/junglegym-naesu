-- 정글짐 방문 통계
CREATE TABLE IF NOT EXISTS hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,            -- unix 초
  day TEXT NOT NULL,              -- 한국시간 YYYY-MM-DD
  hour INTEGER NOT NULL,          -- 한국시간 0~23
  type TEXT NOT NULL,             -- view | event
  name TEXT,                      -- event 이름 (tel, naver_talk, naver_map, instagram, pt_page ...)
  path TEXT NOT NULL,
  ref_host TEXT,
  ref_url TEXT,
  source TEXT NOT NULL,           -- 분류된 유입경로
  medium TEXT,
  campaign TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  vid TEXT NOT NULL,              -- 익명 방문자 ID (localStorage) 또는 당일 해시
  screen TEXT,
  lang TEXT
);
CREATE INDEX IF NOT EXISTS idx_hits_day ON hits(day, type);
CREATE INDEX IF NOT EXISTS idx_hits_ts ON hits(ts);
