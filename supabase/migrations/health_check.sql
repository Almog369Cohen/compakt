-- ============================================================
-- DB Health Check Queries — Run in Supabase SQL Editor
-- Each query returns problems. Empty result = healthy.
-- ============================================================

-- 1. DJs without any songs (should have at least defaults)
SELECT p.id AS profile_id, p.business_name, 
  (SELECT count(*) FROM songs s WHERE s.dj_id = p.id) AS song_count
FROM profiles p
WHERE (SELECT count(*) FROM songs s WHERE s.dj_id = p.id) = 0;

-- 2. DJs without any questions
SELECT p.id AS profile_id, p.business_name,
  (SELECT count(*) FROM questions q WHERE q.dj_id = p.id) AS question_count
FROM profiles p
WHERE (SELECT count(*) FROM questions q WHERE q.dj_id = p.id) = 0;

-- 3. Events without dj_id (orphan events — not linked to any DJ)
SELECT id, magic_token, couple_name_a, couple_name_b, created_at
FROM events
WHERE dj_id IS NULL;

-- 4. Events with dj_id that doesn't exist in profiles
SELECT e.id, e.dj_id, e.magic_token
FROM events e
LEFT JOIN profiles p ON e.dj_id = p.id
WHERE e.dj_id IS NOT NULL AND p.id IS NULL;

-- 5. Answers referencing non-existent events
SELECT a.id, a.event_id, a.question_id
FROM answers a
LEFT JOIN events e ON a.event_id = e.id
WHERE e.id IS NULL;

-- 6. Swipes referencing non-existent events
SELECT s.id, s.event_id, s.song_id
FROM swipes s
LEFT JOIN events e ON s.event_id = e.id
WHERE e.id IS NULL;

-- 7. Requests referencing non-existent events
SELECT r.id, r.event_id, r.request_type
FROM requests r
LEFT JOIN events e ON r.event_id = e.id
WHERE e.id IS NULL;

-- 8. Duplicate phone+event sessions
SELECT event_id, phone_number, count(*) AS cnt
FROM event_sessions
GROUP BY event_id, phone_number
HAVING count(*) > 1;

-- 9. Verified sessions where event.phone_number is still NULL
SELECT es.id AS session_id, es.event_id, es.phone_number, e.phone_number AS event_phone
FROM event_sessions es
JOIN events e ON es.event_id = e.id
WHERE es.phone_verified = true AND e.phone_number IS NULL;

-- 10. Events with invalid current_stage (outside 0-4)
SELECT id, magic_token, current_stage
FROM events
WHERE current_stage < 0 OR current_stage > 4;

-- 11. Songs with invalid dj_id
SELECT s.id, s.title, s.dj_id
FROM songs s
LEFT JOIN profiles p ON s.dj_id = p.id
WHERE p.id IS NULL;

-- 12. Questions with invalid dj_id
SELECT q.id, q.question_he, q.dj_id
FROM questions q
LEFT JOIN profiles p ON q.dj_id = p.id
WHERE p.id IS NULL;

-- 13. Overall counts (sanity check — should not be all zeros if system is in use)
SELECT 
  (SELECT count(*) FROM profiles) AS profiles,
  (SELECT count(*) FROM events) AS events,
  (SELECT count(*) FROM answers) AS answers,
  (SELECT count(*) FROM swipes) AS swipes,
  (SELECT count(*) FROM requests) AS requests,
  (SELECT count(*) FROM songs) AS songs,
  (SELECT count(*) FROM questions) AS questions,
  (SELECT count(*) FROM upsells) AS upsells,
  (SELECT count(*) FROM event_sessions) AS sessions,
  (SELECT count(*) FROM analytics_events) AS analytics,
  (SELECT count(*) FROM dj_events) AS dj_events;

-- 14. Couple view vs Admin view consistency
-- For each event with dj_id, check admin can see same answer count
SELECT 
  e.id AS event_id,
  e.dj_id,
  e.couple_name_a || ' & ' || e.couple_name_b AS couple,
  e.current_stage,
  (SELECT count(*) FROM answers a WHERE a.event_id = e.id) AS answer_count,
  (SELECT count(*) FROM swipes s WHERE s.event_id = e.id) AS swipe_count,
  (SELECT count(*) FROM requests r WHERE r.event_id = e.id) AS request_count
FROM events e
WHERE e.dj_id IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 20;
