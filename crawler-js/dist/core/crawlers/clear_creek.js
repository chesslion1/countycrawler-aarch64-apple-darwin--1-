const TARGET_URL = 'https://foreclosure.clearcreekcounty.us/index.aspx';
const startDateElement = {
    id: "#ctl00_ContentPlaceHolder1_txtCurrentScheduledSaleDateFrom",
    position: 0,
    type: 'text',
    value: 'txtCurrentScheduledSaleDateFrom'
};
const searchElement = {
    id: "#ctl00_ContentPlaceHolder1_btnSearch",
    type: 'submit',
    value: 'Search'
};
const navPageElement = {
    id: "#ctl00_ContentPlaceHolder1_gvSearchResults > tbody > tr:nth-child(1)",
    type: 'a.py-1.px-3',
    value: 'table',
};
const tableElement = {
    id: "#ctl00_ContentPlaceHolder1_gvSearchResults",
    type: 'SearchDetails.aspx', // This is the selector for accessing NED details from table records
};
const tableMapping = {
    0: 'ned_number',
    1: 'owner',
    2: 'street',
    3: 'zip',
    4: 'subdivision',
    5: 'balance_due',
    6: 'status',
};
export const clearCreekCountyCrawler = {
    targetUrl: TARGET_URL,
    dividingChar: '/',
    givesFullAddress: false,
    dateFilterLabel: 'Current Scheduled Sale Date Range',
    startDateSelectorElement: startDateElement,
    searchElement: searchElement,
    navPageElement: navPageElement,
    tableElement: tableElement,
    hasDisclaimer: false,
    tableMapping: tableMapping,
};
