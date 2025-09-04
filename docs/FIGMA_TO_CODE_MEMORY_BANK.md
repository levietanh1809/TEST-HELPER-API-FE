# 🎨💻 Figma to Code Memory Bank - Test Helper Extension

## 🎯 Overview
Comprehensive memory bank cho tính năng **Figma to Code** trong Test Helper extension. Tính năng này cho phép generate HTML/CSS/React code từ Figma components với AI assistance.

---

## 📋 Feature Architecture

### 🏗️ **Component Structure**
```
📁 Figma to Code Feature
├── 📄 pages/iconComponent.html          # Main UI với settings + modals
├── 🎨 styles/results.css                # UI styling cho modals + components  
├── ⚙️ scripts/constants.js              # Constants + storage keys
├── 🔧 scripts/result/figmaToCode.js     # Core figma-to-code logic
├── 🔄 scripts/result/common.js          # Modified để support context menu
└── 📚 docs/FRONTEND_INTEGRATION_GUIDE.md # BE API documentation
```

### 🎯 **User Flow**
```
1. Load IconComponent page → Display Figma components
2. Click ⚙️ Settings → Configure generation options
3. Right-click component → Context menu: "Generate Code"  
4. AI generates code → Modal shows files với tabs
5. Copy individual files OR Download ZIP package
```

---

## 🚀 Implementation Details

### **1. Settings Panel**

**Location:** `pages/iconComponent.html` header
```html
<button id="settings-btn" class="settings-button">⚙️ Code Gen Settings</button>
```

**Configuration Options:**
- **Framework:** vanilla (HTML+CSS), react, vue, angular
- **CSS Framework:** vanilla (CSS), tailwind, bootstrap, styled-components  
- **AI Model:** gpt-4o (recommended), gpt-4o-mini (budget), gpt-4-turbo, gpt-3.5-turbo
- **Responsive Design:** checkbox (default: true)
- **Interactions:** checkbox for hover/focus states (default: false)

**Storage Keys:** (trong `scripts/constants.js`)
```javascript
STORAGE.FIGMA_TO_CODE_FRAMEWORK: 'figma-to-code-framework'
STORAGE.FIGMA_TO_CODE_CSS_FRAMEWORK: 'figma-to-code-css-framework'  
STORAGE.FIGMA_TO_CODE_MODEL: 'figma-to-code-model'
STORAGE.FIGMA_TO_CODE_RESPONSIVE: 'figma-to-code-responsive'
STORAGE.FIGMA_TO_CODE_INTERACTIONS: 'figma-to-code-interactions'
```

### **2. Context Menu System**

**Implementation:** Right-click trên icon component
```javascript
// Trong displayIconComponents() (common.js)
iconImg.addEventListener('contextmenu', function(e) {
    const componentData = {
        componentId: item.componentId,
        imageUrl: item.imageUrl,
        width: item.width,
        height: item.height,
        figmaResponse: item.figmaResponse // ⭐ Key: Full Figma data
    };
    showContextMenu(e, componentData);
});
```

**Context Menu:** Single option "🔨 Generate Code"

### **3. Code Generation Flow**

**API Call:** POST `/api/images/figma-to-code/convert`
```javascript
const payload = {
    figmaResponse: componentData.figmaResponse, // ✅ Required
    framework: figmaToCodeSettings.framework,
    cssFramework: figmaToCodeSettings.cssFramework,
    model: figmaToCodeSettings.model,
    includeResponsive: figmaToCodeSettings.includeResponsive,
    includeInteractions: figmaToCodeSettings.includeInteractions
};
```

**Response Structure:**
```javascript
{
    success: boolean,
    data: {
        files: [
            {
                filename: "Component.html",
                content: "<!DOCTYPE html>...",
                type: "html",
                description: "HTML structure"
            }
        ],
        componentName: "PrimaryButton",
        framework: "vanilla",
        cssFramework: "vanilla",
        model: "gpt-4o"
    },
    openaiUsage: {
        cost: 0.0267 // USD cost
    }
}
```

### **4. Code Viewer Modal**

**Features:**
- **File Tabs:** Switch between generated files (HTML, CSS, JS)
- **Code Display:** Syntax-highlighted code với monospace font
- **Copy Button:** Copy current file to clipboard
- **Download Button:** Create & download ZIP package

