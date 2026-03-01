@echo off
set /p msg="Enter commit message (default: Manual deployment update): "
if "%msg%"=="" set msg=Manual deployment update

echo Staging changes...
git add .

echo Committing changes...
git commit -m "%msg%"

echo Pushing to live website (GitHub main)...
git push origin main

echo Done! Vercel and Render will now start the deployment.
pause
