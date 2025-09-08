# 🧪 Test Case Generation - Frontend Integration Guide

## 🎯 Overview
Comprehensive guide cho Frontend team để integrate với Test Case Generation API. Hệ thống **generate test cases từ SRS description** với optional UI testing từ Figma components.

---

## 🚀 Quick Start

### 1. **Basic Integration Flow**
```javascript
// Step 1: Generate test cases from SRS
const testCases = await fetch('/api/images/test-case-generation/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    srsDescription: `
      User Login Functionality:
      - Users can log in with email and password
      - System validates credentials against database
      - Failed attempts are logged
      - Users are redirected to dashboard on success
    `,
    projectName: 'E-commerce Platform',
    testingFramework: 'cypress'
  })
});

// Step 2: Process and display test cases
if (testCases.success) {
  const { testCases: cases, summary } = testCases.data;
  displayTestCases(cases);
  showTestSummary(summary);
}
```

### 2. **UI Testing Integration với Figma**
```javascript
// Step 1: Get Figma component data (from existing Figma integration)
const figmaData = await getFigmaComponentData();

// Step 2: Generate test cases with UI testing
const testCases = await fetch('/api/images/test-case-generation/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    srsDescription: 'Login form with email, password fields and submit button',
    includeUITests: true,
    figmaResponse: figmaData,
    projectName: 'Web App',
    testingFramework: 'playwright'
  })
});

// Step 3: Display UI test cases
if (testCases.success) {
  const uiTests = testCases.data.testCases.filter(tc => tc.category === 'ui_ux');
  displayUITestCases(uiTests);
}
```

---

## 📋 API Reference

### **Primary Endpoint: Generate Test Cases**
```http
POST /api/images/test-case-generation/generate
Content-Type: application/json
```

### **Request Body Schema**
```typescript
interface TestCaseGenerationRequest {
  // ✅ REQUIRED
  srsDescription: string;              // SRS description to analyze

  // ⚙️ OPTIONAL - UI Testing
  includeUITests?: boolean;            // Default: false
  figmaResponse?: object;              // Required if includeUITests is true

  // 🎯 OPTIONAL - Configuration
  projectName?: string;                // Project context
  testingFramework?: TestingFramework; // Default: 'manual'
  model?: OpenAIModel;                 // Default: 'gpt-4o-mini'
  additionalRequirements?: string;     // Custom requirements
}

type TestingFramework = 
  | 'manual' | 'cypress' | 'playwright' | 'jest' 
  | 'testing_library' | 'vitest' | 'selenium';

type OpenAIModel = 
  | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4.1' | 'gpt-4.1-mini'
  | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo';
```

### **Response Schema**
```typescript
interface TestCaseGenerationResponse {
  success: boolean;
  
  data?: {
    testCases: TestCase[];             // Array of generated test cases
    summary: TestSummary;              // Statistical summary
    projectName?: string;              // Project name used
    generatedAt: string;               // Generation timestamp
    model: string;                     // AI model used
  };
  
  message?: string;                    // Success/error message
  processingTime?: number;             // Generation time in ms
  
  // 💰 Cost tracking
  openaiUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;                      // USD cost for this generation
  };
}

interface TestCase {
  id: string;                          // Unique identifier
  title: string;                       // Descriptive title
  description: string;                 // What is being tested
  category: TestCaseCategory;          // functional | ui_ux | integration | etc.
  priority: TestCasePriority;          // critical | high | medium | low
  type: TestCaseType;                  // positive | negative | boundary | exploratory
  preconditions?: string[];            // Prerequisites
  steps: TestStep[];                   // Detailed test steps
  expectedResult: string;              // Expected outcome
  tags?: string[];                     // Categorization tags
  estimatedTime?: number;              // Execution time in minutes
  uiElements?: UITestElement[];        // UI-specific elements (if UI tests enabled)
}

interface TestStep {
  stepNumber: number;                  // Step sequence
  action: string;                      // What to do
  expectedBehavior?: string;           // Expected response
  testData?: string;                   // Test data to use
  uiInteraction?: UIInteraction;       // UI-specific interaction
}

interface TestSummary {
  totalTestCases: number;              // Total generated
  functionalTests: number;             // Functional test count
  uiTests: number;                     // UI test count
  integrationTests: number;            // Integration test count
  edgeCaseTests: number;               // Edge case count
  estimatedExecutionTime: number;      // Total minutes
  coverageAreas: string[];             // Areas covered
}
```

