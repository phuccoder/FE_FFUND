const webdriver = require('selenium-webdriver');
const assert = require('assert');

const By = webdriver.By;
const until = webdriver.until;
const Key = webdriver.Key;

describe('Rules & Terms Section Tests', function() {
    let browser;
    
    beforeEach(async function() {
        browser = new webdriver.Builder()
            .withCapabilities(webdriver.Capabilities.chrome())
            .build();
        
        // Login as a founder
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        
        await browser.sleep(2000);
        
        let loginButton = await browser.wait(
            until.elementLocated(By.css('.main-btn.main-btn-2')),
            10000
        );
        await loginButton.click();
        
        let emailField = await browser.wait(
            until.elementLocated(By.css('#email')),
            10000
        );
        await emailField.sendKeys('phucnmtde170689@fpt.edu.vn');
        
        let passwordField = await browser.findElement(By.css('#password'));
        await passwordField.sendKeys('123456');
        
        let submitButton = await browser.findElement(By.xpath("//button[normalize-space()='Sign in']"));
        await submitButton.click();
        
        await browser.sleep(5000);
        
        // Navigate to create project page
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/create-project');
        await browser.sleep(3000);
    });
    
    afterEach(async function() {
        await browser.quit();
    });
    
    it('should display Rules & Terms section as first step', async function() {
        const rulesTermsHeader = await browser.wait(
            until.elementLocated(By.xpath("//h2[contains(text(),'Rules & Terms') or contains(text(),'Rules')]")),
            10000
        );
        
        const isDisplayed = await rulesTermsHeader.isDisplayed();
        assert.strictEqual(isDisplayed, true, 'Rules & Terms section should be displayed as the first step');
    });
    
    it('should not allow proceeding without accepting terms', async function() {
        const continueButton = await browser.findElement(By.xpath("//button[contains(text(),'Continue')]"));
        await continueButton.click();
        
        await browser.sleep(1000);
        
        // Check if we're still on the Rules & Terms section
        const rulesTermsHeader = await browser.findElement(By.xpath("//h2[contains(text(),'Rules & Terms') or contains(text(),'Rules')]"));
        const isDisplayed = await rulesTermsHeader.isDisplayed();
        
        assert.strictEqual(isDisplayed, true, 'User should not be able to proceed without accepting terms');
    });
    
    it('should allow proceeding after accepting terms', async function() {
        const termsCheckbox = await browser.findElement(By.css('input[type="checkbox"]'));
        await termsCheckbox.click();
        
        const continueButton = await browser.findElement(By.xpath("//button[contains(text(),'Continue')]"));
        await continueButton.click();
        
        await browser.sleep(2000);
        
        // Verify we've moved to Basic Information section
        const basicInfoHeader = await browser.wait(
            until.elementLocated(By.xpath("//h2[contains(text(),'Basic Information')]")),
            10000
        );
        
        const isBasicInfoDisplayed = await basicInfoHeader.isDisplayed();
        assert.strictEqual(isBasicInfoDisplayed, true, 'Basic Information section should be displayed after accepting terms');
    });
});