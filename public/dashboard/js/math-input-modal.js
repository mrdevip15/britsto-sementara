var form = document.getElementById('formsoal');
// handler for quilljs
// I use header instead font sizes, thats why this code is here commented --> uncomment 3 baris di bawah
// const Size = Quill.import('attributors/style/size');
// Size.whitelist = ['small', 'medium', 'large', 'huge']; // Add your desired font sizes
// Quill.register(Size, true);

// Initialize Multiple Quill Editors
const editorIDs = ['editorSoalContent', 'editorA', 'editorB', 'editorC', 'editorD', 'editorE', 'editorPembahasan'];
const quillInstances = {};

const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'], // Text styling
    [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Lists
    [{ header: [1, 2, false] }], // Header
    [{ 'script': 'sub' }, { 'script': 'super' }], // Subscript/Superscript
    [{ 'align': [] }], // Alignment
    ['link', 'image', 'code-block'], // Links, Images, Code blocks
    ['clean', 'formula'], // Remove formatting
    ['table'], // Table option
    [{ 'delete-table': 'Delete Table' }] // Custom button for Delete Table
];

// Custom handler for the Delete Table button
const deleteTableHandler = () => {
    const quill = quillInstances[currentEditorID];
    const range = quill.getSelection();
    if (!range) return;

    const [table] = quill.scroll.descendant(TableBlot, range.index);
    if (table) {
        quill.deleteText(table.offset(quill.scroll), table.length());
    }
};

// Add the handler to the toolbar options
const toolbarHandlers = {
    'delete-table': deleteTableHandler,
};

// Initialize Quill editors
editorIDs.forEach(editorID => {
    const quill = new Quill(`#${editorID}`, {
        theme: 'snow',
        modules: {
            toolbar: {
                container: toolbarOptions,
                handlers: {
                    formula: () => openMathInputModal(editorID),
                    image: () => imageUploadHandler(editorID)
                }
            },
            table: true,
            clipboard: {
                // Allow all HTML tags and attributes to be copied
                allowed: {
                    tags: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'sub', 'sup', 'span', 'div'],
                    attributes: ['href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class', 'data-width', 'colspan', 'rowspan']
                },
                // Keep formatting when pasting
                keepSelection: true,
                substituteBlockElements: false,
                magicPasteLinks: true,
                // Custom matchers for better paste handling
                matchers: [
                    // Preserve text formatting
                    [Node.ELEMENT_NODE, function(node, delta) {
                        // Keep bold formatting
                        if (node.style.fontWeight === 'bold' || node.tagName === 'STRONG' || node.tagName === 'B') {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.attributes = op.attributes || {};
                                    op.attributes.bold = true;
                                }
                            });
                        }
                        // Keep italic formatting
                        if (node.style.fontStyle === 'italic' || node.tagName === 'EM' || node.tagName === 'I') {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.attributes = op.attributes || {};
                                    op.attributes.italic = true;
                                }
                            });
                        }
                        // Keep underline formatting
                        if (node.style.textDecoration && node.style.textDecoration.includes('underline') || node.tagName === 'U') {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.attributes = op.attributes || {};
                                    op.attributes.underline = true;
                                }
                            });
                        }
                        // Keep strikethrough formatting
                        if (node.style.textDecoration && node.style.textDecoration.includes('line-through') || node.tagName === 'S' || node.tagName === 'STRIKE') {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.attributes = op.attributes || {};
                                    op.attributes.strike = true;
                                }
                            });
                        }
                        // Keep subscript and superscript
                        if (node.tagName === 'SUB') {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.attributes = op.attributes || {};
                                    op.attributes.script = 'sub';
                                }
                            });
                        }
                        if (node.tagName === 'SUP') {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.attributes = op.attributes || {};
                                    op.attributes.script = 'super';
                                }
                            });
                        }
                        return delta;
                    }]
                ]
            }
        }
    });
    quillInstances[editorID] = quill;
    
    // Enhanced clipboard handling for better copy/paste experience
    quill.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            // Ensure MathJax re-renders any mathematical content after paste
            setTimeout(() => {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    MathJax.typesetPromise([quill.root]).catch(err => console.log('MathJax render error:', err));
                }
            }, 100);
        }
    });
    
    // Handle paste events to preserve additional formatting
    quill.root.addEventListener('paste', function(e) {
        // Allow the default paste to happen first, then clean up if needed
        setTimeout(() => {
            // Re-apply any formatting that might have been lost
            const content = quill.root.innerHTML;
            if (content) {
                // Trigger MathJax rendering for any mathematical content
                if (window.MathJax && window.MathJax.typesetPromise) {
                    MathJax.typesetPromise([quill.root]).catch(err => console.log('MathJax render error:', err));
                }
            }
        }, 50);
    });
    
    // Store table module instance
    const tableModule = quill.getModule('table');
    if (!window.tableModules) window.tableModules = {};
    window.tableModules[editorID] = tableModule;
    
    // Add a small delay to ensure the editor content is fully loaded
    setTimeout(() => {
        applyStoredImageWidths(quill);
    }, 100);
});

