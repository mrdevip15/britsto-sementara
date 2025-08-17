let currentNumber = 0

function disableContentCopying() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Disable text selection (already handled in CSS)

    // Disable keyboard shortcuts for copying
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
        }
    });
}

// Call the function to apply the protections
disableContentCopying();




function ragu() {
    // Get the current question number (num) from currentNumber
    const num = currentNumber + 1;

    // Get all question boxes
    const kotakSoalElements = document.querySelectorAll('.kotak-soal');

    // Ensure the number is within the valid range
    if (num >= 1 && num <= kotakSoalElements.length) {
        const kotakSoal = kotakSoalElements[num - 1]; // Get the corresponding question box

        // Toggle the 'ragu' class
        kotakSoal.classList.toggle('ragu');

        // Retrieve the existing ragu data from localStorage
        let raguList = JSON.parse(localStorage.getItem("raguList")) || [];

        // Update the raguList in localStorage
        if (kotakSoal.classList.contains('ragu')) {
            // Add the question number if it's marked as unsure
            if (!raguList.includes(num)) {
                raguList.push(num);
            }
        } else {
            // Remove the question number if it's no longer marked as unsure
            raguList = raguList.filter((item) => item !== num);
        }

        // Save the updated list back to localStorage
        localStorage.setItem("raguList", JSON.stringify(raguList));
    }
}
function loadRaguData() {
    // Retrieve the ragu list from localStorage
    const raguList = JSON.parse(localStorage.getItem("raguList")) || [];

    // Apply the 'ragu' class to the corresponding question boxes
    const kotakSoalElements = document.querySelectorAll('.kotak-soal');
    raguList.forEach((num) => {
        if (num >= 1 && num <= kotakSoalElements.length) {
            kotakSoalElements[num - 1].classList.add('ragu');
        }
    });
}

// Call this function when the page loads
loadRaguData();

function highlightCurrentNumber(currentNumber) {
    currentNumber +=1
    // Get all elements with the class 'kotak-soal'
    const kotakSoalElements = document.querySelectorAll('.kotak-soal');

    // Remove 'selected' class from all elements
    kotakSoalElements.forEach((element) => {
        element.classList.remove('soal-selected');
    });

    // Add 'selected' class to the current element
    if (currentNumber >= 1 && currentNumber <= kotakSoalElements.length) {
        kotakSoalElements[currentNumber - 1].classList.add('soal-selected'); // Index is currentNumber - 1
    }
}


// We will update jawaban local to the one we have in server each page is loaded
const saveJawabanToLocalStorage = (examId, jawaban) => {
    // Retrieve all stored exams
    let exams = JSON.parse(localStorage.getItem('jawaban')) || {};

    // Update the specific exam's answers
    exams[examId] = jawaban;

    // Save back to localStorage
    localStorage.setItem('jawaban', JSON.stringify(exams));
};

const getJawabanFromLocalStorage = (examId) => {
    // Retrieve all stored exams
    const exams = JSON.parse(localStorage.getItem('jawaban')) || {};

    // Return the answers for the specific exam or an empty array if not found
    return exams[examId] || [];
};

const updateJawaban = (examId, no, answer) => {
    // Get current answers for the specific exam
    let jawaban = getJawabanFromLocalStorage(examId);

    // Check if the answer for the given question number exists
    const index = jawaban.findIndex((item) => item.no === no);
 
    if (index !== -1) {
        // Update the existing answer
        jawaban[index].answer = answer;
    } else {
        // Add a new answer
        jawaban.push({ no, answer });
    }

    // Save the updated answers back to localStorage
    saveJawabanToLocalStorage(examId, jawaban);
};

const clearJawabanForExam = (examId) => {
    // Retrieve all exams
    let exams = JSON.parse(localStorage.getItem('jawaban')) || {};

    // Remove the specific exam's answers
    delete exams[examId];

    // Save back to localStorage
    localStorage.setItem('jawaban', JSON.stringify(exams));
};

