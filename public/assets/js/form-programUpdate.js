function updateProgramOptions() {
    const paket = document.getElementById("jenisPaket").value;
    const programSelect = document.getElementById("program");
    const jenjangSelect = document.getElementById("jenjang");
    programSelect.innerHTML = ""; // Clear existing options
    
    let options = [];
    
    if (paket === "privat") {
        options = [
                    { value: "britsedu-lite", text: "BritsEdu Lite" },
        { value: "britsedu-pro", text: "BritsEdu Pro" },
        { value: "britsedu-plus", text: "BritsEdu Plus" },
        { value: "britsedu-promax", text: "BritsEdu Pro Max"}
        ];
    } else if (paket === "snbt") {
        options = [
            { value: "ultimate", text: "Ultimate" },
            { value: "ultra", text: "Ultra" },
            { value: "advanced", text: "Advanced" },
            { value: "basic", text: "Basic" },
            { value: "trial", text: "Trial" }
        ];
    } else if (paket === "tryout") {
        // Auto-select "Alumni & Gap year" when "Try Out" is selected
        jenjangSelect.value = "alumni";
        
        options = [
            { value: "to-single", text: "Paket 1x TO" },
            { value: "to-bundle", text: "Bundling 3x TO" }
        ];
    }

    // Populate options
    options.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        programSelect.appendChild(opt);
    });
    showProgramDetails()
}

function showProgramDetails() {
    const program = document.getElementById("program").value;
    const programDetails = document.getElementById("programDetails");
    
    let details = "";


    switch (program) {
        case "to-single":
            details = `
                <ul>
                    <li>Deskripsi: Paket Try Out 1x</li>
                    <li>Harga: Rp25 ribu</li>
                </ul>
            `;
            break;
        case "to-bundle":
            details = `
                <ul>
                    <li>Deskripsi: Paket Try Out 3x</li>
                    <li>Harga: Rp50 ribu (akan diberikan 3 Token berbeda)</li>
                </ul>
            `;
            break;
        case "ultimate":
            details = `
                <ul>
                    <li>Deskripsi: H+1 UAS s.d. H-1 SNBT, 8x seminggu, 3 sesi per hari, kelas 4-10 orang.</li>
                    <li>Fasilitas: Handbook, Soal latihan, Laporan hasil belajar, Konsultasi jurusan, TO per minggu, Makan 3x Sehari + Coffee break, FREE akomodasi hotel bintang 4.</li>
                    <li>Harga: Rp30 JT</li>
                </ul>
            `;
            break;
        case "ultra":
            details = `
                <ul>
                    <li>Deskripsi: H+1 UAS s.d. H-1 SNBT, 6x seminggu, 4 jam per sesi, kelas 5 orang.</li>
                    <li>Fasilitas: Handbook, Soal latihan, Laporan hasil belajar, Konsultasi jurusan, TO per minggu, Konsumsi  2x sehari, FREE tempat tinggal.</li>
                    <li>Harga: Rp8 JT</li>
                </ul>
            `;
            break;
        case "advanced":
            details = `
                <ul>
                    <li>Deskripsi: H+1 UAS s.d. H-1 SNBT, 4x seminggu, 2 jam per sesi, kelas 3-7 orang.</li>
                    <li>Fasilitas: Handbook, Soal latihan, Laporan hasil belajar, Konsultasi jurusan, TO per minggu, Konsumsi 2x sehari, FREE tempat tinggal.</li>
                    <li>Harga: Rp5 JT</li>
                </ul>
            `;
            break;
        case "basic":
            details = `
                <ul>
                    <li>Deskripsi: Program 3 bulan, 3x seminggu, durasi 1.5 jam, kelas 3-10 orang.</li>
                    <li>Fasilitas: Handbook, Soal latihan, Laporan hasil belajar, Konsultasi jurusan.</li>
                    <li>Harga: Rp3,5 JT</li>
                </ul>
            `;
            break;
        case "trial":
            details = `
                <ul>
                    <li>Deskripsi: Program 1 bulan, 3x seminggu, durasi 1.5 jam, kelas atau privat.</li>
                    <li>Fasilitas: Handbook, Soal latihan.</li>
                    <li>Harga: Rp1,2 JT</li>
                </ul>
            `;
            break;
            case "gg-lite":
                details = `
                    <ul>
                        <li>12 Kali sesi belajar</li>
                        <li>Belajar 3 kali seminggu</li>
                        <li>Belajar 1.5 jam per hari</li>
                        <li>Harga: Rp1 JUTA</li>
                    </ul>
                `;
                break;
            case "gg-pro":
                details = `
                    <ul>
                        <li>12 Kali sesi belajar</li>
                        <li>Belajar 3 kali seminggu</li>
                        <li>Belajar 1.5 jam per hari</li>
                        <li>Harga: Rp1.5 JUTA</li>
                    </ul>
                `;
                break;
            case "gg-promax":
                details = `
                    <ul>
                        <li>36 Kali sesi belajar</li>
                        <li>Belajar 3 kali seminggu</li>
                        <li>Belajar 1.5 jam per hari</li>
                        <li>Harga: Rp4 JUTA</li>
                    </ul>
                `;
                break;
            case "gg-plus":
                details = `
                    <ul>
                        <li>36 Kali sesi belajar</li>
                        <li>Belajar 3 kali seminggu</li>
                        <li>Belajar 1.5 jam per hari</li>
                        <li>Harga: Rp3 JUTA</li>
                    </ul>
                `;
                break;
        default:
            details = "";
    }

    programDetails.innerHTML = details;
    programDetails.style.display = details ? "block" : "none";
}

