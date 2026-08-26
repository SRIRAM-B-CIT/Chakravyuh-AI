"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getWebSocketUrl, TelemetryMessage } from "@/lib/api";
import { SystemState } from "@/lib/types";

export type ConnectionStatus = "ws" | "polling" | "disconnected";

export function useTelemetryStream(initialState: SystemState, initialLogs: string[]) {
  const [state, setState] = useState(initialState);
  const [logs, setLogs] = useState(initialLogs);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const socketRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef<ConnectionStatus>("disconnected");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const refresh = useCallback(async () => {
    try {
      const [nextState, logData] = await Promise.all([api.getState(), api.getLogs()]);
      if (!mountedRef.current) return;
      setState(nextState);
      if (logData.logs.length) setLogs(logData.logs);
      setStatus((current) => current === "ws" ? current : "polling");
    } catch {
      if (mountedRef.current) setStatus((current) => current === "ws" ? current : "disconnected");
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let reconnectAttempt = 0;

    const poll = () => {
      if (mountedRef.current) void refresh();
    };

    const connect = () => {
      if (!mountedRef.current) return;
      let socket: WebSocket;
      try {
        socket = new WebSocket(getWebSocketUrl());
        socketRef.current = socket;
      } catch {
        setStatus("disconnected");
        reconnectTimer = setTimeout(connect, 2500);
        return;
      }

      socket.onopen = () => {
        reconnectAttempt = 0;
        if (mountedRef.current) setStatus("ws");
      };
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TelemetryMessage;
          if (!mountedRef.current) return;
          if (payload.state) setState(payload.state);
          if (payload.logs?.length) setLogs(payload.logs);
          setStatus("ws");
        } catch {
          // Ignore malformed telemetry packets and keep the stream alive.
        }
      };
      socket.onclose = () => {
        if (!mountedRef.current) return;
        setStatus("polling");
        poll();
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, Math.min(10000, 1500 + reconnectAttempt * 500));
      };
      socket.onerror = () => socket.close();
    };

    connect();
    pollTimer = setInterval(() => {
      if (statusRef.current !== "ws") poll();
    }, 2000);

    return () => {
      mountedRef.current = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollTimer) clearInterval(pollTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [refresh]);

  return { state, setState, logs, status, refresh };
}
