# איך לבדוק RBAC עם Postman

## 🎯 מטרה
לבדוק שהמערכת מסננת נכון user profiles לפי role של המשתמש.

## 📍 Endpoint לבדיקה
```
POST https://ragmicroservice-production.up.railway.app/api/v1/query
```

## 📋 הוראות מפורטות

### שלב 1: פתח Postman
1. פתח את Postman
2. לחץ על **"New"** או **"+"** ליצירת request חדש

### שלב 2: הגדר את ה-Request

1. **Method**: בחר **POST**

2. **URL**: הכנס את ה-URL:
   ```
   https://ragmicroservice-production.up.railway.app/api/v1/query
   ```

3. **Headers** (טאב Headers):
   - לחץ על הטאב **"Headers"**
   - הוסף את ה-headers הבאים:
   
   | Key | Value |
   |-----|-------|
   | `Content-Type` | `application/json` |
   | `x-user-role` | `admin` (או `user` או `anonymous`) |

   **דוגמה:**
   ```
   Content-Type: application/json
   x-user-role: admin
   ```

4. **Body** (טאב Body):
   - בחר **"raw"**
   - בחר **"JSON"** מהרשימה הנפתחת
   - הכנס את ה-JSON הבא:

   ```json
   {
     "query": "What is Eden Levi's role?",
     "tenant_id": "default.local",
     "context": {
       "user_id": "test-user-123"
     },
     "options": {
       "max_results": 5,
       "min_confidence": 0.25
     }
   }
   ```

### שלב 3: שלח את ה-Request
לחץ על **"Send"**

## 🧪 תרחישי בדיקה

### תרחיש 1: Admin User (גישה מלאה)
**Headers:**
```
x-user-role: admin
```

**Query:**
```json
{
  "query": "What is Eden Levi's role?",
  "tenant_id": "default.local"
}
```

**תוצאה צפויה:**
- ✅ אמור להחזיר user_profile results
- ✅ אמור להחזיר גם תוצאות אחרות (documents, assessments, etc.)
- ✅ ב-logs תראה: `isAdmin: true`, `allowUserProfiles: true`

---

### תרחיש 2: Regular User עם שם ספציפי
**Headers:**
```
x-user-role: user
```

**Query:**
```json
{
  "query": "What is Eden Levi's role?",
  "tenant_id": "default.local"
}
```

**תוצאה צפויה:**
- ✅ אמור להחזיר user_profile results (כי השאלה מזכירה שם ספציפי)
- ✅ ב-logs תראה: `hasSpecificUserName: true`, `matchedName: "eden"`
- ✅ ב-logs תראה: `allowUserProfiles: true`

---

### תרחיש 3: Regular User בלי שם ספציפי
**Headers:**
```
x-user-role: user
```

**Query:**
```json
{
  "query": "Show me all users",
  "tenant_id": "default.local"
}
```

**תוצאה צפויה:**
- ❌ לא אמור להחזיר user_profile results (privacy protection)
- ✅ אמור להחזיר תוצאות אחרות (documents, assessments, etc.)
- ✅ ב-logs תראה: `hasSpecificUserName: false`, `allowUserProfiles: false`
- ✅ ב-logs תראה: `privacy_protected: true`

---

### תרחיש 4: Anonymous User
**Headers:**
```
x-user-role: anonymous
```
או פשוט לא להוסיף את ה-header (ברירת מחדל)

**Query:**
```json
{
  "query": "What is Eden Levi's role?",
  "tenant_id": "default.local"
}
```

**תוצאה צפויה:**
- ✅ אמור להחזיר user_profile results (כי השאלה מזכירה שם ספציפי)
- ✅ ב-logs תראה: `finalRole: "anonymous"`, `hasSpecificUserName: true`

---

## 📊 מה לבדוק ב-Logs

כשתשלח query, תראה ב-console logs:

### 1. BEFORE RBAC Filtering:
```
🔍 BEFORE RBAC Filtering: {
  query: "What is Eden Levi's role?",
  totalResults: 9,
  userProfileCount: 3,
  resultTypes: ['user_profile', 'document', 'assessment']
}
```

### 2. User Context:
```
👤 User Context: {
  user_id: "test-user-123",
  userRoleFromProfile: null,
  userRoleFromContext: null,
  finalRole: "admin",  // או "user" או "anonymous"
  isAdmin: true,       // או false
  hasSpecificUserName: true,
  matchedName: "eden",
  ...
}
```

### 3. RBAC Decision:
```
✅ Admin user - allowing all user_profile results
```
או
```
✅ Query mentions specific user (eden) - allowing user_profile results
```
או
```
❌ Non-admin, no specific user mentioned - blocking user_profile results
```

### 4. AFTER RBAC Filtering:
```
🔍 AFTER RBAC Filtering: {
  originalCount: 9,
  filteredCount: 9,  // או פחות אם נחסמו
  removedCount: 0,
  allowUserProfiles: true
}
```

### 5. Warning (אם כל התוצאות נחסמו):
```
⚠️ WARNING: RBAC filtered out ALL results! {
  hadResults: 9,
  hadUserProfiles: 3,
  allowUserProfiles: false,
  userRole: "user",
  ...
}
```

## 🔍 דוגמאות Queries לבדיקה

### Queries עם שמות ספציפיים (אמורים לעבוד):
- `"What is Eden Levi's role?"`
- `"Who is Adi Cohen?"`
- `"מה התפקיד של עדן לוי?"` (Hebrew)
- `"Tell me about Noa Bar"`

### Queries בלי שמות ספציפיים (user profiles ייחסמו):
- `"Show me all users"`
- `"List all managers"`
- `"What are the user roles?"`
- `"Who works in engineering?"`

## 📝 הערות חשובות

1. **Header Name**: חשוב שהשם יהיה בדיוק `x-user-role` (עם x קטן)
2. **Case Sensitive**: הערכים הם case-sensitive:
   - ✅ `admin` - נכון
   - ❌ `Admin` - לא יעבוד
   - ❌ `ADMIN` - לא יעבוד

3. **Priority**: ה-role נקבע לפי סדר עדיפות:
   - `userProfile?.role` (מהמסד נתונים)
   - `context?.role` (מה-request body)
   - `x-user-role` header
   - `anonymous` (ברירת מחדל)

4. **Hebrew Names**: המערכת מזהה גם שמות בעברית:
   - `עדן`, `לוי`, `עדי`, `כהן`, `נועה`, `בר`

## 🐛 Troubleshooting

### בעיה: כל התוצאות נחסמות
**פתרון:**
1. בדוק שה-header `x-user-role` מוגדר נכון
2. בדוק ב-logs מה ה-`finalRole`
3. בדוק אם `hasSpecificUserName: true` (אם השאלה מזכירה שם)

### בעיה: Admin לא מקבל גישה
**פתרון:**
1. בדוק שה-header הוא בדיוק `x-user-role: admin`
2. בדוק ב-logs אם `isAdmin: true`
3. אם לא, בדוק אם יש role אחר שמחליף (למשל מ-userProfile)

### בעיה: Query עם שם לא עובד
**פתרון:**
1. בדוק ב-logs מה ה-`matchedName`
2. בדוק אם השם נמצא ב-`specificUserNamePatterns`
3. נסה עם שם אחר מהרשימה: `eden`, `levi`, `adi`, `cohen`, `noa`, `bar`

---

**סיכום**: ה-header `x-user-role` מוגדר בטאב **Headers** ב-Postman, והערך שלו קובע את ההרשאות של המשתמש.

