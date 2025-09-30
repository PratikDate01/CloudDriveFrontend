import React, { Suspense, lazy } from 'react';

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

// Lazy load the actual preview component
const FilePreviewModal = lazy(() => import('./FilePreviewModal.tsx'));

interface LazyFilePreviewProps {
  file: UiFile;
  onClose: () => void;
}

const LazyFilePreview: React.FC<LazyFilePreviewProps> = ({ file, onClose }) => {
  if (!file) return null;

  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading preview...</span>
          </div>
        </div>
      </div>
    }>
      <FilePreviewModal file={file} onClose={onClose} />
    </Suspense>
  );
};

export default LazyFilePreview;
