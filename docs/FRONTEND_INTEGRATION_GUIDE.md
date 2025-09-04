# 🎨💻 Frontend Integration Guide - Figma to Code API

## 🎯 Overview
Comprehensive guide cho Frontend team để integrate với Figma-to-Code API. Hệ thống **default generate HTML + CSS** từ Figma components.

---

## 🚀 Quick Start

### 1. **Basic Integration Flow**
```javascript
// Step 1: Get Figma component data
const figmaData = await fetch('/api/images/from-sheet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    figmaAccessToken: 'your-token',
    figmaFileId: 'your-file-id',
    specificNodeId: ['component-id']
  })
});

// Step 2: Convert to HTML/CSS code - Returns file contents directly
const codeResult = await fetch('/api/images/figma-to-code/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    figmaResponse: figmaData.data[0].figmaResponse
    // Default: HTML + CSS generation
  })
});

// Step 3: Display file contents in UI
if (codeResult.success) {
  const files = codeResult.data.files;
  displayFiles(files); // Show files in editor/preview
}

// Step 4: Download when user clicks download button
async function downloadFiles() {
  const downloadResult = await fetch('/api/images/figma-to-code/create-package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: codeResult.data.files,
      componentName: codeResult.data.componentName
    })
  });
  
  if (downloadResult.success) {
    window.open(downloadResult.data.downloadUrl);
  }
}
```

---

## 📋 API Reference

### **Primary Endpoint: Convert Figma to Code**
```http
POST /api/images/figma-to-code/convert
Content-Type: application/json
```

### **Request Body Schema**
```typescript
interface FigmaToCodeRequest {
  // ✅ REQUIRED
  figmaResponse: object;           // Raw Figma node data từ /from-sheet API

  // ⚙️ OPTIONAL - Framework Selection
  framework?: 'vanilla' | 'react' | 'vue' | 'angular';  // Default: 'vanilla' (HTML)
  cssFramework?: 'vanilla' | 'tailwind' | 'bootstrap' | 'styled-components'; // Default: 'vanilla' (CSS)
  
  // 🤖 OPTIONAL - AI Model Selection
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo'; // Default: 'gpt-4o'
  
  // 🎨 OPTIONAL - Customization
  componentName?: string;          // Default: Auto-generated từ Figma name
  includeResponsive?: boolean;     // Default: true
  includeInteractions?: boolean;   // Default: false
  additionalRequirements?: string; // Custom instructions cho AI
}
```

### **Response Schema**
```typescript
interface FigmaToCodeResponse {
  success: boolean;
  
  data?: {
    files: GeneratedCodeFile[];    // Array of generated files
    componentName: string;         // Final component name used
    framework: string;             // Framework đã sử dụng
    cssFramework: string;          // CSS framework đã sử dụng
    model: string;                 // AI model đã sử dụng
    // Note: downloadUrl is now created on-demand
  };
  
  message?: string;                // Success/error message
  processingTime?: number;         // Generation time in ms
  
  // 💰 Cost tracking
  openaiUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;                  // USD cost for this conversion
  };
}

interface GeneratedCodeFile {
  filename: string;                // e.g., "Button.html", "styles.css"
  content: string;                 // File content
  type: 'html' | 'css' | 'js' | 'jsx' | 'vue' | 'ts'; // File type
  description: string;             // File description
}
```

---

## 🎨 Default Behavior (HTML + CSS)

### **Input Example**
```javascript
const request = {
  figmaResponse: {
    id: "189639:111815",
    name: "Primary Button",
    type: "FRAME",
    absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 44 },
    fills: [{ type: "SOLID", color: { r: 0.2, g: 0.6, b: 1 } }],
    children: [
      {
        id: "189639:111816",
        name: "Button Text",
        type: "TEXT",
        characters: "Click Me",
        style: {
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: 500
        }
      }
    ]
  }
  // No framework specified = HTML + CSS default
};
```

### **Expected Output**
```typescript
{
  "success": true,
  "data": {
    "files": [
      {
        "filename": "PrimaryButton.html",
        "content": "<!DOCTYPE html>\n<html>...",
        "type": "html",
        "description": "HTML structure for Primary Button component"
      },
      {
        "filename": "PrimaryButton.css",
        "content": ".primary-button {\n  background: #3366ff;\n  ...",
        "type": "css", 
        "description": "CSS styles for Primary Button component"
      }
    ],
    "componentName": "PrimaryButton",
    "framework": "vanilla",
    "cssFramework": "vanilla",
    "model": "gpt-4o"
    // Note: No downloadUrl - create package on-demand via /create-package
  },
  "processingTime": 3247,
  "openaiUsage": {
    "cost": 0.0267
  }
}
```

