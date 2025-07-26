// services/tokenService.js
const crypto = require('crypto');
const Token = require('../models/Token'); // Assuming your Token model is set up and exported properly

// 1. Service to Get All Tokens
const getAllTokens = async () => {
  try {
    const tokens = await Token.findAll();
    return tokens;
  } catch (error) {
    throw new Error('Error fetching tokens: ' + error.message);
  }
};

// 2. Service to Get a Token by ID
const getTokenById = async (id) => {
  try {
    const token = await Token.findByPk(id);
    if (!token) {
      throw new Error('Token not found');
    }
    return token;
  } catch (error) {
    throw new Error('Error fetching token by ID: ' + error.message);
  }
};

// 3. Service to Delete a Token by ID
const deleteTokenById = async (id) => {
  try {
    const token = await Token.findByPk(id);
    if (!token) {
      throw new Error('Token not found');
    }
    await token.destroy();
    return { message: 'Token deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting token: ' + error.message);
  }
};
const generateToken = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let token = '';

  // Generate 6 random letters
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    token += letters[randomIndex];
  }

  // Generate 2 random numbers
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    token += numbers[randomIndex];
  }

  return token;
};
const createNewToken = async ({ namaToken, kuota, kategori, owner, maxSubtest }) => {
  try {
    // Validate input
    if (!namaToken || !kuota || !kategori || !owner || !maxSubtest) {
      throw new Error('All fields are required: namaToken, kuota, kategori, owner');
    }

    // Generate a random token
    const tokenValue =  generateToken();

    // Create the token in the database
    const newToken = await Token.create({
      namaToken,
      token: tokenValue,
      kuota,
      kategori,
      owner,
      maxSubtest
    });

    return {
      message: 'Token created successfully',
      token: newToken,
    };
  } catch (error) {
    throw new Error('Error creating token: ' + error.message);
  }
};
// Update (edit) a token by ID
const editTokenById = async (id, updates) => {
  try {
    const token = await Token.findByPk(id);
    if (!token) throw new Error('Token not found');
    const updatedToken = await token.update(updates);
    return { message: 'Token updated successfully', token: updatedToken };
  } catch (error) {
    throw new Error('Error updating token: ' + error.message);
  }
};

// Step 2: Export All Services
module.exports = {
  getAllTokens,
  getTokenById,
  deleteTokenById,
  editTokenById,
  createNewToken
};
