const { By, until } = require('selenium-webdriver');

async function viewProject(browser) {

    //List
    await browser.get('https://admin-ffund.vercel.app/app/project-list');
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/project-list'), 10000);
    console.log('Project List page loaded!');

    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1500);
    }

    //Detail
    await browser.get('https://admin-ffund.vercel.app/app/project-details/1');
    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/project-details/1'), 10000);
    console.log('Project Detail page loaded!');

    for (let i = 0; i < 4; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

    // Story 
    let storyButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Story']")), 10000);
    await storyButton.click();
    console.log('Clicked storyButton.');
    for (let i = 0; i < 6; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

    // Updates
    let updateButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Updates']")), 10000);
    await updateButton.click();
    console.log('Clicked updateButton.');
    await browser.sleep(1500);
    
    //Phase & Milestone
    let phaseButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Phase']")), 10000);
    await phaseButton.click();
    console.log('Clicked phaseButton.');
    for (let i = 0; i < 3; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }
    let milestoneButton = await browser.wait(until.elementLocated(By.xpath("//h5[normalize-space()='Milestone 1']")), 10000);
    await milestoneButton.click();
    console.log('Clicked milestoneButton.');
    await browser.sleep(1500);
    let cancel = await browser.wait(until.elementLocated(By.xpath("//button[contains(@class,'absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl')]")), 10000)
    await cancel.click();
    console.log('Close modal');
    await browser.sleep(1500);

    // Document
    let documentButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Document']")), 10000);
    await documentButton.click();
    console.log('Clicked documentButton.');
    for (let i = 0; i < 2; i++) {
        await browser.executeScript("window.scrollBy(0, 500);");
        await browser.sleep(1000);
    }

}

module.exports = { viewProject };
