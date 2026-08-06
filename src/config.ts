export interface RadiatorAIConfig {
  company: string;
  companyFa: string;
  version: string;
  language: string;
  autoSave: boolean;
  maxUndo: number;
  animationSpeed: number;
  defaultTruck: string;
}

export const CONFIG: RadiatorAIConfig = {
  company: 'Radiator AI',
  companyFa: 'سامانه هوشمند بارگیری و چیدمان سه بعدی رادیاتور صنعتی',
  version: '1.0.0',
  language: 'fa',
  autoSave: true,
  maxUndo: 100,
  animationSpeed: 150,
  defaultTruck: 'khavar'
};