---

## 🛠️ Framework Options

### **1. Vanilla HTML + CSS (Default)**
```javascript
const htmlCssRequest = {
  figmaResponse: componentData
  // Default behavior - no framework needed
};

// Generated files:
// - Component.html
// - Component.css
// - README.md
```

### **2. React + Tailwind**
```javascript
const reactRequest = {
  figmaResponse: componentData,
  framework: 'react',
  cssFramework: 'tailwind'
};

// Generated files:
// - Component.jsx
// - Component.module.css (if needed)
// - README.md
```

### **3. Vue + Bootstrap**
```javascript
const vueRequest = {
  figmaResponse: componentData,
  framework: 'vue',
  cssFramework: 'bootstrap'
};

// Generated files:
// - Component.vue
// - README.md
```

---

## 🤖 AI Model Selection Guide

### **Model Recommendations by Use Case**

| Use Case | Model | Cost (est.) | Quality | Speed |
|----------|-------|-------------|---------|--------|
| **Production Components** | `gpt-4o` | $0.02-0.04 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Bulk Processing** | `gpt-4o-mini` | $0.001-0.003 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Complex Layouts** | `gpt-4-turbo` | $0.04-0.08 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Budget Projects** | `gpt-3.5-turbo` | $0.002-0.006 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### **Model Selection Examples**
```javascript
// High-quality production component
const productionRequest = {
  figmaResponse: componentData,
  model: 'gpt-4o',        // Best quality
  includeResponsive: true,
  includeInteractions: true
};

// Cost-effective bulk generation
const bulkRequest = {
  figmaResponse: componentData,
  model: 'gpt-4o-mini',   // Most cost-effective
  includeResponsive: false
};

// Budget-friendly option
const budgetRequest = {
  figmaResponse: componentData,
  model: 'gpt-3.5-turbo', // Lowest cost
  framework: 'vanilla'
};
```

---

## 📁 File Display & Download Integration

### **New Workflow: Display First, Download on Demand** 🎯

The API now returns file contents directly in the response. Frontend can:
1. **Display files immediately** - Show code in editor/preview
2. **Download when needed** - User clicks download button

### **1. Display File Contents**
```javascript
// After successful conversion
if (result.success) {
  const files = result.data.files;
  
  // Display in code editor
  files.forEach(file => {
    displayFileInEditor(file.filename, file.content, file.type);
  });
  
  // Show file tree
  showFileTree(files);
  
  // Enable download button
  enableDownloadButton(files, result.data.componentName);
}

function displayFileInEditor(filename, content, type) {
  // Use your preferred code editor (Monaco, CodeMirror, etc.)
  const editor = createCodeEditor({
    filename,
    content,
    language: type,
    readOnly: false // Allow editing
  });
}
```

### **2. Create Download Package API**
```http
POST /api/images/figma-to-code/create-package
Content-Type: application/json
```

**Request Body:**
```typescript
{
  files: GeneratedCodeFile[];    // Files array from /convert response
  componentName: string;         // Component name from /convert response
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    downloadUrl: string;         // ZIP download link
  };
  message?: string;
}
```

### **3. Download ZIP Package**
```javascript
// Complete download workflow
async function handleDownload(files, componentName) {
  try {
    // Step 1: Create download package
    const packageResponse = await fetch('/api/images/figma-to-code/create-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: files,
        componentName: componentName
      })
    });
    
    const packageData = await packageResponse.json();
    
    if (packageData.success) {
      // Step 2: Trigger download
      const link = document.createElement('a');
      link.href = packageData.data.downloadUrl;
      link.download = `${componentName}.zip`;
      link.click();
    } else {
      console.error('Failed to create download package:', packageData.message);
    }
  } catch (error) {
    console.error('Download error:', error);
  }
}

// Usage in download button
document.getElementById('downloadBtn').addEventListener('click', () => {
  handleDownload(currentFiles, currentComponentName);
});
```

### **2. ZIP Package Contents**
```
PrimaryButton-uuid.zip
├── PrimaryButton.html      # Main HTML file
├── PrimaryButton.css       # Component styles  
├── README.md              # Integration instructions
└── assets/ (if needed)    # Additional assets
```

