import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Select,
  Row,
  Col,
  Tag,
  DatePicker,
  InputNumber,
  Divider,
  Tabs,
  Alert,
  AutoComplete,
  Typography,
  notification,
  Descriptions,
  Dropdown,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { purchaseOrderService, supplierService, rawMaterialService } from '../services';
import api from '../services/api';
import moment from 'moment';
import { HelpTooltip } from '../components';
import { useLocation, useNavigate } from 'react-router-dom';

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [rawMaterialOptions, setRawMaterialOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [rawMaterialModalVisible, setRawMaterialModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [viewingPurchaseOrder, setViewingPurchaseOrder] = useState(null);
  const [cancellingPurchaseOrder, setCancellingPurchaseOrder] = useState(null);
  const printRef = useRef();

  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [receiveForm] = Form.useForm();
  const [rawMaterialForm] = Form.useForm();

  const [cancelForm] = Form.useForm();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.createOrder) {
      setEditingPurchaseOrder(null);
      form.resetFields();
      setModalVisible(true);
      // Clear the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, form]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchBranches();
    fetchRawMaterials();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined
      };

      const response = await purchaseOrderService.getPurchaseOrders(params);
      if (response.success) {
        setPurchaseOrders(response.data.purchase_orders || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('Failed to fetch purchase orders');
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getSuppliers({ limit: 100 });
      if (response.success) {
        setSuppliers(response.data.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchRawMaterials = async (searchValue = '') => {
    try {
      const params = {
        limit: 100,
        search: searchValue || undefined
      };
      const response = await rawMaterialService.getRawMaterials(params);
      if (response.success) {
        const materials = response.data.rawMaterials || [];
        setRawMaterials(materials);

        // Create options for AutoComplete
        const options = materials.map(material => ({
          value: material.id,
          label: `${material.name} (${material.material_code})`,
          material: material
        }));
        setRawMaterialOptions(options);
      }
    } catch (error) {
      console.error('Error fetching raw materials:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = {
        supplier_id: values.supplierId,
        branch_id: values.branchId,
        expected_delivery_date: values.expectedDeliveryDate?.format('YYYY-MM-DD'),
        notes: values.notes,
        items: values.items?.map(item => ({
          raw_material_id: item.rawMaterialId,
          qty: item.quantity,
          unit_price: item.unitPrice
        }))
      };

      let response;
      if (editingPurchaseOrder) {
        response = await purchaseOrderService.updatePurchaseOrder(editingPurchaseOrder.id, formData);
      } else {
        response = await purchaseOrderService.createPurchaseOrder(formData);
      }

      if (response.success) {
        notification.success({
          message: 'Success',
          description: editingPurchaseOrder
            ? 'Purchase order updated successfully'
            : 'Purchase order created successfully',
          placement: 'topRight',
          duration: 3
        });

        setModalVisible(false);
        setEditingPurchaseOrder(null);
        form.resetFields();
        fetchPurchaseOrders();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save purchase order';
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 4
      });
      console.error('Error saving purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await purchaseOrderService.approvePurchaseOrder(id);
      if (response.success) {
        notification.success({
          message: 'Success',
          description: 'Purchase order approved successfully',
          placement: 'topRight',
          duration: 3
        });
        fetchPurchaseOrders();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve purchase order';
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 4
      });
      console.error('Error approving purchase order:', error);
    }
  };

  const handleReceive = async (values) => {
    try {
      // Transform camelCase to snake_case for backend
      const transformedData = {
        received_items: values.items?.map(item => ({
          item_id: item.purchaseOrderItemId,
          received_quantity: parseFloat(item.receivedQuantity) || 0
        }))
      };

      const response = await purchaseOrderService.receivePurchaseOrder(selectedPurchaseOrder.id, transformedData);

      message.success('Purchase order received successfully');
      setReceiveModalVisible(false);
      setSelectedPurchaseOrder(null);
      receiveForm.resetFields();
      fetchPurchaseOrders();

      // If the view modal is open for the same order, refresh it
      if (viewingPurchaseOrder?.id === selectedPurchaseOrder.id) {
        const updatedResponse = await purchaseOrderService.getPurchaseOrderById(selectedPurchaseOrder.id);
        if (updatedResponse.success) {
          setViewingPurchaseOrder(updatedResponse.data.purchase_order);
        }
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      message.error('Failed to receive purchase order');
    }
  };

  const handleEdit = async (purchaseOrder) => {
    setEditingPurchaseOrder(purchaseOrder);

    // Ensure raw materials are loaded
    if (rawMaterials.length === 0) {
      await fetchRawMaterials();
    }

    // Set form values
    form.setFieldsValue({
      supplierId: purchaseOrder.supplier_id,
      branchId: purchaseOrder.branch_id,
      expectedDeliveryDate: purchaseOrder.expected_date ? moment(purchaseOrder.expected_date) : null,
      notes: purchaseOrder.notes,
      items: purchaseOrder.PurchaseOrderItems?.map(item => ({
        rawMaterialId: item.raw_material_id,
        quantity: parseFloat(item.qty),
        unitPrice: parseFloat(item.unit_price)
      })) || []
    });

    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await purchaseOrderService.deletePurchaseOrder(id);
      if (response.success) {
        notification.success({
          message: 'Success',
          description: 'Purchase order deleted successfully',
          placement: 'topRight',
          duration: 3
        });
        fetchPurchaseOrders();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete purchase order';
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 4
      });
      console.error('Error deleting purchase order:', error);
    }
  };

  const handleCancel = async (values) => {
    try {
      const response = await purchaseOrderService.cancelPurchaseOrder(
        cancellingPurchaseOrder.id,
        values.reason
      );
      if (response.success) {
        notification.success({
          message: 'Success',
          description: 'Purchase order cancelled successfully',
          placement: 'topRight',
          duration: 3
        });
        setCancelModalVisible(false);
        setCancellingPurchaseOrder(null);
        cancelForm.resetFields();
        fetchPurchaseOrders();
        // Close view modal if it's open for the same order
        if (viewingPurchaseOrder?.id === cancellingPurchaseOrder.id) {
          setViewModalVisible(false);
          setViewingPurchaseOrder(null);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel purchase order';
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 4
      });
      console.error('Error cancelling purchase order:', error);
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

  const handleRawMaterialSearch = (searchValue) => {
    fetchRawMaterials(searchValue);
  };

  const handleCreateRawMaterial = () => {
    setRawMaterialModalVisible(true);
    rawMaterialForm.resetFields();
  };

  const handleRawMaterialSubmit = async (values) => {
    try {
      const response = await rawMaterialService.createRawMaterial(values);
      if (response.success) {
        notification.success({
          message: 'Success',
          description: 'Raw material created successfully',
          placement: 'topRight',
          duration: 3
        });

        setRawMaterialModalVisible(false);
        rawMaterialForm.resetFields();

        // Refresh raw materials list
        await fetchRawMaterials();

        // Auto-select the newly created raw material in the current item
        if (currentItemIndex !== null && response.data) {
          const items = form.getFieldValue('items') || [];
          items[currentItemIndex] = {
            ...items[currentItemIndex],
            rawMaterialId: response.data.id,
            unitPrice: response.data.average_cost || 0
          };
          form.setFieldsValue({ items });
          setCurrentItemIndex(null);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create raw material';
      notification.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
        duration: 4
      });
      console.error('Error creating raw material:', error);
    }
  };

  const handleRawMaterialSelect = (value, option, itemIndex) => {
    // Get the selected raw material details
    const selectedMaterial = option.material;

    // Update the form field with raw material ID and auto-fill unit price
    const items = form.getFieldValue('items') || [];
    items[itemIndex] = {
      ...items[itemIndex],
      rawMaterialId: value,
      unitPrice: selectedMaterial?.average_cost || 0
    };
    form.setFieldsValue({ items });
  };

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'default',
      'PLACED': 'blue',
      'PARTIAL': 'orange',
      'RECEIVED': 'green',
      'CANCELLED': 'red'
    };
    return colors[status?.toUpperCase()] || 'default';
  };

  const hasReceivedItems = (purchaseOrder) => {
    return purchaseOrder?.PurchaseOrderItems?.some(item =>
      item.received_quantity && item.received_quantity > 0
    );
  };

  const handleView = async (record) => {
    try {
      const response = await purchaseOrderService.getPurchaseOrderById(record.id);
      if (response.success) {
        setViewingPurchaseOrder(response.data.purchase_order);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to fetch purchase order details');
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    windowPrint.document.write('<html><head><title>Purchase Order</title>');
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
    if (!viewingPurchaseOrder) return;

    const po = viewingPurchaseOrder;
    let csvContent = "data:text/csv;charset=utf-8,";

    // Header
    csvContent += "Purchase Order\n\n";
    csvContent += `PO Number:,${po.po_number}\n`;
    csvContent += `Supplier:,${po.Supplier?.name || 'N/A'}\n`;
    csvContent += `Order Date:,${moment(po.ordered_at).format('DD/MM/YYYY')}\n`;
    csvContent += `Expected Delivery:,${moment(po.expected_date).format('DD/MM/YYYY')}\n`;
    csvContent += `Status:,${po.status}\n\n`;

    // Items
    csvContent += "Item,Material Code,Quantity,Unit Price,Tax,Total\n";
    po.PurchaseOrderItems?.forEach((item, index) => {
      csvContent += `${index + 1},`;
      csvContent += `${item.RawMaterial?.name || 'N/A'},`;
      csvContent += `${item.RawMaterial?.material_code || 'N/A'},`;
      csvContent += `${item.qty},`;
      csvContent += `${item.unit_price},`;
      csvContent += `${item.tax || 0},`;
      csvContent += `${item.total}\n`;
    });

    csvContent += `\nTotal Amount:,,,,,${po.total_amount}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PO_${po.po_number}_${moment().format('YYYYMMDD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('Purchase order exported successfully');
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'po_number',
      key: 'po_number',
      render: (text, record) => (
        <Tooltip title="Click to view purchase order details">
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
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          {record.status?.toUpperCase() === 'DRAFT' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
              style={{ color: '#52c41a' }}
            >
              Approve
            </Button>
          )}
          {record.status?.toUpperCase() === 'PLACED' && (
            <Button
              type="link"
              icon={<InboxOutlined />}
              onClick={() => {
                setSelectedPurchaseOrder(record);
                setReceiveModalVisible(true);
              }}
              style={{ color: '#1890ff' }}
            >
              Receive
            </Button>
          )}
          {['DRAFT', 'PLACED'].includes(record.status?.toUpperCase()) && !hasReceivedItems(record) && (
            <Button
              type="link"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setCancellingPurchaseOrder(record);
                setCancelModalVisible(true);
              }}
            >
              Cancel
            </Button>
          )}
          {record.status?.toUpperCase() === 'DRAFT' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this purchase order?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Purchase Orders
          <HelpTooltip
            title="Purchase Orders Management"
            content="Create and manage purchase orders for raw materials from suppliers. Track order status from draft to received, view detailed order information, receive items with quantity tracking, and cancel orders when needed. Click order numbers to view full details."
          />
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingPurchaseOrder(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Create Purchase Order
        </Button>
      </div>

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
          dataSource={purchaseOrders}
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

      {/* Create/Edit Modal */}
      <Modal
        title={editingPurchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPurchaseOrder(null);
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
                name="supplierId"
                label="Supplier"
                rules={[{ required: true, message: 'Please select supplier' }]}
              >
                <Select placeholder="Select supplier">
                  {suppliers.map(supplier => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="branchId"
                label="Branch"
                rules={[{ required: true, message: 'Please select branch' }]}
              >
                <Select placeholder="Select branch">
                  {branches.map(branch => (
                    <Option key={branch.id} value={branch.id}>
                      {branch.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="expectedDeliveryDate"
                label="Expected Delivery Date"
                rules={[{ required: true, message: 'Please select expected delivery date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={2} placeholder="Enter any notes" />
          </Form.Item>

          <Divider>Items</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" className="mb-4"
                    title={`Item ${name + 1}`}
                    extra={
                      <Button
                        type="link"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      >
                        Remove
                      </Button>
                    }>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'rawMaterialId']}
                          label="Raw Material"
                          rules={[{ required: true, message: 'Select raw material' }]}
                        >
                          <div className="flex gap-2">
                            <Select
                              style={{ flex: 1 }}
                              showSearch
                              placeholder="Search and select raw material"
                              optionFilterProp="children"
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              options={rawMaterialOptions}
                              onSelect={(value) => {
                                const selectedMaterial = rawMaterials.find(m => m.id === value);
                                if (selectedMaterial) {
                                  const items = form.getFieldValue('items') || [];
                                  items[name] = {
                                    ...items[name],
                                    rawMaterialId: value,
                                    unitPrice: selectedMaterial.average_cost || 0
                                  };
                                  form.setFieldsValue({ items });
                                }
                              }}
                              onSearch={handleRawMaterialSearch}
                              notFoundContent={
                                <div className="text-center py-2">
                                  <Text type="secondary">No raw materials found</Text>
                                  <br />
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => {
                                      setCurrentItemIndex(name);
                                      handleCreateRawMaterial();
                                    }}
                                  >
                                    Create New Raw Material
                                  </Button>
                                </div>
                              }
                            />
                            <Button
                              type="dashed"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setCurrentItemIndex(name);
                                handleCreateRawMaterial();
                              }}
                              title="Create new raw material"
                            />
                          </div>
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Enter quantity' }]}
                        >
                          <InputNumber
                            placeholder="Quantity"
                            style={{ width: '100%' }}
                            min={0.01}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          label="Unit Price"
                          rules={[{ required: true, message: 'Enter unit price' }]}
                        >
                          <InputNumber
                            placeholder="Unit Price"
                            style={{ width: '100%' }}
                            min={0}
                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/₹\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPurchaseOrder ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Receive Modal */}
      <Modal
        title="Receive Purchase Order"
        open={receiveModalVisible}
        onCancel={() => {
          setReceiveModalVisible(false);
          setSelectedPurchaseOrder(null);
          receiveForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={receiveForm}
          layout="vertical"
          onFinish={handleReceive}
        >
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'purchaseOrderItemId']}
                        label="Item"
                        rules={[{ required: true, message: 'Select item' }]}
                      >
                        <Select placeholder="Select item">
                          {selectedPurchaseOrder?.PurchaseOrderItems?.map(item => (
                            <Option key={item.id} value={item.id}>
                              {item.RawMaterial?.name} - Ordered: {item.qty}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'receivedQuantity']}
                        label="Received Quantity"
                        rules={[{ required: true, message: 'Enter received quantity' }]}
                      >
                        <InputNumber
                          placeholder="Received Quantity"
                          style={{ width: '100%' }}
                          min={0}
                          step={1}
                          precision={2}
                          parser={value => value.replace(/[^\d.]/g, '')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button type="link" danger onClick={() => remove(name)}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Item
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setReceiveModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Receive Items
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Raw Material Creation Modal */}
      <Modal
        title="Create New Raw Material"
        open={rawMaterialModalVisible}
        onCancel={() => {
          setRawMaterialModalVisible(false);
          setCurrentItemIndex(null);
          rawMaterialForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="Quick Raw Material Creation"
          description="Create a new raw material that will be automatically selected in your purchase order item."
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={rawMaterialForm}
          layout="vertical"
          onFinish={handleRawMaterialSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Raw Material Name"
                rules={[{ required: true, message: 'Please enter raw material name' }]}
              >
                <Input placeholder="Enter raw material name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU (Optional)"
              >
                <Input placeholder="Auto-generated if empty" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit_of_measure"
                label="Unit of Measure"
                rules={[{ required: true, message: 'Please enter unit of measure' }]}
              >
                <Select placeholder="Select unit of measure">
                  <Option value="kg">Kilogram (kg)</Option>
                  <Option value="g">Gram (g)</Option>
                  <Option value="m">Meter (m)</Option>
                  <Option value="cm">Centimeter (cm)</Option>
                  <Option value="pcs">Pieces (pcs)</Option>
                  <Option value="yards">Yards</Option>
                  <Option value="liters">Liters</Option>
                  <Option value="rolls">Rolls</Option>
                  <Option value="boxes">Boxes</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_price"
                label="Unit Price (Optional)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  placeholder="Enter unit price"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <Input.TextArea rows={3} placeholder="Enter raw material description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reorder_level"
                label="Reorder Level (Optional)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Minimum stock level"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_stock_level"
                label="Max Stock Level (Optional)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Maximum stock level"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setRawMaterialModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Raw Material
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Purchase Order Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Purchase Order Details
            </Title>
            {viewingPurchaseOrder && (
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Order Number: {viewingPurchaseOrder.po_number}
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
          ...(viewingPurchaseOrder && ['DRAFT', 'PLACED'].includes(viewingPurchaseOrder.status?.toUpperCase()) && !hasReceivedItems(viewingPurchaseOrder) ? [
            <Button
              key="cancel"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => {
                setCancellingPurchaseOrder(viewingPurchaseOrder);
                setCancelModalVisible(true);
              }}
            >
              Cancel Order
            </Button>
          ] : []),
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {viewingPurchaseOrder && (
          <div ref={printRef}>
            <div className="header" style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #1890ff', paddingBottom: '20px' }}>
              <h1 style={{ margin: 0, color: '#1890ff', fontSize: '28px' }}>PURCHASE ORDER</h1>
              <p style={{ margin: '5px 0', fontSize: '16px', color: '#666' }}>
                PO Number: <strong>{viewingPurchaseOrder.po_number}</strong>
              </p>
            </div>

            <Row gutter={24} style={{ marginBottom: '30px' }}>
              <Col span={12}>
                <Card size="small" title="Supplier Information" style={{ height: '100%' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Name">
                      <strong>{viewingPurchaseOrder.Supplier?.name || 'N/A'}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Contact">
                      {viewingPurchaseOrder.Supplier?.contact_name || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {viewingPurchaseOrder.Supplier?.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {viewingPurchaseOrder.Supplier?.email || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Order Information" style={{ height: '100%' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Order Date">
                      {moment(viewingPurchaseOrder.ordered_at).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expected Delivery">
                      {moment(viewingPurchaseOrder.expected_date).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(viewingPurchaseOrder.status)}>
                        {viewingPurchaseOrder.status?.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created By">
                      {viewingPurchaseOrder.User?.full_name || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="Order Items" style={{ marginBottom: '20px' }}>
              <Table
                dataSource={viewingPurchaseOrder.PurchaseOrderItems || []}
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
                    title: 'Material Name',
                    dataIndex: ['RawMaterial', 'name'],
                    key: 'material_name'
                  },
                  {
                    title: 'Material Code',
                    dataIndex: ['RawMaterial', 'material_code'],
                    key: 'material_code'
                  },
                  {
                    title: 'UOM',
                    dataIndex: ['RawMaterial', 'uom'],
                    key: 'uom'
                  },
                  {
                    title: 'Ordered Qty',
                    dataIndex: 'qty',
                    key: 'qty',
                    align: 'right',
                    render: (qty) => parseFloat(qty).toFixed(2)
                  },
                  {
                    title: 'Received Qty',
                    dataIndex: 'received_quantity',
                    key: 'received_quantity',
                    align: 'right',
                    render: (receivedQty, record) => {
                      const received = parseFloat(receivedQty || 0);
                      const ordered = parseFloat(record.qty);
                      const isComplete = received >= ordered;
                      const isPartial = received > 0 && received < ordered;

                      return (
                        <span style={{
                          color: isComplete ? '#52c41a' : isPartial ? '#fa8c16' : '#666',
                          fontWeight: received > 0 ? 'bold' : 'normal'
                        }}>
                          {received.toFixed(2)}
                          {isComplete && ' ✓'}
                          {isPartial && ' ⚠'}
                        </span>
                      );
                    }
                  },
                  {
                    title: 'Pending Qty',
                    key: 'pending_qty',
                    align: 'right',
                    render: (_, record) => {
                      const ordered = parseFloat(record.qty);
                      const received = parseFloat(record.received_quantity || 0);
                      const pending = ordered - received;
                      return (
                        <span style={{
                          color: pending > 0 ? '#fa8c16' : '#52c41a',
                          fontWeight: pending > 0 ? 'bold' : 'normal'
                        }}>
                          {pending.toFixed(2)}
                        </span>
                      );
                    }
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unit_price',
                    key: 'unit_price',
                    align: 'right',
                    render: (price) => `₹${parseFloat(price).toFixed(2)}`
                  },
                  {
                    title: 'Tax',
                    dataIndex: 'tax',
                    key: 'tax',
                    align: 'right',
                    render: (tax) => `₹${parseFloat(tax || 0).toFixed(2)}`
                  },
                  {
                    title: 'Total',
                    key: 'total_received',
                    align: 'right',
                    render: (_, record) => {
                      const receivedQty = parseFloat(record.received_quantity || 0);
                      const unitPrice = parseFloat(record.unit_price || 0);
                      const tax = parseFloat(record.tax || 0);
                      const totalReceived = (receivedQty * unitPrice) + tax;
                      return `₹${totalReceived.toFixed(2)}`;
                    }
                  }
                ]}
                summary={(pageData) => {
                  // Calculate total amount based on received quantities
                  const totalReceivedAmount = viewingPurchaseOrder.PurchaseOrderItems?.reduce((sum, item) => {
                    const receivedQty = parseFloat(item.received_quantity || 0);
                    const unitPrice = parseFloat(item.unit_price || 0);
                    const tax = parseFloat(item.tax || 0);
                    return sum + (receivedQty * unitPrice) + tax;
                  }, 0) || 0;

                  // Calculate total ordered amount for comparison
                  const totalOrderedAmount = parseFloat(viewingPurchaseOrder.total_amount || 0);

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ backgroundColor: '#f5f5f5' }}>
                        <Table.Summary.Cell index={0} colSpan={9} align="right">
                          <span>Total Ordered Amount:</span>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <span style={{ fontSize: '14px', color: '#666' }}>
                            ₹{totalOrderedAmount.toFixed(2)}
                          </span>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                      <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={9} align="right">
                          <strong>Total Received Amount:</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <strong style={{ fontSize: '16px', color: '#1890ff' }}>
                            ₹{totalReceivedAmount.toFixed(2)}
                          </strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </Card>

            {viewingPurchaseOrder.notes && (
              <Card size="small" title="Notes">
                <p style={{ margin: 0 }}>{viewingPurchaseOrder.notes}</p>
              </Card>
            )}

            <div className="footer" style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
              <p style={{ margin: '5px 0' }}>This is a computer-generated document. No signature is required.</p>
              <p style={{ margin: '5px 0' }}>Generated on: {moment().format('DD/MM/YYYY HH:mm:ss')}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Purchase Order Modal */}
      <Modal
        title="Cancel Purchase Order"
        open={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancellingPurchaseOrder(null);
          cancelForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="Warning"
          description="Cancelling this purchase order will permanently change its status to CANCELLED. This action cannot be undone."
          type="warning"
          showIcon
          className="mb-4"
        />

        {cancellingPurchaseOrder && (
          <div className="mb-4">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Order Number">
                <strong>{cancellingPurchaseOrder.po_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {cancellingPurchaseOrder.Supplier?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                ₹{parseFloat(cancellingPurchaseOrder.total_amount || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(cancellingPurchaseOrder.status)}>
                  {cancellingPurchaseOrder.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={handleCancel}
        >
          <Form.Item
            name="reason"
            label="Cancellation Reason"
            rules={[
              { required: true, message: 'Please provide a reason for cancellation' },
              { min: 10, message: 'Reason must be at least 10 characters long' }
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Please provide a detailed reason for cancelling this purchase order..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setCancelModalVisible(false);
              setCancellingPurchaseOrder(null);
              cancelForm.resetFields();
            }}>
              Keep Order
            </Button>
            <Button type="primary" danger htmlType="submit">
              Cancel Order
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default PurchaseOrders;