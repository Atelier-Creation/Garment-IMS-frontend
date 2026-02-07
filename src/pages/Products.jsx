import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, InputNumber, Row, Col, Tag, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { productService, categoryService, subcategoryService } from '../services';
import { SearchInput, HelpTooltip } from "../components";

const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [subcategoryForm] = Form.useForm();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [pagination.current, pagination.pageSize, searchText]);

  // Fetch subcategories when category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined
      };
      
      const response = await productService.getProducts(params);
      if (response.success) {
        setProducts(response.data.products || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
      setProducts([]);
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
      setCategories([]);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await subcategoryService.getSubcategories(categoryId);
      if (response.success) {
        setSubcategories(response.data.subcategories || []);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, values);
        message.success('Product updated successfully');
      } else {
        await productService.createProduct(values);
        message.success('Product created successfully');
      }
      setModalVisible(false);
      setEditingProduct(null);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error('Failed to save product');
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      categoryId: product.category_id,
      subCategoryId: product.sub_category_id
    });
    setSelectedCategoryId(product.category_id);
    setModalVisible(true);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    // Reset subcategory when category changes
    form.setFieldsValue({ subCategoryId: undefined });
  };

  const handleDelete = async (id) => {
    try {
      await productService.deleteProduct(id);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
      console.error('Error deleting product:', error);
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

  // Handle category creation
  const handleCreateCategory = async (values) => {
    try {
      const response = await categoryService.createCategory(values);
      if (response.success) {
        message.success('Category created successfully');
        setCategoryModalVisible(false);
        categoryForm.resetFields();
        await fetchCategories(); // Refresh categories list
      }
    } catch (error) {
      message.error('Failed to create category');
      console.error('Error creating category:', error);
    }
  };

  // Handle subcategory creation
  const handleCreateSubcategory = async (values) => {
    try {
      const subcategoryData = {
        ...values,
        category_id: selectedCategoryId
      };
      const response = await subcategoryService.createSubcategory(subcategoryData);
      if (response.success) {
        message.success('Subcategory created successfully');
        setSubcategoryModalVisible(false);
        subcategoryForm.resetFields();
        await fetchSubcategories(selectedCategoryId); // Refresh subcategories list
      }
    } catch (error) {
      message.error('Failed to create subcategory');
      console.error('Error creating subcategory:', error);
    }
  };

  // Open category creation modal
  const openCategoryModal = () => {
    categoryForm.resetFields();
    setCategoryModalVisible(true);
  };

  // Open subcategory creation modal
  const openSubcategoryModal = () => {
    if (!selectedCategoryId) {
      message.warning('Please select a category first');
      return;
    }
    subcategoryForm.resetFields();
    setSubcategoryModalVisible(true);
  };

  const columns = [
    {
      title: 'Product Code',
      dataIndex: 'product_code',
      key: 'product_code',
      render: (text) => <span className="font-mono text-sm">{text}</span>
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Category',
      dataIndex: ['Category', 'name'],
      key: 'category',
      render: (_, record) => record.Category?.name || 'N/A',
    },
    {
      title: 'Subcategory',
      dataIndex: ['Subcategory', 'name'],
      key: 'subcategory',
      render: (_, record) => record.Subcategory?.name || 'N/A',
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Fabric',
      dataIndex: 'fabric',
      key: 'fabric',
    },
    {
      title: 'Base Price',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price) => `₹${parseFloat(price || 0).toFixed(2)}`,
    },
    {
      title: 'Variants',
      dataIndex: 'variants',
      key: 'variants',
      render: (variants) => (
        <span>{variants?.length || 0} variants</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Products
          <HelpTooltip 
            title="Products Management"
            content="Manage your product catalog including product details, categories, subcategories, pricing, and variants. Create new products with categories/subcategories directly from the form. Track product status and organize inventory efficiently."
          />
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingProduct(null);
            setSelectedCategoryId(null);
            setCategoryModalVisible(false);
            setSubcategoryModalVisible(false);
            form.resetFields();
            categoryForm.resetFields();
            subcategoryForm.resetFields();
            setModalVisible(true);
          }}
        >
          Add Product
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <SearchInput
            placeholder="Search products..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 300, maxWidth: '100%' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} products`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProduct(null);
          setSelectedCategoryId(null);
          setCategoryModalVisible(false);
          setSubcategoryModalVisible(false);
          form.resetFields();
          categoryForm.resetFields();
          subcategoryForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="Enter product SKU" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="categoryId"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <div className="flex gap-2">
              <Select 
                placeholder="Select category"
                onChange={handleCategoryChange}
                style={{ flex: 1 }}
              >
                {Array.isArray(categories) && categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={openCategoryModal}
                title="Add new category"
              >
                Add
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="subCategoryId"
            label="Subcategory"
          >
            <div className="flex gap-2">
              <Select 
                placeholder="Select subcategory"
                disabled={!selectedCategoryId}
                allowClear
                style={{ flex: 1 }}
              >
                {Array.isArray(subcategories) && subcategories.map(subcategory => (
                  <Option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </Option>
                ))}
              </Select>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={openSubcategoryModal}
                disabled={!selectedCategoryId}
                title="Add new subcategory"
              >
                Add
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="costPrice"
                label="Cost Price"
                rules={[{ required: true, message: 'Please enter cost price' }]}
              >
                <InputNumber
                  placeholder="Enter cost price"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sellingPrice"
                label="Selling Price"
                rules={[{ required: true, message: 'Please enter selling price' }]}
              >
                <InputNumber
                  placeholder="Enter selling price"
                  style={{ width: '100%' }}
                  min={0}
                  step={0.01}
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
              >
                <Select placeholder="Select unit">
                  <Option value="pcs">Pieces</Option>
                  <Option value="kg">Kilograms</Option>
                  <Option value="m">Meters</Option>
                  <Option value="set">Set</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setModalVisible(false);
              setSelectedCategoryId(null);
              setCategoryModalVisible(false);
              setSubcategoryModalVisible(false);
              categoryForm.resetFields();
              subcategoryForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Category Creation Modal */}
      <Modal
        title="Add New Category"
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          categoryForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCreateCategory}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              { required: true, message: 'Please enter category name' },
              { min: 2, message: 'Category name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter category description (optional)" rows={3} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setCategoryModalVisible(false);
              categoryForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Category
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Subcategory Creation Modal */}
      <Modal
        title="Add New Subcategory"
        open={subcategoryModalVisible}
        onCancel={() => {
          setSubcategoryModalVisible(false);
          subcategoryForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={subcategoryForm}
          layout="vertical"
          onFinish={handleCreateSubcategory}
        >
          <Form.Item
            label="Parent Category"
          >
            <Input 
              value={categories.find(cat => cat.id === selectedCategoryId)?.name || ''} 
              disabled 
              placeholder="No category selected"
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Subcategory Name"
            rules={[
              { required: true, message: 'Please enter subcategory name' },
              { min: 2, message: 'Subcategory name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter subcategory name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter subcategory description (optional)" rows={3} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setSubcategoryModalVisible(false);
              subcategoryForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Subcategory
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;