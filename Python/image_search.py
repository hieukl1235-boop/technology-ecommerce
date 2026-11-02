
import os
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

from database import get_connection


# =========================
# 1. CẤU HÌNH
# =========================

MODEL_NAME = "openai/clip-vit-base-patch32"

BACKEND_DIR = Path(
    r"D:\LuanVan\technology-ecommerce-backend"
)

PRODUCT_IMAGE_DIR = (
    BACKEND_DIR / "src" / "uploads" / "products"
)

VARIANT_IMAGE_DIR = (
    BACKEND_DIR / "src" / "uploads" / "variants"
)

DEVICE = "cpu"

_model = None
_processor = None

# Lưu đặc trưng ảnh trong bộ nhớ để không phải tính lại
# mỗi khi người dùng tìm kiếm.
_image_index = None


# =========================
# 2. TẢI MÔ HÌNH CLIP
# =========================

def load_model():
    global _model, _processor

    if _model is None:
        print("Dang tai mo hinh CLIP...")

        _processor = CLIPProcessor.from_pretrained(
            MODEL_NAME
        )

        _model = CLIPModel.from_pretrained(
            MODEL_NAME
        )

        _model.to(DEVICE)
        _model.eval()

        print("Da tai mo hinh CLIP.")

    return _model, _processor


# =========================
# 3. TRÍCH XUẤT ĐẶC TRƯNG ẢNH
# =========================

def extract_image_features(image):
    """
    Nhận ảnh PIL hoặc đường dẫn ảnh.
    Trả về vector đặc trưng CLIP có 512 chiều.
    """

    model, processor = load_model()

    if isinstance(image, (str, os.PathLike)):
        with Image.open(image) as source:
            image = source.convert("RGB")
    else:
        image = image.convert("RGB")

    inputs = processor(
        images=image,
        return_tensors="pt"
    )

    inputs = {
        key: value.to(DEVICE)
        for key, value in inputs.items()
    }

    with torch.no_grad():
        # Trích xuất đặc trưng từ bộ mã hóa ảnh.
        vision_outputs = model.vision_model(
            pixel_values=inputs["pixel_values"]
        )

        # Chiếu đặc trưng sang không gian chung của CLIP.
        features = model.visual_projection(
            vision_outputs.pooler_output
        )

        # Chuẩn hóa vector để so sánh cosine.
        features = F.normalize(
            features,
            p=2,
            dim=-1
        )

    return features[0].cpu().numpy()


# =========================
# 4. LẤY DANH SÁCH ẢNH TỪ DATABASE
# =========================

def fetch_product_images():
    """
    Lấy ảnh chính, ảnh bổ sung và ảnh biến thể
    của các sản phẩm đang hoạt động.
    """

    query = """
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.main_image AS image_url,
            'products' AS image_type
        FROM products p
        WHERE p.status = 1
          AND p.main_image IS NOT NULL
          AND TRIM(p.main_image) <> ''

        UNION ALL

        SELECT
            p.id AS product_id,
            p.name AS product_name,
            pi.image_url AS image_url,
            'products' AS image_type
        FROM product_images pi
        JOIN products p ON p.id = pi.product_id
        WHERE p.status = 1
          AND pi.image_url IS NOT NULL
          AND TRIM(pi.image_url) <> ''

        UNION ALL

        SELECT
            p.id AS product_id,
            p.name AS product_name,
            pv.image_url AS image_url,
            'variants' AS image_type
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE p.status = 1
          AND pv.status = 1
          AND pv.image_url IS NOT NULL
          AND TRIM(pv.image_url) <> ''
    """

    conn = get_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute(query)

            rows = cursor.fetchall()

            columns = [
                column[0]
                for column in cursor.description
            ]

        return [
            dict(zip(columns, row))
            for row in rows
        ]

    finally:
        conn.close()


# =========================
# 5. XÁC ĐỊNH ĐƯỜNG DẪN ẢNH
# =========================

