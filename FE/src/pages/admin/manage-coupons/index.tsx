"use client";

import { useState } from "react";
import {
  Typography,
  Table,
  Button,
  Modal,
  Tag,
  Input,
  Form,
  InputNumber,
  DatePicker,
  Select,
  Space,
  message,
  Popconfirm,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  GiftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/utils/toast.utils";
import { coupon as Coupon } from "@/types/coupon";

const { Title } = Typography;
const { Search } = Input;
const { TextArea } = Input;
const { Option } = Select;

// Mockup data cho mã giảm giá (chỉ phần trăm)
const mockCoupons: Coupon[] = [
  {
    id: "1",
    name: "WELCOME2024",
    discount: 15,
    description: "Mã giảm giá chào mừng năm mới 2024 dành cho khách hàng mới",
    status: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-12-31T23:59:59Z",
  },
  {
    id: "2",
    name: "MOTORBIKE20",
    discount: 20,
    description: "Giảm 20% cho thuê xe máy, áp dụng cho đơn hàng từ 200k",
    status: "ACTIVE",
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
    expiresAt: "2024-06-30T23:59:59Z",
  },
  {
    id: "3",
    name: "BICYCLE15",
    discount: 15,
    description: "Giảm 15% cho thuê xe đạp trong tháng 3",
    status: "EXPIRED",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    expiresAt: "2024-03-31T23:59:59Z",
  },
  {
    id: "4",
    name: "CAR25",
    discount: 25,
    description: "Giảm 25% cho thuê xe ô tô, áp dụng cuối tuần",
    status: "ACTIVE",
    createdAt: "2024-04-01T00:00:00Z",
    updatedAt: "2024-04-15T00:00:00Z",
    expiresAt: "2024-08-31T23:59:59Z",
  },
  {
    id: "5",
    name: "SUMMER30",
    discount: 30,
    description: "Mã giảm giá mùa hè 30% cho tất cả loại xe",
    status: "INACTIVE",
    createdAt: "2024-05-01T00:00:00Z",
    updatedAt: "2024-05-01T00:00:00Z",
    expiresAt: "2024-09-30T23:59:59Z",
  },
  {
    id: "6",
    name: "STUDENT25",
    discount: 25,
    description: "Giảm 25% dành cho sinh viên có thẻ học sinh",
    status: "ACTIVE",
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    expiresAt: "2024-12-31T23:59:59Z",
  },
];

export default function ManageDiscountCodesPage() {
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [searchText, setSearchText] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [form] = Form.useForm();

  // Filter coupons based on search text
  const filteredCoupons = coupons.filter((coupon) => {
    const searchLower = searchText.toLowerCase();
    return (
      coupon.name.toLowerCase().includes(searchLower) ||
      coupon.description.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsAddMode(false);
    setIsModalVisible(true);

    // Set form values
    form.setFieldsValue({
      name: coupon.name,
      discount: coupon.discount,
      description: coupon.description,
      status: coupon.status,
      expiresAt: dayjs(coupon.expiresAt),
      createdAt: dayjs(coupon.createdAt),
      updatedAt: dayjs(coupon.updatedAt),
    });
  };

  const handleAddNew = () => {
    setSelectedCoupon(null);
    setIsAddMode(true);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!isAddMode && selectedCoupon) {
        // Update existing coupon
        const updatedCoupon: Coupon = {
          ...selectedCoupon,
          name: values.name.toUpperCase(),
          discount: values.discount,
          description: values.description,
          status: values.status,
          expiresAt: values.expiresAt.toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCoupons((prev) =>
          prev.map((coupon) =>
            coupon.id === selectedCoupon.id ? updatedCoupon : coupon
          )
        );

        showSuccess("Cập nhật mã giảm giá thành công!");
      } else {
        // Add new coupon
        const newCoupon: Coupon = {
          id: Date.now().toString(),
          name: values.name.toUpperCase(),
          discount: values.discount,
          description: values.description,
          status: values.status,
          expiresAt: values.expiresAt.toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setCoupons((prev) => [newCoupon, ...prev]);
        showSuccess("Thêm mã giảm giá thành công!");
      }

      setIsModalVisible(false);
    } catch (error) {
      showError("Có lỗi xảy ra, vui lòng thử lại!");
      console.error("Validation failed:", error);
    }
  };

  const handleDelete = (couponId: string) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
    showSuccess("Xóa mã giảm giá thành công!");
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsAddMode(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "warning";
      case "EXPIRED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "INACTIVE":
        return "Tạm dừng";
      case "EXPIRED":
        return "Hết hạn";
      default:
        return status;
    }
  };

  const formatDiscount = (discount: number) => {
    return `${discount}%`;
  };

  const isExpired = (expiresAt: string) => {
    return dayjs(expiresAt).isBefore(dayjs());
  };

  const columns: ColumnsType<Coupon> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Mã giảm giá",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div className="flex items-center gap-2">
          <GiftOutlined className="text-blue-500" />
          <span className="font-mono font-semibold text-blue-600">{name}</span>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Mức giảm",
      dataIndex: "discount",
      key: "discount",
      render: (discount) => (
        <span className="font-semibold text-green-600">
          {formatDiscount(discount)}
        </span>
      ),
      sorter: (a, b) => a.discount - b.discount,
      align: "center",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (description) => (
        <div className="max-w-xs truncate" title={description}>
          {description}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const expired = isExpired(record.expiresAt);
        const finalStatus = expired ? "EXPIRED" : status;
        return (
          <Tag color={getStatusColor(finalStatus)}>
            {getStatusText(finalStatus)}
          </Tag>
        );
      },
      filters: [
        { text: "Hoạt động", value: "ACTIVE" },
        { text: "Tạm dừng", value: "INACTIVE" },
        { text: "Hết hạn", value: "EXPIRED" },
      ],
      onFilter: (value, record) => {
        const expired = isExpired(record.expiresAt);
        const finalStatus = expired ? "EXPIRED" : record.status;
        return finalStatus === value;
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (expiresAt) => (
        <span
          className={isExpired(expiresAt) ? "text-red-500" : "text-gray-600"}
        >
          {dayjs(expiresAt).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
      sorter: (a, b) => dayjs(a.expiresAt).unix() - dayjs(b.expiresAt).unix(),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Xóa mã giảm giá"
            description="Bạn có chắc chắn muốn xóa mã giảm giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-2">
            Quản lý mã giảm giá
          </Title>
          <p className="text-gray-600">
            Quản lý các mã giảm giá cho hệ thống cho thuê xe (xe máy, xe đạp, ô
            tô)
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Thêm mã giảm giá
        </Button>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên mã hoặc mô tả..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Hoạt động:{" "}
              <span className="font-semibold text-green-600">
                {
                  coupons.filter(
                    (c) => c.status === "ACTIVE" && !isExpired(c.expiresAt)
                  ).length
                }
              </span>
            </span>
            <span>
              Tạm dừng:{" "}
              <span className="font-semibold text-yellow-600">
                {coupons.filter((c) => c.status === "INACTIVE").length}
              </span>
            </span>
            <span>
              Hết hạn:{" "}
              <span className="font-semibold text-red-600">
                {coupons.filter((c) => isExpired(c.expiresAt)).length}
              </span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold text-blue-600">
                {filteredCoupons.length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <Table
            columns={columns}
            dataSource={filteredCoupons}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} mã giảm giá`,
            }}
            scroll={{ x: 1000 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Coupon Details/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <GiftOutlined className="text-blue-500 text-xl" />
            <div>
              <div className="font-semibold text-lg">
                {isAddMode ? "Thêm mã giảm giá mới" : "Chi tiết mã giảm giá"}
              </div>
              {selectedCoupon && (
                <div className="text-sm text-gray-500 font-mono">
                  {selectedCoupon.name}
                </div>
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={700}
        className="top-8"
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            {isAddMode ? "Hủy" : "Đóng"}
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            {isAddMode ? "Thêm mới" : "Cập nhật"}
          </Button>,
        ]}
      >
        <div className="pt-4">
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="Tên mã giảm giá"
                rules={[
                  { required: true, message: "Vui lòng nhập tên mã giảm giá!" },
                  { min: 3, message: "Tên mã phải có ít nhất 3 ký tự!" },
                  { max: 20, message: "Tên mã không được quá 20 ký tự!" },
                ]}
              >
                <Input
                  placeholder="VD: MOTORBIKE20"
                  className="font-mono"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>

              <Form.Item
                name="discount"
                label="Mức giảm (%)"
                rules={[
                  { required: true, message: "Vui lòng nhập mức giảm!" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value < 1 || value > 100) {
                        return Promise.reject("Mức giảm phải từ 1% đến 100%!");
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                extra="Nhập % (1-100) cho giảm theo phần trăm"
              >
                <InputNumber
                  placeholder="VD: 20"
                  style={{ width: "100%" }}
                  min={1}
                  max={100}
                  addonAfter="%"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái!" },
                ]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="ACTIVE">
                    <Tag color="success">Hoạt động</Tag>
                  </Option>
                  <Option value="INACTIVE">
                    <Tag color="warning">Tạm dừng</Tag>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="expiresAt"
                label="Ngày hết hạn"
                rules={[
                  { required: true, message: "Vui lòng chọn ngày hết hạn!" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value.isBefore(dayjs())) {
                        return Promise.reject(
                          "Ngày hết hạn phải sau thời điểm hiện tại!"
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Chọn ngày và giờ hết hạn"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[
                { required: true, message: "Vui lòng nhập mô tả!" },
                { min: 10, message: "Mô tả phải có ít nhất 10 ký tự!" },
                { max: 200, message: "Mô tả không được quá 200 ký tự!" },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Mô tả chi tiết về mã giảm giá, điều kiện áp dụng..."
                showCount
                maxLength={200}
              />
            </Form.Item>

            {selectedCoupon && !isAddMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <Form.Item name="createdAt" label="Ngày tạo">
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: "100%" }}
                    disabled={true}
                  />
                </Form.Item>

                <Form.Item name="updatedAt" label="Cập nhật lần cuối">
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: "100%" }}
                    disabled={true}
                  />
                </Form.Item>
              </div>
            )}
          </Form>
        </div>
      </Modal>
    </div>
  );
}

ManageDiscountCodesPage.Layout = AdminLayout;
