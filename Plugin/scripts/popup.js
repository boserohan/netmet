var startAdhocTestBtn = document.getElementById('startAdhocTest');
startAdhocTestBtn.addEventListener('click', function() {

  chrome.windows.create({
    type: 'popup',
    url: 'test_page.html',
    width: 700,
    height: 700,
    // top: 100,
    // left: 100,
    top: 100,
    left: 100
    // state: 'maximized'
  });
  
});
