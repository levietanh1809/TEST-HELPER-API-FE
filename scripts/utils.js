let newTabId;

function displayResultInNewWindow(resultsUrl) {
    const windowWidth = 1000;
    const windowHeight = 800;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const left = (screenWidth / 2) - (windowWidth / 2);
    const top = (screenHeight / 2) - (windowHeight / 2);
    chrome.windows.create({
        url: resultsUrl,
        type: 'popup',
        width: windowWidth,
        height: windowHeight,
        left: Math.round(left),
        top: Math.round(top)
    }, function (window) {
        newTabId = window.tabs[0].id;
    });
}

/**
 * Generate HTML options from constants object
 * @param {Object} optionsObject - Object containing id and label properties
 * @param {string} selectedValue - Currently selected value (optional)
 * @returns {string} HTML options string
 */
function generateOptionsFromConstants(optionsObject, selectedValue = '') {
    return Object.values(optionsObject).map(option => {
        const selected = option.id === selectedValue ? 'selected' : '';
        return `<option value="${option.id}" ${selected}>${option.label}</option>`;
    }).join('');
}

/**
 * Generate AI model options (limited to GPT-5 Mini and O4 Mini)
 * @param {string} selectedValue - Currently selected value (optional)
 * @returns {string} HTML options string
 */
function generateAIModelOptions(selectedValue = '') {
    return generateOptionsFromConstants(AI_MODELS, selectedValue);
}

/**
 * Populate select element with options from constants
 * @param {string} selectId - ID of the select element
 * @param {Object} optionsObject - Object containing option configurations
 * @param {string} selectedValue - Currently selected value (optional)
 */
function populateSelectFromConstants(selectId, optionsObject, selectedValue = '') {
    const selectElement = document.getElementById(selectId);
    if (selectElement) {
        selectElement.innerHTML = generateOptionsFromConstants(optionsObject, selectedValue);
    }
}

/**
 * Initialize all dropdown elements with constants
 */
function initializeDropdownsFromConstants() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDropdownsFromConstants);
        return;
    }

    // AI Model dropdowns
    populateSelectFromConstants('model-select', AI_MODELS, DEFAULT_MODELS.FIGMA_TO_CODE);
    populateSelectFromConstants('test-generation-model', AI_MODELS, DEFAULT_MODELS.TEST_CASE_GENERATION);

    // Framework dropdowns
    populateSelectFromConstants('framework-select', FRAMEWORKS.FIGMA_TO_CODE, DEFAULT_SETTINGS.FIGMA_TO_CODE.framework);
    populateSelectFromConstants('css-framework-select', FRAMEWORKS.CSS, DEFAULT_SETTINGS.FIGMA_TO_CODE.cssFramework);
    populateSelectFromConstants('testing-framework', FRAMEWORKS.TESTING, DEFAULT_SETTINGS.TEST_CASE_GENERATION.testingFramework);

    // Size preset dropdown
    populateSelectFromConstants('size-select', SIZE_PRESETS, DEFAULT_SETTINGS.SIZE.preset);

    // Language dropdown
    populateSelectFromConstants('test-generation-language', LANGUAGES.TEST_CASE, DEFAULT_SETTINGS.TEST_CASE_GENERATION.language);
}

/**
 * Get model pricing information
 * @param {string} modelId - Model ID (e.g., 'gpt-5-mini')
 * @returns {Object} Pricing object with input, cachedInput, output prices
 */
function getModelPricing(modelId) {
    const model = Object.values(AI_MODELS).find(m => m.id === modelId);
    return model ? model.pricing : null;
}

/**
 * Get model limits information
 * @param {string} modelId - Model ID (e.g., 'gpt-5-mini')
 * @returns {Object} Limits object with TPM, RPM, TPD limits
 */
function getModelLimits(modelId) {
    const model = Object.values(AI_MODELS).find(m => m.id === modelId);
    return model ? model.limits : null;
}

/**
 * Calculate estimated cost for token usage
 * @param {string} modelId - Model ID
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @param {number} cachedInputTokens - Number of cached input tokens (optional)
 * @returns {number} Estimated cost in USD
 */
function calculateModelCost(modelId, inputTokens, outputTokens, cachedInputTokens = 0) {
    const pricing = getModelPricing(modelId);
    if (!pricing) return 0;
    
    const inputCost = (inputTokens / 1000) * pricing.input;
    const cachedInputCost = (cachedInputTokens / 1000) * pricing.cachedInput;
    const outputCost = (outputTokens / 1000) * pricing.output;
    
    return inputCost + cachedInputCost + outputCost;
}