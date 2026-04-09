import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { discoverEsp32WebSocket } from "../services/Esp32Discovery";
import wsService from "../services/WebSocketService";

export default function HomeScreen() {
  type SystemState = {
    heartRate: number;
    spo2: number;
    bodyTemperature: number;
    roomTemperature: number;
    roomHumidity: number;
    roomSensorOk: boolean;
    isMoving: boolean;
    isCrying: boolean;
    airQuality: number;
  };

  const [status, setStatus] = useState("connecting");
  const [data, setData] = useState<SystemState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    wsService.setStatusCallback(setStatus);
    wsService.setMessageCallback(setData);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SleepSentinel</Text>

      <Text>Status: {status}</Text>

      {data ? (
        <>
          <Text>Heart Rate: {data.heartRate}</Text>
          <Text>SpO2: {data.spo2}</Text>
          <Text>Body Temp: {data.bodyTemperature}</Text>
          <Text>roomTemperature: {data.roomTemperature}</Text>
          <Text>roomHumidity: {data.roomHumidity}</Text>
          <Text>isMoving: {data.isMoving}</Text>
          <Text>isCrying: {data.isCrying}</Text>
          <Text>airQuality: {data.airQuality}</Text>
        </>
      ) : (
        <Text>No data yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
