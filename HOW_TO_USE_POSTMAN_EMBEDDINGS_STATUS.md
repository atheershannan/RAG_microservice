# איך להשתמש ב-Postman לבדיקת Embeddings Status

## ✅ ה-URL הנכון

```
https://ragmicroservice-production.up.railway.app/api/debug/embeddings-status?tenant_id=default.local
```

## 📋 הוראות ל-Postman

### שלב 1: פתח Postman
1. פתח את Postman
2. לחץ על **"New"** או **"+"** ליצירת request חדש

### שלב 2: הגדר את ה-Request

1. **Method**: בחר **GET** (לא POST!)
   - זה endpoint של GET, לא POST

2. **URL**: הכנס את ה-URL:
   ```
   https://ragmicroservice-production.up.railway.app/api/debug/embeddings-status
   ```

3. **Query Parameters** (Params tab):
   - לחץ על הטאב **"Params"**
   - הוסף parameter:
     - **Key**: `tenant_id`
     - **Value**: `default.local`
   
   או פשוט הכנס את ה-URL המלא:
   ```
   https://ragmicroservice-production.up.railway.app/api/debug/embeddings-status?tenant_id=default.local
   ```

### שלב 3: Headers (אופציונלי)

#### Headers בסיסיים:
- **Key**: `Content-Type`
- **Value**: `application/json`

#### Header לבדיקת RBAC (Admin User):
כדי לבדוק התנהגות של admin user, הוסף header:
- **Key**: `x-user-role`
- **Value**: `admin`

**איך להוסיף ב-Postman:**
1. לחץ על הטאב **"Headers"** (ליד Params)
2. לחץ על **"Add Header"** או **"+"**
3. הכנס:
   - **Key**: `x-user-role`
   - **Value**: `admin`
4. לחץ **Save**

**דוגמה:**
```
x-user-role: admin
```

**תפקידים אפשריים:**
- `admin` - גישה מלאה לכל user profiles
- `user` - גישה מוגבלת (רק queries עם שמות ספציפיים)
- `anonymous` - ברירת מחדל (אין גישה ל-user profiles)

### שלב 4: שלח את ה-Request
לחץ על **"Send"**

## 📊 מה אמור לחזור

### תגובה תקינה (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "tenant": {
    "domain": "default.local",
    "id": "123"
  },
  "pgvector": {
    "extension_enabled": true,
    "extension_info": {...}
  },
  "indexes": {
    "hnsw_index_exists": true,
    "indexes": [...]
  },
  "embeddings": {
    "total_in_database": 50,
    "total_for_tenant": 10,
    "by_content_type": [
      {
        "content_type": "user_profile",
        "count": 5
      },
      {
        "content_type": "course",
        "count": 3
      }
    ],
    "sample_embeddings": [...]
  },
  "eden_levi_check": {
    "found": true,
    "records": [...]
  }
}
```

### מה לבדוק:

1. ✅ **`embeddings.total_for_tenant`** - צריך להיות > 0
   - אם זה 0, אין embeddings ל-tenant הזה

2. ✅ **`eden_levi_check.found`** - צריך להיות `true`
   - אם זה `false`, Eden Levi לא נמצא

3. ✅ **`pgvector.extension_enabled`** - צריך להיות `true`
   - אם זה `false`, צריך להפעיל את pgvector ב-Supabase

4. ✅ **`indexes.hnsw_index_exists`** - צריך להיות `true`
   - אם זה `false`, צריך ליצור index

## ⚠️ שגיאות אפשריות

### 404 Not Found
- בדוק שה-URL נכון
- בדוק שה-endpoint קיים

### 500 Internal Server Error
- בדוק את ה-logs ב-Railway
- יכול להיות בעיה ב-database connection

### CORS Error
- זה endpoint של debug, לא אמור להיות CORS issues
- אם יש, הוסף header: `Origin: https://your-domain.com`

## 🔍 דוגמאות נוספות

### עם tenant_id אחר:
```
https://ragmicroservice-production.up.railway.app/api/debug/embeddings-status?tenant_id=dev.educore.local
```

### בלי tenant_id (ישתמש ב-default):
```
https://ragmicroservice-production.up.railway.app/api/debug/embeddings-status
```

## 📝 הערות

- זה endpoint של **GET** - לא צריך body
- זה endpoint של **debug** - לא צריך authentication (בדרך כלל)
- ה-URL שלך נכון! ✅

---

**סיכום**: כן, ה-URL שלך נכון! פשוט:
1. פתח Postman
2. בחר GET
3. הכנס את ה-URL
4. לחץ Send