### **3. Integration Instructions**
```html
<!-- Include in your HTML -->
<link rel="stylesheet" href="PrimaryButton.css">

<!-- Use the component -->
<div class="primary-button" onclick="handleClick()">
  Click Me
</div>

<script>
function handleClick() {
  console.log('Button clicked!');
}
</script>
```

---

## 🎯 Best Practices

### **1. Input Validation**
```javascript
function validateFigmaResponse(figmaResponse) {
  if (!figmaResponse) {
    throw new Error('figmaResponse is required');
  }
  
  if (!figmaResponse.id || !figmaResponse.name || !figmaResponse.type) {
    throw new Error('Invalid figmaResponse: missing required fields');
  }
  
  return true;
}
```

### **2. Error Handling**
```javascript
async function convertFigmaToCode(figmaResponse, options = {}) {
  try {
    validateFigmaResponse(figmaResponse);
    
    const response = await fetch('/api/images/figma-to-code/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        figmaResponse,
        ...options
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Conversion failed');
    }
    
    return result;
    
  } catch (error) {
    console.error('Figma to Code conversion error:', error);
    
    // Handle specific error types
    if (error.message.includes('Invalid figmaResponse')) {
      return { success: false, error: 'INVALID_INPUT', message: error.message };
    }
    
    if (error.message.includes('OpenAI model')) {
      return { success: false, error: 'INVALID_MODEL', message: error.message };
    }
    
    return { success: false, error: 'UNKNOWN', message: error.message };
  }
}
```

### **3. Loading States & Progress**
```javascript
async function convertWithProgress(figmaResponse, options = {}) {
  // Show loading
  setLoading(true);
  setProgress('Initializing conversion...');
  
  try {
    setProgress('Sending to AI for processing...');
    const result = await convertFigmaToCode(figmaResponse, options);
    
    if (result.success) {
      setProgress('Generating files...');
      // Auto download or show download link
      handleDownload(result.data.downloadUrl);
      setProgress('Conversion completed!');
    } else {
      setError(result.message);
    }
    
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

---

## 🎛️ Configuration Options

### **Get Available Options**
```javascript
// Get supported frameworks, models, etc.
const options = await fetch('/api/images/figma-to-code/options');
const { frameworks, cssFrameworks, models, modelInfo } = options.data;

// Build dynamic UI
const frameworkSelect = frameworks.map(fw => ({ value: fw, label: fw.toUpperCase() }));
const modelSelect = models.map(model => {
  const info = modelInfo.find(m => m.model === model);
  return {
    value: model,
    label: `${model} - ${info.description}`,
    cost: info.costPer1K,
    recommended: info.recommended
  };
});
```

### **Dynamic Form Building**
```javascript
function buildConversionForm(options) {
  return {
    framework: {
      type: 'select',
      options: options.frameworks,
      default: 'vanilla',
      label: 'Framework'
    },
    cssFramework: {
      type: 'select', 
      options: options.cssFrameworks,
      default: 'vanilla',
      label: 'CSS Framework'
    },
    model: {
      type: 'select',
      options: options.models,
      default: 'gpt-4o',
      label: 'AI Model',
      description: 'Higher quality models cost more'
    },
    componentName: {
      type: 'text',
      placeholder: 'Auto-generated from Figma',
      label: 'Component Name'
    },
    includeResponsive: {
      type: 'checkbox',
      default: true,
      label: 'Include Responsive Design'
    },
    includeInteractions: {
      type: 'checkbox', 
      default: false,
      label: 'Include Hover/Focus States'
    }
  };
}
```

---

## 📊 Usage Analytics & Monitoring

### **Track Conversion Metrics**
```javascript
async function trackConversion(request, result) {
  const metrics = {
    timestamp: new Date().toISOString(),
    framework: request.framework || 'vanilla',
    cssFramework: request.cssFramework || 'vanilla',
    model: request.model || 'gpt-4o',
    processingTime: result.processingTime,
    tokenUsage: result.openaiUsage?.totalTokens,
    cost: result.openaiUsage?.cost,
    success: result.success,
    componentComplexity: estimateComplexity(request.figmaResponse)
  };
  
  // Send to analytics
  analytics.track('figma_to_code_conversion', metrics);
}

