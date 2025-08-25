const OPENAI_PROXY_BASE_URL = 'https://api.testcraft.app';

const BE_API_LOCAL = 'http://localhost:3000';


const STORAGE = {
    CUSTOM_SERVER_URL: 'custom-server-url',
    ELEMENT_PICKED: 'element-picked',
    ELEMENT_SCREENSHOT: 'element-screenshot',
    ELEMENT_SOURCE: 'selected-element',
    FRAMEWORK_SELECTED: 'selected-framework',
    IDEAS: 'ideas',
    LANGUAGE_SELECTED: 'selected-language',
    OPENAI_API_KEY: 'openai-api-key',
    OPENAI_MODEL: 'openai-model',
    POM: 'pom',
    SITE_URL: 'site-url',
    TEST_IDEAS: 'test-ideas',
};

const LANGUAGE = {
    JAVASCRIPT: { id: 'javascript', label: 'JS' },
    TYPESCRIPT: { id: 'typescript', label: 'TS' },
    JAVA: { id: 'java', label: 'Java' },
    CSHARP: { id: 'csharp', label: 'C#' },
    PYTHON: { id: 'python', label: 'py' },
};

const FRAMEWORK = {
    PLAYWRIGHT: 'playwright',
    CYPRESS: 'cypress',
    SELENIUM: 'selenium',
};

const ACTION = {
    ELEMENT_PICKED: 'element-picked',
    ELEMENT_SOURCE: 'element-source',
    HIGHLIGHT_ELEMENT: 'highlight-selected-element',
    START_PICKING: 'start-picking',
    UNHIGHLIGHT_ELEMENT: 'unhighlight-selected-element',
};

const MESSAGES = {
    API_DOWN: 'Our service is down, please check again later.',
    CHECKING_ACCESSIBILITY: 'Checking Accessibility<span class="ellipsis">...</span>',
    COPIED: 'Copied to Clipboard!',
    FAILED: 'Something happened, please try again :(',
    GENERATING_TEST_IDEAS: 'Generating Test Ideas<span class="ellipsis">...</span>',
    GENERATING_TESTS: 'Generating Tests<span class="ellipsis">...</span>',
    GENERATING_ICON_COMPONENTS: 'Generating Icon Components<span class="ellipsis">...</span>',
    SUCCESS: 'Success!',
    TOO_LARGE: 'The element selected is too large, please try again with a smaller element.',
    INVALID_API_KEY: 'Incorrect API key provided',
};

const RESULT = {
    ERROR: 'error',
    SUCCESS: 'success',
};

const ENDPOINTS = {
    AUTOMATE_IDEAS: '/api/automate-tests-ideas',
    AUTOMATE_TESTS: '/api/automate-tests',
    CHECK_ACCESSIBILITY: '/api/check-accessibility',
    GENERATE_TEST_IDEAS: '/api/generate-ideas',
    PING: '/api/ping',
    MODELS: '/api/models',
    GET_ICON_COMPONENTS: '/api/get-icon-components',
};

const FEATURE = {
    AUTOMATE_IDEAS: 'automate-ideas',
    AUTOMATE_TESTS: 'automated-tests',
    CHECK_ACCESSIBILITY: 'check-accessibility',
    GENERATE_TEST_IDEAS: 'test-ideas',
};

const automateBtn = document.getElementById('generate-tests');
const checkAccessibilityBtn = document.getElementById('check-accessibility');
const iconComponentBtn = document.getElementById('icon-component');
const ellipsis = document.getElementsByClassName('ellipsis');
const generateTestIdeasBtn = document.getElementById('generate-test-ideas');
const mainControls = document.getElementById('main-controls');
const pickerBtn = document.getElementById('start-picking');
const statusDescription = document.getElementById('status');
const screenshotContainer = document.getElementById('screenshot-container');
const screenShotImage = document.getElementById('screenshot-image');
