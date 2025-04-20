var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
var Key = webdriver.Key;
var path = require('path');

(async function testProjectManagement() {
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
        console.log('Login button clicked!');

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

        // TEST CASE 2: Navigate to project management page
        console.log('\nTEST CASE 2: Navigating to project management page');
        
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/edit-project');
        await browser.sleep(3000);
        console.log('✓ Navigated to project edit page');
        
        // Check if project management page is loaded correctly
        try {
            let projectManagementHeader = await browser.wait(
                until.elementLocated(By.xpath("//h1[contains(text(),'Project Management')]")),
                10000
            );
            console.log('✓ Project Management page loaded successfully');
            
            // Test Case 2.1: Check for existing projects
            console.log('\nTEST CASE 2.1: Checking for existing projects');
            
            try {
                let projectCards = await browser.findElements(By.css('.project-card, .project-item, .project-container'));
                let projectCount = projectCards.length;
                
                console.log(`✓ Found ${projectCount} existing projects`);
                
                if (projectCount > 0) {
                    // Record details of first project for later verification
                    let firstProjectTitle = await projectCards[0].findElement(By.css('.project-title, h3, h4')).getText();
                    console.log(`✓ First project title: "${firstProjectTitle}"`);
                    
                    // Check for project status badge
                    try {
                        let statusBadge = await projectCards[0].findElement(By.css('.status-badge, .badge, .status'));
                        let statusText = await statusBadge.getText();
                        console.log(`✓ Project status found: ${statusText}`);
                    } catch (error) {
                        console.log('✗ Project status badge not found');
                    }
                }
            } catch (error) {
                console.log('✗ Error finding project cards:', error.message);
            }
        } catch (error) {
            console.log('✗ Could not find Project Management header');
        }
        
        // TEST CASE 3: Check for Create Project button and test form
        console.log('\nTEST CASE 3: Testing Create Project functionality');
        
        try {
            let createProjectButton = await browser.wait(
                until.elementLocated(By.xpath("//button[contains(text(),'Create Project') or contains(text(),'New Project')]")),
                5000
            );
            console.log('✓ Create Project button found');
            
            // Click on Create Project button to test project creation flow
            await createProjectButton.click();
            console.log('✓ Clicked on Create Project button');
            await browser.sleep(2000);
            
            // TEST CASE 3.1: Verify the project creation form appears
            try {
                // Check for the Rules & Terms section first (should be the first section in the creation flow)
                let rulesTermsHeader = await browser.wait(
                    until.elementLocated(By.xpath("//h2[contains(text(),'Rules & Terms') or contains(text(),'Rules')]")),
                    10000
                );
                
                if (await rulesTermsHeader.isDisplayed()) {
                    console.log('✓ Project creation flow started with Rules & Terms section');
                    
                    // Check for terms checkbox
                    let termsCheckbox = await browser.findElement(By.css('input[type="checkbox"]'));
                    await termsCheckbox.click();
                    console.log('✓ Agreed to terms and conditions');
                    
                    // Click Continue
                    let continueButton = await browser.findElement(By.xpath("//button[contains(text(),'Continue')]"));
                    await continueButton.click();
                    console.log('✓ Continued to Basic Information');
                    await browser.sleep(2000);
                    
                    // TEST CASE 3.2: Test Basic Information form fields
                    console.log('\nTEST CASE 3.2: Testing Basic Information form');
                    
                    // Test project title field
                    let projectTitleField = await browser.wait(
                        until.elementLocated(By.css('input[name="title"]')),
                        10000
                    );
                    
                    if (await projectTitleField.isDisplayed()) {
                        console.log('✓ Basic Information form is displayed');
                        
                        // Generate a unique project title with timestamp
                        const timestamp = new Date().getTime();
                        const projectTitle = `Test Project ${timestamp}`;
                        
                        // Fill in required fields
                        await projectTitleField.sendKeys(projectTitle);
                        console.log(`✓ Entered project title: "${projectTitle}"`);
                        
                        // Test category dropdown
                        let categoryDropdown = await browser.findElement(By.css('select[name="categoryId"]'));
                        await categoryDropdown.click();
                        await browser.sleep(1000);
                        
                        // Select a category (usually the first non-empty option)
                        let categoryOptions = await browser.findElements(By.css('select[name="categoryId"] option'));
                        if (categoryOptions.length > 1) {
                            await categoryOptions[1].click();
                            
                            // Get the selected category name for logging
                            let selectedCategory = await categoryDropdown.getAttribute('value');
                            console.log(`✓ Selected category with ID: ${selectedCategory}`);
                            await browser.sleep(1000);
                            
                            // Test for subcategory checkboxes that should appear after selecting a category
                            try {
                                let subcategoryCheckboxes = await browser.findElements(By.css('input[type="checkbox"][name^="subcat-"]'));
                                if (subcategoryCheckboxes.length > 0) {
                                    await subcategoryCheckboxes[0].click();
                                    
                                    // Get the selected subcategory name for logging
                                    let subcategoryLabel = await browser.findElement(By.xpath(`//label[contains(@for, 'subcat-')]`));
                                    let subcategoryName = await subcategoryLabel.getText();
                                    console.log(`✓ Selected subcategory: ${subcategoryName}`);
                                } else {
                                    console.log('✗ No subcategory checkboxes found after selecting category');
                                }
                            } catch (error) {
                                console.log('✗ Error finding subcategory checkboxes:', error.message);
                            }
                        }
                        
                        // Fill in short description
                        let shortDescriptionField = await browser.findElement(By.css('textarea[name="shortDescription"]'));
                        let projectDescription = `This is a test project created with automated testing on ${new Date().toLocaleDateString()}. It demonstrates Selenium WebDriver capabilities for testing the F-Fund platform.`;
                        await shortDescriptionField.sendKeys(projectDescription);
                        console.log('✓ Entered project description');
                        
                        // Select a location
                        let locationDropdown = await browser.findElement(By.css('select[name="location"]'));
                        await locationDropdown.click();
                        await browser.sleep(1000);
                        
                        let locationOptions = await browser.findElements(By.css('select[name="location"] option'));
                        if (locationOptions.length > 1) {
                            await locationOptions[1].click();
                            
                            // Get the selected location name for logging
                            let selectedLocation = await locationDropdown.getAttribute('value');
                            console.log(`✓ Selected location: ${selectedLocation}`);
                        }
                        
                        // Fill in target amount
                        let targetAmountField = await browser.findElement(By.css('input[name="totalTargetAmount"]'));
                        await targetAmountField.clear();
                        const targetAmount = '5000';
                        await targetAmountField.sendKeys(targetAmount);
                        console.log(`✓ Entered target amount: $${targetAmount}`);
                        
                        // Fill in social media URL (optional)
                        try {
                            let socialMediaField = await browser.findElement(By.css('input[name="mainSocialMediaUrl"]'));
                            await socialMediaField.sendKeys('https://twitter.com/testproject');
                            console.log('✓ Entered social media URL');
                        } catch (error) {
                            console.log('Social media URL field not found or not required');
                        }
                        
                        // Test image upload section (we can't actually upload, but we can check if the element exists)
                        try {
                            let imageUploadSection = await browser.findElement(By.xpath("//label[contains(text(), 'Project Image') or contains(text(), 'Cover Image')]"));
                            console.log('✓ Project image upload section is displayed');
                        } catch (error) {
                            console.log('✗ Project image upload section not found:', error.message);
                        }
                        
                        // Check for validation elements by submitting without all required fields
                        try {
                            // Submit the form to check for validation
                            let nextButton = await browser.findElement(By.xpath("//button[contains(text(),'Next') or contains(text(),'Continue') or contains(text(),'Save')]"));
                            await nextButton.click();
                            console.log('✓ Clicked Next/Continue button');
                            await browser.sleep(2000);
                            
                            // We should move to the next section if validation passed
                            try {
                                // Check for Fundraising Information section
                                let fundraisingHeader = await browser.wait(
                                    until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                                    5000
                                );
                                
                                console.log('✓ Successfully moved to Fundraising Information section');
                                
                                // TEST CASE 3.3: Test Fundraising Information form
                                console.log('\nTEST CASE 3.3: Testing Fundraising Information form');
                                
                                // Set start date
                                try {
                                    let startDateField = await browser.findElement(By.css('input[name="startDate"]'));
                                    
                                    // Calculate a date 2 weeks from now for the start date
                                    let startDate = new Date();
                                    startDate.setDate(startDate.getDate() + 14);
                                    let formattedStartDate = startDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                                    
                                    await startDateField.clear();
                                    await startDateField.sendKeys(formattedStartDate);
                                    console.log(`✓ Set project start date to ${formattedStartDate}`);
                                } catch (error) {
                                    console.log('✗ Error setting start date:', error.message);
                                }
                                
                                // Add a phase
                                try {
                                    let addPhaseButton = await browser.findElement(By.xpath("//button[contains(text(),'Add Phase')]"));
                                    await addPhaseButton.click();
                                    console.log('✓ Clicked Add Phase button');
                                    await browser.sleep(1000);
                                    
                                    // Fill in phase details
                                    let phaseFundingGoalField = await browser.findElement(By.css('input[name="fundingGoal"]'));
                                    await phaseFundingGoalField.clear();
                                    await phaseFundingGoalField.sendKeys('5000');
                                    console.log('✓ Set phase funding goal to $5,000');
                                    
                                    let phaseDurationField = await browser.findElement(By.css('input[name="duration"]'));
                                    await phaseDurationField.clear();
                                    await phaseDurationField.sendKeys('30');
                                    console.log('✓ Set phase duration to 30 days');
                                    
                                    // Save the phase
                                    let savePhaseButton = await browser.findElement(By.xpath("//button[contains(text(),'Save Phase') or contains(text(),'Add')]"));
                                    await savePhaseButton.click();
                                    console.log('✓ Saved phase');
                                    await browser.sleep(2000);
                                    
                                    // Verify the phase was added
                                    let phaseItems = await browser.findElements(By.css('.phase-item, .phase-card'));
                                    if (phaseItems.length > 0) {
                                        console.log(`✓ Phase added successfully, found ${phaseItems.length} phase(s)`);
                                    } else {
                                        console.log('✗ Failed to add phase');
                                    }
                                } catch (error) {
                                    console.log('✗ Error adding phase:', error.message);
                                }
                                
                                // Move to next section
                                try {
                                    let nextButton = await browser.findElement(By.xpath("//button[contains(text(),'Next') or contains(text(),'Continue') or contains(text(),'Save')]"));
                                    await nextButton.click();
                                    console.log('✓ Moving to next section');
                                    await browser.sleep(2000);
                                } catch (error) {
                                    console.log('✗ Error moving to next section:', error.message);
                                }
                                
                                // TEST CASE 3.4: Test Project Story section
                                console.log('\nTEST CASE 3.4: Testing Project Story section');
                                
                                try {
                                    // Check if we're in Project Story section
                                    let projectStoryHeader = await browser.wait(
                                        until.elementLocated(By.xpath("//h2[contains(text(),'Project Story') or contains(text(),'Story')]")),
                                        5000
                                    );
                                    
                                    if (await projectStoryHeader.isDisplayed()) {
                                        console.log('✓ Successfully moved to Project Story section');
                                        
                                        // Find and fill the story editor
                                        try {
                                            // Since this might be a rich text editor, we need to try different approaches
                                            // First try standard textarea
                                            let storyField = await browser.findElement(By.css('textarea[name="story"], div[contenteditable="true"]'));
                                            await storyField.sendKeys('This is a compelling story about our test project. It aims to demonstrate automated testing capabilities.');
                                            console.log('✓ Entered project story');
                                        } catch (error) {
                                            console.log('✗ Could not directly enter project story text:', error.message);
                                            
                                            // Try alternative method for rich text editors
                                            try {
                                                let storyEditorFrame = await browser.findElement(By.css('.ql-editor, .tox-edit-area__iframe'));
                                                await browser.switchTo().frame(storyEditorFrame);
                                                let editorBody = await browser.findElement(By.css('body'));
                                                await editorBody.sendKeys('This is a compelling story about our test project. It aims to demonstrate automated testing capabilities.');
                                                await browser.switchTo().defaultContent();
                                                console.log('✓ Entered project story via rich text editor');
                                            } catch (richTextError) {
                                                console.log('✗ Could not enter project story via rich text editor:', richTextError.message);
                                            }
                                        }
                                        
                                        // Find and fill the risks field
                                        try {
                                            let risksField = await browser.findElement(By.css('textarea[name="risks"], div[contenteditable="true"]'));
                                            await risksField.sendKeys('Potential risks include test failures and unexpected behavior during automation.');
                                            console.log('✓ Entered project risks');
                                        } catch (error) {
                                            console.log('✗ Could not directly enter project risks:', error.message);
                                        }
                                        
                                        // Move to next section
                                        try {
                                            let nextButton = await browser.findElement(By.xpath("//button[contains(text(),'Next') or contains(text(),'Continue') or contains(text(),'Save')]"));
                                            await nextButton.click();
                                            console.log('✓ Moving to next section');
                                            await browser.sleep(2000);
                                        } catch (error) {
                                            console.log('✗ Error moving to next section:', error.message);
                                        }
                                    }
                                } catch (error) {
                                    console.log('✗ Error in Project Story section:', error.message);
                                }
                                
                                // TEST CASE 3.5: Test Founder Profile section
                                console.log('\nTEST CASE 3.5: Testing Founder Profile section');
                                
                                try {
                                    // Check if we're in Founder Profile section
                                    let founderProfileHeader = await browser.wait(
                                        until.elementLocated(By.xpath("//h2[contains(text(),'Founder Profile') or contains(text(),'Founder')]")),
                                        5000
                                    );
                                    
                                    if (await founderProfileHeader.isDisplayed()) {
                                        console.log('✓ Successfully moved to Founder Profile section');
                                        
                                        // Verify founder information is displayed
                                        try {
                                            let founderInfoFields = await browser.findElements(By.css('.founder-info, .profile-info, .team-info'));
                                            let founderInfoCount = founderInfoFields.length;
                                            console.log(`✓ Found ${founderInfoCount} founder information fields`);
                                            
                                            // Get the founder's name for logging
                                            try {
                                                let founderName = await browser.findElement(By.css('.founder-name, .user-name')).getText();
                                                console.log(`✓ Founder name displayed: ${founderName}`);
                                            } catch (error) {
                                                console.log('✗ Could not find founder name display');
                                            }
                                        } catch (error) {
                                            console.log('✗ Error checking founder information fields:', error.message);
                                        }
                                        
                                        // Move to next section
                                        try {
                                            let nextButton = await browser.findElement(By.xpath("//button[contains(text(),'Next') or contains(text(),'Continue') or contains(text(),'Save')]"));
                                            await nextButton.click();
                                            console.log('✓ Moving to next section');
                                            await browser.sleep(2000);
                                        } catch (error) {
                                            console.log('✗ Error moving to next section:', error.message);
                                        }
                                    }
                                } catch (error) {
                                    console.log('✗ Error in Founder Profile section:', error.message);
                                }
                                
                                // TEST CASE 3.6: Test Required Documents section
                                console.log('\nTEST CASE 3.6: Testing Required Documents section');
                                
                                try {
                                    // Check if we're in Required Documents section
                                    let documentsHeader = await browser.wait(
                                        until.elementLocated(By.xpath("//h2[contains(text(),'Required Documents') or contains(text(),'Documents')]")),
                                        5000
                                    );
                                    
                                    if (await documentsHeader.isDisplayed()) {
                                        console.log('✓ Successfully moved to Required Documents section');
                                        
                                        // Verify document upload fields are displayed
                                        try {
                                            let documentUploadFields = await browser.findElements(By.css('input[type="file"]'));
                                            let uploadCount = documentUploadFields.length;
                                            console.log(`✓ Found ${uploadCount} document upload fields`);
                                            
                                            // We can't actually upload files in a headless test, but we can verify the fields exist
                                            // Check for specific document types
                                            try {
                                                let swotAnalysisField = await browser.findElement(By.xpath("//label[contains(text(),'SWOT Analysis')]"));
                                                console.log('✓ SWOT Analysis upload field found');
                                            } catch (error) {
                                                console.log('✗ SWOT Analysis upload field not found');
                                            }
                                            
                                            try {
                                                let businessModelField = await browser.findElement(By.xpath("//label[contains(text(),'Business Model')]"));
                                                console.log('✓ Business Model Canvas upload field found');
                                            } catch (error) {
                                                console.log('✗ Business Model Canvas upload field not found');
                                            }
                                        } catch (error) {
                                            console.log('✗ Error checking document upload fields:', error.message);
                                        }
                                        
                                        // Cancel form to avoid creating incomplete projects
                                        try {
                                            let cancelButton = await browser.findElement(By.xpath("//button[contains(text(),'Cancel')]"));
                                            await cancelButton.click();
                                            console.log('✓ Cancelled project creation form');
                                            await browser.sleep(2000);
                                            
                                            // Confirm cancel if a dialog appears
                                            try {
                                                let confirmCancelButton = await browser.wait(
                                                    until.elementLocated(By.xpath("//button[contains(text(),'Yes') or contains(text(),'Confirm')]")),
                                                    5000
                                                );
                                                await confirmCancelButton.click();
                                                console.log('✓ Confirmed cancellation');
                                                await browser.sleep(2000);
                                            } catch (error) {
                                                // No confirmation dialog appeared
                                            }
                                        } catch (error) {
                                            console.log('✗ Could not find Cancel button, trying to navigate away');
                                            await browser.get('https://deploy-f-fund-b4n2.vercel.app/edit-project');
                                        }
                                    }
                                } catch (error) {
                                    console.log('✗ Error in Required Documents section:', error.message);
                                }
                            } catch (error) {
                                console.log('✗ Did not progress to Fundraising Information, checking for validation errors');
                                
                                // Check for validation error messages
                                try {
                                    let errorMessages = await browser.findElements(By.css('.error-message, .text-red-500, .invalid-feedback'));
                                    if (errorMessages.length > 0) {
                                        for (let i = 0; i < errorMessages.length; i++) {
                                            let errorText = await errorMessages[i].getText();
                                            console.log(`✓ Validation error found: "${errorText}"`);
                                        }
                                    } else {
                                        console.log('✗ No validation error messages found, but did not progress to next section');
                                    }
                                } catch (validationError) {
                                    console.log('✗ Error finding validation messages:', validationError.message);
                                }
                                
                                // Cancel form
                                try {
                                    let cancelButton = await browser.findElement(By.xpath("//button[contains(text(),'Cancel')]"));
                                    await cancelButton.click();
                                    console.log('✓ Cancelled project creation form');
                                    await browser.sleep(2000);
                                    
                                    // Confirm cancel if a dialog appears
                                    try {
                                        let confirmCancelButton = await browser.wait(
                                            until.elementLocated(By.xpath("//button[contains(text(),'Yes') or contains(text(),'Confirm')]")),
                                            5000
                                        );
                                        await confirmCancelButton.click();
                                        console.log('✓ Confirmed cancellation');
                                        await browser.sleep(2000);
                                    } catch (error) {
                                        // No confirmation dialog appeared
                                    }
                                } catch (error) {
                                    console.log('✗ Could not find Cancel button, trying to navigate away');
                                    await browser.get('https://deploy-f-fund-b4n2.vercel.app/edit-project');
                                }
                            }
                        } catch (error) {
                            console.log('✗ Error when testing form submission:', error.message);
                        }
                    } else {
                        console.log('✗ Basic Information form not displayed');
                    }
                } else {
                    console.log('✗ Rules & Terms section not displayed');
                }
            } catch (error) {
                console.log('✗ Error in project creation flow:', error.message);
            }
        } catch (error) {
            console.log('✗ Create Project button not found or not clickable');
        }
        
        // TEST CASE 4: Check existing project details
        console.log('\nTEST CASE 4: Checking existing project details');
        
        // Ensure we're on the project management page
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/edit-project');
        await browser.sleep(3000);
        
        try {
            let projectCards = await browser.findElements(By.css('.project-card, .project-item, .project-container'));
            let projectCount = projectCards.length;
            
            if (projectCount > 0) {
                console.log(`✓ Found ${projectCount} projects`);
                
                // Click on the first project to view details
                await projectCards[0].click();
                console.log('✓ Clicked on first project to view details');
                await browser.sleep(3000);
                
                // TEST CASE 4.1: Check project details page
                try {
                    // Check if project details page loaded
                    let projectTitle = await browser.wait(
                        until.elementLocated(By.css('.project-title, h1, .project-name')),
                        10000
                    );
                    let titleText = await projectTitle.getText();
                    console.log(`✓ Project details page loaded for: "${titleText}"`);
                    
                    // Check for tabs/sections in project details
                    try {
                        let detailsTabs = await browser.findElements(By.css('.nav-tabs a, .tab-item, .nav-link'));
                        let tabCount = detailsTabs.length;
                        console.log(`✓ Found ${tabCount} tabs in project details`);
                        
                        // Check for specific tabs
                        let tabNames = [];
                        for (let i = 0; i < tabCount; i++) {
                            let tabName = await detailsTabs[i].getText();
                            tabNames.push(tabName);
                        }
                        console.log(`✓ Available tabs: ${tabNames.join(', ')}`);
                        
                        // Click on each tab to verify content
                        if (tabCount > 0) {
                            for (let i = 0; i < tabCount; i++) {
                                let tabName = await detailsTabs[i].getText();
                                await detailsTabs[i].click();
                                console.log(`✓ Clicked on "${tabName}" tab`);
                                await browser.sleep(1000);
                                
                                // Verify content based on tab name
                                if (tabName.includes('Overview') || tabName.includes('Details')) {
                                    try {
                                        let descriptionSection = await browser.findElement(By.css('.project-description, .description'));
                                        console.log(`✓ Found description section in ${tabName} tab`);
                                    } catch (error) {
                                        console.log(`✗ Description section not found in ${tabName} tab`);
                                    }
                                } else if (tabName.includes('Phase') || tabName.includes('Funding')) {
                                    try {
                                        let phaseItems = await browser.findElements(By.css('.phase-item, .phase-card, .funding-phase'));
                                        console.log(`✓ Found ${phaseItems.length} phases in ${tabName} tab`);
                                    } catch (error) {
                                        console.log(`✗ Phase items not found in ${tabName} tab`);
                                    }
                                } else if (tabName.includes('Document') || tabName.includes('Files')) {
                                    try {
                                        let documentItems = await browser.findElements(By.css('.document-item, .file-item, .document-link'));
                                        console.log(`✓ Found ${documentItems.length} documents in ${tabName} tab`);
                                    } catch (error) {
                                        console.log(`✗ Document items not found in ${tabName} tab`);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.log('✗ Error checking project details tabs:', error.message);
                    }
                    
                    // TEST CASE 4.2: Check Edit functionality if available
                    console.log('\nTEST CASE 4.2: Checking Edit Project functionality');
                    
                    try {
                        let editButton = await browser.findElement(By.xpath("//button[contains(text(),'Edit') or contains(text(),'Modify')]"));
                        console.log('✓ Edit button found');
                        
                        // Click edit button to verify edit form
                        await editButton.click();
                        console.log('✓ Clicked Edit button');
                        await browser.sleep(3000);
                        
                        // Check if edit form loaded
                        try {
                            let editFormTitle = await browser.wait(
                                until.elementLocated(By.xpath("//h1[contains(text(),'Edit Project') or contains(text(),'Update Project')]")),
                                10000
                            );
                            console.log('✓ Edit Project form loaded successfully');
                            
                            // Verify basic edit fields
                            try {
                                let titleField = await browser.findElement(By.css('input[name="title"]'));
                                let currentTitle = await titleField.getAttribute('value');
                                console.log(`✓ Project title field found with value: "${currentTitle}"`);
                            } catch (error) {
                                console.log('✗ Could not find project title field in edit form');
                            }
                            
                            // Cancel edit to avoid modifying existing projects
                            try {
                                let cancelButton = await browser.findElement(By.xpath("//button[contains(text(),'Cancel')]"));
                                await cancelButton.click();
                                console.log('✓ Cancelled edit form');
                                await browser.sleep(2000);
                                
                                // Confirm cancel if a dialog appears
                                try {
                                    let confirmCancelButton = await browser.wait(
                                        until.elementLocated(By.xpath("//button[contains(text(),'Yes') or contains(text(),'Confirm')]")),
                                        5000
                                    );
                                    await confirmCancelButton.click();
                                    console.log('✓ Confirmed cancellation');
                                    await browser.sleep(2000);
                                } catch (error) {
                                    // No confirmation dialog appeared
                                }
                            } catch (error) {
                                console.log('✗ Could not find Cancel button, trying to navigate away');
                                await browser.get('https://deploy-f-fund-b4n2.vercel.app/edit-project');
                            }
                        } catch (error) {
                            console.log('✗ Edit Project form not loaded:', error.message);
                        }
                    } catch (error) {
                        console.log('✗ Edit button not found:', error.message);
                    }
                } catch (error) {
                    console.log('✗ Error checking project details:', error.message);
                }
            } else {
                console.log('✗ No projects found to check details');
            }
        } catch (error) {
            console.log('✗ Error finding project cards:', error.message);
        }
        
        console.log('\nProject Management test completed successfully');

    } catch (err) {
        console.error('Error during Project Management test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();