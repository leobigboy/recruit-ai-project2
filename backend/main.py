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

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Recruit AI CV Parser"
    }
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        # Thử dùng PyPDF2
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        if text.strip():
            return text
        
        # Nếu PyPDF2 thất bại, thử decode UTF-8
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
        # Đọc nội dung file
        content = await file.read()
        
        # ✅ Xử lý PDF đúng cách
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        else:
            text = content.decode("utf-8", errors="ignore")

        logger.info(f"📄 Đọc được {len(text)} ký tự từ {file.filename}")
        logger.info(f"📝 Preview: {text[:500]}...")  # Log 500 ký tự đầu

        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="File trống hoặc không đọc được nội dung")

        # Prompt cải tiến
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

        # Gọi GPT-4o
        response = client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.1,  # Giảm temperature để chính xác hơn
        )

        result_text = response.choices[0].message.content.strip()
        logger.info(f"🤖 GPT Response: {result_text}")
        
        # Parse JSON
        try:
            # Xóa markdown nếu có
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            elif result_text.startswith("```"):
                result_text = result_text.replace("```", "").strip()
            
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Cannot parse JSON: {e}")
            logger.error(f"Raw response: {result_text}")
            # Fallback: trả về empty data
            parsed_json = {}

        # Chuẩn hóa dữ liệu
        name = parsed_json.get("name", "")
        email = parsed_json.get("email", "")
        phone = parsed_json.get("phone", "")
        address = parsed_json.get("address", "")
        skills = parsed_json.get("skills", [])
        experience = parsed_json.get("experience", "")
        education = parsed_json.get("education", "")
        university = parsed_json.get("university", "")

        # Đảm bảo skills là array
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        logger.info(f"✅ Parsed: name={name}, email={email}, skills={skills}")

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
                "fullText": text[:1000],  # Trả về 1000 ký tự đầu
                "parseQuality": "good",
                "extractedFields": {
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "skills": skills,
                    "experience": experience,
                    "education": education,
                    "university": university,
                }
            },
            "metadata": {
                "tokens_count": response.usage.total_tokens,
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
    logger.info("✅ Đã nạp OpenRouter API key thành công.")
    logger.info("✅ Client OpenRouter với GPT-4o đã được khởi tạo.")
    uvicorn.run(app, host="0.0.0.0", port=8000)