const checkAndInitializeJawaban = (examId) => {
    // Retrieve all exams
    let exams = JSON.parse(localStorage.getItem('jawaban')) || {};

    // If the specific exam's answers don't exist, create an empty array
    if (!exams[examId]) {
        exams[examId] = [];

        localStorage.setItem('jawaban', JSON.stringify(exams));
   
    } else {
        console.log(`Jawaban for examId ${examId} already exists!`);
    }
};


// Call the function to check and initialize
checkAndInitializeJawaban(examId);
 


function updateOpsi(num) {
    // Get answers for the current exam
    let jawaban = getJawabanFromLocalStorage(examId);
    const currentAnswer = jawaban.find((item) => item.no == num + 1);

    // Uncheck/clear all inputs
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false;
    });
    
    // Clear isian input - safer approach
    const isianInput = document.getElementById('isianJawaban');
    if (isianInput) {
        isianInput.value = '';
    }

    if (currentAnswer) {
        const question = questions[num];
        
        if (question.tipeOpsi === "pgbiasa") {
            // Handle pgbiasa answers
            ['a', 'b', 'c', 'd', 'e'].forEach((key) => {
                const checkbox = document.querySelector(`input[name="opsi"][value="${key}"]`);
                if (currentAnswer.answer.includes(key) && checkbox) {
                    checkbox.checked = true;
                }
            });
        } else if (question.tipeOpsi === "pgkompleks1" || question.tipeOpsi === "pgkompleks2") {
            // Handle pgkompleks answers
            ['a', 'b', 'c', 'd', 'e'].forEach((key) => {
                const keyMatches = currentAnswer.answer.match(new RegExp(`${key}\\d`, 'g')) || [];
                keyMatches.forEach((match) => {
                    const checkbox = document.querySelector(`#${match.toUpperCase()}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            });
        } else if (question.tipeOpsi === "isian") {
            // Handle isian answers
            const isianInput = document.getElementById('isianJawaban');
            if (isianInput) {
                isianInput.value = currentAnswer.answer;
            }
        }
    }
}

function waktuHabis() {
        console.log("Exam Finished - Time's up!");
        localStorage.removeItem("raguList");
        
        // Remove event listeners and clear timer
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (window.examTimer) {
            clearInterval(window.examTimer);
        }

        // Show completion alert and redirect
        Swal.fire({
            title: 'Waktu Habis!',
            text: 'Ujian telah selesai karena waktu telah habis',
            icon: 'info',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.href = window.location.href.replace("ujian", "selesai");
        });
        return;
}
function finishUjian() {
    // Show confirmation dialog first
    Swal.fire({
        title: 'Selesaikan Ujian?',
        text: 'Pastikan semua jawaban sudah terisi. Anda tidak dapat kembali ke ujian setelah menyelesaikannya.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Selesaikan!',
        cancelButtonText: 'Kembali ke Ujian'
    }).then((result) => {
        if (result.isConfirmed) {
            console.log("Exam Finished!");
            localStorage.removeItem("raguList");
            
            // Remove event listeners and clear timer
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (window.examTimer) {
                clearInterval(window.examTimer);
            }

            // Show completion alert and redirect
            Swal.fire({
                title: 'Ujian Selesai!',
                text: 'Terima kasih telah mengikuti ujian',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = window.location.href.replace("ujian", "selesai");
                console.log("Exam Finished!");
                localStorage.removeItem("raguList");
                
                // Remove event listeners and clear timer
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                if (window.examTimer) {
                    clearInterval(window.examTimer);
    }
            });
        }
    });
}


function updateToFinishButton() {
    const buttonNext = document.getElementById("nextSoal");
    buttonNext.innerHTML = `<span class="d-none d-sm-inline-block">Selesai Ujian</span> <i class="fa fa-check-circle"></i>`;
    buttonNext.classList.remove("btn-orange");
    buttonNext.classList.add("btn-success");
    buttonNext.onclick = finishUjian; // Set the new function to Selesai Ujian
}

function resetToNextButton() {
    const buttonNext = document.getElementById("nextSoal");
    buttonNext.innerHTML = `<span class="d-none d-sm-inline-block">Selanjutnya</span> <i class="fa fa-chevron-circle-right"></i>`;
    buttonNext.classList.remove("btn-success");
    buttonNext.classList.add("btn-orange");
    buttonNext.onclick = nextSoal; // Reset to call nextSoal function
}

function updateSoal(num) {
    // Update the question number display
    document.getElementById("noSoal").innerHTML = num + 1;

    // Handle the "Previous" and "Next" button states
    let buttonPrev = document.getElementById("prevSoal");
    let buttonNext = document.getElementById("nextSoal");
    if (num === 0) {
        buttonPrev.disabled = true;
    } else {
        buttonPrev.disabled = false;
    }
    if (num >= questions.length - 1) {
       updateToFinishButton()
    } else {
        resetToNextButton()
    }

    // Get the current question
    let question = questions[num];

    // Hide all answer type containers first
    document.getElementById("pgkompleks").style.display = "none";
    document.getElementById("pgbiasa").style.display = "none";
    document.getElementById("isian").style.display = "none";

    if (question.tipeOpsi === "pgbiasa") {
        // Handle "pgbiasa" type questions
        document.getElementById("pgbiasa").style.display = "block";

        ['a', 'b', 'c', 'd', 'e'].forEach((key) => {
            let optionContent = question.options[key]; // Get the option content
            let optionContainer = document.querySelector(`#opsi${key.toUpperCase()}`); // Target the <div> inside the table cell
            let checkbox = document.querySelector(`input[name="opsi"][value="${key}"]`); // Target the corresponding checkbox

            // Update the content and show/hide the row based on availability
            if (optionContent) {
                optionContainer.innerHTML = optionContent;
                checkbox.closest('tr').style.display = ""; // Show the row
            } else {
                checkbox.closest('tr').style.display = "none"; // Hide the row
            }
            console.log(optionContent)
            if (optionContent == "<p><br></p>"){
                checkbox.closest('tr').style.display = "none";
            }
        });
    } else if (question.tipeOpsi === "pgkompleks1" || question.tipeOpsi === "pgkompleks2") {
        if (question.tipeOpsi === "pgkompleks1"){
            document.getElementById("kbenar").innerHTML = "Benar";
            document.getElementById("ksalah").innerHTML = "Salah";
        } else {
            document.getElementById("kbenar").innerHTML = "Memperlemah";
            document.getElementById("ksalah").innerHTML = "Tidak Memperlemah";
        }
        // Handle "pgkompleks" type questions
        document.getElementById("pgkompleks").style.display = "block";

        ['a', 'b', 'c', 'd', 'e'].forEach((key) => {
            let optionContent = question.options[key]; // Get the option content
            let label = document.getElementById(`k${key}_label`); // Target the corresponding label
            let row = document.getElementById(`pilihanK${key}`); // Target the row

            // Update the content and show/hide the row based on availability
            if (optionContent) {
                label.innerHTML = optionContent;
                row.style.display = "table-row"; // Show the row
            } else {
                row.style.display = "none"; // Hide the row
            }
            console.log(optionContent)
            if (optionContent == "<p><br></p>"){
                row.style.display = "none";
            } 
        });
    } else if (question.tipeOpsi === "isian") {
        // Handle "isian" type questions
      
        document.getElementById("isian").style.display = "block";
        updateIsianHint();
    }

    // Set the question content
    let questionContainer = document.querySelector(`#question-container`);
    try {
        questionContainer.innerHTML = question.content;
    } catch (error) {
        console.log("Error setting question content:", error.message);
        // Fallback to text content if innerHTML fails
        questionContainer.textContent = question.content || "Error loading question content";
    }
 
    // Update options and highlight the current question
    updateOpsi(num);
    highlightCurrentNumber(num);
    try {
        MathJax.typeset(); 
    } catch (error) {
        console.log("MathJax rendering error:", error.message);
        // Retry rendering the question
        setTimeout(() => {
            updateSoal(currentNumber);
        }, 100);
    }
 
    // Update the hint after setting the question content
   
    
}

function nextSoal() {
    currentNumber += 1
    updateSoal(currentNumber)


}
function prevSoal() {
    currentNumber -= 1
    updateSoal(currentNumber)

}
async function saveAnswer(kodekategori, no, answer) {
    try {
      const response = await fetch('/user/save-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kodekategori, no, answer }),
      });
  
      const result = await response.json();
      if (response.ok) {
        updateJawaban(kodekategori, no, answer);
        loadJawabanData();
        console.log('Answer saved successfully:', result.answers);
      } else {
        Swal.fire({
            title: 'Error!',
            text: 'Terjadi masalah, silahkan login ulang',
            icon: 'error',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.reload();
        });
      }
 
    } catch (error) {
      Swal.fire({
            title: 'Error!',
            text: 'Terjadi masalah, silahkan login ulang',
            icon: 'error',
            confirmButtonText: 'OK'
        }).then(() => {
            window.location.reload();
        });
      
    }
  }
// Checkbox logic
// Automatically detect all checkbox groups by their `name` attribute
const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');

// Define the maximum selectable checkboxes for each group dynamically
const maxSelectable = {
  answerA: 1, // Max 2 checkboxes for group answerA
  answerB: 1, // Max 1 checkbox for group answerB
  answerC: 1, // Max 3 checkboxes for group answerC
  answerD: 1, // Max 2 checkboxes for group answerD
  answerE: 1,  // Max 1 checkbox for group answerE,
  opsi: 1
};

// Group checkboxes by their `name`
const groups = {};

allCheckboxes.forEach((checkbox) => {
  const name = checkbox.getAttribute('name');

  if (!groups[name]) {
    groups[name] = []; // Initialize the group if it doesn't exist
  }

  groups[name].push(checkbox);
});


Object.keys(groups).forEach(groupName => {
    const groupCheckboxes = groups[groupName];
    const max = maxSelectable[groupName] || groupCheckboxes.length; // Default to all if not specified
  
    groupCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', function () {
        // Get the currently checked checkboxes in the group
        const checkedBoxes = groupCheckboxes.filter(cb => cb.checked);
  
        if (max === 1) {
          // Logic when max is 1: Check the current box and uncheck others
          if (this.checked) {
            groupCheckboxes.forEach(cb => {
              if (cb !== this) cb.checked = false; // Uncheck other boxes
            });
          }
        } else {
          // Logic for max > 1: Allow up to the maximum number of checkboxes
          if (checkedBoxes.length > max) {
            const lastCheckedBox = checkedBoxes.reverse().find(cb => cb !== this);
            if (lastCheckedBox) {
              lastCheckedBox.checked = false; // Uncheck the last checked box
            }
          }
          
        }
      });
    });
});
  
