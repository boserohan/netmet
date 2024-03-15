// import cf_edge_loc from './data/cloudfront-edge-locations.json' assert { type: 'json' };

var performanceDict = new Object()
var speedTestResult = new Object()
var ipDetails = new Object()
let chartUpload = null
let chartDownload = null
let chartCurrentWebVal = null

var webBrowsingValues = new Object()
var webBrowsingHistValues = new Object()

var latency = 0
var packet_loss = 0
var uploadBWList = []
var downloadBWList = []
var meanClientDownBW = 0 
var meanClientUpBW = 0
var ttfbArr = [];
var connectTimeArr = [];
var dnsLookupTimeArr = [];
var tlsNegotiationTimeArr = [];

var webBrowsingText = document.getElementById('webBrowsingText')
var videoStreamingText = document.getElementById('videoStreamingText')
var gamingText = document.getElementById('gamingText')
var teleConfText = document.getElementById('teleConfText')
var bwStatsContainer = document.getElementById('bwStatsContainer')

var lastTestDate;

var qualityStandard = {
  1 : {
    text: 'Good',
    color: 'green'
  },
  2 : {
    text: 'Ok',
    color: 'orange'
  },
  3 : {
    text: 'Poor',
    color: 'red'
  },
}

const urlList = [
  'https://www.datadoghq.com/',
  'https://www.connatix.com/',
  'https://hbr.org/',
  'https://www.trustpilot.com/',
  'https://www.eenadu.net/',
  'https://www.nikkansports.com/',
  'https://www.typeform.com/',
  'https://coinmarketcap.com/',
  'https://www.pbs.org/',
  'https://www.uol.com.br/',
  'https://www.teamviewer.com/etc.clientlibs/teamviewer/clientlibs/foundation/clientlib-commerce.20240312103050.min.js',
  'https://www.bmj.com/_next/static/css/0125e1088e5e73c9.css',
  'https://www.patreon.com/_assets_patreon_marketing/_next/static/chunks/main-4016249e4d22fbe7.js',
  'https://ssstik.io/css/ssstik/style.min.css?v=1232024',
  'https://tubidy.cool/js/main.js',
  'https://androidwaves.com/',
  'https://www.kidsa-z.com/js/angular/kids.module--clt_24_03_014-1709834777.js',
  'https://onesignal.com/',
  'https://www.sectigo.com/_ui/css/style.752773097.css',
  'https://www.prnewswire.com/'
];

var measUUID;
var urlsOpened = []

var s3_options = {
  endpoint: "https://cmvm10.cit.tum.de:9000",
  accessKeyId: "measurementUser",
  secretAccessKey: "nafcoj-jidqek-6ditXu",
  s3ForcePathStyle: 'true',
  signatureVersion: 'v4'
}


