// frontend/src/services/realtime.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectRealtime(token: string) {
  const raw =
    (import.meta as any)?.env?.VITE_API_BASE_URL ||
    "https://cloud-drive-backend.onrender.com/api";
  const base = raw.trim().replace(/\/api\/?$/, "");

  socket = io(base, {
    auth: { token },
  });

  socket.on("connect_error", (err) => {
    console.error("Realtime connect error:", err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectRealtime() {
  try {
    socket?.disconnect();
  } finally {
    socket = null;
  }
}