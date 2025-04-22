var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;
var readline = require('readline');
var { loginInvestor } = require('../Login-Register/Login/loginHelper');

(async function testManagerReward() {
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

        let userMenuButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[@aria-label='User menu'])[1]")),
            10000
        );
        await userMenuButton.click();
        console.log('User menu button clicked!');

        let managerRewardButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Manage Reward'])[1]")),
            10000
        );
        await managerRewardButton.click();
        console.log('Manage Reward button clicked!');

        await browser.sleep(5000);

        let rewardUrl = await browser.getCurrentUrl();
        console.log('Current URL:', rewardUrl);
        if (rewardUrl === 'https://deploy-f-fund-b4n2.vercel.app/reward') {
            console.log('Successfully navigated to Manage Reward page!');
        }
        else {
            console.log('Failed to navigate to Manage Reward page!');
        }

        await browser.sleep(2000);

        let newestReward = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='bg-white rounded-lg shadow-md p-4 mb-6'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", newestReward);
        await browser.sleep(2000);
        await newestReward.click();
        console.log('Newest reward clicked!');

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

        await browser.sleep(2000);

        let addAddressButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Add New Address'])[1]")),
            10000
        );
        await addAddressButton.click();
        console.log('Add New Address button clicked!');

        await browser.sleep(2000);

        let addressEnter = await browser.wait(
            until.elementLocated(By.xpath("(//input[@placeholder='Enter detailed address'])[1]")),
            10000
        );
        await addressEnter.click();
        await addressEnter.sendKeys('26 Lê Văn Việt');
        console.log('Address entered successfully!');

        let selectProvinces = await browser.wait(
            until.elementLocated(By.xpath("(//select)[1]")),
            10000
        );
        await selectProvinces.click();
        await selectProvinces.sendKeys('Hồ Chí Minh');
        console.log('Hồ Chí Minh selected successfully!');

        await browser.sleep(2000);

        let selectDistricts = await browser.wait(
            until.elementLocated(By.xpath("(//select)[2]")),
            10000
        );
        await selectDistricts.click();
        await browser.sleep(2000);
        await selectDistricts.sendKeys('Thủ Đức');
        console.log('Thủ Đức selected successfully!');

        await browser.sleep(2000);

        let selectWards = await browser.wait(
            until.elementLocated(By.xpath("(//select)[3]")),
            10000
        );
        await selectWards.click();
        await browser.sleep(2000);
        await selectWards.sendKeys('Tăng Nhơn Phú A');
        console.log('Tăng Nhơn Phú A selected successfully!');

        await browser.sleep(2000);

        let noteAddress = await browser.wait(
            until.elementLocated(By.xpath("(//input[@placeholder='Enter note (optional)'])[1]")),
            10000
        );
        await noteAddress.click();
        await browser.sleep(2000);
        await noteAddress.sendKeys('Nhà cửa màu xanh');
        console.log('Note address entered successfully!');

        let saveAddressButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Save Address'])[1]")),
            10000
        );
        await saveAddressButton.click();
        console.log('Save Address button clicked!');

        await browser.sleep(2000);

        let addressListContainer = await browser.wait(
            until.elementLocated(By.xpath("(//div)[54]")),
            10000
        );
        let addressItems = await addressListContainer.findElements(By.xpath(".//div[@class='border p-3 rounded-md cursor-pointer border-blue-500 bg-blue-50']"));

        let expectedAddress = "26 Lê Văn Việt, Thủ Đức, Hồ Chí Minh";

        let addressFound = false;
        for (let addressItem of addressItems) {
            let addressText = await addressItem.getText();
            console.log("Address found:", addressText);

            if (addressText.includes(expectedAddress)) {
                addressFound = true;
                console.log("Address matches the expected input!");
                break;
            }
        }
        if (!addressFound) {
            console.log("Address not found in the list!");
        }

        await browser.sleep(2000);

        let saveShippingButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Save Shipping Information'])[1]")),
            10000
        );
        await saveShippingButton.click();
        console.log('Save Shipping Information button clicked!');

        let shippingSuccessMessage = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='mt-4 p-3 bg-green-50 border border-green-200 rounded-md'])[1]")),
            10000
        );
        let shippingMessageText = await shippingSuccessMessage.getText();
        console.log('Shipping Success Message:', shippingMessageText);
        
        let refreshButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Refresh'])[1]")),
            10000
        );
        await refreshButton.click();
        console.log('Refresh button clicked!');

        await browser.sleep(2000);

        let shippingTimeline = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'])[1]")),
            10000
        );
        let shippingTimelineText = await shippingTimeline.getText();
        console.log('Shipping Timeline:', shippingTimelineText);

        let shippingTimelineItems = await shippingTimeline.findElements(By.xpath("(//div[@class='mt-4 pt-4 border-t border-blue-200'])[1]"));
        if (shippingTimelineItems.length > 0) {
            console.log('Shipping Timeline Items found!');
            for (let item of shippingTimelineItems) {
                let itemText = await item.getText();
                console.log('Shipping Timeline Item:', itemText);
            }
        } else {
            console.log('Shipping Timeline Items not found!');
        }


    } catch (error) {
        console.error('Error during test execution:', error);
    }
    finally {
        await browser.quit();
    }
})();
