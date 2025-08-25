"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Avatar,
  Table,
  Tabs,
  Button,
  Modal,
  Tag,
  Input,
  Select,
  Form,
  Space,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  MailOutlined,
  LockOutlined,
  UserAddOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import {
  getUsers,
  updateUserStatus,
  getUserDetail,
  createStaff,
} from "@/apis/admin.api";
import { sendOtpRegister } from "@/apis/auth.api";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: number[];
  role: "ADMIN" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
  profilePicture: string;
  createdAt: number[];
  updatedAt: number[];
}

interface UserResponse {
  users: User[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface CreateStaffFormValues {
  email: string;
  fullName: string;
  password: string;
  otp: string;
}

export default function ManageStaffPage() {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  // Search states
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchStatus, setSearchStatus] = useState<User["status"] | undefined>(
    undefined
  );

  // Data state
  const [currentData, setCurrentData] = useState<UserResponse>({
    users: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  });

  const [form] = Form.useForm();

  // States cho form tạo nhân viên
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm<CreateStaffFormValues>();
  const [createLoading, setCreateLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Fetch data với filters
  const fetchData = async (
    page = 0,
    name?: string,
    email?: string,
    status?: User["status"]
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size: 10,
        role: "STAFF", // Chỉ lấy STAFF
        sortBy: "createdAt",
        sortDirection: "DESC",
      };

      // Add filters if provided
      if (name && name.trim()) params.name = name.trim();
      if (email && email.trim()) params.email = email.trim();
      if (status) params.status = status;

      const response: UserResponse = await getUsers(params);
      setCurrentData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
      showApiError(error, "Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData(0);
  }, []);

  // Countdown cho OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle search
  const handleSearch = () => {
    // Reset to page 0 when searching
    fetchData(0, searchName, searchEmail, searchStatus);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchStatus(undefined);
    fetchData(0);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchData(page - 1, searchName, searchEmail, searchStatus);
  };

  // Xử lý gửi OTP
  const handleSendOtp = async () => {
    const email = createForm.getFieldValue("email");

    if (!email) {
      showApiError(null, "Vui lòng nhập email trước khi gửi OTP");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showApiError(null, "Email không hợp lệ");
      return;
    }

    setOtpLoading(true);
    try {
      await sendOtpRegister(email);
      showApiSuccess("Mã OTP đã được gửi đến email");
      setOtpSent(true);
      setOtpCountdown(60);
    } catch (error) {
      showApiError(error, "Không thể gửi OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // Xử lý tạo nhân viên
  const handleCreateStaff = async (values: CreateStaffFormValues) => {
    setCreateLoading(true);
    try {
      await createStaff({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
        otp: values.otp,
      });

      showApiSuccess("Tạo tài khoản nhân viên thành công");
      setIsCreateModalVisible(false);
      createForm.resetFields();
      setOtpSent(false);
      setOtpCountdown(0);

      // Refresh danh sách
      await fetchData(0, searchName, searchEmail, searchStatus);
    } catch (error) {
      showApiError(error, "Không thể tạo tài khoản nhân viên");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);

    try {
      const userDetail = await getUserDetail(user.id);
      setSelectedUser(userDetail);
    } catch (error) {
      showApiError(error, "Không thể tải chi tiết người dùng");
    }
  };

  const handleToggleUserStatus = () => {
    if (!selectedUser) return;
    setIsConfirmModalVisible(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!selectedUser) return;

    // Khai báo type rõ ràng
    const newStatus: "ACTIVE" | "INACTIVE" =
      selectedUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await updateUserStatus(selectedUser.id, newStatus);

      // Update local state
      const updatedUsers = currentData.users.map((user) =>
        user.id === selectedUser.id ? { ...user, status: newStatus } : user
      );

      setCurrentData({
        ...currentData,
        users: updatedUsers,
      });

      setSelectedUser({ ...selectedUser, status: newStatus });
      showApiSuccess("Cập nhật trạng thái thành công");
    } catch (error) {
      showApiError(error, "Không thể cập nhật trạng thái");
    }

    setIsConfirmModalVisible(false);
    setIsModalVisible(false);
  };

  // Helper functions
  const getRoleColor = (role: string) => (role === "ADMIN" ? "red" : "blue");
  const getRoleText = (role: string) =>
    role === "STAFF" ? "Nhân viên" : "Quản trị viên";
  const getStatusColor = (status: string) =>
    status === "ACTIVE" ? "success" : "error";
  const getStatusText = (status: string) =>
    status === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động";

  const formatDOB = (dateArray: number[] | undefined | null): string => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 3)
      return "N/A";
    const [year, month, day] = dateArray;
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  };

  const formatTimestamp = (
    timestamp: number | string | number[] | undefined | null
  ): string => {
    if (!timestamp) return "";
    if (Array.isArray(timestamp) && timestamp.length >= 5) {
      const [year, month, day, hour, minute] = timestamp;
      return `${day.toString().padStart(2, "0")}/${month
        .toString()
        .padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    }
    return "";
  };

  const columns: ColumnsType<User> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1 + currentData.currentPage * 10,
      align: "center",
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "Chưa cập nhật",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      align: "center",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record)}
        >
          Chi tiết
        </Button>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Quản lý nhân viên
        </Title>
        <p className="text-gray-600">
          Quản lý thông tin nhân viên trong hệ thống
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              Tìm kiếm và lọc
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setIsCreateModalVisible(true);
                setOtpSent(false);
                setOtpCountdown(0);
              }}
            >
              Tạo nhân viên mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Tìm theo tên..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              size="large"
            />

            <Input
              placeholder="Tìm theo email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              size="large"
            />

            <Select
              placeholder="Lọc theo trạng thái"
              value={searchStatus}
              onChange={setSearchStatus}
              allowClear
              size="large"
              style={{ width: "100%" }}
            >
              <Option value="ACTIVE">Hoạt động</Option>
              <Option value="INACTIVE">Ngưng hoạt động</Option>
            </Select>

            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                size="large"
              >
                Tìm kiếm
              </Button>

              <Button onClick={handleClearSearch} size="large">
                Xóa lọc
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 pt-4">
          <div className="text-lg font-medium">
            Danh sách nhân viên ({currentData.totalElements})
          </div>
        </div>

        <div className="px-6 pb-6">
          <Table
            columns={columns}
            dataSource={currentData.users}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentData.currentPage + 1,
              pageSize: currentData.pageSize,
              total: currentData.totalElements,
              showSizeChanger: false, // ✅ Tắt option chọn số lượng/trang
              showQuickJumper: false, // ✅ Tắt ô nhập số trang (optional)
              onChange: handlePageChange,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} nhân viên`,
            }}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Modal tạo nhân viên mới */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserAddOutlined className="text-blue-500" />
            <span>Tạo tài khoản nhân viên mới</span>
          </div>
        }
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
          setOtpSent(false);
          setOtpCountdown(0);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateStaff}
          className="mt-4"
          autoComplete="off" // Thêm dòng này
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
              { min: 3, message: "Họ tên phải có ít nhất 3 ký tự" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Nhập họ và tên nhân viên"
              size="large"
              autoComplete="off" // Thêm dòng này
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Nhập email nhân viên"
              size="large"
              disabled={otpSent}
              autoComplete="new-email" // Dùng giá trị đặc biệt
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                message:
                  "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              size="large"
              autoComplete="new-password" // Dùng giá trị đặc biệt
            />
          </Form.Item>

          <Form.Item label="Mã OTP" required>
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="otp"
                noStyle
                rules={[
                  { required: true, message: "Vui lòng nhập mã OTP" },
                  { len: 6, message: "Mã OTP phải có 6 số" },
                  { pattern: /^\d{6}$/, message: "Mã OTP chỉ chứa số" },
                ]}
              >
                <Input
                  prefix={<SafetyOutlined />}
                  placeholder="Nhập mã OTP 6 số"
                  size="large"
                  style={{ width: "calc(100% - 120px)" }}
                  maxLength={6}
                  autoComplete="off" // Thêm dòng này
                />
              </Form.Item>
              <Button
                type="primary"
                size="large"
                onClick={handleSendOtp}
                loading={otpLoading}
                disabled={otpCountdown > 0}
                style={{ width: "120px" }}
              >
                {otpCountdown > 0 ? `${otpCountdown}s` : "Gửi OTP"}
              </Button>
            </Space.Compact>
            {otpSent && (
              <div className="text-green-600 text-sm mt-2">
                Mã OTP đã được gửi đến email. Vui lòng kiểm tra hộp thư (có thể
                trong mục spam).
              </div>
            )}
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex gap-3 justify-end">
              <Button
                size="large"
                onClick={() => {
                  setIsCreateModalVisible(false);
                  createForm.resetFields();
                  setOtpSent(false);
                  setOtpCountdown(0);
                }}
              >
                Đóng
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={createLoading}
                icon={<UserAddOutlined />}
              >
                Tạo tài khoản
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết người dùng */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Avatar
              src={selectedUser?.profilePicture}
              icon={<UserOutlined />}
              size={40}
            />
            <div>
              <div className="font-semibold text-lg">Chi tiết nhân viên</div>
              <div className="text-sm text-gray-500">
                {selectedUser?.fullName}
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        className="top-8"
        footer={[
          <Button
            key="close"
            size="large"
            onClick={() => setIsModalVisible(false)}
          >
            Đóng
          </Button>,
          selectedUser?.role === "STAFF" && (
            <Button
              key="toggle"
              type="primary"
              size="large"
              onClick={handleToggleUserStatus}
            >
              {selectedUser?.status === "ACTIVE"
                ? "Vô hiệu hóa nhân viên"
                : "Kích hoạt nhân viên"}
            </Button>
          ),
        ]}
      >
        {selectedUser && (
          <div className="pt-4 space-y-6">
            <Title level={4}>Thông tin cá nhân</Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedUser.fullName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedUser.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedUser.phone || "Chưa cập nhật"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedUser.address || "Chưa cập nhật"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {formatDOB(selectedUser.dateOfBirth)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Tag
                    color={getRoleColor(selectedUser.role)}
                    className="text-sm"
                  >
                    {getRoleText(selectedUser.role)}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Tag
                    color={getStatusColor(selectedUser.status)}
                    className="text-sm"
                  >
                    {getStatusText(selectedUser.status)}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tạo
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {formatTimestamp(selectedUser.createdAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sửa đổi cuối
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {formatTimestamp(selectedUser.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận chuyển trạng thái nhân viên */}
      <Modal
        title="Xác nhận thay đổi trạng thái nhân viên"
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger={selectedUser?.status === "ACTIVE"}
            onClick={confirmToggleUserStatus}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn{" "}
          {selectedUser?.status === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt"} nhân
          viên <strong>{selectedUser?.fullName}</strong>?
        </p>
        {selectedUser?.status === "ACTIVE" && (
          <div style={{ color: "#d4380d", marginTop: 12, fontWeight: 500 }}>
            Nhân viên sẽ không thể đăng nhập và sử dụng hệ thống cho đến khi
            được kích hoạt lại!
          </div>
        )}
      </Modal>
    </div>
  );
}

ManageStaffPage.Layout = AdminLayout;
