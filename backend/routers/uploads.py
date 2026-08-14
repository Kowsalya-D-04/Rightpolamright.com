"""Load image uploads.

Files are written to backend/uploads and served back as /uploads/<name>.
The database stores only the URL, so swapping to S3 later means changing
this router alone.
"""
import os
import secrets

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from utils.security import get_current_user

router = APIRouter(prefix="/api/uploads", tags=["Uploads"],
                   dependencies=[Depends(get_current_user)])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_BYTES = 5 * 1024 * 1024


@router.post("/load-image")
async def upload_load_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Upload a JPG, PNG or WebP image.")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "That image is over 5 MB. Please upload a smaller one.")
    if not data:
        raise HTTPException(400, "That file appears to be empty.")

    name = f"load_{secrets.token_hex(8)}{ALLOWED[file.content_type]}"
    with open(os.path.join(UPLOAD_DIR, name), "wb") as fh:
        fh.write(data)

    return {"url": f"/uploads/{name}", "filename": name, "size_bytes": len(data)}