var s3 = new AWS.S3(s3_options)

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(`request: ${JSON.stringify(request)}`)
    if (request.measurementId) {
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
        if (request.cf_cache_status) {
          performanceDict[requestUrl]['cf_cache_status'] = request.cf_cache_status
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
      var cache_status_hit = false
      if (performanceDict[currentUrl].hasOwnProperty('x_cache')) {
        cache_status_hit = performanceDict[currentUrl]['x_cache'].toLowerCase().includes('hit')
      } else if (performanceDict[currentUrl].hasOwnProperty('cf_cache_status')) {
        cache_status_hit = performanceDict[currentUrl]['cf_cache_status'].toLowerCase().includes('hit')
      }
      if (performanceDict[currentUrl].hasOwnProperty('serverLoc') && cache_status_hit) {
        var server_loc = performanceDict[currentUrl]['serverLoc']
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
    if (request.alarmFrequency) {
      document.getElementById('popupFrequency').value = request.alarmFrequency
      chrome.storage.local.set({popupFrequency: request.alarmFrequency})
    }
  }
);

function saveBandwidthStats() {
  var timestampInMilliseconds = new Date().getTime();
  var timestampString = timestampInMilliseconds.toString();
  var bwDict = speedTestResult
  bwDict['download_msm'] = downloadBWList
  bwDict['upload_msm'] = uploadBWList
  bwDict['timestamp'] = timestampInMilliseconds
  
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

async function getIPGeolocationData() {


    var url = 'http://ip-api.com/json/'
    const ipRequest = new Request(url)
    const response = await fetch(ipRequest, {cache: "no-store"})
    const ipJsonDetails = await response.json()

    console.log(ipJsonDetails)


    ipDetails['IP']=ipJsonDetails.query
    ipDetails['City']=ipJsonDetails.city
    ipDetails['ISP_AS']=ipJsonDetails.as
    document.getElementById("ispText").textContent = ipJsonDetails.as

}
function runNdt7SpeedTest(){
  chartCurrentASNBWValues()
  bwStatsContainer.style.display = 'block'
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth' // optional, adds smooth scrolling effect
  });
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
            speedTestResult['Server'] = {
              machine: server.machine,
              locations: server.location,
            }
        },
        downloadMeasurement: function (data) {
            if (data.Source === 'client') {
                meanClientDownBW = data.Data.MeanClientMbps.toFixed(2)
                downloadBWList.push(data.Data)
                if (chartDownload) {
                  chartDownload.series[0].points[0].update(parseFloat(meanClientDownBW))
                }
            }
        },
        downloadComplete: function (data) {
            const serverBw = data.LastServerMeasurement.BBRInfo.BW * 8 / 1000000;
            const clientGoodput = data.LastClientMeasurement.MeanClientMbps;
            console.log(
                `Download test is complete:
Instantaneous server bottleneck bandwidth estimate: ${serverBw} Mbps
Mean client goodput: ${clientGoodput} Mbps`);
            console.log(`Download data:${JSON.stringify(data)}`)
            speedTestResult["Download"]= {
              ConnectionInfo: data.LastServerMeasurement.ConnectionInfo
            }
            
            latency =  (data.LastServerMeasurement.TCPInfo.MinRTT / 1000)
            document.getElementById('latencyText').textContent = latency.toFixed(2) + ' ms'

            packet_loss = (data.LastServerMeasurement.TCPInfo.BytesRetrans / data.LastServerMeasurement.TCPInfo.BytesSent * 100)
            document.getElementById('packetLossText').textContent = packet_loss.toFixed(2) + '%'
        },
        uploadMeasurement: function (data) {
            if (data.Source === 'server') {
                meanClientUpBW = (data.Data.TCPInfo.BytesReceived / data.Data.TCPInfo.ElapsedTime * 8).toFixed(2) 
                if (chartUpload) {
                  chartUpload.series[0].points[0].update(parseFloat(meanClientUpBW))
                }
            }
            else if (data.Source === 'client') {
                uploadBWList.push(data.Data)
            }
        },
        uploadComplete: function(data) {
            const bytesReceived = data.LastServerMeasurement.TCPInfo.BytesReceived;
            const elapsed = data.LastServerMeasurement.TCPInfo.ElapsedTime;
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
    document.getElementById('testInProgressText').style.display = 'none';
    showResults()
    saveBandwidthStats()
    chrome.runtime.sendMessage({speedTestCompleted: 1})
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // optional, adds smooth scrolling effect
    });
  });
}

