"use client";

import { useState } from "react";
import {
  Typography,
  Spin,
  Avatar,
  Table,
  Tabs,
  Button,
  Modal,
  Tag,
  Space,
  Input,
} from "antd";
import { EyeOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;
const { Search } = Input;

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  role: "USER" | "PROVIDER";
  status: "ACTIVE" | "INACTIVE";
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

// Mockup data
const mockUsers: User[] = [
  {
    id: "1",
    fullName: "Nguyễn Văn An",
    email: "nguyenvanan@gmail.com",
    phone: "0901234567",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    dateOfBirth: "1990-05-15",
    gender: "Nam",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2024-01-15",
    lastLogin: "2024-12-20",
  },
  {
    id: "2",
    fullName: "Trần Thị Bình",
    email: "tranthibinh@gmail.com",
    phone: "0912345678",
    address: "456 Lê Lợi, Quận 3, TP.HCM",
    dateOfBirth: "1985-08-22",
    gender: "Nữ",
    role: "PROVIDER",
    status: "ACTIVE",
    createdAt: "2024-02-10",
    lastLogin: "2024-12-19",
  },
  {
    id: "3",
    fullName: "Lê Minh Cường",
    email: "leminhcuong@gmail.com",
    phone: "0923456789",
    address: "789 Võ Văn Tần, Quận 10, TP.HCM",
    dateOfBirth: "1992-12-03",
    gender: "Nam",
    role: "USER",
    status: "INACTIVE",
    createdAt: "2024-03-05",
    lastLogin: "2024-11-15",
  },
  {
    id: "4",
    fullName: "Phạm Thu Hà",
    email: "phamthuha@gmail.com",
    phone: "0934567890",
    address: "321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM",
    dateOfBirth: "1988-07-18",
    gender: "Nữ",
    role: "PROVIDER",
    status: "ACTIVE",
    createdAt: "2024-01-20",
    lastLogin: "2024-12-18",
  },
  {
    id: "5",
    fullName: "Hoàng Đức Minh",
    email: "hoangducminh@gmail.com",
    phone: "0945678901",
    address: "654 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM",
    dateOfBirth: "1995-03-25",
    gender: "Nam",
    role: "USER",
    status: "ACTIVE",
    createdAt: "2024-04-12",
    lastLogin: "2024-12-21",
  },
  {
    id: "6",
    fullName: "Võ Thị Lan",
    email: "vothilan@gmail.com",
    phone: "0956789012",
    address: "987 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    dateOfBirth: "1993-11-08",
    gender: "Nữ",
    role: "PROVIDER",
    status: "INACTIVE",
    createdAt: "2024-02-28",
    lastLogin: "2024-10-30",
  },
];

export default function ManageUserPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<User[]>(mockUsers);

  // Filter users based on active tab and search text
  const filteredUsers = users.filter((user) => {
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "USER" && user.role === "USER") ||
      (activeTab === "PROVIDER" && user.role === "PROVIDER");

    const matchesSearch =
      user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.phone.includes(searchText);

    return matchesTab && matchesSearch;
  });

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleToggleUserStatus = () => {
    if (!selectedUser) return;

    const newStatus = selectedUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // Update user status in the list
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === selectedUser.id ? { ...user, status: newStatus } : user
      )
    );

    // Update selected user
    setSelectedUser({ ...selectedUser, status: newStatus });

    // Close modal
    setIsModalVisible(false);
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

  const columns: ColumnsType<User> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 80,
      render: (avatar, record) => (
        <Avatar src={avatar} icon={<UserOutlined />} size={40} />
      ),
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
      filters: [
        { text: "Người dùng", value: "USER" },
        { text: "Nhà cung cấp", value: "PROVIDER" },
      ],
      onFilter: (value, record) => record.role === value,
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
      key: "ALL",
      label: `Tất cả (${users.length})`,
    },
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

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500">
            Tổng cộng:{" "}
            <span className="font-semibold text-blue-600">
              {filteredUsers.length}
            </span>{" "}
            người dùng
          </div>
        </div>
      </div>

      {/* Tabs and Table */}
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
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} người dùng`,
            }}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      {/* User Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Avatar
              src={selectedUser?.avatar}
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
            size="large"
            danger={selectedUser?.status === "ACTIVE"}
            onClick={handleToggleUserStatus}
          >
            {selectedUser?.status === "ACTIVE"
              ? "Ẩn người dùng"
              : "Kích hoạt người dùng"}
          </Button>,
        ]}
      >
        {selectedUser && (
          <div className="pt-4 space-y-6">
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
                  {new Date(selectedUser.dateOfBirth).toLocaleDateString(
                    "vi-VN"
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedUser.gender}
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
                  {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                {selectedUser.address}
              </div>
            </div>

            {selectedUser.lastLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lần chỉnh sửa cuối
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(selectedUser.lastLogin).toLocaleString("vi-VN")}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

ManageUserPage.Layout = AdminLayout;
