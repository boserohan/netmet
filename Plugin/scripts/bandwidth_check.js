let buttonObserver;
let spinnerObserver;

// Function to observe the target element for style changes
function observeButtonElement() {
  const btnElement = document.getElementById("show-more-details-link");

  if (btnElement) {
    // Create a MutationObserver to observe style changes
    buttonObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === "style") {
          const displayStyle = btnElement.style.display;
          console.log("Display style:", displayStyle);
          // Handle the style change as needed
          if (displayStyle === "block") {
            btnElement.click()
            buttonObserver.disconnect()
          }    
        }
      });
    });
    // Configure and start the MutationObserver
    buttonObserver.observe(btnElement, { attributes: true, attributeFilter: ["style"] });
  }
}

function observeSpinnerElement() {
    const spinnerElement = document.getElementById("speed-progress-indicator");
  
    if (spinnerElement) {
      // Create a MutationObserver to observe style changes
      spinnerObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.attributeName === "class") {
            const currentClass = spinnerElement.classList.contains('succeeded') ? 'succeeded' : 'not-succeeded';
            console.log("current class:", currentClass);
            // Handle the style change as needed
            if (currentClass === "succeeded") {
              chrome.runtime.sendMessage({action: "take_screenshot"})
              spinnerObserver.disconnect()
            }    
          }
        });
      });
  
      // Configure and start the MutationObserver
      spinnerObserver.observe(spinnerElement, { attributes: true, attributeFilter: ["class"] });
    }
  }


observeButtonElement();
observeSpinnerElement();