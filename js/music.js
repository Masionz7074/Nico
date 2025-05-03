// js/music.js

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('backgroundMusic');
    const musicToggleBtn = document.getElementById('musicToggle');
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');

    // Initial state
    let isPlaying = false;
    // Optional: Auto-play when page loads (be mindful of browser restrictions)
    // audio.play().catch(e => console.log("Autoplay prevented:", e));
    // isPlaying = true; // If attempting autoplay
    // updateMusicButtonText(); // Update button text accordingly if autoplay

    // Function to update the button text
    function updateMusicButtonText() {
        musicToggleBtn.textContent = isPlaying ? 'Pause' : 'Play';
        musicToggleBtn.setAttribute('aria-checked', isPlaying); // Accessibility
    }

    // Toggle Play/Pause on button click
    if (musicToggleBtn && audio) {
        musicToggleBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
            } else {
                // Using .play() returns a Promise
                audio.play().then(() => {
                    // Playback started successfully
                }).catch(error => {
                    // Handle potential errors (e.g., user hasn't interacted yet)
                    console.warn("Music playback failed:", error);
                    // Maybe show a message to the user
                });
            }
            isPlaying = !isPlaying; // Toggle the state
            updateMusicButtonText(); // Update button text
        });

        // Update state if audio ends (e.g., not looped)
        audio.addEventListener('ended', () => {
            isPlaying = false;
            updateMusicButtonText();
        });

        // Update state if audio is paused by other means (e.g., browser tab change)
         audio.addEventListener('pause', () => {
             if (isPlaying) { // Only update state if we thought it was playing
                isPlaying = false;
                updateMusicButtonText();
             }
         });

         // Update state if audio starts playing by other means
         audio.addEventListener('play', () => {
             if (!isPlaying) { // Only update state if we thought it was paused
                 isPlaying = true;
                 updateMusicButtonText();
             }
         });

        // Initial button text update
        updateMusicButtonText();

    } else {
         console.error("Music toggle button or audio element not found!");
         // Optionally hide the music controls if elements are missing
         if (document.querySelector('.music-controls')) {
             document.querySelector('.music-controls').style.display = 'none';
         }
    }


    // Pause music when the tab is closed or user navigates away
    // This is often handled automatically by browsers on tab switch/minimize,
    // but `beforeunload` ensures it's paused when the page is explicitly left.
    window.addEventListener('beforeunload', () => {
        if (audio && !audio.paused) {
             audio.pause();
             // Note: You cannot reliably resume music here after unload
             // because browser restrictions prevent autoplay without user interaction.
        }
    });

    // Pause music when a sidebar link is clicked
    if (sidebarLinks.length > 0 && audio) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!audio.paused) {
                    audio.pause();
                    isPlaying = false; // Update internal state
                    updateMusicButtonText(); // Update button text
                }
                // Optional: Close sidebar on link click
                // document.querySelector('.container').classList.remove('sidebar-open');
                // document.getElementById('sidebarToggle').textContent = '>';
            });
        });
    }
});