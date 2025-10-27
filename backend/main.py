import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
import logging
import json
import PyPDF2
import io
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# =========================================
# Load environment
# =========================================
load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("❌ Thiếu OpenRouter API key trong file .env")

# ✅ Không log key thật ra console
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
logger.info("🔒 OpenRouter API key loaded (ẩn trong log).")

# Khởi tạo client OpenRouter an toàn
client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Recruit AI CV Parser"
    }
)

app = FastAPI(title="CV Parser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# Pydantic Models
# =========================================
class CVData(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    university: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None

class JobData(BaseModel):
    id: str
    title: str
    department: Optional[str] = None
    level: Optional[str] = None
    job_type: Optional[str] = None
    work_location: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None

class MatchCVJobsRequest(BaseModel):
    cv_text: str
    cv_data: CVData
    jobs: List[JobData]
    primary_job_id: Optional[str] = None

# =========================================
# Helper: Đọc PDF
# =========================================
def extract_text_from_pdf(content: bytes) -> str:
    """Trích xuất text từ PDF bytes"""
    try:
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"

        if text.strip():
            return text

        return content.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.warning(f"Lỗi đọc PDF: {e}, fallback sang UTF-8")
        return content.decode("utf-8", errors="ignore")

# =========================================
# Route kiểm tra server
# =========================================
@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

# =========================================
# Route parse 1 CV
# =========================================
@app.post("/api/parse-cv")
async def parse_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()

        # ✅ Xử lý PDF đúng cách
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            text = content.decode("utf-8", errors="ignore")

        logger.info(f"📄 Đọc được {len(text)} ký tự từ {file.filename}")

        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="File trống hoặc không đọc được nội dung")

        prompt = f"""
Bạn là chuyên gia phân tích CV. Hãy đọc kỹ CV sau và trích xuất thông tin CHÍNH XÁC.

QUAN TRỌNG: 
- Nếu không tìm thấy thông tin, để trống "" thay vì "N/A"
- Skills phải là array các string
- Trả về ĐÚNG định dạng JSON, không thêm markdown ```json
- ĐẶC BIỆT CHÚ Ý: Trường "name" là HỌ TÊN ỨNG VIÊN, thường ở đầu CV, là TÊN NGƯỜI, không phải tên công ty hay tên dự án

Trả về JSON với cấu trúc:
{{
  "name": "tên đầy đủ của ứng viên",
  "email": "email",
  "phone": "số điện thoại",
  "address": "địa chỉ",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": "kinh nghiệm làm việc",
  "education": "học vấn",
  "university": "tên trường"
}}

CV Content:
{text[:4000]}
"""

        response = client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.1,
        )

        result_text = response.choices[0].message.content.strip()
        logger.info("🤖 GPT response nhận thành công.")

        # Parse JSON
        try:
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()

            parsed_json = json.loads(result_text)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Cannot parse JSON: {e}")
            logger.error(f"Raw response: {result_text[:500]}")
            parsed_json = {}

        # Chuẩn hóa dữ liệu
        def safe_get(field, default=""):
            return parsed_json.get(field, default) if parsed_json else default

        name = safe_get("name")
        email = safe_get("email")
        phone = safe_get("phone")
        address = safe_get("address")
        skills = safe_get("skills", [])
        experience = safe_get("experience")
        education = safe_get("education")
        university = safe_get("university")

        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        # ✅ FIX: Truy cập usage object đúng cách
        tokens_count = None
        if hasattr(response, 'usage') and response.usage:
            tokens_count = response.usage.total_tokens

        return {
            "success": True,
            "data": {
                "name": name,
                "email": email,
                "phone": phone,
                "address": address,
                "skills": skills,
                "experience": experience,
                "education": education,
                "university": university,
                "fullText": text[:1000],
                "parseQuality": "good",
            },
            "metadata": {
                "tokens_count": tokens_count,
                "confidence": 0.85,
                "model": "openai/gpt-4o"
            }
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Lỗi khi xử lý CV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý CV: {str(e)}")

# =========================================
# Route match CV với Jobs
# =========================================
@app.post("/api/match-cv-jobs")
async def match_cv_jobs(request: MatchCVJobsRequest):
    """
    Phân tích độ phù hợp của CV với các Jobs bằng GPT-4o
    """
    try:
        cv_text = request.cv_text
        cv_data = request.cv_data
        jobs = request.jobs
        primary_job_id = request.primary_job_id

        if not cv_text or not cv_data or not jobs:
            raise HTTPException(status_code=400, detail="Thiếu thông tin CV hoặc Jobs")

        logger.info(f"🎯 Analyzing CV matching với {len(jobs)} jobs...")

        # Build jobs context
        jobs_context = ""
        primary_job = None
        
        for job in jobs:
            is_primary = job.id == primary_job_id
            if is_primary:
                primary_job = job
            
            jobs_context += f"""{'⭐ PRIMARY JOB - ' if is_primary else ''}Job {job.id}:
- Tiêu đề: {job.title}
- Phòng ban: {job.department or 'N/A'}
- Cấp độ: {job.level or 'N/A'}
- Loại hình: {job.job_type or 'N/A'}
- Địa điểm làm việc: {job.work_location or job.location or 'N/A'}
- Mô tả công việc: {job.description or 'N/A'}
- Yêu cầu công việc: {job.requirements or 'N/A'}
- Quyền lợi: {job.benefits or 'N/A'}
{'(Đây là vị trí ứng viên đã apply - ưu tiên đánh giá)' if is_primary else ''}

"""

        # Build CV context
        cv_context = f"""
CV của ứng viên:
- Họ và tên: {cv_data.full_name}
- Email: {cv_data.email or 'N/A'}
- Số điện thoại: {cv_data.phone_number or 'N/A'}
- Địa chỉ: {cv_data.address or 'N/A'}
- Trường đại học: {cv_data.university or 'N/A'}
- Học vấn: {cv_data.education or 'N/A'}
- Kinh nghiệm làm việc: {cv_data.experience or 'N/A'}
- Nội dung chi tiết CV: {cv_text[:3000]}
"""

        primary_job_title = primary_job.title if primary_job else ""

        prompt = f"""Bạn là chuyên gia tuyển dụng HR chuyên nghiệp trong lĩnh vực IT với hơn 15 năm kinh nghiệm. Hãy phân tích CV sau so với các Job vị trí ứng tuyển tương ứng và đánh giá độ phù hợp với các công việc một cách CHI TIẾT và CHÍNH XÁC.

{cv_context}

CÁC CÔNG VIỆC CẦN ĐÁNH GIÁ:
{jobs_context}

HƯỚNG DẪN ĐÁNH GIÁ:
1. Đánh giá theo các tiêu chí sau (thang điểm 100):
   - Kinh nghiệm liên quan (30 điểm): So sánh kinh nghiệm với yêu cầu công việc
   - Kỹ năng kỹ thuật (25 điểm): Đánh giá kỹ năng chuyên môn phù hợp
   - Học vấn (15 điểm): Bằng cấp, trường học phù hợp với yêu cầu
   - Cấp độ phù hợp (15 điểm): Level (Junior/Mid/Senior) khớp với yêu cầu
   - Địa điểm (10 điểm): Phù hợp với work_location
   - Soft skills (5 điểm): Kỹ năng mềm từ CV

2. {f'ƯU TIÊN đánh giá cho Job "{primary_job_title}" (có dấu ⭐) vì đây là vị trí ứng viên đã apply.' if primary_job else 'Đánh giá công bằng cho tất cả các jobs.'}

3. Phân tích CỤ THỂ:
   - Điểm mạnh: Liệt kê các điểm phù hợp CỤ THỂ với từng job (tối thiểu 3 điểm)
   - Điểm yếu: Chỉ ra thiếu sót hoặc không phù hợp (1-2 điểm)
   - Khuyến nghị: Đưa ra lời khuyên CHI TIẾT (50-100 từ)

4. Chấm điểm THỰC TẾ và CHÍNH XÁC:
   - Tránh chấm điểm quá cao nếu không đủ điều kiện
   - Tránh chấm điểm quá thấp nếu ứng viên có tiềm năng
   - Giải thích rõ ràng tại sao cho điểm đó

HÃY TRẢ VỀ JSON với format SAU (CHÍNH XÁC, không thêm text nào khác):
{{
  "overall_score": 85,
  "best_match": {{
    "job_id": "job-uuid-here",
    "job_title": "Job Title",
    "match_score": 92,
    "strengths": ["Có X năm kinh nghiệm với công nghệ Y phù hợp với yêu cầu", "Học vấn đạt chuẩn với bằng Z từ trường A", "Kỹ năng B,C,D match với requirements"],
    "weaknesses": ["Thiếu kinh nghiệm về aspect X được nêu trong JD", "Chưa làm việc với tool Y"],
    "recommendation": "Ứng viên có nền tảng vững chắc và kinh nghiệm phù hợp. Điểm mạnh nổi bật là... Tuy nhiên cần bổ sung thêm về... Nên mời phỏng vấn để đánh giá sâu hơn về..."
  }},
  "all_matches": [
    {{
      "job_id": "job-uuid-1",
      "job_title": "Job 1",
      "match_score": 92,
      "strengths": ["Strength 1 cụ thể", "Strength 2 cụ thể", "Strength 3 cụ thể"],
      "weaknesses": ["Weakness 1 cụ thể", "Weakness 2 cụ thể"],
      "recommendation": "Khuyến nghị chi tiết và cụ thể"
    }}
  ]
}}

LƯU Ý QUAN TRỌNG:
- overall_score: Điểm TỔNG THỂ dựa trên best_match (0-100)
- match_score: Điểm phù hợp cho TỪNG job (0-100)
- best_match: Công việc phù hợp NHẤT {f'(ưu tiên "{primary_job_title}")' if primary_job else ''}
- Sắp xếp all_matches theo match_score GIẢM DẦN
- PHẢI có ít nhất 3 strengths và 1-2 weaknesses cho mỗi job
- recommendation PHẢI chi tiết, cụ thể, từ 50-100 từ
"""

        # Call OpenRouter API
        response = client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "Bạn là chuyên gia tuyển dụng HR chuyên nghiệp trong lĩnh vực IT với hơn 15 năm kinh nghiệm. Hãy phân tích CV so với các Job và đánh giá độ phù hợp một cách CHI TIẾT và CHÍNH XÁC. Trả về JSON đúng format được yêu cầu."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=2500,
            temperature=0.2,
        )

        result_text = response.choices[0].message.content.strip()
        logger.info("🤖 GPT matching analysis thành công.")

        # Parse JSON
        try:
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()

            analysis_result = json.loads(result_text)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Cannot parse JSON: {e}")
            logger.error(f"Raw response: {result_text[:500]}")
            raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ")

        # Get tokens count
        tokens_count = None
        if hasattr(response, 'usage') and response.usage:
            tokens_count = response.usage.total_tokens

        return {
            "success": True,
            "data": analysis_result,
            "metadata": {
                "tokens_count": tokens_count,
                "jobs_analyzed": len(jobs),
                "model": "openai/gpt-4o"
            }
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"❌ Lỗi khi match CV với jobs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích: {str(e)}")

# =========================================
# Route parse nhiều CV
# =========================================
@app.post("/api/batch-parse-cv")
async def batch_parse_cv(files: list[UploadFile]):
    results = []
    for file in files:
        try:
            parsed = await parse_cv(file)
            results.append({
                "filename": file.filename,
                "success": True,
                "data": parsed["data"]
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    return {"results": results}

# =========================================
# Chạy server
# =========================================
if __name__ == "__main__":
    import uvicorn
    logger.info("✅ OpenRouter client khởi tạo an toàn.")
    logger.info("🚀 Backend API đang chạy trên http://0.0.0.0:8000")
    logger.info("📝 Endpoints:")
    logger.info("   - GET  /health")
    logger.info("   - POST /api/parse-cv")
    logger.info("   - POST /api/match-cv-jobs")
    logger.info("   - POST /api/batch-parse-cv")
    uvicorn.run(app, host="0.0.0.0", port=8000)