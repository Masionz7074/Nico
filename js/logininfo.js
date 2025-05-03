// js/logininfo.js

// Handles user authentication (Login/Signup), account management,
// and simulates admin logs using localStorage.
// IMPORTANT: Using localStorage for passwords and sensitive data is NOT secure for real websites.
// Admin logs in localStorage are also not secure and would be server-side in a real app.
// Client-side cooldowns and image storage in localStorage have significant limitations.

document.addEventListener('DOMContentLoaded', () => {
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
    const ADMIN_PASSWORD = 'nicospasword'; // This is now the admin password

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
            return users;
        } catch (e) {
            console.error("logininfo.js: Error parsing admin logs from localStorage:", e);
            return {}; // Return empty object on error
        }
    }

    // Save ALL registered user data (simulates updating admin logs)
    function saveAllUsersData(users) {
        localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(users));
         console.log(`logininfo.js: Saved ${Object.keys(users).length} user logs to admin storage.`);
    }

    // Display an error message
    function displayError(message, errorElement) {
        if (errorElement) {
            errorElement.textContent = message;
             errorElement.style.display = 'block'; // Ensure it's visible
        }
         // Also hide any success message
         if (accountUpdateSuccessDiv) accountUpdateSuccessDiv.style.display = 'none';
    }

     // Display a success message (for account updates)
    function displaySuccess(message, successElement) {
         if (successElement) {
             successElement.textContent = message;
             successElement.style.display = 'block'; // Ensure it's visible
         }
         // Also hide any error message
          if (accountUpdateErrorDiv) accountUpdateErrorDiv.style.display = 'none';
    }

    // Clear error messages
    function clearErrors(...errorElements) {
        errorElements.forEach(el => {
            if (el) {
                el.textContent = '';
                el.style.display = 'none'; // Hide the element
            }
        });
         // Also hide success message
         if (accountUpdateSuccessDiv) accountUpdateSuccessDiv.style.display = 'none';
    }

     // Clear success messages
     function clearSuccess(...successElements) {
         successElements.forEach(el => {
             if (el) {
                 el.textContent = '';
                 el.style.display = 'none'; // Hide the element
             }
         });
         // Also hide error message
          if (accountUpdateErrorDiv) accountUpdateErrorDiv.style.display = 'none';
     }


    // Show the main content and hide the auth area
    function showMainContent(username, role, userData = null) {
        if (authArea && mainContent) {
            authArea.style.display = 'none';
            mainContent.style.display = 'block'; // Use block or flex/grid

             // Store the current logged-in user info
             currentLoggedInUser = { username: username, role: role, data: userData };

             // Display the logged-in username in the header
             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = username;
             }

             console.log(`logininfo.js: Showing main content for ${role}: ${username}.`);

             // Dispatch custom event after main content is shown, including user info
             document.dispatchEvent(new CustomEvent('authComplete', { detail: { username: username, role: role, userData: userData } }));
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
             // Do NOT clear ADMIN_LOGS_STORAGE_KEY or user-specific post keys here

             // Reset displayed username
             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = 'Guest';
             }

             // Clear current user data from memory
             currentLoggedInUser = null;

            console.log("logininfo.js: Showing auth area. User logged out.");

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
        console.log(`logininfo.js: Generated math problem: ${problem} = ${currentMathAnswer}`); // Log answer for easy testing
    }

    // Switch between login and signup forms
    function showFormView(view) {
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
            }
        }
    }

    // Display user logs (Admin only)
    function renderUserLogs() {
         if (!userLogsListDiv) {
             console.warn("logininfo.js: userLogsListDiv element not found.");
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
              console.log("logininfo.js: Attempted to render logs, but user is not admin.");
             return;
         }
         // If admin and section is NOT active, don't render yet, just clear previous render
         if (!isLogSectionActive) {
             userLogsListDiv.innerHTML = '';
             if (noLogsMessage) noLogsMessage.style.display = 'block'; // Show message if list empty
             console.log("logininfo.js: User is admin, but logs section is not active.");
             return;
         }


         userLogsListDiv.innerHTML = ''; // Clear current list

         const users = getAllUsersData(); // Get all user registration data

         // Convert users object to an array, excluding the admin user
         const userEntries = Object.entries(users)
             .filter(([username, userData]) => username.toLowerCase() !== ADMIN_USERNAME);


         if (userEntries.length === 0) {
             if (noLogsMessage) noLogsMessage.style.display = 'block';
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
         if (!currentLoggedInUser || !accountUpdateForm || !accountManagementSection) {
              console.warn("logininfo.js: Cannot populate account management, user not logged in or elements not found.");
             return; // Only populate if user is logged in and elements exist
         }

         // Only populate if the account management section is currently active (shown by script.js)
         if (!accountManagementSection.classList.contains('active-section')) {
              console.log("logininfo.js: Account management section not active, delaying population.");
             return;
         }

          console.log("logininfo.js: Populating account management form.");

         const user = currentLoggedInUser.data; // Get the full user data object

         // Display current info
         if (currentUsernameDisplaySpan) currentUsernameDisplaySpan.textContent = currentLoggedInUser.username;
         if (currentEmailDisplaySpan) currentEmailDisplaySpan.textContent = user.email || 'N/A';

         // Display profile picture
         if (profilePicturePreviewImg) {
             // If user data has a profile picture, use it, otherwise use the default placeholder
             profilePicturePreviewImg.src = user.profilePicture || 'placeholder-profile.png';
             profilePicturePreviewImg.alt = `${currentLoggedInUser.username}'s Profile Picture`;
         }
         // Clear form fields and messages
          // We don't reset username input on populate, as they might type a new one
          // updateUsernameInput.value = '';
          if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
          if (newPasswordInput) newPasswordInput.value = '';
          if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
          if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear file input value
          clearErrors(accountUpdateErrorDiv, usernameCooldownMessageDiv); // Clear previous errors
          clearSuccess(accountUpdateSuccessDiv); // Clear previous success message


         // Check username change cooldown (only for normal users)
         if (currentLoggedInUser.role === 'admin') {
              if (usernameCooldownMessageDiv) {
                  usernameCooldownMessageDiv.textContent = "Admin username cannot be changed here.";
                   usernameCooldownMessageDiv.style.color = ''; // Reset color
                   usernameCooldownMessageDiv.style.display = 'block';
              }
              if (updateUsernameInput) {
                   updateUsernameInput.disabled = true; // Disable username change for admin
                   updateUsernameInput.value = currentLoggedInUser.username; // Display admin username
              }
         } else { // Normal user
              if (updateUsernameInput) {
                  updateUsernameInput.disabled = false; // Enable for users
                  updateUsernameInput.value = currentLoggedInUser.username; // Display current username
              }

              const lastChange = user.lastUsernameChange ? new Date(user.lastUsernameChange) : null;
              const now = new Date();

              if (lastChange) {
                  const timeDiff = now.getTime() - lastChange.getTime();
                  const daysDiff = timeDiff / MS_PER_DAY;

                  if (daysDiff < USERNAME_CHANGE_COOLDOWN_DAYS) {
                      const daysRemaining = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysDiff);
                      if (usernameCooldownMessageDiv) {
                           usernameCooldownMessageDiv.textContent = `Username can be changed again in ${daysRemaining} days.`;
                           usernameCooldownMessageDiv.style.color = 'var(--theme-warning-color)'; // Warning color
                           usernameCooldownMessageDiv.style.display = 'block';
                      }
                      if (updateUsernameInput) updateUsernameInput.disabled = true; // Disable username input
                  } else {
                      if (usernameCooldownMessageDiv) {
                           usernameCooldownMessageDiv.textContent = "You can change your username now.";
                            usernameCooldownMessageDiv.style.color = ''; // Reset color
                            usernameCooldownMessageDiv.style.display = 'block';
                      }
                       // updateUsernameInput is already enabled by default in the 'else' block
                  }
              } else {
                   // Never changed username before
                    if (usernameCooldownMessageDiv) {
                         usernameCooldownMessageDiv.textContent = "You can change your username now.";
                          usernameCooldownMessageDiv.style.color = '';
                          usernameCooldownMessageDiv.style.display = 'block';
                    }
                    // updateUsernameInput is already enabled
              }
         }
     }


     // Handle account update form submission
     async function handleAccountUpdate(event) {
         event.preventDefault();

         clearErrors(accountUpdateErrorDiv, usernameCooldownMessageDiv); // Clear errors
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
         const currentActualPassword = role === 'admin' ? ADMIN_PASSWORD : users[username].password;

         const currentPasswordAttempt = currentPasswordForUpdateInput.value.trim();
         const newUsername = updateUsernameInput ? updateUsernameInput.value.trim() : username; // Get new username or keep old if input doesn't exist (admin)
         const newPassword = newPasswordInput.value.trim();
         const confirmNewPassword = confirmNewPasswordInput.value.trim();
         const profilePictureFile = updateProfilePictureInput.files ? updateProfilePictureInput.files[0] : null;

         let changesMade = false; // Flag to track if any valid changes were requested


         // --- Validation and Processing ---

         // 1. Validate Current Password (required for username or password change)
         // Current password input is *always* required by HTML for the form to submit IF it's a password or username change attempt.
         // We just need to check if the *value* is correct IF those changes are being attempted.
         const isUsernameChangeAttempt = (newUsername && newUsername !== username);
         const isPasswordChangeAttempt = (newPassword !== ''); // Check if new password field is not empty
         const isProfilePictureChangeAttempt = (profilePictureFile !== null);

         if (isUsernameChangeAttempt || isPasswordChangeAttempt) {
             if (!currentPasswordAttempt) { // Should be caught by HTML required, but double-check
                  displayError("Current password is required to change username or password.", accountUpdateErrorDiv);
                 return;
             }
             if (currentPasswordAttempt !== currentActualPassword) { // INSECURE comparison
                 displayError("Incorrect current password.", accountUpdateErrorDiv);
                 // Clear password fields on incorrect attempt
                 currentPasswordForUpdateInput.value = '';
                 newPasswordInput.value = '';
                 confirmNewPasswordInput.value = '';
                 return;
             }
         }

         // 2. Handle Username Change (if attempted)
         let finalUsername = username;
         if (isUsernameChangeAttempt) {
             // Cooldown check (only for normal users)
             if (role !== 'admin') {
                 const lastChange = users[username].lastUsernameChange ? new Date(users[username].lastUsernameChange) : null;
                 const now = new Date();
                 if (lastChange) {
                     const timeDiff = now.getTime() - lastChange.getTime();
                     const daysDiff = timeDiff / MS_PER_DAY;
                     if (daysDiff < USERNAME_CHANGE_COOLDOWN_DAYS) {
                         const daysRemaining = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysDiff);
                         displayError(`You can only change your username once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days. Please wait ${daysRemaining} more days.`, accountUpdateErrorDiv);
                         // Re-enable input if it was disabled by JS but they tried via dev tools
                         if (updateUsernameInput) updateUsernameInput.disabled = true;
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
             console.log(`logininfo.js: User ${username} changing username to ${finalUsername}`);

             // Update the user data key (simulated database update)
             // This must happen *before* password/profile pic updates if username is the key
              if (role !== 'admin') { // Only move data for normal users
                 const userData = users[username];
                 userData.lastUsernameChange = new Date().toISOString(); // Update timestamp
                 users[finalUsername] = userData; // Add new entry
                 delete users[username]; // Remove old entry
              }
             // Admin username change is hardcoded, not stored in logs data
         }


         // 3. Handle Password Change (if attempted)
         let finalPassword = currentActualPassword; // Start with current password
         if (isPasswordChangeAttempt) {
             if (newPassword.length < 6) {
                 displayError("New password must be at least 6 characters long.", accountUpdateErrorDiv);
                 return;
             }
             if (newPassword !== confirmNewPassword) {
                 displayError("New password and confirm password do not match.", accountUpdateErrorDiv);
                 // Clear new password fields
                 newPasswordInput.value = '';
                 confirmNewPasswordInput.value = '';
                 return;
             }
              if (newPassword === currentPasswordAttempt) {
                   displayError("New password cannot be the same as the current password.", accountUpdateErrorDiv);
                   // Clear new password fields
                  newPasswordInput.value = '';
                  confirmNewPasswordInput.value = '';
                  return;
              }

             // Password change is valid
             finalPassword = newPassword; // INSECURE STORAGE
             changesMade = true;
             console.log(`logininfo.js: User ${username} changing password.`);

             // Update password in user data (for normal users)
             if (role !== 'admin') {
                 users[finalUsername].password = finalPassword; // Use finalUsername after potential change
             } else {
                 // Admin password change needs to update the hardcoded ADMIN_PASSWORD variable
                 // For this demo, we can just log it and rely on localStorage.
                 // In a real app, this would require reconfiguring the server.
                 // alert("Admin password changed successfully! (Simulated)"); // Or a more complex modal
                 // NOTE: This does NOT update the hardcoded ADMIN_PASSWORD variable globally in JS for future loads.
                 // It only works for the current browser session using the 'users' object loaded from localStorage.
             }
         }


         // 4. Handle Profile Picture Update (if attempted)
         let finalProfilePictureDataUrl = null; // Will hold the new data URL or null

         if (isProfilePictureChangeAttempt) {
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
                 changesMade = true;
                 console.log(`logininfo.js: User ${username} updating profile picture.`);
             } catch (e) {
                 console.error("logininfo.js: Error reading profile picture file:", e);
                 displayError("Could not read the profile picture file.", accountUpdateErrorDiv);
                  if(updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                  if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                 return; // Stop submission on file read error
             }
         } else {
              // If no *new* file is selected, keep the current profile picture Data URL
              // Retrieve the existing profile picture from the user data
              finalProfilePictureDataUrl = role === 'admin' ? (users[username]?.profilePicture || null) : users[username].profilePicture;
              // If no file was selected and there was no existing picture, finalProfilePictureDataUrl remains null
              // If a file was selected, it's already set to the new Data URL
         }


         // --- Save Changes and Update State ---

         if (!changesMade) {
              displayError("No changes detected.", accountUpdateErrorDiv);
              return;
         }


         // Update the user object in the logs data (for normal users)
         // Use finalUsername as the key if the username changed
         const targetUsernameKey = role === 'admin' ? username : finalUsername; // Admin key is always 'admin'

         if (role !== 'admin') {
             const targetUser = users[targetUsernameKey];
             targetUser.profilePicture = finalProfilePictureDataUrl; // Update profile picture
             // password and lastUsernameChange were updated in previous steps directly on the user object
         } else {
             // For admin, we simulate updating the profile picture in the 'logs' storage
             // Even though admin isn't usually in this log structure.
             // This part is less clean due to mixing hardcoded admin with logged users.
             // A better demo might store admin data in a separate localStorage key.
             // For simplicity here, let's add/update admin in the logs ONLY for profile picture.
             if (!users[ADMIN_USERNAME]) users[ADMIN_USERNAME] = { password: ADMIN_PASSWORD, email: 'admin@nico.info', phoneNumber: '', registrationDate: 'N/A (Admin)', lastUsernameChange: null };
             users[ADMIN_USERNAME].profilePicture = finalProfilePictureDataUrl;
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
              // If admin changed password (simulated), update the hardcoded variable for this session
              // DANGER ZONE: ADMIN_PASSWORD = finalPassword; // Do NOT do this in real code!
         }


         // Update the username and role in localStorage
         localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentLoggedInUser.username);
         // localStorage.setItem(CURRENT_USER_ROLE_STORAGE_KEY, currentLoggedInUser.role); // Role doesn't change

         // Update the displayed username in the header
         if (loggedInUsernameSpan) loggedInUsernameSpan.textContent = currentLoggedInUser.username;


         // Success message and clear form fields (except username input value)
         displaySuccess("Account updated successfully!", accountUpdateSuccessDiv);
         currentPasswordForUpdateInput.value = ''; // Always clear current password field
         newPasswordInput.value = '';
         confirmNewPasswordInput.value = '';
         // updateUsernameInput.value = ''; // Keep the updated username displayed
         updateProfilePictureInput.value = ''; // Clear file input


         // Refresh the account management form display
         populateAccountManagement();


         // Optional: Dispatch events for changes other parts of the site might care about
         // e.g., update profile pic in server posts
         if (isProfilePictureChangeAttempt) { // Only dispatch if the picture was actually changed
              document.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { username: currentLoggedInUser.username, profilePicture: currentLoggedInUser.data.profilePicture } }));
         }
          if (isUsernameChangeAttempt) {
              document.dispatchEvent(new CustomEvent('usernameUpdated', { detail: { oldUsername: username, newUsername: finalUsername } }));
               // Note: Handling username changes across posts requires updating every post's 'author' field,
               // which is complex with client-side localStorage split by user. A backend is needed.
               // For this demo, only the *display* of the author name in posts might update if re-rendered.
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

     // Add event listeners for the account update form
     if (accountUpdateForm) {
         // Add submit listener
         accountUpdateForm.addEventListener('submit', handleAccountUpdate);
         // Add change listener for profile picture input to update preview
          if (updateProfilePictureInput) {
               updateProfilePictureInput.addEventListener('change', async () => { // Made async to use await
                    const file = updateProfilePictureInput.files ? updateProfilePictureInput.files[0] : null;
                     clearErrors(accountUpdateErrorDiv); // Clear previous errors before validating

                    if (file) {
                         // Basic size and type check before reading
                         if (file.size > MAX_PROFILE_PIC_SIZE) {
                             displayError(`File is too large (${(file.size / 1024).toFixed(0)}KB). Max size is ${MAX_PROFILE_PIC_SIZE / 1024}KB.`, accountUpdateErrorDiv);
                              if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                              if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                             return;
                         }
                          if (!file.type.startsWith('image/')) {
                              displayError("The selected file is not an image.", accountUpdateErrorDiv);
                               if (updateProfilePictureInput) updateProfilePictureInput.value = ''; // Clear input on error
                               if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png'; // Reset preview
                              return;
                          }


                        // Read for preview (might fail even after basic checks)
                        try {
                            const dataUrl = await readFileAsDataURL(file);
                             if (profilePicturePreviewImg) profilePicturePreviewImg.src = dataUrl;
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
                    }
               });
          }
     }


    // --- Event Listeners for Section Display (triggered by script.js) ---
    // Listen for a custom event dispatched by script.js when the logs section should be shown
    document.addEventListener('showUserLogs', () => {
        console.log("logininfo.js: Received 'showUserLogs' event.");
        renderUserLogs(); // Render logs when the event occurs
    });

     // Listen for a custom event dispatched by script.js when the account management section should be shown
     document.addEventListener('showAccountManagement', () => {
         console.log("logininfo.js: Received 'showAccountManagement' event.");
         populateAccountManagement(); // Populate the form when the event occurs
     });


    // Check if user is already logged in on page load
    const currentUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    const currentUserRole = localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY);

    // Get all users data early, even if not admin, to check for registered users for login default
    const registeredUsers = getAllUsersData();

    // Validate stored user exists in logs (except for hardcoded admin)
    // Also retrieve the full user data object on login
    let initialUserData = null;
    if (currentUser && currentUserRole) {
        if (currentUserRole === 'admin') {
            // Admin user data is constructed, potentially merging with any data stored in logs (like profile pic)
             initialUserData = {
                 password: ADMIN_PASSWORD, // Still INSECURE to put hardcoded pw here
                 email: registeredUsers[ADMIN_USERNAME]?.email || 'admin@nico.info', // Use email from logs if exists, else default
                 phoneNumber: registeredUsers[ADMIN_USERNAME]?.phoneNumber || '', // Use phone from logs if exists, else default
                 registrationDate: registeredUsers[ADMIN_USERNAME]?.registrationDate || 'N/A (Admin)', // Use date from logs or default
                 profilePicture: registeredUsers[ADMIN_USERNAME]?.profilePicture || null, // Use pic from logs if exists, else null
                 lastUsernameChange: registeredUsers[ADMIN_USERNAME]?.lastUsernameChange || null // Use date from logs or null (should always be null for admin)
             };
             // Ensure admin entry exists in logs if it's the first load and no data was there for admin
             if (!registeredUsers[ADMIN_USERNAME]) {
                  registeredUsers[ADMIN_USERNAME] = initialUserData; // Add admin's default data
                  saveAllUsersData(registeredUsers); // Save it
             } else {
                 // If admin was already in logs, ensure its in-memory 'initialUserData' reflects latest from logs
                 // (profile pic and maybe email/phone if they were changed via logs editing directly)
                 initialUserData = registeredUsers[ADMIN_USERNAME];
                 // Ensure the password is the hardcoded one, not something potentially stored insecurely
                 initialUserData.password = ADMIN_PASSWORD;
             }


        } else { // Normal user
             initialUserData = registeredUsers[currentUser]; // Get user data from logs
        }
    }


    if (currentUser && currentUserRole && initialUserData) { // Check if user data was successfully retrieved
         console.log(`logininfo.js: Found logged-in user ${currentUser} (${currentUserRole}) in localStorage. Showing main content.`);
         // Show main content without requiring re-authentication, pass user data
         showMainContent(currentUser, currentUserRole, initialUserData);
    } else {
        console.log("logininfo.js: No valid logged-in user found in localStorage. Showing auth area.");
        // If no accounts exist (or none are valid), default to signup, otherwise default to login
         const anyNormalUsersRegistered = Object.keys(registeredUsers).some(username => username.toLowerCase() !== ADMIN_USERNAME);

        if (!anyNormalUsersRegistered) {
             // No normal users registered, default to signup
            showFormView('signup'); // Will also generate math problem
             console.log("logininfo.js: No registered users found, defaulting to signup.");
        } else {
            // Normal users registered, default to login
            showFormView('login');
             console.log("logininfo.js: Registered users found, defaulting to login.");
        }
        showAuthArea(); // Ensure auth area is visible
    }
});