var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;

async function loginInvestor(browser, email, password) {
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

        let emailField = await browser.wait(
            until.elementLocated(By.css('#email')),
            10000
        );
        await emailField.click();
        await browser.sleep(2000);
        await emailField.clear();
        await emailField.sendKeys(email);
        console.log('Email entered successfully!');

        let passwordField = await browser.wait(
            until.elementLocated(By.css('#password')),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys(password);
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
            return false;
        }

        if (currentUrl !== 'https://deploy-f-fund-b4n2.vercel.app/') {
            console.log('Login failed: Unexpected URL:', currentUrl);
            return false;
        }

        console.log('Login successful!');
        return true;
    } catch (err) {
        console.error('Error during login:', err);
        return false;
    }
}

async function loginFounder(browser, email, password) {
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

        let emailField = await browser.wait(
            until.elementLocated(By.css('#email')),
            10000
        );
        await emailField.click();
        await browser.sleep(2000);
        await emailField.clear();
        await emailField.sendKeys(email);
        console.log('Email entered successfully!');

        let passwordField = await browser.wait(
            until.elementLocated(By.css('#password')),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys(password);
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
            return false;
        }

        if (currentUrl !== 'https://deploy-f-fund-b4n2.vercel.app/') {
            console.log('Login failed: Unexpected URL:', currentUrl);
            return false;
        }

        console.log('Login successful!');
        return true;
    } catch (err) {
        console.error('Error during login:', err);
        return false;
    }
    
}

module.exports = { loginInvestor, loginFounder };