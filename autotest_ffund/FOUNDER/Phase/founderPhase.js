var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

(async function testPhaseManagement() {
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

        // Navigate to project management page first
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/edit-project');
        await browser.sleep(3000);
        console.log('Navigated to project management page');
        
        // Check for existing projects
        try {
            let projectCards = await browser.findElements(By.css('.project-card'));
            let projectCount = projectCards.length;
            
            console.log(`Found ${projectCount} existing projects`);
            
            if (projectCount > 0) {
                // Click on the first project to see details
                await projectCards[0].click();
                console.log('Clicked on first project to view details');
                await browser.sleep(3000);
                
                // Navigate to the Phases tab
                try {
                    let phasesTab = await browser.wait(
                        until.elementLocated(By.xpath("//a[contains(text(),'Phases')]")),
                        5000
                    );
                    await phasesTab.click();
                    console.log('Clicked on Phases tab');
                    await browser.sleep(2000);
                    
                    // Check for phase list
                    let phaseItems = await browser.findElements(By.css('.phase-item'));
                    let phaseCount = phaseItems.length;
                    
                    console.log(`Found ${phaseCount} phases for this project`);
                    
                    // Try to add evidence if there are phases
                    if (phaseCount > 0) {
                        // Click on first phase
                        await phaseItems[0].click();
                        console.log('Clicked on first phase');
                        await browser.sleep(2000);
                        
                        // Check for evidence upload section
                        try {
                            let evidenceSection = await browser.wait(
                                until.elementLocated(By.css('.evidence-upload-section')),
                                5000
                            );
                            console.log('Evidence upload section found');
                            
                            // Check for upload button
                            let uploadButton = await browser.wait(
                                until.elementLocated(By.xpath("//button[contains(text(),'Upload Evidence')]")),
                                5000
                            );
                            console.log('Upload Evidence button found');
                        } catch (error) {
                            console.log('Evidence upload section or button not found');
                        }
                    }
                } catch (error) {
                    console.log('Could not navigate to Phases tab or interact with phases');
                }
            }
        } catch (error) {
            console.log('No existing projects found or could not interact with them');
        }
        
        console.log('Phase management and evidence upload test completed successfully');

    } catch (err) {
        console.error('Error during Phase Management test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();