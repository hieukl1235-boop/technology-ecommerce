<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const addresses = ref([])
const showModal = ref(false)

// --- DỮ LIỆU ĐỊA CHÍNH HÀNH CHÍNH (PROVINCES API) ---
const provinces = ref([])
const districts = ref([])
const wards = ref([])

// Biến lưu mã code để điều khiển thẻ <select>
const selectedProvinceCode = ref('')
const selectedDistrictCode = ref('')
const selectedWardCode = ref('')

// Biến lưu ID địa chỉ được chọn để giao hàng
const selectedAddressId = ref(null)

// Form dữ liệu gửi lên Backend
const newAddress = ref({
  recipient_name: '',
  phone: '',
  province: '', // Lưu TÊN tỉnh
  district: '', // Lưu TÊN huyện
  ward: '', // Lưu TÊN xã
  specific_address: '', // Số nhà, tên đường
})

// Thêm khai báo này ở đầu script
const checkoutItems = ref([])

// Biến cho mã giảm giá
const couponCode = ref('')
const discountAmount = ref(0)
const appliedCouponId = ref(null)
const availableCoupons = ref([]) // Danh sách mã giảm giá khả dụng tải từ database

// 1. Tải danh sách Tỉnh/Thành phố khi mở trang
const fetchProvinces = async () => {
  try {
    const response = await axios.get('https://provinces.open-api.vn/api/v1/')
    provinces.value = response.data
  } catch (error) {
    console.error('Lỗi tải tỉnh thành:', error)
  }
}

// 2. Theo dõi Tỉnh thay đổi -> Tải Quận/Huyện
watch(selectedProvinceCode, async (provinceCode) => {
  if (!provinceCode) {
    newAddress.value.province = ''
    districts.value = []
    return
  }

  const foundProvince = provinces.value.find((p) => p.code == provinceCode)
  if (foundProvince) {
    newAddress.value.province = foundProvince.name
  }

  try {
    const response = await axios.get(
      `https://provinces.open-api.vn/api/v1/p/${provinceCode}?depth=2`,
    )
    districts.value = response.data.districts

    // Reset cấp dưới
    selectedDistrictCode.value = ''
    newAddress.value.district = ''
    selectedWardCode.value = ''
    newAddress.value.ward = ''
    wards.value = []
  } catch (error) {
    console.error('Lỗi tải quận huyện:', error)
    districts.value = []
  }
})

// 3. Theo dõi Huyện thay đổi -> Tải Phường/Xã
watch(selectedDistrictCode, async (districtCode) => {
  if (!districtCode) {
    newAddress.value.district = ''
    wards.value = []
    return
  }

  const foundDistrict = districts.value.find((d) => d.code == districtCode)
  if (foundDistrict) {
    newAddress.value.district = foundDistrict.name
  }

  try {
    const response = await axios.get(
      `https://provinces.open-api.vn/api/v1/d/${districtCode}?depth=2`,
    )
    wards.value = response.data.wards || []

    // Reset cấp dưới
    selectedWardCode.value = ''
    newAddress.value.ward = ''
  } catch (error) {
    console.error('Lỗi tải phường xã:', error)
    wards.value = []
  }
})

// 4. Theo dõi Xã thay đổi -> Lưu Tên xã
watch(selectedWardCode, (wardCode) => {
  if (!wardCode) {
    newAddress.value.ward = ''
    return
  }

  const foundWard = wards.value.find((w) => w.code == wardCode)
  if (foundWard) {
    newAddress.value.ward = foundWard.name
  }
})

// --- QUẢN LÝ ĐỊA CHỈ NGƯỜI DÙNG (BACKEND) ---
const fetchAddresses = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://localhost:3000/api/user/addresses', {
      headers: { Authorization: `Bearer ${token}` },
    })
    addresses.value = response.data.addresses
    // Mặc định chọn địa chỉ đầu tiên nếu có
    if (addresses.value.length > 0) {
      selectedAddressId.value = addresses.value[0].id
    }
  } catch (error) {
    console.error('Lỗi tải địa chỉ:', error)
  }
}

