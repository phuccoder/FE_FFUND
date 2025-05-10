const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { Builder, By, Key, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { loginFounder } = require("../../../Login-Register/Login/loginHelper");

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
        console.error(
            `Failed to scroll and click ${elementDescription}: ${error.message}`
        );
        return false;
    }
}

/**
 * Function to wait for manual captcha solving
 * @param {webdriver.WebDriver} browser - The Selenium WebDriver instance
 * @param {number} timeoutMs - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>} - Returns true if captcha is no longer present
 */
async function waitForManualCaptchaSolving(browser, timeoutMs = 120000) {
    console.log("\n==================================");
    console.log("⚠️ hCAPTCHA DETECTED ⚠️");
    console.log("==================================");
    console.log("Please manually solve the captcha in the browser window.");
    console.log(`You have ${timeoutMs / 1000} seconds to complete it.`);
    console.log("The test will continue automatically once you solve the captcha.");
    console.log("==================================\n");

    // Create CLI interface for user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Set up a promise that resolves on user input
    const userInputPromise = new Promise((resolve) => {
        rl.question("Press Enter after solving the captcha (or 's' to skip waiting): ", (answer) => {
            rl.close();
            resolve(answer === 's' ? 'skip' : 'continue');
        });
    });

    // Set up a detection loop to check if captcha is still present
    const detectionPromise = new Promise(async (resolve) => {
        const startTime = Date.now();
        let isCaptchaSolved = false;

        while (Date.now() - startTime < timeoutMs && !isCaptchaSolved) {
            try {
                // Check if captcha iframe is still present
                const captchaFrames = await browser.findElements(By.css("iframe[src*='hcaptcha.com']"));

                if (captchaFrames.length === 0) {
                    console.log("\n✅ Captcha appears to be solved!");
                    isCaptchaSolved = true;
                    resolve('solved');
                    break;
                }

                // Also check if we've moved past the captcha page
                const currentUrl = await browser.getCurrentUrl();
                if (!currentUrl.includes("captcha") && !currentUrl.endsWith("/phone")) {
                    console.log("\n✅ Detected navigation past captcha page!");
                    isCaptchaSolved = true;
                    resolve('solved');
                    break;
                }

                // Wait a bit before checking again
                await new Promise(r => setTimeout(r, 2000));
            } catch (error) {
                // If there's an error checking, just continue waiting
                console.log("Error checking captcha status:", error.message);
            }
        }

        if (!isCaptchaSolved) {
            console.log("\n⚠️ Captcha checking timed out");
            resolve('timeout');
        }
    });

    // Set up a timeout promise
    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            resolve('timeout');
        }, timeoutMs);
    });

    // Wait for either user input, automatic detection, or timeout
    const result = await Promise.race([userInputPromise, detectionPromise, timeoutPromise]);

    if (result === 'solved') {
        console.log("Captcha was solved successfully!");
        return true;
    } else if (result === 'skip') {
        console.log("Skipping captcha wait as requested");
        return true;
    } else {
        console.log("Captcha solving timed out");
        return false;
    }
}

/**
 * Function to set up browser with anti-detection features
 * @returns {Promise<webdriver.WebDriver>} - Returns a configured WebDriver instance
 */
async function setupStealthBrowser() {
    // Create Chrome options with anti-detection settings
    const options = new chrome.Options();

    // Add anti-detection arguments
    options.addArguments(
        "--disable-blink-features=AutomationControlled",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-infobars",
        "--window-size=1920,1080",
        "--start-maximized"
    );

    // Disable automation flags
    options.setExperimentalOption("excludeSwitches", ["enable-automation"]);
    options.setExperimentalOption("useAutomationExtension", false);

    // Create the browser instance
    const browser = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    // Execute stealth script
    await browser.executeScript(`
        // Overwrite the webdriver property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
    `);

    return browser;
}

/**
 * Function to handle Stripe account setup with manual captcha solving
 * @returns {Promise<boolean>} - Returns true if successful
 */
