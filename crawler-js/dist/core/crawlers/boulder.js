const TARGET_URL = 'https://www.bouldercountypt.org/GTSSearch'; // Direct GTS Search URL

const startDateElement = {
    id: "#ctl00_ContentPlaceHolder1_txtCurrentScheduledSaleDateFrom",
    position: -1, // -1 = skip date filtering entirely (Boulder only needs status dropdown)
    type: 'text',
    value: '#ctl00_ContentPlaceHolder1_txtCurrentScheduledSaleDateTo'
};

const searchElement = {
    id: "#ctl00_ContentPlaceHolder1_btnSearch",
    type: 'submit',
    value: 'Search'
};

const navPageElement = {
    id: "#ctl00_ContentPlaceHolder1_gvSearchResults > tbody > tr:first-child td table a",
    type: "#ctl00_ContentPlaceHolder1_gvSearchResults > tbody > tr:first-child td table a",
};

const tableElement = {
    id: "#ctl00_ContentPlaceHolder1_gvSearchResults",
    type: 'javascript:__doPostBack',
};

const tableMapping = {
    0: 'ned_number',
    1: 'owner',
    2: 'street',
    3: 'zip',
    4: 'subdivision',
    5: 'status',
};

// Boulder specific: Status dropdown to filter NED Recorded (active) foreclosures
const statusDropdown = {
    id: "#ctl00_ContentPlaceHolder1_ddStatus",
    value: "NED Recorded" // Select "NED Recorded" from dropdown for active foreclosures
};

export const boulderCountyCrawler = {
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
    statusDropdown: statusDropdown,
};

