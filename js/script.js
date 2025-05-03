// js/script.js

// Handles the sidebar toggle functionality, dynamic menu based on user role,
// and switching between content sections.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the toggle button, the main content container, and the sidebar nav list.
    const toggleButton = document.getElementById('sidebarToggle');
    const container = document.querySelector('.container');
    const sidebarNavUl = document.getElementById('sidebarNav');
    const mainContentArea = document.querySelector('main.content'); // The <main> element

    // Get references to all potential content sections
    const contentSections = mainContentArea ? mainContentArea.querySelectorAll('section.info-section, header.content-header') : [];
    const homeSection = document.getElementById('home-section'); // The welcome header is the default 'home'


    // --- Helper Functions ---

    // Builds the sidebar menu based on the user's role
    function buildSidebarMenu(role) {
        if (!sidebarNavUl) return; // Ensure the ul exists

        // Clear the current menu
        sidebarNavUl.innerHTML = '';

        let menuItems = [];

        // Define menu items with a target section ID
        const baseMenuItems = [
            { text: 'Home', target: 'home-section' },
            { text: 'Rules', target: 'rules' },
            { text: 'Credit', target: 'credit' },
            { text: 'Settings', target: 'settings' }
        ];

        if (role === 'admin') {
            menuItems = [
                ...baseMenuItems,
                { text: 'Admin Menu', target: 'user-logs-section' } // Link to the logs section for admin
            ];
        } else { // Role is 'user' or any other non-admin
             menuItems = [
                 ...baseMenuItems,
                 { text: 'Server Posts', target: 'server-posts-section' } // Link to server posts section for users
             ];
        }

        // Add menu items to the list
        menuItems.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${item.target}`; // Use hash links for navigation
            a.textContent = item.text;
             // Store target ID on the link for easier event handling
            a.dataset.target = item.target;
            li.appendChild(a);
            sidebarNavUl.appendChild(li);
        });

         // Add the Logout link at the bottom
         const logoutLi = document.createElement('li');
         logoutLi.classList.add('logout'); // Add class for styling
         const logoutA = document.createElement('a');
         logoutA.href = "#"; // Or handle it purely with JS
         logoutA.textContent = 'Logout';
         logoutA.addEventListener('click', (e) => {
              e.preventDefault(); // Prevent default link behavior
              window.logout(); // Call the global logout function from logininfo.js
         });
         logoutLi.appendChild(logoutA);
         sidebarNavUl.appendChild(logoutLi);

         // Add click listeners to the newly created links
         addSidebarLinkListeners();
    }

    // Adds event listeners to sidebar links for section switching
    function addSidebarLinkListeners() {
         // Get all links *within* the dynamically built ul
         const links = sidebarNavUl ? sidebarNavUl.querySelectorAll('a') : [];

         links.forEach(link => {
             // Ensure we only add listeners to links that have a data-target (i.e., not the Logout link if it doesn't have one)
             if (link.dataset.target) {
                  // Remove old listeners using a shared function reference if menu was rebuilt frequently
                  // For this specific case where it rebuilds once, it's less critical,
                  // but adding defensive code is good. However, direct listeners added here
                  // will replace themselves naturally if buildSidebarMenu clears innerHTML.
                  link.addEventListener('click', handleSidebarLinkClick);
             }
         });
    }

    // Handles click on a sidebar navigation link
    function handleSidebarLinkClick(event) {
        event.preventDefault(); // Stop the browser from jumping immediately

        // Get the target section ID from the link's data attribute
        const targetSectionId = event.target.dataset.target;

        if (targetSectionId) {
            console.log(`script.js: Sidebar link clicked: Navigating to section "${targetSectionId}"`);
            showSection(targetSectionId);
            // Optional: Close the sidebar after clicking a link
            if (container && container.classList.contains('sidebar-open')) {
                 container.classList.remove('sidebar-open');
                 if (toggleButton) toggleButton.textContent = '>'; // Update button text
            }
            // Update the hash in the URL without causing a jump
            // history.pushState is better than history.replaceState for navigation history
            history.pushState(null, '', `#${targetSectionId}`);
        }
    }

    // Shows a specific content section and hides others
    function showSection(sectionId) {
         if (!mainContentArea || contentSections.length === 0) {
             console.warn("script.js: Content area or sections not found for showSection.");
             return;
         }

         console.log(`script.js: Attempting to show section: ${sectionId}`);

         let targetSectionFound = false;

        contentSections.forEach(section => {
            // Determine if this section is the target section
             const isTarget = (section.id === sectionId) || (sectionId === 'home-section' && section === homeSection);

            if (isTarget) {
                section.classList.remove('hidden-section');
                section.classList.add('active-section');
                 console.log(`script.js: Section "${section.id}" set to active.`);
                 targetSectionFound = true;
            } else {
                section.classList.add('hidden-section');
                section.classList.remove('active-section');
                 // console.log(`script.js: Section "${section.id}" set to hidden.`); // Too verbose
            }
        });

         // If the requested section was not found, default to home
         if (!targetSectionFound) {
              console.warn(`script.js: Target section "${sectionId}" not found. Defaulting to home-section.`);
             showSection('home-section'); // Recursive call, but base case is home-section always exists
             return; // Prevent dispatching events for a non-existent section
         }


        // Dispatch custom events for sections that need to load data
        // Other scripts (like serverposts.js and logininfo.js for logs) listen for these
        if (sectionId === 'server-posts-section') {
            document.dispatchEvent(new CustomEvent('showServerPosts'));
            console.log("script.js: Dispatched 'showServerPosts' event.");
        } else if (sectionId === 'user-logs-section') {
             document.dispatchEvent(new CustomEvent('showUserLogs'));
             console.log("script.js: Dispatched 'showUserLogs' event.");
        }
         // Close the post creation modal if it's open when switching sections
         const postFormModal = document.getElementById('postFormModal');
         if (postFormModal && postFormModal.style.display !== 'none') {
             postFormModal.style.display = 'none';
              console.log("script.js: Closed post form modal on section switch.");
         }
    }


    // --- Initialization ---

    // Add event listener for the main sidebar toggle button
    if (toggleButton && container) {
        console.log("script.js: Sidebar toggle and container elements found.");
        toggleButton.addEventListener('click', () => {
            container.classList.toggle('sidebar-open');
            const isOpen = container.classList.contains('sidebar-open');
            toggleButton.textContent = isOpen ? '<' : '>';
            toggleButton.setAttribute('aria-expanded', isOpen);
             console.log(`script.js: Sidebar toggled. Is open: ${isOpen}`);
        });
    } else {
        console.warn("script.js: Sidebar toggle button or container element not found on initial load.");
    }

    // Listen for the custom event from logininfo.js when authentication is complete
    document.addEventListener('authComplete', (event) => {
        const user = event.detail; // Get user info (username, role) from the event
         console.log("script.js: Received 'authComplete' event.", user);
        // Build the sidebar menu based on the user's role
        buildSidebarMenu(user.role);

        // Show the default section after login (check hash, default to Home)
        const initialSection = window.location.hash ? window.location.hash.substring(1) : 'home-section';
        showSection(initialSection);
    });

     // Listen for the custom event from logininfo.js when user logs out
     document.addEventListener('authLogout', () => {
         console.log("script.js: Received 'authLogout' event.");
         // Clear the sidebar menu
         if (sidebarNavUl) {
             sidebarNavUl.innerHTML = '';
         }
          // Hide all sections
          contentSections.forEach(section => {
              section.classList.add('hidden-section');
              section.classList.remove('active-section');
          });
           // Reset URL hash
           history.pushState(null, '', window.location.pathname); // Removes the #hash
     });


     // Handle initial page load if already logged in (authComplete would have fired)
     // This check runs immediately if mainContent is visible (meaning logininfo.js already ran)
     const mainContentAreaOnLoad = document.querySelector('#mainContent'); // Use ID for robustness
     if (mainContentAreaOnLoad && mainContentAreaOnLoad.style.display !== 'none') {
          console.log("script.js: Main content area visible on initial load. Assuming authComplete fired.");
          // The authComplete handler should have built the menu and shown the initial section.
          // If for some reason it didn't, you might need a delayed call here or rely purely on authComplete.
          // For this demo setup, authComplete should reliably fire first if logged in.
          // We can still call showSection to ensure the correct section is active based on hash on refresh.
           const initialSection = window.location.hash ? window.location.hash.substring(1) : 'home-section';
           showSection(initialSection); // Show the correct section on load based on hash or default
     } else {
         console.log("script.js: Main content area not visible on initial load. Waiting for authComplete.");
     }

    // Handle browser back/forward buttons changing the hash
    window.addEventListener('hashchange', () => {
         const targetSectionId = window.location.hash ? window.location.hash.substring(1) : 'home-section';
         // Only show section if main content is visible (i.e., user is logged in)
         const mainContentAreaCheck = document.querySelector('#mainContent');
         if (mainContentAreaCheck && mainContentAreaCheck.style.display !== 'none') {
             showSection(targetSectionId);
         } else {
             // If hash changes while logged out, ensure auth area is visible
             document.getElementById('authArea').style.display = 'flex';
             document.getElementById('mainContent').style.display = 'none';
         }
    });

});