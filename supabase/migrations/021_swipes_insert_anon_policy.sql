ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "swipes_insert_anon" ON swipes;
CREATE POLICY "swipes_insert_anon" ON swipes
FOR INSERT
WITH CHECK (true);
