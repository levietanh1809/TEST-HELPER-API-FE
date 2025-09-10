/**
 * Test Case Generation functionality
 * Handles test case generation from Figma components with SRS descriptions
 */

// Global variables to store current state
let testCaseGenerationSettings = {
    model: DEFAULT_SETTINGS.TEST_CASE_GENERATION.model,
    testingFramework: DEFAULT_SETTINGS.TEST_CASE_GENERATION.testingFramework,
    includeUITests: DEFAULT_SETTINGS.TEST_CASE_GENERATION.includeUITests,
    language: DEFAULT_SETTINGS.TEST_CASE_GENERATION.language
};

let srsToMarkdownSettings = {
    model: DEFAULT_SETTINGS.SRS_TO_MARKDOWN.model,
    outputFormat: DEFAULT_SETTINGS.SRS_TO_MARKDOWN.outputFormat,
    preserveFormatting: DEFAULT_SETTINGS.SRS_TO_MARKDOWN.preserveFormatting
};

let currentGeneratedTestCases = [];
let currentTestCaseSummary = null;
let currentComponentData = null;
let currentGroupedTestCases = null;

/**
 * Initialize test case generation functionality
 */
function initializeTestCaseGeneration() {
    loadTestCaseGenerationSettings();
    loadSRSToMarkdownSettings();
    setupTestCaseEventListeners();
    
    // Initialize character counter
    updateCharacterCounter();
}

/**
 * Validate Figma response completeness for quality UI tests
 */
function validateFigmaResponseQuality(figmaResponse) {
    const issues = [];
    
    if (!figmaResponse) {
        issues.push('No Figma response data');
        return { isValid: false, issues };
    }
    
    // Essential fields
    if (!figmaResponse.id) issues.push('Missing Figma node ID');
    if (!figmaResponse.name) issues.push('Missing component name');
    if (!figmaResponse.type) issues.push('Missing node type');
    
    // Structure quality indicators
    if (!figmaResponse.absoluteBoundingBox) {
        issues.push('Missing bounding box data (affects positioning tests)');
    }
    
    if (!figmaResponse.children || !Array.isArray(figmaResponse.children)) {
        issues.push('Missing or invalid children data (limits interaction tests)');
    } else if (figmaResponse.children.length === 0) {
        issues.push('No child elements found (may limit UI interaction tests)');
    }
    
    // Useful for test grounding
    const hasNamedElements = figmaResponse.children && figmaResponse.children.length > 0 ? 
        figmaResponse.children.some(child => 
            child.name && !child.name.startsWith('Rectangle') && !child.name.startsWith('Ellipse')
        ) : false;
        
    if (figmaResponse.children && figmaResponse.children.length > 0 && !hasNamedElements) {
        issues.push('No meaningfully named child elements (harder to generate specific selectors)');
    }
    
    return {
        isValid: issues.length === 0,
        issues,
        hasChildren: !!(figmaResponse.children && figmaResponse.children.length > 0),
        hasPositioning: !!figmaResponse.absoluteBoundingBox,
        hasNamedElements,
        childrenCount: figmaResponse.children ? figmaResponse.children.length : 0
    };
}

/**
 * Load settings from storage
 */
async function loadTestCaseGenerationSettings() {
    try {
        // Ensure storageWrapper is available
        if (typeof storageWrapper === 'undefined') {
            console.warn('StorageWrapper not available, using default settings');
            updateTestCaseSettingsUI();
            return;
        }
        
        const data = await storageWrapper.get([
            STORAGE.TEST_CASE_GENERATION_MODEL,
            STORAGE.TEST_CASE_GENERATION_FRAMEWORK,
            STORAGE.TEST_CASE_GENERATION_INCLUDE_UI,
            STORAGE.TEST_CASE_GENERATION_LANGUAGE
        ]);

        testCaseGenerationSettings = {
            model: data[STORAGE.TEST_CASE_GENERATION_MODEL] || DEFAULT_SETTINGS.TEST_CASE_GENERATION.model,
            testingFramework: data[STORAGE.TEST_CASE_GENERATION_FRAMEWORK] || DEFAULT_SETTINGS.TEST_CASE_GENERATION.testingFramework,
            includeUITests: data[STORAGE.TEST_CASE_GENERATION_INCLUDE_UI] !== false,
            language: data[STORAGE.TEST_CASE_GENERATION_LANGUAGE] || DEFAULT_SETTINGS.TEST_CASE_GENERATION.language
        };

        updateTestCaseSettingsUI();
    } catch (error) {
        console.error('Error loading test case generation settings:', error);
    }
}

/**
 * Save settings to storage
 */
async function saveTestCaseGenerationSettings() {
    try {
        // Ensure storageWrapper is available
        if (typeof storageWrapper === 'undefined') {
            console.warn('StorageWrapper not available, cannot save settings');
            return;
        }
        
        await storageWrapper.set({
            [STORAGE.TEST_CASE_GENERATION_MODEL]: testCaseGenerationSettings.model,
            [STORAGE.TEST_CASE_GENERATION_FRAMEWORK]: testCaseGenerationSettings.testingFramework,
            [STORAGE.TEST_CASE_GENERATION_INCLUDE_UI]: testCaseGenerationSettings.includeUITests,
            [STORAGE.TEST_CASE_GENERATION_LANGUAGE]: testCaseGenerationSettings.language
        });
    } catch (error) {
        console.error('Error saving test case generation settings:', error);
    }
}

