var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;
var readline = require('readline');
var { loginInvestor } = require('../Login-Register/Login/loginHelper');


(async function testInvestMilestone() {
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
        let email = 'phamthuyduong99@gmail.com';
        let password = '123456';
        const isLoggedIn = await loginInvestor(browser, email, password);
        if (!isLoggedIn) {
            console.log('Login failed. Exiting test.');
            return;
        }

        await browser.sleep(5000);

        let contactButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Contact'])[1]")),
            10000
        );
        await contactButton.click();
        console.log('Contact button clicked!');

        let contactUrl = await browser.getCurrentUrl();
        console.log('Current URL:', contactUrl);

        if (contactUrl === 'https://deploy-f-fund-b4n2.vercel.app/contact') {
            console.log('Successfully navigated to Contact page!');
        } else {
            console.log('Failed to navigate to Contact page!');
        }

        await browser.sleep(2000);

        let contactForm = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='w-full max-w-2xl bg-white shadow-lg rounded-lg p-6'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", contactForm);
        await browser.sleep(2000);
        console.log('Contact form scrolled into view!');

        let requestTypeSelect = await browser.wait(
            until.elementLocated(By.xpath("(//select[@name='requestType'])[1]")),
            10000
        );
        await requestTypeSelect.click();
        await browser.sleep(2000);
        await requestTypeSelect.sendKeys('REPORT_BUG');
        console.log('Request type select clicked!');

        await browser.sleep(2000);

        let titleInput = await browser.wait(
            until.elementLocated(By.xpath("(//input[@placeholder='Enter the title'])[1]")),
            10000
        );
        await titleInput.click();
        await titleInput.sendKeys('Invest Project has bug!');
        console.log('Title input filled!');

        await browser.sleep(2000);

        let descriptionInput = await browser.wait(
            until.elementLocated(By.xpath("(//textarea[@placeholder='Enter the description'])[1]")),
            10000
        );
        await descriptionInput.click();
        await descriptionInput.sendKeys('I want to invest in project but it has bug!');
        console.log('Description input filled!');

        await browser.sleep(2000);

        const path = require('path');
        let uploadAttachment = await browser.wait(
            until.elementLocated(By.xpath("(//input[@name='attachment'])[1]")),
            10000
        );

        let filePath = path.resolve(__dirname, '../INVESTOR/test_request.png');
        await uploadAttachment.sendKeys(filePath);
        await browser.sleep(2000);
        console.log('Attachment uploaded:', filePath);

        await browser.sleep(2000);

        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Submit Request'])[1]")),
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

        await browser.sleep(15000);

    }catch (error) {
        console.error('Error during test execution:', error);
    }
    finally {
        await browser.quit();
    }
}
)();