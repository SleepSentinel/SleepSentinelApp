import React, { useEffect, useRef, useState } from "react";
import { discoverEsp32WebSocket } from "../services/Esp32Discovery";
import wsService from "../services/WebSocketService";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";
import { SystemState } from "@/components/dashboard/types";
import {
  configureAlertNotifications,
  notifyNewAlertTransitions,
} from "@/services/AlertService";

export default function HomeScreen() {
  const [status, setStatus] = useState("connecting");
  const [data, setData] = useState<SystemState | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number | null>(null);
  const previousDataRef = useRef<SystemState | null>(null);

  useEffect(() => {
    configureAlertNotifications().catch((error) => {
      console.log("Notification setup failed", error);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    wsService.setStatusCallback(setStatus);
    wsService.setMessageCallback((incomingData: SystemState) => {
      const previousData = previousDataRef.current;
      previousDataRef.current = incomingData;

      notifyNewAlertTransitions(previousData, incomingData).catch((error) => {
        console.log("Alert notification failed", error);
      });

      setData(incomingData);
      setLastUpdatedAt(Date.now());
      setSecondsSinceUpdate(0);
    });

    async function connectToEsp32() {
      try {
        const wsUrl = await discoverEsp32WebSocket({
          signal: controller.signal,
          onStatus: (nextStatus: string) => {
            if (isMounted) setStatus(nextStatus);
          },
        });

        if (!isMounted || controller.signal.aborted) return;

        if (!wsUrl) {
          setStatus("ESP32 not found");
          return;
        }

        wsService.connect(wsUrl);
      } catch (error) {
        console.log("ESP32 discovery failed", error);
        if (isMounted && !controller.signal.aborted) {
          setStatus("ESP32 discovery failed");
        }
      }
    }

    connectToEsp32();

    return () => {
      isMounted = false;
      controller.abort();
      wsService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (lastUpdatedAt === null) return;

    const interval = setInterval(() => {
      setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdatedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  return (
    <DashboardScreen
      data={data}
      status={status}
      secondsSinceUpdate={secondsSinceUpdate}
    />
  );
}