/**
 * Update settings UI with current values
 */
function updateTestCaseSettingsUI() {
    const testingFrameworkSelect = document.getElementById('testing-framework');
    const testGenerationModelSelect = document.getElementById('test-generation-model');
    const includeUITestsCheck = document.getElementById('include-ui-tests');
    const testGenerationLanguageSelect = document.getElementById('test-generation-language');

    if (testingFrameworkSelect) testingFrameworkSelect.value = testCaseGenerationSettings.testingFramework;
    if (testGenerationModelSelect) testGenerationModelSelect.value = testCaseGenerationSettings.model;
    if (includeUITestsCheck) includeUITestsCheck.checked = testCaseGenerationSettings.includeUITests;
    if (testGenerationLanguageSelect) testGenerationLanguageSelect.value = testCaseGenerationSettings.language;
}

/**
 * Setup event listeners for test case generation functionality
 */
function setupTestCaseEventListeners() {
    // Test case modal controls
    const testCaseModal = document.getElementById('test-case-modal');
    const testCaseClose = document.getElementById('test-case-close');
    const generateTestCasesBtn = document.getElementById('generate-test-cases-btn');
    const cancelTestCaseBtn = document.getElementById('cancel-test-case-btn');

    if (testCaseClose) {
        testCaseClose.addEventListener('click', closeTestCaseModal);
    }
    
    if (generateTestCasesBtn) {
        generateTestCasesBtn.addEventListener('click', handleGenerateTestCases);
    }
    
    if (cancelTestCaseBtn) {
        cancelTestCaseBtn.addEventListener('click', closeTestCaseModal);
    }

    // Test case results modal controls
    const testCaseResultsModal = document.getElementById('test-case-results-modal');
    const testCaseResultsClose = document.getElementById('test-case-results-close');
    const closeTestCaseResultsBtn = document.getElementById('close-test-case-results-btn');
    const exportTestCasesBtn = document.getElementById('export-test-cases-btn');

    if (testCaseResultsClose) {
        testCaseResultsClose.addEventListener('click', closeTestCaseResultsModal);
    }
    
    if (closeTestCaseResultsBtn) {
        closeTestCaseResultsBtn.addEventListener('click', closeTestCaseResultsModal);
    }
    
    if (exportTestCasesBtn) {
        exportTestCasesBtn.addEventListener('click', exportTestCases);
    }

    // Context menu test case generation
    const generateTestCaseItem = document.getElementById('generate-test-case-item');
    if (generateTestCaseItem) {
        generateTestCaseItem.addEventListener('click', handleGenerateTestCaseAction);
    }

    // SRS to Markdown functionality
    const convertToMarkdownBtn = document.getElementById('convert-to-markdown-btn');
    const srsDescription = document.getElementById('srs-description');
    const charCount = document.getElementById('char-count');

    if (convertToMarkdownBtn) {
        convertToMarkdownBtn.addEventListener('click', handleSRSToMarkdownConversion);
    }

    if (srsDescription) {
        srsDescription.addEventListener('input', updateCharacterCounter);
        srsDescription.addEventListener('paste', handlePasteEvent);
    }

    // NOTE: Backdrop click to close functionality removed to prevent accidental modal closure
    // Users must use explicit close buttons (X button, Cancel, etc.)
}

/**
 * Handle generate test case action from context menu
 */
async function handleGenerateTestCaseAction() {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu || !contextMenu.componentData) return;

    currentComponentData = contextMenu.componentData;
    hideContextMenu();

    try {
        // Open test case input modal
        openTestCaseModal();
        
        // Pre-fill UI tests checkbox and validate Figma data quality
        const includeUITestsCheck = document.getElementById('include-ui-tests');
        if (includeUITestsCheck) {
            let figmaQuality = { hasData: false, quality: 'none' };
            
            if (currentComponentData.figmaResponse) {
                const validation = validateFigmaResponseQuality(currentComponentData.figmaResponse);
                figmaQuality = {
                    hasData: true,
                    quality: validation.isValid ? 'high' : validation.hasChildren ? 'medium' : 'low',
                    issues: validation.issues,
                    childrenCount: validation.childrenCount
                };
            }
            
            includeUITestsCheck.checked = figmaQuality.hasData && figmaQuality.quality !== 'low';
            
            // Update UI tests label with quality indicator
            updateUITestsLabel(figmaQuality);
        }

    } catch (error) {
        console.error('Error opening test case modal:', error);
        showToast(RESULT.ERROR, 'Failed to open test case generation modal');
    }
}

/**
 * Update UI tests label with quality indicator
 */
