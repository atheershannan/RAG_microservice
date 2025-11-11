# Stage 01 - Requirements & Planning Session
**Date:** 2025-01-27  
**Project:** EDUCORE - Contextual Assistant (RAG / Knowledge Graph) Microservice

## Project Context

### Overview
המטרה היא לפתח MICROSERVICE RAG שהוא חלק ממערכת EDUCORE - מערכת למידה ארגונית מונעת AI.

### EDUCORE Ecosystem Context
EDUCORE הוא מערכת מורכבת של 10 מיקרו-שירותים מקושרים:
1. Directory (Organizations, Trainers & Profiles)
2. Course Builder – Modular Program Construction
3. Content Studio – Lesson Authoring
4. Assessment – Testing & Exams
5. Skills Engine – Competencies & Matrices
6. Learner AI – Personalized Learning
7. Learning Analytics – Progress & Effectiveness
8. HR & Management Reporting
9. DevLab – Practical Exercises & Auto-Grading
10. **Contextual Assistant – RAG / Knowledge Graph** ← הפרויקט הנוכחי

### RAG Microservice Purpose
לשמש כשכבת האינטליגנציה הקונטקסטואלית המרכזית של EDUCORE:
- **AI Role:** שימוש ב-RAG (Retrieval-Augmented Generation) ו-Knowledge Graph reasoning לחיבור תובנות בין כל השירותים
- **Features:**
  - Unified knowledge graph integrating all microservices
  - Contextual support for Assessment and DevLab
  - Explanations and direct report links for Learning Analytics and HR Reporting
  - Retrieval of textual and media-linked content from Content Studio for contextual answers

## Adaptive Questions - Stage 01 - ANSWERS

### 1. Target Users
**תשובה:** ה-RAG משרת גם **משתמשים פנימיים** (המיקרו-שירותים האחרים במערכת EDUCORE) וגם **משתמשי קצה**.
- המיקרו-שירותים צורכים את ה-API שלו לצורך שאילתות קונטקסטואליות
- משתמשי קצה (לומדים, מדריכים, HR ומנהלים) ניגשים אליו דרך ה-chatbot המוטמע בממשקי המיקרו-שירותים

