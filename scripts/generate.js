function updateControls(message) {
    statusDescription.innerHTML = message;
    statusDescription.style.display = 'block';
    pickerBtn.disabled = true;
    automateBtn.disabled = true;
    generateTestIdeasBtn.disabled = true;
    checkAccessibilityBtn.disabled = true;
}

generateTestIdeasBtn.addEventListener('click', () => {
    updateControls(MESSAGES.GENERATING_TEST_IDEAS);
    displayResultInNewWindow(chrome.runtime.getURL('pages/generatedIdeas.html'));
});

automateBtn.addEventListener('click', () => {
    updateControls(MESSAGES.GENERATING_TESTS);
    displayResultInNewWindow(chrome.runtime.getURL('pages/generatedTests.html'));
});

iconComponentBtn.addEventListener('click', () => {
    updateControls(MESSAGES.GENERATING_ICON_COMPONENTS);
    displayResultInNewWindow(chrome.runtime.getURL('pages/iconComponent.html'));
});

checkAccessibilityBtn.addEventListener('click', () => {
    updateControls(MESSAGES.CHECKING_ACCESSIBILITY);
    displayResultInNewWindow(chrome.runtime.getURL('pages/checkAccessibility.html'));
});
