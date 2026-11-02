import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def build_user_similarity(interactions):
    if interactions.empty:
        return [], pd.DataFrame(), [], {}

    # Mỗi hàng là khách, mỗi cột là sản phẩm
    user_product = interactions.pivot_table(
        index="user_id",
        columns="product_id",
        values="quantity",
        aggfunc="sum",
        fill_value=0
    )

    # Đánh dấu đã mua/chưa mua
    user_product = (user_product > 0).astype(int)

    # So sánh khách hàng với nhau
    similarity_matrix = cosine_similarity(user_product)

    user_ids = user_product.index.tolist()
    product_ids = user_product.columns.tolist()

    product_names = (
        interactions[["product_id", "name"]]
        .drop_duplicates(subset="product_id")
        .set_index("product_id")["name"]
        .to_dict()
    )

    return user_ids, user_product, similarity_matrix, product_names


def recommend_for_user(
    user_id,
    user_ids,
    user_product,
    user_similarity_matrix,
    product_names,
    top_n=5,
    k_neighbors=30
):
    empty_result = pd.DataFrame(
        columns=["product_id", "name", "recommendation_score"]
    )

    if user_id not in user_ids:
        return empty_result

    user_index = user_ids.index(user_id)

    # Lấy điểm giống nhau giữa khách này với các khách khác
    neighbor_scores = list(
        enumerate(user_similarity_matrix[user_index])
    )

    # Bỏ chính khách đang xét và khách không giống nhau
    neighbor_scores = [
        (index, score)
        for index, score in neighbor_scores
        if index != user_index and score > 0
    ]
    neighbor_scores.sort(key=lambda item: item[1], reverse=True)
    neighbor_scores = neighbor_scores[:k_neighbors]   # thêm dòng này
    if not neighbor_scores:
        return empty_result

    neighbor_indices = [index for index, score in neighbor_scores]
    weights = np.array([score for index, score in neighbor_scores])
    # Tính điểm từng sản phẩm dựa trên việc các khách tương tự đã mua
    neighbor_purchases = user_product.iloc[neighbor_indices].to_numpy()
    recommendation_scores = np.average(
        neighbor_purchases,
        axis=0,
        weights=weights
    )

    # Không gợi ý lại sản phẩm khách này đã mua
    user_purchases = user_product.iloc[user_index].to_numpy()
    recommendation_scores[user_purchases == 1] = 0

    ranked_indices = np.argsort(recommendation_scores)[::-1]

    results = []
    for product_index in ranked_indices:
        score = recommendation_scores[product_index]

        if score <= 0:
            continue

        product_id = user_product.columns[product_index]
        results.append({
            "product_id": int(product_id),
            "name": product_names.get(product_id, ""),
            "recommendation_score": float(score)
        })

        if len(results) == top_n:
            break

    return pd.DataFrame(results)