function estimateComplexity(figmaResponse) {
  const childrenCount = figmaResponse.children?.length || 0;
  const hasEffects = figmaResponse.effects?.length > 0;
  const hasAutoLayout = !!figmaResponse.layoutMode;
  
  if (childrenCount > 10 || hasEffects || hasAutoLayout) return 'complex';
  if (childrenCount > 3) return 'medium';
  return 'simple';
}
```

### **Cost Tracking**
```javascript
class CostTracker {
  constructor() {
    this.dailyCost = 0;
    this.totalConversions = 0;
  }
  
  trackConversion(result) {
    if (result.success && result.openaiUsage?.cost) {
      this.dailyCost += result.openaiUsage.cost;
      this.totalConversions++;
      
      // Warn if approaching budget limit
      if (this.dailyCost > 50) { // $50 daily limit
        console.warn('Daily OpenAI cost exceeding budget!');
      }
    }
  }
  
  getStats() {
    return {
      dailyCost: this.dailyCost,
      averageCostPerConversion: this.dailyCost / this.totalConversions,
      totalConversions: this.totalConversions
    };
  }
}
```

---

## 🔧 Complete Integration Example

### **React Hook Example**
```typescript
import { useState, useCallback } from 'react';

interface ConversionOptions {
  framework?: string;
  cssFramework?: string;
  model?: string;
  componentName?: string;
  includeResponsive?: boolean;
  includeInteractions?: boolean;
}

export function useFigmaToCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const convert = useCallback(async (
    figmaResponse: any, 
    options: ConversionOptions = {}
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/figma-to-code/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figmaResponse,
          framework: 'vanilla',    // Default HTML
          cssFramework: 'vanilla', // Default CSS
          model: 'gpt-4o',        // Default best model
          ...options
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      setResult(data);
      return data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadCode = useCallback(async (files: any[], componentName: string) => {
    setDownloading(true);
    
    try {
      const response = await fetch('/api/images/figma-to-code/create-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          componentName
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      // Trigger download
      const link = document.createElement('a');
      link.href = data.data.downloadUrl;
      link.download = `${componentName}.zip`;
      link.click();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      throw err;
    } finally {
      setDownloading(false);
    }
  }, []);

  return {
    convert,
    downloadCode,
    loading,
    downloading,
    error,
    result,
    clearError: () => setError(null)
  };
}
```

### **Vue Composable Example**
```typescript
import { ref, reactive } from 'vue';

export function useFigmaToCode() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const result = ref<any>(null);

  const convert = async (figmaResponse: any, options = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/images/figma-to-code/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figmaResponse,
          framework: 'vanilla',    // Default HTML
          cssFramework: 'vanilla', // Default CSS  
          model: 'gpt-4o',        // Default best model
          ...options
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      result.value = data;
      return data;
      
    } catch (err) {
      error.value = err.message || 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    convert,
    loading: readonly(loading),
    error: readonly(error),
    result: readonly(result)
  };
}
```

---

## 🎯 Quick Reference

### **Minimal Request (HTML + CSS)**
```javascript
// Step 1: Convert (returns file contents)
const response = await fetch('/api/images/figma-to-code/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    figmaResponse: componentData
    // Tất cả options khác là optional
  })
});

// Step 2: Display files in UI
const files = response.data.files;
displayFiles(files);

// Step 3: Download when user clicks button
async function download() {
  const packageResponse = await fetch('/api/images/figma-to-code/create-package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files,
      componentName: response.data.componentName
    })
  });
  window.open(packageResponse.data.downloadUrl);
}
```

### **Full-Featured Request**
```javascript
const response = await fetch('/api/images/figma-to-code/convert', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    figmaResponse: componentData,
    framework: 'react',
    cssFramework: 'tailwind',
    model: 'gpt-4o',
    componentName: 'CustomButton',
    includeResponsive: true,
    includeInteractions: true,
    additionalRequirements: 'Add dark mode support and loading states'
  })
});
```

### **Error Codes Reference**
| Error | Description | Solution |
|-------|-------------|----------|
| `INVALID_INPUT` | Missing figmaResponse | Check figmaResponse object |
| `INVALID_MODEL` | Unsupported AI model | Use supported model from /options |
| `INVALID_FRAMEWORK` | Unsupported framework | Use supported framework from /options |
| `OPENAI_ERROR` | AI generation failed | Retry with different model |
| `FILE_ERROR` | Download creation failed | Contact support |

---

**🎉 Ready to start generating pixel-perfect HTML + CSS from Figma!**

*Last Updated: Today*  
*Default: HTML + CSS Generation*  
*Contact: Backend Team for support*
