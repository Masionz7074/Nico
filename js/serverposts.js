// js/serverposts.js

// Handles creating and displaying server posts using localStorage for normal users.
// Data is stored per user in localStorage and is NOT shared or persistent server-side.
// Moderation status is static text. Admin cannot see normal user posts in this setup.

document.addEventListener('DOMContentLoaded', () => {

    // Get references to elements
    const createPostButton = document.getElementById('createPostButton');
    const postFormModal = document.getElementById('postFormModal');
    const closePostFormButton = document.getElementById('closePostForm');
    const serverPostForm = document.getElementById('serverPostForm');
    const serverPostsList = document.getElementById('serverPostsList');
    const noPostsMessage = document.getElementById('noPostsMessage'); // Added reference
    const serverPostsSection = document.getElementById('server-posts-section'); // Reference to the section itself


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

     // Constants
    const MAX_POST_ICON_SIZE = 500 * 1024; // 500KB max size for post icons
    const MAX_SCREENSHOT_SIZE = 1 * 1024 * 1024; // 1MB per screenshot
    const MAX_SCREENSHOTS = 3; // Max number of screenshots


    // Local Storage Key (user-specific for posts)
    let USER_POSTS_STORAGE_KEY = null;

    // Array to hold server post data for the CURRENT user
    let currentUserServerPosts = [];

     // Access the function from logininfo.js to get all users data (simulated logs)
     // WARNING: Direct access like this couples the scripts. In a real app,
     // you'd have a global data store or fetch data via a shared service/backend.
     const getAllUsersData = window.getAllUsersData || (() => { console.error("serverposts.js: getAllUsersData function from logininfo.js not available!"); return {}; }); // Fallback


    // --- Helper Functions ---

    // Determine the storage key based on the logged-in user
    function getStorageKeyForUserPosts() {
        const currentUser = localStorage.getItem('nicoInfoCurrentUser'); // Get username
        const currentUserRole = localStorage.getItem('nicoInfoCurrentUserRole'); // Get role

        // Only create a key for normal users
        if (currentUser && currentUserRole === 'user') {
            return 'nicoInfoServerPosts_' + currentUser;
        }
        return null; // No normal user logged in
    }

    // Load posts from localStorage for the current user
    function loadPostsForCurrentUser() {
        USER_POSTS_STORAGE_KEY = getStorageKeyForUserPosts();

        if (!USER_POSTS_STORAGE_KEY) {
             currentUserServerPosts = []; // Clear posts if no valid user
             console.log("serverposts.js: No user-specific storage key found. Clearing posts data.");
            // Don't render here, let renderPosts handle the display state
            return;
        }

        const postsJson = localStorage.getItem(USER_POSTS_STORAGE_KEY);
        try {
            currentUserServerPosts = postsJson ? JSON.parse(postsJson) : [];
             console.log(`serverposts.js: Loaded ${currentUserServerPosts.length} server posts for user "${localStorage.getItem('nicoInfoCurrentUser')}".`);
        } catch (e) {
            console.error("serverposts.js: Error parsing server posts from localStorage:", e);
             currentUserServerPosts = []; // Start fresh on error
        }
         // Call renderPosts after loading
         renderPosts();
    }

    // Save posts to localStorage for the current user
    function savePostsForCurrentUser() {
         USER_POSTS_STORAGE_KEY = getStorageKeyForUserPosts(); // Re-get key in case user changed (shouldn't happen while logged in)
        if (!USER_POSTS_STORAGE_KEY) {
             console.warn("serverposts.js: Cannot save posts. No user-specific storage key.");
            return;
        }
        try {
            localStorage.setItem(USER_POSTS_STORAGE_KEY, JSON.stringify(currentUserServerPosts));
             console.log(`serverposts.js: Saved ${currentUserServerPosts.length} server posts for user "${localStorage.getItem('nicoInfoCurrentUser')}".`);
        } catch (e) {
            console.error("serverposts.js: Error saving server posts to localStorage:", e);
            alert("Warning: Could not save server posts to your browser. Local storage might be full.");
        }
    }

    // Display image previews (for icon and screenshots)
    function displayImagePreviews(input, previewContainer) {
        // Clear previous previews
        previewContainer.innerHTML = '';

        if (input.files) {
            // Limit number of files for screenshots input specifically
             if (input.id === 'serverScreenshots' && input.files.length > MAX_SCREENSHOTS) {
                  alert(`You can only select up to ${MAX_SCREENSHOTS} screenshots.`);
                  input.value = ''; // Clear selected files
                  previewContainer.innerHTML = ''; // Clear preview
                  return; // Stop processing
             }

            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                // Add a basic file size check *before* trying to read
                const maxFileSize = (input.id === 'serverIcon') ? MAX_POST_ICON_SIZE : MAX_SCREENSHOT_SIZE;

                 if (file.size > maxFileSize) {
                      alert(`File "${file.name}" is too large (${(file.size / 1024).toFixed(0)}KB). Max allowed size is ${(maxFileSize / 1024).toFixed(0)}KB.`);
                      // Clear the input for this file type
                      input.value = '';
                      previewContainer.innerHTML = ''; // Clear any previews
                      return; // Stop processing and exit function
                 }

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result; // Data URL
                        previewContainer.appendChild(img);
                    };
                    reader.onerror = (e) => {
                         console.error("serverposts.js: FileReader error:", e);
                         alert(`Could not read file "${file.name}".`);
                    };
                    reader.readAsDataURL(file); // Read file as data URL
                } else {
                     alert(`File "${file.name}" is not an image.`);
                      // Clear the input for this file type
                       input.value = '';
                       previewContainer.innerHTML = ''; // Clear any previews
                }
            }
        }
    }


    // Render all server posts for the current user
    function renderPosts() {
        if (!serverPostsList) {
             console.warn("serverposts.js: serverPostsList element not found.");
            return;
        }

        // Check if the server posts section is currently active/visible before rendering
        const serverPostsSection = document.getElementById('server-posts-section');
        if (!serverPostsSection || !serverPostsSection.classList.contains('active-section')) {
             // Section is not active, don't render now, just ensure it's empty
             serverPostsList.innerHTML = '';
             if (noPostsMessage) noPostsMessage.style.display = 'none';
             console.log("serverposts.js: Server posts section not active, skipping render.");
             return;
         }


        serverPostsList.innerHTML = ''; // Clear current list

        if (currentUserServerPosts.length === 0) {
            if (noPostsMessage) noPostsMessage.style.display = 'block';
            return;
        } else {
            if (noPostsMessage) noPostsMessage.style.display = 'none';
        }

        const allUsers = getAllUsersData(); // Get all user data to find author profile pictures

        currentUserServerPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('server-post-card');

            // Get the author's profile picture from the logs data
            const authorUsername = post.author;
            const authorData = allUsers[authorUsername];
            const authorProfilePicture = authorData ? authorData.profilePicture : null;
            // Use a default placeholder if no picture is found
            const profilePicSrc = authorProfilePicture || 'placeholder-profile.png';

            // Basic structure (flesh this out based on your design)
            postElement.innerHTML = `
                <div class="post-header">
                     ${post.icon ? `<img src="${escapeHTML(post.icon)}" alt="${escapeHTML(post.name)} Icon">` : ''}
                    <h3>${escapeHTML(post.name)}</h3>
                </div>
                <div class="post-body">
                    <p><strong>IP:</strong> <span class="post-ip">${escapeHTML(post.ip)}</span></p>
                    <p class="post-description">${escapeHTML(post.description)}</p>

                     ${post.screenshots && post.screenshots.length > 0 ?
                         `<div class="post-screenshots">
                            <h4>Screenshots:</h4>
                            ${post.screenshots.map(src => `<img src="${escapeHTML(src)}" alt="${escapeHTML(post.name)} Screenshot">`).join('')}
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
                                    // Use hostname or a simple label as link text
                                     let linkText = url.hostname;
                                     // Add more specific link text checks if needed
                                     if (link.toLowerCase().includes('discord.gg')) linkText = 'Discord';
                                     else if (link.toLowerCase().includes('github.com')) linkText = 'GitHub';
                                     else if (link.toLowerCase().includes('patreon.com') || link.toLowerCase().includes('paypal.me')) linkText = 'Donate';
                                     else if (link.toLowerCase().includes('bug report')) linkText = 'Bug Report';
                                     else if (link.toLowerCase().includes('mods list')) linkText = 'Mods List';


                                    return `<a href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkText)}</a>`;
                                } catch (e) {
                                    // Handle invalid URLs gracefully
                                    console.warn("serverposts.js: Invalid link ignored during render:", link, e);
                                    return ''; // Skip invalid links
                                }
                            }).join('')}
                         </div>` : ''}

                     <p class="post-version"><strong>Version:</strong> ${escapeHTML(post.version)}</p>
                </div>
                <div class="post-footer">
                    <span class="post-author">
                         <img src="${escapeHTML(profilePicSrc)}" alt="${escapeHTML(post.author)}'s Profile Picture">
                         Posted by: ${escapeHTML(post.author)}
                     </span>
                    <span class="post-moderation-status status-${escapeHTML(post.status.toLowerCase())}">${escapeHTML(post.status)}</span>
                </div>
            `;

            serverPostsList.appendChild(postElement);
        });
         console.log(`serverposts.js: Rendered ${currentUserServerPosts.length} server posts.`);
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
         // Ensure the user is still logged in as a normal user
        const currentUserRole = localStorage.getItem('nicoInfoCurrentUserRole');
         if (currentUserRole !== 'user') {
             alert("You must be logged in as a normal user to create a post.");
             // Optional: Trigger logout or redirect
             window.logout(); // Use the global logout
             return;
         }

        if (postFormModal) {
            postFormModal.style.display = 'flex'; // Use flex to center
             // Reset the form fields and previews
             if (serverPostForm) serverPostForm.reset();
             if (iconPreviewDiv) iconPreviewDiv.innerHTML = '';
             if (screenshotsPreviewDiv) screenshotsPreviewDiv.innerHTML = '';
             console.log("serverposts.js: Server post modal shown.");
        }
    }

    // Hide the post creation modal
    function hidePostFormModal() {
         if (postFormModal) {
            postFormModal.style.display = 'none';
            console.log("serverposts.js: Server post modal hidden.");
        }
    }

    // Handle form submission
    async function handlePostSubmit(event) {
        event.preventDefault(); // Prevent page reload

         USER_POSTS_STORAGE_KEY = getStorageKeyForUserPosts(); // Ensure key is set and user is valid
         const currentUser = localStorage.getItem('nicoInfoCurrentUser'); // Get logged-in username
         const currentUserRole = localStorage.getItem('nicoInfoCurrentUserRole'); // Get logged-in role

         if (!USER_POSTS_STORAGE_KEY || currentUserRole !== 'user') {
             alert("You must be logged in as a normal user to create a post.");
             window.logout();
             return;
         }

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
            // Add size limit check for icon
             if (serverIconInput.files[0].size > MAX_POST_ICON_SIZE) {
                 alert(`Server icon is too large (${(serverIconInput.files[0].size / 1024).toFixed(0)}KB). Max size is ${MAX_POST_ICON_SIZE / 1024}KB.`);
                 serverIconInput.value = ''; iconPreviewDiv.innerHTML = '';
                 return;
             }
             if (!serverIconInput.files[0].type.startsWith('image/')) {
                 alert("Server icon must be an image file.");
                 serverIconInput.value = ''; iconPreviewDiv.innerHTML = '';
                 return;
             }
            iconDataUrl = await readFileAsDataURL(serverIconInput.files[0]);
             if (!iconDataUrl) { // Handle read error
                  alert("Could not read server icon file.");
                  serverIconInput.value = ''; iconPreviewDiv.innerHTML = '';
                  return;
             }
        }

        let screenshotDataUrls = [];
        if (serverScreenshotsInput.files && serverScreenshotsInput.files.length > 0) {
             // Limit number of screenshots
             if (serverScreenshotsInput.files.length > MAX_SCREENSHOTS) {
                 alert(`You can only upload up to ${MAX_SCREENSHOTS} screenshots.`);
                 serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                 return;
             }
             // Read all selected files with size check
            for (let i = 0; i < serverScreenshotsInput.files.length; i++) {
                 const file = serverScreenshotsInput.files[i];
                 if (file.size > MAX_SCREENSHOT_SIZE) {
                      alert(`Screenshot "${file.name}" is too large (${(file.size / 1024).toFixed(0)}KB). Max size per screenshot is ${MAX_SCREENSHOT_SIZE / 1024}KB.`);
                      serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                      return; // Stop processing and exit
                 }
                 if (!file.type.startsWith('image/')) {
                     alert(`File "${file.name}" is not an image.`);
                     serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                     return; // Stop processing and exit
                 }

                const dataUrl = await readFileAsDataURL(file);
                 if (!dataUrl) { // Handle read error
                      alert(`Could not read screenshot file "${file.name}".`);
                       serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                       return; // Stop submission
                 }
                screenshotDataUrls.push(dataUrl);
            }
        }

         // Basic URL format check for links
         const validLinks = [];
         for (const link of links) {
             try {
                 new URL(link); // Just try to create a URL object
                 validLinks.push(link); // If successful, add to valid links
             } catch (e) {
                  console.warn(`serverposts.js: Invalid URL ignored: ${link}`);
                  // Optionally display a message to the user about invalid links?
             }
         }


        // Create the new post object
        const newPost = {
            id: Date.now() + Math.random(), // More unique ID
            author: currentUser, // Store the author's username
            icon: iconDataUrl, // Data URL string (can be null)
            name: name,
            ip: ip,
            description: description,
            screenshots: screenshotDataUrls, // Array of Data URL strings
            tags: tags, // Array of strings
            links: validLinks, // Array of strings (validated URLs)
            version: version,
            status: 'Pending', // Default moderation status (client-side only)
            createdAt: new Date().toISOString() // Timestamp
        };

        // Add the new post to the current user's array
        currentUserServerPosts.push(newPost);

        // Save the updated array to the current user's storage key
        savePostsForCurrentUser();

        // Render the updated list
        renderPosts();

        // Hide the modal
        hidePostFormModal();

        // Success message (optional)
         alert("Server post created successfully! It is currently pending moderation (simulated).");

    }

    // Promise-based function to read file as data URL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                 resolve(null); // Resolve with null if no file
                 return;
            }
             if (!file.type.startsWith('image/')) {
                  reject("Not an image file.");
                  return;
             }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => {
                 console.error("serverposts.js: File read error:", e);
                 reject(e);
            };
            reader.readAsDataURL(file);
        });
    }


    // --- Initialization ---

    // Listen for the custom event from logininfo.js when authentication is complete
    document.addEventListener('authComplete', (event) => {
        const user = event.detail; // Get user info (username, role) from the event
         console.log("serverposts.js: Received 'authComplete' event with user role:", user.role);

        if (user.role === 'user') {
            // Only normal users can create/see posts
            if (createPostButton) {
                 createPostButton.style.display = 'inline-block'; // Show the create post button
                 // Ensure listener is only added once
                 createPostButton.removeEventListener('click', showPostFormModal);
                 createPostButton.addEventListener('click', showPostFormModal); // Add listener
            }

            // Load and render posts for this specific user IF the section is active
            // No, let the 'showServerPosts' event trigger the load/render.
            // This ensures posts aren't loaded unnecessarily on other sections.
            console.log("serverposts.js: User is normal user. Will load/render posts when section is shown.");


            // Add event listeners relevant to the post creation form
            if (closePostFormButton) {
                 closePostFormButton.removeEventListener('click', hidePostFormModal);
                 closePostFormButton.addEventListener('click', hidePostFormModal);
            }
            if (serverPostForm) {
                 serverPostForm.removeEventListener('submit', handlePostSubmit);
                 serverPostForm.addEventListener('submit', handlePostSubmit);
            }
            if (serverIconInput) {
                 serverIconInput.removeEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
                 serverIconInput.addEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
            }
            if (serverScreenshotsInput) {
                 serverScreenshotsInput.removeEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
                 serverScreenshotsInput.addEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
            }
            // Allow closing modal by clicking outside
             if (postFormModal) {
                 postFormModal.removeEventListener('click', (e) => { if (e.target === postFormModal && e.target !== postFormModal.children[0]) hidePostFormModal(); }); // Added check to not close on modal-content click
                 postFormModal.addEventListener('click', (e) => { if (e.target === postFormModal && e.target !== postFormModal.children[0]) hidePostFormModal(); });
             }

        } else { // Role is 'admin' or other
            // Hide the create post button and clear any rendered posts (they shouldn't see them)
             if (createPostButton) {
                  createPostButton.style.display = 'none';
                  createPostButton.removeEventListener('click', showPostFormModal); // Remove listener
             }
             currentUserServerPosts = []; // Clear data
             renderPosts(); // Clear display
             USER_POSTS_STORAGE_KEY = null; // Reset storage key
        }
    });

     // Listen for the custom event from script.js to show server posts
     // This event signals that the #server-posts-section is becoming active
     document.addEventListener('showServerPosts', () => {
          console.log("serverposts.js: Received 'showServerPosts' event.");
           const currentUserRole = localStorage.getItem('nicoInfoCurrentUserRole');
          if (currentUserRole === 'user') {
              // When the section is navigated to, ensure posts are loaded and rendered for the current user
              loadPostsForCurrentUser(); // This will call renderPosts()
          } else {
              // If an admin somehow navigates here (e.g., via URL hash), clear the display
              currentUserServerPosts = [];
              renderPosts(); // This will render the "no posts" message or admin message
               // Optionally show a message for admin like "You cannot see user posts here."
               if (serverPostsList) {
                   serverPostsList.innerHTML = '<p style="text-align:center; color: rgba(var(--theme-font-color-base), 0.7);">Server posts are managed by individual users.</p>';
                    if (noPostsMessage) noPostsMessage.style.display = 'none';
               }
          }
     });

     // Listen for a profile picture update event from logininfo.js
     document.addEventListener('profilePictureUpdated', (event) => {
          console.log("serverposts.js: Received 'profilePictureUpdated' event.");
         // Re-render posts to update author profile pictures
         renderPosts(); // Re-rendering will fetch the updated profile pic from getAllUsersData()
     });


    // Listen for a logout event
     document.addEventListener('authLogout', () => {
         console.log("serverposts.js: Received 'authLogout' event. Clearing user posts data and display.");
         // Clearing user-specific post data from localStorage is handled in logininfo.js logout function.
         // Just clear the in-memory array and the display here.
         currentUserServerPosts = [];
         renderPosts(); // Clear the displayed posts
         USER_POSTS_STORAGE_KEY = null;
         // Hide the create post button
         if (createPostButton) {
              createPostButton.style.display = 'none';
              createPostButton.removeEventListener('click', showPostFormModal); // Remove listener
         }
          // Hide the modal if it was open
          hidePostFormModal();
     });


    // Initial check on page load if already logged in as a normal user
    // This handles cases where the user refreshes the page while already logged in.
     const mainContentArea = document.querySelector('#mainContent'); // Use ID for robustness
     const currentUserRole = localStorage.getItem('nicoInfoCurrentUserRole');

     if (mainContentArea && mainContentArea.style.display !== 'none' && currentUserRole === 'user') {
         console.log("serverposts.js: Main content visible and user role detected on initial load. Loading posts.");
          // User is already logged in as a normal user
         if (createPostButton) {
              createPostButton.style.display = 'inline-block';
               // Add listeners if not already added by authComplete
               createPostButton.removeEventListener('click', showPostFormModal);
               createPostButton.addEventListener('click', showPostFormModal);
         }
         // Load posts on page load if already logged in
          loadPostsForCurrentUser(); // This will call renderPosts() if section is active on load

          // Add form/modal listeners if not already added by authComplete
          if (closePostFormButton) {
               closePostFormButton.removeEventListener('click', hidePostFormModal);
               closePostFormButton.addEventListener('click', hidePostFormModal);
          }
          if (serverPostForm) {
              serverPostForm.removeEventListener('submit', handlePostSubmit);
              serverPostForm.addEventListener('submit', handlePostSubmit);
          }
          if (serverIconInput) {
              serverIconInput.removeEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
              serverIconInput.addEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
          }
          if (serverScreenshotsInput) {
              serverScreenshotsInput.removeEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
              serverScreenshotsInput.addEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
          }
           if (postFormModal) {
                postFormModal.removeEventListener('click', (e) => { if (e.target === postFormModal && e.target !== postFormModal.children[0]) hidePostFormModal(); });
                postFormModal.addEventListener('click', (e) => { if (e.target === postFormModal && e.target !== postFormModal.children[0]) hidePostFormModal(); });
             }

     } else {
         console.log("serverposts.js: Waiting for authComplete or main content not visible/user not normal user.");
          // Hide the create post button initially
          if (createPostButton) {
               createPostButton.style.display = 'none';
          }
     }


});