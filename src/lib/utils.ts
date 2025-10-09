import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const testGeminiConnection = async (apiKey: string) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
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
    
    if (response.ok && data.candidates) {
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
