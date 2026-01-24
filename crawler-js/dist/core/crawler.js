import { devices } from "playwright";
import { jitter, sleep } from "./utils.js";
export class Crawler {
    constructor(cmd_arguments, countySpecs, browser, page) {
        this.countyName = cmd_arguments.county;
        this.totalPages = 0;
        this.startDate = cmd_arguments.startDate;
        this.delaySecs = cmd_arguments.delaySecs;
        this.isDev = cmd_arguments.isDev;
        this.crawlerName = Crawler.generateCrawlerName(this.countyName);
        this.targetUrl = countySpecs.targetUrl;
        this.page = page;
        this.dividingChar = countySpecs.dividingChar ? countySpecs.dividingChar : '';
        this.dateFilterLabel = countySpecs.dateFilterLabel;
        this.startDateSelectorElement = countySpecs.startDateSelectorElement;
        this.searchElement = countySpecs.searchElement;
        this.navPageElement = countySpecs.navPageElement;
        this.tableElement = countySpecs.tableElement;
        this.tableMapping = countySpecs.tableMapping;
        this.disclaimer = countySpecs.hasDisclaimer ? countySpecs.hasDisclaimer : false;
        this.statusDropdown = countySpecs.statusDropdown ? countySpecs.statusDropdown : null;
    }
    ;
    name() { return this.crawlerName; }
    static async new(cmd_arguments, countySpecs, browser) {
        const page = await Crawler.newBrowserPage(browser);
        return new Crawler(cmd_arguments, countySpecs, browser, page);
    }
    ;
    async run() {
        try {
            // ***Step 1: Navigate to the target URL***
            await this.page.goto(this.targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            // ***Step 2: Handle any disclaimers, set search filters, and run a search***
            const searchSuccessful = await this.handleDisclaimerFilterAndSearch();
            if (!searchSuccessful)
                return [];
            // ***Step 3: Wait for results and confirm that the table is not empty***
            const ok = await this.waitForSearchResultsTable(true);
            if (!ok)
                console.error('\tResults table not detected; extraction may be empty.');
            // Only run during development to avoid spamming the API.
            if (this.isDev && this.totalPages > 2) {
                console.error(`\tCrawler is currently in dev mode; restricting crawler to only scraping the first 2 pages of results.`);
                this.totalPages = 2;
            }
            // ***Step 4: Crawl through all pages, scrape the data, and write to file***
            return await this.crawlPages();
        }
        finally {
            await this.page.context().close().catch(() => { });
        }
    }
    static async newBrowserPage(browser) {
        const context = await browser.newContext({ ...devices['Desktop Chrome'], locale: 'en-US', ignoreHTTPSErrors: true });
        return await context.newPage();
    }
    async handleDisclaimerFilterAndSearch() {
        const skipDateFilter = this.startDateSelectorElement.position == -1;
        const fillStartAndEndDate = this.startDateSelectorElement.position == 1;
        if (skipDateFilter) {
            console.error(`\t${this.capitalize(this.countyName)} county does not require date filtering...`);
        } else {
            console.error(`\t${this.capitalize(this.countyName)} county requires ${fillStartAndEndDate ? 'a start and end' : 'only a start'} date filter...`);
        }
        if (typeof this.disclaimer === 'object') {
            if (typeof this.disclaimer.position === 'number') {
                if (this.disclaimer.position == 0) {
                    console.error(`\t${this.capitalize(this.countyName)} county has a disclaimer page at the start...`);
                    const accepted = await this.clickAcceptDisclaimer(this.page, this.disclaimer);
                    const statusSelected = await this.selectStatusDropdown();
                    let filled = true;
                    if (!skipDateFilter) {
                        filled = fillStartAndEndDate ? await this.fillStartAndEndDate() : await this.fillStartDate();
                    }
                    const search = await this.clickSearch(this.page);
                    if (!accepted || !statusSelected || !filled || !search)
                        return false;
                }
                else if (this.disclaimer.position == 2) {
                    console.error(`\t${this.capitalize(this.countyName)} county has a disclaimer page after the search...`);
                    const statusSelected = await this.selectStatusDropdown();
                    let filled = true;
                    if (!skipDateFilter) {
                        filled = fillStartAndEndDate ? await this.fillStartAndEndDate() : await this.fillStartDate();
                    }
                    const search = await this.clickSearch(this.page);
                    const accepted = await this.clickAcceptDisclaimer(this.page, this.disclaimer);
                    if (!accepted || !statusSelected || !filled || !search)
                        return false;
                }
            }
        }
        else {
            console.error(`\t${this.capitalize(this.countyName)} county does not have a disclaimer page...`);
            const statusSelected = await this.selectStatusDropdown();
            let filled = true;
            if (!skipDateFilter) {
                filled = fillStartAndEndDate ? await this.fillStartAndEndDate() : await this.fillStartDate();
            }
            const search = await this.clickSearch(this.page);
            if (!statusSelected || !filled || !search)
                return false;
        }
        return true;
    }
    /**
     * Retrieves the total number of available pages by scanning for the highest
     * numerical page link within the custom pagination control.
     */
    async getTotalPages(notifyUser = false) {
        // Page link ensures the pagination is fully rendered before scraping.
        try {
            await this.page.waitForSelector(this.navPageElement.id, { state: 'attached', timeout: 15000 });
            console.error(`\tThe pagination control element for ${this.capitalize(this.countyName)} county has been found.`);
        }
        catch (e) {
            console.error('\tPagination links not found within timeout. Will determine if the results just fit into 1 page or if the table failed to load.');
            // Set totalPages to 1 as a safe default if the results table is visible but no pagination is needed.
            this.totalPages = 1;
            return;
        }
        console.error(`\tPreparing to map over the pagination element for ${this.capitalize(this.countyName)} county...`);
        const querySelector = this.navPageElement.type ? this.navPageElement.type : this.navPageElement.id; // Use value if provided which indicates the nav element itself is not iterable, otherwise use id
        this.totalPages = await this.page.evaluate((sel) => {
            const elements = Array.from(document.querySelectorAll(sel));
            console.error(`\tFound ${elements.length} page links in the pagination element.`);
            // 1. Map all links to their numerical value
            const pageNumbers = elements.map(el => {
                const text = el.textContent.trim();
                // Regex to match on whether the navigation button labels are numeric or not.
                if (/^\d+$/.test(text)) {
                    console.error(`\t\tFound page number: ${text}`);
                    return parseInt(text, 10);
                }
                else {
                    console.error(`\t\tNon-numeric page link found: ${text}. Will return NaN for this page.`);
                    return NaN;
                }
            })
                // 2. Filter out non-numeric results (NaN) and zero
                .filter(num => !isNaN(num) && num > 0);
            // 3. Handle edge cases
            if (pageNumbers.length === 0) {
                this.totalPages = 1;
            }
            console.error(`\t\tPage numbers: ${pageNumbers}`);
            // 4. The highest number is the total page count
            return Math.max(...pageNumbers);
        }, querySelector);
        console.error(`\t${this.totalPages} page${this.totalPages > 1 ? 's' : ''} found for ${this.capitalize(this.countyName)} county.`);
        if (notifyUser) {
            this.getScrapeTime();
        }
    }
    async clickAcceptDisclaimer(page, disclaimer) {
        const acceptLocator = page.locator(disclaimer.id);
        try {
            await acceptLocator.waitFor({ state: 'visible', timeout: 10000 });
            console.error(`\t${disclaimer.value} button is visible for ${this.capitalize(this.countyName)} county.`);
        }
        catch (e) {
            console.error(`\tERROR: Could not find the ${disclaimer.value} button when it should be visible.`);
            return false;
        }
        const isPresent = await acceptLocator.isVisible({ timeout: 5000 }).catch(() => false);
        if (isPresent) {
            return await this.clickButton(acceptLocator, 'Disclaimer', 'accepted; next page has successfully loaded.');
        }
        else {
            // If the button wasn't found, assume that the disclaimer page has been skipped
            console.error(`\tDisclaimer page skipped (button not found) for ${this.capitalize(this.countyName)} county. Continuing to crawl..`);
            return true;
        }
    }
    async fillStartAndEndDate() {
        console.error(`\tPreparing to fill the start and end date elements for ${this.capitalize(this.countyName)} county...`);
        const startDateLocator = this.page.locator(this.startDateSelectorElement.id);
        const endDateLocator = this.page.locator(this.startDateSelectorElement.value);
        try {
            await startDateLocator.waitFor({ state: 'visible', timeout: 10000 });
            await endDateLocator.waitFor({ state: 'visible', timeout: 10000 });
            console.error(`\tBoth the start or end date elements are visible for ${this.capitalize(this.countyName)} county.`);
        }
        catch (e) {
            console.error(`ERROR: Could not find the start or end date element for
             ${this.capitalize(this.countyName)} county using the id '${this.startDateSelectorElement.id}':`, e);
            return false;
        }
        const today = new Date();
        const generatedStartDate = new Date(today);
        generatedStartDate.setMonth(generatedStartDate.getMonth() - 10);
        const startDate = generatedStartDate.toISOString().split('T')[0];
        const startDateString = this.dividingChar == '' ? startDate : this.parseDate(startDate);
        console.error(`\tFilling start date ${this.startDateSelectorElement.id} with ${startDateString}`);
        const startDateFillSucceeded = await this.fillDate(startDateLocator, startDateString, false);
        const endDateString = this.dividingChar == '' ? this.startDate : this.parseDate();
        console.error(`\tFilling end date ${this.startDateSelectorElement.value} with ${endDateString}`);
        const endDateFillSucceeded = await this.fillDate(endDateLocator, endDateString, true);
        return startDateFillSucceeded && endDateFillSucceeded;
    }
    async fillStartDate() {
        console.error(`\tPreparing to fill the start date element for ${this.capitalize(this.countyName)} county...`);
        const date = this.startDateSelectorElement.type == 'text' ? this.startDate : this.parseDate();
        const startDateLocator = this.page.locator(this.startDateSelectorElement.id);
        console.error(`\tLocator used id ${this.startDateSelectorElement.id} for ${this.dateFilterLabel} start date element`);
        try {
            await startDateLocator.waitFor({ state: 'visible', timeout: 10000 });
            console.error(`\t${this.dateFilterLabel} start date element is visible for ${this.capitalize(this.countyName)} county.`);
        }
        catch (e) {
            console.error(`ERROR: Could not find the ${this.dateFilterLabel} start date element for
             ${this.capitalize(this.countyName)} county using the id '${this.startDateSelectorElement.id}':`, e);
            return false;
        }
        return await this.fillDate(startDateLocator, date, this.startDateSelectorElement.position == 0);
    }
    async clickSearch(page) {
        const searchLocator = page.locator(this.searchElement.id);
        const isPresent = await searchLocator.isVisible({ timeout: 10000 }).catch(() => false);
        if (isPresent) {
            return await this.clickButton(searchLocator, 'Search', 'button clicked and the foreclosure records have successfully loaded.');
        }
        else {
            console.error(`\tNo search button found for ${this.capitalize(this.countyName)} county. Continuing to crawl...`);
            return false;
        }
    }
    async selectStatusDropdown() {
        if (!this.statusDropdown) {
            return true; // No dropdown configured, skip
        }
        console.error(`\tSelecting "${this.statusDropdown.value}" from Foreclosure Status dropdown for ${this.capitalize(this.countyName)} county...`);
        const dropdownLocator = this.page.locator(this.statusDropdown.id);
        try {
            await dropdownLocator.waitFor({ state: 'visible', timeout: 10000 });
            await dropdownLocator.selectOption({ label: this.statusDropdown.value });
            console.error(`\tSuccessfully selected "${this.statusDropdown.value}" status.`);
            return true;
        }
        catch (e) {
            console.error(`\tERROR: Could not select status dropdown for ${this.capitalize(this.countyName)} county: ${e.message}`);
            return false;
        }
    }
    async waitForSearchResultsTable(notifyUser = false) {
        if (this.navPageElement.value == 'table') {
            console.error(`\t${this.capitalize(this.countyName)} county has a custom pagination control; skipping pagination check and defaulting to 1 page of results.`);
            this.totalPages = 1;
        }
        else {
            await this.getTotalPages(notifyUser);
        }
        if (this.totalPages) {
            const tableLocator = this.page.locator(this.tableElement.id);
            try {
                await tableLocator.waitFor({ state: 'attached', timeout: 60000 });
                console.error(`\tThe results table for ${this.capitalize(this.countyName)} county has been found.`);
            }
            catch (e) {
                console.error(`FATAL ERROR: Results table was not detected on the page using selector.\
                 Cannot proceed with extraction.`);
                return false;
            }
            const isPresent = await tableLocator.isVisible({ timeout: 10000 }).catch(() => false);
            if (isPresent) {
                console.error(`\tThe results table for ${this.capitalize(this.countyName)} county was successfully loaded.`);
                return true;
            }
            else {
                console.error(`\tERROR: Waiting for the results table to become visible timed out for\
                 ${this.capitalize(this.countyName)} county.`);
                return false;
            }
        }
        else {
            console.error(`\tERROR: Failing due to totalPages being set to ${this.totalPages}.`);
            return false;
        }
    }
    async extractPageData() {
        const tableMapping = this.tableMapping;
        const countyName = this.countyName;
        return await this.page.evaluate(([selector, mapping, county]) => {
            const table = document.querySelector(selector.id);
            if (!table) {
                console.error(`ERROR: No results table found on ${county} county's page.`);
                return [];
            }
            const allTrs = Array.from(table.querySelectorAll('tr'));
            let startIndex = 0;
            const firstRow = allTrs[0];
            if (firstRow) {
                const firstCell = firstRow.querySelector('td');
                if (firstCell && (firstCell.querySelector('table') || firstCell.getAttribute('colspan'))) {
                    // If it's a pagination row, skip it.
                    console.error(`\t${county} county's foreclosure table puts its pagination in the first row; skipping.`);
                    startIndex = 1; // This skips the pagination row.
                    const headerRow = allTrs[startIndex];
                    if (headerRow && headerRow.querySelector('th')) {
                        // If it's a header row, skip it.
                        console.error(`\tFound header row in the results table for ${county} county; skipping second row as well.`);
                        startIndex += 1; // This skips the header row as well.
                    }
                }
                else if (firstRow && firstRow.querySelector('th')) {
                    // If it's a header row, skip it.
                    console.error(`\tFound header row in the results table for ${county} county; skipping first row.`);
                    startIndex = 1; // This skips just the header row.
                }
            }
            else {
                console.error(`\tNo rows found in the results table for ${county} county.`);
                return [];
            }
            const rows = allTrs.slice(startIndex);
            console.error(`\tFound ${rows.length} rows in the results table for ${county} county.`);
            return rows.map(tr => {
                const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
                const linkEl = tr.querySelector(`a[href^='${selector.type}']`);
                const caseDetails = linkEl ? linkEl.getAttribute('href') : null;
                const record = {};
                for (const indexStr in mapping) {
                    const index = parseInt(indexStr, 10);
                    const propertyName = mapping[index];
                    if (cells[index]) {
                        record[propertyName] = cells[index];
                    }
                }
                record.state = 'CO';
                record.county = county;
                record.ned_details_link = caseDetails;
                return record;
            });
        }, [this.tableElement, tableMapping, countyName]);
    }
    async clickNextPage(currentPage) {
        const nextPageNo = currentPage + 1;
        const targetSelector = `${this.navPageElement.type}:text("${String(nextPageNo)}")`;
        try {
            const nextButtonLocator = this.page.locator(targetSelector).first();
            const exists = await nextButtonLocator.isVisible({ timeout: 5000 });
            if (exists) {
                console.error(`\tNavigating to page ${nextPageNo}/${this.totalPages}...`);
                await Promise.all([
                    this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { }),
                    nextButtonLocator.click({ force: true }).catch(() => { })
                ]);
                return true;
            }
            else {
                if (nextPageNo <= this.totalPages) {
                    console.error(`\tERROR: Having trouble locating page ${nextPageNo} when it should be there. Target selector used: ${targetSelector}...`);
                }
                else {
                    console.error(`\tNext page link for page ${nextPageNo} not found. Ending pagination.`);
                }
                return false;
            }
        }
        catch (error) {
            console.error(`ERROR: Could not navigate to page ${nextPageNo}:`, error);
            return false;
        }
    }
    async crawlPages() {
        const all = [];
        for (let currentPage = 1; currentPage <= this.totalPages; currentPage++) {
            const pageResults = await this.extractPageData();
            all.push(...pageResults);
            if (currentPage == this.totalPages) {
                console.error(`\tBreaking because we've reached the last page already (${currentPage}).`);
                break;
            }
            else {
                const invalid = await this.clickNextPage(currentPage);
                if (!invalid || currentPage == this.totalPages)
                    break;
            }
            await sleep(jitter(this.delaySecs * 1000));
        }
        return all;
    }
    async clickButton(btn, btnName, successMessage) {
        console.error(`\tAttempting to click the ${btnName} button for ${this.capitalize(this.countyName)} county...`);
        const timeout = this.countyName == 'denver' ? 200000 : 10000;
        try {
            await btn.click({ timeout: timeout });
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        }
        catch (e) {
            console.error(`ERROR: The ${this.capitalize(this.countyName)} county scraper had an error\
             while trying to click the ${btnName} button: ${e.message}`);
            return false;
        }
        console.error(`\t${this.capitalize(btnName)} ${successMessage}`);
        return true;
    }
    async fillDate(dateLocator, dateString, isStartDate = true) {
        console.error(`\tFilling with ${dateString} for ${this.capitalize(this.countyName)} county`);
        try {
            await dateLocator.fill('');
            await dateLocator.focus();
            await sleep(133);
            await dateLocator.pressSequentially(dateString, { delay: 100 });
            await dateLocator.evaluate(e => e.blur());
            return true;
        }
        catch (e) {
            console.error(`Error filling the ${this.dateFilterLabel} ${isStartDate ? 'start' : 'end'}\
             date input for ${this.capitalize(this.countyName)} county: ${e.message}`);
            return false;
        }
    }
    static generateCrawlerName(county) {
        return county.toString().slice(0, 1).toUpperCase() +
            county.toString().slice(1) +
            " County Foreclosure Crawler";
    }
    parseDate(date) {
        const [y, m, d] = date ? date.split('-') : this.startDate.split('-');
        const parsed = `${m.padStart(2, '0')}${this.dividingChar}${d.padStart(2, '0')}${this.dividingChar}${y}`;
        console.error(`\tParsing date string: ${date ? date : this.startDate} to ${parsed}`);
        return parsed;
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    getScrapeTime() {
        const totalSeconds = (this.totalPages * this.delaySecs);
        const secondsStr = ((totalSeconds) % 60).toFixed(0);
        const seconds = parseInt(secondsStr, 10);
        const minutes = (totalSeconds - seconds) / 60;
        console.error(`\tIt will take roughly ${minutes ? minutes + `min${minutes == 1 ? '' : 's'} ` : ''}${seconds}${seconds == 1 ? '' : 's'} to crawl through ${this.capitalize(this.countyName)} county's ${this.totalPages} pages of results.`);
    }
}
