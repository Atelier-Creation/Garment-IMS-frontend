import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, InputNumber, message, Tag, Space, Row, Col, Divider, DatePicker, Descriptions } from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined, EyeOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { billingService, customerService, productVariantService, branchService } from '../services';
import dayjs from 'dayjs';

const { Option } = Select;

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cart, setCart] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isWalkInCustomer, setIsWalkInCustomer] = useState(false);

  useEffect(() => {
    fetchBillings();
    fetchCustomers();
    fetchVariants();
    fetchBranches();
  }, []);

  const fetchBillings = async () => {
    setLoading(true);
    try {
      const response = await billingService.getBillings({
        page: pagination.current,
        limit: pagination.pageSize
      });
      
      // billingService returns response.data directly
      if (response && response.success) {
        const billingsData = response.data || [];
        setBillings(billingsData);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
      }
    } catch (error) {
      console.error('Fetch billings error:', error);
      message.error(error.response?.data?.message || 'Failed to load billings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers({ limit: 1000 });
      
      // customerService returns response.data directly
      if (response && response.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await productVariantService.getProductVariants({ limit: 1000 });
      
      if (response && response.success) {
        // The API returns: { success: true, data: { productVariants: [...] } }
        const variantsData = response.data.productVariants || [];
        setVariants(variantsData);
      }
    } catch (error) {
      console.error('Failed to fetch product variants:', error);
      message.error('Failed to load products');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchService.getBranches({ limit: 100 });
      
      if (response && response.success) {
        const branchesData = response.data.branches || [];
        setBranches(branchesData);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const handleAddToCart = () => {
    const values = form.getFieldsValue();
    if (!values.variant_id || !values.quantity) {
      message.warning('Please select product and quantity');
      return;
    }

    const variant = variants.find(v => v.id === values.variant_id);
    const existingIndex = cart.findIndex(item => item.variant_id === values.variant_id);

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].qty += parseFloat(values.quantity);
      newCart[existingIndex].total = newCart[existingIndex].qty * parseFloat(newCart[existingIndex].unit_price);
      setCart(newCart);
    } else {
      const newItem = {
        variant_id: values.variant_id,
        product_name: `${variant.Product?.product_name} - ${variant.size} - ${variant.color}`,
        sku: variant.sku,
        qty: parseFloat(values.quantity), // Ensure it's a float
        unit_price: parseFloat(variant.mrp), // Ensure it's a float
        total: parseFloat(values.quantity) * parseFloat(variant.mrp)
      };
      setCart([...cart, newItem]);
    }

    form.setFieldsValue({ variant_id: undefined, quantity: 1 });
    message.success('Added to cart');
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values) => {
    if (cart.length === 0) {
      message.warning('Please add at least one item to cart');
      return;
    }

    try {
      let customerId = values.customer_id;

      // If walk-in customer, create a temporary customer record
      if (isWalkInCustomer) {
        if (!values.customer_name || !values.customer_phone) {
          message.error('Please enter customer name and phone');
          return;
        }

        const customerData = {
          name: values.customer_name,
          contact_name: values.customer_name,
          phone: values.customer_phone,
          address: 'Walk-in Customer'
        };

        // Only add email if it's provided and not empty
        if (values.customer_email && values.customer_email.trim()) {
          customerData.email = values.customer_email.trim();
        }

        const customerResponse = await customerService.createCustomer(customerData);
        
        // customerService returns response.data directly
        if (customerResponse && customerResponse.success) {
          customerId = customerResponse.data.id;
          
          if (!customerId) {
            console.error('Customer ID is missing from response');
            message.error('Failed to get customer ID');
            return;
          }
        } else {
          console.error('Customer creation failed:', customerResponse);
          message.error('Failed to create customer record');
          return;
        }
      }

      // Find Central Warehouse branch or use first available branch
      const centralWarehouse = branches.find(b => b.name === 'Central Warehouse');
      const defaultBranch = centralWarehouse || branches[0];
      
      if (!defaultBranch) {
        message.error('No branches available. Please contact administrator.');
        return;
      }

      const data = {
        customer_id: customerId,
        branch_id: defaultBranch.id,
        order_date: values.order_date ? dayjs(values.order_date).toISOString() : new Date().toISOString(),
        payment_method: values.payment_method || 'cash',
        notes: values.notes,
        items: cart
      };

      const response = await billingService.createBilling(data);
      
      // billingService returns response.data directly
      if (response && response.success) {
        message.success('Billing created successfully');
        setIsModalVisible(false);
        form.resetFields();
        setCart([]);
        setIsWalkInCustomer(false);
        fetchBillings();
      } else {
        console.error('Unexpected response structure:', response);
        message.error('Failed to create billing - unexpected response');
      }
    } catch (error) {
      console.error('Bill creation error:', error);
      message.error(error.response?.data?.message || 'Failed to create billing');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PAID: 'green',
      DRAFT: 'orange',
      CONFIRMED: 'blue',
      CANCELLED: 'red'
    };
    return colors[status] || 'default';
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleViewBilling = (record) => {
    setSelectedBilling(record);
    setIsViewModalVisible(true);
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV data
      const headers = ['Order Number', 'Customer', 'Date', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment', 'Status'];
      const rows = billings.map(bill => [
        bill.order_number,
        bill.Customer?.name || 'N/A',
        dayjs(bill.order_date).format('DD/MM/YYYY HH:mm'),
        bill.SalesOrderItems?.length || 0,
        `₹${parseFloat(bill.subtotal_amount || 0).toFixed(2)}`,
        `₹${parseFloat(bill.tax_amount || 0).toFixed(2)}`,
        `₹${parseFloat(bill.total_amount || 0).toFixed(2)}`,
        bill.payment_terms?.toUpperCase() || 'CASH',
        bill.status
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `billings_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Billing data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  const handlePrintBill = (record) => {
    const printWindow = window.open('', '_blank');
    const items = record.SalesOrderItems || [];
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - ${record.order_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-section { margin-top: 20px; text-align: right; }
          .total-row { margin: 5px 0; }
          .grand-total { font-size: 18px; font-weight: bold; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Garment IMS</p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <strong>Bill No:</strong> ${record.order_number}
          </div>
          <div class="info-row">
            <strong>Date:</strong> ${dayjs(record.order_date).format('DD/MM/YYYY HH:mm')}
          </div>
          <div class="info-row">
            <strong>Customer:</strong> ${record.Customer?.name || 'N/A'}
          </div>
          <div class="info-row">
            <strong>Phone:</strong> ${record.Customer?.phone || 'N/A'}
          </div>
          <div class="info-row">
            <strong>Payment Method:</strong> ${record.payment_terms?.toUpperCase() || 'CASH'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.ProductVariant?.Product?.product_name || 'N/A'} - ${item.ProductVariant?.size} - ${item.ProductVariant?.color}</td>
                <td>${item.ProductVariant?.sku || 'N/A'}</td>
                <td>${item.qty}</td>
                <td>₹${parseFloat(item.unit_price).toFixed(2)}</td>
                <td>₹${parseFloat(item.total).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <strong>Subtotal:</strong> ₹${parseFloat(record.subtotal_amount || 0).toFixed(2)}
          </div>
          <div class="total-row">
            <strong>Tax (18%):</strong> ₹${parseFloat(record.tax_amount || 0).toFixed(2)}
          </div>
          <div class="total-row">
            <strong>Discount:</strong> ₹${parseFloat(record.discount_amount || 0).toFixed(2)}
          </div>
          <div class="total-row grand-total">
            <strong>Grand Total:</strong> ₹${parseFloat(record.total_amount || 0).toFixed(2)}
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center;">
          <p>Thank you for your business!</p>
          <button onclick="window.print()" style="padding: 10px 20px; background: #506ee4; color: white; border: none; cursor: pointer; border-radius: 4px;">Print</button>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'order_number',
      key: 'order_number'
    },
    {
      title: 'Customer',
      dataIndex: ['Customer', 'name'],
      key: 'customer'
    },
    {
      title: 'Date',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Items',
      dataIndex: 'SalesOrderItems',
      key: 'items',
      render: (items) => items?.length || 0
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`
    },
    {
      title: 'Payment',
      dataIndex: 'payment_terms',
      key: 'payment_terms',
      render: (method) => method?.toUpperCase() || 'CASH'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewBilling(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintBill(record)}
          >
            Print
          </Button>
        </Space>
      )
    }
  ];

  const cartColumns = [
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku'
    },
    {
      title: 'Quantity',
      dataIndex: 'qty',
      key: 'qty'
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `₹${parseFloat(price).toFixed(2)}`
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total) => `₹${parseFloat(total).toFixed(2)}`
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, __, index) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveFromCart(index)}
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
            <ShoppingCartOutlined style={{ fontSize: 20, color: '#666' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Billing / POS</h2>
            <p className="text-sm text-gray-600">Create and manage bills</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{ backgroundColor: '#506ee4' }}
          >
            New Bill
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
        </div>
        
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={billings}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} billings`
          }}
          onChange={(pag) => {
            setPagination(pag);
            fetchBillings();
          }}
        />
      </Card>

      <Modal
        title="Create New Bill"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setCart([]);
          setIsWalkInCustomer(false);
        }}
        footer={null}
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <span>Customer Type:</span>
              <Button
                type={!isWalkInCustomer ? 'primary' : 'default'}
                onClick={() => {
                  setIsWalkInCustomer(false);
                  form.setFieldsValue({ customer_name: undefined, customer_phone: undefined, customer_email: undefined });
                }}
                size="small"
              >
                Existing Customer
              </Button>
              <Button
                type={isWalkInCustomer ? 'primary' : 'default'}
                onClick={() => {
                  setIsWalkInCustomer(true);
                  form.setFieldsValue({ customer_id: undefined });
                }}
                size="small"
              >
                Walk-in Customer
              </Button>
            </Space>
          </div>

          {!isWalkInCustomer ? (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customer_id"
                  label="Select Customer"
                  rules={[{ required: true, message: 'Please select customer' }]}
                >
                  <Select 
                    placeholder="Select customer" 
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {customers.map((customer) => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="order_date"
                  label="Date"
                  initialValue={dayjs()}
                >
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="customer_name"
                    label="Customer Name"
                    rules={[{ required: true, message: 'Please enter customer name' }]}
                  >
                    <Input placeholder="Enter customer name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="customer_phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="customer_email"
                    label="Email (Optional)"
                  >
                    <Input placeholder="Enter email" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="order_date"
                    label="Date"
                    initialValue={dayjs()}
                  >
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payment_method"
                label="Payment Method"
                initialValue="cash"
              >
                <Select>
                  <Option value="cash">Cash</Option>
                  <Option value="card">Card</Option>
                  <Option value="upi">UPI</Option>
                  <Option value="netbanking">Net Banking</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={1} placeholder="Enter notes" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Add Items</Divider>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="variant_id" label="Product">
                <Select
                  placeholder={`Select product (${variants.length} available)`}
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
            </Col>
            <Col span={6}>
              <Form.Item name="quantity" label="Quantity" initialValue={1}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label=" ">
                <Button type="dashed" onClick={handleAddToCart} block>
                  Add to Cart
                </Button>
              </Form.Item>
            </Col>
          </Row>

          {cart.length > 0 && (
            <>
              <Table
                columns={cartColumns}
                dataSource={cart}
                rowKey={(_, index) => index}
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={4}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      <strong>₹{calculateTotal().toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                )}
              />
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Create Bill
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Billing Modal */}
      <Modal
        title={`Bill Details - ${selectedBilling?.order_number || ''}`}
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedBilling(null);
        }}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => handlePrintBill(selectedBilling)}>
            Print
          </Button>,
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedBilling && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Order Number" span={1}>
                {selectedBilling.order_number}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={1}>
                <Tag color={getStatusColor(selectedBilling.status)}>
                  {selectedBilling.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name" span={2}>
                {selectedBilling.Customer?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Contact Person" span={1}>
                {selectedBilling.Customer?.contact_name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone" span={1}>
                {selectedBilling.Customer?.phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {selectedBilling.Customer?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date" span={1}>
                {selectedBilling.order_date ? dayjs(selectedBilling.order_date).format('DD/MM/YYYY HH:mm') : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method" span={1}>
                {selectedBilling.payment_terms?.toUpperCase() || 'CASH'}
              </Descriptions.Item>
              <Descriptions.Item label="Branch" span={2}>
                {selectedBilling.Branch?.name || 'N/A'}
              </Descriptions.Item>
              {selectedBilling.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedBilling.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider>Items</Divider>

            <Table
              columns={[
                {
                  title: 'S.No',
                  key: 'sno',
                  render: (_, __, index) => index + 1,
                  width: 60
                },
                {
                  title: 'Product',
                  key: 'product',
                  render: (_, record) => (
                    <div>
                      <div>{record.ProductVariant?.Product?.product_name || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {record.ProductVariant?.size} - {record.ProductVariant?.color}
                      </div>
                    </div>
                  )
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
                  align: 'center'
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
              dataSource={selectedBilling.SalesOrderItems || []}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="right">
                      <strong>Subtotal:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong>₹{parseFloat(selectedBilling.subtotal_amount || 0).toFixed(2)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="right">
                      <strong>Tax (18%):</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong>₹{parseFloat(selectedBilling.tax_amount || 0).toFixed(2)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {parseFloat(selectedBilling.discount_amount || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={5} align="right">
                        <strong>Discount:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <strong style={{ color: 'red' }}>-₹{parseFloat(selectedBilling.discount_amount || 0).toFixed(2)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={5} align="right">
                      <strong style={{ fontSize: 16 }}>Grand Total:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <strong style={{ fontSize: 16, color: '#52c41a' }}>₹{parseFloat(selectedBilling.total_amount || 0).toFixed(2)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
