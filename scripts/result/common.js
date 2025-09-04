// Injects toast element
const toast = document.createElement('div');
toast.id = 'toast';
toast.className = 'toast';
document.body.appendChild(toast);

function showToast(result, message) {
    toast.textContent = message;
    toast.classList.add(result);
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function buildRequest(payload, method = 'POST') {
    return {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    };
}

function isCompleteJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function cleanGeneratedCode(data, language) {
    if (data.startsWith(`\`\`\`${language}`)) {
        data = data.substring(13);
    }

    data = data.replace(language, '');

    data = data.replace('```', '');

    let backtickIndex = data.lastIndexOf('```');
    if (backtickIndex !== -1) {
        data = data.substring(0, backtickIndex);
    }

    return data;
}

function convertMarkdownLinksToHtml(text) {
    return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

async function readStream(response, feature, language = '') {
    const reader = await response.body.getReader();

    const container = document.getElementById('generatedTests');
    let codeBlock;
    if (container) {
        codeBlock = container.querySelector('code');
    }
    const testIdeasTestsContainer = document.getElementById('testIdeas');
    const accessibilityCheckContainer = document.getElementById('accessibility-check');
    const inputBox = '<input type="checkbox" name="idea">';

    const readStream = async () => {
        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (feature == FEATURE.GENERATE_TEST_IDEAS) {
                        let htmlContent = testIdeasTestsContainer.innerHTML;
                        for (let line of htmlContent.split('\n')) {
                            if (line.includes(inputBox)) {
                                htmlContent = htmlContent
                                    .replace('<br />', '')
                                    .replace(
                                        line,
                                        `<label class="test-idea"> <span class="test-idea-text">${line}</span> <button class="edit-btn"><span class="material-icons"></span></button> </label><br />`,
                                    );
                            }
                        }
                        testIdeasTestsContainer.innerHTML = htmlContent;
                        finishIdeas();
                    }
                    await chrome.runtime.sendMessage({ source: 'stream', status: 'finished' });
                    showToast(RESULT.SUCCESS, MESSAGES.SUCCESS);
                    break;
                }
                // Process the received chunk of data
                let string = new TextDecoder('utf-8').decode(value);
                let lines = string.split('\n');

                for (let line of lines) {
                    if (line.includes('[DONE]')) {
                        await chrome.runtime.sendMessage({ source: 'stream', status: 'finished' });
                    } else {
                        if (line.startsWith('data')) {
                            const possibleJSON = line.slice(6);
                            if (isCompleteJSON(possibleJSON)) {
                                const json = JSON.parse(possibleJSON);
                                if (json.choices[0].finish_reason != null) {
                                    await chrome.runtime.sendMessage({
                                        source: 'stream',
                                        status: 'finished',
                                    });
                                } else {
                                    if (json.choices[0].delta.content != null) {
                                        let content = json.choices[0].delta.content;
                                        switch (feature) {
                                            case FEATURE.GENERATE_TEST_IDEAS:
                                                content = content.replace(/\n/g, '<br />\n');
                                                content = content.replace('-', '');
                                                if (
                                                    !content.includes('Tests:') &&
                                                    !content.includes('Scenarios:') &&
                                                    !content.includes('<br />\n<br />\n')
                                                ) {
                                                    content = content.replace('<br />\n', `<br />\n${inputBox} `);
                                                }
                                                testIdeasTestsContainer.innerHTML += content;
                                                break;
                                            case FEATURE.CHECK_ACCESSIBILITY:
                                                content = content.replace(/\n/g, '<br />\n');
                                                accessibilityCheckContainer.innerHTML += content;
                                                let htmlContent = accessibilityCheckContainer.innerHTML;
                                                let newContent = convertMarkdownLinksToHtml(htmlContent);
                                                newContent = newContent.replace('- Issues', '<h3>Issues</h3>');
                                                newContent = newContent.replace(
                                                    '- Conformance Level A -',
                                                    '<h4>Conformance Level A</h4>',
                                                );
                                                newContent = newContent.replace(
                                                    '- Conformance Level AA -',
                                                    '<h4>Conformance Level AA</h4>',
                                                );
                                                newContent = newContent.replace(
                                                    '- Conformance Level AAA -',
                                                    '<h4>Conformance Level AAA</h4>',
                                                );
                                                newContent = newContent.replace(
                                                    '- Accessibility Tests',
                                                    '<br />\n<h3>Suggested Tests</h3>',
                                                );
                                                newContent = newContent.replace(
                                                    '- Suggested Tests',
                                                    '<br />\n<h3>Suggested Tests</h3>',
                                                );
                                                accessibilityCheckContainer.innerHTML = newContent;
                                                break;
                                            default:
                                                let data = cleanGeneratedCode(content, language);
                                                codeBlock.className = `language-${language}`;
                                                codeBlock.innerHTML += data;
                                                codeBlock.removeAttribute('data-highlighted');
                                                hljs.highlightAll();
                                                break;
                                        }
                                    }
                                }
                            } else {
                                console.log(`Skipping incomplete json: ${possibleJSON}`);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            await chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
            showToast(RESULT.ERROR, MESSAGES.FAILED);
        }
    };

    readStream();
}

/**
 * Creates the stream and displays the data
 * @param {string} feature - Automated tests or Test Ideas
 */
async function showResult(feature) {
    let data = await chrome.storage.local.get([
        STORAGE.OPENAI_API_KEY,
        STORAGE.OPENAI_MODEL,
        STORAGE.CUSTOM_SERVER_URL,
    ]);
    const openAiApiKey = data[STORAGE.OPENAI_API_KEY];
    const model = data[STORAGE.OPENAI_MODEL];
    const customServerUrl = data[STORAGE.CUSTOM_SERVER_URL];

    let payload;
    let language = '';
    let URL = !!customServerUrl ? customServerUrl : OPENAI_PROXY_BASE_URL;

    switch (feature) {
        case FEATURE.GENERATE_TEST_IDEAS:
            URL += ENDPOINTS.GENERATE_TEST_IDEAS;
            payload = {
                sourceCode: (await chrome.storage.local.get([STORAGE.ELEMENT_SOURCE]))[STORAGE.ELEMENT_SOURCE],
            };
            break;
        case FEATURE.CHECK_ACCESSIBILITY:
            URL += ENDPOINTS.CHECK_ACCESSIBILITY;
            payload = {
                sourceCode: (await chrome.storage.local.get([STORAGE.ELEMENT_SOURCE]))[STORAGE.ELEMENT_SOURCE],
            };
            break;
        case FEATURE.AUTOMATE_TESTS:
            URL += ENDPOINTS.AUTOMATE_TESTS;
            data = await chrome.storage.local.get([
                STORAGE.ELEMENT_SOURCE,
                STORAGE.FRAMEWORK_SELECTED,
                STORAGE.LANGUAGE_SELECTED,
                STORAGE.SITE_URL,
                STORAGE.POM,
            ]);
            payload = {
                sourceCode: data[STORAGE.ELEMENT_SOURCE],
                baseUrl: data[STORAGE.SITE_URL],
                framework: data[STORAGE.FRAMEWORK_SELECTED],
                language: data[STORAGE.LANGUAGE_SELECTED],
                pom: data[STORAGE.POM],
            };
            language = payload.language;
            break;
        case FEATURE.AUTOMATE_IDEAS:
            URL += ENDPOINTS.AUTOMATE_IDEAS;
            data = await chrome.storage.local.get([
                STORAGE.ELEMENT_SOURCE,
                STORAGE.FRAMEWORK_SELECTED,
                STORAGE.LANGUAGE_SELECTED,
                STORAGE.SITE_URL,
                STORAGE.POM,
                STORAGE.IDEAS,
            ]);
            payload = {
                sourceCode: data[STORAGE.ELEMENT_SOURCE],
                baseUrl: data[STORAGE.SITE_URL],
                framework: data[STORAGE.FRAMEWORK_SELECTED],
                language: data[STORAGE.LANGUAGE_SELECTED],
                pom: data[STORAGE.POM],
                ideas: data[STORAGE.IDEAS],
            };
            language = payload.language;
            break;
    }

    if (!!openAiApiKey) {
        payload['openAiApiKey'] = openAiApiKey;
    }

    console.log('Model in use:', model);
    if (!!model) {
        payload['model'] = model;
    }

    const options = await buildRequest(payload);

    console.log('Sending request to:', URL);

    fetch(URL, options)
        .then((response) => {
            if (response.status === 401) {
                chrome.runtime.sendMessage({
                    source: 'stream',
                    status: 'error',
                    message: 'INVALID_API_KEY',
                });
                showToast(RESULT.ERROR, MESSAGES.INVALID_API_KEY);
            } else if (response.status === 413) {
                chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
                showToast(RESULT.ERROR, MESSAGES.TOO_LARGE);
            } else if (!response.ok) {
                chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
                showToast(RESULT.ERROR, MESSAGES.FAILED);
            } else {
                readStream(response, feature, language);
            }
        })
        .catch((e) => {
            chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
            showToast(RESULT.ERROR, MESSAGES.FAILED);
        });
}

/**
 * Reads JSON response from backend API and displays data
 * @param {Response} response - The response object from fetch
 * @param {string} feature - The feature type (icon-components, etc.)
 */
async function readStreamBE(response, feature) {
    try {
        const data = await response.json();
        
        switch (feature) {
            case FEATURE.GET_ICON_COMPONENTS:
                displayIconComponents(data);
                resetReloadButton();
                break;
            default:
                console.log('Unknown feature:', feature);
        }
        
        await chrome.runtime.sendMessage({ source: 'stream', status: 'finished' });
        showToast(RESULT.SUCCESS, MESSAGES.SUCCESS);
    } catch (error) {
        console.error('Error processing response:', error);
        await chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
        showToast(RESULT.ERROR, MESSAGES.FAILED);
        resetReloadButton();
    }
}

/**
 * Resets the reload button to its normal state
 */
function resetReloadButton() {
    const reloadBtn = document.getElementById('reload-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (reloadBtn) {
        reloadBtn.disabled = false;
        reloadBtn.classList.remove('loading');
        reloadBtn.style.display = 'inline-flex';
    }
    if (stopBtn) {
        stopBtn.style.display = 'none';
    }
}

/**
 * Creates a high-quality drag image with sharp rendering
 * @param {DragEvent} event - The drag event
 * @param {Object} item - The icon item data
 * @param {HTMLImageElement} originalImg - The original image element
 */
function createHighQualityDragImage(event, item, originalImg) {
    // Create container div gấp đôi kích thước để lừa browser
    const container = document.createElement('div');
    container.className = 'temp-drag-image';
    
    // TRICK: Container gấp đôi kích thước
    const containerWidth = item.width * 2;
    const containerHeight = item.height * 2;
    
    container.style.position = 'absolute';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = containerWidth + 'px';
    container.style.height = containerHeight + 'px';
    container.style.backgroundColor = 'transparent';
    
    // Create image element với kích thước thật
    const tempImg = document.createElement('img');
    tempImg.src = item.imageUrl;
    
    // Style image để hiển thị đúng kích thước thật nhưng ở center của container gấp đôi
    tempImg.style.position = 'absolute';
    tempImg.style.width = item.width + 'px';
    tempImg.style.height = item.height + 'px';
    tempImg.style.left = ((containerWidth - item.width) / 2) + 'px';
    tempImg.style.top = ((containerHeight - item.height) / 2) + 'px';
    
    
    // Pixel rendering sắc nét
    tempImg.style.imageRendering = 'crisp-edges';
    
    // Add image vào container
    container.appendChild(tempImg);
    
    // Add container to document
    document.body.appendChild(container);
    
    // Wait for image to load then set as drag image
    if (tempImg.complete) {
        // Image already loaded - dùng container gấp đôi nhưng anchor tại center
        event.dataTransfer.setDragImage(container, containerWidth / 2, containerHeight / 2);
    } else {
        // Wait for image to load
        tempImg.onload = function() {
            event.dataTransfer.setDragImage(container, containerWidth / 2, containerHeight / 2);
        };
        
        // Fallback if image fails to load
        tempImg.onerror = function() {
            // Use original image as fallback
            event.dataTransfer.setDragImage(originalImg, originalImg.offsetWidth / 2, originalImg.offsetHeight / 2);
            container.remove();
        };
    }
    
    // Cleanup after drag operation
    setTimeout(() => {
        if (container.parentNode) {
            container.remove();
        }
    }, 1000);
}



/**
 * Displays icon components in the icon component container
 * @param {Object} response - The response data containing icon components with format: { success: boolean, data: [{ componentId: "...", imageUrl: "..." }], message: "...", totalCount: number }
 */
function displayIconComponents(response) {
    const container = document.getElementById('main-content');
    if (!container) {
        console.error('Icon component container not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Check if response is successful
    if (!response.success) {
        container.innerHTML = `<p class="error-message">Error: ${response.message || 'Failed to load icon components'}</p>`;
        return;
    }

    // Get data array from API response
    const iconData = response.data || [];
    
    if (iconData.length === 0) {
        container.innerHTML = '<p class="no-icons">No icon components found.</p>';
        return;
    }

    // Create grid container for icons
    const gridContainer = document.createElement('div');
    gridContainer.className = 'icon-grid';
    
    iconData.forEach((item, index) => {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'icon-wrapper';
        
        const iconImg = document.createElement('img');
        iconImg.className = 'icon-component';
        iconImg.src = item.imageUrl;
        iconImg.alt = `Icon Component ${index + 1}`;
        iconImg.title = `Component ID: ${item.componentId}`;
        iconImg.draggable = true;
        
        // Add error handling for broken images
        iconImg.onerror = function() {
            this.src = '../images/Button.png'; // fallback image
            this.alt = 'Icon not available';
        };
        
        // Set actual size from API
        if (item.width && item.height) {
            iconImg.style.width = item.width + 'px';
            iconImg.style.height = item.height + 'px';
            iconImg.style.maxWidth = 'none';
            iconImg.style.maxHeight = 'none';
        }
        
        // Add drag event listeners
        iconImg.addEventListener('dragstart', function(e) {
            // Prevent default to ensure consistent behavior
            e.stopPropagation();
            
            // Store component data for potential drop handling
            e.dataTransfer.setData('text/plain', JSON.stringify({
                componentId: item.componentId,
                imageUrl: item.imageUrl,
                width: item.width,
                height: item.height
            }));
            
            // Set drag effect
            e.dataTransfer.effectAllowed = 'copy';
            
            // Create a high-quality drag image
            createHighQualityDragImage(e, item, iconImg);
        });
        
        // Add drag end listener to cleanup
        iconImg.addEventListener('dragend', function(e) {
            // Cleanup any temporary elements
            const tempElements = document.querySelectorAll('.temp-drag-image');
            tempElements.forEach(el => el.remove());
        });
        
        // Add context menu (right-click) listener for code generation
        iconImg.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Show context menu with component data
            const componentData = {
                componentId: item.componentId,
                imageUrl: item.imageUrl,
                width: item.width,
                height: item.height,
                figmaResponse: item.figmaResponse // This should contain the full figma response
            };
            
            // Check if figmaToCode functionality is available
            if (typeof showContextMenu === 'function') {
                showContextMenu(e, componentData);
            } else {
                console.warn('Figma to Code functionality not loaded');
            }
        });
        
        const iconLabel = document.createElement('span');
        iconLabel.className = 'icon-label';
        iconLabel.textContent = `Component ${index + 1}`;
        
        const iconId = document.createElement('span');
        iconId.className = 'icon-id';
        iconId.textContent = item.componentId;
        
        iconWrapper.appendChild(iconImg);
        iconWrapper.appendChild(iconLabel);
        iconWrapper.appendChild(iconId);
        gridContainer.appendChild(iconWrapper);
    });
    
    // Add summary information
    const summary = document.createElement('div');
    summary.className = 'icon-summary';
    summary.innerHTML = `<p>${response.message} (Total: ${response.totalCount})</p>`;
    
    container.appendChild(summary);
    container.appendChild(gridContainer);
}

/**
 * Creates the stream and displays the data from the BE
 */
async function showResultBE(feature) {

    let payload;
    let URL = BE_API_LOCAL;

    switch (feature) {
            case FEATURE.GET_ICON_COMPONENTS:
                URL += ENDPOINTS.GET_FIGMA_COMPONENTS;
                
                // Check if there's an extracted node-id from input
                const extractedNodeId = window.extractedNodeId;
                
                // Load min size config from storage (default 500x500)
                const sizeConfig = await chrome.storage.local.get([
                    STORAGE.FIGMA_MIN_WIDTH,
                    STORAGE.FIGMA_MIN_HEIGHT,
                ]);
                
                payload = {
                    figmaFileId: FIGMA_FILE_ID,
                    figmaAccessToken: FIGMA_ACCESS_TOKEN,
                    googleSheetId: GOOGLE_SHEET_ID,
                    minWidth: sizeConfig[STORAGE.FIGMA_MIN_WIDTH] || 500,
                    minHeight: sizeConfig[STORAGE.FIGMA_MIN_HEIGHT] || 500,
                };
                
                // If user provided a Figma URL with node-id, use it instead of Google Sheet
                if (extractedNodeId) {
                    payload.specificNodeId = [extractedNodeId];
                    console.log('Using extracted node-id from input:', [extractedNodeId]);
                } else {
                    console.log('Using Google Sheet for component IDs');
                }
                
                break;
    }

    const options = await buildRequest(payload);

    console.log('Sending request to:', URL, options);

    // Setup abort controller for STOP functionality
    if (typeof iconFetchController === 'undefined' || iconFetchController === null) {
        try { iconFetchController = new AbortController(); } catch (e) {}
    } else {
        try { iconFetchController.abort(); } catch (e) {}
        try { iconFetchController = new AbortController(); } catch (e) {}
    }
    if (options && iconFetchController && iconFetchController.signal) {
        options.signal = iconFetchController.signal;
    }

    fetch(URL, options)
        .then((response) => {
            if (!response.ok) {
                console.log('Response:', response);
                chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
                showToast(RESULT.ERROR, MESSAGES.FAILED);
                resetReloadButton();
            } else {
                console.log('Response:', response);
                readStreamBE(response, feature);
            }
        })
        .catch((e) => {
            if (e && e.name === 'AbortError') {
                console.log('Fetch aborted by user');
                showToast(RESULT.SUCCESS, 'Stopped');
            } else {
                chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
                showToast(RESULT.ERROR, MESSAGES.FAILED);
            }
            resetReloadButton();
        });
}

