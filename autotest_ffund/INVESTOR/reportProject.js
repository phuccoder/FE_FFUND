var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;
var readline = require('readline');
var { loginInvestor } = require('../Login-Register/Login/loginHelper');


(async function testReportProject() {
    let browser = new webdriver.Builder()
        .forBrowser('chrome')
        .setChromeOptions(
            new chrome.Options().addArguments(
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--enable-unsafe-swiftshader'
            )
        )
        .build();

    try {
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('Window maximized!');

        await browser.sleep(2000);
        let email = 'phamthuyduong99@gmail.com';
        let password = '123456';
        const isLoggedIn = await loginInvestor(browser, email, password);
        if (!isLoggedIn) {
            console.log('Login failed. Exiting test.');
            return;
        }

        await browser.sleep(5000);

        let exploreProjectButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[contains(text(),'Projects')])[1]")),
            10000
        );
        await exploreProjectButton.click();
        console.log('Explore project button clicked!');

        await browser.sleep(15000);

        let reportButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Report this Project to FFUND'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", reportButton);
        await browser.sleep(3000);
        await reportButton.click();
        console.log('Report button clicked!');

        await browser.sleep(3000);

        let reportForm = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='bg-white rounded-lg shadow-lg p-6 mb-8'])[1]")),
            10000
        );
        await reportForm.isDisplayed();
        console.log('Report form is displayed!');

        await browser.sleep(2000);

        let reportCategorySelect = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='border rounded-lg p-3 cursor-pointer transition-colors border-gray-200 hover:border-gray-300'])[1]")),
            10000
        );
        await reportCategorySelect.click();
        console.log('Report category select clicked!');

        await browser.sleep(2000);

        let continueButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Continue'])[1]")),
            10000
        );
        await continueButton.click();
        console.log('Continue button clicked!');

        await browser.sleep(2000);

        let reportIssueSelect = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='border rounded-lg p-3 cursor-pointer transition-colors border-gray-200 hover:border-gray-300'])[1]")),
            10000
        );
        await reportIssueSelect.click();
        console.log('Report issue select clicked!');
        await browser.sleep(2000);

        continueButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Continue'])[1]")),
            10000
        );
        await continueButton.click();
        console.log('Continue button clicked again!');

        await browser.sleep(2000);

        let reportTitle = await browser.wait(
            until.elementLocated(By.xpath("(//input[@placeholder='Brief title of the issue'])[1]")),
            10000
        );
        await reportTitle.click();
        await reportTitle.sendKeys('Report Project');
        console.log('Report title input filled!');

        await browser.sleep(2000);

        let reportDescription = await browser.wait(
            until.elementLocated(By.xpath("(//textarea[@placeholder='Please provide detailed information about the issue'])[1]")),
            10000
        );
        await reportDescription.click();
        await reportDescription.sendKeys('This project have content violation, especially in story');
        console.log('Report description input filled!');

        await browser.sleep(2000);

        const path = require('path');
        let fileInput = await browser.wait(
            until.elementLocated(By.xpath("//input[@type='file' and @id='file-upload']")),
            10000
        );
        await fileInput.isDisplayed();
        await browser.sleep(1000);

        const filePath = path.resolve(__dirname, '../INVESTOR/test_request.png');
        await fileInput.sendKeys(filePath);
        console.log('Attachment uploaded:', filePath);


        await browser.sleep(2000);

        let reviewButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Review'])[1]")),
            10000
        );
        await reviewButton.click();
        console.log('Review button clicked!');

        await browser.sleep(6000);

        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Submit Report'])[1]")),
            10000
        );
        await submitButton.click();
        console.log('Submit button clicked!');
        await browser.sleep(7000);

        let userMenuButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[@aria-label='User menu'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", userMenuButton);
        await browser.sleep(2000);
        await userMenuButton.click();
        console.log('User menu button clicked!');

        let manageRequestButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Request/Report'])[1]")),
            10000
        );
        await manageRequestButton.click();
        console.log('Manage Request button clicked!');

        await browser.sleep(2000);

        let requestUrl = await browser.getCurrentUrl();
        console.log('Current URL:', requestUrl);

        if (requestUrl === 'https://deploy-f-fund-b4n2.vercel.app/request-report') {
            console.log('Successfully navigated to Manage Request page!');
        } else {
            console.log('Failed to navigate to Manage Request page!');
        }

        await browser.sleep(5000);

        let reportSelect = await browser.wait(
            until.elementLocated(By.xpath("(//div[@id='rc-tabs-3-tab-2'])[1]")),
            10000
        );
        await reportSelect.click();
        console.log('Report select clicked!');

        await browser.sleep(15000);

    } catch (error) {
        console.error('Error during test execution:', error);
    }
    finally {
        await browser.quit();
        console.log('Browser closed.');
    }
})();