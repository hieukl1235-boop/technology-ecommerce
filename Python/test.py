from pathlib import Path

PRODUCT_IMAGE_DIR = Path(
    r"D:\LuanVan\technology-ecommerce-backend\src\uploads\products"
)

VARIANT_IMAGE_DIR = Path(
    r"D:\LuanVan\technology-ecommerce-backend\src\uploads\variants"
)

image_name = "1792076298442-samsung-galaxy-a37-tim-thumb.jpg"

image_path = PRODUCT_IMAGE_DIR / image_name

print(image_path)
print(image_path.exists())