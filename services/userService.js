// services/userService.js

const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcrypt');
const ContentSoal = require('../models/ContentSoal');
const Mapel = require('../models/Mapel');

async function getAllUsers() {
  try {
    // Fetch all users
    const users = await User.findAll();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function updateUser(userId, userData) {
  // Only hash password if it's not already hashed (doesn't start with $2b$)
  if (userData.password && !userData.password.startsWith('$2b$')) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;
  }
  
  const updatedUser = await User.update(userData, {
    where: { id: userId },
    returning: true,
  });

  return updatedUser[1][0];
}

async function saveUser(userData) {
  return await User.create(userData);
}

 

async function findUserByEmail(email) {
 
  return await User.findOne({ where: { email } });
}

async function findUserById(id) {

  return await User.findByPk(id);
}
const updateAnswer = async (userId, input, userData) => {
  try {
    // Get the user
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Initialize answers if empty
    let answers = user.answers || [];

    const { kodekategori, no, answer } = input;
  
    // Find the entry for the kodekategori
    let kodeEntry = answers.find((item) => item.kodekategori === kodekategori);

    if (kodeEntry) {
      // If entry exists, update the answer at the corresponding index (no - 1)
      kodeEntry.answer[no - 1] = answer;
    } else {
      // If entry doesn't exist, create a new one with the correct number of answers
      const newAnswerArray = [];
      newAnswerArray[no - 1] = answer; // Set the specific answer
      answers.push({ kodekategori, answer: newAnswerArray });
    }

    // Update the user's answers in the database
    user.answers = answers;
    userData.answers = answers;
    const updatedUser = await User.update(userData, {
      where: { id: userId },
      returning: true,
    });

   
    return user;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update answers');
  }
};
async function addTokenToUser(userId, token) {
  try {
    const user = await User.findByPk(userId);
    const tokenFetch = await Token.findOne({ where: { token } });

    if (!user) {
      throw new Error('User not found');
    }

    if (!tokenFetch) {
      throw new Error('Token yang kamu masukkan salah');
    }

    // Check if the token already exists in the user's tokens array
    if (user.tokens.includes(token)) {
      throw new Error('Token ini sudah digunakan');
    }

    // Check if the token's userRegistered array has not exceeded the quota
    if (tokenFetch.userRegistered.length >= Number(tokenFetch.kuota)) {
      throw new Error('Kuota token melebihi batas');
    }

    // Add the new token value to the user's tokens array
    user.tokens.push(token);

    // Update the user's tokens in the database
    await User.update({ tokens: user.tokens }, {
      where: { id: userId },
      returning: true,
    });

    // Update the token's userRegistered array
    tokenFetch.userRegistered.push(userId);
    await Token.update({ userRegistered: tokenFetch.userRegistered }, {
      where: { token },
      returning: true,
    });

    return 'Token added successfully.'; // Return success message
  } catch (error) {
    console.error('Error adding token to user:', error);
    throw new Error(error.message); // Throw the error message to be caught in the controller
  }
}
async function findTokenByValue(tokenValue) {
  const token = await Token.findOne({ where: { token: tokenValue } });
  return token; // Returns the token object or null if not found
}
async function addExamStatus(userId, kodekategori, tokenValue, type = 'taken', score = null) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Get token data to check maxSubtest
    const tokenData = await Token.findOne({ where: { token: tokenValue } });
    if (!tokenData) {
      return {
        success: false,
        message: 'Token not found'
      };
    }

    // Determine which array to update based on type
    const fieldToUpdate = type === 'taken' ? 'examTaken' : 'examCompleted';
    
    // Initialize array if it doesn't exist or is malformed
    let examArray = Array.isArray(user[fieldToUpdate]) ? user[fieldToUpdate] : [];

    // Clean up any malformed entries
    examArray = examArray.filter(entry => entry.tokenValue && entry.kodekategories);

    // Find entry for this token
    let tokenEntry = examArray.find(entry => entry.tokenValue === tokenValue);

    // For examTaken, check maxSubtest limit


    if (tokenEntry) {
      // Check if kodekategori already exists in the array
      if (!tokenEntry.kodekategories.includes(kodekategori)) {
        if (type === 'taken' && tokenEntry && tokenEntry.kodekategories.length >= tokenData.maxSubtest) {
          return {
            success: false,
            message: `Maksimal ${tokenData.maxSubtest} subtest untuk Mini TO`
          };
        } else {
          tokenEntry.kodekategories.push(kodekategori);
          // Add score if this is a completed exam
          if (type === 'completed' && score !== null) {
            tokenEntry.scores = tokenEntry.scores || {};
            tokenEntry.scores[kodekategori] = score;
          }
        }

      }
    } else {
      const newEntry = {
        tokenValue: tokenValue,
        kodekategories: [kodekategori]
      };
      // Add score if this is a completed exam
      if (type === 'completed' && score !== null) {
        newEntry.scores = {
          [kodekategori]: score
        };
      }
      examArray.push(newEntry);
    }

    // Prepare update object
    const updateData = {};
    updateData[fieldToUpdate] = examArray;

    // Update user using User.update
    const updatedUser = await User.update(updateData, {
      where: { id: userId },
      returning: true,
    });

    return {
      success: true,
      data: updatedUser[1][0]
    };

  } catch (error) {
    console.error(`Error adding exam ${type}:`, error);
    return {
      success: false,
      message: 'Internal server error'
    };
  }
}

