// js/logininfo.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to the elements
    const authArea = document.getElementById('authArea');
    const mainContent = document.getElementById('mainContent');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginErrorDiv = document.getElementById('loginError');

    const signupUsernameInput = document.getElementById('signupUsername');
    const signupPhoneInput = document.getElementById('signupPhone');
    const signupPasswordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupErrorDiv = document.getElementById('signupError');

    const mathProblemSpan = document.getElementById('mathProblem');
    const mathAnswerInput = document.getElementById('mathAnswer');
    const mathErrorDiv = document.getElementById('mathError');


    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');

    // Local Storage Key for users (maps username to user object)
    // INSECURE FOR REAL APPS - DEMO ONLY
    const USERS_STORAGE_KEY = 'nicoInfoUsers';
    const CURRENT_USER_STORAGE_KEY = 'nicoInfoCurrentUser'; // To remember logged-in user

    // Variable to store the correct answer to the current math problem
    let currentMathAnswer = null;


    // --- Helper Functions ---

    // Get users from localStorage or initialize empty object
    function getUsers() {
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        try {
            const users = usersJson ? JSON.parse(usersJson) : {};
             // Basic check/conversion for older stored data format
             for (const username in users) {
                 if (users.hasOwnProperty(username)) {
                      if (typeof users[username] === 'string') {
                          users[username] = { password: users[username], phoneNumber: '' };
                     } else if (typeof users[username] === 'object' && users[username] !== null && !users[username].phoneNumber) {
                         users[username].phoneNumber = ''; // Ensure phoneNumber exists
                     }
                 }
             }
            return users;
        } catch (e) {
            console.error("Error parsing users from localStorage:", e);
            return {}; // Return empty object on error
        }
    }

    // Save users to localStorage
    function saveUsers(users) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
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
    function showMainContent() {
        if (authArea && mainContent) {
            authArea.style.display = 'none';
            mainContent.style.display = 'block'; // Use block or flex/grid
             console.log("Showing main content.");
             // Dispatch custom event after main content is shown
             document.dispatchEvent(new CustomEvent('authComplete'));
        }
    }

     // Show the auth area and hide main content
     function showAuthArea() {
        if (authArea && mainContent) {
            authArea.style.display = 'flex'; // Use flex to center the box
            mainContent.style.display = 'none';
            console.log("Showing auth area.");
             // Clear any stored logged-in user for this demo
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
             // Dispatch custom event for other scripts to know auth is no longer complete
             document.dispatchEvent(new CustomEvent('authLogout')); // Or 'authRequired'
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

    // Trigger a file download (Simulating saving to "logged" folder)
    function downloadUserData(userData, filename) {
        const jsonString = JSON.stringify(userData, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'user_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Triggered download for ${filename}`);
    }

    // --- Event Handlers ---

    // Handle Signup Form Submission
    function handleSignup(event) {
        event.preventDefault();

        clearErrors(signupErrorDiv, mathErrorDiv);

        const username = signupUsernameInput.value.trim();
        const phone = signupPhoneInput.value.trim();
        const password = signupPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        const mathAnswer = parseInt(mathAnswerInput.value.trim(), 10);


        // --- Validation ---
        if (!username || !phone || !password || !confirmPassword || isNaN(mathAnswer)) {
            displayError("Please fill in all required fields and solve the math problem.", signupErrorDiv);
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

        // Basic phone number check (matches the pattern in HTML)
        const phonePattern = /^[0-9]{10,15}$/; // Allows 10 to 15 digits
        if (phone && !phonePattern.test(phone)) {
             displayError("Please enter a valid phone number (10-15 digits).", signupErrorDiv);
             return;
        }

        const users = getUsers();

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
             phoneNumber: phone,
             registrationDate: new Date().toISOString()
        };

        // Add the new user
        users[username] = newUser;
        saveUsers(users);

        // Simulate logging in the new user automatically
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);

        console.log("Signup successful for:", username);

        // --- Simulate saving to "logged" folder via Download ---
        // Only include necessary info for the "logged" file, maybe exclude password?
        const loggedUserData = {
            username: username,
            phoneNumber: phone,
            registrationDate: newUser.registrationDate
            // password: password // REMOVED password from download for slight pseudo-security
        };
        downloadUserData(loggedUserData, `${username}_logged_info.json`);
        alert(`Signup successful!\nA file named "${username}_logged_info.json" has been downloaded with your registration details (excluding password).`);


        // Show the main content
        showMainContent();

        // Clear form fields
        signupUsernameInput.value = '';
        signupPhoneInput.value = '';
        signupPasswordInput.value = '';
        confirmPasswordInput.value = '';
        mathAnswerInput.value = '';
        currentMathAnswer = null; // Reset math answer

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

        const users = getUsers();
        const user = users[username];

        // Check if user exists AND password matches (check against user.password)
        if (!user || user.password !== password) {
            displayError("Invalid username or password.", loginErrorDiv);
            return;
        }

        // Login successful
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
        showMainContent();

         // Clear form fields
        loginUsernameInput.value = '';
        loginPasswordInput.value = '';

        console.log("Login successful for:", username);
    }

    // --- Initialize ---

    // Add event listeners
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

    // Check if user is already logged in
    const currentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    // Load users once at the start for the check
    const registeredUsers = getUsers();

    if (currentUser && registeredUsers[currentUser]) {
        console.log(`User ${currentUser} found in local storage and registered. Showing main content.`);
        showMainContent();
    } else {
        console.log("No user found in local storage or user not registered. Showing auth area.");
        // If no accounts exist, default to signup, otherwise default to login
        if (Object.keys(registeredUsers).length === 0) {
            showFormView('signup'); // Will also generate math problem
             console.log("No registered users found, defaulting to signup.");
        } else {
            showFormView('login');
             console.log("Registered users found, defaulting to login.");
        }
        showAuthArea(); // Ensure auth area is visible
    }

     // Optional: Add a logout function (e.g., attached to a button in the sidebar)
     window.logout = () => {
         localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
         // Clear server posts local storage for this user on logout (optional)
         localStorage.removeItem('nicoInfoServerPosts_' + currentUser); // Assuming post storage key uses username
         console.log("User logged out. Server posts cleared from local storage.");
         // Show auth area and refresh (simple way to reset state)
         window.location.reload();
     };

});