"use client";

import { useEffect, useState } from "react";
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
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  PlusOutlined,
  GiftOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "@/utils/dayjs";
import { showApiError, showError, showSuccess } from "@/utils/toast.utils";
import { coupon as Coupon, couponRequest } from "@/types/userCoupon";
import { getAllCoupons, updateCoupon, createCoupon } from "@/apis/coupon.api";
import { translateENtoVI } from "@/lib/viDictionary";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function ManageDiscountCodesPage() {
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [form] = Form.useForm();

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await getAllCoupons(); // Lấy tất cả coupon
      setCoupons(response); // Cập nhật danh sách coupon
    } catch (error) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons(); // Gọi hàm fetch khi component được mount
  }, []);

  // Filter coupons based on search text
  const filteredCoupons = coupons.filter((coupon) => {
    const searchLower = searchText.toLowerCase();
    return (
      coupon.name.toLowerCase().includes(searchLower) ||
      coupon.description.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsAddMode(false);
    setIsModalVisible(true);

    // Set form values
    form.setFieldsValue({
      name: coupon.name,
      discount: coupon.discount,
      description: coupon.description,
      status: coupon.status, // Giữ nguyên trạng thái
      timeExpired: dayjs(coupon.timeExpired),
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
          timeExpired: dayjs(values.timeExpired).format("YYYY-MM-DDTHH:mm:ss"),
          updatedAt: dayjs(values.updatedAt).format("YYYY-MM-DDTHH:mm:ss"),
        };

        await updateCoupon(selectedCoupon.id, updatedCoupon); // Gọi API cập nhật
        setCoupons((prev) =>
          prev.map((coupon) =>
            coupon.id === selectedCoupon.id ? updatedCoupon : coupon
          )
        );

        showSuccess("Cập nhật mã giảm giá thành công!");
      } else {
        // Add new coupon
        const newCoupon: couponRequest = {
          name: values.name.toUpperCase(),
          discount: values.discount,
          description: values.description,
          timeExpired: dayjs(values.timeExpired).format("YYYY-MM-DDTHH:mm:ss"),
        };

        const created = await createCoupon(newCoupon);
        setCoupons((prev) => [created, ...prev]);
        showSuccess("Thêm mã giảm giá thành công!");
      }
      setIsModalVisible(false);
    } catch (error: any) {
      // showError("Có lỗi xảy ra, vui lòng thử lại!");
      showApiError(error);
      //console.error("Validation failed:", error)
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsAddMode(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
        return "success";
      case "EXPIRED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    return translateENtoVI(status); // Dịch trạng thái sang tiếng Việt
  };

  const formatDiscount = (discount: number) => {
    return `${discount}%`;
  };

  const isExpired = (timeExpired: string) => {
    return dayjs(timeExpired).isBefore(dayjs());
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
        const expired = isExpired(record.timeExpired);
        const finalStatus = expired ? "EXPIRED" : status;
        return (
          <Tag color={getStatusColor(finalStatus)}>
            {getStatusText(finalStatus)}
          </Tag>
        );
      },
      filters: [
        { text: "Còn hiệu lực", value: "VALID" },
        { text: "Hết hạn", value: "EXPIRED" },
      ],
      onFilter: (value, record) => {
        const expired = isExpired(record.timeExpired);
        const finalStatus = expired ? "EXPIRED" : record.status;
        return finalStatus === value;
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "timeExpired",
      key: "timeExpired",
      render: (timeExpired) => (
        <span
          className={isExpired(timeExpired) ? "text-red-500" : "text-gray-600"}
        >
          {dayjs(timeExpired).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
      sorter: (a, b) =>
        dayjs(a.timeExpired).unix() - dayjs(b.timeExpired).unix(),
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
          {/* <Popconfirm
            title="Xóa mã giảm giá"
            description="Bạn có chắc chắn muốn xóa mã giảm giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm> */}
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

              {/* <Form.Item
                name="status"
                label="Trạng thái"
                rules={[
                  { required: true, message: "Vui lòng chọn trạng thái!" },
                ]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Option value="ACTIVE">Hoạt động</Option>
                  <Option value="INACTIVE">Tạm dừng</Option>
                </Select>
              </Form.Item> */}

              <Form.Item
                name="timeExpired"
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
              <Input.TextArea
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
