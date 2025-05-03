console.log("music.js: Script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("music.js: DOMContentLoaded fired.");

    const audio = document.getElementById('backgroundMusic');
    const musicToggleBtn = document.getElementById('musicToggle');
    const sidebarNavUl = document.getElementById('sidebarNav');


    let isPlaying = false;

    function updateMusicButtonText() {
        if (musicToggleBtn) {
            musicToggleBtn.textContent = isPlaying ? 'Pause' : 'Play';
            musicToggleBtn.setAttribute('aria-checked', isPlaying);
             console.log(`music.js: Music button text updated to "${musicToggleBtn.textContent}".`);
        } else {
             console.warn("music.js: Music toggle button not found to update text.");
        }
    }

    if (musicToggleBtn && audio) {
        console.log("music.js: Music toggle button and audio element found. Adding listeners.");

        musicToggleBtn.addEventListener('click', () => {
            console.log("music.js: Music toggle button clicked.");
            if (isPlaying) {
                audio.pause();
                console.log("music.js: Music paused by button.");
            } else {
                audio.play().then(() => {
                    console.log("music.js: Music playback started successfully.");
                }).catch(error => {
                    console.warn("music.js: Music playback failed (likely browser autoplay policy). User might need to interact more with the page.", error);
                });
            }
            isPlaying = !isPlaying;
            updateMusicButtonText();
        });

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
             } else if (!isPlaying) {
                  console.log("music.js: Music native pause event ignored (already paused or seeking).");
             }
         });

         audio.addEventListener('play', () => {
             if (!isPlaying) {
                 isPlaying = true;
                 updateMusicButtonText();
                 console.log("music.js: Music playing (native event).");
             } else {
                  console.log("music.js: Music native play event ignored (already playing).");
             }
         });

        updateMusicButtonText();

    } else {
         console.warn("music.js: Music toggle button or audio element not found! Music controls may be hidden.");
         const musicControlsDiv = document.querySelector('.music-controls');
         if (musicControlsDiv) {
             musicControlsDiv.style.display = 'none';
         }
    }

    window.addEventListener('beforeunload', () => {
        if (audio && !audio.paused) {
             audio.pause();
             console.log("music.js: Music paused on window unload.");
        }
    });

    if (sidebarNavUl && audio) {
        console.log("music.js: Attaching event delegation for sidebar links.");
         sidebarNavUl.addEventListener('click', (event) => {
             const clickedLink = event.target.closest('.sidebar nav li a');
             if (clickedLink) {
                  console.log("music.js: Sidebar link clicked, pausing music.");
                  if (!audio.paused) {
                      audio.pause();
                      isPlaying = false;
                      updateMusicButtonText();
                  }
             }
         });
    } else {
         console.warn("music.js: Sidebar nav UL or audio element missing. Cannot attach pause on link click.");
    }
});