def resolve_image_path(image_url, image_type):
    """
    Database lưu tên file ảnh.
    Thử tìm file trong thư mục ảnh tương ứng.
    """

    if not image_url:
        return None

    image_url = str(image_url).strip()

    # Chuẩn hóa dấu phân cách đường dẫn Windows.
    normalized = image_url.replace("\\", "/")

    # Trường hợp database lưu cả đường dẫn.
    if "/uploads/variants/" in normalized:
        folders = [VARIANT_IMAGE_DIR]
    elif "/uploads/products/" in normalized:
        folders = [PRODUCT_IMAGE_DIR]
    elif image_type == "variants":
        folders = [
            VARIANT_IMAGE_DIR,
            PRODUCT_IMAGE_DIR
        ]
    else:
        folders = [
            PRODUCT_IMAGE_DIR,
            VARIANT_IMAGE_DIR
        ]

    # Database có thể lưu URL hoặc đường dẫn tương đối.
    filename = normalized.rsplit("/", 1)[-1]

    for folder in folders:
        path = folder / filename

        if path.is_file():
            return path

    return None


# =========================
# 6. XÂY DỰNG CHỈ MỤC ẢNH
# =========================

def build_image_index(force_rebuild=False):
    """
    Đọc ảnh sản phẩm và tính vector CLIP.
    Chỉ xây dựng lại khi chưa có chỉ mục
    hoặc khi force_rebuild=True.
    """

    global _image_index

    if _image_index is not None and not force_rebuild:
        return _image_index

    print("Dang xay dung chi muc anh san pham...")

    rows = fetch_product_images()

    valid_rows = []
    feature_vectors = []

    for row in rows:
        image_path = resolve_image_path(
            row["image_url"],
            row["image_type"]
        )

        if image_path is None:
            print(
                "Bo qua anh khong ton tai:",
                row["image_url"]
            )
            continue

        try:
            features = extract_image_features(image_path)

            valid_rows.append({
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "image_url": row["image_url"],
                "image_type": row["image_type"],
                "image_path": str(image_path)
            })

            feature_vectors.append(features)

        except Exception as error:
            print(
                f"Loi doc anh {image_path}: {error}"
            )

    if feature_vectors:
        feature_matrix = np.stack(feature_vectors)
    else:
        feature_matrix = np.empty(
            (0, 512),
            dtype=np.float32
        )

    _image_index = {
        "rows": valid_rows,
        "features": feature_matrix
    }

    print(
        f"Da tao chi muc cho {len(valid_rows)} anh."
    )

    return _image_index


# =========================
# 7. TÌM KIẾM SẢN PHẨM BẰNG ẢNH
# =========================

def search_products_by_image(image, top_k=10):
    """
    image: đường dẫn ảnh hoặc đối tượng ảnh PIL.
    top_k: số sản phẩm tối đa muốn trả về.

    Kết quả được xếp theo độ tương đồng giảm dần.
    """

    if top_k < 1:
        return []

    query_features = extract_image_features(image)

    index = build_image_index()

    rows = index["rows"]
    feature_matrix = index["features"]

    if not rows:
        return []

    # Vector đã chuẩn hóa nên tích vô hướng
    # tương đương cosine similarity.
    similarities = feature_matrix @ query_features

    # Mỗi sản phẩm có thể có nhiều ảnh.
    # Giữ điểm cao nhất của mỗi sản phẩm.
    best_products = {}

    for row, score in zip(rows, similarities):
        product_id = row["product_id"]
        score = float(score)

        if (
            product_id not in best_products
            or score > best_products[product_id]["similarity"]
        ):
            best_products[product_id] = {
                "product_id": product_id,
                "product_name": row["product_name"],
                "image_url": row["image_url"],
                "similarity": score
            }

    results = sorted(
        best_products.values(),
        key=lambda item: item["similarity"],
        reverse=True
    )

    return [
        {
            **item,
            "similarity": round(item["similarity"], 4)
        }
        for item in results[:top_k]
    ]


# =========================
# 8. CHẠY THỬ TRỰC TIẾP
# =========================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            'Cach dung: python image_search.py "duong_dan_anh.jpg"'
        )
        sys.exit(1)

    image_path = Path(sys.argv[1])

    if not image_path.is_file():
        print("Khong tim thay anh:", image_path)
        sys.exit(1)

    results = search_products_by_image(
        image_path,
        top_k=10
    )

    if not results:
        print(
            "Khong tim thay anh san pham hop le trong database."
        )
    else:
        print("\nKet qua tim kiem:")

        for position, item in enumerate(results, start=1):
            print(
                f"{position}. {item['product_name']} "
                f"| ID: {item['product_id']} "
                f"| Similarity: {item['similarity']}"
            )
