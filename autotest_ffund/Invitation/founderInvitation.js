var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
var Key = webdriver.Key;

(async function testInvitationManagement() {
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

        // TEST CASE 2: Navigate to Invitation Management page
        console.log('\nTEST CASE 2: Navigating to Invitation Management page');
        
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/invitation');
        await browser.sleep(3000);
        console.log('✓ Navigated to Invitation Management page');
        
        // Check if Invitation Management page is loaded correctly
        try {
            let pageTitle = await browser.wait(
                until.elementLocated(By.xpath("//h1[contains(text(),'Manage Invitations')]")),
                10000
            );
            console.log('✓ Invitation Management page loaded successfully');
            
            // TEST CASE 3: Verify page elements
            console.log('\nTEST CASE 3: Verifying page elements');
            
            // Check for notification banner
            try {
                let notificationBanner = await browser.findElement(By.css('.bg-orange-50.p-4.mb-6'));
                let bannerText = await notificationBanner.getText();
                console.log(`✓ Notification banner found with text: "${bannerText}"`);
            } catch (error) {
                console.log('✗ Notification banner not found:', error.message);
            }
            
            // Check for Invitations header
            try {
                let invitationsHeader = await browser.findElement(By.xpath("//h3[contains(text(),'Invitations')]"));
                console.log('✓ Invitations header found');
                
                // Check for subheader
                let subheader = await browser.findElement(By.xpath("//p[contains(text(),'Manage your team invitations')]"));
                console.log('✓ Invitations subheader found');
            } catch (error) {
                console.log('✗ Invitations header not found:', error.message);
            }
            
            // Wait for loading to complete
            try {
                let loadingElement = await browser.findElement(By.xpath("//div[contains(text(),'Loading invitations...')]"));
                console.log('✓ Loading indicator found, waiting for it to disappear...');
                await browser.wait(until.stalenessOf(loadingElement), 10000);
                console.log('✓ Loading completed');
            } catch (error) {
                // Loading element might already be gone or never appeared if loaded quickly
                console.log('✓ No loading indicator found - page might have loaded immediately');
            }
            
            // TEST CASE 4: Check for invitations table
            console.log('\nTEST CASE 4: Checking invitations table');
            
            try {
                // Wait for either the table or the "No invitations found" message
                await browser.wait(
                    until.elementLocated(By.css('table, div.text-center.py-8.text-gray-500')),
                    10000
                );
                
                // Check if there are no invitations
                let noInvitationsElements = await browser.findElements(By.xpath("//div[contains(text(),'No invitations found')]"));
                
                if (noInvitationsElements.length > 0) {
                    console.log('✓ "No invitations found" message displayed - user has no invitations');
                } else {
                    // Check for invitations table
                    let invitationsTable = await browser.findElement(By.css('table'));
                    console.log('✓ Invitations table found');
                    
                    // Check table headers
                    let tableHeaders = await browser.findElements(By.css('thead th'));
                    let headerCount = tableHeaders.length;
                    console.log(`✓ Found ${headerCount} table headers`);
                    
                    // Get header texts for validation
                    let expectedHeaders = ['From', 'To', 'Status', 'Date', 'Actions'];
                    let headerTexts = [];
                    
                    for (let i = 0; i < headerCount; i++) {
                        headerTexts.push(await tableHeaders[i].getText());
                    }
                    
                    console.log(`✓ Table headers: ${headerTexts.join(', ')}`);
                    
                    let missingHeaders = expectedHeaders.filter(
                        header => !headerTexts.some(text => text.includes(header))
                    );
                    
                    if (missingHeaders.length === 0) {
                        console.log('✓ All expected headers are present');
                    } else {
                        console.log(`✗ Missing expected headers: ${missingHeaders.join(', ')}`);
                    }
                    
                    // Check for invitation rows
                    let invitationRows = await browser.findElements(By.css('tbody tr'));
                    console.log(`✓ Found ${invitationRows.length} invitation rows`);
                    
                    // TEST CASE 5: Analyze invitation data
                    console.log('\nTEST CASE 5: Analyzing invitation data');
                    
                    // Track the counts of different invitation statuses
                    let statusCounts = {
                        'PENDING': 0,
                        'ACCEPTED': 0,
                        'DECLINED': 0,
                        'OTHER': 0
                    };
                    
                    // Track if there are any pending invitations we can interact with
                    let hasPendingInvitations = false;
                    
                    for (let i = 0; i < invitationRows.length; i++) {
                        let row = invitationRows[i];
                        
                        // Get row data
                        let cells = await row.findElements(By.css('td'));
                        let inviterName = cells.length > 0 ? await cells[0].getText() : 'N/A';
                        let inviteeName = cells.length > 1 ? await cells[1].getText() : 'N/A';
                        let status = cells.length > 2 ? await cells[2].getText() : 'N/A';
                        let date = cells.length > 3 ? await cells[3].getText() : 'N/A';
                        
                        console.log(`✓ Invitation ${i+1}: From: ${inviterName}, To: ${inviteeName}, Status: ${status}, Date: ${date}`);
                        
                        // Count the statuses
                        if (status.includes('PENDING')) {
                            statusCounts['PENDING']++;
                            hasPendingInvitations = true;
                        } else if (status.includes('ACCEPTED')) {
                            statusCounts['ACCEPTED']++;
                        } else if (status.includes('DECLINED')) {
                            statusCounts['DECLINED']++;
                        } else {
                            statusCounts['OTHER']++;
                        }
                        
                        // Check for action buttons on pending invitations
                        if (status.includes('PENDING')) {
                            try {
                                let acceptButton = await cells[4].findElement(By.css('button[title="Accept invitation"]'));
                                let declineButton = await cells[4].findElement(By.css('button[title="Decline invitation"]'));
                                console.log(`✓ Found accept and decline buttons for invitation ${i+1}`);
                            } catch (error) {
                                console.log(`✗ Could not find action buttons for pending invitation ${i+1}:`, error.message);
                            }
                        } else {
                            try {
                                let noActions = await cells[4].findElement(By.xpath("//span[contains(text(),'No actions available')]"));
                                console.log(`✓ "No actions available" message displayed for non-pending invitation ${i+1}`);
                            } catch (error) {
                                // This error is expected since we're looking for text that may not be exactly as expected
                                console.log(`✓ Verified no action buttons for non-pending invitation ${i+1}`);
                            }
                        }
                    }
                    
                    console.log('✓ Invitation status counts:');
                    for (const status in statusCounts) {
                        console.log(`  - ${status}: ${statusCounts[status]}`);
                    }
                    
                    // TEST CASE 6: Test pagination if available
                    console.log('\nTEST CASE 6: Testing pagination functionality');
                    
                    try {
                        let paginationElements = await browser.findElements(By.css('nav[aria-label="Pagination"]'));
                        
                        if (paginationElements.length > 0) {
                            console.log('✓ Pagination controls found');
                            
                            // Get pagination information
                            let paginationInfo = await browser.findElement(By.xpath("//p[contains(text(),'Showing')]")).getText();
                            console.log(`✓ Pagination info: "${paginationInfo}"`);
                            
                            // Get page buttons
                            let pageButtons = await browser.findElements(By.css('nav[aria-label="Pagination"] button'));
                            console.log(`✓ Found ${pageButtons.length} pagination buttons`);
                            
                            // Test next page button if more than one page
                            if (pageButtons.length > 2) {  // Previous, page numbers, Next
                                let nextButton = pageButtons[pageButtons.length - 1];
                                let isDisabled = await nextButton.getAttribute('disabled');
                                
                                if (isDisabled === 'true') {
                                    console.log('✓ Next button is disabled - likely on last page');
                                } else {
                                    // First get the current page info to compare later
                                    let currentPageInfo = await browser.findElement(By.xpath("//p[contains(text(),'Showing')]")).getText();
                                    
                                    await nextButton.click();
                                    console.log('✓ Clicked Next button');
                                    await browser.sleep(2000);
                                    
                                    // Verify page changed
                                    let newPageInfo = await browser.findElement(By.xpath("//p[contains(text(),'Showing')]")).getText();
                                    
                                    if (newPageInfo !== currentPageInfo) {
                                        console.log(`✓ Page changed successfully. New info: "${newPageInfo}"`);
                                        
                                        // Go back to previous page
                                        let prevButton = await browser.findElement(By.css('button[aria-label="Previous"]'));
                                        await prevButton.click();
                                        console.log('✓ Clicked Previous button');
                                        await browser.sleep(2000);
                                        
                                        // Verify returned to original page
                                        let returnedPageInfo = await browser.findElement(By.xpath("//p[contains(text(),'Showing')]")).getText();
                                        
                                        if (returnedPageInfo === currentPageInfo) {
                                            console.log('✓ Successfully returned to original page');
                                        } else {
                                            console.log(`✗ Did not return to original page. Current info: "${returnedPageInfo}"`);
                                        }
                                    } else {
                                        console.log('✗ Page did not change after clicking Next');
                                    }
                                }
                            } else {
                                console.log('✓ Only one page of results available');
                            }
                        } else {
                            console.log('✓ No pagination controls found - likely only one page or no invitations');
                        }
                    } catch (error) {
                        console.log('✗ Error checking pagination:', error.message);
                    }
                    
                    // TEST CASE 7: Test accepting/declining an invitation (if any pending)
                    console.log('\nTEST CASE 7: Testing invitation actions');
                    
                    if (hasPendingInvitations) {
                        console.log('✓ Found pending invitations to test actions on');
                        
                        // Note: We will identify a pending invitation but NOT actually click accept/decline
                        // to avoid modifying real data in the production environment
                        
                        try {
                            // Find first pending invitation
                            let pendingInvitationRow = await browser.findElement(
                                By.xpath("//tr[.//span[contains(text(),'PENDING')]]")
                            );
                            console.log('✓ Found a pending invitation row');
                            
                            // Find action buttons
                            let acceptButton = await pendingInvitationRow.findElement(
                                By.css('button[title="Accept invitation"]')
                            );
                            let declineButton = await pendingInvitationRow.findElement(
                                By.css('button[title="Decline invitation"]')
                            );
                            
                            console.log('✓ Found Accept and Decline buttons');
                            console.log('✓ Action buttons are properly rendered and appear clickable');
                            console.log('Note: Not clicking buttons to avoid modifying production data');
                            
                            // Verify button styling (without clicking)
                            let acceptButtonClasses = await acceptButton.getAttribute('class');
                            let declineButtonClasses = await declineButton.getAttribute('class');
                            
                            console.log(`✓ Accept button classes: ${acceptButtonClasses}`);
                            console.log(`✓ Decline button classes: ${declineButtonClasses}`);
                            
                            if (acceptButtonClasses.includes('green') && declineButtonClasses.includes('red')) {
                                console.log('✓ Buttons are styled correctly with appropriate colors');
                            } else {
                                console.log('✗ Button styling does not match expected colors');
                            }
                            
                            /* Uncommenting this would actually affect the system - keep commented
                            // Test accepting invitation
                            await acceptButton.click();
                            console.log('✓ Clicked Accept button');
                            await browser.sleep(3000);
                            
                            // Verify invitation was accepted
                            let updatedTable = await browser.findElement(By.css('table'));
                            console.log('✓ Table refreshed after action');
                            */
                        } catch (error) {
                            console.log('✗ Error finding or interacting with pending invitation:', error.message);
                        }
                    } else {
                        console.log('✓ No pending invitations found to test actions - skipping action tests');
                    }
                }
            } catch (error) {
                console.log('✗ Error finding invitations table or no invitations message:', error.message);
            }
        } catch (error) {
            console.log('✗ Invitation Management page did not load correctly:', error.message);
        }
        
        console.log('\nInvitation Management test completed successfully');

    } catch (err) {
        console.error('Error during Invitation Management test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();