const API_KEY = "AIzaSyAVfxRdgXyLK0WGXBPRqhkLPSyfYjeba-8";
const SHEET_RANGE = 'Sheet1!A1:E5'
const SHEET_ID = '1euDmuRjo2oUJ16SRfYFUXd46q2ll0O0rnuAEg6cfmn0';
const SHEET_API = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/`;
const SHEET_GET = SHEET_API + `${SHEET_RANGE}?key=${API_KEY}`;
const SHEET_POST = SHEET_API + `${SHEET_RANGE}:append?key=${API_KEY}&valueInputOption=USER_ENTERED`;

chrome.browserAction.onClicked.addListener(buttonClicked);
chrome.runtime.onMessage.addListener(gotMessage);

async function buttonClicked(e) {
  /* const entries = await getEntry();
  const formatted = formatDataRow(entries);
  const products = findEntries(formatted, {products:'rtdb', CaseId: 2})
  console.log(products) */
  const result = await postEntry([1,3,2,4,5]);
  console.log(result)
}

function gotMessage(request, sender, sendResponse) {
  (async () => {
    switch (request.code) {
      case 'GET_ENTRY':
        // {code: 'GET_ENTRY', {param: {products:'rtdb', CaseId: 2}}}
        const entries = await getEntry();
        const queryResult = findEntries(entries, request.param);
        sendResponse({status: "SUCCESS", queryResult});
        break;
  
      case 'POST_ENTRY':
        // {code: 'POST_ENTRY', data: [1,2,3,4,5]
        const result = await postEntry(request.option)
        sendResponse({status: "SUCCESS", result});
        break;

      case 'UPDATE_NEED_REPRO':
        const needRepro = await updateNeedRepro(request.option)
        sendResponse({status: "SUCCESS", needRepro});
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

async function getEntry() {
  const token = await getToken(); 
  const entries = await sendRequest(SHEET_GET, {headerOptions: {'Authorization': 'Bearer ' + token}});
  return formatDataRow(entries.values);
}

async function postEntry(entry) {
  const data = {
    range: SHEET_RANGE,
    majorDimension: "COLUMNS",
    values: entry.map(e => [e])
  };
  const token = await getToken(); 
  return await sendRequest(SHEET_POST, {method: 'POST', data, headerOptions: {'Authorization': 'Bearer ' + token}});
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
          url,{
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