// Function to collect selected checkbox values and update the result dynamically.
let currentJawaban = ''
function pgKompleksListener() {
    // Select all checkboxes with a name that starts with "answer"
    const checkboxes = document.querySelectorAll('input[name^="answer"]:checked');
  
    // Collect the `value` of each selected checkbox in sequence
    const selectedValues = Array.from(checkboxes).map(cb => cb.value).join('');
  
    // Update the display or save the result
    const resultElement = document.getElementById('selectedValues');
    if (resultElement) {
      resultElement.textContent = `Selected Values: ${selectedValues}`;
    }
  
    console.log(selectedValues); // Log the sequence
    currentJawaban = selectedValues;
    saveAnswer(examId, currentNumber+1, currentJawaban);
  
  }
  
  // Attach event listeners to all checkboxes
document.querySelectorAll('input[name^="answer"]').forEach(checkbox => {
    checkbox.addEventListener('change', pgKompleksListener);
});

function pgBiasaListener() {
    // Select all checkboxes (or radio buttons) in the "pgbiasa" group
    const checkboxes = document.querySelectorAll('input[name="opsi"]:checked');
  
    // Collect the `value` of the selected checkbox
    const selectedValue = checkboxes.length > 0 ? checkboxes[0].value : '';
  
    // Update the display or save the result
    const resultElement = document.getElementById('selectedValues');
    if (resultElement) {
        resultElement.textContent = `Selected Value: ${selectedValue}`;
        console.log(selectedValue)
    }
    currentJawaban = selectedValue
    
    console.log(selectedValue); // Log the selected value
    saveAnswer(examId, currentNumber+1, currentJawaban);
 
}
  
