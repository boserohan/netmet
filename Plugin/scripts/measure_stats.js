// import cf_edge_loc from './data/cloudfront-edge-locations.json' assert { type: 'json' };

var performanceDict = new Object()
var speedTestResult = new Object()
var ipDetails = new Object()
let chartUpload = null
let chartDownload = null
let chartCurrentWebVal = null

var webBrowsingValues = new Object()
var webBrowsingHistValues = new Object()

var uploadBWList = []
var downloadBWList = []
var meanClientDownBW = 0 
var meanClientUpBW = 0
var ttfbArr = [];
var connectTimeArr = [];
var dnsLookupTimeArr = [];
var tlsNegotiationTimeArr = [];

const urlList = [
  'https://www.datadoghq.com/',
  'https://www.connatix.com/',
  'https://hbr.org/',
  'https://www.trustpilot.com/',
  'https://www.eenadu.net/',
  'https://dto.to/',
  'https://www.bmj.com/',
  'https://www.patreon.com/',
  'https://www.zoom.us/',
  'https://tubidy.cool/'
];

var measUUID;
var urlsOpened = []

// var testId = generateUUID();
// var testId = null;


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
  // endpoint: "https://cmvm10.cit.tum.de:9000",
  endpoint: "https://131.159.25.97:9000",
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
    if (request.measurementId) {
      // testId = request.measurementVal.measurementID
      setMeasurementId(request.measurementId)
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
          performanceDict[requestUrl]['serverLoc'] = request.x_amz_cf_pop.substring(0,3)
        }
        if (request.cf_ray) {
          performanceDict[requestUrl]['cf_ray'] = request.cf_ray
          performanceDict[requestUrl]['serverLoc'] = request.cf_ray.substring(request.cf_ray.length - 3)
        }
        if (request.x_cache) {
          performanceDict[requestUrl]['x_cache'] = request.x_cache
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
      if (performanceDict[currentUrl].hasOwnProperty('serverLoc') && performanceDict[currentUrl].hasOwnProperty('x_cache')) {
        var server_loc = performanceDict[currentUrl]['serverLoc']
        if (performanceDict[currentUrl]['x_cache'].toLowerCase().includes('hit')) {
          if (!webBrowsingValues.hasOwnProperty(server_loc)) {
              webBrowsingValues[server_loc] = {
                ttfbArr : [],
                connectTimeArr: [],
                tlsNegotiationTimeArr: [],
                dnsLookupTimeArr: []
              }
          }
          webBrowsingValues[server_loc].ttfbArr.push(request.ttfb)
          webBrowsingValues[server_loc].connectTimeArr.push(request.tcpConnectTime)
          webBrowsingValues[server_loc].tlsNegotiationTimeArr.push(request.tlsNegotiationTime)
          webBrowsingValues[server_loc].dnsLookupTimeArr.push(request.dnsLookupTime)
        }
      }
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

function saveBandwidthStats() {
  var timestampInMilliseconds = new Date().getTime();
  var timestampString = timestampInMilliseconds.toString();
  var bwDict = speedTestResult
  bwDict['download_msm'] = downloadBWList
  bwDict['upload_msm'] = uploadBWList
  bwDict['timestamp'] = timestampInMilliseconds
  // completeTestObj['speed_test'] = speedTestResult
  
  var filename = getMeasurementId() + "_speedTest_" + timestampString + "_" + ipDetails['ISP_AS'] + ".json"
  var params = {
      Body: JSON.stringify(bwDict), 
      Bucket: "measurements", 
      Key: filename, 
  }
  console.log("Saving bandwidth stats to object storage")
  s3.putObject(params, function(err, data) {
      if (err) console.log(err, err.stack) // an error occurred
      else     console.log(data)           // successful response
  })
}

function saveBrowsingStats() {
    var timestampInMilliseconds = new Date().getTime();
    var timestampString = timestampInMilliseconds.toString();
    var completeTestObj = new Object()
    completeTestObj['client_details'] = ipDetails
    completeTestObj['client_details']['measurementID'] = getMeasurementId()
    completeTestObj['client_details']['timestamp'] = timestampInMilliseconds
    ipDetails['timestamp'] = timestampInMilliseconds
    completeTestObj['web_browsing'] = performanceDict
    // completeTestObj['speed_test'] = speedTestResult
    
    var filename = getMeasurementId() + "_" + timestampString + "_" + ipDetails['ISP_AS'] + ".json"
    var params = {
        Body: JSON.stringify(completeTestObj), 
        Bucket: "measurements", 
        Key: filename, 
    }
    console.log("Saving browsing stats to object storage")
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

function getMeasurementId() {
  return measUUID;
}

function setMeasurementId(testId) {
  measUUID=testId;
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
    // ol_element = document.getElementById("test-progress-list")
    // var ipretrievalStep = document.createElement('li')
    // ipretrievalStep.textContent = "Retrieving IP and geolocation..."
    // ol_element.appendChild(ipretrievalStep)

    var url = 'http://ip-api.com/json/'
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
    
    // ol_element.children[ol_element.childElementCount - 1].textContent = "Retrieving IP and geolocation...Done";

}

function runSpeedTest() {

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

  saveBrowsingStats()
  // bwStep.textContent = "Running Speed Test......Done"
  console.log("Speed Test Completed")

  // var steps_element = document.getElementById("progress-steps")
  // var completed_element = document.createElement('li')
  // completed_element.textContent = "Test Completed"
  // completed_element.id = "test-completed"
  // steps_element.appendChild(completed_element)
  
  showResults()
  chrome.runtime.sendMessage({speedTestCompleted: 1})
  };

  window.speedTestEngine.onError = (e) => {
    console.log(e);
    speedTestResult['error'] =  e 
    saveBrowsingStats()
    // bwStep.textContent = "Running Speed Test......failed"
    // console.log("Speed Test Failed")
    // var steps_element = document.getElementById("progress-steps")
    // var completed_element = document.createElement('li')
    // completed_element.textContent = "Test Completed"
    // completed_element.id = "test-completed"
    // steps_element.appendChild(completed_element)
    document.getElementById('testInProgressSpinner').style.display = 'none';
    document.getElementById('lastTestDate').textContent = 'Last test run: ' + new Date().toLocaleString();
    document.getElementById('lastTestDate').style.display = 'block';
    showResults()
    console.log("Speed Test Failed")
    chrome.runtime.sendMessage({speedTestCompleted: 1})
  }
  
}

function runNdt7SpeedTest(){
  chartCurrentASNBWValues()
  ndt7.test(
    {
        userAcceptedDataPolicy: true,
        downloadworkerfile: "./ndt7/src/ndt7-download-worker.js",
        uploadworkerfile: "./ndt7/src/ndt7-upload-worker.js",
        metadata: {
            client_name: 'ndt7-chrome-extension',
        },
    },
    {
        serverChosen: function (server) {
            console.log('Testing to:', {
                machine: server.machine,
                locations: server.location,
            });
            console.log(`${JSON.stringify(server)}`)
            // document.getElementById('server').innerHTML = 'Testing to: ' + server.machine + ' (' + server.location.city + ')';
            speedTestResult['Server'] = {
              machine: server.machine,
              locations: server.location,
            }
        },
        downloadMeasurement: function (data) {
            if (data.Source === 'client') {
                meanClientDownBW = data.Data.MeanClientMbps.toFixed(2)
                // document.getElementById('downloadSpeed').innerHTML = meanClientDownBW + ' Mb/s';
                downloadBWList.push(data.Data)
                if (chartDownload) {
                  chartDownload.series[0].points[0].update(parseFloat(meanClientDownBW))
                }
            }
            // console.log(`Download msm:${JSON.stringify(data)}`)
        },
        downloadComplete: function (data) {
            // (bytes/second) * (bits/byte) / (megabits/bit) = Mbps
            const serverBw = data.LastServerMeasurement.BBRInfo.BW * 8 / 1000000;
            const clientGoodput = data.LastClientMeasurement.MeanClientMbps;
            console.log(
                `Download test is complete:
Instantaneous server bottleneck bandwidth estimate: ${serverBw} Mbps
Mean client goodput: ${clientGoodput} Mbps`);
            // document.getElementById('downloadSpeed').innerHTML = clientGoodput.toFixed(2) + ' Mb/s';
            console.log(`Download data:${JSON.stringify(data)}`)
            speedTestResult["Download"]= {
              ConnectionInfo: data.LastServerMeasurement.ConnectionInfo
            } 
        },
        uploadMeasurement: function (data) {
            if (data.Source === 'server') {
                meanClientUpBW = (data.Data.TCPInfo.BytesReceived / data.Data.TCPInfo.ElapsedTime * 8).toFixed(2) 
                // document.getElementById('uploadSpeed').innerHTML = meanClientUpBW + ' Mb/s';
                if (chartUpload) {
                  chartUpload.series[0].points[0].update(parseFloat(meanClientUpBW))
                }
            }
            else if (data.Source === 'client') {
                uploadBWList.push(data.Data)
            }
            // console.log(`Upload msm:${JSON.stringify(data)}`)
        },
        uploadComplete: function(data) {
            const bytesReceived = data.LastServerMeasurement.TCPInfo.BytesReceived;
            const elapsed = data.LastServerMeasurement.TCPInfo.ElapsedTime;
            // bytes * bits/byte / microseconds = Mbps
            const throughput =
            bytesReceived * 8 / elapsed;
            console.log(
                `Upload test completed in ${(elapsed / 1000000).toFixed(2)}s
Mean server throughput: ${throughput} Mbps`);
            console.log(`Upload data:${JSON.stringify(data)}`)
            speedTestResult["Upload"]= {
              ConnectionInfo: data.LastServerMeasurement.ConnectionInfo
            } 
        },
        error: function (err) {
            console.log('Error while running the test:', err.message);
        },
    },
  ).then((exitcode) => {
    console.log("ndt7 test completed with exit code:", exitcode)
    document.getElementById('testInProgressSpinner').style.display = 'none';
    document.getElementById('lastTestDate').textContent = 'Last test run: ' + new Date().toLocaleString();
    document.getElementById('lastTestDate').style.display = 'block';
    showResults()
    saveBandwidthStats()
    chrome.runtime.sendMessage({speedTestCompleted: 1})
  });
}

function openTabsRecursively(newWindowId, urls, index) {
  if (index < urls.length) {
    chrome.tabs.create({ url: urls[index], active: false, windowId: newWindowId }, function(tab) {
      // Listen for tab updates to detect when the tab is fully loaded
      // console.log(`Sending message to tab: ${progressTabId}`)
      // chrome.tabs.sendMessage(progressTabId,{update: `Fetching ${requestUrl}...`, step: "New"})
      console.log(`Creating tab for:  ${urls[index]}`)

      // STATUS UPDATES
      // sitelist_element = document.getElementById("website-list")
      // var webSiteNameItem = document.createElement('li')
      // webSiteNameItem.textContent = urls[index]
      // sitelist_element.appendChild(webSiteNameItem)
      // var siteList = document.createElement('ul')

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
    // ol_element = document.getElementById("test-progress-list")
    // var bwStep = document.createElement('li')
    // bwStep.textContent = "Running Speed Test..."
    // ol_element.appendChild(bwStep)

    // runSpeedTest()
    saveBrowsingStats()
    chartCurrentASNWebValues()
    runNdt7SpeedTest()
    // chrome.runtime.sendMessage({speedTest: "run"})
  }
}

function openTabs() {
  // const openTabsRecursively = (urls, index) => {
    
  // };
  // Start opening tabs

  // STATUS UPDATES
  // ol_element = document.getElementById("test-progress-list")
  // var fetchWebStep = document.createElement('li')
  // fetchWebStep.textContent = "Fetching the following websites:"
  // ol_element.appendChild(fetchWebStep)
  // var siteList = document.createElement('ul')
  // siteList.id = "website-list"
  // fetchWebStep.appendChild(siteList)
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

  document.getElementById('testInProgressSpinner').style.display = 'block';
  document.getElementById('lastTestDate').style.display = 'none';
  
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

// function startTestInProgress() {
//   // Show the spinner and update the last test date
//   document.getElementById('testInProgressSpinner').style.display = 'block';
//   document.getElementById('lastTestDate').style.display = 'none';

//   // Simulate a delay (you can replace this with actual test logic)
//   setTimeout(() => {
//   // Hide the spinner when the test is completed
//   document.getElementById('testInProgressSpinner').style.display = 'none';
//   document.getElementById('lastTestDate').textContent = 'Last test run: ' + new Date().toLocaleString();
//   document.getElementById('lastTestDate').style.display = 'block';
//   }, 5000); // Simulated 5 seconds for testing purposes
  
  
// }

function setIcon(elementId, value) {
  const thresholds = {
    good: 100,
    okay: 200,
  };
  const iconElement = document.getElementById(elementId + 'Icon');
  if (value <= thresholds.good) {
    iconElement.innerHTML = '<span class="icon good">✔</span>';
  } else if (value <= thresholds.okay) {
    iconElement.innerHTML = '<span class="icon okay">!</span>';
  } else {
    iconElement.innerHTML = '<span class="icon bad">✘</span>';
  }
}

function setIcons(values) {
  setIcon('webConnectTime', values.webConnectTime);
  setIcon('webDnsLookupTime', values.webDnsLookupTime);
  setIcon('webTtfb', values.webTtfb);
  // setIcon('downloadSpeed', values.downloadSpeed);
  // setIcon('uploadSpeed', values.uploadSpeed);
  // setIcon('packetLoss', values.packetLoss);
}

// function saveMeasurementValues(values) {
//   chrome.storage.local.set({ measurementValues: values });
// }

function saveMeasurementHist(asn,values) {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    var asn_values = null;
    
    if (!all_values.hasOwnProperty(asn)) {
      all_values[asn] = new Object();
      addToASNDropdown(asn)
    }
    asn_values = all_values[asn]
    // run a for loop over values to get msm as key
    for (const [key, value] of Object.entries(values)) {
      var msm = key
      if (!asn_values.hasOwnProperty(msm)) {
        if (msm.includes('webBrowsingValues')) {
          asn_values[msm] = {};
        } else {
          asn_values[msm] = [];
        }
        
      }
      if (msm.includes('webBrowsingValues')) {
        for (const [serverLoc, allWebMsms] of Object.entries(value)) {
          allWebMsms['timestamp'] = [ipDetails['timestamp']]
          if (!asn_values[msm].hasOwnProperty(serverLoc)) {
            asn_values[msm][serverLoc] = allWebMsms
          } else {
            for (const [metric, valueArr] of Object.entries(allWebMsms)) {
              asn_values[msm][serverLoc][metric].push(valueArr[0])
            }

          }
        }
      } else {
        asn_values[msm].push([ipDetails['timestamp'],value])
      }
      
    }
    all_values[asn] = asn_values
    chrome.storage.local.set({ measurementValues: all_values });
    return null;
  });
}

function getMeasurementHist(asn, msm) {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    if (all_values.hasOwnProperty(asn)) {
      var asn_values = all_values[asn]
      if (asn_values.hasOwnProperty(msm)) {
        return asn_values[msm];
      }
    }
    return null;
  });
}

