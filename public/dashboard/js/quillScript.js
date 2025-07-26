function imageUploadHandler(editorId) {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");

  // Listen for file selection
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (file) {
      const quill = quillInstances[editorId]; // Get the correct editor instance

      // Ask user to confirm the desired image width before embedding
      let imageWidth = 400;
      if (imageWidth) {
        imageWidth = parseInt(imageWidth);
        if (isNaN(imageWidth) || imageWidth <= 0) {
          alert("Invalid width entered. The image will be inserted with the default width.");
          imageWidth = null; // Reset to null to use default width
        }
      }

      // Insert a placeholder image while uploading
      let range = quill.getSelection(); // Retrieve the range again to ensure it is valid
      const placeholderUrl = "/uploads/gambar/placeholder.jpg"; // Optional placeholder
      quill.insertEmbed(range.index, "image", placeholderUrl);

      try {
        // Upload the image to the server
        const uploadedImageUrl = await uploadImageToServer(file);

        // Retrieve the range again to ensure it is correct before replacing the placeholder
        range = quill.getSelection();
        if (range) {
          // Replace placeholder with the actual uploaded image URL
          quill.deleteText(range.index, 1); // Remove the placeholder

          // Insert the actual image
          const newImageBlot = quill.insertEmbed(range.index, "image", uploadedImageUrl);
          const [blot] = quill.getLeaf(range.index);

          if (blot && blot.domNode && blot.domNode.tagName === "IMG") {
            // Set the width for the new image
            if (imageWidth) {
              blot.domNode.style.width = `${imageWidth}px`;
              blot.domNode.setAttribute("data-width", imageWidth); // Store width in a data attribute
            } else {
              // Set a default width if none provided
              blot.domNode.style.width = "auto"; // or any default value
              blot.domNode.setAttribute("data-width", "auto");
            }

            // Check if the image is loaded successfully
            blot.domNode.onload = () => {
              // Image loaded successfully
           
            };
            blot.domNode.onerror = () => {
              // Image failed to load, reload the image
              console.error("Image failed to load, reloading.");
              blot.domNode.src = ""; // Clear the src to trigger reload
              blot.domNode.src = uploadedImageUrl; // Retry loading the image
            };

            // Add event listener to the inserted image to allow changing its width
            addImageResizeListener(blot.domNode);
          }
        } else {
          console.error("Failed to update range before replacing the placeholder.");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image. Please try again.");
      }
    }
  });

  input.click();
}

// Function to upload the image to the server
async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/uploadImageCMS", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json(); // Expect a JSON response with the image URL
  return data.location; // URL of the uploaded image
}

// Function to apply stored widths to images on load
function applyStoredImageWidths(quill) {
  // Select ALL images in the editor, not just ones with data-width
  const images = quill.root.querySelectorAll('img');
  images.forEach(img => {
    const width = img.getAttribute('data-width');
    if (width) {
      img.style.width = `${width}px`;
    }
    // Add resize listener to ALL images, regardless of whether they have a data-width
    addImageResizeListener(img);
  });
}

// Function to add resize listener to images
function addImageResizeListener(img) {
  // Remove any existing click listeners to prevent duplicates
  img.removeEventListener("click", handleImageClick);
  // Add the click listener
  img.addEventListener("click", handleImageClick);
}

// Function to create and show a custom modal for width input
function showWidthInputModal(currentWidth, callback, imgElement) {
  // Store the initial width
  const initialWidth = currentWidth;

  // Create modal elements
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  modal.style.zIndex = '1000';
  modal.style.borderRadius = '8px';
  modal.style.minWidth = '250px'; // Shrink modal width

  // Create form group for better spacing
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group mb-3';
  
  // Create number input
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'form-control mb-2';
  input.value = currentWidth;
  input.style.width = '100%';

  // Create slider input
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'form-range mb-3';
  slider.min = 50; // Fixed minimum width
  slider.max = 1000; // Fixed maximum width
  slider.value = currentWidth; // Set initial value based on current width
  slider.style.width = '100%'; // Keep slider full width

  // Sync slider and number input, and update image in real-time
  const updateImageSize = (value, imgElement) => {
    const newWidth = parseInt(value);
    if (!isNaN(newWidth) && newWidth > 0) {
      input.value = newWidth;
      slider.value = newWidth;
      imgElement.style.width = `${newWidth}px`;
      imgElement.setAttribute("data-width", newWidth);
    }
  };

  input.addEventListener('input', (e) => updateImageSize(e.target.value, imgElement));
  slider.addEventListener('input', (e) => updateImageSize(e.target.value, imgElement));



  // Create button group
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'd-flex gap-2 justify-content-end';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'btn btn-warning';
  cancelButton.innerText = 'Batal';
  cancelButton.onclick = () => {
    imgElement.style.width = `${initialWidth}px`; // Revert to initial width
    imgElement.setAttribute("data-width", initialWidth); // Update data-width
    document.body.removeChild(modal); // Dismiss the modal
  };

  const submitButton = document.createElement('button');
  submitButton.className = 'btn btn-primary';
  submitButton.innerText = 'Simpan';
  submitButton.onclick = () => {
    callback(input.value);
    document.body.removeChild(modal);
  };

  // Append elements
  formGroup.appendChild(input);
  formGroup.appendChild(slider);
  buttonGroup.appendChild(cancelButton);
  buttonGroup.appendChild(submitButton);
  
  modal.appendChild(formGroup);
  modal.appendChild(buttonGroup);
  document.body.appendChild(modal);
}

// Update handleImageClick to pass the image element
function handleImageClick(event) {
  const currentWidth = event.target.getAttribute("data-width") || event.target.style.width.replace('px', '');
  
  showWidthInputModal(currentWidth, (newWidth) => {
    if (newWidth) {
      newWidth = parseInt(newWidth);
      if (!isNaN(newWidth) && newWidth > 0) {
        event.target.style.width = `${newWidth}px`;
        event.target.setAttribute("data-width", newWidth);
      } else {
        alert("Invalid width entered. The width will not be changed.");
      }
    }
  }, event.target);
}

// Add this after your existing event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Update the content of the hidden textarea when pembahasan editor changes
    if (quillInstances['editorPembahasan']) {
        quillInstances['editorPembahasan'].on('text-change', function() {
            document.getElementById('pembahasan').value = quillInstances['editorPembahasan'].root.innerHTML;
        });

        // Load existing pembahasan content if it exists
        const pembahasan = document.getElementById('pembahasan');
        if (pembahasan && pembahasan.value) {
            quillInstances['editorPembahasan'].root.innerHTML = pembahasan.value;
        }
    }
});

// Add this at the end of your file
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formsoal');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Update all hidden textareas with their respective Quill content
            Object.keys(quillInstances).forEach(editorID => {
                const textareaId = editorID.replace('editor', '').toLowerCase();
                const textarea = document.getElementById(textareaId === 'soalcontent' ? 'soalContent' : textareaId);
                if (textarea) {
                    textarea.value = quillInstances[editorID].root.innerHTML;
                }
            });
        });
    }
});
