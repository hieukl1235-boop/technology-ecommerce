import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def build_item_similarity(interactions):
    if interactions.empty:
        print("Chưa có dữ liệu mua hàng cho Item-based CF.")
        return [], {}, []

    user_product = interactions.pivot_table(
        index="user_id",
        columns="product_id",
        values="quantity",
        aggfunc="sum",
        fill_value=0
    )
    # Đổi thành 1 nếu đã mua, 0 nếu chưa mua
    user_product_binary = (user_product > 0).astype(int)

    # Mỗi hàng là sản phẩm, mỗi cột là khách hàng
    product_user = user_product_binary.T

    similarity_matrix = cosine_similarity(product_user)
    product_ids = product_user.index.tolist()

    product_names = (
        interactions[["product_id", "name"]]
        .drop_duplicates(subset="product_id")
        .set_index("product_id")["name"]
        .to_dict()
    )

    return product_ids, product_names, similarity_matrix

def recommend_products(
    product_id,
    product_ids,
    product_names,
    similarity_matrix,
    top_n=5
):
    if product_id not in product_ids:
        return pd.DataFrame(
            columns=["product_id", "name", "similarity"]
        )

    product_index = product_ids.index(product_id)
    scores = list(enumerate(similarity_matrix[product_index]))

    scores = [
        (index, score)
        for index, score in scores
        if index != product_index
    ]
    scores.sort(key=lambda item: item[1], reverse=True)
    top_scores = scores[:top_n]

    return pd.DataFrame([
        {
            "product_id": product_ids[index],
            "name": product_names.get(product_ids[index], ""),
            "similarity": float(score)
        }
        for index, score in top_scores
    ])