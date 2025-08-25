document.addEventListener('DOMContentLoaded', () => {
    loadIconComponents();
    
    // Add reload button event listener
    const reloadBtn = document.getElementById('reload-btn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', handleReload);
    }
});

/**
 * Loads icon components from API
 */
function loadIconComponents() {
    const container = document.getElementById('main-content');
    if (container) {
        container.innerHTML = '<div class="loading-message">Loading icon components...</div>';
    }
    showResultBE(FEATURE.GET_ICON_COMPONENTS);
}

/**
 * Handles reload button click
 */
function handleReload() {
    const reloadBtn = document.getElementById('reload-btn');
    
    // Disable button and add loading state
    reloadBtn.disabled = true;
    reloadBtn.classList.add('loading');    
    loadIconComponents();
}
