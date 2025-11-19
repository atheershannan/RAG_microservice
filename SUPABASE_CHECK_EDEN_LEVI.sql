-- ============================================
-- בדיקת "Eden Levi" ב-Supabase
-- הרץ את זה ב-Supabase Dashboard > SQL Editor
-- ============================================

-- 1. בדיקה כללית - כמה רשומות יש?
SELECT COUNT(*) as total_records FROM vector_embeddings;

-- 2. כמה פרופילי משתמשים יש?
SELECT COUNT(*) as user_profiles_count 
FROM vector_embeddings 
WHERE content_type = 'user_profile';

-- 3. חיפוש "Eden Levi" - מלא
SELECT 
  id,
  content_id,
  content_type,
  content_text,
  metadata,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding::float[], 1) = 1536 THEN '✅ Valid embedding (1536 dims)'
    ELSE '⚠️ Invalid dimensions'
  END as embedding_status,
  array_length(embedding::float[], 1) as embedding_dimensions,
  created_at
FROM vector_embeddings
WHERE 
  content_text ILIKE '%Eden Levi%' OR
  content_text ILIKE '%Eden%' OR
  content_text ILIKE '%Levi%' OR
  content_id ILIKE '%eden%' OR
  content_id ILIKE '%manager-001%' OR
  content_id ILIKE '%manager%' OR
  metadata::text ILIKE '%Eden%' OR
  metadata::text ILIKE '%Levi%'
ORDER BY 
  CASE 
    WHEN content_text ILIKE '%Eden Levi%' THEN 1
    WHEN content_text ILIKE '%Eden%' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- 4. כל פרופילי המשתמשים
SELECT 
  content_id,
  content_type,
  content_text,
  metadata->>'fullName' as name,
  metadata->>'role' as role,
  metadata->>'title' as title,
  metadata->>'department' as department,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding, 1) = 1536 THEN '✅ Valid'
    ELSE '⚠️ Invalid'
  END as embedding_status,
  created_at
FROM vector_embeddings
WHERE content_type = 'user_profile'
ORDER BY created_at DESC;

-- 5. בדיקת embeddings תקינים
SELECT 
  content_id,
  content_type,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding::float[], 1) = 1536 THEN '✅ Valid (1536 dims)'
    ELSE CONCAT('⚠️ Invalid: ', array_length(embedding::float[], 1), ' dims')
  END as embedding_status,
  array_length(embedding::float[], 1) as dimensions
FROM vector_embeddings
WHERE content_type = 'user_profile'
ORDER BY content_id;

-- 6. בדיקה ספציפית של manager-001
SELECT 
  content_id,
  content_text,
  metadata,
  CASE 
    WHEN embedding IS NULL THEN '❌ No embedding'
    WHEN array_length(embedding::float[], 1) = 1536 THEN '✅ Valid'
    ELSE '⚠️ Invalid'
  END as embedding_status
FROM vector_embeddings
WHERE content_id = 'user:manager-001';

-- 7. פילוח לפי סוג תוכן
SELECT 
  content_type,
  COUNT(*) as count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as without_embeddings
FROM vector_embeddings
GROUP BY content_type
ORDER BY count DESC;

