let startTimeMap = {};

url_list = ["*://www.google.com/","*://evernote.com/","*://www.ietf.org/","*://www.trustpilot.com/"]
urls_completed = []

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    url = details.url

  },
  { urls: url_list },
  ["blocking"]
);

chrome.webRequest.onSendHeaders.addListener(
    function (details) {
        startTimeMap[details.requestId] = {
            //   startTime: window.performance.now(),
              startTime: details.timeStamp,
              requestUrl: details.url,
            //   redirectTime: 0,
            //   tcpConnectTime: 0,
            //   pageLoadTime: 0,
            };
    },
    { urls: url_list }
);

chrome.webRequest.onBeforeRedirect.addListener(
  function (details) {
    const requestId = details.requestId;
    const startTimeData = startTimeMap[requestId];

    if (!startTimeData) {
      return;
    }

    // const endTime = window.performance.now();
    // const connectTime = endTime - startTimeData.startTime;
    // const dnsLookupTime = details.timeStamp - startTimeData.startTime;

    console.log(`URL: ${startTimeData.requestUrl}`);
    // console.log(`Connect Time: ${connectTime} ms`);
    // console.log(`DNS Lookup Time: ${dnsLookupTime} ms`);

    // // Calculate Time To First Byte (TTFB)
    // const ttfb = details.timeStamp - details.redirectEnd;
    // console.log(`Time To First Byte (TTFB): ${ttfb} ms`);

    // startTimeMap[requestId].ttfb = ttfb;
  },
  { urls: url_list }
);

chrome.webRequest.onResponseStarted.addListener(
    function (details) {
        const requestId = details.requestId;
        const startTimeData = startTimeMap[requestId];
    
        if (!startTimeData) {
          return;
        }
    
        // Calculate Time To First Byte (TTFB)
        // console.log(`URL: ${startTimeData.requestUrl}`);
        const respStart = details.timeStamp
        const ttfb = respStart - startTimeData.startTime;
        // console.log(`Page Load Time (PLT): ${plt} ms`);
        startTimeMap[requestId].respStartTime = respStart
        startTimeMap[requestId].ttfb = ttfb;

      },
      { urls: url_list }
)

chrome.webRequest.onCompleted.addListener(
  function (details) {
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
    // console.log(`URL: ${startTimeData.requestUrl}`);
    const plt = details.timeStamp - startTimeData.startTime;
    startTimeMap[requestId].plt = plt;
    startTimeMap[requestId].ip = details.ip;
    startTimeMap[requestId].status = "success";
    startTimeMap[requestId].statusCode = details.statusCode;
    // console.log(`Page Load Time (PLT): ${plt} ms`);
    console.log(`URL: ${startTimeData.requestUrl}`);
    console.log(`details : ${JSON.stringify(details)}`)
    // console.log(`Start Time: ${startTimeMap[requestId].startTime}`)
    // console.log(`TCP Connect Time: ${startTimeMap[requestId].tcpConnectTime}`)
    // console.log(`TTFB: ${startTimeMap[requestId].ttfb}`)
    // console.log(`Download Time: ${startTimeMap[requestId].dlt}`)
    // console.log(`PLT: ${startTimeMap[requestId].plt}`)
    // Send message to other extension components
    chrome.runtime.sendMessage(startTimeMap[requestId]);
 
    // delete startTimeMap[requestId];
  },
  { urls: url_list }
);

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
      // Iterate through response headers to find the one you want
      for (const header of details.responseHeaders) {
        if (header.name.toLowerCase() === 'x-amz-cf-pop') {
          // Capture the value of the custom header
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
      console.log(`Message from measure_stats.js about ${request.store_msm}`);
      chrome.runtime.sendMessage(request);
    }
);
