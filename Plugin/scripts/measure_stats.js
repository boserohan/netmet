var performanceDict = new Object()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function startTest() {
    s3_options = {
        endpoint: "http://localhost:9000",
        accessKeyId: "3PmJ12LmuYudiK4zyLpm",
        secretAccessKey: "wYeUWJ9QkcAuYQdZ4ROmBzB3HhY9anLfZkIkndxh",
        s3ForcePathStyle: 'true',
        signatureVersion: 'v4'
    }
    s3 = new AWS.S3(s3_options)
    s3.listBuckets(function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    })

    await getIPGeolocationData()
    let workerTh = new Worker("openWebsite.js")
    performanceDict["https://www.evernote.com"] = []
    workerTh.addEventListener('message', function(e) {
        // Log the workers message.
        try {
            jsonData = JSON.parse(e.data)
            performanceDict["https://www.evernote.com"].push(jsonData)
        } catch (err) {
            console.log(err)
        }
      }, false);
    workerTh.postMessage("https://www.evernote.com")
    console.log("Evernote worker started")

    let workerTh2 = new Worker("openWebsite.js")
    performanceDict["https://www.google.com"] = []
    workerTh2.addEventListener('message', function(e) {
        // Log the workers message.
        try {
            jsonData = JSON.parse(e.data)
            performanceDict["https://www.google.com"].push(jsonData)
        } catch (err) {
            console.log(err)
        }
      }, false);
    workerTh2.postMessage("https://www.google.com")
    console.log("Google worker started")
    

    await sleep(10000)
    currentTimestamp = String(Date.now())
    filename = currentTimestamp + ".json"

    var params = {
        Body: JSON.stringify(performanceDict), 
        Bucket: "measurements", 
        Key: filename, 
    }
    s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack) // an error occurred
        else     console.log(data)           // successful response
    })
    

    workerTh.terminate()
    workerTh2.terminate()
    console.log("Execution completed")
}


async function getIPGeolocationData() {
    url = 'http://ip-api.com/json/'
    const ipRequest = new Request(url)
    const response = await fetch(ipRequest, {cache: "no-store"})
    const ipJsonDetails = await response.json()
    const observer = new PerformanceObserver((list) => {
        console.log('Performance Entries upcoming')
        performanceDict[url] = {}
        
        list.getEntries().forEach((entry) => {
          console.log('Entry Timings:')
          console.log(`Entry: ${entry.name}, Duration: ${entry.duration}`)
          performanceDict[url][entry.name] = entry.duration
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

startTest()


