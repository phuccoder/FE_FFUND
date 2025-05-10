const { By, until } = require('selenium-webdriver');

async function viewCategory(browser) {
    let teamLink = await browser.wait(until.elementLocated(By.xpath("//a[@href='/app/category']")), 10000);
    await teamLink.click();
    console.log('Navigated to Category page.');

    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/category'), 10000);
    console.log('Category page loaded!');
    await browser.sleep(1500);

    let teamOne = await browser.wait(until.elementLocated(By.xpath("//h3[normalize-space()='Technology']")), 10000);
    await teamOne.click();
    console.log('Clicked to view category.');
    await browser.sleep(2000);

    for (let i = 0; i < 2; i++) {
      await browser.executeScript("window.scrollBy(0, 500);");
      await browser.sleep(1000);
    }

}

module.exports = { viewCategory };
