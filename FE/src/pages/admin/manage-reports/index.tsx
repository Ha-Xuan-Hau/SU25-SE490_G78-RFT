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
  Card,
  Row,
  Col,
  Space,
  Drawer,
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
  MenuOutlined,
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
import {
  AggregatedReport,
  ReportDetailDTO,
  ReporterDetailDTO,
  ReportGroupedByTargetDTO,
} from "@/types/report";

const { Title } = Typography;
const { Search } = Input;
import ReportButton from "@/components/ReportComponent";

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

  // state report
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTargetForReport, setSelectedTargetForReport] = useState<
    string | null
  >(null);

  const [reportReporterModalVisible, setReportReporterModalVisible] =
    useState(false);
  const [selectedReporterForReport, setSelectedReporterForReport] = useState<
    string | null
  >(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      if (isMobile) {
        setDrawerVisible(true);
      }
    } catch (error) {
      handleApiError(error, "Không thể tải chi tiết báo cáo");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedReportDetail(null);
    setDrawerVisible(false);
  };

  const canCreateStaffReport = (reportDetail: ReportDetailDTO): boolean => {
    const generalType = getGeneralTypeByTab(activeTab);

    if (generalType === "SERIOUS_ERROR") {
      // Lỗi nghiêm trọng: có thể báo cáo luôn
      return true;
    } else if (generalType === "NON_SERIOUS_ERROR") {
      // Lỗi vi phạm: cần ít nhất 10 lượt báo cáo
      return reportDetail.reporters.length >= 10;
    }

    return false;
  };

  // Handler tạo báo cáo staff
  const handleCreateStaffReport = (targetId: string) => {
    setSelectedTargetForReport(targetId);
    setReportModalVisible(true);
  };

  // Handler khi đóng modal báo cáo
  const handleReportModalClose = () => {
    setReportModalVisible(false);
    setSelectedTargetForReport(null);
    // Refresh data sau khi báo cáo thành công
    loadReports();
  };

  // Handler báo cáo người báo cáo (spam)
  const handleReportReporter = (reporterId: string) => {
    console.log("handleReportReporter called with reporterId:", reporterId);
    setSelectedReporterForReport(reporterId);
    setReportReporterModalVisible(true);
  };

  // Handler khi đóng modal báo cáo người báo cáo
  const handleReportReporterModalClose = () => {
    setReportReporterModalVisible(false);
    setSelectedReporterForReport(null);
    // Refresh data sau khi báo cáo thành công
    loadReports();
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

  // Mobile columns cho bảng
  const mobileColumns: ColumnsType<AggregatedReport> = [
    {
      title: "Thông tin",
      key: "info",
      render: (record: AggregatedReport) => (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Avatar icon={<UserOutlined />} size="small" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {record.reportedUserName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {record.reportedUserEmail}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {Array.from(record.types).map((type) => (
                <Tag key={type} color={getTypeColor(type)} className="text-xs">
                  {getTypeText(type)}
                </Tag>
              ))}
            </div>
            <span className="text-red-600 font-semibold text-sm">
              {record.reportCount} báo cáo
            </span>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            loading={modalLoading}
            onClick={() => {
              const originalReport = aggregatedReports.find(
                (r) => r.targetId === record.id
              );
              if (originalReport) {
                handleViewDetails(originalReport);
              }
            }}
            className="w-full"
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
  ];

  // Desktop columns cho bảng
  const desktopColumns: ColumnsType<AggregatedReport> = [
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

  // Mobile Reporter Table Component
  const MobileReporterTable = ({
    reporters,
  }: {
    reporters: ReporterDetailDTO[];
  }) => (
    <div className="space-y-3">
      {reporters.map((reporter, index) => (
        <Card key={reporter.id} size="small" className="border border-gray-200">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-gray-500 font-medium">
                  #{index + 1}
                </span>
                <Avatar icon={<UserOutlined />} size="small" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {reporter.fullName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    <MailOutlined className="mr-1" />
                    {reporter.email}
                  </div>
                </div>
              </div>
              <Button
                size="small"
                type="text"
                danger
                icon={<WarningOutlined />}
                onClick={() => handleReportReporter(reporter.id)}
                className="shrink-0"
              >
                Báo cáo
              </Button>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-500">Lý do:</div>
              <div className="text-sm bg-gray-50 p-2 rounded text-gray-700">
                {reporter.reason}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {dayjs(reporter.createdAt).format("DD/MM/YYYY HH:mm")}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // Detail Modal/Drawer Content
  const DetailContent = () => (
    <div className="space-y-6">
      {selectedReportDetail && (
        <>
          {/* Tổng quan báo cáo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Tổng quan báo cáo
            </h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card size="small" className="bg-gray-50">
                  <div className="text-sm text-gray-500">Mã báo cáo</div>
                  <div className="text-lg font-semibold text-blue-600">
                    {selectedReportDetail.reportSummary.reportId}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Điều kiện tạo báo cáo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Trạng thái xử lý
            </h3>
            <Card className="bg-gray-50">
              {(() => {
                const generalType = getGeneralTypeByTab(activeTab);
                const reportCount = selectedReportDetail.reporters.length;
                const canReport = canCreateStaffReport(selectedReportDetail);

                if (generalType === "SERIOUS_ERROR") {
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          canReport ? "bg-red-500" : "bg-gray-400"
                        }`}
                      ></div>
                      <div>
                        <div className="font-medium text-red-600">
                          Lỗi nghiêm trọng
                        </div>
                        <div className="text-sm text-gray-600">
                          Có thể tạo báo cáo vi phạm ngay lập tức
                        </div>
                      </div>
                    </div>
                  );
                } else if (generalType === "NON_SERIOUS_ERROR") {
                  return (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          canReport ? "bg-red-500" : "bg-yellow-500"
                        }`}
                      ></div>
                      <div>
                        <div
                          className={`font-medium ${
                            canReport ? "text-red-600" : "text-yellow-600"
                          }`}
                        >
                          {canReport
                            ? "Đủ điều kiện tạo báo cáo"
                            : "Chưa đủ điều kiện"}
                        </div>
                        <div className="text-sm text-gray-600">
                          Cần ít nhất 10 lượt báo cáo (hiện tại: {reportCount}
                          /10)
                        </div>
                        {!canReport && (
                          <div className="text-xs text-gray-500 mt-1">
                            Còn thiếu {10 - reportCount} lượt báo cáo
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </Card>
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
              Thông tin người
            </h3>
            <Descriptions
              bordered
              column={isMobile ? 1 : 2}
              size="middle"
              layout={isMobile ? "vertical" : "horizontal"}
            >
              <Descriptions.Item label="Họ và tên" span={1}>
                <div className="flex items-center gap-2">
                  <UserOutlined />
                  <span className="font-semibold">
                    {selectedReportDetail.reportedUser.fullName}
                  </span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượt bị báo cáo" span={1}>
                <span className="font-semibold">
                  {selectedReportDetail.reporters?.length || 0}
                </span>{" "}
                báo cáo
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={1}>
                <div className="flex items-center gap-2">
                  <MailOutlined />
                  <span>
                    {selectedReportDetail.reportedUser.email || "N/A"}
                  </span>
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Danh sách người báo cáo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Danh sách người báo cáo ({selectedReportDetail.reporters.length})
            </h3>

            {isMobile ? (
              <MobileReporterTable reporters={selectedReportDetail.reporters} />
            ) : (
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
                  {
                    title: "Thao tác",
                    key: "action",
                    width: 100,
                    render: (_, record: ReporterDetailDTO) => (
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<WarningOutlined />}
                        onClick={() => handleReportReporter(record.id)}
                        title="Báo cáo người dùng spam"
                        className="hover:bg-red-50"
                      >
                        Báo cáo
                      </Button>
                    ),
                    align: "center",
                  },
                ]}
                pagination={false}
                scroll={{ y: 300 }}
                size="small"
                rowKey="id"
              />
            )}
          </div>

          {/* Lưu ý báo cáo spam */}
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-2">
              <WarningOutlined className="text-yellow-600 mt-1" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium mb-1">Lưu ý về báo cáo spam:</div>
                <p>
                  Bạn có thể báo cáo những người dùng có hành vi spam báo cáo
                  (báo cáo không đúng sự thật, báo cáo quá nhiều lần không có
                  căn cứ). Việc này giúp duy trì chất lượng hệ thống báo cáo.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="text-center md:text-left">
        <Title level={2} className="!mb-2 text-xl md:text-2xl">
          Báo cáo hệ thống
        </Title>
        <p className="text-gray-600 text-sm md:text-base">
          Xem các báo cáo vi phạm từ người dùng trong hệ thống
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên người, biển số xe bị báo cáo"
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
      <Row gutter={[8, 8]} className="md:gutter-16">
        {activeTabStats.map((stat) => (
          <Col key={stat.type} xs={12} sm={8} md={6}>
            <Card size="small" className="text-center">
              <div
                className="text-xs md:text-sm text-gray-500 mb-1 truncate"
                title={stat.label}
              >
                {stat.label}
              </div>
              <div className="text-lg md:text-xl font-semibold">
                {stat.count}
              </div>
            </Card>
          </Col>
        ))}
        <Col xs={12} sm={8} md={6}>
          <Card size="small" className="text-center">
            <div className="text-xs md:text-sm text-gray-500 mb-1">
              Tổng số vi phạm
            </div>
            <div className="text-lg md:text-xl font-semibold">{totalCount}</div>
          </Card>
        </Col>
      </Row>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="text-red-800 text-sm">{error}</div>
        </Card>
      )}

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? "small" : "middle"}
          className={isMobile ? "px-2" : ""}
        >
          <Tabs.TabPane tab="Lỗi vi phạm" key="1">
            <Table
              columns={isMobile ? mobileColumns : desktopColumns}
              dataSource={transformToAggregatedReports(aggregatedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: isMobile ? 5 : 10,
                showTotal: (total) => `${total} người vi phạm`,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                simple: isMobile,
                size: isMobile ? "small" : "default",
              }}
              locale={{
                emptyText: loading ? <Spin /> : "Không có dữ liệu",
              }}
              scroll={isMobile ? { x: true } : undefined}
              size={isMobile ? "small" : "middle"}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi nghiêm trọng" key="2">
            <Table
              columns={isMobile ? mobileColumns : desktopColumns}
              dataSource={transformToAggregatedReports(aggregatedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: isMobile ? 5 : 10,
                showTotal: (total) => `${total} người vi phạm`,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                simple: isMobile,
                size: isMobile ? "small" : "default",
              }}
              locale={{
                emptyText: loading ? <Spin /> : "Không có dữ liệu",
              }}
              scroll={isMobile ? { x: true } : undefined}
              size={isMobile ? "small" : "middle"}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi gắn cờ" key="3">
            <Table
              columns={isMobile ? mobileColumns : desktopColumns}
              dataSource={transformToAggregatedReports(aggregatedReports)}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: isMobile ? 5 : 10,
                showTotal: (total) => `${total} người vi phạm`,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                simple: isMobile,
                size: isMobile ? "small" : "default",
              }}
              locale={{
                emptyText: loading ? <Spin /> : "Không có dữ liệu",
              }}
              scroll={isMobile ? { x: true } : undefined}
              size={isMobile ? "small" : "middle"}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Desktop Modal */}
      {!isMobile && (
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
            selectedReportDetail &&
              canCreateStaffReport(selectedReportDetail) && (
                <Button
                  key="report"
                  type="primary"
                  danger
                  icon={<WarningOutlined />}
                  onClick={() =>
                    handleCreateStaffReport(
                      selectedReportDetail.reportedUser.id
                    )
                  }
                >
                  Tạo báo cáo vi phạm
                </Button>
              ),
            <Button key="close" onClick={handleCancel}>
              Đóng
            </Button>,
          ]}
        >
          <DetailContent />
        </Modal>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <WarningOutlined />
              <div>
                <div className="font-semibold">Chi tiết báo cáo</div>
                {selectedReportDetail && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedReportDetail.reportedUser.fullName}
                  </div>
                )}
              </div>
            </div>
          }
          placement="bottom"
          height="90%"
          open={drawerVisible}
          onClose={handleCancel}
          extra={
            <Space>
              {selectedReportDetail &&
                canCreateStaffReport(selectedReportDetail) && (
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<WarningOutlined />}
                    onClick={() =>
                      handleCreateStaffReport(
                        selectedReportDetail.reportedUser.id
                      )
                    }
                  >
                    Báo cáo
                  </Button>
                )}
            </Space>
          }
        >
          <DetailContent />
        </Drawer>
      )}

      {/* ReportButton Modal - Chỉ render khi cần */}
      {reportModalVisible && selectedTargetForReport && (
        <ReportButton
          targetId={selectedTargetForReport}
          reportType="STAFF_REPORT" // Báo cáo loại STAFF_REPORT
          buttonText=""
          size="small"
          type="text"
          icon={false}
          autoOpen={true}
          onModalClose={handleReportModalClose}
        />
      )}

      {/* ReportButton Modal cho báo cáo người báo cáo spam */}
      {reportReporterModalVisible && selectedReporterForReport && (
        <ReportButton
          key={`reporter-spam-${selectedReporterForReport}-${Date.now()}`}
          targetId={selectedReporterForReport}
          reportType="STAFF_REPORT"
          buttonText=""
          size="small"
          type="text"
          icon={false}
          autoOpen={true}
          onModalClose={handleReportReporterModalClose}
        />
      )}
    </div>
  );
}

UserReportsPage.Layout = AdminLayout;
