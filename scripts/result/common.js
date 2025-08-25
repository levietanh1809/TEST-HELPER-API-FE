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
    if (reloadBtn) {
        reloadBtn.disabled = false;
        reloadBtn.classList.remove('loading');
    }
}

/**
 * Displays icon components in the icon component container
 * @param {Object} data - The response data containing icon components with format: { images: [{ url: "...", title: "..." }] }
 */
function displayIconComponents(data) {
    const container = document.getElementById('main-content');
    if (!container) {
        console.error('Icon component container not found');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Get images array from API response
    const images = data.images || [];
    
    if (images.length === 0) {
        container.innerHTML = '<p class="no-icons">No icon components found.</p>';
        return;
    }

    // Create grid container for icons
    const gridContainer = document.createElement('div');
    gridContainer.className = 'icon-grid';
    
    images.forEach((image, index) => {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'icon-wrapper';
        
        const iconImg = document.createElement('img');
        iconImg.className = 'icon-component';
        iconImg.src = image.url;
        iconImg.alt = image.title || `Icon ${index + 1}`;
        iconImg.title = image.title || `Icon ${index + 1}`;
        
        // Add error handling for broken images
        iconImg.onerror = function() {
            this.src = '../images/Button.png'; // fallback image
            this.alt = 'Icon not available';
        };
        
        const iconLabel = document.createElement('span');
        iconLabel.className = 'icon-label';
        iconLabel.textContent = image.title || `Icon ${index + 1}`;
        
        iconWrapper.appendChild(iconImg);
        iconWrapper.appendChild(iconLabel);
        gridContainer.appendChild(iconWrapper);
    });
    
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
                URL += ENDPOINTS.GET_ICON_COMPONENTS;
                payload = {
                    fileId: FIGMA_FILE_ID,
                    accessToken: FIGMA_ACCESS_TOKEN,
                };
                break;
    }

    const options = await buildRequest(payload);

    console.log('Sending request to:', URL, options);

    fetch(URL, options)
        .then((response) => {
            if (!response.ok) {
                chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
                showToast(RESULT.ERROR, MESSAGES.FAILED);
                resetReloadButton();
            } else {
                readStreamBE(response, feature);
            }
        })
        .catch((e) => {
            chrome.runtime.sendMessage({ source: 'stream', status: 'error' });
            showToast(RESULT.ERROR, MESSAGES.FAILED);
            resetReloadButton();
        });
}