const handleAddAddress = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      'http://localhost:3000/api/user/addresses',
      newAddress.value,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    addresses.value.unshift(response.data.address)
    showModal.value = false

    // Nếu đây là địa chỉ đầu tiên, tự động chọn luôn
    if (addresses.value.length === 1) {
      selectedAddressId.value = response.data.address.id
    }

    // Reset form & select
    newAddress.value = {
      recipient_name: '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      specific_address: '',
    }
    selectedProvinceCode.value = ''
    selectedDistrictCode.value = ''
    selectedWardCode.value = ''

    alert('Thêm địa chỉ thành công!')
  } catch (error) {
    console.error('Lỗi thêm địa chỉ:', error)
    alert('Thêm địa chỉ thất bại!')
  }
}

const handleDeleteAddress = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`http://localhost:3000/api/user/addresses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    addresses.value = addresses.value.filter((addr) => addr.id !== id)
    if (selectedAddressId.value === id) {
      selectedAddressId.value = addresses.value.length > 0 ? addresses.value[0].id : null
    }
    alert('Xóa thành công!')
  } catch (error) {
    console.error('Lỗi xóa:', error)
  }
}

const fetchCart = async () => {
  try {
    const data = localStorage.getItem('checkout_items')
    if (data) {
      checkoutItems.value = JSON.parse(data)
      console.log('Dữ liệu checkout từ localStorage:', checkoutItems.value)
    }
  } catch (error) {
    console.error('Lỗi tải giỏ hàng:', error)
  }
}

// Phí vận chuyển mặc định (ví dụ: 30,000đ nếu dưới 500k)
const STANDARD_SHIPPING_FEE = 30000
const FREE_SHIPPING_THRESHOLD = 500000

// Tính tổng tiền tạm tính sản phẩm
const subTotal = computed(() => {
  return checkoutItems.value.reduce((sum, item) => {
    const price = item.sale_price ? item.sale_price : item.selling_price
    return sum + price * item.quantity
  }, 0)
})

// Tính phí vận chuyển tự động
const shippingFee = computed(() => {
  if (subTotal.value >= FREE_SHIPPING_THRESHOLD) {
    return 0
  }
  return subTotal.value > 0 ? STANDARD_SHIPPING_FEE : 0
})

// Tính tổng tiền thanh toán cuối cùng (Tạm tính - Giảm giá + Phí vận chuyển)
const finalTotal = computed(() => {
  const total = subTotal.value - discountAmount.value + shippingFee.value
  return total > 0 ? total : 0
})

// Biến lưu danh sách phương thức thanh toán từ database
const paymentMethods = ref([])
const selectedPaymentMethodId = ref(null)
const message = ref('')

// Hàm lấy danh sách phương thức thanh toán
const fetchPaymentMethods = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/payment-methods')
    paymentMethods.value = response.data.methods
    if (paymentMethods.value.length > 0) {
      selectedPaymentMethodId.value = paymentMethods.value[0].id
    }
  } catch (error) {
    console.error('Lỗi tải phương thức thanh toán:', error)
  }
}
// Kiểm tra đơn hàng có đủ điều kiện dùng mã không
const canApplyCoupon = (coupon) => {
  return subTotal.value >= Number(coupon.min_order_value ?? 0)
}

// Hàm tải danh sách mã giảm giá khả dụng
const fetchAvailableCoupons = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/coupons/available')
    availableCoupons.value = response.data.coupons
  } catch (error) {
    console.error('Lỗi tải danh sách mã giảm giá:', error)
  }
}

// Hàm áp dụng mã giảm giá
const handleApplyCoupon = async () => {
  if (!couponCode.value.trim()) {
    alert('Vui lòng nhập mã giảm giá!')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      'http://localhost:3000/api/coupons/apply',
      {
        code: couponCode.value,
        items: checkoutItems.value,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    if (response.data.success) {
      discountAmount.value = response.data.discountAmount
      appliedCouponId.value = response.data.coupon_id
      alert(response.data.message)
    }
  } catch (error) {
    console.error('Lỗi áp dụng mã:', error)
    alert(
      error.response?.data?.message ||
      'Mã giảm giá không hợp lệ hoặc không áp dụng cho sản phẩm này!',
    )
  }
}

// Khi người dùng bấm nút "Dùng mã" từ danh sách gợi ý
const selectCoupon = (code) => {
  couponCode.value = code
  handleApplyCoupon()
}

// --- HÀM XỬ LÝ ĐẶT HÀNG ---
const handlePlaceOrder = async () => {
  if (!selectedAddressId.value) {
    alert('Vui lòng chọn địa chỉ nhận hàng!')
    return
  }
  if (!selectedPaymentMethodId.value) {
    alert('Vui lòng chọn phương thức thanh toán!')
    return
  }
  if (checkoutItems.value.length === 0) {
    alert('Không có sản phẩm nào trong đơn hàng!')
    return
  }

  // Lấy thông tin địa chỉ đang được chọn
  const currentAddress = addresses.value.find((a) => a.id === selectedAddressId.value)
  const fullAddressString = `${currentAddress.specific_address}, ${currentAddress.ward}, ${currentAddress.district}, ${currentAddress.province}`

  try {
    const token = localStorage.getItem('token')
    const payload = {
      payment_method_id: selectedPaymentMethodId.value,
      coupon_id: appliedCouponId.value,
      recipient_name: currentAddress.recipient_name,
      phone: currentAddress.phone,
      shipping_address: fullAddressString,
      shipping_fee: shippingFee.value, // 🟢 Thêm dòng này để gửi phí ship lên Backend
      items: checkoutItems.value.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        sale_price: i.sale_price,
        selling_price: i.selling_price,
      })),
      total_amount: finalTotal.value,
    }

    // Gửi yêu cầu đặt hàng xuống Backend
    const response = await axios.post('http://localhost:3000/api/orders', payload, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.data.success) {
      // Xóa dữ liệu giỏ hàng tạm trong localStorage
      localStorage.removeItem('checkout_items')
      localStorage.removeItem('checkout_payload')

      // Kiểm tra nếu là thanh toán VNPay thì chuyển hướng sang link thanh toán
      if (response.data.isVNPay && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl
      } else {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${response.data.order_code}`)
        router.push('/home')
      }
    }
  } catch (error) {
    console.error('Lỗi đặt hàng:', error)

    // Lấy chính xác chuỗi message lỗi từ Backend trả về
    if (error.response && error.response.data) {
      message.value = error.response.data.message // Gán câu lỗi kho hoặc lỗi dữ liệu vào đây
    } else {
      message.value = 'Đã xảy ra lỗi kết nối đến server!'
    }
  }
}

