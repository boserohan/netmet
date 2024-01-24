let startTimeMap = {};
var capturedSpeedTestId = false
var capturedSpeedTestServerIP = false
// url_list = ["*://www.google.com/","*://evernote.com/","*://www.ietf.org/","*://www.trustpilot.com/", "*://fast.com/", "*://booking.com/*", "*://data.jsdelivr.com/*"]
url_list = [
  '*://www.datadoghq.com/',
  '*://gamewith.jp/',
  '*://hbr.org/',
  '*://www.trustpilot.com/',
  '*://www.healthline.com/',
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
        return;
      }
      // Iterate through response headers
      for (const header of details.responseHeaders) {
        if (header.name.toLowerCase() === 'x-amz-cf-pop') {
          // Capture the value of the cdn header
          const customHeaderValue = header.value;
  
          // Log or process the captured value as needed
          console.log(`${header.name.toLowerCase()}: ${customHeaderValue}`)
          startTimeMap[details.requestId].x_amz_cf_pop = customHeaderValue
  
          // You can also modify the header or perform additional actions here
  
          break; // Stop iterating once the header is found
        }
        else if (header.name.toLowerCase() === 'cf-ray') {
            // Capture the value of the custom header
            const customHeaderValue = header.value;
    
            // Log or process the captured value as needed
            console.log(`${header.name.toLowerCase()}: ${customHeaderValue}`)
            startTimeMap[details.requestId].cf_ray = customHeaderValue
    
            // You can also modify the header or perform additional actions here
    
            break; // Stop iterating once the header is found
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


// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//       // Log or use the received value
//       console.log(`Message from measure_stats.js about ${JSON.stringify(request)}`);
//       chrome.runtime.sendMessage(request);
//     }
// );

// function startTest() {
//   console.log("Starting Test...")
//   chrome.runtime.sendMessage({startTest: 1})
// }

// Function to set the popup periodically
function setPopupPeriodically() {
  // Replace 'popup.html' with your popup HTML file
  // chrome.browserAction.setPopup({ popup: 'popup.html' });
  chrome.windows.create({
    type: 'popup',
    url: 'popup.html',
    width: 400,
    height: 300,
    top: 100,
    left: 100
  });
  console.log("setPopupPeriodically function")
}

// Set an initial alarm when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  setPopupPeriodically();
  // Create an alarm to set the popup periodically
  chrome.alarms.create('setPopupAlarm', {
    periodInMinutes: 180 // Adjust the period as needed (in minutes)
  });
  console.log("Periodic Alarm Set")
});

// Handle the alarm event
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'setPopupAlarm') {
    setPopupPeriodically();
    console.log("Periodic onAlarm listener")
  }
});


console.log("background.js loaded")