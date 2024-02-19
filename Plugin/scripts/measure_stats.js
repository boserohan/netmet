var performanceDict = new Object()
var speedTestResult = new Object()
var ipDetails = new Object()

const urlList = [
  'https://www.datadoghq.com/',
  'https://gamewith.jp/',
  'https://hbr.org/',
  'https://www.trustpilot.com/',
  'https://www.healthline.com/',
  'https://dto.to/',
  'https://www.bmj.com/',
  'https://www.patreon.com/',
  'https://www.zoom.us/',
  'https://tubidy.cool/'
];


var urlsOpened = []

// var testId = generateUUID();
var testId = null;


// const script = document.createElement('script');
// script.src = "aws-sdk-2.1529.0.min.js"
// document.body.appendChild(script);

// var s3_options = {
//   endpoint: "http://localhost:9000",
//   accessKeyId: "DLhmhybad207JQADbafj",
//   secretAccessKey: "P5qZI72V2Cmj2vkWCbp8iwsD1x4HsuI9bTBz1y5o",
//   s3ForcePathStyle: 'true',
//   signatureVersion: 'v4'
// }

var s3_options = {
  endpoint: "http://131.159.25.97:9000",
  accessKeyId: "jOfZnouPDSkAPNFhIUbQ",
  secretAccessKey: "WDgKvikfddTvrFXuC9YvRB6RzOn2w8vmDyTtNVdS",
  s3ForcePathStyle: 'true',
  signatureVersion: 'v4'
}

// script.onload = function() {
  // s3 = new AWS.S3(s3_options)
// }

var s3 = new AWS.S3(s3_options)

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(`request: ${JSON.stringify(request)}`)
    if (request.measurementVal) {
      testId = request.measurementVal.measurementID
    }
    if (request.status) {
      urlsOpened.push(request.requestUrl)
      console.log(urlsOpened)
      const requestUrl = request.requestUrl
      if (request.status == "success"){
        if (!(requestUrl in performanceDict)) {
          performanceDict[requestUrl] = {}
        }
        performanceDict[requestUrl]['ip'] = request.ip
        // performanceDict[requestUrl]['ttfb'] = request.ttfb
        // performanceDict[requestUrl]['dlt'] = request.dlt
        // performanceDict[requestUrl]['plt'] = request.plt
        performanceDict[requestUrl]['statusCode'] = request.statusCode
        performanceDict[requestUrl]['status'] = request.status
        if (request.x_amz_cf_pop) {
          performanceDict[requestUrl]['x_amz_cf_pop'] = request.x_amz_cf_pop
        }
        if (request.cf_ray) {
          performanceDict[requestUrl]['cf_ray'] = request.cf_ray
        }
      } else if (request.status == "fail") {
        performanceDict[requestUrl] = {}
        performanceDict[requestUrl]['status'] = request.status
        performanceDict[requestUrl]['statusCode'] = request.statusCode
      }
    }
    if (request.performance) {
      const currentUrl = request.performance
      if (!(currentUrl in performanceDict)) {
        performanceDict[currentUrl] = {}
      }
      performanceDict[currentUrl]['ttfb'] = request.ttfb
      performanceDict[currentUrl]['latency'] = request.latency
      performanceDict[currentUrl]['dnsLookupTime'] = request.dnsLookupTime
      performanceDict[currentUrl]['tcpConnectTime'] = request.tcpConnectTime
      performanceDict[currentUrl]['tlsNegotiationTime'] = request.tlsNegotiationTime
      performanceDict[currentUrl]['transferSize'] = request.transferSize
    } 
    if (request.speedTest) {
      var speedTestDict = request.speedTest
      if (speedTestDict.serverIP) {
        speedTestResult['serverIP'] = speedTestDict.serverIP
      }
      else if (speedTestDict.serverLocation) {
        speedTestResult['serverLocation'] = speedTestDict.serverLocation
      }
      else if (speedTestDict.clientIP) {
        speedTestResult['clientIP'] = speedTestDict.clientIP
      }
      else if (speedTestDict.clientASN) {
        speedTestResult['clientASN'] = speedTestDict.clientASN
      }
    }
    if (request.startTest) {
      testSteps()
    }
    // if (request.action) {
    //   console.log(`Action: ${request.action}`)
    //   chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
    //     if (chrome.runtime.lastError) {
    //       console.error(chrome.runtime.lastError.message);
    //     } else {
    //       fetch(dataUrl).then(response => response.blob()).then(blob => {
    //         const filename = testId + "_bandwidthtest.png"
    //         const file = new File([blob], filename, { type: 'image/png' });
            
    //         const params = {
    //           Key: filename,
    //           ContentType: 'image/png',
    //           Body: file,
    //           Bucket: "measurements", 
    //         };
    
    //         // Upload the file to S3
    //         s3.upload(params, function(err, data) {
    //           if (err) {
    //             console.error('S3 Upload Error:', err);
    //           } else {
    //             console.log('File uploaded successfully. S3 URL:', data.Location);
    //           }
    //         });
    //         console.log('Screenshot captured');
    //         var ol_element = document.getElementById("test-progress-list")
    //         ol_element.children[ol_element.childElementCount - 1].textContent = "Running Speed Test......Done";
    //         if (!(document.getElementById("test-completed"))) {
    //           var steps_element = document.getElementById("progress-steps")
    //           var completed_element = document.createElement('li')
    //           completed_element.textContent = "Test Completed"
    //           completed_element.id = "test-completed"
    //           steps_element.appendChild(completed_element)

    //           // chrome.tabs.update({ url: "show_progress.html" })
    //         }
    //       });
    //     }
    //   });  
    // }
    // if (urlsOpened.length == urlList.length) {
    //   // console.log("All Urls opened!")
    //   filename = testId + ".json"
    //   var params = {
    //       Body: JSON.stringify(performanceDict), 
    //       Bucket: "measurements", 
    //       Key: filename, 
    //   }
    //   s3.putObject(params, function(err, data) {
    //       if (err) console.log(err, err.stack) // an error occurred
    //       else     console.log(data)           // successful response
    //   })
    // }
  }
);

