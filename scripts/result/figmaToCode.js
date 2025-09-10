/**
 * Figma to Code functionality
 * Handles code generation from Figma components
 */

// Global variables to store current state
let figmaToCodeSettings = {
    framework: DEFAULT_SETTINGS.FIGMA_TO_CODE.framework,
    cssFramework: DEFAULT_SETTINGS.FIGMA_TO_CODE.cssFramework,
    model: DEFAULT_SETTINGS.FIGMA_TO_CODE.model,
    includeResponsive: DEFAULT_SETTINGS.FIGMA_TO_CODE.includeResponsive,
    includeInteractions: DEFAULT_SETTINGS.FIGMA_TO_CODE.includeInteractions
};

let currentGeneratedFiles = [];
let currentComponentName = '';

/**
 * Initialize figma-to-code functionality
 */
function initializeFigmaToCode() {
    loadFigmaToCodeSettings();
    setupEventListeners();
}

/**
 * Load settings from storage
 */
async function loadFigmaToCodeSettings() {
    try {
        // Ensure storageWrapper is available
        if (typeof storageWrapper === 'undefined') {
            console.warn('StorageWrapper not available, using default settings');
            updateSettingsUI();
            return;
        }
        
        const data = await storageWrapper.get([
            STORAGE.FIGMA_TO_CODE_FRAMEWORK,
            STORAGE.FIGMA_TO_CODE_CSS_FRAMEWORK,
            STORAGE.FIGMA_TO_CODE_MODEL,
            STORAGE.FIGMA_TO_CODE_RESPONSIVE,
            STORAGE.FIGMA_TO_CODE_INTERACTIONS
        ]);

        figmaToCodeSettings = {
            framework: data[STORAGE.FIGMA_TO_CODE_FRAMEWORK] || DEFAULT_SETTINGS.FIGMA_TO_CODE.framework,
            cssFramework: data[STORAGE.FIGMA_TO_CODE_CSS_FRAMEWORK] || DEFAULT_SETTINGS.FIGMA_TO_CODE.cssFramework,
            model: data[STORAGE.FIGMA_TO_CODE_MODEL] || DEFAULT_SETTINGS.FIGMA_TO_CODE.model,
            includeResponsive: data[STORAGE.FIGMA_TO_CODE_RESPONSIVE] !== false,
            includeInteractions: data[STORAGE.FIGMA_TO_CODE_INTERACTIONS] || DEFAULT_SETTINGS.FIGMA_TO_CODE.includeInteractions
        };

        updateSettingsUI();
    } catch (error) {
        console.error('Error loading figma-to-code settings:', error);
    }
}

/**
 * Save settings to storage
 */
async function saveFigmaToCodeSettings() {
    try {
        // Ensure storageWrapper is available
        if (typeof storageWrapper === 'undefined') {
            console.warn('StorageWrapper not available, cannot save settings');
            showToast(RESULT.ERROR, 'Storage not available');
            return;
        }
        
        await storageWrapper.set({
            [STORAGE.FIGMA_TO_CODE_FRAMEWORK]: figmaToCodeSettings.framework,
            [STORAGE.FIGMA_TO_CODE_CSS_FRAMEWORK]: figmaToCodeSettings.cssFramework,
            [STORAGE.FIGMA_TO_CODE_MODEL]: figmaToCodeSettings.model,
            [STORAGE.FIGMA_TO_CODE_RESPONSIVE]: figmaToCodeSettings.includeResponsive,
            [STORAGE.FIGMA_TO_CODE_INTERACTIONS]: figmaToCodeSettings.includeInteractions
        });
        
        showToast(RESULT.SUCCESS, 'Settings saved successfully!');
    } catch (error) {
        console.error('Error saving figma-to-code settings:', error);
        showToast(RESULT.ERROR, 'Failed to save settings');
    }
}

/**
 * Update settings UI with current values
 */
function updateSettingsUI() {
    const frameworkSelect = document.getElementById('framework-select');
    const cssFrameworkSelect = document.getElementById('css-framework-select');
    const modelSelect = document.getElementById('model-select');
    const responsiveCheck = document.getElementById('responsive-check');
    const interactionsCheck = document.getElementById('interactions-check');

    if (frameworkSelect) frameworkSelect.value = figmaToCodeSettings.framework;
    if (cssFrameworkSelect) cssFrameworkSelect.value = figmaToCodeSettings.cssFramework;
    if (modelSelect) modelSelect.value = figmaToCodeSettings.model;
    if (responsiveCheck) responsiveCheck.checked = figmaToCodeSettings.includeResponsive;
    if (interactionsCheck) interactionsCheck.checked = figmaToCodeSettings.includeInteractions;
}

