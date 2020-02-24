const SHEET_ID = '1euDmuRjo2oUJ16SRfYFUXd46q2ll0O0rnuAEg6cfmn0';
const SHEET_RANGE = 'Sheet1!A1:E10000000'
const SHEET_API = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/`;
const API_KEY = "AIzaSyAVfxRdgXyLK0WGXBPRqhkLPSyfYjeba-8";
const SHEET_GET = SHEET_API + `${SHEET_RANGE}?key=${API_KEY}`;
const SHEET_POST = SHEET_API + `${SHEET_RANGE}:append?key=${API_KEY}&valueInputOption=USER_ENTERED`;

chrome.browserAction.onClicked.addListener(buttonClicked);
chrome.runtime.onMessage.addListener(gotMessage);

async function buttonClicked(e) {
  /* const entries = await getEntries();
  const formatted = formatDataRow(entries);
  const products = findEntries(formatted, {products:'rtdb', CaseId: 2})
  console.log(products) */
  // const result = await postEntry([1,3,2,4,5]);
  /* const result = await updateEntry({id:15, entry:[null,"RTDB1","WELL:DONE1","NOT MORE THAN 111"]});
  console.log(result) */
}

function gotMessage(request, sender, sendResponse) {
  (async () => {
    switch (request.code) {
      case 'GET_ENTRY':
        // {code: 'GET_ENTRY', {param: {products:'rtdb', CaseId: 2}}}
        const entries = await getEntries();
        const queryResult = findEntries(entries, request.param);
        sendResponse({status: "SUCCESS", queryResult});
        break;
  
      case 'POST_ENTRY':
        // {code: 'POST_ENTRY', entry: [1,2,3,4,5]
        const createdResult = await postEntry(request.entry)
        sendResponse({status: "SUCCESS", createdResult});
        break;

      case 'UPDATE_ENTRY':
        // {code: 'UPDATE_ENTRY', data: {id: 15, entry: [null,"RTDB1","WELL:DONE1","NOT MORE THAN 111"]}}
        const updatedResult = await updateEntry(request.entry)
        sendResponse({status: "SUCCESS", updatedResult});
        break;
    
      default:
        break;
    }
  })();
  return true;
}

function findEntries(entries, param) {
  let result = entries;
  for (const key in param) {
    result = result.filter(e => e[[key]] == param[[key]]);
  }
  return result;
}

function findSheetRangeByCaseId(entries, caseId) {
  const i = entries.findIndex(e => e.CASEID == caseId);
  if (i < 0) return;
  return `Sheet1!A${i+2}:E${i+2}`;
}

function formatDataRow(entries) {
  const cols = [...entries[0]], data = [];
  entries.splice(1, entries.length).forEach(e => {
    const row = {};
    cols.forEach((col, iCol) => {
      row[[col]] = e[iCol];
    });
    data.push(row);
  });
  return data;
}

async function getEntries() {
  const token = await getToken(); 
  const entries = await sendRequest(SHEET_GET, {headerOptions: {'Authorization': 'Bearer ' + token}});
  return formatDataRow(entries.values);
}

async function postEntry(entry) {
  const data = {
    range: SHEET_RANGE,
    majorDimension: "ROWS",
    values: [entry],
  };
  const token = await getToken(); 
  return await sendRequest(SHEET_POST, {method: 'POST', data, headerOptions: {'Authorization': 'Bearer ' + token}});
}

async function updateEntry({id, entry}) {
  const entries = await getEntries();
  const range = findSheetRangeByCaseId(entries, id);
  const SHEET_PUT = SHEET_API + `${range}?key=${API_KEY}&valueInputOption=USER_ENTERED`;
  const data = {
    range,
    majorDimension: "ROWS",
    values: [entry]
  };
  const token = await getToken(); 
  return await sendRequest(SHEET_PUT, {method: 'PUT', data, headerOptions: {'Authorization': 'Bearer ' + token}});
}

function getToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 'interactive': true }, (token) => resolve(token));
  })
}

function sendRequest(url, {method, data, headerOptions}) {
  const body = JSON.stringify(data);
  const headers = new Headers({...headerOptions, 'Content-Type': 'application/json'});
    return new Promise((resolve, reject) => {
      fetch(
        url, {
          body,
          method,
          headers,
        })
        .then(response => response.json())
        .then((response) => resolve(response))
        .then((error) => {
        reject(error);
        });
    })
}