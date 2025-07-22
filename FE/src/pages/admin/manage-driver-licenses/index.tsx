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
  Select,
  Image,
  Avatar,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  IdcardOutlined,
  UserOutlined,
  MailOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/utils/toast.utils";
import { DriverLicense } from "@/types/driverLicense";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Mockup data cho bằng lái xe
const mockLicenses: DriverLicense[] = [
  {
    id: "1",
    userId: "1",
    email: "nguyenvanan@gmail.com",
    userName: "Nguyễn Văn An",
    licenseNumber: "012345678901",
    class: "B2",
    status: "VALID",
    image:
      "https://via.placeholder.com/400x250/4CAF50/FFFFFF?text=B%E1%BA%B1ng+L%C3%A1i+Xe+B2",
    createdAt: "2024-01-15T08:30:00Z",
    updatedAt: "2024-01-15T08:30:00Z",
  },
  {
    id: "2",
    userId: "2",
    email: "tranthibinh@gmail.com",
    userName: "Trần Thị Bình",
    licenseNumber: "012345678902",
    class: "A1",
    status: "VALID",
    image:
      "https://via.placeholder.com/400x250/2196F3/FFFFFF?text=B%E1%BA%B1ng+L%C3%A1i+Xe+A1",
    createdAt: "2024-02-10T09:15:00Z",
    updatedAt: "2024-02-10T09:15:00Z",
  },
  {
    id: "3",
    userId: "3",
    email: "leminhcuong@gmail.com",
    userName: "Lê Minh Cường",
    licenseNumber: "012345678903",
    class: "A2",
    status: "INVALID",
    image:
      "https://via.placeholder.com/400x250/FF9800/FFFFFF?text=B%E1%BA%B1ng+L%C3%A1i+Xe+A2",
    createdAt: "2024-03-05T14:20:00Z",
    updatedAt: "2024-03-20T10:45:00Z",
  },
  {
    id: "4",
    userId: "4",
    email: "phamthuha@gmail.com",
    userName: "Phạm Thu Hà",
    licenseNumber: "012345678904",
    class: "B1",
    status: "VALID",
    image:
      "https://via.placeholder.com/400x250/9C27B0/FFFFFF?text=B%E1%BA%B1ng+L%C3%A1i+Xe+B1",
    createdAt: "2024-04-12T16:30:00Z",
    updatedAt: "2024-04-12T16:30:00Z",
  },
  {
    id: "5",
    userId: "5",
    email: "hoangducminh@gmail.com",
    userName: "Hoàng Đức Minh",
    licenseNumber: "012345678905",
    class: "C",
    status: "VALID",
    image:
      "https://via.placeholder.com/400x250/607D8B/FFFFFF?text=B%E1%BA%B1ng+L%C3%A1i+Xe+C",
    createdAt: "2024-05-18T11:00:00Z",
    updatedAt: "2024-05-18T11:00:00Z",
  },
  {
    id: "6",
    userId: "5",
    email: "vothilan@gmail.com",
    userName: "Võ Thị Lan",
    licenseNumber: "012345678906",
    class: "A1",
    status: "INVALID",
    image:
      "https://via.placeholder.com/400x250/F44336/FFFFFF?text=B%E1%BA%B1ng+L%C3%A1i+Xe+A1",
    createdAt: "2024-06-22T13:45:00Z",
    updatedAt: "2024-07-01T09:20:00Z",
  },
];

