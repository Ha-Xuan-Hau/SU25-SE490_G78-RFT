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
  InputNumber,
} from "antd";
import { EyeOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import {
  getUsers,
  updateUserStatus,
  getUserDetail,
  searchUsersByName,
  searchUsersByEmail,
} from "@/apis/admin.api";
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
  status: "ACTIVE" | "INACTIVE";
  profilePicture: string; // Avatar
  createdAt: number[]; // Ngày tạo
  updatedAt: number[]; // Ngày sửa đổi
  totalBookings: number; // Tổng số booking
  completedBookings: number; // Số booking đã hoàn thành
  cancelledBookings: number; // Số booking đã hủy
  averageRating: number; // Đánh giá trung bình
  totalRatings: number; // Tổng số đánh giá
  walletBalance: number; // Số dư ví
  bankName: string; // Ngân hàng
  cardNumber: string; // Số thẻ
  cardHolderName: string; // Tên trên thẻ
}

export default function ManageUserPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("USER");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false); // Modal xác nhận
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("name"); // Trạng thái cho loại tìm kiếm
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(0); // Trạng thái cho trang hiện tại
  const [form] = Form.useForm(); // Khởi tạo form

  const fetchUsers = async (page = 0, search = "") => {
    setLoading(true);
    try {
      const response = await getUsers({ page, size: 10, name: search }); // Gọi API với tham số cần thiết
      setUsers(response.users);
      setCurrentPage(response.currentPage); // Cập nhật trang hiện tại
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchText); // Gọi hàm fetch với tham số tìm kiếm
  }, [currentPage, searchText]); // Gọi lại khi currentPage hoặc searchText thay đổi

  const handleSearch = async (value: string) => {
    setSearchText(value);
    setCurrentPage(0); // Reset về trang đầu khi tìm kiếm

    // Nếu không có giá trị tìm kiếm, gọi lại fetchUsers
    if (value.trim() === "") {
      fetchUsers(0, ""); // Lấy lại danh sách người dùng
      return;
    }

    // Gọi API tìm kiếm theo loại đã chọn
    try {
      let response;
      if (searchType === "name") {
        response = await searchUsersByName(value, currentPage, 10);
      } else if (searchType === "email") {
        response = await searchUsersByEmail(value, currentPage, 10);
      }

      setUsers(response.users); // Cập nhật danh sách người dùng
    } catch (error) {
      console.error(error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesTab =
      // activeTab === "ALL" ||
      (activeTab === "USER" && user.role === "USER") ||
      (activeTab === "PROVIDER" && user.role === "PROVIDER");

    return matchesTab; // Chỉ cần kiểm tra tab
  });

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);

    // Gọi API để lấy thông tin chi tiết người dùng
    try {
      const userDetail = await getUserDetail(user.id);
      setSelectedUser(userDetail); // Cập nhật thông tin người dùng chi tiết
      form.setFieldsValue({
        // Thiết lập giá trị cho form
        cardName: userDetail.cardName,
        bankName: userDetail.bankName,
        cardHolderName: userDetail.cardHolderName,
        walletBalance: userDetail.walletBalance,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleUserStatus = () => {
    if (!selectedUser) return;

    // Hiển thị modal xác nhận
    setIsConfirmModalVisible(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!selectedUser) return;

    const newStatus = selectedUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await updateUserStatus(selectedUser.id, newStatus);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id ? { ...user, status: newStatus } : user
        )
      );
      setSelectedUser({ ...selectedUser, status: newStatus });
    } catch (error) {
      console.error(error);
    }

    // Đóng modal xác nhận
    setIsConfirmModalVisible(false);
    setIsModalVisible(false); // Đóng modal chi tiết người dùng
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1); // Cập nhật currentPage khi chuyển trang
  };

  const getRoleColor = (role: string) => {
    return role === "PROVIDER" ? "green" : "blue";
  };

  const getRoleText = (role: string) => {
    return role === "PROVIDER" ? "Nhà cung cấp" : "Người dùng";
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "success" : "error";
  };

  const getStatusText = (status: string) => {
    return status === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động";
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
      render: (_, __, index) => index + 1 + currentPage * 10, // Cập nhật chỉ số STT dựa theo trang hiện tại
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
      filters: [
        { text: "Hoạt động", value: "ACTIVE" },
        { text: "Ngưng hoạt động", value: "INACTIVE" },
      ],
      onFilter: (value, record) => record.status === value,
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
    // {
    //   key: "ALL",
    //   label: `Tất cả (${users.length})`,
    // },
    {
      key: "USER",
      label: `Người dùng (${users.filter((u) => u.role === "USER").length})`,
    },
    {
      key: "PROVIDER",
      label: `Nhà cung cấp (${
        users.filter((u) => u.role === "PROVIDER").length
      })`,
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md flex items-center">
            <Select
              defaultValue="name"
              onChange={(value) => setSearchType(value)} // Thay đổi loại tìm kiếm
              style={{ width: 120, marginRight: 10 }}
            >
              <Option value="name">Tên</Option>
              <Option value="email">Email</Option>
            </Select>
            <Search
              placeholder="Tìm kiếm theo tên, email"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="px-6 pt-4"
        />

        <div className="px-6 pb-6">
          <Table
            columns={columns}
            dataSource={filteredUsers}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage + 1, // Hiển thị trang hiện tại
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              total: users.length, // Tổng số người dùng
              onChange: handlePageChange, // Gọi hàm khi chuyển trang
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} người dùng`,
            }}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Avatar
              src={selectedUser?.profilePicture} // Hiển thị avatar từ response
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
          <Button
            key="toggle"
            type="primary"
            danger={selectedUser?.status === "ACTIVE"}
            size="large"
            onClick={handleToggleUserStatus}
          >
            {selectedUser?.status === "ACTIVE"
              ? "Vô hiệu hóa người dùng"
              : "Kích hoạt người dùng"}
          </Button>,
        ]}
      >
        {selectedUser && (
          <div className="pt-4 space-y-6">
            {/* Mục 1: Thông tin cá nhân */}
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

            {/* Mục 2: Thông tin ví RFT */}
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

      {/* Modal xác nhận chuyển trạng thái người dùng */}
      <Modal
        title="Xác nhận thay đổi trạng thái người dùng"
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsConfirmModalVisible(false)}>
            Quay lại
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={confirmToggleUserStatus}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn{" "}
          {selectedUser?.status === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt"}{" "}
          người dùng <strong>{selectedUser?.fullName}</strong>?
        </p>
        {selectedUser?.status === "ACTIVE" && (
          <div style={{ color: "#d4380d", marginTop: 12, fontWeight: 500 }}>
            Hành động này sẽ vô hiệu hóa người dùng khỏi hệ thống ngay lập tức
            và không thể đăng nhập, sử dụng các chức năng cho đến khi được kích
            hoạt lại!
          </div>
        )}
      </Modal>
    </div>
  );
}

ManageUserPage.Layout = AdminLayout;
