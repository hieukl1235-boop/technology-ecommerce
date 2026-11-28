from flask import Flask, jsonify, request
from flask_cors import CORS

from database import (
    load_products,
    load_interactions,
    load_order_statuses
)
from content_based import (
    build_content_model,
    recommend_products as recommend_content
)
from item_based_cf import (
    build_item_similarity,
    recommend_products as recommend_item
)
from user_based_cf import (
    build_user_similarity,
    recommend_for_user
)
from hybrid_recommendation import recommend_hybrid
from PIL import Image, UnidentifiedImageError
from image_search import search_products_by_image
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
app.json.ensure_ascii = False
CORS(app, origins=["http://localhost:5173"])
import joblib
import re
from underthesea import word_tokenize
tfidf_vectorizer = joblib.load(
    r"D:\LuanVan\Python\tfidf_vectorizer.pkl"
)

sentiment_model = joblib.load(
    r"D:\LuanVan\Python\sentiment_model.pkl"
)

print("Đã nạp mô hình phân loại cảm xúc.")
# Nạp dữ liệu và tạo hai mô hình một lần khi Flask khởi động
try:
    print("Các trạng thái đơn hàng/thanh toán:")
    print(load_order_statuses())

    products = load_products()
    products, content_similarity_matrix = build_content_model(products)

    interactions = load_interactions()
    cf_product_ids, cf_product_names, cf_similarity_matrix = (
        build_item_similarity(interactions)
    )
    user_ids, user_product, user_similarity_matrix, user_product_names = (
        build_user_similarity(interactions)
    )

    print(f"Đã nạp {len(products)} sản phẩm cho Content-based.")
    print(f"Item-based có {len(cf_product_ids)} sản phẩm từ lịch sử mua.")
except Exception as error:
    print(f"Không thể khởi tạo dữ liệu gợi ý: {error}")
    raise

def get_top_n():
    try:
        top_n = int(request.args.get("top_n", 5))
    except ValueError:
        return None

    if top_n < 1:
        return None

    return min(top_n, 20)


@app.get("/api/products/<int:product_id>/recommendations")
def get_content_recommendations(product_id):
    top_n = get_top_n()

    if top_n is None:
        return jsonify({"error": "top_n phải là số nguyên lớn hơn 0."}), 400

    recommendations = recommend_content(
        product_id=product_id,
        products=products,
        similarity_matrix=content_similarity_matrix,
        top_n=top_n
    )

    if recommendations is None:
        return jsonify({
            "error": f"Không tìm thấy sản phẩm có ID {product_id}."
        }), 404

    return jsonify({
        "product_id": product_id,
        "recommendations": recommendations.to_dict(orient="records")
    })


@app.get(
    "/api/products/<int:product_id>/collaborative-recommendations"
)
def get_item_recommendations(product_id):
    top_n = get_top_n()

    if top_n is None:
        return jsonify({"error": "top_n phải là số nguyên lớn hơn 0."}), 400

    recommendations = recommend_item(
        product_id=product_id,
        product_ids=cf_product_ids,
        product_names=cf_product_names,
        similarity_matrix=cf_similarity_matrix,
        top_n=top_n
    )

    return jsonify({
        "product_id": product_id,
        "recommendations": recommendations.to_dict(orient="records")
    })
@app.get("/api/users/<int:user_id>/recommendations")
def get_user_recommendations(user_id):
    top_n = get_top_n()

    if top_n is None:
        return jsonify({
            "error": "top_n phải là số nguyên lớn hơn 0."
        }), 400

    recommendations = recommend_for_user(
        user_id=user_id,
        user_ids=user_ids,
        user_product=user_product,
        user_similarity_matrix=user_similarity_matrix,
        product_names=user_product_names,
        top_n=top_n
    )

    return jsonify({
        "user_id": user_id,
        "recommendations": recommendations.to_dict(orient="records")
    })

