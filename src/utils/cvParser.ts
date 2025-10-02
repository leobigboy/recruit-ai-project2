// src/utils/cvParser.ts
import mammoth from 'mammoth';

export interface ParsedCV {
  fullText: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  university?: string;
}

// Parse DOCX file
async function parseDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Parse TXT file  
async function parseTXT(file: File): Promise<string> {
  return await file.text();
}

// Parse PDF file (sử dụng API hoặc library đơn giản hơn)
async function parsePDF(_file: File): Promise<string> {
  // Tạm thời return empty, sẽ implement sau với pdfjs-dist
  // hoặc dùng API như pdf.co
  return "PDF parsing sẽ được implement sau";
}

// Extract thông tin từ text
function extractInfo(text: string): ParsedCV {
  const parsed: ParsedCV = {
    fullText: text
  };
  
  // Extract email
  const emailRegex = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/gi;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    parsed.email = emails[0].toLowerCase();
  }
  
  // Extract phone (Vietnam format)
  const phoneRegex = /(?:\+84|84|0)[\s.-]?(\d{2,3})[\s.-]?(\d{3})[\s.-]?(\d{3,4})/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    parsed.phone = phones[0].replace(/[\s.-]/g, '');
  }
  
  // Extract university
  const universityKeywords = ['university', 'đại học', 'học viện', 'trường'];
  const lines = text.split('\n');
  for (const line of lines) {
    if (universityKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
      parsed.university = line.trim();
      break;
    }
  }
  
  // Extract skills (các từ khóa phổ biến)
  const skillKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'nodejs',
    'python', 'java', 'c#', 'csharp', 'php', 'ruby', 'go', 'rust',
    'html', 'css', 'sass', 'scss', 'tailwind',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'git', 'github', 'gitlab', 'jira',
    'figma', 'photoshop', 'illustrator', 'sketch'
  ];
  
  const textLower = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => 
    textLower.includes(skill.toLowerCase())
  );
  
  if (foundSkills.length > 0) {
    parsed.skills = [...new Set(foundSkills)]; // Remove duplicates
  }
  
  return parsed;
}

// Main parse function
export async function parseCV(file: File): Promise<ParsedCV> {
  let text = '';
  
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      text = await parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      text = await parseDOCX(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      text = await parseTXT(file);
    } else {
      throw new Error('Định dạng file không được hỗ trợ');
    }
    
    return extractInfo(text);
  } catch (error) {
    console.error('Error parsing CV:', error);
    throw error;
  }
}

// Validate file
export function validateCVFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const allowedExtensions = ['.pdf', '.docx', '.txt'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type) && !hasValidExtension) {
    return { valid: false, error: 'Chỉ chấp nhận file PDF, DOCX hoặc TXT' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File không được vượt quá 5MB' };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'File rỗng' };
  }
  
  return { valid: true };
}