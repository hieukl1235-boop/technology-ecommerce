<template>
  <div class="stats-page">
    <!-- HEADER + FILTER -->
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="$router.back()" title="Quay lại">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Quay lại</span>
        </button>
        <div class="header-titles">
          <div class="brand-tag">ANALYTICS DASHBOARD</div>
          <h1 class="page-title">Doanh thu &amp; Thống kê</h1>
          <p class="page-sub">
            Từ <b>{{ filter.startDate }}</b> đến <b>{{ filter.endDate }}</b>
          </p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="date-inputs">
          <input type="date" v-model="filter.startDate" class="tech-input" />
          <span class="date-sep">→</span>
          <input type="date" v-model="filter.endDate" class="tech-input" />
        </div>
        <button @click="fetchData" class="btn-primary-tech" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-sm"></span>
          <span>{{ isLoading ? 'Đang tải...' : '🔍 Lọc' }}</span>
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="isLoading" class="state-box">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu thống kê...</p>
    </div>

    <template v-else>
      <!-- 1. OVERVIEW CARDS -->
      <div class="stat-grid stat-grid-4">
        <div class="stat-card stat-card-blue">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <span class="stat-label">Tổng đơn hàng</span>
            <span class="stat-value">{{ overview.total_orders || 0 }}</span>
          </div>
        </div>

        <div class="stat-card stat-card-green">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <span class="stat-label">Tổng doanh thu</span>
            <span class="stat-value">{{ formatCurrency(overview.total_revenue) }}</span>
          </div>
        </div>

        <div class="stat-card stat-card-purple">
          <div class="stat-icon">🛍️</div>
          <div class="stat-info">
            <span class="stat-label">Sản phẩm</span>
            <span class="stat-value">{{ overview.total_products || 0 }}</span>
          </div>
        </div>

        <div class="stat-card stat-card-orange">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-label">Khách hàng</span>
            <span class="stat-value">{{ overview.total_users || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 2. ADVANCED METRICS -->
      <div class="stat-grid stat-grid-3">
        <div class="stat-card stat-card-advanced">
          <div class="adv-header">
            <span class="adv-icon">📊</span>
            <span class="adv-title">Giá trị TB đơn (AOV)</span>
          </div>
          <div class="adv-value">{{ formatCurrency(aovMetrics.avg_order_value) }}</div>
          <div class="adv-sub">Cao nhất: <b>{{ formatCurrency(aovMetrics.max_order_value) }}</b></div>
        </div>

        <div class="stat-card stat-card-advanced">
          <div class="adv-header">
            <span class="adv-icon">✅</span>
            <span class="adv-title">Tỷ lệ đơn thành công</span>
          </div>
          <div class="adv-value adv-value-success">{{ successRate }}%</div>
          <div class="adv-sub">Dựa trên tổng số đơn hàng</div>
        </div>

        <div class="stat-card stat-card-advanced">
          <div class="adv-header">
            <span class="adv-icon">⏰</span>
            <span class="adv-title">Khung giờ cao điểm</span>
          </div>
          <div class="adv-value adv-value-warning">{{ peakHour }}</div>
          <div class="adv-sub">Lượng mua tập trung nhất</div>
        </div>
      </div>

      <!-- 3. CHARTS -->
      <div class="chart-grid">
        <div class="card-box chart-card">
          <div class="card-box-header">
            <span class="header-icon">📈</span>
            <h5 class="mb-0 fw-bold text-dark">Doanh thu theo tháng</h5>
          </div>
          <div class="chart-body">
            <Bar v-if="revenueChart.labels.length" :data="revenueChart" :options="chartOptions" />
            <div v-else class="chart-empty">Chưa có dữ liệu doanh thu</div>
          </div>
        </div>

        <div class="card-box chart-card">
          <div class="card-box-header">
            <span class="header-icon">💵</span>
            <h5 class="mb-0 fw-bold text-dark">Lợi nhuận gộp theo tháng</h5>
          </div>
          <div class="chart-body">
            <Line v-if="profitChart.labels.length" :data="profitChart" :options="chartOptions" />
            <div v-else class="chart-empty">Chưa có dữ liệu lợi nhuận</div>
          </div>
        </div>
      </div>

      <!-- 4. TABLES -->
      <div class="table-grid">
        <!-- Top sản phẩm bán chạy -->
        <div class="card-box">
          <div class="card-box-header">
            <span class="header-icon">🔥</span>
            <h5 class="mb-0 fw-bold text-dark">Top sản phẩm bán chạy nhất</h5>
          </div>
          <div class="table-body">
            <div v-if="topProducts.length === 0" class="table-empty">Chưa có dữ liệu</div>
            <table v-else class="data-table">
              <tbody>
                <tr v-for="item in topProducts" :key="item.product_id">
                  <td>
                    <div class="product-cell">
                      <img
                        :src="`http://localhost:3000/uploads/products/${item.main_image}`"
                        class="cell-img"
                        @error="$event.target.src = 'https://via.placeholder.com/40'"
                      />
                      <span class="cell-name">{{ item.product_name }}</span>
                    </div>
                  </td>
                  <td class="cell-right">
                    <span class="badge badge-primary">{{ item.total_sold }} đã bán</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Doanh thu theo danh mục -->
        <div class="card-box">
          <div class="card-box-header">
            <span class="header-icon">📁</span>
            <h5 class="mb-0 fw-bold text-dark">Doanh thu theo danh mục</h5>
          </div>
          <div class="table-body">
            <div v-if="revenueByCategory.length === 0" class="table-empty">Chưa có dữ liệu</div>
            <table v-else class="data-table">
              <tbody>
                <tr v-for="cat in revenueByCategory" :key="cat.category_id">
                  <td class="cell-name">{{ cat.category_name }}</td>
                  <td class="cell-right">
                    <span class="badge badge-success">{{ formatCurrency(cat.revenue) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top khách hàng -->
        <div class="card-box">
          <div class="card-box-header">
            <span class="header-icon">💎</span>
            <h5 class="mb-0 fw-bold text-dark">Khách hàng chi tiêu nhiều nhất</h5>
          </div>
          <div class="table-body">
            <div v-if="topCustomers.length === 0" class="table-empty">Chưa có dữ liệu</div>
            <table v-else class="data-table">
              <tbody>
                <tr v-for="cus in topCustomers" :key="cus.user_id">
                  <td>
                    <div class="customer-cell">
                      <span class="customer-name">{{ cus.full_name }}</span>
                      <span class="customer-email">{{ cus.email }}</span>
                    </div>
                  </td>
                  <td class="cell-right">
                    <span class="badge badge-success">{{ formatCurrency(cus.total_spent) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Hiệu suất nhân viên -->
        <div class="card-box">
          <div class="card-box-header">
            <span class="header-icon">💼</span>
            <h5 class="mb-0 fw-bold text-dark">Hiệu suất nhân viên xử lý đơn</h5>
          </div>
          <div class="table-body">
            <div v-if="employeePerformance.length === 0" class="table-empty">Chưa có dữ liệu</div>
            <table v-else class="data-table">
              <tbody>
                <tr v-for="emp in employeePerformance" :key="emp.employee_id">
                  <td class="cell-name">{{ emp.employee_name }}</td>
                  <td class="cell-right">
                    <span class="badge badge-primary">{{ emp.total_orders_handled }} đơn</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sản phẩm bán ít / tồn kho -->
        <div class="card-box">
          <div class="card-box-header">
            <span class="header-icon">⚠️</span>
            <h5 class="mb-0 fw-bold text-dark">Sản phẩm bán ít / Tồn kho</h5>
          </div>
          <div class="table-body">
            <div v-if="leastProducts.length === 0" class="table-empty">Chưa có dữ liệu</div>
            <table v-else class="data-table">
              <tbody>
                <tr v-for="item in leastProducts" :key="item.product_id">
                  <td>
                    <div class="product-cell">
                      <img
                        :src="`http://localhost:3000/uploads/products/${item.main_image}`"
                        class="cell-img"
                        @error="$event.target.src = 'https://via.placeholder.com/40'"
                      />
                      <span class="cell-name">{{ item.product_name }}</span>
                    </div>
                  </td>
                  <td class="cell-right">
                    <span class="badge badge-danger">{{ item.total_sold }} đã bán</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 5. DETAILED TABLE (FULL WIDTH) -->
      <div class="card-box">
        <div class="card-box-header">
          <span class="header-icon">📦</span>
          <h5 class="mb-0 fw-bold text-dark">Chi tiết Doanh thu &amp; Lợi nhuận theo sản phẩm</h5>
        </div>
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU Biến thể</th>
                <th class="text-center">Đã bán</th>
                <th class="text-end">Doanh thu</th>
                <th class="text-end">Giá vốn</th>
                <th class="text-end">Lợi nhuận gộp</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="profitByProduct.length === 0">
                <td colspan="6" class="table-empty">Chưa có dữ liệu sản phẩm</td>
              </tr>
              <tr v-for="item in profitByProduct" :key="item.product_id">
                <td>
                  <div class="product-cell">
                    <img
                      :src="`http://localhost:3000/uploads/products/${item.main_image}`"
                      class="cell-img-sm"
                      @error="$event.target.src = 'https://via.placeholder.com/35'"
                    />
                    <span class="cell-name">{{ item.product_name }}</span>
                  </div>
                </td>
                <td>
                  <span class="sku-badge">{{ item.variant_sku || 'N/A' }}</span>
                </td>
                <td class="text-center fw-bold">{{ item.total_sold_quantity }}</td>
                <td class="text-end text-success fw-bold">{{ formatCurrency(item.total_revenue) }}</td>
                <td class="text-end text-muted">{{ formatCurrency(item.total_cost) }}</td>
                <td class="text-end text-primary fw-bold">{{ formatCurrency(item.total_profit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
)

// ============ STATES (GIỮ NGUYÊN) ============
const overview = ref({})
const topProducts = ref([])
const revenueByCategory = ref([])
const topCustomers = ref([])
const employeePerformance = ref([])
const leastProducts = ref([])
const profitByProduct = ref([])
const aovMetrics = ref({})
const successRate = ref(0)
const peakHour = ref('N/A')
const isLoading = ref(false)

const filter = reactive({ startDate: '', endDate: '' })

const revenueChart = reactive({
  labels: [],
  datasets: [{ label: 'Doanh thu', backgroundColor: '#0284c7', data: [] }],
})

const profitChart = reactive({
  labels: [],
  datasets: [
    {
      label: 'Lợi nhuận',
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      data: [],
      fill: true,
      tension: 0.35,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: 'Be Vietnam Pro' },
      bodyFont: { family: 'Be Vietnam Pro' },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: { color: '#64748b', font: { family: 'Be Vietnam Pro', size: 11 } },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { family: 'Be Vietnam Pro', size: 11 } },
    },
  },
}

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

// ============ FETCH DATA (GIỮ NGUYÊN ENDPOINT) ============
const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await axios.get(
      `http://localhost:3000/api/admin/statistics/dashboard?startDate=${filter.startDate}&endDate=${filter.endDate}`,
    )
    const data = res.data.data

    overview.value = data.overview
    topProducts.value = data.topProducts
    revenueByCategory.value = data.revenueByCategory
    topCustomers.value = data.topCustomers
    employeePerformance.value = data.employeePerformance
    leastProducts.value = data.leastProducts
    profitByProduct.value = data.profitByProduct
    aovMetrics.value = data.aovMetrics

    const successObj = data.orderFulfillment.find((i) => i.order_status === 4)
    successRate.value = successObj ? successObj.percentage : 0

    if (data.ordersByHour.length > 0) {
      const peak = data.ordersByHour.reduce((max, curr) =>
        curr.total_orders > max.total_orders ? curr : max,
      )
      peakHour.value = `${peak.hour_of_day}:00 - ${Number(peak.hour_of_day) + 1}:00`
    }

    revenueChart.labels = data.monthlyRevenue.map((i) => i.month)
    revenueChart.datasets[0].data = data.monthlyRevenue.map((i) => i.revenue)

    profitChart.labels = data.monthlyProfit.map((i) => i.month)
    profitChart.datasets[0].data = data.monthlyProfit.map((i) => i.profit)
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const d = new Date()
  filter.endDate = d.toISOString().split('T')[0]
  d.setDate(d.getDate() - 30)
  filter.startDate = d.toISOString().split('T')[0]
  fetchData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

/* ============ WRAPPER ============ */
.stats-page {
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  background-image:
    linear-gradient(rgba(226, 232, 240, 0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(226, 232, 240, 0.6) 1px, transparent 1px);
  background-size: 32px 32px;
  padding: 30px 40px;
  box-sizing: border-box;
  font-family: 'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif;
  color: #0f172a;
}
.stats-page *,
.stats-page *::before,
.stats-page *::after { box-sizing: border-box; }

/* ============ HEADER ============ */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  flex-shrink: 0;
  margin-top: 4px;
}
.btn-back:hover {
  background: #f0f9ff;
  color: #0284c7;
  border-color: #0284c7;
  transform: translateX(-2px);
}

.header-titles { min-width: 0; }
.brand-tag {
  font-size: 0.725rem;
  font-weight: 700;
  color: #0284c7;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.page-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}
.page-sub b { color: #0284c7; }

/* Filter */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  flex-wrap: wrap;
}
.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}
.date-sep {
  color: #94a3b8;
  font-weight: 700;
}
.tech-input {
  padding: 9px 12px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #0f172a;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
}
.tech-input:focus {
  background: #fff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
}

.btn-primary-tech {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s;
}
.btn-primary-tech:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
}
.btn-primary-tech:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============ STATE ============ */
.state-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 80px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.state-box p { margin: 0; color: #64748b; font-size: 14px; }
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ============ STAT GRIDS ============ */
.stat-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}
.stat-grid-4 { grid-template-columns: repeat(4, 1fr); }
.stat-grid-3 { grid-template-columns: repeat(3, 1fr); }

/* Stat cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}
.stat-card-blue::before { background: #0284c7; }
.stat-card-green::before { background: #10b981; }
.stat-card-purple::before { background: #8b5cf6; }
.stat-card-orange::before { background: #f59e0b; }

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -8px rgba(15, 23, 42, 0.12);
  border-color: #cbd5e1;
}

.stat-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 24px;
  flex-shrink: 0;
}
.stat-card-blue .stat-icon { background: #eff6ff; }
.stat-card-green .stat-icon { background: #ecfdf5; }
.stat-card-purple .stat-icon { background: #f5f3ff; }
.stat-card-orange .stat-icon { background: #fffbeb; }

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.stat-label {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  word-break: break-word;
}
.stat-card-blue .stat-value { color: #0284c7; }
.stat-card-green .stat-value { color: #10b981; }

/* Advanced cards */
.stat-card-advanced {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
}
.stat-card-advanced:hover { transform: translateY(-2px); }

.adv-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.adv-icon { font-size: 18px; }
.adv-title {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.adv-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0284c7;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.adv-value-success { color: #10b981; }
.adv-value-warning { color: #f59e0b; font-size: 1.4rem; }
.adv-sub {
  font-size: 0.8rem;
  color: #94a3b8;
}
.adv-sub b { color: #64748b; }

/* ============ CHART GRID ============ */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.card-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-box-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-icon { font-size: 18px; }
.card-box-header h5 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.chart-card { min-height: 380px; }
.chart-body {
  position: relative;
  height: 320px;
  padding: 20px 24px;
}
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
}

/* ============ TABLE GRID ============ */
.table-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.table-body {
  padding: 8px 0 16px;
  max-height: 340px;
  overflow-y: auto;
}
.table-body::-webkit-scrollbar { width: 6px; }
.table-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}
.table-empty {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
}

/* Data table (list) */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.data-table tbody tr:last-child { border-bottom: none; }
.data-table tbody tr:hover { background: #f8fafc; }
.data-table tbody td {
  padding: 12px 22px;
  vertical-align: middle;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.cell-img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}
.cell-img-sm {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #fff;
  flex-shrink: 0;
}
.cell-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.customer-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.customer-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}
.customer-email {
  font-size: 0.75rem;
  color: #94a3b8;
}

.cell-right { text-align: right; }

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}
.badge-primary {
  background: #eff6ff;
  color: #0284c7;
  border: 1px solid #bfdbfe;
}
.badge-success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.badge-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* ============ DETAILED TABLE ============ */
.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.custom-table thead th {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  text-align: left;
}
.custom-table thead th.text-center { text-align: center; }
.custom-table thead th.text-end { text-align: right; }

.custom-table tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  vertical-align: middle;
}
.custom-table tbody tr:hover { background: #f8fafc; }
.custom-table tbody tr:last-child td { border-bottom: none; }

.custom-table .text-center { text-align: center; }
.custom-table .text-end { text-align: right; }
.custom-table .text-success { color: #059669; }
.custom-table .text-muted { color: #94a3b8; }
.custom-table .text-primary { color: #0284c7; }
.custom-table .fw-bold { font-weight: 700; }

.sku-badge {
  display: inline-block;
  padding: 3px 9px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 600;
}

.table-responsive { overflow-x: auto; }
.table-responsive::-webkit-scrollbar { height: 8px; }
.table-responsive::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1200px) {
  .stat-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 992px) {
  .stats-page { padding: 22px 20px; }
  .stat-grid-3 { grid-template-columns: 1fr; }
  .chart-grid,
  .table-grid { grid-template-columns: 1fr; }
  .filter-bar { width: 100%; }
}
@media (max-width: 640px) {
  .stats-page { padding: 16px 12px; }
  .page-title { font-size: 1.4rem; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-left { flex-direction: column; gap: 12px; }
  .stat-grid-4 { grid-template-columns: 1fr; }
  .date-inputs { width: 100%; }
  .tech-input { flex: 1; }
  .btn-primary-tech { width: 100%; justify-content: center; }
  .chart-body { height: 260px; }
}
</style>