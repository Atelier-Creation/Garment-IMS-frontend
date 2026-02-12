import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Space,
  Tooltip,
  Tag,
  Row,
  Col,
  Steps
} from "antd";
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCcw,
  Eye,
  MapPin,
  Package
} from "lucide-react";
import { shipmentService, salesOrderService, customerService } from "../services";
import dayjs from "dayjs";
import { HelpTooltip } from "../components";

const { Option } = Select;
const { Search: AntSearch } = Input;
const { TextArea } = Input;
const { Step } = Steps;

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [viewingShipment, setViewingShipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Dropdown data
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [form] = Form.useForm();

  // Fetch shipments
  const fetchShipments = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };

      const response = await shipmentService.getShipments(params);
      if (response.success) {
        setShipments(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
      message.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [salesOrdersRes, customersRes] = await Promise.all([
        salesOrderService.getSalesOrders({ limit: 1000 }),
        customerService.getCustomers({ limit: 1000 })
      ]);

      if (salesOrdersRes.success) {
        setSalesOrders(salesOrdersRes.data.data || []);
      }
      if (customersRes.success) {
        setCustomers(customersRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchDropdownData();
  }, [fetchShipments]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchShipments(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchShipments(paginationInfo.current, searchTerm);
  };

  // Handle create/update shipment
  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        shipment_date: values.shipment_date?.format('YYYY-MM-DD'),
        expected_delivery_date: values.expected_delivery_date?.format('YYYY-MM-DD'),
        actual_delivery_date: values.actual_delivery_date?.format('YYYY-MM-DD'),
      };

      let response;
      if (editingShipment) {
        response = await shipmentService.updateShipment(editingShipment.id, formattedValues);
      } else {
        response = await shipmentService.createShipment(formattedValues);
      }

      if (response.success) {
        message.success(`Shipment ${editingShipment ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        form.resetFields();
        setEditingShipment(null);
        fetchShipments(pagination.current, searchTerm);
      }
    } catch (error) {
      console.error("Failed to save shipment:", error);
      message.error(`Failed to ${editingShipment ? 'update' : 'create'} shipment`);
    }
  };

  // Handle delete shipment
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this shipment?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await shipmentService.deleteShipment(id);
          if (response.success) {
            message.success("Shipment deleted successfully");
            fetchShipments(pagination.current, searchTerm);
          }
        } catch (error) {
          console.error("Failed to delete shipment:", error);
          message.error("Failed to delete shipment");
        }
      },
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: "orange",
      shipped: "blue",
      in_transit: "purple",
      delivered: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  // Get shipment status step
  const getStatusStep = (status) => {
    const steps = {
      pending: 0,
      shipped: 1,
      in_transit: 2,
      delivered: 3,
      cancelled: -1,
    };
    return steps[status] || 0;
  };

  const columns = [
    {
      title: "Shipment Number",
      dataIndex: "shipment_number",
      key: "shipment_number",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.tracking_number}</div>
        </div>
      ),
    },
    {
      title: "Sales Order",
      dataIndex: "sales_order",
      key: "sales_order",
      render: (order) => order?.order_number || "N/A",
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer) => customer?.customer_name || "N/A",
    },
    {
      title: "Carrier",
      dataIndex: "carrier_name",
      key: "carrier_name",
    },
    {
      title: "Shipment Date",
      dataIndex: "shipment_date",
      key: "shipment_date",
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : "-",
    },
    {
      title: "Expected Delivery",
      dataIndex: "expected_delivery_date",
      key: "expected_delivery_date",
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
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
                setViewingShipment(record);
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
                setEditingShipment(record);
                form.setFieldsValue({
                  ...record,
                  shipment_date: record.shipment_date ? dayjs(record.shipment_date) : null,
                  expected_delivery_date: record.expected_delivery_date ? dayjs(record.expected_delivery_date) : null,
                  actual_delivery_date: record.actual_delivery_date ? dayjs(record.actual_delivery_date) : null,
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
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <Truck size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Shipments
              <HelpTooltip
                title="Shipments Management"
                content="Track and manage order shipments including shipping details, tracking numbers, delivery status, and logistics coordination. Monitor shipment progress, update delivery information, and manage shipping workflows."
              />
            </h2>
            <p className="text-sm text-gray-600">Track and manage order shipments</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingShipment(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            style={{ backgroundColor: "#506ee4" }}
          >
            New Shipment
          </Button>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchShipments(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <AntSearch
          placeholder="Search shipments by number, tracking, or customer..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch("")}
          style={{ width: 400 }}
        />
      </Card>

      {/* Shipments Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={shipments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} shipments`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Shipment Modal */}
      <Modal
        title={editingShipment ? "Edit Shipment" : "New Shipment"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingShipment(null);
          form.resetFields();
        }}
        footer={null}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shipment_number"
                label="Shipment Number"
                rules={[{ required: true, message: "Please enter shipment number" }]}
              >
                <Input placeholder="Enter shipment number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tracking_number"
                label="Tracking Number"
              >
                <Input placeholder="Enter tracking number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sales_order_id"
                label="Sales Order"
                rules={[{ required: true, message: "Please select sales order" }]}
              >
                <Select
                  placeholder="Select sales order"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {salesOrders.map(order => (
                    <Option key={order.id} value={order.id}>
                      {order.order_number} - {order.customer?.customer_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="shipment_date"
                label="Shipment Date"
                rules={[{ required: true, message: "Please select shipment date" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="carrier_name"
                label="Carrier Name"
                rules={[{ required: true, message: "Please enter carrier name" }]}
              >
                <Input placeholder="Enter carrier name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="carrier_contact"
                label="Carrier Contact"
              >
                <Input placeholder="Enter carrier contact" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="expected_delivery_date"
                label="Expected Delivery"
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="actual_delivery_date"
                label="Actual Delivery"
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select status">
                  <Option value="pending">Pending</Option>
                  <Option value="shipped">Shipped</Option>
                  <Option value="in_transit">In Transit</Option>
                  <Option value="delivered">Delivered</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="shipping_address"
            label="Shipping Address"
          >
            <TextArea
              rows={3}
              placeholder="Enter shipping address"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              rows={2}
              placeholder="Enter additional notes"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingShipment ? "Update" : "Create"} Shipment
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Shipment Modal */}
      <Modal
        title="Shipment Details"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingShipment(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {viewingShipment && (
          <div className="space-y-6">
            {/* Shipment Status */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Shipment Progress</h4>
              <Steps
                current={getStatusStep(viewingShipment.status)}
                status={viewingShipment.status === 'cancelled' ? 'error' : 'process'}
              >
                <Step title="Pending" description="Order prepared" />
                <Step title="Shipped" description="Package dispatched" />
                <Step title="In Transit" description="On the way" />
                <Step title="Delivered" description="Package delivered" />
              </Steps>
            </div>

            {/* Shipment Info */}
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Shipment Number</label>
                  <div className="text-lg font-semibold">{viewingShipment.shipment_number}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tracking Number</label>
                  <div className="font-medium">{viewingShipment.tracking_number || "N/A"}</div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sales Order</label>
                  <div>{viewingShipment.sales_order?.order_number || "N/A"}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer</label>
                  <div>{viewingShipment.customer?.customer_name || "N/A"}</div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Carrier</label>
                  <div>{viewingShipment.carrier_name}</div>
                  <div className="text-sm text-gray-500">{viewingShipment.carrier_contact}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div>
                    <Tag color={getStatusColor(viewingShipment.status)}>
                      {viewingShipment.status?.replace('_', ' ').toUpperCase()}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Shipment Date</label>
                  <div>{viewingShipment.shipment_date ? dayjs(viewingShipment.shipment_date).format('DD/MM/YYYY') : "N/A"}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Expected Delivery</label>
                  <div>{viewingShipment.expected_delivery_date ? dayjs(viewingShipment.expected_delivery_date).format('DD/MM/YYYY') : "N/A"}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Actual Delivery</label>
                  <div>{viewingShipment.actual_delivery_date ? dayjs(viewingShipment.actual_delivery_date).format('DD/MM/YYYY') : "N/A"}</div>
                </div>
              </Col>
            </Row>

            {viewingShipment.shipping_address && (
              <div>
                <label className="text-sm font-medium text-gray-600">Shipping Address</label>
                <div className="mt-1 p-3 bg-gray-50 rounded">{viewingShipment.shipping_address}</div>
              </div>
            )}

            {viewingShipment.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <div className="mt-1 p-3 bg-gray-50 rounded">{viewingShipment.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Shipments;