#!/bin/bash

# Britsto Tryout System - Comprehensive Stress Test Runner
# This script orchestrates the complete stress test execution with monitoring

set -e  # Exit on any error

# Configuration
TARGET_URL="http://localhost:3000"
TEST_DURATION="20m"
MAX_USERS=1000
RESULTS_DIR="results"
LOG_DIR="logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 16+ to continue."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        error "Node.js version 16+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check if Artillery is installed
    if ! command -v artillery &> /dev/null && ! npm list artillery &> /dev/null; then
        error "Artillery is not installed. Installing..."
        npm install
    fi
    
    # Check if target server is running
    if ! curl -s "$TARGET_URL" > /dev/null; then
        error "Target server at $TARGET_URL is not responding. Please start the application first."
        exit 1
    fi
    
    # Check system resources
    AVAILABLE_RAM=$(free -m | awk 'NR==2{print $7}')
    if [ "$AVAILABLE_RAM" -lt 4096 ]; then
        warning "Available RAM is less than 4GB. This may affect test performance."
    fi
    
    success "Prerequisites check completed"
}

# Setup directories and files
setup_environment() {
    log "Setting up test environment..."
    
    # Create necessary directories
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "monitoring"
    mkdir -p "analysis"
    
    # Set timestamp for this test run
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    TEST_ID="stress_test_${TIMESTAMP}"
    
    # Create test-specific directories
    TEST_RESULTS_DIR="$RESULTS_DIR/$TEST_ID"
    mkdir -p "$TEST_RESULTS_DIR"
    
    success "Environment setup completed"
}

# Pre-test system check
pre_test_check() {
    log "Performing pre-test system check..."
    
    # Check system resources
    echo "=== System Resources ===" > "$TEST_RESULTS_DIR/pre_test_system.txt"
    echo "CPU Info:" >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    lscpu | grep -E 'CPU\(s\)|Model name' >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    
    echo -e "\nMemory Info:" >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    free -h >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    
    echo -e "\nDisk Space:" >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    df -h >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    
    echo -e "\nNetwork Connections:" >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    netstat -an | grep :3000 | wc -l >> "$TEST_RESULTS_DIR/pre_test_system.txt"
    
    # Test basic connectivity
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$TARGET_URL")
    log "Baseline response time: ${RESPONSE_TIME}s"
    echo "Baseline response time: ${RESPONSE_TIME}s" > "$TEST_RESULTS_DIR/baseline_response.txt"
    
    success "Pre-test check completed"
}

# Start system monitoring
start_monitoring() {
    log "Starting system monitoring..."
    
    # Start system monitor in background
    node monitoring/system-monitor.js 3000 > "$TEST_RESULTS_DIR/system_monitor.log" 2>&1 &
    MONITOR_PID=$!
    echo $MONITOR_PID > "$TEST_RESULTS_DIR/monitor.pid"
    
    # Start application log monitoring if possible
    if [ -f "app.log" ]; then
        tail -f app.log > "$TEST_RESULTS_DIR/app_monitor.log" &
        APP_LOG_PID=$!
        echo $APP_LOG_PID > "$TEST_RESULTS_DIR/app_log.pid"
    fi
    
    # Give monitoring time to start
    sleep 5
    
    success "System monitoring started (PID: $MONITOR_PID)"
}

# Execute the stress test
run_stress_test() {
    log "Starting stress test execution..."
    log "Test Configuration:"
    log "  - Target: $TARGET_URL"
    log "  - Max Concurrent Users: $MAX_USERS"
    log "  - Estimated Duration: $TEST_DURATION"
    log "  - Test ID: $TEST_ID"
    
    # Run Artillery stress test
    ARTILLERY_REPORT="$TEST_RESULTS_DIR/artillery_report.json"
    
    log "Executing Artillery stress test..."
    if artillery run artillery-config.yml --output "$ARTILLERY_REPORT" 2>&1 | tee "$TEST_RESULTS_DIR/artillery_execution.log"; then
        success "Artillery stress test completed successfully"
    else
        error "Artillery stress test failed. Check logs for details."
        cleanup
        exit 1
    fi
    
    # Generate HTML report if Artillery report exists
    if [ -f "$ARTILLERY_REPORT" ]; then
        log "Generating HTML report..."
        artillery report "$ARTILLERY_REPORT" --output "$TEST_RESULTS_DIR/artillery_report.html"
        success "HTML report generated"
    fi
}

# Stop monitoring processes
stop_monitoring() {
    log "Stopping monitoring processes..."
    
    # Stop system monitor
    if [ -f "$TEST_RESULTS_DIR/monitor.pid" ]; then
        MONITOR_PID=$(cat "$TEST_RESULTS_DIR/monitor.pid")
        if kill -TERM $MONITOR_PID 2>/dev/null; then
            log "System monitor stopped (PID: $MONITOR_PID)"
        fi
        rm -f "$TEST_RESULTS_DIR/monitor.pid"
    fi
    
    # Stop app log monitor
    if [ -f "$TEST_RESULTS_DIR/app_log.pid" ]; then
        APP_LOG_PID=$(cat "$TEST_RESULTS_DIR/app_log.pid")
        if kill -TERM $APP_LOG_PID 2>/dev/null; then
            log "App log monitor stopped (PID: $APP_LOG_PID)"
        fi
        rm -f "$TEST_RESULTS_DIR/app_log.pid"
    fi
    
    # Wait a moment for processes to clean up
    sleep 3
    
    success "Monitoring stopped"
}

