document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('sidebarToggle');
    const container = document.querySelector('.container'); // Use the container to toggle class

    if (toggleButton && container) {
        toggleButton.addEventListener('click', () => {
            // Toggle the 'sidebar-open' class on the container
            container.classList.toggle('sidebar-open');

            // Change the button text based on the container class
            if (container.classList.contains('sidebar-open')) {
                toggleButton.textContent = '<';
            } else {
                toggleButton.textContent = '>';
            }
        });
    } else {
        console.error("Sidebar toggle button or container element not found!");
    }
});