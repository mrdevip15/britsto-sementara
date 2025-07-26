function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Get the data parameter and parse it as JSON
const dataParam = getURLParameter("data");
if (dataParam) {
    // Hide the login prompt and Google login button
    document.getElementById("login-text").style.display = "none";
    document.getElementById("google-login").style.display = "none";
    document.getElementById("msform").action = "/user/updateUser";
    // Modify the subtitle text
    document.getElementById("subtitle").textContent = "Kamu berhasil mendaftar dengan email, tapi sebelum lanjut isi data dirimu dulu ya";
}
let parsedData;
if (dataParam) {
    try {
        // Decode and parse the JSON data
        parsedData = JSON.parse(decodeURIComponent(dataParam));
        
        // Check for nama and email in parsed data
        if (parsedData.nama) {
            const namaField = document.getElementById("name");  // Updated to match the ID
            if (namaField) {
                namaField.value = parsedData.nama;
                namaField.readOnly = true;
            }
        }
        
        if (parsedData.email) {
            const emailField = document.getElementsByName("email")[0];  // Targeting by name attribute
            if (emailField) {
                emailField.value = parsedData.email;
                emailField.readOnly = true;
            }
        }

    } catch (error) {
        console.error("Failed to parse JSON data:", error);
    }
} else {
    console.log("No data parameter found in the URL.");
}

// The rest of your code for paket and program options
const paketParam = getURLParameter('paket');
const programParam = getURLParameter('program');

// Set the selected option in the paket dropdown
if (paketParam) {
    const paketOptions = Array.from(jenisPaket.options);
    updateJenjangOptions();
    updateProgramOptions();
    const matchingPaketOption = paketOptions.find(option => option.value === paketParam);
    if (matchingPaketOption) {
        matchingPaketOption.selected = true;
    }
    var program = document.getElementById("program");
    program.value = programParam;
}

// Set the selected option in the program dropdown
if (programParam) {
    const programOptions = Array.from(program.options);
    updateJenjangOptions();
    updateProgramOptions();
    const matchingProgramOption = programOptions.find(option => option.value === programParam);
    if (matchingProgramOption) {
        matchingProgramOption.selected = true;
    }
    var program = document.getElementById("program");
    program.value = programParam;
}