export default function ManageLicensesPage() {
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<DriverLicense[]>(mockLicenses);
  const [searchText, setSearchText] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<DriverLicense | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filter licenses based on search text
  const filteredLicenses = licenses.filter((license) => {
    const searchLower = searchText.toLowerCase();
    return (
      license.userName.toLowerCase().includes(searchLower) ||
      license.email.toLowerCase().includes(searchLower) ||
      license.licenseNumber.includes(searchLower) ||
      license.class.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (license: DriverLicense) => {
    setSelectedLicense(license);
    setIsModalVisible(true);

    // Set form values
    form.setFieldsValue({
      email: license.email,
      userName: license.userName,
      licenseNumber: license.licenseNumber,
      class: license.class,
      status: license.status,
      image: license.image,
      createdAt: dayjs(license.createdAt),
      updatedAt: dayjs(license.updatedAt),
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (selectedLicense) {
        // Update existing license
        const updatedLicense: DriverLicense = {
          ...selectedLicense,
          status: values.status,
          updatedAt: new Date().toISOString(),
        };

        setLicenses((prev) =>
          prev.map((license) =>
            license.id === selectedLicense.id ? updatedLicense : license
          )
        );

        showSuccess("Cập nhật trạng thái bằng lái xe thành công!");
      }

      setIsModalVisible(false);
    } catch (error) {
      showError("Có lỗi xảy ra, vui lòng thử lại!");
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
        return "success";
      case "INVALID":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "VALID":
        return "Hợp lệ";
      case "INVALID":
        return "Không hợp lệ";
      default:
        return status;
    }
  };

  const getClassColor = (licenseClass: string) => {
    const colors: { [key: string]: string } = {
      A1: "blue",
      A2: "cyan",
      B1: "purple",
      B2: "green",
      C: "orange",
      D: "red",
      E: "magenta",
    };
    return colors[licenseClass] || "default";
  };

  const columns: ColumnsType<DriverLicense> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.userName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.email}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Số bằng lái",
      dataIndex: "licenseNumber",
      key: "licenseNumber",
      render: (licenseNumber) => (
        <span className="font-mono text-blue-600 font-semibold">
          {licenseNumber}
        </span>
      ),
    },
    {
      title: "Hạng",
      dataIndex: "class",
      key: "class",
      render: (licenseClass) => (
        <Tag color={getClassColor(licenseClass)} className="font-semibold">
          {licenseClass}
        </Tag>
      ),
      filters: [
        { text: "A1", value: "A1" },
        { text: "A2", value: "A2" },
        { text: "B1", value: "B1" },
        { text: "B2", value: "B2" },
        { text: "C", value: "C" },
        { text: "D", value: "D" },
        { text: "E", value: "E" },
      ],
      onFilter: (value, record) => record.class === value,
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: "Hợp lệ", value: "VALID" },
        { text: "Không hợp lệ", value: "INVALID" },
      ],
      onFilter: (value, record) => record.status === value,
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => (
        <span className="text-gray-600">
          {dayjs(createdAt).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
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
          Quản lý bằng lái xe
        </Title>
        <p className="text-gray-600">
          Quản lý và xác thực bằng lái xe của người dùng trong hệ thống
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, số bằng lái, hạng..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Hợp lệ:{" "}
              <span className="font-semibold text-green-600">
                {licenses.filter((l) => l.status === "VALID").length}
              </span>
            </span>
            <span>
              Không hợp lệ:{" "}
              <span className="font-semibold text-red-600">
                {licenses.filter((l) => l.status === "INVALID").length}
              </span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold text-blue-600">
                {filteredLicenses.length}
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
            dataSource={filteredLicenses}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} bằng lái xe`,
            }}
            scroll={{ x: 1200 }}
            className="border-0"
          />
        </div>
      </div>

      {/* License Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <IdcardOutlined className="text-blue-500 text-xl" />
            <div>
              <div className="font-semibold text-lg">Chi tiết bằng lái xe</div>
              {selectedLicense && (
                <div className="text-sm text-gray-500">
                  {selectedLicense.userName} - {selectedLicense.licenseNumber}
                </div>
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={800}
        className="top-8"
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Đóng
          </Button>,
          <Button key="save" type="primary" onClick={handleSave}>
            Cập nhật trạng thái
          </Button>,
        ]}
      >
        {selectedLicense && (
          <div className="pt-4 space-y-6">
            {/* Thông tin người dùng */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin người dùng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                    <MailOutlined className="text-blue-500" />
                    <span>{selectedLicense.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                    {selectedLicense.userName}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin bằng lái */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin bằng lái xe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số bằng lái
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-blue-600 font-mono font-semibold">
                    {selectedLicense.licenseNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hạng bằng lái
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Tag
                      color={getClassColor(selectedLicense.class)}
                      className="text-sm font-semibold"
                    >
                      {selectedLicense.class}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            {/* Hình ảnh bằng lái */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Hình ảnh bằng lái xe
              </h3>
              <div className="flex justify-center">
                <Image
                  src={selectedLicense.image}
                  alt="Bằng lái xe"
                  width={400}
                  height={250}
                  className="rounded-lg border-2 border-gray-200"
                  placeholder={
                    <div className="flex items-center justify-center w-full h-full bg-gray-100">
                      <IdcardOutlined className="text-4xl text-gray-400" />
                    </div>
                  }
                />
              </div>
            </div>

            {/* Trạng thái và thời gian */}
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[
                    { required: true, message: "Vui lòng chọn trạng thái!" },
                  ]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value="VALID">
                      <Tag color="success">Hợp lệ</Tag>
                    </Option>
                    <Option value="INVALID">
                      <Tag color="error">Không hợp lệ</Tag>
                    </Option>
                  </Select>
                </Form.Item>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày tạo
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {dayjs(selectedLicense.createdAt).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cập nhật lần cuối
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                    {dayjs(selectedLicense.updatedAt).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </div>
                </div>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

ManageLicensesPage.Layout = AdminLayout;
