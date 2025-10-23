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

// ✅ FIXED: Không gọi AI nữa - dùng regex parsing mạnh mẽ
// Nếu muốn dùng AI, cần tạo backend API endpoint
async function extractInfoWithAI(text: string): Promise<ParsedCV> {
  console.log('⚠️ AI parsing tạm thời disabled (cần backend API)');
  console.log('🔄 Sử dụng regex parsing...');
  return extractInfoWithRegex(text);
}

// ✅ IMPROVED: Regex parser MẠNH HƠN cho CV tiếng Việt
function extractInfoWithRegex(text: string): ParsedCV {
  const parsed: ParsedCV = {
    fullText: text
  };
  
  console.log('🔍 Starting regex extraction...');
  console.log('📄 Text length:', text.length);
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // ========== 1. FULL NAME ==========
  // Chiến lược: Tìm ở 10 dòng đầu, chỉ chữ cái tiếng Việt, 2-5 từ
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();
    const words = line.split(/\s+/);
    
    // Bỏ qua dòng có số, email, hoặc ký tự đặc biệt
    if (/\d|@|[^\p{L}\s]/u.test(line)) continue;
    
    // Điều kiện: 2-5 từ, mỗi từ viết hoa chữ đầu, 10-50 ký tự
    if (words.length >= 2 && words.length <= 5 && line.length >= 10 && line.length <= 50) {
      const isValidName = words.every(word => 
        /^[\p{Lu}][\p{Ll}]*$/u.test(word) // Unicode-aware: chữ đầu hoa, còn lại thường
      );
      
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
  // Pattern linh hoạt: +84, 84, 0, với hoặc không dấu cách/gạch ngang
  const phoneRegex = /(?:\+?84|0)[\s.-]?[1-9]\d{1,2}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    // Chuẩn hóa: giữ dấu cách, xóa gạch ngang
    parsed.phone = phones[0].replace(/[-]/g, '').replace(/\s+/g, ' ').trim();
    console.log('✅ Found phone:', parsed.phone);
  }
  
  // ========== 4. ADDRESS ==========
  const addressPatterns = [
    /TP\.?\s*H[ồô]\s*Ch[íi]\s*Minh/gi,
    /TP\.?\s*HCM/gi,
    /Th[àả]nh\s*ph[ốồ]\s*H[ồô]\s*Ch[íi]\s*Minh/gi,
    /H[àồ]\s*N[ộô]i/gi,
    /[ĐĐ][àả]\s*N[ẵẳ]ng/gi,
    /C[ầấ]n\s*Th[ơơ]/gi,
    /H[ảả]i\s*Ph[òó]ng/gi,
    /Nha\s*Trang/gi
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Chuẩn hóa
      let addr = match[0];
      if (/HCM/i.test(addr)) {
        addr = 'TP. Hồ Chí Minh';
      }
      parsed.address = addr;
      console.log('✅ Found address:', parsed.address);
      break;
    }
  }
  
  // ========== 5. UNIVERSITY ==========
  const universityPatterns = [
    /(?:trường\s+)?đại\s+học\s+[^\n.,;]{5,100}/gi,
    /(?:trường\s+)?university\s+[^\n.,;]{5,100}/gi,
    /(?:trường\s+)?học\s+viện\s+[^\n.,;]{5,100}/gi,
    /(?:trường\s+)?cao\s+đẳng\s+[^\n.,;]{5,100}/gi
  ];
  
  for (const pattern of universityPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Lấy match dài nhất (thường là tên đầy đủ nhất)
      const longest = matches.reduce((a, b) => a.length > b.length ? a : b);
      // Clean: xóa khoảng trắng thừa
      parsed.university = longest.trim().replace(/\s+/g, ' ');
      console.log('✅ Found university:', parsed.university);
      break;
    }
  }
  
  // ========== 6. EDUCATION ==========
  // Tìm dòng có từ khóa học vấn
  const educationKeywords = [
    /cử\s*nhân/gi, 
    /bachelor/gi, 
    /thạc\s*sĩ/gi, 
    /master/gi, 
    /tiến\s*sĩ/gi,
    /phd|ph\.d/gi,
    /gpa/gi,
    /major/gi,
    /chuyên\s*ngành/gi
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasKeyword = educationKeywords.some(pattern => pattern.test(line));
    
    if (hasKeyword) {
      // Lấy 1-3 dòng context
      const context = lines.slice(i, Math.min(i + 3, lines.length))
        .join(' ')
        .trim()
        .replace(/\s+/g, ' ');
      
      if (context.length >= 20 && context.length <= 300) {
        parsed.education = context;
        console.log('✅ Found education:', parsed.education);
        break;
      }
    }
  }
  
  // ========== 7. EXPERIENCE ==========
  // Tìm dòng có năm + chức danh
  const experienceKeywords = [
    'developer', 'engineer', 'programmer', 'lập trình viên',
    'frontend', 'backend', 'full stack', 'fullstack',
    'software', 'web', 'mobile', 'internship', 'thực tập'
  ];
  
  let experienceParts: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    
    // Kiểm tra có năm (2019-2024) và chức danh
    const hasYear = /20[12]\d/.test(lines[i]);
    const hasJobTitle = experienceKeywords.some(keyword => lineLower.includes(keyword));
    
    if (hasYear && hasJobTitle) {
      // Lấy 2-4 dòng làm 1 đoạn kinh nghiệm
      const segment = lines.slice(i, Math.min(i + 4, lines.length))
        .join(' ')
        .trim()
        .replace(/\s+/g, ' ');
      
      if (segment.length >= 30) {
        experienceParts.push(segment);
        i += 3; // Skip những dòng đã lấy
      }
    }
  }
  
  if (experienceParts.length > 0) {
    // Gộp tất cả, giới hạn 300 ký tự
    parsed.experience = experienceParts.join('. ').substring(0, 300);
    console.log('✅ Found experience:', parsed.experience);
  }
  
  // ========== 8. SKILLS ==========
  const skillKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'svelte',
    'node.js', 'nodejs', 'express', 'nest.js', 'next.js', 'nuxt',
    'python', 'django', 'flask', 'fastapi', 
    'java', 'spring', 'spring boot',
    'c#', 'c++', 'go', 'rust', 'php', 'laravel',
    'html', 'css', 'sass', 'scss', 'tailwind', 'bootstrap',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'git', 'github', 'gitlab', 'docker', 'kubernetes', 'jenkins',
    'aws', 'azure', 'gcp', 'firebase', 
    'agile', 'scrum', 'restful', 'graphql', 'api',
    'redux', 'mobx', 'zustand', 'webpack', 'vite', 'babel'
  ];
  
  const textLower = text.toLowerCase();
  const foundSkills: string[] = [];
  
  for (const skill of skillKeywords) {
    // Word boundary check (tránh match "express" trong "expression")
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      foundSkills.push(skill);
    }
  }
  
  if (foundSkills.length > 0) {
    // Capitalize đúng cách
    const capitalizeMap: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'next.js': 'Next.js',
      'nest.js': 'Nest.js',
      'nuxt': 'Nuxt.js',
      'postgresql': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'mysql': 'MySQL',
      'restful': 'RESTful',
      'graphql': 'GraphQL',
      'api': 'API',
      'html': 'HTML',
      'css': 'CSS',
      'sass': 'SASS',
      'scss': 'SCSS',
      'sql': 'SQL',
      'aws': 'AWS',
      'gcp': 'GCP',
      'azure': 'Azure',
      'fastapi': 'FastAPI',
      'vue': 'Vue.js',
      'c#': 'C#',
      'c++': 'C++',
      'spring boot': 'Spring Boot',
      'elasticsearch': 'Elasticsearch'
    };
    
    parsed.skills = [...new Set(foundSkills)].map(s => 
      capitalizeMap[s.toLowerCase()] || (s.charAt(0).toUpperCase() + s.slice(1))
    );
    
    console.log('✅ Found skills:', parsed.skills);
  }
  
  console.log('📊 Final parsed result:', {
    fullName: parsed.fullName,
    email: parsed.email,
    phone: parsed.phone,
    address: parsed.address,
    university: parsed.university?.substring(0, 50) + '...',
    skillsCount: parsed.skills?.length
  });
  
  return parsed;
}

// Main parse function
export async function parseCV(file: File): Promise<ParsedCV> {
  let text = '';
  
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    // Extract text based on file type
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
    
    console.log('✅ Text extracted:', text.length, 'characters');
    
    // ✅ Chỉ dùng regex parsing (AI tạm disabled)
    const result = extractInfoWithRegex(text);
    
    console.log('📊 Parse complete!');
    
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