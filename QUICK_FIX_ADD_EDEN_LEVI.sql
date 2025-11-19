-- ============================================
-- הוספה מהירה של "Eden Levi" בלבד
-- אם אתה רוצה רק את זה, הרץ את זה
-- ============================================

WITH tenant AS (
  SELECT id FROM tenants WHERE domain = 'default.local' LIMIT 1
),
dummy_embedding AS (
  SELECT array_agg((random() * 2 - 1)::float)::vector as embedding
  FROM generate_series(1, 1536)
)
INSERT INTO vector_embeddings (
  id,
  tenant_id,
  content_id,
  content_type,
  content_text,
  embedding,
  chunk_index,
  metadata,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid()::text,
  tenant.id,
  'user:manager-001',
  'user_profile',
  'User Profile: Eden Levi (manager). Department: Engineering. Region: IL. Title: Engineering Manager. Focus: delivery, mentoring, planning.',
  dummy_embedding.embedding,
  0,
  '{"fullName": "Eden Levi", "role": "manager", "department": "Engineering", "region": "IL", "title": "Engineering Manager"}'::jsonb,
  NOW(),
  NOW()
FROM tenant, dummy_embedding
WHERE tenant.id IS NOT NULL
ON CONFLICT DO NOTHING
RETURNING content_id, content_text;

-- בדוק שהמידע נוסף
SELECT * FROM vector_embeddings WHERE content_id = 'user:manager-001';

