let startTimeMap = {};
var capturedSpeedTestClientIP = false
var capturedSpeedTestClientASN = false
var capturedSpeedTestServerLoc = false
var capturedSpeedTestServerIP = false
var popupFrequency = 120
// url_list = ["*://www.google.com/","*://evernote.com/","*://www.ietf.org/","*://www.trustpilot.com/", "*://fast.com/", "*://booking.com/*", "*://data.jsdelivr.com/*"]
url_list = [
  '*://www.datadoghq.com/',
  '*://www.connatix.com/',
  '*://hbr.org/',
  '*://www.trustpilot.com/',
  '*://www.eenadu.net/',
  '*://dto.to/',
  '*://www.bmj.com/',
  '*://www.patreon.com/',
  '*://www.zoom.us/',
  '*://tubidy.cool/',
  '*://speed.cloudflare.com/*'
];
// https://speed.cloudflare.com/__down*
urls_completed = []

let navigationStart;
let domContentLoadedTime;
let pageLoadTime;
var testStatus;



function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let testId;
chrome.runtime.onInstalled.addListener(function(details) {
  // Check if the reason is 'install' (extension is newly installed)
  if (details.reason === 'install') {
    // Code to run only once after the extension is installed
    console.log('Extension installed. Generating unique UUID');
    
    testId=generateUUID();
    console.log(`UUID is ${testId}`)
    chrome.storage.local.set({ measurementId: testId });
    chrome.runtime.sendMessage({measurementId: testId })
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  // Capture the navigation start time
  navigationStart = details.timeStamp;
  domContentLoadedTime = undefined;
  pageLoadTime = undefined;
});

chrome.webNavigation.onDOMContentLoaded.addListener(details => {
  // Capture the DOMContentLoaded time
  domContentLoadedTime = details.timeStamp;
  // calculatePageLoadTime();
});

chrome.webNavigation.onCompleted.addListener(details => {
  // Capture the onCompleted time
  pageLoadTime = details.timeStamp;
  calculatePageLoadTime(details.url);
});

function calculatePageLoadTime(url) {
  // Calculate the page load time when both DOMContentLoaded and onCompleted events are captured
  if (domContentLoadedTime !== undefined && pageLoadTime !== undefined) {
    const loadTime = pageLoadTime - navigationStart;
    console.log(`${url} Page load time: ${loadTime} milliseconds`);
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    url = details.url
    console.log(`onBeforeRequest URL: ${details.url}`);
    // chrome.runtime.sendMessage({measurementVal: { measurementID: testId}});
    // if (url.includes('https://aim.cloudflare.com/__log')) {
    //   capturedSpeedTestClientASN = false
    //   capturedSpeedTestClientIP = false
    //   capturedSpeedTestServerIP = false
    //   capturedSpeedTestServerLoc = false
    // }
    // if (!capturedSpeedTestId) {
    //   if (details.url.includes('https://speed.cloudflare.com/__down?')) {
    //     const url = new URL(details.url);
    //     const queryString = url.search.substring(1); // Exclude the leading "?"
        
    //     // Parse the query string into an object
    //     const queryParams = {};
    //     queryString.split('&').forEach(function(param) {
    //       const keyValue = param.split('=');
    //       const key = decodeURIComponent(keyValue[0]);
    //       const value = keyValue.length > 1 ? decodeURIComponent(keyValue[1]) : null;
    //       queryParams[key] = value;
    //     });

    //     // Do something with the query parameters
    //     console.log("Cloudflare Speed Test")
    //     console.log('Query Parameters:', queryParams);
    //     capturedSpeedTestId = true

    //   }
    // }
  },
  { urls: url_list },
  ["blocking"]
);

chrome.webRequest.onSendHeaders.addListener(
    function (details) {
      if (details.url.includes('speed.cloudflare.com')) {
        return;
      }
        startTimeMap[details.requestId] = {
              startTime: details.timeStamp,
              requestUrl: details.url,
            };
    },
    { urls: url_list }
);

chrome.webRequest.onBeforeRedirect.addListener(
  function (details) {
    if (details.url.includes('speed.cloudflare.com')) {
      return;
    }
    const requestId = details.requestId;
    const startTimeData = startTimeMap[requestId];

    if (!startTimeData) {
      return;
    }

    console.log(`Redirected URL: ${startTimeData.requestUrl} to ${details.url}`);
  },
  { urls: url_list }
);

chrome.webRequest.onResponseStarted.addListener(
    function (details) {
        if (details.url.includes('speed.cloudflare.com')) {
          return;
        }

        const requestId = details.requestId;
        const startTimeData = startTimeMap[requestId];
    
        if (!startTimeData) {
          return;
        }
    
        // Calculate Time To First Byte (TTFB)
        const respStart = details.timeStamp
        const ttfb = respStart - startTimeData.startTime;
        startTimeMap[requestId].respStartTime = respStart
        startTimeMap[requestId].ttfb = ttfb;

      },
      { urls: url_list }
)

chrome.webRequest.onCompleted.addListener(
  function (details) {
    if (details.url.includes('speed.cloudflare.com')) {
      if (!capturedSpeedTestServerIP) {
        if (details.url.includes('https://speed.cloudflare.com/__down?')) { 
        const server_ip = details.ip
        console.log(`Speed Test Server IP: ${server_ip}`)
        chrome.runtime.sendMessage({speedTest: { serverIP: server_ip}})
        }
      capturedSpeedTestServerIP = true
      }
      return;
    }
    const requestId = details.requestId;
    const startTimeData = startTimeMap[requestId];

    if (!startTimeData) {
      return;
    }
    console.log("Request Completed")
    // Calculate download Time
    const dlt = details.timeStamp - startTimeData.respStartTime;
    startTimeMap[requestId].dlt = dlt;
    // Calculate Page Load Time (PLT)
    const plt = details.timeStamp - startTimeData.startTime;
    startTimeMap[requestId].plt = plt;
    startTimeMap[requestId].ip = details.ip;
    startTimeMap[requestId].status = "success";
    startTimeMap[requestId].statusCode = details.statusCode;
    console.log(`URL: ${startTimeData.requestUrl}`);
    console.log(`details : ${JSON.stringify(details)}`)



    // Send message to other extension components
    chrome.runtime.sendMessage(startTimeMap[requestId]);

  },
  { urls: url_list }
);

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
      if (details.url.includes('speed.cloudflare.com')) {
        if (details.url.includes('https://speed.cloudflare.com/__down?')) {
        for (const header of details.responseHeaders) {
          if (header.name.toLowerCase() === 'cf-meta-colo' && !capturedSpeedTestServerLoc) {
            // Capture the value of the cdn header
            const serverLoc = header.value;
            // Log or process the captured value as needed
            console.log(`${header.name.toLowerCase()}: ${serverLoc}`)
            // startTimeMap[details.requestId].server_loc = customHeaderValue
            chrome.runtime.sendMessage({speedTest: { serverLocation: serverLoc}})
            capturedSpeedTestServerLoc = true
          }
          else if (header.name.toLowerCase() === 'cf-meta-asn' && !capturedSpeedTestClientASN) {
            // Capture the value of the cdn header
            const clientASN = header.value;
            // Log or process the captured value as needed
            console.log(`${header.name.toLowerCase()}: ${clientASN}`)
            // startTimeMap[details.requestId].client_asn = customHeaderValue
            chrome.runtime.sendMessage({speedTest: { clientASN: clientASN}})
            capturedSpeedTestClientASN = true
          }
          else if (header.name.toLowerCase() === 'cf-meta-ip' && !capturedSpeedTestClientIP) {
            // Capture the value of the cdn header
            const clientIP = header.value;
            // Log or process the captured value as needed
            console.log(`${header.name.toLowerCase()}: ${clientIP}`)
            // startTimeMap[details.requestId].client_ip = customHeaderValue
            chrome.runtime.sendMessage({speedTest: { clientIP: clientIP}})
            capturedSpeedTestClientIP = true
          }

          if (capturedSpeedTestServerLoc && capturedSpeedTestClientIP && capturedSpeedTestClientASN) {
            break;
          }
        }
        }
        return;
      }
      
      var found_amz_cache_status = false
      var found_amz_pop_loc = false
      // Iterate through response headers
      for (const header of details.responseHeaders) {
        if (header.name.toLowerCase() === 'x-amz-cf-pop') {
          // Capture the value of the cdn header
          const customHeaderValue = header.value;
          // Log or process the captured value as needed
          console.log(`${header.name.toLowerCase()}: ${customHeaderValue}`)
          startTimeMap[details.requestId].x_amz_cf_pop = customHeaderValue
          found_amz_pop_loc = true
        }
        else if (header.name.toLowerCase() === 'cf-ray') {
            // Capture the value of the custom header
            const customHeaderValue = header.value;
            // Log or process the captured value as needed
            console.log(`${header.name.toLowerCase()}: ${customHeaderValue}`)
            startTimeMap[details.requestId].cf_ray = customHeaderValue
            break;
        }
        
        if (header.name.toLowerCase() === 'x-cache') {
          // Capture the value of the cdn header
          const customHeaderValue = header.value;
          // Log or process the captured value as needed
          console.log(`${header.name.toLowerCase()}: ${customHeaderValue}`)
          startTimeMap[details.requestId].x_cache = customHeaderValue
          found_amz_cache_status = true
        }

        if (found_amz_cache_status && found_amz_pop_loc) {
          break;
        }
      }
      // Return the responseHeaders property to allow the response to continue
      return { responseHeaders: details.responseHeaders };
    },
    { urls: url_list },
    ["responseHeaders"]
);

