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

  // Handle different Sequelize return formats
  if (updatedUser && updatedUser[1] && updatedUser[1][0]) {
    return updatedUser[1][0];
  }
  
  // Fallback: fetch the updated user
  return await User.findByPk(userId);
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

    let totalPoints = 0;
    const totalQuestions = contentSoals.length;
    const pointsPerQuestion = 1000 / totalQuestions; // Each question's base value
  

    // Log the full list of user answers and key answers for comparison
    const userAnswers = userAnswerSet.answer;  // User answers
    const keyAnswers = contentSoals.sort((a, b) => a.no - b.no).map(soal => soal.answer); // Correct answers

    contentSoals.forEach((soal, index) => {
      const userAnswer = userAnswers[index] ? userAnswers[index].trim().toLowerCase() : 'f';  // Trim and normalize answer, set to null if undefined

      // Log the key (correct) answer for this question
      const correctAnswer = keyAnswers[index].trim().toLowerCase();

      if (!userAnswer) return; // Skip if no answer

      let isCorrect = false;

      // Check tipeSoal for each question
      if (soal.tipeSoal === 'pgkompleks1' || soal.tipeSoal === 'pgkompleks2') {


        // Parse correct answer pattern
        const correctAnswerParts = soal.answer.toLowerCase().match(/[a-e][1-2]/g) || [];
        const correctAnswerMap = new Map(
          correctAnswerParts.map(part => [part.charAt(0), part.charAt(1)])
        );

        // Parse user answer
        const userAnswerParts = userAnswer.match(/[a-e][1-2]/g) || [];
        const userAnswerMap = new Map(
          userAnswerParts.map(part => [part.charAt(0), part.charAt(1)])
        );
   

        // Calculate partial points for this complex question
        let correctParts = 0;
        const totalParts = correctAnswerMap.size;

        correctAnswerMap.forEach((expectedValue, option) => {
          const userValue = userAnswerMap.get(option);
          if (userValue === expectedValue) {
            correctParts++;
          }
        });

        // Add proportional points for partial correct answers
        if (totalParts > 0) {
          const questionPoints = (correctParts / totalParts) * pointsPerQuestion;
          totalPoints += questionPoints;
          isCorrect = correctParts === totalParts;
      
        }
      } else if (soal.tipeSoal === 'isian') {
    

        // For isian type, it's all or nothing
        if (userAnswer === soal.answer.trim().toLowerCase()) {  // Normalize the comparison
          totalPoints += pointsPerQuestion;
          isCorrect = true;
        
        } else {
          isCorrect = false;
        
        }
      } else if (soal.tipeSoal === 'pgbiasa') {  // Regular multiple-choice question type
    

        // For regular PG questions, it's all or nothing
        if (userAnswer === soal.answer.trim().toLowerCase()) {  // Normalize the comparison
          totalPoints += pointsPerQuestion;
          isCorrect = true;
       
        } else {
          isCorrect = false;
    
        }
      }

      // Log the final score after each question
      const finalScore = Math.round(totalPoints);
 
    });

    // Round the final score to avoid floating point issues
    const finalScore = Math.round(totalPoints);

    return {
      success: true,
      data: {
        score: finalScore,
        totalPoints,
        totalQuestions,
        pointsPerQuestion,
        details: {
          userAnswers: userAnswers,
          correctAnswers: keyAnswers
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
