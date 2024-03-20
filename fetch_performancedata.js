var stats_dict = new Object()
 


function getTimings() {
  // Check if the browser supports the PerformanceNavigationTiming API
  if (window.performance && window.performance.getEntriesByType) {
    const navigationEntries = window.performance.getEntriesByType('navigation');

    if (navigationEntries.length > 0) {
      const navigationTiming = navigationEntries[0];

      // Time To First Byte (TTFB)/ Server Response Time
      const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
      // Latency
      const latency = navigationTiming.responseStart - navigationTiming.fetchStart;
      // DNS Lookup Time
      const dnsLookupTime = navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart;
      // TCP Connect Time
      const tcpConnectTime = navigationTiming.connectEnd - navigationTiming.connectStart;
      // TLS Negotiation Time
      const tlsNegotiationTime = navigationTiming.requestStart - navigationTiming.secureConnectionStart;
      
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
      }
      
      console.log('Sending performance stats to measure_stats.js')  
      chrome.runtime.sendMessage(stats_dict);  
      console.log(`navigationEntries: ${window.location.href}`)
      console.log('ttfb:', ttfb);
      console.log('latency:', latency);
      console.log('dnsLookupTime:', dnsLookupTime);
      console.log('tcpConnectTime:', tcpConnectTime);
      console.log('tlsNegotiationTime:', tlsNegotiationTime);
      console.log('pltStart', pltStart)
      console.log('pltUserTime', pltUserTime)
      console.log('requestTime', requestTime)
      console.log('fetchTime', fetchTime)
      console.log('serverResponseTime', serverResponseTime)

    }
  } 
}

getTimings()


