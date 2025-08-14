import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Typography,
  Card,
  Tag,
  Avatar,
  Descriptions,
  Button,
  Table,
  Spin,
  notification,
  Row,
  Col,
  Layout,
  Space,
  Modal,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  WarningOutlined,
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getReportDetail,
  getReportTypeMapping,
  rejectAllReports,
  approveAppeal,
  rejectAppeal,
} from "@/apis/report.api";
import { ReportDetailDTO, ReporterDetailDTO } from "@/types/report";
import ReportButton from "@/components/ReportComponent";
import Link from "next/link";
import { useUserState } from "@/recoils/user.state";
import { translateENtoVI } from "@/lib/viDictionary";
import {
  showApiError,
  showApiSuccess,
  showError,
  showSuccess,
} from "@/utils/toast.utils";

const { Title, Text } = Typography;
const { Content } = Layout;

// Define report type as const for type safety
type ReportType =
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
  | "INAPPROPRIATE"
  | "VIOLENCE"
  | "SPAM"
  | "OTHERS"
  | "DIRTY_CAR"
  | "MISLEADING_LISTING"
  | "STAFF_REPORT";

export default function ReportDetailPage() {
  const router = useRouter();
  const { targetId, type } = router.query;
  const [user] = useUserState();

  const [loading, setLoading] = useState(true);
  const [reportDetail, setReportDetail] = useState<ReportDetailDTO | null>(
    null
  );
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTargetForReport, setSelectedTargetForReport] = useState<
    string | null
  >(null);
  const [reportReporterModalVisible, setReportReporterModalVisible] =
    useState(false);
  const [selectedReporterForReport, setSelectedReporterForReport] = useState<
    string | null
  >(null);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [selectedFlagForAppeal, setSelectedFlagForAppeal] = useState<
    string | null
  >(null);

  const typeMapping = getReportTypeMapping();

  useEffect(() => {
    console.log("ReportDetailPage mounted");
    console.log("Current user:", user);
    console.log("Router query:", router.query);
    console.log("Router pathname:", router.pathname);

    return () => {
      console.log("ReportDetailPage unmounting - possible redirect happening");
    };
  }, []);

  // Load report detail
  useEffect(() => {
    if (!router.isReady) return;

    if (
      targetId &&
      type &&
      typeof targetId === "string" &&
      typeof type === "string"
    ) {
      loadReportDetail(targetId, type);
    }
  }, [router.isReady, targetId, type]);

  const loadReportDetail = async (targetIdStr: string, typeStr: string) => {
    try {
      setLoading(true);
      const detail = await getReportDetail(targetIdStr, typeStr);
      setReportDetail(detail);
    } catch (error) {
      console.error("Error loading report detail:", error);
      notification.error({
        message: "Lỗi",
        description: "Không thể tải chi tiết báo cáo",
      });
      setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (typeStr: string): string => {
    if (typeStr in typeMapping) {
      return typeMapping[typeStr as ReportType]?.color || "default";
    }
    return "default";
  };

  const getGeneralTypeFromType = (typeStr: string): string => {
    const seriousReports: string[] = [
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
      "LATE_RETURN_NO_CONTACT",
    ];

    const nonSeriousReports: string[] = [
      "INAPPROPRIATE",
      "VIOLENCE",
      "SPAM",
      "OTHERS",
      "DIRTY_CAR",
      "MISLEADING_LISTING",
    ];

    if (seriousReports.includes(typeStr)) return "SERIOUS_ERROR";
    if (nonSeriousReports.includes(typeStr)) return "NON_SERIOUS_ERROR";
    if (typeStr === "STAFF_REPORT") return "STAFF_ERROR";
    return "NON_SERIOUS_ERROR";
  };

  const canProcessReports = (): boolean => {
    if (!reportDetail) return false;
    const generalType = getGeneralTypeFromType(reportDetail.reportSummary.type);

    if (generalType === "SERIOUS_ERROR") return true;
    if (generalType === "NON_SERIOUS_ERROR") {
      return reportDetail.reporters.length >= 10;
    }

    return false;
  };

  const handleCreateStaffReport = (targetId: string) => {
    setSelectedTargetForReport(targetId);
    setReportModalVisible(true);
  };

  const handleRejectAllReports = () => {
    Modal.confirm({
      title: "Xác nhận báo cáo không chính xác",
      content:
        "Bạn có chắc chắn tất cả báo cáo này không chính xác? Tất cả báo cáo sẽ bị từ chối.",
      okText: "Xác nhận",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await rejectAllReports(
            reportDetail!.reportSummary.reportId
          );
          showSuccess("Từ chối báo cáo thành công");
          await loadReportDetail(targetId as string, type as string);
        } catch (error) {
          showError("Từ chối báo cáo thất bại");
        }
      },
    });
  };

  const handleReportReporter = (reporterId: string) => {
    setSelectedReporterForReport(reporterId);
    setReportReporterModalVisible(true);
  };

  const handleAppeal = (flagId: string) => {
    setSelectedFlagForAppeal(flagId);
    setAppealModalVisible(true);
  };

  const handleApproveAppeal = async (appealId: string) => {
    Modal.confirm({
      title: "Xác nhận chấp nhận kháng cáo",
      content:
        "Bạn có chắc chắn muốn chấp nhận kháng cáo này? Staff flag sẽ bị hủy.",
      okText: "Chấp nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const result = await approveAppeal(appealId);
          showSuccess("Chấp nhận kháng cáo thành công");
          await loadReportDetail(targetId as string, type as string);
        } catch (error) {
          showError("Không thể chấp nhận kháng cáo");
        }
      },
    });
  };

  const handleRejectAppeal = async (appealId: string) => {
    Modal.confirm({
      title: "Xác nhận từ chối kháng cáo",
      content:
        "Bạn có chắc chắn muốn từ chối kháng cáo này? Staff flag sẽ được giữ nguyên.",
      okText: "Từ chối",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await rejectAppeal(appealId);
          showSuccess("Từ chối kháng cáo thành công");
          await loadReportDetail(targetId as string, type as string);
        } catch (error) {
          showError("Không thể từ chối kháng cáo");
        }
      },
    });
  };

  // Loading state
  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <Spin size="large" tip="Đang tải chi tiết báo cáo..." />
        </Content>
      </Layout>
    );
  }

  // No data state
  if (!reportDetail) {
    return (
      <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <Card
            style={{
              textAlign: "center",
              maxWidth: "400px",
              width: "100%",
            }}
          >
            <WarningOutlined
              style={{
                fontSize: "48px",
                color: "#faad14",
                marginBottom: "16px",
              }}
            />
            <p style={{ fontSize: "16px", marginBottom: "24px" }}>
              Không tìm thấy thông tin báo cáo
            </p>
          </Card>
        </Content>
      </Layout>
    );
  }

  const generalType = getGeneralTypeFromType(reportDetail.reportSummary.type);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content style={{ padding: "24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {/* Header Card với 2 nút xử lý */}
            <Card bordered={false} style={{ borderRadius: "12px" }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12}>
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ width: "100%" }}
                  >
                    <Title level={3} style={{ margin: 0 }}>
                      Chi tiết báo cáo
                    </Title>
                    <Text type="secondary" style={{ fontSize: "16px" }}>
                      <UserOutlined style={{ marginRight: "8px" }} />
                      {reportDetail.reportedUser.fullName}
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} md={12} style={{ textAlign: "right" }}>
                  {canProcessReports() &&
                    user?.role &&
                    ["STAFF", "ADMIN"].includes(user.role) && (
                      <Space wrap>
                        <Button
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={handleRejectAllReports}
                        >
                          Báo cáo không chính xác
                        </Button>

                        <Button
                          type="primary"
                          danger
                          icon={<WarningOutlined />}
                          onClick={() =>
                            handleCreateStaffReport(
                              reportDetail.reportedUser.id
                            )
                          }
                        >
                          Yêu cầu cung cấp bằng chứng
                        </Button>
                      </Space>
                    )}
                </Col>
              </Row>
            </Card>

            {/* Card giải thích cho Staff/Admin */}
            {canProcessReports() &&
              user?.role &&
              ["STAFF", "ADMIN"].includes(user.role) && (
                <Card
                  style={{
                    backgroundColor: "#fff7e6",
                    border: "1px solid #ffd591",
                  }}
                >
                  <Space direction="vertical" size={8}>
                    <Text strong style={{ fontSize: "16px" }}>
                      <InfoCircleOutlined
                        style={{ marginRight: "8px", color: "#fa8c16" }}
                      />
                      Hướng dẫn xử lý:
                    </Text>
                    <ul style={{ marginBottom: 0, paddingLeft: "24px" }}>
                      <li>
                        <Text>
                          <strong>Báo cáo không chính xác:</strong> Từ chối tất
                          cả báo cáo, không tính vi phạm cho người bị báo cáo
                        </Text>
                      </li>
                      <li>
                        <Text>
                          <strong>Yêu cầu cung cấp bằng chứng:</strong> Tạo cờ
                          cảnh báo (STAFF_REPORT), người bị báo cáo có 24h để
                          kháng cáo. Tất cả báo cáo hiện tại sẽ được chấp nhận.
                        </Text>
                      </li>
                    </ul>
                  </Space>
                </Card>
              )}

            {/* Tổng quan báo cáo */}
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Tổng quan báo cáo</span>
                </Space>
              }
              style={{
                borderRadius: "12px",
                boxShadow:
                  "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
              }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={8}>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text type="secondary">Mã báo cáo</Text>
                    <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
                      {reportDetail.reportSummary.reportId}
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text type="secondary">Loại báo cáo</Text>
                    <Tag
                      color={getTypeColor(reportDetail.reportSummary.type)}
                      style={{ fontSize: "14px", padding: "4px 12px" }}
                    >
                      {translateENtoVI(reportDetail.reportSummary.type)}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Card thông tin xử lý cho STAFF_REPORT */}
            {reportDetail.reportSummary.type === "STAFF_REPORT" && (
              <Card
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Thông tin xử lý</span>
                  </Space>
                }
                style={{
                  borderRadius: "12px",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                }}
              >
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12}>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">Số cờ hiện tại</Text>
                      <Tag
                        color={
                          (reportDetail.reportSummary.currentFlagCount ?? 0) >=
                          2
                            ? "error"
                            : "warning"
                        }
                      >
                        {reportDetail.reportSummary.currentFlagCount}/3 cờ
                      </Tag>
                      {reportDetail.reportSummary.currentFlagCount === 2 && (
                        <Text type="danger" style={{ fontSize: "12px" }}>
                          Cảnh báo: Thêm 1 cờ nữa sẽ bị khóa tài khoản
                        </Text>
                      )}
                    </Space>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">Thời hạn kháng cáo</Text>
                      {reportDetail.reportSummary.canAppeal ? (
                        <Space>
                          <Tag color="processing">
                            Còn thời hạn đến:{" "}
                            {dayjs(
                              reportDetail.reportSummary.appealDeadline
                            ).format("DD/MM/YYYY HH:mm")}
                          </Tag>
                        </Space>
                      ) : (
                        <Tag color="default">Đã hết hạn kháng cáo</Tag>
                      )}
                    </Space>
                  </Col>
                </Row>

                {/* Nút kháng cáo cho PROVIDER bị flag */}
                {reportDetail.reportSummary.canAppeal &&
                  !reportDetail.reportSummary.hasAppealed &&
                  user?.role === "PROVIDER" &&
                  user?.id === reportDetail.reportedUser.id && (
                    <div style={{ marginTop: "24px" }}>
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={() =>
                          handleAppeal(reportDetail.reportSummary.reportId)
                        }
                        block
                      >
                        Cung cấp bằng chứng kháng cáo
                      </Button>
                    </div>
                  )}
              </Card>
            )}

            {/* Card hiển thị thông tin kháng cáo nếu có */}
            {reportDetail.appealInfo && (
              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>Thông tin kháng cáo</span>
                    <Tag
                      color={
                        reportDetail.appealInfo.status === "APPROVED"
                          ? "success"
                          : reportDetail.appealInfo.status === "REJECTED"
                          ? "error"
                          : "processing"
                      }
                    >
                      {reportDetail.appealInfo.status === "APPROVED"
                        ? "Đã chấp nhận"
                        : reportDetail.appealInfo.status === "REJECTED"
                        ? "Đã từ chối"
                        : "Đang xử lý"}
                    </Tag>
                  </Space>
                }
                style={{
                  borderRadius: "12px",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                }}
              >
                <Descriptions
                  bordered
                  column={{ xs: 1, sm: 1, md: 2 }}
                  labelStyle={{ backgroundColor: "#fafafa" }}
                >
                  <Descriptions.Item label="Người kháng cáo">
                    <Space>
                      <Avatar icon={<UserOutlined />} size="small" />
                      <Text strong>
                        {reportDetail.appealInfo.appellantName}
                      </Text>
                    </Space>
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {reportDetail.appealInfo.appellantEmail}
                  </Descriptions.Item>

                  <Descriptions.Item label="Thời gian gửi">
                    {dayjs(reportDetail.appealInfo.createdAt).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Bằng chứng">
                    {reportDetail.appealInfo.evidenceUrl ? (
                      <a
                        href={reportDetail.appealInfo.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button type="link" icon={<EyeOutlined />} size="small">
                          Xem bằng chứng
                        </Button>
                      </a>
                    ) : (
                      <Text type="secondary">Không có</Text>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Lý do kháng cáo" span={2}>
                    <Text>{reportDetail.appealInfo.reason}</Text>
                  </Descriptions.Item>
                </Descriptions>

                {/* Nút xử lý cho Staff/Admin */}
                {user?.role &&
                  ["STAFF", "ADMIN"].includes(user.role) &&
                  reportDetail.appealInfo.status === "PENDING" && (
                    <div style={{ marginTop: "24px" }}>
                      <Space>
                        <Button
                          type="primary"
                          onClick={() =>
                            handleApproveAppeal(
                              reportDetail.appealInfo!.appealId
                            )
                          }
                        >
                          Chấp nhận kháng cáo
                        </Button>
                        <Button
                          danger
                          onClick={() =>
                            handleRejectAppeal(
                              reportDetail.appealInfo!.appealId
                            )
                          }
                        >
                          Từ chối kháng cáo
                        </Button>
                      </Space>
                    </div>
                  )}
              </Card>
            )}

            {/* Trạng thái xử lý - Chỉ hiển thị cho STAFF và ADMIN */}
            {user?.role && ["STAFF", "ADMIN"].includes(user.role) && (
              <Card
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>Mức độ nghiêm trọng</span>
                  </Space>
                }
                style={{
                  borderRadius: "12px",
                  boxShadow:
                    "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
                }}
              >
                {generalType === "SERIOUS_ERROR" ? (
                  <Space align="start" size={16}>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "#ff4d4f",
                        marginTop: "4px",
                      }}
                    />
                    <Space direction="vertical" size={4}>
                      <Text
                        strong
                        style={{ color: "#ff4d4f", fontSize: "18px" }}
                      >
                        Lỗi nghiêm trọng
                      </Text>
                      <Text>
                        Căn cứ vào bằng chứng và mức độ nghiêm trọng của báo
                        cáo, có thể tạo báo cáo vi phạm cho chủ xe
                      </Text>
                      <Text>
                        Khi chủ xe bị báo cáo bởi nhân viên 3 lần, họ sẽ bị khóa
                        tài khoản
                      </Text>
                      <Text>
                        Nếu bằng chứng từ chủ xe đủ thuyết phục, không thao tác
                        gì thêm
                      </Text>
                    </Space>
                  </Space>
                ) : generalType === "NON_SERIOUS_ERROR" ? (
                  <Space align="start" size={16}>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: canProcessReports()
                          ? "#ff4d4f"
                          : "#faad14",
                        marginTop: "4px",
                      }}
                    />
                    <Space direction="vertical" size={4}>
                      <Text
                        strong
                        style={{
                          color: canProcessReports() ? "#ff4d4f" : "#faad14",
                          fontSize: "18px",
                        }}
                      >
                        {canProcessReports() ? "Lỗi nghiêm trọng" : "Lỗi nhẹ"}
                      </Text>
                      <Text>
                        {canProcessReports()
                          ? "Đã có đủ 10 lượt báo cáo. Vui lòng xem xét để xử lý."
                          : `Đủ 10 lượt báo cáo sẽ phải xem xét để đưa ra quyết định phù hợp (hiện tại: ${reportDetail.reporters.length}/10)`}
                      </Text>
                    </Space>
                  </Space>
                ) : generalType === "STAFF_ERROR" ? (
                  <Space align="start" size={16}>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: "#1890ff",
                        marginTop: "4px",
                      }}
                    />
                    <Space direction="vertical" size={4}>
                      <Text
                        strong
                        style={{ color: "#1890ff", fontSize: "16px" }}
                      >
                        Báo cáo nội bộ
                      </Text>
                      <Text type="secondary">
                        Báo cáo do nhân viên hệ thống tạo.
                      </Text>
                    </Space>
                  </Space>
                ) : null}
              </Card>
            )}

            {/* Thông tin người bị báo cáo */}
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Thông tin người bị báo cáo</span>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: "12px",
                boxShadow:
                  "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
              }}
            >
              <Descriptions
                bordered
                column={{ xs: 1, sm: 1, md: 2, lg: 2 }}
                labelStyle={{ backgroundColor: "#fafafa", fontWeight: 500 }}
                contentStyle={{ backgroundColor: "#fff" }}
              >
                <Descriptions.Item label="Họ và tên">
                  <Space>
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#1890ff" }}
                    />
                    <Text strong style={{ fontSize: "15px" }}>
                      {reportDetail.reportedUser.fullName}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined style={{ color: "#1890ff" }} />
                    <Text>{reportDetail.reportedUser.email || "N/A"}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Danh sách người báo cáo */}
            <Card
              title={
                <Space>
                  <WarningOutlined />
                  <span>
                    Danh sách người báo cáo ({reportDetail.reporters.length})
                  </span>
                </Space>
              }
              style={{
                borderRadius: "12px",
                boxShadow:
                  "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
              }}
            >
              {/* Lưu ý báo cáo spam */}
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-2">
                  <WarningOutlined className="text-yellow-600 mt-1" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-1">
                      Lưu ý về báo cáo spam:
                    </div>
                    <p>
                      Bạn có thể báo cáo những người dùng có hành vi spam báo
                      cáo (báo cáo không đúng sự thật, báo cáo quá nhiều lần
                      không có căn cứ). Việc này giúp duy trì chất lượng hệ
                      thống báo cáo.
                    </p>
                  </div>
                </div>
              </Card>
              <Table
                dataSource={reportDetail.reporters}
                columns={[
                  {
                    title: "STT",
                    key: "index",
                    width: 70,
                    render: (_, __, index) => <Text strong>{index + 1}</Text>,
                    align: "center",
                    fixed: "left",
                  },
                  {
                    title: "Người báo cáo",
                    key: "reporter",
                    width: 250,
                    render: (_, record: ReporterDetailDTO) => (
                      <Space>
                        <Avatar
                          icon={<UserOutlined />}
                          size="small"
                          style={{ backgroundColor: "#87d068" }}
                        />
                        <Space direction="vertical" size={0}>
                          <Text strong>{record.fullName}</Text>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            <MailOutlined style={{ marginRight: "4px" }} />
                            {record.email}
                          </Text>
                        </Space>
                      </Space>
                    ),
                  },
                  ...(generalType === "SERIOUS_ERROR"
                    ? [
                        {
                          title: "Mã đơn hàng liên quan",
                          dataIndex: "booking",
                          key: "booking",
                          width: 180,
                          render: (bookingId: string) => {
                            if (!bookingId) {
                              return <Text type="secondary">Không có</Text>;
                            }

                            return (
                              <Space>
                                <Link
                                  href={`/booking-detail/${bookingId}`}
                                  target="_blank"
                                >
                                  <Button size="small" icon={<EyeOutlined />}>
                                    Xem
                                  </Button>
                                </Link>
                              </Space>
                            );
                          },
                        },
                      ]
                    : []),
                  {
                    title: "Lý do báo cáo",
                    dataIndex: "reason",
                    key: "reason",
                    ellipsis: true,
                    render: (reason: string) => (
                      <Text style={{ display: "block" }}>{reason}</Text>
                    ),
                  },
                  {
                    title: "Link bằng chứng",
                    key: "evidenceUrl",
                    width: 150,
                    render: (_, record: ReporterDetailDTO) => {
                      if (!record.evidenceUrl) {
                        return (
                          <Text type="secondary" style={{ fontSize: "13px" }}>
                            Không có
                          </Text>
                        );
                      }

                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                        record.evidenceUrl
                      );

                      return (
                        <a
                          href={record.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            type="link"
                            icon={
                              isImage ? <EyeOutlined /> : <FileTextOutlined />
                            }
                            size="small"
                            style={{ padding: 0 }}
                          >
                            {isImage ? "Xem ảnh" : "Xem file"}
                          </Button>
                        </a>
                      );
                    },
                    align: "center",
                  },
                  {
                    title: "Ngày báo cáo",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    width: 180,
                    render: (date: string) => (
                      <Space>
                        <ClockCircleOutlined style={{ color: "#8c8c8c" }} />
                        <Text>{dayjs(date).format("DD/MM/YYYY HH:mm")}</Text>
                      </Space>
                    ),
                  },
                  ...(user?.role && ["STAFF", "ADMIN"].includes(user.role)
                    ? [
                        {
                          title: "Thao tác",
                          key: "action",
                          width: 120,
                          render: (_: any, record: ReporterDetailDTO) => (
                            <Button
                              size="small"
                              danger
                              icon={<WarningOutlined />}
                              onClick={() => handleReportReporter(record.id)}
                              title="Báo cáo người dùng spam"
                            >
                              Báo cáo
                            </Button>
                          ),
                          align: "center" as const,
                          fixed: "right" as const,
                        },
                      ]
                    : []),
                ]}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `Tổng ${total} báo cáo`,
                }}
                rowKey="id"
                scroll={{ x: 1050 }}
                style={{ marginTop: "16px" }}
              />
            </Card>
          </Space>

          {/* Modal tạo STAFF_REPORT */}
          {reportModalVisible && selectedTargetForReport && (
            <ReportButton
              targetId={selectedTargetForReport}
              reportType="STAFF_REPORT"
              buttonText=""
              size="small"
              type="text"
              icon={false}
              autoOpen={true}
              onModalClose={() => {
                setReportModalVisible(false);
                setSelectedTargetForReport(null);
                loadReportDetail(targetId as string, type as string);
              }}
            />
          )}

          {/* Modal báo cáo spam reporter */}
          {reportReporterModalVisible && selectedReporterForReport && (
            <ReportButton
              targetId={selectedReporterForReport}
              reportType="STAFF_REPORT"
              buttonText=""
              size="small"
              type="text"
              icon={false}
              autoOpen={true}
              onModalClose={() => {
                setReportReporterModalVisible(false);
                setSelectedReporterForReport(null);
              }}
            />
          )}

          {/* Modal Appeal cho Provider */}
          {appealModalVisible && selectedFlagForAppeal && (
            <ReportButton
              targetId={selectedFlagForAppeal}
              reportType="APPEAL"
              buttonText=""
              size="small"
              type="text"
              icon={false}
              autoOpen={true}
              onModalClose={() => {
                setAppealModalVisible(false);
                setSelectedFlagForAppeal(null);
                loadReportDetail(targetId as string, type as string);
              }}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}
