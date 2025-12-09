# מדריך בחירת סוג חיבור Supabase

## איזה סוג חיבור לבחור?

כשאתה ב-Supabase Dashboard → Settings → Database → Connection string, תראה 3 אפשרויות:

### 1. Direct Connection (port 5432)

**מתי להשתמש:**
- ✅ אפליקציות עם חיבורים מתמשכים (VMs, containers)
- ✅ כאשר יש לך IP allowlist מוגדר
- ✅ כאשר אתה צריך features מלאים של PostgreSQL

**מתי לא להשתמש:**
- ❌ מ-Railway (דורש IP allowlist)
- ❌ עם serverless functions
- ❌ אם אין לך שליטה על IP addresses

**למה לא מומלץ למיגרציות:**
- דורש IP allowlist
- לא תמיד נגיש מ-Railway

---

### 2. Transaction Pooler (port 6543)

**⚠️ חשוב:** גם Transaction וגם Session pooler משתמשים ב-port 6543!
ההבדל הוא בסוג ה-pooler, לא ב-port.

**מתי להשתמש:**
- ✅ Serverless functions (Vercel, AWS Lambda)
- ✅ אפליקציות stateless עם חיבורים קצרים
- ✅ כאשר כל query הוא transaction נפרד

**מתי לא להשתמש:**
- ❌ **Prisma Migrations** - לא מומלץ!
- ❌ Prepared statements (לא נתמך)
- ❌ Transactions ארוכות

**למה לא מומלץ למיגרציות:**
- Transaction pooler לא תומך ב-prepared statements
- Prisma migrations משתמשות ב-prepared statements
- יכול לגרום לשגיאות "prepared statement already exists"

---

### 3. Session Pooler (port 6543) ⭐ **מומלץ למיגרציות**

**⚠️ חשוב:** גם Transaction וגם Session pooler משתמשים ב-port 6543!
ההבדל הוא בסוג ה-pooler, לא ב-port.

**מתי להשתמש:**
- ✅ **Prisma Migrations** - מומלץ מאוד!
- ✅ אפליקציות שצריכות prepared statements
- ✅ כאשר אתה צריך features מלאים של PostgreSQL
- ✅ מ-Railway או platforms אחרים

**למה מומלץ למיגרציות:**
- ✅ תומך ב-prepared statements
- ✅ עובד מצוין עם Prisma
- ✅ נגיש מ-Railway (IPv4 compatible)
- ✅ לא דורש IP allowlist

---

## המלצה לפרויקט שלך

**למיגרציות:**
👉 **בחר Session Pooler**

**לאפליקציה (אחרי מיגרציות):**
- אם זה serverless → Transaction Pooler
- אם זה VM/Container → Direct Connection או Session Pooler
- אם זה Railway → Session Pooler

---

## איך לבחור ב-Supabase Dashboard

1. לך ל-**Settings** → **Database**
2. **Connection string** → **URI**
3. **Method** → בחר **Session pooler** (לא Transaction pooler!)
   - ⚠️ **שניהם** משתמשים ב-port 6543
   - ההבדל הוא בסוג ה-pooler, לא ב-port
4. העתק את ה-URL

**הפורמט (Session pooler):**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**הפורמט (Transaction pooler) - אותו port, אבל לא מומלץ למיגרציות:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**⚠️ חשוב:** גם Transaction וגם Session pooler נראים אותו דבר ב-URL!
ההבדל הוא רק ב-Supabase Dashboard - איזה סוג pooler בחרת.

---

## השוואה מהירה

| סוג חיבור | Port | מיגרציות | Serverless | IP Allowlist |
|-----------|------|-----------|------------|--------------|
| Direct | 5432 | ✅ | ❌ | דורש |
| Transaction Pooler | 6543 | ❌ | ✅ | לא דורש |
| **Session Pooler** | **6543** | **✅** | **✅** | **לא דורש** |

---

## פתרון בעיות

### "prepared statement already exists"
**סיבה:** משתמש ב-Transaction pooler
**פתרון:** שנה ל-Session pooler

### "Can't reach database server"
**סיבה:** Direct connection דורש IP allowlist
**פתרון:** שנה ל-Session pooler

### מיגרציות נכשלות
**סיבה:** Transaction pooler לא תומך ב-prepared statements
**פתרון:** שנה ל-Session pooler

---

## סיכום

**למיגרציות: Session Pooler** ⭐
**לאפליקציה: Session Pooler או Transaction Pooler** (תלוי בסוג האפליקציה)

