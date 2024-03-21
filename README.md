# NetMet: Meet your network performance

NetMet is a chrome extension/plugin capable of deciphering your network performance. This plugin can be installed in any of your chromium based browsers (Google Chrome, Opera, Brave, Edge, etc.). It can observe various web browsing metrics based on the CDN server locations you are connecting to for some of the top websites in your region. Measuring internet speeds has never been easier, with M-Lab speed test already integrated into the plugin. With just one click of a button a 1-minute test gives you all these details which helps to troubleshoot any network issues you're facing. A feature to view past historical measurement data based on which networks you carried out measurements in, is also available, to get a quick overview.

The measurement data (like, DNS Lookup, Server Connect Time, Upload speed etc.) is collected for research purposes. Only user data which is captured is your IP address and City details. No other sensitive user information like web browsing history or user location is captured.
Additionally for the integrated M-Lab speed test. Please go through M-Lab's Acceptable Use Policy [here](https://d3f2vqxgk3exj.cloudfront.net/aup/).

## Install 

Chrome Extension: [Get NetMet from Chrome Web Store](https://chromewebstore.google.com/detail/netmet-meet-your-network/oaljpapbocgcgdmpbigllilolfgebhnl)

## How the test works?

After installing the extension, a periodic popup (frequency adjustable through settings) window appears if the browser is running on your system to allow you take a new 1-minute measurement with a click of a button. Frequent measurements help us to assess the quality of your connection and various bottlenecks affecting it. 
Upon starting a new measurement, a new browser window is opened in a minimised mode and you can get back to what you were doing. While background [Javascript (JS) based](https://developer.mozilla.org/en-US/docs/Web/JavaScript#) scripts run in the minimised window to fetch top web resources hosted in popular CDNs (Content Delivery Networks) in your region. The script is responsible for running the test and gathering measurement data. NetMet uses [Chrome Developer APIs](https://developer.chrome.com/docs/extensions/reference/api) for this purpose. The web browsing metrics are captured using browser's Performance API, specifically [Resource Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing). After measuring we browsing statistics, an integrated [M-Lab speed test](https://speed.measurementlab.net/#/) is executed to measure uplink and downlink performance. At the end of the measurement, the results are displayed on the popup window and the same result data is transmitted to securely hosted servers.

## Issues?

For any issues with the software [please log it here](https://github.com/boserohan91/netmet/issues). Thanks!
