// js/music.js

// Handles background music playback and control.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the audio element and the music toggle button.
    // These elements are inside #mainContent, which is initially hidden.
    // They are found here because DOMContentLoaded means the elements exist in the DOM tree.
    const audio = document.getElementById('backgroundMusic');
    const musicToggleBtn = document.getElementById('musicToggle');
    // Get references to sidebar links to pause music on navigation.
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');

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
                // .play() returns a Promise, useful for handling autoplay policies.
                audio.play().then(() => {
                    console.log("music.js: Music playback started by button.");
                    // Playback started successfully.
                }).catch(error => {
                    // Handle potential errors (e.g., browser blocked autoplay).
                    console.warn("music.js: Music playback failed (likely autoplay blocked). User might need to interact more.", error);
                    // The isPlaying state might be temporarily wrong here until the user interacts.
                    // For robustness, you might want to revert isPlaying and update button text here,
                    // or rely on the 'play'/'pause' events on the audio element itself.
                });
            }
            // Toggle the state variable immediately.
            isPlaying = !isPlaying;
            // Update the button text to reflect the new state.
            updateMusicButtonText();
        });

        // Listen for the 'ended' event on the audio element (in case loop is removed).
        audio.addEventListener('ended', () => {
            isPlaying = false; // Music stopped
            updateMusicButtonText();
            console.log("music.js: Music ended.");
        });

        // Listen for the native 'pause' event on the audio element.
        // This captures pauses triggered by the button *and* by the browser
        // (e.g., when the tab is switched or minimized).
         audio.addEventListener('pause', () => {
             // Avoid updating state/button text if the pause was intentional (like seeking)
             // and we already think it's paused. Simple check: if state is still true.
             if (isPlaying && !audio.seeking) { // Check !audio.seeking to ignore pauses during seeks
                isPlaying = false;
                updateMusicButtonText();
                console.log("music.js: Music paused (native event).");
             }
         });

         // Listen for the native 'play' event on the audio element.
         // This captures playback starting, including successful resolution of .play() promises.
         audio.addEventListener('play', () => {
             if (!isPlaying) { // Only update state if we thought it was paused
                 isPlaying = true;
                 updateMusicButtonText();
                 console.log("music.js: Music playing (native event).");
             }
         });


        // Initial button text update based on the default isPlaying state (false).
        updateMusicButtonText();

    } else {
         // This warning is expected if logininfo.js hasn't made #mainContent visible yet,
         // but the elements should still be findable in the DOM tree.
         console.warn("music.js: Music toggle button or audio element not found!");
         // Optionally hide the music controls section if elements are missing.
         const musicControlsDiv = document.querySelector('.music-controls');
         if (musicControlsDiv) {
             musicControlsDiv.style.display = 'none';
         }
    }


    // Pause music when the user navigates away from the page.
    // This is often handled automatically by modern browsers, but `beforeunload` provides a fallback.
    window.addEventListener('beforeunload', () => {
        if (audio && !audio.paused) {
             audio.pause();
             console.log("music.js: Music paused on window unload.");
             // Note: Cannot reliably resume music after unload because browser policies prevent autoplay.
        }
    });

    // Pause music when a sidebar link is clicked (as requested).
    // This assumes sidebar links cause navigation (even if just hash changes).
    if (sidebarLinks.length > 0 && audio) {
         console.log(`music.js: Found ${sidebarLinks.length} sidebar links.`);
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (!audio.paused) {
                    audio.pause();
                    isPlaying = false; // Update internal state
                    updateMusicButtonText(); // Update button text
                    console.log("music.js: Music paused on sidebar link click.");
                }
                // Note: If the sidebar toggle should close automatically on click,
                // that logic belongs in script.js or should be handled via a custom event.
            });
        });
    } else {
         console.warn("music.js: No sidebar links found or audio element missing. Cannot attach pause on link click.");
    }
});