const { By, until } = require('selenium-webdriver');

async function viewCriteria(browser) {

    //List
    await browser.get('https://admin-ffund.vercel.app/app/criteria');
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/criteria'), 10000);
    console.log('Criteria List page loaded!');
    await browser.sleep(1000);

    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

    //Detail
    let eyeIcon = await browser.wait(until.elementLocated(By.xpath("(//a[contains(@title,'View')])[2]")), 10000);
    await eyeIcon.click();
    console.log('Clicked on EyeIcon for the second criteria to view details.');
    await browser.sleep(1000);

    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, -500);");
        await browser.sleep(1000);
    }
    //Back
    let backButton = await browser.wait(until.elementLocated(By.css("button[title='Go back']")), 10000);
    await backButton.click();
    console.log('Go back to list criteria');
    await browser.sleep(1000);

    //List Type
    await browser.get('https://admin-ffund.vercel.app/app/criteria-type');
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/criteria-type'), 10000);
    console.log('Criteria List page loaded!');
    await browser.sleep(1000);

    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

}

module.exports = { viewCriteria };
