# Britsto Tryout System - Stress Test Guide

## 🚀 Complete Stress Test for 1000 Concurrent Users

This comprehensive stress testing suite is designed to simulate 1000 concurrent users accessing the Britsto tryout system, helping identify performance bottlenecks and ensure system reliability under high load.

## 📁 What's Been Created

### Core Test Files
- **`stress-test/artillery-config.yml`** - Main Artillery configuration with 5 test phases
- **`stress-test/processor.js`** - Dynamic data generation for realistic test scenarios
- **`stress-test/package.json`** - Dependencies and npm scripts
- **`stress-test/run-stress-test.sh`** - Linux/Mac test execution script
- **`stress-test/run-stress-test.bat`** - Windows test execution script

### Monitoring & Analysis
- **`stress-test/monitoring/system-monitor.js`** - Real-time system performance monitoring
- **`stress-test/analysis/result-analyzer.js`** - Comprehensive test result analysis
- **`stress-test/database-optimization-guide.md`** - Database optimization recommendations
- **`stress-test/README.md`** - Detailed usage instructions

## 🎯 Test Scenarios Overview

The stress test simulates 4 realistic user behavior patterns:

### 1. User Login and Dashboard Access (40% of traffic)
- User authentication flow
- Session management testing
- Dashboard loading performance

### 2. Complete Tryout Exam Flow (35% of traffic)
- Full exam experience from start to finish
- Question loading and navigation
- Answer submission and exam completion

### 3. Intensive Answer Saving (20% of traffic)
- High-frequency answer submissions
- Database write performance testing
- Concurrent user answer conflicts

### 4. Static Resources Loading (5% of traffic)
- CSS, JavaScript, and image loading
- CDN performance validation

## 📈 Test Phases

The stress test runs through 5 carefully designed phases over ~20 minutes:

1. **Warm-up** (60s): 10 → 50 users/second
2. **Ramp-up** (120s): 50 → 200 users/second  
3. **Peak Load** (300s): 200 → 1000 users/second
4. **Sustained Load** (600s): 1000 users/second
5. **Cool-down** (120s): 1000 → 100 users/second

## 🛠️ Quick Setup & Execution

### Prerequisites
- Node.js 16+ installed
- Britsto application running on `http://localhost:3000`
- At least 8GB RAM recommended
- Administrative privileges for system monitoring

### Step 1: Navigate to Stress Test Directory
```bash
cd stress-test
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Test

#### Option A: Full Automated Test (Recommended)
**Linux/Mac:**
```bash
./run-stress-test.sh
```

**Windows:**
```cmd
run-stress-test.bat
```

#### Option B: Manual Execution
```bash
# Run test with report generation
npm run test-report

# Run system monitoring (separate terminal)
npm run monitor-system

# Analyze results
npm run analyze-results results/stress-test-report.json
```

#### Option C: Quick Test (Reduced Load)
```bash
# Linux/Mac
./run-stress-test.sh --quick

# Windows - modify the batch file or run:
npm run test-quick
```

## 📊 What Gets Tested

### Critical System Components
- **Authentication System**: Login, session management, token validation
- **Database Performance**: Connection pooling, query optimization, concurrent writes
- **Answer Saving**: High-frequency database writes with conflict resolution
- **Exam Loading**: Question retrieval and content delivery
- **Session Management**: User state tracking and session persistence
- **Static Resources**: CSS, JavaScript, and asset delivery

### Key Metrics Monitored
- **Response Times**: P50, P95, P99 percentiles
- **Throughput**: Requests per second
- **Error Rates**: Failed requests and HTTP status codes
- **System Resources**: CPU, Memory, Network, Disk I/O
- **Database Performance**: Connection pool usage, query times
- **Concurrent Users**: Active session management

## 📋 Performance Thresholds

### Response Time Ratings
- 🟢 **Excellent**: < 200ms (P95)
- 🟡 **Good**: < 500ms (P95)
- 🟠 **Acceptable**: < 1000ms (P95)
- 🔴 **Poor**: < 2000ms (P95)
- ⚫ **Unacceptable**: ≥ 2000ms (P95)

### Error Rate Thresholds
- 🟢 **Excellent**: < 0.1%
- 🟡 **Good**: < 1%
- 🟠 **Acceptable**: < 5%
- 🔴 **Poor**: < 10%
- ⚫ **Unacceptable**: ≥ 10%

### Throughput Targets
- **Minimum**: 100 requests/second
- **Target**: 500 requests/second
- **Excellent**: 1000+ requests/second

## 📈 Understanding the Results

### Generated Reports
After test completion, you'll find these files in `results/stress_test_[timestamp]/`:

- **`artillery_report.html`** - Visual charts and detailed metrics
- **`artillery_report.json`** - Raw test data for further analysis
- **`analysis_output.log`** - Automated analysis with recommendations
- **`system_monitor.log`** - Real-time system performance data
- **`test_summary.md`** - Executive summary and next steps

### Key Metrics to Focus On
1. **Overall Rating** - Production readiness assessment
2. **P95 Response Time** - 95% of requests completed within this time
3. **Error Rate** - Percentage of failed requests
4. **Throughput** - Requests handled per second
5. **System Resource Usage** - CPU, Memory, Network utilization

## 🔧 Database Optimization

The stress test will likely reveal database bottlenecks. Key optimizations include:

### Critical Indexes
```sql
-- User authentication
CREATE INDEX CONCURRENTLY idx_users_email_active ON "Users" (email) WHERE "deletedAt" IS NULL;