/**
 * Setup event listeners for figma-to-code functionality
 */
function setupEventListeners() {
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }

    // Settings modal controls
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = document.getElementById('settings-close');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');

    if (settingsClose) {
        settingsClose.addEventListener('click', closeSettingsModal);
    }
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettingsAndClose);
    }
    
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    }

    // Code modal controls
    const codeModal = document.getElementById('code-modal');
    const codeClose = document.getElementById('code-close');
    const closeCodeBtn = document.getElementById('close-code-btn');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    const downloadCodeBtn = document.getElementById('download-code-btn');

    if (codeClose) {
        codeClose.addEventListener('click', closeCodeModal);
    }
    
    if (closeCodeBtn) {
        closeCodeBtn.addEventListener('click', closeCodeModal);
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyCurrentCode);
    }
    
    if (downloadCodeBtn) {
        downloadCodeBtn.addEventListener('click', downloadGeneratedCode);
    }

    // Context menu
    const generateCodeItem = document.getElementById('generate-code-item');
    if (generateCodeItem) {
        generateCodeItem.addEventListener('click', handleGenerateCode);
    }

    // NOTE: Backdrop click to close functionality removed to prevent accidental modal closure
    // Users must use explicit close buttons (X button, Cancel, etc.)

    // Hide context menu when clicking elsewhere
    document.addEventListener('click', hideContextMenu);
    document.addEventListener('contextmenu', hideContextMenu);

    // Min size settings (icon fetch sizing) - auto save on input
    // Size preset - auto save on change
    const sizeSelect = document.getElementById('size-select');
    if (sizeSelect) {
        const sizeToDims = (value) => {
            const preset = Object.values(SIZE_PRESETS).find(p => p.id === value);
            return preset ? { w: preset.width, h: preset.height } : { w: DEFAULT_SETTINGS.SIZE.width, h: DEFAULT_SETTINGS.SIZE.height };
        };
        const persistPreset = async () => {
            if (typeof storageWrapper === 'undefined') {
                console.warn('StorageWrapper not available, cannot persist preset');
                return;
            }
            
            const preset = sizeSelect.value;
            const dims = sizeToDims(preset);
            await storageWrapper.set({
                [STORAGE.FIGMA_SIZE_PRESET]: preset,
                [STORAGE.FIGMA_MIN_WIDTH]: dims.w,
                [STORAGE.FIGMA_MIN_HEIGHT]: dims.h,
            });
        };
        sizeSelect.addEventListener('change', persistPreset);
        sizeSelect.addEventListener('input', persistPreset);
    }
}

/**
 * Open settings modal
 */
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        updateSettingsUI();
        modal.style.display = 'flex';
    }
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Save settings and close modal
 */
function saveSettingsAndClose() {
    // Get values from UI
    const frameworkSelect = document.getElementById('framework-select');
    const cssFrameworkSelect = document.getElementById('css-framework-select');
    const modelSelect = document.getElementById('model-select');
    const responsiveCheck = document.getElementById('responsive-check');
    const interactionsCheck = document.getElementById('interactions-check');

    if (frameworkSelect) figmaToCodeSettings.framework = frameworkSelect.value;
    if (cssFrameworkSelect) figmaToCodeSettings.cssFramework = cssFrameworkSelect.value;
    if (modelSelect) figmaToCodeSettings.model = modelSelect.value;
    if (responsiveCheck) figmaToCodeSettings.includeResponsive = responsiveCheck.checked;
    if (interactionsCheck) figmaToCodeSettings.includeInteractions = interactionsCheck.checked;

    saveFigmaToCodeSettings();
    closeSettingsModal();
}

/**
 * Open code modal
 */
