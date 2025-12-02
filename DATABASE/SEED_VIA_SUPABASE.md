# איך למלא את הטבלאות (Seed Database)

## ⚠️ חשוב:
**הקובץ `seed.sql` הוסר** - הוא לא הכיל את כל הנתונים (חסרו vector embeddings והמשתמשים Eden Levi, Adi Cohen, Noa Bar).

**השתמש ב-`seed.js` במקום** - זה הקובץ המלא והמעודכן.

---

## פתרון מומלץ: הרצת seed.js

### דרך 1: דרך npm script (מומלץ)
```bash
npm run db:seed
```

### דרך 2: דרך Prisma CLI
```bash
npx prisma db seed
```

### דרך 3: ישירות
```bash
node DATABASE/prisma/seed.js
```

**כל האפשרויות מריצות את `seed.js`** - הקובץ המלא עם כל הנתונים.

---

## מה seed.js עושה:

1. ✅ יוצר tenant (אם לא קיים)
2. ✅ יוצר 10 מיקרוסרוויסים
3. ✅ יוצר access control rules
4. ✅ יוצר user profiles (כולל Eden Levi, Adi Cohen, Noa Bar)
5. ✅ יוצר knowledge graph nodes & edges
6. ✅ יוצר **9 vector embeddings** (guides, assessments, courses, user profiles)
7. ✅ יוצר sample query עם sources
8. ✅ מציג סיכום בסוף

---

## בדיקה שהכל עבד:

לאחר הרצת seed.js, בדוק ב-Supabase SQL Editor:
```sql
SELECT 
    'microservices' as table_name, COUNT(*) as count FROM microservices
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'vector_embeddings', COUNT(*) FROM vector_embeddings
UNION ALL
SELECT 'queries', COUNT(*) FROM queries;
```

**תוצאה צפויה:**
```
table_name        | count
------------------+-------
microservices     | 10
user_profiles     | 5 (learner-001, trainer-001, admin-001, manager-001, employee-001)
vector_embeddings | 9
queries           | 1
```

---

## הערות חשובות:

- seed.js משתמש ב-`upsert` - אפשר להריץ כמה פעמים
- seed.js יוצר tenant עם domain `dev.educore.local`
- אם כבר יש נתונים, הם לא יוחלפו (upsert)
- **חשוב:** seed.js יוצר vector embeddings - ודא ש-pgvector מופעל ב-Supabase

---

## אם יש שגיאות:

### שגיאה: "relation does not exist"
→ ה-migrations לא הוחלו. הרץ את ה-migrations קודם.

### שגיאה: "duplicate key"
→ הנתונים כבר קיימים. זה בסדר - ה-`ON CONFLICT` ימנע שגיאות.

### שגיאה: "permission denied"
→ ודא שיש לך הרשאות ליצור טבלאות ב-Supabase.

---

## בדיקה מפורטת:

```sql
-- בדוק את כל המיקרוסרוויסים
SELECT name, display_name, is_active 
FROM microservices 
ORDER BY name;

-- בדוק את ה-user profiles
SELECT user_id, role, department 
FROM user_profiles;

-- בדוק את ה-queries
SELECT query_text, answer, confidence_score 
FROM queries;
```

---

## סיכום:

1. הרץ `npm run db:seed` (או `npx prisma db seed`)
2. בדוק את התוצאות ב-Supabase
3. ודא ש-vector embeddings נוצרו (9 embeddings)

**זה הכל!** 🎯

---

## אם אין לך גישה ל-Node.js:

אם אתה צריך להריץ seed בלי Node.js (למשל ב-Railway ללא טרמינל), יש כמה אפשרויות:

1. **השתמש ב-Railway CLI** או **GitHub Actions** להרצת seed.js
2. **הרץ seed.js מקומית** והנתונים יגיעו ל-Supabase דרך ה-connection string
3. **צור script חדש** שמכיל את כל הנתונים ב-SQL (אבל זה מסובך כי vector embeddings דורשים embeddings אמיתיים)