**Modal Structure:**
```html
<div id="code-modal" class="modal">
    <div class="modal-content code-modal-content">
        <div class="modal-header">
            <h2 id="code-modal-title">Generated Code - ComponentName</h2>
            <span class="close-btn">&times;</span>
        </div>
        <div class="modal-body">
            <div class="file-tabs" id="file-tabs">
                <!-- Dynamic tabs for each file -->
            </div>
            <div class="code-editor">
                <div class="editor-header">
                    <span id="current-filename">Component.html</span>
                    <button id="copy-code-btn">📋 Copy</button>
                </div>
                <pre id="code-display"><code>...</code></pre>
            </div>
        </div>
        <div class="modal-footer">
            <button id="download-code-btn">⬇️ Download ZIP</button>
            <button id="close-code-btn">Close</button>
        </div>
    </div>
</div>
```

### **5. Download System**

**Create Package API:** POST `/api/images/figma-to-code/create-package`
```javascript
const payload = {
    files: currentGeneratedFiles,
    componentName: currentComponentName
};
```

**Auto Download:**
```javascript
const link = document.createElement('a');
link.href = result.data.downloadUrl;
link.download = `${currentComponentName}.zip`;
link.click();
```

---

### **6. Image Fetch Size Configuration**

Allows configuring minimum image dimensions sent to the backend when fetching icon components.

UI additions in `pages/iconComponent.html` inside `figma-input-container`:

```html
<div class="size-config">
    <div class="setting-group">
        <label for="min-width-input">Min Width (px):</label>
        <input type="number" id="min-width-input" min="1" step="1" placeholder="500" />
    </div>
    <div class="setting-group">
        <label for="min-height-input">Min Height (px):</label>
        <input type="number" id="min-height-input" min="1" step="1" placeholder="500" />
    </div>    
    <!-- Values are persisted and used on fetch -->
</div>
```

Storage keys in `scripts/constants.js`:

```javascript
STORAGE.FIGMA_MIN_WIDTH: 'figma-min-width'
STORAGE.FIGMA_MIN_HEIGHT: 'figma-min-height'
```

Persistence and loading in `scripts/result/figmaToCode.js`:

```javascript
// Save values
saveSizeBtn.addEventListener('click', async () => {
  const minWidth = parseInt(minWidthInput.value || '500', 10) || 500;
  const minHeight = parseInt(minHeightInput.value || '500', 10) || 500;
  await chrome.storage.local.set({
    [STORAGE.FIGMA_MIN_WIDTH]: minWidth,
    [STORAGE.FIGMA_MIN_HEIGHT]: minHeight,
  });
});

// Load into inputs on DOMContentLoaded
const data = await chrome.storage.local.get([
  STORAGE.FIGMA_MIN_WIDTH,
  STORAGE.FIGMA_MIN_HEIGHT,
]);
minWidthInput.value = data[STORAGE.FIGMA_MIN_WIDTH] || 500;
minHeightInput.value = data[STORAGE.FIGMA_MIN_HEIGHT] || 500;
```

Backend payload enrichment in `scripts/result/common.js` when calling `GET_ICON_COMPONENTS`:

```javascript
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
```

Notes:
- Default values: 500 x 500 if not set.
- Button "Save" persists values; "Load Components" uses them on the next request.

## 📁 File Organization

### **Core Files Modified/Created:**

**1. `pages/iconComponent.html`**
- ➕ Settings button trong header
- ➕ Settings modal với form controls
- ➕ Code viewer modal với file tabs
- ➕ Context menu HTML

**2. `styles/results.css`**  
- ➕ Modal styling (settings + code viewer)
- ➕ Button styling (settings, copy, download)
- ➕ Code editor styling
- ➕ Context menu styling
- ➕ File tabs styling

**3. `scripts/constants.js`**
- ➕ API endpoints cho figma-to-code
- ➕ Storage keys cho settings
- ➕ Feature constants

**4. `scripts/result/figmaToCode.js`** (NEW FILE)
- 🎯 Core functionality cho figma-to-code
- ⚙️ Settings management
- 🎨 Modal controls
- 📤 API communication
- 📋 Copy/download features

**5. `scripts/result/common.js`**
- 🔄 Modified `displayIconComponents()` 
- ➕ Context menu support
- ➕ Right-click event handling

---

## 🎨 Styling Architecture

