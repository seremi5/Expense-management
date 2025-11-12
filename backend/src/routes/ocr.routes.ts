/**
 * OCR Routes
 * API endpoints for document OCR extraction
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { OCRService } from '../services/ocr.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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
        mimetype: req.file.mimetype
      });

      const result = await ocrService.extractDocument(
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
