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
  Divider
} from "antd";
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCcw, 
  Eye,
  Calculator
} from "lucide-react";
import { bomService, productService, rawMaterialService } from "../services";

const { Option } = Select;
import { SearchInput } from "../components";

const BOM = () => {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [viewingBom, setViewingBom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Dropdown data
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);

  // BOM Items state
  const [bomItems, setBomItems] = useState([]);

  const [form] = Form.useForm();

  // Fetch BOMs
  const fetchBoms = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };
      
      const response = await bomService.getBOMs(params);
      if (response.success) {
        setBoms(response.data.boms || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination?.totalItems || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch BOMs:", error);
      message.error("Failed to load BOMs");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [productsRes, rawMaterialsRes] = await Promise.all([
        productService.getProducts({ limit: 1000 }),
        rawMaterialService.getRawMaterials({ limit: 1000 })
      ]);
      
      if (productsRes.success) {
        setProducts(productsRes.data.products || []);
      }
      if (rawMaterialsRes.success) {
        setRawMaterials(rawMaterialsRes.data.rawMaterials || []);
      }
    } catch (error) {
      console.error("Failed to fetch dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchBoms();
    fetchDropdownData();
  }, [fetchBoms]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchBoms(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchBoms(paginationInfo.current, searchTerm);
  };

  // Handle add BOM item
  const handleAddBomItem = () => {
    setBomItems([...bomItems, {
      id: Date.now(),
      raw_material_id: null,
      quantity: 1,
      unit: '',
      cost_per_unit: 0,
      total_cost: 0,
    }]);
  };

  // Handle remove BOM item
  const handleRemoveBomItem = (index) => {
    const newItems = bomItems.filter((_, i) => i !== index);
    setBomItems(newItems);
  };

  // Handle BOM item change
  const handleBomItemChange = (index, field, value) => {
    const newItems = [...bomItems];
    newItems[index][field] = value;
    
    // Auto-fill unit and cost when raw material is selected
    if (field === 'raw_material_id') {
      const selectedMaterial = rawMaterials.find(m => m.id === value);
      if (selectedMaterial) {
        newItems[index].unit = selectedMaterial.uom || '';
        newItems[index].cost_per_unit = parseFloat(selectedMaterial.average_cost || 0);
      }
    }
    
    // Calculate total cost
    if (field === 'quantity' || field === 'cost_per_unit' || field === 'raw_material_id') {
      newItems[index].total_cost = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].cost_per_unit) || 0);
    }
    
    setBomItems(newItems);
  };

  // Calculate total BOM cost
  const calculateTotalCost = () => {
    return bomItems.reduce((total, item) => total + (item.total_cost || 0), 0);
  };

  // Handle create/update BOM
  const handleSubmit = async (values) => {
    try {
      const bomData = {
        productId: values.product_id,
        version: values.version,
        description: values.description,
        items: bomItems.map(item => ({
          rawMaterialId: item.raw_material_id,
          quantity: item.quantity,
          unit: item.unit || 'PIECE',
        })),
      };

      let response;
      if (editingBom) {
        response = await bomService.updateBOM(editingBom.id, bomData);
      } else {
        response = await bomService.createBOM(bomData);
      }

      if (response.success) {
        message.success(`BOM ${editingBom ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        form.resetFields();
        setEditingBom(null);
        setBomItems([]);
        fetchBoms(pagination.current, searchTerm);
      }
    } catch (error) {
      console.error("Failed to save BOM:", error);
      message.error(error.response?.data?.message || `Failed to ${editingBom ? 'update' : 'create'} BOM`);
    }
  };

  // Handle delete BOM
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this BOM?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await bomService.deleteBOM(id);
          if (response.success) {
            message.success("BOM deleted successfully");
            fetchBoms(pagination.current, searchTerm);
          }
        } catch (error) {
          console.error("Failed to delete BOM:", error);
          message.error("Failed to delete BOM");
        }
      },
    });
  };

  const columns = [
    {
      title: "BOM Number",
      dataIndex: "version",
      key: "bom_number",
      render: (version, record) => (
        <div>
          <div className="font-medium">BOM-{record.Product?.product_code}-{version}</div>
          <div className="text-xs text-gray-500">v{version}</div>
        </div>
      ),
    },
    {
      title: "Product",
      dataIndex: "Product",
      key: "product",
      render: (product) => (
        <div>
          <div className="font-medium">{product?.product_name || "N/A"}</div>
          <div className="text-xs text-gray-500">{product?.product_code}</div>
        </div>
      ),
    },
    {
      title: "Total Cost",
      key: "total_cost",
      render: (_, record) => {
        const totalCost = (record.BOMItems || []).reduce((sum, item) => {
          const qty = parseFloat(item.qty_per_unit || 0);
          const cost = parseFloat(item.RawMaterial?.average_cost || 0);
          return sum + (qty * cost);
        }, 0);
        return `₹${totalCost.toFixed(2)}`;
      },
    },
    {
      title: "Items Count",
      dataIndex: "BOMItems",
      key: "items_count",
      render: (items) => items?.length || 0,
    },
    {
      title: "Created Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => date ? new Date(date).toLocaleDateString() : "-",
    },
    {
      title: "Created Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => date ? new Date(date).toLocaleDateString() : "-",
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
                setViewingBom(record);
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
                setEditingBom(record);
                form.setFieldsValue({
                  product_id: record.product_id,
                  version: record.version,
                  description: record.name
                });
                // Map BOMItems to bomItems format
                const items = (record.BOMItems || []).map(item => ({
                  id: item.id,
                  raw_material_id: item.raw_material_id,
                  quantity: parseFloat(item.qty_per_unit || 0),
                  unit: item.RawMaterial?.uom || '',
                  cost_per_unit: parseFloat(item.RawMaterial?.average_cost || 0),
                  total_cost: parseFloat(item.qty_per_unit || 0) * parseFloat(item.RawMaterial?.average_cost || 0)
                }));
                setBomItems(items);
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

  // BOM Items columns for the modal table
  const bomItemColumns = [
    {
      title: "Raw Material",
      key: "raw_material",
      render: (_, record, index) => (
        <Select
          value={record.raw_material_id}
          onChange={(value) => handleBomItemChange(index, 'raw_material_id', value)}
          placeholder="Select raw material"
          style={{ width: "100%" }}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {rawMaterials.map(material => (
            <Option key={material.id} value={material.id}>
              {material.name} ({material.material_code})
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_, record, index) => (
        <InputNumber
          value={record.quantity}
          onChange={(value) => handleBomItemChange(index, 'quantity', value)}
          min={0}
          step={0.01}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Unit",
      key: "unit",
      render: (_, record, index) => (
        <Input
          value={record.unit}
          placeholder="Auto-filled"
          disabled
          style={{ backgroundColor: '#f5f5f5' }}
        />
      ),
    },
    {
      title: "Cost/Unit",
      key: "cost_per_unit",
      render: (_, record, index) => (
        <InputNumber
          value={record.cost_per_unit}
          placeholder="Auto-filled"
          disabled
          min={0}
          step={0.01}
          style={{ width: "100%", backgroundColor: '#f5f5f5' }}
          formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/₹\s?|(,*)/g, '')}
        />
      ),
    },
    {
      title: "Total Cost",
      key: "total_cost",
      render: (_, record) => (
        <span style={{ fontWeight: 'bold' }}>
          ₹{parseFloat(record.total_cost || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Total Cost",
      key: "total_cost",
      render: (_, record) => `₹${(record.total_cost || 0).toFixed(2)}`,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record, index) => (
        <Button
          type="primary"
          danger
          size="small"
          icon={<Trash2 size={14} />}
          onClick={() => handleRemoveBomItem(index)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <FileText size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bill of Materials (BOM)</h2>
            <p className="text-sm text-gray-600">Manage product recipes and material requirements</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingBom(null);
              form.resetFields();
              setBomItems([]);
              setIsModalVisible(true);
            }}
            style={{ backgroundColor: "#506ee4" }}
          >
            Create BOM
          </Button>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchBoms(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <SearchInput
          placeholder="Search BOMs by number, product, or description..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch("")}
          style={{ width: 400, maxWidth: '100%' }}
        />
      </Card>

      {/* BOMs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={boms}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} BOMs`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add/Edit BOM Modal */}
      <Modal
        title={editingBom ? "Edit BOM" : "Create New BOM"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingBom(null);
          form.resetFields();
          setBomItems([]);
        }}
        footer={null}
        width={1200}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="bom_number"
                label="BOM Number"
              >
                <Input placeholder="Auto-generated" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item
                name="version"
                label="Version"
                rules={[{ required: true, message: "Please enter version" }]}
              >
                <Input placeholder="e.g., 1.0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Enter BOM description"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select placeholder="Select status">
                  <Option value="draft">Draft</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="archived">Archived</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">BOM Items</h4>
            <Button
              type="dashed"
              icon={<Plus size={16} />}
              onClick={handleAddBomItem}
            >
              Add Item
            </Button>
          </div>

          <Table
            columns={bomItemColumns}
            dataSource={bomItems}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
          />

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total BOM Cost:</span>
              <span className="text-xl font-bold text-green-600">
                ₹{calculateTotalCost().toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingBom ? "Update" : "Create"} BOM
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View BOM Modal */}
      <Modal
        title="BOM Details"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingBom(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={900}
      >
        {viewingBom && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">BOM Number</label>
                  <div className="text-lg font-semibold">BOM-{viewingBom.Product?.product_code}-{viewingBom.version}</div>
                  <div className="text-sm text-gray-500">Version: {viewingBom.version}</div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <label className="text-sm font-medium text-gray-600">Product</label>
                  <div className="font-medium">{viewingBom.Product?.product_name}</div>
                  <div className="text-sm text-gray-500">{viewingBom.Product?.product_code}</div>
                </div>
              </Col>
            </Row>

            {viewingBom.name && (
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="mt-1 p-3 bg-gray-50 rounded">{viewingBom.name}</div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">BOM Items</label>
              <Table
                columns={[
                  {
                    title: "Raw Material",
                    key: "material",
                    render: (_, record) => (
                      <div>
                        <div className="font-medium">{record.RawMaterial?.name}</div>
                        <div className="text-xs text-gray-500">{record.RawMaterial?.material_code}</div>
                      </div>
                    ),
                  },
                  {
                    title: "Quantity per Unit",
                    dataIndex: "qty_per_unit",
                    key: "qty_per_unit",
                    render: (qty, record) => `${parseFloat(qty || 0).toFixed(2)} ${record.RawMaterial?.uom}`,
                  },
                  {
                    title: "Cost/Unit",
                    key: "cost_per_unit",
                    render: (_, record) => `₹${parseFloat(record.RawMaterial?.average_cost || 0).toFixed(2)}`,
                  },
                  {
                    title: "Total Cost",
                    key: "total_cost",
                    render: (_, record) => {
                      const qty = parseFloat(record.qty_per_unit || 0);
                      const cost = parseFloat(record.RawMaterial?.average_cost || 0);
                      return `₹${(qty * cost).toFixed(2)}`;
                    },
                  },
                ]}
                dataSource={viewingBom.BOMItems || []}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total BOM Cost:</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{(viewingBom.BOMItems || []).reduce((sum, item) => {
                    const qty = parseFloat(item.qty_per_unit || 0);
                    const cost = parseFloat(item.RawMaterial?.average_cost || 0);
                    return sum + (qty * cost);
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BOM;