---

## 🎨 Default Behavior (Functional Tests Only)

### **Input Example**
```javascript
const request = {
  srsDescription: `
    User Registration System:
    
    Functional Requirements:
    1. Users can register with email, password, and confirm password
    2. Email must be valid format
    3. Password must be at least 8 characters with special characters
    4. Confirm password must match password
    5. Email verification required before account activation
    6. Duplicate email addresses are not allowed
    
    Business Rules:
    - Registration is free
    - Users receive welcome email after successful registration
    - Account is locked until email verification
  `,
  projectName: 'E-commerce Platform'
  // No UI tests specified = functional tests only
};
```

### **Expected Output**
```typescript
{
  "success": true,
  "data": {
    "testCases": [
      {
        "id": "test-001",
        "title": "Valid User Registration with Email Verification",
        "description": "Test successful user registration with valid email and password",
        "category": "functional",
        "priority": "high",
        "type": "positive",
        "preconditions": ["Registration page is accessible"],
        "steps": [
          {
            "stepNumber": 1,
            "action": "Navigate to registration page",
            "expectedBehavior": "Registration form is displayed"
          },
          {
            "stepNumber": 2,
            "action": "Enter valid email address",
            "testData": "user@example.com",
            "expectedBehavior": "Email field accepts input"
          },
          {
            "stepNumber": 3,
            "action": "Enter valid password",
            "testData": "SecurePass123!",
            "expectedBehavior": "Password field accepts input"
          },
          {
            "stepNumber": 4,
            "action": "Confirm password",
            "testData": "SecurePass123!",
            "expectedBehavior": "Confirm password field accepts input"
          },
          {
            "stepNumber": 5,
            "action": "Click register button",
            "expectedBehavior": "Registration request is submitted"
          }
        ],
        "expectedResult": "User account created, verification email sent, account locked until verification",
        "tags": ["registration", "email-verification"],
        "estimatedTime": 5
      },
      {
        "id": "test-002",
        "title": "Registration with Invalid Email Format",
        "description": "Test registration rejection with invalid email format",
        "category": "functional",
        "priority": "high",
        "type": "negative",
        "steps": [
          {
            "stepNumber": 1,
            "action": "Enter invalid email format",
            "testData": "invalid-email",
            "expectedBehavior": "Email validation error is displayed"
          }
        ],
        "expectedResult": "Registration is rejected with appropriate error message",
        "estimatedTime": 3
      }
      // ... more test cases
    ],
    "summary": {
      "totalTestCases": 12,
      "functionalTests": 12,
      "uiTests": 0,
      "integrationTests": 0,
      "edgeCaseTests": 3,
      "estimatedExecutionTime": 45,
      "coverageAreas": ["registration", "validation", "email-verification", "error-handling"]
    },
    "projectName": "E-commerce Platform",
    "generatedAt": "2024-12-19T10:30:00.000Z",
    "model": "gpt-4o-mini"
  },
  "processingTime": 3247,
  "openaiUsage": {
    "cost": 0.0234
  }
}
```

---

## 🎨 UI Testing Integration

### **When UI Tests are Enabled**
```javascript
const uiTestRequest = {
  srsDescription: 'Login form with email, password fields and submit button',
  includeUITests: true,
  figmaResponse: {
    id: "189639:111814",
    name: "Login Form",
    type: "FRAME",
    absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 300 },
    children: [
      {
        id: "189639:111815",
        name: "Email Input",
        type: "FRAME",
        absoluteBoundingBox: { x: 20, y: 20, width: 360, height: 40 }
      },
      {
        id: "189639:111816", 
        name: "Password Input",
        type: "FRAME",
        absoluteBoundingBox: { x: 20, y: 80, width: 360, height: 40 }
      },
      {
        id: "189639:111817",
        name: "Login Button",
        type: "FRAME",
        absoluteBoundingBox: { x: 20, y: 140, width: 360, height: 50 }
      }
    ]
  },
  testingFramework: 'playwright'
};
```