function savePerformanceStats() {
    var timestampInMilliseconds = new Date().getTime();
    var timestampString = timestampInMilliseconds.toString();
    var completeTestObj = new Object()
    completeTestObj['client_details'] = ipDetails
    completeTestObj['client_details']['measurementID'] = testId
    completeTestObj['client_details']['timestamp'] = timestampInMilliseconds
    completeTestObj['web_browsing'] = performanceDict
    completeTestObj['speed_test'] = speedTestResult
    
    filename = testId + "_" + timestampString + ".json"
    var params = {
        Body: JSON.stringify(completeTestObj), 
        Bucket: "measurements", 
        Key: filename, 
    }
    console.log("Saving performance stats to object storage")
    s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else     console.log(data)           // successful response
    })
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// this function converts the generic JS ISO8601 date format to the specific format the AWS API wants
function getAmzDate(dateStr) {
  var chars = [":","-"];
  for (var i=0;i<chars.length;i++) {
    while (dateStr.indexOf(chars[i]) != -1) {
      dateStr = dateStr.replace(chars[i],"");
    }
  }
  dateStr = dateStr.split(".")[0] + "Z";
  return dateStr;
}

async function getIPGeolocationData() {
    // console.log(`Sending message to tab: ${progressTab}`)
    // chrome.tabs.sendMessage(progressTab,{update: "Retrieving IP and geolocation...", step: "New"})
    
    // STATUS UPDATES
    ol_element = document.getElementById("test-progress-list")
    var ipretrievalStep = document.createElement('li')
    ipretrievalStep.textContent = "Retrieving IP and geolocation..."
    ol_element.appendChild(ipretrievalStep)

    url = 'http://ip-api.com/json/'
    const ipRequest = new Request(url)
    const response = await fetch(ipRequest, {cache: "no-store"})
    const ipJsonDetails = await response.json()
    // const observer = new PerformanceObserver((list) => {
    //     console.log('Performance Entries upcoming')
    //     // performanceDict[url] = {}
        
    //     list.getEntries().forEach((entry) => {
    //       console.log('Entry Timings:')
    //       console.log(`Entry: ${entry.name}, Duration: ${entry.duration}`)
    //       // performanceDict[url][entry.name] = entry.duration
    //       const requestTime = entry.responseStart - entry.requestStart
          
    //       if (requestTime > 0) {
    //         console.log(`${entry.name}: Request time: ${requestTime}ms`)
    //         // performanceDict[url][entry.name] = requestTime
            
    //       }
    //     })
    // })
      
    // observer.observe({ type: "resource", buffered: true })
    console.log(ipJsonDetails)

    // const section = document.querySelector("section")
    // const ipDivHeader = document.createElement("h1")
    // ipDivHeader.textContent = "Your IP Details"

    // const myIPDetails = document.createElement("p")
    // myIPDetails.textContent = `IP Address: ${ipJsonDetails.query} // City: ${ipJsonDetails.city} // ISP: ${ipJsonDetails.as}`
    

    // ipDivHeader.appendChild(myIPDetails);
    // section.appendChild(ipDivHeader)
    // chrome.tabs.sendMessage(progressTabId,{update: "Retrieving IP and geolocation...Done", step: "Same"})

    ipDetails['IP']=ipJsonDetails.query
    ipDetails['City']=ipJsonDetails.city
    ipDetails['ISP_AS']=ipJsonDetails.as
    
    ol_element.children[ol_element.childElementCount - 1].textContent = "Retrieving IP and geolocation...Done";

}

