import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
import logging
import json
import PyPDF2
import io

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
        "HTTP-Referer": "http://localhost:5173",  # Tên app của anh
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

Trả về JSON với cấu trúc:
{{
  "name": "tên ứng viên",
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
        logger.info("🤖 GPT response nhận thành công (ẩn nội dung trong log để bảo mật).")

        # Parse JSON
        try:
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()

            parsed_json = json.loads(result_text)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Cannot parse JSON: {e}")
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
                "tokens_count": getattr(response, "usage", {}).get("total_tokens", None),
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