function updateMeasurementValues() {
  chrome.storage.local.get(['measurementValues'], function(result) {
    const values = result.measurementValues || {};

    
    // document.getElementById('webConnectTime').textContent = values.webConnectTime? values.webConnectTime.toString() + " ms" : 'N/A';
    // document.getElementById('webDnsLookupTime').textContent = values.webDnsLookupTime? values.webDnsLookupTime.toString() + " ms" : 'N/A';
    // document.getElementById('webTtfb').textContent = values.webTtfb? values.webTtfb.toString() + " ms" : 'N/A';
    // document.getElementById('downloadSpeed').textContent = values.downloadSpeed? values.downloadSpeed.toString() + " Mb/s" : 'N/A';
    // document.getElementById('uploadSpeed').textContent = values.uploadSpeed? values.uploadSpeed.toString() + " Mb/s" : 'N/A';
    // document.getElementById('packetLoss').textContent = values.packetLoss? values.packetLoss.toString() + "%" : 'N/A';

    var lastTestDate = values.lastTestDate || 'N/A';
    // Optionally, update the last test date
    document.getElementById('lastTestDate').textContent = 'Last test run: ' + lastTestDate;
    // setIcons(values);
  });
}

function showResults() {

  const lastTestDate = new Date().toLocaleString();
  document.getElementById('testInProgressSpinner').style.display = 'none';
  document.getElementById('lastTestDate').textContent = 'Last test run: ' + lastTestDate;
  document.getElementById('lastTestDate').style.display = 'block';
  // chartCurrentASNWebValues()

  const valuesToStore = {
    webBrowsingValues: webBrowsingHistValues,  
    downloadSpeed: parseFloat(meanClientDownBW),
    uploadSpeed: parseFloat(meanClientUpBW),
    // packetLoss: avgPacketLoss,
    // lastTestDate: lastTestDate,
  };
  // setIcons(valuesToStore);
  // saveMeasurementValues(valuesToStore);
  saveMeasurementHist(ipDetails['ISP_AS'], valuesToStore)
  exBtn.disabled = false;
}

