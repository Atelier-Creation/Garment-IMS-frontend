import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Space, Popconfirm, Tag, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons';
import api from '../services/api';
import { HelpTooltip } from '../components';

const { Option } = Select;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form] = Form.useForm();
  const [subcategoryForm] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories');
      // Backend returns { success: true, data: { categories: [...] } }
      setCategories(response.data.data?.categories || []);
    } catch (error) {
      message.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
      setCategories([]); // Ensure categories is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, values);
        message.success('Category updated successfully');
      } else {
        await api.post('/categories', values);
        message.success('Category created successfully');
      }
      setModalVisible(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      message.error('Failed to save category');
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };

  const handleAddSubcategory = (category) => {
    setSelectedCategory(category);
    setEditingSubcategory(null);
    subcategoryForm.resetFields();
    setSubcategoryModalVisible(true);
  };

  const handleEditSubcategory = (category, subcategory) => {
    setSelectedCategory(category);
    setEditingSubcategory(subcategory);
    subcategoryForm.setFieldsValue(subcategory);
    setSubcategoryModalVisible(true);
  };

  const handleSubcategorySubmit = async (values) => {
    try {
      const data = {
        ...values,
        category_id: selectedCategory.id
      };

      if (editingSubcategory) {
        await api.put(`/subcategories/${editingSubcategory.id}`, data);
        message.success('Subcategory updated successfully');
      } else {
        await api.post('/subcategories', data);
        message.success('Subcategory created successfully');
      }
      setSubcategoryModalVisible(false);
      subcategoryForm.resetFields();
      setEditingSubcategory(null);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      message.error('Failed to save subcategory');
      console.error('Error saving subcategory:', error);
    }
  };

  const handleDeleteSubcategory = async (id) => {
    try {
      await api.delete(`/subcategories/${id}`);
      message.success('Subcategory deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete subcategory');
      console.error('Error deleting subcategory:', error);
    }
  };

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <span className="font-medium">{name}</span>
    },
    {
      title: 'Subcategories',
      dataIndex: 'Subcategories',
      key: 'subcategories',
      render: (subcategories) => (
        <Tag color="blue">{subcategories?.length || 0} subcategories</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => handleAddSubcategory(record)}
          >
            Add Subcategory
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subcategoryColumns = [
    {
      title: 'Subcategory Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, subcategory) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              // Find parent category
              const parentCategory = categories.find(cat =>
                cat.Subcategories?.some(sub => sub.id === subcategory.id)
              );
              handleEditSubcategory(parentCategory, subcategory);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this subcategory?"
            onConfirm={() => handleDeleteSubcategory(subcategory.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Categories
          <HelpTooltip
            title="Categories Management"
            content="Organize products and materials using categories and subcategories. Create hierarchical classification systems, manage category relationships, and maintain organized product catalogs for better inventory management."
          />
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCategory(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Category
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={categories}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Subcategories for {record.name}</h4>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddSubcategory(record)}
                  >
                    Add Subcategory
                  </Button>
                </div>
                {record.Subcategories && record.Subcategories.length > 0 ? (
                  <Table
                    columns={subcategoryColumns}
                    dataSource={record.Subcategories}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <p className="text-gray-500 text-center py-4">No subcategories yet</p>
                )}
              </div>
            ),
            rowExpandable: (record) => true,
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
        open={subcategoryModalVisible}
        onCancel={() => {
          setSubcategoryModalVisible(false);
          setEditingSubcategory(null);
          setSelectedCategory(null);
          subcategoryForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={subcategoryForm}
          layout="vertical"
          onFinish={handleSubcategorySubmit}
        >
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">
              Category: <span className="font-semibold">{selectedCategory?.name}</span>
            </p>
          </div>

          <Form.Item
            name="name"
            label="Subcategory Name"
            rules={[{ required: true, message: 'Please enter subcategory name' }]}
          >
            <Input placeholder="Enter subcategory name" />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setSubcategoryModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSubcategory ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;