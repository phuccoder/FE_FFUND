var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;

(async function testRegister() {
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
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('Window maximized!');

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
        let fullNameField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your full name']")),
            10000
        );
        await fullNameField.click();
        await fullNameField.clear();
        await fullNameField.sendKeys('PHUC FOUNDER');
        console.log('Full name entered successfully!');

        await browser.sleep(2000);

        let sendKeyEmail = 'phucnmtde170689@fpt.edu.vn';
        let senKeyPassword = '123456';

        let emailField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your email']")),
            10000
        );
        await emailField.click();
        await emailField.clear();
        await emailField.sendKeys(sendKeyEmail);
        console.log('Email entered successfully!');

        await browser.sleep(2000);
        let phoneNumberField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your phone number']")),
            10000
        );

        await phoneNumberField.click();
        await phoneNumberField.clear();
        await phoneNumberField.sendKeys('0123456789');
        console.log('Phone number entered successfully!');

        let studentCodeField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Enter your student code']")),
            10000
        );
        await studentCodeField.click();
        await studentCodeField.clear();
        await studentCodeField.sendKeys('DE170689');
        console.log('Student code entered successfully!');

        let exeClassSelector = await browser.wait(
            until.elementLocated(By.css("body > div:nth-child(1) > main:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > form:nth-child(2) > div:nth-child(5) > select:nth-child(2)")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView();", exeClassSelector);
        await browser.sleep(2000);
        await exeClassSelector.click();
        await browser.sleep(2000);

        // Chọn option EXE201 từ dropdown
        let exeClassOption = await browser.wait(
            until.elementLocated(By.xpath("//option[normalize-space()='EXE201']")),
            10000
        );
        await exeClassOption.click();
        console.log('Option EXE201 selected!');

        let fptFacilitySelector = await browser.wait(
            until.elementLocated(By.css("body > div:nth-child(1) > main:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > form:nth-child(2) > div:nth-child(6) > select:nth-child(2)")),
            10000
        );
        await fptFacilitySelector.click();
        await browser.sleep(2000);

        // Chọn option FPT University từ dropdown
        let fptFacilityOption = await browser.wait(
            until.elementLocated(By.xpath("//option[normalize-space()='HO CHI MINH']")),
            10000
        );
        await fptFacilityOption.click();
        console.log('Option FPT University selected!');

        await browser.sleep(2000);
        let passwordField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Create a password']")),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys(senKeyPassword);
        console.log('Password entered successfully!');

        let confirmPasswordField = await browser.wait(
            until.elementLocated(By.css("input[placeholder='Confirm your password']")),
            10000
        );
        await confirmPasswordField.click();
        await confirmPasswordField.clear();
        await confirmPasswordField.sendKeys(senKeyPassword);
        console.log('Confirm password entered successfully!');

        await browser.sleep(2000);

        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Create Account'])[1]")),
            10000
        );

        await submitButton.click();
        console.log('Submit button clicked!');
        await browser.sleep(5000);

        // Check toast message
        let toastMessage = await browser.wait(
            until.elementLocated(By.css("div[id='1']")),
            10000
        );
        let toastMessageText = await toastMessage.getText();
        console.log('Toast message:', toastMessageText);

        if (toastMessageText === 'Registration successful! Please check your email for verification instructions.') {
            console.log('Register successfully!');
            try {
                console.log('Opening Gmail...');
                await browser.get('https://mail.google.com/');
                await browser.sleep(2000);

                // Đăng nhập vào Gmail
                let emailField = await browser.wait(
                    until.elementLocated(By.css("input[type='email']")),
                    10000
                );
                await emailField.sendKeys(sendKeyEmail);
                await emailField.sendKeys(webdriver.Key.ENTER);
                console.log('Email entered.');

                await browser.sleep(5000);

                let passwordField = await browser.wait(
                    until.elementLocated(By.css("input[type='password']")),
                    10000
                );
                await passwordField.sendKeys('phuc8102003');
                await passwordField.sendKeys(webdriver.Key.ENTER);
                console.log('Password entered.');

                await browser.sleep(30000);

                let emailConfirmButton = await browser.wait(
                    until.elementLocated(By.xpath("//a[normalize-space()='Verify Email']")),
                    10000
                );
                await emailConfirmButton.click();
                console.log('Email confirmation button clicked.');

                await browser.sleep(40000);

                let handles = await browser.getAllWindowHandles();
                console.log('Window handles:', handles);

                await browser.switchTo().window(handles[handles.length - 1]);
                console.log('Switched to new tab.');

                let currentUrl = await browser.getCurrentUrl();
                console.log('Current URL on new tab:', currentUrl);
                if (currentUrl === 'https://deploy-f-fund-b4n2.vercel.app/login-register') {
                    let emailField = await browser.wait(
                        until.elementLocated(By.css('#email')),
                        10000
                    );
                    await emailField.click();
                    await browser.sleep(2000);
                    await emailField.clear();
                    await emailField.sendKeys(sendKeyEmail);

                    console.log('Email entered successfully!');

                    let passwordField = await browser.wait(
                        until.elementLocated(By.css('#password')),
                        10000
                    );
                    await passwordField.click();
                    await passwordField.clear();
                    await passwordField.sendKeys(senKeyPassword);

                    console.log('Password entered successfully!');

                    await browser.sleep(2000);
                    let submitButton = await browser.wait(
                        until.elementLocated(By.xpath("//button[normalize-space()='Sign in']")),
                        10000
                    );

                    await submitButton.click();
                    console.log('Submit button clicked!');
                    await browser.sleep(5000);

                    // Kiểm tra URL hiện tại
                    let currentUrl = await browser.getCurrentUrl();
                    if (currentUrl === 'https://deploy-f-fund-b4n2.vercel.app/login-register') {
                        console.log('Login failed: Still on login page.');
                        return;
                    }

                    if (currentUrl !== 'https://deploy-f-fund-b4n2.vercel.app/') {
                        console.log('Login failed: Unexpected URL:', currentUrl);
                        return;
                    }

                    try {
                        let userMenu = await browser.wait(
                            until.elementLocated(By.css("button[aria-label='User menu']")),
                            10000
                        );

                        if (await userMenu.isDisplayed()) {
                            console.log('User Menu is displayed. Login successful!');
                        } else {
                            console.log('Login failed: User menu not displayed.');
                            return;
                        }
                    } catch (err) {
                        console.error('Error during user menu check:', err);
                        return;
                    }

                    return;
                }
            } catch (err) {
                console.error('Error during email confirmation:', err);
            }
        } else {
            console.log('Registration failed:', toastMessageText);
        }
    } catch (err) {
        console.error('Error during test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();