// testSteps()

// const intervalId = setInterval(testSteps, 120000);

// chrome.runtime.onSuspend.addListener(function() {
//   clearInterval(intervalId);
// });

var exBtn = document.getElementById('startMeasurementBtn');

exBtn.addEventListener('click', function() {
  exBtn.disabled = true
  testSteps()
  // var filename = "demo" + "_" + Date.now() + ".json"
  //   var params = {
  //       Body: JSON.stringify({key: "hello s3"}), 
  //       Bucket: "measurements", 
  //       Key: filename, 
  //   }
  //   console.log("Saving stats to object storage")
  //   s3.putObject(params, function(err, data) {
  //       if (err) console.log(err, err.stack) // an error occurred
  //       else     console.log(data)           // successful response
  //   })
});
// testSteps()


var dropdown = document.getElementById('dropdownASN');
dropdown.addEventListener('change', function() {
  // This function will be called when the selected ASN changes
  const selectedOption = dropdown.value;
  console.log('Selected option:', selectedOption);
  chartASNHistValues(selectedOption);
});


function populateASNDropdown() {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    var asnOptions = Object.keys(all_values)
    asnOptions.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.text = option;
      dropdown.appendChild(optionElement);
    });
  });
}

populateASNDropdown()

function addToASNDropdown(option) {
  const optionElement = document.createElement('option');
  optionElement.text = option;
  dropdown.appendChild(optionElement);
}


