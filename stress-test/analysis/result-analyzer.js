// result-analyzer.js - Comprehensive analysis of Artillery stress test results

const fs = require('fs-extra');
const path = require('path');

class StressTestAnalyzer {
  constructor() {
    this.thresholds = {
      responseTime: {
        excellent: 200,    // < 200ms
        good: 500,         // < 500ms
        acceptable: 1000,  // < 1s
        poor: 2000        // < 2s
      },
      errorRate: {
        excellent: 0.1,    // < 0.1%
        good: 1,           // < 1%
        acceptable: 5,     // < 5%
        poor: 10          // < 10%
      },
      throughput: {
        minimum: 100,      // requests/sec
        target: 500,       // requests/sec
        excellent: 1000    // requests/sec
      }
    };
  }

  async analyzeResults(reportPath) {
    try {
      console.log('🔍 Analyzing stress test results...');
      
      const reportData = await fs.readJSON(reportPath);
      const analysis = {
        testInfo: this.extractTestInfo(reportData),
        performance: this.analyzePerformance(reportData),
        errors: this.analyzeErrors(reportData),
        recommendations: [],
        summary: {}
      };

      analysis.recommendations = this.generateRecommendations(analysis);
      analysis.summary = this.generateSummary(analysis);

      await this.saveAnalysis(analysis, reportPath);
      this.displayAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing results:', error);
      throw error;
    }
  }

  extractTestInfo(reportData) {
    const aggregate = reportData.aggregate;
    const intermediate = reportData.intermediate || [];
    
    return {
      testDuration: this.formatDuration(aggregate.testDuration),
      totalRequests: aggregate.counters['http.requests'] || 0,
      totalUsers: aggregate.counters['vusers.created'] || 0,
      completedUsers: aggregate.counters['vusers.completed'] || 0,
      failedUsers: aggregate.counters['vusers.failed'] || 0,
      phases: intermediate.length,
      startTime: reportData.startedAt,
      endTime: reportData.endedAt
    };
  }

  analyzePerformance(reportData) {
    const aggregate = reportData.aggregate;
    const histograms = aggregate.histograms || {};
    const counters = aggregate.counters || {};

    const responseTime = histograms['http.response_time'];
    const requestRate = counters['http.requests'] / (aggregate.testDuration / 1000);

    return {
      responseTime: {
        min: responseTime?.min || 0,
        max: responseTime?.max || 0,
        mean: responseTime?.mean || 0,
        median: responseTime?.median || 0,
        p95: responseTime?.p95 || 0,
        p99: responseTime?.p99 || 0,
        rating: this.rateResponseTime(responseTime?.p95 || 0)
      },
      throughput: {
        requestsPerSecond: Math.round(requestRate),
        bytesPerSecond: this.calculateBytesPerSecond(aggregate),
        rating: this.rateThroughput(requestRate)
      },
      concurrency: {
        maxConcurrent: this.calculateMaxConcurrency(reportData),
        avgConcurrent: this.calculateAvgConcurrency(reportData)
      }
    };
  }

