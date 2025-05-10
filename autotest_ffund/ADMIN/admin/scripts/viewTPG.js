const { By, until } = require('selenium-webdriver');

async function viewTPG(browser) {

    //Transactions
    let Transactions = await browser.wait(until.elementLocated(By.xpath("//a[@href='/app/transactions']")), 10000);
    await Transactions.click();
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/transactions'), 10000);
    console.log('Transactions page loaded!');
    await browser.sleep(1500);

    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

    //Phase Rules
    let PhaseRules = await browser.wait(until.elementLocated(By.xpath("//a[@href='/app/phase-rules']")), 10000);
    await PhaseRules.click();
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/phase-rules'), 10000);
    console.log('Phase Rules page loaded!');
    await browser.sleep(1500);

    for (let i = 0; i < 2; i++) {
      await browser.executeScript("window.scrollBy(0, 500);");
      await browser.sleep(1000);
    }

    //Global settings
    let GlobalSettings = await browser.wait(until.elementLocated(By.xpath("//a[@href='/app/global-settings']")), 10000);
    await GlobalSettings.click();
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/global-settings'), 10000);
    console.log('Global Settings page loaded!');
    await browser.sleep(1500);

    for (let i = 0; i < 2; i++) {
      await browser.executeScript("window.scrollBy(0, 500);");
      await browser.sleep(1000);
    }

}

module.exports = { viewTPG };
