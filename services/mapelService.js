const Mapel = require('../models/Mapel');
const Token = require("../models/Token");
const ContentSoal = require('../models/ContentSoal'); // Assuming this is the related model

/**
 * Fetch all Mapel data, including related ContentSoal data
 * @returns {Promise<Array>} - List of all Mapel records with relationships
 */
async function getAllMapels() {
  try {
    return await Mapel.findAll({
      include: [
        {
          model: ContentSoal, // Include related ContentSoal records
          as: 'soals', // Alias defined in the model association
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching Mapel records:', error);
    throw error;
  }
}
const addMapel = async (paketData) => {
  const { kategori, mapel, owner, kodekategori, tanggalMulai, tanggalBerakhir, durasi } = paketData;

  // Start a transaction to ensure atomicity
  const transaction = await Mapel.sequelize.transaction();

  try {
    // Create the Mapel (paket soal)
    const newMapel = await Mapel.create(
      {
        kategori,
        mapel,
        owner,
        kodekategori,
        tanggalMulai,
        tanggalBerakhir,
        durasi,
      },
      { transaction }
    );

    // Add associated ContentSoal records

    // Commit the transaction
    await transaction.commit();

    // Return the newly created Mapel with its associated ContentSoal
    return await Mapel.findByPk(newMapel.id, {
      include: [{ model: ContentSoal, as: 'soals' }],
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    throw new Error('Error creating paket soal: ' + error.message);
  }
};
const deleteSubtestByKodeKategori = async (kodekategori) => {
  const transaction = await Mapel.sequelize.transaction();
  
  try {
    const subtest = await Mapel.findOne({ where: { kodekategori }, include: ['soals'] });

    if (!subtest) {
      return false; // Subtest not found
    }

    // Delete associated ContentSoal records
    await ContentSoal.destroy({ where: { mapelId: subtest.id }, transaction });

    // Delete the subtest
    await Mapel.destroy({ where: { id: subtest.id }, transaction });

    await transaction.commit();
    return subtest.mapel;
  } catch (error) {
    await transaction.rollback();
    throw new Error('Error deleting subtest: ' + error.message);
  }
};

const getContentSoalsByKodeKategori = async (kodekategori) => {
  try {
      // Fetch Mapel by kodekategori and include related ContentSoals
      const mapel = await Mapel.findOne({
          where: { kodekategori }, // Match kodekategori
          include: [
              {
                  model: ContentSoal,
                  as: 'soals', // Alias defined in the association
              },
          ],
      });

      if (!mapel) {
          throw new Error('Mapel not found');
      }

      // Return the associated ContentSoals
      return mapel.soals; // This will be an array of ContentSoal
  } catch (error) {
      console.error('Error fetching content soals:', error);
      throw error;
  }
};
const getMapelByKodeKategori = async (kodekategori) => {
  try {
      return await Mapel.findOne({ where: { kodekategori } });
  } catch (error) {
      console.error('Error fetching Mapel:', error);
      throw error;
  }
};

// Get a specific soal by mapel ID and question number
const getSoalByMapelAndNo = async (mapelId, no) => {
  try {
      return await ContentSoal.findOne({ where: { mapelId, no } });
  } catch (error) {
      console.error('Error fetching soal:', error);
      throw error;
  }
};

// Create or update a soal
const createOrUpdateSoal = async (mapelId, no, soalData) => {
  try {
      const existingSoal = await ContentSoal.findOne({ where: { mapelId, no } });
 
      if (existingSoal) {
  
          // Update the existing soal
          return await existingSoal.update(soalData);
      } else {
       
          // Create a new soal

          return await ContentSoal.create({ ...soalData, mapelId, no });
      }
  } catch (error) {
      console.error('Error creating or updating soal:', error);
      throw error;
  }
};
const deleteSoal = async (mapelId, no) => {
  try {
    // Find the soal based on mapelId and no
    const existingSoal = await ContentSoal.findOne({ where: { mapelId, no } });

    if (existingSoal) {
      // Delete the found soal
      await existingSoal.destroy();
 
      return { success: true, message: 'Soal successfully deleted.' };
    } else {
      // If no matching soal is found
      
      return { success: false, message: 'Soal not found.' };
    }
  } catch (error) {
    console.error('Error deleting soal:', error);
    throw error;
  }
};
async function getMapelByTokenValue(tokenValue) {
  try {
    // Step 1: Find the token by the provided token value
    const token = await Token.findOne({
      where: { token: tokenValue },
    });

    if (!token) {
      return []; // No token found for this value
    }

    // Step 2: Extract the owner from the token
    const ownerName = token.owner;

    // Step 3: Find all Mapel using the extracted owner value
    const mapels = await Mapel.findAll({
      where: {
        owner: ownerName,
      },
    });

    return {mapels, token};
  } catch (error) {
    console.error('Error fetching Mapel by Token value:', error);
    throw error; // Handle errors appropriately in your project
  }
}

async function updateMapel(kodekategori, updates) {
  try {
    const mapel = await Mapel.findOne({ where: { kodekategori } });
    if (!mapel) {
      throw new Error('Paket soal not found');
    }
    
    await mapel.update(updates);
    return mapel;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllMapels, addMapel, deleteSubtestByKodeKategori, getContentSoalsByKodeKategori, getMapelByKodeKategori, getSoalByMapelAndNo, createOrUpdateSoal, deleteSoal, getMapelByTokenValue, updateMapel
};
