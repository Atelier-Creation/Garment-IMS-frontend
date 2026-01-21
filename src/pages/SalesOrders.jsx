import React, { useState, useEffect } from "react";
import { Card, Button, Table, Modal, Form, Select, InputNumber, Input, message, Tag, Space, DatePicker } from "antd";
import { ShoppingCart, Plus, CheckCircle, Truck, XCircle } from "lucide-react";
import { salesOrderService, customerService, productService } from "../services";
import api from "../services/api";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
    fetchBranches();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await salesOrderService.getSalesOrders();
      if (response.success) {
        setOrders(response.data.sales_orders || []);
      }
    } catch (error) {
      message.error("Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers({ limit: 1000 });
      if (response.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/product-variants", { params: { limit: 1000 } });
      console.log("Product variants response:", response.data);
      if (response.data.success) {
        const variants = response.data.data.productVariants || [];
        console.log("Product variants:", variants);
        setProducts(variants);
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

  const handleAddItem = () => {
    const values = form.getFieldsValue();
    if (!values.variant_id || !values.item_quantity || !values.item_unit_price) {
      message.warning("Please fill in all item fields");
      return;
    }

    const product = products.find(p => p.id === values.variant_id);
    const newItem = {
      variant_id: values.variant_id,
      product_name: `${product.Product?.product_name} - ${product.size} - ${product.color}`,
      sku: product.sku,
      quantity: values.item_quantity,
      unit_price: values.item_unit_price,
      total: values.item_quantity * values.item_unit_price
    };

    setSelectedItems([...selectedItems, newItem]);
    form.setFieldsValue({
      variant_id: undefined,
      item_quantity: undefined,
      item_unit_price: undefined
    });
    message.success("Item added to order");
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values) => {
    if (selectedItems.length === 0) {
      message.warning("Please add at least one item");
      return;
    }

    try {
      const data = {
        customer_id: values.customer_id,
        branch_id: values.branch_id,
        order_date: values.order_date?.format("YYYY-MM-DD"),
        delivery_date: values.delivery_date?.format("YYYY-MM-DD"),
        shipping_address: values.shipping_address,
        notes: values.notes,
        items: selectedItems.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const response = await salesOrderService.createSalesOrder(data);
      if (response.success) {
        message.success("Sales order created successfully");
        setIsModalVisible(false);
        form.resetFields();
        setSelectedItems([]);
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create sales order");
    }
  };

  const handleConfirm = async (id) => {
    try {
      const response = await salesOrderService.confirmSalesOrder(id, {});
      if (response.success) {
        message.success("Sales order confirmed");
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to confirm order");
    }
  };

  const handleProcess = async (record) => {
    try {
      const shipped_items = record.SalesOrderItems.map(item => ({
        item_id: item.id,
        shipped_quantity: item.qty
      }));

      const response = await salesOrderService.processSalesOrder(record.id, {
        shipped_items,
        shipping_date: new Date().toISOString()
      });
      
      if (response.success) {
        message.success("Sales order processed");
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to process order");
    }
  };

  const handleComplete = async (id) => {
    try {
      const response = await salesOrderService.completeSalesOrder(id, {
        delivery_date: new Date().toISOString()
      });
      if (response.success) {
        message.success("Sales order completed");
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to complete order");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: "orange",
      CONFIRMED: "blue",
      PAID: "green",
      CANCELLED: "red",
      RETURNED: "purple"
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Order Number",
      dataIndex: "order_number",
      key: "order_number"
    },
    {
      title: "Customer",
      dataIndex: ["Customer", "name"],
      key: "customer"
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`
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
      title: "Order Date",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-"
    },
    {
      title: "Delivery Date",
      dataIndex: "delivery_date",
      key: "delivery_date",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-"
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status === "DRAFT" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircle size={14} />}
              onClick={() => handleConfirm(record.id)}
            >
              Confirm
            </Button>
          )}
          {record.status === "CONFIRMED" && (
            <Button
              type="primary"
              size="small"
              icon={<Truck size={14} />}
              onClick={() => handleProcess(record)}
            >
              Process
            </Button>
          )}
          {record.status === "PAID" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircle size={14} />}
              onClick={() => handleComplete(record.id)}
              style={{ backgroundColor: "#52c41a" }}
            >
              Complete
            </Button>
          )}
        </Space>
      )
    }
  ];

  const itemColumns = [
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name"
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (price) => `₹${parseFloat(price).toFixed(2)}`
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `₹${parseFloat(total).toFixed(2)}`
    },
    {
      title: "Action",
      key: "action",
      render: (_, __, index) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => handleRemoveItem(index)}
        >
          Remove
        </Button>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <ShoppingCart size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sales Orders</h2>
            <p className="text-sm text-gray-600">Manage customer orders</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsModalVisible(true)}
          style={{ backgroundColor: "#506ee4" }}
        >
          New Sales Order
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Create Sales Order"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedItems([]);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="customer_id"
            label="Customer"
            rules={[{ required: true, message: "Please select customer" }]}
          >
            <Select placeholder="Select customer" showSearch>
              {customers.map((customer) => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name}
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

          <Form.Item name="order_date" label="Order Date">
            <DatePicker style={{ width: "100%" }} defaultValue={dayjs()} />
          </Form.Item>

          <Form.Item name="delivery_date" label="Delivery Date">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="shipping_address" label="Shipping Address">
            <TextArea rows={2} />
          </Form.Item>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-3">Add Items</h3>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <Form.Item name="variant_id" className="mb-0">
                <Select 
                  placeholder="Select product" 
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.Product?.product_name} - {product.size} - {product.color} ({product.sku})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="item_quantity" className="mb-0">
                <InputNumber placeholder="Quantity" min={1} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="item_unit_price" className="mb-0">
                <InputNumber placeholder="Unit Price" min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Button type="dashed" onClick={handleAddItem}>
                Add Item
              </Button>
            </div>

            {selectedItems.length > 0 && (
              <Table
                columns={itemColumns}
                dataSource={selectedItems}
                rowKey={(_, index) => index}
                pagination={false}
                size="small"
                className="mt-3"
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={3}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <strong>
                        ₹{selectedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                )}
              />
            )}
          </div>

          <Form.Item name="notes" label="Notes" className="mt-4">
            <TextArea rows={2} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Create Order
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesOrders;
