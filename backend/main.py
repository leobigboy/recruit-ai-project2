import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
import logging
import json

# =========================================
# Load environment
# =========================================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("❌ Thiếu OpenAI API key trong file .env")

client = OpenAI(api_key=OPENAI_API_KEY)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================
# App khởi tạo
# =========================================
app = FastAPI(title="CV Parser API")

# Cho phép frontend truy cập
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        text = content.decode("utf-8", errors="ignore")

        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="File trống hoặc không đọc được nội dung")

        # Gửi text CV đến model OpenAI để trích xuất
        prompt = f"""
Bạn là một chuyên gia phân tích CV. Hãy phân tích CV sau và trả về JSON với các trường:
- name: tên ứng viên
- email: email
- phone: số điện thoại
- address: địa chỉ
- skills: danh sách kỹ năng (array)
- experience: kinh nghiệm làm việc (string)
- education: học vấn (string)
- university: tên trường đại học

Chỉ trả về JSON thuần, không thêm markdown hay text khác.

CV content:
{text[:3000]}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.3,
        )

        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON từ response
        try:
            # Xóa markdown nếu có
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError:
            logger.error(f"Cannot parse JSON from OpenAI: {result_text}")
            parsed_json = {}

        # Chuẩn hóa dữ liệu
        name = parsed_json.get("name", "unknown")
        email = parsed_json.get("email", "unknown")
        phone = parsed_json.get("phone", "unknown")
        address = parsed_json.get("address", "unknown")
        skills = parsed_json.get("skills", [])
        experience = parsed_json.get("experience", "")
        education = parsed_json.get("education", "")
        university = parsed_json.get("university", "")

        # Đảm bảo skills là array
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
                "fullText": text,
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
                "model": "gpt-4o-mini"
            }
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Lỗi khi xử lý CV: {str(e)}")
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
    logger.info("✅ Đã nạp OpenAI API key thành công.")
    logger.info("✅ Client OpenAI đã được khởi tạo thành công.")
    uvicorn.run(app, host="0.0.0.0", port=8000)