### **UI Test Cases Output**
```typescript
{
  "testCases": [
    {
      "id": "ui-test-001",
      "title": "Login Form Element Visibility and Interaction",
      "description": "Test login form elements are visible and interactive",
      "category": "ui_ux",
      "priority": "high",
      "type": "positive",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Verify email input field is visible",
          "uiInteraction": {
            "action": "verify",
            "target": "#email-input",
            "expectedVisualState": "visible and enabled"
          }
        },
        {
          "stepNumber": 2,
          "action": "Enter valid email address",
          "testData": "user@example.com",
          "uiInteraction": {
            "action": "type",
            "target": "#email-input",
            "value": "user@example.com"
          }
        },
        {
          "stepNumber": 3,
          "action": "Verify password field is visible",
          "uiInteraction": {
            "action": "verify",
            "target": "#password-input",
            "expectedVisualState": "visible and enabled"
          }
        },
        {
          "stepNumber": 4,
          "action": "Enter password",
          "testData": "password123",
          "uiInteraction": {
            "action": "type",
            "target": "#password-input",
            "value": "password123"
          }
        },
        {
          "stepNumber": 5,
          "action": "Click login button",
          "uiInteraction": {
            "action": "click",
            "target": "#login-button",
            "expectedVisualState": "button clicked, loading state"
          }
        }
      ],
      "expectedResult": "Login form elements are properly displayed and interactive",
      "uiElements": [
        {
          "elementName": "Email Input",
          "elementType": "input",
          "selector": "#email-input",
          "figmaId": "189639:111815",
          "properties": {
            "width": 360,
            "height": 40,
            "type": "email"
          }
        },
        {
          "elementName": "Password Input",
          "elementType": "input",
          "selector": "#password-input",
          "figmaId": "189639:111816",
          "properties": {
            "width": 360,
            "height": 40,
            "type": "password"
          }
        },
        {
          "elementName": "Login Button",
          "elementType": "button",
          "selector": "#login-button",
          "figmaId": "189639:111817",
          "properties": {
            "width": 360,
            "height": 50,
            "type": "submit"
          }
        }
      ],
      "estimatedTime": 8
    }
  ]
}
```

---

## 🛠️ Framework Options

### **1. Manual Testing (Default)**
```javascript
const manualRequest = {
  srsDescription: srsData
  // Default behavior - manual testing procedures
};

// Generated test cases focus on:
// - Clear step-by-step instructions
// - Visual verification points
// - Data preparation requirements
// - Environment setup needs
```

### **2. Cypress E2E Testing**
```javascript
const cypressRequest = {
  srsDescription: srsData,
  testingFramework: 'cypress'
};

// Generated test cases include:
// - Page object model references
// - Command chaining patterns
// - Viewport and browser considerations
// - Network request interceptions
```

### **3. Playwright Testing**
```javascript
const playwrightRequest = {
  srsDescription: srsData,
  testingFramework: 'playwright'
};

// Generated test cases include:
// - Multi-browser testing scenarios
// - Screenshot and visual comparisons
// - Network and API mocking patterns
// - Page object model structure
```

### **4. Jest Unit Testing**
```javascript
const jestRequest = {
  srsDescription: srsData,
  testingFramework: 'jest'
};

// Generated test cases include:
// - describe/it structure patterns
// - Mock and spy requirements
// - Async/await testing patterns
// - Setup/teardown considerations
```

---

## 🤖 AI Model Selection Guide

### **Model Recommendations by Use Case**

