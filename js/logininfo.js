console.log("logininfo.js: Script loaded.");

document.addEventListener('DOMContentLoaded', () => {
    console.log("logininfo.js: DOMContentLoaded fired.");

    const authArea = document.getElementById('authArea');
    const mainContent = document.getElementById('mainContent');
    const loggedInUsernameSpan = document.getElementById('loggedInUsername');
    const userLogsListDiv = document.getElementById('userLogsList');
    const noLogsMessage = document.getElementById('noLogsMessage');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginErrorDiv = document.getElementById('loginError');

    const signupUsernameInput = document.getElementById('signupUsername');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPhoneInput = document.getElementById('signupPhone');
    const signupPasswordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupErrorDiv = document.getElementById('signupError');

    const mathProblemSpan = document.getElementById('mathProblem');
    const mathAnswerInput = document.getElementById('mathAnswer');
    const mathErrorDiv = document.getElementById('mathError');

    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');

    const accountManagementSection = document.getElementById('account-management-section');
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
    const accountUpdateSuccessDiv = document.getElementById('accountUpdateSuccess');

    const ADMIN_USERNAME = 'admin';
    let ADMIN_PASSWORD = 'nicospasword';

    const ADMIN_LOGS_STORAGE_KEY = 'nicoInfoAdminLogs';
    const CURRENT_USER_STORAGE_KEY = 'nicoInfoCurrentUser';
    const CURRENT_USER_ROLE_STORAGE_KEY = 'nicoInfoCurrentUserRole';

    const USERNAME_CHANGE_COOLDOWN_DAYS = 7;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const MAX_PROFILE_PIC_SIZE = 500 * 1024;

    let currentMathAnswer = null;

    let currentLoggedInUser = null;

    function getAllUsersData() {
        console.log("logininfo.js: Calling getAllUsersData.");
        const logsJson = localStorage.getItem(ADMIN_LOGS_STORAGE_KEY);
        try {
            const users = logsJson ? JSON.parse(logsJson) : {};
             for (const username in users) {
                 if (users.hasOwnProperty(username)) {
                      if (typeof users[username] === 'string') {
                           console.warn(`logininfo.js: Converting old data format for user: ${username}`);
                          users[username] = {
                              password: users[username],
                              email: 'unknown',
                              phoneNumber: '',
                              registrationDate: 'unknown',
                              profilePicture: null,
                              lastUsernameChange: null
                          };
                     } else {
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
            return {};
        }
    }

    function saveAllUsersData(users) {
        console.log("logininfo.js: Calling saveAllUsersData.");
        localStorage.setItem(ADMIN_LOGS_STORAGE_KEY, JSON.stringify(users));
         console.log(`logininfo.js: Saved ${Object.keys(users).length} user logs to admin storage.`);
    }

    function displayError(message, errorElement) {
        console.log(`logininfo.js: Displaying error "${message}" on`, errorElement);
        if (errorElement) {
            errorElement.textContent = message;
             errorElement.style.display = 'block';
        }
         if (accountUpdateSuccessDiv) accountUpdateSuccessDiv.style.display = 'none';
    }

    function displaySuccess(message, successElement) {
        console.log(`logininfo.js: Displaying success "${message}" on`, successElement);
         if (successElement) {
             successElement.textContent = message;
             successElement.style.display = 'block';
         }
          if (accountUpdateErrorDiv) accountUpdateErrorDiv.style.display = 'none';
    }

    function clearErrors(...errorElements) {
        console.log("logininfo.js: Clearing errors.", errorElements);
        errorElements.forEach(el => {
            if (el) {
                el.textContent = '';
                el.style.display = 'none';
            }
        });
         if (accountUpdateSuccessDiv) accountUpdateSuccessDiv.style.display = 'none';
        if (usernameCooldownMessageDiv) usernameCooldownMessageDiv.style.display = 'none';
    }

     function clearSuccess(...successElements) {
         console.log("logininfo.js: Clearing success messages.", successElements);
         successElements.forEach(el => {
             if (el) {
                 el.textContent = '';
                 el.style.display = 'none';
             }
         });
          if (accountUpdateErrorDiv) accountUpdateErrorDiv.style.display = 'none';
         if (usernameCooldownMessageDiv) usernameCooldownMessageDiv.style.display = 'none';
     }

    function showMainContent(username, role, userData = null) {
        console.log(`logininfo.js: Showing main content for ${role}: ${username}.`);
        if (authArea && mainContent) {
            authArea.style.display = 'none';
            mainContent.style.display = 'block';

             currentLoggedInUser = { username: username, role: role, data: userData };

             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = username;
             }

             document.dispatchEvent(new CustomEvent('authComplete', { detail: { username: username, role: role, userData: userData } }));
             console.log("logininfo.js: Dispatched 'authComplete' event.");
        } else {
             console.error("logininfo.js: Could not find authArea or mainContent to show.");
        }
    }

     function showAuthArea() {
        console.log("logininfo.js: Showing auth area. User logging out.");
        if (authArea && mainContent) {
            authArea.style.display = 'flex';
            mainContent.style.display = 'none';

            localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
            localStorage.removeItem(CURRENT_USER_ROLE_STORAGE_KEY);

             if(loggedInUsernameSpan) {
                 loggedInUsernameSpan.textContent = 'Guest';
             }

             currentLoggedInUser = null;

             document.dispatchEvent(new CustomEvent('authLogout'));
             console.log("logininfo.js: Dispatched 'authLogout' event.");
        } else {
             console.error("logininfo.js: Could not find authArea or mainContent to show auth area.");
        }
     }

    function generateMathProblem() {
        console.log("logininfo.js: Generating math problem.");
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const problem = `${num1} + ${num2}`;
        currentMathAnswer = num1 + num2;
        if (mathProblemSpan) {
             mathProblemSpan.textContent = problem;
        } else {
             console.warn("logininfo.js: Math problem span not found.");
        }
         if (mathAnswerInput) {
              mathAnswerInput.value = '';
         } else {
             console.warn("logininfo.js: Math answer input not found.");
         }
        console.log(`logininfo.js: Generated math problem: ${problem} = ${currentMathAnswer}`);
    }

    function showFormView(view) {
        console.log(`logininfo.js: Switching form view to: ${view}`);
        if (loginForm && signupForm) {
            if (view === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                 clearErrors(signupErrorDiv, mathErrorDiv);
                 clearSuccess(accountUpdateSuccessDiv);
                 if(signupUsernameInput) signupUsernameInput.value = '';
                 if(signupEmailInput) signupEmailInput.value = '';
                 if(signupPhoneInput) signupPhoneInput.value = '';
                 if(signupPasswordInput) signupPasswordInput.value = '';
                 if(confirmPasswordInput) confirmPasswordInput.value = '';
                 if(mathAnswerInput) mathAnswerInput.value = '';

            } else if (view === 'signup') {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                 clearErrors(loginErrorDiv, accountUpdateErrorDiv);
                 clearSuccess(accountUpdateSuccessDiv);
                 generateMathProblem();
                 if(loginUsernameInput) loginUsernameInput.value = '';
                 if(loginPasswordInput) loginPasswordInput.value = '';
            } else {
                 console.warn(`logininfo.js: Unknown form view requested: ${view}`);
            }
        } else {
             console.error("logininfo.js: Login or signup forms not found.");
        }
    }

    function renderUserLogs() {
         console.log("logininfo.js: Attempting to render user logs.");
         if (!userLogsListDiv) {
             console.warn("logininfo.js: userLogsListDiv element not found. Cannot render logs.");
             return;
         }

         const currentUserRole = localStorage.getItem(CURRENT_USER_ROLE_STORAGE_KEY);
         const logSection = document.getElementById('user-logs-section');
         const isLogSectionActive = logSection && logSection.classList.contains('active-section');

         if (currentUserRole !== 'admin') {
             userLogsListDiv.innerHTML = '';
             if (noLogsMessage) noLogsMessage.style.display = 'none';
             if (isLogSectionActive) {
                 userLogsListDiv.innerHTML = '<p style="text-align:center; color: var(--theme-error-color);">Access Denied. You must be an administrator to view logs.</p>';
             }
              console.log("logininfo.js: User is not admin. Logs not rendered.");
             return;
         }
         if (!isLogSectionActive) {
             userLogsListDiv.innerHTML = '';
             if (noLogsMessage) noLogsMessage.style.display = 'block';
             console.log("logininfo.js: User is admin, but logs section is not active. Skipping render.");
             return;
         }

         userLogsListDiv.innerHTML = '';

         const users = getAllUsersData();

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
             `;
             userLogsListDiv.appendChild(logEntry);
         });
          console.log(`logininfo.js: Rendered ${userEntries.length} user log entries.`);
    }

     function populateAccountManagement() {
         console.log("logininfo.js: Attempting to populate account management form.");
         if (!currentLoggedInUser || !accountUpdateForm || !accountManagementSection || !profilePicturePreviewImg || !currentUsernameDisplaySpan || !currentEmailDisplaySpan || !updateProfilePictureInput || !updateUsernameInput || !usernameCooldownMessageDiv || !currentPasswordForUpdateInput || !newPasswordInput || !confirmNewPasswordInput || !accountUpdateErrorDiv || !accountUpdateSuccessDiv) {
              console.warn("logininfo.js: Cannot populate account management, user not logged in or one or more required elements not found.");
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

             if(accountManagementSection) accountManagementSection.style.display = 'none';

             return;
         }

         const isAccountSectionActive = accountManagementSection.classList.contains('active-section');

         if (!isAccountSectionActive) {
              console.log("logininfo.js: Account management section not active, delaying population.");
             return;
         }

          console.log("logininfo.js: Populating account management form for user:", currentLoggedInUser.username);

         const user = currentLoggedInUser.data;

         currentUsernameDisplaySpan.textContent = currentLoggedInUser.username;
         currentEmailDisplaySpan.textContent = user.email || 'N/A';

         if (profilePicturePreviewImg) {
             profilePicturePreviewImg.src = user.profilePicture || 'placeholder-profile.png';
             profilePicturePreviewImg.alt = `${currentLoggedInUser.username}'s Profile Picture`;
         }
          currentPasswordForUpdateInput.value = '';
          newPasswordInput.value = '';
          confirmNewPasswordInput.value = '';
          if (updateProfilePictureInput) updateProfilePictureInput.value = '';
          clearErrors(accountUpdateErrorDiv, usernameCooldownMessageDiv);
          clearSuccess(accountUpdateSuccessDiv);

         if (currentLoggedInUser.role === 'admin') {
              usernameCooldownMessageDiv.textContent = "Admin username cannot be changed here.";
               usernameCooldownMessageDiv.style.color = '';
               usernameCooldownMessageDiv.style.display = 'block';
              updateUsernameInput.disabled = true;
              updateUsernameInput.value = currentLoggedInUser.username;
         } else {
              updateUsernameInput.disabled = false;
              updateUsernameInput.value = currentLoggedInUser.username;

              const lastChange = user.lastUsernameChange ? new Date(user.lastUsernameChange) : null;
              const now = new Date();

              if (lastChange) {
                  const timeDiff = now.getTime() - lastChange.getTime();
                  const daysDiff = timeDiff / MS_PER_DAY;

                  if (daysDiff < USERNAME_CHANGE_COOLDOWN_DAYS) {
                      const daysRemaining = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysDiff);
                      usernameCooldownMessageDiv.textContent = `Username can be changed again in ${daysRemaining} days.`;
                      usernameCooldownMessageDiv.style.color = 'var(--theme-warning-color)';
                      usernameCooldownMessageDiv.style.display = 'block';
                      updateUsernameInput.disabled = true;
                  } else {
                      usernameCooldownMessageDiv.textContent = "You can change your username now.";
                       usernameCooldownMessageDiv.style.color = '';
                       usernameCooldownMessageDiv.style.display = 'block';
                       updateUsernameInput.disabled = false;
                  }
              } else {
                    usernameCooldownMessageDiv.textContent = "You can change your username now.";
                     usernameCooldownMessageDiv.style.color = '';
                     usernameCooldownMessageDiv.style.display = 'block';
                    updateUsernameInput.disabled = false;
              }
         }
     }

     async function handleAccountUpdate(event) {
         console.log("logininfo.js: Handling account update submission.");
         event.preventDefault();

         clearErrors(accountUpdateErrorDiv);
         clearSuccess(accountUpdateSuccessDiv);

         if (!currentLoggedInUser) {
             displayError("You must be logged in to update your account.", accountUpdateErrorDiv);
             window.logout();
             return;
         }

         const username = currentLoggedInUser.username;
         const role = currentLoggedInUser.role;
         let users = getAllUsersData();

         let currentActualPassword = ADMIN_PASSWORD;

         if (role !== 'admin' && users[username]) {
             currentActualPassword = users[username].password;
         } else if (role !== 'admin' && !users[username]) {
              console.error(`logininfo.js: User "${username}" not found in logs during update attempt!`);
              displayError("Account data error. Please try logging in again.", accountUpdateErrorDiv);
              window.logout();
              return;
         }

         const currentPasswordAttempt = currentPasswordForUpdateInput ? currentPasswordForUpdateInput.value.trim() : '';
         const newUsername = updateUsernameInput ? updateUsernameInput.value.trim() : username;
         const newPassword = newPasswordInput ? newPasswordInput.value.trim() : '';
         const confirmNewPassword = confirmNewPasswordInput ? confirmNewPasswordInput.value.trim() : '';
         const profilePictureFile = updateProfilePictureInput.files ? updateProfilePictureInput.files[0] : null;

         let changesMade = false;

         const isUsernameChangeAttempt = updateUsernameInput && (newUsername !== username) && !updateUsernameInput.disabled;
         const isPasswordChangeAttempt = (newPassword !== '');
         const isProfilePictureChangeAttempt = (profilePictureFile !== null);

         console.log(`logininfo.js: Update attempt flags: Username=${isUsernameChangeAttempt}, Password=${isPasswordChangeAttempt}, ProfilePic=${isProfilePictureChangeAttempt}`);

         if (!isUsernameChangeAttempt && !isPasswordChangeAttempt && !isProfilePictureChangeAttempt) {
              displayError("No changes detected.", accountUpdateErrorDiv);
             if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
             if (newPasswordInput) newPasswordInput.value = '';
             if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
             return;
         }

         if (isUsernameChangeAttempt || isPasswordChangeAttempt) {
             if (!currentPasswordAttempt) {
                  displayError("Current password is required to change username or password.", accountUpdateErrorDiv);
                 if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
             if (currentPasswordAttempt !== currentActualPassword) {
                 displayError("Incorrect current password.", accountUpdateErrorDiv);
                 if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
             console.log("logininfo.js: Current password validated.");
         }

         let finalUsername = username;
         if (isUsernameChangeAttempt) {
              console.log(`logininfo.js: Processing username change attempt: "${username}" -> "${newUsername}"`);
             if (role !== 'admin') {
                 const lastChange = users[username].lastUsernameChange ? new Date(users[username].lastUsernameChange) : null;
                 const now = new Date();
                 if (lastChange) {
                     const timeDiff = now.getTime() - lastChange.getTime();
                     const daysDiff = timeDiff / MS_PER_DAY;
                     if (daysDiff < USERNAME_CHANGE_COOLDOWN_DAYS) {
                         const daysRemaining = Math.ceil(USERNAME_CHANGE_COOLDOWN_DAYS - daysDiff);
                         displayError(`You can only change your username once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days. Please wait ${daysRemaining} more days.`, accountUpdateErrorDiv);
                          if (updateUsernameInput) updateUsernameInput.disabled = true;
                         return;
                     }
                 }
             } else {
                 displayError("Admin username cannot be changed here.", accountUpdateErrorDiv);
                 return;
             }

             const usernameTaken = Object.keys(users).some(userKey => userKey.toLowerCase() === newUsername.toLowerCase() && userKey.toLowerCase() !== username.toLowerCase());
             if (usernameTaken) {
                 displayError(`Username "${newUsername}" is already taken.`, accountUpdateErrorDiv);
                 return;
             }

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

             finalUsername = newUsername;
             changesMade = true;
             console.log(`logininfo.js: Username change validated.`);

              if (role !== 'admin') {
                 const userData = users[username];
                 userData.lastUsernameChange = new Date().toISOString();
                 users[finalUsername] = userData;
                 delete users[username];
                  console.log(`logininfo.js: Updated user data key from "${username}" to "${finalUsername}".`);
              }
         }

         let finalPassword = currentActualPassword;
         if (isPasswordChangeAttempt) {
              console.log("logininfo.js: Processing password change attempt.");
             if (newPassword.length < 6) {
                 displayError("New password must be at least 6 characters long.", accountUpdateErrorDiv);
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
             if (newPassword !== confirmNewPassword) {
                 displayError("New password and confirm password do not match.", accountUpdateErrorDiv);
                 if (newPasswordInput) newPasswordInput.value = '';
                 if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                 return;
             }
              if (newPassword === currentPasswordAttempt) {
                   displayError("New password cannot be the same as the current password.", accountUpdateErrorDiv);
                  if (newPasswordInput) newPasswordInput.value = '';
                  if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
                  return;
              }

             finalPassword = newPassword;
             changesMade = true;
             console.log(`logininfo.js: Password change validated.`);

             if (role !== 'admin') {
                 users[finalUsername].password = finalPassword;
                  console.log(`logininfo.js: Password updated for user "${finalUsername}".`);
             } else {
                 ADMIN_PASSWORD = finalPassword;
                 console.warn("logininfo.js: Admin password changed in current session memory. This is not persistent!");
             }
         }

         let finalProfilePictureDataUrl = null;

         if (isProfilePictureChangeAttempt) {
             console.log("logininfo.js: Processing profile picture change attempt.");
              if (profilePictureFile.size > MAX_PROFILE_PIC_SIZE) {
                  displayError(`Profile picture is too large (${(profilePictureFile.size / 1024).toFixed(0)}KB). Max size is ${MAX_PROFILE_PIC_SIZE / 1024}KB.`, accountUpdateErrorDiv);
                   if(updateProfilePictureInput) updateProfilePictureInput.value = '';
                   if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                  return;
              }
               if (!profilePictureFile.type.startsWith('image/')) {
                   displayError("The selected file is not an image.", accountUpdateErrorDiv);
                   if(updateProfilePictureInput) updateProfilePictureInput.value = '';
                   if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                   return;
               }

             try {
                 finalProfilePictureDataUrl = await readFileAsDataURL(profilePictureFile);
                 console.log(`logininfo.js: Profile picture file read successfully.`);
             } catch (e) {
                 console.error("logininfo.js: Error reading profile picture file:", e);
                 displayError("Could not read the profile picture file.", accountUpdateErrorDiv);
                  if(updateProfilePictureInput) updateProfilePictureInput.value = '';
                  if(profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                 return;
             }
             changesMade = true;
         } else {
              const targetUserData = users[finalUsername] || users[username];
              finalProfilePictureDataUrl = targetUserData?.profilePicture || null;
         }

         if (!changesMade) {
              displayError("No changes detected or validation failed.", accountUpdateErrorDiv);
              return;
         }

         const targetUsernameKey = role === 'admin' ? username : finalUsername;

         if (role !== 'admin') {
             const targetUser = users[targetUsernameKey];
             targetUser.profilePicture = finalProfilePictureDataUrl;
              console.log(`logininfo.js: Updated user data in logs for "${targetUsernameKey}".`);
         } else {
             if (!users[ADMIN_USERNAME]) {
                  users[ADMIN_USERNAME] = { password: ADMIN_PASSWORD, email: 'admin@nico.info', phoneNumber: '', registrationDate: 'N/A (Admin)', lastUsernameChange: null };
                  console.log("logininfo.js: Created default admin entry in logs for profile pic storage.");
             }
             users[ADMIN_USERNAME].profilePicture = finalProfilePictureDataUrl;
              console.log(`logininfo.js: Updated admin profile picture in logs.`);
         }

         saveAllUsersData(users);

         currentLoggedInUser.username = targetUsernameKey;
         if (role !== 'admin') {
             currentLoggedInUser.data = users[targetUsernameKey];
         } else {
              currentLoggedInUser.data.profilePicture = finalProfilePictureDataUrl;
              currentLoggedInUser.data.password = ADMIN_PASSWORD;
         }

         localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentLoggedInUser.username);

         displaySuccess("Account updated successfully!", accountUpdateSuccessDiv);
         if (currentPasswordForUpdateInput) currentPasswordForUpdateInput.value = '';
         if (newPasswordInput) newPasswordInput.value = '';
         if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
         if (updateProfilePictureInput) updateProfilePictureInput.value = '';

         populateAccountManagement();

         document.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { username: currentLoggedInUser.username, profilePicture: currentLoggedInUser.data.profilePicture } }));
         if (isUsernameChangeAttempt) {
              document.dispatchEvent(new CustomEvent('usernameUpdated', { detail: { oldUsername: username, newUsername: finalUsername } }));
         }

         console.log("logininfo.js: Account update process finished.");
     }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                 resolve(null);
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

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    window.getAllUsersData = getAllUsersData;

    console.log("logininfo.js: Initializing event listeners and checking login state.");

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

     if (accountUpdateForm) {
         console.log("logininfo.js: AccountUpdateForm found, adding listeners.");
         accountUpdateForm.addEventListener('submit', handleAccountUpdate);
          if (updateProfilePictureInput) {
               updateProfilePictureInput.addEventListener('change', async () => {
                    console.log("logininfo.js: Profile picture input change detected.");
                    const file = updateProfilePictureInput.files ? updateProfilePictureInput.files[0] : null;
                     if (accountUpdateErrorDiv) { accountUpdateErrorDiv.textContent = ''; accountUpdateErrorDiv.style.display = 'none'; }
                     if (accountUpdateSuccessDiv) { accountUpdateSuccessDiv.textContent = ''; accountUpdateSuccessDiv.style.display = 'none'; }
                     if (usernameCooldownMessageDiv) { usernameCooldownMessageDiv.style.display = 'none'; }


                    if (file) {
                         console.log(`logininfo.js: File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
                         if (file.size > MAX_PROFILE_PIC_SIZE) {
                             displayError(`File is too large (${(file.size / 1024).toFixed(0)}KB). Max size is ${MAX_PROFILE_PIC_SIZE / 1024}KB.`, accountUpdateErrorDiv);
                              if (updateProfilePictureInput) updateProfilePictureInput.value = '';
                              if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                              console.warn("logininfo.js: Profile picture file too large.");
                             return;
                         }
                          if (!file.type.startsWith('image/')) {
                              displayError("The selected file is not an image.", accountUpdateErrorDiv);
                               if (updateProfilePictureInput) updateProfilePictureInput.value = '';
                               if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                               console.warn("logininfo.js: Profile picture file is not an image.");
                              return;
                          }

                        try {
                            const dataUrl = await readFileAsDataURL(file);
                             if (profilePicturePreviewImg) profilePicturePreviewImg.src = dataUrl;
                             console.log("logininfo.js: Profile picture preview updated successfully.");
                        } catch (e) {
                            console.error("logininfo.js: Error previewing profile picture:", e);
                            displayError("Could not preview image.", accountUpdateErrorDiv);
                             if (updateProfilePictureInput) updateProfilePictureInput.value = '';
                             if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                        }

                    } else {
                         if (profilePicturePreviewImg) profilePicturePreviewImg.src = currentLoggedInUser?.data?.profilePicture || 'placeholder-profile.png';
                         clearErrors(accountUpdateErrorDiv);
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