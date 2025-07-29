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
  Space,
  message,
  Avatar,
  Descriptions,
  Divider,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  WalletOutlined,
  UserOutlined,
  MailOutlined,
  BankOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/utils/toast.utils";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  userId: string;
  userName: string;
  userGmail: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface BankCard {
  id: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankAccountType: string;
  balance?: number;
}

// Mockup data cho yêu cầu rút tiền
const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: "WD001",
    walletId: "wallet001",
    amount: 500000,
    userId: "user001",
    userName: "Nguyễn Văn An",
    userGmail: "nguyenvanan@gmail.com",
    status: "PENDING",
    createdAt: "2024-12-20T08:30:00Z",
    updatedAt: "2024-12-20T08:30:00Z",
  },
  {
    id: "WD002",
    walletId: "wallet002",
    amount: 1000000,
    userId: "user002",
    userName: "Trần Thị Bình",
    userGmail: "tranthibinh@gmail.com",
    status: "PROCESSING",
    createdAt: "2024-12-19T10:15:00Z",
    updatedAt: "2024-12-20T09:00:00Z",
  },
  {
    id: "WD003",
    walletId: "wallet003",
    amount: 750000,
    userId: "user003",
    userName: "Lê Minh Cường",
    userGmail: "leminhcuong@gmail.com",
    status: "APPROVED",
    createdAt: "2024-12-18T14:20:00Z",
    updatedAt: "2024-12-19T11:30:00Z",
  },
  {
    id: "WD004",
    walletId: "wallet004",
    amount: 300000,
    userId: "user004",
    userName: "Phạm Thu Hà",
    userGmail: "phamthuha@gmail.com",
    status: "REJECTED",
    createdAt: "2024-12-17T16:45:00Z",
    updatedAt: "2024-12-18T08:20:00Z",
  },
  {
    id: "WD005",
    walletId: "wallet005",
    amount: 2000000,
    userId: "user005",
    userName: "Hoàng Đức Minh",
    userGmail: "hoangducminh@gmail.com",
    status: "CANCELLED",
    createdAt: "2024-12-16T11:00:00Z",
    updatedAt: "2024-12-17T14:15:00Z",
  },
  {
    id: "WD006",
    walletId: "wallet006",
    amount: 850000,
    userId: "user006",
    userName: "Võ Thị Lan",
    userGmail: "vothilan@gmail.com",
    status: "APPROVED",
    createdAt: "2024-12-15T13:30:00Z",
    updatedAt: "2024-12-16T10:45:00Z",
  },
];

// Mockup data cho thẻ ngân hàng (giả lập theo userId)
const mockBankCards: { [userId: string]: BankCard } = {
  user001: {
    id: "bank001",
    bankAccountNumber: "1234567890123",
    bankAccountName: "NGUYEN VAN AN",
    bankAccountType: "Vietcombank",
    balance: 5000000,
  },
  user002: {
    id: "bank002",
    bankAccountNumber: "2345678901234",
    bankAccountName: "TRAN THI BINH",
    bankAccountType: "Techcombank",
    balance: 3500000,
  },
  user003: {
    id: "bank003",
    bankAccountNumber: "3456789012345",
    bankAccountName: "LE MINH CUONG",
    bankAccountType: "BIDV",
    balance: 2800000,
  },
  user004: {
    id: "bank004",
    bankAccountNumber: "4567890123456",
    bankAccountName: "PHAM THU HA",
    bankAccountType: "Agribank",
    balance: 1200000,
  },
  user005: {
    id: "bank005",
    bankAccountNumber: "5678901234567",
    bankAccountName: "HOANG DUC MINH",
    bankAccountType: "MB Bank",
    balance: 4200000,
  },
  user006: {
    id: "bank006",
    bankAccountNumber: "6789012345678",
    bankAccountName: "VO THI LAN",
    bankAccountType: "VPBank",
    balance: 3100000,
  },
};

