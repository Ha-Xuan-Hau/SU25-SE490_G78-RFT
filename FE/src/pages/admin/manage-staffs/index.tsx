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
  Select,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Staff {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  role: "ADMIN" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  department: string;
  position: string;
  salary?: number;
  hireDate: string;
}

// Mockup data cho nhân viên
const mockStaffs: Staff[] = [
  {
    id: "1",
    fullName: "Nguyễn Quản Trị",
    email: "admin@rft.com",
    phone: "0901234567",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    dateOfBirth: "1985-03-15",
    gender: "Nam",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2023-01-15",
    lastLogin: "2024-12-21",
    department: "Quản lý",
    position: "Quản trị viên hệ thống",
    salary: 25000000,
    hireDate: "2023-01-15",
  },
  {
    id: "2",
    fullName: "Trần Thị Mai",
    email: "mai.tran@rft.com",
    phone: "0912345678",
    address: "456 Lê Lợi, Quận 3, TP.HCM",
    dateOfBirth: "1990-08-22",
    gender: "Nữ",
    role: "STAFF",
    status: "ACTIVE",
    createdAt: "2023-03-10",
    lastLogin: "2024-12-20",
    department: "Vận hành",
    position: "Nhân viên vận hành",
    salary: 15000000,
    hireDate: "2023-03-10",
  },
  {
    id: "3",
    fullName: "Lê Văn Hùng",
    email: "hung.le@rft.com",
    phone: "0923456789",
    address: "789 Võ Văn Tần, Quận 10, TP.HCM",
    dateOfBirth: "1992-12-03",
    gender: "Nam",
    role: "STAFF",
    status: "ACTIVE",
    createdAt: "2023-05-20",
    lastLogin: "2024-12-19",
    department: "Kỹ thuật",
    position: "Nhân viên kỹ thuật",
    salary: 18000000,
    hireDate: "2023-05-20",
  },
  {
    id: "4",
    fullName: "Phạm Thị Lan",
    email: "lan.pham@rft.com",
    phone: "0934567890",
    address: "321 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM",
    dateOfBirth: "1988-07-18",
    gender: "Nữ",
    role: "STAFF",
    status: "INACTIVE",
    createdAt: "2023-07-15",
    lastLogin: "2024-11-30",
    department: "Chăm sóc khách hàng",
    position: "Nhân viên CSKH",
    salary: 12000000,
    hireDate: "2023-07-15",
  },
  {
    id: "5",
    fullName: "Võ Minh Tuấn",
    email: "tuan.vo@rft.com",
    phone: "0945678901",
    address: "654 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM",
    dateOfBirth: "1995-03-25",
    gender: "Nam",
    role: "STAFF",
    status: "ACTIVE",
    createdAt: "2024-01-10",
    lastLogin: "2024-12-21",
    department: "Tài chính",
    position: "Nhân viên tài chính",
    salary: 16000000,
    hireDate: "2024-01-10",
  },
];

