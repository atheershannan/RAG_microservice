-- ============================================
-- הוספת "Eden Levi" עם בדיקת tenant
-- שאילתה מתוקנת שמוודאת שיש tenant
-- ============================================

-- שלב 1: בדוק אם יש tenant
SELECT id, domain FROM tenants WHERE domain = 'default.local';

-- שלב 2: אם אין tenant, צור אחד
INSERT INTO tenants (id, domain, name, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  'default.local',
  'Default Tenant',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE domain = 'default.local')
RETURNING id, domain;

-- שלב 3: הוסף "Eden Levi" עם tenant_id
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
RETURNING content_id, content_text, tenant_id;

-- שלב 4: בדוק שהמידע נוסף
SELECT 
  content_id,
  content_text,
  metadata->>'fullName' as name,
  metadata->>'role' as role,
  tenant_id
FROM vector_embeddings
WHERE content_id = 'user:manager-001';

