
// src/utils/cvParser.ts
import mammoth from 'mammoth';

export interface ParsedCV {
  fullText: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  university?: string;
  education?: string;
  experience?: string;
  skills?: string[];
}

// Parse PDF file using pdfjs-dist
async function parsePDF(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Không thể đọc file PDF');
  }
}

// Parse DOCX file
async function parseDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Không thể đọc file DOCX');
  }
}

// Parse TXT file  
async function parseTXT(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    console.error('Error parsing TXT:', error);
    throw new Error('Không thể đọc file TXT');
  }
}

// ✅ FIXED: AI-POWERED extraction với error handling tốt hơn
async function extractInfoWithAI(text: string): Promise<ParsedCV> {
  try {
    console.log('🤖 Using AI to parse CV (text length: ' + text.length + ')...');
    
    // ✅ FIX: Thêm x-api-key header (nếu cần) và timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        // ✅ Nếu cần API key, uncomment dòng này:
        // "x-api-key": "YOUR_API_KEY_HERE"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Bạn là AI chuyên trích xuất thông tin từ CV ứng viên.

Phân tích CV sau và trả về JSON với CHÍNH XÁC các trường sau:

{
  "fullName": "Họ và tên ĐẦY ĐỦ (VD: Võ Huỳnh Thái Bảo)",
  "email": "Email (VD: vothaibao50@gmail.com)",
  "phone": "Số điện thoại (giữ nguyên định dạng: +84 945 446 761)",
  "address": "Thành phố/Tỉnh (VD: TP. Hồ Chí Minh hoặc TP.HCM)",
  "university": "Tên trường ĐẦY ĐỦ (VD: Đại học Bách Khoa TP.HCM)",
  "education": "Học vấn ĐẦY ĐỦ (VD: Cử nhân Công nghệ Thông tin, GPA: 3.5/4.0)",
  "experience": "Kinh nghiệm ĐẦY ĐỦ (VD: 2022-2024 Frontend Developer, ABC Company - Xây dựng SPA..., tối đa 200 ký tự)",
  "skills": ["Danh sách kỹ năng", "từng", "kỹ", "năng"]
}

QUY TẮC QUAN TRỌNG:
- Nếu KHÔNG TÌM THẤY thông tin, để giá trị null
- CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN (không có \`\`\`json)
- Trả về CHÍNH XÁC format JSON hợp lệ
- Với "experience": gộp tất cả kinh nghiệm thành 1 đoạn văn ngắn gọn
- Với "education": gộp học vị + GPA + năm (nếu có)

CV:
---
${text.substring(0, 4000)}
---

Trả về JSON:`
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.content
      .map((item: any) => (item.type === "text" ? item.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    console.log('🤖 AI Raw Response:', aiResponse);

    // Clean response (remove markdown if present)
    let cleanResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('🧹 Cleaned Response:', cleanResponse);

    // Parse JSON
    const parsed = JSON.parse(cleanResponse);
    
    console.log('✅ Parsed JSON:', parsed);

    return {
      fullText: text,
      fullName: parsed.fullName || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      address: parsed.address || undefined,
      university: parsed.university || undefined,
      education: parsed.education || undefined,
      experience: parsed.experience || undefined,
      skills: parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0 
        ? parsed.skills 
        : undefined
    };

  } catch (error: any) {
    console.error('❌ AI parsing failed:', error);
    if (error.name === 'AbortError') {
      console.log('⏱️ AI request timeout - using regex fallback');
    }
    console.log('⚠️ Falling back to regex-based parsing...');
    return extractInfoWithRegex(text);
  }
}

// ✅ IMPROVED: Fallback regex MẠNH HƠN cho CV tiếng Việt
function extractInfoWithRegex(text: string): ParsedCV {
  const parsed: ParsedCV = {
    fullText: text
  };
  
  console.log('🔍 Starting regex extraction...');
  console.log('📄 Full text:', text.substring(0, 500));
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // ========== 1. FULL NAME ==========
  // Tìm ở đầu file, dòng có 2-5 từ, chỉ chữ cái tiếng Việt
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    const words = line.split(/\s+/);
    
    // Điều kiện: 2-5 từ, mỗi từ viết hoa chữ đầu, tổng 10-50 ký tự
    if (words.length >= 2 && words.length <= 5 && line.length >= 10 && line.length <= 50) {
      const isValidName = words.every(word => /^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]*$/.test(word));
      
      if (isValidName) {
        parsed.fullName = line;
        console.log('✅ Found fullName:', parsed.fullName);
        break;
      }
    }
  }
  
  // ========== 2. EMAIL ==========
  const emailRegex = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/gi;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    parsed.email = emails[0].toLowerCase();
    console.log('✅ Found email:', parsed.email);
  }
  
  // ========== 3. PHONE ==========
  // Tìm pattern +84 hoặc 0 theo sau bởi 9-10 số
  const phoneRegex = /(?:\+84|84|0)[\s.-]?(\d{1,3})[\s.-]?(\d{3,4})[\s.-]?(\d{3,4})/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    parsed.phone = phones[0].replace(/\s+/g, ' ');
    console.log('✅ Found phone:', parsed.phone);
  }
  
  // ========== 4. ADDRESS ==========
  const addressPatterns = [
    /TP\.?\s*H[ồô]\s*Ch[íi]\s*Minh/gi,
    /TP\.?\s*HCM/gi,
    /H[àồ]\s*N[ộô]i/gi,
    /[ĐĐ][àả]\s*N[ẵẳ]ng/gi,
    /C[ầấ]n\s*Th[ơơ]/gi
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      parsed.address = match[0];
      console.log('✅ Found address:', parsed.address);
      break;
    }
  }
  
  // ========== 5. UNIVERSITY ==========
  const universityKeywords = [
    /(?:trường\s+)?đại\s+học\s+[^\n]{5,80}/gi,
    /(?:trường\s+)?university\s+[^\n]{5,80}/gi,
    /(?:trường\s+)?học\s+viện\s+[^\n]{5,80}/gi
  ];
  
  for (const pattern of universityKeywords) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Lấy match dài nhất (thường là tên đầy đủ)
      parsed.university = matches.reduce((a, b) => a.length > b.length ? a : b).trim();
      console.log('✅ Found university:', parsed.university);
      break;
    }
  }
  
  // ========== 6. EDUCATION ==========
  // Tìm dòng có "Cử nhân", "Bachelor", "GPA"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/cử\s*nhân|bachelor|thạc\s*sĩ|master|gpa/gi.test(line)) {
      // Lấy 1-2 dòng context
      const context = lines.slice(i, Math.min(i + 2, lines.length)).join(' ').trim();
      if (context.length >= 20 && context.length <= 250) {
        parsed.education = context;
        console.log('✅ Found education:', parsed.education);
        break;
      }
    }
  }
  
  // ========== 7. EXPERIENCE ==========
  // Tìm section "Kinh nghiệm làm việc" hoặc các keyword
  const experienceKeywords = [
    'frontend developer',
    'backend developer',
    'full stack',
    'software engineer',
    'lập trình viên',
    'developer',
    'engineer'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    
    // Kiểm tra có năm và chức danh
    const hasYear = /20\d{2}/.test(lines[i]);
    const hasJobTitle = experienceKeywords.some(keyword => lineLower.includes(keyword));
    
    if (hasYear && hasJobTitle) {
      // Lấy 2-4 dòng context
      const context = lines.slice(i, Math.min(i + 4, lines.length)).join(' ').trim();
      if (context.length >= 30) {
        parsed.experience = context.substring(0, 250);
        console.log('✅ Found experience:', parsed.experience);
        break;
      }
    }
  }
  
  // ========== 8. SKILLS ==========
  const skillKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'nodejs',
    'python', 'django', 'flask', 'java', 'spring', 'html', 'css', 'sass',
    'tailwind', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'git',
    'github', 'docker', 'kubernetes', 'aws', 'azure', 'agile', 'restful', 'api',
    'redux', 'next.js', 'express', 'fastapi', 'graphql', 'webpack', 'vite'
  ];
  
  const textLower = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(textLower);
  });
  
  if (foundSkills.length > 0) {
    // Capitalize và remove duplicates
    parsed.skills = [...new Set(foundSkills)].map(s => {
      // Giữ nguyên case đặc biệt
      const specialCase: Record<string, string> = {
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'nodejs': 'Node.js',
        'node.js': 'Node.js',
        'postgresql': 'PostgreSQL',
        'mongodb': 'MongoDB',
        'restful': 'RESTful',
        'api': 'API',
        'html': 'HTML',
        'css': 'CSS',
        'sql': 'SQL',
        'aws': 'AWS',
        'azure': 'Azure',
        'next.js': 'Next.js',
        'vue': 'Vue',
        'fastapi': 'FastAPI',
        'graphql': 'GraphQL'
      };
      
      return specialCase[s.toLowerCase()] || (s.charAt(0).toUpperCase() + s.slice(1));
    });
    console.log('✅ Found skills:', parsed.skills);
  }
  
  console.log('📊 Final regex result:', parsed);
  
  return parsed;
}

// Main parse function
export async function parseCV(file: File): Promise<ParsedCV> {
  let text = '';
  
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    // Extract text
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('📄 Parsing PDF...');
      text = await parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      console.log('📄 Parsing DOCX...');
      text = await parseDOCX(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      console.log('📄 Parsing TXT...');
      text = await parseTXT(file);
    } else {
      throw new Error('Định dạng file không được hỗ trợ');
    }
    
    console.log('✅ Text extracted:', text.length, 'chars');
    console.log('📝 First 500 chars:', text.substring(0, 500));
    
    // ✅ TRY AI FIRST, fallback to regex if fail
    let result: ParsedCV;
    
    try {
      result = await extractInfoWithAI(text);
    } catch (error) {
      console.warn('⚠️ AI failed, using regex only');
      result = extractInfoWithRegex(text);
    }
    
    console.log('📊 Final Parsed Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Parse error:', error);
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
  
  const maxSize = 5 * 1024 * 1024;
  
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