@echo off
rem One-command launcher. Usage:  run            (dev server)
rem                               run --setup    (sync DB schema + seed first)
rem                               run --prod     (production build)
cd /d "%~dp0"
node scripts\start.mjs %*
