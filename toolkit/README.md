# ZenKit - Development Toolkit for ZenAdmin

A comprehensive development toolkit inspired by ClaudeKit, designed to accelerate development in the ZenAdmin project while maintaining microservices architecture principles.

## Features

### 🎨 Code Generators
- **Service Generator**: Create service files following BaseService pattern with optional caching
- **Page Generator**: Generate CRUD pages (index, create, edit, detail)
- **Component Generator**: Create reusable components (forms, modals, lists, cards)
- **Form Generator**: Generate forms with validation
- **CRUD Generator**: Complete CRUD functionality in one command

### 🛠️ Utilities
- **File Utils**: File system operations
- **String Utils**: String manipulation (camelCase, PascalCase, kebab-case, etc.)
- **Validation Utils**: Common validation functions
- **API Utils**: API request/response handling, debounce, throttle, retry
- **Performance Utils**: Performance monitoring and measurement

### ✅ Validators
- **Schema Validator**: Zod-based schema validation
- **Form Validator**: Client-side form validation
- **Business Rules Validator**: Microservices architecture compliance

### 📝 Templates
- Pre-built templates for services, components, pages, and tests
- Customizable with placeholders

### 🖥️ CLI Tool
Command-line interface for quick code generation

## Installation

```bash
npm install
```

## Usage

### Using Generators Programmatically

```typescript
import { generateCRUD, generateServiceFile, generatePageFiles } from './toolkit'

// Generate complete CRUD
const files = generateCRUD({
  name: 'products',
  entityName: 'Product',
  displayName: 'Product',
  fields: [
    { name: 'name', type: 'text', label: 'Product Name', required: true },
    { name: 'price', type: 'number', label: 'Price', required: true },
    { name: 'description', type: 'textarea', label: 'Description' }
  ],
  hasCache: true,
  hasModal: true
})

// Write files
files.forEach(file => {
  writeFile(file.path, file.content)
})
```

### Using CLI

```bash
# Generate CRUD
node toolkit/cli generate:crud products --entity Product --display "Product" --cache --modal

# Generate service only
node toolkit/cli generate:service products --entity Product --cache

# Generate pages only
node toolkit/cli generate:page products --entity Product

# Generate component
node toolkit/cli generate:component ProductModal --type modal
```

### Using Utilities

```typescript
import { toCamelCase, toPascalCase, toKebabCase } from './toolkit/utils'
import { isEmail, isRequired, validate } from './toolkit/utils'
import { performanceMonitor } from './toolkit/utils'

// String utilities
const camel = toCamelCase('product-name') // productName
const pascal = toPascalCase('product-name') // ProductName
const kebab = toKebabCase('ProductName') // product-name

// Validation
const emailValid = isEmail('test@example.com') // true
const result = validate('test@example.com', [
  { validator: isRequired, message: 'Required' },
  { validator: isEmail, message: 'Invalid email' }
])

// Performance monitoring
await performanceMonitor.measureAsync('fetchProducts', async () => {
  return await productsService.getList()
})

const report = performanceMonitor.getReport('fetchProducts')
console.log(`P95: ${report.p95}ms, P99: ${report.p99}ms`)
```

### Using Validators

```typescript
import { SchemaValidator, commonSchemas } from './toolkit/validators'
import { FormValidator, commonValidationRules } from './toolkit/validators'
import { createMicroservicesValidator } from './toolkit/validators'

// Schema validation
const productSchema = z.object({
  name: z.string().min(1),
  email: commonSchemas.email,
  price: commonSchemas.positiveNumber
})

const validator = new SchemaValidator(productSchema)
const result = validator.validateSafe(data)

// Form validation
const formValidator = new FormValidator()
formValidator.addField('email', [
  commonValidationRules.required(),
  commonValidationRules.email()
])

const validationResult = formValidator.validate(formData)

// Microservices validation
const msValidator = createMicroservicesValidator()
const result = await msValidator.validate({
  imports: sourceImports,
  serviceName: 'products'
})
```

## Architecture Principles

This toolkit enforces microservices best practices:

✅ **Domain Isolation**: Each service handles its own domain
✅ **Loose Coupling**: Services communicate via APIs or events
✅ **No Cross-Service DB Access**: Services don't access other services' databases
✅ **Outbox Pattern**: Reliable event publishing
✅ **API Versioning**: All APIs must be versioned
✅ **No Circular Dependencies**: Prevents service coupling

## Project Structure

```
toolkit/
├── generators/          # Code generators
│   ├── service-generator.ts
│   ├── page-generator.ts
│   ├── component-generator.ts
│   ├── crud-generator.ts
│   └── form-generator.ts
├── utils/              # Utility functions
│   ├── file-utils.ts
│   ├── string-utils.ts
│   ├── validation-utils.ts
│   ├── api-utils.ts
│   └── performance-utils.ts
├── validators/         # Validation tools
│   ├── schema-validator.ts
│   ├── form-validator.ts
│   └── business-rules-validator.ts
├── templates/          # Code templates
│   ├── service-template.ts
│   ├── component-template.ts
│   ├── page-template.ts
│   └── test-template.ts
├── cli/               # CLI tool
│   └── index.ts
└── index.ts           # Main export
```

## Examples

See the `/examples` directory for complete usage examples.

## Contributing

Follow the project's coding standards and microservices principles when contributing.

## License

MIT
