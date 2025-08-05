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
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  WarningOutlined,
  UserOutlined,
  MailOutlined,
  AlertOutlined,
  BugOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title } = Typography;
const { Search } = Input;

export interface SystemReport {
  id: string;
  reporterId: string; // ID người báo cáo
  reportedUserId: string; // ID người bị báo cáo
  reporterName: string;
  reporterEmail: string;
  reportedUserName: string;
  reportedUserEmail: string;
  type: "SPAM" | "INAPPROPRIATE" | "FRAUD" | "VIOLENCE" | "OTHER";
  reason: string;
  createdAt: string;
}

// Mockup data cho báo cáo hệ thống
const mockReports: SystemReport[] = [
  {
    id: "report_001",
    reporterId: "user_003",
    reportedUserId: "user_004",
    reporterName: "Lê Minh Cường",
    reporterEmail: "leminhcuong@gmail.com",
    reportedUserName: "Phạm Thu Hà",
    reportedUserEmail: "phamthuha@gmail.com",
    type: "SPAM",
    reason: "Người dùng gửi tin nhắn quảng cáo không liên quan",
    createdAt: "2025-07-07T02:41:00Z",
  },
  {
    id: "report_002",
    reporterId: "user_003",
    reportedUserId: "user_002",
    reporterName: "Lê Minh Cường",
    reporterEmail: "leminhcuong@gmail.com",
    reportedUserName: "Trần Thị Bình",
    reportedUserEmail: "tranthibinh@gmail.com",
    type: "INAPPROPRIATE",
    reason: "Xe của người dùng không đúng như mô tả",
    createdAt: "2025-07-07T02:42:00Z",
  },
  {
    id: "report_003",
    reporterId: "user_001",
    reportedUserId: "user_005",
    reporterName: "Nguyễn Văn An",
    reporterEmail: "nguyenvanan@gmail.com",
    reportedUserName: "Hoàng Đức Minh",
    reportedUserEmail: "hoangducminh@gmail.com",
    type: "FRAUD",
    reason: "Người dùng lấy tiền cọc nhưng không giao xe",
    createdAt: "2025-07-06T14:30:00Z",
  },
  {
    id: "report_004",
    reporterId: "user_006",
    reportedUserId: "user_001",
    reporterName: "Võ Thị Lan",
    reporterEmail: "vothilan@gmail.com",
    reportedUserName: "Nguyễn Văn An",
    reportedUserEmail: "nguyenvanan@gmail.com",
    type: "INAPPROPRIATE",
    reason: "Hành vi không phù hợp khi giao xe",
    createdAt: "2025-07-05T16:15:00Z",
  },
  {
    id: "report_005",
    reporterId: "user_002",
    reportedUserId: "user_007",
    reporterName: "Trần Thị Bình",
    reporterEmail: "tranthibinh@gmail.com",
    reportedUserName: "Phan Văn Đức",
    reportedUserEmail: "phanvanduc@gmail.com",
    type: "VIOLENCE",
    reason: "Có hành vi đe dọa khi yêu cầu trả xe",
    createdAt: "2025-07-04T09:20:00Z",
  },
  {
    id: "report_006",
    reporterId: "user_008",
    reportedUserId: "user_003",
    reporterName: "Lý Thị Mai",
    reporterEmail: "lythimai@gmail.com",
    reportedUserName: "Lê Minh Cường",
    reportedUserEmail: "leminhcuong@gmail.com",
    type: "OTHER",
    reason: "Xe không được bảo dưỡng định kỳ, gây nguy hiểm",
    createdAt: "2025-07-03T11:45:00Z",
  },
  {
    id: "report_007",
    reporterId: "user_004",
    reportedUserId: "user_009",
    reporterName: "Phạm Thu Hà",
    reporterEmail: "phamthuha@gmail.com",
    reportedUserName: "Đinh Văn Hùng",
    reportedUserEmail: "dinhvanhung@gmail.com",
    type: "SPAM",
    reason: "Liên tục gọi điện quấy rối sau khi kết thúc giao dịch",
    createdAt: "2025-07-02T13:10:00Z",
  },
  {
    id: "report_008",
    reporterId: "user_010",
    reportedUserId: "user_006",
    reporterName: "Bùi Thị Hương",
    reporterEmail: "buithihuong@gmail.com",
    reportedUserName: "Võ Thị Lan",
    reportedUserEmail: "vothilan@gmail.com",
    type: "FRAUD",
    reason: "Tính thêm phí không có trong hợp đồng ban đầu",
    createdAt: "2025-07-01T08:30:00Z",
  },
];