function updateUITestsLabel(figmaQuality) {
    const uiTestsLabel = document.querySelector('label[for="include-ui-tests"]');
    if (!uiTestsLabel) return;
    
    let statusText = '';
    let statusColor = '';
    
    if (!figmaQuality.hasData) {
        statusText = '⚠ No Figma data';
        statusColor = '#ef4444';
    } else {
        switch (figmaQuality.quality) {
            case 'high':
                statusText = `✓ High quality (${figmaQuality.childrenCount} elements)`;
                statusColor = '#10b981';
                break;
            case 'medium':
                statusText = `⚡ Medium quality (${figmaQuality.childrenCount} elements)`;
                statusColor = '#f59e0b';
                break;
            case 'low':
                statusText = '⚠ Low quality - limited test coverage';
                statusColor = '#ef4444';
                break;
        }
    }
    
    const isChecked = figmaQuality.hasData && figmaQuality.quality !== 'low';
    
    uiTestsLabel.innerHTML = `
        <input type="checkbox" id="include-ui-tests" ${isChecked ? 'checked' : ''}>
        Include UI Tests (using Figma component data) 
        <span style="color: ${statusColor}; font-size: 0.8em;">${statusText}</span>
    `;
    
    // Add tooltip with issues if any
    if (figmaQuality.issues && figmaQuality.issues.length > 0) {
        const tooltip = document.createElement('div');
        tooltip.style.cssText = 'font-size: 0.75em; color: #6b7280; margin-top: 4px;';
        tooltip.innerHTML = `<strong>Issues:</strong> ${figmaQuality.issues.join(', ')}`;
        uiTestsLabel.appendChild(tooltip);
    }
}

/**
 * Open test case input modal
 */
function openTestCaseModal() {
    const modal = document.getElementById('test-case-modal');
    if (modal) {
        updateTestCaseSettingsUI();
        modal.style.display = 'flex';
        
        // Load cached SRS markdown if available to avoid re-calling API
        (async () => {
            try {
                let data;
                if (typeof storageWrapper !== 'undefined') {
                    data = await storageWrapper.get([STORAGE.SRS_TO_MARKDOWN_CACHE]);
                } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    data = await chrome.storage.local.get([STORAGE.SRS_TO_MARKDOWN_CACHE]);
                } else {
                    data = {};
                }
                const cache = data && data[STORAGE.SRS_TO_MARKDOWN_CACHE];
                if (cache && cache.markdownContent) {
                    const srsDescription = document.getElementById('srs-description');
                    if (srsDescription && (!srsDescription.value || srsDescription.value.trim().length === 0)) {
                        srsDescription.value = cache.markdownContent;
                        updateCharacterCounter();
                    }
                }
            } catch (e) {
                console.warn('Failed to load cached SRS markdown:', e);
            }
        })();

        // Focus on SRS description field
        const srsDescription = document.getElementById('srs-description');
        if (srsDescription) {
            setTimeout(() => srsDescription.focus(), 100);
        }
    }
}

/**
 * Close test case input modal
 */
