"use client";

import { useState, useEffect, JSX } from "react";
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
  notification,
  Spin,
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
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import AdminLayout from "@/layouts/AdminLayout";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getReportsByType,
  searchReports,
  getReportDetail,
  getReportTypeMapping,
  calculateReportStatistics,
} from "@/apis/report.api";

const { Title } = Typography;
const { Search } = Input;

// TypeScript Interfaces
interface ReportGroupedByTargetDTO {
  targetId: string;
  reportedNameOrVehicle: string;
  email: string;
  type: string;
  count: number;
}

interface ReporterDetailDTO {
  id: string;
  fullName: string;
  email: string;
  reason: string;
  createdAt: string;
}

interface ReportSummaryDTO {
  reportId: string;
  type: string;
  // Xóa totalReports và reportTypes vì không có trong response
}

interface ReportedUserDTO {
  id: string;
  fullName: string;
  email: string;
}

interface ReportDetailDTO {
  reportSummary: ReportSummaryDTO;
  reportedUser: ReportedUserDTO;
  reporters: ReporterDetailDTO[];
}

interface AggregatedReport {
  id: string;
  reportedUserName: string;
  reportedUserEmail: string;
  reportCount: number;
  types: Set<string>;
}

type ReportType =
  // Serious Reports
  | "DAMAGED_VEHICLE"
  | "FRAUD"
  | "MISLEADING_INFO"
  | "OWNER_NO_SHOW"
  | "OWNER_CANCEL_UNREASONABLY"
  | "DOCUMENT_ISSUE"
  | "TECHNICAL_ISSUE"
  | "UNSAFE_VEHICLE"
  | "FUEL_LEVEL_INCORRECT"
  | "NO_INSURANCE"
  | "EXPIRED_INSURANCE"
  | "FAKE_DOCUMENT"
  | "FAKE_ORDER"
  | "DISPUTE_REFUND"
  | "LATE_RETURN_NO_CONTACT"
  // Non-serious Reports
  | "INAPPROPRIATE"
  | "VIOLENCE"
  | "SPAM"
  | "OTHERS"
  | "DIRTY_CAR"
  | "MISLEADING_LISTING"
  // Staff Reports
  | "STAFF_REPORT";

type Statistics = Record<string, number>;