// Attach event listeners to all checkboxes in "pgbiasa"
document.querySelectorAll('input[name="opsi"]').forEach(checkbox => {
    checkbox.addEventListener('change', pgBiasaListener);
});


function updateSoalNumber(element){
    currentNumber = Number(element.innerText)-1
    updateSoal(currentNumber)
}

// Default font size
let currentFontSize = 16; // Set the initial font size (in pixels)
const minFontSize = 10; // Minimum font size
const maxFontSize = 36; // Maximum font size

// Function to increase font size
function increaseFontSize() {
    if (currentFontSize < maxFontSize) {
        currentFontSize += 2; // Increase font size by 2px
        document.getElementById('question-container').style.fontSize = `${currentFontSize}px`;
        document.getElementById('pgkompleks').style.fontSize = `${currentFontSize}px`;
        document.getElementById('pgbiasa').style.fontSize = `${currentFontSize}px`;
    } else {
        console.log('Maximum font size reached');
    }
}

// Function to decrease font size
function decreaseFontSize() {
    if (currentFontSize > minFontSize) {
        currentFontSize -= 2; // Decrease font size by 2px
        document.getElementById('question-container').style.fontSize = `${currentFontSize}px`;
        document.getElementById('pgkompleks').style.fontSize = `${currentFontSize}px`;
        document.getElementById('pgbiasa').style.fontSize = `${currentFontSize}px`;
    } else {
        console.log('Minimum font size reached');
    }
}
updateSoal(currentNumber)
function loadJawabanData() {
    // Retrieve the answers for the current exam from localStorage
    const jawabanList = getJawabanFromLocalStorage(examId);

    // Get all question boxes
    const kotakSoalElements = document.querySelectorAll('.kotak-soal');

    // Loop through each question box and check if it's answered
    kotakSoalElements.forEach((kotakSoal, index) => {
        const questionNumber = index + 1; // Questions are 1-based indexed
        const isAnswered = jawabanList.some((item) => item.no === questionNumber && item.answer !== "");

        // Add or remove the 'answered' class
        if (isAnswered) {
            kotakSoal.classList.add('answered');
        } else {
            kotakSoal.classList.remove('answered');
        }
    });
}

