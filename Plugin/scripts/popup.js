var startAdhocTestBtn = document.getElementById('startAdhocTest');
var checkHistBtn = document.getElementById('checkHistory');
var lastTestASN = null;
startAdhocTestBtn.addEventListener('click', function() {
  console.log("startAdhocTest")
  chrome.windows.create({
    type: 'popup',
    url: 'index.html?action=startnewtest',
    width: 700,
    height: 700,
    // top: 100,
    // left: 100,
    top: 100,
    left: 100
    // state: 'maximized'
  });
});

checkHistBtn.addEventListener('click', function() {
  console.log("checkHistory")
  chrome.storage.local.get(['asnDetails'], function(result) {
    if (result.asnDetails) {
      console.log(`ASN: ${result.asnDetails.lastASN}`)
      chrome.windows.create({
        type: 'popup',
        url: `index.html?action=checkhistory&asn=${result.asnDetails.lastASN}`,
        width: 700,
        height: 700,
        // top: 100,
        // left: 100,
        top: 100,
        left: 100
        // state: 'maximized'
      });
    }

  })
  

  chrome.runtime.sendMessage({ action: 'startNewTest'});
  
  
});

// function addItemToDropdown(listId, itemName) {
//   var newItem = document.createElement("li");
//   newItem.setAttribute("data-thq", "thq-dropdown");
//   newItem.setAttribute("class", "popup-dropdown list-item");
//   // Create a div element within the li
//   var divElement = document.createElement("div");
//   divElement.setAttribute("data-thq", "thq-dropdown-toggle");
//   divElement.setAttribute("class", "popup-dropdown-toggle1");

//   // Create a span element within the div
//   var spanElement = document.createElement("span");
//   spanElement.setAttribute("class", "popup-text02");
//   spanElement.textContent = itemName;
//   // spanElement.addEventListener("click", clickASNItemHandler)
//   // Append the span element to the div
//   divElement.appendChild(spanElement);

//   // Append the div element to the li
//   newItem.appendChild(divElement);

//   // Append the new li element to the existing UL
//   document.getElementById(listId).appendChild(newItem);
// }


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(`Received message: ${JSON.stringify(request)}`)
    if (request.asnDetails) {
      // if (request.asnDetails.hasOwnProperty('asnSet')) {
      //   request.asnDetails.asnSet.forEach(function (value) {
      //     addItemToDropdown('dropdownASNList',value)
      //   })
      // }
      chrome.storage.local.set({ asnDetails: request.asnDetails });
      document.getElementById('ispText').textContent = request.asnDetails.lastASN
      document.getElementById('lastTestText').textContent = request.asnDetails.lastResults.timestamp
    }
  })

chrome.runtime.sendMessage({ getASNDetails: 1});
console.log('popup.js loaded')