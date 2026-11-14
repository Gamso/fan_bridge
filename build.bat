@echo off
echo Building the FanBridge card...
call npm install || exit /b 1
call npm run build || exit /b 1
echo.
echo Done: custom_components\fan_bridge\www\fan-bridge-card.js is up to date.
echo The integration serves it by itself: restart Home Assistant to load it.
pause
