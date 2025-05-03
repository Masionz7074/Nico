// js/script.js

// Handles the sidebar toggle functionality and switching between static content sections.

console.log("script.js: Script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js: DOMContentLoaded fired.");

    // Get references to the toggle button, the main container, and the sidebar nav list.
    const toggleButton = document.getElementById('sidebarToggle');
    const container = document.querySelector('.container'); // The main flex wrapper
    const sidebarNavUl = document.getElementById('sidebarNav'); // The static ul in the sidebar

    // Get references to all potential content sections in the main area
    // Assumes sections have unique IDs and either 'info-section' or 'content-header' class
    const mainContentArea = document.querySelector('main.content'); // The <main> element
    // Find all elements that are either header.content-header or section.info-section directly within main.content
    const contentSections = mainContentArea ? mainContentArea.querySelectorAll(':scope > section.info-section, :scope > header.content-header') : [];
    const homeSection = document.getElementById('home-section'); // The default 'home' section


    // --- Helper Functions ---

    // Adds event listeners to the static sidebar links for section switching
    function addSidebarLinkListeners() {
        console.log("script.js: Adding sidebar link listeners.");
         // Get all links *within* the hardcoded ul
         const links = sidebarNavUl ? sidebarNavUl.querySelectorAll('li a') : []; // Select 'a' within 'li'

         if (!sidebarNavUl) {
              console.warn("script.js: Sidebar nav UL not found, skipping link listeners.");
              return;
         }
         if (links.length === 0) {
             console.warn("script.js: No links found inside sidebarNav UL.");
         }


         links.forEach(link => {
             // Ensure we only add listeners to links that have a data-target
             if (link.dataset.target) {
                  // Remove previous listeners if any (e.g., if script reloaded)
                  link.removeEventListener('click', handleSidebarLinkClick);
                  link.addEventListener('click', handleSidebarLinkClick);
             } else {
                  console.warn("script.js: Sidebar link found without data-target attribute, skipping listener:", link);
             }
         });
         console.log(`script.js: ${links.length} sidebar link listeners processed.`);
    }

    // Handles click on a sidebar navigation link
    function handleSidebarLinkClick(event) {
        console.log("script.js: Sidebar link click detected.");
        event.preventDefault(); // Stop the browser from jumping immediately

        // Get the target section ID from the link's data attribute
        const targetSectionId = event.target.dataset.target;

        if (targetSectionId) {
            console.log(`script.js: Link target ID: "${targetSectionId}"`);
            showSection(targetSectionId);
            // Optional: Close the sidebar after clicking a link
            if (container && container.classList.contains('sidebar-open')) {
                 container.classList.remove('sidebar-open');
                 // Update button text immediately when closing sidebar
                 if (toggleButton) toggleButton.textContent = '>';
            }
            // Update the hash in the URL without causing a jump
            history.pushState(null, '', `#${targetSectionId}`);
             console.log(`script.js: URL hash updated to #${targetSectionId}.`);
        } else {
             console.warn("script.js: Clicked sidebar link has no data-target attribute or it's empty.", event.target);
        }
    }

    // Shows a specific content section and hides others
    function showSection(sectionId) {
         console.log(`script.js: Attempting to show section: "${sectionId}"`);
         if (!mainContentArea) {
              console.error("script.js: Main content area (.content) not found. Cannot show any section.");
              return;
         }
         if (contentSections.length === 0) {
              console.warn("script.js: No content sections found within the main area. Cannot switch sections.");
              // Optional: Display a message if no sections are found
              // mainContentArea.innerHTML = '<p style="text-align:center; color: var(--theme-error-color);">Error: No content sections found.</p>';
              return;
         }


         let targetSectionFound = false;
         let sectionToShow = null; // Element reference of the section to show

         // Find the target section element
         contentSections.forEach(section => {
              // The home section is special - its ID is 'home-section' and it's usually the first element in the list
              // Check both ID match and handle the specific home section element by reference if ID is missing
             const isTarget = (section.id === sectionId) || (sectionId === 'home-section' && section === homeSection);

            if (isTarget) {
                sectionToShow = section; // Found the section to show
                 targetSectionFound = true;
                 console.log(`script.js: Identified target section element: "${section.id}"`);
            }
        });

         // If the requested section was not found, default to home
         if (!targetSectionFound) {
              console.warn(`script.js: Target section "${sectionId}" not found in the DOM. Defaulting to home-section.`);
             // Update URL hash to home section as well, replacing current state
              history.replaceState(null, '', `#home-section`);
              sectionId = 'home-section'; // Update sectionId for dispatching event
              sectionToShow = homeSection; // Set sectionToShow to the home section element
              if (!sectionToShow) { // If home section itself isn't found (major configuration error)
                   console.error("script.js: Home section element (#home-section) not found. Cannot display any content.");
                  // Display a fallback error message in the main content area
                   if(mainContentArea) {
                        mainContentArea.innerHTML = '<p style="text-align:center; color: var(--theme-error-color);">Critical Error: Home section not found.</p>';
                        // Clear all other section elements that might have been added before this error
                        contentSections.forEach(section => {
                            if (section !== mainContentArea.querySelector('#home-section')) { // Avoid infinite loop if #home-section somehow points to mainContentArea itself
                                 try { section.remove(); } catch(e) { console.error("Error removing section:", section, e); }
                            }
                        });
                   }
                  return; // Cannot proceed
              }
         }


        // Hide all sections except the one to show
        contentSections.forEach(section => {
            if (section !== sectionToShow) {
                section.classList.add('hidden-section');
                section.classList.remove('active-section');
            }
        });

        // Show the target section
        if (sectionToShow) {
             sectionToShow.classList.remove('hidden-section');
             sectionToShow.classList.add('active-section');
             console.log(`script.js: Section "${sectionToShow.id}" set to active.`);

             // Scroll to the top of the content area when switching sections
             // Ensure mainContentArea has overflow-y: auto in CSS
             if (mainContentArea) {
                 mainContentArea.scrollTop = 0;
                 console.log("script.js: Scrolled content area to top.");
             }

             // Dispatch custom events for sections that might need to load data
             // Other scripts (like serverposts.js) can listen for these events
             if (sectionToShow.id === 'server-posts-section') {
                 document.dispatchEvent(new CustomEvent('showServerPosts'));
                 console.log("script.js: Dispatched 'showServerPosts' event.");
             }
             // Removed events for user logs and account management
        }

         // Close the post creation modal if it's open when switching sections
         const postFormModal = document.getElementById('postFormModal');
         if (postFormModal && postFormModal.style.display !== 'none') {
             postFormModal.style.display = 'none';
              console.log("script.js: Closed post form modal on section switch.");
         }
    }


    // --- Initialization ---
    console.log("script.js: Initializing.");

    // Add event listener for the main sidebar toggle button
    if (toggleButton && container) {
        console.log("script.js: Sidebar toggle button and container elements found. Adding click listener.");
        toggleButton.addEventListener('click', () => {
            container.classList.toggle('sidebar-open');
            const isOpen = container.classList.contains('sidebar-open');
            toggleButton.textContent = isOpen ? '<' : '>';
            toggleButton.setAttribute('aria-expanded', isOpen);
             console.log(`script.js: Sidebar toggled. Is open: ${isOpen}`);
        });
    } else {
        console.warn("script.js: Sidebar toggle button or container element not found on initial load. Sidebar toggle may not work.");
    }

    // Add click listeners to the static sidebar menu links
    addSidebarLinkListeners();

    // Show the initial section on page load (check hash, default to Home)
    const initialSection = window.location.hash ? window.location.hash.substring(1) : 'home-section';
    // Use a slight delay to ensure other scripts (like serverposts.js, music.js) have also fired DOMContentLoaded
    // and their event listeners are ready before dispatching section events.
    setTimeout(() => {
         console.log(`script.js: Initial section check after timeout: ${initialSection}`);
         showSection(initialSection);
    }, 100); // Increased timeout slightly for robustness


    // Handle browser back/forward buttons changing the hash
    window.addEventListener('hashchange', () => {
        console.log(`script.js: Hashchange event detected. New hash: ${window.location.hash}`);
         const targetSectionId = window.location.hash ? window.location.hash.substring(1) : 'home-section';
         // When hash changes, just call showSection directly
         showSection(targetSectionId);
    });

    // Optional: Add a check for content sections after a potential delay
    // This can help if content sections aren't immediately available
    setTimeout(() => {
        if (contentSections.length === 0 && mainContentArea) {
            console.error("script.js: Still no content sections found after timeout. Check HTML structure and classes.");
             mainContentArea.innerHTML = '<p style="text-align:center; color: var(--theme-error-color);">Error: Content sections not found.</p>';
        }
    }, 500); // Check after a longer delay

});
