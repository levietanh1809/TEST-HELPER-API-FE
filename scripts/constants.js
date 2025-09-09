const OPENAI_PROXY_BASE_URL = 'https://api.testcraft.app';

const BE_API_LOCAL = 'http://10.1.45.119:3000';



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
    FIGMA_TO_CODE_FRAMEWORK: 'figma-to-code-framework',
    FIGMA_TO_CODE_CSS_FRAMEWORK: 'figma-to-code-css-framework',
    FIGMA_TO_CODE_MODEL: 'figma-to-code-model',
    FIGMA_TO_CODE_RESPONSIVE: 'figma-to-code-responsive',
    FIGMA_TO_CODE_INTERACTIONS: 'figma-to-code-interactions',
    FIGMA_MIN_WIDTH: 'figma-min-width',
    FIGMA_MIN_HEIGHT: 'figma-min-height',
    FIGMA_SIZE_PRESET: 'figma-size-preset',
    TEST_CASE_GENERATION_MODEL: 'test-case-generation-model',
    TEST_CASE_GENERATION_FRAMEWORK: 'test-case-generation-framework',
    TEST_CASE_GENERATION_INCLUDE_UI: 'test-case-generation-include-ui',
    TEST_CASE_GENERATION_LANGUAGE: 'test-case-generation-language',
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
    GET_FIGMA_COMPONENTS: '/api/images/from-sheet',
    FIGMA_TO_CODE_CONVERT: '/api/images/figma-to-code/convert',
    FIGMA_TO_CODE_CREATE_PACKAGE: '/api/images/figma-to-code/create-package',
    FIGMA_TO_CODE_OPTIONS: '/api/images/figma-to-code/options',
    TEST_CASE_GENERATION: '/api/images/test-case-generation/generate',
};

const FEATURE = {
    AUTOMATE_IDEAS: 'automate-ideas',
    AUTOMATE_TESTS: 'automated-tests',
    CHECK_ACCESSIBILITY: 'check-accessibility',
    GENERATE_TEST_IDEAS: 'test-ideas',
    GET_ICON_COMPONENTS: 'icon-components',
    FIGMA_TO_CODE: 'figma-to-code',
    TEST_CASE_GENERATION: 'test-case-generation',
};

// AI Models Configuration
const AI_MODELS = {
    GPT5_MINI: {
        id: 'gpt-5-mini',
        label: 'GPT-5 Mini (Cost-effective)',
        pricing: {
            input: 0.25,
            cachedInput: 0.025,
            output: 2.00
        },
        limits: {
            tokensPerMinute: 200000,
            requestsPerMinute: 500,
            tokensPerDay: 2000000
        }
    },
    O4_MINI: {
        id: 'o4-mini',
        label: 'O4 Mini (Higher quality)',
        pricing: {
            input: 1.10,
            cachedInput: 0.275,
            output: 4.40
        },
        limits: {
            tokensPerMinute: 200000,
            requestsPerMinute: 500,
            tokensPerDay: 2000000
        }
    }
};

// Default model selection
const DEFAULT_MODELS = {
    FIGMA_TO_CODE: AI_MODELS.GPT5_MINI.id,
    TEST_CASE_GENERATION: AI_MODELS.GPT5_MINI.id,
    GENERAL: AI_MODELS.GPT5_MINI.id
};

// Framework Options
const FRAMEWORKS = {
    FIGMA_TO_CODE: {
        VANILLA: { id: 'vanilla', label: 'HTML + CSS (Default)' },
        REACT: { id: 'react', label: 'React' },
        VUE: { id: 'vue', label: 'Vue' },
        ANGULAR: { id: 'angular', label: 'Angular' }
    },
    CSS: {
        VANILLA: { id: 'vanilla', label: 'Vanilla CSS (Default)' },
        TAILWIND: { id: 'tailwind', label: 'Tailwind CSS' },
        BOOTSTRAP: { id: 'bootstrap', label: 'Bootstrap' },
        STYLED_COMPONENTS: { id: 'styled-components', label: 'Styled Components' }
    },
    TESTING: {
        MANUAL: { id: 'manual', label: 'Manual Testing (Default)' },
        CYPRESS: { id: 'cypress', label: 'Cypress' },
        PLAYWRIGHT: { id: 'playwright', label: 'Playwright' },
        JEST: { id: 'jest', label: 'Jest' },
        TESTING_LIBRARY: { id: 'testing_library', label: 'Testing Library' },
        VITEST: { id: 'vitest', label: 'Vitest' },
        SELENIUM: { id: 'selenium', label: 'Selenium' }
    }
};

// Size Presets
const SIZE_PRESETS = {
    SMALL: { id: 'small', label: 'Small (150x150)', width: 150, height: 150 },
    MEDIUM: { id: 'medium', label: 'Medium (300x300)', width: 300, height: 300 },
    LARGE: { id: 'large', label: 'Large (500x500)', width: 500, height: 500 },
    XLARGE: { id: 'xlarge', label: 'Extra Large (700x700)', width: 700, height: 700 }
};

// Language Options
const LANGUAGES = {
    TEST_CASE: {
        ENGLISH: { id: 'en', label: 'English (Default)' },
        VIETNAMESE: { id: 'vi', label: 'Vietnamese' },
        JAPANESE: { id: 'ja', label: 'Japanese' }
    }
};

// Default Settings
const DEFAULT_SETTINGS = {
    FIGMA_TO_CODE: {
        framework: FRAMEWORKS.FIGMA_TO_CODE.VANILLA.id,
        cssFramework: FRAMEWORKS.CSS.VANILLA.id,
        model: DEFAULT_MODELS.FIGMA_TO_CODE,
        includeResponsive: true,
        includeInteractions: false
    },
    TEST_CASE_GENERATION: {
        model: DEFAULT_MODELS.TEST_CASE_GENERATION,
        testingFramework: FRAMEWORKS.TESTING.MANUAL.id,
        includeUITests: true,
        language: LANGUAGES.TEST_CASE.ENGLISH.id
    },
    SIZE: {
        preset: SIZE_PRESETS.LARGE.id,
        width: SIZE_PRESETS.LARGE.width,
        height: SIZE_PRESETS.LARGE.height
    }
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
