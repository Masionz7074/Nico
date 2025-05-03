// js/logininfo.js

// Handles user authentication (Login/Signup), account management,
// and simulates admin logs using localStorage.
// IMPORTANT: Using localStorage for passwords and sensitive data is NOT secure for real websites.
// Admin logs in localStorage are also not secure and would be server-side in a real app.
// Client-side cooldowns and image storage in localStorage have significant limitations.

console.log("logininfo.js: Script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("logininfo.js: DOMContentLoaded fired.");

    // Get references to the elements
    const authArea = document.getElementById('authArea');
    const mainContent = document.getElementById('mainContent');
    const loggedInUsernameSpan = document.getElementById('loggedInUsername'); // Display username
    const userLogsListDiv = document.getElementById('userLogsList'); // Container for logs
    const noLogsMessage = document.getElementById('noLogsMessage'); // Message for empty logs

    // Auth Forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginErrorDiv = document.getElementById('loginError');

    const signupUsernameInput = document.getElementById('signupUsername');
    const signupEmailInput = document.getElementById('signupEmail'); // Email Input
    const signupPhoneInput = document.getElementById('signupPhone');
    const signupPasswordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupErrorDiv = document.getElementById('signupError');

    const mathProblemSpan = document.getElementById('mathProblem');
    const mathAnswerInput = document.getElementById('mathAnswer');
    const mathErrorDiv = document.getElementById('mathError');


    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');

    // Account Management Elements
    const accountManagementSection = document.getElementById('account-management-section'); // Reference to the section itself
    const accountUpdateForm = document.getElementById('accountUpdateForm');
    const profilePicturePreviewImg = document.getElementById('profilePicturePreview');
    const currentUsernameDisplaySpan = document.getElementById('currentUsernameDisplay');
    const currentEmailDisplaySpan = document.getElementById('currentEmailDisplay');
    const updateProfilePictureInput = document.getElementById('updateProfilePicture');
    const updateUsernameInput = document.getElementById('updateUsername');
    const usernameCooldownMessageDiv = document.getElementById('usernameCooldownMessage');
    const currentPasswordForUpdateInput = document.getElementById('currentPasswordForUpdate');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const accountUpdateErrorDiv = document.getElementById('accountUpdateError');
    const accountUpdateSuccessDiv = document.getElementById('accountUpdateSuccess'); // Success message

    // Hardcoded Admin Credentials (INSECURE!)
    const ADMIN_USERNAME = 'admin';
    let ADMIN_PASSWORD = 'nicospasword'; // Use `let` so we can update it if admin changes it


    // Local Storage Keys
    const ADMIN_LOGS_STORAGE_KEY = 'nicoInfoAdminLogs'; // Stores ALL user registration info for admin
    const CURRENT_USER_STORAGE_KEY = 'nicoInfoCurrentUser'; // Stores username of currently logged-in user
    const CURRENT_USER_ROLE_STORAGE_KEY = 'nicoInfoCurrentUserRole'; // Stores role ('admin' or 'user')

    // Constants
    const USERNAME_CHANGE_COOLDOWN_DAYS = 7; // Cooldown period in days
    const MS_PER_DAY = 1000 * 60 * 60 * 24; // Milliseconds in a day
    const MAX_PROFILE_PIC_SIZE = 500 * 1024; // 500KB max size for profile pictures

    // Variable to store the correct answer to the current math problem
    let currentMathAnswer = null;

    // Store current logged-in user details (username, role, and full data object from logs)
    let currentLoggedInUser = null; // { username, role, data: { password, email, phoneNumber, registrationDate, profilePicture, lastUsernameChange } }


    // --- Helper Functions ---

    // Get ALL registered user data (used by admin logs and login validation)
    // This data structure now includes profilePicture and lastUsernameChange
    function getAllUsersData() {
        console.log("logininfo.js: Calling getAllUsersData.");
        const logsJson = localStorage.getItem(ADMIN_LOGS_STORAGE_KEY);
        try {
            const users = logsJson ? JSON.parse(logsJson) : {};
             // Ensure expected format and add default fields if missing (for backward compatibility)
             for (const username in users) {
                 if (users.hasOwnProperty(username)) {
                      // If it's the old simple string password format
                      if (typeof users[username] === 'string') {
                           console.warn(`logininfo.js: Converting old data format for user: ${username}`);
                          users[username] = {
                              password: users[username],
                              email: 'unknown',
                              phoneNumber: '',
                              registrationDate: 'unknown',
                              profilePicture: null, // Default profile picture
                              lastUsernameChange: null // Default last username change
                          };
                     } else {
                         // Ensure keys exist in the user object for structured data
                         if (!users[username].email) users[username].email = '';
                         if (!users[username].phoneNumber) users[username].phoneNumber = '';
                         if (!users[username].registrationDate) users[username].registrationDate = 'unknown';
                         if (users[username].profilePicture === undefined) users[username].profilePicture = null;
                         if (users[username].lastUsernameChange === undefined) users[username].lastUsernameChange = null;
                     }
                 }
             }
             console.log(`logininfo.js: Retrieved ${Object.keys(users).length} users data from localStorage.`);
            return users;
        } catch (e) {
            console.error("logininfo.js: Error parsing admin logs from localStorage:", e);
            return {}; // Return empty object on error
        }
    }

    // Save ALL registered user data (simulates updating admin logs)
    function saveAllUsersData(users) {
        console.log("logininfo.js: Calling saveAllUsersData.");
        localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(users));
         console.log(`logininfo.js: Saved ${Object.keys(users).length} user logs to admin storage.`);
    }

    // Display an error message
    function displayError(message, errorElement) {
        console.log(`logininfo.js: Displaying error "${message}" on`, errorElement);
        if (errorElement) {
            errorElement.textContent = message;
             errorElement.style.display = 'block'; // Ensure it's visible
        }
         // Also hide any success message
         if (accountUpdateSuccessDiv) accountUpdateSuccessDiv.style.display = 'none';
    }

     // Display a success message (for account updates)
    function displaySuccess(message, successElement) {
        console.log(`logininfo.js: Displaying success "${message}" on`, successElement);
         if (successElement) {
             successElement.textContent = message;
             successElement.style.display = 'block'; // Ensure it's visible
         }
         // Also hide any error message
          if (accountUpdateErrorDiv) accountUpdateErrorDiv.style.display = 'none';
    }

    // Clear error messages
    function clearErrors(...errorElements) {
        console.log("logininfo.js: Clearing errors.", errorElements);
        errorElements.forEach(el => {
            if (el) {
                el.textContent = '';
                el.style.display = 'none'; // Hide the element
            }
        });
         // Also hide success message
         if (accountUpdateSuccessDiv) accountUpdateSuccessDiv.style.display = 'none';
     // Clear info message as well
        if (usernameCooldownMessageDiv) usernameCooldownMessageDiv.style.display = 'none';
    }

     // Clear success messages
     function clearSuccess(...successElements) {
         console.log("logininfo.js: Clearing success messages.", successElements);
         successElements.forEach(el => {
             if (el) {
                 el.textContent = '';
                 el.style.display = 'none'; // Hide the element
             }
         });
         // Also hide error message
          if (accountUpdateErrorDiv) accountUpdateErrorDiv.style.display = 'none';
         if (usernameCooldownMessageDiv) usernameCooldownMessageDiv.style.display = 'none';
     }


    // Show the main content and hide the auth area
    function showMainContent(username, role, userData = null) {
        console.log(`logininfo.js: Showing main content for ${role}: ${username}.`);
        if (authArea && mainContent) {
            authArea.style.display = 'none';
            mainContent.style.display = 'block'; // Use block or flex/grid

             // Store the current logged-in user info
             currentLoggedInUser = { username: username, role: role, data: userData };

             // Display the logged-in username in the header
             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = username;
             }

             // Dispatch custom event after main content is shown, including user info
             document.dispatchEvent(new CustomEvent('authComplete', { detail: { username: username, role: role, userData: userData } }));
             console.log("logininfo.js: Dispatched 'authComplete' event.");
        } else {
             console.error("logininfo.js: Could not find authArea or mainContent to show.");
        }
    }

     // Show the auth area and hide main content
     function showAuthArea() {
        console.log("logininfo.js: Showing auth area. User logging out.");
        if (authArea && mainContent) {
            authArea.style.display = 'flex'; // Use flex to center the box
            mainContent.style.display = 'none';

            // Clear stored login info
            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
            localStorage.removeItem(CURRENT_USER_ROLE_STORAGE_KEY);
             // Do NOT clear ADMIN_LOGS_STORAGE_KEY or user-specific post keys here

             // Reset displayed username
             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = 'Guest';
             }

             // Clear current user data from memory
             currentLoggedInUser = null;

             // Dispatch custom event for other scripts to know auth is no longer complete
             document.dispatchEvent(new CustomEvent('authLogout'));
             console.log("logininfo.js: Dispatched 'authLogout' event.");
        } else {
             console.error("logininfo.js: Could not find authArea or mainContent to show auth area.");
        }
     }


    // Generate a simple math problem (e.g., a + b)
    function generateMathProblem() {
        console.log("logininfo.js: Generating math problem.");
        const num1 = Math.floor(Math.random() * 10) + 1; // Numbers between 1 and 10
        const num2 = Math.floor(Math.random() * 10) + 1;
        const problem = `${num1} + ${num2}`;
        currentMathAnswer = num1 + num2; // Store the answer
        if (mathProblemSpan) {
             mathProblemSpan.textContent = problem;
        } else {
             console.warn("logininfo.js: Math problem span not found.");
        }
         if (mathAnswerInput) {
              mathAnswerInput.value = ''; // Clear previous answer
         } else {
             console.warn("logininfo.js: Math answer input not found.");
         }
        console.log(`logininfo.js: Generated math problem: ${problem} = ${currentMathAnswer}`); // Log answer for easy testing
    }

    // Switch between login and signup forms
    function showFormView(view) {
        console.log(`logininfo.js: Switching form view to: ${view}`);
        if (loginForm && signupForm) {
            if (view === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                 clearErrors(signupErrorDiv, mathErrorDiv); // Clear signup errors
                 clearSuccess(accountUpdateSuccessDiv); // Ensure success message is cleared
                 // Clear signup form fields when switching away (optional)
                 if(signupUsernameInput) signupUsernameInput.value = '';
                 if(signupEmailInput) signupEmailInput.value = '';
                 if(signupPhoneInput) signupPhoneInput.value = '';
                 if(signupPasswordInput) signupPasswordInput.value = '';
                 if(confirmPasswordInput) confirmPasswordInput.value = '';
                 if(mathAnswerInput) mathAnswerInput.value = '';

            } else if (view === 'signup') {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                 clearErrors(loginErrorDiv, accountUpdateErrorDiv); // Clear login and update errors
                 clearSuccess(accountUpdateSuccessDiv); // Ensure success message is cleared
                 generateMathProblem(); // Generate a new math problem each time signup is shown
                 // Clear login form fields when switching away (optional)
                 if(loginUsernameInput) loginUsernameInput.value = '';
                 if(loginPasswordInput) loginPasswordInput.value = '';
            } else {
                 console.warn(`logininfo.js: Unknown form view requested: ${view}`);
            }
        } else {
             console.error("logininfo.js: Login or signup forms not found.");
        }
    }

    // Display user logs (Admin only)
    function renderUserLogs() {
         console.log("logininfo.js: Attempting to render user logs.");
         if (!userLogsListDiv) {
             console.warn("logininfo.js: userLogsListDiv element not found. Cannot render logs.");
             return;
         }

         // Only render if the user is admin and the log section is active/visible
         const currentUserRole = localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY);
         const logSection = document.getElementById('user-logs-section'); // Get the log section
         // Check if the log section is currently active (shown by script.js)
         const isLogSectionActive = logSection && logSection.classList.contains('active-section');

         if (currentUserRole !== 'admin') {
             // Not admin, clear logs display and show access denied message if section is active
             userLogsListDiv.innerHTML = '';
             if (noLogsMessage) noLogsMessage.style.display = 'none'; // Hide default message
             if (isLogSectionActive) {
                 userLogsListDiv.innerHTML = '<p style="text-align:center; color: var(--theme-error-color);">Access Denied. You must be an administrator to view logs.</p>';
             }
              console.log("logininfo.js: User is not admin. Logs not rendered.");
             return;
         }
         // If admin and section is NOT active, don't render yet, just clear previous render
         if (!isLogSectionActive) {
             userLogsListDiv.innerHTML = '';
             if (noLogsMessage) noLogsMessage.style.display = 'block'; // Show message if list empty
             console.log("logininfo.js: User is admin, but logs section is not active. Skipping render.");
             return;
         }


         userLogsListDiv.innerHTML = ''; // Clear current list

         const users = getAllUsersData(); // Get all user registration data

         // Convert users object to an array, excluding the admin user
         const userEntries = Object.entries(users)
             .filter(([username, userData]) => username.toLowerCase() !== ADMIN_USERNAME);


         if (userEntries.length === 0) {
             if (noLogsMessage) noLogsMessage.style.display = 'block';
             console.log("logininfo.js: No user log entries found.");
             return;
         } else {
             if (noLogsMessage) noLogsMessage.style.display = 'none';
         }

         userEntries.forEach(([username, userData]) => {
             const logEntry = document.createElement('div');
             logEntry.classList.add('user-log-entry');

             logEntry.innerHTML = `
                 <p><strong>Username:</strong> <span>${escapeHTML(username)}</span></p>
                 <p><strong>Email:</strong> <span>${escapeHTML(userData.email || 'N/A')}</span></p>
                 <p><strong>Phone:</strong> <span>${escapeHTML(userData.phoneNumber || 'N/A')}</span></p>
                 <p><strong>Registered:</strong> <span>${escapeHTML(userData.registrationDate ? new Date(userData.registrationDate).toLocaleString() : 'Unknown Date')}</span></p>
                 <!-- Password is NOT displayed here for slight pseudo-security -->
             `;
             userLogsListDiv.appendChild(logEntry);
         });
          console.log(`logininfo.js: Rendered ${userEntries.length} user log entries.`);
    }


     // Update account management form and display based on current user
     function populateAccountManagement() {
         console.log("logininfo.js: Attempting to populate account management form.");
         if (!currentLoggedInUser || !accountUpdateForm || !accountManagementSection || !profilePicturePreviewImg || !currentUsernameDisplaySpan || !currentEmailDisplaySpan || !updateProfilePictureInput || !updateUsernameInput || !usernameCooldownMessageDiv || !currentPasswordForUpdateInput || !newPasswordInput || !confirmNewPasswordInput || !accountUpdateErrorDiv || !accountUpdateSuccessDiv) {
              console.warn("logininfo.js: Cannot populate account management, user not logged in or one or more required elements not found.");
              // Log which elements are missing for debugging
              if (!currentLoggedInUser) console.log("  - currentLoggedInUser is null");
              if (!accountUpdateForm) console.log("  - accountUpdateForm is null");
              if (!accountManagementSection) console.log("  - accountManagementSection is null");
              if (!profilePicturePreviewImg) console.log("  - profilePicturePreviewImg is null");
              if (!currentUsernameDisplaySpan) console.log("  - currentUsernameDisplaySpan is null");
              if (!currentEmailDisplaySpan) console.log("  - currentEmailDisplaySpan is null");
              if (!updateProfilePictureInput) console.log("  - updateProfilePictureInput is null");
              if (!updateUsernameInput) console.log("  - updateUsernameInput is null");
              if (!usernameCooldownMessageDiv) console.log("  - usernameCooldownMessageDiv is null");
              if (!currentPasswordForUpdateInput) console.log("  - currentPasswordForUpdateInput is null");
              if (!newPasswordInput) console.log("  - newPasswordInput is null");
              if (!confirmNewPasswordInput) console.log("  - confirmNewPasswordInput is null");
              if (!accountUpdateErrorDiv) console.log("  - accountUpdateErrorDiv is null");
              if (!accountUpdateSuccessDiv) console.log("  - accountUpdateSuccessDiv is null");

             // Hide the account management section if elements are missing
             if(accountManagementSection) accountManagementSection.style.display = 'none'; // Use style directly as class logic might be handled by script.js

             return; // Only populate if user is logged in and all elements exist
         }

         // Only populate if the account management section is currently active (shown by script.js)
         // Check the display property set by script.js or CSS
         const isAccountSectionActive = accountManagementSection.classList.contains('active-section');

         if (!isAccountSectionActive) {
              console.log("logininfo.js: Account management section not active, delaying population.");
             return;
         }

          console.log("logininfo.js: Populating account management form for user:", currentLoggedInUser.username);

         const user = currentLoggedInUser.data; // Get the full user data object

         // Display current info
         currentUsernameDisplaySpan.textContent = currentLoggedInUser.username;
         currentEmailDisplaySpan.textContent = user.email || 'N/A';

         // Display profile picture
         // If user data has a profile picture, use it, otherwise use the default placeholder
         profilePicturePreviewImg.src = user.profilePicture || 'placeholder-profile.png';
         profilePicturePreviewImg.alt = `${currentLoggedInUser.username}'s Profile Picture`;

         // Clear form fields and messages
          // We don't reset username input on populate, as they might type a new one
          // updateUsernameInput.value = ''; // Keep the current username value in the input field
          currentPasswordForUpdateInput.value = '';
          newPasswordInput.value = '';
          confirmNewPasswordInput.value = '';
          if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear file input value
          clearErrors(accountUpdateErrorDiv, usernameCooldownMessageDiv); // Clear previous errors, including cooldown message
          clearSuccess(accountUpdateSuccessDiv); // Clear previous success message


         // Check username change cooldown (only for normal users)
         if (currentLoggedInUser.role === 'admin') {
              usernameCooldownMessageDiv.textContent = "Admin username cannot be changed here.";
               usernameCooldownMessageDiv.style.color = ''; // Reset color
               usernameCooldownMessageDiv.style.display = 'block'; // Show message
              updateUsernameInput.disabled = true; // Disable username change for admin
              updateUsernameInput.value = currentLoggedInUser.username; // Display admin username
         } else { // Normal user
              updateUsernameInput.disabled = false; // Enable for users
              updateUsernameInput.value = currentLoggedInUser.username; // Display current username in input

              const lastChange = user.lastUsernameChange ? new Date(user.lastUsernameChange) : null;
              const now = new Date();

              if (lastChange) {
                  const timeDiff = now.getTime() - lastChange.getTime();
                  const daysDiff = timeDiff / MS_PER_DAY;

                  if (daysDiff < USERNAME_CHANGE_COOLDOWN_DAYS) {
                      const daysRemaining = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysDiff);
                      usernameCooldownMessageDiv.textContent = `Username can be changed again in ${daysRemaining} days.`;
                      usernameCooldownMessageDiv.style.color = 'var(--theme-warning-color)'; // Warning color
                      usernameCooldownMessageDiv.style.display = 'block'; // Show message
                      updateUsernameInput.disabled = true; // Disable username input
                  } else {
                      usernameCooldownMessageDiv.textContent = "You can change your username now.";
                       usernameCooldownMessageDiv.style.color = ''; // Reset color
                       usernameCooldownMessageDiv.style.display = 'block'; // Show message
                       // updateUsernameInput is already enabled by default in the 'else' block
                       updateUsernameInput.disabled = false;
                  }
              } else {
                   // Never changed username before
                    usernameCooldownMessageDiv.textContent = "You can change your username now.";
                     usernameCooldownMessageDiv.style.color = '';
                     usernameCooldownMessageDiv.style.display = 'block'; // Show message
                    // updateUsernameInput is already enabled
                    updateUsernameInput.disabled = false;
              }
         }
     }


     // Handle account update form submission
     async function handleAccountUpdate(event) {
         console.log("logininfo.js: Handling account update submission.");
         event.preventDefault();

         clearErrors(accountUpdateErrorDiv); // Clear errors (including cooldown message)
         clearSuccess(accountUpdateSuccessDiv); // Clear success

         if (!currentLoggedInUser) {
             displayError("You must be logged in to update your account.", accountUpdateErrorDiv);
             window.logout(); // Force logout if somehow here not logged in
             return;
         }

         const username = currentLoggedInUser.username;
         const role = currentLoggedInUser.role;
         let users = getAllUsersData(); // Get the full dataset (for normal users)

         // For admin, need to get their hardcoded password for comparison
         // IMPORTANT: If admin changes password and refreshes, the hardcoded ADMIN_PASSWORD will be used again
         // unless you save the changed admin password somewhere persistent (like localStorage, insecurely).
         // For this demo, we will NOT persist admin password changes beyond the current session.
         // So the comparison is always against the initially hardcoded password.
         let currentActualPassword = ADMIN_PASSWORD; // Always compare against hardcoded password for admin

         // If user is normal, get their password from the loaded users data
         if (role !== 'admin' && users[username]) {
             currentActualPassword = users[username].password; // Use user's stored password for comparison
         } else if (role !== 'admin' && !users[username]) {
              console.error(`logininfo.js: User "${username}" not found in logs during update attempt!`);
              displayError("Account data error. Please try logging in again.", accountUpdateErrorDiv);
              window.logout();
              return;
         }


         const currentPasswordAttempt = currentPasswordForUpdateInput ? currentPasswordForUpdateInput.value.trim() : '';
         const newUsername = updateUsernameInput ? updateUsernameInput.value.trim() : username; // Get new username or keep old if input doesn't exist (admin)
         const newPassword = newPasswordInput ? newPasswordInput.value.trim() : ''; // Get new password or empty string
         const confirmNewPassword = confirmNewPasswordInput ? confirmNewPasswordInput.value.trim() : ''; // Get confirm password or empty string
         const profilePictureFile = updateProfilePictureInput.files ? updateProfilePictureInput.files[0] : null;

         let changesMade = false; // Flag to track if any valid changes were requested


         // --- Validation and Processing ---

         // 1. Determine if changes are being attempted
         const isUsernameChangeAttempt = updateUsernameInput && (newUsername !== username) && !updateUsernameInput.disabled; // Check input exists, value changed, and input is not disabled
         const isPasswordChangeAttempt = (newPassword !== ''); // Check if new password field is not empty
         const isProfilePictureChangeAttempt = (profilePictureFile !== null);

         console.log(`logininfo.js: Update attempt flags: Username=${isUsernameChangeAttempt}, Password=${isPasswordChangeAttempt}, ProfilePic=${isProfilePictureChangeAttempt}`);

         // Check if *any* change is actually being requested
         if (!isUsernameChangeAttempt && !isPasswordChangeAttempt && !isProfilePictureChangeAttempt) {
              displayError("No changes detected.", accountUpdateErrorDiv);
              // Clear just the password fields after attempting to save with no changes
             if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
             if (newPasswordInput) newPasswordInput.value = '';
             if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
             return;
         }


         // 2. Validate Current Password (required if username or password change IS attempted)
         // Current password input is *always* required by HTML for the form to submit IF it's a password or username change attempt.
         // We just need to check if the *value* is correct IF those changes are being attempted.
         if (isUsernameChangeAttempt || isPasswordChangeAttempt) {
             if (!currentPasswordAttempt) { // Should be caught by HTML required attribute, but JS validation is safer
                  displayError("Current password is required to change username or password.", accountUpdateErrorDiv);
                 // Clear all password fields
                 if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
             if (currentPasswordAttempt !== currentActualPassword) { // INSECURE comparison
                 displayError("Incorrect current password.", accountUpdateErrorDiv);
                 // Clear all password fields on incorrect attempt
                 if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
             console.log("logininfo.js: Current password validated.");
         }


         // 3. Handle Username Change (if attempted)
         let finalUsername = username; // Start with current username
         if (isUsernameChangeAttempt) {
              console.log(`logininfo.js: Processing username change attempt: "${username}" -> "${newUsername}"`);
              // Cooldown check (only for normal users) - Redundant check as input is disabled, but safe
             if (role !== 'admin') {
                 const lastChange = users[username].lastUsernameChange ? new Date(users[username].lastUsernameChange) : null;
                 const now = new Date();
                 if (lastChange) {
                     const timeDiff = now.getTime() - lastChange.getTime();
                     const daysDiff = timeDiff / MS_PER_DAY;
                     if (daysDiff < USERNAME_CHANGE_COOLDOWN_DAYS) {
                         // This case should ideally be prevented by the disabled input
                         const daysRemaining = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysDiff);
                         displayError(`You can only change your username once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days. Please wait ${daysRemaining} more days.`, accountUpdateErrorDiv);
                          if (updateUsernameInput) updateUsernameInput.disabled = true; // Ensure input is disabled
                         return; // Stop submission
                     }
                 }
             } else {
                 // Admin username cannot be changed via this form, validation already disables input
                 displayError("Admin username cannot be changed here.", accountUpdateErrorDiv);
                 return; // Should not happen if input is disabled, but defensive
             }


              // Check if new username is already taken (case-insensitive check)
             const usernameTaken = Object.keys(users).some(userKey => userKey.toLowerCase() === newUsername.toLowerCase() && userKey.toLowerCase() !== username.toLowerCase());
             if (usernameTaken) {
                 displayError(`Username "${newUsername}" is already taken.`, accountUpdateErrorDiv);
                 return; // Stop submission
             }

             // Basic username validation (e.g., no spaces, minimum length)
             if (newUsername.length < 3) {
                  displayError("New username must be at least 3 characters long.", accountUpdateErrorDiv);
                  return;
             }
             if (/\s/.test(newUsername)) {
                  displayError("Username cannot contain spaces.", accountUpdateErrorDiv);
                  return;
             }
              if (newUsername.toLowerCase() === ADMIN_USERNAME) {
                  displayError(`Cannot change username to "${ADMIN_USERNAME}".`, accountUpdateErrorDiv);
                  return;
             }

             // Username change is valid
             finalUsername = newUsername;
             changesMade = true;
             console.log(`logininfo.js: Username change validated.`);

             // Update the user data key (simulated database update)
             // This must happen *before* password/profile pic updates if username is the key
              if (role !== 'admin') { // Only move data for normal users
                 const userData = users[username];
                 userData.lastUsernameChange = new Date().toISOString(); // Update timestamp
                 users[finalUsername] = userData; // Add new entry under new username
                 delete users[username]; // Remove old entry
                  console.log(`logininfo.js: Updated user data key from "${username}" to "${finalUsername}".`);
              }
             // Admin username change is hardcoded, not stored in logs data
         }


         // 4. Handle Password Change (if attempted)
         let finalPassword = currentActualPassword; // Start with current password
         if (isPasswordChangeAttempt) {
              console.log("logininfo.js: Processing password change attempt.");
             if (newPassword.length < 6) {
                 displayError("New password must be at least 6 characters long.", accountUpdateErrorDiv);
                 // Clear new password fields
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
             if (newPassword !== confirmNewPassword) {
                 displayError("New password and confirm password do not match.", accountUpdateErrorDiv);
                 // Clear new password fields
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
              if (newPassword === currentPasswordAttempt) {
                   displayError("New password cannot be the same as the current password.", accountUpdateErrorDiv);
                   // Clear new password fields
                  if (newPasswordInput) newPasswordInput.value = '';
                  if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                  return;
              }

             // Password change is valid
             finalPassword = newPassword; // INSECURE STORAGE
             changesMade = true;
             console.log(`logininfo.js: Password change validated.`);

             // Update password in user data (for normal users)
             if (role !== 'admin') {
                 users[finalUsername].password = finalPassword; // Use finalUsername after potential change
                  console.log(`logininfo.js: Password updated for user "${finalUsername}".`);
             } else {
                 // For admin, update the hardcoded ADMIN_PASSWORD variable in memory for THIS SESSION.
                 // This will allow subsequent logins/updates in this session to use the new password.
                 // It will NOT persist after closing/reopening the browser.
                 ADMIN_PASSWORD = finalPassword;
                 console.warn("logininfo.js: Admin password changed in current session memory. This is not persistent!");
                 // Optionally update the password in the logs data *if* you want it visible there (still insecure)
                 // if (!users[ADMIN_USERNAME]) users[ADMIN_USERNAME] = {}; // Ensure object exists
                 // users[ADMIN_USERNAME].password = ADMIN_PASSWORD; // DANGER ZONE
             }
         }


         // 5. Handle Profile Picture Update (if attempted)
         let finalProfilePictureDataUrl = null; // Will hold the new data URL or null

         if (isProfilePictureChangeAttempt) {
             console.log("logininfo.js: Processing profile picture change attempt.");
              if (profilePictureFile.size > MAX_PROFILE_PIC_SIZE) {
                  displayError(`Profile picture is too large (${(profilePictureFile.size / 1024).toFixed(0)}KB). Max size is ${MAX_PROFILE_PIC_SIZE / 1024}KB.`, accountUpdateErrorDiv);
                   // Clear file input and preview on error
                   if(updateProfilePictureInput) updateProfilePictureInput.value = '';
                   if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                  return;
              }
               if (!profilePictureFile.type.startsWith('image/')) {
                   displayError("The selected file is not an image.", accountUpdateErrorDiv);
                    // Clear file input and preview on error
                   if(updateProfilePictureInput) updateProfilePictureInput.value = '';
                   if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                   return;
               }

             // Read file as Data URL (async)
             try {
                 finalProfilePictureDataUrl = await readFileAsDataURL(profilePictureFile);
                 // Don't set changesMade = true here yet, only if the read was successful
                 console.log(`logininfo.js: Profile picture file read successfully.`);
             } catch (e) {
                 console.error("logininfo.js: Error reading profile picture file:", e);
                 displayError("Could not read the profile picture file.", accountUpdateErrorDiv);
                  if(updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                  if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                 return; // Stop submission on file read error
             }
             changesMade = true; // Now that read is successful, mark changes made
         } else {
              // If no *new* file is selected, keep the current profile picture Data URL
              // Retrieve the existing profile picture from the user data
              // Use the potentially new username key if it changed
              const targetUserData = users[targetUsernameKey] || users[username]; // Fallback to old username if key wasn't moved yet (shouldn't happen after username change step)
              finalProfilePictureDataUrl = targetUserData?.profilePicture || null;
              // If no file was selected and there was no existing picture, finalProfilePictureDataUrl remains null
              // If a file was selected, it's already set to the new Data URL
         }


         // --- Save Changes and Update State ---

         // At this point, changesMade is true if any valid change attempt was made.
         // If we reached here without returning early due to validation errors,
         // the changes are considered valid for processing.
         if (!changesMade) { // Should be caught earlier, but safety check
             displayError("No changes detected or validation failed.", accountUpdateErrorDiv);
             return;
         }


         // Update the user object in the logs data (for normal users)
         // Use finalUsername as the key if the username changed
         const targetUsernameKey = role === 'admin' ? username : finalUsername; // Admin key is always 'admin'

         if (role !== 'admin') {
             const targetUser = users[targetUsernameKey];
             targetUser.profilePicture = finalProfilePictureDataUrl; // Update profile picture
             // password and lastUsernameChange were updated in previous steps directly on the user object
              console.log(`logininfo.js: Updated user data in logs for "${targetUsernameKey}".`);
         } else {
             // For admin, we simulate updating the profile picture in the 'logs' storage
             // Ensure admin entry exists in logs to store the pic
             if (!users[ADMIN_USERNAME]) {
                  users[ADMIN_USERNAME] = { password: ADMIN_PASSWORD, email: 'admin@nico.info', phoneNumber: '', registrationDate: 'N/A (Admin)', lastUsernameChange: null };
                  console.log("logininfo.js: Created default admin entry in logs for profile pic storage.");
             }
             users[ADMIN_USERNAME].profilePicture = finalProfilePictureDataUrl;
              console.log(`logininfo.js: Updated admin profile picture in logs.`);
              // Admin password change (simulated) is not persisted to logs here
         }


         // Save the potentially updated users data (including the admin profile pic if changed)
         saveAllUsersData(users);


         // --- Update Browser State ---

         // Update current logged-in user info in memory
         currentLoggedInUser.username = targetUsernameKey; // Use the potentially new username
         if (role !== 'admin') {
             currentLoggedInUser.data = users[targetUsernameKey]; // Update user data object in memory
         } else {
              // If admin updated pic, update data in memory too
              currentLoggedInUser.data.profilePicture = finalProfilePictureDataUrl;
              // If admin changed password (simulated), the ADMIN_PASSWORD variable was updated
              currentLoggedInUser.data.password = ADMIN_PASSWORD;
         }


         // Update the username and role in localStorage
         localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentLoggedInUser.username);
         // localStorage.setItem(CURRENT_USER_ROLE_STORAGE_KEY, currentLoggedInUser.role); // Role doesn't change


         // Success message and clear form fields (except username input value)
         displaySuccess("Account updated successfully!", accountUpdateSuccessDiv);
         // Clear password fields only
         if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
         if (newPasswordInput) newPasswordInput.value = '';
         if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
         // Clear file input
         if (updateProfilePictureInput) updateProfilePictureInput.value = '';


         // Refresh the account management form display (to show new username, cooldown, profile pic)
         populateAccountManagement();


         // Optional: Dispatch events for changes other parts of the site might care about
         // e.g., update profile pic in server posts, update author name in posts (complex)
         document.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { username: currentLoggedInUser.username, profilePicture: currentLoggedInUser.data.profilePicture } }));
         if (isUsernameChangeAttempt) {
             // Dispatch event, but handling username changes across posts requires updating every post's 'author' field,
             // which is complex with client-side localStorage split by user. A backend is needed.
             // For this demo, only the *display* of the author name in posts might update if re-rendered.
              document.dispatchEvent(new CustomEvent('usernameUpdated', { detail: { oldUsername: username, newUsername: finalUsername } }));
         }


         console.log("logininfo.js: Account update process finished.");
     }


     // Promise-based function to read file as data URL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                 resolve(null); // Resolve with null if no file
                 return;
            }
             if (!file.type.startsWith('image/')) {
                  reject("Not an image file.");
                  return;
             }
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => {
                 console.error("logininfo.js: File read error:", e);
                 reject(e);
            };
            reader.readAsDataURL(file);
        });
    }

    // Basic HTML escaping (to prevent XSS when displaying user input) - Duplicated for safety
    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    // Expose functions that other scripts might need
    window.getAllUsersData = getAllUsersData; // serverposts.js needs this for profile pics


    // --- Initialization ---
    console.log("logininfo.js: Initializing event listeners and checking login state.");

    // Add event listeners for forms and form toggles
    if (loginForm) loginForm.addEventListener('submit', handleLogin); else console.warn("logininfo.js: LoginForm not found.");
    if (signupForm) signupForm.addEventListener('submit', handleSignup); else console.warn("logininfo.js: SignupForm not found.");
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showFormView('signup');
        });
    } else console.warn("logininfo.js: showSignupLink not found.");
     if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showFormView('login');
        });
     } else console.warn("logininfo.js: showLoginLink not found.");

     // Add event listeners for the account update form
     if (accountUpdateForm) {
         console.log("logininfo.js: AccountUpdateForm found, adding listeners.");
         // Add submit listener
         accountUpdateForm.addEventListener('submit', handleAccountUpdate);
         // Add change listener for profile picture input to update preview
          if (updateProfilePictureInput) {
               updateProfilePictureInput.addEventListener('change', async () => { // Made async to use await
                    console.log("logininfo.js: Profile picture input change detected.");
                    const file = updateProfilePictureInput.files ? updateProfilePictureInput.files[0] : null;
                     // Clear *only* the account update error/success messages related to *previous* saves
                     // Don't clear cooldown message here.
                     if (accountUpdateErrorDiv) { accountUpdateErrorDiv.textContent = ''; accountUpdateErrorDiv.style.display = 'none'; }
                     if (accountUpdateSuccessDiv) { accountUpdateSuccessDiv.textContent = ''; accountUpdateSuccessDiv.style.display = 'none'; }


                    if (file) {
                         console.log(`logininfo.js: File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
                         // Basic size and type check before reading
                         if (file.size > MAX_PROFILE_PIC_SIZE) {
                             displayError(`File is too large (${(file.size / 1024).toFixed(0)}KB). Max size is ${MAX_PROFILE_PIC_SIZE / 1024}KB.`, accountUpdateErrorDiv);
                              if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                              if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                              console.warn("logininfo.js: Profile picture file too large.");
                             return;
                         }
                          if (!file.type.startsWith('image/')) {
                              displayError("The selected file is not an image.", accountUpdateErrorDiv);
                               if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                               if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                               console.warn("logininfo.js: Profile picture file is not an image.");
                              return;
                          }


                        // Read for preview (might fail even after basic checks)
                        try {
                            const dataUrl = await readFileAsDataURL(file);
                             if (profilePicturePreviewImg) profilePicturePreviewImg.src = dataUrl;
                             console.log("logininfo.js: Profile picture preview updated successfully.");
                        } catch (e) {
                            console.error("logininfo.js: Error previewing profile picture:", e);
                            displayError("Could not preview image.", accountUpdateErrorDiv);
                             if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                             if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                        }

                    } else {
                         // If file input is cleared, reset preview to current user's pic or default
                         if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                         clearErrors(accountUpdateErrorDiv); // Clear errors
                         console.log("logininfo.js: Profile picture input cleared, preview reset.");
                    }
               });
          } else console.warn("logininfo.js: updateProfilePictureInput not found.");

           const updateInputs = accountUpdateForm.querySelectorAll('input, textarea');
           updateInputs.forEach(input => {
               input.addEventListener('focus', () => {
                    if (accountUpdateErrorDiv) { accountUpdateErrorDiv.textContent = ''; accountUpdateErrorDiv.style.display = 'none'; }
                    if (accountUpdateSuccessDiv) { accountUpdateSuccessDiv.textContent = ''; accountUpdateSuccessDiv.style.display = 'none'; }
               });
           });


     } else console.warn("logininfo.js: AccountUpdateForm not found. Account management features may not work.");


    document.addEventListener('showUserLogs', () => {
        console.log("logininfo.js: Received 'showUserLogs' event. Will attempt to render logs.");
        renderUserLogs();
    });

     document.addEventListener('showAccountManagement', () => {
         console.log("logininfo.js: Received 'showAccountManagement' event. Will attempt to populate form.");
         populateAccountManagement();
     });

    const currentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    const currentUserRole = localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY);
    console.log(`logininfo.js: Checking initial login state. User: ${currentUser}, Role: ${currentUserRole}`);


    const registeredUsers = getAllUsersData();

    let initialUserData = null;
    if (currentUser && currentUserRole) {
        if (currentUserRole === 'admin') {
             console.log("logininfo.js: User is admin.");
             const adminDataFromLogs = registeredUsers[ADMIN_USERNAME];

             initialUserData = {
                 password: ADMIN_PASSWORD,
                 email: adminDataFromLogs?.email || 'admin@nico.info',
                 phoneNumber: adminDataFromLogs?.phoneNumber || '',
                 registrationDate: adminDataFromLogs?.registrationDate || 'N/A (Admin)',
                 profilePicture: adminDataFromLogs?.profilePicture || null,
                 lastUsernameChange: adminDataFromLogs?.lastUsernameChange || null
             };

             if (!adminDataFromLogs) {
                  console.log("logininfo.js: Admin not found in logs, adding default entry.");
                  registeredUsers[ADMIN_USERNAME] = initialUserData;
                  saveAllUsersData(registeredUsers);
             } else {
                 console.log("logininfo.js: Admin found in logs, using stored data.");
                 initialUserData = registeredUsers[ADMIN_USERNAME];
                 initialUserData.password = ADMIN_PASSWORD;
             }


        } else {
             console.log(`logininfo.js: User is normal user: ${currentUser}.`);
             initialUserData = registeredUsers[currentUser];
             if(!initialUserData) {
                  console.warn(`logininfo.js: Stored user "${currentUser}" not found in logs data! Clearing login.`);
                 showAuthArea();
             }
        }
    }

    if (currentUser && currentUserRole && initialUserData && currentLoggedInUser === null) {
         console.log(`logininfo.js: Valid logged-in user "${currentUser}" (${currentUserRole}) with data found. Showing main content.`);
         showMainContent(currentUser, currentUserRole, initialUserData);
    } else if (!currentUser || !currentUserRole || !initialUserData) {
         console.log("logininfo.js: No valid logged-in user found or data missing. Showing auth area.");
         const anyNormalUsersRegistered = Object.keys(registeredUsers).some(username => username.toLowerCase() !== ADMIN_USERNAME);

        if (!anyNormalUsersRegistered) {
            showFormView('signup');
             console.log("logininfo.js: No registered users found, defaulting to signup.");
        } else {
            showFormView('login');
             console.log("logininfo.js: Registered users found, defaulting to login.");
        }
        showAuthArea();
    }
});

window.logout = () => {
    console.log("logininfo.js: Logging out...");
    const currentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
     if (currentUser) {
          localStorage.removeItem('nicoInfoServerPosts_' + currentUser);
          console.log(`logininfo.js: Cleared server posts data for user "${currentUser}" from localStorage.`);
     }
    showAuthArea();
    window.location.reload();
};