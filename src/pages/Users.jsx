import React, { useState, useEffect, useCallback } from 'react';
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
  Popconfirm, 
  Row, 
  Col, 
  Tag,
  Divider
} from 'antd';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCcw,
  User,
  Mail,
  Phone,
  Key,
  Lock
} from 'lucide-react';
import { userService, roleService } from '../services';
import PermissionGuard from '../components/PermissionGuard';

const { Option } = Select;
import { SearchInput } from "../components";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Fetch users
  const fetchUsers = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
      };
      
      const response = await userService.getUsers(params);
      if (response.success) {
        setUsers(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      message.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch roles for dropdown
  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles({ limit: 100 });
      if (response.success) {
        setRoles(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchUsers(1, value);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    fetchUsers(paginationInfo.current, searchTerm);
  };

  // Handle create/edit user
  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, values);
        message.success("User updated successfully");
      } else {
        await userService.createUser(values);
        message.success("User created successfully");
      }
      
      setModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers(pagination.current, searchTerm);
    } catch (error) {
      console.error("Failed to save user:", error);
      message.error(error.response?.data?.message || "Failed to save user");
    }
  };

  // Handle password change
  const handlePasswordChange = async (values) => {
    try {
      await userService.changePassword(changingPasswordUser.id, values.newPassword);
      message.success("Password changed successfully");
      setPasswordModalVisible(false);
      setChangingPasswordUser(null);
      passwordForm.resetFields();
    } catch (error) {
      console.error("Failed to change password:", error);
      message.error(error.response?.data?.message || "Failed to change password");
    }
  };

  // Handle delete user
  const handleDelete = async (id) => {
    try {
      await userService.deleteUser(id);
      message.success("User deleted successfully");
      fetchUsers(pagination.current, searchTerm);
    } catch (error) {
      console.error("Failed to delete user:", error);
      message.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  // Handle edit
  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      roles: user.Roles?.map(r => r.id) || [],
    });
    setModalVisible(true);
  };

  // Handle create new
  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Handle change password
  const handleChangePassword = (user) => {
    setChangingPasswordUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 250,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{record.full_name}</div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Mail size={12} />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (phone) => phone ? (
        <div className="flex items-center gap-1">
          <Phone size={12} className="text-gray-400" />
          {phone}
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      ),
    },
    {
      title: "Roles",
      dataIndex: "Roles",
      key: "roles",
      width: 200,
      render: (roles) => (
        <div className="flex flex-wrap gap-1">
          {roles && roles.length > 0 ? (
            roles.map(role => (
              <Tag key={role.id} color="blue" className="mb-1">
                {role.name}
              </Tag>
            ))
          ) : (
            <Tag color="default">No roles</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "status",
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permissions={["user.update"]}>
            <Button
              type="link"
              size="small"
              icon={<Edit size={14} />}
              onClick={() => handleEdit(record)}
            />
          </PermissionGuard>
          <PermissionGuard permissions={["user.update"]}>
            <Button
              type="link"
              size="small"
              icon={<Lock size={14} />}
              onClick={() => handleChangePassword(record)}
            />
          </PermissionGuard>
          <PermissionGuard permissions={["user.delete"]}>
            <Popconfirm
              title="Delete User"
              description="Are you sure you want to delete this user? This action cannot be undone."
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
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
            <UsersIcon size={20} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Users</h2>
            <p className="text-sm text-gray-600">Manage system users and their roles</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => fetchUsers(pagination.current, searchTerm)}
          >
            Refresh
          </Button>
          <PermissionGuard permissions={["user.create"]}>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={handleCreate}
            >
              Add User
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={12} md={8}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <SearchInput
              placeholder="Search by name or email..."
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

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Full Name"
                rules={[
                  { required: true, message: "Full name is required" },
                  { min: 2, message: "Full name must be at least 2 characters" }
                ]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Please enter a valid email" }
                ]}
              >
                <Input placeholder="Enter email address" />
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
              {!editingUser && (
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Password is required" },
                    { min: 6, message: "Password must be at least 6 characters" }
                  ]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              )}
            </Col>
          </Row>

          <Divider />

          <Form.Item
            name="roles"
            label="Roles"
            rules={[
              { required: true, message: "At least one role is required" }
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles for this user"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  <div className="flex items-center gap-2">
                    <Key size={12} />
                    <span className="font-medium">{role.name}</span>
                    <span className="text-gray-500">- {role.description}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingUser ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          setChangingPasswordUser(null);
          passwordForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="mt-4"
        >
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">Changing password for:</div>
            <div className="font-medium">{changingPasswordUser?.full_name}</div>
            <div className="text-sm text-gray-500">{changingPasswordUser?.email}</div>
          </div>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "New password is required" },
              { min: 6, message: "Password must be at least 6 characters" }
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: "Please confirm the password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => {
                setPasswordModalVisible(false);
                setChangingPasswordUser(null);
                passwordForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Change Password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;