function openCodeModal() {
    const modal = document.getElementById('code-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close code modal
 */
function closeCodeModal() {
    const modal = document.getElementById('code-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset modal state
    resetCodeModal();
}

/**
 * Reset code modal to initial state
 */
function resetCodeModal() {
    const codeLoading = document.getElementById('code-loading');
    const codeContent = document.getElementById('code-content');
    const downloadBtn = document.getElementById('download-code-btn');

    if (codeLoading) codeLoading.style.display = 'none';
    if (codeContent) codeContent.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';

    currentGeneratedFiles = [];
    currentComponentName = '';
}

/**
 * Show context menu for component
 */
function showContextMenu(event, componentData) {
    event.preventDefault();
    event.stopPropagation();

    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    // Store component data for later use
    contextMenu.componentData = componentData;

    // Show to measure size, but keep invisible
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.display = 'block';

    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;

    // Use viewport coordinates for fixed positioning
    const clickX = event.clientX;
    const clickY = event.clientY;

    // Clamp position to keep menu within viewport
    const maxX = window.innerWidth - menuWidth - 4;
    const maxY = window.innerHeight - menuHeight - 4;
    const posX = Math.max(4, Math.min(clickX, Math.max(4, maxX)));
    const posY = Math.max(4, Math.min(clickY, Math.max(4, maxY)));

    contextMenu.style.left = posX + 'px';
    contextMenu.style.top = posY + 'px';
    contextMenu.style.visibility = 'visible';
}

/**
 * Hide context menu
 */
function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

/**
 * Handle generate code action
 */
async function handleGenerateCode() {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu || !contextMenu.componentData) return;

    const componentData = contextMenu.componentData;
    hideContextMenu();

    try {
        // Open code modal and show loading
        openCodeModal();
        showCodeLoading();

        // Generate code
        await generateCodeFromComponent(componentData);

    } catch (error) {
        console.error('Error generating code:', error);
        showToast(RESULT.ERROR, 'Failed to generate code: ' + error.message);
        closeCodeModal();
    }
}

/**
 * Show loading state in code modal
 */
function showCodeLoading() {
    const codeLoading = document.getElementById('code-loading');
    const codeContent = document.getElementById('code-content');

    if (codeLoading) codeLoading.style.display = 'flex';
    if (codeContent) codeContent.style.display = 'none';
}

/**
 * Generate code from component data
 */
async function generateCodeFromComponent(componentData) {
    const figmaResponse = componentData.figmaResponse;
    if (!figmaResponse) {
        throw new Error('No Figma response data available for this component');
    }

    const payload = {
        figmaResponse: figmaResponse,
        framework: figmaToCodeSettings.framework,
        cssFramework: figmaToCodeSettings.cssFramework,
        model: figmaToCodeSettings.model,
        includeResponsive: figmaToCodeSettings.includeResponsive,
        includeInteractions: figmaToCodeSettings.includeInteractions
    };

    const response = await fetch(BE_API_LOCAL + ENDPOINTS.FIGMA_TO_CODE_CONVERT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || 'Code generation failed');
    }

    // Store generated files
    currentGeneratedFiles = result.data.files || [];
    currentComponentName = result.data.componentName || 'Component';

    // Display generated code
    displayGeneratedCode(result.data);
    showToast(RESULT.SUCCESS, `Code generated successfully! Cost: $${result.openaiUsage?.cost || 'N/A'}`);
}

/**
 * Display generated code in modal
 */
function displayGeneratedCode(data) {
    const codeLoading = document.getElementById('code-loading');
    const codeContent = document.getElementById('code-content');
    const downloadBtn = document.getElementById('download-code-btn');
    const modalTitle = document.getElementById('code-modal-title');

    // Hide loading, show content
    if (codeLoading) codeLoading.style.display = 'none';
    if (codeContent) codeContent.style.display = 'flex';
    if (downloadBtn) downloadBtn.style.display = 'inline-block';

    // Update modal title
    if (modalTitle) {
        modalTitle.textContent = `Generated Code - ${data.componentName}`;
    }

    // Create file tabs
    createFileTabs(data.files);

    // Show first file by default
    if (data.files.length > 0) {
        showFile(data.files[0], 0);
    }
}

/**
 * Create file tabs
 */
function createFileTabs(files) {
    const fileTabs = document.getElementById('file-tabs');
    if (!fileTabs) return;

    fileTabs.innerHTML = '';

    files.forEach((file, index) => {
        const tab = document.createElement('button');
        tab.className = 'file-tab';
        tab.textContent = file.filename;
        tab.addEventListener('click', () => showFile(file, index));
        
        if (index === 0) {
            tab.classList.add('active');
        }
        
        fileTabs.appendChild(tab);
    });
}

/**
 * Show specific file content
 */
function showFile(file, index) {
    const currentFilename = document.getElementById('current-filename');
    const codeDisplay = document.getElementById('code-display');
    const codeElement = codeDisplay.querySelector('code');

    // Update filename
    if (currentFilename) {
        currentFilename.textContent = file.filename;
    }

    // Update code content with highlight.js
    if (codeElement) {
        // Clear previous content and classes
        codeElement.textContent = '';
        codeElement.className = '';

        // Determine language from file type or extension
        const language = getHljsLanguageFromFile(file);
        if (language && hljs.getLanguage && hljs.getLanguage(language)) {
            codeElement.className = `language-${language}`;
        } else {
            codeElement.className = '';
        }

        // Set code text
        codeElement.textContent = file.content;

        // Apply syntax highlighting with highlight.js if available
        if (typeof hljs !== 'undefined' && codeElement) {
            try {
                hljs.highlightElement(codeElement);
            } catch (error) {
                console.warn('Highlight.js failed:', error);
            }
        }
    }

    // Update active tab
    const tabs = document.querySelectorAll('.file-tab');
    tabs.forEach((tab, i) => {
        if (i === index) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Store current file index for copy functionality
    codeDisplay.currentFileIndex = index;
}

/**
 * Determine highlight.js language from file
 */
function getHljsLanguageFromFile(file) {
    const typeMap = {
        html: 'xml',
        css: 'css',
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        cs: 'csharp',
        md: 'markdown',
        vue: 'xml',
        xml: 'xml',
        json: 'json',
        txt: ''
    };

    if (file.type && typeMap[file.type] !== undefined) {
        return typeMap[file.type];
    }
    if (file.filename) {
        const ext = file.filename.split('.').pop().toLowerCase();
        return typeMap[ext] !== undefined ? typeMap[ext] : '';
    }
    return '';
}

/**
 * Copy current code to clipboard
 */
async function copyCurrentCode() {
    const codeDisplay = document.getElementById('code-display');
    const codeElement = codeDisplay.querySelector('code');

    if (!codeElement || !currentGeneratedFiles.length) {
        showToast(RESULT.ERROR, 'No code to copy');
        return;
    }

    try {
        const content = codeElement.textContent;
        await navigator.clipboard.writeText(content);
        showToast(RESULT.SUCCESS, 'Code copied to clipboard!');
    } catch (error) {
        console.error('Error copying code:', error);
        showToast(RESULT.ERROR, 'Failed to copy code');
    }
}

/**
 * Download generated code as ZIP
 */
async function downloadGeneratedCode() {
    if (!currentGeneratedFiles.length || !currentComponentName) {
        showToast(RESULT.ERROR, 'No generated code to download');
        return;
    }

    try {
        const payload = {
            files: currentGeneratedFiles,
            componentName: currentComponentName
        };

        const response = await fetch(BE_API_LOCAL + ENDPOINTS.FIGMA_TO_CODE_CREATE_PACKAGE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to create download package');
        }

        // Trigger download
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = `${currentComponentName}.zip`;
        link.click();

        showToast(RESULT.SUCCESS, 'Download started!');

    } catch (error) {
        console.error('Error downloading code:', error);
        showToast(RESULT.ERROR, 'Failed to download code: ' + error.message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeFigmaToCode();
    // Load stored size preset into dropdown and sync dims
    setTimeout(async () => {
        if (typeof storageWrapper === 'undefined') {
            console.warn('StorageWrapper not available, using default settings');
            const sizeSelect = document.getElementById('size-select');
            if (sizeSelect) {
                sizeSelect.value = DEFAULT_SETTINGS.SIZE.preset;
            }
            return;
        }
        
        const data = await storageWrapper.get([
            STORAGE.FIGMA_SIZE_PRESET,
            STORAGE.FIGMA_MIN_WIDTH,
            STORAGE.FIGMA_MIN_HEIGHT,
        ]);
        const sizeSelect = document.getElementById('size-select');
        if (sizeSelect) {
            const preset = data[STORAGE.FIGMA_SIZE_PRESET] || DEFAULT_SETTINGS.SIZE.preset;
            sizeSelect.value = preset;
        }
        if (!data[STORAGE.FIGMA_MIN_WIDTH] || !data[STORAGE.FIGMA_MIN_HEIGHT]) {
            // initialize based on preset
            const preset = (document.getElementById('size-select') || {}).value || DEFAULT_SETTINGS.SIZE.preset;
            const presetConfig = Object.values(SIZE_PRESETS).find(p => p.id === preset);
            const dims = presetConfig ? {w: presetConfig.width, h: presetConfig.height} : {w: DEFAULT_SETTINGS.SIZE.width, h: DEFAULT_SETTINGS.SIZE.height};
            if (typeof storageWrapper !== 'undefined') {
                await storageWrapper.set({
                    [STORAGE.FIGMA_MIN_WIDTH]: dims.w,
                    [STORAGE.FIGMA_MIN_HEIGHT]: dims.h,
                });
            }
        }
    }, 0);
});
