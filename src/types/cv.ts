// src/types/cv.ts hoặc thêm vào src/utils/advancedCVParser.ts

export interface ParsedCV {
  name: string;
  email: string;
  phone: string;
  address?: string;
  skills: string[];
  experience?: string;
  education?: string;
  university?: string;
  rawText: string;
}