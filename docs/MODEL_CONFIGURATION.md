# AI Model Configuration

## Updated Models (Only 2 Models Available)

### 1. GPT-5 Mini (Cost-effective)
- **Model ID**: `gpt-5-mini`
- **Label**: "GPT-5 Mini (Cost-effective)"
- **Pricing** (per 1K tokens):
  - Input: $0.25
  - Cached Input: $0.025
  - Output: $2.00
- **Limits**:
  - Tokens Per Minute: 200,000 TPM
  - Requests Per Minute: 500 RPM
  - Tokens Per Day: 2,000,000 TPD

### 2. O4 Mini (Higher Quality)
- **Model ID**: `o4-mini`
- **Label**: "O4 Mini (Higher quality)"
- **Pricing** (per 1K tokens):
  - Input: $1.10
  - Cached Input: $0.275
  - Output: $4.40
- **Limits**:
  - Tokens Per Minute: 200,000 TPM
  - Requests Per Minute: 500 RPM
  - Tokens Per Day: 2,000,000 TPD

## Default Configuration

- **Default Model**: GPT-5 Mini (for both Figma-to-Code and Test Case Generation)
- **Cost Advantage**: GPT-5 Mini is approximately 77% cheaper for input and 55% cheaper for output compared to O4 Mini

## Implementation Changes

### Constants Structure
All configurations are now defined in `scripts/constants.js`:
- `AI_MODELS`: Model definitions with pricing and limits (LIMITED TO 2 MODELS ONLY)
- `DEFAULT_MODELS`: Default model selection for each feature
- `FRAMEWORKS`: Framework options for code generation and testing
- `SIZE_PRESETS`: Size configurations with pixel dimensions
- `DEFAULT_SETTINGS`: Complete default configuration

### HTML Changes
- **REMOVED ALL OLD MODELS**: Only gpt-5-mini and o4-mini available in dropdowns
- **Hardcoded options**: Updated to show only the 2 approved models
- Added JavaScript initialization to populate other dropdowns from constants
- Model selections are now limited and controlled

### Script Updates
- Updated `figmaToCode.js` to use new model constants for default values
- Updated `testCaseGeneration.js` to use new model constants for default values
- Added utility functions in `utils.js` for:
  - Dropdown population from constants
  - Model pricing calculations (`getModelPricing()`)
  - Model limits information (`getModelLimits()`)
  - Cost estimation (`calculateModelCost()`)
- All fallback values now reference constants instead of hardcoded strings

### Cost Calculation Features
New utility functions for cost management:
```javascript
// Get pricing for a model
const pricing = getModelPricing('gpt-5-mini');
// Returns: { input: 0.25, cachedInput: 0.025, output: 2.00 }

// Calculate cost for usage
const cost = calculateModelCost('gpt-5-mini', 1000, 500);
// Returns estimated cost in USD

// Get rate limits
const limits = getModelLimits('o4-mini');
// Returns: { tokensPerMinute: 200000, requestsPerMinute: 500, tokensPerDay: 2000000 }
```

## Benefits

1. **Centralized Configuration**: All settings are defined in one place
2. **Consistency**: Same defaults across all components
3. **Maintainability**: Easy to update models, pricing, or limits
4. **Cost Control**: Limited to only the two specified models
5. **Type Safety**: Structured configuration reduces errors
6. **Future-Proof**: Easy to add new models or modify existing ones

## Usage

The configuration automatically applies when:
- User opens settings modals
- Page loads for the first time
- Storage is not available (fallback to defaults)
- Invalid model IDs are encountered in storage

All pricing information is available programmatically for cost calculations and user interface displays.
