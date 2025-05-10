const { By, until } = require('selenium-webdriver');

async function viewDashboard(browser) {
    // Click nút "Get Start" để chuyển sang dashboard
    let getStartBtn = await browser.wait(until.elementLocated(By.css("button.mt-4.btn.btn-primary.hover\\:scale-105.transition.duration-300")), 10000);
    await getStartBtn.click();
    console.log('Clicked Get Start button, navigating to Dashboard...');

    await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/dashboard'), 10000);
    console.log('Dashboard loaded!');
    await browser.sleep(1000);
    
    for (let i = 0; i < 4; i++) {
      await browser.executeScript("window.scrollBy(0, 500);");
      console.log(`Scrolled down ${i + 1} times`);
      await browser.sleep(1500);
    }
}

module.exports = { viewDashboard };
