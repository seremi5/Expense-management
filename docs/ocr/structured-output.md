# Structured Output with Gemini API

## Overview

Gemini API now supports **JSON Schema** for structured outputs, enabling guaranteed, type-safe responses that adhere to your defined schema. This is critical for financial document processing where data consistency is paramount.

## Recent Updates (January 2025)

Google recently added full JSON Schema support to all actively supported Gemini models:
- ✅ Support for `anyOf`, `$ref`, and advanced JSON Schema keywords
- ✅ Implicit property ordering (maintains key order from schema)
- ✅ Works with Pydantic (Python) and Zod (TypeScript) out-of-the-box
- ✅ Available in OpenAI compatibility API

## Configuration

Set two parameters in the generation config:

```json
{
  "contents": [...],
  "generationConfig": {
    "response_mime_type": "application/json",
    "response_schema": {
      // Your JSON Schema here
    }
  }
}
```

## Benefits

1. **Predictable Output**: Guaranteed valid JSON matching your schema
2. **Type Safety**: Ensures correct data types (string, number, boolean, etc.)
3. **Format Validation**: Enforces structure and required fields
4. **Programmatic Refusal Detection**: Model can refuse within schema constraints
5. **Simplified Prompting**: Less need for output format instructions in prompts

## JSON Schema Format

### Basic Structure

```json
{
  "type": "object",
  "properties": {
    "invoice_number": {
      "type": "string",
      "description": "The invoice reference number"
    },
    "total_amount": {
      "type": "number",
      "description": "Total amount in minor units (cents)"
    },
    "currency": {
      "type": "string",
      "description": "ISO 4217 currency code"
    },
    "invoice_date": {
      "type": "string",
      "format": "date",
      "description": "Invoice date in YYYY-MM-DD format"
    }
  },
  "required": ["invoice_number", "total_amount", "currency"]
}
```

### Nested Objects

```json
{
  "type": "object",
  "properties": {
    "supplier": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "address": {
          "type": "object",
          "properties": {
            "street": {"type": "string"},
            "city": {"type": "string"},
            "postal_code": {"type": "string"},
            "country": {"type": "string"}
          }
        }
      }
    }
  }
}
```

### Arrays

```json
{
  "type": "object",
  "properties": {
    "line_items": {
      "type": "array",
      "description": "ALL line items from the invoice",
      "items": {
        "type": "object",
        "properties": {
          "description": {"type": "string"},
          "quantity": {"type": "number"},
          "unit_price": {"type": "number"},
          "total": {"type": "number"}
        },
        "required": ["description", "quantity", "unit_price", "total"]
      }
    }
  }
}
```

### Enums

```json
{
  "type": "object",
  "properties": {
    "document_type": {
      "type": "string",
      "enum": ["Invoice", "Receipt", "CreditNote", "Other"],
      "description": "Type of financial document"
    },
    "currency": {
      "type": "string",
      "enum": ["EUR", "USD", "GBP", "CHF"],
      "description": "Currency code"
    }
  }
}
```

### Nullable Fields

For optional fields that can be null:

```json
{
  "type": "object",
  "properties": {
    "vat_number": {
      "type": ["string", "null"],
      "description": "VAT number if explicitly stated, otherwise null"
    },
    "due_date": {
      "type": ["string", "null"],
      "format": "date",
      "description": "Payment due date, null if not specified"
    }
  }
}
```

## Full Example for Invoice Extraction

```json
{
  "contents": [{
    "parts": [
      {
        "text": "Extract all information from this invoice with maximum accuracy. This is a financial document."
      },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "BASE64_IMAGE"
        }
      }
    ]
  }],
  "generationConfig": {
    "response_mime_type": "application/json",
    "response_schema": {
      "type": "object",
      "properties": {
        "invoice_number": {
          "type": ["string", "null"]
        },
        "invoice_date": {
          "type": ["string", "null"],
          "description": "Format: YYYY-MM-DD"
        },
        "due_date": {
          "type": ["string", "null"],
          "description": "Format: YYYY-MM-DD"
        },
        "currency": {
          "type": ["string", "null"],
          "description": "ISO 4217 code"
        },
        "supplier": {
          "type": ["object", "null"],
          "properties": {
            "name": {"type": ["string", "null"]},
            "vat": {"type": ["string", "null"]},
            "iban": {"type": ["string", "null"]},
            "email": {"type": ["string", "null"]},
            "address": {
              "type": ["object", "null"],
              "properties": {
                "street_and_number": {"type": ["string", "null"]},
                "city": {"type": ["string", "null"]},
                "postal_code": {"type": ["string", "null"]},
                "country": {"type": ["string", "null"]}
              }
            }
          }
        },
        "total_excl_vat": {
          "type": ["number", "null"],
          "description": "Amount in minor units (cents)"
        },
        "total_inc_vat": {
          "type": ["number", "null"],
          "description": "Amount in minor units (cents)"
        },
        "total_vat_amount": {
          "type": ["number", "null"],
          "description": "Amount in minor units (cents)"
        },
        "line_items": {
          "type": "array",
          "description": "Extract ALL line items",
          "items": {
            "type": "object",
            "properties": {
              "product": {"type": "string"},
              "description": {"type": ["string", "null"]},
              "quantity": {"type": "number"},
              "unit_price": {"type": "number"},
              "total_excl_vat": {"type": "number"},
              "total_inc_vat": {"type": "number"},
              "vat_percent": {"type": ["number", "null"]}
            },
            "required": ["product", "quantity", "unit_price"]
          }
        }
      }
    }
  }
}
```

