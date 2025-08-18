"use client";

import { useState, useEffect, JSX } from "react";
import {
  Typography,
  Table,
  Button,
  Tag,
  Input,
  Avatar,
  Tabs,
  Spin,
  Card,
  Row,
  Col,
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
import {
  getReportsByType,
  searchReports,
  getReportTypeMapping,
} from "@/apis/report.api";
import {
  ReportDetailDTO,
  ReportGroupedByTargetDTO,
  AggregatedNonSeriousReport,
} from "@/types/report";
import { showError } from "@/utils/toast.utils";
import { translateENtoVI } from "@/lib/viDictionary";

const { Title } = Typography;
const { Search } = Input;

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
  // Non-serious Reportsz
  | "INAPPROPRIATE"
  | "VIOLENCE"
  | "SPAM"
  | "OTHERS"
  | "DIRTY_CAR"
  | "MISLEADING_LISTING"
  // Staff Reports
  | "STAFF_REPORT";

type Statistics = Record<string, number>;

// Interface cho NON_SERIOUS aggregated data

export default function UserReportsPage() {
  const [loading, setLoading] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [reports, setReports] = useState<ReportGroupedByTargetDTO[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedReportDetail, setSelectedReportDetail] =
    useState<ReportDetailDTO | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [statistics, setStatistics] = useState<Statistics>({});

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
        return "NON_SERIOUS_ERROR";
      case "2":
        return "SERIOUS_ERROR";
      case "3":
        return "STAFF_ERROR";
      default:
        return "NON_SERIOUS_ERROR";
    }
  };

  // Get report type mapping
  const typeMapping = getReportTypeMapping();

  // Load dữ liệu báo cáo
  const loadReports = async () => {
    try {
      setLoading(true);

      // Clear old data when tab changes
      if (isTabChanging) {
        setReports([]);
        setStatistics({});
        setIsTabChanging(false);
      }

      const generalType = getGeneralTypeByTab(activeTab);

      let apiReports: ReportGroupedByTargetDTO[];
      if (searchText.trim()) {
        apiReports = await searchReports(generalType, searchText);
      } else {
        apiReports = await getReportsByType(generalType, 0, 100);
      }

      setReports(apiReports);

      // Calculate statistics
      const stats = apiReports.reduce((acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + report.count;
        return acc;
      }, {} as Statistics);
      setStatistics(stats);
    } catch (error) {
      showError("Không thể tải danh sách báo cáo");
      setReports([]);
      setStatistics({});
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
      loadReports();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchText]);

  // Handle tab change
  const handleTabChange = (key: string) => {
    setIsTabChanging(true);
    setActiveTab(key);
    setSearchText(""); // Clear search when changing tabs
    // Reset all modal states
    setReportModalVisible(false);
    setSelectedTargetForReport(null);
    setReportReporterModalVisible(false);
    setSelectedReporterForReport(null);
    setIsModalVisible(false);
    setSelectedReportDetail(null);
    setDrawerVisible(false);
  };

  // Transform NON_SERIOUS reports để group by targetId
  const transformNonSeriousReports = (
    reports: ReportGroupedByTargetDTO[]
  ): AggregatedNonSeriousReport[] => {
    const grouped = reports.reduce((acc, report) => {
      if (!acc[report.targetId]) {
        acc[report.targetId] = {
          targetId: report.targetId,
          reportedNameOrVehicle: report.reportedNameOrVehicle,
          email: report.email || "N/A",
          types: new Set<string>(),
          totalCount: 0,
          reports: [],
        };
      }

      acc[report.targetId].types.add(report.type);
      acc[report.targetId].totalCount += report.count;
      acc[report.targetId].reports.push(report);

      return acc;
    }, {} as Record<string, AggregatedNonSeriousReport>);

    return Object.values(grouped);
  };

  const handleViewDetails = (record: any) => {
    const generalType = getGeneralTypeByTab(activeTab);

    if (generalType === "NON_SERIOUS_ERROR") {
      // NON_SERIOUS: dùng targetId và type đầu tiên
      const firstReport = record.reports?.[0] || record;
      window.open(
        `/report-detail?targetId=${record.targetId}&type=${firstReport.type}&mode=grouped`,
        "_blank"
      );
    } else if (
      generalType === "SERIOUS_ERROR" ||
      generalType === "STAFF_ERROR"
    ) {
      // SERIOUS và STAFF: dùng reportId
      window.open(
        `/report-detail?reportId=${record.reportId}&mode=single`,
        "_blank"
      );
    }
  };

  // Helper functions
  const getTypeColor = (type: string): string => {
    const reportType = type as ReportType;
    return typeMapping[reportType]?.color || "default";
  };

  const getTypeIcon = (type: string): JSX.Element => {
    switch (type) {
      case "SPAM":
      case "DIRTY_CAR":
        return <AlertOutlined />;
      case "INAPPROPRIATE":
      case "VIOLENCE":
      case "MISLEADING_LISTING":
        return <WarningOutlined />;
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
      case "STAFF_REPORT":
      case "OTHERS":
        return <InfoCircleOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  // Columns cho NON_SERIOUS
  const getNonSeriousColumns = (): ColumnsType<AggregatedNonSeriousReport> => [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Người/Xe bị báo cáo",
      key: "reportedUser",
      render: (record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.reportedNameOrVehicle}</div>
            <div className="text-xs text-gray-500">
              <MailOutlined className="mr-1" />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Loại báo cáo",
      key: "types",
      render: (record) => (
        <div className="flex gap-1 flex-wrap">
          {Array.from(record.types).map((type) => (
            <Tag
              key={String(type)}
              color={getTypeColor(type as string)}
              icon={getTypeIcon(type as string)}
            >
              {translateENtoVI(type as string)}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Tổng số báo cáo",
      key: "totalCount",
      render: (record) => (
        <span className="font-semibold text-red-600">{record.totalCount}</span>
      ),
      align: "center",
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

  // Columns cho SERIOUS
  const getSeriousColumns = (): ColumnsType<ReportGroupedByTargetDTO> => [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Người/Xe bị báo cáo",
      key: "reportedUser",
      render: (record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.reportedNameOrVehicle}</div>
            <div className="text-xs text-gray-500">
              <MailOutlined className="mr-1" />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Loại báo cáo",
      key: "type",
      render: (record) => (
        <Tag color={getTypeColor(record.type)} icon={getTypeIcon(record.type)}>
          {translateENtoVI(record.type)}
        </Tag>
      ),
    },
    {
      title: "Mã báo cáo",
      dataIndex: "reportId",
      key: "reportId",
      render: (id) => (
        <span className="font-mono text-xs">{id?.substring(0, 8)}...</span>
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

  // Columns cho STAFF
  const getStaffColumns = (): ColumnsType<ReportGroupedByTargetDTO> => [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: "Người bị báo cáo",
      key: "reportedUser",
      render: (record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.reportedNameOrVehicle}</div>
            <div className="text-xs text-gray-500">
              <MailOutlined className="mr-1" />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Mã báo cáo",
      dataIndex: "reportId",
      key: "reportId",
      render: (id) => (
        <span className="font-mono text-xs">{id?.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Trạng thái kháng cáo",
      dataIndex: "additionalInfo",
      key: "additionalInfo",
      render: (info) => (
        <span className="text-sm text-gray-600">
          {info || "Chưa có kháng cáo"}
        </span>
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

  // Mobile columns
  const getMobileColumns = (type: string): ColumnsType<any> => [
    {
      title: "Thông tin",
      key: "info",
      render: (record: any) => (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Avatar icon={<UserOutlined />} size="small" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {record.reportedNameOrVehicle}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {record.email}
              </div>
            </div>
          </div>

          {type === "NON_SERIOUS" ? (
            <div className="flex gap-1 flex-wrap">
              {(Array.from(record.types || [record.type]) as string[]).map(
                (t) => (
                  <Tag key={t} color={getTypeColor(t)} className="text-xs">
                    {translateENtoVI(t)}
                  </Tag>
                )
              )}
            </div>
          ) : (
            <Tag color={getTypeColor(record.type)} className="text-xs">
              {translateENtoVI(record.type)}
            </Tag>
          )}

          <div className="flex items-center justify-between">
            <span className="text-red-600 font-semibold text-sm">
              {record.totalCount || record.count || 1} báo cáo
            </span>
            {record.reportId && (
              <span className="text-xs text-gray-500">
                #{record.reportId.substring(0, 6)}...
              </span>
            )}
          </div>

          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            className="w-full"
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
  ];

  // Get statistics for active tab
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
      label: translateENtoVI(type),
      count: statistics[type] || 0,
      type: type,
    }));
  };

  const activeTabStats = getActiveTabStats();
  const totalCount = activeTabStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="text-center md:text-left">
        <Title level={2} className="!mb-2 text-xl md:text-2xl">
          Báo cáo từ người dùng
        </Title>
        <p className="text-gray-600 text-sm md:text-base">
          Xem các báo cáo vi phạm từ người dùng cần được xử lý trong hệ thống
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
          <Col key={stat.type} xs={12} sm={8} md={6} lg={4}>
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
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" className="text-center bg-blue-50">
            <div className="text-xs md:text-sm text-blue-600 mb-1 font-medium">
              Tổng số vi phạm cần xử lý
            </div>
            <div className="text-lg md:text-xl font-bold text-blue-600">
              {totalCount}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          size={isMobile ? "small" : "middle"}
          className={isMobile ? "px-2" : ""}
        >
          <Tabs.TabPane tab="Lỗi vi phạm" key="1">
            <div className="relative">
              {loading && isTabChanging && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
              )}
              <Table
                columns={
                  isMobile
                    ? getMobileColumns("NON_SERIOUS")
                    : getNonSeriousColumns()
                }
                dataSource={transformNonSeriousReports(reports)}
                rowKey="targetId"
                loading={loading && !isTabChanging}
                pagination={{
                  pageSize: isMobile ? 5 : 10,
                  showTotal: (total) => `${total} người vi phạm`,
                  showSizeChanger: !isMobile,
                  simple: isMobile,
                }}
                locale={{
                  emptyText: loading ? <Spin /> : "Không có dữ liệu",
                }}
                scroll={isMobile ? { x: true } : undefined}
                size={isMobile ? "small" : "middle"}
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi nghiêm trọng" key="2">
            <div className="relative">
              {loading && isTabChanging && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
              )}
              <Table
                columns={
                  isMobile ? getMobileColumns("SERIOUS") : getSeriousColumns()
                }
                dataSource={reports}
                rowKey="reportId"
                loading={loading && !isTabChanging}
                pagination={{
                  pageSize: isMobile ? 5 : 10,
                  showTotal: (total) => `${total} báo cáo`,
                  showSizeChanger: !isMobile,
                  simple: isMobile,
                }}
                locale={{
                  emptyText: loading ? <Spin /> : "Không có dữ liệu",
                }}
                scroll={isMobile ? { x: true } : undefined}
                size={isMobile ? "small" : "middle"}
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane tab="Lỗi gắn cờ" key="3">
            <div className="relative">
              {loading && isTabChanging && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <Spin size="large" tip="Đang tải dữ liệu..." />
                </div>
              )}
              <Table
                columns={
                  isMobile ? getMobileColumns("STAFF") : getStaffColumns()
                }
                dataSource={reports}
                rowKey="reportId"
                loading={loading && !isTabChanging}
                pagination={{
                  pageSize: isMobile ? 5 : 10,
                  showTotal: (total) => `${total} báo cáo`,
                  showSizeChanger: !isMobile,
                  simple: isMobile,
                }}
                locale={{
                  emptyText: loading ? <Spin /> : "Không có dữ liệu",
                }}
                scroll={isMobile ? { x: true } : undefined}
                size={isMobile ? "small" : "middle"}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

UserReportsPage.Layout = AdminLayout;
