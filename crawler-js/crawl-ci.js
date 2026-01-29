#!/usr/bin/env node
/**
 * CI-friendly scraper for GitHub Actions
 * Runs headless, outputs CSV to ../output/
 */

import { chromium } from 'playwright';
import { Crawler } from './dist/core/crawler.js';
import { adamsCountyCrawler } from './dist/core/crawlers/adams.js';
import { arapahoeCountyCrawler } from './dist/core/crawlers/arapahoe.js';
import { elbertCountyCrawler } from './dist/core/crawlers/elbert.js';
import { broomfieldCountyCrawler } from './dist/core/crawlers/broomfield.js';
import { clearCreekCountyCrawler } from './dist/core/crawlers/clear_creek.js';
import { denverCountyCrawler } from './dist/core/crawlers/denver.js';
import { douglasCountyCrawler } from './dist/core/crawlers/douglas.js';
import { gilpinCountyCrawler } from './dist/core/crawlers/gilpin.js';
import { jeffersonCountyCrawler } from './dist/core/crawlers/jefferson.js';
import { weldCountyCrawler } from './dist/core/crawlers/weld.js';
import { larimerCountyCrawler } from './dist/core/crawlers/larimer.js';
import { elpasoCountyCrawler } from './dist/core/crawlers/elpaso.js';
import { boulderCountyCrawler } from './dist/core/crawlers/boulder.js';
import fs from 'fs';
import path from 'path';

const crawlers = {
  denver: denverCountyCrawler,  // Denver first (most likely to fail)
  adams: adamsCountyCrawler,
  arapahoe: arapahoeCountyCrawler,
  boulder: boulderCountyCrawler,
  broomfield: broomfieldCountyCrawler,
  clearcreek: clearCreekCountyCrawler,
  douglas: douglasCountyCrawler,
  elbert: elbertCountyCrawler,
  elpaso: elpasoCountyCrawler,
  gilpin: gilpinCountyCrawler,
  jefferson: jeffersonCountyCrawler,
  larimer: larimerCountyCrawler,
  weld: weldCountyCrawler,
};

const OUTPUT_DIR = path.join(process.cwd(), '..', 'output');
const ARCHIVE_DIR = path.join(OUTPUT_DIR, 'archive');

async function main() {
  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const today = new Date().toISOString().split('T')[0];
  console.log(`Starting daily scrape: ${today}`);

  // Launch headless browser
  const browser = await chromium.launch({ headless: true });
  let allRecords = [];

  for (const [county, crawlerParams] of Object.entries(crawlers)) {
    console.log(`\nScraping ${county} county...`);
    
    try {
      const crawlOptions = {
        county: county,
        startDate: today,
        delaySecs: 5,
        isDev: false,
      };

      const crawler = await Crawler.new(crawlOptions, crawlerParams, browser);
      const records = await crawler.run();

      if (records.length > 0) {
        console.log(`  Found ${records.length} records`);
        allRecords.push(...records);
      } else {
        console.log(`  No records found`);
      }
    } catch (error) {
      console.error(`  Error scraping ${county}: ${error.message}`);
      // Continue with other counties
    }
  }

  await browser.close();

  console.log(`\nTotal records: ${allRecords.length}`);

  if (allRecords.length === 0) {
    console.log('No records found. Exiting.');
    process.exit(1);
  }

  // Convert to CSV
  const headers = [
    'ned_number', 'ned_details_link', 'owner', 'street', 'city', 
    'county', 'state', 'zip', 'subdivision', 'balance_due', 
    'auction_date', 'status', 'ned_file_date', 'address'
  ];

  let csv = headers.join(',') + '\n';
  
  allRecords.forEach(record => {
    const row = headers.map(h => {
      const val = (record[h] || '').toString();
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    csv += row.join(',') + '\n';
  });

  // Save to output/latest.csv
  const latestPath = path.join(OUTPUT_DIR, 'latest.csv');
  fs.writeFileSync(latestPath, csv);
  console.log(`Saved to: ${latestPath}`);

  // Save dated backup to output/archive/YYYY-MM-DD.csv
  const archivePath = path.join(ARCHIVE_DIR, `${today}.csv`);
  fs.writeFileSync(archivePath, csv);
  console.log(`Archived to: ${archivePath}`);

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
