# Gemini 2.5 Flash Lite API Overview for OCR

## Introduction

Gemini 2.5 Flash Lite is Google's fastest and most budget-friendly multimodal AI model, optimized for low latency. It offers excellent OCR capabilities with exceptional speed and cost-effectiveness, making it ideal for high-volume document processing.

## Key Capabilities

### Multimodal Input & Output

- **Inputs**: Text, images, audio, and video
- **Outputs**: Text, audio, and images (multimodal generation)
- **Single API Call**: Generate responses with multiple modalities through one API call

### OCR Performance

- **Context Window**: 1 million tokens (~1,500 pages in a single operation)
- **Visual Understanding**: Understands both visual elements and textual content simultaneously
- **Edge Case Handling**: Excels at:
  - Handwritten annotations
  - Watermarks
  - Unusual fonts
  - Complex layouts
  - Multi-language documents (German, English, etc.)

### Speed & Performance

- **2x Faster**: Doubles the speed of Gemini 1.5 Pro
- **Higher Performance**: Improved benchmarks across key metrics
- **Generally Available**: In Gemini API via Google AI Studio and Vertex AI

## API Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent
```

### Authentication

```bash
-H 'X-goog-api-key: YOUR_API_KEY'
```

**IMPORTANT**: Never hardcode API keys. Use environment variables.

## Pricing & Rate Limits

- **Higher rate limits** compared to previous versions
- **Simplified pricing structure**
- Check latest pricing at: https://ai.google.dev/pricing

## Use Cases for Financial Document Processing

1. **Invoice Extraction**: Supplier details, line items, totals, tax information
2. **Receipt Processing**: Merchant info, items purchased, amounts
3. **Credit Note Analysis**: Reference numbers, amounts, counterparty details
4. **Multi-page Documents**: Handle complex invoices spanning multiple pages
5. **International Documents**: Process documents in various languages and formats

## Availability

- **Gemini API**: via Google AI Studio
- **Vertex AI**: Google Cloud Platform
- **Status**: Generally Available (GA)

## Model Variants

- **gemini-2.5-flash**: Latest version with enhanced capabilities
- **gemini-2.5-flash-lite**: Fastest, most cost-effective version (currently in use)
- **gemini-2.0-flash**: Previous generation standard model

## Next Steps

- [Image Input Methods](./image-input-methods.md)
- [Structured Output with JSON Schema](./structured-output.md)
- [OCR Implementation Guide](./ocr-implementation-guide.md)
- [Error Handling Best Practices](./error-handling.md)
