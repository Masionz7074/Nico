// js/serverposts.js

// This script handles creating and displaying server posts using localStorage
// IMPORTANT: This is client-side only. Data is stored in the user's browser
// and will not be shared between users or persist if browser data is cleared.
// File uploads are simulated by storing Data URLs, which has size limitations.
// Moderation status is just a display text field, not actual moderation logic.


document.addEventListener('DOMContentLoaded', () => {

    // Get references to elements
    const createPostButton = document.getElementById('createPostButton');
    const postFormModal = document.getElementById('postFormModal');
    const closePostFormButton = document.getElementById('closePostForm');
    const serverPostForm = document.getElementById('serverPostForm');
    const serverPostsList = document.getElementById('serverPostsList');
    const noPostsMessage = document.getElementById('noPostsMessage'); // Added reference

    // Form inputs
    const serverIconInput = document.getElementById('serverIcon');
    const iconPreviewDiv = document.getElementById('iconPreview');
    const serverNameInput = document.getElementById('serverName');
    const serverIPInput = document.getElementById('serverIP');
    const serverDescriptionInput = document.getElementById('serverDescription');
    const serverScreenshotsInput = document.getElementById('serverScreenshots');
    const screenshotsPreviewDiv = document.getElementById('screenshotsPreview');
    const serverTagsInput = document.getElementById('serverTags');
    const serverLinksInput = document.getElementById('serverLinks');
    const serverVersionInput = document.getElementById('serverVersion');

    // Local Storage Key (will be based on the logged-in user)
    let SERVER_POSTS_STORAGE_KEY = null;

    // Array to hold server post data
    let serverPosts = [];

    // --- Helper Functions ---

    // Determine the storage key based on the logged-in user
    function getStorageKeyForUser() {
        const currentUser = localStorage.getItem('nicoInfoCurrentUser'); // Get username from logininfo.js storage key
        if (currentUser) {
            return 'nicoInfoServerPosts_' + currentUser;
        }
        return null; // No logged-in user
    }

    // Load posts from localStorage
    function loadPosts() {
        SERVER_POSTS_STORAGE_KEY = getStorageKeyForUser();
        if (!SERVER_POSTS_STORAGE_KEY) {
            serverPosts = []; // Clear posts if no user is logged in
            return;
        }

        const postsJson = localStorage.getItem(SERVER_POSTS_STORAGE_KEY);
        try {
            serverPosts = postsJson ? JSON.parse(postsJson) : [];
             console.log(`Loaded ${serverPosts.length} server posts for user ${localStorage.getItem('nicoInfoCurrentUser')}.`);
        } catch (e) {
            console.error("Error parsing server posts from localStorage:", e);
            serverPosts = []; // Start fresh on error
        }
         renderPosts(); // Render loaded posts
    }

    // Save posts to localStorage
    function savePosts() {
         SERVER_POSTS_STORAGE_KEY = getStorageKeyForUser(); // Re-get key in case user changed
        if (!SERVER_POSTS_STORAGE_KEY) {
             console.warn("Cannot save posts: No logged-in user.");
            return;
        }
        try {
            localStorage.setItem(SERVER_POSTS_STORAGE_KEY, JSON.stringify(serverPosts));
             console.log(`Saved ${serverPosts.length} server posts for user ${localStorage.getItem('nicoInfoCurrentUser')}.`);
        } catch (e) {
            console.error("Error saving server posts to localStorage:", e);
            alert("Warning: Could not save server posts to your browser. Local storage might be full.");
        }
    }

    // Display image previews (for icon and screenshots)
    function displayImagePreviews(input, previewContainer) {
        // Clear previous previews
        previewContainer.innerHTML = '';

        if (input.files) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result; // Data URL
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file); // Read file as data URL
                }
            }
        }
    }


    // Render all server posts
    function renderPosts() {
        if (!serverPostsList) return; // Ensure the container exists

        serverPostsList.innerHTML = ''; // Clear current list

        if (serverPosts.length === 0) {
            if (noPostsMessage) noPostsMessage.style.display = 'block';
            return;
        } else {
            if (noPostsMessage) noPostsMessage.style.display = 'none';
        }


        serverPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('server-post-card');

            // Basic structure (flesh this out based on your design)
            postElement.innerHTML = `
                <div class="post-header">
                     ${post.icon ? `<img src="${post.icon}" alt="${post.name} Icon">` : ''}
                    <h3>${escapeHTML(post.name)}</h3>
                </div>
                <div class="post-body">
                    <p><strong>IP:</strong> <span class="post-ip">${escapeHTML(post.ip)}</span></p>
                    <p class="post-description">${escapeHTML(post.description)}</p>

                     ${post.screenshots && post.screenshots.length > 0 ?
                         `<div class="post-screenshots">
                            <h4>Screenshots:</h4>
                            ${post.screenshots.map(src => `<img src="${src}" alt="${post.name} Screenshot">`).join('')}
                          </div>` : ''}

                    ${post.tags && post.tags.length > 0 ?
                        `<div class="post-tags">
                            <h4>Tags:</h4>
                            ${post.tags.map(tag => `<span>${escapeHTML(tag.trim())}</span>`).join('')}
                         </div>` : ''}

                     ${post.links && post.links.length > 0 ?
                        `<div class="post-links">
                            <h4>Links:</h4>
                            ${post.links.map(link => {
                                // Basic URL validation and display
                                try {
                                    const url = new URL(link.trim());
                                    // Use hostname or full URL as link text
                                    return `<a href="${url.href}" target="_blank" rel="noopener noreferrer">${escapeHTML(url.hostname)}</a>`;
                                } catch (e) {
                                    // Handle invalid URLs gracefully
                                    console.warn("Invalid link ignored:", link, e);
                                    return ''; // Skip invalid links
                                }
                            }).join('')}
                         </div>` : ''}

                     <p class="post-version"><strong>Version:</strong> ${escapeHTML(post.version)}</p>
                </div>
                <div class="post-footer">
                     <span class="post-author">Posted by: ${escapeHTML(post.author)}</span>
                    <span class="post-moderation-status status-${post.status.toLowerCase()}">${escapeHTML(post.status)}</span>
                </div>
            `;

            serverPostsList.appendChild(postElement);
        });
    }

    // Basic HTML escaping (to prevent XSS when displaying user input)
    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }


    // --- Event Handlers ---

    // Show the post creation modal
    function showPostFormModal() {
        if (postFormModal) {
            postFormModal.style.display = 'flex'; // Use flex to center
             // Reset the form fields and previews
             if (serverPostForm) serverPostForm.reset();
             if (iconPreviewDiv) iconPreviewDiv.innerHTML = '';
             if (screenshotsPreviewDiv) screenshotsPreviewDiv.innerHTML = '';
        }
    }

    // Hide the post creation modal
    function hidePostFormModal() {
         if (postFormModal) {
            postFormModal.style.display = 'none';
        }
    }

    // Handle form submission
    async function handlePostSubmit(event) {
        event.preventDefault(); // Prevent page reload

         SERVER_POSTS_STORAGE_KEY = getStorageKeyForUser(); // Ensure key is set
         if (!SERVER_POSTS_STORAGE_KEY) {
             alert("You must be logged in to create a post.");
             // Optional: Redirect to auth or show auth area
             // window.location.reload(); // Simple reload to trigger auth check
             return;
         }

        const currentUser = localStorage.getItem('nicoInfoCurrentUser'); // Get logged-in username

        // Collect form data
        const name = serverNameInput.value.trim();
        const ip = serverIPInput.value.trim();
        const description = serverDescriptionInput.value.trim();
        const tags = serverTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''); // Split by comma, trim, remove empty
        const links = serverLinksInput.value.split(',').map(link => link.trim()).filter(link => link !== ''); // Split by comma, trim, remove empty
        const version = serverVersionInput.value.trim();

        // Basic validation
        if (!name || !ip || !description || !version) {
            alert("Please fill in all required fields: Server Name, IP/Address, Description, and Version.");
            return;
        }

        // Handle image uploads (async operations)
        let iconDataUrl = null;
        if (serverIconInput.files && serverIconInput.files[0]) {
            iconDataUrl = await readFileAsDataURL(serverIconInput.files[0]);
        }

        let screenshotDataUrls = [];
        if (serverScreenshotsInput.files && serverScreenshotsInput.files.length > 0) {
             // Read all selected files
            for (let i = 0; i < serverScreenshotsInput.files.length; i++) {
                 // Add a size limit check (e.g., 1MB = 1024*1024 bytes)
                 const maxFileSize = 1 * 1024 * 1024; // 1MB
                 if (serverScreenshotsInput.files[i].size > maxFileSize) {
                      alert(`Screenshot "${serverScreenshotsInput.files[i].name}" is too large (${(serverScreenshotsInput.files[i].size / maxFileSize).toFixed(1)}MB). Max size is 1MB.`);
                      screenshotDataUrls = []; // Clear screenshots if any are too large
                      break; // Stop processing
                 }
                const dataUrl = await readFileAsDataURL(serverScreenshotsInput.files[i]);
                if (dataUrl) screenshotDataUrls.push(dataUrl);
            }
             // If we broke out of the loop due to size, clear the input
             if (screenshotDataUrls.length < serverScreenshotsInput.files.length) {
                  serverScreenshotsInput.value = ''; // Clear file input
                  screenshotsPreviewDiv.innerHTML = ''; // Clear previews
                  return; // Stop submission
             }
        }

         // Basic URL format check for links (optional but good)
         const validLinks = [];
         for (const link of links) {
             try {
                 new URL(link); // Just try to create a URL object
                 validLinks.push(link); // If successful, add to valid links
             } catch (e) {
                  console.warn(`Invalid URL ignored: ${link}`);
                  // Optionally show a message to the user about invalid links
             }
         }


        // Create the new post object
        const newPost = {
            id: Date.now(), // Simple unique ID based on timestamp
            author: currentUser, // Store the author's username
            icon: iconDataUrl,
            name: name,
            ip: ip,
            description: description,
            screenshots: screenshotDataUrls,
            tags: tags,
            links: validLinks, // Use validated links
            version: version,
            status: 'Pending', // Default moderation status
            createdAt: new Date().toISOString() // Timestamp
        };

        // Add the new post to the array
        serverPosts.push(newPost);

        // Save the updated array
        savePosts();

        // Render the updated list
        renderPosts();

        // Hide the modal
        hidePostFormModal();

        // Success message (optional)
        // alert("Server post created successfully! It is currently pending review."); // No actual review in this client-side demo

    }

    // Promise-based function to read file as data URL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }


    // --- Initialization ---

    // Listen for the custom event from logininfo.js indicating auth is complete
    document.addEventListener('authComplete', () => {
         console.log("Auth complete event received in serverposts.js. Loading posts.");
        // Load and render posts only when logged in
        loadPosts();

        // Add event listeners relevant to logged-in users only
        if (createPostButton) {
            createPostButton.addEventListener('click', showPostFormModal);
             createPostButton.style.display = 'inline-block'; // Show the button
        }
         if (closePostFormButton) {
             closePostFormButton.addEventListener('click', hidePostFormModal);
         }
         if (serverPostForm) {
             serverPostForm.addEventListener('submit', handlePostSubmit);
         }
         // Add listeners for image previews
         if (serverIconInput) {
             serverIconInput.addEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
         }
         if (serverScreenshotsInput) {
             serverScreenshotsInput.addEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
         }

         // Allow closing modal by clicking outside (optional)
         if (postFormModal) {
             postFormModal.addEventListener('click', (e) => {
                  if (e.target === postFormModal) {
                       hidePostFormModal();
                  }
             });
         }


    });

    // Listen for a logout event (if you add a logout button later)
     document.addEventListener('authLogout', () => {
         console.log("Auth logout event received in serverposts.js. Clearing posts.");
         serverPosts = []; // Clear posts data
         renderPosts(); // Clear displayed posts
         SERVER_POSTS_STORAGE_KEY = null; // Reset storage key
         if (createPostButton) {
              createPostButton.style.display = 'none'; // Hide the button
         }
         // Hide the modal if it was open
         hidePostFormModal();
     });


    // Initial check in case authComplete fired before this script loaded (less common with async/defer, but safe)
     // Or if the user is already logged in on page load
     // This check will run immediately if mainContent is already visible
     if (mainContent && mainContent.style.display !== 'none') {
          console.log("Main content already visible. Assuming logged in, loading posts.");
          loadPosts();
           // Add event listeners relevant to logged-in users only
            if (createPostButton) {
                createPostButton.addEventListener('click', showPostFormModal);
                 createPostButton.style.display = 'inline-block'; // Show the button
            }
             if (closePostFormButton) {
                 closePostFormButton.addEventListener('click', hidePostFormModal);
             }
             if (serverPostForm) {
                 serverPostForm.addEventListener('submit', handlePostSubmit);
             }
             if (serverIconInput) {
                 serverIconInput.addEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
             }
             if (serverScreenshotsInput) {
                 serverScreenshotsInput.addEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
             }
              if (postFormModal) {
                 postFormModal.addEventListener('click', (e) => {
                      if (e.target === postFormModal) {
                           hidePostFormModal();
                      }
                 });
             }
     } else {
         console.log("Main content not visible. Waiting for authComplete event.");
          // Hide the create post button until logged in
          if (createPostButton) {
              createPostButton.style.display = 'none';
          }
     }


});