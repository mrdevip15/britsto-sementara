    const insertTemplate = (template, cursorOffset = 0) => {
        const input = mathInput;
        const startPos = input.selectionStart; // Current cursor position
        const endPos = input.selectionEnd;

        // Insert the template at the cursor position
        input.value =
            input.value.substring(0, startPos) +
            template +
            input.value.substring(endPos);

        // Move the cursor inside the template if applicable
        const newCursorPosition = startPos + cursorOffset;
        input.setSelectionRange(newCursorPosition, newCursorPosition);

        // Trigger rendering of the updated preview
        renderMathPreview();
    };
    const addSymbolListener = (buttonId, template, cursorOffset) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                insertTemplate(template, cursorOffset);
            });
        } else {
            console.warn(`Button with ID "${buttonId}" not found.`);
        }
    };
  
    const buttonConfig = [
        // LaTeX Helpers
        { id: 'inline-button', template: '$$', cursor: 1 },
        { id: 'block-button', template: '$$$$', cursor: 2 },
        { id: 'fraction-button', template: '\\frac{1}{2}', cursor: 6 },
        { id: 'superscript-button', template: '^{2}', cursor: 2 },
        { id: 'subscript-button', template: '_{i}', cursor: 2 },
        { id: 'integral-button', template: '\\int_{x}^{y}', cursor: 5 },
        { id: 'matrix-button', template: '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}', cursor: 14 },
        { id: 'brackets-button', template: '\\left(\\right)', cursor: 6 },
        { id: 'log-button', template: '^{10}{\log x}', cursor: 12 },
        // General Symbols
        { id: 'neq-button', template: '\\neq', cursor: 4 },
        { id: 'leq-button', template: '\\leq', cursor: 4 },
        { id: 'geq-button', template: '\\geq', cursor: 4 },
        { id: 'sim-button', template: '\\sim', cursor: 4 },
        { id: 'approx-button', template: '\\approx', cursor: 7 },
        { id: 'simeq-button', template: '\\simeq', cursor: 6 },
        { id: 'infty-button', template: '\\infty', cursor: 6 },
        { id: 'cap-button', template: '\\cap', cursor: 4 },
        { id: 'cup-button', template: '\\cup', cursor: 4 },
        { id: 'subset-button', template: '\\subset', cursor: 7 },
        { id: 'supset-button', template: '\\supset', cursor: 7 },
        { id: 'int-button', template: '\\int', cursor: 4 },
    
        // Accent Symbols
        { id: 'hat-button', template: '\\hat{a}', cursor: 5 },
        { id: 'check-button', template: '\\check{a}', cursor: 7 },
        { id: 'tilde-button', template: '\\tilde{a}', cursor: 7 },
        { id: 'grave-button', template: '\\grave{a}', cursor: 7 },
        { id: 'acute-button', template: '\\acute{a}', cursor: 7 },
        { id: 'bar-button', template: '\\bar{a}', cursor: 6 },
        { id: 'ddot-button', template: '\\ddot{a}', cursor: 7 },
        { id: 'sqrt-button', template: '\\sqrt{x}', cursor: 7 },
        { id: 'cases-button', template: '\\begin{cases}a & x = 0\\\\b & x > 0\\end{cases}', cursor: 14 },
        { id: 'alpha-button', template: '\\alpha', cursor: 6 },
        { id: 'beta-button', template: '\\beta', cursor: 5 },
        { id: 'gamma-button', template: '\\gamma', cursor: 6 },
        { id: 'delta-button', template: '\\delta', cursor: 6 },
        { id: 'epsilon-button', template: '\\epsilon', cursor: 8 },
        { id: 'zeta-button', template: '\\zeta', cursor: 5 },
        { id: 'eta-button', template: '\\eta', cursor: 4 },
        { id: 'theta-button', template: '\\theta', cursor: 6 },
        { id: 'iota-button', template: '\\iota', cursor: 5 },
        { id: 'kappa-button', template: '\\kappa', cursor: 6 },
        { id: 'lambda-button', template: '\\lambda', cursor: 7 },
        { id: 'mu-button', template: '\\mu', cursor: 3 },
        { id: 'nu-button', template: '\\nu', cursor: 3 },
        { id: 'xi-button', template: '\\xi', cursor: 3 },
        { id: 'pi-button', template: '\\pi', cursor: 3 },
        { id: 'rho-button', template: '\\rho', cursor: 4 },
        { id: 'sigma-button', template: '\\sigma', cursor: 6 },
        { id: 'tau-button', template: '\\tau', cursor: 4 },
        { id: 'phi-button', template: '\\phi', cursor: 4 },
        { id: 'chi-button', template: '\\chi', cursor: 4 },
        { id: 'psi-button', template: '\\psi', cursor: 4 },
        { id: 'omega-button', template: '\\omega', cursor: 6 },
    
        // Trigonometric Functions
        { id: 'arccos-button', template: '\\arccos{x}', cursor: 10 },
        { id: 'arcsin-button', template: '\\arcsin{x}', cursor: 10 },
        { id: 'arctan-button', template: '\\arctan{x}', cursor: 10 },
        { id: 'cos-button', template: '\\cos{x}', cursor: 7 },
        { id: 'cosh-button', template: '\\cosh{x}', cursor: 8 },
        { id: 'cot-button', template: '\\cot{x}', cursor: 7 },
        { id: 'coth-button', template: '\\coth{x}', cursor: 8 },
        { id: 'csc-button', template: '\\csc{x}', cursor: 7 },
        { id: 'sec-button', template: '\\sec{x}', cursor: 7 },
        { id: 'sin-button', template: '\\sin{x}', cursor: 7 },
        { id: 'sinh-button', template: '\\sinh{x}', cursor: 8 },
        { id: 'tan-button', template: '\\tan{x}', cursor: 7 },
        { id: 'tanh-button', template: '\\tanh{x}', cursor: 8 }      
        
    ];
    
    // Apply listeners for all configured buttons
    buttonConfig.forEach(({ id, template, cursor }) => {
        addSymbolListener(id, template, cursor);
    });



// Toggle symbols
// Get references to the button and the sidebar
const toggleButton = document.getElementById('toggle-symbols');
const symbolSidebar = document.getElementById('symbol-sidebar');

// Add event listener to toggle the sidebar
toggleButton.addEventListener('click', () => {
    if (symbolSidebar.style.display === 'none' || symbolSidebar.style.display === '') {
        symbolSidebar.style.display = 'grid'; // Show sidebar
        mathInputModal.style.width = '846px'; // Increase modal width
    } else {
        symbolSidebar.style.display = 'none'; // Hide sidebar
        mathInputModal.style.width = '616px'; // Reset modal width
    }
}); 