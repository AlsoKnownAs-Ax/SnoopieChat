@echo off
cd /d %~dp0

echo Cleaning previous SDK files...
if exist ..\frontend\src\lib\api rmdir /s /q ..\frontend\src\lib\api

echo Generating Axios-based TypeScript SDK from backend...

cd ../frontend
npm run generate:sdk
pause
