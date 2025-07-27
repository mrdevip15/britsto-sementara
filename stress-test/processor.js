// processor.js - Helper functions for Artillery stress test

const crypto = require('crypto');

// Generate random string of specified length
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// Generate random number within range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sample exam categories and tokens for testing
const examCategories = [
  'TPS-PENALARAN-UMUM',
  'TPS-PENGETAHUAN-KUANTITATIF',
  'TPS-PEMAHAMAN-BACAAN',
  'LITERASI-BAHASA-INDONESIA',
  'LITERASI-BAHASA-INGGRIS',
  'LITERASI-PENALARAN-MATEMATIKA',
  'TKA-MATEMATIKA',
  'TKA-BAHASA-INDONESIA',
  'TKA-FISIKA',
  'TKA-KIMIA'
];

const sampleTokens = [
  'TOKEN001',
  'TOKEN002',
  'TOKEN003',
  'TOKEN004',
  'TOKEN005'
];

const answerOptions = ['a', 'b', 'c', 'd', 'e'];

// Generate user credentials for login
function generateUserCredentials(requestParams, context, ee, next) {
  const userId = generateRandomString(8);
  const email = `testuser_${userId}@example.com`;
  const password = 'password123';
  
  context.vars.email = email;
  context.vars.password = password;
  context.vars.userId = userId;
  
  next();
}

// Generate exam-related data
function generateExamData(requestParams, context, ee, next) {
  const kodekategori = examCategories[randomInt(0, examCategories.length - 1)];
  const token = sampleTokens[randomInt(0, sampleTokens.length - 1)];
  
  context.vars.kodekategori = kodekategori;
  context.vars.token = token;
  
  next();
}

// Generate answer data for question submissions
function generateAnswerData(requestParams, context, ee, next) {
  const questionNumber = randomInt(1, 50); // Assuming max 50 questions per exam
  const answer = answerOptions[randomInt(0, answerOptions.length - 1)];
  const kodekategori = context.vars.kodekategori || examCategories[randomInt(0, examCategories.length - 1)];
  
  context.vars.questionNumber = questionNumber;
  context.vars.answer = answer;
  context.vars.kodekategori = kodekategori;
  
  next();
}

// Generate realistic user behavior patterns
function generateUserBehavior(requestParams, context, ee, next) {
  const behaviors = [
    'quick_test_taker',    // Answers quickly, minimal thinking time
    'careful_reviewer',    // Takes time to review answers
    'average_student',     // Normal paced test taking
    'struggling_student'   // Takes longer, may change answers
  ];
  
  const behavior = behaviors[randomInt(0, behaviors.length - 1)];
  context.vars.userBehavior = behavior;
  
  // Set think times based on behavior
  switch(behavior) {
    case 'quick_test_taker':
      context.vars.thinkTime = randomInt(1, 3);
      break;
    case 'careful_reviewer':
      context.vars.thinkTime = randomInt(8, 15);
      break;
    case 'average_student':
      context.vars.thinkTime = randomInt(4, 8);
      break;
    case 'struggling_student':
      context.vars.thinkTime = randomInt(10, 20);
      break;
    default:
      context.vars.thinkTime = randomInt(3, 7);
  }
  
  next();
}

// Simulate realistic session data
function generateSessionData(requestParams, context, ee, next) {
  const sessionId = generateRandomString(32);
  const startTime = Date.now();
  
  context.vars.sessionId = sessionId;
  context.vars.sessionStart = startTime;
  
  next();
}

module.exports = {
  generateUserCredentials,
  generateExamData,
  generateAnswerData,
  generateUserBehavior,
  generateSessionData
}; 