| Use Case | Model | Context | Cost (est.) | Quality | Speed |
|----------|-------|---------|-------------|---------|--------|
| **🚀 Production Test Suites** | `gpt-4o` | 4K | $0.02-0.04 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **💰 Bulk Test Generation** | `gpt-4o-mini` | 16K | $0.001-0.003 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **🔥 Complex SRS Analysis** | `gpt-4.1` | 200K | $0.05-0.15 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **💎 Large SRS Budget** | `gpt-4.1-mini` | 128K | $0.01-0.05 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **⚡ Complex Logic Testing** | `gpt-4-turbo` | 4K | $0.04-0.08 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **🏷️ Budget Projects** | `gpt-3.5-turbo` | 4K | $0.002-0.006 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### **Model Selection Examples**
```javascript
// High-quality comprehensive test suite
const productionRequest = {
  srsDescription: complexSRS,
  model: 'gpt-4o',
  includeUITests: true,
  testingFramework: 'playwright'
};

// Large SRS document analysis
const complexRequest = {
  srsDescription: largeSRSDocument,
  model: 'gpt-4.1',
  projectName: 'Enterprise System',
  additionalRequirements: 'Include security and performance tests'
};

// Cost-effective bulk generation
const bulkRequest = {
  srsDescription: basicSRS,
  model: 'gpt-4o-mini',
  testingFramework: 'manual'
};
```

---

## 📁 Test Case Display & Management

### **1. Display Test Cases in UI**
```javascript
// After successful generation
if (result.success) {
  const { testCases, summary } = result.data;
  
  // Display test cases in organized view
  displayTestCases(testCases);
  
  // Show summary statistics
  showTestSummary(summary);
  
  // Enable export/download options
  enableTestExport(testCases);
}

function displayTestCases(testCases) {
  // Group by category
  const groupedTests = groupBy(testCases, 'category');
  
  // Display each category
  Object.entries(groupedTests).forEach(([category, tests]) => {
    displayTestCategory(category, tests);
  });
}

function displayTestCategory(category, tests) {
  const categoryElement = document.createElement('div');
  categoryElement.className = 'test-category';
  
  categoryElement.innerHTML = `
    <h3>${category.toUpperCase()} Tests (${tests.length})</h3>
    <div class="test-list">
      ${tests.map(test => createTestCard(test)).join('')}
    </div>
  `;
  
  document.getElementById('test-results').appendChild(categoryElement);
}

function createTestCard(test) {
  return `
    <div class="test-card" data-test-id="${test.id}">
      <div class="test-header">
        <h4>${test.title}</h4>
        <span class="priority ${test.priority}">${test.priority}</span>
        <span class="estimated-time">${test.estimatedTime}min</span>
      </div>
      <div class="test-description">${test.description}</div>
      <div class="test-steps">
        <h5>Test Steps:</h5>
        <ol>
          ${test.steps.map(step => `<li>${step.action}</li>`).join('')}
        </ol>
      </div>
      <div class="test-expected">
        <strong>Expected Result:</strong> ${test.expectedResult}
      </div>
      ${test.uiElements ? `
        <div class="ui-elements">
          <h5>UI Elements:</h5>
          <ul>
            ${test.uiElements.map(element => 
              `<li>${element.elementName} (${element.elementType})</li>`
            ).join('')}
          </ul>
        </div>
      ` : ''}
      <div class="test-actions">
        <button onclick="editTest('${test.id}')">Edit</button>
        <button onclick="exportTest('${test.id}')">Export</button>
        <button onclick="deleteTest('${test.id}')">Delete</button>
      </div>
    </div>
  `;
}
```

### **2. Test Summary Display**
```javascript
function showTestSummary(summary) {
  const summaryElement = document.createElement('div');
  summaryElement.className = 'test-summary';
  
  summaryElement.innerHTML = `
    <h2>Test Generation Summary</h2>
    <div class="summary-stats">
      <div class="stat">
        <span class="stat-number">${summary.totalTestCases}</span>
        <span class="stat-label">Total Test Cases</span>
      </div>
      <div class="stat">
        <span class="stat-number">${summary.functionalTests}</span>
        <span class="stat-label">Functional Tests</span>
      </div>
      <div class="stat">
        <span class="stat-number">${summary.uiTests}</span>
        <span class="stat-label">UI Tests</span>
      </div>
      <div class="stat">
        <span class="stat-number">${summary.estimatedExecutionTime}</span>
        <span class="stat-label">Estimated Time (min)</span>
      </div>
    </div>
    <div class="coverage-areas">
      <h3>Coverage Areas:</h3>
      <div class="tags">
        ${summary.coverageAreas.map(area => 
          `<span class="tag">${area}</span>`
        ).join('')}
      </div>
    </div>
  `;
  
  document.getElementById('test-results').prepend(summaryElement);
}
```

