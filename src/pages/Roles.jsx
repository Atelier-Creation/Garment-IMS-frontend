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
  Tag,
  Select,
  Divider
} from "antd";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCcw,
  Shield,
  Key
} from "lucide-react";
import { roleService, permissionService } from "../services";
import PermissionGuard from "../components/PermissionGuard";

const { Search: AntSearch } = Input;
const { TextArea } = Input;
const { Option } = Select;

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [form] = Form.useForm();

  // Fetch roles
  const fetchRoles = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };
      
      const response = await roleService.getRoles(params);
      if (response.success) {
        setRoles(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      message.error("Failed to fetch roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch permissions for dropdown
  const fetchPermissions = async () => {
    try {
      const response = await permissionService.getAllPermissions();
      if (response.success) {
        setPermissions(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchRoles(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchRoles(paginationInfo.current, searchTerm);
  };

  // Handle create/edit role
  const handleSubmit = async (values) => {
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, values);
        message.success("Role updated successfully");
      } else {
        await roleService.createRole(values);
        message.success("Role created successfully");
      }
      
      setModalVisible(false);
      setEditingRole(null);
      form.resetFields();
      fetchRoles(pagination.current, searchTerm);
    } catch (error) {
      console.error("Failed to save role:", error);
      message.error(error.response?.data?.message || "Failed to save role");
    }
  };

  // Handle delete role
  const handleDelete = async (id) => {
    try {
      await roleService.deleteRole(id);
      message.success("Role deleted successfully");
      fetchRoles(pagination.current, searchTerm);
    } catch (error) {
      console.error("Failed to delete role:", error);
      message.error(error.response?.data?.message || "Failed to delete role");
    }
  };

  // Handle edit
  const handleEdit = (role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.Permissions?.map(p => p.id) || [],
    });
    setModalVisible(true);
  };

  // Handle create new
  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-blue-600" />
          <span className="font-medium">{name}</span>
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
      title: "Permissions",
      dataIndex: "Permissions",
      key: "permissions",
      width: 150,
      render: (permissions) => (
        <Tag color="blue">
          {permissions?.length || 0} permissions
        </Tag>
      ),
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
          <PermissionGuard permissions={["role.update"]}>
            <Button
              type="link"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => handleEdit(record)}
            />
          </PermissionGuard>
          <PermissionGuard permissions={["role.delete"]}>
            <Popconfirm
              title="Delete Role"
              description="Are you sure you want to delete this role? This action cannot be undone."
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

  // Expandable row render
  const expandedRowRender = (record) => {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <div className="mb-3">
          <label className="text-sm font-medium text-gray-600">Assigned Permissions</label>
          <div className="mt-2 flex flex-wrap gap-1">
            {record.Permissions && record.Permissions.length > 0 ? (
              record.Permissions.map(permission => (
                <Tag key={permission.id} color="blue" className="mb-1">
                  <Key size={12} className="inline mr-1" />
                  {permission.code}
                </Tag>
              ))
            ) : (
              <span className="text-gray-500 text-sm">No permissions assigned</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <Shield size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Roles</h2>
            <p className="text-sm text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchRoles(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
          <PermissionGuard permissions={["role.create"]}>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleCreate}
            >
              Add Role
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={8}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Roles
            </label>
            <AntSearch
              placeholder="Search by name or description..."
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

      {/* Roles Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} roles`,
          }}
          onChange={handleTableChange}
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <Button
                  type="link"
                  size="small"
                  onClick={e => onExpand(record, e)}
                  icon={<Key size={12} />}
                />
              ) : (
                <Button
                  type="link"
                  size="small"
                  onClick={e => onExpand(record, e)}
                  icon={<Key size={12} />}
                />
              ),
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingRole ? "Edit Role" : "Create Role"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRole(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: "Role name is required" },
              { min: 2, message: "Role name must be at least 2 characters" }
            ]}
          >
            <Input 
              placeholder="e.g., Manager, Operator, etc."
              disabled={!!editingRole}
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
              placeholder="Describe the role and its responsibilities"
            />
          </Form.Item>

          <Divider />

          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[
              { required: true, message: "At least one permission is required" }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select permissions for this role"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              {permissions.map(permission => (
                <Option key={permission.id} value={permission.id}>
                  <div className="flex items-center gap-2">
                    <Key size={12} />
                    <span className="font-mono text-sm">{permission.code}</span>
                    <span className="text-gray-500">- {permission.description}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingRole(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingRole ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;