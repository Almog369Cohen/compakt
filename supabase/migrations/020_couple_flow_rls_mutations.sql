ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "answers_update_anon" ON answers;
CREATE POLICY "answers_update_anon" ON answers
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "answers_delete_anon" ON answers;
CREATE POLICY "answers_delete_anon" ON answers
FOR DELETE
USING (true);

DROP POLICY IF EXISTS "swipes_update_anon" ON swipes;
CREATE POLICY "swipes_update_anon" ON swipes
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "swipes_delete_anon" ON swipes;
CREATE POLICY "swipes_delete_anon" ON swipes
FOR DELETE
USING (true);

DROP POLICY IF EXISTS "requests_update_anon" ON requests;
CREATE POLICY "requests_update_anon" ON requests
FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "requests_delete_anon" ON requests;
CREATE POLICY "requests_delete_anon" ON requests
FOR DELETE
USING (true);
