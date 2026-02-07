import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber,
  message, 
  Space, 
  Tooltip, 
  Tag,
  Row,
  Col,
  Upload,
  Image
} from "antd";
import { 
  Package2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCcw, 
  Eye,
  Upload as UploadIcon
} from "lucide-react";
import { productVariantService, productService } from "../services";

const { Option } = Select;
import { SearchInput, HelpTooltip } from "../components";

const ProductVariants = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [viewingVariant, setViewingVariant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Dropdown data
  const [products, setProducts] = useState([]);

  const [form] = Form.useForm();

  // Fetch product variants
  const fetchVariants = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };
      
      const response = await productVariantService.getProductVariants(params);
      if (response.success) {
        setVariants(response.data.productVariants || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch product variants:", error);
      message.error("Failed to load product variants");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 1000 });
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchVariants();
    fetchProducts();
  }, [fetchVariants]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchVariants(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchVariants(paginationInfo.current, searchTerm);
  };

  // Handle create/update variant
  const handleSubmit = async (values) => {
    try {
      let response;
      if (editingVariant) {
        response = await productVariantService.updateProductVariant(editingVariant.id, values);
      } else {
        response = await productVariantService.createProductVariant(values);
      }

      if (response.success) {
        message.success(`Product variant ${editingVariant ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        form.resetFields();
        setEditingVariant(null);
        fetchVariants(pagination.current, searchTerm);
      }
    } catch (error) {
      console.error("Failed to save product variant:", error);
      message.error(`Failed to ${editingVariant ? 'update' : 'create'} product variant`);
    }
  };

  // Handle delete variant
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this product variant?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await productVariantService.deleteProductVariant(id);
          if (response.success) {
            message.success("Product variant deleted successfully");
            fetchVariants(pagination.current, searchTerm);
          }
        } catch (error) {
          console.error("Failed to delete product variant:", error);
          message.error("Failed to delete product variant");
        }
      },
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: "green",
      inactive: "red",
      discontinued: "orange",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "Product",
      key: "product",
      render: (Product) => (
        <div>
          <div className="font-medium">{Product?.product_name || "N/A"}</div>
          <div className="text-xs text-gray-500">{Product?.product_code}</div>
        </div>
      ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      render: (sku) => (
        <span className="font-mono text-sm">{sku}</span>
      ),
    },
    {
      title: "Variant",
      key: "variant",
      render: (_, record) => (
        <div className="space-y-1">
          {record.size && (
            <Tag color="green">Size: {record.size}</Tag>
          )}
          {record.color && (
            <Tag color="blue">Color: {record.color}</Tag>
          )}
        </div>
      ),
    },
    {
      title: "MRP",
      dataIndex: "mrp",
      key: "mrp",
      render: (mrp) => `₹${parseFloat(mrp || 0).toFixed(2)}`,
    },
    {
      title: "Cost Price",
      dataIndex: "cost_price",
      key: "cost_price",
      render: (cost_price) => `₹${parseFloat(cost_price || 0).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => {
                setViewingVariant(record);
                setIsViewModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => {
                setEditingVariant(record);
                form.setFieldsValue({
                  product_id: record.product_id,
                  sku: record.sku,
                  size: record.size,
                  color: record.color,
                  barcode: record.barcode,
                  mrp: record.mrp,
                  cost_price: record.cost_price
                });
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              size="small"
              icon={<Trash2 size={14} />}
              onClick={() => handleDelete(record.id)}
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
            <Package2 size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Product Variants
              <HelpTooltip 
                title="Product Variants Management"
                content="Manage product variations including different sizes, colors, styles, and attributes. Set specific pricing, SKUs, and inventory levels for each variant. Track variant-specific stock and sales data."
              />
            </h2>
            <p className="text-sm text-gray-600">Manage product variations and attributes</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingVariant(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            style={{ backgroundColor: "#506ee4" }}
          >
            Add Variant
          </Button>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchVariants(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <SearchInput
          placeholder="Search variants by name, SKU, or product..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch("")}
          style={{ width: 400, maxWidth: '100%' }}
        />
      </Card>

      {/* Variants Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={variants}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} variants`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add/Edit Variant Modal */}
      <Modal
        title={editingVariant ? "Edit Product Variant" : "Add Product Variant"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingVariant(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="product_id"
                label="Product"
                rules={[{ required: true, message: "Please select product" }]}
              >
                <Select
                  placeholder="Select product"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {product.product_name} ({product.product_code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: "Please enter SKU" }]}
              >
                <Input placeholder="Enter SKU (e.g., WDR001-M-RED)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="size"
                label="Size"
                rules={[{ required: true, message: "Please enter size" }]}
              >
                <Input placeholder="Enter size (e.g., S, M, L)" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="color"
                label="Color"
                rules={[{ required: true, message: "Please enter color" }]}
              >
                <Input placeholder="Enter color" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="barcode"
                label="Barcode"
              >
                <Input placeholder="Enter barcode" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mrp"
                label="MRP (Maximum Retail Price)"
                rules={[{ required: true, message: "Please enter MRP" }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  placeholder="Enter MRP"
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cost_price"
                label="Cost Price"
                rules={[{ required: true, message: "Please enter cost price" }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  placeholder="Enter cost price"
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingVariant ? "Update" : "Create"} Variant
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Variant Modal */}
      <Modal
        title="Product Variant Details"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingVariant(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewingVariant && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Product</label>
                  <div className="text-lg font-semibold">{viewingVariant.product?.product_name}</div>
                  <div className="text-sm text-gray-500">{viewingVariant.product?.product_code}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Variant Name</label>
                  <div className="text-lg font-semibold">{viewingVariant.variant_name}</div>
                  <div className="text-sm text-gray-500">SKU: {viewingVariant.sku}</div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Color</label>
                  <div>{viewingVariant.color || "N/A"}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Size</label>
                  <div>{viewingVariant.size || "N/A"}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Material</label>
                  <div>{viewingVariant.material || "N/A"}</div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <div className="text-lg font-semibold text-green-600">
                    ₹{viewingVariant.price?.toLocaleString() || 0}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cost Price</label>
                  <div>₹{viewingVariant.cost_price?.toLocaleString() || 0}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stock</label>
                  <div className={viewingVariant.stock_quantity <= 10 ? "text-red-600 font-medium" : ""}>
                    {viewingVariant.stock_quantity || 0}
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Weight</label>
                  <div>{viewingVariant.weight ? `${viewingVariant.weight} kg` : "N/A"}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div>
                    <Tag color={getStatusColor(viewingVariant.status)}>
                      {viewingVariant.status?.toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            {viewingVariant.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="mt-1 p-3 bg-gray-50 rounded">{viewingVariant.description}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductVariants;