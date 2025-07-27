import { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Modal,
  Tag,
  Input,
  Form,
  message,
  Avatar,
  Descriptions,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  WalletOutlined,
  UserOutlined,
  MailOutlined,
  BankOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import { getAllWithdrawals, updateWithdrawalStatus } from "@/apis/wallet.api";
import type { ColumnsType } from "antd/es/table";
import { translateENtoVI } from "@/lib/viDictionary";
import dayjs from "dayjs";
import { showError, showSuccess } from "@/utils/toast.utils";

const { Title } = Typography;
const { Search } = Input;

export interface WithdrawalRequest {
  id: string;
  amount: number;
  userId: string;
  fullName: string;
  email: string;
  status: "PENDING";
  createdAt: string;
  cardNumber: string;
  bankName: string;
  cardHolderName: string;
}

export default function WithdrawalRequestsPage() {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequest | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [confirmAction, setConfirmAction] = useState<
    "APPROVE" | "REJECT" | null
  >(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async (status?: string) => {
    setLoading(true);
    try {
      const data = await getAllWithdrawals(status || "PENDING");
      setWithdrawals(data);
    } catch (error) {
      message.error("Không thể tải yêu cầu rút tiền.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsModalVisible(true);
    form.setFieldsValue({ status: withdrawal.status });
  };

  const handleApproveRequest = () => {
    if (selectedWithdrawal) {
      setConfirmAction("APPROVE");
    }
  };

  const handleRejectRequest = () => {
    if (selectedWithdrawal) {
      setConfirmAction("REJECT");
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedWithdrawal || !confirmAction) return;
    try {
      const status = confirmAction === "APPROVE" ? "APPROVED" : "REJECTED";
      await updateWithdrawalStatus(selectedWithdrawal.id, status);
      showSuccess(
        `Yêu cầu đã được ${confirmAction === "APPROVE" ? "duyệt" : "từ chối"}!`
      );
      loadWithdrawals();
      setIsModalVisible(false);
    } catch (error) {
      showError("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setConfirmAction(null);
    }
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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

  const columns: ColumnsType<WithdrawalRequest> = [
    {
      title: "Mã yêu cầu",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-mono font-semibold">{id}</span>,
    },
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.fullName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <span className="font-semibold">{amount.toLocaleString()} VNĐ</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "PENDING" ? "warning" : "default"}>
          {translateENtoVI(status)}
        </Tag>
      ),
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
    },
    {
      title: "Thao tác",
      key: "action",
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
    },
  ];

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
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={withdrawals.filter(
            (withdrawal) =>
              withdrawal.fullName
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              withdrawal.email
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              withdrawal.id.toLowerCase().includes(searchText.toLowerCase())
          )}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </div>

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
                  {selectedWithdrawal.amount.toLocaleString()} VNĐ
                </div>
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={900}
        className="top-8"
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>,
          selectedWithdrawal?.status === "PENDING" && (
            <Button key="reject" danger onClick={handleRejectRequest}>
              Từ chối
            </Button>
          ),
          selectedWithdrawal?.status === "PENDING" && (
            <Button key="approve" type="primary" onClick={handleApproveRequest}>
              Duyệt
            </Button>
          ),
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
                    {translateENtoVI(selectedWithdrawal.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  {formatTimestamp(selectedWithdrawal.createdAt)}
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
                      {selectedWithdrawal.fullName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedWithdrawal.email}</span>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin ngân hàng */}
            {selectedWithdrawal.userId && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Thông tin tài khoản ngân hàng
                </h3>
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Tên ngân hàng" span={1}>
                    <div className="flex items-center gap-2">
                      <BankOutlined />
                      <span className="font-semibold">
                        {selectedWithdrawal.bankName}
                      </span>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản" span={1}>
                    <span className="font-mono font-semibold">
                      {selectedWithdrawal.cardNumber}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tên chủ tài khoản" span={2}>
                    <span className="font-semibold">
                      {selectedWithdrawal.cardHolderName}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        title={
          confirmAction === "APPROVE"
            ? "Xác nhận duyệt yêu cầu"
            : "Xác nhận từ chối yêu cầu"
        }
        open={!!confirmAction}
        onCancel={() => setConfirmAction(null)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmAction(null)}>
            Hủy
          </Button>,
          <Button
            key="ok"
            type="primary"
            danger={confirmAction === "REJECT"}
            onClick={handleConfirmAction}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <div className="text-base">
          {confirmAction === "APPROVE"
            ? "Bạn có chắc chắn muốn duyệt yêu cầu rút tiền này?"
            : "Bạn có chắc chắn muốn từ chối yêu cầu rút tiền này?"}
        </div>
      </Modal>
    </div>
  );
}

WithdrawalRequestsPage.Layout = AdminLayout;