function openTabsRecursively(newWindowId, urls, index) {
  chrome.storage.local.get(['extensionWindowId'], function(result) {
    var windowId = result.extensionWindowId || null
    if (windowId) {
      chrome.windows.update(windowId, { focused: true });
    }
  })
  if (index < urls.length) {
    chrome.tabs.create({ url: urls[index], active: false, windowId: newWindowId }, function(tab) {

      console.log(`Creating tab for:  ${urls[index]}`)

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
    saveBrowsingStats()
    chrome.windows.remove(newWindowId);
    document.getElementById('currentMeasurementContainer').style.display = 'block'
    chartCurrentASNWebValues()
    runNdt7SpeedTest()
  }
}

function openTabs() {

  chrome.windows.create({
    type: 'normal',
    focused: false,
    state: 'minimized'
  }, function(newWindow) {
    // Access the ID of the new window
    openTabsRecursively(newWindow.id, urlList, 0);
  });
  
  
  chrome.runtime.sendMessage({"store_msm": 1})
}





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

function computeQuality() {
  var qualityMetrics = {
    "web_browsing": null,
    "video_streaming": null,
    "gaming": null,
    "teleconferencing": null
  }
  if (latency < 40) {
    qualityMetrics["gaming"] = 1
  } else if (latency >= 40 && latency <= 70) {
    qualityMetrics["gaming"] = 2
  } else {
    qualityMetrics["gaming"] = 3
  }

  console.log(`BW latency: ${latency}`)

  if (meanClientDownBW > 25) {
    qualityMetrics["video_streaming"] = 1
  } else if (meanClientDownBW > 5 && meanClientDownBW <= 25) {
    qualityMetrics["video_streaming"] = 2
  } else {
    qualityMetrics["video_streaming"] = 3
  }
 

  tele_bw = Math.min(meanClientDownBW,meanClientUpBW)

  if (tele_bw > 5) {
    qualityMetrics["teleconferencing"] = 1
  } else if (meanClientDownBW > 2 && meanClientDownBW <= 5) {
    qualityMetrics["teleconferencing"] = 2
  } else {
    qualityMetrics["teleconferencing"] = 3
  }
  var all_ttfbs = []

  for (const [key, value] of Object.entries(performanceDict)) {
    if (value.hasOwnProperty('ttfb')) {
      all_ttfbs.push(value['ttfb'])
    }
  }

  var avgTTFBVal = (all_ttfbs.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / all_ttfbs.length)

  if (avgTTFBVal < 200) {
    qualityMetrics["web_browsing"] = 1
  } else if (avgTTFBVal >=200 && avgTTFBVal <=600) {
    qualityMetrics["web_browsing"] = 2
  } else {
    qualityMetrics["web_browsing"] = 3
  }
  return qualityMetrics
}

function printQOE(qualityMetrics) {
  webBrowsingText.textContent = qualityStandard[qualityMetrics["web_browsing"]].text
  webBrowsingText.style.color = qualityStandard[qualityMetrics["web_browsing"]].color

  videoStreamingText.textContent = qualityStandard[qualityMetrics["video_streaming"]].text
  videoStreamingText.style.color = qualityStandard[qualityMetrics["video_streaming"]].color

  gamingText.textContent = qualityStandard[qualityMetrics["gaming"]].text
  gamingText.style.color = qualityStandard[qualityMetrics["gaming"]].color

  teleConfText.textContent = qualityStandard[qualityMetrics["teleconferencing"]].text
  teleConfText.style.color = qualityStandard[qualityMetrics["teleconferencing"]].color
}

function saveMeasurementHist(asn,values) {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    var asn_values = null;
    qualityMetrics = computeQuality()
    printQOE(qualityMetrics)
    chrome.runtime.sendMessage({lastASN: {
                                          ASN: asn,
                                          lastResults : {timestamp: lastTestDate, qoe: qualityMetrics},
                              }})
    if (!all_values.hasOwnProperty(asn)) {
      all_values[asn] = new Object();
      addItemToDropdown("dropdownASNList",asn)
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
    console.log(`all_values= ${JSON.stringify(all_values)}`)
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


    var lastTestDate = values.lastTestDate || 'N/A';
    // Optionally, update the last test date
    document.getElementById('lastTestDate').textContent = 'Last test run: ' + lastTestDate;
  });
}

function showResults() {

  document.getElementById('testInProgressText').style.display = 'none';

  const valuesToStore = {
    webBrowsingValues: webBrowsingHistValues,  
    downloadSpeed: parseFloat(meanClientDownBW),
    uploadSpeed: parseFloat(meanClientUpBW),
  };
  saveMeasurementHist(ipDetails['ISP_AS'], valuesToStore)
  lastTestDate = new Date().toLocaleString()
  chrome.runtime.sendMessage({'lastTestDate': lastTestDate})
  exBtn.disabled = false;
  exBtn.classList.add("hoverable")
}






function populateASNDropdown() {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    var asnOptions = Object.keys(all_values)
    asnOptions.forEach((option) => {
      addItemToDropdown("dropdownASNList", option)
    });
  });
}

