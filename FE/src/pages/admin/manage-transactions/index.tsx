"use client";

import { useState } from "react";
import {
  Typography,
  Table,
  Button,
  Modal,
  Tag,
  Input,
  Avatar,
  Descriptions,
  Divider,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  CreditCardOutlined,
  UserOutlined,
  MailOutlined,
  BankOutlined,
  DollarOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title } = Typography;
const { Search } = Input;

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  userId: string;
  userName: string;
  userGmail: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND" | "TRANSFER";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  description: string;
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

// Mockup data cho giao dịch thanh toán
const mockTransactions: Transaction[] = [
  {
    id: "TXN001",
    walletId: "wallet001",
    amount: 500000,
    userId: "user001",
    userName: "Nguyễn Văn An",
    userGmail: "nguyenvanan@gmail.com",
    type: "PAYMENT",
    status: "COMPLETED",
    description: "Thanh toán thuê xe máy Honda Wave",
    createdAt: "2024-12-20T08:30:00Z",
    updatedAt: "2024-12-20T08:35:00Z",
  },
  {
    id: "TXN002",
    walletId: "wallet002",
    amount: 1000000,
    userId: "user002",
    userName: "Trần Thị Bình",
    userGmail: "tranthibinh@gmail.com",
    type: "DEPOSIT",
    status: "COMPLETED",
    description: "Nạp tiền vào ví từ ngân hàng",
    createdAt: "2024-12-19T10:15:00Z",
    updatedAt: "2024-12-19T10:20:00Z",
  },
  {
    id: "TXN003",
    walletId: "wallet003",
    amount: 750000,
    userId: "user003",
    userName: "Lê Minh Cường",
    userGmail: "leminhcuong@gmail.com",
    type: "WITHDRAWAL",
    status: "PROCESSING",
    description: "Rút tiền về tài khoản ngân hàng",
    createdAt: "2024-12-18T14:20:00Z",
    updatedAt: "2024-12-19T09:30:00Z",
  },
  {
    id: "TXN004",
    walletId: "wallet004",
    amount: 300000,
    userId: "user004",
    userName: "Phạm Thu Hà",
    userGmail: "phamthuha@gmail.com",
    type: "REFUND",
    status: "COMPLETED",
    description: "Hoàn tiền do hủy đặt xe ô tô",
    createdAt: "2024-12-17T16:45:00Z",
    updatedAt: "2024-12-17T17:00:00Z",
  },
  {
    id: "TXN005",
    walletId: "wallet005",
    amount: 200000,
    userId: "user005",
    userName: "Hoàng Đức Minh",
    userGmail: "hoangducminh@gmail.com",
    type: "PAYMENT",
    status: "FAILED",
    description: "Thanh toán thuê xe đạp điện",
    createdAt: "2024-12-16T11:00:00Z",
    updatedAt: "2024-12-16T11:05:00Z",
  },
  {
    id: "TXN006",
    walletId: "wallet006",
    amount: 850000,
    userId: "user006",
    userName: "Võ Thị Lan",
    userGmail: "vothilan@gmail.com",
    type: "TRANSFER",
    status: "COMPLETED",
    description: "Chuyển tiền cho thuê xe ô tô",
    createdAt: "2024-12-15T13:30:00Z",
    updatedAt: "2024-12-15T13:35:00Z",
  },
  {
    id: "TXN007",
    walletId: "wallet001",
    amount: 150000,
    userId: "user001",
    userName: "Nguyễn Văn An",
    userGmail: "nguyenvanan@gmail.com",
    type: "DEPOSIT",
    status: "COMPLETED",
    description: "Nạp tiền từ thẻ tín dụng",
    createdAt: "2024-12-14T09:20:00Z",
    updatedAt: "2024-12-14T09:25:00Z",
  },
  {
    id: "TXN008",
    walletId: "wallet003",
    amount: 400000,
    userId: "user003",
    userName: "Lê Minh Cường",
    userGmail: "leminhcuong@gmail.com",
    type: "PAYMENT",
    status: "CANCELLED",
    description: "Thanh toán thuê xe máy Yamaha Exciter",
    createdAt: "2024-12-13T15:10:00Z",
    updatedAt: "2024-12-13T15:15:00Z",
  },
];

// Mockup data cho thẻ ngân hàng (tái sử dụng từ withdrawal)
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

