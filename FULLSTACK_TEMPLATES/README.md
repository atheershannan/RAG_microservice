Full-Stack Template System
==========================

Purpose
-------
This repository provides a reusable, intelligent full-stack project template system that enforces structure, modularity, TDD, CI/CD automation, and adaptive, context-aware dialogue flows to guide teams from idea → architecture → implementation → deployment.

How It Works
------------
- Nine progressive stages (`Stage_01` → `Stage_09`) with explicit input → process → output.
- Adaptive dialogue prompts per stage that ask only the necessary questions based on current project context.
- Pseudo-code dialogues at decision gates in early stages for cross-role validation.
- TDD-first discipline and code review enforcement with CI/CD.
- Deterministic logging and traceability via `PROJECT_EVOLUTION_LOG.md` and global logs.

Key Rules
---------
- Stages unlock only after prior stage validation.
- Cursor must not overwrite or skip stages without explicit approval.
- All decisions and outcomes are logged for reproducibility.

See `HOW_TO_USE_TEMPLATES.md` to begin.


