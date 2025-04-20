var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
var Key = webdriver.Key;

(async function testFounderProfile() {
    let browser = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .build();

    try {
        // Login as founder first
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
        console.log('Email entered successfully!');

        let passwordField = await browser.wait(
            until.elementLocated(By.css('#password')),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys('123456');
        console.log('Password entered successfully!');

        await browser.sleep(1000);
        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("//button[normalize-space()='Sign in']")),
            10000
        );
        await submitButton.click();
        console.log('Submit button clicked!');
        
        await browser.sleep(5000);

        // Verify login as Founder
        let role = await browser.executeScript("return localStorage.getItem('role');");
        if (role === 'FOUNDER') {
            console.log('Successfully logged in as FOUNDER!');
        } else {
            console.log(`Login failed or wrong account type: ${role}`);
            return;
        }

        // Navigate to profile page
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/profile');
        await browser.sleep(3000);
        console.log('Navigated to profile page');
        
        // TEST CASE 1: Check if basic profile info is loaded
        console.log('TEST CASE 1: Verifying Basic Profile Information section');
        
        try {
            let basicProfileTitle = await browser.wait(
                until.elementLocated(By.xpath("//h4[contains(text(),'Edit Profile Information')]")),
                10000
            );
            
            if (await basicProfileTitle.isDisplayed()) {
                console.log('✓ Basic profile information section is displayed');
                
                // Check for profile edit form elements
                let fullNameField = await browser.findElement(By.css('input[name="fullName"]'));
                let emailField = await browser.findElement(By.css('input[name="email"]'));
                let phoneField = await browser.findElement(By.css('input[name="telephoneNumber"]'));
                let saveButton = await browser.findElement(By.xpath("//button[contains(text(),'Save Changes')]"));
                
                console.log('✓ Basic profile form elements are displayed');
                
                // Test Case 1.1: Edit basic profile information
                console.log('TEST CASE 1.1: Testing profile information update');
                
                let currentName = await fullNameField.getAttribute('value');
                console.log(`Current name: ${currentName}`);
                
                // Clear and enter new name
                await fullNameField.click();
                await fullNameField.clear();
                let testName = `Test User ${new Date().getTime()}`;
                await fullNameField.sendKeys(testName);
                console.log(`Entered new name: ${testName}`);
                
                // Get current phone
                let currentPhone = await phoneField.getAttribute('value');
                console.log(`Current phone: ${currentPhone}`);
                
                // Clear and enter new phone
                await phoneField.click();
                await phoneField.clear();
                let testPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
                await phoneField.sendKeys(testPhone);
                console.log(`Entered new phone: ${testPhone}`);
                
                // Submit form
                await saveButton.click();
                console.log('Save Changes button clicked');
                await browser.sleep(3000);
                
                // Verify success message appears
                try {
                    let toastMessage = await browser.wait(
                        until.elementLocated(By.className('Toastify__toast-body')),
                        5000
                    );
                    let messageText = await toastMessage.getText();
                    console.log(`Toast message: ${messageText}`);
                    
                    if (messageText.includes('successfully')) {
                        console.log('✓ Profile update successful');
                    } else {
                        console.log('✗ Profile update may have failed based on toast message');
                    }
                } catch (err) {
                    console.log('✗ No toast message found after profile update');
                }
                
                // Test Case 1.2: Test Avatar Selection UI Elements
                console.log('TEST CASE 1.2: Testing avatar UI elements');
                
                try {
                    let selectAvatarButton = await browser.findElement(By.xpath("//label[contains(text(),'Select New Avatar')]"));
                    console.log('✓ Select New Avatar button found');
                    
                    // We can't fully test file upload due to browser security restrictions
                    // but we can verify the element is present and clickable
                    await selectAvatarButton.click();
                    console.log('✓ Select New Avatar button is clickable');
                    await browser.sleep(1000);
                    
                    // Click somewhere else to close any open dialogs
                    await browser.findElement(By.tagName('body')).click();
                } catch (err) {
                    console.log('✗ Avatar upload elements not found or not working:', err.message);
                }
                
            } else {
                console.log('✗ Basic profile information section is not displayed');
            }
        } catch (error) {
            console.error('✗ Error in TEST CASE 1:', error.message);
        }
        
        // TEST CASE 2: Navigate to Extended Profile tab and verify content
        console.log('\nTEST CASE 2: Testing Additional Information tab');
        
        try {
            let extendedTab = await browser.wait(
                until.elementLocated(By.xpath("//a[contains(text(),'Additional Information')]")),
                10000
            );
            
            console.log('✓ Additional Information tab found');
            await extendedTab.click();
            console.log('✓ Clicked on Additional Information tab');
            await browser.sleep(3000);
            
            // TEST CASE 2.1: Verify founder information section is visible
            console.log('TEST CASE 2.1: Verifying Founder Information section');
            let founderInfoTitle = await browser.wait(
                until.elementLocated(By.xpath("//h4[contains(text(),'Founder Information')]")),
                10000
            );
            
            if (await founderInfoTitle.isDisplayed()) {
                console.log('✓ Founder Information section is displayed');
                
                // Check for founder information fields
                let studentCodeField = await browser.findElement(By.css('input[name="studentCode"]'));
                let exeClassField = await browser.findElement(By.xpath("//form[@class='mb-3']//input[@value='EXE101' or @value='EXE201' or @value='EXE301' or @value='EXE401']"));
                let facilityField = await browser.findElement(By.xpath("//input[contains(@value, 'CAN_THO') or contains(@value, 'HO_CHI_MINH') or contains(@value, 'HA_NOI') or contains(@value, 'DA_NANG') or contains(@value, 'QUY_NHON')]"));
                
                // Read values for verification
                let studentCode = await studentCodeField.getAttribute('value');
                let exeClass = await exeClassField.getAttribute('value');
                let facility = await facilityField.getAttribute('value');
                
                console.log(`✓ Student Code: ${studentCode}`);
                console.log(`✓ EXE Class: ${exeClass}`);
                console.log(`✓ Facility: ${facility}`);
                
                // Verify fields are read-only as expected
                let isReadOnly = await studentCodeField.getAttribute('readOnly');
                if (isReadOnly) {
                    console.log('✓ Founder information fields are correctly set to read-only');
                } else {
                    console.log('✗ Expected founder information fields to be read-only');
                }
                
            } else {
                console.log('✗ Founder Information section is not displayed');
            }
            
            // TEST CASE 2.2: Verify portfolio section is visible
            console.log('\nTEST CASE 2.2: Testing Student Portfolio section');
            let portfolioTitle = await browser.wait(
                until.elementLocated(By.xpath("//h4[contains(text(),'Student Portfolio')]")),
                10000
            );
            
            if (await portfolioTitle.isDisplayed()) {
                console.log('✓ Student Portfolio section is displayed');
                
                // Check portfolio file upload elements
                let fileUploadInput = await browser.findElement(By.css('input[type="file"][accept=".pdf"]'));
                console.log('✓ Portfolio file upload element found');
                
                // Check if current portfolio exists
                try {
                    let viewPortfolioButton = await browser.findElement(By.xpath("//button[contains(text(),'View Portfolio')]"));
                    let downloadPortfolioButton = await browser.findElement(By.xpath("//a[contains(text(),'Download Portfolio')]"));
                    
                    console.log('✓ Existing portfolio found with view and download options');
                    
                    // Test portfolio viewer modal
                    await viewPortfolioButton.click();
                    console.log('Clicked View Portfolio button');
                    await browser.sleep(2000);
                    
                    try {
                        let portfolioModal = await browser.findElement(By.xpath("//div[@role='dialog']//div[contains(@class,'modal-content')]"));
                        let portfolioIframe = await browser.findElement(By.xpath("//iframe[@title='Student Portfolio']"));
                        
                        console.log('✓ Portfolio viewer modal opened successfully with iframe');
                        
                        // Close modal
                        let closeButton = await browser.findElement(By.xpath("//button[contains(text(),'Close')]"));
                        await closeButton.click();
                        console.log('Closed portfolio viewer modal');
                        await browser.sleep(1000);
                    } catch (err) {
                        console.log('✗ Portfolio viewer modal not opened or missing elements');
                    }
                    
                } catch (err) {
                    console.log('No existing portfolio found, which is acceptable for new users');
                }
                
                // We won't actually upload a file in the test to avoid creating test data
                console.log('✓ Portfolio upload elements verified (skipping actual upload)');
                
            } else {
                console.log('✗ Student Portfolio section is not displayed');
            }
            
        } catch (error) {
            console.error('✗ Error in TEST CASE 2:', error.message);
        }
        
        // TEST CASE 3: Return to Basic Information tab to verify tab navigation
        console.log('\nTEST CASE 3: Testing tab navigation back to Basic Information');
        
        try {
            let basicTab = await browser.wait(
                until.elementLocated(By.xpath("//a[contains(text(),'Basic Information')]")),
                10000
            );
            
            await basicTab.click();
            console.log('Clicked on Basic Information tab');
            await browser.sleep(2000);
            
            // Verify we're back on the basic tab
            let basicProfileTitle = await browser.wait(
                until.elementLocated(By.xpath("//h4[contains(text(),'Edit Profile Information')]")),
                10000
            );
            
            if (await basicProfileTitle.isDisplayed()) {
                console.log('✓ Successfully navigated back to Basic Information tab');
            } else {
                console.log('✗ Failed to navigate back to Basic Information tab');
            }
            
        } catch (error) {
            console.error('✗ Error in TEST CASE 3:', error.message);
        }
        
        console.log('\nFounder profile test completed successfully');

    } catch (err) {
        console.error('Error during Founder profile test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();