## Advanced Features

### Using `anyOf` for Multiple Types

```json
{
  "amount": {
    "anyOf": [
      {"type": "number"},
      {"type": "null"}
    ]
  }
}
```

### Using `$ref` for Reusable Schemas

```json
{
  "definitions": {
    "Address": {
      "type": "object",
      "properties": {
        "street": {"type": "string"},
        "city": {"type": "string"},
        "country": {"type": "string"}
      }
    }
  },
  "properties": {
    "supplier_address": {"$ref": "#/definitions/Address"},
    "recipient_address": {"$ref": "#/definitions/Address"}
  }
}
```

### Property Ordering (Gemini 2.5+)

The API maintains the same key order as your schema:

```json
{
  "properties": {
    "invoice_number": {...},  // Will appear first
    "date": {...},            // Will appear second
    "amount": {...}           // Will appear third
  }
}
```

## Integration with BAML

Your existing BAML prompts can be converted to Gemini's JSON Schema format. BAML's `ctx.output_format` generates the schema automatically.

### BAML Class

```
class Invoice {
  invoice_number string?
  total_inc_vat int?
  line_items LineItem[]
}

class LineItem {
  product string
  quantity float
  unit_price int
}
```

This maps to JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "invoice_number": {"type": ["string", "null"]},
    "total_inc_vat": {"type": ["integer", "null"]},
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "product": {"type": "string"},
          "quantity": {"type": "number"},
          "unit_price": {"type": "integer"}
        },
        "required": ["product", "quantity", "unit_price"]
      }
    }
  }
}
```

## Best Practices

### 1. Use Descriptive Field Names

❌ Bad:
```json
{"field1": {"type": "string"}}
```

✅ Good:
```json
{"invoice_number": {"type": "string", "description": "Invoice reference as shown on document"}}
```

### 2. Include Descriptions

Descriptions help the model understand what to extract:

```json
{
  "total_excl_vat": {
    "type": "number",
    "description": "Total amount excluding VAT in minor units (cents). For German invoices, look for 'Ihre Kosten' not 'Zwischensumme'"
  }
}
```

### 3. Handle Minor Units Consistently

For financial amounts, always use integers in minor units:

```json
{
  "amount": {
    "type": "integer",
    "description": "Amount in cents (e.g., $12.50 = 1250)"
  }
}
```

### 4. Make Fields Nullable When Appropriate

Use `["type", "null"]` for optional fields:

```json
{
  "vat_number": {
    "type": ["string", "null"],
    "description": "Only if explicitly stated, otherwise null"
  }
}
```

### 5. Validate Arrays Are Populated

For critical arrays like line items:

```json
{
  "line_items": {
    "type": "array",
    "description": "MANDATORY: Extract ALL line items. Check all pages.",
    "minItems": 0
  }
}
```

## Error Handling

### Invalid Schema

```json
{
  "error": {
    "code": 400,
    "message": "Invalid schema: ..."
  }
}
```

Check:
- JSON syntax is valid
- All required fields are present
- Types are correctly specified

### Model Cannot Match Schema

The model will do its best to match the schema. If it cannot extract certain fields, it will return `null` for nullable fields or omit optional fields.

## Validation After Extraction

Always validate the response:

```javascript
const response = await fetch(API_URL, requestOptions);
const data = await response.json();

// Validate response
if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
  throw new Error('No response from model');
}

const extracted = JSON.parse(data.candidates[0].content.parts[0].text);

// Validate required fields
if (!extracted.invoice_number) {
  console.warn('Missing invoice number');
}

// Validate calculations
const lineItemsTotal = extracted.line_items.reduce(
  (sum, item) => sum + item.total_inc_vat,
  0
);

if (Math.abs(lineItemsTotal - extracted.total_inc_vat) > 1) {
  console.warn('Line items don\'t sum to total');
}
```

## Testing Your Schema

Use Google AI Studio to test your schema interactively:
1. Go to https://aistudio.google.com
2. Select Gemini 2.0 Flash
3. Enable "JSON mode"
4. Paste your schema
5. Test with sample images

## Resources

- [Official Structured Output Docs](https://ai.google.dev/gemini-api/docs/structured-output)
- [JSON Schema Reference](https://json-schema.org/understanding-json-schema)
- [Google Blog: Structured Outputs](https://blog.google/technology/developers/gemini-api-structured-outputs/)
