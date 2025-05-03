// js/script.js

// Handles the sidebar toggle functionality.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the toggle button and the main content container.
    // These elements are inside #mainContent, which is initially hidden.
    // They are found here because DOMContentLoaded means the elements exist in the DOM tree.
    const toggleButton = document.getElementById('sidebarToggle');
    const container = document.querySelector('.container');

    // Check if the elements were found before adding listeners.
    if (toggleButton && container) {
        console.log("script.js: Sidebar toggle and container elements found.");
        // Add an event listener for clicks on the toggle button.
        toggleButton.addEventListener('click', () => {
            // Toggle the 'sidebar-open' class on the container.
            // CSS rules in style.css control the sidebar and content appearance based on this class.
            container.classList.toggle('sidebar-open');

            // Change the button text based on whether the sidebar is open or closed.
            const isOpen = container.classList.contains('sidebar-open');
            toggleButton.textContent = isOpen ? '<' : '>'; // '>' when closed, '<' when open
            toggleButton.setAttribute('aria-expanded', isOpen); // Update ARIA attribute for accessibility
             console.log(`script.js: Sidebar toggled. Is open: ${isOpen}`);
        });
    } else {
        // This warning is expected if logininfo.js hasn't made #mainContent visible yet,
        // but the elements should still be findable in the DOM tree.
        // If you see this, it might indicate a different issue (e.g., element IDs are wrong).
        console.warn("script.js: Sidebar toggle button or container element not found!");
    }
});