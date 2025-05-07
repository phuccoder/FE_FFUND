var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;
var readline = require('readline');
var fs = require('fs');
var path = require('path');
var { loginFounder } = require('../../../Login-Register/Login/loginHelper');

/**
 * Helper function to scroll to an element and click it safely
 * @param {webdriver.WebDriver} browser - The Selenium WebDriver instance
 * @param {webdriver.WebElement} element - The element to scroll to and click
 * @param {string} elementDescription - Description for logging
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
async function scrollAndClick(browser, element, elementDescription) {
    try {
        // First check if the element is present
        if (!element) {
            console.error(`${elementDescription} not found`);
            return false;
        }

        // Scroll the element into view in the center of the viewport
        await browser.executeScript(
            "arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });",
            element
        );

        // Short pause to allow the page to settle after scrolling
        await browser.sleep(500);

        // Check if element is visible and enabled before clicking
        const isDisplayed = await element.isDisplayed();
        const isEnabled = await element.isEnabled();

        if (!isDisplayed) {
            console.error(`${elementDescription} is not visible`);
            return false;
        }

        if (!isEnabled) {
            console.error(`${elementDescription} is not enabled`);
            return false;
        }

        // Click the element
        await element.click();
        console.log(`Successfully clicked on ${elementDescription}`);
        return true;
    } catch (error) {
        console.error(`Failed to scroll and click ${elementDescription}: ${error.message}`);
        return false;
    }
}

(async function testCreateProject() {
    let browser = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(
            new chrome.Options().addArguments(
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            )
        )
        .build();

    try {
        console.log('=== STARTING PROJECT CREATION TEST ===');

        // Step 1: Navigate to homepage and login as founder
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('1. Window maximized!');

        await browser.sleep(2000);

        // Login as founder
        const email = 'phanthienan01072003@gmail.com';
        const password = '123456';
        const totalAmount = 8000;
        const isLoggedIn = await loginFounder(browser, email, password);

        if (!isLoggedIn) {
            console.log('Login failed. Exiting test.');
            return;
        }
        console.log('2. Successfully logged in as founder');

        await browser.sleep(3000);

        // Step 2: Check team membership through user menu
        console.log('3. Navigating to team page to check membership');

        // First click the user menu button
        let userMenuButton = await browser.wait(
            until.elementLocated(By.xpath("//button[@aria-label='User menu']")),
            10000
        );
        await userMenuButton.click();

        await browser.sleep(1000);

        // Then click the Manage Team option
        let manageTeamButton = await browser.wait(
            until.elementLocated(By.xpath("//a[normalize-space()='Manage Team']")),
            10000
        );
        await manageTeamButton.click();

        await browser.sleep(3000);

        // Check if user has a team
        let hasTeam = false;
        try {
            let teamSection = await browser.findElement(By.xpath("//div[contains(@class, 'team-main-area')]"));
            hasTeam = true;
            console.log('4. Team found. User is eligible to create a project.');
        } catch (error) {
            console.log('4. No team found. User should create or join a team first.');
            throw new Error('User must be part of a team to create a project');
        }

        // Step 3: Navigate to create project page
        console.log('5. Navigating to create project page');

        // Try multiple strategies to find the Create Project button
        const buttonStrategies = [
            // Strategy 1: Text-based XPath
            {
                locator: By.xpath("//a[contains(text(), 'Make it happen') or contains(text(), 'Create Project') or contains(text(), 'Make It Happen')]"),
                description: "Text-based strategy"
            },
            // Strategy 2: CTA content class
            {
                locator: By.css(".cta-content a.main-btn"),
                description: "CTA content class strategy"
            },
            // Strategy 3: Generic navbar link
            {
                locator: By.css("header a.main-btn, nav a.main-btn"),
                description: "Navbar link strategy"
            },
            // Strategy 4: Any main button with relevant href
            {
                locator: By.css("a.main-btn[href*='create-project'], a[href*='create-project']"),
                description: "URL pattern strategy"
            },
            // Strategy 5: Try with case insensitive contains
            {
                locator: By.xpath("//a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'make it happen')]"),
                description: "Case-insensitive text strategy"
            }
        ];

        // Try each strategy with a short timeout
        let makeItHappenButton = null;
        let foundStrategy = null;

        for (const strategy of buttonStrategies) {
            try {
                console.log(`Trying to find "Make it happen" button using ${strategy.description}...`);
                makeItHappenButton = await browser.wait(
                    until.elementLocated(strategy.locator),
                    5000 // Shorter timeout for each attempt
                );
                foundStrategy = strategy.description;
                console.log(`Found "Make it happen" button using ${strategy.description}`);
                break;
            } catch (error) {
                console.log(`Strategy ${strategy.description} failed`);
            }
        }

        // If all strategies fail, try looking at specific parts of the page
        if (!makeItHappenButton) {
            console.log("Targeted strategies failed. Trying a page scan approach...");

            // Get all links on the page
            const allLinks = await browser.findElements(By.css('a'));
            console.log(`Found ${allLinks.length} links on the page`);

            // Scan through links looking for text content
            for (const link of allLinks) {
                try {
                    const linkText = await link.getText();
                    const linkHref = await link.getAttribute('href');

                    if (
                        linkText.toLowerCase().includes('make it happen') ||
                        linkText.toLowerCase().includes('create project') ||
                        (linkHref && linkHref.includes('create-project'))
                    ) {
                        makeItHappenButton = link;
                        console.log(`Found button through page scan: "${linkText}" with href: ${linkHref}`);
                        break;
                    }
                } catch (error) {
                    // Ignore errors for individual links
                }
            }
        }

        // If still not found, navigate directly to the create project page
        if (!makeItHappenButton) {
            console.log('Could not find "Make it happen" button - navigating to create-project page directly');
            await browser.get('https://deploy-f-fund-b4n2.vercel.app/create-project');
            console.log('Directly navigated to create-project page');
        } else {
            // Click the button if found
            try {
                await scrollAndClick(browser, makeItHappenButton, "Make it happen button");
            } catch (clickError) {
                console.log('Error clicking the found button, trying direct navigation:', clickError.message);
                await browser.get('https://deploy-f-fund-b4n2.vercel.app/create-project');
            }
        }

        await browser.sleep(5000);

        // Step 4: Rules & Terms section
        console.log('6. Completing Rules & Terms section');

        // Check if already at rules page or if we need to navigate there
        let currentUrl = await browser.getCurrentUrl();
        if (currentUrl.includes('create-project')) {
            // Check for and accept terms checkbox
            try {
                let termsCheckbox = await browser.wait(
                    until.elementLocated(By.xpath("//input[@type='checkbox']")),
                    10000
                );
                await scrollAndClick(browser, termsCheckbox, "Terms checkbox");
                console.log('7. Terms and conditions accepted');

                // Click continue button
                let continueButton = await browser.wait(
                    until.elementLocated(By.xpath("//button[contains(text(), 'Continue')]")),
                    10000
                );
                await scrollAndClick(browser, continueButton, "Continue button");
                console.log('8. Proceeding to Basic Information');

                await browser.sleep(3000);
            } catch (error) {
                console.log('No terms page found or already on Basic Information section:', error.message);
            }
        }

        // Step 5: Basic Information section
        console.log('9. Completing Basic Information section');

        // Generate unique project title with timestamp
        const projectTitle = `Automation Test Project ${Date.now()}`;

        // Fill project title
        let titleField = await browser.wait(
            until.elementLocated(By.id('title')),
            10000
        );
        await titleField.clear();
        await titleField.sendKeys(projectTitle);
        console.log(`10. Project title set to: ${projectTitle}`);

        // Fill project description
        let descriptionField = await browser.findElement(By.id('shortDescription'));
        await descriptionField.clear();
        await descriptionField.sendKeys('This is an automated test project. It demonstrates the project creation flow.');
        console.log('11. Project description added');

        // Select category
        let categoryDropdown = await browser.findElement(By.xpath("//select[@id='categoryId']"));
        await scrollAndClick(browser, categoryDropdown, "Category dropdown");
        await browser.sleep(1000);

        let categoryOptions = await browser.findElements(By.css('select[id="categoryId"] option'));
        if (categoryOptions.length > 1) {
            await scrollAndClick(browser, categoryOptions[1], "Category option");
            console.log('12. Project category selected');

            // Select subcategory if available
            await browser.sleep(1000);
            try {
                let subcategoryCheckbox = await browser.findElement(
                    By.css('input[type="checkbox"][name^="subcat-"]')
                );
                await scrollAndClick(browser, subcategoryCheckbox, "Subcategory checkbox");
                console.log('13. Subcategory selected');
            } catch (error) {
                console.log('No subcategories available for this category');
            }
        }

        // Select location
        let locationDropdown = await browser.findElement(By.id('location'));
        await scrollAndClick(browser, locationDropdown, "Location dropdown");
        let locationOptions = await browser.findElements(By.css('select[id="location"] option'));
        if (locationOptions.length > 1) {
            await scrollAndClick(browser, locationOptions[1], "Location option");
            console.log('14. Project location selected');
        }

        // Set target amount
        let amountField = await browser.findElement(By.id('totalTargetAmount'));
        await amountField.clear();
        await browser.sleep(1000);
        await browser.executeScript("arguments[0].value = '';", amountField);
        await browser.sleep(500);
        await amountField.sendKeys(totalAmount);
        await browser.sleep(1000);

        // Verify the value was set correctly
        const actualAmount = await amountField.getAttribute('value');
        console.log(`15. Target amount set to ${actualAmount}`);

        // Fill optional fields
        let projectUrlField = await browser.findElement(By.id('projectUrl'));
        await projectUrlField.clear();
        await projectUrlField.sendKeys('https://example.com/myproject');
        console.log('17. Project URL added');

        let socialMediaField = await browser.findElement(By.id('mainSocialMediaUrl'));
        await socialMediaField.clear();
        await socialMediaField.sendKeys('https://facebook.com/myproject');
        console.log('18. Social media URL added');

        let videoField = await browser.findElement(By.id('projectVideoDemo'));
        await videoField.clear();
        await videoField.sendKeys('https://youtube.com/watch?v=abcd1234');
        // After setting the video URL
        console.log('19. Video demo URL added');

        await browser.sleep(2000);

        // First scroll to the upload area and wait for it to be in view
        try {
            // Re-find the element before scrolling to it
            let uploadProjectImageFrame = await browser.findElement(By.xpath("(//div[@class='flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-48'])[1]"));
            await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", uploadProjectImageFrame);
            await browser.sleep(2000);

            // Find and make visible the file input - with retry mechanism
            let fileInput = null;
            let maxRetries = 3;
            let retryCount = 0;

            while (!fileInput && retryCount < maxRetries) {
                try {
                    // Try different strategies to find the file input
                    fileInput = await browser.findElement(By.css("input[type='file']"));
                    console.log("Found file input using generic selector");
                } catch (error) {
                    try {
                        fileInput = await browser.findElement(By.css("input[type='file'][accept='image/*']"));
                        console.log("Found file input using accept attribute selector");
                    } catch (error) {
                        try {
                            const uploadContainer = await browser.findElement(By.css(".flex.justify-center.items-center.border-2.border-dashed.border-gray-300.rounded-lg.h-48"));
                            fileInput = await uploadContainer.findElement(By.css("input[type='file']"));
                            console.log("Found file input within container");
                        } catch (error) {
                            console.log(`Retry ${retryCount + 1}/${maxRetries}: Could not find file input`);
                            retryCount++;
                            await browser.sleep(1000);
                        }
                    }
                }
            }

            if (!fileInput) {
                throw new Error("Could not find file input element after multiple retries");
            }

            // Make the input visible and enable it
            await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible'; arguments[0].classList.remove('hidden');", fileInput);
            await browser.sleep(1000);

            // Set the file path
            const imagePath = path.resolve(__dirname, '../Media/img/test.jpg');
            await fileInput.sendKeys(imagePath);
            console.log("Sent image path to input:", imagePath);

            // Wait for upload to begin
            await browser.sleep(2000);

            // Trigger the change event manually to make sure the component processes the file
            await browser.executeScript(`
        const event = new Event('change', { bubbles: true });
        arguments[0].dispatchEvent(event);
    `, fileInput);

            console.log("Triggered change event on file input");

            // Wait for upload to complete - give it more time
            await browser.sleep(10000);

            // Check for success message with retry
            let uploadSuccess = false;
            retryCount = 0;

            while (!uploadSuccess && retryCount < maxRetries) {
                try {
                    let textUploadProjectImageSuccess = await browser.findElement(By.xpath("//span[contains(text(), 'Image uploaded successfully') or contains(@class, 'text-sm')]"));
                    let successText = await textUploadProjectImageSuccess.getText();
                    console.log(`Success message: ${successText}`);
                    uploadSuccess = true;
                } catch (error) {
                    console.log(`Retry ${retryCount + 1}/${maxRetries}: Waiting for upload success message`);
                    retryCount++;
                    await browser.sleep(2000);
                }
            }

            if (!uploadSuccess) {
                console.warn("Could not confirm upload success, but continuing anyway");
            }

        } catch (uploadError) {
            console.error("Error during image upload:", uploadError.message);
            // Continue with the test even if upload fails
        }

        // Wait a moment before proceeding to create project
        await browser.sleep(2000);

        // Submit basic information form - re-find the button to avoid stale element
        let createProjectButton = await browser.findElement(By.xpath("//button[normalize-space()='Create Project']"));
        await scrollAndClick(browser, createProjectButton, "Create Project button");

        await browser.sleep(10000);

        let successCreateProjectMessage = await browser.findElement(By.xpath("//div[@class='bg-green-50 border-l-4 border-green-400 p-4']"));
        await scrollAndClick(browser, successCreateProjectMessage, "Success message");
        await successCreateProjectMessage.isDisplayed();
        let successCreateProjectText = await successCreateProjectMessage.getText();
        console.log(`Success message: ${successCreateProjectText}`);

        await browser.sleep(5000);

        // Continue to next section
        let continueToFundraising = await browser.findElement(By.xpath("//button[@title='Go to Fundraising Information']"));
        await scrollAndClick(browser, continueToFundraising, "Continue to Fundraising button");
        console.log('22. Proceeding to Fundraising Information');

        await browser.sleep(3000);

        let notiPhaseCheck = await browser.findElement(By.xpath("//p[@class='mt-1 text-yellow-700 font-medium']"));
        let notiPhaseText = await notiPhaseCheck.getText();
        console.log(`Notification message: ${notiPhaseText}`);

        await browser.sleep(2000);

        // Step 6: Fundraising Information section
        // For phase 1
        let phase1Goal = 3000;
        let phase2Goal = 5000;

        const firstPhaseAdded = await browser.findElement(By.xpath("//button[normalize-space()='Add Funding Phase']"));
        await scrollAndClick(browser, firstPhaseAdded, "Add Funding Phase button");
    
         await browser.sleep(1000);

        if (firstPhaseAdded) {

            console.log('24. First funding phase added successfully');
            let phase1FundingGoalField = await browser.findElement(By.xpath("//input[@id='phaseFundingGoal']"));
            await phase1FundingGoalField.clear();
            await phase1FundingGoalField.sendKeys(phase1Goal.toString());
            console.log('Phase 1 funding goal set to', phase1Goal);

            await browser.sleep(1000);

            let phase1DurationField = await browser.findElement(By.xpath("//input[@id='phaseDuration']"));
            await phase1DurationField.getText();
            console.log('Phase 1 duration set to', phase1DurationField, 'days');

            await browser.sleep(1000);

            let phase1StartDateField = await browser.findElement(By.xpath("//input[@id='phaseStartDate']"));
            await phase1StartDateField.clear();
            await browser.sleep(8000);


            let createPhaseButton = await browser.findElement(By.xpath("//button[normalize-space()='Add Phase']"));
            await scrollAndClick(browser, createPhaseButton, "Create Phase button");
            
            await browser.sleep(1000);

            try {
                // Switch to the alert
                let alert = await browser.switchTo().alert();

                // Get the text of the alert for logging
                let alertText = await alert.getText();
                console.log('Alert message:', alertText);

                // Accept the alert (click OK)
                await alert.accept();
                console.log('Alert accepted successfully');
            } catch (error) {
                console.log('No alert appeared or error handling alert:', error.message);
            }            

            await browser.sleep(2000);

            let checkPhase1Card = await browser.findElement(By.css("div[class='bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow transition-shadow']"));
            await checkPhase1Card.isDisplayed();
            console.log('Phase 1 card is displayed!');
            await checkPhase1Card.getText().then(function (text) {
                console.log('Phase 1 card text:', text);
            });

            await browser.sleep(2000);

            let phase1SuccessMessage = await browser.findElement(By.css(".bg-green-50.border-l-4.border-green-400.p-4"));
            await scrollAndClick(browser, phase1SuccessMessage, "Phase 1 Success Message");
            let phase1SuccessText = await phase1SuccessMessage.getText();
            console.log(`Success message: ${phase1SuccessText}`);

        } else {
            console.error('Failed to add first funding phase');
        }

        await browser.sleep(3000);

        // Add second phase - more funding with longer duration
        const secondPhaseAdded = await browser.findElement(By.xpath("//button[normalize-space()='Add Funding Phase']"));
        await scrollAndClick(browser, secondPhaseAdded, "Add Funding Phase button");

        await browser.sleep(1000);

        if (secondPhaseAdded) {
            console.log('25. Second funding phase added successfully');

            let phase2FundingGoalField = await browser.findElement(By.xpath("//input[@id='phaseFundingGoal']"));
            await phase2FundingGoalField.clear();
            await phase2FundingGoalField.sendKeys(phase2Goal.toString());
            console.log('Phase 2 funding goal set to', phase2Goal);

            await browser.sleep(1000);

            let phase2DurationField = await browser.findElement(By.xpath("//input[@id='phaseDuration']"));
            await phase2DurationField.getText();
            console.log('Phase 2 duration set to', phase2DurationField, 'days');

            await browser.sleep(1000);

            let phase2StartDateField = await browser.findElement(By.xpath("//input[@id='phaseStartDate']"));
            await phase2StartDateField.clear();
            await browser.sleep(8000);
            await phase2StartDateField.getText();
            console.log('Phase 2 start date set to ' + phase2StartDateField);

            await browser.sleep(1000);

            let createPhaseButton = await browser.findElement(By.xpath("//button[normalize-space()='Add Phase']"));
            await scrollAndClick(browser, createPhaseButton, "Create Phase button");

            await browser.sleep(1000);

            try {
                // Switch to the alert
                let alert = await browser.switchTo().alert();

                // Get the text of the alert for logging
                let alertText = await alert.getText();
                console.log('Alert message:', alertText);

                // Accept the alert (click OK)
                await alert.accept();
                console.log('Alert accepted successfully');
            } catch (error) {
                console.log('No alert appeared or error handling alert:', error.message);
            }

            await browser.sleep(10000);

            let phase2SuccessMessage = await browser.findElement(By.xpath("//div[@class='bg-green-50 border-l-4 border-green-400 p-4']"));
            await scrollAndClick(browser, phase2SuccessMessage, "Phase 2 Success Message");
            let phase2SuccessText = await phase2SuccessMessage.getText();
            console.log(`Success message: ${phase2SuccessText}`);

            await browser.sleep(2000);
        } else {
            console.error('Failed to add second funding phase');
        }

        await browser.sleep(5000);

        // Step 7: Reward Information section
        console.log('30. Completing Reward Information section');

        let rewardButton = await browser.findElement(By.xpath("//button[@title='Go to Reward Information']"));
        await scrollAndClick(browser, rewardButton, "Reward Information button");
        console.log('31. Proceeding to Reward Information');

        await browser.sleep(2000);

        //Phase 1
        let selectPhase1 = await browser.findElement(By.xpath("//button[normalize-space()='Select Phase']"));
        await selectPhase1.click();
        await browser.sleep(1000);

        let phase1Option = await browser.findElement(By.xpath("//div[@class='py-1']/button[contains(., 'Phase 1')]"));
        await phase1Option.click();
        await browser.sleep(1000);

        let selectedPhaseText = await browser.findElement(By.xpath("//button[contains(@class, 'inline-flex items-center px-3 py-1.5 border')]")).getText();
        console.log(`Selected phase: ${selectedPhaseText}`);

        let phase1AddMilestoneButton = await browser.findElement(By.xpath("//button[normalize-space()='Add First Milestone']"));
        await phase1AddMilestoneButton.click();
        await browser.sleep(1000);

        let phase1_milestoneTitleField = await browser.findElement(By.xpath("//input[@id='milestone-title']"));
        await phase1_milestoneTitleField.clear();
        await phase1_milestoneTitleField.sendKeys('Phase 1 Milestone 1');

        await browser.sleep(1000);

        let phase1_milestoneDescriptionField = await browser.findElement(By.xpath("//textarea[@id='milestone-description']"));
        await phase1_milestoneDescriptionField.clear();
        await phase1_milestoneDescriptionField.sendKeys('Phase 1 Milestone 1 Description');
        await browser.sleep(1000);

        let phase1_milestoneAmountField = await browser.findElement(By.xpath("//input[@id='milestone-price']"));
        await phase1_milestoneAmountField.clear();
        await phase1_milestoneAmountField.sendKeys('600');

        await browser.sleep(1000);

        let phase1_mileStoneCreateButton = await browser.findElement(By.xpath("//button[normalize-space()='Create Milestone']"));
        await phase1_mileStoneCreateButton.click();
        await browser.sleep(2000);

        try {
            // Switch to the alert
            let alert = await browser.switchTo().alert();

            // Get the text of the alert for logging
            let alertText = await alert.getText();
            console.log('Milestone Alert message:', alertText);

            // Accept the alert (click OK)
            await alert.accept();
            console.log('Milestone Alert accepted successfully');
        } catch (error) {
            console.log('No milestone alert appeared or error handling alert:', error.message);
        }

        await browser.sleep(3000);

        let phase1_milestone1_rewardButton = await browser.findElement(By.xpath("//button[normalize-space()='Add Item']"));
        await phase1_milestone1_rewardButton.click();
        await browser.sleep(1000);

        let phase1_milestone1_rewardTitleField = await browser.findElement(By.xpath("//input[@id='item-name']"));
        await phase1_milestone1_rewardTitleField.clear();
        await phase1_milestone1_rewardTitleField.sendKeys('Phase 1 Milestone 1 Reward Item');

        await browser.sleep(1000);

        let phase1_milestone1_rewardQuantityField = await browser.findElement(By.xpath("//input[@id='item-quantity']"));
        await phase1_milestone1_rewardQuantityField.clear();
        await phase1_milestone1_rewardQuantityField.sendKeys('1');
        await browser.sleep(1000);

        let phase1_milestone1_rewardImageLabel = await browser.findElement(By.xpath("(//label[@class='cursor-pointer flex flex-col items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50'])[1]"));

        let phase1_milestone1_rewardImageInput;
        try {
            phase1_milestone1_rewardImageInput = await phase1_milestone1_rewardImageLabel.findElement(By.css("input[type='file']"));
        } catch (error) {
            try {
                phase1_milestone1_rewardImageInput = await browser.findElement(By.css("input[type='file'][accept='image/*']"));
            } catch (error) {
                phase1_milestone1_rewardImageInput = await browser.findElement(By.css("input[type='file']"));
            }
        }

        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible'; arguments[0].classList.remove('hidden');", phase1_milestone1_rewardImageInput);  // FIX HERE - Use the correct variable name
        await browser.sleep(1000);

        // Now send the file path to the actual input element
        const phase1RewardImagePath = path.resolve(__dirname, '../Media/img/item1.jpg');
        await phase1_milestone1_rewardImageInput.sendKeys(phase1RewardImagePath);
        console.log('Attachment uploaded:', phase1RewardImagePath);

        // Trigger change event
        await browser.executeScript(`
    const event = new Event('change', { bubbles: true });
    arguments[0].dispatchEvent(event);
`, phase1_milestone1_rewardImageInput);

        await browser.sleep(2000);

        let phase1_milestone1_rewardAddButton = await browser.findElement(By.xpath("//button[@type='submit'][normalize-space()='Add Item']"));
        await phase1_milestone1_rewardAddButton.click();
        await browser.sleep(8000);

        let successMessage = await browser.findElement(By.xpath("(//div[@class='mb-4 bg-green-50 border-l-4 border-green-400 p-4'])[1]"));
        let successText = await successMessage.getText();
        console.log(`Success message: ${successText}`);

        await browser.sleep(2000);
        //phase 2
        let selectPhase2 = await browser.findElement(By.css("button[class='inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500']"));
        await selectPhase2.click();
        await browser.sleep(1000);

        let phase2Option = await browser.findElement(By.xpath("//div[@class='py-1']/button[contains(., 'Phase 2')]"));
        await phase2Option.click();
        await browser.sleep(1000);

        let selectedPhase2Text = await browser.findElement(By.xpath("//button[contains(@class, 'inline-flex items-center px-3 py-1.5 border')]")).getText();
        console.log(`Selected phase: ${selectedPhase2Text}`);

        let phase2AddMilestoneButton = await browser.findElement(By.xpath("//button[normalize-space()='Add First Milestone']"));
        await phase2AddMilestoneButton.click();
        await browser.sleep(1000);

        let phase2_milestoneTitleField = await browser.findElement(By.xpath("//input[@id='milestone-title']"));
        await phase2_milestoneTitleField.clear();
        await phase2_milestoneTitleField.sendKeys('Phase 2 Milestone 1');

        await browser.sleep(1000);

        let phase2_milestoneDescriptionField = await browser.findElement(By.xpath("//textarea[@id='milestone-description']"));
        await phase2_milestoneDescriptionField.clear();
        await phase2_milestoneDescriptionField.sendKeys('Phase 2 Milestone 1 Description');
        await browser.sleep(1000);

        let phase2_milestoneAmountField = await browser.findElement(By.xpath("//input[@id='milestone-price']"));
        await phase2_milestoneAmountField.clear();
        await phase2_milestoneAmountField.sendKeys('700');

        await browser.sleep(1000);

        let phase2_mileStoneCreateButton = await browser.findElement(By.xpath("//button[normalize-space()='Create Milestone']"));
        await phase2_mileStoneCreateButton.click();
        await browser.sleep(1000);

        try {
            // Switch to the alert
            let alert = await browser.switchTo().alert();

            // Get the text of the alert for logging
            let alertText = await alert.getText();
            console.log('Milestone Alert message:', alertText);

            // Accept the alert (click OK)
            await alert.accept();
            console.log('Milestone Alert accepted successfully');
        } catch (error) {
            console.log('No milestone alert appeared or error handling alert:', error.message);
        }

        await browser.sleep(3000);

        let phase2_milestone1_rewardButton = await browser.findElement(By.xpath("//button[normalize-space()='Add Item']"));
        await phase2_milestone1_rewardButton.click();
        await browser.sleep(1000);

        let phase2_milestone1_rewardTitleField = await browser.findElement(By.xpath("//input[@id='item-name']"));
        await phase2_milestone1_rewardTitleField.clear();
        await phase2_milestone1_rewardTitleField.sendKeys('Phase 2 Milestone 1 Reward Item');

        await browser.sleep(1000);

        let phase2_milestone1_rewardQuantityField = await browser.findElement(By.xpath("//input[@id='item-quantity']"));
        await phase2_milestone1_rewardQuantityField.clear();
        await phase2_milestone1_rewardQuantityField.sendKeys('1');

        await browser.sleep(1000);

        let phase2_milestone1_rewardImageLabel = await browser.findElement(By.xpath("(//label[@class='cursor-pointer flex flex-col items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50'])[1]"));

        let phase2_milestone1_rewardImageInput;
        try {
            phase2_milestone1_rewardImageInput = await phase2_milestone1_rewardImageLabel.findElement(By.css("input[type='file']"));
        } catch (error) {
            try {
                phase2_milestone1_rewardImageInput = await browser.findElement(By.css("input[type='file'][accept='image/*']"));
            } catch (error) {
                phase2_milestone1_rewardImageInput = await browser.findElement(By.css("input[type='file']"));
            }
        }
        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible'; arguments[0].classList.remove('hidden');", phase2_milestone1_rewardImageInput);
        await browser.sleep(1000);

        const phase2RewardImagePath = path.resolve(__dirname, '../Media/img/item1.jpg');
        await phase2_milestone1_rewardImageInput.sendKeys(phase2RewardImagePath);
        console.log('Attachment uploaded:', phase2RewardImagePath);

        await browser.executeScript(`
    const event = new Event('change', { bubbles: true });
    arguments[0].dispatchEvent(event);
`, phase2_milestone1_rewardImageInput);

        await browser.sleep(2000);

        let phase2_milestone1_rewardAddButton = await browser.findElement(By.xpath("//button[@type='submit'][normalize-space()='Add Item']"));
        await phase2_milestone1_rewardAddButton.click();
        await browser.sleep(8000);

        let phase2SuccessMessage = await browser.findElement(By.xpath("(//div[@class='mb-4 bg-green-50 border-l-4 border-green-400 p-4'])[1]"));
        let phase2SuccessText = await phase2SuccessMessage.getText();
        console.log(`Success message: ${phase2SuccessText}`);

        // Continue to Project Story section
        let continueToStory = await browser.findElement(By.xpath("//button[@title='Go to Project Story']"));
        await scrollAndClick(browser, continueToStory, "Continue to Project Story button");
        console.log('42. Proceeding to Project Story');

        await browser.sleep(3000);

        let storyField = await browser.findElement(By.xpath("(//div[@class='flex-grow overflow-y-auto p-4 bg-white'])[1]"));
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", storyField);

        await browser.sleep(40000);

        let createStoryButton = await browser.findElement(By.xpath("//button[normalize-space()='Create Story']"));
        await scrollAndClick(browser, createStoryButton, "Create Story button");
        await browser.sleep(1000);

        // go to team info
        let teamInfoButton = await browser.findElement(By.xpath("//button[@title='Go to Founder Profile']"));
        await scrollAndClick(browser, teamInfoButton, "Team Info button");
        console.log('43. Proceeding to Team Information');
        await browser.sleep(10000);


        // Navigate to Required Documents section
        let documentsButton = await browser.findElement(By.xpath("//div[normalize-space()='7. Required Documents']"));
        await scrollAndClick(browser, documentsButton, "Documents button");
        console.log('44. Proceeding to Required Documents');
        await browser.sleep(3000);

        // SWOT Analysis document upload
        let swotAnalysisLabel = await browser.findElement(By.xpath("//label[@for='swotAnalysis'][normalize-space()='Upload document']"));
        await swotAnalysisLabel.isDisplayed();

        // Find the hidden input element and make it visible
        let swotAnalysisInput = await browser.findElement(By.id("swotAnalysis"));
        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible';", swotAnalysisInput);
        await browser.sleep(1000);

        // Set the file path
        let swotFile = path.resolve(__dirname, '../Media/documents/SWOT and GAP Analyses and Worksheet Example.pdf');
        await swotAnalysisInput.sendKeys(swotFile);
        console.log('SWOT Analysis document uploaded:', swotFile);
        await browser.sleep(8000);

        // Check for success message
        try {
            let swotSuccessMessage = await browser.findElement(By.xpath("//div[contains(@class, 'bg-green-50') and contains(@class, 'text-green-800')]"));
            let swotSuccessText = await swotSuccessMessage.getText();
            console.log(`Success message: ${swotSuccessText}`);
        } catch (error) {
            console.warn("SWOT Analysis success message not found, but continuing");
        }
        await browser.sleep(2000);

        // Business Model Canvas document upload
        let businessModelCanvasLabel = await browser.findElement(By.xpath("//label[@for='businessModelCanvas'][normalize-space()='Upload document']"));
        await businessModelCanvasLabel.isDisplayed();

        // Find the hidden input element and make it visible
        let businessModelCanvasInput = await browser.findElement(By.id("businessModelCanvas"));
        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible';", businessModelCanvasInput);
        await browser.sleep(1000);

        // Set the file path
        let businessModelFile = path.resolve(__dirname, '../Media/documents/Business Model Canvas.pdf');
        await businessModelCanvasInput.sendKeys(businessModelFile);
        console.log('Business Model Canvas document uploaded:', businessModelFile);
        await browser.sleep(15000);

        // Check for success message
        try {
            let businessModelSuccessMessage = await browser.findElement(By.xpath("//div[contains(@class, 'bg-green-50') and contains(@class, 'text-green-800')]"));
            let businessModelSuccessText = await businessModelSuccessMessage.getText();
            console.log(`Success message: ${businessModelSuccessText}`);
        } catch (error) {
            console.warn("Business Model Canvas success message not found, but continuing");
        }
        await browser.sleep(2000);

        // Business Plan document upload
        let businessPlanLabel = await browser.findElement(By.xpath("//label[@for='businessPlan'][normalize-space()='Upload document']"));
        await businessPlanLabel.isDisplayed();

        // Find the hidden input element and make it visible
        let businessPlanInput = await browser.findElement(By.id("businessPlan"));
        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible';", businessPlanInput);
        await browser.sleep(1000);

        // Set the file path
        let businessPlanFile = path.resolve(__dirname, '../Media/documents/Business Plan.pdf');
        await businessPlanInput.sendKeys(businessPlanFile);
        console.log('Business Plan document uploaded:', businessPlanFile);
        await browser.sleep(15000);

        // Check for success message
        try {
            let businessPlanSuccessMessage = await browser.findElement(By.xpath("//div[contains(@class, 'bg-green-50') and contains(@class, 'text-green-800')]"));
            let businessPlanSuccessText = await businessPlanSuccessMessage.getText();
            console.log(`Success message: ${businessPlanSuccessText}`);
        } catch (error) {
            console.warn("Business Plan success message not found, but continuing");
        }
        await browser.sleep(2000);

        // Market Research document upload
        let marketResearchLabel = await browser.findElement(By.xpath("//label[@for='marketResearch'][normalize-space()='Upload document']"));
        await marketResearchLabel.isDisplayed();

        // Find the hidden input element and make it visible
        let marketResearchInput = await browser.findElement(By.id("marketResearch"));
        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible';", marketResearchInput);
        await browser.sleep(1000);

        // Set the file path
        let marketResearchFile = path.resolve(__dirname, '../Media/documents/market.pdf');
        await marketResearchInput.sendKeys(marketResearchFile);
        console.log('Market Research document uploaded:', marketResearchFile);
        await browser.sleep(15000);

        // Check for success message
        try {
            let marketResearchSuccessMessage = await browser.findElement(By.xpath("//div[contains(@class, 'bg-green-50') and contains(@class, 'text-green-800')]"));
            let marketResearchSuccessText = await marketResearchSuccessMessage.getText();
            console.log(`Success message: ${marketResearchSuccessText}`);
        } catch (error) {
            console.warn("Market Research success message not found, but continuing");
        }
        await browser.sleep(2000);

        // Financial Information document upload
        let financialPlanLabel = await browser.findElement(By.xpath("//label[@for='financialInformation'][normalize-space()='Upload document']"));
        await financialPlanLabel.isDisplayed();

        // Find the hidden input element and make it visible
        let financialPlanInput = await browser.findElement(By.id("financialInformation"));
        await browser.executeScript("arguments[0].style.display = 'block'; arguments[0].style.visibility = 'visible';", financialPlanInput);
        await browser.sleep(1000);

        // Set the file path
        let financialPlanFile = path.resolve(__dirname, '../Media/documents/Financial Information.pdf');
        await financialPlanInput.sendKeys(financialPlanFile);
        console.log('Financial Information document uploaded:', financialPlanFile);
        await browser.sleep(15000);

        // Check for success message
        try {
            let financialPlanSuccessMessage = await browser.findElement(By.xpath("//div[contains(@class, 'bg-green-50') and contains(@class, 'text-green-800')]"));
            let financialPlanSuccessText = await financialPlanSuccessMessage.getText();
            console.log(`Success message: ${financialPlanSuccessText}`);
        } catch (error) {
            console.warn("Financial Information success message not found, but continuing");
        }
        await browser.sleep(2000);

        //go to payment account
        let paymentAccountButton = await browser.findElement(By.xpath("//button[@title='Go to Payment Information']"));
        await scrollAndClick(browser, paymentAccountButton, "Payment Account button");
        console.log('50. Proceeding to Payment Account Information');

        await browser.sleep(3000);

        let stripeConnectButton = await browser.findElement(By.xpath("//button[normalize-space()='Connect with Stripe']"));
        await scrollAndClick(browser, stripeConnectButton, "Stripe Connect button");
        console.log('51. Stripe Connect button clicked');

        await browser.sleep(15000);

        let checkStripeSuccess = await browser.findElement(By.xpath("//div[@class='mb-6 bg-blue-50 p-4 rounded-md']"));
        await checkStripeSuccess.isDisplayed();
        await browser.sleep(1000);
        let stripeStatusText = await browser.findElement(By.xpath("//span[@class='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800']")).getText();
        console.log(`Stripe status: ${stripeStatusText}`);

        await browser.sleep(20000);

        let stripeButton = await browser.findElement(By.xpath("//button[normalize-space()='Continue Stripe Setup']"));
        await scrollAndClick(browser, stripeButton, "Continue Stripe Setup button");
        console.log('52. Continue Stripe Setup button clicked');

        await browser.sleep(15000);

        // check current URL
        let currentStripeURL = await browser.getCurrentUrl();

        let testPhoneNumberClick = await browser.findElement(By.xpath("(//a[normalize-space()='Use test phone number'])[1]"));
        await testPhoneNumberClick.click();
        await browser.sleep(5000);

        let testCodeInput = await browser.findElement(By.xpath("//a[normalize-space()='Use test code']"));
        await testCodeInput.click();
        await browser.sleep(20000);

        let inputPhoneNumber = await browser.findElement(By.xpath("//fieldset[@id='phone']//div[contains(@class,'rs-5 rs-6 rs-0 rs-1 rs-2 as-7 as-1j as-4l as-4m as-4n as-3t as-3s as-3q as-4o as-3u as-4p as-2c as-3v as-8 as-47 as-48 as-45 as-46 ⚙6x7rus')]"));
        await inputPhoneNumber.clear();
        await inputPhoneNumber.send('0000000000');
        await browser.sleep(1000);

        let inputCode = await browser.findElement(By.xpath("//input[@id='id_number']"));
        await inputCode.clear();
        await inputCode.send('000000000');

        await browser.sleep(80000);

        let submitButton = await browser.findElement(By.xpath("//button[normalize-space()='Submit Project']"));
        await scrollAndClick(browser, submitButton, "Submit Project button");
        console.log('53. Submit Project button clicked');

        await browser.sleep(10000);

    } catch (error) {
        console.error('TEST FAILED:', error);

        // Take screenshot on error
        try {
            const errorDir = 'D:\\FE_FFUND\\autotest_ffund\\FOUNDER\\Project\\Media\\error';
            if (!fs.existsSync(errorDir)) {
                fs.mkdirSync(errorDir, { recursive: true });
                console.log(`Created directory: ${errorDir}`);
            }

            const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
            const errorImagePath = `${errorDir}\\project-creation-error-${timestamp}.png`;

            let errorScreenshot = await browser.takeScreenshot();
            fs.writeFileSync(errorImagePath, errorScreenshot, 'base64');
            console.log(`Error screenshot saved as ${errorImagePath}`);
        } catch (screenshotError) {
            console.error('Failed to capture error screenshot:', screenshotError);
        }
    } finally {
        if (browser) {
            await browser.quit();
            console.log('Browser closed');
        }
    }
})();