export default function TransactionsPage() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [searchText, setSearchText] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Filter transactions based on search text
  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchText.toLowerCase();
    return (
      transaction.userName.toLowerCase().includes(searchLower) ||
      transaction.userGmail.toLowerCase().includes(searchLower) ||
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.description.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "PROCESSING":
        return "processing";
      case "COMPLETED":
        return "success";
      case "FAILED":
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
      case "COMPLETED":
        return "Hoàn thành";
      case "FAILED":
        return "Thất bại";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "success";
      case "WITHDRAWAL":
        return "warning";
      case "PAYMENT":
        return "processing";
      case "REFUND":
        return "cyan";
      case "TRANSFER":
        return "purple";
      default:
        return "default";
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

  const columns: ColumnsType<Transaction> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Mã giao dịch",
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
        { text: "Hoàn thành", value: "COMPLETED" },
        { text: "Thất bại", value: "FAILED" },
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

  const getTypeCounts = () => {
    return {
      deposit: transactions.filter((t) => t.type === "DEPOSIT").length,
      withdrawal: transactions.filter((t) => t.type === "WITHDRAWAL").length,
      payment: transactions.filter((t) => t.type === "PAYMENT").length,
      refund: transactions.filter((t) => t.type === "REFUND").length,
      transfer: transactions.filter((t) => t.type === "TRANSFER").length,
    };
  };

  const getStatusCounts = () => {
    return {
      completed: transactions.filter((t) => t.status === "COMPLETED").length,
      processing: transactions.filter((t) => t.status === "PROCESSING").length,
      failed: transactions.filter((t) => t.status === "FAILED").length,
    };
  };

  const typeCounts = getTypeCounts();
  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Quản lý giao dịch
        </Title>
        <p className="text-gray-600">
          Xem chi tiết các giao dịch thanh toán trong hệ thống
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, mã giao dịch, mô tả..."
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
            dataSource={filteredTransactions}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} giao dịch`,
            }}
            scroll={{ x: 1400 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Transaction Details Modal (Read-only) */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <CreditCardOutlined className="text-xl" />
            <div>
              <div className="font-semibold text-lg">Chi tiết giao dịch</div>
              {selectedTransaction && (
                <div className="text-sm text-gray-500">
                  Mã: {selectedTransaction.id} -{" "}
                  {formatAmount(selectedTransaction.amount)}
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
          <Button key="close" onClick={handleCancel}>
            Đóng
          </Button>,
        ]}
      >
        {selectedTransaction && (
          <div className="pt-4 space-y-6">
            {/* Thông tin giao dịch */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin giao dịch
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Mã giao dịch" span={1}>
                  <span className="font-mono font-semibold">
                    {selectedTransaction.id}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Mã ví" span={1}>
                  <span className="font-mono">
                    {selectedTransaction.walletId}
                  </span>
                </Descriptions.Item>

                <Descriptions.Item label="Số tiền" span={1}>
                  <span className="font-semibold text-lg">
                    {formatAmount(selectedTransaction.amount)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={1}>
                  <Tag
                    color={getStatusColor(selectedTransaction.status)}
                    className="text-sm"
                  >
                    {getStatusText(selectedTransaction.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  {dayjs(selectedTransaction.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối" span={2}>
                  {dayjs(selectedTransaction.updatedAt).format(
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
                      {selectedTransaction.userName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedTransaction.userGmail}</span>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin ngân hàng */}
            {getBankInfo(selectedTransaction.userId) && (
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
                          getBankInfo(selectedTransaction.userId)
                            ?.bankAccountType
                        }
                      </span>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản" span={1}>
                    <span className="font-mono font-semibold">
                      {
                        getBankInfo(selectedTransaction.userId)
                          ?.bankAccountNumber
                      }
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên chủ tài khoản" span={2}>
                    <span className="font-semibold">
                      {getBankInfo(selectedTransaction.userId)?.bankAccountName}
                    </span>
                  </Descriptions.Item>
                  {getBankInfo(selectedTransaction.userId)?.balance && (
                    <Descriptions.Item label="Số dư ví hiện tại" span={2}>
                      <div className="flex items-center gap-2">
                        <DollarOutlined />
                        <span className="font-semibold text-lg">
                          {formatAmount(
                            getBankInfo(selectedTransaction.userId)!.balance!
                          )}
                        </span>
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

TransactionsPage.Layout = AdminLayout;
