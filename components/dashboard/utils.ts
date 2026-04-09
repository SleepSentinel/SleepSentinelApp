export type Tone = {
  background: string;
  border: string;
  text: string;
  dot: string;
};

export type GaugeInfo = {
  label: string;
  progress: number;
  colors: [string, string];
  textColor: string;
  glowColor: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function formatFreshness(secondsSinceUpdate: number | null, status: string) {
  if (status !== "connected") return "Waiting";
  if (secondsSinceUpdate === null) return "Awaiting data";
  if (secondsSinceUpdate < 5) return "Just now";
  return `${secondsSinceUpdate}s ago`;
}

export function getConnectionTone(status: string): Tone {
  switch (status) {
    case "connected":
      return {
        background: "rgba(16, 185, 129, 0.12)",
        border: "rgba(52, 211, 153, 0.35)",
        text: "#50E3B3",
        dot: "#34D399",
      };
    case "connecting":
      return {
        background: "rgba(250, 204, 21, 0.12)",
        border: "rgba(250, 204, 21, 0.28)",
        text: "#FACC15",
        dot: "#FACC15",
      };
    default:
      return {
        background: "rgba(148, 163, 184, 0.12)",
        border: "rgba(148, 163, 184, 0.28)",
        text: "#94A3B8",
        dot: "#94A3B8",
      };
  }
}

export function getHeartRateInfo(value?: number): GaugeInfo {
  if (value === undefined) {
    return {
      label: "Waiting",
      progress: 0,
      colors: ["#365675", "#24384E"],
      textColor: "#90A1B9",
      glowColor: "rgba(52, 211, 153, 0.18)",
    };
  }

  if (value < 100) {
    return {
      label: "Low",
      progress: clamp(value / 200, 0, 1),
      colors: ["#5BB7FF", "#2D6CF6"],
      textColor: "#6CC6FF",
      glowColor: "rgba(91, 183, 255, 0.16)",
    };
  }

  if (value > 180) {
    return {
      label: "High",
      progress: clamp(value / 200, 0, 1),
      colors: ["#FF7A6E", "#FF2056"],
      textColor: "#FF7A8C",
      glowColor: "rgba(255, 56, 104, 0.18)",
    };
  }

  return {
    label: "Normal",
    progress: clamp(value / 200, 0, 1),
    colors: ["#00D492", "#27E0B9"],
    textColor: "#38E2BA",
    glowColor: "rgba(0, 212, 146, 0.18)",
  };
}

export function getSpo2Info(value?: number): GaugeInfo {
  if (value === undefined) {
    return {
      label: "Waiting",
      progress: 0,
      colors: ["#365675", "#24384E"],
      textColor: "#90A1B9",
      glowColor: "rgba(91, 183, 255, 0.16)",
    };
  }

  if (value >= 95) {
    return {
      label: "Normal",
      progress: clamp(value / 100, 0, 1),
      colors: ["#5BB7FF", "#4DE3C2"],
      textColor: "#6CC6FF",
      glowColor: "rgba(91, 183, 255, 0.16)",
    };
  }

  if (value >= 90) {
    return {
      label: "Monitor",
      progress: clamp(value / 100, 0, 1),
      colors: ["#FFD166", "#F59E0B"],
      textColor: "#FFD166",
      glowColor: "rgba(245, 158, 11, 0.16)",
    };
  }

  return {
    label: "Alert",
    progress: clamp(value / 100, 0, 1),
    colors: ["#FF7A6E", "#FF2056"],
    textColor: "#FF7A8C",
    glowColor: "rgba(255, 56, 104, 0.18)",
  };
}

export function getBodyTempInfo(value?: number) {
  if (value === undefined) {
    return {
      label: "Waiting",
      textColor: "#90A1B9",
      progress: 0,
      colors: ["#365675", "#24384E"] as [string, string],
    };
  }

  if (value < 36) {
    return {
      label: "Low",
      textColor: "#6CC6FF",
      progress: clamp((value - 35) / 4, 0, 1),
      colors: ["#5BB7FF", "#2D6CF6"] as [string, string],
    };
  }

  if (value > 37.5) {
    return {
      label: "High",
      textColor: "#FF9C5F",
      progress: clamp((value - 35) / 4, 0, 1),
      colors: ["#FF9A4A", "#FF4D4D"] as [string, string],
    };
  }

  return {
    label: "Normal",
    textColor: "#38E2BA",
    progress: clamp((value - 35) / 4, 0, 1),
    colors: ["#00D492", "#27E0B9"] as [string, string],
  };
}

export function getAirQualityInfo(value?: number) {
  if (value === undefined) {
    return {
      label: "Waiting",
      textColor: "#90A1B9",
      progress: 0,
      colors: ["#365675", "#24384E"] as [string, string],
    };
  }

  if (value <= 50) {
    return {
      label: "Excellent",
      textColor: "#38E2BA",
      progress: clamp(value / 300, 0, 1),
      colors: ["#00D492", "#27E0B9"] as [string, string],
    };
  }

  if (value <= 100) {
    return {
      label: "Good",
      textColor: "#88E56B",
      progress: clamp(value / 300, 0, 1),
      colors: ["#7ED957", "#22C55E"] as [string, string],
    };
  }

  if (value <= 150) {
    return {
      label: "Average",
      textColor: "#FDC700",
      progress: clamp(value / 300, 0, 1),
      colors: ["#FFD166", "#FDC700"] as [string, string],
    };
  }

  if (value <= 200) {
    return {
      label: "Poor",
      textColor: "#FF9C5F",
      progress: clamp(value / 300, 0, 1),
      colors: ["#FFB347", "#FF8904"] as [string, string],
    };
  }

  return {
    label: "Very Poor",
    textColor: "#FF7A8C",
    progress: clamp(value / 300, 0, 1),
    colors: ["#FF7A6E", "#FF2056"] as [string, string],
  };
}
