'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Define owners
    const owners = ['owner1', 'owner2', 'owner3', 'owner4'];
    
    // Define mapel categories
    const categories = ['TPS', 'Literasi', 'TKA Wajib', 'TKA Pilihan'];
    
    // Define subjects per category
    const mapelPerCategory = {
      'TPS': ['Penalaran Umum', 'Pengetahuan Kuantitatif', 'Pemahaman Bacaan dan Menulis', 'Pengetahuan dan Pemahaman Umum'],
      'Literasi': ['Literasi Bahasa Indonesia', 'Literasi Bahasa Inggris', 'Penalaran Matematika'],
      'TKA Wajib': ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah'],
      'TKA Pilihan': ['Fisika', 'Kimia', 'Biologi', 'Geografi', 'Ekonomi', 'Sosiologi']
    };

    // Create mapel entries
    const mapelData = [];
    
    owners.forEach((owner, ownerIndex) => {
      categories.forEach((category, categoryIndex) => {
        const subjects = mapelPerCategory[category];
        
        subjects.forEach((mapelName, mapelIndex) => {
          const kodekategori = `kod${ownerIndex}${categoryIndex}${mapelIndex}`;
          
          mapelData.push({
            kategori: category,
            mapel: mapelName,
            owner: owner,
            kodekategori: kodekategori,
            tanggalMulai: new Date('2024-01-01'),
            tanggalBerakhir: new Date('2024-12-31'),
            prasyarat: 'none',
            durasi: '90'
          });
        });
      });
    });

    // Insert mapel data and get the results
    const insertedMapel = await queryInterface.bulkInsert('mapel', mapelData, { returning: true });

    // Create content soal entries using the actual mapel IDs
    const contentSoalData = [];
    
    insertedMapel.forEach((mapel) => {
      for (let soalIndex = 1; soalIndex <= 5; soalIndex++) {
        contentSoalData.push({
          no: soalIndex.toString(),
          content: `Soal ${soalIndex} untuk ${mapel.mapel} (${mapel.kategori}) - ${mapel.owner}`,
          a: `Pilihan A untuk soal ${soalIndex}`,
          b: `Pilihan B untuk soal ${soalIndex}`,
          c: `Pilihan C untuk soal ${soalIndex}`,
          d: `Pilihan D untuk soal ${soalIndex}`,
          e: `Pilihan E untuk soal ${soalIndex}`,
          tipeSoal: 'pilgan',
          answer: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
          materi: `Materi ${soalIndex}`,
          mapelId: mapel.id
        });
      }
    });

    // Insert content soal data
    await queryInterface.bulkInsert('content_soal', contentSoalData, {});
  },

  async down (queryInterface, Sequelize) {
    // Clean up the data
    await queryInterface.bulkDelete('content_soal', null, {});
    await queryInterface.bulkDelete('mapel', null, {});
  }
}; 