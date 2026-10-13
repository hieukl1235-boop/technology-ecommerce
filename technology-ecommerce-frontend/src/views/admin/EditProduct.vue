<!-- <template>
    <h2>Cập nhật sản phẩm</h2>

    <!-- ============================= -->
    <!-- THÔNG TIN SẢN PHẨM -->
    <!-- ============================= -->

    <div>
        <label>Tên sản phẩm:</label>
        <input v-model="product.name">
    </div>

    <br>

    <!-- LOẠI SẢN PHẨM -->
    <div>
        <label>Loại sản phẩm:</label>
        <select v-model="product.category_id">
            <option value="">-- Chọn loại sản phẩm --</option>
            <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
            >
                {{ category.name }}
            </option>
        </select>
    </div>

    <br>

    <!-- THƯƠNG HIỆU -->
    <div>
        <label>Thương hiệu:</label>
        <select v-model="product.brand_id">
            <option value="">-- Chọn thương hiệu --</option>
            <option
                v-for="brand in brands"
                :key="brand.id"
                :value="brand.id"
            >
                {{ brand.name }}
            </option>
        </select>
    </div>

    <br>

    <!-- ẢNH CHÍNH -->
    <div>
        <label>Ảnh chính hiện tại:</label>
        <p v-if="product.main_image_old">
            <a :href="`http://localhost:3000/uploads/products/${product.main_image_old}`" target="_blank">
                {{ product.main_image_old }}
            </a>
        </p>
        
        <label>Đổi ảnh chính mới (nếu muốn):</label>
        <input
            type="file"
            accept="image/*"
            @change="handleMainImage"
        >
    </div>

    <br>

    <!-- MÔ TẢ -->
    <div>
        <label>Mô tả:</label>
        <textarea v-model="product.description"></textarea>
    </div>

    <hr>

    <!-- ============================= -->
    <!-- DANH SÁCH BIẾN THỂ -->
    <!-- ============================= -->

    <h3>Biến thể</h3>

    <div
        v-for="(variant, index) in product.variants"
        :key="index"
    >
        <h4>
            Biến thể {{ index + 1 }} {{ variant.id ? `(ID cũ: ${variant.id})` : '(Mới thêm)' }}
        </h4>

        <!-- SKU -->
        <div>
            <label>SKU:</label>
            <input v-model="variant.sku">
        </div>

        <br>

        <!-- GIÁ BÁN -->
        <div>
            <label>Giá bán:</label>
            <input
                v-model="variant.selling_price"
                type="number"
            >
        </div>

        <br>

        <!-- ẢNH BIẾN THỂ -->
        <div>
            <label>Ảnh biến thể hiện tại:</label>
            <p v-if="variant.image_url_old">
                {{ variant.image_url_old }}
            </p>

            <label>Đổi ảnh biến thể mới:</label>
            <input
                type="file"
                accept="image/*"
                @change="handleVariantImage($event, variant)"
            >
        </div>

        <br>

        <!-- ============================= -->
        <!-- THUỘC TÍNH -->
        <!-- ============================= -->

        <h4>Thuộc tính</h4>

        <div
            v-for="attribute in attributes"
            :key="attribute.id"
        >
            <label>
                {{ attribute.name }}:
            </label>

            <select
                v-model="
                    variant.selectedAttributes[
                        attribute.id
                    ]
                "
            >
                <option value="">
                    -- Chọn {{ attribute.name }} --
                </option>

                <option
                    v-for="
                        attributeValue
                        in getAttributeValues(
                            attribute.id
                        )
                    "
                    :key="attributeValue.id"
                    :value="attributeValue.id"
                >
                    {{ attributeValue.value }}
                </option>
            </select>

            <br>
            <br>
        </div>

        <!-- XÓA BIẾN THỂ -->
        <button
            type="button"
            @click="removeVariant(index)"
        >
            Xóa biến thể
        </button>

        <hr>
    </div>

    <!-- ============================= -->
    <!-- THÊM BIẾN THỂ -->
    <!-- ============================= -->

    <button
        type="button"
        @click="addVariant"
    >
        Thêm biến thể
    </button>

    <br>
    <br>

    <!-- ============================= -->
    <!-- NÚT CẬP NHẬT SẢN PHẨM -->
    <!-- ============================= -->

    <button
        type="button"
        @click="updateProduct"
    >
        Lưu cập nhật
    </button>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute } from "vue-router"; // Dùng để lấy id sản phẩm từ URL

const route = useRoute();
const productId = route.params.id; // Lấy ID sản phẩm cần sửa từ URL (ví dụ: /products/edit/5)

// Danh mục, thương hiệu, thuộc tính
const categories = ref([]);
const brands = ref([]);
const attributes = ref([]);
const attributeValues = ref([]);

// Dữ liệu sản phẩm
const product = ref({
    category_id: "",
    brand_id: "",
    name: "",
    main_image_new: null, // File ảnh mới chọn
    main_image_old: "",   // Tên ảnh cũ từ DB
    description: "",
    variants: []
});

