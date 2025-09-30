// frontend/src/hooks/useRealtimeFiles.ts
import { useEffect } from "react";
import { connectRealtime, getSocket, disconnectRealtime } from "../services/realtime";

export function useRealtimeFiles(
  onCreated: (file: any) => void,
  onDeleted: (payload: { id: string }) => void
) {
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const socket = connectRealtime(token);

    const createdHandler = (file: any) => onCreated?.(file);
    const deletedHandler = (payload: { id: string }) => onDeleted?.(payload);

    socket.on("file:created", createdHandler);
    socket.on("file:deleted", deletedHandler);

    return () => {
      const s = getSocket();
      s?.off("file:created", createdHandler);
      s?.off("file:deleted", deletedHandler);
      disconnectRealtime();
    };
  }, [onCreated, onDeleted]);
}