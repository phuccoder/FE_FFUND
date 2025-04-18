var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
var Key = webdriver.Key;

(async function testTeamManagement() {
    let browser = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .build();

    try {
        // TEST CASE 1: Login as founder
        console.log('\nTEST CASE 1: Logging in as FOUNDER');
        
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('Window maximized!');
        
        await browser.sleep(2000);

        let loginButton = await browser.wait(
            until.elementLocated(By.css('.main-btn.main-btn-2')),
            10000
        );
        await loginButton.click();
        console.log('✓ Login button clicked!');

        let emailField = await browser.wait(
            until.elementLocated(By.css('#email')),
            10000
        );
        await emailField.click();
        await browser.sleep(1000);
        await emailField.clear();
        await emailField.sendKeys('phucnmtde170689@fpt.edu.vn');
        console.log('✓ Email entered successfully!');

        let passwordField = await browser.wait(
            until.elementLocated(By.css('#password')),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys('123456');
        console.log('✓ Password entered successfully!');

        await browser.sleep(1000);
        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("//button[normalize-space()='Sign in']")),
            10000
        );
        await submitButton.click();
        console.log('✓ Submit button clicked!');
        
        await browser.sleep(5000);

        // Verify login as Founder
        let role = await browser.executeScript("return localStorage.getItem('role');");
        if (role === 'FOUNDER') {
            console.log('✓ Successfully logged in as FOUNDER!');
        } else {
            console.log(`✗ Login failed or wrong account type: ${role}`);
            return;
        }

        // TEST CASE 2: Navigate to team members page (landing page for team management)
        console.log('\nTEST CASE 2: Navigating to team members page');
        
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/team-members');
        await browser.sleep(3000);
        console.log('✓ Navigated to team members page');
        
        // Check for existing team or "Create Team" option
        let hasTeam = false;
        
        try {
            // First check if the team management section is visible
            let teamManagementSection = await browser.findElement(By.css('.team-management-section, [data-testid="team-management"]'));
            console.log('✓ Team Management section found - user has an existing team');
            hasTeam = true;
        } catch (error) {
            // If not found, check for the "No Team" section with "Create Team" button
            try {
                let noTeamSection = await browser.findElement(By.css('.no-team-section, [data-testid="no-team"]'));
                console.log('✓ No Team section found - user needs to create a team');
                
                // TEST CASE 3: Create Team (only if user doesn't have a team)
                console.log('\nTEST CASE 3: Testing team creation');
                
                // Find and click Create Team button
                let createTeamButton = await browser.findElement(
                    By.xpath("//a[contains(text(), 'Create Team')] | //button[contains(text(), 'Create Team')]")
                );
                await createTeamButton.click();
                console.log('✓ Clicked on Create Team button');
                await browser.sleep(2000);
                
                // Verify redirect to team creation page
                let currentUrl = await browser.getCurrentUrl();
                if (currentUrl.includes('/team/create')) {
                    console.log('✓ Successfully navigated to team creation page');
                    
                    // Fill in team creation form
                    try {
                        // Generate a unique team name with timestamp
                        const timestamp = new Date().getTime();
                        const teamName = `Test Team ${timestamp}`;
                        
                        // Find and fill Team Name field
                        let teamNameField = await browser.findElement(By.css('input[name="teamName"]'));
                        await teamNameField.sendKeys(teamName);
                        console.log(`✓ Entered team name: ${teamName}`);
                        
                        // Find and fill Team Description field
                        let teamDescriptionField = await browser.findElement(By.css('textarea[name="teamDescription"]'));
                        await teamDescriptionField.sendKeys(`This is a test team created at ${new Date().toLocaleString()}`);
                        console.log('✓ Entered team description');
                        
                        // Add a team member email (optional)
                        try {
                            let memberEmailField = await browser.findElement(By.css('input[type="email"]'));
                            const testEmail = `testmember${timestamp}@example.com`;
                            await memberEmailField.sendKeys(testEmail);
                            console.log(`✓ Entered member email: ${testEmail}`);
                            
                            // Test Add Another Email button
                            let addEmailButton = await browser.findElement(
                                By.xpath("//button[contains(text(), '+ Add Another Email')]")
                            );
                            await addEmailButton.click();
                            console.log('✓ Clicked Add Another Email button');
                            await browser.sleep(1000);
                            
                            // Verify a new email field was added
                            let emailFields = await browser.findElements(By.css('input[type="email"]'));
                            if (emailFields.length > 1) {
                                console.log(`✓ Successfully added another email field (Total: ${emailFields.length})`);
                                
                                // Test Remove button
                                let removeButton = await browser.findElement(By.xpath("//button[contains(text(), 'Remove')]"));
                                await removeButton.click();
                                console.log('✓ Clicked Remove button');
                                await browser.sleep(1000);
                                
                                // Verify field was removed
                                emailFields = await browser.findElements(By.css('input[type="email"]'));
                                console.log(`✓ Email field count after removal: ${emailFields.length}`);
                            }
                        } catch (error) {
                            console.log('✗ Error adding/removing team member emails:', error.message);
                        }
                        
                        // Submit the form
                        let submitButton = await browser.findElement(
                            By.xpath("//button[contains(text(), 'Create Team')]")
                        );
                        await submitButton.click();
                        console.log('✓ Clicked Create Team submit button');
                        await browser.sleep(5000);
                        
                        // Verify redirect back to team page after creation
                        currentUrl = await browser.getCurrentUrl();
                        if (currentUrl.includes('/team-members')) {
                            console.log('✓ Successfully created team and redirected to team members page');
                            hasTeam = true;
                        } else {
                            console.log(`✗ Unexpected URL after team creation: ${currentUrl}`);
                            
                            // Check for any error messages
                            try {
                                let errorMessages = await browser.findElements(By.css('.Toastify__toast--error, .alert-danger, .text-danger'));
                                if (errorMessages.length > 0) {
                                    for (let i = 0; i < errorMessages.length; i++) {
                                        console.log(`✗ Error message found: "${await errorMessages[i].getText()}"`);
                                    }
                                }
                            } catch (error) {
                                // No error messages found
                            }
                        }
                    } catch (error) {
                        console.log('✗ Error filling team creation form:', error.message);
                    }
                } else {
                    console.log(`✗ Navigation to team creation page failed. Current URL: ${currentUrl}`);
                }
            } catch (noTeamError) {
                console.log('✗ Could not find either Team Management or No Team section');
            }
        }
        
        // If the user has a team (either existing or newly created), test team management features
        if (hasTeam) {
            // TEST CASE 4: Check team details and members
            console.log('\nTEST CASE 4: Checking team details and members');
            
            // Ensure we're on the team members page
            await browser.get('https://deploy-f-fund-b4n2.vercel.app/team-members');
            await browser.sleep(3000);
            
            try {
                // Check for team name
                let teamNameElement = await browser.findElement(
                    By.css('.team-name, h3, .card-title')
                );
                let teamName = await teamNameElement.getText();
                console.log(`✓ Team name displayed: ${teamName}`);
                
                // Check for team members list
                try {
                    let teamMembersList = await browser.findElements(
                        By.css('.team-member, .list-group-item, .member-item')
                    );
                    let memberCount = teamMembersList.length;
                    console.log(`✓ Found ${memberCount} team members`);
                    
                    // Check for current user's role (should be LEADER if they created the team)
                    for (let i = 0; i < memberCount; i++) {
                        try {
                            let memberElement = teamMembersList[i];
                            let memberRole = await memberElement.findElement(
                                By.css('.badge, .team-role, .role-badge')
                            ).getText();
                            let memberName = await memberElement.findElement(
                                By.css('.member-name, strong, .fw-bold')
                            ).getText();
                            
                            console.log(`✓ Member: ${memberName}, Role: ${memberRole}`);
                        } catch (error) {
                            console.log('✗ Error getting member details');
                        }
                    }
                } catch (error) {
                    console.log('✗ Error finding team members list:', error.message);
                }
                
                // TEST CASE 5: Test Invite Team Member functionality
                console.log('\nTEST CASE 5: Testing Invite Team Member functionality');
                
                try {
                    // Find and click Invite Member button
                    let inviteButton = await browser.findElement(
                        By.xpath("//a[contains(text(), 'Invite Member')] | //button[contains(text(), 'Invite Member')]")
                    );
                    await inviteButton.click();
                    console.log('✓ Clicked on Invite Member button');
                    await browser.sleep(2000);
                    
                    // Verify redirect to invitation page
                    let currentUrl = await browser.getCurrentUrl();
                    if (currentUrl.includes('/team/invite')) {
                        console.log('✓ Successfully navigated to invite members page');
                        
                        // Check if the current team members are displayed
                        try {
                            let currentMembers = await browser.findElements(
                                By.css('.list-group-item, .team-member, .member-item')
                            );
                            console.log(`✓ Current team members displayed: ${currentMembers.length}`);
                        } catch (error) {
                            console.log('✗ Could not find current team members list');
                        }
                        
                        // Test member search functionality
                        try {
                            // Generate a random test email
                            const timestamp = new Date().getTime();
                            const testSearchEmail = `test${timestamp}@`;
                            
                            // Find and fill the member email field
                            let emailField = await browser.findElement(
                                By.css('input[type="email"], input[placeholder*="email"]')
                            );
                            await emailField.clear();
                            await emailField.sendKeys(testSearchEmail);
                            console.log(`✓ Entered search text: ${testSearchEmail}`);
                            await browser.sleep(1000);
                            
                            // Check for search results or searching indicator
                            try {
                                let searchingSpinner = await browser.findElement(
                                    By.css('.spinner-border, .spinner, .loading-indicator')
                                );
                                console.log('✓ Search indicator displayed');
                                await browser.sleep(2000);
                            } catch (error) {
                                // Spinner might be gone already
                            }
                            
                            // Check for search results dropdown
                            try {
                                let searchResults = await browser.findElements(
                                    By.css('.position-absolute .d-flex, .dropdown-item, .search-result-item')
                                );
                                console.log(`✓ Found ${searchResults.length} search results`);
                                
                                // Click on a search result if available
                                if (searchResults.length > 0) {
                                    await searchResults[0].click();
                                    console.log('✓ Selected the first search result');
                                    await browser.sleep(1000);
                                    
                                    // Check if the email field was updated with the selected email
                                    let updatedEmail = await emailField.getAttribute('value');
                                    console.log(`✓ Email field updated to: ${updatedEmail}`);
                                }
                            } catch (error) {
                                console.log('✗ No search results found:', error.message);
                            }
                            
                            // Test sending invitation
                            try {
                                // If no search results were found, ensure we have a valid email for testing
                                let currentEmail = await emailField.getAttribute('value');
                                if (!currentEmail || !currentEmail.includes('@')) {
                                    // Enter a valid email if field is empty or invalid
                                    await emailField.clear();
                                    const validEmail = `testinvite${timestamp}@example.com`;
                                    await emailField.sendKeys(validEmail);
                                    console.log(`✓ Entered valid email for invitation: ${validEmail}`);
                                }
                                
                                // Click Send Invitation button
                                let sendButton = await browser.findElement(
                                    By.xpath("//button[contains(text(), 'Send Invitation')]")
                                );
                                await sendButton.click();
                                console.log('✓ Clicked Send Invitation button');
                                await browser.sleep(3000);
                                
                                // Check for confirmation toast or error messages
                                try {
                                    let toastMessages = await browser.findElements(
                                        By.css('.Toastify__toast-body, .toast-message, .alert')
                                    );
                                    if (toastMessages.length > 0) {
                                        let messageText = await toastMessages[0].getText();
                                        console.log(`✓ Toast message displayed: "${messageText}"`);
                                    }
                                } catch (error) {
                                    console.log('✗ No toast message found after sending invitation');
                                }
                            } catch (error) {
                                console.log('✗ Error sending invitation:', error.message);
                            }
                        } catch (error) {
                            console.log('✗ Error testing member search:', error.message);
                        }
                        
                        // Navigate back to team members page
                        await browser.get('https://deploy-f-fund-b4n2.vercel.app/team-members');
                        await browser.sleep(2000);
                        console.log('✓ Navigated back to team members page');
                    } else {
                        console.log(`✗ Navigation to invite page failed. Current URL: ${currentUrl}`);
                    }
                } catch (error) {
                    console.log('✗ Error finding Invite Member button:', error.message);
                }
            } catch (error) {
                console.log('✗ Error checking team details:', error.message);
            }
            
            // TEST CASE 6: Check for pending invitations section
            console.log('\nTEST CASE 6: Checking pending invitations');
            
            try {
                // Look for pending invitations section
                let pendingInvitationsSection = await browser.findElements(
                    By.xpath("//h4[contains(text(), 'Pending Invitations')] | //h5[contains(text(), 'Pending Invitations')]")
                );
                
                if (pendingInvitationsSection.length > 0) {
                    console.log('✓ Pending Invitations section found');
                    
                    // Check if there are any pending invitations
                    try {
                        let pendingInvitations = await browser.findElements(
                            By.css('.pending-invitation, .invitation-item')
                        );
                        console.log(`✓ Found ${pendingInvitations.length} pending invitations`);
                        
                        // Check for cancel invitation button if there are pending invitations
                        if (pendingInvitations.length > 0) {
                            try {
                                let cancelButtons = await browser.findElements(
                                    By.xpath("//button[contains(text(), 'Cancel')] | //button[contains(@title, 'Cancel')]")
                                );
                                console.log(`✓ Found ${cancelButtons.length} cancel invitation buttons`);
                                
                                // Test cancel functionality on the first invitation (commented out to avoid actual deletion)
                                /*
                                if (cancelButtons.length > 0) {
                                    await cancelButtons[0].click();
                                    console.log('✓ Clicked cancel button for first invitation');
                                    await browser.sleep(2000);
                                    
                                    // Check for confirmation dialog
                                    try {
                                        let confirmButton = await browser.findElement(
                                            By.xpath("//button[contains(text(), 'Confirm')] | //button[contains(text(), 'Yes')]")
                                        );
                                        await confirmButton.click();
                                        console.log('✓ Confirmed cancellation');
                                        await browser.sleep(2000);
                                        
                                        // Check for success toast
                                        try {
                                            let toastMessage = await browser.findElement(
                                                By.css('.Toastify__toast-body, .toast-message')
                                            );
                                            console.log(`✓ Toast message: "${await toastMessage.getText()}"`);
                                        } catch (error) {
                                            // No toast message found
                                        }
                                    } catch (error) {
                                        console.log('✗ No confirmation dialog found');
                                    }
                                }
                                */
                            } catch (error) {
                                console.log('✗ No cancel buttons found for pending invitations');
                            }
                        }
                    } catch (error) {
                        console.log('✗ Error finding pending invitations:', error.message);
                    }
                } else {
                    console.log('✓ No Pending Invitations section found - might not have any pending invites');
                }
            } catch (error) {
                console.log('✗ Error checking pending invitations section:', error.message);
            }
        }
        
        console.log('\nTeam management test completed successfully');

    } catch (err) {
        console.error('Error during Team Management test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();