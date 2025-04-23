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

       let exploreProjectButton = await browser.wait(
           until.elementLocated(By.xpath("(//a[contains(text(),'Projects')])[1]")),
            10000
        );
        await exploreProjectButton.click();
        console.log('Explore project button clicked!');

        await browser.sleep(20000);

        let backProjectButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Back this project'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", backProjectButton);
        await browser.sleep(2000);
        await backProjectButton.click();
        console.log('Back project button clicked!');

        await browser.sleep(5000);

        let agreeTermButton = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='termsAgreement'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", agreeTermButton);
        await browser.sleep(2000);
        await agreeTermButton.click();
        console.log('Agree term button clicked!');

        await browser.sleep(2000);

        let processButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Proceed to Phase Selection'])[1]")),
            10000
        );
        await processButton.click();
        console.log('Process button clicked!');

        await browser.sleep(2000);

        let phaseElements = await browser.wait(
            until.elementsLocated(By.xpath("//div[@class='border p-5 rounded-lg cursor-pointer transition-all border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow']")),
            10000
        );

        console.log(`Found ${phaseElements.length} phase elements.`);

        // Duyệt qua từng thẻ phase để kiểm tra text "PROCESS"
        for (let i = 0; i < phaseElements.length; i++) {
            try {
                let processSpan = await phaseElements[i].findElement(By.xpath(".//span[@class='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800']"));
                let spanText = await processSpan.getText();

                if (spanText.trim() === "PROCESS") {
                    console.log(`Phase ${i + 1} contains the text "PROCESS".`);

                    let selectButton = await phaseElements[i].findElement(By.xpath(".//button[normalize-space()='Select']"));
                    await selectButton.click();
                    console.log(`Clicked "Select" button for phase ${i + 1}.`);
                    break;
                }
            } catch (error) {
                console.log(`Phase ${i + 1} does not contain the text "PROCESS".`);
            }
        }
        
        await browser.sleep(20000);

        let paymentButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Complete Payment'])[1]")),
            10000
        );
        await paymentButton.click();
        console.log('Payment button clicked!');
        await browser.sleep(2000);

        let enterMail = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='email'])[1]")),
            10000
        );
        await enterMail.click();
        await enterMail.clear();
        await enterMail.sendKeys(email);
        console.log('Email entered successfully!');

        await browser.sleep(5000);

        let cardNumber = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='cardNumber'])[1]")),
            10000
        );
        await cardNumber.click();
        await cardNumber.clear();
        await cardNumber.sendKeys('4242 4242 4242 4242');
        console.log('Card number entered successfully!');

        let cardExpiry = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='cardExpiry'])[1]")),
            10000
        );
        await cardExpiry.click();
        await cardExpiry.clear();
        await cardExpiry.sendKeys('12/34');
        console.log('Card expiry date entered successfully!');

        let cardCvc = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='cardCvc'])[1]")),
            10000
        );
        await cardCvc.click();
        await cardCvc.clear();
        await cardCvc.sendKeys('567');
        console.log('Card CVC entered successfully!');

        let cardHolderName = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='billingName'])[1]")),
            10000
        );
        await cardHolderName.click();
        await cardHolderName.clear();
        await cardHolderName.sendKeys('Zhang San');
        console.log('Card holder name entered successfully!');

        let payButton = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='SubmitButton-IconContainer'])[1]")),
            10000
        );
        await payButton.click();
        console.log('Pay button clicked!');

        await browser.sleep(10000);

        let paymentURL = await browser.getCurrentUrl();
        console.log('Current URL:', paymentURL);

        let paymentSuccessMessage = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='pt-20 text-center card-header'])[1]")),
            10000
        );
        let paymentSuccessText = await paymentSuccessMessage.getText();
        console.log('Payment success message:', paymentSuccessText);
        if (paymentSuccessText.includes('Payment Successful')) {
            console.log('Payment was successful!');
        } else {
            console.log('Payment was not successful. Please check the payment details.');
        }
        await browser.sleep(2000);

        let managerRewardButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Manage Rewards & Shipping'])[1]")),
            10000
        );
        await managerRewardButton.click();
        console.log('Manage Rewards & Shipping button clicked!');

        await browser.sleep(10000);

        let currentUrl = await browser.getCurrentUrl();
        console.log('Current URL:', currentUrl);

        if (currentUrl === 'https://deploy-f-fund-b4n2.vercel.app/reward') {
            console.log('Payment successful! Redirected to reward page.');

            let myRewards = await browser.wait(
                until.elementLocated(By.xpath("(//div[@class='bg-white rounded-lg shadow-md p-4 mb-6'])[1]")),
                10000
            );
            if (await myRewards.isDisplayed()) {
            console.log('My Rewards section found.');
            } else {
                console.log('My Rewards section not found.');
            }
            await browser.sleep(2000);

            // Log thông tin phần thưởng
            let rewardItems = await browser.findElements(By.xpath("(//div[@class='p-3 rounded-md cursor-pointer transition-colors bg-blue-100 border-blue-300 border '])"));
            for (let i = 0; i < rewardItems.length; i++) {
                let rewardText = await rewardItems[i].getText();
                console.log(`Reward ${i + 1}: ${rewardText}`);
            }

            await browser.sleep(5000);
            let selectedReward = await browser.wait(
                until.elementLocated(By.xpath("(//div[@class='p-6'])[1]")),
                10000
            );
            let selectedRewardText = await selectedReward.getText();
            console.log('Selected Reward:', selectedRewardText);

            // Kiểm tra phần Address
            let addressSection = await browser.wait(
                until.elementLocated(By.xpath("(//div)[54]")),
                10000
            );
            let addressText = await addressSection.getText();
            if (addressText.includes('No addresses found')) {
                console.log('No addresses found.');
            } else {
                console.log('Address found:', addressText);
            }
        }

        await browser.sleep(2000);

        let userMenuButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[@aria-label='User menu'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", userMenuButton);
        await browser.sleep(2000);
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
    } finally {
        console.log('Test completed. Closing browser...');
        await browser.quit();
    }
})();