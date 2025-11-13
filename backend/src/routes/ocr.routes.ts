/**
 * OCR Routes
 * API endpoints for document OCR extraction
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { OCRService } from '../services/ocr.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import { authenticate } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

const router = Router();

// Apply authentication to all OCR routes
router.use(authenticate);

/**
 * Map VAT breakdown array to individual VAT fields
 * Handles Spanish VAT rates: 21%, 10%, 4%/5%, 0%
 */
function mapVATBreakdown(taxBreakdown: Array<{ tax_rate: number; tax_base: number; tax_amount: number }> | undefined) {
  const result = {
    vat21Base: undefined as number | undefined,
    vat21Amount: undefined as number | undefined,
    vat10Base: undefined as number | undefined,
    vat10Amount: undefined as number | undefined,
    vat4Base: undefined as number | undefined,
    vat4Amount: undefined as number | undefined,
    vat0Base: undefined as number | undefined,
    vat0Amount: undefined as number | undefined,
  };

  if (!taxBreakdown || !Array.isArray(taxBreakdown)) {
    return result;
  }

  // Map each tax band to the corresponding field
  for (const band of taxBreakdown) {
    const rate = band.tax_rate;
    const base = band.tax_base ? band.tax_base / 100 : undefined;
    // For 0% rate, amount must always be 0
    const amount = rate === 0 ? 0 : (band.tax_amount ? band.tax_amount / 100 : undefined);

    // Match rate to field (with tolerance for 4% vs 5%)
    if (rate >= 20 && rate <= 22) {
      // 21% VAT
      result.vat21Base = base;
      result.vat21Amount = amount;
    } else if (rate >= 9 && rate <= 11) {
      // 10% VAT
      result.vat10Base = base;
      result.vat10Amount = amount;
    } else if (rate >= 4 && rate <= 5) {
      // 4% or 5% VAT (reduced rate)
      result.vat4Base = base;
      result.vat4Amount = amount;
    } else if (rate === 0) {
      // 0% VAT (exempt) - amount must be 0
      result.vat0Base = base;
      result.vat0Amount = 0;
    }
  }

  return result;
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files in uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhex-originalname
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${timestamp}-${randomHex}-${sanitizedName}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

// Create OCR service instance
const ocrService = new OCRService();

/**
 * POST /api/ocr/extract
 * Extract data from any financial document (auto-detects type)
 */
router.post(
  '/extract',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      console.log('Received document extraction request:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        savedAs: req.file.filename,
        path: req.file.path
      });

      // Read file buffer from disk (multer saves it but we need buffer for OCR)
      const fs = await import('fs/promises');
      const fileBuffer = await fs.readFile(req.file.path);

      const result = await ocrService.extractDocument(
        {
          mimetype: req.file.mimetype,
          size: req.file.size,
          originalname: req.file.originalname
        },
        fileBuffer
      );

      if (!result.success) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          error: result.error,
          duration: result.duration,
          metadata: result.metadata
        });
      }

      // Helper function to clean Spanish NIF/CIF
      const cleanNIF = (nif: string | undefined): string | undefined => {
        if (!nif) return undefined;
        // Spanish NIF/CIF format: Letter + 7-8 digits + optional check character
        // Remove any extra digits beyond valid format
        const match = nif.match(/^([A-Z]\d{7,8}[A-Z0-9]?)/);
        return match ? match[1] : nif;
      };

      // Generate file URL (relative to server root)
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileName = req.file.originalname;

      // Map VAT breakdown to individual fields
      console.log('Raw tax_breakdown from Gemini:', JSON.stringify(result.data?.tax_breakdown, null, 2));
      const vatMapping = mapVATBreakdown(result.data?.tax_breakdown);
      console.log('Mapped VAT fields:', vatMapping);

      // Map OCR response to frontend format
      const mappedData = {
        vendorName: result.data?.counterparty?.name || '',
        vendorNif: cleanNIF(result.data?.counterparty?.vat_number || (result.data?.counterparty as any)?.tax_id),
        invoiceNumber: result.data?.document_number || '',
        invoiceDate: result.data?.date || '',
        totalAmount: result.data?.total_amount ? result.data.total_amount / 100 : 0, // Convert cents to euros
        taxBase: result.data?.subtotal ? result.data.subtotal / 100 : undefined,
        // VAT breakdown by rate
        vat21Base: vatMapping.vat21Base,
        vat21Amount: vatMapping.vat21Amount,
        vat10Base: vatMapping.vat10Base,
        vat10Amount: vatMapping.vat10Amount,
        vat4Base: vatMapping.vat4Base,     // 4% or 5% rate
        vat4Amount: vatMapping.vat4Amount,
        vat0Base: vatMapping.vat0Base,
        vat0Amount: vatMapping.vat0Amount,
        // File information
        fileUrl,
        fileName,
        lineItems: result.data?.line_items?.map((item: any) => {
          const subtotal = item.subtotal ? item.subtotal / 100 : 0;
          const vatRate = item.tax_rate || 0;
          const total = item.total ? item.total / 100 : 0;

          // Calculate VAT amount
          const vatAmount = total > 0 && subtotal > 0
            ? Math.round((total - subtotal) * 100) / 100
            : Math.round((subtotal * vatRate) / 100 * 100) / 100;

          const unitPrice = subtotal / (item.quantity || 1);

          return {
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: Math.round(unitPrice * 100) / 100,
            subtotal,
            vatRate,
            vatAmount,
            total: total > 0 ? total : (subtotal + vatAmount)
          };
        }) || []
      };

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: mappedData,
        warnings: result.warnings,
        errors: result.errors,
        duration: result.duration,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Route error:', error);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.OCR_FAILED
      });
    }
  }
);

/**
 * POST /api/ocr/extract/invoice
 * Extract data from an invoice document (specific endpoint)
 */
router.post(
  '/extract/invoice',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      console.log('Received invoice extraction request:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const result = await ocrService.extractInvoice(
        {
          mimetype: req.file.mimetype,
          size: req.file.size,
          originalname: req.file.originalname
        },
        req.file.buffer
      );

      if (!result.success) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          error: result.error,
          duration: result.duration,
          metadata: result.metadata
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        warnings: result.warnings,
        errors: result.errors,
        duration: result.duration,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Route error:', error);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.OCR_FAILED
      });
    }
  }
);

/**
 * POST /api/ocr/extract/receipt
 * Extract data from a receipt document
 */
router.post(
  '/extract/receipt',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      console.log('Received receipt extraction request:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      const result = await ocrService.extractReceipt(
        {
          mimetype: req.file.mimetype,
          size: req.file.size,
          originalname: req.file.originalname
        },
        req.file.buffer
      );

      if (!result.success) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          error: result.error,
          duration: result.duration,
          metadata: result.metadata
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        warnings: result.warnings,
        errors: result.errors,
        duration: result.duration,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Route error:', error);

      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.OCR_FAILED
      });
    }
  }
);

/**
 * GET /api/ocr/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'OCR service is operational',
    timestamp: new Date().toISOString()
  });
});

export default router;
