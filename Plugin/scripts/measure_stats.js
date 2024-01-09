
var performanceDict = new Object()
const urlsToOpen = [
  'https://www.google.com',
  'https://evernote.com',
  'https://www.ietf.org/',
  'https://www.trustpilot.com/'
];

urlsOpened = []

var s3_options = {
  endpoint: "http://localhost:9000",
  accessKeyId: "3PmJ12LmuYudiK4zyLpm",
  secretAccessKey: "wYeUWJ9QkcAuYQdZ4ROmBzB3HhY9anLfZkIkndxh",
  s3ForcePathStyle: 'true',
  signatureVersion: 'v4'
}
var s3 = new AWS.S3(s3_options)

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Log or use the received value
    if (request.status) {
      urlsOpened.push(request.requestUrl)
      if (request.status == "success"){
        requestUrl = request.requestUrl
        performanceDict[requestUrl] = {}
        performanceDict[requestUrl]['ip'] = request.ip
        performanceDict[requestUrl]['ttfb'] = request.ttfb
        performanceDict[requestUrl]['dlt'] = request.dlt
        performanceDict[requestUrl]['plt'] = request.plt
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

    if (urlsOpened.length == urlsToOpen.length) {
      console.log("All Urls opened!")
      amzDate = getAmzDate(new Date().toISOString())
      filename = amzDate + ".json"
      var params = {
          Body: JSON.stringify(performanceDict), 
          Bucket: "measurements", 
          Key: filename, 
      }
      s3.putObject(params, function(err, data) {
          if (err) console.log(err, err.stack) // an error occurred
          else     console.log(data)           // successful response
      })
    }

  }
);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function startTest() {
    // var s3_options = {
    //     endpoint: "http://localhost:9000",
    //     accessKeyId: "3PmJ12LmuYudiK4zyLpm",
    //     secretAccessKey: "wYeUWJ9QkcAuYQdZ4ROmBzB3HhY9anLfZkIkndxh",
    //     s3ForcePathStyle: 'true',
    //     signatureVersion: 'v4'
    // }
    // var s3 = new AWS.S3(s3_options)
    // s3.listBuckets(function(err, data) {
    //     if (err) console.log(err, err.stack); // an error occurred
    //     else     console.log(data);           // successful response
    // })
    
    await getIPGeolocationData()
    
    openTabs()
    
    // amzDate = getAmzDate(new Date().toISOString())
    // filename = amzDate + ".json"
    // var params = {
    //     Body: JSON.stringify(performanceDict), 
    //     Bucket: "measurements", 
    //     Key: filename, 
    // }
    // s3.putObject(params, function(err, data) {
    //     if (err) console.log(err, err.stack) // an error occurred
    //     else     console.log(data)           // successful response
    // })

    // var params = {
    //     Body: JSON.stringify(performanceDict), 
    //     Bucket: "measurements", 
    //     Key: filename, 
    // }
    // s3.putObject(params, function(err, data) {
    //     if (err) console.log(err, err.stack) // an error occurred
    //     else     console.log(data)           // successful response
    // })
    

    console.log("Execution completed")
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
    url = 'http://ip-api.com/json/'
    const ipRequest = new Request(url)
    const response = await fetch(ipRequest, {cache: "no-store"})
    const ipJsonDetails = await response.json()
    const observer = new PerformanceObserver((list) => {
        console.log('Performance Entries upcoming')
        // performanceDict[url] = {}
        
        list.getEntries().forEach((entry) => {
          console.log('Entry Timings:')
          console.log(`Entry: ${entry.name}, Duration: ${entry.duration}`)
          // performanceDict[url][entry.name] = entry.duration
          const requestTime = entry.responseStart - entry.requestStart
          
          if (requestTime > 0) {
            console.log(`${entry.name}: Request time: ${requestTime}ms`)
            // performanceDict[url][entry.name] = requestTime
            
          }
        })
    })
      
    observer.observe({ type: "resource", buffered: true })
    console.log(ipJsonDetails)

    const section = document.querySelector("section")
    const ipDivHeader = document.createElement("h1")
    ipDivHeader.textContent = "Your IP Details"

    const myIPDetails = document.createElement("p")
    myIPDetails.textContent = `IP Address: ${ipJsonDetails.query} // City: ${ipJsonDetails.city} // ISP: ${ipJsonDetails.as}`
    

    ipDivHeader.appendChild(myIPDetails);
    section.appendChild(ipDivHeader)


}

function openTabs() {

  // Function to open tabs recursively
  const openTabsRecursively = (urls, index) => {
    if (index < urls.length) {
      chrome.tabs.create({ url: urls[index], active: false }, function(tab) {
        // Listen for tab updates to detect when the tab is fully loaded
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            // Remove the listener after the tab is fully loaded
            chrome.tabs.onUpdated.removeListener(listener);

            // Open the next tab
            openTabsRecursively(urls, index + 1);
          }
        });
      });
    }
  };

  // Start opening tabs
  openTabsRecursively(urlsToOpen, 0);
  chrome.runtime.sendMessage({"store_msm": 1})
}

startTest()


