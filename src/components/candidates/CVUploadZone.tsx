// src/components/candidates/CVUploadZone.tsx
import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseCV, validateCVFile, type ParsedCV } from "@/utils/advancedCVParser";

// Simple Progress component if not installed
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

interface CVUploadZoneProps {
  onFileSelect: (file: File, parsedData: ParsedCV) => void;
  onFileRemove: () => void;
  disabled?: boolean;
}

export function CVUploadZone({ onFileSelect, onFileRemove, disabled }: CVUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedCV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    
    // Validate file
    const validation = validateCVFile(file);
    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const parsed = await parseCV(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setParsedData(parsed);
      onFileSelect(file, parsed);
      
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Error parsing CV:', error);
      setError(error.message || 'Không thể phân tích CV');
      setSelectedFile(null);
      setParsedData(null);
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemove();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current } as any);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        id="cv-upload"
        className="hidden"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
      />
      
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          selectedFile && !error
            ? 'border-green-400 bg-green-50'
            : error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {selectedFile && !error ? (
          // File selected successfully
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">
                ✓ {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-600">
                  Đang phân tích CV... {uploadProgress}%
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <label htmlFor="cv-upload">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button" 
                  asChild
                  disabled={isUploading}
                >
                  <span>Chọn file khác</span>
                </Button>
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-700"
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-1" />
                Xóa file
              </Button>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">
                Lỗi tải file
              </p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          // Initial state
          <label htmlFor="cv-upload" className="cursor-pointer block">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Kéo thả file CV vào đây hoặc click để chọn
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              type="button" 
              disabled={disabled || isUploading}
            >
              {isUploading ? 'Đang xử lý...' : 'Chọn file'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Hỗ trợ: PDF, DOCX, DOC, TXT (tối đa 5MB)
            </p>
          </label>
        )}
      </div>
      
      {/* Parsed Data Preview */}
      {parsedData && !isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                Đã phân tích CV thành công
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              {Object.keys(parsedData).filter(k => parsedData[k as keyof ParsedCV]).length - 1} trường
            </Badge>
          </div>
          
          <div className="text-xs text-blue-700 space-y-1.5">
            {parsedData.email && (
              <div className="flex items-center gap-2">
                <span className="font-medium">📧 Email:</span>
                <span>{parsedData.email}</span>
              </div>
            )}
            {parsedData.phone && (
              <div className="flex items-center gap-2">
                <span className="font-medium">📱 SĐT:</span>
                <span>{parsedData.phone}</span>
              </div>
            )}
            {parsedData.university && (
              <div className="flex items-center gap-2">
                <span className="font-medium">🎓 Trường:</span>
                <span>{parsedData.university}</span>
              </div>
            )}
            {parsedData.skills && parsedData.skills.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="font-medium">💼 Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {parsedData.skills.slice(0, 5).map((skill, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs bg-white text-blue-600 border-blue-200"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {parsedData.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs bg-white text-blue-600">
                      +{parsedData.skills.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}