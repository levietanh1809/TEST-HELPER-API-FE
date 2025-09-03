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
    
    // Validate Figma URL input when button is clicked
    const figmaUrlInput = document.getElementById('figma-url-input');
    if (figmaUrlInput) {
        const figmaUrl = figmaUrlInput.value.trim();
        
        if (figmaUrl) {
            // Extract node-id from URL
            const nodeId = extractNodeIdFromUrl(figmaUrl);
            
            if (nodeId) {
                // Store the extracted node-id for use in API call
                window.extractedNodeId = nodeId;
                console.log('Extracted Node ID on Load:', nodeId);
            } else {
                // Show alert for invalid format and stop loading
                alert('Invalid Figma URL format!\nPlease ensure the URL contains node-id parameter.\nExample: ?node-id=183124-126309');
                return; // Stop execution, don't load components
            }
        } else {
            // Clear extracted node-id if input is empty
            window.extractedNodeId = null;
            console.log('No Figma URL provided, using Google Sheet');
        }
    }
    
    // Disable button and add loading state
    reloadBtn.disabled = true;
    reloadBtn.classList.add('loading');    
    loadIconComponents();
}

/**
 * Extracts node-id from Figma URL
 * @param {string} figmaUrl - The Figma URL
 * @returns {string|null} - The extracted node-id or null if not found
 */
function extractNodeIdFromUrl(figmaUrl) {
    if (!figmaUrl || typeof figmaUrl !== 'string') {
        return null;
    }
    
    // Extract node-id from URL using regex
    // Pattern: node-id=183124-126309 -> 183124:126309
    const nodeIdMatch = figmaUrl.match(/node-id=([0-9]+-[0-9]+)/);
    
    if (nodeIdMatch && nodeIdMatch[1]) {
        // Convert dash to colon format: 183124-126309 -> 183124:126309
        return nodeIdMatch[1].replace('-', ':');
    }
    
    return null;
}