function chartASNHistValues(asn) {
  // Perform actions based on the selected option
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    var downloadBWData = all_values[asn]['downloadSpeed']
    var uploadBWData = all_values[asn]['uploadSpeed']
    console.log(downloadBWList)
    console.log(uploadBWList)
    Highcharts.chart('containerBWHist', {
      chart: {
          type: 'spline'
      },
      title: {
          text: 'Bandwidth',
          align: 'left'
      },
      subtitle: {
          text: 'Download and Upload Speeds',
          align: 'left'
      },
      xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: {
              // don't display the year
              month: '%e. %b',
              year: '%b'
          },
          title: {
              text: 'Date'
          }
      },
      yAxis: {
          title: {
              text: 'Mbps'
          },
          min: 0
      },
      tooltip: {
          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
      },
    
      plotOptions: {
          series: {
              marker: {
                  symbol: 'circle',
                  fillColor: '#FFFFFF',
                  enabled: true,
                  radius: 2.5,
                  lineWidth: 1,
                  lineColor: null
              }
          }
      },
    
      colors: ['#6CF', '#39F', '#06C', '#036', '#000'],
    
      // Define the data points. All series have a year of 1970/71 in order
      // to be compared on the same x axis. Note that in JavaScript, months start
      // at 0 for January, 1 for February etc.
      series: [
          {
              name: 'Download BW',
              data: downloadBWData
          },
          {
              name: 'Upload BW',
              data: uploadBWData
          },
      ]
    });

    var webValuesHist = all_values[asn]['webBrowsingValues']

    const avgTtfbHistArr = []
    const avgConnectTimeHistArr = []
    const avgDnsLookupTimeHistArr = []
    const avgTlsNegotiationTimeHistArr = []
    const serverLocationsHistArr = []
    
    for (const [key, value] of Object.entries(webValuesHist)) {
      serverLocationsHistArr.push(key)
      avgTtfbHistArr.push(parseFloat((value.avgTtfb.reduce((acc, num) => acc + num, 0)/ value.avgTtfb.length).toFixed(2)))
      avgConnectTimeHistArr.push(parseFloat((value.avgConnectTime.reduce((acc, num) => acc + num, 0)/ value.avgConnectTime.length).toFixed(2)))
      avgDnsLookupTimeHistArr.push(parseFloat((value.avgDnsLookupTime.reduce((acc, num) => acc + num, 0)/ value.avgDnsLookupTime.length).toFixed(2)))
      avgTlsNegotiationTimeHistArr.push(parseFloat((value.avgTlsNegotiationTime.reduce((acc, num) => acc + num, 0)/ value.avgTlsNegotiationTime.length).toFixed(2)))

      // if (!webBrowsingHistValues.hasOwnProperty(key)) {
      //   webBrowsingHistValues[key] = {
      //     avgTtfb: 0,
      //     avgConnectTime: 0,
      //     avgDnsLookupTime: 0,
      //     avgTlsNegotiationTime: 0,
      //   }
      // }

      // webBrowsingHistValues[key]['avgTtfb'] = avgTtfbArr.slice(-1)
      // webBrowsingHistValues[key]['avgConnectTime'] = avgConnectTimeArr.slice(-1)
      // webBrowsingHistValues[key]['avgDnsLookupTime'] = avgDnsLookupTimeArr.slice(-1)
      // webBrowsingHistValues[key]['avgTlsNegotiationTime'] = avgtlsNegotiationTimeArr.slice(-1)

    }


    Highcharts.chart('containerWebHist', {
      chart: {
          type: 'bar',
          responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    legend: {
                        align: 'center',
                        verticalAlign: 'bottom',
                        layout: 'horizontal'
                    },
                    yAxis: {
                        labels: {
                            align: 'left',
                            x: 0,
                            y: -5
                        },
                        title: {
                            text: null
                        }
                    },
                    subtitle: {
                        text: null
                    },
                    credits: {
                        enabled: false
                    }
                }
            }]
        }
      },
      title: {
          text: 'Web Browsing Experience',
          align: 'left'
      },
      subtitle: {
          text: ipDetails['ISP_AS'],
          align: 'left'
      },
      xAxis: {
          categories: serverLocationsHistArr,
          title: {
              text: 'CDN Server Locations'
          },
          gridLineWidth: 1,
          lineWidth: 0
      },
      yAxis: {
          min: 0,
          title: {
              text: 'Latency (ms)',
              align: 'high'
          },
          labels: {
              overflow: 'justify'
          },
          gridLineWidth: 0
      },
      // tooltip: {
      //     valueSuffix: ' millions'
      // },
      plotOptions: {
          bar: {
              borderRadius: '50%',
              dataLabels: {
                  enabled: true
              },
              groupPadding: 0.1,
              pointWidth: 10
          }
      },
      legend: {
          layout: 'horizontal',
          align: 'center',
          verticalAlign: 'bottom',
          floating: true,
          backgroundColor:
              Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
          itemStyle: {
            fontSize: '8px'
          }
          
      },
      credits: {
          enabled: false
      },
      series: [{
          name: 'DNS Lookup',
          data: avgDnsLookupTimeHistArr
      }, {
          name: 'Server Connection',
          data: avgConnectTimeHistArr
      }, {
          name: 'TLS Negotiation',
          data: avgTlsNegotiationTimeHistArr
      }, {
          name: 'Time to First Byte',
          data: avgTtfbHistArr
      }]
    });

  });
}

