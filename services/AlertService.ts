import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { SystemState } from "@/components/dashboard/types";

const ALERT_CHANNEL_ID = "sleepsentinel-alerts";

const ALERT_MESSAGES: Record<string, string> = {
  highHR: "High heart rate detected",
  lowHR: "Low heart rate detected",
  lowSpO2: "Low oxygen saturation detected",
  highBodyTemp: "High body temperature detected",
  lowBodyTemp: "Low body temperature detected",
  highRoomTemp: "High room temperature detected",
  lowRoomTemp: "Low room temperature detected",
};

let notificationPermissionGranted = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeAlertType(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function getAlertActiveValue(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value > 0 : false;
  }

  if (typeof value !== "string") return null;

  switch (value.trim().toLowerCase()) {
    case "active":
    case "true":
    case "1":
    case "yes":
    case "on":
    case "triggered":
      return true;
    case "inactive":
    case "false":
    case "0":
    case "no":
    case "off":
    case "clear":
    case "cleared":
    case "normal":
      return false;
    default:
      return null;
  }
}

function getAlertTypeFromEntry(entry: unknown): string | null {
  if (typeof entry === "string") return normalizeAlertType(entry);
  if (!isRecord(entry)) return null;

  const activeValue = entry.active ?? entry.isActive ?? entry.triggered;
  if (activeValue !== undefined && getAlertActiveValue(activeValue) !== true) {
    return null;
  }

  const stateValue = entry.state ?? entry.status;
  if (stateValue !== undefined && getAlertActiveValue(stateValue) !== true) {
    return null;
  }

  return (
    normalizeAlertType(entry.type) ??
    normalizeAlertType(entry.alertType) ??
    normalizeAlertType(entry.id) ??
    normalizeAlertType(entry.key) ??
    normalizeAlertType(entry.name)
  );
}

function isAlertEntryActive(value: unknown): boolean {
  const directActiveValue = getAlertActiveValue(value);
  if (directActiveValue !== null) return directActiveValue;

  if (!isRecord(value)) return false;

  const activeValue = value.active ?? value.isActive ?? value.triggered;
  const parsedActiveValue = getAlertActiveValue(activeValue);
  if (parsedActiveValue !== null) return parsedActiveValue;

  const stateValue = value.state ?? value.status;
  return getAlertActiveValue(stateValue) === true;
}

function humanizeAlertType(alertType: string) {
  return alertType
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

export function getAlertMessage(alertType: string) {
  return ALERT_MESSAGES[alertType] ?? `${humanizeAlertType(alertType)} alert detected`;
}

export function getActiveAlertTypes(data: Pick<SystemState, "alerts" | "activeAlerts"> | null) {
  const activeAlerts: string[] = [];
  const seen = new Set<string>();

  const addAlert = (alertType: string | null) => {
    if (!alertType || seen.has(alertType)) return;
    seen.add(alertType);
    activeAlerts.push(alertType);
  };

  if (Array.isArray(data?.activeAlerts)) {
    data.activeAlerts.forEach((entry) => addAlert(getAlertTypeFromEntry(entry)));
  }

  if (isRecord(data?.alerts)) {
    Object.entries(data.alerts).forEach(([alertType, alertValue]) => {
      if (isAlertEntryActive(alertValue)) {
        addAlert(alertType);
      }
    });
  }

  return activeAlerts;
}

export function getNewlyActivatedAlerts(
  previousData: Pick<SystemState, "alerts" | "activeAlerts" | "alertVersion"> | null,
  nextData: Pick<SystemState, "alerts" | "activeAlerts" | "alertVersion">,
) {
  const nextActiveAlerts = getActiveAlertTypes(nextData);

  if (!previousData || nextActiveAlerts.length === 0) {
    return [];
  }

  const previousActiveAlerts = new Set(getActiveAlertTypes(previousData));

  return nextActiveAlerts.filter((alertType) => !previousActiveAlerts.has(alertType));
}

export async function configureAlertNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
      name: "SleepSentinel alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  if (existingPermissions.granted) {
    notificationPermissionGranted = true;
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  notificationPermissionGranted = requestedPermissions.granted;
  return notificationPermissionGranted;
}

export async function notifyNewAlertTransitions(
  previousData: SystemState | null,
  nextData: SystemState,
) {
  const newlyActivatedAlerts = getNewlyActivatedAlerts(previousData, nextData);

  if (!notificationPermissionGranted || newlyActivatedAlerts.length === 0) {
    return;
  }

  await Promise.all(
    newlyActivatedAlerts.map((alertType) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "SleepSentinel alert",
          body: getAlertMessage(alertType),
          sound: true,
          data: {
            alertType,
            alertVersion: nextData.alertVersion,
          },
        },
        trigger: Platform.OS === "android" ? { channelId: ALERT_CHANNEL_ID } : null,
      }),
    ),
  );
}
