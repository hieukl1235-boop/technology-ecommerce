import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def build_content_model(products):
    if products.empty:
        raise ValueError("Không tìm thấy sản phẩm đang hoạt động.")

    products = products.copy().reset_index(drop=True)
    products["features"] = (
        products["name"].fillna("").astype(str) + " " +
        products["description"].fillna("").astype(str) + " " +
        "category_" + products["category_id"].fillna(0).astype(str) + " " +
        "brand_" + products["brand_id"].fillna(0).astype(str)
    )
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(products["features"])
    similarity_matrix = cosine_similarity(tfidf_matrix)

    return products, similarity_matrix

def recommend_products(product_id, products, similarity_matrix, top_n=5):
    matches = products.index[
        products["product_id"] == product_id
    ].tolist()

    if not matches:
        return None

    product_index = matches[0]
    scores = list(enumerate(similarity_matrix[product_index]))

    scores = [
        (index, score)
        for index, score in scores
        if index != product_index
    ]

    scores.sort(key=lambda item: item[1], reverse=True)
    top_scores = scores[:top_n]

    result = products.loc[
        [index for index, score in top_scores],
        ["product_id", "name"]
    ].copy()

    result["similarity"] = [
        float(score) for index, score in top_scores
    ]
    return result.reset_index(drop=True)