### 2. User Personas
**תשובה:**
- **API Consumers** – יתר המיקרו-שירותים (Assessment, DevLab, Learning Analytics וכו')
- **Learners** – משתמשים בלמידה לקבלת תשובות, הסברים והכוונה
- **Trainers** – משתמשים לאיתור תוכן רלוונטי והמלצות למיומנויות
- **HR / Managers** – מקבלים הסברים ודוחות ניהוליים דרך ה-RAG
- **System Administrators** – מנטרים, בודקים לוגים ומנהלים הרשאות

### 3. Primary Jobs-to-be-Done
**תשובה:**
- ביצוע שאילתות קונטקסטואליות על תוכן הלמידה
- קבלת הסברים והפניות לדוחות אנליטיים
- קבלת תמיכה בזמן אמת במבחנים ותרגולים
- ניווט בין דוחות, תובנות ו-insights ארגוניים
- הפקת תקצירים, המלצות וציטוטים ממקורות רלוונטיים
- **Personalized Assistance:** התאמה אישית של תשובות לפי role, profile, skill gaps, ו-learning progress
- **Access Control:** אכיפת RBAC, ABAC, ו-fine-grained permissions

### 4. Performance Requirements
**תשובה:**
- **Response Time:** ≤ 3 שניות ל-90% מהשאילתות
- **Throughput:** תמיכה בעד ~200 שאילתות לשנייה (QPS)
- **Scale:** ~100,000 משתמשים פעילים, ~10 מיליון vectors
- **Data Freshness:** 95% מהעדכונים מתעדכנים תוך ≤ 5 דקות

### 5. Compliance & Security
**תשובה:**
- **GDPR:** עמידה מלאה (איסוף בהסכמה + מחיקת מידע על פי בקשה)
- **Multi-Tenancy:** הפרדת דיירים ושמירה על פרטיות שדות
- **Authentication:** OAuth2 / JWT ל-UI, mTLS ל-gRPC
- **Audit Trail:** ניהול בלתי ניתן לשינוי ושמירת Provenance ל-7 שנים
- **Access Control:**
  - **RBAC (Role-Based Access Control):** learner, trainer, HR, admin
  - **ABAC (Attribute-Based Access Control):** department, region, compliance flags
  - **Fine-grained Content Permissions:** allow/restrict access to specific lessons, assessments, documents
  - **Field-level Masking:** learners see own scores, managers see aggregated (not individual) performance
  - **Permissions in Responses:** כל תשובת chatbot חייבת לכבד permissions
  - **Audit Logs:** כל אינטראקציה נרשמת ל-compliance ו-governance

### 6. Integration Requirements
**תשובה:**
- **Protocol:** gRPC עם יתר המיקרו-שירותים
- **External APIs:** REST APIs מול שירותי AI חיצוניים (OpenAI וכו')
- **Real-time:** Kafka לאירועים בזמן אמת (עדכון ≤ 5 דקות)
- **Storage:** Redis ל-caching, PostgreSQL + PGVector לאחסון ארוך טווח
- **Contracts:** חוזי API מוגדרים ב-Protobuf לכל שירות פנימי

### 7. Constraints
**תשובה:**
- **Budget:** בתוך משאבי Railway + Vercel הקיימים
- **Timeline:** MVP תוך 8 שבועות
- **Tech Stack:** Node.js + JavaScript + PostgreSQL + gRPC
- **Infrastructure:** Multi-Tenant עם scaling אוטומטי ב-Railway

### 8. Risks
**תשובה:**
- **Complexity:** מורכבות גבוהה בניהול Knowledge Graph וסנכרון גרסאות
- **Rate Limits:** מגבלות API Rate Limit בשירותי OpenAI
- **Auth Issues:** בעיות Auth בין שירותים ב-Multi-Tenancy
- **Dependencies:** תלות בשינויים ב-gRPC Contracts של מיקרו-שירותים אחרים

### 9. Success Metrics (KPIs / OKRs)
**תשובה:**
- **Answer Accuracy:** ≥ 85%
- **Response Time:** ≤ 3 שניות
- **Data Freshness:** ≤ 5 דקות מרגע עדכון מקור
- **Adoption Rate:** ≥ 70% משתמשים פעילים ב-chatbot
- **Integration Reliability:** ≥ 99.5% הצלחת קריאות gRPC
- **User Satisfaction:** ≥ 4.5 / 5 בדירוגי פידבק

## Additional Requirements (Added 2025-01-27)

### Personalized Assistance Requirements
- **Adapt responses based on:**
  - User role (learner, trainer, HR, admin)
  - User profile (skills, experience, preferences)
  - Skill gaps (from Skills Engine)
  - Learning progress (from Learner AI, Assessment, DevLab)
- **Suggest personalized content:**
  - Courses tailored to skill gaps
  - Exercises based on learning progress
  - Assessments aligned with competency level
  - Mentors matched to learning goals
- **Real-time data integration:**
  - Learner AI: learning patterns and preferences
  - Skills Engine: current competencies and gaps
  - Assessment: performance history
  - DevLab: practice progress and challenges

### Access Control Requirements
- **RBAC (Role-Based Access Control):**
  - Learner: access to own progress, courses, assessments
  - Trainer: access to assigned courses and learner progress
  - HR: access to aggregated organizational data
  - Admin: full system access
- **ABAC (Attribute-Based Access Control):**
  - Department-based restrictions
  - Region-based restrictions
  - Compliance flags (e.g., GDPR, HIPAA)
- **Fine-grained Content Permissions:**
  - Content-level: specific lessons, assessments, documents
  - Permission propagation to chatbot responses
- **Field-level Masking:**
  - Learners: see own scores only
  - Managers: see aggregated performance, not individual details
  - Field-level permissions enforced in all responses
- **Audit & Compliance:**
  - All interactions logged for compliance
  - Governance tracking of access patterns
  - Permission changes tracked in audit trail

## Next Steps
- ✅ מענה על השאלות האדפטיביות
- ✅ יצירת User Stories מפורטים (כולל Personalized Assistance ו-Access Control)
- ✅ הגדרת Constraints ו-Metrics
- ✅ השלמת Stage 01 Checklist

