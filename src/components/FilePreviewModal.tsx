import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Eye, AlertCircle } from 'lucide-react';
import { getDownloadUrl } from '../services/files';

// Define the UiFile type locally to avoid import issues
interface UiFile {
  id: string;
  name: string;
  type: 'folder' | 'image' | 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'file';
  sizeBytes: number;
  modified: string;
  shared: boolean;
  starred: boolean;
}

interface FilePreviewModalProps {
  file: UiFile;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = await getDownloadUrl(file.id);

        if (file.type === 'image') {
          setPreviewUrl(url);
        } else if (file.type === 'pdf') {
          setPreviewUrl(url);
        } else if (file.type === 'document' || file.type === 'spreadsheet' || file.type === 'presentation') {
          // For office documents, show preview message
          setPreviewUrl('office-preview');
        } else if (file.type === 'file') {
          // Try to detect if it's a text file
          try {
            const response = await fetch(url);
            const contentType = response.headers.get('content-type') || '';
            if (contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('javascript')) {
              const content = await response.text();
              setPreviewUrl(content);
            } else {
              setPreviewUrl('binary-file');
            }
          } catch {
            setPreviewUrl('binary-file');
          }
        } else {
          setError('Preview not available for this file type');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [file]);

  const handleDownload = async () => {
    try {
      const url = await getDownloadUrl(file.id);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    }
  };

  const handleShare = () => {
    // Share functionality would be implemented here
    alert('Share functionality coming soon!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
            <span className="text-sm text-gray-500">{file.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[80vh] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading preview...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
              <span className="text-red-600">{error}</span>
            </div>
          ) : file.type === 'image' ? (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={() => setError('Failed to load image')}
              />
            </div>
          ) : file.type === 'pdf' ? (
            <div className="w-full h-[70vh]">
              <iframe
                src={previewUrl}
                className="w-full h-full border rounded-lg"
                title={file.name}
              />
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Eye className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">File Content</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded border max-h-[60vh] overflow-auto">
                {previewUrl}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
