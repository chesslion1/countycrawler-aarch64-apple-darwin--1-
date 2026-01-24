#!/usr/bin/env node
import { program } from 'commander';
import { Crawler } from "./core/crawler.js";
import { chromium } from "playwright";
import { adamsCountyCrawler } from './core/crawlers/adams.js';
import { arapahoeCountyCrawler } from "./core/crawlers/arapahoe.js";
import { elbertCountyCrawler } from "./core/crawlers/elbert.js";
import { broomfieldCountyCrawler } from "./core/crawlers/broomfield.js";
import { clearCreekCountyCrawler } from "./core/crawlers/clear_creek.js";
import { denverCountyCrawler } from "./core/crawlers/denver.js";
import { douglasCountyCrawler } from "./core/crawlers/douglas.js";
import { gilpinCountyCrawler } from "./core/crawlers/gilpin.js";
import { jeffersonCountyCrawler } from "./core/crawlers/jefferson.js";
import { weldCountyCrawler } from "./core/crawlers/weld.js";
import { larimerCountyCrawler } from "./core/crawlers/larimer.js";
import { elpasoCountyCrawler } from "./core/crawlers/elpaso.js";
import { boulderCountyCrawler } from "./core/crawlers/boulder.js";
const crawlers = {
    adams: adamsCountyCrawler,
    arapahoe: arapahoeCountyCrawler,
    broomfield: broomfieldCountyCrawler,
    clearcreek: clearCreekCountyCrawler,
    denver: denverCountyCrawler,
    douglas: douglasCountyCrawler,
    elbert: elbertCountyCrawler,
    gilpin: gilpinCountyCrawler,
    jefferson: jeffersonCountyCrawler,
    larimer: larimerCountyCrawler,
    weld: weldCountyCrawler,
    elpaso: elpasoCountyCrawler,
    boulder: boulderCountyCrawler
};
program
    .name('foreclosure-crawler')
    .description('County foreclosure crawler powered by Playwright')
    .requiredOption('--counties <list>', 'Comma-separated county names', (value) => value.split(","))
    .requiredOption('--start-date <YYYY-MM-DD>', 'Start date (YYYY-MM-DD) for scheduled sale date filter')
    .requiredOption('--is-dev', 'Tell the crawler whether or not it is running in development mode', false)
    .option('--delay-secs <n>', 'Base delay between pages in seconds', (v) => parseInt(v, 10), 10);
program.parse(process.argv);
async function main() {
    const opts = program.opts();
    const browser = await chromium.launch({ headless: false, slowMo: 600 });
    let allCountyRecords = [];
    for (const county of opts.counties) {
        const crawlerParams = crawlers[county];
        if (!crawlerParams) {
            console.error(`Skipping unsupported county: ${county}. Available: ${Object.keys(crawlers).join(', ')}`);
        }
        else {
            const crawlOptions = {
                county: county,
                startDate: opts.startDate,
                delaySecs: opts.delaySecs,
                isDev: opts.isDev,
            };
            const crawler = await Crawler.new(crawlOptions, crawlerParams, browser);
            console.error(`\n${crawler.name()} created`);
            const countyRecords = await crawler.run();
            if (countyRecords.length === 0) {
                console.error(`\tNo records found for ${county} county. Skipping.`);
            }
            else {
                console.error(`\tAppending ${countyRecords.length} records from ${county} county.`);
                allCountyRecords.push(...countyRecords);
            }
            console.error(`\n\tThe ${crawler.name()} crawler has finished scraping`);
        }
    }
    console.log(JSON.stringify(allCountyRecords, null, 2));
    await browser.close().catch(() => { });
}
main();
