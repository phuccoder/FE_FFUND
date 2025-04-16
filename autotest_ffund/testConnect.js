var webdriver = require('selenium-webdriver');

var browser = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();

browser.get('https://deploy-f-fund-b4n2.vercel.app');

browser.getTitle().then(function (title) {
    console.log(title);
}).finally(function () {
    browser.quit();
});