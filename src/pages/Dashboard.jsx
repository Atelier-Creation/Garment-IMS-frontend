import { useEffect, useState } from "react";
import { Row, Col, Card, Skeleton, message, Typography } from "antd";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  ReceiptIndianRupee,
  Users,
  ShoppingBasket,
  Wallet,
  TrendingUp,
  Activity,
  AlertTriangle,
  PieChart,
  BarChart3,
} from "lucide-react";
import { reportService } from "../services";
import { StatCard, HelpTooltip } from "../components";

// Import GIF icons
const RevenueGrowth = "/revenue-growth.gif";
const ProductGIF = "/Product.gif";
const UserGIF = "/not-available.gif";
const BillsGIF = "/invoice-bill.gif";

const { Title, Text } = Typography;

const styles = {
  page: { padding: 6, minHeight: "100vh", width: "100%" },
  roundedCard: { borderRadius: 14, boxShadow: "0 6px 18px rgba(15,23,42,0.06)" },
};

const Counter = ({ value, duration = 1000, formatter }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{formatter ? formatter(count) : count}</span>;
};

// Simple Chart Components
const SimplePieChart = ({ data }) => {
  console.log('SimplePieChart data:', data); // Debug log

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

  if (total === 0 || data.length === 0) {
    return (
      <div className="text-center py-8">
        <PieChart size={48} className="mx-auto mb-2 opacity-50" />
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Simple circular representation */}
      <div className="relative w-32 h-32 mx-auto mb-4" data-aos="zoom-in" data-aos-duration="600">
        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              <Counter value={total} />
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="font-medium">{item.type}</span>
              </div>
              <div className="text-right">
                <span className="font-bold">
                  <Counter value={item.value} />
                </span>
                <span className="text-gray-500 ml-1">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SimpleBarChart = ({ data }) => {
  console.log('SimpleBarChart data:', data); // Debug log

  const maxValue = Math.max(...data.map(item => item.value), 1); // Ensure at least 1 to avoid division by 0
  const colors = ['#f5222d', '#faad14', '#1890ff', '#52c41a'];

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.level}</span>
            <span className="font-bold"><Counter value={item.value} /> items</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-center text-white text-xs font-medium transition-all duration-1000 ease-out"
              data-aos="fade-right"
              data-aos-duration="1000"
              data-aos-delay={index * 100}
              style={{
                width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 0)}%`,
                backgroundColor: colors[index % colors.length],
              }}
            >
              {item.value > 0 ? <Counter value={item.value} /> : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SimpleLineChart = ({ data }) => {
  console.log('SimpleLineChart data:', data); // Debug log

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div
            key={index}
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:scale-105 transition-transform duration-200"
            data-aos="fade-up"
            data-aos-delay={index * 100}
          >
            <div className="text-sm font-medium text-blue-800 mb-1">{item.month}</div>
            <div className="text-xl font-bold text-blue-600">
              ₹<Counter value={item.revenue} formatter={(val) => val.toLocaleString()} />
            </div>
            <div className="text-xs text-blue-500">Revenue</div>
          </div>
        ))}
      </div>

      {/* Simple trend indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <TrendingUp size={16} />
          <span>Monthly Revenue Trend</span>
        </div>
      </div>
    </div>
  );
};

const SimpleProductChart = ({ data }) => {
  console.log('SimpleProductChart data:', data); // Debug log

  const maxValue = Math.max(...data.map(item => item.sold), 1);

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBasket size={48} className="mx-auto mb-2 opacity-50" />
        <p className="text-gray-500">No products data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.slice(0, 5).map((item, index) => (
        <div key={index} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium truncate flex-1 mr-2">{item.product}</span>
            <span className="text-sm font-bold text-blue-600"><Counter value={item.sold} /> sold</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-1000 ease-out"
              data-aos="fade-right"
              data-aos-duration="1000"
              data-aos-delay={index * 100}
              style={{
                width: `${Math.max((item.sold / maxValue) * 100, item.sold > 0 ? 15 : 0)}%`,
              }}
            >
              <span className="text-white text-xs font-medium">
                {item.sold > 0 ? `#${index + 1}` : ''}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [dashboardTitle, setDashboardTitle] = useState("Dashboard");

  // Helper function to format currency based on screen size
  const formatCurrency = (amount, isCompact = false) => {
    const numAmount = parseFloat(amount || 0);

    if (isCompact) {
      // For tablet/mobile view - abbreviated format
      if (numAmount >= 10000000) { // 1 crore+
        return `₹${(numAmount / 10000000).toFixed(1)}Cr`;
      } else if (numAmount >= 100000) { // 1 lakh+
        return `₹${(numAmount / 100000).toFixed(1)}L`;
      } else if (numAmount >= 1000) { // 1 thousand+
        return `₹${(numAmount / 1000).toFixed(0)}k`;
      } else {
        return `₹${numAmount.toFixed(0)}`;
      }
    } else {
      // For desktop view - whole numbers without decimals
      return `₹${numAmount.toFixed(0)}`;
    }
  };

  const updateTimestamp = () => {
    const now = new Date();
    const formatted =
      now.toLocaleDateString("en-GB") +
      " " +
      now.toLocaleTimeString("en-GB");
    setLastUpdated(formatted);
  };

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      offset: 50
    });

    try {
      const roleRaw = localStorage.getItem("role") || "";
      const role = String(roleRaw).toLowerCase().trim();

      if (role === "super admin") setDashboardTitle("Admin Dashboard");
      else if (role === "branch admin") setDashboardTitle("Branch Admin Dashboard");
      else setDashboardTitle("Garment IMS Dashboard");
    } catch (e) {
      setDashboardTitle("Garment IMS Dashboard");
    }
  }, []);

  // Fetch summary data
  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const response = await reportService.getDashboardStats();
        console.log('Dashboard API Response:', response); // Debug log

        if (mounted && response.success) {
          // Map the actual API response to expected format
          const mappedData = {
            totalProducts: response.data.production?.completed_orders || 0,
            totalUsers: 0, // Not available in current API
            totalOrders: response.data.sales?.this_month?.count || 0,
            totalRevenue: response.data.sales?.this_month?.total || 0,
            totalSuppliers: 0, // Not available in current API
            totalCustomers: 0, // Not available in current API
            lowStockItems: response.data.alerts?.low_stock_items || 0,
            pendingOrders: (response.data.pending_orders?.sales || 0) +
              (response.data.pending_orders?.purchase || 0) +
              (response.data.pending_orders?.production || 0),
            // Keep original data for detailed display
            originalData: response.data,
            // Chart data with fallback mock data for testing
            charts: response.data.charts || {
              sales_by_status: [
                { status: 'DRAFT', count: 2 },
                { status: 'CONFIRMED', count: 1 },
                { status: 'PAID', count: 0 }
              ],
              production_by_status: [
                { status: 'completed', count: 1 },
                { status: 'planned', count: 1 }
              ],
              stock_levels: [
                { stock_level: 'Critical', count: 0 },
                { stock_level: 'Low', count: 1 },
                { stock_level: 'Medium', count: 2 },
                { stock_level: 'High', count: 5 }
              ],
              monthly_sales_trend: [
                { month: '2025-12', revenue: 0, orders: 0 },
                { month: '2026-01', revenue: 0, orders: 0 }
              ],
              top_products: [
                { product_name: 'Elegant Evening Dress', size: 'M', color: 'Red', total_sold: 5, total_revenue: 13995 }
              ]
            },
            recentActivities: response.data.recent_activities || []
          };

          console.log('Sales this month:', response.data.sales?.this_month);
          console.log('Total Orders:', mappedData.totalOrders);
          console.log('Total Revenue:', mappedData.totalRevenue);
          console.log('Mapped Dashboard Data:', mappedData); // Debug log
          setSummary(mappedData);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        message.error('Failed to load dashboard statistics');
        if (mounted) {
          // Fallback to mock data with sample charts
          setSummary({
            totalProducts: 1,
            totalUsers: 0,
            totalOrders: 0,
            totalRevenue: 0,
            totalSuppliers: 0,
            totalCustomers: 0,
            lowStockItems: 1,
            pendingOrders: 1,
            charts: {
              sales_by_status: [
                { status: 'DRAFT', count: 2 },
                { status: 'CONFIRMED', count: 1 }
              ],
              production_by_status: [
                { status: 'completed', count: 1 },
                { status: 'planned', count: 1 }
              ],
              stock_levels: [
                { stock_level: 'Low', count: 1 },
                { stock_level: 'Medium', count: 2 }
              ],
              monthly_sales_trend: [
                { month: '2025-12', revenue: 0 },
                { month: '2026-01', revenue: 0 }
              ],
              top_products: [
                { product_name: 'Sample Product', size: 'M', color: 'Blue', total_sold: 5 }
              ]
            },
            recentActivities: []
          });
        }
      } finally {
        if (mounted) setLoadingSummary(false);
        updateTimestamp();
      }
    };

    fetchSummary();
    return () => (mounted = false);
  }, []);

  const summaryCards = summary && [
    {
      id: "production",
      title: "Completed Production",
      value: summary.totalProducts ?? 0,
      // percentage: summary.totalProducts > 0 ? 8.5 : 0,
      meta: summary.originalData?.production?.total_produced ? `${summary.originalData.production.total_produced} units produced` : "Production orders",
      icon: <img src={ProductGIF} alt="Total Products" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain" />,
      color: "transparent",
      // noBg: true,
      linkTo: "/production",
    },
    {
      id: "orders",
      title: "This Month Orders",
      value: summary.totalOrders ?? 0,
      // percentage: summary.totalOrders > 0 ? 15.2 : 0,
      meta: "Sales orders this month",
      icon: <img src={BillsGIF} alt="Total Bills" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain" />,
      color: "transparent",
      // noBg: true,
      linkTo: "/sales",
    },
    {
      id: "revenue",
      title: "This Month Revenue",
      value: (
        <>
          <span className="hidden md:inline">{formatCurrency(summary.totalRevenue, false)}</span>
          <span className="md:hidden">{formatCurrency(summary.totalRevenue, true)}</span>
        </>
      ),
      // percentage: summary.totalRevenue > 0 ? 12.8 : 0,
      meta: "Revenue this month",
      icon: <img src={RevenueGrowth} alt="Revenue Growth" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain" />,
      color: "transparent",
      // noBg: true,
      linkTo: "/report",
    },
    {
      id: "alerts",
      title: "Low Stock Items",
      value: summary.lowStockItems ?? 0,
      // percentage: summary.lowStockItems > 5 ? -8.3 : summary.lowStockItems > 0 ? -3.1 : 2.5,
      meta: "Items need restocking",
      icon: <img src={UserGIF} alt="Revenue Growth" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain" />,
      color: "transparent", // Red
      // noBg: true,
      linkTo: "/stock/list",
    }
  ];

  const getStatColor = (title) => {
    switch (title) {
      case "Pending Sales": return "from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300 hover:from-orange-100 hover:to-orange-200 text-orange-900";
      case "Pending Purchases": return "from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-blue-200 text-blue-900";
      case "Pending Production": return "from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300 hover:from-purple-100 hover:to-purple-200 text-purple-900";
      case "Low Stock Alerts": return "from-red-50 to-red-100 border-red-200 hover:border-red-300 hover:from-red-100 hover:to-red-200 text-red-900";
      default: return "from-gray-50 to-gray-100 border-gray-200 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100 text-gray-900";
    }
  };

  const quickStats = summary && [
    {
      title: "Pending Sales",
      value: summary.originalData?.pending_orders?.sales ?? 0,
      linkTo: "/sales"
    },
    {
      title: "Pending Purchases",
      value: summary.originalData?.pending_orders?.purchase ?? 0,
      linkTo: "/order"
    },
    {
      title: "Pending Production",
      value: summary.originalData?.pending_orders?.production ?? 0,
      linkTo: "/production"
    },
    {
      title: "Low Stock Alerts",
      value: summary.lowStockItems ?? 0,
      linkTo: "/stock/list"
    }
  ];

  return (
    <div style={styles.page}>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1" style={{ fontWeight: "700" }}>
            {dashboardTitle}
            <HelpTooltip
              title="Dashboard Overview"
              content="This is your main dashboard showing key business metrics, recent activities, and system status. View production stats, sales data, stock levels, and quick access to important functions. Charts provide visual insights into your business performance."
            />
          </h1>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>
            Last updated: {lastUpdated || "—"}
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
          <Link
            to="/product/variants"
            className="text-sm !bg-[#506EE4] py-2 px-3 !text-white shadow-sm rounded-sm hover:bg-[#4056d6] transition-colors"
          >
            View Products
          </Link>
          <Link
            to="/sales"
            className="text-sm !bg-[#E9EDF4] py-2 px-3 !text-gray-700 shadow-sm rounded-sm hover:bg-[#dde1ea] transition-colors"
          >
            New Order
          </Link>
          <Link
            to="/order"
            state={{ createOrder: true }}
            className="text-sm !bg-[#E9EDF4] py-2 px-3 !text-gray-700 shadow-sm rounded-sm hover:bg-[#dde1ea] transition-colors"
          >
            Purchase Order
          </Link>
        </div>
      </div>

      {/* Main Summary Cards */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        {loadingSummary
          ? [0, 1, 2, 3].map((i) => (
            <Col xs={24} sm={12} md={12} lg={6} xl={6} key={i}>
              <Card style={{ borderRadius: 14 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))
          : summaryCards.map((s, index) => (
            <Col xs={24} sm={12} md={12} lg={6} xl={6} key={s.id}>
              <div data-aos="fade-up" data-aos-delay={index * 100}>
                <StatCard
                  title={s.title}
                  value={s.value}
                  percentage={s.percentage}
                  meta={s.meta}
                  icon={s.icon}
                  color={s.color}
                  linkTo={s.linkTo}
                  arrowColor="#fff"
                  noBg={s.noBg}
                />
              </div>
            </Col>
          ))}
      </Row>

      {/* Quick Stats */}
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card style={styles.roundedCard}>
            <Title level={4} className="mb-4">Quick Overview</Title>
            <Row gutter={[16, 16]}>
              {loadingSummary ? (
                [0, 1, 2, 3].map((i) => (
                  <Col xs={12} sm={6} key={i}>
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Col>
                ))
              ) : (
                quickStats.map((stat, index) => (
                  <Col xs={12} sm={6} key={index}>
                    <div
                      data-aos="zoom-in"
                      data-aos-delay={index * 100}
                      className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Link to={stat.linkTo} className={`block p-4 bg-gradient-to-br rounded-lg transition-all duration-200 border hover:shadow-md ${getStatColor(stat.title)}`}>
                        <div className="text-center">
                          <div className={`text-2xl font-bold mb-1 ${stat.title === "Pending Sales" ? "text-orange-700" : stat.title === "Pending Purchases" ? "text-blue-700" : stat.title === "Pending Production" ? "text-purple-700" : stat.title === "Low Stock Alerts" ? "text-red-700" : "text-gray-900"}`}>{stat.value}</div>
                          <div className={`text-sm ${stat.title === "Pending Sales" ? "text-orange-600" : stat.title === "Pending Purchases" ? "text-blue-600" : stat.title === "Pending Production" ? "text-purple-600" : stat.title === "Low Stock Alerts" ? "text-red-600" : "text-gray-600"}`}>{stat.title}</div>
                        </div>
                      </Link>
                    </div>
                  </Col>
                ))
              )}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <div data-aos="fade-up" data-aos-delay="200">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">
                <PieChart className="inline mr-2" size={20} />
                Sales Status Distribution
              </Title>
              {loadingSummary ? (
                <Skeleton active />
              ) : (
                <SimplePieChart
                  data={summary?.charts?.sales_by_status?.map(item => ({
                    type: item.status,
                    value: parseInt(item.count)
                  })) || []}
                  title="Sales Status"
                />
              )}
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div data-aos="fade-up" data-aos-delay="300">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">
                <Activity className="inline mr-2" size={20} />
                Production Status
              </Title>
              {loadingSummary ? (
                <Skeleton active />
              ) : (
                <SimplePieChart
                  data={summary?.charts?.production_by_status?.map(item => ({
                    type: item.status,
                    value: parseInt(item.count)
                  })) || []}
                  title="Production Status"
                />
              )}
            </Card>
          </div>
        </Col>
      </Row>

      {/* Stock Levels and Monthly Sales */}
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <div data-aos="fade-up" data-aos-delay="400">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">
                <AlertTriangle className="inline mr-2" size={20} />
                Stock Levels Distribution
              </Title>
              {loadingSummary ? (
                <Skeleton active />
              ) : (
                <SimpleBarChart
                  data={summary?.charts?.stock_levels?.map(item => ({
                    level: item.stock_level,
                    value: parseInt(item.count)
                  })) || []}
                  title="Stock Levels"
                />
              )}
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div data-aos="fade-up" data-aos-delay="500">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">
                <TrendingUp className="inline mr-2" size={20} />
                Monthly Sales Trend
              </Title>
              {loadingSummary ? (
                <Skeleton active />
              ) : (
                <SimpleLineChart
                  data={summary?.charts?.monthly_sales_trend?.map(item => ({
                    month: item.month,
                    revenue: parseFloat(item.revenue || 0)
                  })) || []}
                  title="Monthly Sales"
                />
              )}
            </Card>
          </div>
        </Col>
      </Row>

      {/* Top Products */}
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <div data-aos="fade-up" data-aos-delay="600">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">
                <BarChart3 className="inline mr-2" size={20} />
                Top Selling Products
              </Title>
              {loadingSummary ? (
                <Skeleton active />
              ) : (
                <SimpleProductChart
                  data={summary?.charts?.top_products?.map(item => ({
                    product: `${item.product_name} (${item.size}-${item.color})`,
                    sold: parseInt(item.total_sold)
                  })) || []}
                  title="Top Products"
                />
              )}
            </Card>
          </div>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <div data-aos="fade-up" data-aos-delay="700">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">Recent Activity</Title>
              <div className="space-y-3">
                {loadingSummary ? (
                  [1, 2, 3].map(i => <Skeleton key={i} active paragraph={{ rows: 1 }} />)
                ) : (
                  summary?.recentActivities?.length > 0 ? (
                    summary.recentActivities.slice(0, 5).map((activity, index) => (
                      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${activity.type === 'sales' ? 'bg-blue-50' :
                        activity.type === 'production' ? 'bg-green-50' :
                          'bg-orange-50'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${activity.type === 'sales' ? 'bg-blue-600' :
                          activity.type === 'production' ? 'bg-green-600' :
                            'bg-orange-600'
                          }`}></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.activity}</div>
                          <div className="text-xs text-gray-500">
                            {activity.reference} • {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Activity size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No recent activities</p>
                    </div>
                  )
                )}
              </div>
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div data-aos="fade-up" data-aos-delay="800">
            <Card style={styles.roundedCard}>
              <Title level={4} className="mb-4">System Status</Title>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Server</span>
                  <span className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="flex items-center gap-2 text-sm text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                    75% Used
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;