// Call this function to load the answered data when the page loads
loadJawabanData();

// Add event listener for isian type
document.getElementById('isianJawaban')?.addEventListener('change', function() {
    currentJawaban = this.value.trim().toLowerCase(); // Store trimmed and lowercase answer
    saveAnswer(examId, currentNumber+1, currentJawaban);
});

let switchCount = 0; // Counter for tab switches
const maxSwitches = 5; // Maximum allowed tab switches

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        remainingSeconds.toString().padStart(2, '0')
    ].join(':');
}

function startTimer(durationInMinutes) {
    const storageKey = `examEnd_${examId}`;
    let endTime = localStorage.getItem(storageKey);
    
    // If no end time is set, calculate and store it
    if (!endTime) {
        endTime = Date.now() + (durationInMinutes * 60 * 1000);
        localStorage.setItem(storageKey, endTime);
    }

    function updateTimer() {
        const now = Date.now();
        const timeLeft = Math.max(0, endTime - now);
        
        if (timeLeft <= 0) {
            localStorage.removeItem(storageKey);
            waktuHabis();
             // Call existing finishUjian function
         

            return;
        }

        // Update display
        const totalSeconds = Math.floor(timeLeft / 1000);
        const timerDisplay = document.querySelector('.col-sm-4.text-right .text-left div:last-child');
        timerDisplay.textContent = formatTime(totalSeconds);
    }

    // Update immediately and then every second
    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    // Store timer reference
    window.examTimer = timer;
}

