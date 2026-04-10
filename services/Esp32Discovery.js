import Constants from "expo-constants";

const WEBSOCKET_PATH = "/ws";
const WEBSOCKET_PORT = 80;
const PROBE_TIMEOUT_MS = 1500;
const PROBE_CONCURRENCY = 24;
const FALLBACK_192_168_THIRD_OCTETS = [
  0,
  1,
  2,
  3,
  4,
  5,
  10,
  20,
  30,
  40,
  50,
  86,
  88,
  100,
  101,
  178,
  188,
  254,
];
const FALLBACK_172_SECOND_OCTETS = Array.from({ length: 16 }, (_, index) => index + 16);
const FALLBACK_10_SUBNETS = ["10.0.0", "10.0.1", "10.1.0", "10.10.0"];
const FALLBACK_SUBNETS = buildFallbackSubnets();
const DISCOVERY_REQUEST = JSON.stringify({
  type: "sleepsentinel.discovery",
  action: "identify",
});
const NUMBER_TELEMETRY_FIELDS = [
  "heartRate",
  "spo2",
  "bodyTemperature",
  "roomTemperature",
  "roomHumidity",
  "airQuality",
];
const BOOLEAN_TELEMETRY_FIELDS = ["roomSensorOk", "isMoving", "isCrying"];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildFallbackSubnets() {
  return unique([
    ...FALLBACK_192_168_THIRD_OCTETS.map((thirdOctet) => `192.168.${thirdOctet}`),
    ...FALLBACK_172_SECOND_OCTETS.map((secondOctet) => `172.${secondOctet}.0`),
    ...FALLBACK_10_SUBNETS,
  ]);
}

function extractIPv4(value) {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/);
  if (!match) return null;

  const octets = match[1].split(".").map(Number);
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return match[1];
}

function getSubnet(ipAddress) {
  if (!ipAddress || typeof ipAddress !== "string") return null;

  const octets = ipAddress.split(".");
  return octets.length === 4 ? octets.slice(0, 3).join(".") : null;
}

function getExpoHostCandidates() {
  return [
    Constants.expoConfig?.hostUri,
    Constants.manifest?.debuggerHost,
    Constants.manifest?.hostUri,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
  ];
}

export function getCandidateSubnets() {
  const expoSubnets = getExpoHostCandidates().map(extractIPv4).map(getSubnet).filter(Boolean);
  return unique([...expoSubnets, ...FALLBACK_SUBNETS]);
}

function createCandidateUrls(subnets) {
  return subnets.flatMap((subnet) =>
    Array.from(
      { length: 253 },
      (_, index) => `ws://${subnet}.${index + 2}:${WEBSOCKET_PORT}${WEBSOCKET_PATH}`,
    ),
  );
}

function parseJsonMessage(message) {
  if (typeof message !== "string") return null;

  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isSleepSentinelHello(payload) {
  if (!isObject(payload)) return false;

  const type = typeof payload.type === "string" ? payload.type.toLowerCase() : "";
  const device = typeof payload.device === "string" ? payload.device.toLowerCase() : "";
  const product = typeof payload.product === "string" ? payload.product.toLowerCase() : "";

  return (
    type === "sleepsentinel.hello" ||
    type === "sleepsentinel.discovery.response" ||
    device === "sleepsentinel-esp32" ||
    product === "sleepsentinel"
  );
}

function isSleepSentinelTelemetry(payload) {
  if (!isObject(payload)) return false;

  return (
    NUMBER_TELEMETRY_FIELDS.every((field) => isFiniteNumber(payload[field])) &&
    BOOLEAN_TELEMETRY_FIELDS.every((field) => typeof payload[field] === "boolean")
  );
}

function isSleepSentinelEndpointMessage(message) {
  const payload = parseJsonMessage(message);
  return isSleepSentinelHello(payload) || isSleepSentinelTelemetry(payload);
}

function probeWebSocket(url, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    let socket;
    let settled = false;

    const finish = (isAvailable) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener("abort", handleAbort);

      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }

      resolve(isAvailable);
    };

    const handleAbort = () => finish(false);
    const timeout = setTimeout(() => finish(false), PROBE_TIMEOUT_MS);

    signal?.addEventListener("abort", handleAbort);

    try {
      socket = new WebSocket(url);
      socket.onopen = () => {
        try {
          socket.send(DISCOVERY_REQUEST);
        } catch {
          // Some firmware may ignore probes and stream telemetry instead.
        }
      };
      socket.onmessage = (event) => {
        if (isSleepSentinelEndpointMessage(event.data)) {
          finish(true);
        }
      };
      socket.onerror = () => finish(false);
      socket.onclose = () => finish(false);
    } catch (error) {
      finish(false);
    }
  });
}

export async function discoverEsp32WebSocket({ onStatus, signal } = {}) {
  const subnets = getCandidateSubnets();
  const urls = createCandidateUrls(subnets);
  const discoveryController = new AbortController();
  const abortDiscovery = () => discoveryController.abort();

  signal?.addEventListener("abort", abortDiscovery);
  onStatus?.(`discovering ESP32 on ${subnets.join(", ")}.x`);

  try {
    let nextIndex = 0;

    async function worker() {
      while (!discoveryController.signal.aborted && nextIndex < urls.length) {
        const url = urls[nextIndex];
        nextIndex += 1;

        const isAvailable = await probeWebSocket(url, discoveryController.signal);
        if (isAvailable) {
          discoveryController.abort();
          return url;
        }
      }

      return null;
    }

    const workers = Array.from({ length: PROBE_CONCURRENCY }, worker);
    const results = await Promise.all(workers);
    return results.find(Boolean) ?? null;
  } finally {
    signal?.removeEventListener("abort", abortDiscovery);
  }
}
