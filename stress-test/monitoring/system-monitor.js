// system-monitor.js - Real-time system monitoring during stress tests

const si = require('systeminformation');
const fs = require('fs-extra');
const path = require('path');

class SystemMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metrics = [];
    this.startTime = null;
  }

  async startMonitoring(intervalMs = 5000) {
    if (this.isMonitoring) {
      console.log('Monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.metrics = [];

    console.log('🔍 Starting system monitoring...');
    console.log(`📊 Collecting metrics every ${intervalMs}ms`);

    this.monitoringInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        this.displayRealTimeMetrics(metrics);
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, intervalMs);
  }

  async collectMetrics() {
    const timestamp = Date.now();
    const uptime = timestamp - this.startTime;

    // Collect system metrics
    const [cpu, memory, networkStats, diskIO] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      si.disksIO()
    ]);

    return {
      timestamp,
      uptime,
      cpu: {
        usage: cpu.currentLoad,
        user: cpu.currentLoadUser,
        system: cpu.currentLoadSystem,
        cores: cpu.cpus?.map(core => core.load) || []
      },
      memory: {
        total: memory.total,
        used: memory.used,
        free: memory.free,
        usagePercent: (memory.used / memory.total) * 100,
        available: memory.available
      },
      network: networkStats[0] ? {
        rx_bytes: networkStats[0].rx_bytes,
        tx_bytes: networkStats[0].tx_bytes,
        rx_sec: networkStats[0].rx_sec,
        tx_sec: networkStats[0].tx_sec
      } : {},
      disk: {
        readBytes: diskIO.rIO_sec || 0,
        writeBytes: diskIO.wIO_sec || 0,
        readOps: diskIO.rIO || 0,
        writeOps: diskIO.wIO || 0
      }
    };
  }

  displayRealTimeMetrics(metrics) {
    const uptimeMinutes = Math.floor(metrics.uptime / 60000);
    const uptimeSeconds = Math.floor((metrics.uptime % 60000) / 1000);

    console.clear();
    console.log('='.repeat(80));
    console.log('🚀 BRITSTO TRYOUT STRESS TEST - SYSTEM MONITORING');
    console.log('='.repeat(80));
    console.log(`⏱️  Uptime: ${uptimeMinutes}m ${uptimeSeconds}s`);
    console.log(`📅 Timestamp: ${new Date(metrics.timestamp).toLocaleTimeString()}`);
    console.log('');

    // CPU Metrics
    console.log('🖥️  CPU METRICS:');
    console.log(`   Overall Usage: ${metrics.cpu.usage.toFixed(2)}%`);
    console.log(`   User: ${metrics.cpu.user.toFixed(2)}% | System: ${metrics.cpu.system.toFixed(2)}%`);
    
    // Memory Metrics
    console.log('');
    console.log('💾 MEMORY METRICS:');
    console.log(`   Usage: ${metrics.memory.usagePercent.toFixed(2)}%`);
    console.log(`   Used: ${this.formatBytes(metrics.memory.used)} / ${this.formatBytes(metrics.memory.total)}`);
    console.log(`   Available: ${this.formatBytes(metrics.memory.available)}`);

    // Network Metrics
    console.log('');
    console.log('🌐 NETWORK METRICS:');
    console.log(`   RX: ${this.formatBytes(metrics.network.rx_sec || 0)}/s`);
    console.log(`   TX: ${this.formatBytes(metrics.network.tx_sec || 0)}/s`);

    // Disk I/O Metrics
    console.log('');
    console.log('💿 DISK I/O METRICS:');
    console.log(`   Read: ${this.formatBytes(metrics.disk.readBytes)}/s`);
    console.log(`   Write: ${this.formatBytes(metrics.disk.writeBytes)}/s`);

    console.log('='.repeat(80));
    console.log('Press Ctrl+C to stop monitoring');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('\n🛑 Stopping system monitoring...');
    await this.saveMetrics();
  }

  async saveMetrics() {
    try {
      const resultsDir = path.join(__dirname, '../results');
      await fs.ensureDir(resultsDir);

      const filename = `system-metrics-${Date.now()}.json`;
      const filepath = path.join(resultsDir, filename);

      const report = {
        testInfo: {
          startTime: this.startTime,
          endTime: Date.now(),
          duration: Date.now() - this.startTime,
          totalSamples: this.metrics.length
        },
        metrics: this.metrics,
        summary: this.generateSummary()
      };

      await fs.writeJSON(filepath, report, { spaces: 2 });
      console.log(`📁 Metrics saved to: ${filepath}`);

      // Generate CSV for easy analysis
      await this.generateCSVReport(report, resultsDir);
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  generateSummary() {
    if (this.metrics.length === 0) return {};

    const cpuUsages = this.metrics.map(m => m.cpu.usage);
    const memoryUsages = this.metrics.map(m => m.memory.usagePercent);
    const networkRx = this.metrics.map(m => m.network.rx_sec || 0);
    const networkTx = this.metrics.map(m => m.network.tx_sec || 0);

    return {
      cpu: {
        avg: this.average(cpuUsages),
        max: Math.max(...cpuUsages),
        min: Math.min(...cpuUsages)
      },
      memory: {
        avg: this.average(memoryUsages),
        max: Math.max(...memoryUsages),
        min: Math.min(...memoryUsages)
      },
      network: {
        avgRx: this.average(networkRx),
        avgTx: this.average(networkTx),
        maxRx: Math.max(...networkRx),
        maxTx: Math.max(...networkTx)
      }
    };
  }

  async generateCSVReport(report, outputDir) {
    try {
      const createCsvWriter = require('csv-writer').createObjectCsvWriter;
      const csvPath = path.join(outputDir, `system-metrics-${Date.now()}.csv`);

      const csvWriter = createCsvWriter({
        path: csvPath,
        header: [
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'uptime', title: 'Uptime (ms)' },
          { id: 'cpuUsage', title: 'CPU Usage (%)' },
          { id: 'memoryUsage', title: 'Memory Usage (%)' },
          { id: 'memoryUsed', title: 'Memory Used (bytes)' },
          { id: 'networkRx', title: 'Network RX (bytes/s)' },
          { id: 'networkTx', title: 'Network TX (bytes/s)' },
          { id: 'diskRead', title: 'Disk Read (bytes/s)' },
          { id: 'diskWrite', title: 'Disk Write (bytes/s)' }
        ]
      });

      const csvData = report.metrics.map(metric => ({
        timestamp: new Date(metric.timestamp).toISOString(),
        uptime: metric.uptime,
        cpuUsage: metric.cpu.usage.toFixed(2),
        memoryUsage: metric.memory.usagePercent.toFixed(2),
        memoryUsed: metric.memory.used,
        networkRx: metric.network.rx_sec || 0,
        networkTx: metric.network.tx_sec || 0,
        diskRead: metric.disk.readBytes,
        diskWrite: metric.disk.writeBytes
      }));

      await csvWriter.writeRecords(csvData);
      console.log(`📊 CSV report saved to: ${csvPath}`);
    } catch (error) {
      console.error('Error generating CSV report:', error);
    }
  }

  average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new SystemMonitor();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🔄 Received SIGINT, stopping monitoring...');
    await monitor.stopMonitoring();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Received SIGTERM, stopping monitoring...');
    await monitor.stopMonitoring();
    process.exit(0);
  });

  // Start monitoring
  const interval = process.argv[2] ? parseInt(process.argv[2]) : 5000;
  monitor.startMonitoring(interval);
}

module.exports = SystemMonitor; 