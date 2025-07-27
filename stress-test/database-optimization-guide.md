# Database Optimization Guide for Tryout System

## Overview

This guide provides specific recommendations for optimizing the PostgreSQL database to handle 1000 concurrent users during tryout sessions. Based on the analysis of the tryout system architecture, these optimizations target the most critical bottlenecks.

## 🎯 Critical Database Operations Under Load

### High-Frequency Operations
1. **Answer Saving** (`/user/save-answers`) - Highest frequency
2. **User Authentication** - Session creation/validation
3. **Exam Data Retrieval** - Question loading
4. **Session Management** - User state tracking

### Database Tables Under Stress
- `Users` - Authentication and user data
- `Sessions` - Session management
- `Mapel` - Exam categories and questions
- `ContentSoal` - Question content
- User answers (stored in User.answers JSON field)

## 🔧 Connection Pool Optimization

### Current Configuration Analysis
The system uses Sequelize ORM with PostgreSQL. Under 1000 concurrent users, connection management becomes critical.

### Recommended Settings

```javascript
// config/sequelize.js - Optimized connection pool
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect: 'postgres',
  pool: {
    max: 50,        // Maximum connections (increased from default 5)
    min: 10,        // Minimum connections (keep warm connections)
    acquire: 60000, // Maximum time to get connection (60 seconds)
    idle: 30000,    // Maximum idle time (30 seconds)
    evict: 10000    // Check for idle connections every 10 seconds
  },
  logging: false,   // Disable logging in production for performance
  dialectOptions: {
    statement_timeout: 30000,  // 30 second query timeout
    idle_in_transaction_session_timeout: 30000
  }
});
```

### PostgreSQL Configuration

```sql
-- postgresql.conf optimizations for high concurrency

-- Connection settings
max_connections = 200                    -- Increased from default 100
shared_buffers = 256MB                   -- 25% of RAM for 1GB system
effective_cache_size = 768MB             -- 75% of RAM for 1GB system

-- Performance settings
work_mem = 4MB                           -- Memory per sort/hash operation
maintenance_work_mem = 64MB              -- Memory for maintenance operations
checkpoint_completion_target = 0.9       -- Spread checkpoints over time
wal_buffers = 16MB                       -- WAL buffer size
default_statistics_target = 100          -- Statistics for query planning

-- Connection and session settings
tcp_keepalives_idle = 600               -- TCP keepalive settings
tcp_keepalives_interval = 30
tcp_keepalives_count = 3
```

## 📊 Index Optimization

### Critical Indexes for Performance

```sql
-- User authentication optimization
CREATE INDEX CONCURRENTLY idx_users_email_active 
ON "Users" (email) WHERE "deletedAt" IS NULL;

-- Session management optimization  
CREATE INDEX CONCURRENTLY idx_sessions_sid 
ON "Sessions" (sid);

CREATE INDEX CONCURRENTLY idx_sessions_expire 
ON "Sessions" (expire) WHERE expire > NOW();

-- Exam data retrieval optimization
CREATE INDEX CONCURRENTLY idx_mapel_kodekategori_active 
ON "Mapels" (kodekategori) WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY idx_mapel_dates 
ON "Mapels" ("tanggalMulai", "tanggalBerakhir") WHERE "deletedAt" IS NULL;

-- Content retrieval optimization
CREATE INDEX CONCURRENTLY idx_contentsoal_mapel 
ON "ContentSoals" ("MapelId") WHERE "deletedAt" IS NULL;

CREATE INDEX CONCURRENTLY idx_contentsoal_no 
ON "ContentSoals" ("MapelId", "no") WHERE "deletedAt" IS NULL;

-- Token validation optimization
CREATE INDEX CONCURRENTLY idx_tokens_value_active 
ON "Tokens" (token) WHERE "deletedAt" IS NULL;

-- User answers optimization (if using separate table)
CREATE INDEX CONCURRENTLY idx_user_answers_user_exam 
ON user_answers (user_id, kodekategori);
```

### Index Monitoring

```sql
-- Monitor index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
    AND schemaname NOT IN ('information_schema', 'pg_catalog');
```

## 💾 Answer Storage Optimization

### Current Implementation Issues
The current system stores answers in a JSON field (`User.answers`), which can cause:
- Lock contention during concurrent updates
- Full document rewrites for small changes
- Difficulty in querying and indexing

### Recommended Solution: Separate Answers Table

```sql
-- Create dedicated answers table
CREATE TABLE user_answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "Users"(id),
    kodekategori VARCHAR(100) NOT NULL,
    question_no INTEGER NOT NULL,
    answer TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, kodekategori, question_no)
);

-- Indexes for performance
CREATE INDEX idx_user_answers_user_exam ON user_answers(user_id, kodekategori);
CREATE INDEX idx_user_answers_updated ON user_answers(updated_at);
```

### Optimized Answer Saving Service