# Analyze test results
analyze_results() {
    log "Analyzing test results..."
    
    if [ -f "$ARTILLERY_REPORT" ]; then
        # Run result analysis
        node analysis/result-analyzer.js "$ARTILLERY_REPORT" 2>&1 | tee "$TEST_RESULTS_DIR/analysis_output.log"
        
        # Copy generated analysis files to test results directory
        find results -name "analysis-*.json" -newer "$TEST_RESULTS_DIR" -exec cp {} "$TEST_RESULTS_DIR/" \;
        find results -name "report-*.md" -newer "$TEST_RESULTS_DIR" -exec cp {} "$TEST_RESULTS_DIR/" \;
        
        success "Result analysis completed"
    else
        warning "Artillery report not found. Skipping detailed analysis."
    fi
}

# Post-test system check
post_test_check() {
    log "Performing post-test system check..."
    
    echo "=== Post-Test System Resources ===" > "$TEST_RESULTS_DIR/post_test_system.txt"
    echo "Memory Info:" >> "$TEST_RESULTS_DIR/post_test_system.txt"
    free -h >> "$TEST_RESULTS_DIR/post_test_system.txt"
    
    echo -e "\nNetwork Connections:" >> "$TEST_RESULTS_DIR/post_test_system.txt"
    netstat -an | grep :3000 | wc -l >> "$TEST_RESULTS_DIR/post_test_system.txt"
    
    # Test post-test connectivity
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$TARGET_URL")
    log "Post-test response time: ${RESPONSE_TIME}s"
    echo "Post-test response time: ${RESPONSE_TIME}s" >> "$TEST_RESULTS_DIR/post_test_system.txt"
    
    success "Post-test check completed"
}

# Generate summary report
generate_summary() {
    log "Generating test summary..."
    
    SUMMARY_FILE="$TEST_RESULTS_DIR/test_summary.md"
    
    cat > "$SUMMARY_FILE" << EOF
# Stress Test Summary Report

**Test ID:** $TEST_ID  
**Date:** $(date)  
**Target:** $TARGET_URL  
**Max Concurrent Users:** $MAX_USERS  

## Test Configuration
- Artillery Configuration: artillery-config.yml
- Test Phases: 5 phases over ~20 minutes
- Scenarios: 4 different user behavior patterns
- System Monitoring: Enabled (3-second intervals)

## Files Generated
- Artillery Report: artillery_report.json
- HTML Report: artillery_report.html
- System Monitor Log: system_monitor.log
- Analysis Output: analysis_output.log
- Pre-test System Info: pre_test_system.txt
- Post-test System Info: post_test_system.txt

## Quick Access
- View HTML report: Open artillery_report.html in browser
- View analysis: Check analysis_output.log
- View system metrics: Check system_monitor.log

## Next Steps
1. Review the HTML report for detailed metrics
2. Check analysis recommendations
3. Compare pre/post-test system states
4. Implement suggested optimizations if needed

---
*Generated by Britsto Stress Test Suite*
EOF

    success "Test summary generated: $SUMMARY_FILE"
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    stop_monitoring
    
    # Remove any temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    
    success "Cleanup completed"
}

# Main execution function
main() {
    echo
    echo "=============================================="
    echo "  Britsto Tryout System - Stress Test Suite  "
    echo "=============================================="
    echo
    
    # Set up trap for cleanup on exit
    trap cleanup EXIT INT TERM
    
    # Execute test phases
    check_prerequisites
    setup_environment
    pre_test_check
    start_monitoring
    
    log "Starting stress test in 5 seconds..."
    sleep 5
    
    run_stress_test
    stop_monitoring
    post_test_check
    analyze_results
    generate_summary
    
    echo
    echo "=============================================="
    echo "           STRESS TEST COMPLETED             "
    echo "=============================================="
    echo
    success "Test results available in: $TEST_RESULTS_DIR"
    success "View HTML report: $TEST_RESULTS_DIR/artillery_report.html"
    success "View summary: $TEST_RESULTS_DIR/test_summary.md"
    echo
    
    # Display quick results if analysis was successful
    if [ -f "$TEST_RESULTS_DIR/analysis_output.log" ]; then
        echo "Quick Results Preview:"
        echo "======================"
        grep -E "(OVERALL RATING|PRODUCTION READY)" "$TEST_RESULTS_DIR/analysis_output.log" || true
        echo
    fi
    
    log "Stress test execution completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --quick        Run a quick test (reduced load)"
        echo "  --target URL   Specify target URL (default: $TARGET_URL)"
        echo
        echo "Examples:"
        echo "  $0                                    # Run full stress test"
        echo "  $0 --quick                           # Run quick test"
        echo "  $0 --target http://staging.app.com   # Test staging server"
        echo
        exit 0
        ;;
    --quick)
        log "Running in quick test mode"
        MAX_USERS=100
        TEST_DURATION="5m"
        # Use quick test configuration
        cp artillery-config.yml artillery-config-backup.yml
        sed -i 's/arrivalRate: 1000/arrivalRate: 100/g' artillery-config.yml
        sed -i 's/duration: 600/duration: 60/g' artillery-config.yml
        trap 'mv artillery-config-backup.yml artillery-config.yml' EXIT
        ;;
    --target)
        if [ -n "${2:-}" ]; then
            TARGET_URL="$2"
            log "Using target URL: $TARGET_URL"
            shift 2
        else
            error "Target URL is required with --target option"
            exit 1
        fi
        ;;
esac

# Run main function
main "$@" 