async function getExamStatus(userId, tokenValue, type = 'taken') {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Determine which array to check based on type
    const fieldToCheck = type === 'taken' ? 'examTaken' : 'examCompleted';
    
    // Initialize examArray if it doesn't exist
    const examArray = user[fieldToCheck] || [];

    // Find entry for this token
    const tokenEntry = examArray.find(entry => entry.tokenValue === tokenValue);

    if (!tokenEntry) {
      return {
        tokenValue,
        kodekategories: [],
        scores: {} // Add empty scores object for examCompleted
      };
    }

    return {
      tokenValue: tokenEntry.tokenValue,
      kodekategories: tokenEntry.kodekategories || [],
      scores: tokenEntry.scores || {} // Include scores if they exist
    };

  } catch (error) {
    console.error(`Error getting exam ${type}:`, error);
    throw error;
  }
}

// Helper functions to make the code more readable
async function addExamTaken(userId, kodekategori, tokenValue) {
  return addExamStatus(userId, kodekategori, tokenValue, 'taken');
}

async function addExamCompleted(userId, kodekategori, tokenValue, score) {
  return addExamStatus(userId, kodekategori, tokenValue, 'completed', score);
}

async function getExamTaken(userId, tokenValue) {
  return getExamStatus(userId, tokenValue, 'taken');
}

async function getExamCompleted(userId, tokenValue) {
  return getExamStatus(userId, tokenValue, 'completed');
}

async function calculateScore(userId, kodekategori) {
  try {
    const user = await User.findByPk(userId);

    if (!user || !user.answers) {
      return {
        success: false,
        message: 'No answers found'
      };
    }

    // Find user's answers for this specific kodekategori
    const userAnswerSet = user.answers.find(ans => ans.kodekategori === kodekategori);

    if (!userAnswerSet) {
      return {
        success: false,
        message: 'No answers found for this test'
      };
    }

    // Get correct answers from ContentSoal, sorted by 'no' column to ensure order
    const contentSoals = await ContentSoal.findAll({
      include: [{
        model: Mapel,
        as: 'mapel',
        where: { kodekategori },
        attributes: []
      }]
    });

    if (!contentSoals.length) {
      return {
        success: false,
        message: 'No questions found for this test'
      };
    }

    // Sort contentSoals by question number
    contentSoals.sort((a, b) => {
      const numA = parseInt(a.no);
      const numB = parseInt(b.no);
      return numA - numB;
    });

    const totalQuestions = contentSoals.length;
    let correctAnswers = 0;
    let skippedAnswers = 0;

    // Get user answers
    const userAnswers = userAnswerSet.answer;

    contentSoals.forEach((soal, index) => {
      const userAns = userAnswers[index]?.toUpperCase() || '-';
      const correctAnswer = soal.answer.toUpperCase();
      let isCorrect = false;

      if (soal.tipeSoal === 'pgkompleks1' || soal.tipeSoal === 'pgkompleks2') {
        const correctParts = correctAnswer.match(/[A-E][1-2]/g) || [];
        const userParts = userAns.match(/[A-E][1-2]/g) || [];

        if (userAns === '-') {
          skippedAnswers++;
        } else {
          const matchingCount = correctParts.filter(part => userParts.includes(part)).length;
          isCorrect = matchingCount === correctParts.length;
          if (isCorrect) correctAnswers++;
        }
      } else {
        if (userAns === '-') {
          skippedAnswers++;
        } else {
          isCorrect = userAns === correctAnswer;
          if (isCorrect) correctAnswers++;
        }
      }
    });

    // Calculate score using the same logic as pembahasan
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    const finalScore = scorePercentage * 10; // Each question worth 10 points (1000/100)

    return {
      success: true,
      data: {
        score: finalScore,
        totalQuestions,
        correctAnswers,
        skippedAnswers,
        wrongAnswers: totalQuestions - correctAnswers - skippedAnswers,
        scorePercentage,
        details: {
          userAnswers: userAnswers,
          correctAnswers: contentSoals.map(soal => soal.answer)
        }
      }
    };
  } catch (error) {
    console.error('Error calculating score:', error);
    return {
      success: false,
      message: 'Error calculating score'
    };
  }
}

async function addDisqualifiedExam(userId, examId) {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Add the examId to the disqualifiedExams array
        user.disqualifiedExams = user.disqualifiedExams || [];
        if (!user.disqualifiedExams.includes(examId)) {
            user.disqualifiedExams.push(examId);
        }

        // Use User.update instead of user.save
        await User.update(
            { disqualifiedExams: user.disqualifiedExams }, // Update the disqualifiedExams field
            { where: { id: userId } } // Specify the user to update
        );

        return { success: true };
    } catch (error) {
        console.error('Error adding disqualified exam:', error);
        throw new Error('Failed to update disqualified exams');
    }
}

module.exports = {
  saveUser,
  findUserByEmail,
  findUserById,
  updateUser,
  getAllUsers,
  updateAnswer,
  addTokenToUser,
  findTokenByValue,
  addExamTaken,
  addExamCompleted,
  getExamTaken,
  getExamCompleted,
  calculateScore,
  addDisqualifiedExam
};
