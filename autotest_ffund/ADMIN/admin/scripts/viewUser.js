const { By, until } = require('selenium-webdriver');

async function viewUser(browser) {

  //List
  await browser.get('https://admin-ffund.vercel.app/app/user-management');
  await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/user-management'), 10000);
  console.log('User Management page loaded!');
  await browser.sleep(1500);

  // Click vào một user (ví dụ "Hoàng Anh Thắng") để xem chi tiết
  let userDetailLink = await browser.wait(until.elementLocated(By.xpath("//a[contains(text(),'Hoàng Anh Thắng')]")), 10000);
  await userDetailLink.click();
  console.log('Clicked on user "Hoàng Anh Thắng" to view details.');
  await browser.sleep(1500);

  // Test nút Ban
  let banButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Ban User']")), 10000);
  await banButton.click();
  console.log('Clicked Ban button.');
  
  let confirmBan = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Yes']")), 10000);
  await confirmBan.click();
  console.log('Confirmed ban action.');

  await browser.sleep(2000);

  // Test nút unBan
  let unBanButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Unban User']")), 10000);
  await unBanButton.click();
  console.log('Clicked UnBan button.');

  let confirmUnBan = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Yes']")), 10000);
  await confirmUnBan.click();
  console.log('Confirmed unban action.');

  await browser.sleep(2000);

  // Quay lại trang User Management
  let backButton = await browser.wait(until.elementLocated(By.css('button[class="btn btn-ghost"]')), 10000);
  await backButton.click();
  console.log('Clicked Back button to return to User Management.');

  // Đợi quay lại trang User Management
  await browser.wait(until.urlIs('https://admin-ffund.vercel.app/app/user-management'), 10000);

  await browser.sleep(1500);
  
  // Tiến hành click nút "Next" 3 lần
  for (let i = 0; i < 3; i++) {
    let nextButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Next']")), 10000);
    await nextButton.click();
    console.log(`Clicked Next button ${i + 1} time.`);
    await browser.sleep(1500);
  }
}

module.exports = { viewUser };
