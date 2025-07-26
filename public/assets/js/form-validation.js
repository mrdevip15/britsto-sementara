document.getElementById('msform').addEventListener('submit', function(event) {
    // Prevent form submission to validate first
    event.preventDefault();

    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(function(el) {
        el.style.display = 'none';
        el.textContent = '';
    });

    // Get form inputs
    const email = document.querySelector('input[name="email"]');
    const pass = document.querySelector('input[name="password"]');
    const cpass = document.querySelector('input[name="cpass"]');
    const namaOrtu = document.querySelector('input[name="nama_ortu"]');
    const noHpOrtu = document.querySelector('input[name="no_hp_ortu"]');
    const nama = document.getElementById('name');
    const asalSekolah = document.getElementById('asal_sekolah');
    const phone = document.getElementById('phone');

    // Validation flags
    let isValid = true;
    let firstInvalidInput = null; // Track the first invalid input

    // Email validation
    if (!validateEmail(email.value)) {
        showError('email-error', "Masukkan email yang valid");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = email;
    }

    // Password validation
    if (pass.value.length < 6) {
        showError('pass-error', "Password harus lebih dari 6 karakter");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = pass;
    }

    // Confirm password validation
    if (pass.value !== cpass.value) {
        showError('cpass-error', "Password tidak sama");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = cpass;
    }

    // Nama Orang Tua/Wali validation
    if (namaOrtu.value.trim() === '') {
        showError('namaOrtu-error', "Nama orang tua atau wali harus diisi");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = namaOrtu;
    }

    // No HP Orang Tua validation
    if (!validatePhone(noHpOrtu.value)) {
        showError('noHpOrtu-error', "Nomor HP orang tua atau wali tidak valid");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = noHpOrtu;
    }

    // Nama validation
    if (nama.value.trim() === '') {
        showError('nama-error', "Nama lengkap harus diisi");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = nama;
    }

    // Asal Sekolah validation
    if (asalSekolah.value.trim() === '') {
        showError('asalSekolah-error', "Asal sekolah harus diisi");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = asalSekolah;
    }

    // No HP validation
    if (!validatePhone(phone.value)) {
        showError('phone-error', "Nomor HP tidak valid");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = phone;
    }

    // If form is valid, submit it
    if (isValid) {
        this.submit();
    } else if (firstInvalidInput) {
        // Locate the index of the fieldset containing the first invalid input
        const fieldsetIndex = $("fieldset").index(firstInvalidInput.closest('fieldset'));
        
        // Show the fieldset containing the first invalid input
        showFieldset(fieldsetIndex);

        // Scroll to the first invalid input and focus on it
        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidInput.focus();
    }
});

// Function to display error messages
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.style.display = 'block';
    errorElement.textContent = message;
}

// Function to show a specific fieldset based on index and update progress bar
function showFieldset(index) {
    $("fieldset").each(function(i) {
        // Show only the target fieldset
        $(this).css({
            'display': i === index ? 'block' : 'none', // Show only the target fieldset
            'opacity': '', // Reset opacity to default
            'transform': '', // Reset transform to default
            'position': '' // Reset position to default
        });
    });
    
    // Update the progress bar
    $("#progressbar li").each(function(i) {
        if (i <= index) {
            $(this).addClass("active"); // Add active class up to the current index
        } else {
            $(this).removeClass("active"); // Remove active class beyond the current index
        }
    });
}

// Helper function to validate email
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
}

// Helper function to validate phone number (Indonesia format)
function validatePhone(phone) {
    const re = /^08\d{8,11}$/; // Starts with 08, followed by 8-11 digits
    return re.test(phone);
}
