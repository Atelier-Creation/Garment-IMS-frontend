import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tooltip,
  Tag,
  Row,
  Col,
  Statistic
} from "antd";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  MapPin,
  Phone,
  Users,
  Package
} from "lucide-react";
import { branchService } from "../services";

const { Option } = Select;
import { SearchInput, HelpTooltip } from "../components";
const { TextArea } = Input;

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewingBranch, setViewingBranch] = useState(null);
  const [branchStats, setBranchStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [form] = Form.useForm();

  // Fetch branches
  const fetchBranches = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };

      const response = await branchService.getBranches(params);
      if (response.success) {
        setBranches(response.data.branches || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      message.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch branch statistics
  const fetchBranchStats = async (branchId) => {
    try {
      const [usersRes, stockRes] = await Promise.all([
        branchService.getBranchUsers(branchId),
        branchService.getBranchStock(branchId)
      ]);

      return {
        totalUsers: usersRes.success ? usersRes.data.total || 0 : 0,
        totalStock: stockRes.success ? stockRes.data.total || 0 : 0,
      };
    } catch (error) {
      console.error("Failed to fetch branch stats:", error);
      return { totalUsers: 0, totalStock: 0 };
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchBranches(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchBranches(paginationInfo.current, searchTerm);
  };

  // Handle create/update branch
  const handleSubmit = async (values) => {
    try {
      let response;
      if (editingBranch) {
        response = await branchService.updateBranch(editingBranch.id, values);
      } else {
        response = await branchService.createBranch(values);
      }

      if (response.success) {
        message.success(`Branch ${editingBranch ? 'updated' : 'created'} successfully`);
        setIsModalVisible(false);
        form.resetFields();
        setEditingBranch(null);
        fetchBranches(pagination.current, searchTerm);
      }
    } catch (error) {
      console.error("Failed to save branch:", error);
      message.error(`Failed to ${editingBranch ? 'update' : 'create'} branch`);
    }
  };

  // Handle delete branch
  const handleDelete = async (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this branch?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await branchService.deleteBranch(id);
          if (response.success) {
            message.success("Branch deleted successfully");
            fetchBranches(pagination.current, searchTerm);
          }
        } catch (error) {
          console.error("Failed to delete branch:", error);
          message.error("Failed to delete branch");
        }
      },
    });
  };

  // Handle view branch details
  const handleViewBranch = async (branch) => {
    setViewingBranch(branch);
    const stats = await fetchBranchStats(branch.id);
    setBranchStats(stats);
    setIsViewModalVisible(true);
  };

  const columns = [
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.type}</div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={
          type === 'FACTORY' ? 'blue' :
            type === 'WAREHOUSE' ? 'green' :
              type === 'SHOP' ? 'orange' : 'default'
        }>
          {type}
        </Tag>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <Phone size={12} />
            {record.phone || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Address",
      key: "address",
      render: (_, record) => (
        <div className="flex items-start gap-1">
          <MapPin size={12} className="mt-1 flex-shrink-0" />
          <div className="text-sm">
            {record.address || "No address"}
          </div>
        </div>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString(),
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
              icon={<Building2 size={14} />}
              onClick={() => handleViewBranch(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => {
                setEditingBranch(record);
                form.setFieldsValue(record);
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
            <Building2 size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Branch Management
              <HelpTooltip
                title="Branch Management"
                content="Manage company branches and locations including branch details, contact information, and operational settings. Create new branches, update existing ones, and organize multi-location business operations."
              />
            </h2>
            <p className="text-sm text-gray-600">Manage company branches and locations</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingBranch(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
            style={{ backgroundColor: "#506ee4" }}
          >
            Add Branch
          </Button>
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchBranches(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="!mb-4">
        <SearchInput
          placeholder="Search branches by name, code, or manager..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && handleSearch("")}
          style={{ width: 400, maxWidth: '100%' }}
        />
      </Card>

      {/* Branches Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={branches}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} branches`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add/Edit Branch Modal */}
      <Modal
        title={editingBranch ? "Edit Branch" : "Add New Branch"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingBranch(null);
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
                name="name"
                label="Branch Name"
                rules={[{ required: true, message: "Please enter branch name" }]}
              >
                <Input placeholder="Enter branch name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Branch Type"
                rules={[{ required: true, message: "Please select branch type" }]}
              >
                <Select placeholder="Select branch type">
                  <Option value="FACTORY">Factory</Option>
                  <Option value="WAREHOUSE">Warehouse</Option>
                  <Option value="SHOP">Shop</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* Placeholder for future fields */}
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
          >
            <TextArea
              rows={3}
              placeholder="Enter complete address"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingBranch ? "Update" : "Create"} Branch
            </Button>
          </div>
        </Form>
      </Modal>

      {/* View Branch Details Modal */}
      <Modal
        title="Branch Details"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setViewingBranch(null);
          setBranchStats({});
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewingBranch && (
          <div>
            {/* Branch Info */}
            <Card className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-600">Branch Name</label>
                    <div className="text-lg font-semibold">{viewingBranch.name}</div>
                  </div>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-600">Branch Type</label>
                    <div>
                      <Tag color={
                        viewingBranch.type === 'FACTORY' ? 'blue' :
                          viewingBranch.type === 'WAREHOUSE' ? 'green' :
                            viewingBranch.type === 'SHOP' ? 'orange' : 'default'
                      }>
                        {viewingBranch.type}
                      </Tag>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <div>{viewingBranch.phone || "Not provided"}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <div>{new Date(viewingBranch.created_at).toLocaleDateString()}</div>
                  </div>
                </Col>
              </Row>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">Address</label>
                <div className="mt-1">
                  {viewingBranch.address || "No address provided"}
                </div>
              </div>
            </Card>

            {/* Branch Statistics */}
            <Card title="Branch Statistics">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Users"
                    value={branchStats.totalUsers || 0}
                    prefix={<Users size={16} />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Stock Items"
                    value={branchStats.totalStock || 0}
                    prefix={<Package size={16} />}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Branches;