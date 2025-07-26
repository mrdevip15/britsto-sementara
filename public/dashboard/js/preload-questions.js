// Preload existing content from <textarea> into Quill editors

quillInstances.editorSoalContent.root.innerHTML = document.getElementById('soalContent').value;
quillInstances.editorA.root.innerHTML = document.getElementById('pilihanA').value;
quillInstances.editorB.root.innerHTML = document.getElementById('pilihanB').value;
quillInstances.editorC.root.innerHTML = document.getElementById('pilihanC').value;
quillInstances.editorD.root.innerHTML = document.getElementById('pilihanD').value;
quillInstances.editorE.root.innerHTML = document.getElementById('pilihanE').value;

// Synchronize Quill content to <textarea> on form submission
document.getElementById('formsoal').onsubmit = function () {
    document.getElementById('soalContent').value = quillInstances.editorSoalContent.root.innerHTML;
    document.getElementById('pilihanA').value = quillInstances.editorA.root.innerHTML;
    document.getElementById('pilihanB').value = quillInstances.editorB.root.innerHTML;
    document.getElementById('pilihanC').value = quillInstances.editorC.root.innerHTML;
    document.getElementById('pilihanD').value = quillInstances.editorD.root.innerHTML;
    document.getElementById('pilihanE').value = quillInstances.editorE .root.innerHTML;
};
