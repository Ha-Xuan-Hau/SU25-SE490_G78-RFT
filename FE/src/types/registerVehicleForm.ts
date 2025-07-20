import { FormInstance } from "antd";
import { VehicleType } from "./vehicle";

export interface ExtraRule {
  maxKmPerDay?: number;
  feePerExtraKm?: number;
  allowedHourLate?: number;
  feePerExtraHour?: number;
  cleaningFee?: number;
  smellRemovalFee?: number;
  batteryChargeFeePerPercent?: number;
  apply_batteryChargeFee?: boolean;
  driverFeePerDay?: number;
  hasDriverOption?: boolean;
  driverFeePerHour?: number;
  hasHourlyRental?: boolean;
}
export interface VehicleGroup {
  thumb: string;
  vehicleNumber: number;
  vehicle: Vehicle[];
}

import type { Vehicle } from "./vehicle";
export interface RegisterVehicleFormProps {
  vehicleId?: string;
  onOk?: () => void;
  groupEdit?: VehicleGroup | null;
}

export interface RentalRuleOption {
  value: string;
  label: string;
  penaltyType: string;
  penaltyValue: number;
}

export interface FeatureOption {
  label: string;
  value: string;
}

export interface FuelTypeOption {
  value: string;
  label: string;
}

export interface RegisterVehicleFormState {
  isMultipleVehicles: boolean;
  submitting: boolean;
  licensePlates: string[];
  vehicleType: VehicleType;
  extraRule: ExtraRule;
  isActive: boolean;
}

export interface RegisterVehicleFormContext {
  form: FormInstance;
  vehicleType: VehicleType;
  setVehicleType: (type: VehicleType) => void;
  isMultipleVehicles: boolean;
  setIsMultipleVehicles: (v: boolean) => void;
  licensePlates: string[];
  setLicensePlates: (arr: string[]) => void;
  extraRule: ExtraRule;
  setExtraRule: (rule: ExtraRule) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
}
