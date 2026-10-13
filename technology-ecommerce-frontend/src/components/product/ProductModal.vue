<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-card shadow-lg">
      <!-- HEADER: Tiêu đề và nút Đóng (X) ở góc trên -->
      <div class="modal-header">
        <h4 class="mb-0 fw-bold text-dark">
          {{ productData ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới' }}
        </h4>
        <button type="button" class="btn-close" @click="$emit('close')"></button>
      </div>

      <!-- BODY: Nội dung form cuộn mượt mà -->
      <div class="modal-body">
        <!-- PHẦN 1: THÔNG TIN CƠ BẢN -->
        <div class="section-title">Thông tin chung</div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Tên sản phẩm:</label>
          <input v-model="product.name" class="form-control" placeholder="Nhập tên sản phẩm..." />
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-semibold">Loại sản phẩm:</label>
            <select v-model="product.category_id" class="form-select">
              <option value="">-- Chọn loại sản phẩm --</option>
              <option
                v-for="category in availableCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }} {{ category.status === 0 ? '(Đã ẩn)' : '' }}
              </option>
            </select>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label fw-semibold">Thương hiệu:</label>
            <select v-model="product.brand_id" class="form-select">
              <option value="">-- Chọn thương hiệu --</option>
              <option v-for="brand in availableBrands" :key="brand.id" :value="brand.id">
                {{ brand.name }} {{ brand.status === 0 ? '(Đã ẩn)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <!-- ẢNH CHÍNH SẢN PHẨM -->
        <div class="mb-3">
          <label class="form-label fw-semibold">Ảnh chính sản phẩm:</label>

          <!-- ✨ Hiển thị ảnh xem trước nếu vừa chọn file ảnh mới -->
          <div v-if="product.mainImagePreviewUrl" class="mb-2">
            <img
              :src="product.mainImagePreviewUrl"
              alt="New Main Image Preview"
              class="rounded border mb-1 d-block"
              style="width: 80px; height: 80px; object-fit: cover"
            />
            <span class="text-muted small text-success fw-bold">✨ Ảnh mới chọn (Chưa lưu)</span>
          </div>

          <!-- Hiển thị ảnh cũ nếu đang ở chế độ sửa và chưa chọn ảnh mới -->
          <div v-else-if="product.existingMainImage" class="mb-2">
            <img
              :src="`http://localhost:3000/uploads/products/${product.existingMainImage}`"
              alt="Current Main Image"
              class="rounded border mb-1 d-block"
              style="width: 80px; height: 80px; object-fit: cover"
            />
            <span class="text-muted small"
              >Ảnh hiện tại (Chọn file bên dưới nếu muốn thay đổi)</span
            >
          </div>

          <input type="file" class="form-control" accept="image/*" @change="handleMainImage" />
        </div>
        <!-- ẢNH PHỤ -->
        <div class="mb-3">
          <label class="form-label fw-semibold">Ảnh phụ (có thể chọn nhiều):</label>

          <div class="d-flex flex-wrap gap-2 mb-2">
            <!-- Ảnh phụ đã lưu -->
            <div v-for="img in product.existingImages" :key="img.id" class="position-relative">
              <img
                :src="`http://localhost:3000/uploads/products/${img.image_url}`"
                class="rounded border"
                style="width: 80px; height: 80px; object-fit: cover"
              />
              <button
                type="button"
                class="btn btn-danger btn-sm position-absolute top-0 end-0 py-0 px-1"
                @click="removeExistingImage(img)"
              >
                ✕
              </button>
            </div>

            <!-- Ảnh phụ mới chọn (chưa lưu) -->
            <div
              v-for="(img, i) in product.newImages"
              :key="img.previewUrl"
              class="position-relative"
            >
              <img
                :src="img.previewUrl"
                class="rounded border border-success"
                style="width: 80px; height: 80px; object-fit: cover"
              />
              <button
                type="button"
                class="btn btn-danger btn-sm position-absolute top-0 end-0 py-0 px-1"
                @click="removeNewImage(i)"
              >
                ✕
              </button>
            </div>
          </div>

          <input
            type="file"
            class="form-control"
            accept="image/*"
            multiple
            @change="handleGalleryImages"
          />
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold">Mô tả:</label>
          <textarea
            v-model="product.description"
            class="form-control"
            rows="3"
            placeholder="Nhập mô tả sản phẩm..."
          ></textarea>
        </div>

        <hr class="my-4" />

        <!-- PHẦN 2: DANH SÁCH BIẾN THỂ -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0 text-secondary">📦 Danh sách biến thể</h5>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="addVariant">
            + Thêm biến thể
          </button>
        </div>

        <div v-for="(variant, index) in product.variants" :key="index" class="variant-box">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-secondary">Biến thể số {{ index + 1 }}</span>
            <div class="d-flex gap-2">
              <!-- Nút Bật/Tắt biến thể -->
              <button
                type="button"
                class="btn btn-sm"
                :class="variant.status === 1 ? 'btn-outline-warning' : 'btn-outline-success'"
                @click="toggleVariantStatus(index)"
              >
                {{ variant.status === 1 ? '🔒 Tạm ẩn' : '🔓 Bật lại' }}
              </button>
              <!-- Nút Xóa biến thể -->
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeVariant(index)"
              >
                🗑️ Xóa
              </button>
            </div>
          </div>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label small fw-semibold">SKU:</label>
              <input
                v-model="variant.sku"
                class="form-control form-control-sm"
                placeholder="Mã SKU..."
              />
            </div>
          </div>
          <div class="row">
            <!-- Giá bán gốc -->
            <div class="col-md-6 mb-3">
              <label class="form-label small fw-semibold">Giá bán (Gốc):</label>
              <input
                v-model="variant.selling_price"
                type="number"
                class="form-control form-control-sm"
                placeholder="Nhập giá gốc..."
              />
            </div>

            <!-- Giá khuyến mãi (Sale) -->
            <div class="col-md-6 mb-3">
              <label class="form-label small fw-semibold">Giá khuyến mãi (Sale):</label>
              <input
                v-model="variant.sale_price"
                type="number"
                class="form-control form-control-sm"
                placeholder="Nhập giá sale (nếu có)..."
              />
            </div>
          </div>

          <!-- ẢNH BIẾN THỂ -->
          <div class="mb-3">
            <label class="form-label small fw-semibold">Ảnh biến thể:</label>

            <!-- ✨ Hiển thị ảnh xem trước nếu vừa chọn file ảnh mới cho biến thể -->
            <div v-if="variant.previewUrl" class="mb-2">
              <img
                :src="variant.previewUrl"
                alt="New Variant Preview"
                class="rounded border mb-1 d-block"
                style="width: 50px; height: 50px; object-fit: cover"
              />
              <span class="text-muted small text-success fw-bold" style="font-size: 0.75rem"
                >✨ Ảnh mới chọn (Chưa lưu)</span
              >
            </div>

            <!-- Hiển thị ảnh cũ của biến thể nếu có -->
            <div v-else-if="variant.existingImageUrl" class="mb-2">
              <img
                :src="`http://localhost:3000/uploads/variants/${variant.existingImageUrl}`"
                alt="Variant Image"
                class="rounded border mb-1 d-block"
                style="width: 50px; height: 50px; object-fit: cover"
              />
              <span class="text-muted small" style="font-size: 0.75rem"
                >Ảnh hiện tại của biến thể</span
              >
            </div>

            <input
              type="file"
              class="form-control form-control-sm"
              accept="image/*"
              @change="(e) => handleVariantImage(e, variant)"
            />
          </div>

          <!-- THUỘC TÍNH -->
          <div class="border-top pt-2 mt-2">
            <label class="form-label small fw-semibold text-muted mb-2">Thuộc tính biến thể:</label>
            <div v-for="attribute in attributes" :key="attribute.id" class="mb-2">
              <div class="input-group input-group-sm">
                <span class="input-group-text" style="width: 120px">{{ attribute.name }}</span>
                <select v-model="variant.selectedAttributes[attribute.id]" class="form-select">
                  <option value="">-- Chọn {{ attribute.name }} --</option>
                  <option
                    v-for="attributeValue in getAttributeValues(attribute.id)"
                    :key="attributeValue.id"
                    :value="attributeValue.id"
                  >
                    {{ attributeValue.value }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER: Nút hành động cố định dưới cùng -->
      <div class="modal-footer">
        <!-- Nút Ngừng kinh doanh / Khôi phục nhanh (Chỉ hiển thị khi đang Sửa) -->
        <button
          v-if="productData"
          type="button"
          class="btn me-auto"
          :class="productData.status === 1 ? 'btn-outline-danger' : 'btn-outline-warning'"
          @click="handleToggleStatus"
        >
          {{ productData.status === 1 ? 'Ngừng kinh doanh sản phẩm' : 'Khôi phục sản phẩm' }}
        </button>

        <button type="button" class="btn btn-light border" @click="$emit('close')">Đóng</button>
        <button type="button" class="btn btn-success px-4" @click="handleSubmit">
          {{ productData ? 'Cập nhật thay đổi' : 'Xác nhận Thêm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
  isOpen: Boolean,
  productData: Object,
})
const emit = defineEmits(['close', 'success'])

// 1. Quản lý danh mục, thương hiệu và thuộc tính dùng chung
const categories = ref([])
const brands = ref([])
const attributes = ref([])
const attributeValues = ref([])

// 2. Khung dữ liệu mặc định của sản phẩm
const getInitialProductState = () => ({
  category_id: '',
  brand_id: '',
  name: '',
  existingMainImage: null,
  main_image: null,
  mainImagePreviewUrl: null, // ✨ Thêm URL preview cho ảnh chính
  description: '',
  variants: [createEmptyVariant()],
  existingImages: [], // [{id, image_url}] ảnh phụ đã lưu
  removedImageIds: [], // id ảnh phụ bị bấm xóa
  newImages: [], // [{file, previewUrl}] ảnh phụ mới chọn
})

// 3. Khung dữ liệu mặc định của một biến thể
const createEmptyVariant = () => ({
  sku: '',
  selling_price: '',
  sale_price: '',
  existingImageUrl: null,
  image_url: null,
  previewUrl: null, // ✨ Thêm URL preview cho ảnh biến thể
  selectedAttributes: {},
  status: 1,
})

const product = ref(getInitialProductState())

// 4. Computed lọc danh mục/thương hiệu thông minh
const availableCategories = computed(() =>
  categories.value.filter((cat) => cat.status === 1 || cat.id === product.value.category_id),
)

const availableBrands = computed(() =>
  brands.value.filter((brand) => brand.status === 1 || brand.id === product.value.brand_id),
)

// 5. Các hàm thao tác với Biến thể (Thêm, Xóa, Đổi trạng thái)
const addVariant = () => product.value.variants.push(createEmptyVariant())

const removeVariant = (index) => {
  if (product.value.variants.length <= 1) {
    alert('Sản phẩm phải có ít nhất một biến thể, không thể xóa!')
    return
  }
  product.value.variants.splice(index, 1)
}

const toggleVariantStatus = (index) => {
  const variant = product.value.variants[index]
  if (variant.status === 1) {
    const activeCount = product.value.variants.filter((v) => v.status === 1).length
    if (activeCount <= 1) {
      alert('Sản phẩm phải có ít nhất một biến thể đang hoạt động!')
      return
    }
    variant.status = 0
  } else {
    variant.status = 1
  }
}

// 6. Xử lý file ảnh (Có tạo URL ảo để preview ngay lập tức)
const handleMainImage = (e) => {
  const file = e.target.files[0]
  if (file) {
    product.value.main_image = file
    product.value.mainImagePreviewUrl = URL.createObjectURL(file) // ✨ Tạo URL ảo ảnh chính
  }
}
const handleGalleryImages = (e) => {
  for (const file of e.target.files) {
    product.value.newImages.push({ file, previewUrl: URL.createObjectURL(file) })
  }
  e.target.value = '' // cho phép chọn lại cùng file
}

const removeNewImage = (index) => {
  URL.revokeObjectURL(product.value.newImages[index].previewUrl)
  product.value.newImages.splice(index, 1)
}

const removeExistingImage = (img) => {
  product.value.removedImageIds.push(img.id)
  product.value.existingImages = product.value.existingImages.filter((i) => i.id !== img.id)
}

const handleVariantImage = (e, variant) => {
  const file = e.target.files[0]
  if (file) {
    variant.image_url = file
    variant.previewUrl = URL.createObjectURL(file) // ✨ Tạo URL ảo ảnh biến thể
  }
}

const getAttributeValues = (attrId) =>
  attributeValues.value.filter((v) => Number(v.attribute_id) === Number(attrId))

// 7. Watch hứng dữ liệu khi bấm Thêm mới hoặc Sửa
watch(
  () => props.productData,
  (newData) => {
    if (newData) {
      product.value = {
        name: newData.name || '',
        category_id: newData.category_id || '',
        brand_id: newData.brand_id || '',
        description: newData.description || '',
        existingMainImage: newData.main_image || null,
        main_image: null,
        mainImagePreviewUrl: null, // Reset preview khi mở modal sửa
        existingImages: newData.images || [],
        removedImageIds: [],
        newImages: [],
        variants: newData.variants?.length
          ? newData.variants.map((v) => ({
              id: v.id,
              sku: v.sku || '',
              selling_price: v.selling_price ?? '',
              sale_price: v.sale_price,
              existingImageUrl: v.image_url || null,
              image_url: null,
              previewUrl: null, // Reset preview biến thể
              selectedAttributes:
                v.attributes?.reduce((acc, attr) => {
                  acc[attr.attribute_id] = attr.attribute_value_id
                  return acc
                }, {}) || {},
              status: v.status ?? 1,
            }))
          : [createEmptyVariant()],
      }
      console.log('Đã load dữ liệu sản phẩm vào Modal:', product.value)
    } else {
      product.value = getInitialProductState()
    }
  },
  { immediate: true },
)

// 8. Tải dữ liệu danh mục, thương hiệu, thuộc tính khi mở Modal
onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const headers = { Authorization: `Bearer ${token}` }
    const [resCat, resBrand, resAttr, resVal] = await Promise.all([
      axios.get('http://localhost:3000/api/admin/categories', { headers }),
      axios.get('http://localhost:3000/api/admin/brands', { headers }),
      axios.get('http://localhost:3000/api/admin/attributes', { headers }),
      axios.get('http://localhost:3000/api/admin/attribute-values', { headers }),
    ])
    categories.value = resCat.data
    brands.value = resBrand.data
    attributes.value = resAttr.data
    attributeValues.value = resVal.data
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu cấu hình:', error)
  }
})

// 9. Gửi dữ liệu lên Backend qua FormData
const handleSubmit = async () => {
  const actionText = props.productData ? 'cập nhật sản phẩm này' : 'thêm sản phẩm mới này'
  if (!confirm(`Bạn có chắc chắn muốn ${actionText}?`)) return

  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()

    formData.append('category_id', product.value.category_id)
    formData.append('brand_id', product.value.brand_id)
    formData.append('name', product.value.name)
    formData.append('description', product.value.description)
    if (product.value.main_image) {
      formData.append('main_image', product.value.main_image)
    }
    product.value.newImages.forEach((img) => formData.append('gallery_images', img.file))
    formData.append('removed_image_ids', JSON.stringify(product.value.removedImageIds))

    // Tạo mảng payload cho biến thể và mảng theo dõi index của ảnh
    const variantsPayload = product.value.variants.map((v) => {
      // Kiểm tra xem biến thể này có chọn file ảnh mới không
      const hasNewImage = v.image_url instanceof File

      return {
        id: v.id,
        sku: v.sku,
        selling_price: Number(v.selling_price),
        sale_price: v.sale_price ? Number(v.sale_price) : null,
        attributes: Object.values(v.selectedAttributes).filter(Boolean).map(Number),
        status: v.status,

        // Cờ báo hiệu biến thể này có file ảnh mới hay không
        has_new_image: hasNewImage,

        // Nếu không có ảnh mới, phải gửi lại tên ảnh cũ cho Backend
        image_url: hasNewImage ? null : v.existingImageUrl,
      }
    })

    formData.append('variants', JSON.stringify(variantsPayload))

    // Chỉ push các file ảnh mới lên
    product.value.variants.forEach((v) => {
      if (v.image_url instanceof File) {
        formData.append('variant_images', v.image_url)
      }
    })
    const url = props.productData
      ? `http://localhost:3000/api/admin/products/${props.productData.id}`
      : 'http://localhost:3000/api/admin/products'

    const method = props.productData ? 'put' : 'post'

    await axios[method](url, formData, { headers: { Authorization: `Bearer ${token}` } })
    alert(props.productData ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!')

    emit('success')
    emit('close')
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || 'Có lỗi xảy ra')
  }
}

// 10. Đổi trạng thái nhanh sản phẩm từ Modal
const handleToggleStatus = async () => {
  const newStatus = props.productData.status === 1 ? 0 : 1
  const actionText = newStatus === 1 ? 'khôi phục' : 'ngừng kinh doanh'

  if (confirm(`Bạn có chắc muốn ${actionText} sản phẩm này?`)) {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(
        `http://localhost:3000/api/admin/products/${props.productData.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      alert(`Đã ${actionText} sản phẩm thành công!`)
      emit('success')
      emit('close')
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Có lỗi khi cập nhật trạng thái')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 750px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  display: flex;
  gap: 10px;
  align-items: center;
}

.section-title {
  font-weight: bold;
  color: #495057;
  margin-bottom: 12px;
  font-size: 1rem;
  border-left: 4px solid #0d6efd;
  padding-left: 8px;
}

.variant-box {
  border: 1px solid #e9ecef;
  background: #fbfbfc;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}
</style>
