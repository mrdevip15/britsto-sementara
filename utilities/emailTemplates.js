function generateScheduleReminderEmail(schedule, studentInfo, hostname, studentAddress) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin: 0; padding: 20px 0; border-bottom: 2px solid #eee;">
                    Pengingat Jadwal Mengajar
                </h1>
            </div>

            <!-- Greeting -->
            <div style="margin-bottom: 25px;">
                <p style="font-size: 16px; color: #2c3e50;">Halo <strong>${schedule.tentor.nama}</strong>,</p>
                <p style="font-size: 16px; color: #2c3e50;">Ini adalah pengingat untuk jadwal mengajar Anda:</p>
            </div>

            <!-- Schedule Details -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">
                            <strong style="color: #2c3e50;">📅 Tanggal:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #2c3e50;">
                            ${new Date(schedule.date).toLocaleDateString('id-ID')}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">
                            <strong style="color: #2c3e50;">⏰ Waktu:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #2c3e50;">
                            ${schedule.timeStart} - ${schedule.timeEnd}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">
                            <strong style="color: #2c3e50;">👥 Siswa/Kelas:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #2c3e50;">
                            ${studentInfo}
                        </td>
                    </tr>
                    ${studentAddress ? `
                    <tr>
                        <td style="padding: 8px 0; color: #666;">
                            <strong style="color: #2c3e50;">📍 Alamat:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #2c3e50;">
                            ${studentAddress}
                        </td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 8px 0; color: #666;">
                            <strong style="color: #2c3e50;">📚 Mata Pelajaran:</strong>
                        </td>
                        <td style="padding: 8px 0; color: #2c3e50;">
                            ${schedule.mataPelajaran}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">
                            <strong style="color: #2c3e50;">🔑 Kode Hadir:</strong>
                        </td>
                        <td style="padding: 8px 0;">
                            <span style="background-color: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">
                                ${schedule.attendanceCode}
                            </span>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Instructions -->
            <div style="margin-bottom: 25px; padding: 15px; background-color: #fff3e0; border-radius: 6px; border-left: 4px solid #ff9800;">
                <p style="margin: 0; color: #2c3e50;">
                    Silakan gunakan kode hadir di atas untuk mengisi daftar hadir setelah selesai mengajar.
                </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 25px;">
                <a href="${hostname}/daftar-hadir" 
                   style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Isi Daftar Hadir
                </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                    Terima kasih atas kerjasamanya.
                </p>
                <p style="margin: 10px 0 0; color: #666; font-size: 12px;">
                    Email ini dikirim secara otomatis oleh sistem Genius Gate.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generatePasswordResetEmail(userName, newPassword, hostname) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin: 0; padding: 20px 0; border-bottom: 2px solid #eee;">
                    🔐 Password Reset - BritsEdu
                </h1>
            </div>

            <!-- Greeting -->
            <div style="margin-bottom: 25px;">
                <p style="font-size: 16px; color: #2c3e50;">Halo <strong>${userName}</strong>,</p>
                <p style="font-size: 16px; color: #2c3e50;">Password Anda telah berhasil direset sesuai permintaan.</p>
            </div>

            <!-- New Password -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0 0 15px 0; color: #2c3e50; font-size: 16px;">
                    <strong>Password Baru Anda:</strong>
                </p>
                <div style="background-color: #e3f2fd; color: #1976d2; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; border: 2px dashed #1976d2;">
                    ${newPassword}
                </div>
            </div>

            <!-- Security Notice -->
            <div style="margin-bottom: 25px; padding: 15px; background-color: #fff3e0; border-radius: 6px; border-left: 4px solid #ff9800;">
                <p style="margin: 0 0 10px 0; color: #2c3e50; font-weight: bold;">
                    ⚠️ Penting untuk Keamanan:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #2c3e50;">
                    <li>Segera login dan ubah password ini ke password yang mudah Anda ingat</li>
                    <li>Jangan bagikan password ini kepada siapapun</li>
                    <li>Pastikan menggunakan password yang kuat (minimal 6 karakter)</li>
                </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 25px;">
                <a href="${hostname}/signin" 
                   style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
                    Login Sekarang
                </a>
                <a href="${hostname}/user/dashboard" 
                   style="display: inline-block; padding: 12px 24px; background-color: #4caf50; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Ke Dashboard
                </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; text-align: center;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                    Jika Anda tidak meminta reset password, segera hubungi tim support kami.
                </p>
                <p style="margin: 10px 0 0; color: #666; font-size: 12px;">
                    Email ini dikirim secara otomatis oleh sistem BritsEdu.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = {
    generateScheduleReminderEmail,
    generatePasswordResetEmail
};