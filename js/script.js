// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('sidebarToggle');
    const container = document.querySelector('.container'); // Use the container to toggle class

    if (toggleButton && container) {
        toggleButton.addEventListener('click', () => {
            // Toggle the 'sidebar-open' class on the container
            container.classList.toggle('sidebar-open');

            // Change the button text based on the container class
            const isOpen = container.classList.contains('sidebar-open');
            toggleButton.textContent = isOpen ? '<' : '>';
            toggleButton.setAttribute('aria-expanded', isOpen); // Accessibility
        });
    } else {
        console.error("Sidebar toggle button or container element not found!");
    }
});