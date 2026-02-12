import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Col,
  Space,
  Tag
} from "antd";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCcw,
  Key
} from "lucide-react";
import { permissionService } from "../services";
import PermissionGuard from "../components/PermissionGuard";
import { HelpTooltip } from "../components";

const { Search: AntSearch } = Input;
const { TextArea } = Input;

const Permissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [form] = Form.useForm();

  // Fetch permissions
  const fetchPermissions = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };

      const response = await permissionService.getPermissions(params);
      if (response.success) {
        setPermissions(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      message.error("Failed to fetch permissions");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchPermissions(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchPermissions(paginationInfo.current, searchTerm);
  };

  // Handle create/edit permission
  const handleSubmit = async (values) => {
    try {
      if (editingPermission) {
        await permissionService.updatePermission(editingPermission.id, values);
        message.success("Permission updated successfully");
      } else {
        await permissionService.createPermission(values);
        message.success("Permission created successfully");
      }

      setModalVisible(false);
      setEditingPermission(null);
      form.resetFields();
      fetchPermissions(pagination.current, searchTerm);
    } catch (error) {
      console.error("Failed to save permission:", error);
      message.error(error.response?.data?.message || "Failed to save permission");
    }
  };

  // Handle delete permission
  const handleDelete = async (id) => {
    try {
      await permissionService.deletePermission(id);
      message.success("Permission deleted successfully");
      fetchPermissions(pagination.current, searchTerm);
    } catch (error) {
      console.error("Failed to delete permission:", error);
      message.error(error.response?.data?.message || "Failed to delete permission");
    }
  };

  // Handle edit
  const handleEdit = (permission) => {
    setEditingPermission(permission);
    form.setFieldsValue({
      code: permission.code,
      description: permission.description,
    });
    setModalVisible(true);
  };

  // Handle create new
  const handleCreate = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (code) => (
        <div className="flex items-center gap-2">
          <Key size={14} className="text-blue-600" />
          <span className="font-mono text-sm">{code}</span>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permissions={["permission.update"]}>
            <Button
              type="link"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => handleEdit(record)}
            />
          </PermissionGuard>
          <PermissionGuard permissions={["permission.delete"]}>
            <Popconfirm
              title="Delete Permission"
              description="Are you sure you want to delete this permission? This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<Trash2 size={14} />}
              />
            </Popconfirm>
          </PermissionGuard>
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
            <Shield size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Permissions
              <HelpTooltip
                title="Permissions Management"
                content="Define and manage system permissions that control access to features and data. Create granular permissions for different modules, actions, and resources. Permissions are assigned to roles to control user access."
              />
            </h2>
            <p className="text-sm text-gray-600">Manage system permissions and access controls</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchPermissions(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
          <PermissionGuard permissions={["permission.create"]}>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleCreate}
            >
              Add Permission
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={8}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Permissions
            </label>
            <AntSearch
              placeholder="Search by code or description..."
              allowClear
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch("")}
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <div className="flex items-center gap-2 h-8">
              <Tag color="blue">Total: {pagination.total}</Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Permissions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={permissions}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} permissions`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingPermission ? "Edit Permission" : "Create Permission"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPermission(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="code"
            label="Permission Code"
            rules={[
              { required: true, message: "Permission code is required" },
              {
                pattern: /^[a-z0-9._-]+$/,
                message: "Code can only contain lowercase letters, numbers, dots, underscores, and hyphens"
              }
            ]}
          >
            <Input
              placeholder="e.g., user.create, product.view, etc."
              disabled={!!editingPermission}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Description is required" },
              { min: 3, message: "Description must be at least 3 characters" }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="Describe what this permission allows users to do"
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingPermission(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingPermission ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Permissions;