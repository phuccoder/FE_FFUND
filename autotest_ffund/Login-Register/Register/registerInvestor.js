var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var fs = require('fs');
var path = require('path');
require('dotenv').config();
const { until, By } = require('selenium-webdriver'); 

// Đường dẫn đến thư mục profile Chrome
const userProfilePath = path.join(__dirname, 'chrome-profile');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(userProfilePath)) {
    fs.mkdirSync(userProfilePath, { recursive: true });
}

(async function testRegister() {
    let options = new chrome.Options()
        .addArguments(
            `--user-data-dir=${userProfilePath}`,
            '--profile-directory=Default',
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-web-security',
            '--disable-dev-shm-usage'
        )
        .excludeSwitches(['enable-automation'])
        .setUserPreferences({
            'credentials_enable_service': false,
            'profile.password_manager_enabled': false
        });

    let browser = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        console.log('Opened FFUND website.');

        await browser.sleep(2000);
        let button = await browser.wait(
            until.elementLocated(By.css('.main-btn.main-btn-2')),
            10000
        );
        await button.click();
        console.log('Button clicked!');

        let registerButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Register'])[1]")),
            10000
        );
        await registerButton.click();
        console.log('Register button clicked!');

        let investorButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Investor'])[1]")),
            10000
        );

        await investorButton.click();
        console.log('Investor button clicked!');

        await browser.sleep(2000);

        // Generate a unique email with timestamp to avoid duplicate registration
        const timestamp = new Date().getTime();
        const uniqueEmail = `thienphuc8102003@gmail.com`;

        let fullNameField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your full name']")),
            10000
        );
        await fullNameField.click();
        await fullNameField.clear();
        await fullNameField.sendKeys('PHUC INVESTOR');
        console.log('Full name entered successfully!');

        await browser.sleep(1000);

        let emailField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your email']")),
            10000
        );
        await emailField.click();
        await emailField.clear();
        await emailField.sendKeys(uniqueEmail);
        console.log('Email entered successfully:', uniqueEmail);

        await browser.sleep(1000);
        let phoneNumberField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your phone number']")),
            10000
        );

        await phoneNumberField.click();
        await phoneNumberField.clear();
        await phoneNumberField.sendKeys('0123456789');
        console.log('Phone number entered successfully!');

        let passwordField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Create a password']")),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys('123456');

        let confirmPasswordField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Confirm your password']")),
            10000
        );
        await confirmPasswordField.click();
        await confirmPasswordField.clear();
        await confirmPasswordField.sendKeys('123456');
        console.log('Password entered successfully!');

        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Create Account'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView();", submitButton);
        await browser.sleep(1000);
        await submitButton.click();
        console.log('Submit button clicked!');
        await browser.sleep(15000);

        // Check toast message
        let toastMessage = await browser.wait(
            until.elementLocated(By.css("div[id='1']")),
            10000
        );
        let toastMessageText = await toastMessage.getText();
        console.log('Toast message:', toastMessageText);

        if (toastMessageText.includes('Registration successful')) {
            console.log('Register successfully!');

            // Đi tới Gmail và đăng nhập
            await browser.get('https://accounts.google.com/signin');
            await browser.sleep(20000);

            try {
                // Kiểm tra xem có cần đăng nhập không
                const emailInput = await browser.wait(
                    until.elementLocated(By.css('input[type="email"]')),
                    10000
                );

                await emailInput.clear();
                await emailInput.sendKeys('thienphuc8102003@gmail.com');
                await browser.sleep(1000);

                const nextButton = await browser.findElement(By.xpath('//span[text()="Next" or text()="Tiếp theo"]'));
                await nextButton.click();
                await browser.sleep(2000);

                const passwordInput = await browser.wait(
                    until.elementLocated(By.css('input[type="password"]')),
                    10000
                );
                await passwordInput.sendKeys('phuc8102003');
                await browser.sleep(1000);

                const passwordNextButton = await browser.findElement(By.xpath('//span[text()="Next" or text()="Tiếp theo"]'));
                await passwordNextButton.click();

                console.log('Logged into Google account');
                await browser.sleep(5000);

            } catch (loginError) {
                console.log('Already logged in or login elements not found:', loginError.message);
            }

            // Đi tới Gmail
            await browser.get('https://mail.google.com/mail/u/0/#inbox');
            console.log('Opened Gmail inbox');
            await browser.sleep(20000);

            try {
                const verifyButton = await browser.wait(
                    until.elementLocated(By.xpath("(//a[normalize-space()='Verify Email'])[1]")),
                    10000
                );
                console.log('Found verify button, clicking it...');

                await browser.executeScript("arguments[0].click();", verifyButton);
                console.log('Clicked verify button');
                await browser.sleep(30000);

                let handles = await browser.getAllWindowHandles();
                await browser.switchTo().window(handles[handles.length - 1]);
                console.log('Switched to new tab:', await browser.getCurrentUrl());

                const currentUrl = await browser.getCurrentUrl();
                if (currentUrl.includes('deploy-f-fund-b4n2.vercel.app')) {
                    console.log('Successfully verified email and returned to FFUND');

                    if (currentUrl.includes('login-register')) {
                        console.log('On login page, attempting to log in');

                        let emailField = await browser.wait(
                            until.elementLocated(By.css('#email')),
                            10000
                        );
                        await emailField.clear();
                        await emailField.sendKeys(uniqueEmail);
                        console.log('Entered email for login');

                        let passwordField = await browser.wait(
                            until.elementLocated(By.css('#password')),
                            10000
                        );
                        await passwordField.clear();
                        await passwordField.sendKeys('123456');
                        console.log('Entered password for login');

                        let loginButton = await browser.wait(
                            until.elementLocated(By.xpath("//button[normalize-space()='Sign in']")),
                            10000
                        );
                        await loginButton.click();
                        console.log('Clicked login button');
                        await browser.sleep(5000);

                        const loggedInUrl = await browser.getCurrentUrl();
                        if (!loggedInUrl.includes('login-register')) {
                            console.log('Login successful!');
                        } else {
                            console.log('Login failed, still on login page');
                        }
                    } else {
                        console.log('Already logged in or redirected to another page');
                    }
                } else {
                    console.log('Verification might have failed, ended up at unexpected URL:', currentUrl);
                }
            } catch (emailError) {
                console.error('Error finding or processing verification email:', emailError);
            }
        } else {
            console.log('Registration failed:', toastMessageText);
        }
    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        console.log('Test completed. Keeping browser open for 10 seconds...');
        await browser.sleep(10000);
        await browser.quit();
        console.log('Browser closed.');
    }
})();