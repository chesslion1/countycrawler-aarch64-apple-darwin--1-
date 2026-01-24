const TARGET_URL = 'https://elpasopublictrustee.com/GTSSearch'; // Direct iframe URL

const startDateElement = {
    id: "#MainContent_CustomContentPlaceHolder_txtCurrentScheduledSaleDateFrom",
    position: -1, // -1 = skip date filtering entirely (El Paso only needs status dropdown)
    type: 'date',
    value: '#MainContent_CustomContentPlaceHolder_txtCurrentScheduledSaleDateTo'
};

const searchElement = {
    id: "#MainContent_CustomContentPlaceHolder_btnSearch",
    type: 'submit',
    value: 'Search'
};

const navPageElement = {
    id: "#MainContent_CustomContentPlaceHolder_TopPagerNav ul > li > a",
    type: 'a.py-1.px-3'
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
    6: 'auction_date',
    7: 'status',
};

// El Paso specific: Status dropdown to filter NED Recorded (active) foreclosures
const statusDropdown = {
    id: "#MainContent_CustomContentPlaceHolder_ddStatus",
    value: "NED Recorded" // Select "NED Recorded" from dropdown for active foreclosures
};

export const elpasoCountyCrawler = {
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
    statusDropdown: statusDropdown, // New field for El Paso
};
