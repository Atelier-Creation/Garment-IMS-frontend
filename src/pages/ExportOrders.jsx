import React, { useState, useEffect } from "react";
import { Card, Button, Table, Modal, Form, Select, InputNumber, Input, message, Tag, Space } from "antd";
import { Globe, Plus } from "lucide-react";
import { exportOrderService, customerService, productVariantService } from "../services";

const { Option } = Select;
const { TextArea } = Input;

const ExportOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchVariants();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await exportOrderService.getExportOrders();
      if (response.success) {
        setOrders(response.data.exportOrders || []);
      }
    } catch (error) {
      message.error("Failed to load export orders");
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

  const fetchVariants = async () => {
    try {
      const response = await productVariantService.getProductVariants({ limit: 1000 });
      if (response.success) {
        setVariants(response.data.productVariants || []);
      }
    } catch (error) {
      console.error("Failed to fetch product variants:", error);
    }
  };

  const handleAddItem = () => {
    const values = form.getFieldsValue();
    if (!values.variant_id || !values.item_quantity || !values.item_unitPrice) {
      message.warning("Please fill in all item fields");
      return;
    }

    const variant = variants.find(v => v.id === values.variant_id);
    const newItem = {
      variant_id: values.variant_id,
      product_name: `${variant.Product?.product_name} - ${variant.size} - ${variant.color} (${variant.sku})`,
      qty: values.item_quantity,
      unit_price: values.item_unitPrice,
      total: values.item_quantity * values.item_unitPrice
    };

    setSelectedItems([...selectedItems, newItem]);
    form.setFieldsValue({
      variant_id: undefined,
      item_quantity: undefined,
      item_unitPrice: undefined
    });
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
        port_of_loading: values.port_of_loading,
        port_of_destination: values.port_of_destination,
        incoterms: values.incoterms,
        items: selectedItems
      };

      const response = await exportOrderService.createExportOrder(data);
      if (response.success) {
        message.success("Export order created successfully");
        setIsModalVisible(false);
        form.resetFields();
        setSelectedItems([]);
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to create export order");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const response = await exportOrderService.updateExportOrderStatus(id, status);
      if (response.success) {
        message.success("Status updated successfully");
        fetchOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "orange",
      BOOKED: "blue",
      SHIPPED: "purple",
      DELIVERED: "green",
      CANCELLED: "red"
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Export Number",
      dataIndex: "export_number",
      key: "export_number"
    },
    {
      title: "Customer",
      dataIndex: ["Customer", "name"],
      key: "customer"
    },
    {
      title: "Port of Loading",
      dataIndex: "port_of_loading",
      key: "port_of_loading"
    },
    {
      title: "Port of Destination",
      dataIndex: "port_of_destination",
      key: "port_of_destination"
    },
    {
      title: "Total Value",
      dataIndex: "total_value",
      key: "total_value",
      render: (value) => `₹${parseFloat(value || 0).toFixed(2)}`
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Select
          value={record.status}
          onChange={(value) => handleStatusChange(record.id, value)}
          size="small"
          style={{ width: 120 }}
        >
          <Option value="PENDING">Pending</Option>
          <Option value="BOOKED">Booked</Option>
          <Option value="SHIPPED">Shipped</Option>
          <Option value="DELIVERED">Delivered</Option>
          <Option value="CANCELLED">Cancelled</Option>
        </Select>
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
      dataIndex: "qty",
      key: "qty"
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
            <Globe size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Export Orders</h2>
            <p className="text-sm text-gray-600">Manage international orders</p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsModalVisible(true)}
          style={{ backgroundColor: "#506ee4" }}
        >
          New Export Order
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
        title="Create Export Order"
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

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="port_of_loading"
              label="Port of Loading"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., Mumbai Port" />
            </Form.Item>

            <Form.Item
              name="port_of_destination"
              label="Port of Destination"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g., New York Port" />
            </Form.Item>
          </div>

          <Form.Item name="incoterms" label="Incoterms">
            <Select placeholder="Select incoterms">
              <Option value="FOB">FOB - Free on Board</Option>
              <Option value="CIF">CIF - Cost, Insurance & Freight</Option>
              <Option value="EXW">EXW - Ex Works</Option>
              <Option value="DDP">DDP - Delivered Duty Paid</Option>
            </Select>
          </Form.Item>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-3">Add Items</h3>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <Form.Item name="variant_id" className="mb-0">
                <Select 
                  placeholder="Select product variant" 
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {variants.map((variant) => (
                    <Option key={variant.id} value={variant.id}>
                      {variant.Product?.product_name} - {variant.size} - {variant.color} ({variant.sku})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="item_quantity" className="mb-0">
                <InputNumber placeholder="Quantity" min={1} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name="item_unitPrice" className="mb-0">
                <InputNumber placeholder="Unit Price (₹)" min={0} style={{ width: "100%" }} />
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

          <div className="flex justify-end gap-2 mt-4">
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

export default ExportOrders;
