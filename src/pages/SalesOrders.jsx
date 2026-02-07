import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Table, Modal, Form, Select, InputNumber, Input, message, Tag, Space, DatePicker, Descriptions, Row, Col, Typography, Tooltip } from "antd";
import { EyeOutlined, PrinterOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { ShoppingCart, Plus, CheckCircle, Truck, XCircle } from "lucide-react";
import { salesOrderService, customerService, productService } from "../services";
import api from "../services/api";
import dayjs from "dayjs";
import { HelpTooltip } from "../components";
import { useLocation, useNavigate } from "react-router-dom";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingSalesOrder, setViewingSalesOrder] = useState(null);
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerForm] = Form.useForm();
  const printRef = useRef();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.createSale) {
      setIsModalVisible(true);
      form.resetFields();
      setSelectedItems([]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate, form]);

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
      const shipped_items = record.SalesOrderItems?.map(item => ({
        item_id: item.id,
        shipped_quantity: item.qty
      })) || [];

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

  const handleView = async (record) => {
    try {
      const response = await salesOrderService.getSalesOrderById(record.id);
      if (response.success) {
        setViewingSalesOrder(response.data.sales_order);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch sales order details');
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    windowPrint.document.write('<html><head><title>Sales Order</title>');
    windowPrint.document.write('<style>');
    windowPrint.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { margin: 0; color: #1890ff; }
      .info-section { margin-bottom: 20px; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
      .label { font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f0f0f0; }
      .total-row { font-weight: bold; background-color: #f9f9f9; }
      .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
    `);
    windowPrint.document.write('</style></head><body>');
    windowPrint.document.write(printContent.innerHTML);
    windowPrint.document.write('</body></html>');
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  };

  const handleExportPDF = () => {
    message.info('PDF export functionality requires additional library. Printing instead...');
    handlePrint();
  };

  const handleExportExcel = () => {
    if (!viewingSalesOrder) return;

    const so = viewingSalesOrder;
    let csvContent = "data:text/csv;charset=utf-8,";

    // Header
    csvContent += "Sales Order\n\n";
    csvContent += `Order Number:,${so.order_number}\n`;
    csvContent += `Customer:,${so.Customer?.name || 'N/A'}\n`;
    csvContent += `Order Date:,${dayjs(so.order_date).format('DD/MM/YYYY')}\n`;
    csvContent += `Delivery Date:,${so.delivery_date ? dayjs(so.delivery_date).format('DD/MM/YYYY') : 'N/A'}\n`;
    csvContent += `Status:,${so.status}\n\n`;

    // Items
    csvContent += "Item,Product,Quantity,Unit Price,Total\n";
    so.SalesOrderItems?.forEach((item, index) => {
      csvContent += `${index + 1},`;
      csvContent += `${item.ProductVariant?.Product?.product_name || 'N/A'} - ${item.ProductVariant?.size || ''} - ${item.ProductVariant?.color || ''},`;
      csvContent += `${item.qty},`;
      csvContent += `${item.unit_price},`;
      csvContent += `${item.total}\n`;
    });

    csvContent += `\nTotal Amount:,,,${so.total_amount}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SO_${so.order_number}_${dayjs().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('Sales order exported successfully');
  };

  const handleCreateCustomer = async (values) => {
    try {
      const response = await customerService.createCustomer(values);
      if (response.success) {
        message.success('Customer created successfully');
        setCustomerModalVisible(false);
        customerForm.resetFields();

        // Refresh customers list
        await fetchCustomers();

        // Auto-select the newly created customer
        if (response.data && response.data.customer) {
          form.setFieldsValue({ customer_id: response.data.customer.id });
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create customer');
      console.error('Error creating customer:', error);
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
      key: "order_number",
      render: (text, record) => (
        <Tooltip title="Click to view sales order details">
          <Button
            type="link"
            className="font-mono text-sm p-0 h-auto"
            onClick={() => handleView(record)}
            style={{
              textDecoration: 'underline',
              color: '#1890ff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {text}
          </Button>
        </Tooltip>
      )
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
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
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
            <h2 className="text-2xl font-bold text-gray-800">
              Sales Orders
              <HelpTooltip
                title="Sales Orders Management"
                content="Create and manage customer sales orders. Add customers directly from the form, select products with variants, track order status, and view detailed order information. Click order numbers to view complete order details with export options."
              />
            </h2>
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
            <div className="flex gap-2">
              <Select
                placeholder="Search customers by name, phone, or email..."
                showSearch
                style={{ flex: 1 }}
                filterOption={(input, option) => {
                  const customer = customers.find(c => c.id === option.value);
                  if (!customer) return false;

                  const searchText = input.toLowerCase();
                  const name = (customer.name || '').toLowerCase();
                  const phone = (customer.phone || '').toLowerCase();
                  const email = (customer.email || '').toLowerCase();
                  const address = (customer.address || '').toLowerCase();

                  return name.includes(searchText) ||
                    phone.includes(searchText) ||
                    email.includes(searchText) ||
                    address.includes(searchText);
                }}
                optionFilterProp="children"
                notFoundContent={
                  <div className="text-center py-2">
                    <div style={{ color: '#666', marginBottom: '8px' }}>No customers found</div>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setCustomerModalVisible(true)}
                    >
                      Create New Customer
                    </Button>
                  </div>
                }
              >
                {customers.map((customer) => (
                  <Option key={customer.id} value={customer.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{customer.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {customer.phone && `📞 ${customer.phone}`}
                        {customer.phone && customer.email && ' • '}
                        {customer.email && `✉️ ${customer.email}`}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
              <Button
                type="dashed"
                icon={<Plus size={16} />}
                onClick={() => setCustomerModalVisible(true)}
                title="Add new customer"
              >
                Add
              </Button>
            </div>
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

      {/* View Sales Order Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Sales Order Details
            </Title>
            {viewingSalesOrder && (
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Order Number: {viewingSalesOrder.order_number}
              </Text>
            )}
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={900}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>,
          <Button key="pdf" icon={<FilePdfOutlined />} onClick={handleExportPDF}>
            Export PDF
          </Button>,
          <Button key="excel" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
            Export Excel
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {viewingSalesOrder && (
          <div ref={printRef}>
            <div className="header" style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #1890ff', paddingBottom: '20px' }}>
              <h1 style={{ margin: 0, color: '#1890ff', fontSize: '28px' }}>SALES ORDER</h1>
              <p style={{ margin: '5px 0', fontSize: '16px', color: '#666' }}>
                Order Number: <strong>{viewingSalesOrder.order_number}</strong>
              </p>
            </div>

            <Row gutter={24} style={{ marginBottom: '30px' }}>
              <Col span={12}>
                <Card size="small" title="Customer Information" style={{ height: '100%' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">
                      <strong>{viewingSalesOrder.Customer?.name || 'N/A'}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {viewingSalesOrder.Customer?.email || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {viewingSalesOrder.Customer?.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Address">
                      {viewingSalesOrder.Customer?.address || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Order Information" style={{ height: '100%' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Order Date">
                      {dayjs(viewingSalesOrder.order_date).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Delivery Date">
                      {viewingSalesOrder.delivery_date ? dayjs(viewingSalesOrder.delivery_date).format('DD/MM/YYYY') : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(viewingSalesOrder.status)}>
                        {viewingSalesOrder.status?.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Branch">
                      {viewingSalesOrder.Branch?.name || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            {viewingSalesOrder.shipping_address && (
              <Card size="small" title="Shipping Address" style={{ marginBottom: '20px' }}>
                <p style={{ margin: 0 }}>{viewingSalesOrder.shipping_address}</p>
              </Card>
            )}

            <Card size="small" title="Order Items" style={{ marginBottom: '20px' }}>
              <Table
                dataSource={viewingSalesOrder.SalesOrderItems || []}
                pagination={false}
                size="small"
                rowKey="id"
                columns={[
                  {
                    title: '#',
                    key: 'index',
                    width: 50,
                    render: (_, __, index) => index + 1
                  },
                  {
                    title: 'Product',
                    key: 'product',
                    render: (_, record) => {
                      const product = record.ProductVariant?.Product;
                      const variant = record.ProductVariant;
                      return `${product?.product_name || 'N/A'} - ${variant?.size || ''} - ${variant?.color || ''}`;
                    }
                  },
                  {
                    title: 'SKU',
                    dataIndex: ['ProductVariant', 'sku'],
                    key: 'sku'
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'qty',
                    key: 'qty',
                    align: 'right',
                    render: (qty) => parseFloat(qty).toFixed(0)
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    align: 'right',
                    render: (price) => `₹${parseFloat(price).toFixed(2)}`
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total',
                    key: 'total',
                    align: 'right',
                    render: (total) => `₹${parseFloat(total).toFixed(2)}`
                  }
                ]}
                summary={() => {
                  const totalAmount = parseFloat(viewingSalesOrder.total_amount || 0);
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={5} align="right">
                          <strong>Total Amount:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <strong style={{ fontSize: '16px', color: '#1890ff' }}>
                            ₹{totalAmount.toFixed(2)}
                          </strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Card>

            {viewingSalesOrder.notes && (
              <Card size="small" title="Notes">
                <p style={{ margin: 0 }}>{viewingSalesOrder.notes}</p>
              </Card>
            )}

            <div className="footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
              <p style={{ margin: '5px 0' }}>This is a computer-generated document. No signature is required.</p>
              <p style={{ margin: '5px 0' }}>Generated on: {dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Creation Modal */}
      <Modal
        title="Add New Customer"
        open={customerModalVisible}
        onCancel={() => {
          setCustomerModalVisible(false);
          customerForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={customerForm}
          layout="vertical"
          onFinish={handleCreateCustomer}
        >
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[
              { required: true, message: 'Please enter customer name' },
              { min: 2, message: 'Customer name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit phone number' }
            ]}
          >
            <Input placeholder="Enter phone number" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input placeholder="Enter email address (optional)" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea placeholder="Enter customer address (optional)" rows={3} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setCustomerModalVisible(false);
              customerForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Customer
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesOrders;
