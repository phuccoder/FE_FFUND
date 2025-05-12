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
const { a } = require('framer-motion/dist/types.d-B50aGbjN');

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
    await usernameField.sendKeys('viet0102@gmail.com');

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
    
    let CriteriaButton = await browser.wait(until.elementLocated(By.xpath("//span[normalize-space()='Criteria']")), 10000);
    await CriteriaButton.click();
    console.log('Clicked on Criteria button!');

    await browser.sleep(1000);

    let CriteriaTypeButton = await browser.wait(until.elementLocated(By.xpath("//span[normalize-space()='Criteria Type']")), 10000);
    await CriteriaTypeButton.click();
    console.log('Clicked on Criteria Type button!');

    await browser.sleep(1000);

    let createCriteriaButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Create New Type']")), 10000);
    await createCriteriaButton.click();
    console.log('Clicked on Create Criteria button!');
    
    await browser.sleep(1000);

    let criteriaNameField = await browser.wait(until.elementLocated(By.xpath("//input[contains(@placeholder,'Enter criteria type name')]")), 10000);
    await criteriaNameField.click();
    await criteriaNameField.clear();
    await criteriaNameField.sendKeys('Criteria Type demo');
    console.log('Criteria Type name entered successfully!');

    let criteriaDescriptionField = await browser.wait(until.elementLocated(By.xpath("//textarea[@placeholder='Describe this criteria type']")), 10000);
    await criteriaDescriptionField.click();
    await criteriaDescriptionField.clear();
    await criteriaDescriptionField.sendKeys('Criteria Type demo');
    console.log('Criteria Type description entered successfully!');

    let createButton = await browser.wait(until.elementLocated(By.xpath("//button[normalize-space()='Create Type']")), 10000);
    await createButton.click();
    console.log('Clicked on Create button!');
    await browser.sleep(2000);

    let checkCriteriaType = await browser.wait(until.elementLocated(By.xpath("//div[contains(@class, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3')]")), 10000);
    console.log('Found criteria type grid container!');

    try {
      let demoCriteria = await browser.wait(until.elementLocated(By.xpath("//div[contains(@class, 'bg-white rounded-lg')]//h3[contains(text(), 'demo')]")), 5000);
      console.log('SUCCESS: Found criteria type with "demo" in the name!');

      let criteriaName = await demoCriteria.getText();
      console.log('Criteria name:', criteriaName);
    } catch (error) {
      console.log('FAILED: No criteria type with "demo" in the name was found.');

      try {
        let allCriteriaTypes = await browser.findElements(By.xpath("//div[contains(@class, 'bg-white rounded-lg')]//h3"));
        console.log('Existing criteria types:');
        for (let criteria of allCriteriaTypes) {
          console.log('- ' + await criteria.getText());
        }
      } catch (err) {
        console.log('Could not retrieve list of criteria types:', err.message);
      }
    }

    //Select a Category
    let CategoryButton = await browser.wait(until.elementLocated(By.xpath("//a[contains(@href,'/app/category')]//div[contains(@class,'flex items-center w-full')]")), 10000);
    await CategoryButton.click();
    console.log('Clicked on Category button!')

    await browser.sleep(10000);

    // Check select category in criteria page
    let selectCategoryButton = await browser.wait(until.elementLocated(By.xpath("body > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > main:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > select:nth-child(1)")), 10000);
    await selectCategoryButton.getText();
    console.log('Select Category button is displayed!');
    console.log('Select Category button text:', await selectCategoryButton.getText());

    await browser.sleep(1000);

    let warningMessage = await browser.wait(until.elementLocated(By.xpath("(//div[@class='p-4 flex items-start'])[1]")), 10000);
    let warningMessageText = await warningMessage.getText();
    console.log('Warning message is displayed:', warningMessageText);

    await browser.sleep(1000);

    let createCriteriaDemoButton = await browser.wait(until.elementLocated(By.xpath("button[class='inline-flex items-center px-3 py-2 border border-amber-300 text-sm leading-4 font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200']")), 10000);
    await createCriteriaDemoButton.click();
    console.log('Clicked on Create Criteria Demo button!');

    await browser.sleep(1000);

    let maximumPointField = await browser.wait(until.elementLocated(By.xpath("input[placeholder='Enter maximum points (e.g. 10)']")), 10000);
    await maximumPointField.click();
    await maximumPointField.clear();
    await maximumPointField.sendKeys('10');
    console.log('Maximum point entered successfully!');

    await browser.sleep(1000);

    let selectCriteriaTypeButton = await browser.wait(until.elementLocated(By.xpath("//select[@name='typeId']")), 10000);
    await selectCriteriaTypeButton.click();
    console.log('Select Criteria Type button is displayed!');

    let demoOption = await browser.wait(until.elementLocated(By.xpath("//select[@name='typeId']/option[contains(text(), 'demo')]")), 5000);
    await demoOption.click();
    console.log('Selected "demo" option successfully!');

    await browser.sleep(1000);

    let descriptionCriteriaField = await browser.wait(until.elementLocated(By.xpath("//textarea[@placeholder='Enter detailed description of this criteria']")), 10000);
    await descriptionCriteriaField.click();
    await descriptionCriteriaField.clear();
    await descriptionCriteriaField.sendKeys('Criteria Type demo');
    console.log('Description Criteria entered successfully!');

    let createCriteriaCategoryButton = await browser.wait(until.elementLocated(By.xpath("//button[@type='submit']")), 10000);
    await createCriteriaCategoryButton.click();
    console.log('Clicked on Create Criteria button!');

    await browser.sleep(2000);

    let viewDetailCriteriaButton = await browser.wait(until.elementLocated(By.css("a[title='View']")), 10000);
    await viewDetailCriteriaButton.click();
    console.log('Clicked on Add Detail Criteria button!');

    await browser.sleep(1000);

    let checkWarningMessage = await browser.wait(until.elementLocated(By.css(".p-2.mb-3.bg-amber-50.border.border-amber-300.rounded.text-sm")), 10000);
    let warningMessageText2 = await checkWarningMessage.getText();
    console.log('Warning message is displayed:', warningMessageText2);

    await browser.sleep(1000);

    let addDetailCriteriaButton = await browser.wait(until.elementLocated(By.css("button[class='bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 flex items-center gap-1 rounded text-xs']")), 10000);
    await addDetailCriteriaButton.click();
    console.log('Clicked on Add Detail Criteria button!');

    await browser.sleep(1000);

    let enterBasicRequirementField = await browser.wait(until.elementLocated(By.css("textarea[placeholder='Enter basic requirements']")), 10000);
    await enterBasicRequirementField.click();
    await enterBasicRequirementField.clear();
    await enterBasicRequirementField.sendKeys('Basic requirement demo');
    console.log('Basic requirement entered successfully!');

    let enterEvaluationCriteriaField = await browser.wait(until.elementLocated(By.css("textarea[placeholder='Enter evaluation criteria']")), 10000);
    await enterEvaluationCriteriaField.click();
    await enterEvaluationCriteriaField.clear();
    await enterEvaluationCriteriaField.sendKeys('Evaluation criteria demo');
    console.log('Evaluation criteria entered successfully!');

    let maxDetailPointField = await browser.wait(until.elementLocated(By.css("input[placeholder='0']")), 10000);
    await maxDetailPointField.click();
    await maxDetailPointField.clear();
    await maxDetailPointField.sendKeys('5');
    console.log('Max detail point entered successfully!');
    await browser.sleep(1000);

    let submitButton = await browser.wait(until.elementLocated(By.css("button[type='submit']")), 10000);
    await submitButton.click();
    console.log('Clicked on Submit button!');

    await browser.sleep(2000);

    let addDetailCriteriaButton2 = await browser.wait(until.elementLocated(By.css("button[class='bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 flex items-center gap-1.5 rounded text-sm']")), 10000);
    await addDetailCriteriaButton2.click();
    console.log('Clicked on Add Detail Criteria button!');
    await browser.sleep(1000);

    let enterBasicRequirementField2 = await browser.wait(until.elementLocated(By.css("textarea[placeholder='Enter basic requirements']")), 10000);
    await enterBasicRequirementField2.click();
    await enterBasicRequirementField2.clear();
    await enterBasicRequirementField2.sendKeys('Basic requirement demo 2');

    console.log('Basic requirement entered successfully!');
    let enterEvaluationCriteriaField2 = await browser.wait(until.elementLocated(By.css("textarea[placeholder='Enter evaluation criteria']")), 10000);
    await enterEvaluationCriteriaField2.click();
    await enterEvaluationCriteriaField2.clear();
    await enterEvaluationCriteriaField2.sendKeys('Evaluation criteria demo 2');
    console.log('Evaluation criteria entered successfully!');

    let maxDetailPointField2 = await browser.wait(until.elementLocated(By.css("input[placeholder='0']")), 10000);
    await maxDetailPointField2.click();
    await maxDetailPointField2.clear();
    await maxDetailPointField2.sendKeys('5');

    console.log('Max detail point entered successfully!');
    await browser.sleep(1000);

    let submitButton2 = await browser.wait(until.elementLocated(By.css("button[type='submit']")), 10000);
    await submitButton2.click();
    console.log('Clicked on Submit button!');
    await browser.sleep(2000);

    // enable category
    let combackCategoryButton = await browser.wait(until.elementLocated(By.xpath("//a[contains(@href,'/app/category')]//div[contains(@class,'flex items-center w-full')]")), 10000);
    await combackCategoryButton.click();
    console.log('Clicked on Category button!')

    await browser.sleep(15000);

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
