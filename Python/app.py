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
app = Flask(__name__)
app.json.ensure_ascii = False
CORS(app, origins=["http://localhost:5173"])

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

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)