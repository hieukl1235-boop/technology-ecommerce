
import pandas as pd
def normalize_scores(df, score_column):
    """
    Chuẩn hóa điểm của một giải thuật về khoảng 0 đến 1.
    """
    if df.empty or score_column not in df.columns:
        return {}

    data = df[["product_id", score_column]].copy()
    data[score_column] = pd.to_numeric(
        data[score_column], errors="coerce"
    ).fillna(0)

    max_score = data[score_column].max()

    if max_score <= 0:
        data["normalized_score"] = 0.0
    else:
        data["normalized_score"] = (
            data[score_column] / max_score
        )

    return dict(
        zip(data["product_id"], data["normalized_score"])
    )


def recommend_hybrid(
    content_result,
    item_result,
    user_result,
    top_n=5,
    content_weight=0.2,
    item_weight=0.4,
    user_weight=0.4
):
    """
    Kết hợp kết quả từ Content-Based, Item-Based
    và User-Based Collaborative Filtering.
    """

    # Nếu đầu vào không có kết quả, thay bằng DataFrame rỗng
    if content_result is None:
        content_result = pd.DataFrame()

    if item_result is None:
        item_result = pd.DataFrame()

    if user_result is None:
        user_result = pd.DataFrame()

    # Chuẩn hóa điểm của từng giải thuật
    content_scores = normalize_scores(
        content_result, "similarity"
    )

    item_scores = normalize_scores(
        item_result, "similarity"
    )

    user_scores = normalize_scores(
        user_result, "recommendation_score"
    )

    # Chỉ sử dụng trọng số của những giải thuật
    # có trả về kết quả
    active_weights = {}

    if content_scores:
        active_weights["content"] = content_weight

    if item_scores:
        active_weights["item"] = item_weight

    if user_scores:
        active_weights["user"] = user_weight

    if not active_weights:
        return pd.DataFrame(
            columns=[
                "product_id",
                "name",
                "hybrid_score"
            ]
        )

    total_weight = sum(active_weights.values())

    active_weights = {
        key: weight / total_weight
        for key, weight in active_weights.items()
    }

    # Hợp nhất tất cả product_id từ ba kết quả
    all_product_ids = set(content_scores)
    all_product_ids.update(item_scores)
    all_product_ids.update(user_scores)

    # Lấy tên sản phẩm từ những kết quả đã có
    product_names = {}

    for result in (
        content_result,
        item_result,
        user_result
    ):
        if (
            not result.empty
            and "product_id" in result.columns
            and "name" in result.columns
        ):
            for _, row in result.iterrows():
                product_names[row["product_id"]] = row["name"]

    # Tính điểm Hybrid cho từng sản phẩm
    results = []

    for product_id in all_product_ids:
        content_score = content_scores.get(product_id, 0)
        item_score = item_scores.get(product_id, 0)
        user_score = user_scores.get(product_id, 0)

        hybrid_score = (
            active_weights.get("content", 0)
            * content_score
            + active_weights.get("item", 0)
            * item_score
            + active_weights.get("user", 0)
            * user_score
        )

        results.append({
            "product_id": int(product_id),
            "name": product_names.get(product_id, ""),
            "hybrid_score": float(hybrid_score)
        })

    # Sắp xếp theo điểm Hybrid giảm dần
    result_df = pd.DataFrame(results)

    result_df = result_df.sort_values(
        "hybrid_score",
        ascending=False
    )

    return result_df.head(top_n).reset_index(drop=True)
