# 🚀 Frontend Quick Reference - Figma to HTML/CSS

## ⚡ TL;DR - Minimal Integration

```javascript
// 1. Get Figma data
const figmaData = await fetch('/api/images/from-sheet', {
  method: 'POST',
  body: JSON.stringify({
    figmaAccessToken: 'token',
    figmaFileId: 'file-id', 
    specificNodeId: ['component-id']
  })
});

// 2. Convert to HTML + CSS (returns file contents)
const result = await fetch('/api/images/figma-to-code/convert', {
  method: 'POST',
  body: JSON.stringify({
    figmaResponse: figmaData.data[0].figmaResponse
    // 🎯 No other params needed - defaults to HTML + CSS!
  })
});

// 3. Display files in UI
const files = result.data.files;
displayFiles(files); // Show code in editor

// 4. Download when user clicks button
async function download() {
  const packageResult = await fetch('/api/images/figma-to-code/create-package', {
    method: 'POST',
    body: JSON.stringify({
      files: files,
      componentName: result.data.componentName
    })
  });
  window.open(packageResult.data.downloadUrl);
}
```

---

## 📋 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/images/from-sheet` | POST | Extract Figma component data |
| `/api/images/figma-to-code/convert` | POST | **Convert to HTML/CSS** (returns content) |
| `/api/images/figma-to-code/create-package` | POST | **Create ZIP package for download** |
| `/api/images/figma-to-code/download/{file}` | GET | Download ZIP package |
| `/api/images/figma-to-code/options` | GET | Get available options |

---

## 🎯 Default Behavior

**Input:** Figma component data  
**Output:** File contents returned directly in response  
**Download:** Created on-demand via separate API call  
**Cost:** ~$0.02-0.04 per conversion  
**Time:** 3-8 seconds  

---

## 📝 Request Schema

### **Required**
```typescript
{
  figmaResponse: object  // From /from-sheet API
}
```

### **Optional (with defaults)**
```typescript
{
  framework: 'vanilla',        // HTML generation
  cssFramework: 'vanilla',     // CSS generation  
  model: 'gpt-4o',            // Best quality AI
  componentName: 'auto',       // From Figma name
  includeResponsive: true,     // Mobile-first
  includeInteractions: false   // Static only
}
```

---

## 💰 Model Pricing

| Model | Quality | Speed | Cost (per conversion) |
|-------|---------|-------|---------------------|
| `gpt-5-mini` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ~$ low (default in this app) |
| `o4-mini` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | higher than gpt-5-mini |
| `gpt-5` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Input $2.00 / Cached $0.50 / Output $8.00 |

---

## 🎨 Framework Options

```javascript
// HTML + CSS (Default)
{ }  // No framework params needed

// React + Tailwind  
{ framework: 'react', cssFramework: 'tailwind' }

// Vue + Bootstrap
{ framework: 'vue', cssFramework: 'bootstrap' }

// Angular + Vanilla CSS
{ framework: 'angular', cssFramework: 'vanilla' }
```

---

## 📁 Generated Files

### **HTML + CSS (Default)**
```
Component.zip
├── Button.html          # Complete HTML structure
├── Button.css           # Modern CSS styles
└── README.md           # Integration instructions
```

### **React + Tailwind**
```
Component.zip  
├── Button.jsx          # React component
├── Button.module.css   # CSS modules (if needed)
└── README.md          # Usage instructions
```

---

## 🛡️ Error Handling

```javascript
try {
  const result = await convertFigmaToCode(figmaData);
  if (result.success) {
    downloadFiles(result.data.downloadUrl);
  } else {
    showError(result.message);
  }
} catch (error) {
  showError('Conversion failed: ' + error.message);
}
```

---

## 🔧 Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Figma to Code Demo</title>
</head>
<body>
  <button onclick="convertComponent()">Convert Figma Component</button>
  <div id="status"></div>

  <script>
    async function convertComponent() {
      const status = document.getElementById('status');
      
      try {
        status.textContent = 'Converting...';
        
        // Your figma component data here
        const figmaResponse = { /* figma data */ };
        
        const result = await fetch('/api/images/figma-to-code/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ figmaResponse })
          // Default: HTML + CSS generation
        });
        
        const data = await result.json();
        
        if (data.success) {
          status.textContent = `Success! Cost: $${data.openaiUsage.cost}`;
          
          // Auto download
          window.open(data.data.downloadUrl);
        } else {
          status.textContent = 'Error: ' + data.message;
        }
        
      } catch (error) {
        status.textContent = 'Failed: ' + error.message;
      }
    }
  </script>
</body>
</html>
```

---

## 📞 Support

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Integration Help | Backend Team | < 2 hours |
| API Errors | Check logs first | - |
| Feature Requests | Product Team | 1-2 days |

---

## 🎯 Quick Tests

### **Test 1: Basic Conversion**
```bash
curl -X POST http://localhost:3000/api/images/figma-to-code/convert \
  -H "Content-Type: application/json" \
  -d '{"figmaResponse":{"id":"test","name":"Button","type":"FRAME"}}'
```

### **Test 2: Get Options**
```bash
curl http://localhost:3000/api/images/figma-to-code/options
```

### **Test 3: Health Check**
```bash
curl http://localhost:3000/api/images/figma-to-code/health
```

---

**🎉 You're ready to generate HTML + CSS from Figma!**

*Defaults (in this app): HTML + CSS + Responsive + GPT-5 Mini*

---

## ⚡ Quick Reference: SRS → Markdown (in Test Case Modal)

### Minimal Usage
```javascript
// Paste SRS text into #srs-description, then click Convert to Markdown
// Result is cached locally to avoid re-calling API when reopening
```

### Endpoint
```http
POST /api/images/srs-to-markdown/convert
```

### Storage Keys
- `STORAGE.SRS_TO_MARKDOWN_CACHE`
- `STORAGE.SRS_TO_MARKDOWN_MODEL`
- `STORAGE.SRS_TO_MARKDOWN_OUTPUT_FORMAT`
- `STORAGE.SRS_TO_MARKDOWN_PRESERVE_FORMATTING`

### Notes
- Max 50,000 chars; character counter included
- Copy options UI removed (simplified UX)
- Auto-load cached markdown when modal opens (if textarea empty)