console.log("script.js: Script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("script.js: DOMContentLoaded fired.");

    const toggleButton = document.getElementById('sidebarToggle');
    const container = document.querySelector('.container');
    const sidebarNavUl = document.getElementById('sidebarNav');
    const mainContentArea = document.querySelector('main.content');

    const contentSections = mainContentArea ? mainContentArea.querySelectorAll('section.info-section, header.content-header') : [];
    const homeSection = document.getElementById('home-section');


    function buildSidebarMenu(role) {
        console.log(`script.js: Building sidebar menu for role: ${role}`);
        if (!sidebarNavUl) {
             console.warn("script.js: Sidebar nav UL element not found. Cannot build menu.");
            return;
        }

        sidebarNavUl.innerHTML = '';
         console.log("script.js: Cleared existing sidebar menu.");

        let menuItems = [];

        const baseMenuItems = [
            { text: 'Home', target: 'home-section' },
            { text: 'Rules', target: 'rules' },
            { text: 'Credit', target: 'credit' },
            { text: 'Settings', target: 'settings' },
            { text: 'Account Management', target: 'account-management-section' }
        ];

        if (role === 'admin') {
            menuItems = [
                ...baseMenuItems,
                { text: 'Admin Menu', target: 'user-logs-section' }
            ];
        } else {
             menuItems = [
                 ...baseMenuItems,
                 { text: 'Server Posts', target: 'server-posts-section' }
             ];
        }

         console.log(`script.js: Menu items defined:`, menuItems);

        menuItems.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${item.target}`;
            a.textContent = item.text;
            a.dataset.target = item.target;
            li.appendChild(a);
            sidebarNavUl.appendChild(li);
             console.log(`script.js: Added menu item: ${item.text}`);
        });

         const logoutLi = document.createElement('li');
         logoutLi.classList.add('logout');
         const logoutA = document.createElement('a');
         logoutA.href = "#logout";
         logoutA.textContent = 'Logout';
         logoutA.addEventListener('click', (e) => {
              e.preventDefault();
              if (window.logout && typeof window.logout === 'function') {
                  window.logout();
              } else {
                  console.error("script.js: window.logout function not found!");
                   alert("Logout function not available.");
              }
         });
         logoutLi.appendChild(logoutA);
         sidebarNavUl.appendChild(logoutLi);
         console.log("script.js: Added Logout menu item.");

         addSidebarLinkListeners();
         console.log("script.js: Sidebar link listeners added.");
    }

    function addSidebarLinkListeners() {
         const links = sidebarNavUl ? sidebarNavUl.querySelectorAll('li a') : [];

         links.forEach(link => {
             if (link.dataset.target) {
                  link.removeEventListener('click', handleSidebarLinkClick);
                  link.addEventListener('click', handleSidebarLinkClick);
             }
         });
    }

    function handleSidebarLinkClick(event) {
        console.log("script.js: Sidebar link click detected.");
        event.preventDefault();

        const targetSectionId = event.target.dataset.target;

        if (targetSectionId) {
            console.log(`script.js: Link target ID: "${targetSectionId}"`);
            showSection(targetSectionId);
            if (container && container.classList.contains('sidebar-open')) {
                 container.classList.remove('sidebar-open');
                 if (toggleButton) toggleButton.textContent = '>';
            }
            history.pushState(null, '', `#${targetSectionId}`);
             console.log(`script.js: URL hash updated to #${targetSectionId}.`);
        } else {
             console.warn("script.js: Clicked sidebar link has no data-target attribute.", event.target);
        }
    }

    function showSection(sectionId) {
         console.log(`script.js: Attempting to show section: "${sectionId}"`);
         if (!mainContentArea || contentSections.length === 0) {
             console.warn("script.js: Content area or sections not found for showSection. Cannot show any section.");
             return;
         }

         let targetSectionFound = false;
         let sectionToShow = null;

         contentSections.forEach(section => {
             const isTarget = (section.id === sectionId) || (sectionId === 'home-section' && section === homeSection);

            if (isTarget) {
                sectionToShow = section;
                 targetSectionFound = true;
                 console.log(`script.js: Found target section element: "${section.id}"`);
            }
        });

         if (!targetSectionFound) {
              console.warn(`script.js: Target section "${sectionId}" not found in the DOM. Defaulting to home-section.`);
              history.replaceState(null, '', `#home-section`);
              sectionId = 'home-section';
              sectionToShow = homeSection;
              if (!sectionToShow) {
                   console.error("script.js: Home section element not found. Cannot display any content.");
                  if(mainContentArea) mainContentArea.innerHTML = '<p style="text-align:center; color: var(--theme-error-color);">Error loading content sections.</p>';
                  return;
              }
         }

        contentSections.forEach(section => {
            if (section !== sectionToShow) {
                section.classList.add('hidden-section');
                section.classList.remove('active-section');
            }
        });

        if (sectionToShow) {
             sectionToShow.classList.remove('hidden-section');
             sectionToShow.classList.add('active-section');
             console.log(`script.js: Section "${sectionToShow.id}" set to active.`);

             if (mainContentArea) {
                 mainContentArea.scrollTop = 0;
                 console.log("script.js: Scrolled content area to top.");
             }

             if (sectionToShow.id === 'server-posts-section') {
                 document.dispatchEvent(new CustomEvent('showServerPosts'));
                 console.log("script.js: Dispatched 'showServerPosts' event.");
             } else if (sectionToShow.id === 'user-logs-section') {
                  document.dispatchEvent(new CustomEvent('showUserLogs'));
                  console.log("script.js: Dispatched 'showUserLogs' event.");
             } else if (sectionToShow.id === 'account-management-section') {
                  document.dispatchEvent(new CustomEvent('showAccountManagement'));
                  console.log("script.js: Dispatched 'showAccountManagement' event.");
             }
        }

         const postFormModal = document.getElementById('postFormModal');
         if (postFormModal && postFormModal.style.display !== 'none') {
             postFormModal.style.display = 'none';
              console.log("script.js: Closed post form modal on section switch.");
         }
    }

    console.log("script.js: Initializing event listeners.");

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

    document.addEventListener('authComplete', (event) => {
        const user = event.detail;
         console.log("script.js: Received 'authComplete' event.", user);
        buildSidebarMenu(user.role);

        const initialSection = window.location.hash ? window.location.hash.substring(1) : 'home-section';
        showSection(initialSection);
    });

     document.addEventListener('authLogout', () => {
         console.log("script.js: Received 'authLogout' event.");
         if (sidebarNavUl) {
             sidebarNavUl.innerHTML = '';
             console.log("script.js: Sidebar menu cleared.");
         }
          contentSections.forEach(section => {
              section.classList.add('hidden-section');
              section.classList.remove('active-section');
          });
           console.log("script.js: All content sections hidden.");
           history.pushState(null, '', window.location.pathname);
            console.log("script.js: URL hash cleared.");
     });

     const mainContentAreaOnLoad = document.querySelector('#mainContent');
     if (mainContentAreaOnLoad && mainContentAreaOnLoad.style.display !== 'none') {
          console.log("script.js: Main content area visible on initial load. Assuming authComplete fired and menu built.");
           const initialSection = window.location.hash ? window.location.hash.substring(1) : 'home-section';
           showSection(initialSection);
     } else {
         console.log("script.js: Main content area not visible on initial load. Waiting for authComplete.");
     }

    window.addEventListener('hashchange', () => {
        console.log(`script.js: Hashchange event detected. New hash: ${window.location.hash}`);
         const targetSectionId = window.location.hash ? window.location.hash.substring(1) : 'home-section';
         const mainContentAreaCheck = document.querySelector('#mainContent');
         if (mainContentAreaCheck && mainContentAreaCheck.style.display !== 'none') {
              console.log("script.js: Main content visible, showing section based on hash.");
             showSection(targetSectionId);
         } else {
              console.log("script.js: Main content not visible (logged out), showing auth area and clearing hash.");
             document.getElementById('authArea').style.display = 'flex';
             document.getElementById('mainContent').style.display = 'none';
              history.replaceState(null, '', window.location.pathname);
         }
    });
});