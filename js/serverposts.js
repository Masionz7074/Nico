console.log("serverposts.js: Script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("serverposts.js: DOMContentLoaded fired.");

    const createPostButton = document.getElementById('createPostButton');
    const postFormModal = document.getElementById('postFormModal');
    const closePostFormButton = document.getElementById('closePostForm');
    const serverPostForm = document.getElementById('serverPostForm');
    const serverPostsList = document.getElementById('serverPostsList');
    const noPostsMessage = document.getElementById('noPostsMessage');
    const serverPostsSection = document.getElementById('server-posts-section');


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

    const MAX_POST_ICON_SIZE = 500 * 1024;
    const MAX_SCREENSHOT_SIZE = 1 * 1024 * 1024;
    const MAX_SCREENSHOTS = 3;

    const SHARED_POSTS_STORAGE_KEY = 'NicoInfoSharedPosts';

    let allServerPosts = [];

    function loadAllPosts() {
        console.log("serverposts.js: Calling loadAllPosts.");
        const postsJson = localStorage.getItem(SHARED_POSTS_STORAGE_KEY);
        try {
            allServerPosts = postsJson ? JSON.parse(postsJson) : [];
             console.log(`serverposts.js: Loaded ${allServerPosts.length} server posts from localStorage.`);
        } catch (e) {
            console.error("serverposts.js: Error parsing server posts from localStorage:", e);
             allServerPosts = [];
        }
    }

    function saveAllPosts() {
         console.log("serverposts.js: Calling saveAllPosts.");
        try {
            localStorage.setItem(SHARED_POSTS_STORAGE_KEY, JSON.stringify(allServerPosts));
             console.log(`serverposts.js: Saved ${allServerPosts.length} server posts to localStorage.`);
        } catch (e) {
            console.error("serverposts.js: Error saving server posts to localStorage:", e);
            alert("Warning: Could not save server posts to your browser. Local storage might be full.");
        }
    }

    function displayImagePreviews(input, previewContainer) {
         console.log("serverposts.js: Displaying image preview.");
        previewContainer.innerHTML = '';

        if (!input.files || input.files.length === 0) {
             console.log("serverposts.js: No files selected for preview.");
             return;
        }

         if (input.id === 'serverScreenshots' && input.files.length > MAX_SCREENSHOTS) {
              alert(`You can only select up to ${MAX_SCREENSHOTS} screenshots.`);
              input.value = '';
              previewContainer.innerHTML = '';
              return;
         }

        for (let i = 0; i < input.files.length; i++) {
            const file = input.files[i];
            const maxFileSize = (input.id === 'serverIcon') ? MAX_POST_ICON_SIZE : MAX_SCREENSHOT_SIZE;

             if (file.size > maxFileSize) {
                  alert(`File "${file.name}" is too large (${(file.size / 1024).toFixed(0)}KB). Max allowed size is ${(maxFileSize / 1024).toFixed(0)}KB.`);
                  input.value = '';
                  previewContainer.innerHTML = '';
                  return;
             }

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    previewContainer.appendChild(img);
                };
                reader.onerror = (e) => {
                     console.error("serverposts.js: FileReader error:", e);
                     alert(`Could not read file "${file.name}".`);
                };
                reader.readAsDataURL(file);
            } else {
                 alert(`File "${file.name}" is not an image.`);
                   input.value = '';
                   previewContainer.innerHTML = '';
                   return;
            }
        }
    }

    function renderPosts() {
        console.log("serverposts.js: Calling renderPosts.");
        if (!serverPostsList) {
             console.warn("serverposts.js: serverPostsList element not found. Cannot render posts.");
            return;
        }

        const serverPostsSection = document.getElementById('server-posts-section');
        if (!serverPostsSection || !serverPostsSection.classList.contains('active-section')) {
             serverPostsList.innerHTML = '';
             if (noPostsMessage) noPostsMessage.style.display = 'none';
             console.log("serverposts.js: Server posts section not active, skipping render.");
             return;
         }

        serverPostsList.innerHTML = '';

        if (allServerPosts.length === 0) {
            if (noPostsMessage) noPostsMessage.style.display = 'block';
            console.log("serverposts.js: No server posts found.");
            return;
        } else {
            if (noPostsMessage) noPostsMessage.style.display = 'none';
        }

         allServerPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        allServerPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('server-post-card');

            postElement.innerHTML = `
                <div class="post-header">
                     ${post.icon ? `<img src="${escapeHTML(post.icon)}" alt="${escapeHTML(post.name || 'Server')} Icon">` : ''}
                    <h3>${escapeHTML(post.name || 'Unnamed Server')}</h3>
                </div>
                <div class="post-body">
                    <p><strong>IP:</strong> <span class="post-ip">${escapeHTML(post.ip || 'N/A')}</span></p>
                    <p class="post-description">${escapeHTML(post.description || 'No description provided.')}</p>

                     ${post.screenshots && post.screenshots.length > 0 ?
                         `<div class="post-screenshots">
                            <h4>Screenshots:</h4>
                            ${post.screenshots.map(src => `<img src="${escapeHTML(src)}" alt="${escapeHTML(post.name || 'Server')} Screenshot">`).join('')}
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
                                try {
                                    const url = new URL(link.trim());
                                     let linkText = url.hostname;
                                     if (link.toLowerCase().includes('discord.gg')) linkText = 'Discord';
                                     else if (link.toLowerCase().includes('github.com')) linkText = 'GitHub';
                                     else if (link.toLowerCase().includes('patreon.com') || link.toLowerCase().includes('paypal.me')) linkText = 'Donate';
                                     else if (link.toLowerCase().includes('bug report')) linkText = 'Bug Report';
                                     else if (link.toLowerCase().includes('mods list')) linkText = 'Mods List';
                                      if (linkText === url.hostname && linkText.startsWith('www.')) {
                                          linkText = linkText.substring(4);
                                      }
                                       if (linkText.length > 20) {
                                           linkText = linkText.substring(0, 17) + '...';
                                       }

                                    return `<a href="${escapeHTML(url.href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkText)}</a>`;
                                } catch (e) {
                                    console.warn("serverposts.js: Invalid link ignored during render:", link, e);
                                    return '';
                                }
                            }).join('')}
                         </div>` : ''}

                     <p class="post-version"><strong>Version:</strong> ${escapeHTML(post.version || 'N/A')}</p>
                </div>
                <div class="post-footer">
                     <span class="post-date">Posted on: ${escapeHTML(new Date(post.createdAt).toLocaleDateString())}</span>
                </div>
            `;

            serverPostsList.appendChild(postElement);
        });
         console.log(`serverposts.js: Rendered ${allServerPosts.length} server posts.`);
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    function showPostFormModal() {
         console.log("serverposts.js: Showing post form modal.");
        if (postFormModal) {
            postFormModal.style.display = 'flex';
             if (serverPostForm) serverPostForm.reset();
             if (iconPreviewDiv) iconPreviewDiv.innerHTML = '';
             if (screenshotsPreviewDiv) screenshotsPreviewDiv.innerHTML = '';
             console.log("serverposts.js: Server post modal shown.");
        } else {
             console.error("serverposts.js: Post form modal element not found.");
        }
    }

    function hidePostFormModal() {
         console.log("serverposts.js: Hiding post form modal.");
         if (postFormModal) {
            postFormModal.style.display = 'none';
            console.log("serverposts.js: Server post modal hidden.");
        }
    }

    async function handlePostSubmit(event) {
        console.log("serverposts.js: Handling post submission.");
        event.preventDefault();

        const name = serverNameInput.value.trim();
        const ip = serverIPInput.value.trim();
        const description = serverDescriptionInput.value.trim();
        const tags = serverTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const links = serverLinksInput.value.split(',').map(link => link.trim()).filter(link => link !== '');
        const version = serverVersionInput.value.trim();

        if (!name || !ip || !description || !version) {
            alert("Please fill in all required fields: Server Name, IP/Address, Description, and Version.");
            console.warn("serverposts.js: Form validation failed.");
            return;
        }

        let iconDataUrl = null;
        if (serverIconInput.files && serverIconInput.files[0]) {
             console.log("serverposts.js: Processing server icon file.");
            const file = serverIconInput.files[0];
             if (file.size > MAX_POST_ICON_SIZE) {
                 alert(`Server icon is too large (${(file.size / 1024).toFixed(0)}KB). Max size is ${MAX_POST_ICON_SIZE / 1024}KB.`);
                 serverIconInput.value = ''; iconPreviewDiv.innerHTML = '';
                 return;
             }
             if (!file.type.startsWith('image/')) {
                 alert("Server icon must be an image file.");
                 serverIconInput.value = ''; iconPreviewDiv.innerHTML = '';
                 return;
             }
            try {
                 iconDataUrl = await readFileAsDataURL(file);
                 console.log("serverposts.js: Server icon file read successfully.");
             } catch (e) {
                  alert("Could not read server icon file.");
                  serverIconInput.value = ''; iconPreviewDiv.innerHTML = '';
                  return;
             }
        }

        let screenshotDataUrls = [];
        if (serverScreenshotsInput.files && serverScreenshotsInput.files.length > 0) {
             console.log(`serverposts.js: Processing ${serverScreenshotsInput.files.length} screenshot files.`);
             if (serverScreenshotsInput.files.length > MAX_SCREENSHOTS) {
                 alert(`You can only upload up to ${MAX_SCREENSHOTS} screenshots.`);
                 serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                 return;
             }
            for (let i = 0; i < serverScreenshotsInput.files.length; i++) {
                 const file = serverScreenshotsInput.files[i];
                 if (file.size > MAX_SCREENSHOT_SIZE) {
                      alert(`Screenshot "${file.name}" is too large (${(file.size / 1024).toFixed(0)}KB). Max size per screenshot is ${MAX_SCREENSHOT_SIZE / 1024}KB.`);
                      serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                      return;
                 }
                 if (!file.type.startsWith('image/')) {
                     alert(`File "${file.name}" is not an image.`);
                     serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                     return;
                 }

                try {
                    const dataUrl = await readFileAsDataURL(file);
                    screenshotDataUrls.push(dataUrl);
                    console.log(`serverposts.js: Screenshot "${file.name}" read successfully.`);
                } catch (e) {
                     alert(`Could not read screenshot file "${file.name}".`);
                      serverScreenshotsInput.value = ''; screenshotsPreviewDiv.innerHTML = '';
                      return;
                }
            }
        }

         const validLinks = [];
          console.log(`serverposts.js: Validating ${links.length} links.`);
         for (const link of links) {
             try {
                 new URL(link);
                 validLinks.push(link);
             } catch (e) {
                  console.warn(`serverposts.js: Invalid URL ignored: ${link}`, e);
             }
         }
         console.log(`serverposts.js: ${validLinks.length} valid links found.`);

        const newPost = {
            id: Date.now() + Math.random(),
            icon: iconDataUrl,
            name: name,
            ip: ip,
            description: description,
            screenshots: screenshotDataUrls,
            tags: tags,
            links: validLinks,
            version: version,
            createdAt: new Date().toISOString()
        };
        console.log("serverposts.js: New post object created:", newPost);

        allServerPosts.push(newPost);

        saveAllPosts();

        renderPosts();

        hidePostFormModal();

         alert("Server post created successfully!");
         console.log("serverposts.js: Post submitted successfully.");
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                 resolve(null);
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

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    console.log("serverposts.js: Initializing event listeners and loading initial data.");

    if (createPostButton) {
        console.log("serverposts.js: Create post button found. Adding click listener.");
         createPostButton.removeEventListener('click', showPostFormModal);
         createPostButton.addEventListener('click', showPostFormModal);
         createPostButton.style.display = 'inline-block';
    } else {
        console.warn("serverposts.js: Create post button element not found.");
    }

    if (closePostFormButton) {
         closePostFormButton.removeEventListener('click', hidePostFormModal);
         closePostFormButton.addEventListener('click', hidePostFormModal);
         console.log("serverposts.js: Post modal close button listener added.");
    } else console.warn("serverposts.js: Close post form button not found.");

    if (serverPostForm) {
         serverPostForm.removeEventListener('submit', handlePostSubmit);
         serverPostForm.addEventListener('submit', handlePostSubmit);
          console.log("serverposts.js: Server post form submit listener added.");
    } else console.warn("serverposts.js: Server post form not found.");

    if (serverIconInput) {
         serverIconInput.removeEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
         serverIconInput.addEventListener('change', () => displayImagePreviews(serverIconInput, iconPreviewDiv));
          console.log("serverposts.js: Server icon input change listener added.");
    } else console.warn("serverposts.js: Server icon input not found.");

    if (serverScreenshotsInput) {
         serverScreenshotsInput.removeEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
         serverScreenshotsInput.addEventListener('change', () => displayImagePreviews(serverScreenshotsInput, screenshotsPreviewDiv));
         console.log("serverposts.js: Server screenshots input change listener added.");
    } else console.warn("serverposts.js: Server screenshots input not found.");

     if (postFormModal) {
         postFormModal.removeEventListener('click', (e) => { if (e.target === postFormModal && e.target !== postFormModal.children[0]) hidePostFormModal(); });
         postFormModal.addEventListener('click', (e) => { if (e.target === postFormModal && e.target !== postFormModal.children[0]) hidePostFormModal(); });
         console.log("serverposts.js: Post modal outside click listener added.");
     } else console.warn("serverposts.js: Post form modal element not found.");

    document.addEventListener('showServerPosts', () => {
         console.log("serverposts.js: Received 'showServerPosts' event. Loading and rendering posts.");
         loadAllPosts();
         renderPosts();
    });

     loadAllPosts();
     console.log("serverposts.js: Initial loadAllPosts called.");
});