function chartCurrentASNBWValues() {

  const gaugeOptions = {
    chart: {
        type: 'solidgauge'
    },

    title: null,

    pane: {
        center: ['50%', '85%'],
        size: '60%',
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
        }
    },

    exporting: {
        enabled: false
    },

    tooltip: {
        enabled: false
    },

    // the value axis
    yAxis: {
        stops: [
            [0.1, '#DF5353'], // red 
            [0.3, '#DDDF0D'], // yellow
            [0.7, '#55BF3B'] // green
        ],
        lineWidth: 0,
        tickWidth: 0,
        minorTickInterval: null,
        tickAmount: 2,
        title: {
            y: -70
        },
        labels: {
            y: 16
        }
    },

    plotOptions: {
        solidgauge: {
            dataLabels: {
                y: 5,
                borderWidth: 0,
                useHTML: true
            }
        }
    }
};

// The download gauge
chartDownload = Highcharts.chart('downBWCurrentContainer', Highcharts.merge(gaugeOptions, {
    yAxis: {
        min: 0,
        max: 500,
        title: {
            text: 'Download'
        }
    },

    credits: {
        enabled: false
    },

    series: [{
        name: 'Download Speed',
        data: [0],
        dataLabels: {
            format:
                '<div style="text-align:center">' +
                '<span style="font-size:15px">{y:.1f}</span><br/>' +
                '<span style="font-size:8px;opacity:0.4">Mbps</span>' +
                '</div>'
        },
        tooltip: {
            valueSuffix: ' Mbps'
        }
    }]

}));