function runSpeedTest(bwStep) {

  window.speedTestEngine.play()
  console.log("Speed Test Started.. Please wait")
  window.speedTestEngine.onFinish = speedTestRawResult => {
  console.log(`Speed Test Summary: ${speedTestRawResult.getSummary()}`)
  console.log(`Speed Test Score: ${speedTestRawResult.getScores()}`)

  // speedTestResult = {
  //   unloadedLatency: speedTestRawResult.getUnloadedLatency(),
  //   unloadedJitter: speedTestRawResult.getUnloadedJitter(),
  //   downloadedLatency: speedTestRawResult.getDownLoadedLatency(),
  //   downloadedJitter: speedTestRawResult.getDownLoadedJitter(),
  //   upLoadedLatency: speedTestRawResult.getUpLoadedLatency(),
  //   upLoadedJitter: speedTestRawResult.getUpLoadedJitter(),
  //   downloadedBandwidth: speedTestRawResult.getDownloadBandwidth(),
  //   uploadBandwidth: speedTestRawResult.getUploadBandwidth(),
  //   packetLoss: speedTestRawResult.getPacketLoss(),
  // }
  speedTestResult['unloadedLatency'] = speedTestRawResult.getUnloadedLatency()
  speedTestResult['unloadedJitter'] = speedTestRawResult.getUnloadedJitter()
  speedTestResult['downloadedLatency'] = speedTestRawResult.getDownLoadedLatency()
  speedTestResult['downloadedJitter'] = speedTestRawResult.getDownLoadedJitter() 
  speedTestResult['upLoadedLatency'] = speedTestRawResult.getUpLoadedLatency()
  speedTestResult['upLoadedJitter'] = speedTestRawResult.getUpLoadedJitter()
  speedTestResult['downloadedBandwidth'] = speedTestRawResult.getDownloadBandwidth()
  speedTestResult['uploadBandwidth'] = speedTestRawResult.getUploadBandwidth()
  speedTestResult['packetLoss'] = speedTestRawResult.getPacketLoss()
  speedTestResult['scores'] = speedTestRawResult.getScores()

  savePerformanceStats()
  bwStep.textContent = "Running Speed Test......Done"
  console.log("Speed Test Completed")

  var steps_element = document.getElementById("progress-steps")
  var completed_element = document.createElement('li')
  completed_element.textContent = "Test Completed"
  completed_element.id = "test-completed"
  steps_element.appendChild(completed_element)
  chrome.runtime.sendMessage({speedTestCompleted: 1})
  };

  window.speedTestEngine.onError = (e) => {
    console.log(e);
    speedTestResult['error'] =  e 
    savePerformanceStats()
    bwStep.textContent = "Running Speed Test......failed"
    console.log("Speed Test Failed")
    var steps_element = document.getElementById("progress-steps")
    var completed_element = document.createElement('li')
    completed_element.textContent = "Test Completed"
    completed_element.id = "test-completed"
    steps_element.appendChild(completed_element)
    chrome.runtime.sendMessage({speedTestCompleted: 1})
  }
  
}

