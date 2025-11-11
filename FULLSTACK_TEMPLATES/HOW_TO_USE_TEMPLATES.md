How to Use the Templates
========================

1) Start at Stage_01
--------------------
- Open `Stage_01_Requirements_and_Planning/REQUIREMENTS_TEMPLATE.prompt`.
- The prompt will scan context (`ROADMAP.md`, `PROJECT_EVOLUTION_LOG.md`, etc.) and ask targeted questions.
- Iterate until the checklist passes. Save sessions in `SESSION_LOGS/`.

2) Unlocking Rules
------------------
- A stage unlocks only when its `CHECKLIST.md` is completed and an approval decision is recorded in `PROJECT_EVOLUTION_LOG.md`.
- Do not skip or overwrite stages without explicit user approval.

3) Decision Dialogues
---------------------
- Stage_01 and Stage_02 run multi-role pseudo-code dialogues stored under their `DIALOGUES/` folders.
- Each transcript must include participants, timestamp, topic, and decision summary.

4) TDD and Code Review Discipline
---------------------------------
- Write tests first (≥80% coverage before merge).
- Require at least two reviewers per PR.
- CI/CD runs lint → build → test → deploy and rolls back on smoke test failure.

5) Traceability
---------------
- Log every material change in `PROJECT_EVOLUTION_LOG.md`.
- Keep `ROADMAP.md`, `FEATURES_REGISTRY.md`, and `GLOBAL_LOG.md` aligned.

6) Dynamic API Spec
-------------------
- Generate `Stage_02_System_and_Architecture/ENDPOINTS_SPEC.md` from user stories using placeholders like `{{API_URL}}` and `{{ENV_TOKEN}}`.

7) Recovery & Non-Destructive Evolution
---------------------------------------
- Use `RECOVERY_POINTS/` for snapshots and rollbacks per stage if needed.


