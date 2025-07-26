const { Model, DataTypes } = require('sequelize');
const sequelize = require('./config/sequelize'); // Assuming you have a Sequelize instance configured
const Mapel = require('./models/Mapel');
const ContentSoal = require('./models/ContentSoal');

const seedData = async () => {
  try {
    // Sync the database (drops existing tables and recreates them)
    await sequelize.sync({ force: true });

    const mapelData = [
      {
        order: 1,
        kategori: 'ALUMNI',
        mapel: 'Pengetahuan dan Pemahaman Umum',
        owner: 'paket-1',
        kodekategori: 'HEMm5yTuwdG8WMSS',
        jenisWaktu: '15',
        tanggalMulai: '2023-09-29',
        tanggalBerakhir: '2024-11-29',
        prasyarat: 'None',
        durasi: 15,
        soalData: [
          {
            no: 1,
            content: '<p>Example question 1 for Pengetahuan dan Pemahaman Umum</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'a',
            scoreA: 10,
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 1',
          },
          {
            no: 2,
            content: '<p>Example question 2 for Pengetahuan dan Pemahaman Umum</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'b',
            scoreB: 10,
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 1',
          },
        ],
      },
      {
        order: 2,
        kategori: 'ALUMNI',
        mapel: 'Kemampuan Memahami Bacaan dan Menulis',
        owner: 'paket-1',
        kodekategori: 'LRjfTRpRgGtMRzk6',
        jenisWaktu: '25',
        tanggalMulai: '2023-09-29',
        tanggalBerakhir: '2024-11-29',
        prasyarat: 'None',
        durasi: 25,
        soalData: [
          {
            no: 1,
            content: '<p>Example question 1 for Kemampuan Memahami Bacaan dan Menulis</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'a',
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 2',
          },
          {
            no: 2,
            content: '<p>Example question 2 for Kemampuan Memahami Bacaan dan Menulis</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'b',
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 2',
          },
        ],
      },
      {
        order: 3,
        kategori: 'ALUMNI',
        mapel: 'Pengetahuan Kuantitatif',
        owner: 'paket-2',
        kodekategori: 'mP58vpAfB4CjHDDz',
        jenisWaktu: '20',
        tanggalMulai: '2023-09-29',
        tanggalBerakhir: '2024-11-29',
        prasyarat: 'None',
        durasi: 20,
        soalData: [
          {
            no: 1,
            content: '<p>Example question 1 for Pengetahuan Kuantitatif</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'c',
            scoreC: 10,
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 3',
          },
          {
            no: 2,
            content: '<p>Example question 2 for Pengetahuan Kuantitatif</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'd',
            scoreD: 10,
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 3',
          },
        ],
      },
      {
        order: 4,
        kategori: 'ALUMNI',
        mapel: 'Literasi dalam Bahasa Indonesia',
        owner: 'paket-2',
        kodekategori: '6ZwWcYBxpS3GCvM7',
        jenisWaktu: '30',
        tanggalMulai: '2023-09-29',
        tanggalBerakhir: '2024-11-29',
        prasyarat: 'None',
        durasi: 30,
        soalData: [
          {
            no: 1,
            content: '<p>Example question 1 for Literasi dalam Bahasa Indonesia</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'a',
            scoreA: 10,
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 4',
          },
          {
            no: 2,
            content: '<p>Example question 2 for Literasi dalam Bahasa Indonesia</p>',
            a: 'Option A',
            b: 'Option B',
            c: 'Option C',
            d: 'Option D',
            e: 'Option E',
            answer: 'b',
            scoreB: 10,
            tipeSoal: 'pgbiasa',
            materi: 'Subtest 4',
          },
        ],
      },
    ];

    for (const mapel of mapelData) {
      const createdMapel = await Mapel.create({
        order: mapel.order,
        kategori: mapel.kategori,
        mapel: mapel.mapel,
        owner: mapel.owner,
        kodekategori: mapel.kodekategori,
        jenisWaktu: mapel.jenisWaktu,
        tanggalMulai: mapel.tanggalMulai,
        tanggalBerakhir: mapel.tanggalBerakhir,
        prasyarat: mapel.prasyarat,
        durasi: mapel.durasi,
      });

      // Bulk insert ContentSoal
      await ContentSoal.bulkCreate(
        mapel.soalData.map((soal) => ({
          ...soal,
          mapelId: createdMapel.id,
        }))
      );

     
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
};

seedData();