const mathInputModal = document.getElementById('math-input-modal');
const mathInput = document.getElementById('math-input');
const mathPreview = document.getElementById('math-preview');
let currentEditorID = null;
let lastSelection = {}; // Track the last known selection per editor

// Open the Math Input Modal
function openMathInputModal(editorID) {
    currentEditorID = editorID;
    mathInput.value = '';
    mathInput.style.height = "80px";
    mathPreview.innerHTML = '';
    mathInputModal.style.display = 'block';
    lastSelection[editorID] = quillInstances[editorID].getSelection();
    symbolSidebar.style.display = 'none'; // Hide sidebar
    mathInputModal.style.width = '616px'; // Reset modal width
}

// Close the Math Input Modal
function closeMathInputModal() {
    mathInputModal.style.display = 'none';
    currentEditorID = null;
    console.log('Modal closed.');
}

// Render Math Preview using MathJax
function renderMathPreview() {
    mathPreview.innerHTML = mathInput.value; // Set preview content
    MathJax.typesetPromise([mathPreview]) // Render using MathJax
        .then(() => console.log('Math preview rendered'))
        .catch(err => console.error('MathJax rendering error:', err));
}

// Handle Formula Insertion
document.querySelector('#math-input-modal .save').addEventListener('click', () => {
    const formula = mathInput.value.trim(); // Get LaTeX input

    if (formula && currentEditorID) {
        let quill = quillInstances[currentEditorID];
        let range = lastSelection[currentEditorID];

        if (!range) {
            // If range is null, default to the end of the content
            range = { index: quill.getLength(), length: 0 };
        }

        // Insert the plain text into the Quill editor
        quill.insertText(range.index, formula);

        // Move cursor after the inserted text
        quill.setSelection(range.index + formula.length);

    }

    closeMathInputModal(); // Close the modal
});

// Cancel Button Logic
document.querySelector('#math-input-modal .cancel').addEventListener('click', closeMathInputModal);

// Track the last known selection for each editor
Object.keys(quillInstances).forEach(editorID => {
    quillInstances[editorID].on('selection-change', (range) => {
        if (range) {
            lastSelection[editorID] = range; // Save the current selection
            console.log(`Selection updated for ${editorID}:`, lastSelection[editorID]);
        } else {
            console.log(`Selection lost for ${editorID}.`);
        }
    });
});

// Add event listener for live MathJax rendering
mathInput.addEventListener('input', renderMathPreview);

// Add these new functions for table manipulation
function handleTableAction(action) {
    if (!currentEditorID) return;
    
    const tableModule = window.tableModules[currentEditorID];
    if (!tableModule) return;
    
    switch (action) {
        case 'insert-row-above':
            tableModule.insertRowAbove();
            break;
        case 'insert-row-below':
            tableModule.insertRowBelow();
            break;
        case 'insert-column-left':
            tableModule.insertColumnLeft();
            break;
        case 'insert-column-right':
            tableModule.insertColumnRight();
            break;
        case 'delete-row':
            tableModule.deleteRow();
            break;
        case 'delete-column':
            tableModule.deleteColumn();
            break;
        case 'delete-table':
            tableModule.deleteTable();
            break;
    }
}


// Add this function to handle table deletion
function deleteTable(editorID) {
    const quill = quillInstances[editorID];
    const range = quill.getSelection();
    if (!range) return;

    const [table] = quill.scroll.descendant(TableBlot, range.index);
    if (table) {
        quill.deleteText(table.offset(quill.scroll), table.length());
    }
}
