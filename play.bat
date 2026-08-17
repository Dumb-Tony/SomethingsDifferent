@echo off
title Something's Different
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\serve.ps1"
