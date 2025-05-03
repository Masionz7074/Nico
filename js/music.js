// js/music.js - No changes needed

// Handles background music playback and control.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the audio element and the music toggle button.
    const audio = document.getElementById('backgroundMusic');
    const musicToggleBtn = document.getElementById('musicToggle');
    // Get references to sidebar links container to pause music on navigation.
    const sidebarNavUl = document.getElementById('sidebarNav');


    // State variable to track if music is currently playing (needed for button text).
    let isPlaying = false; // Start assuming it's not playing

    // Function to update the text shown on the music control button.
    function updateMusicButtonText() {
        // Check if the button element exists before trying to update it.
        if (musicToggleBtn) {
            musicToggleBtn.textContent = isPlaying ? 'Pause' : 'Play';
            musicToggleBtn.setAttribute('aria-checked', isPlaying); // Accessibility for toggle buttons
        }
    }

    // Check if both the button and the audio element were found.
    if (musicToggleBtn && audio) {
        console.log("music.js: Music toggle button and audio element found.");

        // Add an event listener to the music toggle button.
        musicToggleBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause(); // If playing, pause it.
                console.log("music.js: Music paused by button.");
            } else {
                // If not playing, attempt to play it.
                audio.play().then(() => {
                    console.log("music.js: Music playback started by button.");
                }).catch(error => {
                    console.warn("music.js: Music playback failed (likely autoplay blocked). User might need to interact more.", error);
                });
            }
            isPlaying = !isPlaying; // Toggle the state variable immediately.
            updateMusicButtonText(); // Update the button text to reflect the new state.
        });

        // Listen for native audio events to keep state in sync
        audio.addEventListener('ended', () => {
            isPlaying = false;
            updateMusicButtonText();
            console.log("music.js: Music ended.");
        });

         audio.addEventListener('pause', () => {
             if (isPlaying && !audio.seeking) {
                isPlaying = false;
                updateMusicButtonText();
                console.log("music.js: Music paused (native event).");
             }
         });

         audio.addEventListener('play', () => {
             if (!isPlaying) {
                 isPlaying = true;
                 updateMusicButtonText();
                 console.log("music.js: Music playing (native event).");
             }
         });

        // Initial button text update
        updateMusicButtonText();

    } else {
         console.warn("music.js: Music toggle button or audio element not found!");
         const musicControlsDiv = document.querySelector('.music-controls');
         if (musicControlsDiv) {
             musicControlsDiv.style.display = 'none';
         }
    }


    // Pause music when the user navigates away from the page.
    window.addEventListener('beforeunload', () => {
        if (audio && !audio.paused) {
             audio.pause();
             console.log("music.js: Music paused on window unload.");
        }
    });

    // Pause music when a sidebar link is clicked.
    // We now delegate this to the sidebarNavUl as links are dynamically created.
    if (sidebarNavUl && audio) {
        console.log("music.js: Attaching event delegation for sidebar links.");
         sidebarNavUl.addEventListener('click', (event) => {
             // Check if the clicked target or its closest ancestor is a sidebar link
             const clickedLink = event.target.closest('.sidebar nav a');
             if (clickedLink) {
                  // Pause music whenever *any* sidebar link is clicked
                  if (!audio.paused) {
                      audio.pause();
                      isPlaying = false; // Update internal state
                      updateMusicButtonText(); // Update button text
                      console.log("music.js: Music paused on sidebar link click.");
                  }
             }
         });
    } else {
         console.warn("music.js: Sidebar nav UL or audio element missing. Cannot attach pause on link click.");
    }

});