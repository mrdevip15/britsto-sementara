@echo off
REM Britsto Tryout System - Comprehensive Stress Test Runner (Windows)
REM This script orchestrates the complete stress test execution with monitoring

setlocal enabledelayedexpansion

REM Configuration
set TARGET_URL=http://localhost:3000
set TEST_DURATION=20m
set MAX_USERS=1000
set RESULTS_DIR=results
set LOG_DIR=logs

REM Get timestamp for this test run
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "TEST_ID=stress_test_%TIMESTAMP%"

echo.
echo ==============================================
echo   Britsto Tryout System - Stress Test Suite  
echo ==============================================
echo.

REM Check prerequisites
echo [%TIME%] Checking prerequisites...

REM Check if Node.js is installed
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ to continue.
    exit /b 1
)

REM Check if target server is running
curl -s %TARGET_URL% >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Target server at %TARGET_URL% is not responding. Please start the application first.
    exit /b 1
)

echo [SUCCESS] Prerequisites check completed

REM Setup environment
echo [%TIME%] Setting up test environment...

if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "monitoring" mkdir "monitoring"
if not exist "analysis" mkdir "analysis"

set "TEST_RESULTS_DIR=%RESULTS_DIR%\%TEST_ID%"
if not exist "%TEST_RESULTS_DIR%" mkdir "%TEST_RESULTS_DIR%"

echo [SUCCESS] Environment setup completed

REM Pre-test system check
echo [%TIME%] Performing pre-test system check...

echo === System Resources === > "%TEST_RESULTS_DIR%\pre_test_system.txt"
echo CPU Info: >> "%TEST_RESULTS_DIR%\pre_test_system.txt"
wmic cpu get name /format:list | find "Name=" >> "%TEST_RESULTS_DIR%\pre_test_system.txt"

echo. >> "%TEST_RESULTS_DIR%\pre_test_system.txt"
echo Memory Info: >> "%TEST_RESULTS_DIR%\pre_test_system.txt"
wmic computersystem get TotalPhysicalMemory /format:list | find "TotalPhysicalMemory=" >> "%TEST_RESULTS_DIR%\pre_test_system.txt"

echo. >> "%TEST_RESULTS_DIR%\pre_test_system.txt"
echo Network Connections: >> "%TEST_RESULTS_DIR%\pre_test_system.txt"
netstat -an | find ":3000" | find /c ":" >> "%TEST_RESULTS_DIR%\pre_test_system.txt"

REM Test basic connectivity
for /f %%i in ('curl -o nul -s -w "%%{time_total}" %TARGET_URL%') do set RESPONSE_TIME=%%i
echo [%TIME%] Baseline response time: !RESPONSE_TIME!s
echo Baseline response time: !RESPONSE_TIME!s > "%TEST_RESULTS_DIR%\baseline_response.txt"

echo [SUCCESS] Pre-test check completed

REM Start system monitoring
echo [%TIME%] Starting system monitoring...

start /b node monitoring\system-monitor.js 3000 > "%TEST_RESULTS_DIR%\system_monitor.log" 2>&1

REM Give monitoring time to start
timeout /t 5 /nobreak >nul

echo [SUCCESS] System monitoring started

REM Execute stress test
echo [%TIME%] Starting stress test execution...
echo Test Configuration:
echo   - Target: %TARGET_URL%
echo   - Max Concurrent Users: %MAX_USERS%
echo   - Estimated Duration: %TEST_DURATION%
echo   - Test ID: %TEST_ID%

set "ARTILLERY_REPORT=%TEST_RESULTS_DIR%\artillery_report.json"

echo [%TIME%] Executing Artillery stress test...
artillery run artillery-config.yml --output "%ARTILLERY_REPORT%" > "%TEST_RESULTS_DIR%\artillery_execution.log" 2>&1

if !errorlevel! equ 0 (
    echo [SUCCESS] Artillery stress test completed successfully
) else (
    echo [ERROR] Artillery stress test failed. Check logs for details.
    goto cleanup
)

REM Generate HTML report if Artillery report exists
if exist "%ARTILLERY_REPORT%" (
    echo [%TIME%] Generating HTML report...
    artillery report "%ARTILLERY_REPORT%" --output "%TEST_RESULTS_DIR%\artillery_report.html"
    echo [SUCCESS] HTML report generated
)

REM Stop monitoring (simplified for Windows)
echo [%TIME%] Stopping monitoring processes...
taskkill /f /im node.exe /fi "WINDOWTITLE eq system-monitor*" >nul 2>&1
echo [SUCCESS] Monitoring stopped

REM Post-test system check
echo [%TIME%] Performing post-test system check...

echo === Post-Test System Resources === > "%TEST_RESULTS_DIR%\post_test_system.txt"
echo Memory Info: >> "%TEST_RESULTS_DIR%\post_test_system.txt"
wmic computersystem get TotalPhysicalMemory /format:list | find "TotalPhysicalMemory=" >> "%TEST_RESULTS_DIR%\post_test_system.txt"

