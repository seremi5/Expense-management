import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ocrApi } from '@/lib/api'
import type { OCRExtractResponse } from '@/types/api.types'

interface OCRUploadProps {
  onExtractSuccess: (data: OCRExtractResponse) => void
  onExtractError?: (error: Error) => void
}

export function OCRUpload({ onExtractSuccess, onExtractError }: OCRUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedFileTypes = '.pdf,.jpg,.jpeg,.png'
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      setError('L\'arxiu és massa gran. Màxim 10MB.')
      return
    }

    // Validate file type
    const fileType = selectedFile.type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(fileType)) {
      setError('Tipus d\'arxiu no vàlid. Utilitza PDF, JPG o PNG.')
      return
    }

    setFile(selectedFile)
    setError(null)
    setSuccess(false)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await ocrApi.extract(file)
      setSuccess(true)
      onExtractSuccess(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al processar el document'
      setError(errorMessage)
      if (onExtractError && err instanceof Error) {
        onExtractError(err)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        className="hidden"
      />

      {!file ? (
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
          onClick={handleUploadClick}
        >
          <div className="p-8 text-center">
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Puja la factura o rebut
            </p>
            <p className="text-xs text-gray-500 mb-4">
              PDF, JPG o PNG (màx. 10MB)
            </p>
            <Button type="button" variant="outline" size="sm">
              Seleccionar arxiu
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

              {success && (
                <div className="flex items-center gap-1.5 mt-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Dades extretes correctament</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-1.5 mt-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{error}</span>
                </div>
              )}
            </div>

            {!isProcessing && !success && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {!success && (
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                onClick={handleExtract}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processant...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Extreure dades
                  </>
                )}
              </Button>
              {!isProcessing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                >
                  Canviar
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      <p className="text-xs text-gray-500">
        Puja una factura o rebut per extreure automàticament les dades mitjançant OCR
      </p>
    </div>
  )
}