// Quay lại trang trước / giỏ hàng
const handleBack = () => {
  router.back()
}

// Hủy thanh toán: xóa dữ liệu tạm và quay về giỏ hàng
const handleCancel = () => {
  if (!confirm('Bạn có chắc muốn hủy thanh toán? Dữ liệu đơn hàng tạm sẽ bị xóa.')) return
  localStorage.removeItem('checkout_items')
  localStorage.removeItem('checkout_payload')
  router.push('/cart')
}

onMounted(() => {
  fetchProvinces()
  fetchAddresses()
  fetchCart()
  fetchPaymentMethods()
  fetchAvailableCoupons()
})
</script>

<template>
  <div class="container py-4" style="max-width: 800px">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="mb-0 fw-bold">Thanh toán</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="handleBack">← Quay lại</button>
        <!-- <button class="btn btn-outline-danger btn-sm" @click="handleCancel">
          Hủy
        </button> -->
      </div>
    </div>



    <!-- ========== ĐỊA CHỈ GIAO HÀNG ========== -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
        <span>Địa chỉ giao hàng</span>
        <button class="btn btn-success btn-sm" @click="showModal = true">+ Thêm địa chỉ mới</button>
      </div>
      <div class="card-body">
        <div v-if="addresses.length === 0" class="text-muted text-center py-3">
          Chưa có địa chỉ nào được lưu.
        </div>

        <div v-for="addr in addresses" :key="addr.id" class="form-check border rounded-3 p-3 mb-2"
          :class="{ 'border-success bg-success bg-opacity-10': selectedAddressId === addr.id }">
          <input class="form-check-input" type="radio" :id="'addr-' + addr.id" :value="addr.id"
            v-model="selectedAddressId" />
          <label class="form-check-label w-100" :for="'addr-' + addr.id" style="cursor: pointer">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>{{ addr.recipient_name }}</strong>
                <span class="text-muted ms-2">{{ addr.phone }}</span>
                <p class="mb-0 mt-1 small text-secondary">
                  {{ addr.specific_address }}, {{ addr.ward }}, {{ addr.district }},
                  {{ addr.province }}
                </p>
              </div>
              <button class="btn btn-outline-danger btn-sm" @click.stop="handleDeleteAddress(addr.id)">
                Xóa
              </button>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- ========== MODAL THÊM ĐỊA CHỈ ========== -->
    <div v-if="showModal" class="modal d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Thêm địa chỉ mới</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Tên người nhận</label>
              <input type="text" class="form-control" v-model="newAddress.recipient_name"
                placeholder="Tên người nhận" />
            </div>
            <div class="mb-3">
              <label class="form-label">Số điện thoại</label>
              <input type="text" class="form-control" v-model="newAddress.phone" placeholder="Số điện thoại" />
            </div>
            <div class="mb-3">
              <label class="form-label">Tỉnh/Thành phố</label>
              <select class="form-select" v-model="selectedProvinceCode">
                <option value="" disabled>-- Chọn Tỉnh/Thành phố --</option>
                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Quận/Huyện</label>
              <select class="form-select" v-model="selectedDistrictCode" :disabled="!selectedProvinceCode">
                <option value="" disabled>-- Chọn Quận/Huyện --</option>
                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Phường/Xã</label>
              <select class="form-select" v-model="selectedWardCode" :disabled="!selectedDistrictCode">
                <option value="" disabled>-- Chọn Phường/Xã --</option>
                <option v-for="w in wards" :key="w.code" :value="w.code">{{ w.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Địa chỉ cụ thể</label>
              <input type="text" class="form-control" v-model="newAddress.specific_address"
                placeholder="Số nhà, tên đường..." />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">Hủy</button>
            <button type="button" class="btn btn-primary" @click="handleAddAddress">
              Lưu địa chỉ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== THÔNG TIN ĐƠN HÀNG ========== -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white fw-semibold">Thông tin đơn hàng</div>
      <div class="card-body">
        <div v-if="checkoutItems.length === 0" class="text-muted text-center py-3">
          Chưa có sản phẩm nào được chọn để thanh toán.
        </div>

        <div v-else>
          <div v-for="item in checkoutItems" :key="item.variant_id"
            class="d-flex justify-content-between align-items-center py-3 border-bottom">
            <div class="d-flex gap-3 align-items-center">
              <img v-if="item.image" :src="`http://localhost:3000/uploads/variants/${item.image}`" alt="Product"
                class="rounded border" style="width: 56px; height: 56px; object-fit: cover" />
              <div v-else class="bg-light rounded border d-flex align-items-center justify-content-center text-muted"
                style="width: 56px; height: 56px">
                📦
              </div>
              <div>
                <h6 class="mb-0 fw-semibold">{{ item.product_name }}</h6>
                <small class="text-muted">SKU: {{ item.sku }}</small>
                <p class="mb-0 mt-1 text-danger fw-bold small">
                  {{ Number(item.sale_price || item.selling_price).toLocaleString('vi-VN') }} đ
                </p>
              </div>
            </div>
            <div class="text-end">
              <span class="text-muted small">x{{ item.quantity }}</span>
              <p class="mb-0 fw-bold">
                {{
                  ((item.sale_price || item.selling_price) * item.quantity).toLocaleString('vi-VN')
                }}
                đ
              </p>
            </div>
          </div>

          <!-- Mã giảm giá -->
          <div class="mt-4 p-3 border border-dashed rounded-3 bg-light">
            <h6 class="fw-semibold mb-3">Mã giảm giá</h6>
            <div class="input-group mb-3">
              <input type="text" class="form-control" v-model="couponCode" placeholder="Nhập mã giảm giá..." />
              <button class="btn btn-primary" type="button" @click="handleApplyCoupon">
                Áp dụng
              </button>
            </div>

            <p class="small text-muted mb-2">Mã giảm giá khả dụng:</p>
            <div v-if="availableCoupons.length === 0" class="small text-muted">
              Không có mã giảm giá nào.
            </div>
            <div class="d-flex flex-column gap-2" style="max-height: 160px; overflow-y: auto">

              <div v-for="c in availableCoupons" :key="c.id"
                class="d-flex justify-content-between align-items-center p-2 bg-white border rounded">
                <div>
                  <strong class="text-primary">{{ c.code }}</strong>
                  <span class="small ms-1">{{ c.name }}</span>

                  <p class="mb-0 small text-muted">
                    Giảm:
                    {{
                      Number(c.discount_type) === 1
                        ? c.discount_value + '%'
                        : Number(c.discount_value).toLocaleString('vi-VN') + ' đ'
                    }}
                  </p>

                  <p class="mb-0 small text-muted">
                    Đơn tối thiểu:
                    {{ Number(c.min_order_value || 0).toLocaleString('vi-VN') }} đ
                  </p>
                  <p class="mb-0 small">
                    Áp dụng cho:
                    <span v-if="c.categories?.length">
                      {{c.categories.map(category => category.name).join(', ')}}
                    </span>
                    <span v-else class="text-muted">
                      Tất cả danh mục
                    </span>
                  </p>

                  <p v-if="!canApplyCoupon(c)" class="mb-0 small text-danger">
                    Cần mua thêm
                    {{
                      (Number(c.min_order_value || 0) - subTotal).toLocaleString('vi-VN')
                    }}
                    đ để sử dụng mã
                  </p>
                </div>

                <button class="btn btn-success btn-sm" :disabled="!canApplyCoupon(c)" @click="selectCoupon(c.code)">
                  {{ canApplyCoupon(c) ? 'Dùng mã' : 'Chưa đủ điều kiện' }}
                </button>
              </div>

            </div>

            <div v-if="discountAmount > 0" class="mt-2 text-success small fw-semibold">
              Đã áp dụng: -{{ discountAmount.toLocaleString('vi-VN') }} đ
            </div>
          </div>

          <!-- Tổng tiền -->
          <!-- Tổng tiền -->
          <div class="mt-4 text-end">
            <p class="mb-1 text-muted">
              Tạm tính: {{ subTotal.toLocaleString('vi-VN') }} đ
            </p>
            <p class="mb-1 text-muted">
              Phí vận chuyển:
              <span v-if="shippingFee === 0" class="text-success fw-semibold">Miễn phí (Đơn trên 500k)</span>
              <span v-else>{{ shippingFee.toLocaleString('vi-VN') }} đ</span>
            </p>
            <p v-if="discountAmount > 0" class="mb-1 text-success">
              Giảm giá: -{{ discountAmount.toLocaleString('vi-VN') }} đ
            </p>
            <h5 class="mb-0">
              Tổng thanh toán:
              <span class="text-danger fw-bold">
                {{ finalTotal.toLocaleString('vi-VN') }} đ
              </span>
            </h5>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== PHƯƠNG THỨC THANH TOÁN ========== -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white fw-semibold">Phương thức thanh toán</div>
      <div class="card-body">
        <div v-if="paymentMethods.length === 0" class="text-muted">
          Đang tải phương thức thanh toán...
        </div>

        <div v-for="method in paymentMethods" :key="method.id" class="form-check border rounded-3 p-3 mb-2" :class="{
          'border-primary bg-primary bg-opacity-10': selectedPaymentMethodId === method.id,
        }">
          <input class="form-check-input" type="radio" :id="'method-' + method.id" :value="method.id"
            v-model="selectedPaymentMethodId" />
          <label class="form-check-label" :for="'method-' + method.id" style="cursor: pointer">
            <strong>{{ method.name }}</strong>
            <p class="mb-0 small text-muted">{{ method.description }}</p>
          </label>
        </div>
      </div>
    </div>

    <!-- ========== NÚT HÀNH ĐỘNG ========== -->
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-2">
      <div class="d-flex gap-2">
        <!-- <button class="btn btn-outline-secondary" @click="handleBack">
          ← Quay lại
        </button> -->
        <button class="btn btn-outline-danger" @click="handleCancel">Hủy</button>
      </div>
      <button class="btn btn-danger btn-lg px-5 fw-semibold" @click="handlePlaceOrder">
        ĐẶT HÀNG NGAY
      </button>
    </div>
    <!-- Thông báo lỗi -->
    <div v-if="message" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ message }}
      <button type="button" class="btn-close" @click="message = ''"></button>
    </div>
  </div>

</template>

<style scoped>
.border-dashed {
  border-style: dashed !important;
}

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.card {
  transition: box-shadow 0.2s ease;
}
</style>
