export type AlertEntry =
  | boolean
  | number
  | string
  | null
  | {
      active?: boolean | number | string;
      isActive?: boolean | number | string;
      triggered?: boolean | number | string;
      state?: string;
      status?: string;
      message?: string;
      severity?: string;
      value?: number;
    };

export type ActiveAlertEntry =
  | string
  | {
      type?: string;
      alertType?: string;
      id?: string;
      key?: string;
      name?: string;
      active?: boolean | number | string;
      isActive?: boolean | number | string;
      triggered?: boolean | number | string;
      state?: string;
      status?: string;
    };

export type SystemState = {
  heartRate: number;
  spo2: number;
  bodyTemperature: number;
  roomTemperature: number;
  roomHumidity: number;
  roomSensorOk: boolean;
  isMoving: boolean;
  isCrying: boolean;
  airQuality: number;
  alerts?: Record<string, AlertEntry>;
  activeAlerts?: ActiveAlertEntry[];
  alertVersion?: number | string;
};