function openTabsRecursively(newWindowId, urls, index) {
  if (index < urls.length) {
    chrome.tabs.create({ url: urls[index], active: false, windowId: newWindowId }, function(tab) {
      // Listen for tab updates to detect when the tab is fully loaded
      // console.log(`Sending message to tab: ${progressTabId}`)
      // chrome.tabs.sendMessage(progressTabId,{update: `Fetching ${requestUrl}...`, step: "New"})
      console.log(`Creating tab for:  ${urls[index]}`)

      // STATUS UPDATES
      sitelist_element = document.getElementById("website-list")
      var webSiteNameItem = document.createElement('li')
      webSiteNameItem.textContent = urls[index]
      sitelist_element.appendChild(webSiteNameItem)
      var siteList = document.createElement('ul')

      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          // Remove the listener after the tab is fully loaded
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.remove(tabId, function() {
            console.log(`${tab.url} closed`)
          })
          
          // Open the next tab
          openTabsRecursively(newWindowId, urls, index + 1);
        }
      });
    });
  }
  else if (index === urls.length) {
    // STATUS UPDATES
    ol_element = document.getElementById("test-progress-list")
    var bwStep = document.createElement('li')
    bwStep.textContent = "Running Speed Test..."
    ol_element.appendChild(bwStep)
    runSpeedTest(bwStep)
    // chrome.runtime.sendMessage({speedTest: "run"})
  }
}

function openTabs() {
  // const openTabsRecursively = (urls, index) => {
    
  // };
  // Start opening tabs

  // STATUS UPDATES
  ol_element = document.getElementById("test-progress-list")
  var fetchWebStep = document.createElement('li')
  fetchWebStep.textContent = "Fetching the following websites:"
  ol_element.appendChild(fetchWebStep)
  var siteList = document.createElement('ul')
  siteList.id = "website-list"
  fetchWebStep.appendChild(siteList)
  // var newWindow = window.open('', '_blank');
  chrome.windows.create({
    type: 'normal',
    focused: false
  }, function(newWindow) {
    // Access the ID of the new window
    openTabsRecursively(newWindow.id, urlList, 0);
    // console.log('New window ID:', newWindow.id);
  });
  
  chrome.runtime.sendMessage({"store_msm": 1})
}



async function testSteps(){
  // const xhr = new XMLHttpRequest();
  // xhr.open('GET', chrome.extension.getURL('show_progress.html'), true);
  // xhr.send()


  
  chrome.browsingData.remove({
    "origins": urlList
  }, {
    "appcache": true,
    "cache": true,
    "cacheStorage": true,
    "localStorage": true,
  }, function () {}
  );

  // await chrome.tabs.update({ url: "show_progress.html" }, function(tab) {
  //   progressTabId = tab.id
  //   console.log(`progressTabId: ${progressTabId}`)
    
  // })
  
  await getIPGeolocationData()
  
  openTabs()
 
  console.log("All steps run")
}

// testSteps()

// const intervalId = setInterval(testSteps, 120000);

// chrome.runtime.onSuspend.addListener(function() {
//   clearInterval(intervalId);
// });

// var exBtn = document.getElementById('executeTestBtn');

// exBtn.addEventListener('click', function() {
//   // Code to be executed when the button is clicked
//   exBtn.disabled = true
//   testSteps()
//   // You can add more code here based on your requirements
// });
testSteps()
console.log("measure_stats.js loaded")