```javascript
// services/userService.js - Optimized answer saving
async function saveAnswer(userId, kodekategori, questionNo, answer) {
  try {
    // Use UPSERT for atomic operation
    const [userAnswer, created] = await UserAnswer.upsert({
      user_id: userId,
      kodekategori: kodekategori,
      question_no: questionNo,
      answer: answer,
      updated_at: new Date()
    }, {
      returning: true,
      conflictFields: ['user_id', 'kodekategori', 'question_no']
    });
    
    return { success: true, answer: userAnswer };
  } catch (error) {
    console.error('Error saving answer:', error);
    return { success: false, error: error.message };
  }
}

// Batch answer saving for better performance
async function saveAnswersBatch(userId, kodekategori, answers) {
  const transaction = await sequelize.transaction();
  
  try {
    const upsertPromises = answers.map(({ questionNo, answer }) => 
      UserAnswer.upsert({
        user_id: userId,
        kodekategori: kodekategori,
        question_no: questionNo,
        answer: answer,
        updated_at: new Date()
      }, {
        transaction,
        conflictFields: ['user_id', 'kodekategori', 'question_no']
      })
    );
    
    await Promise.all(upsertPromises);
    await transaction.commit();
    
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

## 🚀 Session Management Optimization

### Redis Session Store
Replace database sessions with Redis for better performance:

```javascript
// Install redis session store
// npm install connect-redis redis

const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  db: 0,
  // Connection pool settings
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));
```

## 📈 Query Optimization

### Exam Data Loading Optimization

```javascript
// controllers/toController.js - Optimized exam loading
async function base(req, res) {
  try {
    const { kodekategori, token } = req.params;
    
    // Use select only necessary fields and include conditions
    const mapel = await Mapel.findOne({
      where: { 
        kodekategori,
        tanggalMulai: { [Op.lte]: new Date() },
        tanggalBerakhir: { [Op.gte]: new Date() }
      },
      attributes: ['id', 'mapel', 'durasi', 'kategori', 'kodekategori', 'owner'],
      include: [{
        model: ContentSoal,
        as: 'soals',
        attributes: ['no', 'content', 'a', 'b', 'c', 'd', 'e', 'tipeSoal'],
        order: [['no', 'ASC']]
      }],
      // Use read replica if available
      useMaster: false
    });
    
    // ... rest of the logic
  } catch (error) {
    console.error('Error loading exam:', error);
    res.status(500).render('404', {
      message: "Terjadi kesalahan sistem",
      link: "/user/dashboard",
      action: "Kembali ke dashboard"
    });
  }
}
```

### Token Validation Optimization

```javascript
// services/userService.js - Optimized token validation
async function findTokenByValue(tokenValue) {
  // Use Redis cache for frequently accessed tokens
  const cacheKey = `token:${tokenValue}`;
  
  try {
    // Check cache first
    const cachedToken = await redisClient.get(cacheKey);
    if (cachedToken) {
      return JSON.parse(cachedToken);
    }
    
    // Query database if not in cache
    const token = await Token.findOne({
      where: { token: tokenValue },
      attributes: ['id', 'token', 'owner', 'category'],
      raw: true // Return plain object for better performance
    });
    
    if (token) {
      // Cache for 1 hour
      await redisClient.setex(cacheKey, 3600, JSON.stringify(token));
    }
    
    return token;
  } catch (error) {
    console.error('Error finding token:', error);
    return null;
  }
}
```

## 🔍 Monitoring and Alerting

### Database Performance Monitoring

```sql
-- Monitor active connections
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity;

-- Monitor slow queries
SELECT 
    query,
    mean_time,
    calls,
    total_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Monitor lock contention
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```

### Application-Level Monitoring

```javascript
// middleware/performanceMonitor.js
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${route} - ${duration}ms`);
    }
    
    // Track metrics (integrate with monitoring system)
    metrics.recordHttpRequest(req.method, route, res.statusCode, duration);
  });
  
  next();
};
```

## 🎯 Load Testing Specific Optimizations

### Prepare Database for Load Testing

```sql
-- Analyze tables before testing
ANALYZE "Users";
ANALYZE "Sessions";
ANALYZE "Mapels";
ANALYZE "ContentSoals";
ANALYZE "Tokens";

-- Vacuum if needed
VACUUM ANALYZE;

-- Check for bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Test Data Preparation

```javascript
// scripts/prepareTestData.js
async function prepareTestData() {
  console.log('Preparing test data for stress testing...');
  
  // Create test users
  const testUsers = [];
  for (let i = 1; i <= 1000; i++) {
    testUsers.push({
      email: `testuser${i}@example.com`,
      password: await bcrypt.hash('password123', 10),
      namaLengkap: `Test User ${i}`,
      tokens: ['TOKEN001', 'TOKEN002', 'TOKEN003'],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  // Batch insert for performance
  await User.bulkCreate(testUsers, { 
    ignoreDuplicates: true,
    validate: false // Skip validation for performance
  });
  
  console.log('Test data preparation complete');
}
```

## 📋 Pre-Load Test Checklist

- [ ] Connection pool configured (max: 50, min: 10)
- [ ] Critical indexes created and analyzed
- [ ] Redis session store configured
- [ ] Answer storage optimized (separate table)
- [ ] Query optimization implemented
- [ ] Monitoring queries prepared
- [ ] Test data created (1000+ users)
- [ ] Database statistics updated
- [ ] Slow query logging enabled
- [ ] Connection monitoring configured

## 🚨 Critical Thresholds to Monitor

- **Active Connections**: < 80% of max_connections
- **Query Response Time**: P95 < 100ms for critical queries
- **Lock Wait Time**: < 10ms average
- **Cache Hit Ratio**: > 95%
- **Connection Pool Usage**: < 80% of pool size
- **Redis Memory Usage**: < 80% of available memory

## 🔄 Post-Test Analysis

After running the stress test:

1. **Analyze slow query log**
2. **Check connection pool statistics**
3. **Review index usage statistics**
4. **Monitor for lock contention**
5. **Validate answer data integrity**
6. **Check for connection leaks**

This optimization guide should significantly improve the system's ability to handle 1000 concurrent users during tryout sessions. 