// Initialize timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    const duration = parseInt(durasi); // Use the durasi value from your EJS template
    startTimer(duration);
});

// Clear timer on page unload
window.addEventListener('beforeunload', () => {
    if (window.examTimer) {
        clearInterval(window.examTimer);
    }
});

// Anti-cheat functionality
function handleVisibilityChange() {
    if (document.hidden) {
        switchCount++;
        if (switchCount >= maxSwitches) {
            Swal.fire({
                title: 'Peringatan!',
                text: 'Anda telah melebihi batas maksimal perpindahan tab. Ujian akan dihentikan.',
                icon: 'warning',
                confirmButtonText: 'OK'
            }).then(() => {
                disqualifyUser();
            });
        } else {
            Swal.fire({
                title: 'Peringatan!',
                text: `Anda telah berpindah tab ${switchCount} kali dari ${maxSwitches} yang diizinkan.`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    }
}

// Function to disqualify the user
async function disqualifyUser() {
    try {
        const response = await fetch(`/user/disqualify/${examId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ examId })
        });

        if (response.ok) {
            Swal.fire({
                title: 'Diskualifikasi',
                text: 'Anda telah didiskualifikasi dari ujian ini.',
                icon: 'error',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = '/user/dashboard';
            });
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Gagal mendiskualifikasi. Silakan hubungi support.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Error disqualifying user:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Terjadi kesalahan saat mencoba mendiskualifikasi.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// Attach the visibility change event listener
document.addEventListener('visibilitychange', handleVisibilityChange);

// Function to update the hint for the isian input
function detectWrappedText(input) {
    const regex = /\(\((.*?)\)\)/g;
    let matches = [];
    let match;

    // Use regex to find all occurrences of text wrapped in (())
    while ((match = regex.exec(input)) !== null) {
        matches.push(match[1]);  // Capture the text inside (())
    }

    // Remove the original wrapped text ((...)) from the input
    const cleanText = input.replace(/\(\(.*?\)\)/g, '');

    // Return both the extracted text and the cleaned input (without the wrapped text)
    return { hint: matches[0], cleanText: cleanText.trim() };
}

function updateIsianHint() {
    const currentQuestion = questions[currentNumber]; // Get the current question
    const soalContent = currentQuestion.content; // Get the content of the current question
    const { hint, cleanText } = detectWrappedText(soalContent); // Extract the hint and clean text

    console.log(hint);

    const isianHintElement = document.getElementById('isian-hint');
    if (isianHintElement) {
        isianHintElement.textContent = hint ? hint : 'Masukkan jawaban dengan ejaan yang tepat';
    }

    // Update the HTML content of the question (remove the wrapped text)
    const questionElement = document.getElementById('question-container').querySelector('p');
    if (questionElement) {
        questionElement.innerHTML = cleanText; // Update the content without wrapped text
    }
}

// Add this function near your other timer-related code
function updateExamScheduleTimer(startDate, endDate) {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    // Update timer every second
    const timer = setInterval(() => {
        const currentTime = new Date().getTime();
        let distance;
        let message;

        if (currentTime < start) {
            // Count down to start
            distance = start - currentTime;
            message = 'Ujian dimulai dalam: ';
        } else if (currentTime > end) {
            // Exam has ended
            clearInterval(timer);
            message = 'Ujian telah berakhir';
            return;
        } else {
            // Count down to end
            distance = end - currentTime;
            message = 'Ujian berakhir dalam: ';
        }

        // Time calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the countdown
        const timerDisplay = document.querySelector('.col-sm-4.text-right .text-left div:last-child');
        if (timerDisplay) {
            timerDisplay.textContent = `${message}${days}d ${hours}h ${minutes}m ${seconds}s`;
        }

        // If the countdown is finished, redirect to dashboard
        if (distance < 0) {
            clearInterval(timer);
            window.location.href = '/user/dashboard';
        }
    }, 1000);
}

// Call this function when the page loads if needed
// You'll need to pass the dates from your EJS template
