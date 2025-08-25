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
import { EyeOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import { getUsers, updateUserStatus, getUserDetail } from "@/apis/admin.api";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: number[];
  role: "USER" | "PROVIDER";
  status: "ACTIVE" | "INACTIVE" | "TEMP_BAN";
  profilePicture: string;
  createdAt: number[];
  updatedAt: number[];
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageRating: number;
  totalRatings: number;
  walletBalance: number;
  bankName: string;
  cardNumber: string;
  cardHolderName: string;
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

export default function ManageUserPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"USER" | "PROVIDER">("USER");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  // Search states
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchStatus, setSearchStatus] = useState<User["status"] | undefined>(
    undefined
  );

  // Data states
  const [currentData, setCurrentData] = useState<UserResponse>({
    users: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  });

  // Tab totals
  const [userTotal, setUserTotal] = useState(0);
  const [providerTotal, setProviderTotal] = useState(0);

  const [form] = Form.useForm();

  // Fetch data với filters
  const fetchData = async (
    page = 0,
    role?: "USER" | "PROVIDER",
    name?: string,
    email?: string,
    status?: User["status"]
  ) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size: 10,
        sortBy: "createdAt",
        sortDirection: "DESC",
      };

      // Add filters if provided
      if (role) params.role = role;
      if (name && name.trim()) params.name = name.trim();
      if (email && email.trim()) params.email = email.trim();
      if (status) params.status = status;

      const response: UserResponse = await getUsers(params);
      setCurrentData(response);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch totals cho mỗi tab
  const fetchTabTotals = async () => {
    try {
      // Fetch USER total
      const userResponse = await getUsers({
        page: 0,
        size: 1,
        role: "USER",
      });
      setUserTotal(userResponse.totalElements);

      // Fetch PROVIDER total
      const providerResponse = await getUsers({
        page: 0,
        size: 1,
        role: "PROVIDER",
      });
      setProviderTotal(providerResponse.totalElements);
    } catch (error) {
      console.error("Error fetching tab totals:", error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTabTotals();
    fetchData(0, activeTab, searchName, searchEmail, searchStatus);
  }, []);

  // Handle tab change
  const handleTabChange = (key: string) => {
    const newTab = key as "USER" | "PROVIDER";
    setActiveTab(newTab);
    // Reset to page 0 when changing tab
    fetchData(0, newTab, searchName, searchEmail, searchStatus);
  };

  // Handle search
  const handleSearch = () => {
    // Reset to page 0 when searching
    fetchData(0, activeTab, searchName, searchEmail, searchStatus);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchName("");
    setSearchEmail("");
    setSearchStatus(undefined);
    fetchData(0, activeTab);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchData(page - 1, activeTab, searchName, searchEmail, searchStatus);
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);

    try {
      const userDetail = await getUserDetail(user.id);
      setSelectedUser(userDetail);
      form.setFieldsValue({
        cardName: userDetail.cardName,
        bankName: userDetail.bankName,
        cardHolderName: userDetail.cardHolderName,
        walletBalance: userDetail.walletBalance,
      });
    } catch (error) {
      console.error("Error fetching user detail:", error);
    }
  };

  const handleToggleUserStatus = () => {
    if (!selectedUser) return;
    setIsConfirmModalVisible(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!selectedUser) return;

    // Khai báo type rõ ràng từ đầu
    const newStatus: "ACTIVE" | "INACTIVE" =
      selectedUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await updateUserStatus(selectedUser.id, newStatus);

      // Bây giờ TypeScript sẽ hiểu type đúng
      const updatedUsers = currentData.users.map((user) =>
        user.id === selectedUser.id ? { ...user, status: newStatus } : user
      );

      setCurrentData({
        ...currentData,
        users: updatedUsers,
      });

      setSelectedUser({ ...selectedUser, status: newStatus });
    } catch (error) {
      console.error("Error updating user status:", error);
    }

    setIsConfirmModalVisible(false);
    setIsModalVisible(false);
  };

  const getRoleColor = (role: string) => {
    return role === "PROVIDER" ? "green" : "blue";
  };

  const getRoleText = (role: string) => {
    return role === "PROVIDER" ? "Nhà cung cấp" : "Người dùng";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "error";
      case "TEMP_BAN":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "INACTIVE":
        return "Ngưng hoạt động";
      case "TEMP_BAN":
        return "Tạm khóa";
      default:
        return status;
    }
  };

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

    if (typeof timestamp === "number" || typeof timestamp === "string") {
      const date = new Date(
        typeof timestamp === "number" ? timestamp * 1000 : timestamp
      );
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()} ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
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

  const tabItems = [
    {
      key: "USER",
      label: `Người dùng (${userTotal})`,
    },
    {
      key: "PROVIDER",
      label: `Nhà cung cấp (${providerTotal})`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Quản lý người dùng
        </Title>
        <p className="text-gray-600">
          Quản lý thông tin người dùng và nhà cung cấp trong hệ thống
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Tìm kiếm và lọc
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
              <Option value="TEMP_BAN">Tạm khóa</Option>
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
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="px-6 pt-4"
        />

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
                `${range[0]}-${range[1]} của ${total} ${
                  activeTab === "USER" ? "người dùng" : "nhà cung cấp"
                }`,
            }}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Modal chi tiết - giữ nguyên code cũ */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Avatar
              src={selectedUser?.profilePicture}
              icon={<UserOutlined />}
              size={40}
            />
            <div>
              <div className="font-semibold text-lg">Chi tiết người dùng</div>
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
          ...(selectedUser?.status === "TEMP_BAN"
            ? [
                <Button
                  key="toggle"
                  type="primary"
                  danger
                  size="large"
                  onClick={handleToggleUserStatus}
                >
                  Vô hiệu hóa người dùng
                </Button>,
              ]
            : []),
        ]}
      >
        {selectedUser && (
          <div className="pt-4 space-y-6">
            {/* Thông tin cá nhân */}
            <div className="border-b pb-4 mb-4">
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
                    {selectedUser.phone}
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

            {/* Thông tin ví RFT */}
            <div>
              <Title level={4}>Thông tin ví RFT</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã số thẻ
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedUser.cardNumber || "Chưa có"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngân hàng
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedUser.bankName || "Chưa có"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên trên thẻ
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedUser.cardHolderName || "Chưa có"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số dư
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedUser.walletBalance.toLocaleString("vi-VN")} VNĐ
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal xác nhận */}
      <Modal
        title="Xác nhận vô hiệu hóa người dùng"
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalVisible(false)}>
            Quay lại
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmToggleUserStatus}
          >
            Xác nhận vô hiệu hóa
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn vô hiệu hóa người dùng{" "}
          <strong>{selectedUser?.fullName}</strong>?
        </p>
        <div style={{ color: "#d4380d", marginTop: 12, fontWeight: 500 }}>
          Hành động này sẽ vô hiệu hóa người dùng khỏi hệ thống ngay lập tức và
          không thể đăng nhập, sử dụng các chức năng cho đến khi được kích hoạt
          lại!
        </div>
      </Modal>
    </div>
  );
}

ManageUserPage.Layout = AdminLayout;