function addItemToDropdown(listId, itemName) {
  var newItem = document.createElement("li");
  newItem.setAttribute("data-thq", "thq-dropdown");
  newItem.setAttribute("class", "home-dropdown list-item");
  // Create a div element within the li
  var divElement = document.createElement("div");
  divElement.setAttribute("data-thq", "thq-dropdown-toggle");
  divElement.setAttribute("class", "home-dropdown-toggle1");

  // Create a span element within the div
  var spanElement = document.createElement("span");
  spanElement.setAttribute("class", "home-text02");
  spanElement.textContent = itemName;
  spanElement.addEventListener("click", clickASNItemHandler)
  // Append the span element to the div
  divElement.appendChild(spanElement);

  // Append the div element to the li
  newItem.appendChild(divElement);

  // Append the new li element to the existing UL
  document.getElementById(listId).appendChild(newItem);
}

function clickASNItemHandler() {
  document.getElementById("displayHeader").textContent = "Historical Overview"
  document.getElementById('currentMeasurementContainer').style.display = 'none'
  document.getElementById('histMeasurementContainer').style.display = 'block'
  document.getElementById("ispText").textContent = this.textContent
  bwStatsContainer.style.display = 'none'
  document.getElementById('packetLossText').textContent = ""
  document.getElementById('latencyText').textContent = ""
  webBrowsingText.textContent = ''
  videoStreamingText.textContent = ''
  gamingText.textContent = ''
  teleConfText.textContent = ''
  chartASNHistValues(this.textContent)
}


