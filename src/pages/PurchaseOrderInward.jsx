import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Row,
  Col,
  Tag,
  DatePicker,
  InputNumber,
  Divider,
  Tabs,
  Select,
  Alert,
  Descriptions,
  Typography,
  Badge
} from 'antd';
import {
  InboxOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  HistoryOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { purchaseOrderInwardService } from '../services';
import moment from 'moment';
import { HelpTooltip } from '../components';

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

const PurchaseOrderInward = () => {
  const [inwardOrders, setInwardOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [inwardHistory, setInwardHistory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [inwardModalVisible, setInwardModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [inwardForm] = Form.useForm();

  useEffect(() => {
    fetchInwardReadyOrders();
    fetchSummary();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchInwardReadyOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined
      };

      const response = await purchaseOrderInwardService.getInwardReadyOrders(params);
      if (response.success) {
        setInwardOrders(response.data.purchase_orders || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('Failed to fetch purchase orders for inward');
      console.error('Error fetching inward orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await purchaseOrderInwardService.getInwardSummary();
      if (response.success) {
        setSummary(response.data.summary || {});
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleViewOrder = async (order) => {
    try {
      const response = await purchaseOrderInwardService.getOrderForInward(order.id);
      if (response.success) {
        setSelectedOrder(response.data.purchase_order);

        // Pre-populate form with order items
        const initialItems = response.data.purchase_order.PurchaseOrderItems
          .filter(item => item.pending_quantity > 0)
          .map(item => ({
            item_id: item.id,
            raw_material_name: item.RawMaterial?.name,
            pending_quantity: item.pending_quantity,
            received_quantity: item.pending_quantity, // Default to full pending
            batch_number: item.suggested_batch_number,
            quality_status: 'approved'
          }));

        inwardForm.setFieldsValue({
          received_date: moment(),
          received_items: initialItems
        });

        setInwardModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch order details');
      console.error('Error fetching order:', error);
    }
  };

  const handleProcessInward = async (values) => {
    try {
      const formData = {
        ...values,
        received_date: values.received_date?.format('YYYY-MM-DD HH:mm:ss'),
        invoice_date: values.invoice_date?.format('YYYY-MM-DD'),
        received_items: values.received_items?.map(item => ({
          item_id: item.item_id,
          received_quantity: item.received_quantity,
          batch_number: item.batch_number,
          manufacturing_date: item.manufacturing_date?.format('YYYY-MM-DD'),
          expiry_date: item.expiry_date?.format('YYYY-MM-DD'),
          quality_status: item.quality_status || 'approved',
          unit_cost: item.unit_cost,
          item_notes: item.item_notes
        }))
      };

      const response = await purchaseOrderInwardService.processInward(selectedOrder.id, formData);

      if (response.success) {
        message.success(response.message || 'Purchase order inward processed successfully');
        setInwardModalVisible(false);
        setSelectedOrder(null);
        inwardForm.resetFields();
        fetchInwardReadyOrders();
        fetchSummary();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to process inward';
      message.error(errorMessage);
      console.error('Error processing inward:', error);
    }
  };

  const handleViewHistory = async (order) => {
    try {
      const response = await purchaseOrderInwardService.getInwardHistory(order.id);
      if (response.success) {
        setInwardHistory(response.data);
        setHistoryModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch inward history');
      console.error('Error fetching history:', error);
    }
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    }));
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'approved': 'blue',
      'partial': 'orange',
      'received': 'green'
    };
    return colors[status] || 'default';
  };

  const getQualityStatusColor = (status) => {
    const colors = {
      'approved': 'green',
      'rejected': 'red',
      'pending': 'orange'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'po_number',
      key: 'po_number',
      render: (text) => <span className="font-mono text-sm">{text}</span>
    },
    {
      title: 'Supplier',
      dataIndex: ['Supplier', 'name'],
      key: 'supplier',
      render: (_, record) => record.Supplier?.name || 'N/A'
    },
    {
      title: 'Order Date',
      dataIndex: 'ordered_at',
      key: 'ordered_at',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expected_date',
      key: 'expected_date',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`
    },
    {
      title: 'Pending Items',
      dataIndex: 'total_pending_items',
      key: 'total_pending_items',
      render: (count) => (
        <Badge count={count} showZero color={count > 0 ? 'orange' : 'green'} />
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
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
            icon={<InboxOutlined />}
            onClick={() => handleViewOrder(record)}
            disabled={record.is_fully_received}
          >
            Process Inward
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            History
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="text-gray-800 mb-0">
          Purchase Order Inward
          <HelpTooltip
            title="Purchase Order Inward"
            content="Process incoming purchase orders by recording received quantities, updating stock levels, and managing inward transactions. Track delivery status, verify quantities, and maintain accurate inventory records for received materials."
          />
        </Title>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.pending_orders || 0}</div>
              <div className="text-gray-600">Pending Orders</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.completed_orders || 0}</div>
              <div className="text-gray-600">Completed Orders</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₹{parseFloat(summary.total_value_received || 0).toFixed(2)}</div>
              <div className="text-gray-600">Total Value Received</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{parseFloat(summary.total_quantity_received || 0).toFixed(2)}</div>
              <div className="text-gray-600">Total Quantity Received</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-4">
          <Input.Search
            placeholder="Search purchase orders..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={inwardOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} purchase orders`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Process Inward Modal */}
      <Modal
        title={`Process Inward - ${selectedOrder?.po_number}`}
        open={inwardModalVisible}
        onCancel={() => {
          setInwardModalVisible(false);
          setSelectedOrder(null);
          inwardForm.resetFields();
        }}
        footer={null}
        width={1000}
      >
        {selectedOrder && (
          <>
            <Alert
              message="Purchase Order Information"
              description={
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="Supplier">{selectedOrder.Supplier?.name}</Descriptions.Item>
                  <Descriptions.Item label="Order Date">{moment(selectedOrder.ordered_at).format('DD/MM/YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Expected Delivery">{moment(selectedOrder.expected_date).format('DD/MM/YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Total Amount">₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</Descriptions.Item>
                </Descriptions>
              }
              type="info"
              showIcon
              className="mb-4"
            />

            <Form
              form={inwardForm}
              layout="vertical"
              onFinish={handleProcessInward}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="received_date"
                    label="Received Date"
                    rules={[{ required: true, message: 'Please select received date' }]}
                  >
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY HH:mm"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="invoice_number"
                    label="Invoice Number"
                  >
                    <Input placeholder="Enter invoice number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="invoice_date"
                    label="Invoice Date"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="transport_details"
                    label="Transport Details"
                  >
                    <Input.TextArea rows={2} placeholder="Enter transport details" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="quality_check_notes"
                    label="Quality Check Notes"
                  >
                    <Input.TextArea rows={2} placeholder="Enter quality check notes" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider>Received Items</Divider>

              <Form.List name="received_items">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" className="mb-4">
                        <Row gutter={16}>
                          <Col span={24}>
                            <Text strong>
                              {inwardForm.getFieldValue(['received_items', name, 'raw_material_name'])}
                            </Text>
                            <Text type="secondary" className="ml-2">
                              (Pending: {inwardForm.getFieldValue(['received_items', name, 'pending_quantity'])})
                            </Text>
                          </Col>
                        </Row>

                        <Row gutter={16} className="mt-2">
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'received_quantity']}
                              label="Received Quantity"
                              rules={[{ required: true, message: 'Enter received quantity' }]}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                min={0.01}
                                max={inwardForm.getFieldValue(['received_items', name, 'pending_quantity'])}
                                placeholder="Received Qty"
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'batch_number']}
                              label="Batch Number"
                              rules={[{ required: true, message: 'Enter batch number' }]}
                            >
                              <Input placeholder="Batch number" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'quality_status']}
                              label="Quality Status"
                            >
                              <Select>
                                <Option value="approved">Approved</Option>
                                <Option value="rejected">Rejected</Option>
                                <Option value="pending">Pending</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'unit_cost']}
                              label="Unit Cost"
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                placeholder="Unit cost"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'manufacturing_date']}
                              label="Manufacturing Date"
                            >
                              <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'expiry_date']}
                              label="Expiry Date"
                            >
                              <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              name={[name, 'item_notes']}
                              label="Notes"
                            >
                              <Input placeholder="Item notes" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item {...restField} name={[name, 'item_id']} hidden>
                          <Input />
                        </Form.Item>
                      </Card>
                    ))}
                  </>
                )}
              </Form.List>

              <Form.Item
                name="notes"
                label="General Notes"
              >
                <Input.TextArea rows={3} placeholder="Enter any general notes" />
              </Form.Item>

              <div className="flex justify-end gap-2">
                <Button onClick={() => setInwardModalVisible(false)}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Process Inward
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        title="Inward History"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {inwardHistory.batches_created && (
          <div>
            <Title level={4}>Batches Created ({inwardHistory.total_batches})</Title>
            <Table
              dataSource={inwardHistory.batches_created}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Batch Number',
                  dataIndex: 'batch_number',
                  key: 'batch_number'
                },
                {
                  title: 'Raw Material',
                  dataIndex: ['RawMaterial', 'name'],
                  key: 'raw_material'
                },
                {
                  title: 'Quantity',
                  dataIndex: 'received_quantity',
                  key: 'quantity'
                },
                {
                  title: 'Quality Status',
                  dataIndex: 'quality_status',
                  key: 'quality_status',
                  render: (status) => (
                    <Tag color={getQualityStatusColor(status)}>
                      {status?.toUpperCase()}
                    </Tag>
                  )
                },
                {
                  title: 'Received Date',
                  dataIndex: 'received_at',
                  key: 'received_at',
                  render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
                }
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrderInward;