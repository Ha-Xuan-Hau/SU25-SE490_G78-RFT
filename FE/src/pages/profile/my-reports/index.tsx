"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  Table,
  Button,
  Tag,
  Avatar,
  Spin,
  Card,
  Row,
  Col,
  Space,
  Tooltip,
  Progress,
  Empty,
  Alert,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import ProfileLayout from "@/layouts/ProfileLayout";
import type { ColumnsType } from "antd/es/table";
import { getMyStaffReports } from "@/apis/report.api";
import { showError } from "@/utils/toast.utils";

const { Title, Text } = Typography;

// Interface theo DTO từ backend
interface StaffReportDTO {
  id: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reporterName: string;

  // Appeal info
  appealDeadline: string;
  canAppeal: boolean;
  hasAppealed: boolean;
  appealStatus?: string;
  appealReason?: string;
  appealEvidenceUrl?: string;

  // Flag count
  currentFlagCount: number;

  // Helper từ backend
  statusDisplay?: string;
}

interface PageResponse {
  content: StaffReportDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export default function MyStaffReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<StaffReportDTO[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load dữ liệu báo cáo
  const loadReports = async (page = 0, size = 10) => {
    try {
      setLoading(true);
      const response: PageResponse = await getMyStaffReports();

      setReports(response.content);
      setPagination({
        current: response.number + 1,
        pageSize: response.size,
        total: response.totalElements,
      });
    } catch (error) {
      showError("Không thể tải danh sách báo cáo vi phạm");
      setReports([]);
    } finally {
      setLoading(false);
    }
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

  // Effect để load dữ liệu ban đầu
  useEffect(() => {
    loadReports();
  }, []);

  // Handle pagination change
  const handleTableChange = (newPagination: any) => {
    loadReports(newPagination.current - 1, newPagination.pageSize);
  };

  // Handle view details
  const handleViewDetails = (record: StaffReportDTO) => {
    window.open(`/report-detail?reportId=${record.id}&mode=single`, "_blank");
  };

  // Handle appeal
  const handleAppeal = (record: StaffReportDTO) => {
    window.location.href = `/appeal-report?reportId=${record.id}`;
  };

  // Calculate time remaining for appeal
  const getTimeRemaining = (deadline: string | number[]) => {
    const now = new Date();
    let deadlineDate: Date;

    // Xử lý nếu deadline là array [year, month, day, hour, minute, second]
    if (Array.isArray(deadline)) {
      const [year, month, day, hour, minute, second = 0] = deadline;
      deadlineDate = new Date(year, month - 1, day, hour, minute, second);
    } else {
      // Xử lý nếu deadline là string
      deadlineDate = new Date(deadline);
    }

    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return "Hết hạn";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} ngày ${hours % 24} giờ`;
    }
    return `${hours} giờ ${minutes} phút`;
  };

  // Get status tag với logic phức tạp
  const getStatusTag = (record: StaffReportDTO) => {
    if (record.status === "PENDING") {
      if (record.hasAppealed) {
        return (
          <Tag icon={<ClockCircleOutlined />} color="processing">
            Đang xử lý kháng cáo
          </Tag>
        );
      } else if (record.canAppeal) {
        return (
          <Tooltip
            title={`Hạn kháng cáo: ${getTimeRemaining(record.appealDeadline)}`}
          >
            <Tag icon={<ExclamationCircleOutlined />} color="warning">
              Chờ kháng cáo
            </Tag>
          </Tooltip>
        );
      } else {
        return (
          <Tag icon={<CloseCircleOutlined />} color="default">
            Hết hạn kháng cáo
          </Tag>
        );
      }
    } else if (record.status === "APPROVED") {
      return (
        <Tag icon={<CheckCircleOutlined />} color="error">
          Vi phạm được xác nhận
        </Tag>
      );
    } else {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Kháng cáo thành công
        </Tag>
      );
    }
  };

  // Get appeal status info
  const getAppealInfo = (record: StaffReportDTO) => {
    if (record.hasAppealed) {
      return (
        <div className="space-y-1">
          <Text type="warning" className="text-sm font-medium">
            Đã kháng cáo
          </Text>
          {record.appealReason && (
            <div className="text-xs text-gray-500">
              Lý do: {record.appealReason}
            </div>
          )}
          {record.appealEvidenceUrl && (
            <a
              href={record.appealEvidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              Xem bằng chứng
            </a>
          )}
        </div>
      );
    } else if (record.canAppeal) {
      return (
        <div className="space-y-2">
          <div className="text-sm">
            <WarningOutlined className="text-yellow-500 mr-1" />
            <Text type="warning">
              Còn {getTimeRemaining(record.appealDeadline)}
            </Text>
          </div>
        </div>
      );
    } else {
      return (
        <Text type="secondary" className="text-sm">
          Không thể kháng cáo
        </Text>
      );
    }
  };

  // Desktop columns
  const columns: ColumnsType<StaffReportDTO> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      align: "center",
    },
    {
      title: "Mã báo cáo",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id) => (
        <span className="font-mono text-xs text-blue-600">
          #{id?.substring(0, 8).toUpperCase()}
        </span>
      ),
      align: "center",
    },
    {
      title: "Lý do vi phạm",
      dataIndex: "reason",
      key: "reason",
      width: 250,
      render: (reason) => (
        <Tooltip title={reason}>
          <Text className="text-sm">
            {reason.length > 100 ? reason.substring(0, 100) + "..." : reason}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Người báo cáo",
      dataIndex: "reporterName",
      key: "reporterName",
      width: 150,
      render: (name) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} />
          <Text className="text-sm">{name}</Text>
        </div>
      ),
    },
    {
      title: "Số cờ hiện tại",
      dataIndex: "currentFlagCount",
      key: "currentFlagCount",
      width: 120,
      render: (count) => (
        <div className="flex items-center justify-center gap-2">
          <FlagOutlined
            className={count > 0 ? "text-red-500" : "text-gray-400"}
          />
          <span
            className={`font-semibold text-lg ${
              count > 0 ? "text-red-600" : "text-gray-600"
            }`}
          >
            {count}
          </span>
        </div>
      ),
      align: "center",
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 180,
      render: (_, record) => getStatusTag(record),
      align: "center",
    },
    {
      title: "Kháng cáo",
      key: "appeal",
      width: 200,
      render: (_, record) => getAppealInfo(record),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => (
        <span className="text-sm">{formatTimestamp(date)}</span>
      ),
      align: "center",
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
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
  const mobileColumns: ColumnsType<StaffReportDTO> = [
    {
      title: "Thông tin vi phạm",
      key: "info",
      render: (record: StaffReportDTO) => (
        <div className="space-y-3 py-2">
          {/* Header with ID and Flag */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-blue-600">
              #{record.id.substring(0, 6).toUpperCase()}...
            </span>
            <div className="flex items-center gap-1">
              <FlagOutlined
                className={
                  record.currentFlagCount > 0 ? "text-red-500" : "text-gray-400"
                }
              />
              <span
                className={`font-bold ${
                  record.currentFlagCount > 0 ? "text-red-600" : "text-gray-600"
                }`}
              >
                {record.currentFlagCount}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-gray-50 p-2 rounded">
            <Text className="text-xs">{record.reason}</Text>
          </div>

          {/* Reporter and Date */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Báo cáo bởi: {record.reporterName}</span>
            <span>
              {new Date(record.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>

          {/* Status */}
          <div className="flex justify-center">{getStatusTag(record)}</div>

          {/* Appeal Info */}
          {(record.canAppeal || record.hasAppealed) && (
            <div className="border-t pt-2">{getAppealInfo(record)}</div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              className="flex-1"
            >
              Chi tiết
            </Button>
            {record.canAppeal && !record.hasAppealed && (
              <Button
                type="primary"
                danger
                size="small"
                icon={<FileProtectOutlined />}
                onClick={() => handleAppeal(record)}
                className="flex-1"
              >
                Kháng cáo
              </Button>
            )}
          </div>
        </div>
      ),
    },
  ];

  // Calculate statistics
  const statistics = {
    total: pagination.total,
    pending: reports.filter((r) => r.status === "PENDING" && !r.hasAppealed)
      .length,
    appealing: reports.filter((r) => r.hasAppealed).length,
    approved: reports.filter((r) => r.status === "APPROVED").length,
    rejected: reports.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="text-center md:text-left">
        <Title level={2} className="!mb-2 text-xl md:text-2xl">
          Lịch sử vi phạm của tôi
        </Title>
      </div>

      {/* Alert for pending appeals */}
      {reports.some((r) => r.canAppeal && !r.hasAppealed) && (
        <Alert
          message="Bạn có báo cáo vi phạm có thể kháng cáo"
          description="Vui lòng xem xét và kháng cáo trong thời hạn cho phép nếu bạn cho rằng báo cáo không chính xác."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          closable
        />
      )}

      {/* Statistics Cards */}
      {/* <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-600">
              {statistics.total}
            </div>
            <div className="text-sm text-gray-500 mt-1">Tổng vi phạm</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.pending}
            </div>
            <div className="text-sm text-gray-500 mt-1">Chờ kháng cáo</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-500">
              {statistics.appealing}
            </div>
            <div className="text-sm text-gray-500 mt-1">Đang kháng cáo</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-red-600">
              {statistics.approved}
            </div>
            <div className="text-sm text-gray-500 mt-1">Vi phạm</div>
          </Card>
        </Col>
        <Col xs={12} sm={6} md={3}>
          <Card className="text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-600">
              {statistics.rejected}
            </div>
            <div className="text-sm text-gray-500 mt-1">Đã hủy</div>
          </Card>
        </Col>
      </Row> */}

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        {reports.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center py-8">
                <InfoCircleOutlined className="text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 text-lg">Bạn chưa có vi phạm nào</p>
                <p className="text-gray-400 text-sm mt-2">
                  Hãy tiếp tục duy trì hành vi tốt trên hệ thống
                </p>
              </div>
            }
          />
        ) : (
          <Table
            columns={isMobile ? mobileColumns : columns}
            dataSource={reports}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showTotal: (total) => (
                <span className="font-medium">
                  Tổng cộng: <span className="text-blue-600">{total}</span> vi
                  phạm
                </span>
              ),
              showSizeChanger: !isMobile,
              simple: isMobile,
            }}
            onChange={handleTableChange}
            scroll={!isMobile ? { x: 1400 } : undefined}
            size={isMobile ? "small" : "middle"}
            className="staff-reports-table"
          />
        )}
      </Card>
    </div>
  );
}

MyStaffReportsPage.Layout = ProfileLayout;
