"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Modal,
  Input,
  Avatar,
  Descriptions,
  message,
  Image,
  Tag,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  MailOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import useLocalStorage from "@/hooks/useLocalStorage";
import { showSuccess } from "@/utils/toast.utils";

const { Title } = Typography;
const { Search } = Input;
const { confirm } = Modal;

export interface FinalContract {
  id: string;
  contractId: string;
  userId: string; // ID của người thuê xe
  userName: string;
  userGmail: string;
  image: string; // Ảnh hợp đồng hoặc xe
  timeFinish: string; // Thời gian kết thúc thuê xe
  costSettlement: number; // Chi phí tất toán
  note: string; // Ghi chú
  createdAt: string;
  updatedAt: string;
  approvedBy?: string; // ID của admin/staff đã duyệt
  approvedByName?: string; // Tên người duyệt
  approvedAt?: string; // Thời gian duyệt
}

// Mockup data cho tất toán hợp đồng
const mockFinalContracts: FinalContract[] = [
  {
    id: "FC001",
    contractId: "CONTRACT001",
    userId: "user001",
    userName: "Nguyễn Văn An",
    userGmail: "nguyenvanan@gmail.com",
    image:
      "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=H%E1%BB%A3p+%C4%90%E1%BB%93ng+Thu%C3%AA+Xe",
    timeFinish: "2024-12-20T18:00:00Z",
    costSettlement: 500000,
    note: "Xe trả đúng hạn, không có hư hỏng",
    createdAt: "2024-12-20T18:30:00Z",
    updatedAt: "2024-12-21T09:00:00Z",
    approvedBy: "admin001",
    approvedByName: "Admin Nguyễn",
    approvedAt: "2024-12-21T09:00:00Z",
  },
  {
    id: "FC002",
    contractId: "CONTRACT002",
    userId: "user002",
    userName: "Trần Thị Bình",
    userGmail: "tranthibinh@gmail.com",
    image:
      "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=H%E1%BB%A3p+%C4%90%E1%BB%93ng+Thu%C3%AA+Xe",
    timeFinish: "2024-12-19T20:00:00Z",
    costSettlement: 750000,
    note: "Xe có một vài trầy xước nhỏ, khấu trừ 50k",
    createdAt: "2024-12-19T20:15:00Z",
    updatedAt: "2024-12-19T20:15:00Z",
  },
  {
    id: "FC003",
    contractId: "CONTRACT003",
    userId: "user003",
    userName: "Lê Minh Cường",
    userGmail: "leminhcuong@gmail.com",
    image:
      "https://via.placeholder.com/400x300/FF9800/FFFFFF?text=H%E1%BB%A3p+%C4%90%E1%BB%93ng+Thu%C3%AA+Xe",
    timeFinish: "2024-12-18T16:30:00Z",
    costSettlement: 300000,
    note: "Trả xe muộn 2 tiếng, phí phạt 100k",
    createdAt: "2024-12-18T18:45:00Z",
    updatedAt: "2024-12-18T18:45:00Z",
  },
  {
    id: "FC004",
    contractId: "CONTRACT004",
    userId: "user004",
    userName: "Phạm Thu Hà",
    userGmail: "phamthuha@gmail.com",
    image:
      "https://via.placeholder.com/400x300/9C27B0/FFFFFF?text=H%E1%BB%A3p+%C4%90%E1%BB%93ng+Thu%C3%AA+Xe",
    timeFinish: "2024-12-17T14:00:00Z",
    costSettlement: 450000,
    note: "Xe trong tình trạng tốt, không có vấn đề gì",
    createdAt: "2024-12-17T14:30:00Z",
    updatedAt: "2024-12-20T10:15:00Z",
    approvedBy: "staff001",
    approvedByName: "Staff Trần",
    approvedAt: "2024-12-20T10:15:00Z",
  },
  {
    id: "FC005",
    contractId: "CONTRACT005",
    userId: "user005",
    userName: "Hoàng Đức Minh",
    userGmail: "hoangducminh@gmail.com",
    image:
      "https://via.placeholder.com/400x300/607D8B/FFFFFF?text=H%E1%BB%A3p+%C4%90%E1%BB%93ng+Thu%C3%AA+Xe",
    timeFinish: "2024-12-16T12:00:00Z",
    costSettlement: 600000,
    note: "Cần kiểm tra kỹ hệ thống phanh",
    createdAt: "2024-12-16T12:30:00Z",
    updatedAt: "2024-12-16T12:30:00Z",
  },
  {
    id: "FC006",
    contractId: "CONTRACT006",
    userId: "user006",
    userName: "Võ Thị Lan",
    userGmail: "vothilan@gmail.com",
    image:
      "https://via.placeholder.com/400x300/F44336/FFFFFF?text=H%E1%BB%A3p+%C4%90%E1%BB%93ng+Thu%C3%AA+Xe",
    timeFinish: "2024-12-15T10:00:00Z",
    costSettlement: 800000,
    note: "Xe bị hỏng gương chiếu hậu, cần thay thế",
    createdAt: "2024-12-15T10:45:00Z",
    updatedAt: "2024-12-15T10:45:00Z",
  },
];