### **3. Export Test Cases**
```javascript
function exportTestCases(testCases, format = 'json') {
  switch (format) {
    case 'json':
      exportAsJSON(testCases);
      break;
    case 'csv':
      exportAsCSV(testCases);
      break;
    case 'xlsx':
      exportAsExcel(testCases);
      break;
    case 'cypress':
      exportAsCypress(testCases);
      break;
    case 'playwright':
      exportAsPlaywright(testCases);
      break;
  }
}

function exportAsJSON(testCases) {
  const dataStr = JSON.stringify(testCases, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'test-cases.json';
  link.click();
}

function exportAsCypress(testCases) {
  const cypressTests = testCases
    .filter(tc => tc.category === 'functional' || tc.category === 'ui_ux')
    .map(tc => generateCypressTest(tc))
    .join('\n\n');
  
  const cypressFile = `
describe('Generated Test Cases', () => {
${cypressTests}
});
  `;
  
  const dataBlob = new Blob([cypressFile], { type: 'text/javascript' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'generated-tests.cy.js';
  link.click();
}

function generateCypressTest(testCase) {
  return `
  it('${testCase.title}', () => {
    ${testCase.steps.map(step => {
      if (step.uiInteraction) {
        return generateCypressStep(step);
      }
      return `    // ${step.action}`;
    }).join('\n')}
  });`;
}
```

---

## 🎯 Best Practices

### **1. Input Validation**
```javascript
function validateSRSDescription(srsDescription) {
  if (!srsDescription || srsDescription.trim().length === 0) {
    throw new Error('SRS description is required');
  }
  
  if (srsDescription.length > 10000) {
    throw new Error('SRS description is too long (maximum 10,000 characters)');
  }
  
  // Check for minimum content
  const wordCount = srsDescription.split(/\s+/).length;
  if (wordCount < 10) {
    throw new Error('SRS description is too short (minimum 10 words)');
  }
  
  return true;
}

function validateFigmaResponse(figmaResponse) {
  if (!figmaResponse) {
    throw new Error('Figma response is required for UI tests');
  }
  
  if (!figmaResponse.id || !figmaResponse.name || !figmaResponse.type) {
    throw new Error('Invalid Figma response: missing required fields');
  }
  
  return true;
}
```

### **2. Error Handling**
```javascript
async function generateTestCases(srsDescription, options = {}) {
  try {
    // Validate inputs
    validateSRSDescription(srsDescription);
    if (options.includeUITests) {
      validateFigmaResponse(options.figmaResponse);
    }
    
    const response = await fetch('/api/images/test-case-generation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        srsDescription,
        ...options
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Test case generation failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('Test case generation error:', error);
    
    // Handle specific error types
    if (error.message.includes('SRS description')) {
      return { success: false, error: 'INVALID_SRS', message: error.message };
    }
    
    if (error.message.includes('Figma response')) {
      return { success: false, error: 'INVALID_FIGMA', message: error.message };
    }
    
    if (error.message.includes('OpenAI')) {
      return { success: false, error: 'AI_ERROR', message: error.message };
    }
    
    return { success: false, error: 'UNKNOWN', message: error.message };
  }
}
```

### **3. Loading States & Progress**
```javascript
async function generateTestCasesWithProgress(srsDescription, options = {}) {
  // Show loading state
  setLoading(true);
  setProgress('Analyzing SRS description...');
  
  try {
    setProgress('Generating test cases with AI...');
    const result = await generateTestCases(srsDescription, options);
    
    if (result.success) {
      setProgress('Processing test cases...');
      displayTestCases(result.data.testCases);
      showTestSummary(result.data.summary);
      setProgress('Test case generation completed!');
    } else {
      setError(result.message);
    }
    
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(loading) {
  const button = document.getElementById('generate-btn');
  const spinner = document.getElementById('loading-spinner');
  
  if (loading) {
    button.disabled = true;
    button.textContent = 'Generating...';
    spinner.style.display = 'block';
  } else {
    button.disabled = false;
    button.textContent = 'Generate Test Cases';
    spinner.style.display = 'none';
  }
}

function setProgress(message) {
  const progressElement = document.getElementById('progress-message');
  progressElement.textContent = message;
}
```

