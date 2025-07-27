# Britsto Tryout System - Stress Test Suite

A comprehensive stress testing suite designed to test the Britsto tryout system with up to 1000 concurrent users using Artillery.js.

## 🎯 Overview

This stress test suite simulates realistic user behavior patterns for the tryout system, including:
- User authentication and dashboard access
- Complete tryout exam flows
- High-frequency answer saving
- Static resource loading

The test is designed to identify performance bottlenecks, database limitations, and system stability issues under high concurrent load.

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- Running Britsto tryout application on `http://localhost:3000`
- At least 8GB RAM for running 1000 concurrent users
- Sufficient system resources for monitoring

## 🚀 Quick Start

### 1. Setup

```bash
# Navigate to the stress test directory
cd stress-test

# Install dependencies
npm install

# Create results directory
mkdir -p results
```

### 2. Basic Test Run

```bash
# Run the full stress test (1000 concurrent users)
npm run test

# Run a quick test (100 users, 10 requests each)
npm run test-quick

# Run test with report generation
npm run test-report
```

### 3. With System Monitoring

```bash
# Terminal 1: Start system monitoring
npm run monitor-system

# Terminal 2: Run stress test with reporting
npm run test-with-monitoring
```

## 📊 Test Scenarios

The stress test includes 4 main scenarios with different traffic distributions:

### 1. User Login and Dashboard Access (40% of traffic)
- Simulates users logging in and accessing their dashboard
- Tests authentication system under load
- Validates session management

### 2. Complete Tryout Exam Flow (35% of traffic)
- Full user journey from login to exam completion
- Tests the entire tryout system end-to-end
- Includes answer submission and exam completion

### 3. Intensive Answer Saving (20% of traffic)
- High-frequency answer submissions
- Tests database write performance
- Simulates active exam-taking behavior

### 4. Static Resources and API Calls (5% of traffic)
- Tests static file serving under load
- Validates CDN and caching performance

## 📈 Test Phases

The stress test runs through 5 distinct phases:

1. **Warm-up Phase** (60s): 10 → 50 users/second
2. **Ramp-up Phase** (120s): 50 → 200 users/second
3. **Peak Load Phase** (300s): 200 → 1000 users/second
4. **Sustained Peak Load** (600s): 1000 users/second
5. **Cool-down Phase** (120s): 1000 → 100 users/second

**Total Test Duration**: ~20 minutes

## 🔧 Configuration

### Artillery Configuration (`artillery-config.yml`)

Key configuration options:

```yaml
config:
  target: "http://localhost:3000"  # Target server
  phases:
    # Customize test phases here
  plugins:
    fake-data: {}                  # Generate realistic test data
    metrics-by-endpoint: {}        # Detailed endpoint metrics
```

### Custom Data Generation (`processor.js`)

The processor file generates:
- Random user credentials
- Exam categories and tokens
- Realistic answer data
- User behavior patterns

## 📊 Monitoring and Analysis

### System Monitoring

The system monitor tracks:
- CPU usage and core utilization
- Memory usage and availability
- Network I/O (RX/TX)
- Disk I/O operations

```bash
# Start monitoring with custom interval (default: 5000ms)
node monitoring/system-monitor.js 3000
```

### Result Analysis

The result analyzer provides:
- Performance ratings (excellent/good/acceptable/poor/unacceptable)
- Detailed recommendations
- Production readiness assessment
- Markdown and JSON reports

```bash
# Analyze test results
npm run analyze-results results/stress-test-report.json
```

## 📋 Performance Thresholds

### Response Time Ratings
- **Excellent**: < 200ms
- **Good**: < 500ms
- **Acceptable**: < 1000ms
- **Poor**: < 2000ms
- **Unacceptable**: ≥ 2000ms

### Error Rate Ratings
- **Excellent**: < 0.1%
- **Good**: < 1%
- **Acceptable**: < 5%
- **Poor**: < 10%
- **Unacceptable**: ≥ 10%

### Throughput Targets
- **Minimum**: 100 requests/second
- **Target**: 500 requests/second
- **Excellent**: 1000+ requests/second

## 🗂️ Directory Structure

```
stress-test/
├── artillery-config.yml      # Main Artillery configuration
├── processor.js             # Data generation helpers
├── package.json             # Dependencies and scripts
├── monitoring/
│   └── system-monitor.js     # Real-time system monitoring
├── analysis/
│   └── result-analyzer.js    # Test result analysis
├── results/                 # Generated reports and data
└── README.md               # This file
```

## 📈 Key Metrics to Monitor

### During Test Execution
- Response time percentiles (P95, P99)
- Request rate (requests/second)
- Error rate and HTTP status codes
- System resource utilization
- Database connection pool usage

### Post-Test Analysis
- Overall performance rating
- Production readiness assessment
- Bottleneck identification
- Scalability recommendations

## 🛠️ Troubleshooting

### Common Issues

1. **High Error Rates**
   - Check database connection limits
   - Verify session store capacity
   - Review application logs

2. **Poor Response Times**
   - Monitor database query performance
   - Check for memory leaks
   - Validate caching configuration

3. **System Resource Exhaustion**
   - Increase server memory/CPU
   - Optimize database queries
   - Implement connection pooling

### Database Optimization Recommendations

Based on the tryout system analysis, consider:

1. **Connection Pooling**: Configure PostgreSQL connection pool
2. **Query Optimization**: Add indexes for frequently accessed data
3. **Session Management**: Use Redis for session storage
4. **Answer Storage**: Optimize the answer saving mechanism
5. **Caching**: Implement caching for static content and frequently accessed data

## 📊 Expected Results

For a well-optimized system, expect:
- **Response Time P95**: < 500ms
- **Error Rate**: < 1%
- **Throughput**: > 500 req/s
- **Success Rate**: > 99%

## 🔄 Continuous Integration

To integrate with CI/CD pipelines:

```bash
# Add to your CI script
npm install
npm run test-report

# Check if results meet thresholds
node analysis/result-analyzer.js results/stress-test-report.json
```

## 📝 Reporting

The test suite generates multiple report formats:
- **JSON**: Detailed metrics and raw data
- **HTML**: Visual charts and graphs
- **Markdown**: Executive summary and recommendations
- **CSV**: System metrics for spreadsheet analysis

## 🤝 Contributing

To add new test scenarios or modify existing ones:

1. Edit `artillery-config.yml` for new scenarios
2. Update `processor.js` for custom data generation
3. Modify thresholds in `analysis/result-analyzer.js`
4. Update documentation

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Artillery.js documentation
3. Analyze system and application logs
4. Monitor database performance metrics

---

**Note**: This stress test is designed for development and staging environments. Always ensure you have proper authorization before running stress tests against any system. 