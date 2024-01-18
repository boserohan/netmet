var stats_dict = new Object()
 


function getTimings() {
  // Check if the browser supports the PerformanceNavigationTiming API
  if (window.performance && window.performance.getEntriesByType) {
    const navigationEntries = window.performance.getEntriesByType('navigation');

    if (navigationEntries.length > 0) {
      const navigationTiming = navigationEntries[0];

      // Time To First Byte (TTFB)/ Request Time
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      // Latency
      const latency = navigationTiming.responseStart - navigationTiming.fetchStart;
      // DNS Lookup Time
      const dnsLookupTime = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart;
      // TCP Connect Time
      const tcpConnectTime = navigationTiming.connectEnd - navigationTiming.connectStart;
      // TLS Negotiation Time
      const tlsNegotiationTime = navigationTiming.requestStart - navigationTiming.secureConnectionStart;
      // Transfer Size
      const transferSize = navigationTiming.transferSize;
      
      const pltStart = navigationTiming.loadEventStart - navigationTiming.navigationStart;
      const pltUserTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
      const requestTime = navigationTiming.responseEnd - navigationTiming.requestStart;
      const fetchTime = navigationTiming.responseEnd - navigationTiming.fetchStart;
      const serverResponseTime = navigationTiming.responseStart - navigationTiming.requestStart;

      stats_dict = {
        "performance": window.location.href,
        "ttfb": ttfb,
        "latency": latency,
        "dnsLookupTime": dnsLookupTime,
        "tcpConnectTime": tcpConnectTime, 
        "tlsNegotiationTime": tlsNegotiationTime,
        "transferSize": transferSize,
      }
      
      console.log('Sending performance stats to measure_stats.js')  
      chrome.runtime.sendMessage(stats_dict);  
      console.log(`navigationEntries: ${window.location.href}`)
      console.log('ttfb:', ttfb);
      console.log('latency:', latency);
      console.log('dnsLookupTime:', dnsLookupTime);
      console.log('tcpConnectTime:', tcpConnectTime);
      console.log('tlsNegotiationTime:', tlsNegotiationTime);
      console.log('transferSize', transferSize)  
      console.log('pltStart', pltStart)
      console.log('pltUserTime', pltUserTime)
      console.log('requestTime', requestTime)
      console.log('fetchTime', fetchTime)
      console.log('serverResponseTime', serverResponseTime)

    }
    // const resourceEntries = window.performance.getEntriesByType('resource');

    // if (resourceEntries.length > 0) {
    //   // Filter for the main document resource
    //   const mainDocumentEntry = resourceEntries.find(entry => entry.initiatorType === 'navigation');

    // if (mainDocumentEntry) {
      
    // //   const ttfb = navigationTiming.responseStart - navigationTiming.navigationStart
    // //   const latency = navigationTiming.responseStart - navigationTiming.fetchStart
    // //   const dnsLookup = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart
    // //   const connectTime = navigationTiming.connectEnd - navigationTiming.connectStart
    // //   const serverResponseTime = navigationTiming.responseStart - navigationTiming.requestStart
    // //   const pageLoadTime = navigationTiming.loadEventStart - navigationTiming.navigationStart
    // //   const downloadTime = navigationTiming.responseEnd - navigationTiming.responseStart
    // //   const domContentLoadTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart

    //     // Time To First Byte (TTFB)
    //     const ttfb = resourceEntries.responseStart - resourceEntries.requestStart;
    //     // Latency
    //     const latency = resourceEntries.responseStart - resourceEntries.fetchStart
    //     // DNS Lookup Time
    //     const dnsLookupTime = resourceEntries.domainLookupEnd - resourceEntries.domainLookupStart;
    //     // TCP Connect Time
    //     const tcpConnectTime = resourceEntries.connectEnd - resourceEntries.connectStart;
    //     // TLS Negotiation Time
    //     const tlsNegotiationTime = navigationTiming.requestStart - navigationTiming.secureConnectionStart;
    //     // Transfer Size
    //     const transferSize = navigationTiming.transferSize


    //     stats_dict[entry.name] = {
    //         "performance": entry.name,
    //         "ttfb": entry.ttfb,
    //         "latency": entry.latency,
    //         "dnsLookupTime": entry.dnsLookupTime,
    //         "tcpConnectTime": entry.tcpConnectTime, 
    //         "tlsNegotiationTime": entry.tlsNegotiationTime,
    //         "transferSize": entry.transferSize,
    //     }

    //     console.log("resourceEntries")
    //     console.log('ttfb:', ttfb);
    //     console.log('latency:', latency);
    //     console.log('dnsLookupTime:', dnsLookupTime);
    //     console.log('tcpConnectTime:', tcpConnectTime);
    //     console.log('tlsNegotiationTime:', tlsNegotiationTime);
    //     console.log('transferSize:', transferSize);
    //   }
    // }
  } 
}

getTimings()

// else if (window.performance.timing) {
//        // Time To First Byte (TTFB)
//        const ttfb = performance.timing.responseStart - performance.timing.requestStart;
//        // Latency
//        const latency = performance.timing.responseStart - performance.timing.fetchStart;
//        // DNS Lookup Time
//        const dnsLookupTime = performance.timing.domainLookupEnd - performance.timing.domainLookupStart;
//        // TCP Connect Time
//        const tcpConnectTime = performance.timing.connectEnd - performance.timing.connectStart;
//        // TLS Negotiation Time
//        const tlsNegotiationTime = performance.timing.requestStart - performance.timing.secureConnectionStart;

//        const currentUrl = window.location.href

//        console.log(`performance.timing: ${currentUrl}`)
//        console.log('ttfb:', ttfb);
//        console.log('latency:', latency);
//        console.log('dnsLookupTime:', dnsLookupTime);
//        console.log('tcpConnectTime:', tcpConnectTime);
//        console.log('tlsNegotiationTime:', tlsNegotiationTime);

//        stats_dict =  {
//         "performance": currentUrl,
//         "ttfb": ttfb,
//         "latency": latency,
//         "dnsLookupTime": dnsLookupTime,
//         "tcpConnectTime": tcpConnectTime, 
//         "tlsNegotiationTime": tlsNegotiationTime,
//         "transferSize": 0,
//         }

//         chrome.runtime.sendMessage(stats_dict);   
// }