### **4. Cost Tracking**
```javascript
class TestGenerationCostTracker {
  constructor() {
    this.dailyCost = 0;
    this.totalGenerations = 0;
    this.costHistory = [];
  }
  
  trackGeneration(result) {
    if (result.success && result.openaiUsage?.cost) {
      this.dailyCost += result.openaiUsage.cost;
      this.totalGenerations++;
      
      this.costHistory.push({
        timestamp: new Date().toISOString(),
        cost: result.openaiUsage.cost,
        tokens: result.openaiUsage.totalTokens,
        model: result.data.model
      });
      
      // Warn if approaching budget limit
      if (this.dailyCost > 20) { // $20 daily limit
        this.showCostWarning();
      }
      
      this.updateCostDisplay();
    }
  }
  
  showCostWarning() {
    const warning = document.createElement('div');
    warning.className = 'cost-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <h4>⚠️ Daily Cost Limit Approaching</h4>
        <p>Current daily cost: $${this.dailyCost.toFixed(4)}</p>
        <p>Consider using gpt-4o-mini for cost-effective generation.</p>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      warning.remove();
    }, 5000);
  }
  
  updateCostDisplay() {
    const costElement = document.getElementById('cost-display');
    if (costElement) {
      costElement.innerHTML = `
        <div class="cost-stats">
          <span>Daily Cost: $${this.dailyCost.toFixed(4)}</span>
          <span>Generations: ${this.totalGenerations}</span>
          <span>Avg Cost: $${(this.dailyCost / this.totalGenerations).toFixed(4)}</span>
        </div>
      `;
    }
  }
  
  getStats() {
    return {
      dailyCost: this.dailyCost,
      totalGenerations: this.totalGenerations,
      averageCostPerGeneration: this.dailyCost / this.totalGenerations,
      costHistory: this.costHistory
    };
  }
}

// Initialize cost tracker
const costTracker = new TestGenerationCostTracker();
```

---

## 🔧 Complete Integration Examples

### **React Hook Example**
```typescript
import { useState, useCallback } from 'react';

interface TestCaseGenerationOptions {
  includeUITests?: boolean;
  figmaResponse?: any;
  projectName?: string;
  testingFramework?: string;
  model?: string;
  additionalRequirements?: string;
}

export function useTestCaseGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [cost, setCost] = useState<number>(0);

  const generateTestCases = useCallback(async (
    srsDescription: string, 
    options: TestCaseGenerationOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/test-case-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srsDescription,
          model: 'gpt-4o-mini',        // Cost-effective default
          testingFramework: 'manual',   // Default manual
          ...options
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      setTestCases(result.data.testCases);
      setSummary(result.data.summary);
      setCost(result.openaiUsage?.cost || 0);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportTestCases = useCallback((format: string) => {
    if (testCases.length === 0) return;
    
    switch (format) {
      case 'json':
        const dataStr = JSON.stringify(testCases, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'test-cases.json';
        link.click();
        break;
      // Add more export formats as needed
    }
  }, [testCases]);

  return {
    generateTestCases,
    exportTestCases,
    testCases,
    summary,
    loading,
    error,
    cost,
    clearError: () => setError(null)
  };
}

// Usage in component
function TestCaseGenerator() {
  const {
    generateTestCases,
    exportTestCases,
    testCases,
    summary,
    loading,
    error,
    cost
  } = useTestCaseGeneration();

  const [srsDescription, setSrsDescription] = useState('');

  const handleGenerate = async () => {
    try {
      await generateTestCases(srsDescription, {
        projectName: 'My Project',
        testingFramework: 'cypress'
      });
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <div className="test-case-generator">
      <div className="input-section">
        <textarea
          value={srsDescription}
          onChange={(e) => setSrsDescription(e.target.value)}
          placeholder="Enter your SRS description here..."
          rows={10}
        />
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Test Cases'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {summary && (
        <div className="summary-section">
          <h3>Generation Summary</h3>
          <p>Total Test Cases: {summary.totalTestCases}</p>
          <p>Estimated Time: {summary.estimatedExecutionTime} minutes</p>
          <p>Cost: ${cost.toFixed(4)}</p>
        </div>
      )}

      {testCases.length > 0 && (
        <div className="test-cases-section">
          <div className="actions">
            <button onClick={() => exportTestCases('json')}>
              Export as JSON
            </button>
          </div>
          
          <div className="test-cases">
            {testCases.map(testCase => (
              <div key={testCase.id} className="test-case-card">
                <h4>{testCase.title}</h4>
                <p>{testCase.description}</p>
                <div className="test-meta">
                  <span className={`priority ${testCase.priority}`}>
                    {testCase.priority}
                  </span>
                  <span className="category">{testCase.category}</span>
                  <span className="time">{testCase.estimatedTime}min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### **Vue Composable Example**
```typescript
import { ref, reactive } from 'vue';