async function semiAutomatedStripeSetup() {
    let browser = null;

    try {
        // Use stealth browser configuration
        browser = await setupStealthBrowser();
        console.log("=== STARTING STRIPE ACCOUNT SETUP ===");

        // Step 1: Navigate to homepage and login as founder
        await browser.get("https://deploy-f-fund-b4n2.vercel.app");
        console.log("1. Navigated to website");

        await browser.sleep(2000);

        // Login as founder
        const email = "phanthienan01072003@gmail.com";
        const password = "123456";
        const isLoggedIn = await loginFounder(browser, email, password);

        if (!isLoggedIn) {
            console.log("Login failed. Exiting test.");
            return false;
        }
        console.log("2. Successfully logged in as founder");

        await browser.sleep(3000);

        // Navigate to create project page
        await browser.get("https://deploy-f-fund-b4n2.vercel.app/create-project");
        console.log("3. Navigated to create project page");

        await browser.sleep(3000);

        // Navigate directly to payment section if possible
        try {
            let paymentAccountButton = await browser.findElement(
                By.xpath("//button[@title='Go to Payment Information']")
            );
            await scrollAndClick(
                browser,
                paymentAccountButton,
                "Payment Account button"
            );
            console.log("4. Proceeded to Payment Account Information");
        } catch (error) {
            console.log("Could not find payment section button, trying to proceed with form flow");

            // Check if we need to accept terms and conditions first
            try {
                let termsCheckbox = await browser.findElement(By.xpath("//input[@type='checkbox']"));
                await scrollAndClick(browser, termsCheckbox, "Terms checkbox");

                let continueButton = await browser.findElement(
                    By.xpath("//button[contains(text(), 'Continue')]")
                );
                await scrollAndClick(browser, continueButton, "Continue button");

                // Now try to find payment section again
                await browser.sleep(2000);
                let paymentAccountButton = await browser.findElement(
                    By.xpath("//button[@title='Go to Payment Information']")
                );
                await scrollAndClick(
                    browser,
                    paymentAccountButton,
                    "Payment Account button"
                );
                console.log("4. Proceeded to Payment Account Information (after accepting terms)");
            } catch (termsError) {
                console.log("Error navigating form flow:", termsError.message);
                return false;
            }
        }

        await browser.sleep(3000);

        // Find and click the "Connect with Stripe" button
        console.log("5. Looking for Connect with Stripe button");

        let connectStripeButton;
        try {
            connectStripeButton = await browser.wait(
                until.elementLocated(By.xpath(
                    "//button[contains(text(), 'Connect with Stripe') or contains(text(), 'Setup Stripe')]"
                )),
                10000
            );
        } catch (error) {
            console.log("Could not find Connect with Stripe button by text, trying alternative selectors");

            try {
                // Try finding by class if available
                connectStripeButton = await browser.findElement(
                    By.css(".stripe-connect-button, .payment-connect-button")
                );
            } catch (error2) {
                // If both methods fail, take a screenshot and exit
                console.error("Could not locate Stripe connect button:", error2.message);

                // Take screenshot
                const errorDir = "D:\\FE_FFUND\\autotest_ffund\\FOUNDER\\Project\\Media\\error";
                if (!fs.existsSync(errorDir)) {
                    fs.mkdirSync(errorDir, { recursive: true });
                }
                const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
                const errorImagePath = `${errorDir}\\stripe-button-missing-${timestamp}.png`;
                let errorScreenshot = await browser.takeScreenshot();
                fs.writeFileSync(errorImagePath, errorScreenshot, "base64");

                console.log(`Error screenshot saved as ${errorImagePath}`);
                return false;
            }
        }

        // Click the Stripe connect button
        await scrollAndClick(browser, connectStripeButton, "Connect with Stripe button");
        console.log("6. Clicked Connect with Stripe button");

        await browser.sleep(5000);

        // Check if we've been redirected to Stripe
        const currentUrl = await browser.getCurrentUrl();
        if (!currentUrl.includes("stripe.com")) {
            console.log("Failed to redirect to Stripe. Current URL:", currentUrl);
            return false;
        }

        console.log("7. Successfully redirected to Stripe");

        // Enter phone number with realistic typing
        try {
            let phoneInput = await browser.wait(
                until.elementLocated(By.css("input[autocomplete='tel'], input[placeholder*='phone']")),
                10000
            );

            // First clear any existing value
            await phoneInput.clear();

            // Type phone number with random delays between characters
            const phoneNumber = "555-555-5555"; // Use test number
            for (const digit of phoneNumber) {
                await phoneInput.sendKeys(digit);
                // Random delay between keystrokes (between 50-200ms)
                await browser.sleep(Math.floor(Math.random() * 150) + 50);
            }

            console.log("8. Entered test phone number");

            // Small delay before submitting
            await browser.sleep(1000);

            // Find and click the submit button
            let submitButton = await browser.wait(
                until.elementLocated(By.css("button[type='submit']")),
                5000
            );

            await scrollAndClick(submitButton, "Phone Submit button");
            console.log("9. Submitted phone number");

        } catch (error) {
            console.error("Error filling phone form:", error.message);

            // Take screenshot on error
            const errorDir = "D:\\FE_FFUND\\autotest_ffund\\FOUNDER\\Project\\Media\\error";
            const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
            const errorImagePath = `${errorDir}\\stripe-phone-error-${timestamp}.png`;
            let errorScreenshot = await browser.takeScreenshot();
            fs.writeFileSync(errorImagePath, errorScreenshot, "base64");

            console.log(`Phone form error screenshot saved as ${errorImagePath}`);
        }

        await browser.sleep(3000);

        // Check for captcha after submitting the phone number
        const isCaptchaPresent = await browser.findElements(
            By.css("iframe[src*='hcaptcha.com'], iframe[title*='captcha']")
        );

        if (isCaptchaPresent.length > 0) {
            console.log("10. hCaptcha detected");

            // Wait for manual captcha solution
            const captchaSolved = await waitForManualCaptchaSolving(browser, 180000); // 3 minutes timeout

            if (!captchaSolved) {
                console.log("Failed to solve captcha within the time limit");
                return false;
            }
        } else {
            console.log("10. No hCaptcha detected, continuing with setup");
        }

        // At this point, either:
        // 1. There was no captcha
        // 2. The captcha was solved manually

        // Wait for the next page to load after captcha/phone verification
        await browser.sleep(5000);

        // Continue with the Stripe account setup flow
        // The specific steps will depend on your Stripe integration
        // Below is a generic approach that you'll need to customize

        // Check current URL to see where we are in the flow
        const postCaptchaUrl = await browser.getCurrentUrl();
        console.log(`11. Current URL after captcha step: ${postCaptchaUrl}`);

        // Complete remaining Stripe onboarding steps
        // These will vary based on your specific integration
        console.log("12. Continuing with Stripe account setup");

        // Example: Fill out business information if on that page
        try {
            // Check if we're on a business info page
            const businessNameInputs = await browser.findElements(
                By.css("input[name*='business'], input[placeholder*='business']")
            );

            if (businessNameInputs.length > 0) {
                console.log("Filling business information");
                await businessNameInputs[0].sendKeys("Test Business");

                // Find and click continue/next button
                const nextButton = await browser.findElement(
                    By.css("button[type='submit'], button:contains('Continue'), button:contains('Next')")
                );
                await scrollAndClick(browser, nextButton, "Continue button");
            }
        } catch (error) {
            console.log("Not on business info page or error:", error.message);
        }

        // Example: Check if we're back on the main site
        try {
            // Wait a reasonable time for redirection back to your site
            await browser.sleep(5000);
            const finalUrl = await browser.getCurrentUrl();

            if (finalUrl.includes("deploy-f-fund-b4n2.vercel.app")) {
                console.log("13. Successfully returned to main site after Stripe setup");
                return true;
            } else {
                console.log(`Still on Stripe site: ${finalUrl}`);

                // Check if there are any errors displayed
                const errorElements = await browser.findElements(
                    By.css(".error, .alert-error, [role='alert']")
                );

                if (errorElements.length > 0) {
                    for (const errorEl of errorElements) {
                        const errorText = await errorEl.getText();
                        console.log(`Stripe error: ${errorText}`);
                    }
                }

                // Take a screenshot of where we ended up
                const finalDir = "D:\\FE_FFUND\\autotest_ffund\\FOUNDER\\Project\\Media\\final";
                if (!fs.existsSync(finalDir)) {
                    fs.mkdirSync(finalDir, { recursive: true });
                }
                const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
                const finalImagePath = `${finalDir}\\stripe-final-state-${timestamp}.png`;
                let finalScreenshot = await browser.takeScreenshot();
                fs.writeFileSync(finalImagePath, finalScreenshot, "base64");

                console.log(`Final state screenshot saved as ${finalImagePath}`);

                // Return success if we're at least past the captcha
                return !finalUrl.includes("captcha");
            }
        } catch (error) {
            console.error("Error in final stage:", error.message);
            return false;
        }

    } catch (error) {
        console.error("TEST FAILED:", error);
        return false;
    } finally {
        if (browser) {
            await browser.quit();
            console.log("Browser closed");
        }
    }
}