chrome.webRequest.onErrorOccurred.addListener(
  function (details) {
    if (details.url.includes('speed.cloudflare.com')) {
      return;
    }
    console.error('Error:', details.error);
    // delete startTimeMap[details.requestId];
    startTimeMap[details.requestId].status = "fail";
    chrome.runtime.sendMessage(startTimeMap[details.requestId]);
  },
  { urls: url_list}
);


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      // Log or use the received value
      console.log(`Message from measure_stats.js about ${JSON.stringify(request)}`);
      if (request.speedTestCompleted) {
        capturedSpeedTestClientASN = false
        capturedSpeedTestClientIP = false
        capturedSpeedTestServerIP = false
        capturedSpeedTestServerLoc = false
      }
      if (request.retrieveUUID) {
        chrome.storage.local.get(['measurementId'], function(result) {
          console.log(`Retrieved UUID from storage: ${result.measurementId}`)
          chrome.runtime.sendMessage({measurementId: testId })
          });
      }
      // chrome.runtime.sendMessage({lastASN: {
      //   ASN: asn,
      //   lastResults : {timestamp: lastTestDate},
      // }})
      if (request.lastASN) {

        chrome.storage.local.set({ lastASN: request.lastASN.ASN });
        console.log(`asnLast: ${JSON.stringify(request.lastASN.ASN)}`)

        chrome.storage.local.get(['asnLastResults'], function(result) {
          var asnLastResultsUpdated = result.asnLastResults || {};
          asnLastResultsUpdated[request.lastASN.ASN] = request.lastASN.lastResults
          chrome.storage.local.set({ asnLastResults: asnLastResultsUpdated });
          console.log(`asnLastResults: ${JSON.stringify(asnLastResultsUpdated)}`)
        })

        // chrome.storage.local.get(['asnSet'], function(result) {
        //   var asnSetUpdated = null;
        //   if (!result.asnSet) {
        //     asnSetUpdated = new Set()
        //     console.log("New ASN set created")
        //   } else {
        //     asnSetUpdated = result.asnSet
        //     console.log(`Existing ASN set: ${asnSetUpdated}`)
        //   }
        //   asnSetUpdated.add(request.lastASN.ASN)
        //   chrome.storage.local.set({ asnSet: asnSetUpdated });
        //   console.log(`asnSet: ${asnSetUpdated}`)
        // })
      }

      if (request.getASNDetails) {
        var allASNDetails = new Object()
        chrome.storage.local.get(['lastASN'], function(result) {
          var lastASN = result.lastASN || null;
          if (lastASN) {
            allASNDetails['lastASN'] = lastASN
            chrome.storage.local.get(['asnLastResults'], function(result) {
              var lastASNResults = result.asnLastResults || null;
              if (lastASNResults.hasOwnProperty(lastASN)) {
                allASNDetails['lastResults'] = lastASNResults[lastASN]
              }
              allASNDetails['asnSet'] = Object.keys(lastASNResults)
              chrome.runtime.sendMessage({asnDetails: allASNDetails})
              console.log(`sending details to popup.js: ${JSON.stringify(allASNDetails)}`)
            })
          }
        }) 
      }
      if (request.newAlarmFrequency) {
        var alarmInt = parseInt(request.newAlarmFrequency);
        if (!isNaN(alarmInt)) {
          setAlarm(alarmInt)
          chrome.runtime.sendMessage({ alarmFrequency: alarmInt})
        }
      }
      if (request.getPopupFrequency) {
        chrome.storage.local.get(['alarmFrequency'], function(result) {
          chrome.runtime.sendMessage({ alarmFrequency: result.alarmFrequency})
        })
      }
    }
);


// Function to set the popup periodically
function setPopupPeriodically() {

  chrome.windows.create({
    type: 'popup',
    url: 'index.html',
    width: 700,
    height: 700,
    // top: 100,
    // left: 100,
    top: 100,
    left: 100
    // state: 'maximized'
  });
  console.log("setPopupPeriodically function")
}

// Set an initial alarm when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  setPopupPeriodically();
  // Create an alarm to set the popup periodically
  setAlarm(popupFrequency)
  console.log("Periodic Alarm Set")
});

// Handle the alarm event
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'setPopupAlarm') {
    setPopupPeriodically();
    console.log("Periodic onAlarm listener");
  }
});

function setAlarm(frequencyInMins) {
  chrome.storage.local.set({ alarmFrequency: frequencyInMins });
  chrome.alarms.create('setPopupAlarm', {
    periodInMinutes: frequencyInMins // Adjust the period as needed (in minutes)
  });
}

console.log("background.js loaded")