-- ============================================
-- בדיקה: מה יש ב-Supabase עכשיו?
-- הרץ את זה כדי לראות מה יש
-- ============================================

-- 1. מה יש בטבלה? (כל הרשומות)
SELECT 
  content_id,
  content_type,
  LEFT(content_text, 150) as text_preview,
  metadata,
  created_at
FROM vector_embeddings
ORDER BY created_at DESC;

-- 2. כמה מכל סוג?
SELECT 
  content_type,
  COUNT(*) as count
FROM vector_embeddings
GROUP BY content_type
ORDER BY count DESC;

-- 3. האם יש פרופילי משתמשים?
SELECT 
  content_id,
  content_text,
  metadata
FROM vector_embeddings
WHERE content_type = 'user_profile';

