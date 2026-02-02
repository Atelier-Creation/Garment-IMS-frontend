import React, { useState, useEffect } from "react";
import { 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  InputNumber, 
  message, 
  Divider,
  Row,
  Col,
  Upload,
  Avatar,
  Space
} from "antd";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Upload as UploadIcon,
  Save,
  RefreshCcw
} from "lucide-react";
import { userService, roleService } from "../services";
import { HelpTooltip } from "../components";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({});
  const [systemSettings, setSystemSettings] = useState({});
  const [roles, setRoles] = useState([]);
  
  const [profileForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserProfile(user);
      profileForm.setFieldsValue(user);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

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

  // Fetch system settings
  const fetchSystemSettings = () => {
    const settings = {
      company_name: "Garment IMS",
      company_email: "admin@garmentims.com",
      company_phone: "+91 9876543210",
      company_address: "123 Business Street, City, State 12345",
      currency: "INR",
      timezone: "Asia/Kolkata",
      date_format: "DD/MM/YYYY",
      low_stock_threshold: 10,
      auto_backup: true,
      email_notifications: true,
      sms_notifications: false,
      theme: "light",
      language: "en",
    };
    setSystemSettings(settings);
    systemForm.setFieldsValue(settings);
    notificationForm.setFieldsValue(settings);
  };

  useEffect(() => {
    fetchUserProfile();
    fetchRoles();
    fetchSystemSettings();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      const userId = userProfile.id;
      const response = await userService.updateUser(userId, values);
      if (response.success) {
        message.success("Profile updated successfully");
        // Update localStorage
        const updatedUser = { ...userProfile, ...values };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserProfile(updatedUser);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      message.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      // Implement password change API call
      message.success("Password changed successfully");
      securityForm.resetFields();
    } catch (error) {
      console.error("Failed to change password:", error);
      message.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Handle system settings update
  const handleSystemSettingsUpdate = async (values) => {
    setLoading(true);
    try {
      // Implement system settings update API call
      setSystemSettings({ ...systemSettings, ...values });
      message.success("System settings updated successfully");
    } catch (error) {
      console.error("Failed to update system settings:", error);
      message.error("Failed to update system settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle notification settings update
  const handleNotificationSettingsUpdate = async (values) => {
    setLoading(true);
    try {
      // Implement notification settings update API call
      message.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      message.error("Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-white shadow-sm rounded-sm p-1.5 border border-gray-200">
          <SettingsIcon size={20} className="text-gray-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Settings
            <HelpTooltip 
              title="System Settings"
              content="Configure system preferences, user profile settings, security options, and notification preferences. Manage account details, system configurations, and personalize your application experience."
            />
          </h2>
          <p className="text-sm text-gray-600">Manage your account and system preferences</p>
        </div>
      </div>

      <Card>
        <Tabs defaultActiveKey="profile" type="card">
          {/* Profile Settings */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <User size={16} />
                Profile
              </span>
            } 
            key="profile"
          >
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <div className="flex items-center gap-4 mb-6">
                  <Avatar size={80} src={userProfile.avatar}>
                    {userProfile.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <div>
                    <Upload
                      showUploadList={false}
                      beforeUpload={() => false}
                    >
                      <Button icon={<UploadIcon size={16} />}>
                        Change Avatar
                      </Button>
                    </Upload>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Full Name"
                      rules={[{ required: true, message: "Please enter your name" }]}
                    >
                      <Input placeholder="Enter your full name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Please enter valid email" }
                      ]}
                    >
                      <Input placeholder="Enter your email" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="Phone"
                    >
                      <Input placeholder="Enter your phone number" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="role_id"
                      label="Role"
                    >
                      <Select placeholder="Select role" disabled>
                        {roles.map(role => (
                          <Option key={role.id} value={role.id}>
                            {role.role_name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="address"
                  label="Address"
                >
                  <TextArea
                    rows={3}
                    placeholder="Enter your address"
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<Save size={16} />}
                  >
                    Update Profile
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </TabPane>

          {/* Security Settings */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <Shield size={16} />
                Security
              </span>
            } 
            key="security"
          >
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              
              <Form
                form={securityForm}
                layout="vertical"
                onFinish={handlePasswordChange}
              >
                <Form.Item
                  name="current_password"
                  label="Current Password"
                  rules={[{ required: true, message: "Please enter current password" }]}
                >
                  <Input.Password placeholder="Enter current password" />
                </Form.Item>

                <Form.Item
                  name="new_password"
                  label="New Password"
                  rules={[
                    { required: true, message: "Please enter new password" },
                    { min: 6, message: "Password must be at least 6 characters" }
                  ]}
                >
                  <Input.Password placeholder="Enter new password" />
                </Form.Item>

                <Form.Item
                  name="confirm_password"
                  label="Confirm New Password"
                  dependencies={['new_password']}
                  rules={[
                    { required: true, message: "Please confirm new password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('new_password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm new password" />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<Save size={16} />}
                  >
                    Change Password
                  </Button>
                </Form.Item>
              </Form>

              <Divider />

              <h3 className="text-lg font-semibold mb-4">Security Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500">Add an extra layer of security</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Login Notifications</div>
                    <div className="text-sm text-gray-500">Get notified of new logins</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabPane>

          {/* System Settings */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <Database size={16} />
                System
              </span>
            } 
            key="system"
          >
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              
              <Form
                form={systemForm}
                layout="vertical"
                onFinish={handleSystemSettingsUpdate}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="company_name"
                      label="Company Name"
                      rules={[{ required: true, message: "Please enter company name" }]}
                    >
                      <Input placeholder="Enter company name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="company_email"
                      label="Company Email"
                      rules={[{ type: "email", message: "Please enter valid email" }]}
                    >
                      <Input placeholder="Enter company email" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="company_phone"
                      label="Company Phone"
                    >
                      <Input placeholder="Enter company phone" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="currency"
                      label="Currency"
                    >
                      <Select>
                        <Option value="INR">INR (₹)</Option>
                        <Option value="USD">USD ($)</Option>
                        <Option value="EUR">EUR (€)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="company_address"
                  label="Company Address"
                >
                  <TextArea
                    rows={3}
                    placeholder="Enter company address"
                  />
                </Form.Item>

                <Divider />

                <h4 className="font-semibold mb-4">System Preferences</h4>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="timezone"
                      label="Timezone"
                    >
                      <Select>
                        <Option value="Asia/Kolkata">Asia/Kolkata</Option>
                        <Option value="UTC">UTC</Option>
                        <Option value="America/New_York">America/New_York</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="date_format"
                      label="Date Format"
                    >
                      <Select>
                        <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                        <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                        <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="low_stock_threshold"
                      label="Low Stock Threshold"
                    >
                      <InputNumber
                        min={1}
                        style={{ width: "100%" }}
                        placeholder="Enter threshold value"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="language"
                      label="Language"
                    >
                      <Select>
                        <Option value="en">English</Option>
                        <Option value="hi">Hindi</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Backup</div>
                      <div className="text-sm text-gray-500">Automatically backup data daily</div>
                    </div>
                    <Form.Item name="auto_backup" valuePropName="checked" className="mb-0">
                      <Switch />
                    </Form.Item>
                  </div>
                </div>

                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      icon={<Save size={16} />}
                    >
                      Save Settings
                    </Button>
                    <Button 
                      icon={<RefreshCcw size={16} />}
                      onClick={() => {
                        systemForm.resetFields();
                        fetchSystemSettings();
                      }}
                    >
                      Reset
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </TabPane>

          {/* Notification Settings */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </span>
            } 
            key="notifications"
          >
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              
              <Form
                form={notificationForm}
                layout="vertical"
                onFinish={handleNotificationSettingsUpdate}
              >
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Email Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Order Updates</div>
                          <div className="text-sm text-gray-500">Get notified about order status changes</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Low Stock Alerts</div>
                          <div className="text-sm text-gray-500">Get notified when stock is low</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">System Updates</div>
                          <div className="text-sm text-gray-500">Get notified about system updates</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h4 className="font-medium mb-4">SMS Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Critical Alerts</div>
                          <div className="text-sm text-gray-500">Get SMS for critical system alerts</div>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Order Confirmations</div>
                          <div className="text-sm text-gray-500">Get SMS for order confirmations</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h4 className="font-medium mb-4">Push Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Real-time Updates</div>
                          <div className="text-sm text-gray-500">Get instant notifications in browser</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Daily Summary</div>
                          <div className="text-sm text-gray-500">Get daily summary notifications</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>

                <Form.Item className="mt-6">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<Save size={16} />}
                  >
                    Save Notification Settings
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </TabPane>

          {/* Appearance Settings */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <Palette size={16} />
                Appearance
              </span>
            } 
            key="appearance"
          >
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Theme & Display</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <Select defaultValue="light" style={{ width: 200 }}>
                    <Option value="light">Light</Option>
                    <Option value="dark">Dark</Option>
                    <Option value="auto">Auto</Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sidebar Position
                  </label>
                  <Select defaultValue="left" style={{ width: 200 }}>
                    <Option value="left">Left</Option>
                    <Option value="right">Right</Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Density
                  </label>
                  <Select defaultValue="default" style={{ width: 200 }}>
                    <Option value="compact">Compact</Option>
                    <Option value="default">Default</Option>
                    <Option value="comfortable">Comfortable</Option>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Compact Mode</div>
                    <div className="text-sm text-gray-500">Reduce spacing for more content</div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Show Animations</div>
                    <div className="text-sm text-gray-500">Enable smooth transitions and animations</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button 
                type="primary" 
                className="mt-6"
                icon={<Save size={16} />}
              >
                Save Appearance Settings
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;