function closeTestCaseModal() {
    const modal = document.getElementById('test-case-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Clear form
    resetTestCaseForm();
}

/**
 * Reset test case form to initial state
 */
function resetTestCaseForm() {
    const srsDescription = document.getElementById('srs-description');
    const projectName = document.getElementById('project-name');
    const additionalRequirements = document.getElementById('additional-requirements');

    if (srsDescription) srsDescription.value = '';
    if (projectName) projectName.value = '';
    if (additionalRequirements) additionalRequirements.value = '';
}

/**
 * Handle generate test cases button click
 */
async function handleGenerateTestCases() {
    try {
        // Clear previous validation errors
        if (typeof clearValidationErrors === 'function') {
            clearValidationErrors();
        }
        
        // Get form values
        const formData = getTestCaseFormData();
        
        // Validate form data
        if (typeof validateTestCaseGenerationForm === 'function') {
            const validation = validateTestCaseGenerationForm(formData);
            if (!validation.isValid) {
                if (typeof showValidationErrors === 'function') {
                    showValidationErrors(validation.errors);
                } else {
                    showToast(RESULT.ERROR, validation.errors.join(', '));
                }
                
                // Highlight first error field
                if (validation.errors.length > 0) {
                    const firstError = validation.errors[0];
                    if (firstError.includes('SRS description')) {
                        if (typeof highlightFieldError === 'function') {
                            highlightFieldError('srs-description');
                        }
                    } else if (firstError.includes('Project name')) {
                        if (typeof highlightFieldError === 'function') {
                            highlightFieldError('project-name');
                        }
                    }
                }
                return;
            }
        } else {
            // Fallback validation - no required fields now
            // Basic validation for testing framework and model
            if (!formData.testingFramework) {
                showToast(RESULT.ERROR, 'Please select a testing framework!');
                return;
            }
            if (!formData.model) {
                showToast(RESULT.ERROR, 'Please select an AI model!');
                return;
            }
        }
        
        // Close input modal and open results modal
        closeTestCaseModal();
        openTestCaseResultsModal();
        showTestCaseLoading();

        // Generate test cases
        await generateTestCasesFromComponent(formData);

    } catch (error) {
        console.error('Error generating test cases:', error);
        showToast(RESULT.ERROR, 'Failed to generate test cases: ' + error.message);
        closeTestCaseResultsModal();
    }
}

/**
 * Get form data for test case generation
 */
function getTestCaseFormData() {
    const srsDescription = document.getElementById('srs-description');
    const projectName = document.getElementById('project-name');
    const testingFramework = document.getElementById('testing-framework');
    const testGenerationModel = document.getElementById('test-generation-model');
    const includeUITests = document.getElementById('include-ui-tests');
    const additionalRequirements = document.getElementById('additional-requirements');
    const testGenerationLanguage = document.getElementById('test-generation-language');

    return {
        srsDescription: srsDescription ? srsDescription.value.trim() : '',
        projectName: projectName ? projectName.value.trim() : '',
        testingFramework: testingFramework ? testingFramework.value : DEFAULT_SETTINGS.TEST_CASE_GENERATION.testingFramework,
        model: testGenerationModel ? testGenerationModel.value : DEFAULT_SETTINGS.TEST_CASE_GENERATION.model,
        includeUITests: includeUITests ? includeUITests.checked : false,
        additionalRequirements: additionalRequirements ? additionalRequirements.value.trim() : '',
        language: testGenerationLanguage ? testGenerationLanguage.value : DEFAULT_SETTINGS.TEST_CASE_GENERATION.language
    };
}

/**
 * Open test case results modal
 */
function openTestCaseResultsModal() {
    const modal = document.getElementById('test-case-results-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close test case results modal
 */
function closeTestCaseResultsModal() {
    const modal = document.getElementById('test-case-results-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset modal state
    resetTestCaseResultsModal();
}

/**
 * Reset test case results modal to initial state
 */
function resetTestCaseResultsModal() {
    const testCaseLoading = document.getElementById('test-case-loading');
    const testCaseContent = document.getElementById('test-case-content');
    const exportBtn = document.getElementById('export-test-cases-btn');

    if (testCaseLoading) testCaseLoading.style.display = 'none';
    if (testCaseContent) testCaseContent.style.display = 'none';
    if (exportBtn) exportBtn.style.display = 'none';

    currentGeneratedTestCases = [];
    currentTestCaseSummary = null;
    currentGroupedTestCases = null;
    window.currentGroupedTestCases = null;
}

/**
 * Show loading state in test case results modal
 */
function showTestCaseLoading() {
    const testCaseLoading = document.getElementById('test-case-loading');
    const testCaseContent = document.getElementById('test-case-content');

    if (testCaseLoading) testCaseLoading.style.display = 'flex';
    if (testCaseContent) testCaseContent.style.display = 'none';
}

/**
 * Generate test cases from component data
 */
async function generateTestCasesFromComponent(formData) {
    const payload = {
        srsDescription: formData.srsDescription, // Keep optional as per new requirements
        projectName: formData.projectName || 'Figma Component Test Suite',
        testingFramework: formData.testingFramework,
        model: formData.model,
        includeUITests: formData.includeUITests,
        language: formData.language || 'en', // Default to English
        additionalRequirements: formData.additionalRequirements
    };

    // Validate and add Figma response for UI tests
    if (formData.includeUITests) {
        if (!currentComponentData || !currentComponentData.figmaResponse) {
            throw new Error('UI Tests require Figma component data. Please ensure you have selected a valid Figma component.');
        }
        
        // Validate Figma response quality for better UI test generation
        const figmaResponse = currentComponentData.figmaResponse;
        const validation = validateFigmaResponseQuality(figmaResponse);
        
        if (!validation.isValid) {
            console.warn('Figma data quality issues:', validation.issues);
            // Still proceed but log issues for debugging
        }
        
        // Log quality metrics for debugging
        console.log('Figma data quality:', {
            hasChildren: validation.hasChildren,
            childrenCount: validation.childrenCount,
            hasPositioning: validation.hasPositioning,
            issues: validation.issues
        });
        
        // Ensure we have the complete node JSON with children for better grounding
        payload.figmaResponse = figmaResponse;
    }

    const response = await fetch(BE_API_LOCAL + ENDPOINTS.TEST_CASE_GENERATION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Test case generation failed');
    }

    // Store generated test cases
    currentGeneratedTestCases = result.data.testCases || [];
    currentTestCaseSummary = result.data.summary || null;
    currentGroupedTestCases = result.data.groupedByCategory || null;
    
    // Make grouped test cases available globally for copy function
    window.currentGroupedTestCases = currentGroupedTestCases;

    // Display generated test cases
    displayGeneratedTestCases(result.data);
    
    // Show cost information
    const costMessage = result.openaiUsage?.cost 
        ? `Test cases generated successfully! Cost: $${result.openaiUsage.cost.toFixed(4)}`
        : 'Test cases generated successfully!';
    showToast(RESULT.SUCCESS, costMessage);
}

/**
 * Display generated test cases in modal
 */
function displayGeneratedTestCases(data) {
    const testCaseLoading = document.getElementById('test-case-loading');
    const testCaseContent = document.getElementById('test-case-content');
    const exportBtn = document.getElementById('export-test-cases-btn');
    const modalTitle = document.getElementById('test-case-results-title');

    // Hide loading, show content
    if (testCaseLoading) testCaseLoading.style.display = 'none';
    if (testCaseContent) testCaseContent.style.display = 'flex';
    if (exportBtn) exportBtn.style.display = 'inline-block';

    // Update modal title
    if (modalTitle) {
        modalTitle.textContent = `Generated Test Cases - ${data.projectName || 'Component'}`;
    }

    // Display summary
    if (data.summary) {
        displayTestCaseSummary(data.summary);
    }

    // Display test cases with validation - prefer groupedByCategory for better organization
    if (data.groupedByCategory && Object.keys(data.groupedByCategory).length > 0) {
        displayGroupedTestCases(data.groupedByCategory);
    } else if (data.testCases && Array.isArray(data.testCases) && data.testCases.length > 0) {
        displayTestCaseList(data.testCases);
    } else {
        // Handle case where no test cases were generated
        const listContainer = document.getElementById('test-case-list');
        if (listContainer) {
            listContainer.innerHTML = '<div class="no-test-cases">No test cases were generated. Please try again with different parameters.</div>';
        }
    }
}

/**
 * Display test case summary
 */
function displayTestCaseSummary(summary) {
    const summaryContainer = document.getElementById('test-case-summary');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = `
        <h2>Test Generation Summary</h2>
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-number">${summary.totalTestCases || 0}</span>
                <span class="stat-label">Total Test Cases Generated</span>
            </div>
        </div>
    `;
}

/**
 * Display grouped test cases by category (copy-friendly for testers)
 */
function displayGroupedTestCases(groupedByCategory) {
    const listContainer = document.getElementById('test-case-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // Sort categories to show most important ones first
    const categoryOrder = ['functional', 'ui_ux', 'integration', 'security', 'performance', 'accessibility', 'edge_case', 'regression'];
    const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a);
        const bIndex = categoryOrder.indexOf(b);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    // Track global index across all categories to avoid duplicate IDs
    let globalIndex = 0;

    sortedCategories.forEach(category => {
        const testCases = groupedByCategory[category];
        if (!testCases || !Array.isArray(testCases) || testCases.length === 0) return;

        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'test-category-section';
        categorySection.innerHTML = `
            <div class="category-header">
                <h3 class="category-title">${category.replace('_', ' ').toUpperCase()} TESTS (${testCases.length})</h3>
                <button class="copy-category-btn" onclick="copyCategoryToClipboard('${category}')" title="Copy this category for testers">
                    <i class="bi bi-clipboard"></i> Copy Category
                </button>
            </div>
            <div class="category-test-cases" id="category-${category}">
                ${testCases.map((testCase) => {
                    const html = `<div class="test-case-card">${createTestCaseHTML(testCase, globalIndex, category)}</div>`;
                    globalIndex++;
                    return html;
                }).join('')}
            </div>
        `;
        
        listContainer.appendChild(categorySection);
    });
}

/**
 * Display test case list (fallback for non-grouped response)
 */
function displayTestCaseList(testCases) {
    const listContainer = document.getElementById('test-case-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    testCases.forEach((testCase, index) => {
        const testCaseCard = document.createElement('div');
        testCaseCard.className = 'test-case-card';
        testCaseCard.innerHTML = createTestCaseHTML(testCase, index);
        listContainer.appendChild(testCaseCard);
    });
}

/**
 * Format expectedBehavior - handle both string and object format
 */
function formatExpectedBehavior(expectedBehavior) {
    if (!expectedBehavior) return '';
    
    // If it's a string, return as is
    if (typeof expectedBehavior === 'string') {
        return expectedBehavior;
    }
    
    // If it's an object, format it nicely
    if (typeof expectedBehavior === 'object') {
        let formatted = '';
        
        if (expectedBehavior.text) {
            formatted += expectedBehavior.text;
        }
        
        if (expectedBehavior.visibility) {
            formatted += ` (${expectedBehavior.visibility})`;
        }
        
        // Add visual properties if available
        const visualProps = [];
        if (expectedBehavior.fontSize) visualProps.push(`font-size: ${expectedBehavior.fontSize}px`);
        if (expectedBehavior.fontWeight) visualProps.push(`font-weight: ${expectedBehavior.fontWeight}`);
        if (expectedBehavior.color) visualProps.push(`color: ${expectedBehavior.color}`);
        
        if (visualProps.length > 0) {
            formatted += ` [${visualProps.join(', ')}]`;
        }
        
        return formatted || JSON.stringify(expectedBehavior);
    }
    
    // Fallback for other types
    return String(expectedBehavior);
}

/**
 * Create simplified HTML for a single test case with checkbox and copy button
 */
function createTestCaseHTML(testCase, index, category = null) {
    const testCaseId = testCase.id || `TC${index + 1}`;
    
    return `
        <div class="simple-test-case">
            <div class="test-case-header">
                <div class="test-case-controls">
                    <input type="checkbox" id="done-${testCaseId}" class="test-done-checkbox" />
                    <label for="done-${testCaseId}" class="test-done-label">Done</label>
                </div>
                <button class="copy-test-btn" onclick="copyTestCaseToClipboard('${testCaseId}')" title="Copy test case">
                    <i class="bi bi-clipboard"></i> Copy
                </button>
            </div>
            
            <div class="test-content" id="test-${testCaseId}">
                <h4>${testCaseId} - ${testCase.title || `Test Case ${index + 1}`}</h4>
                
                <div class="test-meta-simple">
                    <span class="priority ${testCase.priority || 'medium'}">${testCase.priority || 'medium'}</span>
                    <span class="category">${testCase.category || 'functional'}</span>
                    <span class="test-type">${testCase.type || 'positive'}</span>
                </div>
                
                <p><strong>Description:</strong> ${testCase.description || 'No description provided'}</p>
                
                ${testCase.preconditions ? `
                    <div class="preconditions">
                        <strong>Preconditions:</strong>
                        <ul>
                            ${Array.isArray(testCase.preconditions) 
                                ? testCase.preconditions.map(condition => `<li>${condition}</li>`).join('') 
                                : `<li>${testCase.preconditions}</li>`
                            }
                        </ul>
                    </div>
                ` : ''}
                
                ${testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0 ? `
                    <div class="test-steps">
                        <strong>Test Steps:</strong>
                        <ol>
                            ${testCase.steps.map(step => `
                                <li>
                                    Action: ${step.action || ''}
                                    ${step.expectedBehavior ? ` | Expected: ${formatExpectedBehavior(step.expectedBehavior)}` : ''}
                                    ${step.testData ? ` | Data: ${step.testData}` : ''}
                                </li>
                            `).join('')}
                        </ol>
                    </div>
                ` : ''}
                
                <p><strong>Expected Result:</strong> ${testCase.expectedResult || 'Test should pass successfully'}</p>
                
                ${testCase.tags && Array.isArray(testCase.tags) && testCase.tags.length > 0 ? `
                    <p><strong>Tags:</strong> ${testCase.tags.join(', ')}</p>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Export test cases
 */
async function exportTestCases() {
    if (!currentGeneratedTestCases || currentGeneratedTestCases.length === 0) {
        showToast(RESULT.ERROR, 'No test cases to export');
        return;
    }

    try {
        const exportData = {
            testCases: currentGeneratedTestCases,
            groupedByCategory: currentGroupedTestCases,
            summary: currentTestCaseSummary,
            generatedAt: new Date().toISOString(),
            componentData: currentComponentData,
            model: 'exported-from-frontend'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `test-cases-${Date.now()}.json`;
        link.click();

        showToast(RESULT.SUCCESS, 'Test cases exported successfully!');

    } catch (error) {
        console.error('Error exporting test cases:', error);
        showToast(RESULT.ERROR, 'Failed to export test cases: ' + error.message);
    }
}

/**
 * Copy individual test case to clipboard in tester-friendly format
 */
async function copyTestCaseToClipboard(testCaseId) {
    console.log('copyTestCaseToClipboard called with ID:', testCaseId);
    
    if (!currentGeneratedTestCases) {
        showToast(RESULT.ERROR, 'No test cases available to copy');
        return;
    }

    try {
        // Find the specific test case
        let testCase = null;
        
        // Check in grouped data first
        if (window.currentGroupedTestCases) {
            for (const [category, cases] of Object.entries(window.currentGroupedTestCases)) {
                testCase = cases.find(tc => (tc.id || `TC${cases.indexOf(tc) + 1}`) === testCaseId);
                if (testCase) break;
            }
        }
        
        // Fallback to flat array
        if (!testCase) {
            testCase = currentGeneratedTestCases.find(tc => 
                (tc.id || `TC${currentGeneratedTestCases.indexOf(tc) + 1}`) === testCaseId
            );
        }

        if (!testCase) {
            showToast(RESULT.ERROR, `Test case ${testCaseId} not found`);
            return;
        }

        // Generate tester-friendly text for single test case
        const testCaseText = generateSingleTestCaseText(testCase, testCaseId);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(testCaseText);
        showToast(RESULT.SUCCESS, `${testCaseId} copied to clipboard!`);
        
    } catch (error) {
        console.error('Error copying test case:', error);
        showToast(RESULT.ERROR, 'Failed to copy test case to clipboard');
    }
}

/**
 * Generate tester-friendly text for a single test case
 */
function generateSingleTestCaseText(testCase, testCaseId) {
    let text = `${testCaseId} - ${testCase.title}\n`;
    text += '='.repeat(testCaseId.length + testCase.title.length + 3) + '\n\n';
    
    text += `Description: ${testCase.description}\n`;
    text += `Priority: ${testCase.priority || 'medium'} | Type: ${testCase.type || 'positive'}\n\n`;
    
    // Preconditions
    if (testCase.preconditions) {
        text += 'Preconditions:\n';
        if (Array.isArray(testCase.preconditions)) {
            testCase.preconditions.forEach(precondition => {
                text += `• ${precondition}\n`;
            });
        } else {
            text += `• ${testCase.preconditions}\n`;
        }
        text += '\n';
    }
    
    // Test steps
    text += 'Test Steps:\n';
    if (testCase.steps && Array.isArray(testCase.steps)) {
        testCase.steps.forEach(step => {
            text += `${step.stepNumber}. Action: ${step.action}\n`;
            if (step.expectedBehavior) {
                text += `   Expected: ${formatExpectedBehavior(step.expectedBehavior)}\n`;
            }
            if (step.testData) {
                text += `   Test Data: ${step.testData}\n`;
            }
        });
    }
    text += '\n';
    
    // Expected result
    text += `Expected Result: ${testCase.expectedResult}\n`;
    
    // Tags
    if (testCase.tags && Array.isArray(testCase.tags) && testCase.tags.length > 0) {
        text += `Tags: ${testCase.tags.join(', ')}\n`;
    }
    
    return text;
}

/**
 * Copy category test cases to clipboard in tester-friendly format
 */
async function copyCategoryToClipboard(category) {
    console.log('copyCategoryToClipboard called with category:', category);
    
    if (!currentGeneratedTestCases) {
        showToast(RESULT.ERROR, 'No test cases available to copy');
        return;
    }

    try {
        // Get test cases for this category
        let categoryTestCases = [];
        
        // Check if we have grouped data
        if (window.currentGroupedTestCases && window.currentGroupedTestCases[category]) {
            categoryTestCases = window.currentGroupedTestCases[category];
        } else {
            // Fallback: filter from all test cases
            categoryTestCases = currentGeneratedTestCases.filter(tc => tc.category === category);
        }

        if (categoryTestCases.length === 0) {
            showToast(RESULT.ERROR, `No test cases found for ${category} category`);
            return;
        }

        // Generate tester-friendly text
        const categoryText = generateTesterFriendlyText(category, categoryTestCases);
        
        // Copy to clipboard
        await navigator.clipboard.writeText(categoryText);
        showToast(RESULT.SUCCESS, `${category.replace('_', ' ').toUpperCase()} tests copied to clipboard!`);
        
    } catch (error) {
        console.error('Error copying category:', error);
        showToast(RESULT.ERROR, 'Failed to copy category to clipboard');
    }
}

/**
 * Generate tester-friendly text format for a category
 */
function generateTesterFriendlyText(category, testCases) {
    const categoryTitle = category.replace('_', ' ').toUpperCase();
    let text = `${categoryTitle} TESTS (${testCases.length})\n`;
    text += '='.repeat(categoryTitle.length + 15) + '\n\n';

    testCases.forEach((testCase, index) => {
        text += `${testCase.id || `TC${index + 1}`} - ${testCase.title}\n`;
        text += `-${''.repeat(testCase.title.length + 10)}\n`;
        text += `Description: ${testCase.description}\n`;
        text += `Priority: ${testCase.priority || 'medium'} | Type: ${testCase.type || 'positive'}\n\n`;
        
        // Preconditions
        if (testCase.preconditions) {
            text += 'Preconditions:\n';
            if (Array.isArray(testCase.preconditions)) {
                testCase.preconditions.forEach(precondition => {
                    text += `• ${precondition}\n`;
                });
            } else {
                text += `• ${testCase.preconditions}\n`;
            }
            text += '\n';
        }
        
        // Test steps
        text += 'Test Steps:\n';
        if (testCase.steps && Array.isArray(testCase.steps)) {
            testCase.steps.forEach(step => {
                text += `${step.stepNumber}. Action: ${step.action}\n`;
                if (step.expectedBehavior) {
                    text += `   Expected: ${formatExpectedBehavior(step.expectedBehavior)}\n`;
                }
                if (step.testData) {
                    text += `   Test Data: ${step.testData}\n`;
                }
            });
        }
        text += '\n';
        
        // Expected result
        text += `Expected Result: ${testCase.expectedResult}\n`;
        
        // Tags
        if (testCase.tags && Array.isArray(testCase.tags) && testCase.tags.length > 0) {
            text += `Tags: ${testCase.tags.join(', ')}\n`;
        }
        
        text += '\n' + '-'.repeat(50) + '\n\n';
    });

    return text;
}

/**
 * Handle checkbox done functionality
 */
function setupTestCaseCheckboxes() {
    // Use event delegation for dynamically created checkboxes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('test-done-checkbox')) {
            const testCaseContainer = e.target.closest('.simple-test-case');
            if (testCaseContainer) {
                if (e.target.checked) {
                    testCaseContainer.classList.add('completed');
                } else {
                    testCaseContainer.classList.remove('completed');
                }
            }
        }
    });
}

/**
 * ===============================
 * SRS TO MARKDOWN FUNCTIONALITY
 * ===============================
 */

/**
 * Update character counter and styling based on content length
 */
function updateCharacterCounter() {
    const srsDescription = document.getElementById('srs-description');
    const charCount = document.getElementById('char-count');
    const charCountElement = charCount?.parentElement;
    
    if (!srsDescription || !charCount) return;
    
    const currentLength = srsDescription.value.length;
    const maxLength = 50000;
    
    charCount.textContent = currentLength.toLocaleString();
    
    // Update styling based on length
    if (charCountElement) {
        charCountElement.classList.remove('near-limit', 'at-limit');
        
        if (currentLength >= maxLength * 0.9) {
            charCountElement.classList.add('at-limit');
        } else if (currentLength >= maxLength * 0.8) {
            charCountElement.classList.add('near-limit');
        }
    }
    
    // Update convert button state
    const convertBtn = document.getElementById('convert-to-markdown-btn');
    if (convertBtn) {
        convertBtn.disabled = currentLength === 0 || currentLength > maxLength;
    }
}

/**
 * Handle paste event - show convert button hint
 */
function handlePasteEvent(event) {
    // Small delay to allow paste content to be processed
    setTimeout(() => {
        updateCharacterCounter();
        
        const convertBtn = document.getElementById('convert-to-markdown-btn');
        if (convertBtn && !convertBtn.disabled) {
            // Add a subtle pulse animation to draw attention
            convertBtn.style.animation = 'pulse 2s ease-in-out 3';
            setTimeout(() => {
                convertBtn.style.animation = '';
            }, 6000);
        }
    }, 100);
}

/**
 * Handle SRS to Markdown conversion
 */
async function handleSRSToMarkdownConversion() {
    const srsDescription = document.getElementById('srs-description');
    const convertBtn = document.getElementById('convert-to-markdown-btn');
    
    if (!srsDescription || !convertBtn) return;
    
    const srsText = srsDescription.value.trim();
    
    if (!srsText) {
        showToast(RESULT.ERROR, 'Please enter some text to convert');
        return;
    }
    
    if (srsText.length > 50000) {
        showToast(RESULT.ERROR, 'Text is too long. Maximum 50,000 characters allowed.');
        return;
    }
    
    try {
        // Show loading state
        showSRSConversionLoading(true);
        
        // Prepare API request
        const requestBody = {
            srsText: srsText,
            model: srsToMarkdownSettings.model,
            outputFormat: srsToMarkdownSettings.outputFormat,
            preserveFormatting: srsToMarkdownSettings.preserveFormatting
        };
        
        // Make API call
        const response = await fetch(BE_API_LOCAL + ENDPOINTS.SRS_TO_MARKDOWN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to convert text to markdown');
        }
        
        // Update textarea with formatted content
        srsDescription.value = result.data.markdownContent;
        updateCharacterCounter();
        
        // Show success message
        const stats = `Converted ${result.data.originalLength} → ${result.data.processedLength} characters`;
        showToast(RESULT.SUCCESS, `✨ Text converted to markdown! ${stats}`);

        // Persist converted markdown locally to avoid re-calling API next time
        try {
            if (typeof storageWrapper !== 'undefined') {
                await storageWrapper.set({
                    [STORAGE.SRS_TO_MARKDOWN_CACHE]: {
                        markdownContent: result.data.markdownContent,
                        originalLength: result.data.originalLength,
                        processedLength: result.data.processedLength,
                        model: result.data.model,
                        generatedAt: result.data.generatedAt || new Date().toISOString()
                    }
                });
            } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({
                    [STORAGE.SRS_TO_MARKDOWN_CACHE]: {
                        markdownContent: result.data.markdownContent,
                        originalLength: result.data.originalLength,
                        processedLength: result.data.processedLength,
                        model: result.data.model,
                        generatedAt: result.data.generatedAt || new Date().toISOString()
                    }
                });
            }
        } catch (persistError) {
            console.warn('Failed to cache SRS markdown:', persistError);
        }
        
        // Log conversion details
        console.log('SRS to Markdown conversion completed:', {
            originalLength: result.data.originalLength,
            processedLength: result.data.processedLength,
            model: result.data.model,
            processingTime: result.processingTime
        });
        
    } catch (error) {
        console.error('SRS to Markdown conversion error:', error);
        showToast(RESULT.ERROR, `Conversion failed: ${error.message}`);
    } finally {
        showSRSConversionLoading(false);
    }
}

/**
 * Show/hide loading state for SRS conversion
 */
function showSRSConversionLoading(isLoading) {
    const convertBtn = document.getElementById('convert-to-markdown-btn');
    const icon = convertBtn?.querySelector('i');
    
    if (!convertBtn) return;
    
    if (isLoading) {
        convertBtn.disabled = true;
        convertBtn.classList.add('loading');
        if (icon) {
            icon.className = 'bi bi-arrow-clockwise';
        }
        convertBtn.innerHTML = convertBtn.innerHTML.replace('Convert to Markdown', 'Converting...');
    } else {
        convertBtn.disabled = false;
        convertBtn.classList.remove('loading');
        if (icon) {
            icon.className = 'bi bi-markdown';
        }
        convertBtn.innerHTML = '<i class="bi bi-markdown"></i> Convert to Markdown';
    }
}

// (Removed copy helpers per requirements)

/**
 * Load SRS to Markdown settings from storage
 */
async function loadSRSToMarkdownSettings() {
    try {
        let data;
        if (typeof storageWrapper !== 'undefined') {
            data = await storageWrapper.get([
                STORAGE.SRS_TO_MARKDOWN_MODEL,
                STORAGE.SRS_TO_MARKDOWN_OUTPUT_FORMAT,
                STORAGE.SRS_TO_MARKDOWN_PRESERVE_FORMATTING
            ]);
        } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            data = await chrome.storage.local.get([
                STORAGE.SRS_TO_MARKDOWN_MODEL,
                STORAGE.SRS_TO_MARKDOWN_OUTPUT_FORMAT,
                STORAGE.SRS_TO_MARKDOWN_PRESERVE_FORMATTING
            ]);
        } else {
            data = {};
        }
        
        // Apply loaded settings or defaults
        srsToMarkdownSettings.model = data[STORAGE.SRS_TO_MARKDOWN_MODEL] || DEFAULT_SETTINGS.SRS_TO_MARKDOWN.model;
        srsToMarkdownSettings.outputFormat = data[STORAGE.SRS_TO_MARKDOWN_OUTPUT_FORMAT] || DEFAULT_SETTINGS.SRS_TO_MARKDOWN.outputFormat;
        srsToMarkdownSettings.preserveFormatting = data[STORAGE.SRS_TO_MARKDOWN_PRESERVE_FORMATTING] || DEFAULT_SETTINGS.SRS_TO_MARKDOWN.preserveFormatting;
        
    } catch (error) {
        console.warn('Failed to load SRS to Markdown settings:', error);
        // Use defaults on error
        srsToMarkdownSettings = { ...DEFAULT_SETTINGS.SRS_TO_MARKDOWN };
    }
}

// Make functions available globally for onclick handlers
window.copyTestCaseToClipboard = copyTestCaseToClipboard;
window.copyCategoryToClipboard = copyCategoryToClipboard;
// (Removed global exports for copy helpers)

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTestCaseGeneration();
    setupTestCaseCheckboxes();
});