export default function UserReportsPage() {
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [aggregatedReports, setAggregatedReports] = useState<
    ReportGroupedByTargetDTO[]
  >([]);
  const [searchText, setSearchText] = useState("");
  const [selectedReportDetail, setSelectedReportDetail] =
    useState<ReportDetailDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [statistics, setStatistics] = useState<Statistics>({});
  const [error, setError] = useState<string | null>(null);

  // Mapping tab sang generalType cho API
  const getGeneralTypeByTab = (tab: string): string => {
    switch (tab) {
      case "1":
        return "NON_SERIOUS_ERROR"; // Lỗi vi phạm
      case "2":
        return "SERIOUS_ERROR"; // Lỗi nghiêm trọng
      case "3":
        return "STAFF_ERROR"; // Lỗi gắn cờ
      default:
        return "NON_SERIOUS_ERROR";
    }
  };

  // Get report type mapping
  const typeMapping = getReportTypeMapping();

  // Xử lý lỗi API
  const handleApiError = (error: any, defaultMessage = "Có lỗi xảy ra") => {
    console.error("API Error:", error);
    const errorMessage =
      error.response?.data?.message || error.message || defaultMessage;
    setError(errorMessage);

    notification.error({
      message: "Lỗi",
      description: errorMessage,
      duration: 4,
    });
  };

  // Load dữ liệu báo cáo
  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const generalType = getGeneralTypeByTab(activeTab);

      let apiReports: ReportGroupedByTargetDTO[];
      if (searchText.trim()) {
        // Chỉ truyền searchText khi có giá trị
        apiReports = await searchReports(generalType, searchText);
      } else {
        apiReports = await getReportsByType(generalType, 0, 100);
      }

      setAggregatedReports(apiReports);

      // Tính thống kê từ dữ liệu đã load với null check
      const stats = calculateReportStatistics(apiReports, generalType);
      setStatistics(stats || {});
    } catch (error) {
      handleApiError(error, "Không thể tải danh sách báo cáo");
      setAggregatedReports([]);
      setStatistics({} as Statistics);
    } finally {
      setLoading(false);
    }
  };

  // Effect để load dữ liệu khi tab thay đổi
  useEffect(() => {
    loadReports();
  }, [activeTab]);

  // Effect để search với debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchText !== "") {
        loadReports();
      } else {
        // Reset về dữ liệu ban đầu khi clear search
        loadReports();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  // Xử lý xem chi tiết - Sử dụng type cụ thể thay vì generalType
  const handleViewDetails = async (report: ReportGroupedByTargetDTO) => {
    try {
      setModalLoading(true);
      const reportDetail = await getReportDetail(report.targetId, report.type);

      // Validate response structure
      if (
        !reportDetail ||
        !reportDetail.reportedUser ||
        !reportDetail.reporters
      ) {
        throw new Error("Invalid response structure");
      }

      setSelectedReportDetail(reportDetail);
      setIsModalVisible(true);
    } catch (error) {
      handleApiError(error, "Không thể tải chi tiết báo cáo");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedReportDetail(null);
  };

  // Safe getter functions
  const getTypeColor = (type: string): string => {
    const reportType = type as ReportType;
    return typeMapping[reportType]?.color || "default";
  };

  const getTypeText = (type: string): string => {
    const reportType = type as ReportType;
    return typeMapping[reportType]?.label || type;
  };

  const getTypeIcon = (type: string): JSX.Element => {
    switch (type) {
      // Non-serious errors
      case "SPAM":
      case "DIRTY_CAR":
        return <AlertOutlined />;
      case "INAPPROPRIATE":
      case "VIOLENCE":
      case "MISLEADING_LISTING":
        return <WarningOutlined />;

      // Serious errors
      case "FRAUD":
      case "FAKE_DOCUMENT":
      case "FAKE_ORDER":
        return <BugOutlined />;
      case "DAMAGED_VEHICLE":
      case "TECHNICAL_ISSUE":
      case "UNSAFE_VEHICLE":
      case "FUEL_LEVEL_INCORRECT":
      case "NO_INSURANCE":
      case "EXPIRED_INSURANCE":
        return <WarningOutlined />;
      case "MISLEADING_INFO":
      case "OWNER_NO_SHOW":
      case "OWNER_CANCEL_UNREASONABLY":
      case "DOCUMENT_ISSUE":
      case "DISPUTE_REFUND":
      case "LATE_RETURN_NO_CONTACT":
        return <ExclamationCircleOutlined />;

      // Staff errors
      case "STAFF_REPORT":
      case "OTHERS":
        return <InfoCircleOutlined />;

      default:
        return <InfoCircleOutlined />;
    }
  };

  // Transform data để phù hợp với AggregatedReport interface
  const transformToAggregatedReports = (
    reports: ReportGroupedByTargetDTO[]
  ): AggregatedReport[] => {
    return reports.map((report) => ({
      id: report.targetId,
      reportedUserName: report.reportedNameOrVehicle,
      reportedUserEmail: report.email || "N/A",
      reportCount: report.count,
      types: new Set([report.type]),
    }));
  };

  // Columns cho bảng tổng hợp
  const aggregatedColumns: ColumnsType<AggregatedReport> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Người bị báo cáo/ Xe bị báo cáo",
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
      sorter: (a, b) => a.reportedUserName.localeCompare(b.reportedUserName),
    },
    {
      title: "Loại báo cáo",
      key: "types",
      render: (record: AggregatedReport) => (
        <div className="flex gap-1 flex-wrap">
          {Array.from(record.types).map((type) => (
            <Tag key={type} color={getTypeColor(type)} icon={getTypeIcon(type)}>
              {getTypeText(type)}
            </Tag>
          ))}
        </div>
      ),
      filters: [
        // Non-serious Errors
        { text: "Spam", value: "SPAM" },
        { text: "Ngôn từ không phù hợp", value: "INAPPROPRIATE" },
        { text: "Bạo lực", value: "VIOLENCE" },
        { text: "Xe bẩn", value: "DIRTY_CAR" },
        { text: "Thông tin sai trong bài đăng", value: "MISLEADING_LISTING" },
        { text: "Khác", value: "OTHERS" },

        // Serious Errors
        { text: "Khách làm hư hỏng xe", value: "DAMAGED_VEHICLE" },
        { text: "Gian lận", value: "FRAUD" },
        { text: "Xe khác với mô tả", value: "MISLEADING_INFO" },
        { text: "Chủ xe không giao xe", value: "OWNER_NO_SHOW" },
        {
          text: "Chủ xe hủy đơn không lý do",
          value: "OWNER_CANCEL_UNREASONABLY",
        },
        { text: "Giấy tờ sai/mất", value: "DOCUMENT_ISSUE" },
        { text: "Xe bị lỗi kỹ thuật", value: "TECHNICAL_ISSUE" },
        { text: "Xe không an toàn", value: "UNSAFE_VEHICLE" },
        { text: "Mức nhiên liệu không đúng", value: "FUEL_LEVEL_INCORRECT" },
        { text: "Không có bảo hiểm", value: "NO_INSURANCE" },
        { text: "Bảo hiểm hết hạn", value: "EXPIRED_INSURANCE" },
        { text: "Giấy tờ giả", value: "FAKE_DOCUMENT" },
        { text: "Đặt đơn giả", value: "FAKE_ORDER" },
        { text: "Tranh chấp hoàn tiền/phạt", value: "DISPUTE_REFUND" },
        {
          text: "Không trả xe đúng hạn và mất liên lạc",
          value: "LATE_RETURN_NO_CONTACT",
        },

        // Staff Errors
        { text: "Báo cáo bởi nhân viên", value: "STAFF_REPORT" },
      ],
      onFilter: (value, record) =>
        Array.from(record.types).includes(value as string),
      align: "center",
    },
    {
      title: "Tổng số báo cáo",
      dataIndex: "reportCount",
      key: "reportCount",
      render: (count: number) => (
        <span className="font-semibold text-red-600">{count}</span>
      ),
      sorter: (a, b) => a.reportCount - b.reportCount,
      align: "center",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => {
        // Tìm report gốc từ aggregatedReports để pass vào handleViewDetails
        const originalReport = aggregatedReports.find(
          (r) => r.targetId === record.id
        );
        return (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            loading={modalLoading}
            onClick={() => originalReport && handleViewDetails(originalReport)}
          >
            Chi tiết
          </Button>
        );
      },
      align: "center",
    },
  ];

  // Lấy thống kê theo tab hiện tại
  const getActiveTabStats = () => {
    const generalType = getGeneralTypeByTab(activeTab);

    const relevantTypes: ReportType[] = [];
    if (generalType === "NON_SERIOUS_ERROR") {
      relevantTypes.push(
        "INAPPROPRIATE",
        "VIOLENCE",
        "SPAM",
        "OTHERS",
        "DIRTY_CAR",
        "MISLEADING_LISTING"
      );
    } else if (generalType === "SERIOUS_ERROR") {
      relevantTypes.push(
        "DAMAGED_VEHICLE",
        "FRAUD",
        "MISLEADING_INFO",
        "OWNER_NO_SHOW",
        "OWNER_CANCEL_UNREASONABLY",
        "DOCUMENT_ISSUE",
        "TECHNICAL_ISSUE",
        "UNSAFE_VEHICLE",
        "FUEL_LEVEL_INCORRECT",
        "NO_INSURANCE",
        "EXPIRED_INSURANCE",
        "FAKE_DOCUMENT",
        "FAKE_ORDER",
        "DISPUTE_REFUND",
        "LATE_RETURN_NO_CONTACT"
      );
    } else if (generalType === "STAFF_ERROR") {
      relevantTypes.push("STAFF_REPORT");
    }

    return relevantTypes.map((type) => ({
      label: typeMapping[type]?.label || type,
      count: statistics[type] || 0,
      type: type,
    }));
  };

  const activeTabStats = getActiveTabStats();
  const totalCount = activeTabStats.reduce((sum, stat) => sum + stat.count, 0);

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
              placeholder="Tìm kiếm theo tên người bị báo cáo"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTabStats.map((stat) => (
          <div key={stat.type} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-xl font-semibold">{stat.count}</div>
          </div>
        ))}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-500">Tổng số vi phạm</div>
          <div className="text-xl font-semibold">{totalCount}</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

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
              dataSource={transformToAggregatedReports(aggregatedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} người vi phạm`,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              locale={{
                emptyText: loading ? <Spin /> : "Không có dữ liệu",
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi nghiêm trọng" key="2">
            <Table
              columns={aggregatedColumns}
              dataSource={transformToAggregatedReports(aggregatedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} người vi phạm`,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              locale={{
                emptyText: loading ? <Spin /> : "Không có dữ liệu",
              }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi gắn cờ" key="3">
            <Table
              columns={aggregatedColumns}
              dataSource={transformToAggregatedReports(aggregatedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng ${total} người vi phạm`,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              locale={{
                emptyText: loading ? <Spin /> : "Không có dữ liệu",
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
              {selectedReportDetail && (
                <div className="text-sm text-gray-500">
                  Người dùng: {selectedReportDetail.reportedUser.fullName}
                </div>
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={1000}
        className="top-8"
        footer={[
          <Button key="close" onClick={handleCancel}>
            Đóng
          </Button>,
        ]}
      >
        {selectedReportDetail && (
          <div className="pt-4 space-y-6">
            {/* Tổng quan báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Tổng quan báo cáo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Mã báo cáo</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {selectedReportDetail.reportSummary.reportId}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Số lượt báo cáo</div>
                  <div className="text-xl font-semibold">
                    {selectedReportDetail.reporters.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Loại báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Loại báo cáo
              </h3>
              <div className="flex gap-2 flex-wrap">
                <Tag
                  color={getTypeColor(selectedReportDetail.reportSummary.type)}
                  icon={getTypeIcon(selectedReportDetail.reportSummary.type)}
                >
                  {getTypeText(selectedReportDetail.reportSummary.type)}
                </Tag>
              </div>
            </div>

            {/* Thông tin người bị báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Thông tin người/ xe bị báo cáo
              </h3>
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="Họ và tên/ Biển số xe" span={1}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <span className="font-semibold">
                      {selectedReportDetail.reportedUser.fullName}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <div className="flex items-center gap-2">
                    <MailOutlined />
                    <span>
                      {selectedReportDetail.reportedUser.email || "N/A"}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng số báo cáo" span={1}>
                  <span className="font-semibold">
                    {selectedReportDetail.reporters?.length || 0}
                  </span>{" "}
                  báo cáo
                </Descriptions.Item>
                <Descriptions.Item label="Mã báo cáo" span={1}>
                  <span className="font-mono text-sm">
                    {selectedReportDetail.reportSummary.reportId}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Danh sách người báo cáo */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Danh sách người báo cáo
              </h3>
              <Table
                dataSource={selectedReportDetail.reporters}
                columns={[
                  {
                    title: "STT",
                    key: "index",
                    width: 60,
                    render: (_, __, index) => index + 1,
                    align: "center",
                  },
                  {
                    title: "Người báo cáo",
                    key: "reporter",
                    render: (_, record: ReporterDetailDTO) => (
                      <div className="flex items-center gap-3">
                        <Avatar icon={<UserOutlined />} size="small" />
                        <div>
                          <div className="font-medium">{record.fullName}</div>
                          <div className="text-xs text-gray-500">
                            <MailOutlined className="mr-1" />
                            {record.email}
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "Lý do báo cáo",
                    dataIndex: "reason",
                    key: "reason",
                    render: (reason: string) => (
                      <div className="max-w-xs whitespace-normal">{reason}</div>
                    ),
                  },
                  {
                    title: "Ngày báo cáo",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (date: string) => (
                      <span>{dayjs(date).format("DD/MM/YYYY HH:mm")}</span>
                    ),
                  },
                ]}
                pagination={false}
                scroll={{ y: 300 }}
                size="small"
                rowKey="id"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

UserReportsPage.Layout = AdminLayout;
