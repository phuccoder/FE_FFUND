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
                '--disable-dev-shm-usage',
                '--disable-extensions'
            )
        )
        .build();

    try {
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('Window maximized!');

        await browser.sleep(2000);
        let email = 'nguyenvanbao234@gmail.com';
        let password ='123456';
        await loginInvestor(browser, email, password);

        await browser.sleep(5000);

        let exploreProjectButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[contains(text(),'Projects')])[1]")),
            10000
        );
        await exploreProjectButton.click();
        console.log('Explore project button clicked!');

        await browser.sleep(7000);

        // Like project
        let likeProjectButton = await browser.wait(
            until.elementLocated(By.xpath("(//div[@class='icon'])[1]")),
            10000
        );

        let likeCountElement = await browser.wait(
            until.elementLocated(By.xpath("(//span[normalize-space()='1'])[1]")),
            10000
        );
        let initialLikeCount = parseInt(await likeCountElement.getText(), 10);
        console.log('Initial like count:', initialLikeCount);

        await likeProjectButton.click();
        console.log('Like project button clicked!');

        await browser.sleep(1000);

        let updatedLikeCount = parseInt(await likeCountElement.getText(), 10);
        console.log('Updated like count:', updatedLikeCount);

        if (updatedLikeCount === initialLikeCount + 1) {
            console.log('The like count increased by 1. Like action successful!');
        } else {
            console.log('The like count did not increase as expected.');
        }

        await browser.sleep(2000);

        //Comment project
        let commentButton = await browser.wait(
            until.elementLocated(By.xpath("(//a[@role='tab'])[5]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", commentButton);
        await browser.sleep(2000);
        await commentButton.click();
        console.log('Comment button clicked!');

        await browser.sleep(2000);

        let commentInput = await browser.wait(
            until.elementLocated(By.xpath("(//textarea[@placeholder='Share your thoughts about this project...'])[1]")),
            10000
        );
        await browser.executeScript("arguments[0].scrollIntoView({ block: 'center', inline: 'nearest' });", commentInput);
        await browser.sleep(1500);
        await commentInput.click();
        await commentInput.clear();
        await commentInput.sendKeys('Love this project!');
        console.log('Comment entered successfully!');

        await browser.sleep(2000);

        let submitCommentButton = await browser.wait(
            until.elementLocated(By.xpath("(//button[@class='ant-btn css-1v5z42l ant-btn-primary ant-btn-color-primary ant-btn-variant-solid'])[1]")),
            10000
        );
        await submitCommentButton.click();
        console.log('Submit comment button clicked!');

        await browser.sleep(5000);

    } catch (error) {
        console.error('Error during test:', error);
    }
    finally {
        await browser.quit();
    }

})();