const webdriver = require('selenium-webdriver');
const assert = require('assert');

const By = webdriver.By;
const until = webdriver.until;
const Key = webdriver.Key;

(async function runFundraisingInformationTests() {
    let browser;
    const testResults = {
        total: 6,
        passed: 0,
        failed: 0,
        errors: []
    };

    try {
        console.log("=== FUNDRAISING INFORMATION TESTS ===");
        
        browser = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .build();
        
        // Login as a founder
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        
        await browser.sleep(2000);
        
        let loginButton = await browser.wait(
            until.elementLocated(By.css('.main-btn.main-btn-2')),
            10000
        );
        await loginButton.click();
        
        let emailField = await browser.wait(
            until.elementLocated(By.css('#email')),
            10000
        );
        await emailField.sendKeys('phucnmtde170689@fpt.edu.vn');
        
        let passwordField = await browser.findElement(By.css('#password'));
        await passwordField.sendKeys('123456');
        
        let submitButton = await browser.findElement(By.xpath("//button[normalize-space()='Sign in']"));
        await submitButton.click();
        
        await browser.sleep(5000);
        
        // Navigate to create project page
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/create-project');
        await browser.sleep(3000);
        
        // Accept the rules and terms
        try {
            let termsCheckbox = await browser.findElement(By.css('input[type="checkbox"]'));
            await termsCheckbox.click();
            
            let continueButton = await browser.findElement(By.xpath("//button[contains(text(),'Continue')]"));
            await continueButton.click();
            console.log("Accepted terms and continued to Basic Information");
            await browser.sleep(2000);
        } catch (error) {
            console.error("Error accepting terms:", error.message);
        }
        
        // Fill Basic Information form to move to Fundraising Information
        try {
            // Project title
            let titleField = await browser.findElement(By.css('input[name="title"]'));
            await titleField.sendKeys(`Test Project ${Date.now()}`);
            
            // Select category
            let categoryDropdown = await browser.findElement(By.css('select[name="categoryId"]'));
            await categoryDropdown.click();
            let categoryOptions = await browser.findElements(By.css('select[name="categoryId"] option'));
            if (categoryOptions.length > 1) {
                await categoryOptions[1].click();
                await browser.sleep(500);
                
                // Select a subcategory if available
                try {
                    let subcategoryCheckboxes = await browser.findElements(By.css('input[type="checkbox"][name^="subcat-"]'));
                    if (subcategoryCheckboxes.length > 0) {
                        await subcategoryCheckboxes[0].click();
                    }
                } catch (error) {
                    console.log("No subcategories available");
                }
            }
            
            // Description
            let descriptionField = await browser.findElement(By.css('textarea[name="shortDescription"]'));
            await descriptionField.sendKeys('This is an automated test project description');
            
            // Location
            let locationDropdown = await browser.findElement(By.css('select[name="location"]'));
            await locationDropdown.click();
            let locationOptions = await browser.findElements(By.css('select[name="location"] option'));
            if (locationOptions.length > 1) {
                await locationOptions[1].click();
            }
            
            // Target amount
            let targetAmountField = await browser.findElement(By.css('input[name="totalTargetAmount"]'));
            await targetAmountField.clear();
            await targetAmountField.sendKeys('5000');
            
            // Click next
            let nextButton = await browser.findElement(By.xpath("//button[contains(text(),'Next') or contains(text(),'Continue')]"));
            await nextButton.click();
            console.log("Filled Basic Information and continued to Fundraising Information");
            await browser.sleep(3000);
        } catch (error) {
            console.error("Error filling Basic Information:", error.message);
        }
        
        // TEST 1: Display fundraising start date field
        console.log("\nTEST 1: Should display fundraising start date field");
        try {
            // Verify we're on the Fundraising Information section
            let sectionHeader = await browser.wait(
                until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                10000
            );
            assert(await sectionHeader.isDisplayed(), "Fundraising Information header is displayed");
            
            // Verify start date field exists
            let startDateFieldExists = await browser.findElements(By.css('input[type="date"]'));
            assert(startDateFieldExists.length > 0, "Start date field is present");
            
            console.log("✓ Test Passed: Start date field is displayed");
            testResults.passed++;
        } catch (error) {
            console.error("✗ Test Failed: Error verifying start date field:", error.message);
            testResults.failed++;
            testResults.errors.push({ test: 'Display fundraising start date field', error: error.message });
        }

        // TEST 2: Allow adding a funding phase
        console.log("\nTEST 2: Should allow adding a funding phase");
        try {
            // Verify we're on the Fundraising Information section
            let sectionHeader = await browser.wait(
                until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                10000
            );
            
            // Click Add Funding Phase button
            let addPhaseButton = await browser.findElement(
                By.xpath("//button[contains(text(),'Add Funding Phase')]")
            );
            await addPhaseButton.click();
            console.log("Clicked Add Funding Phase button");
            await browser.sleep(1000);
            
            // Verify phase form appears
            let phaseForm = await browser.findElement(By.xpath("//h3[contains(text(),'Add New Funding Phase')]"));
            assert(await phaseForm.isDisplayed(), "Phase form is displayed");
            
            // Fill in phase details
            let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
            await fundingGoalField.clear();
            await fundingGoalField.sendKeys("5000");
            console.log("Entered funding goal: $5,000");
            
            let durationField = await browser.findElement(By.id("phaseDuration"));
            await durationField.clear();
            await durationField.sendKeys("30");
            console.log("Entered duration: 30 days");
            
            // Get minimum allowed start date and set a date slightly after that
            let startDateField = await browser.findElement(By.id("startDate"));
            let minDate = await startDateField.getAttribute("min");
            console.log(`Minimum allowed start date: ${minDate}`);
            
            // Parse the minimum date and add a few days to ensure it's valid
            let minDateObj = new Date(minDate);
            minDateObj.setDate(minDateObj.getDate() + 2);
            let startDate = minDateObj.toISOString().split('T')[0];
            
            await startDateField.sendKeys(startDate);
            console.log(`Entered start date: ${startDate}`);
            
            // Add the phase
            let addButton = await browser.findElement(
                By.xpath("//button[text()='Add Phase']")
            );
            await addButton.click();
            console.log("Clicked Add Phase button");
            await browser.sleep(2000);
            
            // Verify phase was added
            let phaseItems = await browser.findElements(By.xpath("//div[contains(@class, 'bg-white border border-gray-200 rounded-lg')]"));
            assert(phaseItems.length > 0, "Phase was added successfully");
            
            // Verify phase details
            let phaseDetails = await browser.findElement(By.xpath("//span[contains(text(), 'Funding Goal:')]/following-sibling::span"));
            let phaseGoalText = await phaseDetails.getText();
            assert(phaseGoalText.includes("5,000") || phaseGoalText.includes("5000"), "Phase shows correct funding goal");
            
            console.log("✓ Test Passed: Successfully added a funding phase");
            testResults.passed++;
        } catch (error) {
            console.error("✗ Test Failed: Error adding funding phase:", error.message);
            testResults.failed++;
            testResults.errors.push({ test: 'Allow adding a funding phase', error: error.message });
        }

        // TEST 3: Validate funding phase inputs
        console.log("\nTEST 3: Should validate funding phase inputs");
        try {
            // Verify we're on the Fundraising Information section
            await browser.wait(
                until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                10000
            );
            
            // Click Add Funding Phase button
            let addPhaseButton = await browser.findElement(
                By.xpath("//button[contains(text(),'Add Funding Phase')]")
            );
            await addPhaseButton.click();
            console.log("Clicked Add Funding Phase button");
            await browser.sleep(1000);
            
            // Try to add phase with invalid duration (less than 14 days)
            let durationField = await browser.findElement(By.id("phaseDuration"));
            await durationField.clear();
            await durationField.sendKeys("10");
            console.log("Entered invalid duration: 10 days (less than minimum)");
            
            // Try to add the phase
            let addButton = await browser.findElement(
                By.xpath("//button[text()='Add Phase']")
            );
            await addButton.click();
            console.log("Clicked Add Phase button with invalid duration");
            await browser.sleep(1000);
            
            // Verify error message
            let errorMessage = await browser.findElement(By.xpath("//p[contains(@class, 'text-red-700')]"));
            let errorText = await errorMessage.getText();
            assert(errorText.includes("Phase duration must be at least 14 days"), "Error message for invalid duration shown");
            
            console.log("✓ Phase validation works for minimum duration");
            
            // Fix the duration and try with empty funding goal
            await durationField.clear();
            await durationField.sendKeys("14");
            
            let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
            await fundingGoalField.clear();
            console.log("Cleared funding goal field (should be invalid)");
            
            // Verify Add Phase button is disabled with empty required field
            addButton = await browser.findElement(
                By.xpath("//button[text()='Add Phase']")
            );
            let isDisabled = await addButton.getAttribute("disabled") === "true";
            assert(isDisabled, "Add Phase button is disabled when required fields are empty");
            
            console.log("✓ Test Passed: Phase validation works for required fields");
            testResults.passed++;
        } catch (error) {
            console.error("✗ Test Failed: Error validating phase inputs:", error.message);
            testResults.failed++;
            testResults.errors.push({ test: 'Validate funding phase inputs', error: error.message });
        }

        // TEST 4: Allow editing an existing phase
        console.log("\nTEST 4: Should allow editing an existing phase");
        try {
            // First add a phase
            await browser.wait(
                until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                10000
            );
            
            // Click Add Funding Phase button if no phases exist
            let phaseCount = await browser.findElements(By.xpath("//div[contains(@class, 'bg-white border border-gray-200 rounded-lg')]"));
            if (phaseCount.length === 0) {
                let addPhaseButton = await browser.findElement(
                    By.xpath("//button[contains(text(),'Add Funding Phase')]")
                );
                await addPhaseButton.click();
                
                // Fill in phase details
                let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
                await fundingGoalField.clear();
                await fundingGoalField.sendKeys("3000");
                
                let durationField = await browser.findElement(By.id("phaseDuration"));
                await durationField.clear();
                await durationField.sendKeys("20");
                
                // Get minimum allowed start date and set a date slightly after that
                let startDateField = await browser.findElement(By.id("startDate"));
                let minDate = await startDateField.getAttribute("min");
                
                // Parse the minimum date and add a few days to ensure it's valid
                let minDateObj = new Date(minDate);
                minDateObj.setDate(minDateObj.getDate() + 2);
                let startDate = minDateObj.toISOString().split('T')[0];
                
                await startDateField.sendKeys(startDate);
                
                // Add the phase
                let addButton = await browser.findElement(
                    By.xpath("//button[text()='Add Phase']")
                );
                await addButton.click();
                await browser.sleep(2000);
            }
            
            // Now edit the phase
            let editButton = await browser.findElement(
                By.xpath("//button[text()='Edit']")
            );
            await editButton.click();
            console.log("Clicked Edit button for the phase");
            await browser.sleep(1000);
            
            // Verify we're in edit mode
            let editHeader = await browser.findElement(By.xpath("//h3[contains(text(),'Edit Funding Phase')]"));
            assert(await editHeader.isDisplayed(), "Edit phase form is displayed");
            
            // Change funding goal
            let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
            await fundingGoalField.clear();
            await fundingGoalField.sendKeys("4000");
            console.log("Changed funding goal to $4,000");
            
            // Change duration
            let durationField = await browser.findElement(By.id("phaseDuration"));
            await durationField.clear();
            await durationField.sendKeys("25");
            console.log("Changed duration to 25 days");
            
            // Update the phase
            let updateButton = await browser.findElement(
                By.xpath("//button[text()='Update Phase']")
            );
            await updateButton.click();
            console.log("Clicked Update Phase button");
            await browser.sleep(2000);
            
            // Verify phase was updated
            let phaseDetails = await browser.findElements(By.xpath("//span[contains(text(), 'Funding Goal:')]/following-sibling::span"));
            let phaseGoalText = await phaseDetails[0].getText();
            
            // The text might include formatting like "$4,000.00" or "$4000"
            assert(phaseGoalText.includes("4,000") || phaseGoalText.includes("4000"), 
                   `Phase shows updated funding goal: ${phaseGoalText}`);
            
            console.log("✓ Test Passed: Successfully edited a funding phase");
            testResults.passed++;
        } catch (error) {
            console.error("✗ Test Failed: Error editing phase:", error.message);
            testResults.failed++;
            testResults.errors.push({ test: 'Allow editing an existing phase', error: error.message });
        }

        // TEST 5: Proceed to Project Story when form is valid
        console.log("\nTEST 5: Should proceed to Project Story when form is valid");
        try {
            // Ensure we have at least one phase
            let phaseCount = await browser.findElements(By.xpath("//div[contains(@class, 'bg-white border border-gray-200 rounded-lg')]"));
            if (phaseCount.length === 0) {
                // First add a phase
                await browser.wait(
                    until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                    10000
                );
                
                // Click Add Funding Phase button
                let addPhaseButton = await browser.findElement(
                    By.xpath("//button[contains(text(),'Add Funding Phase')]")
                );
                await addPhaseButton.click();
                
                // Fill in phase details
                let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
                await fundingGoalField.clear();
                await fundingGoalField.sendKeys("5000");
                
                let durationField = await browser.findElement(By.id("phaseDuration"));
                await durationField.clear();
                await durationField.sendKeys("30");
                
                // Get minimum allowed start date and set a date slightly after that
                let startDateField = await browser.findElement(By.id("startDate"));
                let minDate = await startDateField.getAttribute("min");
                
                // Parse the minimum date and add a few days to ensure it's valid
                let minDateObj = new Date(minDate);
                minDateObj.setDate(minDateObj.getDate() + 2);
                let startDate = minDateObj.toISOString().split('T')[0];
                
                await startDateField.sendKeys(startDate);
                
                // Add the phase
                let addButton = await browser.findElement(
                    By.xpath("//button[text()='Add Phase']")
                );
                await addButton.click();
                await browser.sleep(2000);
            }
            
            // Click Next to proceed to Project Story
            let nextButton = await browser.findElement(By.xpath("//button[contains(text(),'Next')]"));
            await nextButton.click();
            console.log("Clicked Next button");
            await browser.sleep(2000);
            
            // Verify we're on Project Story section
            let projectStoryHeader = await browser.wait(
                until.elementLocated(By.xpath("//h2[contains(text(),'Project Story')]")),
                10000
            );
            
            assert(await projectStoryHeader.isDisplayed(), "Project Story section is displayed");
            
            console.log("✓ Test Passed: Successfully proceeded to Project Story section");
            testResults.passed++;
        } catch (error) {
            console.error("✗ Test Failed: Error proceeding to Project Story:", error.message);
            testResults.failed++;
            testResults.errors.push({ test: 'Proceed to Project Story', error: error.message });
        }

        // Navigate back to Fundraising Information for the last test
        try {
            await browser.navigate().back();
            await browser.sleep(2000);
            
            // Verify we're back on Fundraising Information
            await browser.wait(
                until.elementLocated(By.xpath("//h2[contains(text(),'Fundraising Information')]")),
                10000
            );
        } catch (error) {
            console.error("Error navigating back to Fundraising Information:", error.message);
        }

        // TEST 6: Display total funding goal and duration information
        console.log("\nTEST 6: Should display total funding goal and duration information");
        try {
            // First add a phase if none exist
            let phaseCount = await browser.findElements(By.xpath("//div[contains(@class, 'bg-white border border-gray-200 rounded-lg')]"));
            if (phaseCount.length === 0) {
                // Click Add Funding Phase button
                let addPhaseButton = await browser.findElement(
                    By.xpath("//button[contains(text(),'Add Funding Phase')]")
                );
                await addPhaseButton.click();
                
                // Fill in phase details
                let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
                await fundingGoalField.clear();
                await fundingGoalField.sendKeys("2500");
                
                let durationField = await browser.findElement(By.id("phaseDuration"));
                await durationField.clear();
                await durationField.sendKeys("20");
                
                // Get minimum allowed start date and set a date
                let startDateField = await browser.findElement(By.xpath("//input[@type='date']"));
                let minDate = await startDateField.getAttribute("min");
                let minDateObj = new Date(minDate);
                minDateObj.setDate(minDateObj.getDate() + 2);
                let startDate = minDateObj.toISOString().split('T')[0];
                await startDateField.sendKeys(startDate);
                
                // Add the phase
                let addButton = await browser.findElement(
                    By.xpath("//button[text()='Add Phase']")
                );
                await addButton.click();
                await browser.sleep(2000);
            }
            
            // Add another phase
            let addPhaseButton = await browser.findElement(
                By.xpath("//button[contains(text(),'Add Funding Phase')]")
            );
            await addPhaseButton.click();
            await browser.sleep(1000);
            
            // Fill in phase details for second phase
            let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
            await fundingGoalField.clear();
            await fundingGoalField.sendKeys("2500");
            
            let durationField = await browser.findElement(By.id("phaseDuration"));
            await durationField.clear();
            await durationField.sendKeys("15");
            
            // Get minimum allowed start date and set a date
            let startDateField = await browser.findElement(By.xpath("//input[@type='date']"));
            let minDate = await startDateField.getAttribute("min");
            let minDateObj = new Date(minDate);
            minDateObj.setDate(minDateObj.getDate() + 2);
            let startDate = minDateObj.toISOString().split('T')[0];
            await startDateField.sendKeys(startDate);
            
            // Add the second phase
            let addButton = await browser.findElement(
                By.xpath("//button[text()='Add Phase']")
            );
            await addButton.click();
            await browser.sleep(2000);
            
            // Check for the totals display
            let totalsElements = await browser.findElements(
                By.xpath("//div[contains(text(), 'Total Funding Goal:')]")
            );
            
            if (totalsElements.length > 0) {
                let totalsText = await totalsElements[0].getText();
                
                // Since we have at least two phases, the total should include multiple phase amounts
                assert(totalsText.includes("Total Funding Goal:"), "Total funding information is displayed");
                
                console.log("✓ Test Passed: Successfully displays total funding goal and duration");
                testResults.passed++;
            } else {
                throw new Error("Total funding information not found");
            }
        } catch (error) {
            console.error("✗ Test Failed: Error verifying total funding information:", error.message);
            testResults.failed++;
            testResults.errors.push({ test: 'Display total funding information', error: error.message });
        }

    } catch (err) {
        console.error("\nError during test execution:", err);
    } finally {
        if (browser) {
            try {
                console.log('\nClosing browser...');
                await browser.quit();
            } catch (err) {
                console.error('Error while closing the browser:', err);
            }
        }

        // Print test summary
        console.log("\n=== TEST SUMMARY ===");
        console.log(`Total Tests: ${testResults.total}`);
        console.log(`Passed: ${testResults.passed}`);
        console.log(`Failed: ${testResults.failed}`);
        console.log(`Skipped: ${testResults.total - testResults.passed - testResults.failed}`);
        
        if (testResults.errors.length > 0) {
            console.log("\nFailed Tests:");
            testResults.errors.forEach(error => {
                console.log(`- ${error.test}: ${error.error}`);
            });
        }
    }
})();// Define constants for test names and error messages
const TEST_NAMES = {
  DISPLAY_START_DATE_FIELD: 'Display fundraising start date field',
  ALLOW_ADDING_PHASE: 'Allow adding a funding phase',
  VALIDATE_PHASE_INPUTS: 'Validate funding phase inputs',
  ALLOW_EDITING_PHASE: 'Allow editing an existing phase',
  PROCEED_TO_PROJECT_STORY: 'Proceed to Project Story',
  DISPLAY_TOTAL_FUNDING_INFORMATION: 'Display total funding goal and duration information'
};