export default function WithdrawalRequestsPage() {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRequest[]>(mockWithdrawals);
  const [searchText, setSearchText] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filter withdrawals based on search text
  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const searchLower = searchText.toLowerCase();
    return (
      withdrawal.userName.toLowerCase().includes(searchLower) ||
      withdrawal.userGmail.toLowerCase().includes(searchLower) ||
      withdrawal.id.toLowerCase().includes(searchLower) ||
      withdrawal.walletId.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsModalVisible(true);

    // Set form values
    form.setFieldsValue({
      status: withdrawal.status,
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (selectedWithdrawal) {
        // Update existing withdrawal
        const updatedWithdrawal: WithdrawalRequest = {
          ...selectedWithdrawal,
          status: values.status,
          updatedAt: new Date().toISOString(),
        };

        setWithdrawals((prev) =>
          prev.map((withdrawal) =>
            withdrawal.id === selectedWithdrawal.id
              ? updatedWithdrawal
              : withdrawal
          )
        );

        showSuccess("Cập nhật trạng thái yêu cầu rút tiền thành công!");
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
      case "PENDING":
        return "warning";
      case "PROCESSING":
        return "processing";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "CANCELLED":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xử lý";
      case "PROCESSING":
        return "Đang xử lý";
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Từ chối";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getBankInfo = (userId: string): BankCard | null => {
    return mockBankCards[userId] || null;
  };

  const columns: ColumnsType<WithdrawalRequest> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-mono font-semibold">{id}</span>,
      sorter: (a, b) => a.id.localeCompare(b.id),
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
              {record.userGmail}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <span className="font-semibold">{formatAmount(amount)}</span>
      ),
      sorter: (a, b) => a.amount - b.amount,
      align: "right",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: "Chờ xử lý", value: "PENDING" },
        { text: "Đang xử lý", value: "PROCESSING" },
        { text: "Đã duyệt", value: "APPROVED" },
        { text: "Từ chối", value: "REJECTED" },
        { text: "Đã hủy", value: "CANCELLED" },
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

  const getStatusCounts = () => {
    return {
      pending: withdrawals.filter((w) => w.status === "PENDING").length,
      processing: withdrawals.filter((w) => w.status === "PROCESSING").length,
      approved: withdrawals.filter((w) => w.status === "APPROVED").length,
      rejected: withdrawals.filter((w) => w.status === "REJECTED").length,
      cancelled: withdrawals.filter((w) => w.status === "CANCELLED").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Yêu cầu rút tiền
        </Title>
        <p className="text-gray-600">
          Quản lý các yêu cầu rút tiền từ ví của người dùng
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, mã yêu cầu..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              Chờ xử lý:{" "}
              <span className="font-semibold">{statusCounts.pending}</span>
            </span>
            <span>
              Đang xử lý:{" "}
              <span className="font-semibold">{statusCounts.processing}</span>
            </span>
            <span>
              Đã duyệt:{" "}
              <span className="font-semibold">{statusCounts.approved}</span>
            </span>
            <span>
              Từ chối:{" "}
              <span className="font-semibold">{statusCounts.rejected}</span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold">
                {filteredWithdrawals.length}
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
            dataSource={filteredWithdrawals}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} yêu cầu rút tiền`,
            }}
            scroll={{ x: 1200 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Withdrawal Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <WalletOutlined className="text-xl" />
            <div>
              <div className="font-semibold text-lg">
                Chi tiết yêu cầu rút tiền
              </div>
              {selectedWithdrawal && (
                <div className="text-sm text-gray-500">
                  Mã: {selectedWithdrawal.id} -{" "}
                  {formatAmount(selectedWithdrawal.amount)}
                </div>
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={900}
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
        {selectedWithdrawal && (
          <div className="pt-4 space-y-6">
            {/* Thông tin yêu cầu */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin yêu cầu
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Mã yêu cầu" span={1}>
                  <span className="font-mono font-semibold">
                    {selectedWithdrawal.id}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Mã ví" span={1}>
                  <span className="font-mono">
                    {selectedWithdrawal.walletId}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền rút" span={1}>
                  <span className="font-semibold text-lg">
                    {formatAmount(selectedWithdrawal.amount)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái hiện tại" span={1}>
                  <Tag
                    color={getStatusColor(selectedWithdrawal.status)}
                    className="text-sm"
                  >
                    {getStatusText(selectedWithdrawal.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  {dayjs(selectedWithdrawal.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối" span={1}>
                  {dayjs(selectedWithdrawal.updatedAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin người dùng */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin người dùng
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Họ và tên" span={1}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold">
                      {selectedWithdrawal.userName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedWithdrawal.userGmail}</span>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin ngân hàng */}
            {getBankInfo(selectedWithdrawal.userId) && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Thông tin tài khoản ngân hàng
                </h3>
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Tên ngân hàng" span={1}>
                    <div className="flex items-center gap-2">
                      <BankOutlined />
                      <span className="font-semibold">
                        {
                          getBankInfo(selectedWithdrawal.userId)
                            ?.bankAccountType
                        }
                      </span>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản" span={1}>
                    <span className="font-mono font-semibold">
                      {
                        getBankInfo(selectedWithdrawal.userId)
                          ?.bankAccountNumber
                      }
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên chủ tài khoản" span={2}>
                    <span className="font-semibold">
                      {getBankInfo(selectedWithdrawal.userId)?.bankAccountName}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}

            <Divider />

            {/* Form cập nhật trạng thái */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Cập nhật trạng thái
              </h3>
              <Form form={form} layout="vertical">
                <Form.Item
                  name="status"
                  label="Trạng thái mới"
                  rules={[
                    { required: true, message: "Vui lòng chọn trạng thái!" },
                  ]}
                >
                  <Select placeholder="Chọn trạng thái" size="large">
                    <Option value="PENDING">
                      <Tag color="warning">Chờ xử lý</Tag>
                    </Option>
                    <Option value="PROCESSING">
                      <Tag color="processing">Đang xử lý</Tag>
                    </Option>
                    <Option value="APPROVED">
                      <Tag color="success">Đã duyệt</Tag>
                    </Option>
                    <Option value="REJECTED">
                      <Tag color="error">Từ chối</Tag>
                    </Option>
                    <Option value="CANCELLED">
                      <Tag color="default">Đã hủy</Tag>
                    </Option>
                  </Select>
                </Form.Item>
              </Form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

WithdrawalRequestsPage.Layout = AdminLayout;