@app.get("/api/products/<int:product_id>/hybrid-recommendations")
def get_hybrid_recommendations(product_id):
    top_n = get_top_n()

    if top_n is None:
        return jsonify({
            "error": "top_n phải là số nguyên lớn hơn 0."
        }), 400

    # Kiểm tra sản phẩm đang xem có tồn tại không
    if product_id not in products["product_id"].values:
        return jsonify({
            "error": f"Không tìm thấy sản phẩm có ID {product_id}."
        }), 404

    # 1. Lấy gợi ý theo nội dung
    content_result = recommend_content(
        product_id=product_id,
        products=products,
        similarity_matrix=content_similarity_matrix,
        top_n=20
    )

    # 2. Lấy gợi ý theo sản phẩm
    item_result = recommend_item(
        product_id=product_id,
        product_ids=cf_product_ids,
        product_names=cf_product_names,
        similarity_matrix=cf_similarity_matrix,
        top_n=20
    )

    # 3. Lấy gợi ý theo người dùng nếu có user_id
    user_id_param = request.args.get("user_id")
    user_result = None

    if user_id_param is not None:
        try:
            user_id = int(user_id_param)

            if user_id < 1:
                raise ValueError

        except ValueError:
            return jsonify({
                "error": "user_id phải là số nguyên dương."
            }), 400

        user_result = recommend_for_user(
            user_id=user_id,
            user_ids=user_ids,
            user_product=user_product,
            user_similarity_matrix=user_similarity_matrix,
            product_names=user_product_names,
            top_n=20
        )

    # 4. Kết hợp ba kết quả
    recommendations = recommend_hybrid(
        content_result=content_result,
        item_result=item_result,
        user_result=user_result,
        top_n=top_n
    )

    # Không gợi ý lại sản phẩm đang được xem
    recommendations = recommendations[
        recommendations["product_id"] != product_id
    ]

    recommendations = recommendations.head(top_n)

    return jsonify({
        "product_id": product_id,
        "user_id": (
            int(user_id_param)
            if user_id_param is not None
            else None
        ),
        "recommendation_type": "hybrid",
        "recommendations": recommendations.to_dict(
            orient="records"
        )
    })

# =========================
# API TÌM KIẾM SẢN PHẨM BẰNG HÌNH ẢNH
# =========================

@app.post("/api/search-by-image")
def search_by_image():
    # 1. Kiểm tra ảnh được gửi lên
    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "Vui lòng chọn ảnh để tìm kiếm."
        }), 400

    image_file = request.files["image"]

    if not image_file.filename:
        return jsonify({
            "success": False,
            "message": "Vui lòng chọn một file ảnh."
        }), 400

    # 2. Lấy số lượng sản phẩm muốn tìm
    try:
        top_k = int(request.form.get("top_k", 10))
    except ValueError:
        return jsonify({
            "success": False,
            "message": "top_k phải là số nguyên."
        }), 400

    if top_k < 1:
        return jsonify({
            "success": False,
            "message": "top_k phải lớn hơn 0."
        }), 400

    top_k = min(top_k, 20)

    try:
        # 3. Đọc ảnh được gửi lên
        image = Image.open(image_file.stream).convert("RGB")

        # 4. Tìm sản phẩm tương tự bằng mô hình CLIP
        results = search_products_by_image(
            image=image,
            top_k=top_k
        )

        # 5. Trả kết quả về frontend
        return jsonify({
            "success": True,
            "total": len(results),
            "data": results
        }), 200

    except UnidentifiedImageError:
        return jsonify({
            "success": False,
            "message": "File tải lên không phải ảnh hợp lệ."
        }), 400

    except Exception:
        app.logger.exception("Lỗi tìm kiếm sản phẩm bằng hình ảnh")

        return jsonify({
            "success": False,
            "message": "Đã xảy ra lỗi khi tìm kiếm hình ảnh."
        }), 500


# Giới hạn dung lượng ảnh tải lên là 10 MB
@app.errorhandler(413)
def handle_image_too_large(error):
    return jsonify({
        "success": False,
        "message": "Dung lượng ảnh không được vượt quá 10 MB."
    }), 413
# =========================
# API PHÂN LOẠI CẢM XÚC BÌNH LUẬN
# =========================

def preprocess_sentiment_text(text):
    text = str(text).lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    text = word_tokenize(text, format="text")
    return text


@app.post("/api/predict-sentiment")
def predict_sentiment():
    data = request.get_json(silent=True) or {}

    comment = data.get("comment", "")

    if not isinstance(comment, str) or not comment.strip():
        return jsonify({
            "success": False,
            "message": "Vui lòng nhập nội dung bình luận."
        }), 400

    try:
        # 1. Tiền xử lý bình luận
        processed_text = preprocess_sentiment_text(comment)

        # 2. Chuyển bình luận thành vector TF-IDF
        vector = tfidf_vectorizer.transform([processed_text])

        # 3. Dự đoán cảm xúc
        prediction = sentiment_model.predict(vector)[0]

        # 4. Tính xác suất dự đoán
        probabilities = sentiment_model.predict_proba(vector)[0]

        return jsonify({
            "success": True,
            "comment": comment,
            "sentiment": prediction,
            "probabilities": {
                label: round(float(probability), 4)
                for label, probability in zip(
                    sentiment_model.classes_,
                    probabilities
                )
            }
        }), 200

    except Exception:
        app.logger.exception("Lỗi phân loại cảm xúc")

        return jsonify({
            "success": False,
            "message": "Không thể phân loại bình luận."
        }), 500

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)