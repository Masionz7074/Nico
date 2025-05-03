// js/logininfo.js

// Handles user authentication (Login/Signup) and simulates admin logs using localStorage.
// IMPORTANT: Using localStorage for passwords and sensitive data is NOT secure for real websites.
// Admin logs in localStorage are also not secure and would be server-side in a real app.

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the elements
    const authArea = document.getElementById('authArea');
    const mainContent = document.getElementById('mainContent');
    const loggedInUsernameSpan = document.getElementById('loggedInUsername'); // Display username
    const userLogsListDiv = document.getElementById('userLogsList'); // Container for logs
    const noLogsMessage = document.getElementById('noLogsMessage'); // Message for empty logs

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginErrorDiv = document.getElementById('loginError');

    const signupUsernameInput = document.getElementById('signupUsername');
    const signupEmailInput = document.getElementById('signupEmail'); // New: Email Input
    const signupPhoneInput = document.getElementById('signupPhone');
    const signupPasswordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupErrorDiv = document.getElementById('signupError');

    const mathProblemSpan = document.getElementById('mathProblem');
    const mathAnswerInput = document.getElementById('mathAnswer');
    const mathErrorDiv = document.getElementById('mathError');


    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');

    // Hardcoded Admin Credentials (INSECURE!)
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'nicospasword'; // This is now the admin password

    // Local Storage Keys
    const ADMIN_LOGS_STORAGE_KEY = 'nicoInfoAdminLogs'; // Stores ALL user registration info for admin
    const CURRENT_USER_STORAGE_KEY = 'nicoInfoCurrentUser'; // Stores username of currently logged-in user
    const CURRENT_USER_ROLE_STORAGE_KEY = 'nicoInfoCurrentUserRole'; // Stores role ('admin' or 'user')

    // Variable to store the correct answer to the current math problem
    let currentMathAnswer = null;

    // --- Helper Functions ---

    // Get ALL registered user data (used by admin logs and login validation)
    function getAllUsersData() {
        const logsJson = localStorage.getItem(ADMIN_LOGS_STORAGE_KEY);
        try {
            const users = logsJson ? JSON.parse(logsJson) : {};
             // Ensure expected format and add default fields if missing (for backward compatibility)
             for (const username in users) {
                 if (users.hasOwnProperty(username)) {
                      // If it's the old simple string password format
                      if (typeof users[username] === 'string') {
                          users[username] = {
                              password: users[username],
                              email: 'unknown', // Add default email
                              phoneNumber: '',
                              registrationDate: 'unknown'
                          };
                     } else {
                         // Ensure keys exist in the user object for structured data
                         if (!users[username].email) users[username].email = ''; // Add default email
                         if (!users[username].phoneNumber) users[username].phoneNumber = '';
                         if (!users[username].registrationDate) users[username].registrationDate = 'unknown';
                     }
                 }
             }
            return users;
        } catch (e) {
            console.error("Error parsing admin logs from localStorage:", e);
            return {}; // Return empty object on error
        }
    }

    // Save ALL registered user data (simulates updating admin logs)
    function saveAllUsersData(users) {
        localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(users));
         console.log(`Saved ${Object.keys(users).length} user logs to admin storage.`);
    }

    // Display an error message
    function displayError(message, errorElement) {
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    // Clear error messages
    function clearErrors(...errorElements) {
        errorElements.forEach(el => {
            if (el) {
                el.textContent = '';
            }
        });
    }

    // Show the main content and hide the auth area
    function showMainContent(username, role) {
        if (authArea && mainContent) {
            authArea.style.display = 'none';
            mainContent.style.display = 'block'; // Use block or flex/grid

             // Display the logged-in username
             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = username;
             }

             console.log(`Showing main content for ${role}: ${username}.`);

             // Dispatch custom event after main content is shown, including user info
             document.dispatchEvent(new CustomEvent('authComplete', { detail: { username: username, role: role } }));
        }
    }

     // Show the auth area and hide main content
     function showAuthArea() {
        if (authArea && mainContent) {
            authArea.style.display = 'flex'; // Use flex to center the box
            mainContent.style.display = 'none';

            // Clear stored login info
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
            localStorage.removeItem(CURRENT_USER_ROLE_STORAGE_KEY);

             // Reset displayed username
             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = 'Guest';
             }

            console.log("Showing auth area. User logged out.");

             // Dispatch custom event for other scripts to know auth is no longer complete
             document.dispatchEvent(new CustomEvent('authLogout'));
        }
     }


    // Generate a simple math problem (e.g., a + b)
    function generateMathProblem() {
        const num1 = Math.floor(Math.random() * 10) + 1; // Numbers between 1 and 10
        const num2 = Math.floor(Math.random() * 10) + 1;
        const problem = `${num1} + ${num2}`;
        currentMathAnswer = num1 + num2; // Store the answer
        if (mathProblemSpan) {
             mathProblemSpan.textContent = problem;
        }
         if (mathAnswerInput) {
              mathAnswerInput.value = ''; // Clear previous answer
         }
        console.log(`Generated math problem: ${problem} = ${currentMathAnswer}`); // Log answer for easy testing
    }

    // Switch between login and signup forms
    function showFormView(view) {
        if (loginForm && signupForm) {
            if (view === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                 clearErrors(signupErrorDiv, mathErrorDiv); // Clear signup errors
            } else if (view === 'signup') {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                 clearErrors(loginErrorDiv); // Clear login errors
                 generateMathProblem(); // Generate a new math problem each time signup is shown
            }
        }
    }

    // Display user logs (Admin only)
    function renderUserLogs() {
         if (!userLogsListDiv) {
             console.warn("userLogsListDiv element not found.");
             return;
         }

         // Only render if the user is admin and the log section is active/visible
         const currentUserRole = localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY);
         const logSection = document.getElementById('user-logs-section'); // Get the log section
         if (currentUserRole !== 'admin' || !logSection || !logSection.classList.contains('active-section')) {
             userLogsListDiv.innerHTML = ''; // Clear content if not admin or section hidden
             if (noLogsMessage) noLogsMessage.style.display = 'block';
              console.log("Attempted to render logs, but user is not admin or section is hidden.");
             return;
         }


         userLogsListDiv.innerHTML = ''; // Clear current list

         const users = getAllUsersData(); // Get all user registration data

         const userEntries = Object.entries(users); // Convert object to array of [username, userObject]

         if (userEntries.length === 0) {
             if (noLogsMessage) noLogsMessage.style.display = 'block';
             return;
         } else {
             if (noLogsMessage) noLogsMessage.style.display = 'none';
         }

         userEntries.forEach(([username, userData]) => {
             // Skip displaying the admin user itself in the logs list
             if (username.toLowerCase() === ADMIN_USERNAME) return;

             const logEntry = document.createElement('div');
             logEntry.classList.add('user-log-entry');

             logEntry.innerHTML = `
                 <p><strong>Username:</strong> <span>${escapeHTML(username)}</span></p>
                 <p><strong>Email:</strong> <span>${escapeHTML(userData.email || 'N/A')}</span></p>
                 <p><strong>Phone:</strong> <span>${escapeHTML(userData.phoneNumber || 'N/A')}</span></p>
                 <p><strong>Registered:</strong> <span>${escapeHTML(new Date(userData.registrationDate).toLocaleString() || 'Unknown Date')}</span></p>
                 <!-- Password is NOT displayed here for slight pseudo-security -->
             `;
             userLogsListDiv.appendChild(logEntry);
         });
          console.log(`Rendered ${userEntries.length} user log entries.`);
    }

     // Basic HTML escaping (to prevent XSS when displaying user input)
    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }


    // --- Event Handlers ---

    // Handle Signup Form Submission
    function handleSignup(event) {
        event.preventDefault();

        clearErrors(signupErrorDiv, mathErrorDiv);

        const username = signupUsernameInput.value.trim();
        const email = signupEmailInput.value.trim(); // Get email
        const phone = signupPhoneInput.value.trim();
        const password = signupPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const mathAnswer = parseInt(mathAnswerInput.value.trim(), 10);

        // --- Validation ---
        if (!username || !email || !password || !confirmPassword) {
            displayError("Please fill in Username, Email, Password, and Confirm Password.", signupErrorDiv);
            return;
        }

         if (isNaN(mathAnswer) || mathAnswerInput.value.trim() === '') {
             displayError("Please solve the math problem.", mathErrorDiv);
             return;
         }

        if (password !== confirmPassword) {
            displayError("Passwords do not match.", signupErrorDiv);
            return;
        }

         if (password.length < 6) {
             displayError("Password must be at least 6 characters long.", signupErrorDiv);
             return;
         }

         if (username.toLowerCase() === ADMIN_USERNAME) {
             displayError(`Cannot register with the username "${ADMIN_USERNAME}".`, signupErrorDiv);
             return;
         }

         // Basic email format check (HTML input type="email" does some validation, but JS adds robustness)
         // This regex is simple; a more robust one is complex and often best server-side.
         const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailPattern.test(email)) {
             displayError("Please enter a valid email address.", signupErrorDiv);
             return;
         }


        // Basic phone number check (pattern handled by HTML input type=tel)
         const phonePattern = /^[0-9]{10,15}$/;
        if (phone && !phonePattern.test(phone)) {
             displayError("Please enter a valid phone number (10-15 digits).", signupErrorDiv);
             return;
        }


        const users = getAllUsersData(); // Get all users (from admin logs)

        // Also check if email is already used (optional, but good practice)
        const emailExists = Object.values(users).some(user => user.email && user.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
             displayError("Email address is already registered.", signupErrorDiv);
             return;
        }

        if (users[username]) {
            displayError("Username already exists. Please choose a different username.", signupErrorDiv);
            return;
        }

        // Math problem check
        if (mathAnswer !== currentMathAnswer) {
             displayError("Incorrect answer. Please try again.", mathErrorDiv);
             generateMathProblem(); // Generate a new problem on incorrect answer
             return;
        }


        // --- Registration ---
        const newUser = {
             password: password, // INSECURE STORAGE
             email: email,      // New: Store email
             phoneNumber: phone,
             registrationDate: new Date().toISOString()
        };

        // Add the new user data to the central logs (simulated in admin localStorage)
        users[username] = newUser;
        saveAllUsersData(users); // Save the updated logs

        // Log in the new user automatically as a 'user' role
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
        localStorage.setItem(CURRENT_USER_ROLE_STORAGE_KEY, 'user'); // Store the role

        console.log("Signup successful for:", username);

        // Show the main content for the newly signed up user
        showMainContent(username, 'user');

        // Clear form fields
        signupUsernameInput.value = '';
        signupEmailInput.value = ''; // Clear email
        signupPhoneInput.value = '';
        signupPasswordInput.value = '';
        confirmPasswordInput.value = '';
        mathAnswerInput.value = '';
        currentMathAnswer = null; // Reset math answer

         // No file download anymore
         alert(`Signup successful! Welcome, ${username}!`);

    }

    // Handle Login Form Submission
    function handleLogin(event) {
        event.preventDefault();

        clearErrors(loginErrorDiv);

        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!username || !password) {
            displayError("Please enter username and password.", loginErrorDiv);
            return;
        }

        // --- Check Admin Login ---
        if (username.toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem(CURRENT_USER_STORAGE_KEY, ADMIN_USERNAME);
            localStorage.setItem(CURRENT_USER_ROLE_STORAGE_KEY, 'admin'); // Store admin role
            console.log("Admin login successful.");
            showMainContent(ADMIN_USERNAME, 'admin');
            // Clear form fields
             loginUsernameInput.value = '';
             loginPasswordInput.value = '';
            return; // Stop here if admin
        }

        // --- Check Normal User Login ---
        const users = getAllUsersData(); // Get all registered users
        const user = users[username]; // Get the user object

        // Check if user exists AND password matches
        if (!user || user.password !== password) {
            displayError("Invalid username or password.", loginErrorDiv);
            return;
        }

        // Normal user login successful
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
        localStorage.setItem(CURRENT_USER_ROLE_STORAGE_KEY, 'user'); // Store user role
        console.log("Normal user login successful for:", username);
        showMainContent(username, 'user');

         // Clear form fields
        loginUsernameInput.value = '';
        loginPasswordInput.value = '';
    }

    // --- Logout Function ---
    // Make this globally accessible so sidebar links can call it
    window.logout = () => {
        console.log("Logging out...");
        // Clear user-specific post data on logout (optional but good practice for privacy)
        const currentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
         if (currentUser) {
              localStorage.removeItem('nicoInfoServerPosts_' + currentUser); // Key used in serverposts.js
              console.log(`Cleared server posts data for user "${currentUser}" from localStorage.`);
         }

        showAuthArea(); // Hide main content, show auth, clear local storage keys
        // Redirect or refresh might be needed depending on your page flow
         window.location.reload(); // Simple reload to trigger auth check and reset state
    };


    // --- Initialize ---

    // Add event listeners for forms and form toggles
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showFormView('signup');
        });
    }
     if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showFormView('login');
        });
     }

    // --- Event Listeners for Admin Logs ---
    // Listen for a custom event dispatched by script.js when the logs section should be shown
    document.addEventListener('showUserLogs', () => {
        console.log("logininfo.js: Received 'showUserLogs' event.");
        renderUserLogs(); // Render logs when the event occurs
    });


    // Check if user is already logged in on page load
    const currentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    const currentUserRole = localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY);

    // Get all users data early, even if not admin, to check for registered users for login default
    const registeredUsers = getAllUsersData();

    // Validate stored user exists in logs (except for hardcoded admin)
    if (currentUser && currentUserRole && (currentUserRole === 'admin' || registeredUsers[currentUser])) {
         console.log(`Found logged-in user ${currentUser} (${currentUserRole}) in localStorage.`);
         // Show main content without requiring re-authentication
         showMainContent(currentUser, currentUserRole);
    } else {
        console.log("No valid logged-in user found in localStorage. Showing auth area.");
        // If no accounts exist (or none are valid), default to signup, otherwise default to login
        if (Object.keys(registeredUsers).length === 0 && ADMIN_USERNAME.toLowerCase() !== localStorage.getItem(CURRENT_USER_STORAGE_KEY)) {
             // No normal users registered and admin isn't the current user, default to signup
            showFormView('signup'); // Will also generate math problem
             console.log("No registered users found, defaulting to signup.");
        } else {
            // Normal users or admin registered, default to login
            showFormView('login');
             console.log("Registered users found, defaulting to login.");
        }
        showAuthArea(); // Ensure auth area is visible
    }
});