  analyzeErrors(reportData) {
    const aggregate = reportData.aggregate;
    const counters = aggregate.counters || {};
    
    const totalRequests = counters['http.requests'] || 0;
    const successfulRequests = counters['http.codes.200'] || 0;
    const errors = totalRequests - successfulRequests;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    const errorBreakdown = {};
    Object.keys(counters).forEach(key => {
      if (key.startsWith('http.codes.') && key !== 'http.codes.200') {
        const statusCode = key.replace('http.codes.', '');
        errorBreakdown[statusCode] = counters[key];
      }
    });

    return {
      totalErrors: errors,
      errorRate: errorRate,
      rating: this.rateErrorRate(errorRate),
      breakdown: errorBreakdown,
      timeouts: counters['http.request_timeout'] || 0,
      connectionErrors: counters['http.connection_error'] || 0
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Response time recommendations
    if (analysis.performance.responseTime.rating === 'poor') {
      recommendations.push({
        category: 'Performance',
        severity: 'high',
        issue: 'High response times detected',
        recommendation: 'Consider optimizing database queries, adding caching, or scaling horizontally',
        metric: `P95: ${analysis.performance.responseTime.p95}ms`
      });
    }

    // Error rate recommendations
    if (analysis.errors.rating === 'poor' || analysis.errors.rating === 'unacceptable') {
      recommendations.push({
        category: 'Reliability',
        severity: 'critical',
        issue: 'High error rate detected',
        recommendation: 'Investigate error logs, check database connections, and review error handling',
        metric: `Error Rate: ${analysis.errors.errorRate.toFixed(2)}%`
      });
    }

    // Throughput recommendations
    if (analysis.performance.throughput.rating === 'poor') {
      recommendations.push({
        category: 'Scalability',
        severity: 'medium',
        issue: 'Low throughput detected',
        recommendation: 'Consider load balancing, connection pooling, or upgrading server resources',
        metric: `Throughput: ${analysis.performance.throughput.requestsPerSecond} req/s`
      });
    }

    // Memory and resource recommendations
    if (analysis.testInfo.failedUsers > 0) {
      recommendations.push({
        category: 'Stability',
        severity: 'high',
        issue: 'Some virtual users failed to complete',
        recommendation: 'Check for memory leaks, connection limits, or timeout configurations',
        metric: `Failed Users: ${analysis.testInfo.failedUsers}`
      });
    }

    return recommendations;
  }

  generateSummary(analysis) {
    const overallRating = this.calculateOverallRating(analysis);
    
    return {
      overallRating,
      readyForProduction: overallRating !== 'poor' && overallRating !== 'unacceptable',
      keyMetrics: {
        avgResponseTime: `${analysis.performance.responseTime.mean.toFixed(0)}ms`,
        p95ResponseTime: `${analysis.performance.responseTime.p95.toFixed(0)}ms`,
        throughput: `${analysis.performance.throughput.requestsPerSecond} req/s`,
        errorRate: `${analysis.errors.errorRate.toFixed(2)}%`,
        successRate: `${(100 - analysis.errors.errorRate).toFixed(2)}%`
      },
      recommendations: analysis.recommendations.length
    };
  }

  calculateOverallRating(analysis) {
    const ratings = [
      analysis.performance.responseTime.rating,
      analysis.performance.throughput.rating,
      analysis.errors.rating
    ];

    const ratingScores = {
      'excellent': 4,
      'good': 3,
      'acceptable': 2,
      'poor': 1,
      'unacceptable': 0
    };

    const avgScore = ratings.reduce((sum, rating) => sum + ratingScores[rating], 0) / ratings.length;

    if (avgScore >= 3.5) return 'excellent';
    if (avgScore >= 2.5) return 'good';
    if (avgScore >= 1.5) return 'acceptable';
    if (avgScore >= 0.5) return 'poor';
    return 'unacceptable';
  }

  rateResponseTime(p95) {
    if (p95 < this.thresholds.responseTime.excellent) return 'excellent';
    if (p95 < this.thresholds.responseTime.good) return 'good';
    if (p95 < this.thresholds.responseTime.acceptable) return 'acceptable';
    if (p95 < this.thresholds.responseTime.poor) return 'poor';
    return 'unacceptable';
  }

  rateErrorRate(errorRate) {
    if (errorRate < this.thresholds.errorRate.excellent) return 'excellent';
    if (errorRate < this.thresholds.errorRate.good) return 'good';
    if (errorRate < this.thresholds.errorRate.acceptable) return 'acceptable';
    if (errorRate < this.thresholds.errorRate.poor) return 'poor';
    return 'unacceptable';
  }

  rateThroughput(rps) {
    if (rps >= this.thresholds.throughput.excellent) return 'excellent';
    if (rps >= this.thresholds.throughput.target) return 'good';
    if (rps >= this.thresholds.throughput.minimum) return 'acceptable';
    return 'poor';
  }

  calculateMaxConcurrency(reportData) {
    // Estimate based on phases and arrival rates
    const intermediate = reportData.intermediate || [];
    let maxConcurrency = 0;
    
    intermediate.forEach(phase => {
      const counters = phase.counters || {};
      const concurrent = counters['vusers.created'] - counters['vusers.completed'];
      maxConcurrency = Math.max(maxConcurrency, concurrent);
    });
    
    return maxConcurrency;
  }

  calculateAvgConcurrency(reportData) {
    const intermediate = reportData.intermediate || [];
    if (intermediate.length === 0) return 0;
    
    let totalConcurrency = 0;
    intermediate.forEach(phase => {
      const counters = phase.counters || {};
      const concurrent = counters['vusers.created'] - counters['vusers.completed'];
      totalConcurrency += concurrent;
    });
    
    return Math.round(totalConcurrency / intermediate.length);
  }

  calculateBytesPerSecond(aggregate) {
    const totalBytes = aggregate.counters['http.downloaded_bytes'] || 0;
    const duration = aggregate.testDuration / 1000; // Convert to seconds
    return Math.round(totalBytes / duration);
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  async saveAnalysis(analysis, originalReportPath) {
    try {
      const dir = path.dirname(originalReportPath);
      const timestamp = Date.now();
      const analysisPath = path.join(dir, `analysis-${timestamp}.json`);
      
      await fs.writeJSON(analysisPath, analysis, { spaces: 2 });
      console.log(`📊 Analysis saved to: ${analysisPath}`);
      
      // Generate markdown report
      await this.generateMarkdownReport(analysis, path.join(dir, `report-${timestamp}.md`));
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  }

  async generateMarkdownReport(analysis, outputPath) {
    const md = `# Stress Test Analysis Report

## Test Summary
- **Overall Rating**: ${analysis.summary.overallRating.toUpperCase()} ${this.getRatingEmoji(analysis.summary.overallRating)}
- **Production Ready**: ${analysis.summary.readyForProduction ? '✅ Yes' : '❌ No'}
- **Test Duration**: ${analysis.testInfo.testDuration}
- **Total Requests**: ${analysis.testInfo.totalRequests.toLocaleString()}
- **Total Users**: ${analysis.testInfo.totalUsers.toLocaleString()}

## Performance Metrics

### Response Time
- **Average**: ${analysis.performance.responseTime.mean.toFixed(0)}ms
- **P95**: ${analysis.performance.responseTime.p95.toFixed(0)}ms
- **P99**: ${analysis.performance.responseTime.p99.toFixed(0)}ms
- **Rating**: ${analysis.performance.responseTime.rating.toUpperCase()} ${this.getRatingEmoji(analysis.performance.responseTime.rating)}

### Throughput
- **Requests/Second**: ${analysis.performance.throughput.requestsPerSecond.toLocaleString()}
- **Bytes/Second**: ${this.formatBytes(analysis.performance.throughput.bytesPerSecond)}
- **Rating**: ${analysis.performance.throughput.rating.toUpperCase()} ${this.getRatingEmoji(analysis.performance.throughput.rating)}

### Error Analysis
- **Error Rate**: ${analysis.errors.errorRate.toFixed(2)}%
- **Total Errors**: ${analysis.errors.totalErrors.toLocaleString()}
- **Rating**: ${analysis.errors.rating.toUpperCase()} ${this.getRatingEmoji(analysis.errors.rating)}

## Recommendations

${analysis.recommendations.map(rec => `### ${rec.category} - ${rec.severity.toUpperCase()}
**Issue**: ${rec.issue}
**Recommendation**: ${rec.recommendation}
**Metric**: ${rec.metric}
`).join('\n')}

## Next Steps

${analysis.summary.readyForProduction ? 
  '✅ Your application appears ready for production load. Consider monitoring these metrics in production.' :
  '⚠️ Address the recommendations above before deploying to production.'
}

---
*Report generated on ${new Date().toISOString()}*
`;

    await fs.writeFile(outputPath, md);
    console.log(`📄 Markdown report saved to: ${outputPath}`);
  }

  getRatingEmoji(rating) {
    const emojis = {
      'excellent': '🟢',
      'good': '🟡',
      'acceptable': '🟠',
      'poor': '🔴',
      'unacceptable': '⚫'
    };
    return emojis[rating] || '❓';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  displayAnalysis(analysis) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 STRESS TEST ANALYSIS RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL RATING: ${analysis.summary.overallRating.toUpperCase()} ${this.getRatingEmoji(analysis.summary.overallRating)}`);
    console.log(`🚀 PRODUCTION READY: ${analysis.summary.readyForProduction ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📈 KEY METRICS:');
    Object.entries(analysis.summary.keyMetrics).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    if (analysis.recommendations.length > 0) {
      console.log('\n⚠️  RECOMMENDATIONS:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.issue}`);
        console.log(`      → ${rec.recommendation}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// CLI usage
if (require.main === module) {
  const analyzer = new StressTestAnalyzer();
  const reportPath = process.argv[2];
  
  if (!reportPath) {
    console.error('Usage: node result-analyzer.js <path-to-artillery-report.json>');
    process.exit(1);
  }
  
  analyzer.analyzeResults(reportPath)
    .then(() => {
      console.log('✅ Analysis complete!');
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = StressTestAnalyzer; 