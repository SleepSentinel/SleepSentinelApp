import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import {
  AirQualityIcon,
  BabyIcon,
  ClockIcon,
  HeartIcon,
  HumidityIcon,
  PulseIcon,
  TemperatureIcon,
  ThermometherIcon,
  WaterDropIcon,
} from "./original-icons";
import { SystemState } from "./types";
import {
  formatFreshness,
  getAirQualityInfo,
  getBodyTempInfo,
  getConnectionTone,
  getHeartRateInfo,
  getSpo2Info,
} from "./utils";

export function DashboardHeader({
  status,
  secondsSinceUpdate,
}: {
  status: string;
  secondsSinceUpdate: number | null;
}) {
  const tone = getConnectionTone(status);

  return (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>SleepSentinel</Text>
          <Text style={styles.subtitle}>Baby Health Monitor</Text>
        </View>
        <View style={styles.appIconShell}>
          <PulseIcon size={18} />
        </View>
      </View>

      <View style={styles.pillRow}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: tone.background, borderColor: tone.border },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
          <Text style={[styles.statusText, { color: tone.text }]}>
            {status === "connected"
              ? "Connected"
              : status === "connecting"
                ? "Connecting"
                : "Disconnected"}
          </Text>
        </View>

        <View style={styles.timePill}>
          <ClockIcon size={12} />
          <Text style={styles.timeText}>
            {formatFreshness(secondsSinceUpdate, status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function HeartRateCard({ data }: { data: SystemState | null }) {
  const info = getHeartRateInfo(data?.heartRate);

  return (
    <GaugeCard
      title="HEART RATE"
      value={data?.heartRate}
      unit="bpm"
      info={info}
      gradientId="heart-rate-gradient"
      icon={<HeartIcon size={18} />}
      variant="heart"
    />
  );
}

export function OxygenCard({ data }: { data: SystemState | null }) {
  const info = getSpo2Info(data?.spo2);

  return (
    <GaugeCard
      title="OXYGEN"
      value={data?.spo2}
      unit="%"
      info={info}
      gradientId="oxygen-gradient"
      icon={<WaterDropIcon size={18} />}
      variant="oxygen"
    />
  );
}

export function BodyTemperatureCard({ data }: { data: SystemState | null }) {
  const info = getBodyTempInfo(data?.bodyTemperature);

  return (
    <BarCard
      title="BODY TEMP"
      value={data?.bodyTemperature}
      valueFormatter={(value) => `${value.toFixed(1)}`}
      unit="°C"
      label={info.label}
      labelColor={info.textColor}
      progress={info.progress}
      accentColors={info.colors}
      icon={<ThermometherIcon size={18} />}
      statusPosition="below"
    />
  );
}

export function AirQualityCard({ data }: { data: SystemState | null }) {
  const info = getAirQualityInfo(data?.airQuality);

  return (
    <BarCard
      title="AIR QUALITY"
      value={data?.airQuality}
      valueFormatter={(value) => `${Math.round(value)}`}
      label={info.label}
      labelColor={info.textColor}
      progress={info.progress}
      accentColors={info.colors}
      icon={<AirQualityIcon size={18} />}
      statusPosition="above"
    />
  );
}

export function MovementCard({ data }: { data: SystemState | null }) {
  return (
    <BooleanCard
      title="MOVEMENT"
      active={Boolean(data?.isMoving)}
      activeLabel="Moving"
      inactiveLabel="Resting"
      activeColors={["#8B5CF6", "#6D28D9"]}
      activeTextColor="#C084FC"
      icon={<BabyIcon size={30} />}
    />
  );
}

export function CryAlertCard({ data }: { data: SystemState | null }) {
  return (
    <BooleanCard
      title="CRY ALERT"
      active={Boolean(data?.isCrying)}
      activeLabel="Crying"
      inactiveLabel="Quiet"
      activeColors={["#FB7185", "#E11D48"]}
      activeTextColor="#FF7A8C"
      inactiveTextColor="#50E3B3"
      icon={<BabyIcon size={30} />}
    />
  );
}

export function RoomEnvironmentCard({ data }: { data: SystemState | null }) {
  return (
    <CardShell>
      <View style={styles.environmentHeader}>
        <Text style={styles.cardTitle}>ROOM ENVIRONMENT</Text>
        {data?.roomSensorOk === false ? (
          <View style={styles.sensorBadge}>
            <Text style={styles.sensorBadgeText}>Sensor Offline</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.environmentRow}>
        <EnvironmentMetric
          icon={<TemperatureIcon size={18} />}
          title="Temperature"
          value={
            data?.roomTemperature !== undefined
              ? `${data.roomTemperature.toFixed(1)}°C`
              : "--"
          }
          tint="rgba(255, 137, 4, 0.18)"
        />

        <View style={styles.environmentDivider} />

        <EnvironmentMetric
          icon={<HumidityIcon size={18} />}
          title="Humidity"
          value={
            data?.roomHumidity !== undefined
              ? `${data.roomHumidity.toFixed(1)}%`
              : "--"
          }
          tint="rgba(81, 162, 255, 0.18)"
        />
      </View>
    </CardShell>
  );
}

function GaugeCard({
  title,
  value,
  unit,
  info,
  icon,
  gradientId,
  variant,
}: {
  title: string;
  value: number | undefined;
  unit: string;
  info: ReturnType<typeof getHeartRateInfo>;
  icon: React.ReactNode;
  gradientId: string;
  variant: "heart" | "oxygen";
}) {
  const gaugeSize = 128;
  const strokeWidth = 10;
  const ringRadius = variant === "heart" ? 46 : 43;

  return (
    <CardShell>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {icon}
      </View>

      <View style={styles.gaugeWrap}>
        <View style={styles.gaugeFrame}>
          <CircularGauge
            progress={info.progress}
            colors={info.colors}
            size={gaugeSize}
            strokeWidth={strokeWidth}
            ringRadius={ringRadius}
            gradientId={gradientId}
          />
          <View
            style={[
              styles.gaugeDiscGlow,
              { backgroundColor: info.glowColor, width: 78, height: 78 },
            ]}
          />
          <View style={styles.gaugeInnerDisc} />
          <View style={styles.gaugeValueStack}>
            <Text style={styles.gaugeValue}>
              {value !== undefined ? value : "--"}
            </Text>
            <Text style={styles.gaugeUnit}>{unit}</Text>
          </View>
        </View>
      </View>

      <View style={styles.gaugeStatusWrap}>
        <Text style={[styles.gaugeStatus, { color: info.textColor }]}>
          {info.label}
        </Text>
      </View>
    </CardShell>
  );
}

function BarCard({
  title,
  value,
  valueFormatter,
  unit,
  label,
  labelColor,
  progress,
  accentColors,
  icon,
  statusPosition,
}: {
  title: string;
  value: number | undefined;
  valueFormatter: (value: number) => string;
  unit?: string;
  label: string;
  labelColor: string;
  progress: number;
  accentColors: [string, string];
  icon: React.ReactNode;
  statusPosition: "above" | "below";
}) {
  return (
    <CardShell>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {icon}
      </View>

      <View style={styles.barContent}>
        <View style={styles.metricRow}>
          <Text style={styles.barValue}>
            {value !== undefined ? valueFormatter(value) : "--"}
          </Text>
          {unit ? <Text style={styles.barUnit}>{unit}</Text> : null}
        </View>

        {statusPosition === "above" ? (
          <Text style={[styles.barStatus, { color: labelColor }]}>{label}</Text>
        ) : null}

        <SpectrumBar progress={progress} accentColors={accentColors} />

        {statusPosition === "below" ? (
          <Text style={[styles.barStatus, { color: labelColor }]}>{label}</Text>
        ) : null}
      </View>
    </CardShell>
  );
}

function BooleanCard({
  title,
  active,
  activeLabel,
  inactiveLabel,
  activeColors,
  activeTextColor,
  inactiveTextColor = "#90A1B9",
  icon,
}: {
  title: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeColors: [string, string];
  activeTextColor: string;
  inactiveTextColor?: string;
  icon: React.ReactNode;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => {
      loop.stop();
      pulse.stopAnimation();
    };
  }, [active, pulse]);

  const pulseStyle = {
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.65],
        }),
      },
    ],
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0],
    }),
  };

  return (
    <CardShell>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.booleanBody}>
        <View style={styles.booleanIconWrap}>
          {active ? (
            <Animated.View
              style={[
                styles.booleanPulse,
                {
                  backgroundColor:
                    activeColors[0] === "#8B5CF6"
                      ? "rgba(139, 92, 246, 0.25)"
                      : "rgba(251, 113, 133, 0.22)",
                },
                pulseStyle,
              ]}
            />
          ) : null}
          <View
            style={[
              styles.booleanCore,
              active
                ? {
                    backgroundColor:
                      activeColors[0] === "#8B5CF6"
                        ? "rgba(139, 92, 246, 0.95)"
                        : "rgba(251, 113, 133, 0.95)",
                  }
                : styles.booleanCoreInactive,
            ]}
          >
            {icon}
          </View>
        </View>

        <Text
          style={[
            styles.booleanLabel,
            { color: active ? activeTextColor : inactiveTextColor },
          ]}
        >
          {active ? activeLabel : inactiveLabel}
        </Text>
      </View>
    </CardShell>
  );
}

