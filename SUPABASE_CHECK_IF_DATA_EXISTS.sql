-- ============================================
-- בדיקה: האם יש בכלל מידע ב-Supabase?
-- הרץ את זה כדי לראות מה יש
-- ============================================

-- 1. כמה רשומות יש בכלל?
SELECT COUNT(*) as total_records FROM vector_embeddings;

-- 2. מה יש בטבלה? (10 הראשונות)
SELECT 
  content_id,
  content_type,
  LEFT(content_text, 100) as text_preview,
  created_at
FROM vector_embeddings
ORDER BY created_at DESC
LIMIT 10;

-- 3. כמה מכל סוג תוכן?
SELECT 
  content_type,
  COUNT(*) as count
FROM vector_embeddings
GROUP BY content_type
ORDER BY count DESC;

-- 4. האם יש בכלל פרופילי משתמשים?
SELECT COUNT(*) as user_profiles_count
FROM vector_embeddings
WHERE content_type = 'user_profile';

-- 5. מה יש בטבלה user_profiles? (אם קיימת)
-- אם הטבלה קיימת, זה יראה את הפרופילים
SELECT 
  user_id,
  role,
  department,
  metadata
FROM user_profiles
LIMIT 10;

