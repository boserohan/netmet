var stats_dict = new Object()

// const observer = new PerformanceObserver((list) => {
//     list.getEntries().forEach((entry) => {
//     //   const DNSLookupTime = entry.domainLookupEnd - entry.domainLookupStart;
//     //   stats_dict[entry.name] = {
//     //     "duration": entry.duration,
//     //     "startTime": entry.startTime,
//     //     "redirectStart": entry.redirectStart,
//     //     "redirectEnd": entry.redirectEnd,
//     //     "workerStart": entry.workerStart,
//     //     "fetchStart": entry.fetchStart,
//     //     "domainLookupStart": entry.domainLookupStart,
//     //     "domainLookupEnd": entry.domainLookupEnd,
//     //     "connectStart": entry.connectStart,
//     //     "secureConnectionStart": entry.secureConnectionStart,
//     //     "connectEnd": entry.connectEnd,
//     //     "requestStart": entry.requestStart,
//     //     "responseStart": entry.responseStart,
//     //     "responseEnd": entry.responseEnd,
//     //   }
//         // console.log(`${entry.name}: DNSLookupTime: ${DNSLookupTime}ms`);
//         // console.log(JSON.stringify(stats_dict))
//     if (entry.name === window.location.href) {
//         console.log(entry.toJSON())
//     }
        
//         // delete stats_dict[entry.name]

//     });
// });

// const observer = new PerformanceObserver((list) => {
//     const resourceEntries = list.getEntriesByType('resource');
    
//     // Filter for the first resource request
//     const firstResourceEntry = resourceEntries.find(entry => {
//       // Customize the condition based on your requirements
//       return entry.initiatorType === 'xmlhttprequest'; // Example: Filter by initiatorType
//     });
  
//     if (firstResourceEntry) {
//         console.log('First Resource Request:', firstResourceEntry);
//         // Do something with the first resource entry
//         stats_dict[entry.name] = {
//                 "duration": entry.duration,
//                 "startTime": entry.startTime,
//                 "redirectStart": entry.redirectStart,
//                 "redirectEnd": entry.redirectEnd,
//                 "workerStart": entry.workerStart,
//                 "fetchStart": entry.fetchStart,
//                 "domainLookupStart": entry.domainLookupStart,
//                 "domainLookupEnd": entry.domainLookupEnd,
//                 "connectStart": entry.connectStart,
//                 "secureConnectionStart": entry.secureConnectionStart,
//                 "connectEnd": entry.connectEnd,
//                 "requestStart": entry.requestStart,
//                 "responseStart": entry.responseStart,
//                 "responseEnd": entry.responseEnd,
//                 }
//         // console.log(`${entry.name}: DNSLookupTime: ${DNSLookupTime}ms`);
//         console.log(JSON.stringify(stats_dict))
//         delete stats_dict[entry.name]
//     }
//   });
  
// observer.observe({ type: "resource", buffered: true });



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
      const transferSize = navigationTiming.transferSize

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
    }
    const resourceEntries = window.performance.getEntriesByType('resource');
  
    if (resourceEntries.length > 0) {
      // Filter for the main document resource
      const mainDocumentEntry = resourceEntries.find(entry => entry.initiatorType === 'navigation');
  
    if (mainDocumentEntry) {
      
    //   const ttfb = navigationTiming.responseStart - navigationTiming.navigationStart
    //   const latency = navigationTiming.responseStart - navigationTiming.fetchStart
    //   const dnsLookup = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart
    //   const connectTime = navigationTiming.connectEnd - navigationTiming.connectStart
    //   const serverResponseTime = navigationTiming.responseStart - navigationTiming.requestStart
    //   const pageLoadTime = navigationTiming.loadEventStart - navigationTiming.navigationStart
    //   const downloadTime = navigationTiming.responseEnd - navigationTiming.responseStart
    //   const domContentLoadTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart

        // Time To First Byte (TTFB)
        const ttfb = resourceEntries.responseStart - resourceEntries.requestStart;
        // Latency
        const latency = resourceEntries.responseStart - resourceEntries.fetchStart
        // DNS Lookup Time
        const dnsLookupTime = resourceEntries.domainLookupEnd - resourceEntries.domainLookupStart;
        // TCP Connect Time
        const tcpConnectTime = resourceEntries.connectEnd - resourceEntries.connectStart;
        // TLS Negotiation Time
        const tlsNegotiationTime = navigationTiming.requestStart - navigationTiming.secureConnectionStart;
        // Transfer Size
        const transferSize = navigationTiming.transferSize


        stats_dict[entry.name] = {
            "performance": entry.name,
            "ttfb": entry.ttfb,
            "latency": entry.latency,
            "dnsLookupTime": entry.dnsLookupTime,
            "tcpConnectTime": entry.tcpConnectTime, 
            "tlsNegotiationTime": entry.tlsNegotiationTime,
            "transferSize": entry.transferSize,
        }

        console.log("resourceEntries")
        console.log('ttfb:', ttfb);
        console.log('latency:', latency);
        console.log('dnsLookupTime:', dnsLookupTime);
        console.log('tcpConnectTime:', tcpConnectTime);
        console.log('tlsNegotiationTime:', tlsNegotiationTime);
        console.log('transferSize:', transferSize);
      }
    }
} 
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


