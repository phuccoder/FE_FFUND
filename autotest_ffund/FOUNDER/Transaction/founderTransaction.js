var webdriver = require('selenium-webdriver');
var By = webdriver.By;
var until = webdriver.until;
var Key = webdriver.Key;

(async function testTransactionManagement() {
    let browser = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .build();

    try {
        // TEST CASE 1: Login as founder
        console.log('\nTEST CASE 1: Logging in as FOUNDER');
        
        await browser.get('https://deploy-f-fund-b4n2.vercel.app');
        await browser.manage().window().maximize();
        console.log('Window maximized!');
        
        await browser.sleep(2000);

        let loginButton = await browser.wait(
            until.elementLocated(By.css('.main-btn.main-btn-2')),
            10000
        );
        await loginButton.click();
        console.log('✓ Login button clicked!');

        let emailField = await browser.wait(
            until.elementLocated(By.css('#email')),
            10000
        );
        await emailField.click();
        await browser.sleep(1000);
        await emailField.clear();
        await emailField.sendKeys('phucnmtde170689@fpt.edu.vn');
        console.log('✓ Email entered successfully!');

        let passwordField = await browser.wait(
            until.elementLocated(By.css('#password')),
            10000
        );
        await passwordField.click();
        await passwordField.clear();
        await passwordField.sendKeys('123456');
        console.log('✓ Password entered successfully!');

        await browser.sleep(1000);
        let submitButton = await browser.wait(
            until.elementLocated(By.xpath("//button[normalize-space()='Sign in']")),
            10000
        );
        await submitButton.click();
        console.log('✓ Submit button clicked!');
        
        await browser.sleep(5000);

        // Verify login as Founder
        let role = await browser.executeScript("return localStorage.getItem('role');");
        if (role === 'FOUNDER') {
            console.log('✓ Successfully logged in as FOUNDER!');
        } else {
            console.log(`✗ Login failed or wrong account type: ${role}`);
            return;
        }

        // TEST CASE 2: Navigate to transaction page
        console.log('\nTEST CASE 2: Navigating to transaction page');
        
        await browser.get('https://deploy-f-fund-b4n2.vercel.app/founder-transaction');
        await browser.sleep(3000);
        console.log('✓ Navigated to founder transaction page');
        
        // Check if transaction history page is displayed
        try {
            let transactionHeader = await browser.wait(
                until.elementLocated(By.xpath("//h1[contains(text(),'Founder Transaction') or contains(text(),'Transaction History')]")),
                10000
            );
            console.log('✓ Founder Transaction page loaded successfully');
            
            // TEST CASE 3: Check for transaction summary statistics
            console.log('\nTEST CASE 3: Checking transaction summary statistics');
            
            try {
                // Wait for the summary section to load (looking for common elements found in the TransactionSummary component)
                let summarySection = await browser.wait(
                    until.elementLocated(By.css('.transaction-summary, .stats-card, .summary-container')),
                    10000
                );
                console.log('✓ Transaction summary section found');
                
                // Check for specific summary statistics
                let statisticsLabels = [
                    'Total Amount', 'Total Transactions', 'Total Investors',
                    'Platform Fee', 'Stripe Fee', 'Net Profit'
                ];
                
                for (const label of statisticsLabels) {
                    try {
                        // Try to find the statistic by looking for text containing the label
                        let statElement = await browser.findElement(
                            By.xpath(`//div[contains(text(),'${label}') or .//span[contains(text(),'${label}')]]`)
                        );
                        
                        // If found, try to get the associated value
                        try {
                            let statValue = await browser.findElement(
                                By.xpath(`//div[contains(text(),'${label}')]/following-sibling::div | //span[contains(text(),'${label}')]/following-sibling::span`)
                            ).getText();
                            console.log(`✓ Found statistic: ${label} = ${statValue}`);
                        } catch (valueError) {
                            console.log(`✓ Found statistic label: ${label}, but couldn't extract value`);
                        }
                    } catch (error) {
                        console.log(`✗ Could not find statistic: ${label}`);
                    }
                }
            } catch (error) {
                console.log('✗ Transaction summary section not found:', error.message);
            }
            
            // TEST CASE 4: Check for transaction filtering options
            console.log('\nTEST CASE 4: Testing transaction filters');
            
            try {
                // Check for filter section
                let filterSection = await browser.findElement(
                    By.css('.transaction-filter, .filter-container, form')
                );
                console.log('✓ Transaction filter section found');
                
                // Check for investor name filter
                try {
                    let investorNameFilter = await browser.findElement(
                        By.css('input[name="investorName"], input[placeholder*="Investor"]')
                    );
                    console.log('✓ Investor name filter found');
                    
                    // Test investor name filter
                    await investorNameFilter.clear();
                    await investorNameFilter.sendKeys('Test Investor');
                    console.log('✓ Entered test investor name in filter');
                    await browser.sleep(1000);
                    
                    // Look for apply/filter button
                    try {
                        let filterButton = await browser.findElement(
                            By.xpath("//button[contains(text(),'Filter') or contains(text(),'Apply') or contains(text(),'Search')]")
                        );
                        await filterButton.click();
                        console.log('✓ Clicked filter button');
                        await browser.sleep(2000);
                    } catch (buttonError) {
                        // Filter might be applied automatically without a button
                        console.log('✓ No explicit filter button found, filter may be applied automatically');
                    }
                    
                    // Clear the filter for subsequent tests
                    await investorNameFilter.clear();
                    console.log('✓ Cleared investor name filter');
                    await browser.sleep(1000);
                } catch (error) {
                    console.log('✗ Investor name filter not found');
                }
                
                // Check for project title filter
                try {
                    let projectTitleFilter = await browser.findElement(
                        By.css('input[name="projectTitle"], input[placeholder*="Project"], select[name="projectTitle"]')
                    );
                    console.log('✓ Project title filter found');
                    
                    // If it's a dropdown, select the first option
                    if ((await projectTitleFilter.getTagName()).toLowerCase() === 'select') {
                        // Get all options
                        let options = await browser.findElements(By.css('select[name="projectTitle"] option'));
                        if (options.length > 1) {
                            await options[1].click();  // Select the first non-empty option
                            console.log('✓ Selected first project from dropdown');
                        } else {
                            console.log('✓ No project options available in dropdown');
                        }
                    } else {
                        // Otherwise treat as a text input
                        await projectTitleFilter.clear();
                        await projectTitleFilter.sendKeys('Test Project');
                        console.log('✓ Entered test project title in filter');
                    }
                    
                    await browser.sleep(1000);
                    
                    // Apply filter if there's a button
                    try {
                        let filterButton = await browser.findElement(
                            By.xpath("//button[contains(text(),'Filter') or contains(text(),'Apply') or contains(text(),'Search')]")
                        );
                        await filterButton.click();
                        console.log('✓ Clicked filter button');
                        await browser.sleep(2000);
                    } catch (buttonError) {
                        // Filter might be applied automatically
                        console.log('✓ No explicit filter button found, filter may be applied automatically');
                    }
                    
                    // Clear filter
                    if ((await projectTitleFilter.getTagName()).toLowerCase() === 'select') {
                        // If it's a dropdown, select the first (empty) option
                        let options = await browser.findElements(By.css('select[name="projectTitle"] option'));
                        if (options.length > 0) {
                            await options[0].click();
                            console.log('✓ Reset project dropdown filter');
                        }
                    } else {
                        await projectTitleFilter.clear();
                        console.log('✓ Cleared project title filter');
                    }
                    await browser.sleep(1000);
                } catch (error) {
                    console.log('✗ Project title filter not found');
                }
                
                // Check for date range filters
                try {
                    let startDateFilter = await browser.findElement(
                        By.css('input[type="date"][name="startDate"], input[placeholder*="Start Date"]')
                    );
                    let endDateFilter = await browser.findElement(
                        By.css('input[type="date"][name="endDate"], input[placeholder*="End Date"]')
                    );
                    
                    console.log('✓ Date range filters found');
                    
                    // Set date ranges (last 30 days)
                    let today = new Date();
                    let thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    
                    let todayFormatted = today.toISOString().split('T')[0];
                    let thirtyDaysAgoFormatted = thirtyDaysAgo.toISOString().split('T')[0];
                    
                    await startDateFilter.clear();
                    await startDateFilter.sendKeys(thirtyDaysAgoFormatted);
                    console.log(`✓ Set start date to: ${thirtyDaysAgoFormatted}`);
                    
                    await endDateFilter.clear();
                    await endDateFilter.sendKeys(todayFormatted);
                    console.log(`✓ Set end date to: ${todayFormatted}`);
                    
                    await browser.sleep(1000);
                    
                    // Apply filter if there's a button
                    try {
                        let filterButton = await browser.findElement(
                            By.xpath("//button[contains(text(),'Filter') or contains(text(),'Apply') or contains(text(),'Search')]")
                        );
                        await filterButton.click();
                        console.log('✓ Clicked filter button');
                        await browser.sleep(2000);
                    } catch (buttonError) {
                        // Filter might be applied automatically
                        console.log('✓ No explicit filter button found, filter may be applied automatically');
                    }
                    
                    // Clear filters
                    await startDateFilter.clear();
                    await endDateFilter.clear();
                    console.log('✓ Cleared date filters');
                    await browser.sleep(1000);
                } catch (error) {
                    console.log('✗ Date range filters not found');
                }
            } catch (error) {
                console.log('✗ Transaction filter section not found:', error.message);
            }
            
            // TEST CASE 5: Check transaction table and sorting
            console.log('\nTEST CASE 5: Testing transaction table and sorting');
            
            try {
                // Find the transaction table
                let transactionTable = await browser.findElement(
                    By.css('table, .transaction-table')
                );
                console.log('✓ Transaction table found');
                
                // Get table headers to test sorting
                let tableHeaders = await browser.findElements(
                    By.css('th, .table-header')
                );
                console.log(`✓ Found ${tableHeaders.length} table headers/columns`);
                
                // Get header texts for logging
                let headerTexts = [];
                for (let i = 0; i < tableHeaders.length; i++) {
                    let headerText = await tableHeaders[i].getText();
                    headerTexts.push(headerText);
                }
                console.log(`✓ Table columns: ${headerTexts.join(', ')}`);
                
                // Check for transaction rows
                let transactionRows = await browser.findElements(
                    By.css('tbody tr, .transaction-item')
                );
                let rowCount = transactionRows.length;
                console.log(`✓ Found ${rowCount} transaction rows`);
                
                // Test sorting by clicking on a header (if there are transactions)
                if (rowCount > 0 && tableHeaders.length > 0) {
                    // Find a sortable header (typically Amount or Date)
                    for (let i = 0; i < tableHeaders.length; i++) {
                        let headerText = await tableHeaders[i].getText();
                        
                        // Skip headers that are typically not sortable
                        if (headerText && 
                            !headerText.toLowerCase().includes('action') && 
                            headerText.trim() !== '') {
                            
                            // Record first row data before sorting for comparison
                            let firstRowBeforeSort = '';
                            try {
                                firstRowBeforeSort = await transactionRows[0].getText();
                            } catch (error) {
                                console.log('✗ Could not read first row before sorting');
                            }
                            
                            // Click header to sort
                            await tableHeaders[i].click();
                            console.log(`✓ Clicked on "${headerText}" column header to sort`);
                            await browser.sleep(2000);
                            
                            // Get rows after sorting
                            let rowsAfterSort = await browser.findElements(
                                By.css('tbody tr, .transaction-item')
                            );
                            
                            // Check if first row changed (indicating sorting happened)
                            if (rowsAfterSort.length > 0) {
                                try {
                                    let firstRowAfterSort = await rowsAfterSort[0].getText();
                                    
                                    if (firstRowBeforeSort !== firstRowAfterSort) {
                                        console.log(`✓ Sorting by "${headerText}" was successful - first row changed`);
                                    } else {
                                        console.log(`✓ Clicked "${headerText}" for sorting, but first row remained the same`);
                                    }
                                } catch (error) {
                                    console.log('✗ Could not read first row after sorting');
                                }
                            }
                            
                            // Just test first sortable column
                            break;
                        }
                    }
                }
                
                // TEST CASE 6: Test transaction details modal
                console.log('\nTEST CASE 6: Testing transaction details modal');
                
                if (rowCount > 0) {
                    // Find view details button or clickable element in first row
                    try {
                        let detailsButton = await transactionRows[0].findElement(
                            By.css('button, .details-button, .view-button')
                        );
                        await detailsButton.click();
                        console.log('✓ Clicked details button on first transaction');
                    } catch (error) {
                        // If no explicit button, try clicking the row itself
                        try {
                            await transactionRows[0].click();
                            console.log('✓ Clicked on first transaction row to view details');
                        } catch (rowClickError) {
                            console.log('✗ Could not click transaction row:', rowClickError.message);
                        }
                    }
                    
                    await browser.sleep(2000);
                    
                    // Verify transaction details modal appears
                    try {
                        let transactionDetails = await browser.wait(
                            until.elementLocated(By.css('.modal, .transaction-details-modal, .modal-content')),
                            5000
                        );
                        console.log('✓ Transaction details modal opened successfully');
                        
                        // Check for details in the modal
                        try {
                            // Common transaction details fields to look for
                            let detailFields = [
                                'Amount', 'Date', 'Project', 'Investor', 'Status', 
                                'Transaction ID', 'Payment Method', 'Fee'
                            ];
                            
                            let foundFields = 0;
                            for (const field of detailFields) {
                                try {
                                    let fieldElement = await browser.findElement(
                                        By.xpath(`//div[contains(text(),'${field}') or .//*[contains(text(),'${field}')]]`)
                                    );
                                    foundFields++;
                                } catch (error) {
                                    // Field not found, continue checking others
                                }
                            }
                            
                            console.log(`✓ Found ${foundFields} out of ${detailFields.length} expected transaction detail fields`);
                        } catch (error) {
                            console.log('✗ Error checking transaction details:', error.message);
                        }
                        
                        // Close the modal
                        try {
                            let closeButton = await browser.findElement(
                                By.css('.close-button, .btn-close, button[aria-label="Close"]')
                            );
                            await closeButton.click();
                            console.log('✓ Closed transaction details modal');
                            await browser.sleep(1000);
                        } catch (error) {
                            // Try alternative close method
                            try {
                                let closeButton = await browser.findElement(
                                    By.xpath("//button[contains(text(),'Close') or contains(text(),'Cancel')]")
                                );
                                await closeButton.click();
                                console.log('✓ Closed transaction details modal using text button');
                                await browser.sleep(1000);
                            } catch (closeError) {
                                console.log('✗ Could not close transaction details modal:', closeError.message);
                                
                                // Try clicking outside the modal to close it
                                try {
                                    await browser.findElement(By.css('body')).click();
                                    console.log('✓ Attempted to close modal by clicking outside');
                                    await browser.sleep(1000);
                                } catch (bodyClickError) {
                                    console.log('✗ Could not click body to close modal');
                                }
                            }
                        }
                    } catch (error) {
                        console.log('✗ Transaction details modal not found or could not be opened:', error.message);
                    }
                }
                
                // TEST CASE 7: Test pagination
                console.log('\nTEST CASE 7: Testing pagination');
                
                try {
                    let paginationContainer = await browser.findElement(
                        By.css('.pagination, .paging-container, nav ul')
                    );
                    console.log('✓ Pagination container found');
                    
                    // Get pagination buttons
                    let paginationButtons = await browser.findElements(
                        By.css('.pagination button, .pagination a, .page-item, .page-link')
                    );
                    
                    if (paginationButtons.length > 0) {
                        console.log(`✓ Found ${paginationButtons.length} pagination buttons/links`);
                        
                        // Click on the next page button if more than one page
                        if (paginationButtons.length > 2) {  // Usually prev, page numbers, next
                            try {
                                // Try finding a "Next" button
                                let nextButton = await browser.findElement(
                                    By.css('.pagination-next, .next-page, button[aria-label="Next page"]')
                                );
                                await nextButton.click();
                                console.log('✓ Clicked Next pagination button');
                                await browser.sleep(2000);
                                
                                // Verify page changed by checking if active page indicator changed
                                try {
                                    let activePage = await browser.findElement(
                                        By.css('.active.page-item, .active-page, [aria-current="page"]')
                                    );
                                    let activePageText = await activePage.getText();
                                    console.log(`✓ Active page is now: ${activePageText}`);
                                } catch (error) {
                                    console.log('✗ Could not verify active page change');
                                }
                            } catch (error) {
                                // If no specific Next button, try the second pagination button (usually page 2)
                                try {
                                    await paginationButtons[1].click();
                                    console.log('✓ Clicked second pagination button');
                                    await browser.sleep(2000);
                                } catch (nextError) {
                                    console.log('✗ Could not click pagination next/second button:', nextError.message);
                                }
                            }
                        } else {
                            console.log('✓ Only one page of results available');
                        }
                    } else {
                        console.log('✓ No pagination buttons found - likely only one page of results');
                    }
                } catch (error) {
                    console.log('✗ Pagination container not found:', error.message);
                }
            } catch (error) {
                console.log('✗ Could not find transaction table:', error.message);
            }
        } catch (error) {
            console.log('✗ Could not find Transaction History header:', error.message);
        }
        
        console.log('\nTransaction management test completed successfully');

    } catch (err) {
        console.error('Error during Transaction Management test:', err);
    } finally {
        try {
            console.log('Closing browser...');
            await browser.quit();
        } catch (err) {
            console.error('Error while closing the browser:', err);
        }
    }
})();