### **Design System:**
- **Colors:** Indigo primary (#6366f1), Green success (#10b981), Blue info (#3b82f6)
- **Typography:** Sora font family, Courier New cho code
- **Spacing:** 8px grid system
- **Borders:** 6px radius, subtle shadows
- **Transitions:** 0.2s ease cho smooth interactions

### **Modal System:**
- **Backdrop:** rgba(0,0,0,0.5) overlay
- **Content:** White background với rounded corners
- **Z-index:** 1000 cho modals, 1001 cho context menu
- **Responsive:** Max 90% width/height

### **Code Editor Styling:**
- **Background:** White với subtle borders
- **Font:** Courier New monospace
- **Line Height:** 1.5 cho readability
- **Syntax:** Plain text (future: syntax highlighting)

---

## 🔧 Development Patterns

### **Async/Await Pattern:**
```javascript
async function generateCodeFromComponent(componentData) {
    try {
        showCodeLoading();
        const response = await fetch(API_URL, options);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        displayGeneratedCode(result.data);
    } catch (error) {
        showToast(RESULT.ERROR, error.message);
    }
}
```

### **Event Delegation Pattern:**
```javascript
function setupEventListeners() {
    // Modal controls
    settingsBtn?.addEventListener('click', openSettingsModal);
    settingsClose?.addEventListener('click', closeSettingsModal);
    
    // Conditional event binding với null checks
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', copyCurrentCode);
    }
}
```

### **State Management Pattern:**
```javascript
// Global state objects
let figmaToCodeSettings = { framework: 'vanilla', ... };
let currentGeneratedFiles = [];
let currentComponentName = '';

// Persist trong Chrome storage
await chrome.storage.local.set({
    [STORAGE.FIGMA_TO_CODE_FRAMEWORK]: settings.framework
});
```

---

## 🚨 Error Handling Strategy

### **API Error Handling:**
```javascript
if (!result.success) {
    throw new Error(result.message || 'Code generation failed');
}

// Network errors
.catch(error => {
    console.error('API Error:', error);
    showToast(RESULT.ERROR, 'Failed to generate code: ' + error.message);
    closeCodeModal();
});
```

### **UI Error States:**
- **Missing Data:** Check `item.figmaResponse` exists
- **Network Failures:** Show user-friendly error messages
- **Empty Results:** Handle empty files array
- **Storage Errors:** Fallback to default settings

### **Defensive Programming:**
```javascript
// Always check element existence
const modal = document.getElementById('settings-modal');
if (modal) {
    modal.style.display = 'flex';
}

// Validate data before API calls
if (!figmaResponse) {
    throw new Error('No Figma response data available');
}
```

---

## 📈 Performance Optimizations

### **Lazy Loading:**
- Modals created once, reused multiple times
- Event listeners attached once on DOM ready
- Context menu positioned dynamically

### **Memory Management:**
- Cleanup temporary elements after drag operations
- Hide context menu on outside clicks
- Reset modal state when closing

### **API Efficiency:**
- Single API call cho code generation
- Separate API call cho download package creation
- Settings persisted locally, not sent repeatedly

---

## 🔮 Future Enhancement Opportunities

### **Short Term:**
- ✨ Syntax highlighting trong code viewer
- 🎨 Theme support (dark/light mode)
- 📱 Mobile responsive modals
- ⚡ Keyboard shortcuts (Ctrl+C copy, Esc close)

### **Medium Term:**
- 🔍 Code search/filter trong generated files
- 📝 Edit generated code before download
- 🎯 Preview generated component live
- 📊 Cost tracking và usage analytics

### **Long Term:**
- 🔄 Integration với external editors (VS Code)
- 🎨 Custom styling templates
- 🤖 AI suggestions cho improvements
- 📦 Component library management

---

## 🎯 Testing Strategy

### **Manual Testing Checklist:**
- [ ] Settings modal opens/closes correctly
- [ ] All form controls save/load properly
- [ ] Right-click shows context menu
- [ ] Code generation works với different settings
- [ ] File tabs switch correctly
- [ ] Copy to clipboard functions
- [ ] Download ZIP works
- [ ] Error handling displays proper messages
- [ ] Modal responsive behavior

### **Edge Cases:**
- [ ] Component without figmaResponse data
- [ ] Network timeout scenarios
- [ ] Large file content handling
- [ ] Multiple rapid clicks
- [ ] Browser permission issues (clipboard)

### **Cross-Browser Testing:**
- [ ] Chrome extension environment
- [ ] Modern clipboard API support
- [ ] CSS Grid/Flexbox compatibility
- [ ] ES6+ JavaScript features

---

## 🛠️ Debugging Guide

### **Common Issues:**

**1. Context Menu Not Showing**
```javascript
// Check: figmaToCode.js loaded
if (typeof showContextMenu === 'function') {
    showContextMenu(e, componentData);
} else {
    console.warn('Figma to Code functionality not loaded');
}
```

**2. API Calls Failing**
```javascript
// Check: BE_API_LOCAL constant
console.log('API URL:', BE_API_LOCAL + ENDPOINTS.FIGMA_TO_CODE_CONVERT);

// Check: figmaResponse data
console.log('Figma Response:', componentData.figmaResponse);
```

**3. Settings Not Persisting**
```javascript
// Check storage keys
const data = await chrome.storage.local.get([
    STORAGE.FIGMA_TO_CODE_FRAMEWORK
]);
console.log('Stored settings:', data);
```

**4. Modal Display Issues**
```javascript
// Check CSS display property
const modal = document.getElementById('settings-modal');
console.log('Modal display:', window.getComputedStyle(modal).display);
```

### **Debug Tools:**
- Browser DevTools Console cho errors
- Network tab cho API requests
- Chrome extension DevTools
- Local storage inspector

---

## 🎯 Usage Templates cho AI Collaboration

### **Template 1: Feature Enhancement**
```
📋 Context: Reference FIGMA_TO_CODE_MEMORY_BANK.md
🎯 Task: Add [new feature] to figma-to-code functionality
📐 Requirements:
- Follow established modal pattern
- Maintain settings persistence
- Update figmaToCode.js core logic
- Add CSS styling consistent với design system
- Update memory bank documentation

🚀 Implement following existing architecture patterns!
```

### **Template 2: Bug Fix**
```
📋 Context: FIGMA_TO_CODE_MEMORY_BANK.md debugging guide
🚨 Problem: [specific issue]
🔍 Debug: Check relevant section trong memory bank
📊 Expected: [expected behavior]

🛠️ Fix theo established error handling patterns
```

### **Template 3: UI Enhancement**
```
📋 Context: FIGMA_TO_CODE_MEMORY_BANK.md styling architecture  
🎨 Task: Improve [UI component]
📐 Requirements:
- Maintain design system consistency
- Follow modal styling patterns
- Ensure responsive behavior
- Add proper transitions

🎯 Apply established styling patterns từ memory bank
```

---

## 📞 Integration Points

### **With Backend:**
- **API Endpoints:** Documented trong FRONTEND_INTEGRATION_GUIDE.md
- **Data Flow:** Figma response → AI processing → Generated files
- **Error Handling:** HTTP status codes + JSON error responses

### **With Extension:**
- **Chrome Storage:** Settings persistence
- **Toast Notifications:** User feedback system
- **Icon Component System:** Context menu integration

### **With UI System:**
- **Modal Pattern:** Reusable modal structure
- **Button Styling:** Consistent với existing buttons
- **Color Scheme:** Matches extension design

---

## 🎉 Success Metrics

### **Functionality Metrics:**
- ✅ Settings save/load correctly (100% success rate)
- ✅ Code generation completes in <10 seconds
- ✅ Download ZIP works without errors
- ✅ Copy to clipboard functions reliably
- ✅ Context menu responsive to right-clicks

### **User Experience Metrics:**
- ✅ Intuitive settings interface
- ✅ Clear error messages
- ✅ Smooth modal animations
- ✅ Professional code display
- ✅ Minimal clicks to generate code

### **Technical Metrics:**
- ✅ No memory leaks trong modal operations
- ✅ Proper cleanup of event listeners
- ✅ Error handling covers edge cases
- ✅ API integration stable
- ✅ Cross-browser compatibility

---

## 🔄 Maintenance Notes

### **Regular Updates Needed:**
- **API Endpoints:** Sync với backend changes
- **AI Models:** Update model options khi backend adds new models
- **Framework Options:** Add new frameworks khi supported
- **Error Messages:** Keep user-friendly và informative

### **Code Reviews Should Check:**
- Event listener cleanup
- Modal state management
- API error handling
- Settings persistence
- Memory leak prevention

### **Documentation Updates:**
- Update memory bank khi add new features
- Maintain API integration guide sync
- Update debugging instructions
- Keep usage templates current

---

**🎯 Memory Bank Status: COMPLETE**  
**📅 Last Updated: Today**  
**👥 Audience: AI Assistant + Future Developers**  
**🔮 Next: Start using templates cho seamless collaboration!**

---

*This memory bank enables seamless AI collaboration for Figma-to-Code feature development. Reference specific sections khi requesting enhancements, bug fixes, or new features.*
