var startAdhocTestBtn = document.getElementById('startAdhocTest');
var checkHistBtn = document.getElementById('checkHistory');
var settingsOpnBtn = document.getElementById('settingsOpnBtn');
var settingsCloseBtn = document.getElementById('settingsCloseBtn');
var settingsSaveBtn = document.getElementById('settingsSaveBtn');
var feedbackText = document.getElementById('settingsSaveFeedback');
var settingsContainer = document.getElementById('settingsContainer');
var lastTestContainer = document.getElementById('lastTestContainer');
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
  if (settingsContainer.style.display === 'none') {
    lastTestContainer.style.display = 'none';
    settingsContainer.style.display = 'block';
  }
  else if (settingsContainer.style.display === 'block'){
    lastTestContainer.style.display = 'block';
    settingsContainer.style.display = 'none';
  }
  
});

settingsCloseBtn.addEventListener('click', function() {
  console.log("Settings Close")
  document.getElementById('lastTestContainer').style.display = 'block';
  document.getElementById('settingsContainer').style.display = 'none';
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
    if (request.alarmFrequency) {
      document.getElementById('popupFrequency').value = request.alarmFrequency
      chrome.storage.local.set({popupFrequency: request.alarmFrequency})
    }
  })

chrome.runtime.sendMessage({ getASNDetails: 1});
chrome.runtime.sendMessage({ getPopupFrequency: 1});
console.log('popup.js loaded')