// The upload gauge
chartUpload = Highcharts.chart('upBWCurrentContainer', Highcharts.merge(gaugeOptions, {
    yAxis: {
        min: 0,
        max: 500,
        title: {
            text: 'Upload Speed'
        }
    },
    credits: {
      enabled: false
    },
    series: [{
        name: 'RPM',
        data: [0],
        dataLabels: {
            format:
                '<div style="text-align:center">' +
                '<span style="font-size:15px">{y:.1f}</span><br/>' +
                '<span style="font-size:8px;opacity:0.4">' +
                'Mbps' +
                '</span>' +
                '</div>'
        },
        tooltip: {
            valueSuffix: ' Mbps'
        }
    }]

}));
}



function chartCurrentASNWebValues() {
  const avgTtfbArr = []
  const avgConnectTimeArr = []
  const avgDnsLookupTimeArr = []
  const avgtlsNegotiationTimeArr = []
  const serverLocationsArr = []

  for (const [key, value] of Object.entries(webBrowsingValues)) {
    serverLocationsArr.push(key)
    avgTtfbArr.push(parseFloat((value.ttfbArr.reduce((acc, num) => acc + num, 0)/ value.ttfbArr.length).toFixed(2)))
    avgConnectTimeArr.push(parseFloat((value.connectTimeArr.reduce((acc, num) => acc + num, 0)/ value.connectTimeArr.length).toFixed(2)))
    avgDnsLookupTimeArr.push(parseFloat((value.dnsLookupTimeArr.reduce((acc, num) => acc + num, 0)/ value.dnsLookupTimeArr.length).toFixed(2)))
    avgtlsNegotiationTimeArr.push(parseFloat((value.tlsNegotiationTimeArr.reduce((acc, num) => acc + num, 0)/ value.tlsNegotiationTimeArr.length).toFixed(2)))

    if (!webBrowsingHistValues.hasOwnProperty(key)) {
      webBrowsingHistValues[key] = {
        avgTtfb: 0,
        avgConnectTime: 0,
        avgDnsLookupTime: 0,
        avgTlsNegotiationTime: 0,
      }
    }

    webBrowsingHistValues[key]['avgTtfb'] = avgTtfbArr.slice(-1)
    webBrowsingHistValues[key]['avgConnectTime'] = avgConnectTimeArr.slice(-1)
    webBrowsingHistValues[key]['avgDnsLookupTime'] = avgDnsLookupTimeArr.slice(-1)
    webBrowsingHistValues[key]['avgTlsNegotiationTime'] = avgtlsNegotiationTimeArr.slice(-1)

  }


  chartCurrentWebVal = Highcharts.chart('webCurrentContainer', {
    chart: {
        type: 'bar',
        responsive: {
          rules: [{
              condition: {
                  maxWidth: 500
              },
              chartOptions: {
                  legend: {
                      align: 'center',
                      verticalAlign: 'bottom',
                      layout: 'horizontal'
                  },
                  yAxis: {
                      labels: {
                          align: 'left',
                          x: 0,
                          y: -5
                      },
                      title: {
                          text: null
                      }
                  },
                  subtitle: {
                      text: null
                  },
                  credits: {
                      enabled: false
                  }
              }
          }]
      }
    },
    title: {
        text: 'Web Browsing Experience',
        align: 'left'
    },
    subtitle: {
        text: ipDetails['ISP_AS'],
        align: 'left'
    },
    xAxis: {
        categories: serverLocationsArr,
        title: {
            text: 'CDN Server Locations'
        },
        gridLineWidth: 1,
        lineWidth: 0
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Latency (ms)',
            align: 'high'
        },
        labels: {
            overflow: 'justify'
        },
        gridLineWidth: 0
    },
    // tooltip: {
    //     valueSuffix: ' millions'
    // },
    plotOptions: {
        bar: {
            borderRadius: '50%',
            dataLabels: {
                enabled: true
            },
            groupPadding: 0.1,
            pointWidth: 10
        }
    },
    legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        floating: true,
        backgroundColor:
            Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
        itemStyle: {
          fontSize: '8px'
        }
        
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'DNS Lookup',
        data: avgDnsLookupTimeArr
    }, {
        name: 'Server Connection',
        data: avgConnectTimeArr
    }, {
        name: 'TLS Negotiation',
        data: avgtlsNegotiationTimeArr
    }, {
        name: 'Time to First Byte',
        data: avgTtfbArr
    }]
  });
}


var showHistBWBtn = document.getElementById('showHistBWBtn');
showHistBWBtn.addEventListener('click', function() {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    console.log(`${JSON.stringify(all_values)}`)
  });
  
});

window.addEventListener('resize', function () {
  chartCurrentWebVal.setSize(window.innerWidth, window.innerHeight);
});



function onPageLoad() {
  // updateMeasurementValues();
}

chrome.runtime.sendMessage({retrieveUUID: 1})
window.addEventListener('load', onPageLoad);
console.log("measure_stats.js loaded")