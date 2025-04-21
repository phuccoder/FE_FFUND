var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var By = webdriver.By;
var until = webdriver.until;
var readline = require('readline');
var { loginInvestor } = require('../Login-Register/Login/loginHelper');

function pauseForUserInput() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Test đang tạm dừng. Nhập "continue" để tiếp tục: ', (answer) => {
            if (answer.toLowerCase() === 'continue') {
                rl.close();
                resolve();
            } else {
                console.log('Vui lòng nhập "continue" để tiếp tục.');
                rl.close();
                resolve(pauseForUserInput());
            }
        });
    });
}

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
        const isLoggedIn = await loginInvestor(browser, 'thienphuc8102003@gmail.com', '123456');
        if (!isLoggedIn) {
            console.log('Login failed. Exiting test.');
            return;
        }

        console.log('Proceeding with invest milestone test...');

        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('Window maximized!');

        await browser.sleep(2000);

       let exploreProjectButton = await browser.wait(
           until.elementLocated(By.xpath("(//a[contains(text(),'Projects')])[1]")),
            10000
        );
        await exploreProjectButton.click();
        console.log('Explore project button clicked!');

        await browser.sleep(7000);

        // wait for use choose project
        await pauseForUserInput();

        let backProjectButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[normalize-space()='Back this project'])[1]")),
            10000
        );
        await backProjectButton.click();
        console.log('Back project button clicked!');

        await browser.sleep(5000);

        

        let agreeTermButton = await browser.wait(
            until.elementLocated(By.xpath("(//input[@id='termsAgreement'])[1]")),
            10000
        );
        await agreeTermButton.click();
        console.log('Agree term button clicked!');

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
        
        await pauseForUserInput();

        let paymentButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[normalize-space()='Complete Payment'])[1]")),
            10000
        );
        await paymentButton.click();
        console.log('Payment button clicked!');
        await browser.sleep(2000);

        await pauseForUserInput();
        await browser.sleep(2000);

        let currentUrl = await browser.getCurrentUrl();
        console.log('Current URL:', currentUrl);

        if (currentUrl === 'https://deploy-f-fund-b4n2.vercel.app/reward') {
            console.log('Payment successful! Redirected to reward page.');

            // Kiểm tra phần My Rewards
            let myRewards = await browser.wait(
                until.elementLocated(By.xpath("(//div[@class='bg-white rounded-lg shadow-md p-4 mb-6'])[1]")),
                10000
            );
            console.log('My Rewards section found.');

            // Log thông tin phần thưởng
            let rewardItems = await browser.findElements(By.xpath("(//div[@class='p-3 rounded-md cursor-pointer transition-colors bg-blue-100 border-blue-300 border '])"));
            for (let i = 0; i < rewardItems.length; i++) {
                let rewardText = await rewardItems[i].getText();
                console.log(`Reward ${i + 1}: ${rewardText}`);
            }

            // Chờ 5 giây và kiểm tra phần reward đang được chọn
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

                // Nhấn nút Add New Address
                let addNewAddressButton = await browser.wait(
                    until.elementLocated(By.xpath("(//button[normalize-space()='Add New Address'])[1]")),
                    10000
                );
                await addNewAddressButton.click();
                console.log('Add New Address button clicked.');

                // Kiểm tra modal Add New Address
                let modalTitle = await browser.wait(
                    until.elementLocated(By.xpath("//h2[normalize-space()='Add New Address']")),
                    10000
                );
                if (await modalTitle.isDisplayed()) {
                    console.log('Add New Address modal displayed.');

                    // Nhập thông tin địa chỉ
                    let addressInput = await browser.wait(
                        until.elementLocated(By.xpath("(//input[@placeholder='Enter detailed address'])[1]")),
                        10000
                    );
                    await addressInput.sendKeys("1 đường số 9");
                    console.log('Address entered.');

                    let provinceSelect = await browser.wait(
                        until.elementLocated(By.xpath("(//select[@class='form-select'])[1]")),
                        10000
                    );
                    await provinceSelect.click();
                    await provinceSelect.sendKeys("Hồ Chí Minh");
                    console.log('Province selected.');

                    let districtSelect = await browser.wait(
                        until.elementLocated(By.xpath("(//select[@class='form-select'])[2]")),
                        10000
                    );
                    await districtSelect.click();
                    await districtSelect.sendKeys("Thủ Đức");
                    console.log('District selected.');

                    let wardSelect = await browser.wait(
                        until.elementLocated(By.xpath("(//select[@class='form-select'])[3]")),
                        10000
                    );
                    await wardSelect.click();
                    await wardSelect.sendKeys("Tam Bình");
                    console.log('Ward selected.');

                    let noteInput = await browser.wait(
                        until.elementLocated(By.xpath("(//input[@placeholder='Enter note (optional)'])[1]")),
                        10000
                    );
                    await noteInput.sendKeys("Nhà màu xanh");
                    console.log('Note entered.');

                    // Nhấn nút Save Address
                    let saveAddressButton = await browser.wait(
                        until.elementLocated(By.xpath("(//button[normalize-space()='Save Address'])[1]")),
                        10000
                    );
                    await saveAddressButton.click();
                    console.log('Save Address button clicked.');

                    // Chờ 10 giây và kiểm tra lại phần địa chỉ
                    await browser.sleep(10000);
                    let addressCheck = await browser.wait(
                        until.elementLocated(By.xpath("(//div[@class='bg-white rounded-lg shadow-md p-4 mt-6'])[1]")),
                        10000
                    );
                    if (await addressCheck.isDisplayed()) {
                        console.log('Address successfully added.');
                    } else {
                        console.log('Address not found after saving.');
                    }
                }
            } else {
                console.log('Address found:', addressText);
            }
        }

        await pauseForUserInput();
        await browser.sleep(2000);

        // Kiểm tra lại phần reward đang được chọn
        let updatedSelectedReward = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='p-6'])[1]")),
            10000
        );
        let updatedSelectedRewardText = await updatedSelectedReward.getText();
        console.log('Updated Selected Reward:', updatedSelectedRewardText);

        // Kiểm tra phần mới: Shipping timeline
        let shippingInfo = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'])[1]")),
            10000
        );
        let shippingTimeline = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='relative'])[1]")),
            10000
        );
        let shippingTimelineText = await shippingTimeline.getText();
        console.log('Shipping Info:', await shippingInfo.getText());
        console.log('Shipping Timeline:', shippingTimelineText);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        console.log('Test completed. Closing browser...');
        await browser.quit();
    }
})();