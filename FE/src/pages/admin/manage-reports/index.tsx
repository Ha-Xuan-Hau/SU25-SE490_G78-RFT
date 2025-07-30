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
  Tabs,
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

interface AggregatedReport {
  id: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportCount: number;
  reports: SystemReport[];
  types: Set<SystemReport["type"]>;
}

export default function UserReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SystemReport[]>(mockReports);
  const [searchText, setSearchText] = useState("");
  const [selectedReport, setSelectedReport] = useState<SystemReport | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

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

  // Thêm state cho tab đang chọn

  // Phân loại báo cáo theo mức độ
  const violationReports = reports.filter((r) =>
    ["SPAM", "INAPPROPRIATE"].includes(r.type)
  );

  const severeReports = reports.filter((r) =>
    ["FRAUD", "VIOLENCE"].includes(r.type)
  );

  const flaggedReports = reports.filter((r) => ["OTHER"].includes(r.type));

  // Hàm gộp báo cáo theo người bị báo cáo
  const aggregateReports = (reports: SystemReport[]) => {
    const grouped = reports.reduce((acc, report) => {
      if (!acc[report.reportedUserId]) {
        acc[report.reportedUserId] = {
          id: report.reportedUserId,
          reportedUserName: report.reportedUserName,
          reportedUserEmail: report.reportedUserEmail,
          reportCount: 0,
          reports: [],
          types: new Set(),
        };
      }
      acc[report.reportedUserId].reportCount++;
      acc[report.reportedUserId].reports.push(report);
      acc[report.reportedUserId].types.add(report.type);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  };

  // Columns cho bảng tổng hợp
  const aggregatedColumns: ColumnsType<AggregatedReport> = [
    {
      title: "Người bị báo cáo",
      key: "reportedUser",
      render: (record: AggregatedReport) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.reportedUserName}</div>
            <div className="text-xs text-gray-500">
              <MailOutlined className="mr-1" />
              {record.reportedUserEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Loại báo cáo",
      key: "types",
      render: (record: AggregatedReport) => (
        <div>
          {Array.from(record.types).map((type) => (
            <Tag color={getTypeColor(type)} key={type}>
              {getTypeText(type)}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Tổng số báo cáo",
      dataIndex: "reportCount",
      key: "reportCount",
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.reportCount - b.reportCount,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (record: AggregatedReport) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record.reports[0])}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  // Thêm hàm để lấy số liệu thống kê theo tab
  const getActiveTabStats = () => {
    switch (activeTab) {
      case "1": // Lỗi vi phạm
        return [
          {
            label: "Spam",
            count: reports.filter((r) => r.type === "SPAM").length,
            type: "SPAM",
          },
          {
            label: "Không phù hợp",
            count: reports.filter((r) => r.type === "INAPPROPRIATE").length,
            type: "INAPPROPRIATE",
          },
        ];
      case "2": // Lỗi nghiêm trọng
        return [
          {
            label: "Lừa đảo",
            count: reports.filter((r) => r.type === "FRAUD").length,
            type: "FRAUD",
          },
          {
            label: "Bạo lực",
            count: reports.filter((r) => r.type === "VIOLENCE").length,
            type: "VIOLENCE",
          },
        ];
      case "3": // Lỗi gắn cờ
        return [
          {
            label: "Khác",
            count: reports.filter((r) => r.type === "OTHER").length,
            type: "OTHER",
          },
        ];
      default:
        return [];
    }
  };

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
            {getActiveTabStats().map((stat) => (
              <span key={stat.type}>
                {stat.label}: <span className="font-semibold">{stat.count}</span>
              </span>
            ))}
            <span>
              Tổng:{" "}
              <span className="font-semibold">
                {getActiveTabStats().reduce((sum, stat) => sum + stat.count, 0)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {getActiveTabStats().map((stat) => (
          <div key={stat.type} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-xl font-semibold">{stat.count}</div>
          </div>
        ))}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Tổng số vi phạm</div>
          <div className="text-xl font-semibold">
            {getActiveTabStats().reduce((sum, stat) => sum + stat.count, 0)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-6 pt-4"
        >
          <Tabs.TabPane tab="Lỗi vi phạm" key="1">
            <Table
              columns={aggregatedColumns}
              dataSource={aggregateReports(violationReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} người vi phạm`,
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi nghiêm trọng" key="2">
            <Table
              columns={aggregatedColumns}
              dataSource={aggregateReports(severeReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} người vi phạm`,
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi gắn cờ" key="3">
            <Table
              columns={aggregatedColumns}
              dataSource={aggregateReports(flaggedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} người vi phạm`,
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>

      {/* Report Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <WarningOutlined className="text-xl" />
            <div>
              <div className="font-semibold text-lg">Chi tiết báo cáo</div>
              {selectedReport && (
                <div className="text-sm text-gray-500">
                  Người dùng: {selectedReport.reportedUserName}
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
            {/* Loại báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Loại báo cáo
              </h3>
              <div className="flex gap-2">
                {Array.from(new Set(reports
                  .filter(r => r.reportedUserId === selectedReport.reportedUserId)
                  .map(r => r.type)))
                  .map(type => (
                    <Tag
                      key={type}
                      color={getTypeColor(type)}
                      icon={getTypeIcon(type)}
                    >
                      {getTypeText(type)}
                    </Tag>
                  ))}
              </div>
            </div>

            {/* Thông tin người bị báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin người bị báo cáo
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
                <Descriptions.Item label="Tổng số báo cáo" span={2}>
                  <span className="font-semibold">
                    {reports.filter(r => r.reportedUserId === selectedReport.reportedUserId).length}
                  </span> báo cáo
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Danh sách báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Danh sách báo cáo
              </h3>
              <Table
                dataSource={reports.filter(
                  r => r.reportedUserId === selectedReport.reportedUserId
                )}
                columns={[
                  {
                    title: "Mã báo cáo",
                    dataIndex: "id",
                    key: "id",
                    render: (id) => (
                      <span className="font-mono font-semibold">{id}</span>
                    ),
                  },
                  {
                    title: "Người báo cáo",
                    key: "reporter",
                    render: (_, record) => (
                      <div>
                        <div className="font-medium">{record.reporterName}</div>
                        <div className="text-xs text-gray-500">
                          <MailOutlined className="mr-1" />
                          {record.reporterEmail}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Lý do báo cáo",
                    dataIndex: "reason",
                    key: "reason",
                    render: (reason) => (
                      <div className="max-w-xs whitespace-normal">{reason}</div>
                    ),
                  },
                  {
                    title: "Ngày báo cáo",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (date) => (
                      <span>{dayjs(date).format("DD/MM/YYYY HH:mm")}</span>
                    ),
                  },
                ]}
                pagination={false}
                scroll={{ y: 300 }}
                size="small"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

UserReportsPage.Layout = AdminLayout;