function EnvironmentMetric({
  icon,
  title,
  value,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={styles.environmentMetric}>
      <View style={[styles.environmentIcon, { backgroundColor: tint }]}>{icon}</View>
      <View style={styles.environmentTextWrap}>
        <Text style={styles.environmentValue}>{value}</Text>
        <Text style={styles.environmentLabel}>{title}</Text>
      </View>
    </View>
  );
}

function CircularGauge({
  progress,
  colors,
  size,
  strokeWidth,
  ringRadius,
  gradientId,
}: {
  progress: number;
  colors: [string, string];
  size: number;
  strokeWidth: number;
  ringRadius: number;
  gradientId: string;
}) {
  const center = size / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>

      <Circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke="#1E3147"
        strokeWidth={strokeWidth}
      />

      <Circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        rotation={-90}
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}

function SpectrumBar({
  progress,
  accentColors,
}: {
  progress: number;
  accentColors: [string, string];
}) {
  const width = 148;
  const height = 10;
  const fillWidth = Math.max(8, width * progress);
  const fillGradientId = useMemo(
    () => `fill-${accentColors[0].replace("#", "")}-${accentColors[1].replace("#", "")}`,
    [accentColors],
  );

  return (
    <View style={styles.barTrack}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="spectrum-base" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4EA6FF" />
            <Stop offset="40%" stopColor="#00D492" />
            <Stop offset="70%" stopColor="#FDC700" />
            <Stop offset="100%" stopColor="#FF2056" />
          </LinearGradient>
          <LinearGradient id={fillGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={accentColors[0]} />
            <Stop offset="100%" stopColor={accentColors[1]} />
          </LinearGradient>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={height / 2}
          fill="url(#spectrum-base)"
          opacity={0.28}
        />
        <Rect
          x={0}
          y={0}
          width={fillWidth}
          height={height}
          rx={height / 2}
          fill={`url(#${fillGradientId})`}
        />
      </Svg>
    </View>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.cardShell}>
      <View style={styles.cardGlow} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 4,
    color: "#90A1B9",
    fontSize: 12,
    fontWeight: "500",
  },
  appIconShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4B39C8",
    shadowColor: "#4B39C8",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(144, 161, 185, 0.2)",
    backgroundColor: "rgba(10, 19, 37, 0.62)",
  },
  timeText: {
    color: "#90A1B9",
    fontSize: 12,
    fontWeight: "500",
  },
  cardShell: {
    flex: 1,
    minHeight: 184,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "rgba(14, 24, 44, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(43, 66, 95, 0.55)",
    overflow: "hidden",
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    backgroundColor: "transparent",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#7E8BAA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.4,
  },
  gaugeWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  gaugeFrame: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeDiscGlow: {
    position: "absolute",
    bottom: 18,
    borderRadius: 999,
  },
  gaugeInnerDisc: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#16314D",
    opacity: 0.72,
  },
  gaugeValueStack: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeValue: {
    color: "#F8FAFC",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
  },
  gaugeUnit: {
    marginTop: -1,
    color: "#90A1B9",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  gaugeStatusWrap: {
    alignItems: "center",
    marginTop: 2,
  },
  gaugeStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
  barContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 18,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  barValue: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
  },
  barUnit: {
    marginLeft: 4,
    marginBottom: 4,
    color: "#90A1B9",
    fontSize: 17,
    fontWeight: "600",
  },
  barStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
  barTrack: {
    width: 148,
    alignItems: "center",
    justifyContent: "center",
  },
  booleanBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },
  booleanIconWrap: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  booleanPulse: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  booleanCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  booleanCoreInactive: {
    backgroundColor: "#334155",
  },
  booleanLabel: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
  },
  environmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sensorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 32, 86, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 32, 86, 0.24)",
  },
  sensorBadgeText: {
    color: "#FF7A8C",
    fontSize: 11,
    fontWeight: "700",
  },
  environmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  environmentMetric: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  environmentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  environmentTextWrap: {
    flexShrink: 1,
  },
  environmentValue: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  environmentLabel: {
    marginTop: 2,
    color: "#7E8BAA",
    fontSize: 11,
    fontWeight: "600",
  },
  environmentDivider: {
    width: 1,
    height: 52,
    backgroundColor: "rgba(71, 85, 105, 0.44)",
    marginHorizontal: 14,
  },
});
