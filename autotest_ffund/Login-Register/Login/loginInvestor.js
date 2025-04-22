var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

(async function testLogin() {
    let browser = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
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

        let sendKeyEmail = 'thienphuc8102003@gmail.com';
        let senKeyPassword = '123456';

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

        console.log('URL is correct. Proceeding to check userMenu and localStorage.');

        // Kiểm tra nút userMenu
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

        // Kiểm tra localStorage field "role"
        let role = await browser.executeScript("return localStorage.getItem('role');");
        if (role) {
            console.log(`Role found in localStorage: ${role}`);
            if (role === 'INVESTOR') {
                console.log('Login successful as INVESTOR!');
            } else if (role === 'FOUNDER') {
                console.log('Login failed: Logged in with the wrong account type (FOUNDER).');
            } else {
                console.log(`Login failed: Unexpected role - ${role}`);
            }
        } else {
            console.log('Login failed: No role found in localStorage.');
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