export function useTestCaseGeneration() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const testCases = ref<TestCase[]>([]);
  const summary = ref<TestSummary | null>(null);
  const cost = ref<number>(0);

  const generateTestCases = async (srsDescription: string, options = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/images/test-case-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srsDescription,
          model: 'gpt-4o-mini',
          testingFramework: 'manual',
          ...options
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      testCases.value = result.data.testCases;
      summary.value = result.data.summary;
      cost.value = result.openaiUsage?.cost || 0;
      
      return result;
      
    } catch (err) {
      error.value = err.message || 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const exportTestCases = (format: string) => {
    if (testCases.value.length === 0) return;
    
    const dataStr = JSON.stringify(testCases.value, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test-cases.json';
    link.click();
  };

  return {
    generateTestCases,
    exportTestCases,
    testCases: readonly(testCases),
    summary: readonly(summary),
    loading: readonly(loading),
    error: readonly(error),
    cost: readonly(cost)
  };
}
```

---

## 🎯 Quick Reference

### **Minimal Request**
```javascript
{
  srsDescription: "User can log in with email and password"
}
```

### **Full-Featured Request**
```javascript
{
  srsDescription: "Comprehensive user authentication system...",
  includeUITests: true,
  figmaResponse: { /* Figma data */ },
  projectName: 'E-commerce Platform',
  testingFramework: 'playwright',
  model: 'gpt-4o',
  additionalRequirements: 'Include accessibility and security tests'
}
```

### **Error Codes Reference**
| Error | Description | Solution |
|-------|-------------|----------|
| `INVALID_SRS` | Missing or invalid SRS description | Provide detailed SRS description |
| `INVALID_FIGMA` | Invalid Figma response when UI tests enabled | Check Figma response structure |
| `INVALID_MODEL` | Unsupported AI model | Use supported model from /options |
| `INVALID_FRAMEWORK` | Unsupported testing framework | Use supported framework |
| `AI_ERROR` | AI generation failed | Retry with different model |

---

## 🎨 CSS Styling Examples

### **Test Case Cards**
```css
.test-case-card {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-case-card h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
}

.test-meta {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.priority {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.priority.critical { background: #fee; color: #c53030; }
.priority.high { background: #fef5e7; color: #dd6b20; }
.priority.medium { background: #e6fffa; color: #319795; }
.priority.low { background: #f7fafc; color: #4a5568; }

.category {
  padding: 4px 8px;
  background: #edf2f7;
  color: #4a5568;
  border-radius: 4px;
  font-size: 12px;
}

.time {
  padding: 4px 8px;
  background: #e6fffa;
  color: #319795;
  border-radius: 4px;
  font-size: 12px;
}
```

### **Summary Statistics**
```css
.test-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.coverage-areas .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 16px;
  font-size: 12px;
}
```

---

**🎉 Ready to generate comprehensive, AI-powered test cases from your SRS!**

*Last Updated: Today*  
*Features: SRS Analysis + Optional UI Testing with Figma Integration*  
*Contact: Backend Team for support*
