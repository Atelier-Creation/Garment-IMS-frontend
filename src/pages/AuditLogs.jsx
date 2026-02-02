import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  Table, 
  Button, 
  Select, 
  DatePicker, 
  Input,
  Tag,
  Row,
  Col,
  Tooltip,
  Space
} from "antd";
import { 
  Shield, 
  Search, 
  RefreshCcw, 
  Eye,
  Filter,
  Calendar,
  User,
  Activity
} from "lucide-react";
import { auditLogService, userService } from "../services";
import dayjs from "dayjs";
import { HelpTooltip } from "../components";

const { Option } = Select;
const { Search: AntSearch } = Input;
const { RangePicker } = DatePicker;

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [dateRange, setDateRange] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Dropdown data
  const [users, setUsers] = useState([]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (page = 1, search = "", action = "all", userId = "all", startDate = null, endDate = null) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        search: search || undefined,
        action: action !== "all" ? action : undefined,
        user_id: userId !== "all" ? userId : undefined,
        start_date: startDate,
        end_date: endDate,
      };
      
      const response = await auditLogService.getAuditLogs(params);
      if (response.success) {
        setAuditLogs(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  // Fetch users for filter
  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers({ limit: 1000 });
      if (response.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchUsers();
  }, [fetchAuditLogs]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    const [startDate, endDate] = dateRange.length === 2 ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : [null, null];
    fetchAuditLogs(1, value, filterAction, filterUser, startDate, endDate);
  };

  // Handle filter change
  const handleFilterChange = () => {
    const [startDate, endDate] = dateRange.length === 2 ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : [null, null];
    fetchAuditLogs(1, searchTerm, filterAction, filterUser, startDate, endDate);
  };

  // Handle table change
  const handleTableChange = (paginationInfo) => {
    const [startDate, endDate] = dateRange.length === 2 ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : [null, null];
    fetchAuditLogs(paginationInfo.current, searchTerm, filterAction, filterUser, startDate, endDate);
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      create: "green",
      update: "blue",
      delete: "red",
      login: "purple",
      logout: "orange",
      view: "cyan",
      export: "magenta",
    };
    return colors[action?.toLowerCase()] || "default";
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      low: "green",
      medium: "orange",
      high: "red",
      critical: "red",
    };
    return colors[severity?.toLowerCase()] || "default";
  };

  // Format details for display
  const formatDetails = (details) => {
    if (!details) return "N/A";
    if (typeof details === 'string') return details;
    return JSON.stringify(details, null, 2);
  };

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-500">{dayjs(date).format('HH:mm:ss')}</div>
        </div>
      ),
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 150,
      render: (user) => (
        <div className="flex items-center gap-2">
          <User size={14} />
          <div>
            <div className="font-medium">{user?.name || "System"}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {action?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Resource",
      key: "resource",
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.table_name}</div>
          {record.record_id && (
            <div className="text-xs text-gray-500">ID: {record.record_id}</div>
          )}
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
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 120,
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => {
              // Show details modal or expand row
              console.log("View details:", record);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  // Expandable row render
  const expandedRowRender = (record) => {
    return (
      <div className="p-4 bg-gray-50 rounded">
        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600">User Agent</label>
              <div className="text-sm">{record.user_agent || "N/A"}</div>
            </div>
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600">Session ID</label>
              <div className="text-sm font-mono">{record.session_id || "N/A"}</div>
            </div>
          </Col>
          <Col span={12}>
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600">Request Method</label>
              <div className="text-sm">{record.request_method || "N/A"}</div>
            </div>
            <div className="mb-3">
              <label className="text-sm font-medium text-gray-600">Request URL</label>
              <div className="text-sm font-mono">{record.request_url || "N/A"}</div>
            </div>
          </Col>
        </Row>
        
        {record.old_values && (
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-600">Old Values</label>
            <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto max-h-32">
              {formatDetails(record.old_values)}
            </pre>
          </div>
        )}
        
        {record.new_values && (
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-600">New Values</label>
            <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto max-h-32">
              {formatDetails(record.new_values)}
            </pre>
          </div>
        )}
        
        {record.additional_data && (
          <div>
            <label className="text-sm font-medium text-gray-600">Additional Data</label>
            <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto max-h-32">
              {formatDetails(record.additional_data)}
            </pre>
          </div>
        )}
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
            <h2 className="text-2xl font-bold text-gray-800">
              Audit Logs
              <HelpTooltip 
                title="Audit Logs"
                content="Track and monitor all system activities and user actions for security and compliance. View detailed logs of who did what and when, filter by users, actions, and date ranges. Essential for security auditing and troubleshooting."
              />
            </h2>
            <p className="text-sm text-gray-600">Track system activities and user actions</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            icon={<RefreshCcw size={16} />}
            onClick={() => {
              const [startDate, endDate] = dateRange.length === 2 ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : [null, null];
              fetchAuditLogs(pagination.current, searchTerm, filterAction, filterUser, startDate, endDate);
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="bottom">
          <Col xs={24} sm={8} md={6}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <AntSearch
              placeholder="Search logs..."
              allowClear
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch("")}
            />
          </Col>
          
          <Col xs={24} sm={8} md={4}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <Select
              value={filterAction}
              onChange={(value) => {
                setFilterAction(value);
                setTimeout(handleFilterChange, 100);
              }}
              style={{ width: "100%" }}
            >
              <Option value="all">All Actions</Option>
              <Option value="create">Create</Option>
              <Option value="update">Update</Option>
              <Option value="delete">Delete</Option>
              <Option value="login">Login</Option>
              <Option value="logout">Logout</Option>
              <Option value="view">View</Option>
              <Option value="export">Export</Option>
            </Select>
          </Col>

          <Col xs={24} sm={8} md={4}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            <Select
              value={filterUser}
              onChange={(value) => {
                setFilterUser(value);
                setTimeout(handleFilterChange, 100);
              }}
              style={{ width: "100%" }}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              <Option value="all">All Users</Option>
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates || []);
                setTimeout(handleFilterChange, 100);
              }}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<Filter size={16} />}
              onClick={handleFilterChange}
              style={{ width: "100%" }}
            >
              Apply Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={auditLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} audit logs`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <Button
                  type="link"
                  size="small"
                  onClick={e => onExpand(record, e)}
                  icon={<Eye size={12} />}
                />
              ) : (
                <Button
                  type="link"
                  size="small"
                  onClick={e => onExpand(record, e)}
                  icon={<Eye size={12} />}
                />
              ),
          }}
          size="small"
        />
      </Card>

      {/* Summary Stats */}
      <Row gutter={16} className="mt-6">
        <Col xs={24} sm={8}>
          <Card size="small">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-600" size={24} />
              <div>
                <div className="text-sm text-gray-600">Total Activities</div>
                <div className="text-xl font-bold">{pagination.total}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div className="flex items-center gap-3">
              <User className="text-green-600" size={24} />
              <div>
                <div className="text-sm text-gray-600">Active Users</div>
                <div className="text-xl font-bold">{users.length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div className="flex items-center gap-3">
              <Calendar className="text-purple-600" size={24} />
              <div>
                <div className="text-sm text-gray-600">Today's Activities</div>
                <div className="text-xl font-bold">
                  {auditLogs.filter(log => 
                    dayjs(log.created_at).isSame(dayjs(), 'day')
                  ).length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AuditLogs;