// Tạo một biến thể trống (dành cho lúc bấm "Thêm biến thể")
const createVariant = () => {
    return {
        id: null,           // null nghĩa là biến thể mới
        sku: "",
        selling_price: "",
        image_file: null,   // File ảnh mới chọn
        image_url_old: "",  // Tên ảnh cũ từ DB
        selectedAttributes: {}
    };
};

const addVariant = () => {
    product.value.variants.push(createVariant());
};

const removeVariant = (index) => {
    product.value.variants.splice(index, 1);
};

const handleMainImage = (event) => {
    product.value.main_image_new = event.target.files[0];
};

const handleVariantImage = (event, variant) => {
    variant.image_file = event.target.files[0];
};

// Lấy danh mục, thương hiệu, thuộc tính... (Giống trang thêm)
const getCategories = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:3000/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` }
    });
    categories.value = res.data;
};

const getBrands = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:3000/api/admin/brands", {
        headers: { Authorization: `Bearer ${token}` }
    });
    brands.value = res.data;
};

const getAttributes = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:3000/api/admin/attributes", {
        headers: { Authorization: `Bearer ${token}` }
    });
    attributes.value = res.data;
};

const getAttributeValuesFromAPI = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:3000/api/admin/attribute-values", {
        headers: { Authorization: `Bearer ${token}` }
    });
    attributeValues.value = res.data;
};

const getAttributeValues = (attribute_id) => {
    return attributeValues.value.filter(
        val => Number(val.attribute_id) === Number(attribute_id)
    );
};

// ========================================
// HÀM LẤY DỮ LIỆU CŨ ĐỂ ĐỔ LÊN FORM KHI VÀO TRANG
// ========================================
const fetchProductDetail = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:3000/api/admin/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data; // Giả sử API trả về thông tin sản phẩm và mảng variants kèm attributes cũ

        product.value.name = data.name;
        product.value.category_id = data.category_id;
        product.value.brand_id = data.brand_id;
        product.value.description = data.description;
        product.value.main_image_old = data.main_image;

        // Đổ danh sách biến thể cũ lên
        product.value.variants = data.variants.map(v => {
            // Chuyển mảng attributes cũ thành object selectedAttributes để v-model select nhận diện được
            const selectedAttrObj = {};
            if (v.attributes && Array.isArray(v.attributes)) {
                v.attributes.forEach(attr => {
                    selectedAttrObj[attr.attribute_id] = attr.attribute_value_id;
                });
            }

            return {
                id: v.id, // Quan trọng: Giữ lại ID cũ để backend phân biệt
                sku: v.sku,
                selling_price: v.selling_price,
                image_file: null,
                image_url_old: v.image_url,
                selectedAttributes: selectedAttrObj
            };
        });
    } catch (error) {
        console.error(error);
        alert("Không thể tải thông tin sản phẩm");
    }
};

// ========================================
// GỬI DỮ LIỆU CẬP NHẬT LÊN BACKEND
// ========================================
const updateProduct = async () => {
    try {
        const token = localStorage.getItem("token");
        const formData = new FormData();

        formData.append("category_id", product.value.category_id);
        formData.append("brand_id", product.value.brand_id);
        formData.append("name", product.value.name);
        formData.append("description", product.value.description);

        // Nếu có chọn ảnh chính mới thì gửi lên
        if (product.value.main_image_new) {
            formData.append("main_image", product.value.main_image_new);
        }

        const variants = [];

        for (const variant of product.value.variants) {
            const attribute_value_ids = [];

            for (const attribute_id in variant.selectedAttributes) {
                const attribute_value_id = variant.selectedAttributes[attribute_id];
                if (attribute_value_id) {
                    attribute_value_ids.push(Number(attribute_value_id));
                }
            }

            // Đóng gói thông tin biến thể (có kèm theo id nếu là biến thể cũ)
            variants.push({
                id: variant.id || null, // null nếu là tạo mới, có số nếu là variant cũ
                sku: variant.sku,
                selling_price: Number(variant.selling_price),
                attributes: attribute_value_ids
            });
        }

        // Đẩy chuỗi JSON variants lên
        formData.append("variants", JSON.stringify(variants));

        // Đẩy file ảnh của từng biến thể theo đúng vị trí index khớp với backend mong đợi
        for (const variant of product.value.variants) {
            if (variant.image_file) {
                formData.append("variant_images", variant.image_file);
            } else {
                // Nếu biến thể cũ không đổi ảnh, có thể truyền một giá trị rỗng hoặc xử lý tùy backend
                // Ở đây ta chỉ append file thật nếu người dùng có chọn mới
            }
        }

        // Gọi API PUT / PATCH để cập nhật
        await axios.put(
            `http://localhost:3000/api/admin/products/${productId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        alert("Cập nhật sản phẩm thành công!");
    } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    }
};

onMounted(async () => {
    await getCategories();
    await getBrands();
    await getAttributes();
    await getAttributeValuesFromAPI();
    await fetchProductDetail(); // Gọi hàm lấy dữ liệu cũ đền điền vào form
});
</script> -->