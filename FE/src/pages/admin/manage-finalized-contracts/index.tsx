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
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import useLocalStorage from "@/hooks/useLocalStorage";
import { translateENtoVI } from "@/lib/viDictionary";
import { getAllFinalContracts } from "@/apis/admin.api";

const { Title } = Typography;
const { Search } = Input;

export interface FinalContract {
  id: string;
  contractId: string;
  providerId: string | null;
  providerName: string | null;
  providerEmail: string | null;
  providerPhone: string | null;
  providerBankAccountNumber: string | null;
  providerBankAccountName: string | null;
  providerBankAccountType: string | null;
  image: string | null;
  timeFinish: string;
  costSettlement: number;
  note: string;
  contractStatus: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  updatedAt?: string;
}

export default function FinalContractsPage() {
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<FinalContract[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filteredContracts, setFilteredContracts] = useState<FinalContract[]>(
    []
  );
  const [selectedContract, setSelectedContract] =
    useState<FinalContract | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [userProfile] = useLocalStorage("user_profile", "");
  const currentUserId = userProfile?.id || "current_user";
  const isAdmin = userProfile?.role === "ADMIN";

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const data = await getAllFinalContracts();
      setContracts(data);
      setFilteredContracts(data);
    } catch (error) {
      message.error("Không thể tải hợp đồng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = contracts.filter((contract) => {
      return (
        (contract.providerName &&
          contract.providerName.toLowerCase().includes(value.toLowerCase())) ||
        (contract.providerEmail &&
          contract.providerEmail.toLowerCase().includes(value.toLowerCase())) ||
        contract.contractId.toLowerCase().includes(value.toLowerCase()) ||
        (contract.note &&
          contract.note.toLowerCase().includes(value.toLowerCase()))
      );
    });
    setFilteredContracts(filtered);
  };

  const handleViewDetails = (contract: FinalContract) => {
    setSelectedContract(contract);
    setIsModalVisible(true);
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

  const isApproved = (contract: FinalContract) => {
    return !!contract.userId;
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
            <div className="font-medium">{record.providerName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.providerEmail}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) =>
        (a.providerName ?? "").localeCompare(b.providerName ?? ""),
    },
    {
      title: "Thời gian kết thúc",
      dataIndex: "timeFinish",
      key: "timeFinish",
      render: (timeFinish) => (
        <span className="text-gray-600">{formatTimestamp(timeFinish)}</span>
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
      title: "Trạng thái hợp đồng",
      dataIndex: "contractStatus",
      key: "contractStatus",
      render: (status) => (
        <Tag color={status === "FINISHED" ? "success" : "error"}>
          {translateENtoVI(status)}
        </Tag>
      ),
      filters: [
        { text: "Đã hoàn thành", value: "FINISHED" },
        { text: "Đã hủy", value: "CANCELLED" },
      ],
      onFilter: (value, record) => record.contractStatus === value,
      align: "center",
    },
    // {
    //   title: "Người duyệt",
    //   key: "approver",
    //   render: (_, record) =>
    //     record.contractStatus === "FINISHED" && record.userName ? (
    //       <div className="text-sm">
    //         <div className="font-medium">{record.userName}</div>
    //         <div className="text-gray-500">
    //           {formatTimestamp(record.updatedAt)}
    //         </div>
    //       </div>
    //     ) : null,
    // },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
        </div>
      ),
      align: "center",
    },
  ];

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
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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

      {/* Contract Details Modal */}
      <Modal
        title="Chi tiết hợp đồng"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={900}
      >
        {selectedContract && (
          <div className="pt-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin hợp đồng
              </h3>
              <Descriptions bordered column={1} size="middle">
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
                    {formatTimestamp(selectedContract.timeFinish)}
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
                  <Tag
                    color={
                      selectedContract.contractStatus === "FINISHED"
                        ? "success"
                        : "error"
                    }
                  >
                    {translateENtoVI(selectedContract.contractStatus)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo" span={1}>
                  {formatTimestamp(selectedContract.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin chủ xe */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin chủ xe
              </h3>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Họ và tên" span={1}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold">
                      {selectedContract.providerName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedContract.providerEmail}</span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại" span={1}>
                  <div className="flex items-center gap-2">
                    <PhoneOutlined />
                    <span className="font-semibold">
                      {selectedContract.providerPhone}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Ngân hàng thụ hưởng" span={1}>
                  <div className="flex items-center gap-2">
                    <BankOutlined />
                    <span className="font-semibold">
                      {selectedContract.providerBankAccountType}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Tên chủ thẻ" span={1}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {selectedContract.providerBankAccountName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Số tài khoản" span={1}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {selectedContract.providerBankAccountNumber}
                    </span>
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
                  src={selectedContract.image ?? undefined}
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
                <Descriptions bordered column={1} size="middle">
                  <Descriptions.Item label="Người duyệt" span={1}>
                    <span className="font-semibold">
                      {selectedContract.userName}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian duyệt" span={1}>
                    {formatTimestamp(selectedContract.updatedAt)}
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
