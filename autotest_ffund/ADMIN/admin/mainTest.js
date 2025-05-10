var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
const { viewUser } = require('./scripts/viewUser');
const { viewTeam } = require('./scripts/viewTeam');
const { viewDashboard } = require('./scripts/viewDashboard');
const { viewProject } = require('./scripts/viewProject');
const { viewCategory } = require('./scripts/viewCategory');
const { viewCriteria } = require('./scripts/viewCriteria');
const { viewTPG } = require('./scripts/viewTPG');

(async function mainTest() {
  let browser = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

  try {
    await browser.get('https://admin-ffund.vercel.app');
    
    await browser.manage().window().maximize();
    console.log('Window maximized!');

    await browser.sleep(2000);

    // Nhập tên người dùng
    let usernameField = await browser.wait(until.elementLocated(By.css("input[placeholder='abc@example.com']")), 10000);
    await usernameField.click();
    await browser.sleep(2000);
    await usernameField.clear();
    await usernameField.sendKeys('ffundsep490@gmail.com');

    console.log('Email entered successfully!');

    // Nhập mật khẩu
    let passwordField = await browser.wait(until.elementLocated(By.css("input[placeholder='*******']")), 10000);
    await passwordField.click();
    await passwordField.clear();
    await passwordField.sendKeys('123');
    
    console.log('Password entered successfully!');

    // Nhấn nút đăng nhập
    let loginButton = await browser.wait(until.elementLocated(By.css('button[type="submit"]')), 10000);
    await loginButton.click();
    console.log('Submit button clicked!');
    await browser.sleep(5000);
    
    // Kiểm tra URL hiện tại
    let currentUrl = await browser.getCurrentUrl();
    if (currentUrl === 'https://admin-ffund.vercel.app/login') {
        console.log('Login failed: Still on login page.');
        return;
    }

    if (currentUrl !== 'https://admin-ffund.vercel.app/app/welcome') {
        console.log('Login failed: Unexpected URL:', currentUrl);
        return;
    }

    console.log('URL is correct. Proceeding to check userMenu and localStorage.');

    // Kiểm tra nếu URL có chứa '/app/welcome' (đăng nhập thành công)
    await browser.wait(until.urlContains('/app/welcome'), 10000);
    console.log('Logged in successfully as Admin!');

    // Kiểm tra nút button Get Start
    let actionButton = await browser.wait(until.elementLocated(By.css("button[class='mt-4 btn btn-primary hover:scale-105 transition duration-300']")), 10000);
    if (await actionButton.isDisplayed()) {
      console.log('Action button is displayed. Login success!');
    } else {
      console.log('Action button is not displayed. Login failed!');
    }

    // viewDashboard
    await viewDashboard(browser);
    
    // viewUser
    await viewUser(browser);

    // viewTeam
    await viewTeam(browser);
    
    // viewProject
    await viewProject(browser);

    // viewCategory
    await viewCategory(browser);
    
    // viewCriteria
    await viewCriteria(browser);

    // viewTPG
    await viewTPG(browser);
    
  } catch (error) {
    console.error('Error during login:', error);
  } finally {
      try {
        console.log('Closing browser...');
        await browser.quit();
      } catch (err) {
        console.error('Error while closing the browser:', err);
    }
  }
})();