export default function UserReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SystemReport[]>(mockReports);
  const [searchText, setSearchText] = useState("");
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Filter reports based on search text
  const filteredReports = reports.filter((report) => {
    const searchLower = searchText.toLowerCase();
    return (
      report.reporterName.toLowerCase().includes(searchLower) ||
      report.reporterEmail.toLowerCase().includes(searchLower) ||
      report.reportedUserName.toLowerCase().includes(searchLower) ||
      report.reportedUserEmail.toLowerCase().includes(searchLower) ||
      report.id.toLowerCase().includes(searchLower) ||
      report.reason.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (report: SystemReport) => {
    setSelectedReport(report);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SPAM":
        return "orange";
      case "INAPPROPRIATE":
        return "red";
      case "FRAUD":
        return "error";
      case "VIOLENCE":
        return "error";
      case "OTHER":
        return "default";
      default:
        return "default";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "SPAM":
        return "Spam";
      case "INAPPROPRIATE":
        return "Không phù hợp";
      case "FRAUD":
        return "Lừa đảo";
      case "VIOLENCE":
        return "Bạo lực";
      case "OTHER":
        return "Khác";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SPAM":
        return <AlertOutlined />;
      case "INAPPROPRIATE":
        return <WarningOutlined />;
      case "FRAUD":
        return <BugOutlined />;
      case "VIOLENCE":
        return <WarningOutlined />;
      case "OTHER":
        return <InfoCircleOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const columns: ColumnsType<SystemReport> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Mã báo cáo",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="font-mono font-semibold">{id}</span>,
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: "Người báo cáo",
      key: "reporter",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.reporterName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.reporterEmail}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.reporterName.localeCompare(b.reporterName),
    },
    {
      title: "Người bị báo cáo",
      key: "reported",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            icon={<UserOutlined />}
            style={{ backgroundColor: "#f56565" }}
          />
          <div>
            <div className="font-medium">{record.reportedUserName}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.reportedUserEmail}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.reportedUserName.localeCompare(b.reportedUserName),
    },
    {
      title: "Loại báo cáo",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
          {getTypeText(type)}
        </Tag>
      ),
      filters: [
        { text: "Spam", value: "SPAM" },
        { text: "Không phù hợp", value: "INAPPROPRIATE" },
        { text: "Lừa đảo", value: "FRAUD" },
        { text: "Bạo lực", value: "VIOLENCE" },
        { text: "Khác", value: "OTHER" },
      ],
      onFilter: (value, record) => record.type === value,
      align: "center",
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => (
        <div className="max-w-xs truncate" title={reason}>
          {reason}
        </div>
      ),
    },
    {
      title: "Ngày báo cáo",
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
      spam: reports.filter((r) => r.type === "SPAM").length,
      inappropriate: reports.filter((r) => r.type === "INAPPROPRIATE").length,
      fraud: reports.filter((r) => r.type === "FRAUD").length,
      violence: reports.filter((r) => r.type === "VIOLENCE").length,
      other: reports.filter((r) => r.type === "OTHER").length,
    };
  };

  const typeCounts = getTypeCounts();

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Báo cáo hệ thống
        </Title>
        <p className="text-gray-600">
          Xem các báo cáo vi phạm từ người dùng trong hệ thống
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên, email, mã báo cáo, lý do..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              Spam: <span className="font-semibold">{typeCounts.spam}</span>
            </span>
            <span>
              Không phù hợp:{" "}
              <span className="font-semibold">{typeCounts.inappropriate}</span>
            </span>
            <span>
              Lừa đảo: <span className="font-semibold">{typeCounts.fraud}</span>
            </span>
            <span>
              Bạo lực:{" "}
              <span className="font-semibold">{typeCounts.violence}</span>
            </span>
            <span>
              Tổng:{" "}
              <span className="font-semibold">{filteredReports.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Spam</div>
          <div className="text-xl font-semibold">{typeCounts.spam}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Không phù hợp</div>
          <div className="text-xl font-semibold">
            {typeCounts.inappropriate}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Lừa đảo</div>
          <div className="text-xl font-semibold">{typeCounts.fraud}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Bạo lực</div>
          <div className="text-xl font-semibold">{typeCounts.violence}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Khác</div>
          <div className="text-xl font-semibold">{typeCounts.other}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <Table
            columns={columns}
            dataSource={filteredReports}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} báo cáo`,
            }}
            scroll={{ x: 1400 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Report Details Modal (Read-only) */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <WarningOutlined className="text-xl" />
            <div>
              <div className="font-semibold text-lg">Chi tiết báo cáo</div>
              {selectedReport && (
                <div className="text-sm text-gray-500">
                  Mã: {selectedReport.id} - {getTypeText(selectedReport.type)}
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
          <Button key="close" onClick={handleCancel}>
            Đóng
          </Button>,
        ]}
      >
        {selectedReport && (
          <div className="pt-4 space-y-6">
            {/* Thông tin báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin báo cáo
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Mã báo cáo" span={1}>
                  <span className="font-mono font-semibold">
                    {selectedReport.id}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Loại báo cáo" span={1}>
                  <Tag
                    color={getTypeColor(selectedReport.type)}
                    icon={getTypeIcon(selectedReport.type)}
                  >
                    {getTypeText(selectedReport.type)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày báo cáo" span={2}>
                  {dayjs(selectedReport.createdAt).format(
                    "DD/MM/YYYY HH:mm:ss"
                  )}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin người báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Người báo cáo
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Họ và tên" span={1}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold">
                      {selectedReport.reporterName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedReport.reporterEmail}</span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="ID người dùng" span={2}>
                  <span className="font-mono">{selectedReport.reporterId}</span>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Thông tin người bị báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Người bị báo cáo
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Họ và tên" span={1}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold">
                      {selectedReport.reportedUserName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>{selectedReport.reportedUserEmail}</span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="ID người dùng" span={2}>
                  <span className="font-mono">
                    {selectedReport.reportedUserId}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Lý do báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Lý do báo cáo
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedReport.reason}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

UserReportsPage.Layout = AdminLayout;
