import React, { useState, useEffect } from "react";
import { Card, Button, Table, Modal, Form, Select, InputNumber, Input, message, Tag, Space, DatePicker } from "antd";
import { Factory, Plus, Eye, Play, CheckCircle, XCircle } from "lucide-react";
import { productionOrderService, productService, bomService } from "../services";
import api from "../services/api";
import dayjs from "dayjs";
import { HelpTooltip } from "../components";

const { Option } = Select;
const { TextArea } = Input;

const ProductionOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchBranches();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await productionOrderService.getProductionOrders();
      if (response.success) {
        setOrders(response.data.production_orders || []);
      }
    } catch (error) {
      message.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchBranches = async () => {
    try {
      const response = await api.get("/branches");
      if (response.data.success) {
        setBranches(response.data.data.branches || []);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const handleProductChange = async (productId) => {
    try {
      // Fetch BOMs for the product
      const bomsResponse = await bomService.getBOMsByProduct(productId);
      if (bomsResponse.success) {
        setBoms(bomsResponse.data.boms || []);
      }

      // Fetch variants for the product
      const variantsResponse = await api.get(`/product-variants/product/${productId}`, {
        params: { limit: 1000 }
      });
      if (variantsResponse.data.success) {
        setVariants(variantsResponse.data.data.productVariants || []);
      }
    } catch (error) {
      message.error("Failed to load BOMs and variants for selected product");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        start_at: values.start_at?.format("YYYY-MM-DD"),
        end_at: values.end_at?.format("YYYY-MM-DD")
      };

      const response = await productionOrderService.createProductionOrder(data);
      if (response.success) {
        // Check if there are material shortages
        const materialReqs = response.data.material_requirements || [];
        const hasShortages = materialReqs.some(req => req.shortage > 0);

        if (hasShortages) {
          const shortageList = materialReqs
            .filter(req => req.shortage > 0)
            .map(req => `${req.raw_material_name}: Short by ${req.shortage} units`)
            .join('\n');

          message.warning({
            content: (
              <div>
                <div>Production order created, but there are material shortages:</div>
                <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{shortageList}</div>
                <div style={{ marginTop: 8 }}>Please add stock before starting production.</div>
              </div>
            ),
            duration: 8
          });
        } else {
          message.success("Production order created successfully");
        }

        setIsModalVisible(false);
        form.resetFields();
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create production order");
    }
  };

  const handleStart = async (id) => {
    try {
      const response = await productionOrderService.startProductionOrder(id);
      if (response.success) {
        message.success("Production order started");
        fetchOrders();
      }
    } catch (error) {
      console.error("Start production error:", error);
      console.error("Error response:", error.response);

      const errorMsg = error.response?.data?.message || "Failed to start production order";
      console.log("Showing error message:", errorMsg);

      // Show error message - simplified version
      message.error(errorMsg, 8);

      // Also show as alert for debugging
      alert(`Cannot Start Production:\n\n${errorMsg}`);
    }
  };

  const handleComplete = async (values) => {
    try {
      const data = {
        produced_qty: values.produced_qty,
        consumption_data: []
      };

      const response = await productionOrderService.completeProductionOrder(selectedOrder.id, data);
      if (response.success) {
        message.success("Production order completed");
        setIsCompleteModalVisible(false);
        completeForm.resetFields();
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to complete production order");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PLANNED: "orange",
      IN_PROGRESS: "blue",
      COMPLETED: "green",
      CANCELLED: "red",
      ON_HOLD: "gray"
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Production Code",
      dataIndex: "production_code",
      key: "production_code"
    },
    {
      title: "Product",
      dataIndex: ["Product", "product_name"],
      key: "product",
      render: (name, record) => (
        <div>
          <div className="font-medium">{name}</div>
          {record.ProductVariant && (
            <div className="text-xs text-gray-500">
              {record.ProductVariant.size} - {record.ProductVariant.color}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Planned Qty",
      dataIndex: "planned_qty",
      key: "planned_qty"
    },
    {
      title: "Produced Qty",
      dataIndex: "produced_qty",
      key: "produced_qty"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Start Date",
      dataIndex: "start_at",
      key: "start_at",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-"
    },
    {
      title: "End Date",
      dataIndex: "end_at",
      key: "end_at",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-"
    },
    {
      title: "Branch",
      dataIndex: ["Branch", "name"],
      key: "branch",
      render: (name) => (
        <Tag color="blue" style={{ fontSize: '12px' }}>
          {name || 'N/A'}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status === "PLANNED" && (
            <Button
              type="primary"
              size="small"
              icon={<Play size={14} />}
              onClick={() => handleStart(record.id)}
            >
              Start
            </Button>
          )}
          {record.status === "IN_PROGRESS" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircle size={14} />}
              onClick={() => {
                setSelectedOrder(record);
                completeForm.setFieldsValue({
                  produced_qty: record.planned_qty
                });
                setIsCompleteModalVisible(true);
              }}
              style={{ backgroundColor: "#52c41a" }}
            >
              Complete
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <Factory size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Production Orders
              <HelpTooltip
                title="Production Orders Management"
                content="Create and manage production orders for manufacturing products. Plan production schedules, track order status from planned to completed, manage raw material consumption, and record production output. Links with BOM for material requirements."
              />
            </h2>
            <p className="text-sm text-gray-600">Manage production workflow</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsModalVisible(true)}
          style={{ backgroundColor: "#506ee4" }}
        >
          New Production Order
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create Production Order"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: "Please select product" }]}
          >
            <Select
              placeholder="Select product"
              onChange={handleProductChange}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.product_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="bom_id"
            label="BOM (Bill of Materials)"
            rules={[{ required: true, message: "Please select BOM" }]}
          >
            <Select placeholder="Select BOM">
              {boms.map((bom) => (
                <Option key={bom.id} value={bom.id}>
                  {bom.name || `BOM for ${bom.Product?.product_name || 'Product'}`} (v{bom.version})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="variant_id"
            label="Variant (Size/Color)"
            tooltip="Select the specific variant you're producing. This is required to track finished goods in stock."
          >
            <Select
              placeholder="Select variant (optional but recommended)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {variants.map((variant) => (
                <Option key={variant.id} value={variant.id}>
                  {variant.size} - {variant.color} ({variant.sku})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="branch_id"
            label="Branch"
            rules={[{ required: true, message: "Please select branch" }]}
          >
            <Select placeholder="Select branch">
              {branches.map((branch) => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="planned_qty"
            label="Planned Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="start_at"
            label="Start Date"
            rules={[{ required: true, message: "Please select date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="end_at"
            label="Target End Date"
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Complete Modal */}
      <Modal
        title="Complete Production Order"
        open={isCompleteModalVisible}
        onCancel={() => {
          setIsCompleteModalVisible(false);
          completeForm.resetFields();
          setSelectedOrder(null);
        }}
        footer={null}
      >
        <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <p><strong>Production Code:</strong> {selectedOrder?.production_code}</p>
            <p><strong>Product:</strong> {selectedOrder?.Product?.product_name}</p>
            <p><strong>Planned Qty:</strong> {selectedOrder?.planned_qty}</p>
          </div>

          <Form.Item
            name="produced_qty"
            label="Actual Quantity Produced"
            rules={[{ required: true, message: "Please enter actual quantity" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCompleteModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Complete Production
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionOrders;
