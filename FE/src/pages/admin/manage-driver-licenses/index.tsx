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
import {
  getAllDriverLicenses,
  getDriverLicenseById,
  updateDriverLicenseStatus,
} from "@/apis/driver-licenses.api";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function ManageLicensesPage() {
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<DriverLicense[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<DriverLicense | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const response = await getAllDriverLicenses(); // Lấy tất cả giấy phép
      setLicenses(response); // Cập nhật danh sách giấy phép
    } catch (error) {
      console.error(error);
      showError("Không thể tải danh sách giấy phép lái xe!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses(); // Gọi hàm fetch khi component được mount
  }, []);

  // Filter licenses based on search text
  const filteredLicenses = licenses.filter((license) => {
    const searchLower = searchText.toLowerCase();
    return (
      license.userName.toLowerCase().includes(searchLower) ||
      license.email.toLowerCase().includes(searchLower) ||
      license.licenseNumber.includes(searchLower) ||
      license.classField.toLowerCase().includes(searchLower)
    );
  });

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

  const handleViewDetails = async (license: DriverLicense) => {
    setSelectedLicense(license);
    setIsModalVisible(true);

    // Gọi API để lấy thông tin chi tiết giấy phép lái xe
    try {
      const licenseDetail = await getDriverLicenseById(license.id);
      setSelectedLicense(licenseDetail as DriverLicense); // Cập nhật thông tin giấy phép lái xe chi tiết
    } catch (error) {
      console.error(error);
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
      case "EXPIRED":
        return "Hết hạn";
      default:
        return status;
    }
  };

  const getClassColor = (classField: string) => {
    const colors: { [key: string]: string } = {
      A1: "blue",
      A2: "cyan",
      B1: "purple",
      B2: "green",
      C: "orange",
      D: "red",
      E: "magenta",
    };
    return colors[classField] || "default";
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
          {/* <Avatar icon={<UserOutlined />} /> */}
          <div>
            <div className="font-medium">{record.userName}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
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
        <span className="font-mono  font-semibold">{licenseNumber}</span>
      ),
    },
    {
      title: "Hạng",
      dataIndex: "classField",
      key: "classField",
      render: (classField) => (
        <Tag color={getClassColor(classField)} className="font-semibold">
          {classField}
        </Tag>
      ),
      // filters: [
      //   { text: "A1", value: "A1" },
      //   { text: "A2", value: "A2" },
      //   { text: "B1", value: "B1" },
      //   { text: "B2", value: "B2" },
      //   { text: "C", value: "C" },
      //   { text: "D", value: "D" },
      //   { text: "E", value: "E" },
      // ],
      // onFilter: (value, record) => record.classField === value,
      // align: "center",
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
        { text: "Không hợp lệ", value: "EXPIRED" },
      ],
      onFilter: (value, record) => record.status === value,
      align: "center",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => (
        <span className="text-gray-600">{formatTimestamp(createdAt)}</span>
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

  async function handleSave() {
    if (!selectedLicense) return;

    const updatedLicense = {
      ...selectedLicense,
      status: selectedLicense.status,
    }; // Prepare the updated license data
    setLoading(true);

    try {
      await updateDriverLicenseStatus(selectedLicense.id, updatedLicense); // Call the update API

      showSuccess("Cập nhật trạng thái thành công!");
      setIsModalVisible(false);
      fetchLicenses(); // Refresh the list of licenses
    } catch (error) {
      showError("Cập nhật trạng thái thất bại!");
    } finally {
      setLoading(false);
    }
  }

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

      {/* License Details/Edit Modal */}
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
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                    <MailOutlined className="text-blue-500" />
                    <span>{selectedLicense.email}</span>
                  </div>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên chủ thẻ
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
                  <div className="p-3 bg-gray-50 rounded-lg  font-mono font-semibold">
                    {selectedLicense.licenseNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hạng bằng lái
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Tag
                      color={getClassColor(selectedLicense.classField)}
                      className="text-sm font-semibold"
                    >
                      {selectedLicense.classField}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <Select
                  value={selectedLicense.status}
                  onChange={(value) =>
                    setSelectedLicense({ ...selectedLicense, status: value })
                  }
                  className="w-full"
                >
                  <Select.Option value="VALID">Hợp lệ</Select.Option>
                  <Select.Option value="EXPIRED">Hết hạn</Select.Option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tạo
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {formatTimestamp(selectedLicense.createdAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cập nhật lần cuối
                </label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                  {formatTimestamp(selectedLicense.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

ManageLicensesPage.Layout = AdminLayout;