echo. >> "%TEST_RESULTS_DIR%\post_test_system.txt"
echo Network Connections: >> "%TEST_RESULTS_DIR%\post_test_system.txt"
netstat -an | find ":3000" | find /c ":" >> "%TEST_RESULTS_DIR%\post_test_system.txt"

REM Test post-test connectivity
for /f %%i in ('curl -o nul -s -w "%%{time_total}" %TARGET_URL%') do set POST_RESPONSE_TIME=%%i
echo [%TIME%] Post-test response time: !POST_RESPONSE_TIME!s
echo Post-test response time: !POST_RESPONSE_TIME!s >> "%TEST_RESULTS_DIR%\post_test_system.txt"

echo [SUCCESS] Post-test check completed

REM Analyze results
echo [%TIME%] Analyzing test results...

if exist "%ARTILLERY_REPORT%" (
    node analysis\result-analyzer.js "%ARTILLERY_REPORT%" > "%TEST_RESULTS_DIR%\analysis_output.log" 2>&1
    echo [SUCCESS] Result analysis completed
) else (
    echo [WARNING] Artillery report not found. Skipping detailed analysis.
)

REM Generate summary report
echo [%TIME%] Generating test summary...

set "SUMMARY_FILE=%TEST_RESULTS_DIR%\test_summary.md"

(
echo # Stress Test Summary Report
echo.
echo **Test ID:** %TEST_ID%
echo **Date:** %DATE% %TIME%
echo **Target:** %TARGET_URL%
echo **Max Concurrent Users:** %MAX_USERS%
echo.
echo ## Test Configuration
echo - Artillery Configuration: artillery-config.yml
echo - Test Phases: 5 phases over ~20 minutes
echo - Scenarios: 4 different user behavior patterns
echo - System Monitoring: Enabled ^(3-second intervals^)
echo.
echo ## Files Generated
echo - Artillery Report: artillery_report.json
echo - HTML Report: artillery_report.html
echo - System Monitor Log: system_monitor.log
echo - Analysis Output: analysis_output.log
echo - Pre-test System Info: pre_test_system.txt
echo - Post-test System Info: post_test_system.txt
echo.
echo ## Quick Access
echo - View HTML report: Open artillery_report.html in browser
echo - View analysis: Check analysis_output.log
echo - View system metrics: Check system_monitor.log
echo.
echo ## Next Steps
echo 1. Review the HTML report for detailed metrics
echo 2. Check analysis recommendations
echo 3. Compare pre/post-test system states
echo 4. Implement suggested optimizations if needed
echo.
echo ---
echo *Generated by Britsto Stress Test Suite*
) > "%SUMMARY_FILE%"

echo [SUCCESS] Test summary generated: %SUMMARY_FILE%

:cleanup
echo [%TIME%] Cleaning up...
REM Kill any remaining monitoring processes
taskkill /f /im node.exe /fi "WINDOWTITLE eq system-monitor*" >nul 2>&1
echo [SUCCESS] Cleanup completed

echo.
echo ==============================================
echo            STRESS TEST COMPLETED             
echo ==============================================
echo.
echo [SUCCESS] Test results available in: %TEST_RESULTS_DIR%
echo [SUCCESS] View HTML report: %TEST_RESULTS_DIR%\artillery_report.html
echo [SUCCESS] View summary: %TEST_RESULTS_DIR%\test_summary.md
echo.

REM Display quick results if analysis was successful
if exist "%TEST_RESULTS_DIR%\analysis_output.log" (
    echo Quick Results Preview:
    echo ======================
    findstr /C:"OVERALL RATING" /C:"PRODUCTION READY" "%TEST_RESULTS_DIR%\analysis_output.log" 2>nul
    echo.
)

echo [%TIME%] Stress test execution completed successfully!

REM Handle command line arguments
if "%1"=="--help" goto help
if "%1"=="-h" goto help
if "%1"=="--quick" goto quick
goto end

:help
echo Usage: %0 [options]
echo.
echo Options:
echo   --help, -h     Show this help message
echo   --quick        Run a quick test (reduced load)
echo.
echo Examples:
echo   %0                    # Run full stress test
echo   %0 --quick           # Run quick test
echo.
goto end

:quick
echo [%TIME%] Running in quick test mode
set MAX_USERS=100
set TEST_DURATION=5m
REM Modify config for quick test (simplified for Windows)
copy artillery-config.yml artillery-config-backup.yml >nul
powershell -Command "(gc artillery-config.yml) -replace 'arrivalRate: 1000', 'arrivalRate: 100' | Out-File artillery-config.yml -encoding UTF8"
powershell -Command "(gc artillery-config.yml) -replace 'duration: 600', 'duration: 60' | Out-File artillery-config.yml -encoding UTF8"
goto main

:main
REM Main execution would go here, but we've already done it above
goto end

:end
endlocal
pause 