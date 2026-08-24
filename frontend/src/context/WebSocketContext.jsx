import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const listenersRef = useRef({}); // event_type -> set of callbacks

  const addListener = (type, cb) => {
    if (!listenersRef.current[type]) {
      listenersRef.current[type] = new Set();
    }
    listenersRef.current[type].add(cb);
    return () => {
      listenersRef.current[type].delete(cb);
    };
  };

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsUrl;
    if (backendUrl.startsWith("http")) {
      wsUrl = backendUrl.replace(/^http/, "ws") + "/api/ws";
    } else {
      wsUrl = `${wsProto}//${window.location.host}/api/ws`;
    }

    const token = localStorage.getItem("qiveo_token");
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    let socket;
    let reconnectTimeout;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected to Qiveo real-time server");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          
          // Handle global notifications/toasts
          if (type === "notification" && data.notification) {
            toast(data.notification.text, {
              description: new Date(data.notification.created_at).toLocaleTimeString()
            });
            // Also notify any custom listeners for notifications to increment badges
            if (listenersRef.current["notification"]) {
              listenersRef.current["notification"].forEach((cb) => cb(data));
            }
          }

          // Trigger custom listeners
          if (listenersRef.current[type]) {
            listenersRef.current[type].forEach((cb) => cb(data));
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      };

      socket.onclose = (event) => {
        console.log("WebSocket disconnected, reconnecting in 3s...", event.reason);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
