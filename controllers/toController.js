const userService = require('../services/userService');
const Mapel = require('../models/Mapel');
const ContentSoal = require('../models/ContentSoal');

async function base(req, res) {

  try {
    const { kodekategori, token } = req.params;
    
    // Fetch Mapel and associated ContentSoal
    const mapel = await Mapel.findOne({
      where: { kodekategori },
      include: [
        {
          model: ContentSoal,
          as: 'soals',
          attributes: ['no', 'content', 'a', 'b', 'c', 'd', 'e', 'tipeSoal', 'answer'], // Select only necessary fields
        },
      ],
    });

    // Check if mapel exists
    if (!mapel) {
      return res.status(404).render('404', {
        message: "Ujian tidak ditemukan",
        link: "/user/dashboard",
        action: "Kembali ke dashboard"
      });
    }

    // Check if the current time is between tanggalMulai and tanggalBerakhir
    const now = new Date();
    const startDate = new Date(mapel.tanggalMulai);
    const endDate = new Date(mapel.tanggalBerakhir);

    if (now < startDate) {
      return res.status(403).render('404', {
        message: `Ujian belum dimulai. Ujian akan dimulai pada ${startDate.toLocaleString('id-ID')}`,
        link: `/user/to-premium/${token}`,
        action: "Kembali ke daftar subtes"
      });
    }

    if (now > endDate) {
      return res.status(403).render('404', {
      
        message: `Ujian sudah berakhir pada ${endDate.toLocaleString('id-ID')}`,
        link: `/user/to-premium/${token}`,
        action: "Kembali ke daftar subtes"
      });
    }

    // Check eligibility
    const userTokens = req.user.tokens || [];
    let isEligible = false;
    let myToken = token
    for (const tokenValue of userTokens) {
      const tokenData = await userService.findTokenByValue(tokenValue);
      if (tokenData && tokenData.owner === mapel.owner) {
        isEligible = true;
        break; // Exit loop if an eligible token is found
      }
    }

    // If no eligible token is found, return a 403 response
    if (!isEligible || !mapel) {
     return res.status(404).render('404', {
        message: "Token tidak terdaftar, silahkan masukkan token terlebih dahulu",
        link: "/user/dashboard",
        action: "Kembali ke dashboard"
      });
    }
    // If no Mapel is found, return a 404 response
    if (!mapel) {
      return res.status(400).json({ message: 'Mapel not found' });
    }
    const myExams =  await userService.getExamTaken(req.user.id, myToken); 
    // Add kodekategori to examTaken with the eligible token
    const result = await userService.addExamTaken(req.user.id, kodekategori, myToken);
    
    if (!result.success) {
      return res.status(404).render('404', {
  
        message: result.message,
        link: `/user/to-premium/${myToken}`,
        action: "Kembali ke daftar subtes"
      });
    }

   
    // Format the data for the frontend
    const formattedQuestions = mapel.soals
      .map((soal) => ({
        no: parseInt(soal.no, 10), // Ensure 'no' is treated as a number
        content: soal.content,
        options: {
          a: soal.a,
          b: soal.b,
          c: soal.c,
          d: soal.d,
          e: soal.e,
        },
        tipeOpsi: soal.tipeSoal,
      }))
      .sort((a, b) => a.no - b.no); // Sort by 'no'

    // Send the formatted response
    res.render('tryout/index', {
      user: req.user,
      mapel: mapel.mapel,
      durasi : mapel.durasi,
      kategori: mapel.kategori,
      examId: kodekategori,
      questions: formattedQuestions,
      answer : req.user.answers ? req.user.answers.filter(ans => ans.kodekategori === mapel.kodekategori) : []
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('404', {
      message: "Terjadi kesalahan pada server",
      link: "/user/dashboard",
      action: "Kembali ke dashboard"
    });
  }
}

module.exports = {base};