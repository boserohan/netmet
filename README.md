
<img align="left" width="200" src="https://raw.githubusercontent.com/boserohan91/netmet/main/img/logo.png">
<img align="right" width="190" src="https://github.com/boserohan91/netmet/assets/58094973/c720b8b0-f8b1-4d39-9bb4-7c2f3c84d5fc">

<br/><br/><br/><br/>


# `NetMet`: Internet Performance Check Tool

`NetMet` is a chrome extension/plugin capable of deciphering your network performance. This plugin can be installed in any of your chromium based browsers (Google Chrome, Opera, Brave, Edge, etc.). It can observe various web browsing metrics based on the CDN server locations you are connecting to for some of the top websites in your region. Measuring internet speeds has never been easier, with M-Lab speed test already integrated into the plugin. With just one click of a button a 1-minute test gives you all these details which helps to troubleshoot any network issues you're facing. A feature to view past historical measurement data based on which networks you carried out measurements in, is also available, to get a quick overview.

## What does the tool measure? 

NetMet measures your overall network performance by using the following test suites.
    
1. End-to-end goodput, latency and bufferbloat (powered by [Google Speedtest](https://speed.measurementlab.net/#/))
  
  <img align="center" width="1000" src="https://raw.githubusercontent.com/boserohan91/netmet/main/img/bandwidth.png">
  
2. Web browsing performance by connecting to landing websites hosted by popular CDN providers.

  <img align="center" width="1000" src="https://raw.githubusercontent.com/boserohan91/netmet/main/img/browsing.png">

3. Video Streaming performance by fetching video on demand from Akamai DASH servers

  <img align="center" width="1000" src="https://github.com/user-attachments/assets/e74ac8fe-99b0-4a87-b2ff-3494231324e5">

Based on all collected measurements from your network, `NetMet` will calculate a score for suitability of various applications.

<img style="text-align:center;" width="300" src="https://raw.githubusercontent.com/boserohan91/netmet/main/img/score.png">

> **NOTE**: `NetMet` automatically distinguishes between measurements from different networks you connected. There is no need to categorize manually!

## Install 

Chrome Extension: [Get NetMet from Chrome Web Store](https://chromewebstore.google.com/detail/netmet-meet-your-network/oaljpapbocgcgdmpbigllilolfgebhnl)

## How does the test work?

1. Install the extension 👆
2. Popup window displayed periodically (periodic time can be custom set from settings inside the extension)
3. Test execution starts automatically on popup display
4. On test start, user IP, ISP and City details are retrieved using public REST APIs from ip-api.com
5. A new minimised browser window opens up for fetching top 20 websites in your region
6. For every website, a background script extracts performance metrics using the browser APIs
7. After fetching the 20 websites, the browser window is closed automatically
8. The web browsing measurement metrics are displayed to the user as graph visualizations on the popup window
9. The IP, ISP and City details & web browsing performance metrics are compiled into a JSON file and sent to our object storage server hosted in TUM campus network
10. A M-lab speed test for downlink and uplink are executed
11. Simultaneously, the speed test download speed and upload speed metrics are displayed at real-time to the user on the popup window
12. At the end of the speed test the packet loss and latency details are also displayed to the user
13. Performance metrics are retrieved using M-lab's API for the uplink and downlink speed test during execution
14. The speed test performance metrics are compiled into a JSON file and sent to our object storage server hosted in TUM campus network
15. After the speed test, a video streaming test over DASH is performed, and relevant metrics are captured using DASH.js API.
16. The video streaming metrics are compiled into a JSON file and sent to our object storage server hosted in TUM campus network
17. The extension waits till the next periodic popup event, and continues from step 3
    
Frequent measurements help us to assess the quality of your connection and various bottlenecks affecting it. 
NetMet uses [Chrome Developer APIs](https://developer.chrome.com/docs/extensions/reference/api) for running the test and gathering measurement data as mentioned above. The web browsing metrics are captured using browser's Performance API, specifically [Resource Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing). The speed test integrated into the extension to measure uplink and downlink performance is the [M-Lab speed test](https://speed.measurementlab.net/#/). 

## Data Collection
The measurement data (like, DNS Lookup, Server Connect Time, Upload speed etc.) is collected for research purposes. Only user data which is captured is your IP address and City details. No other sensitive user information like web browsing history or user location is captured.
Additionally, for the integrated M-Lab speed test. Please go through M-Lab's Acceptable Use Policy [here](https://d3f2vqxgk3exj.cloudfront.net/aup/).

We hope that our data collection helps us to understand the Internet better. We are an academic institution and will try to publish all our findings to a wider audience. However, **we will never publish parts of our dataset which clearly identifies you or your company.**
Please go through our data collection policies [here](https://github.com/boserohan91/netmet/blob/main/netmet-privacy-policy.md). **We do not capture any sensitive user data**. For any concerns please contact me through [email](mailto:rohan.bose@tum.de).

## Issues?

For any issues with the software [please log it here](https://github.com/boserohan91/netmet/issues). Thanks!