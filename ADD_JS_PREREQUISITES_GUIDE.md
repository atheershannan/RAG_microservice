# מדריך: הוספת תוכן Prerequisites ל-JavaScript

## 📋 סקירה

הוספתי תוכן מקיף על prerequisites לקורס JavaScript למאגר. התוכן כולל:
- מה צריך לדעת לפני הקורס
- כישורים נדרשים מול מומלצים
- הסבר מפורט על כל דרישה

## 🚀 איך להוסיף את התוכן

### אפשרות 1: סקריפט ייעודי (מומלץ) ✅

הסקריפט יוצר embeddings אמיתיים מ-OpenAI:

```bash
cd BACKEND
npm run add:js-prerequisites
```

או ישירות:
```bash
cd BACKEND
node scripts/add-js-prerequisites.js
```

**דרישות:**
- `OPENAI_API_KEY` מוגדר
- `DATABASE_URL` מוגדר
- חיבור ל-Supabase פעיל

### אפשרות 2: דרך create-embeddings-and-insert.js

התוכן כבר נוסף ל-`create-embeddings-and-insert.js`:

```bash
cd BACKEND
npm run create:embeddings
```

זה יוסיף את כל התוכן כולל prerequisites.

### אפשרות 3: דרך seed.js

התוכן נוסף גם ל-`seed.js` (אבל עם embeddings מזויפים):

```bash
npm run db:seed
```

**הערה:** seed.js משתמש ב-embeddings מזויפים. להרצה ב-production, השתמש ב-`add-js-prerequisites.js` או `create-embeddings-and-insert.js`.

## 📝 מה נוסף למאגר

### 1. JavaScript Prerequisites Guide (2 chunks)
- **contentId:** `js-prerequisites-guide`
- **Chunk 0:** סקירה כללית של prerequisites
- **Chunk 1:** הסבר מפורט על מה צריך לדעת

### 2. JavaScript Prerequisites - Detailed Guide
- **contentId:** `js-prerequisites-detailed`
- הסבר מפורט על כישורים נדרשים, מומלצים, ואופציונליים

## ✅ בדיקה שהתוכן נוסף

לאחר הרצת הסקריפט, בדוק:

```sql
SELECT 
  content_id,
  content_type,
  chunk_index,
  metadata->>'title' as title,
  LEFT(content_text, 100) as preview
FROM vector_embeddings
WHERE content_id LIKE 'js-prerequisites%'
ORDER BY content_id, chunk_index;
```

**תוצאה צפויה:**
```
content_id                  | content_type | chunk_index | title                                    | preview
----------------------------+--------------+-------------+------------------------------------------+----------------------------------------
js-prerequisites-detailed   | document     | 0           | JavaScript Prerequisites - Detailed Guide | Detailed JavaScript Prerequisites: Required Skills...
js-prerequisites-guide       | guide        | 0           | JavaScript Course Prerequisites Guide     | JavaScript Course Prerequisites: Before starting...
js-prerequisites-guide      | guide        | 1           | JavaScript Course Prerequisites Guide     | What You Need to Know Before JavaScript Course...
```

## 🧪 בדיקה שהכל עובד

נסה את השאלה הבאה:

```bash
curl -X POST https://ragmicroservice-production.up.railway.app/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "מה אני צריך לדעת לפני הקורס ב JavaScript?",
    "tenant_id": "default.local"
  }'
```

או בעברית:
```bash
curl -X POST https://ragmicroservice-production.up.railway.app/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What do I need to know before the JavaScript course?",
    "tenant_id": "default.local"
  }'
```

**תשובה צפויה:**
- תשובה מפורטת על prerequisites
- Sources עם התוכן החדש
- Confidence score גבוה

## 📊 מה התוכן כולל

### Required Skills (נדרש):
- Basic computer operation
- Text editor usage
- Web browser familiarity

### Recommended Skills (מומלץ):
- Basic HTML knowledge
- Basic CSS knowledge
- Logical thinking

### Optional Skills (אופציונלי):
- Experience with any programming language
- Understanding of algorithms
- Command line familiarity

## 🔗 קישורים ל-Knowledge Graph

אם תרצה, אפשר להוסיף קשרים ב-Knowledge Graph:

```sql
-- קשר בין הקורס ל-prerequisites
INSERT INTO knowledge_graph_edges (
  tenant_id, source_node_id, target_node_id, edge_type, weight
) VALUES (
  'your-tenant-id',
  'course:js-basics-101',
  'content:js-prerequisites-guide',
  'has_prerequisites',
  0.9
);
```

## 🎯 סיכום

1. ✅ תוכן נוסף ל-`create-embeddings-and-insert.js`
2. ✅ תוכן נוסף ל-`seed.js`
3. ✅ סקריפט ייעודי: `add-js-prerequisites.js`
4. ✅ npm script: `npm run add:js-prerequisites`

**הרץ את הסקריפט והתוכן יהיה זמין במאגר!** 🚀

