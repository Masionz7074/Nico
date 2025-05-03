// js/music.js - No changes needed to core logic

document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('backgroundMusic');
    const musicToggleBtn = document.getElementById('musicToggle');
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');

    let isPlaying = false;

    // Function to update the button text
    function updateMusicButtonText() {
        if (musicToggleBtn) { // Added check in case element wasn't found
            musicToggleBtn.textContent = isPlaying ? 'Pause' : 'Play';
            musicToggleBtn.setAttribute('aria-checked', isPlaying); // Accessibility
        }
    }

    // Toggle Play/Pause on button click
    if (musicToggleBtn && audio) {
        musicToggleBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
            } else {
                // Using .play() returns a Promise
                audio.play().then(() => {
                    console.log("Music playback started.");
                    // Playback started successfully
                }).catch(error => {
                    // Handle potential errors (e.g., user hasn't interacted yet, browser policy)
                    console.warn("Music playback failed:", error);
                    // You might want to display a message to the user here
                    // e.g., "Click 'Play' again after interacting with the page."
                });
            }
            isPlaying = !isPlaying; // Toggle the state regardless of play() success immediately
            updateMusicButtonText(); // Update button text
        });

        // Update state if audio ends (e.g., not looped)
        audio.addEventListener('ended', () => {
            isPlaying = false;
            updateMusicButtonText();
        });

        // Update state if audio is paused by other means (e.g., browser tab change)
         audio.addEventListener('pause', () => {
             // Only update state if we thought it was playing - prevent infinite loop if user manually pauses
             // Simple check: if (!audio.seeking) { ... }
             if (isPlaying && !audio.seeking) {
                isPlaying = false;
                updateMusicButtonText();
                console.log("Music paused.");
             }
         });

         // Update state if audio starts playing by other means
         audio.addEventListener('play', () => {
             if (!isPlaying) { // Only update state if we thought it was paused
                 isPlaying = true;
                 updateMusicButtonText();
                  console.log("Music playing.");
             }
         });

        // Initial button text update
        updateMusicButtonText();

    } else {
         console.warn("Music toggle button or audio element not found (expected if main content is hidden).");
         // Optionally hide the music controls if elements are missing
         const musicControlsDiv = document.querySelector('.music-controls');
         if (musicControlsDiv) {
             musicControlsDiv.style.display = 'none';
         }
    }


    // Pause music when the tab is closed or user navigates away
    window.addEventListener('beforeunload', () => {
        if (audio && !audio.paused) {
             audio.pause();
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
                    console.log("Music paused on link click.");
                }
                // Optional: Close sidebar on link click - add this to script.js instead?
                // Or add a custom event listener here that script.js listens for.
            });
        });
    }
});
