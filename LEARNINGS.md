# ReviewPilot Learnings & Known Issues
<<<<<<< HEAD
=======

## Network Issue (2026-05-30)
- Stuck at 18/100 — PHASE 4: TESTING & PERFORMANCE
- CommandCode keeps failing with "Network connection lost" -> exit code 1
- Session #3 (20:44) and #4 (20:57) both failed with same error
- Session #4 ran 19 min at 0% CPU before hanging
- Root cause: transient network error in CommandCode, not project bug
- STATUS: Not blocking — network is intermittent per studiopilot recovery
- 26 consecutive "no progress" entries as of 21:15
>>>>>>> origin/main
