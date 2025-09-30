// frontend/src/components/RealtimeEventsBinder.tsx
import { useEffect } from 'react';
import { getSocket } from '../services/realtime';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export default function RealtimeEventsBinder() {
  const qc = useQueryClient();

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const invalidateFiles = () => qc.invalidateQueries({ queryKey: ['files'] });
    const invalidateShares = () => qc.invalidateQueries({ queryKey: ['shares'] });

    const onFileCreated = (p: any) => { toast.success(`File uploaded: ${p?.name ?? ''}`); invalidateFiles(); };
    const onFileDeleted = (_p: any) => { toast.info('File deleted'); invalidateFiles(); };
    const onFileRestored = (_p: any) => { toast.success('File restored'); invalidateFiles(); };
    const onFileUpdated = (p: any) => { toast.success(`File updated: ${p?.name ?? ''}`); invalidateFiles(); };
    const onFolderCreated = (p: any) => { toast.success(`Folder created: ${p?.name ?? ''}`); invalidateFiles(); };

    const onShareCreated = (p: any) => { toast.success(`Shared with ${p?.shared_with_email ?? 'user'}`); invalidateShares(); };
    const onShareRevoked = (_p: any) => { toast.info('Share revoked'); invalidateShares(); };

    s.on('file:created', onFileCreated);
    s.on('file:deleted', onFileDeleted);
    s.on('file:restored', onFileRestored);
    s.on('file:updated', onFileUpdated);
    s.on('folder:created', onFolderCreated);
    s.on('share:created', onShareCreated);
    s.on('share:revoked', onShareRevoked);

    return () => {
      s.off('file:created', onFileCreated);
      s.off('file:deleted', onFileDeleted);
      s.off('file:restored', onFileRestored);
      s.off('file:updated', onFileUpdated);
      s.off('folder:created', onFolderCreated);
      s.off('share:created', onShareCreated);
      s.off('share:revoked', onShareRevoked);
    };
  }, [qc]);

  return null;
}