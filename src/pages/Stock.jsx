import React, { useCallback, useEffect, useState } from "react";
import { Card, Button, Table, Input, Select, Modal, Form, InputNumber, message, Tag, Space, Tooltip } from "antd";
import { 
  Warehouse, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCcw, 
  Download, 
  Upload, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package
} from "lucide-react";
import { stockService, productService, rawMaterialService } from "../services";
import api from "../services/api";

const { Option } = Select;
import { SearchInput, HelpTooltip } from "../components";

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMovementModalVisible, setIsMovementModalVisible] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [form] = Form.useForm();
  const [movementForm] = Form.useForm();

  // Data for dropdowns
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  // Fetch stocks
  const fetchStocks = useCallback(async (page = 1, search = "", type = "all") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
        branch_id: undefined,
        low_stock: undefined
      };
      
      let allStocks = [];
      let totalCount = 0;
      
      // Fetch both finished goods and raw materials
      if (type === "all" || type === "finished_goods") {
        try {
          const fgResponse = await api.get('/stock/finished-goods', { params });
          if (fgResponse.data.success) {
            const fgStocks = (fgResponse.data.data.finished_goods_stock || []).map(item => ({
              ...item,
              stock_type: 'finished_goods',
              item_type: 'product',
              item_name: item.ProductVariant?.Product?.product_name || 'N/A',
              item_code: item.ProductVariant?.sku || 'N/A',
              quantity: item.qty,
              branch: item.Branch?.name || 'N/A',
              unit: 'PCS'
            }));
            allStocks = [...allStocks, ...fgStocks];
            totalCount += fgResponse.data.data.pagination?.total || fgStocks.length;
          }
        } catch (error) {
          console.error("Failed to fetch finished goods:", error);
        }
      }
      
      if (type === "all" || type === "raw_materials") {
        try {
          const rmResponse = await api.get('/stock/raw-materials', { params });
          if (rmResponse.data.success) {
            const rmBatches = rmResponse.data.data.raw_material_stock || [];
            
            // Aggregate batches by raw_material_id and branch_id
            const aggregatedRM = {};
            rmBatches.forEach(item => {
              const key = `${item.raw_material_id}_${item.branch_id}`;
              if (!aggregatedRM[key]) {
                aggregatedRM[key] = {
                  ...item,
                  stock_type: 'raw_materials',
                  item_type: 'raw_material',
                  item_name: item.RawMaterial?.name || 'N/A',
                  item_code: item.RawMaterial?.material_code || 'N/A',
                  quantity: 0,
                  branch: item.Branch?.name || 'N/A',
                  unit: item.RawMaterial?.uom || 'N/A',
                  batch_count: 0
                };
              }
              // Sum up quantities from all batches
              aggregatedRM[key].quantity += parseFloat(item.qty || 0);
              aggregatedRM[key].batch_count += 1;
            });
            
            const rmStocks = Object.values(aggregatedRM);
            allStocks = [...allStocks, ...rmStocks];
            totalCount += rmResponse.data.data.pagination?.total || rmStocks.length;
          }
        } catch (error) {
          console.error("Failed to fetch raw materials:", error);
        }
      }
      
      setStocks(allStocks);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: totalCount,
      }));
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
      message.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [productsRes, rawMaterialsRes] = await Promise.all([
        productService.getProducts({ limit: 1000 }),
        rawMaterialService.getRawMaterials({ limit: 1000 })
      ]);
      
      if (productsRes.success) {
        setProducts(productsRes.data.data || []);
      }
      if (rawMaterialsRes.success) {
        setRawMaterials(rawMaterialsRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchDropdownData();
  }, [fetchStocks]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchStocks(1, value, filterType);
  };

  // Handle filter change
  const handleFilterChange = (value) => {
    setFilterType(value);
    fetchStocks(1, searchTerm, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchStocks(paginationInfo.current, searchTerm, filterType);
  };

  // Handle stock adjustment
  const handleAdjustStock = async (values) => {
    try {
      // Prepare adjustment data based on stock type
      const adjustmentData = {
        ...values,
        variant_id: editingStock.variant_id,
        branch_id: editingStock.branch_id,
        raw_material_id: editingStock.raw_material_id
      };
      
      const response = await api.post('/stock/adjust', adjustmentData);
      if (response.data.success) {
        message.success("Stock adjusted successfully");
        setIsModalVisible(false);
        form.resetFields();
        setEditingStock(null);
        fetchStocks(pagination.current, searchTerm, filterType);
      }
    } catch (error) {
      console.error("Failed to adjust stock:", error);
      message.error(error.response?.data?.message || "Failed to adjust stock");
    }
  };

  // Handle stock movement
  const handleStockMovement = async (values) => {
    try {
      const response = await stockService.createStockMovement(values);
      if (response.success) {
        message.success("Stock movement recorded successfully");
        setIsMovementModalVisible(false);
        movementForm.resetFields();
        fetchStocks(pagination.current, searchTerm, filterType);
      }
    } catch (error) {
      console.error("Failed to record stock movement:", error);
      message.error("Failed to record stock movement");
    }
  };

  // Get stock status
  const getStockStatus = (stock) => {
    const quantity = stock.quantity || 0;
    const minLevel = stock.min_level || 0;
    const maxLevel = stock.max_level || 100;

    if (quantity <= minLevel) {
      return { status: "Low Stock", color: "red", icon: <AlertTriangle size={14} /> };
    } else if (quantity >= maxLevel) {
      return { status: "Overstock", color: "orange", icon: <TrendingUp size={14} /> };
    } else {
      return { status: "Normal", color: "green", icon: <Package size={14} /> };
    }
  };

  const columns = [
    {
      title: "Item",
      dataIndex: "item_name",
      key: "item_name",
      render: (text, record) => (
        <div>
          <div className="font-medium">
            {record.ProductVariant?.Product?.product_name || record.RawMaterial?.name || text}
          </div>
          <div className="text-xs text-gray-500">
            {record.ProductVariant ? (
              // For finished goods, show variant details
              <span>{record.ProductVariant.sku} ({record.ProductVariant.size} - {record.ProductVariant.color})</span>
            ) : (
              // For raw materials, show material code and batch count
              <span>
                {record.RawMaterial?.material_code || record.item_code}
                {record.batch_count > 1 && (
                  <span className="ml-2 text-blue-600">({record.batch_count} batches)</span>
                )}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "item_type",
      key: "item_type",
      render: (type) => (
        <Tag color={type === "product" ? "blue" : "green"}>
          {type === "product" ? "Product" : "Raw Material"}
        </Tag>
      ),
    },
    {
      title: "Current Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => {
        const stockStatus = getStockStatus(record);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{quantity || 0}</span>
            <Tag color={stockStatus.color} icon={stockStatus.icon}>
              {stockStatus.status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (branch) => (
        <Tag color="blue">{branch || 'N/A'}</Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Adjust Stock">
            <Button
              type="primary"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => {
                setEditingStock(record);
                form.setFieldsValue({
                  adjustment_type: "adjustment",
                  quantity: 0,
                  reason: "",
                });
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <Warehouse size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Stock Management
              <HelpTooltip 
                title="Stock Management"
                content="Monitor and manage inventory levels for both finished goods and raw materials. Track stock movements, adjust quantities, view stock history, and manage stock across different locations. Filter by stock type and search for specific items."
              />
            </h2>
            <p className="text-sm text-gray-600">Monitor and manage inventory levels</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              movementForm.resetFields();
              setIsMovementModalVisible(true);
            }}
            style={{ backgroundColor: "#506ee4" }}
          >
            Stock Movement
          </Button>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchStocks(pagination.current, searchTerm, filterType)}
          >
            Refresh
          </Button>
          <Button icon={<Download size={16} />}>
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchInput
            placeholder="Search by item name or code..."
            allowClear
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch("")}
            style={{ width: 300, maxWidth: '100%' }}
          />
          <Select
            value={filterType}
            onChange={handleFilterChange}
            style={{ width: 180 }}
          >
            <Option value="all">All Items</Option>
            <Option value="finished_goods">Finished Goods</Option>
            <Option value="raw_materials">Raw Materials</Option>
            <Option value="low_stock">Low Stock</Option>
          </Select>
        </div>
      </Card>

      {/* Stock Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={stocks}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Stock Adjustment Modal */}
      <Modal
        title="Adjust Stock"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingStock(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdjustStock}
        >
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h4 className="font-medium">
              {editingStock?.product?.product_name || editingStock?.RawMaterial?.name}
            </h4>
            <p className="text-sm text-gray-600">
              Current Stock: {editingStock?.quantity || 0} {editingStock?.unit}
            </p>
          </div>

          <Form.Item
            name="adjustment_type"
            label="Adjustment Type"
            rules={[{ required: true, message: "Please select adjustment type" }]}
          >
            <Select>
              <Option value="increase">Increase Stock</Option>
              <Option value="decrease">Decrease Stock</Option>
              <Option value="adjustment">Manual Adjustment</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter quantity"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Please enter reason" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for adjustment"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Adjust Stock
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Stock Movement Modal */}
      <Modal
        title="Record Stock Movement"
        open={isMovementModalVisible}
        onCancel={() => {
          setIsMovementModalVisible(false);
          movementForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={movementForm}
          layout="vertical"
          onFinish={handleStockMovement}
        >
          <Form.Item
            name="item_type"
            label="Item Type"
            rules={[{ required: true, message: "Please select item type" }]}
          >
            <Select placeholder="Select item type">
              <Option value="product">Product</Option>
              <Option value="raw_material">Raw Material</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="item_id"
            label="Item"
            rules={[{ required: true, message: "Please select item" }]}
          >
            <Select
              placeholder="Select item"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {movementForm.getFieldValue("item_type") === "product"
                ? products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.product_name} ({product.product_code})
                    </Option>
                  ))
                : rawMaterials.map(material => (
                    <Option key={material.id} value={material.id}>
                      {material.name} ({material.material_code})
                    </Option>
                  ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            name="movement_type"
            label="Movement Type"
            rules={[{ required: true, message: "Please select movement type" }]}
          >
            <Select>
              <Option value="in">Stock In</Option>
              <Option value="out">Stock Out</Option>
              <Option value="transfer">Transfer</Option>
              <Option value="adjustment">Adjustment</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter quantity"
            />
          </Form.Item>

          <Form.Item
            name="reference"
            label="Reference"
          >
            <Input placeholder="Reference number or document" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Additional notes"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsMovementModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Record Movement
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Stock;