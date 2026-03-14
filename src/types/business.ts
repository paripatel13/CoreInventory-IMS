export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  employeeCount: number;
  warehouseCount: number;
  productCount: number;
  industry: string;
  onboardingComplete: boolean;
  theme: "light" | "dark" | "system";
  currency: string;
  timezone: string;
}