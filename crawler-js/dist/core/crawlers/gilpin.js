const TARGET_URL = 'https://pt.gilpincounty.org/';
const startDateElement = {
    id: "#MainContent_CustomContentPlaceHolder_txtCurrentScheduledSaleDateFrom",
    position: 0,
    type: 'date',
    value: 'txtCurrentScheduledSaleDateFrom'
};
const searchElement = {
    id: "#MainContent_CustomContentPlaceHolder_btnSearch",
    type: 'submit',
    value: 'Search'
};
const navPageElement = {
    id: "#MainContent_CustomContentPlaceHolder_TopPagerNav ul > li > a",
    value: 'a.py-1.px-3',
};
const tableElement = {
    id: "#MainContent_CustomContentPlaceHolder_gvSearchResults",
    type: 'javascript:__doPostBack',
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
export const gilpinCountyCrawler = {
    targetUrl: TARGET_URL,
    dividingChar: '',
    givesFullAddress: false,
    dateFilterLabel: 'Current Scheduled Sale Date Range',
    startDateSelectorElement: startDateElement,
    searchElement: searchElement,
    navPageElement: navPageElement,
    tableElement: tableElement,
    hasDisclaimer: false,
    tableMapping: tableMapping,
};