-- Session management
CREATE INDEX CONCURRENTLY idx_sessions_sid ON "Sessions" (sid);

-- Exam data retrieval
CREATE INDEX CONCURRENTLY idx_mapel_kodekategori_active ON "Mapels" (kodekategori) WHERE "deletedAt" IS NULL;

-- Answer storage optimization
CREATE INDEX CONCURRENTLY idx_user_answers_user_exam ON user_answers (user_id, kodekategori);
```

### Connection Pool Configuration
```javascript
// config/sequelize.js
const sequelize = new Sequelize(database, username, password, {
  pool: {
    max: 50,        // Increased from default 5
    min: 10,        // Keep warm connections
    acquire: 60000, // 60 seconds max wait
    idle: 30000,    // 30 seconds idle timeout
  }
});
```

### Redis Session Store
Replace database sessions with Redis for better performance:
```bash
npm install connect-redis redis
```

## 🚨 Common Issues & Solutions

### High Error Rates (>5%)
- **Cause**: Database connection limits, session store capacity
- **Solution**: Increase connection pool, implement Redis sessions
- **Check**: Application logs, database connection counts

### Poor Response Times (>1000ms P95)
- **Cause**: Unoptimized queries, missing indexes, memory issues
- **Solution**: Add database indexes, optimize queries, increase server resources
- **Check**: Database slow query log, system resource usage

### System Resource Exhaustion
- **Cause**: Memory leaks, insufficient server capacity
- **Solution**: Optimize code, scale horizontally, increase server specs
- **Check**: Memory usage patterns, CPU utilization

## 📊 Expected Results for Well-Optimized System

### Excellent Performance Targets
- **P95 Response Time**: < 500ms
- **Error Rate**: < 1%
- **Throughput**: > 500 req/s
- **Success Rate**: > 99%
- **CPU Usage**: < 80%
- **Memory Usage**: < 80%

## 🔄 Continuous Testing

### Integration with CI/CD
```bash
# Add to your deployment pipeline
cd stress-test
npm install
npm run test-report

# Check if results meet thresholds
node analysis/result-analyzer.js results/stress-test-report.json
```

### Regular Testing Schedule
- **Daily**: Quick smoke tests (100 concurrent users)
- **Weekly**: Full stress tests (1000 concurrent users)
- **Pre-deployment**: Comprehensive performance validation
- **Post-deployment**: Production readiness verification

## 📞 Support & Troubleshooting

### Log Files to Check
- `results/[test_id]/artillery_execution.log` - Test execution details
- `results/[test_id]/system_monitor.log` - System performance data
- `results/[test_id]/analysis_output.log` - Automated analysis results
- Application logs - Server-side errors and performance issues

### Performance Monitoring Queries
```sql
-- Check active database connections
SELECT count(*) as total_connections,
       count(*) FILTER (WHERE state = 'active') as active_connections
FROM pg_stat_activity;

-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

## 🎯 Next Steps After Testing

1. **Review Results**: Analyze all generated reports
2. **Implement Optimizations**: Follow database and application recommendations
3. **Re-test**: Validate improvements with follow-up tests
4. **Monitor Production**: Set up ongoing performance monitoring
5. **Document Findings**: Share results with development team
6. **Plan Scaling**: Prepare infrastructure scaling strategy

## 📋 Pre-Production Checklist

- [ ] Stress test passes with acceptable ratings
- [ ] Database optimizations implemented
- [ ] Connection pooling configured
- [ ] Session management optimized
- [ ] Error handling verified
- [ ] Monitoring systems in place
- [ ] Scaling strategy defined
- [ ] Performance benchmarks documented

---

**Remember**: This stress test is designed for development and staging environments. Always ensure you have proper authorization before running stress tests against any system.

For detailed technical documentation, see the individual files in the `stress-test/` directory. 