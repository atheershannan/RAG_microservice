-- ============================================
-- הוספת כל המידע מ-seed.js ל-Supabase
-- הרץ את זה ב-Supabase SQL Editor
-- זה יוסיף את כל ה-mock data כולל "Eden Levi"
-- ============================================

-- שלב 1: ודא שיש tenant
INSERT INTO tenants (id, domain, name, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  'default.local',
  'Default Tenant',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE domain = 'default.local')
RETURNING id, domain;

-- שלב 2: הוסף את כל ה-vector embeddings
-- (השאילתה הזו תכניס את כל המידע מ-seed.js)

WITH tenant AS (
  SELECT id FROM tenants WHERE domain = 'default.local' LIMIT 1
),
-- צור embeddings דמה (1536 dimensions)
embeddings AS (
  SELECT 
    array_agg((random() * 2 - 1)::float)::vector as embedding
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
  data.content_id,
  data.content_type,
  data.content_text,
  embeddings.embedding,
  data.chunk_index,
  data.metadata::jsonb,
  NOW(),
  NOW()
FROM tenant, embeddings,
(VALUES
  -- Guide
  (
    'guide-get-started',
    'guide',
    'EDUCORE – Getting Started Guide: 1) Data-first: answers come from your Supabase database via vector_embeddings; ensure seed ran and pgvector is enabled (CREATE EXTENSION IF NOT EXISTS vector;). 2) Normal Chat: call /api/v1/query with no support flags; strict RAG uses only retrieved context; if no context, a dynamic no-data message is returned. 3) Support Mode (Assessment/DevLab): enable SUPPORT_MODE_ENABLED=true and send an explicit signal per request (X-Source: assessment|devlab or support_mode or metadata.source); optionally set VITE_DEFAULT_SUPPORT_MODE on frontend. 4) Security gating: SUPPORT_ALLOWED_ORIGINS and SUPPORT_SHARED_SECRET (header X-Embed-Secret). 5) Verify persistence in queries, query_sources, and vector_embeddings. Endpoints: /api/v1/query, /api/assessment/support, /api/devlab/support.',
    0,
    '{"title": "Get Started Guide", "category": "guide", "tags": ["get started", "guide", "educore", "setup", "support mode", "rag"]}'
  ),
  -- Assessment
  (
    'assessment-001',
    'assessment',
    'JavaScript Fundamentals Assessment: Test your knowledge of variables, functions, and control flow in JavaScript.',
    0,
    '{"title": "JavaScript Fundamentals Assessment", "difficulty": "beginner", "duration": 1800}'
  ),
  -- DevLab Exercise
  (
    'devlab-exercise-001',
    'exercise',
    'Build a simple calculator using JavaScript. Practice DOM manipulation and event handling.',
    0,
    '{"title": "JavaScript Calculator Exercise", "type": "coding", "difficulty": "intermediate"}'
  ),
  -- Course - Part 1
  (
    'course-js-basics-101',
    'document',
    'JavaScript Basics Course: Learn the fundamentals of JavaScript programming including variables, data types, functions, and control structures.',
    0,
    '{"title": "JavaScript Basics Course", "courseId": "js-basics-101", "section": "introduction"}'
  ),
  -- Course - Part 2
  (
    'course-js-basics-101',
    'document',
    'Advanced JavaScript Topics: Explore closures, promises, async/await, and modern ES6+ features.',
    1,
    '{"title": "JavaScript Basics Course", "courseId": "js-basics-101", "section": "advanced"}'
  ),
  -- Analytics Report
  (
    'analytics-report-001',
    'report',
    'Learning Progress Report: Track your progress across all courses and identify areas for improvement.',
    0,
    '{"title": "Learning Progress Report", "reportType": "progress", "userId": "learner-001"}'
  ),
  -- User Profile: Adi Cohen (admin)
  (
    'user:admin-001',
    'user_profile',
    'User Profile: Adi Cohen (admin). Department: IT. Region: IL. Title: IT Administrator. Responsibilities: system operations, security reviews, access control.',
    0,
    '{"fullName": "Adi Cohen", "role": "admin", "department": "IT", "region": "IL", "title": "IT Administrator"}'
  ),
  -- User Profile: Eden Levi (manager) - זה מה שאת מחפשת!
  (
    'user:manager-001',
    'user_profile',
    'User Profile: Eden Levi (manager). Department: Engineering. Region: IL. Title: Engineering Manager. Focus: delivery, mentoring, planning.',
    0,
    '{"fullName": "Eden Levi", "role": "manager", "department": "Engineering", "region": "IL", "title": "Engineering Manager"}'
  ),
  -- User Profile: Noa Bar (employee)
  (
    'user:employee-001',
    'user_profile',
    'User Profile: Noa Bar (employee). Department: Engineering. Region: IL. Title: Frontend Developer. Skills: JavaScript, CSS. Learning: React, Testing.',
    0,
    '{"fullName": "Noa Bar", "role": "employee", "department": "Engineering", "region": "IL", "title": "Frontend Developer"}'
  )
) AS data(content_id, content_type, content_text, chunk_index, metadata)
WHERE tenant.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- שלב 3: בדוק שהמידע נוסף
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN content_type = 'user_profile' THEN 1 END) as user_profiles
FROM vector_embeddings;

-- שלב 4: בדוק ש-"Eden Levi" קיים
SELECT 
  content_id,
  content_text,
  metadata->>'fullName' as name,
  metadata->>'role' as role,
  metadata->>'title' as title
FROM vector_embeddings
WHERE content_id = 'user:manager-001' OR content_text ILIKE '%Eden Levi%';

