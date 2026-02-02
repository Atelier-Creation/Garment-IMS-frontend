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
  Popconfirm,
  Select,
  Row,
  Col,
  Tag,
  InputNumber,
  Tabs
} from 'antd';
import { SearchInput, HelpTooltip } from "../components";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { rawMaterialService, categoryService } from '../services';

const { Option } = Select;
const { TabPane } = Tabs;

const RawMaterials = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState(null);
  const [selectedRawMaterial, setSelectedRawMaterial] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRawMaterials();
    fetchCategories();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchRawMaterials = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined
      };
      
      const response = await rawMaterialService.getRawMaterials(params);
      if (response.success) {
        setRawMaterials(response.data.rawMaterials || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('Failed to fetch raw materials');
      console.error('Error fetching raw materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStockData = async (rawMaterialId) => {
    try {
      const response = await rawMaterialService.getRawMaterialStock(rawMaterialId);
      if (response.success) {
        setStockData(response.data);
      }
    } catch (error) {
      message.error('Failed to fetch stock data');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRawMaterial) {
        await rawMaterialService.updateRawMaterial(editingRawMaterial.id, values);
        message.success('Raw material updated successfully');
      } else {
        await rawMaterialService.createRawMaterial(values);
        message.success('Raw material created successfully');
      }
      setModalVisible(false);
      setEditingRawMaterial(null);
      form.resetFields();
      fetchRawMaterials();
    } catch (error) {
      message.error('Failed to save raw material');
      console.error('Error saving raw material:', error);
    }
  };

  const handleEdit = (rawMaterial) => {
    setEditingRawMaterial(rawMaterial);
    form.setFieldsValue({
      material_code: rawMaterial.material_code,
      name: rawMaterial.name,
      description: rawMaterial.description,
      uom: rawMaterial.uom,
      average_cost: rawMaterial.average_cost,
      is_active: rawMaterial.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await rawMaterialService.deleteRawMaterial(id);
      message.success('Raw material deleted successfully');
      fetchRawMaterials();
    } catch (error) {
      message.error('Failed to delete raw material');
      console.error('Error deleting raw material:', error);
    }
  };

  const handleViewStock = async (rawMaterial) => {
    setSelectedRawMaterial(rawMaterial);
    await fetchStockData(rawMaterial.id);
    setStockModalVisible(true);
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

  const columns = [
    {
      title: 'Material Code',
      dataIndex: 'material_code',
      key: 'material_code',
      render: (text) => <span className="font-mono text-sm">{text}</span>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: 'Unit',
      dataIndex: 'uom',
      key: 'uom',
      render: (uom) => <Tag color="blue">{uom}</Tag>
    },
    {
      title: 'Average Cost',
      dataIndex: 'average_cost',
      key: 'average_cost',
      render: (cost) => `₹${parseFloat(cost || 0).toFixed(2)}`,
    },
    {
      title: 'Total Stock',
      key: 'total_stock',
      render: (_, record) => {
        const totalStock = record.RawMaterialBatches?.reduce((sum, batch) => sum + parseFloat(batch.qty || 0), 0) || 0;
        return (
          <span className={totalStock <= 10 ? "text-red-600 font-medium" : ""}>
            {totalStock.toFixed(2)} {record.uom}
          </span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? 'ACTIVE' : 'INACTIVE'}
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
            onClick={() => handleViewStock(record)}
          >
            Stock
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this raw material?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const stockColumns = [
    {
      title: 'Branch',
      dataIndex: ['Branch', 'name'],
      key: 'branch',
      render: (_, record) => record.Branch?.name || 'N/A'
    },
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batchNumber'
    },
    {
      title: 'Current Quantity',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
      render: (qty, record) => `${qty} ${record.unit || ''}`
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Supplier',
      dataIndex: ['Supplier', 'name'],
      key: 'supplier',
      render: (_, record) => record.Supplier?.name || 'N/A'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Raw Materials
          <HelpTooltip 
            title="Raw Materials Management"
            content="Manage raw materials inventory including material details, categories, stock levels, and pricing. Create new materials, track stock movements, view stock history, and maintain material specifications for production and purchasing."
          />
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRawMaterial(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Raw Material
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <SearchInput
            placeholder="Search raw materials..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300, maxWidth: '100%' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={rawMaterials}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} raw materials`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingRawMaterial ? 'Edit Raw Material' : 'Add Raw Material'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRawMaterial(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="material_code"
                label="Material Code"
                rules={[{ required: true, message: 'Please enter material code' }]}
              >
                <Input placeholder="Enter material code (e.g., FAB001)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Material Name"
                rules={[{ required: true, message: 'Please enter material name' }]}
              >
                <Input placeholder="Enter material name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="uom"
                label="Unit of Measurement"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select placeholder="Select unit">
                  <Option value="METER">Meters</Option>
                  <Option value="PIECE">Pieces</Option>
                  <Option value="KG">Kilograms</Option>
                  <Option value="ROLL">Rolls</Option>
                  <Option value="YARD">Yards</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="average_cost"
                label="Average Cost per Unit"
                rules={[{ required: true, message: 'Please enter average cost' }]}
              >
                <InputNumber
                  placeholder="Enter average cost"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            initialValue={1}
          >
            <Select>
              <Option value={1}>Active</Option>
              <Option value={0}>Inactive</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingRawMaterial ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Stock Modal */}
      <Modal
        title={`Stock Details - ${selectedRawMaterial?.name}`}
        open={stockModalVisible}
        onCancel={() => {
          setStockModalVisible(false);
          setSelectedRawMaterial(null);
          setStockData(null);
        }}
        footer={null}
        width={800}
      >
        {stockData && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <Row gutter={16}>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stockData.totalStock || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Stock</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stockData.batches?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Batches</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ₹{selectedRawMaterial?.unitPrice?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">Unit Price</div>
                  </div>
                </Col>
              </Row>
            </div>

            <Table
              columns={stockColumns}
              dataSource={stockData.batches || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RawMaterials;