function chartASNHistValues(asn) {
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
          text: null,
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
          pointFormat: '{point.x:%e. %b}: {point.y:.2f} Mbps'
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
      credits: {
        enabled: false
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
          text: null,
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
        size: '100%',
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
  title: {
    text: null,
    align: 'left'
    },
  //   subtitle: {
  //       text: 'Download and Upload',
  //       align: 'left'
  //   },
    yAxis: {
        min: 0,
        max: 500,
        title: {
            text: 'Download Speed'
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
        name: 'Upload Speed',
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
                  maxWidth: 700
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
        text: null,
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
            text: '(ms)',
            align: 'high'
        },
        labels: {
            overflow: 'allow'
        },
        gridLineWidth: 0
    },
    tooltip: {
        valueSuffix: ' ms'
    },
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


var showHistBWBtn = document.getElementById('dropdownASNDiv');
showHistBWBtn.addEventListener('click', function() {
  chrome.storage.local.get(['measurementValues'], function(result) {
    var all_values = result.measurementValues || {};
    console.log(`${JSON.stringify(all_values)}`)
  });
  
});

function onPageLoad() {

  const currentUrl = window.location.href;
  chrome.windows.getCurrent(function(window) {

    extensionWindowId = window.id;
    chrome.storage.local.set({extensionWindowId: window.id})
        // chrome.windows.update(windowId, { focused: true });
  });
  // Create a URLSearchParams object with the query parameters
  const searchParams = new URLSearchParams(currentUrl.split('?')[1]);
  
  // Access individual parameters
  const action_type = searchParams.get('action');
  if (action_type === 'startnewtest') {
    testSteps()
    console.log("Start New Test")
  }
  if (action_type === 'checkhistory') {

    const asn_value = searchParams.get('asn');
    if (asn_value != 'null') {
      document.getElementById("displayHeader").textContent = "Historical Overview"
      document.getElementById('currentMeasurementContainer').style.display = 'none'
      document.getElementById('histMeasurementContainer').style.display = 'block'
      document.getElementById("ispText").textContent = asn_value
      chartASNHistValues(asn_value)
      console.log(`Check history for asn: ${asn_value}`)
    }
    
  }
}


var settingsOpnBtn = document.getElementById('settingsOpnBtn');
var settingsCloseBtn = document.getElementById('settingsCloseBtn');
var settingsSaveBtn = document.getElementById('settingsSaveBtn');
var feedbackText = document.getElementById('settingsSaveFeedback');


settingsSaveBtn.addEventListener('click', function() {
  console.log("Settings Saved")
  chrome.storage.local.get(['popupFrequency'], function(result) {
    var newPopupFrequency = document.getElementById('popupFrequency').value
    if (result.popupFrequency != newPopupFrequency){
      console.log(`result.popupFrequency: ${result.popupFrequency}`)
      console.log(`newPopupFrequency: ${result.popupFrequency}`)
      chrome.runtime.sendMessage({ newAlarmFrequency: newPopupFrequency})
      feedbackText.textContent = 'New Settings applied!'
      feedbackText.style.color = '#32A94C'
      feedbackText.style.display = 'block'
      chrome.storage.local.set({popupFrequency: newPopupFrequency})
      setTimeout(function() {
        feedbackText.style.display = 'none'
      }, 2500);
      
    }
    else {
      feedbackText.textContent = 'Popup Frequency value unchanged!'
      feedbackText.style.color = '#BF2626'
      feedbackText.style.display = 'block'
      setTimeout(function() {
        feedbackText.style.display = 'none'
      }, 2500);
    }
  })
});
settingsOpnBtn.addEventListener('click', function() {
  console.log("Settings Open")
  // document.getElementById('lastTestContainer').style.display = 'none';
  document.getElementById('settingsContainer').style.display = 'block';
});

settingsCloseBtn.addEventListener('click', function() {
  console.log("Settings Close")
  // document.getElementById('lastTestContainer').style.display = 'block';
  document.getElementById('settingsContainer').style.display = 'none';
});


async function testSteps(){
  exBtn.disabled = true
  exBtn.classList.remove("hoverable")
  document.getElementById('testInProgressText').style.display = 'block';
  document.getElementById("displayHeader").textContent = "Current Overview"
  document.getElementById('currentMeasurementContainer').style.display = 'none'
  document.getElementById('histMeasurementContainer').style.display = 'none'
  document.getElementById("ispText").textContent = 'N/A'
  bwStatsContainer.style.display = 'none'
  document.getElementById('packetLossText').textContent = ""
  document.getElementById('latencyText').textContent = ""
  webBrowsingText.textContent = '?'
  webBrowsingText.style.color = '#14617b'
  videoStreamingText.textContent = '?'
  videoStreamingText.style.color = '#14617b'
  gamingText.textContent = '?'
  gamingText.style.color = '#14617b'
  teleConfText.textContent = '?'
  teleConfText.style.color = '#14617b'
  
  chrome.browsingData.remove({
    "origins": urlList
  }, {
    "appcache": true,
    "cache": true,
    "cacheStorage": true,
    "localStorage": true,
  }, function () {}
  );

  
  await getIPGeolocationData()
  
  openTabs()
 
  console.log("All steps run")
}

var exBtn = document.getElementById('startMeasurementBtn');
exBtn.addEventListener('click', function() {
  testSteps()
});

populateASNDropdown()
chrome.runtime.sendMessage({ getPopupFrequency: 1});
chrome.runtime.sendMessage({retrieveUUID: 1})
window.addEventListener('load', onPageLoad);
console.log("measure_stats.js loaded")