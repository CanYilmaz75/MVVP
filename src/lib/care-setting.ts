export const CARE_SETTINGS = ["care_facility", "medical_practice"] as const;

export type CareSetting = (typeof CARE_SETTINGS)[number];

export const DEFAULT_CARE_SETTING: CareSetting = "care_facility";

export function normalizeCareSetting(value: unknown): CareSetting {
  return CARE_SETTINGS.includes(value as CareSetting) ? (value as CareSetting) : DEFAULT_CARE_SETTING;
}

export function isCareFacility(setting: CareSetting) {
  return setting === "care_facility";
}

export function isMedicalPractice(setting: CareSetting) {
  return setting === "medical_practice";
}
