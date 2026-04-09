import React from "react";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AirQualityCard,
  BodyTemperatureCard,
  CryAlertCard,
  DashboardHeader,
  HeartRateCard,
  MovementCard,
  OxygenCard,
  RoomEnvironmentCard,
} from "./widgets";
import { SystemState } from "./types";

export function DashboardScreen({
  data,
  status,
  secondsSinceUpdate,
}: {
  data: SystemState | null;
  status: string;
  secondsSinceUpdate: number | null;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.background}>
        <View style={styles.backgroundOrbTop} />
        <View style={styles.backgroundOrbBottom} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 15, paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader status={status} secondsSinceUpdate={secondsSinceUpdate} />

        <View style={styles.row}>
          <HeartRateCard data={data} />
          <View style={styles.rowSpacer} />
          <OxygenCard data={data} />
        </View>

        <View style={styles.row}>
          <BodyTemperatureCard data={data} />
          <View style={styles.rowSpacer} />
          <AirQualityCard data={data} />
        </View>

        <View style={styles.row}>
          <MovementCard data={data} />
          <View style={styles.rowSpacer} />
          <CryAlertCard data={data} />
        </View>

        <RoomEnvironmentCard data={data} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050B19",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050B19",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -120,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(85, 58, 198, 0.16)",
  },
  backgroundOrbBottom: {
    position: "absolute",
    left: -100,
    top: 180,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(18, 67, 135, 0.12)",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  rowSpacer: {
    width: 12,
  },
});
