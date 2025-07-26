document.addEventListener('DOMContentLoaded', function() {
    const tipeSoalSelect = document.getElementById('tipeSoal');
    const answerContainer = document.getElementById('answerContainer');
    const initialAnswer = document.getElementById('initialAnswer').value;
    
    function updateAnswerInput() {
        const selectedType = tipeSoalSelect.value;
        const currentAnswer = document.querySelector('input[name="answer"]')?.value || 
                            document.querySelector('select[name="answer"]')?.value || 
                            initialAnswer;
        
        if (selectedType === 'pgkompleks1') { 
            answerContainer.innerHTML = `
                <input type="text" 
                       class="form-control" 
                       name="answer" 
                       value="${currentAnswer || ''}"
                       placeholder="Format: a1b2c1d1e1"
                       pattern="[a-e][1-2]([a-e][1-2])*">
                <small class="text-muted">Format: a1b2c1 (huruf kecil diikuti angka 1 atau 2)</small>
            `;
        }  else if (selectedType === 'pgkompleks2') {
            answerContainer.innerHTML = `
                <input type="text" 
                       class="form-control" 
                       name="answer" 
                       value="${currentAnswer || ''}"
                       placeholder="Masukkan kunci jawaban">
                <small class="text-muted">Format: a1b2c1 (huruf kecil diikuti angka 1 atau 2)</small>
            `;
        }
        else if (selectedType === 'isian') {
            answerContainer.innerHTML = `
                <input type="text" 
                       class="form-control" 
                       name="answer" 
                       value="${currentAnswer || ''}"
                       placeholder="Masukkan kunci jawaban">
                <small class="text-muted">Masukkan jawaban yang benar (case sensitive)</small>
            `;
        } else {
            // Regular multiple choice
            answerContainer.innerHTML = `
                <select class="form-select" name="answer">
                    <option value="a" ${currentAnswer === 'a' ? 'selected' : ''}>A</option>
                    <option value="b" ${currentAnswer === 'b' ? 'selected' : ''}>B</option>
                    <option value="c" ${currentAnswer === 'c' ? 'selected' : ''}>C</option>
                    <option value="d" ${currentAnswer === 'd' ? 'selected' : ''}>D</option>
                    <option value="e" ${currentAnswer === 'e' ? 'selected' : ''}>E</option>
                </select>
            `;
        }
    }

    // Update on page load
    updateAnswerInput();

    // Update when tipeSoal changes
    tipeSoalSelect.addEventListener('change', updateAnswerInput);
}); 