import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
    const wsUrl = "ws://192.168.2.78/ws"; // the ESP32 IP

    wsService.setStatusCallback(setStatus);
    wsService.setMessageCallback(setData);

    wsService.connect(wsUrl);

    return () => {
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
