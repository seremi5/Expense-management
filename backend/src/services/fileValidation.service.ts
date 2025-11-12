/**
 * File Validation Service
 * Validates uploaded files before sending to OCR
 */

import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { env } from '../config/env.js';

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

export class FileValidationService {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  private readonly maxSizeBytes: number;
  private readonly maxPdfPages: number;
  private readonly minImageWidth: number;
  private readonly minImageHeight: number;
  private readonly minPdfWidth: number;
  private readonly minPdfHeight: number;

  constructor() {
    this.maxSizeBytes = env.MAX_FILE_SIZE;
    this.maxPdfPages = env.MAX_PDF_PAGES;
    this.minImageWidth = env.MIN_IMAGE_WIDTH;
    this.minImageHeight = env.MIN_IMAGE_HEIGHT;
    this.minPdfWidth = env.MIN_PDF_WIDTH;
    this.minPdfHeight = env.MIN_PDF_HEIGHT;
  }

  /**
   * Validate file format/MIME type
   */
  validateFormat(mimeType: string): void {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      const allowed = this.allowedMimeTypes.join(', ');
      throw new FileValidationError(`Only ${allowed} formats are accepted. Got: ${mimeType}`);
    }
  }

  /**
   * Validate file size
   */
  validateSize(size: number): void {
    if (size > this.maxSizeBytes) {
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      const maxMB = env.MAX_FILE_SIZE_MB;
      throw new FileValidationError(
        `File size limit exceeded (${maxMB} MB). File size: ${sizeMB} MB`
      );
    }
  }

  /**
   * Validate PDF structure and properties
   */
  async validatePDF(buffer: Buffer): Promise<{ pageCount: number; width: number; height: number }> {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
      const pageCount = pdfDoc.getPageCount();

      // Check page count
      if (pageCount > this.maxPdfPages) {
        throw new FileValidationError(
          `This document has ${pageCount} pages. The maximum allowed is ${this.maxPdfPages}.`
        );
      }

      // Check if encrypted
      if (pdfDoc.isEncrypted) {
        throw new FileValidationError(
          'The file is encrypted and cannot be processed. Please upload an unprotected version.'
        );
      }

      // Check resolution of first page
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();

      if (width < this.minPdfWidth || height < this.minPdfHeight) {
        throw new FileValidationError(
          `The PDF resolution is too low: ${Math.round(width)}x${Math.round(height)}. ` +
          `The minimum required is ${this.minPdfWidth}x${this.minPdfHeight}.`
        );
      }

      return { pageCount, width: Math.round(width), height: Math.round(height) };
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw error;
      }

      // Check for specific PDF corruption patterns
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('encrypted')) {
        throw new FileValidationError(
          'The file is encrypted and cannot be processed. Please upload an unprotected version.'
        );
      }

      if (errorMessage.includes('trailer') || errorMessage.includes('startxref')) {
        throw new FileValidationError(
          'The PDF file is missing required structural data and cannot be processed.'
        );
      }

      throw new FileValidationError(
        'The PDF file could not be read. Please make sure it\'s a valid, non-corrupted document.'
      );
    }
  }

  /**
   * Validate image properties
   */
  async validateImage(buffer: Buffer): Promise<{ width: number; height: number; format: string }> {
    try {
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new FileValidationError('Unable to read image dimensions.');
      }

      if (metadata.width < this.minImageWidth || metadata.height < this.minImageHeight) {
        throw new FileValidationError(
          `The image resolution is too low: ${metadata.width}x${metadata.height}. ` +
          `The minimum required is ${this.minImageWidth}x${this.minImageHeight}.`
        );
      }

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format || 'unknown'
      };
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw error;
      }

      throw new FileValidationError(
        'The image file couldn\'t be opened. Please check the format and try again.'
      );
    }
  }

  /**
   * Validate file comprehensively
   */
  async validate(
    file: { mimetype: string; size: number },
    buffer: Buffer
  ): Promise<{
    mimeType: string;
    metadata: { width?: number; height?: number; pageCount?: number; format?: string };
  }> {
    // 1. Check format
    this.validateFormat(file.mimetype);

    // 2. Check size
    this.validateSize(file.size);

    // 3. Type-specific validation
    if (file.mimetype === 'application/pdf') {
      const pdfMetadata = await this.validatePDF(buffer);
      return {
        mimeType: file.mimetype,
        metadata: pdfMetadata
      };
    } else {
      const imageMetadata = await this.validateImage(buffer);
      return {
        mimeType: file.mimetype,
        metadata: imageMetadata
      };
    }
  }
}