export default function ManageStaffsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [staffs, setStaffs] = useState<Staff[]>(mockStaffs);

  // Filter staffs based on active tab and search text
  const filteredStaffs = staffs.filter((staff) => {
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "ADMIN" && staff.role === "ADMIN") ||
      (activeTab === "STAFF" && staff.role === "STAFF");

    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.phone.includes(searchText) ||
      staff.department.toLowerCase().includes(searchText.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchText.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const handleViewDetails = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsModalVisible(true);
  };

  const handleToggleStaffStatus = () => {
    if (!selectedStaff) return;

    const newStatus = selectedStaff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    // Update staff status in the list
    setStaffs((prevStaffs) =>
      prevStaffs.map((staff) =>
        staff.id === selectedStaff.id ? { ...staff, status: newStatus } : staff
      )
    );

    // Update selected staff
    setSelectedStaff({ ...selectedStaff, status: newStatus });

    // Close modal
    setIsModalVisible(false);
  };

  const getRoleColor = (role: string) => {
    return role === "ADMIN" ? "red" : "blue";
  };

  const getRoleText = (role: string) => {
    return role === "ADMIN" ? "Quản trị viên" : "Nhân viên";
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "success" : "error";
  };

  const getStatusText = (status: string) => {
    return status === "ACTIVE" ? "Hoạt động" : "Ngưng hoạt động";
  };

  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      "Quản lý": "purple",
      "Vận hành": "blue",
      "Kỹ thuật": "green",
      "Chăm sóc khách hàng": "orange",
      "Tài chính": "cyan",
    };
    return colors[department] || "default";
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return "Chưa cập nhật";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(salary);
  };

  const columns: ColumnsType<Staff> = [
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
        <Avatar
          src={avatar}
          icon={<UserOutlined />}
          size={40}
          style={{
            backgroundColor: record.role === "ADMIN" ? "#ff4d4f" : "#1890ff",
          }}
        />
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
        { text: "Quản trị viên", value: "ADMIN" },
        { text: "Nhân viên", value: "STAFF" },
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
      label: `Tất cả (${staffs.length})`,
    },
    {
      key: "ADMIN",
      label: `Quản trị viên (${
        staffs.filter((s) => s.role === "ADMIN").length
      })`,
    },
    {
      key: "STAFF",
      label: `Nhân viên (${staffs.filter((s) => s.role === "STAFF").length})`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-2">
            Quản lý nhân viên
          </Title>
          <p className="text-gray-600">
            Quản lý thông tin nhân viên và quản trị viên trong hệ thống
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsAddModalVisible(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Thêm nhân viên
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, phòng ban, chức vụ..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Admin:{" "}
              <span className="font-semibold text-red-600">
                {staffs.filter((s) => s.role === "ADMIN").length}
              </span>
            </span>
            <span>
              Staff:{" "}
              <span className="font-semibold text-blue-600">
                {staffs.filter((s) => s.role === "STAFF").length}
              </span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold text-green-600">
                {filteredStaffs.length}
              </span>
            </span>
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
            dataSource={filteredStaffs}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} nhân viên`,
            }}
            scroll={{ x: 1000 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Staff Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <Avatar
              src={selectedStaff?.avatar}
              icon={<UserOutlined />}
              size={40}
              style={{
                backgroundColor:
                  selectedStaff?.role === "ADMIN" ? "#ff4d4f" : "#1890ff",
              }}
            />
            <div>
              <div className="font-semibold text-lg">Chi tiết nhân viên</div>
              <div className="text-sm text-gray-500">
                {selectedStaff?.fullName}
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
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
            danger={selectedStaff?.status === "ACTIVE"}
            onClick={handleToggleStaffStatus}
          >
            {selectedStaff?.status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"}
          </Button>,
        ]}
      >
        {selectedStaff && (
          <div className="pt-4 space-y-6">
            {/* Thông tin cá nhân */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin cá nhân
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedStaff.fullName}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedStaff.email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedStaff.phone}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {new Date(selectedStaff.dateOfBirth).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedStaff.gender}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Tag
                      color={getStatusColor(selectedStaff.status)}
                      className="text-sm"
                    >
                      {getStatusText(selectedStaff.status)}
                    </Tag>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {selectedStaff.address}
                </div>
              </div>
            </div>

            {/* Thông tin công việc */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin công việc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vai trò
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Tag
                      color={getRoleColor(selectedStaff.role)}
                      className="text-sm"
                    >
                      {getRoleText(selectedStaff.role)}
                    </Tag>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chức vụ
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedStaff.position}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức lương
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                    {formatSalary(selectedStaff.salary)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày vào làm
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {new Date(selectedStaff.hireDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lần đăng nhập cuối
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {selectedStaff.lastLogin
                      ? new Date(selectedStaff.lastLogin).toLocaleString(
                          "vi-VN"
                        )
                      : "Chưa đăng nhập"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Staff Modal - Placeholder */}
      <Modal
        title="Thêm nhân viên mới"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary">
            Thêm nhân viên
          </Button>,
        ]}
      >
        <div className="py-4">
          <p className="text-gray-500 text-center">
            Form thêm nhân viên sẽ được triển khai ở đây...
          </p>
        </div>
      </Modal>
    </div>
  );
}

ManageStaffsPage.Layout = AdminLayout;
