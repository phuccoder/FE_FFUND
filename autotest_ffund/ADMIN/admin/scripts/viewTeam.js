const { By, until } = require('selenium-webdriver');

async function viewTeam(browser) {
    let teamLink = await browser.wait(until.elementLocated(By.xpath("//a[@href='/app/team']")), 10000);
    await teamLink.click();
    console.log('Navigated to Team page.');

    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/team'), 10000);
    console.log('Team page loaded!');
    await browser.sleep(1500);

    let teamOne = await browser.wait(until.elementLocated(By.css("a[href='/app/team-detail/1']")), 10000);
    await teamOne.click();
    console.log('Clicked to view teamOne.');

    for (let i = 0; i < 2; i++) {
      await browser.executeScript("window.scrollBy(0, 500);");
      await browser.sleep(1500);
    }
    // Tìm và click vào nút "Eye" để mở modal member detail
    let eyeButton = await browser.wait(until.elementLocated(By.xpath("//li[contains(., 'Thế Việt')]//button[contains(@class, 'text-primary')]")), 10000);
    await eyeButton.click();
    console.log('Clicked on Eye button to open member detail modal for Thế Việt.');
    await browser.sleep(1500);

    let cancel = await browser.wait(until.elementLocated(By.xpath("//button[@class='btn btn-ghost text-gray-400 hover:text-gray-600']")), 10000)
    await cancel.click();
    console.log('Close modal');
    await browser.sleep(1500);

    for (let i = 0; i < 1; i++) {
      await browser.executeScript("window.scrollBy(0, -500);");
      await browser.sleep(1500);
    }
    //Back
    let backButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Back']")), 10000);
    await backButton.click();
    console.log('Go back to list criteria');
    await browser.sleep(1000);

}

module.exports = { viewTeam };