export default function FinalContractsPage() {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] =
    useState<FinalContract[]>(mockFinalContracts);
  const [searchText, setSearchText] = useState("");
  const [selectedContract, setSelectedContract] =
    useState<FinalContract | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Get current user info
  const [userProfile] = useLocalStorage("user_profile", "");
  const currentUserId = userProfile?.id || "current_user";
  const currentUserName = userProfile?.fullName || "Current User";
  const isAdmin = userProfile?.role === "ADMIN";

  // Filter contracts based on user role
  const getFilteredContracts = () => {
    if (isAdmin) {
      // Admin xem được tất cả
      return contracts;
    } else {
      // Staff chỉ xem được: chưa duyệt + do mình duyệt
      return contracts.filter(
        (contract) =>
          !contract.approvedBy || contract.approvedBy === currentUserId
      );
    }
  };

  // Filter by search text
  const filteredContracts = getFilteredContracts().filter((contract) => {
    const searchLower = searchText.toLowerCase();
    return (
      contract.userName.toLowerCase().includes(searchLower) ||
      contract.userGmail.toLowerCase().includes(searchLower) ||
      contract.contractId.toLowerCase().includes(searchLower) ||
      contract.id.toLowerCase().includes(searchLower) ||
      contract.note.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (contract: FinalContract) => {
    setSelectedContract(contract);
    setIsModalVisible(true);
  };

  const handleApprove = () => {
    if (!selectedContract) return;

    confirm({
      title: "Xác nhận duyệt tất toán",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn duyệt tất toán cho hợp đồng này?</p>
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <div>
              <strong>Mã hợp đồng:</strong> {selectedContract.contractId}
            </div>
            <div>
              <strong>Chủ xe:</strong> {selectedContract.userName}
            </div>
            <div>
              <strong>Chi phí tất toán:</strong>{" "}
              {formatAmount(selectedContract.costSettlement)}
            </div>
          </div>
        </div>
      ),
      okText: "Xác nhận duyệt",
      cancelText: "Hủy",
      onOk: () => {
        // Update contract with approval info
        const updatedContract: FinalContract = {
          ...selectedContract,
          approvedBy: currentUserId,
          approvedByName: currentUserName,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setContracts((prev) =>
          prev.map((contract) =>
            contract.id === selectedContract.id ? updatedContract : contract
          )
        );

        showSuccess("Duyệt tất toán hợp đồng thành công!");
        setIsModalVisible(false);
      },
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const isApproved = (contract: FinalContract) => {
    return !!contract.approvedBy;
  };

  const canApprove = (contract: FinalContract) => {
    return !contract.approvedBy; // Chỉ có thể duyệt nếu chưa được duyệt
  };

  const columns: ColumnsType<FinalContract> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Mã hợp đồng",
      dataIndex: "contractId",
      key: "contractId",
      render: (contractId) => (
        <span className="font-mono font-semibold">{contractId}</span>
      ),
      sorter: (a, b) => a.contractId.localeCompare(b.contractId),
    },
    {
      title: "Chủ xe",
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
      title: "Thời gian kết thúc",
      dataIndex: "timeFinish",
      key: "timeFinish",
      render: (timeFinish) => (
        <span className="text-gray-600">
          {dayjs(timeFinish).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
      sorter: (a, b) => dayjs(a.timeFinish).unix() - dayjs(b.timeFinish).unix(),
    },
    {
      title: "Chi phí tất toán",
      dataIndex: "costSettlement",
      key: "costSettlement",
      render: (cost) => (
        <span className="font-semibold">{formatAmount(cost)}</span>
      ),
      sorter: (a, b) => a.costSettlement - b.costSettlement,
      align: "right",
    },
    {
      title: "Trạng thái duyệt",
      key: "approved",
      render: (_, record) =>
        isApproved(record) ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã duyệt
          </Tag>
        ) : (
          <Tag color="warning">Chờ duyệt</Tag>
        ),
      filters: [
        { text: "Đã duyệt", value: "approved" },
        { text: "Chờ duyệt", value: "pending" },
      ],
      onFilter: (value, record) => {
        if (value === "approved") return isApproved(record);
        if (value === "pending") return !isApproved(record);
        return true;
      },
      align: "center",
    },
    {
      title: "Người duyệt",
      key: "approver",
      render: (_, record) =>
        record.approvedByName ? (
          <div className="text-sm">
            <div className="font-medium">{record.approvedByName}</div>
            <div className="text-gray-500">
              {dayjs(record.approvedAt).format("DD/MM/YYYY HH:mm")}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">Chưa duyệt</span>
        ),
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
    const filtered = getFilteredContracts();
    return {
      approved: filtered.filter((c) => isApproved(c)).length,
      pending: filtered.filter((c) => !isApproved(c)).length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Tất toán hợp đồng
        </Title>
        <p className="text-gray-600">
          {isAdmin
            ? "Quản lý tất toán các hợp đồng thuê xe đã hoàn thành"
            : "Duyệt tất toán các hợp đồng thuê xe đã hoàn thành"}
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, mã hợp đồng, ghi chú..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              Đã duyệt:{" "}
              <span className="font-semibold">{statusCounts.approved}</span>
            </span>
            <span>
              Chờ duyệt:{" "}
              <span className="font-semibold">{statusCounts.pending}</span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold">{filteredContracts.length}</span>
            </span>
            {!isAdmin && (
              <span className="text-blue-600">(Chế độ xem: Staff)</span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <Table
            columns={columns}
            dataSource={filteredContracts}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} hợp đồng`,
            }}
            scroll={{ x: 1400 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Contract Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <FileTextOutlined className="text-xl" />
            <div>
              <div className="font-semibold text-lg">
                Chi tiết tất toán hợp đồng
              </div>
              {selectedContract && (
                <div className="text-sm text-gray-500">
                  Mã: {selectedContract.contractId} -{" "}
                  {formatAmount(selectedContract.costSettlement)}
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
          ...(selectedContract && canApprove(selectedContract)
            ? [
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleApprove}
                >
                  Duyệt tất toán
                </Button>,
              ]
            : []),
        ]}
      >
        {selectedContract && (
          <div className="pt-4 space-y-6">
            {/* Thông tin hợp đồng */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin hợp đồng
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Mã tất toán" span={1}>
                  <span className="font-mono font-semibold">
                    {selectedContract.id}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Mã hợp đồng" span={1}>
                  <span className="font-mono font-semibold">
                    {selectedContract.contractId}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian kết thúc" span={1}>
                  <div className="flex items-center gap-2">
                    <CalendarOutlined />
                    {dayjs(selectedContract.timeFinish).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Chi phí tất toán" span={1}>
                  <div className="flex items-center gap-2">
                    <DollarOutlined />
                    <span className="font-semibold text-lg">
                      {formatAmount(selectedContract.costSettlement)}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái" span={1}>
                  {isApproved(selectedContract) ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Đã duyệt
                    </Tag>
                  ) : (
                    <Tag color="warning">Chờ duyệt</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  {dayjs(selectedContract.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin chủ xe */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin chủ xe
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Họ và tên" span={1}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold">
                      {selectedContract.userName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedContract.userGmail}</span>
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Hình ảnh hợp đồng */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Hình ảnh hợp đồng
              </h3>
              <div className="flex justify-center">
                <Image
                  src={selectedContract.image}
                  alt="Hình ảnh hợp đồng"
                  width={400}
                  height={300}
                  className="rounded-lg border-2 border-gray-200"
                  placeholder={
                    <div className="flex items-center justify-center w-full h-full bg-gray-100">
                      <FileTextOutlined className="text-4xl text-gray-400" />
                    </div>
                  }
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Ghi chú tất toán
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedContract.note}
                </p>
              </div>
            </div>

            {/* Thông tin duyệt */}
            {isApproved(selectedContract) && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">
                  Thông tin duyệt
                </h3>
                <Descriptions bordered column={2} size="middle">
                  <Descriptions.Item label="Người duyệt" span={1}>
                    <span className="font-semibold">
                      {selectedContract.approvedByName}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian duyệt" span={1}>
                    {dayjs(selectedContract.approvedAt).format(
                      "DD/MM/YYYY HH:mm:ss"
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

FinalContractsPage.Layout = AdminLayout;
