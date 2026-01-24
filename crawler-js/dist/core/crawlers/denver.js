const TARGET_URL = 'https://www.denvergov.org/ForeclosurePortal/Home.aspx/Search';
const startDateElement = {
    id: "#electionDemandFrom",
    position: 1, // Specifies whether it is the first (0) or second (1) input field
    value: '#electionDemandFromTo' // id of the end date element
};
const searchElement = {
    id: "#searchButton",
};
const navPageElement = {
    id: "#gridSearchResults_paginate > span",
    type: 'a.paginate_button'
};
const tableElement = {
    id: "#gridSearchResults",
    type: '/', // This is the selector for accessing NED details from table records
};
const tableMapping = {
    0: 'owner',
    2: 'ned_number',
    3: 'status',
    4: 'address',
    5: 'balance_due',
    6: 'auction_date',
    7: 'ned_file_date',
};
const disclaimerElement = {
    id: "#acceptDisclaimerButton",
    position: 2,
    value: 'I accept'
};
export const denverCountyCrawler = {
    targetUrl: TARGET_URL,
    dividingChar: '/',
    givesFullAddress: true,
    dateFilterLabel: 'Election/Demand Date',
    startDateSelectorElement: startDateElement,
    searchElement: searchElement,
    navPageElement: navPageElement,
    tableElement: tableElement,
    hasDisclaimer: disclaimerElement,
    tableMapping: tableMapping,
};
