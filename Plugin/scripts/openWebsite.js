async function fetchUrl(url) {
    // url = 'http://www.evernote.com'
    const requestUrl = new Request(url)
    requestInit = {
      cache: "no-store",
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    }
    const response = await fetch(requestUrl, requestInit)
    const stats_dict = new Object()

    const observer = new PerformanceObserver((list) => {
        
        list.getEntries().forEach((entry) => {


          stats_dict[entry.name] = {
            "duration": entry.duration,
            "startTime": entry.startTime,
            "redirectStart": entry.redirectStart,
            "redirectEnd": entry.redirectEnd,
            "workerStart": entry.workerStart,
            "fetchStart": entry.fetchStart,
            "domainLookupStart": entry.domainLookupStart,
            "domainLookupEnd": entry.domainLookupEnd,
            "connectStart": entry.connectStart,
            "secureConnectionStart": entry.secureConnectionStart,
            "connectEnd": entry.connectEnd,
            "requestStart": entry.requestStart,
            "responseStart": entry.responseStart,
            "responseEnd": entry.responseEnd,
          }
          postMessage(JSON.stringify(stats_dict))
        })
      })

      
    observer.observe({ type: "resource", buffered: true })

}

self.addEventListener('message', function(e) {
  // Fetch URL
  fetchUrl(e.data)
}, false);