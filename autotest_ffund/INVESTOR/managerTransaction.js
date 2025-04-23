var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;
var readline = require('readline');
var { loginInvestor } = require('../Login-Register/Login/loginHelper');


(async function testManagerTransaction() {
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
        let email = 'phamthuyduong99@gmail.com';
        let password = '123456';
        const isLoggedIn = await loginInvestor(browser, email, password);
        if (!isLoggedIn) {
            console.log('Login failed. Exiting test.');
            return;
        }

        await browser.sleep(2000);

        let userMenuButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[@aria-label='User menu'])[1]")),
            10000
        );
        await userMenuButton.click();
        console.log('User menu button clicked!');

        await browser.sleep(2000);

        let managerTransactionButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Transaction'])[1]")),
            10000
        );
        await managerTransactionButton.click();
        console.log('Manage Transaction button clicked!');

        await browser.sleep(2000);
        
        let transactionUrl = await browser.getCurrentUrl();
        console.log('Current URL:', transactionUrl);

        if (transactionUrl === 'https://deploy-f-fund-b4n2.vercel.app/transaction') {
            console.log('Successfully navigated to Manage Transaction page!');
        }
        else {
            console.log('Failed to navigate to Manage Transaction page!');
        }

        await browser.sleep(2000);

        let transactionStatusSelect = await browser.wait(
            until.elementLocated(By.xpath("(//select[@id='statusFilter'])[1]")),
            10000
        );
        await transactionStatusSelect.click();
        await browser.sleep(2000);
        await transactionStatusSelect.sendKeys('Paid');
        console.log('Transaction status select clicked!');

        await browser.sleep(2000);

        let applyFilterButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Apply Filters'])[1]")),
            10000
        );
        await applyFilterButton.click();
        console.log('Apply filter button clicked!');

        await browser.sleep(2000);

        let totalTransaction = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500'])[1]")),
            10000
        );
        let totalTransactionText = await totalTransaction.getText();
        console.log('Total Transaction:', totalTransactionText);

        let totalAmount = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500'])[1]")),
            10000
        );
        let totalAmountText = await totalAmount.getText();
        console.log('Total Amount:', totalAmountText);

        await browser.sleep(2000);
    } catch (error) {
        console.error('Error:', error);
    }
    finally {
        await browser.quit();
    }
})();