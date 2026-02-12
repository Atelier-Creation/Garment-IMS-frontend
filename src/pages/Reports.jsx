import { useState, useEffect } from "react";
import { Card, Row, Col, Select, DatePicker, Button, Table, Statistic, Progress, message } from "antd";
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Filter
} from "lucide-react";
import { reportService } from "../services";
import dayjs from "dayjs";
import { HelpTooltip } from "../components";

const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [reportData, setReportData] = useState(null);
  const [summaryStats, setSummaryStats] = useState({});

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };

      let response;
      switch (reportType) {
        case 'sales':
          response = await reportService.getSalesReport(params);
          break;
        case 'purchase':
          response = await reportService.getPurchaseReport(params);
          break;
        case 'production':
          response = await reportService.getProductionReport(params);
          break;
        case 'stock':
          response = await reportService.getStockReport();
          break;
        case 'financial':
          response = await reportService.getFinancialReport(params);
          break;
        default:
          throw new Error('Invalid report type');
      }

      if (response.success) {
        console.log('Report data received:', response.data);
        setReportData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      message.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary statistics
  const fetchSummaryStats = async () => {
    try {
      const response = await reportService.getDashboardStats();
      if (response.success) {
        // Map the dashboard response to the expected format
        const mappedStats = {
          totalRevenue: response.data.sales?.this_month?.total || 0,
          totalOrders: response.data.sales?.this_month?.count || 0,
          totalProducts: response.data.production?.completed_orders || 0,
          lowStockItems: response.data.alerts?.low_stock_items || 0,
          pendingOrders: response.data.pending_orders || {},
          productionData: response.data.production || {}
        };
        setSummaryStats(mappedStats);
      }
    } catch (error) {
      console.error("Failed to fetch summary stats:", error);
    }
  };

  useEffect(() => {
    fetchReportData();
    fetchSummaryStats();
  }, [reportType, dateRange]);

  // Handle report generation
  const handleGenerateReport = () => {
    fetchReportData();
  };

  // Handle export
  const handleExport = (format) => {
    message.success(`Exporting report as ${format.toUpperCase()}...`);
    // Implement actual export logic here
  };

  // Get table data based on report type
  const getTableData = () => {
    if (!reportData) return [];

    switch (reportType) {
      case 'purchase':
        return reportData.top_suppliers || [];
      case 'sales':
        return reportData.sales_by_period || [];
      case 'stock':
        return reportData.finished_goods_inventory || [];
      case 'production':
        return reportData.top_products || [];
      case 'financial':
        // Transform financial data into table format
        if (reportData.revenue && reportData.expenses) {
          return [
            { metric: 'Gross Revenue', amount: reportData.revenue.gross_revenue || 0 },
            { metric: 'Total Discounts', amount: reportData.revenue.total_discounts || 0 },
            { metric: 'Total Tax', amount: reportData.revenue.total_tax || 0 },
            { metric: 'Net Revenue', amount: reportData.revenue.net_revenue || 0 },
            { metric: 'Total Expenses', amount: reportData.expenses.total_expenses || 0 },
            { metric: 'Gross Profit', amount: reportData.profit_analysis?.gross_profit || 0 },
          ];
        }
        return [];
      default:
        return [];
    }
  };

  // Sales Report Columns
  const salesColumns = [
    {
      title: "Order ID",
      dataIndex: "order_id",
      key: "order_id",
    },
    {
      title: "Customer",
      dataIndex: "customer_name",
      key: "customer_name",
    },
    {
      title: "Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: "Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => `₹${amount?.toLocaleString() || 0}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className={`px-2 py-1 rounded text-xs ${status === 'completed' ? 'bg-green-100 text-green-800' :
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
          }`}>
          {status}
        </span>
      ),
    },
  ];

  // Stock Report Columns
  const stockColumns = [
    {
      title: "Product",
      key: "product_name",
      render: (_, record) => (
        <div>
          <div>{record.ProductVariant?.Product?.product_name || 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.ProductVariant?.size} - {record.ProductVariant?.color}
          </div>
        </div>
      ),
    },
    {
      title: "SKU",
      dataIndex: ["ProductVariant", "sku"],
      key: "sku",
    },
    {
      title: "Branch",
      dataIndex: ["Branch", "name"],
      key: "branch_name",
    },
    {
      title: "Current Stock",
      dataIndex: "qty",
      key: "qty",
    },
    {
      title: "Reserved",
      dataIndex: "reserved_qty",
      key: "reserved_qty",
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const isLow = record.qty <= 10; // Using 10 as default low stock threshold
        return (
          <span className={`px-2 py-1 rounded text-xs ${isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
            {isLow ? 'Low Stock' : 'Normal'}
          </span>
        );
      },
    },
  ];

  // Purchase Report Columns
  const purchaseColumns = [
    {
      title: "Supplier",
      dataIndex: ["Supplier", "name"],
      key: "supplier_name",
    },
    {
      title: "Total Orders",
      dataIndex: "total_orders",
      key: "total_orders",
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => `₹${parseFloat(amount || 0).toLocaleString()}`,
    },
    {
      title: "Supplier ID",
      dataIndex: "supplier_id",
      key: "supplier_id",
      render: (id) => id.substring(0, 8) + '...',
    },
  ];

  // Production Report Columns
  const productionColumns = [
    {
      title: "Product",
      dataIndex: ["Product", "product_name"],
      key: "product_name",
    },
    {
      title: "Total Orders",
      dataIndex: "total_orders",
      key: "total_orders",
    },
    {
      title: "Total Quantity",
      dataIndex: "total_quantity",
      key: "total_quantity",
      render: (qty) => parseFloat(qty || 0).toLocaleString(),
    },
    {
      title: "Product ID",
      dataIndex: "product_id",
      key: "product_id",
      render: (id) => id.substring(0, 8) + '...',
    },
  ];

  // Financial Report Columns
  const financialColumns = [
    {
      title: "Metric",
      dataIndex: "metric",
      key: "metric",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `₹${parseFloat(amount || 0).toLocaleString()}`,
    },
  ];

  const getColumns = () => {
    switch (reportType) {
      case "sales":
        return salesColumns;
      case "stock":
        return stockColumns;
      case "purchase":
        return purchaseColumns;
      case "production":
        return productionColumns;
      case "financial":
        return financialColumns;
      default:
        return salesColumns;
    }
  };

  const reportTypes = [
    // { value: "sales", label: "Sales Report", icon: <DollarSign size={16} /> },
    { value: "purchase", label: "Purchase Report", icon: <ShoppingCart size={16} /> },
    { value: "stock", label: "Stock Report", icon: <Package size={16} /> },
    { value: "production", label: "Production Report", icon: <BarChart3 size={16} /> },
    { value: "financial", label: "Financial Report", icon: <TrendingUp size={16} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <BarChart3 size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Reports & Analytics
              <HelpTooltip
                title="Reports & Analytics"
                content="Generate comprehensive business reports including sales, purchase, production, and stock reports. Filter by date ranges, analyze trends, view summary statistics, and export reports for business insights and decision making."
              />
            </h2>
            <p className="text-sm text-gray-600">Generate comprehensive business reports</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={() => handleExport('pdf')}
            style={{ backgroundColor: "#506ee4" }}
          >
            Export PDF
          </Button>
          <Button
            icon={<Download size={16} />}
            onClick={() => handleExport('excel')}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="This Month Revenue"
              value={summaryStats.totalRevenue || 0}
              prefix="₹"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="This Month Orders"
              value={summaryStats.totalOrders || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completed Production"
              value={summaryStats.totalProducts || 0}
              valueStyle={{ color: '#722ed1' }}
              suffix={summaryStats.productionData?.total_produced ? `(${summaryStats.productionData.total_produced} units)` : ''}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={summaryStats.lowStockItems || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Pending Orders Summary */}
      {summaryStats.pendingOrders && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Pending Sales"
                value={summaryStats.pendingOrders.sales || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Pending Purchases"
                value={summaryStats.pendingOrders.purchase || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Pending Production"
                value={summaryStats.pendingOrders.production || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Report Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: "100%", minWidth: 200 }}
            >
              {reportTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    {type.label}
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </div>

          <Button
            type="primary"
            icon={<Filter size={16} />}
            onClick={handleGenerateReport}
            loading={loading}
          >
            Generate Report
          </Button>
        </div>
      </Card>

      {/* Report Content */}
      <Row gutter={[16, 16]}>
        {/* Main Report Table */}
        <Col xs={24} lg={16}>
          <Card title={`${reportTypes.find(t => t.value === reportType)?.label || 'Report'}`}>
            <Table
              columns={getColumns()}
              dataSource={getTableData()}
              rowKey={(record, index) => record.supplier_id || record.id || index}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        {/* Report Summary */}
        <Col xs={24} lg={8}>
          <Card title="Report Summary" className="mb-4">
            <div className="space-y-4">
              {reportType === 'purchase' && reportData?.summary && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Orders</span>
                      <span className="font-medium">{reportData.summary.total_orders || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="font-medium">₹{parseFloat(reportData.summary.total_spent || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Average Order Value</span>
                      <span className="font-medium">₹{parseFloat(reportData.summary.average_order_value || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              {reportType === 'production' && reportData?.summary && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Orders</span>
                      <span className="font-medium">{reportData.summary.total_orders || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Planned</span>
                      <span className="font-medium">{parseFloat(reportData.summary.total_planned || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Produced</span>
                      <span className="font-medium">{parseFloat(reportData.summary.total_produced || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Efficiency</span>
                      <span className="font-medium">{parseFloat(reportData.summary.efficiency_percentage || 0).toFixed(1)}%</span>
                    </div>
                    <Progress
                      percent={parseFloat(reportData.summary.efficiency_percentage || 0)}
                      strokeColor="#52c41a"
                    />
                  </div>
                </>
              )}

              {reportType === 'financial' && reportData?.profit_analysis && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Gross Profit</span>
                      <span className="font-medium">₹{parseFloat(reportData.profit_analysis.gross_profit || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Profit Margin</span>
                      <span className="font-medium">{parseFloat(reportData.profit_analysis.profit_margin_percentage || 0).toFixed(1)}%</span>
                    </div>
                    <Progress
                      percent={Math.min(parseFloat(reportData.profit_analysis.profit_margin_percentage || 0), 100)}
                      strokeColor={parseFloat(reportData.profit_analysis.profit_margin_percentage || 0) > 0 ? "#52c41a" : "#ff4d4f"}
                    />
                  </div>
                </>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Records</span>
                  <span className="font-medium">{getTableData().length || 0}</span>
                </div>
                <Progress
                  percent={100}
                  showInfo={false}
                  strokeColor="#52c41a"
                />
              </div>

              {reportType === 'sales' && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Completed Orders</span>
                      <span className="font-medium">{reportData?.completed || 0}</span>
                    </div>
                    <Progress
                      percent={reportData?.total ? (reportData.completed / reportData.total) * 100 : 0}
                      strokeColor="#52c41a"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Pending Orders</span>
                      <span className="font-medium">{reportData?.pending || 0}</span>
                    </div>
                    <Progress
                      percent={reportData?.total ? (reportData.pending / reportData.total) * 100 : 0}
                      strokeColor="#faad14"
                    />
                  </div>
                </>
              )}

              {reportType === 'stock' && reportData?.summary && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Items</span>
                      <span className="font-medium">{reportData.summary.finished_goods_items || 0}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Low Stock Items</span>
                      <span className="font-medium">{reportData.summary.low_stock_finished_goods || 0}</span>
                    </div>
                    <Progress
                      percent={reportData.summary.finished_goods_items ? (reportData.summary.low_stock_finished_goods / reportData.summary.finished_goods_items) * 100 : 0}
                      strokeColor="#ff4d4f"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Total Inventory Value</span>
                      <span className="font-medium">₹{parseFloat(reportData.summary.total_inventory_value || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}

              {reportType === 'stock' && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Normal Stock</span>
                      <span className="font-medium">{(reportData.summary?.finished_goods_items || 0) - (reportData.summary?.low_stock_finished_goods || 0)}</span>
                    </div>
                    <Progress
                      percent={reportData.summary?.finished_goods_items ? ((reportData.summary.finished_goods_items - reportData.summary.low_stock_finished_goods) / reportData.summary.finished_goods_items) * 100 : 0}
                      strokeColor="#52c41a"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Low Stock</span>
                      <span className="font-medium">{reportData.summary?.low_stock_finished_goods || 0}</span>
                    </div>
                    <Progress
                      percent={reportData.summary?.finished_goods_items ? (reportData.summary.low_stock_finished_goods / reportData.summary.finished_goods_items) * 100 : 0}
                      strokeColor="#ff4d4f"
                    />
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button
                block
                icon={<FileText size={16} />}
                onClick={() => handleExport('pdf')}
              >
                Download PDF Report
              </Button>
              <Button
                block
                icon={<Download size={16} />}
                onClick={() => handleExport('excel')}
              >
                Export to Excel
              </Button>
              <Button
                block
                icon={<Calendar size={16} />}
                onClick={() => {
                  setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
                }}
              >
                Last 7 Days
              </Button>
              <Button
                block
                icon={<Calendar size={16} />}
                onClick={() => {
                  setDateRange([dayjs().subtract(30, 'day'), dayjs()]);
                }}
              >
                Last 30 Days
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;