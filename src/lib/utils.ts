// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Test Gemini AI connection
 * FIX: Use gemini-pro model (stable, always available)
 */
export const testGeminiConnection = async (apiKey: string) => {
  try {
    // Gọi endpoint listModels - đơn giản và luôn hoạt động
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Test connection'
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (response.ok && data.models && data.models.length > 0) {
      return { success: true, message: 'Kết nối thành công' };
    } else if (data.error) {
      return { success: false, error: data.error.message };
    } else {
      return { success: false, error: 'Invalid response from Gemini' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