const ERROR_MESSAGES = {
  INVALID_DURATION: 'Phase duration must be at least 14 days',
  EMPTY_REQUIRED_FIELDS: 'Please fill in all required fields'
};

// ... rest of the code remains the same ...

// TEST 1: Display fundraising start date field
console.log(`\nTEST 1: ${TEST_NAMES.DISPLAY_START_DATE_FIELD}`);
try {
  // ... rest of the code remains the same ...
} catch (error) {
  console.error(`\n✗ Test Failed: Error verifying start date field: ${error.message}`);
  testResults.failed++;
  testResults.errors.push({ test: TEST_NAMES.DISPLAY_START_DATE_FIELD, error: error.message });
}

// ... rest of the code remains the same ...

// TEST 3: Validate funding phase inputs
console.log(`\nTEST 3: ${TEST_NAMES.VALIDATE_PHASE_INPUTS}`);
try {
  // ... rest of the code remains the same ...
  // Try to add phase with invalid duration (less than 14 days)
  let durationField = await browser.findElement(By.id("phaseDuration"));
  await durationField.clear();
  await durationField.sendKeys("10");
  console.log("Entered invalid duration: 10 days (less than minimum)");
  
  // Try to add the phase
  let addButton = await browser.findElement(By.xpath("//button[text()='Add Phase']"));
  await addButton.click();
  console.log("Clicked Add Phase button with invalid duration");
  await browser.sleep(1000);
  
  // Verify error message
  let errorMessage = await browser.findElement(By.xpath("//p[contains(@class, 'text-red-700')]"));
  let errorText = await errorMessage.getText();
  assert(errorText.includes(ERROR_MESSAGES.INVALID_DURATION), `Error message for invalid duration shown: ${errorText}`);
  
  console.log("✓ Phase validation works for minimum duration");
  
  // Fix the duration and try with empty funding goal
  await durationField.clear();
  await durationField.sendKeys("14");
  
  let fundingGoalField = await browser.findElement(By.id("phaseFundingGoal"));
  await fundingGoalField.clear();
  console.log("Cleared funding goal field (should be invalid)");
  
  // Verify Add Phase button is disabled with empty required field
  addButton = await browser.findElement(By.xpath("//button[text()='Add Phase']"));
  let isDisabled = await addButton.getAttribute("disabled") === "true";
  assert(isDisabled, `Add Phase button is disabled when required fields are empty: ${isDisabled}`);
  
  console.log("✓ Test Passed: Phase validation works for required fields");
  testResults.passed++;
} catch (error) {
  console.error(`\n✗ Test Failed: Error validating phase inputs: ${error.message}`);
  testResults.failed++;
  testResults.errors.push({ test: TEST_NAMES.VALIDATE_PHASE_INPUTS, error: error.message });
}

// ... rest of the code remains the same ...
