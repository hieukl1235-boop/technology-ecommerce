<template>

    <h2>Thêm sản phẩm</h2>


    <!-- ============================= -->
    <!-- THÔNG TIN SẢN PHẨM -->
    <!-- ============================= -->

    <div>
        <label>Tên sản phẩm:</label>

        <input
            v-model="product.name"
        >
    </div>

    <br>


    <!-- LOẠI SẢN PHẨM -->

    <div>
        <label>Loại sản phẩm:</label>

        <select
            v-model="product.category_id"
        >

            <option value="">
                -- Chọn loại sản phẩm --
            </option>

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

        <select
            v-model="product.brand_id"
        >

            <option value="">
                -- Chọn thương hiệu --
            </option>

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
        <label>Ảnh chính:</label>

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

        <textarea
            v-model="product.description"
        ></textarea>
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
            Biến thể {{ index + 1 }}
        </h4>


        <!-- SKU -->

        <div>
            <label>SKU:</label>

            <input
                v-model="variant.sku"
            >
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
            <label>Ảnh biến thể:</label>

            <input
                type="file"
                accept="image/*"
                @change="
                    handleVariantImage(
                        $event,
                        variant
                    )
                "
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
    <!-- THÊM SẢN PHẨM -->
    <!-- ============================= -->

    <button
        type="button"
        @click="createProduct"
    >
        Thêm sản phẩm
    </button>

</template>


<script setup>

import { ref, onMounted } from "vue";

import axios from "axios";


// ========================================
// CATEGORY
// ========================================

const categories = ref([]);


// ========================================
// BRAND
// ========================================

const brands = ref([]);


// ========================================
// ATTRIBUTE
// ========================================

const attributes = ref([]);


// ========================================
// ATTRIBUTE VALUE
// ========================================

const attributeValues = ref([]);


// ========================================
// DỮ LIỆU SẢN PHẨM
// ========================================

const product = ref({

    category_id: "",

    brand_id: "",

    name: "",

    main_image: null,

    description: "",

    variants: []

});


// ========================================
// TẠO BIẾN THỂ
// ========================================

const createVariant = () => {

    return {

        sku: "",

        selling_price: "",

        image_url: null,

        selectedAttributes: {}

    };

};


// ========================================
// THÊM BIẾN THỂ
// ========================================

const addVariant = () => {

    product.value.variants.push(
        createVariant()
    );

};


// ========================================
// XÓA BIẾN THỂ
// ========================================

const removeVariant = (index) => {

    product.value.variants.splice(
        index,
        1
    );

};


// ========================================
// CHỌN ẢNH CHÍNH
// ========================================

const handleMainImage = (event) => {

    product.value.main_image =
        event.target.files[0];

};


// ========================================
// CHỌN ẢNH BIẾN THỂ
// ========================================

const handleVariantImage = (
    event,
    variant
) => {

    variant.image_url =
        event.target.files[0];

};


// ========================================
// LẤY CATEGORY
// ========================================

const getCategories = async () => {

    try {

        const token =
            localStorage.getItem("token");


        const response =
            await axios.get(
                "http://localhost:3000/api/admin/categories",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        categories.value =
            response.data;

    } catch (error) {

        console.error(error);

    }

};


// ========================================
// LẤY BRAND
// ========================================

const getBrands = async () => {

    try {

        const token =
            localStorage.getItem("token");


        const response =
            await axios.get(
                "http://localhost:3000/api/admin/brands",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        brands.value =
            response.data;

    } catch (error) {

        console.error(error);

    }

};


// ========================================
// LẤY ATTRIBUTE
// ========================================

const getAttributes = async () => {

    try {

        const token =
            localStorage.getItem("token");


        const response =
            await axios.get(
                "http://localhost:3000/api/admin/attributes",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        attributes.value =
            response.data;

    } catch (error) {

        console.error(error);

    }

};


// ========================================
// LẤY ATTRIBUTE VALUE
// ========================================

const getAttributeValuesFromAPI = async () => {

    try {

        const token =
            localStorage.getItem("token");


        const response =
            await axios.get(
                "http://localhost:3000/api/admin/attribute-values",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        attributeValues.value =
            response.data;

    } catch (error) {

        console.error(error);

    }

};


// ========================================
// LỌC ATTRIBUTE VALUE
// ========================================

const getAttributeValues = (
    attribute_id
) => {

    return attributeValues.value.filter(
        attributeValue =>
            Number(attributeValue.attribute_id)
            === Number(attribute_id)
    );

};


// ========================================
// THÊM SẢN PHẨM
// ========================================

const createProduct = async () => {

    try {

        const token =
            localStorage.getItem("token");


        // ====================================
        // FORM DATA
        // ====================================

        const formData =
            new FormData();


        // ====================================
        // THÔNG TIN SẢN PHẨM
        // ====================================

        formData.append(
            "category_id",
            product.value.category_id
        );


        formData.append(
            "brand_id",
            product.value.brand_id
        );


        formData.append(
            "name",
            product.value.name
        );


        formData.append(
            "description",
            product.value.description
        );


        // ====================================
        // ẢNH CHÍNH
        // ====================================

        if (product.value.main_image) {

            formData.append(
                "main_image",
                product.value.main_image
            );

        }


        // ====================================
        // TẠO DANH SÁCH BIẾN THỂ
        // ====================================

        const variants = [];


        for (
            const variant
            of product.value.variants
        ) {


            // ================================
            // LẤY ATTRIBUTE VALUE ID
            // ================================

            const attribute_value_ids = [];


            for (
                const attribute_id
                in variant.selectedAttributes
            ) {

                const attribute_value_id =
                    variant.selectedAttributes[
                        attribute_id
                    ];


                if (attribute_value_id) {

                    attribute_value_ids.push(
                        Number(attribute_value_id)
                    );

                }

            }


            // ================================
            // DỮ LIỆU BIẾN THỂ
            // ================================

            variants.push({

                sku:
                    variant.sku,

                selling_price:
                    Number(
                        variant.selling_price
                    ),

                attributes:
                    attribute_value_ids

            });

        }


        // ====================================
        // GỬI THÔNG TIN BIẾN THỂ
        // ====================================

        formData.append(
            "variants",
            JSON.stringify(variants)
        );


        // ====================================
        // GỬI ẢNH CỦA TỪNG BIẾN THỂ
        // ====================================

        for (
            const variant
            of product.value.variants
        ) {

            if (variant.image_url) {

                formData.append(
                    "variant_images",
                    variant.image_url
                );

            }

        }


        // ====================================
        // XEM DỮ LIỆU
        // ====================================

        console.log(
            "Category:",
            product.value.category_id
        );

        console.log(
            "Brand:",
            product.value.brand_id
        );

        console.log(
            "Name:",
            product.value.name
        );

        console.log(
            "Variants:",
            variants
        );

        console.log(
            "Main image:",
            product.value.main_image
        );


        // ====================================
        // GỌI API
        // ====================================

        await axios.post(

            "http://localhost:3000/api/admin/products",

            formData,

            {
                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }

        );


        alert(
            "Thêm sản phẩm thành công"
        );


    } catch (error) {

        console.error(error);


        alert(

            error.response?.data?.message
            ||
            "Có lỗi xảy ra"

        );

    }

};


// ========================================
// KHI MỞ TRANG
// ========================================

onMounted(async () => {

    await getCategories();

    await getBrands();

    await getAttributes();

    await getAttributeValuesFromAPI();


    // Tạo sẵn một biến thể

    addVariant();

});

</script>
