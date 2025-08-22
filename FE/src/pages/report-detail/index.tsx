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
  Row,
  Col,
  Layout,
  Space,
  Modal,
  Alert,
  Image,
  Form,
  Input,
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
  CarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getGroupedReportDetail,
  getSingleReportDetail,
  getReportTypeMapping,
  rejectAllReports,
  approveAppeal,
  rejectAppeal,
  approveAndCreateStaffReport,
  createAppeal,
} from "@/apis/report.api";
import { ReportDetailDTO, ReporterDetailDTO } from "@/types/report";
import ReportButton from "@/components/ReportComponent";
import Link from "next/link";
import { useUserState } from "@/recoils/user.state";
import { translateENtoVI } from "@/lib/viDictionary";
import { showApiError, showError, showSuccess } from "@/utils/toast.utils";
import Paragraph from "antd/es/typography/Paragraph";

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
  const { reportId, targetId, type, mode } = router.query;
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

  // State cho Appeal Modal
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [appealForm] = Form.useForm();
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const { href, origin } = window.location;
  const trimmedUrl = href.replace(origin, "");

  const typeMapping = getReportTypeMapping();

  // useEffect(() => {
  //   console.log("ReportDetailPage mounted");
  //   console.log("Current user:", user);
  //   console.log("Router query:", router.query);
  //   console.log("Router pathname:", router.pathname);

  //   return () => {
  //     console.log("ReportDetailPage unmounting - possible redirect happening");
  //   };
  // }, []);

  // Load report detail based on mode
  useEffect(() => {
    if (!router.isReady) return;

    // Determine which API to call based on available params
    if (mode === "single" && reportId && typeof reportId === "string") {
      // SERIOUS hoặc STAFF_REPORT - dùng reportId
      loadSingleReportDetail(reportId);
    } else if (
      mode === "grouped" &&
      targetId &&
      type &&
      typeof targetId === "string" &&
      typeof type === "string"
    ) {
      // NON_SERIOUS - dùng targetId và type
      loadGroupedReportDetail(targetId, type);
    } else if (
      // Fallback cho URL cũ
      targetId &&
      type &&
      typeof targetId === "string" &&
      typeof type === "string"
    ) {
      // Xác định loại report dựa vào type
      const nonSeriousTypes = [
        "INAPPROPRIATE",
        "VIOLENCE",
        "SPAM",
        "OTHERS",
        "MISLEADING_LISTING",
      ];

      if (nonSeriousTypes.includes(type)) {
        loadGroupedReportDetail(targetId, type);
      } else {
        // Với SERIOUS và STAFF_REPORT, targetId thực ra là reportId
        loadSingleReportDetail(targetId);
      }
    }
  }, [router.isReady, reportId, targetId, type, mode]);

  const loadSingleReportDetail = async (reportIdStr: string) => {
    try {
      setLoading(true);
      const detail = await getSingleReportDetail(reportIdStr);
      setReportDetail(detail);
    } catch (error) {
      //console.error("Error loading single report detail:", error);
      // notification.error({
      //   message: "Lỗi",
      //   description: "Không thể tải chi tiết báo cáo",
      // });
      showError("Không thể tải chi tiết báo cáo");
      setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupedReportDetail = async (
    targetIdStr: string,
    typeStr: string
  ) => {
    try {
      setLoading(true);
      const detail = await getGroupedReportDetail(targetIdStr, typeStr);
      setReportDetail(detail);
    } catch (error) {
      console.error("Error loading grouped report detail:", error);
      // notification.error({
      //   message: "Lỗi",
      //   description: "Không thể tải chi tiết báo cáo",
      // });
      showError("Không thể tải chi tiết báo cáo");
      setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Reload function based on current mode
  const reloadReportDetail = () => {
    if (mode === "single" && reportId && typeof reportId === "string") {
      loadSingleReportDetail(reportId);
    } else if (
      mode === "grouped" &&
      targetId &&
      type &&
      typeof targetId === "string" &&
      typeof type === "string"
    ) {
      loadGroupedReportDetail(targetId, type);
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
      "DIRTY_CAR",
    ];

    const nonSeriousReports: string[] = [
      "INAPPROPRIATE",
      "VIOLENCE",
      "SPAM",
      "OTHERS",
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

  const handleCreateStaffReport = () => {
    // Check null trước
    if (!reportDetail) {
      showError("Không tìm thấy thông tin báo cáo");
      return;
    }

    Modal.confirm({
      title: "Yêu cầu cung cấp bằng chứng",
      content: (
        <div>
          <p>Hành động này sẽ:</p>
          <ul>
            <li>1. Chấp nhận tất cả báo cáo hiện tại</li>
            <li>2. Tạo cờ cảnh báo đến người bị báo cáo</li>
            <li>3. Bị cáo có 24h để khiếu nại</li>
          </ul>
          <p className="mt-2 font-semibold">Bạn chắc chắn?</p>
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Quay lại",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const reason = `Vi phạm ${translateENtoVI(
            reportDetail.reportSummary.type
          )}. Yêu cầu cung cấp bằng chứng trong vòng 24h.`;

          // Lấy current URL của trang report detail
          const currentUrl = window.location.href;

          let response;
          if (mode === "grouped") {
            // NON_SERIOUS - targetId đã đúng (là ID của user/vehicle)
            response = await approveAndCreateStaffReport(
              targetId as string, // targetId từ URL
              type as string,
              undefined,
              reason,
              currentUrl
            );
          } else if (mode === "single") {
            // SERIOUS - cần lấy targetId từ reportedUser.id
            response = await approveAndCreateStaffReport(
              reportDetail.reportedUser.id, // SỬA: dùng reportedUser.id
              undefined,
              reportId as string,
              reason,
              currentUrl
            );
          }

          showSuccess("Đã tạo yêu cầu cung cấp bằng chứng.");

          // Redirect to STAFF_REPORT detail
          if (response?.staffReportId) {
            router.push(
              `/report-detail?reportId=${response.staffReportId}&mode=single`
            );
          }
        } catch (error: any) {
          showApiError(error, "Không thể tạo yêu cầu cung cấp bằng chứng");
        }
      },
    });
  };

  const canShowActionButtons = () => {
    if (!reportDetail) return false;

    // Kiểm tra flag hasProcessed từ backend
    const notProcessed = !reportDetail.reportSummary.hasProcessed;

    return notProcessed && canProcessReports();
  };

  // report-detail page
  const handleRejectAllReports = async () => {
    Modal.confirm({
      title: "Xác nhận báo cáo không chính xác",
      content: "Báo cáo sẽ bị từ chối. Bạn chắc chắn chưa?",
      onOk: async () => {
        try {
          if (mode === "grouped") {
            // NON_SERIOUS
            await rejectAllReports(targetId, type, null);
          } else if (mode === "single") {
            // SERIOUS/STAFF
            await rejectAllReports(null, null, reportId);
          }

          showSuccess("Đã từ chối báo cáo");

          // Reload để update UI
          reloadReportDetail();
        } catch (error) {
          showError("Lỗi khi từ chối báo cáo");
        }
      },
    });
  };

  const handleReportReporter = (reporterId: string) => {
    setSelectedReporterForReport(reporterId);
    setReportReporterModalVisible(true);
  };

  // Handler mở modal khiếu nại
  const handleOpenAppealModal = () => {
    if (!reportDetail) return;

    // Check điều kiện
    if (
      reportDetail.reportSummary.type !== "STAFF_REPORT" ||
      !reportDetail.reportSummary.canAppeal ||
      reportDetail.reportSummary.hasAppealed
    ) {
      showError("Không thể khiếu nại báo cáo này");
      return;
    }

    setAppealModalVisible(true);
  };

  // Handler submit appeal
  interface AppealFormValues {
    reason: string;
    evidenceUrl?: string;
  }

  const handleSubmitAppeal = async (
    values: AppealFormValues
  ): Promise<void> => {
    if (!reportDetail) return;

    try {
      setSubmittingAppeal(true);
      const { reason, evidenceUrl } = values;

      await createAppeal(
        reportDetail.reportSummary.reportId,
        reason,
        evidenceUrl
      );

      showSuccess("Đã gửi khiếu nại thành công. Vui lòng chờ xử lý.");
      setAppealModalVisible(false);
      appealForm.resetFields();

      // Reload để update UI
      reloadReportDetail();
    } catch (error: any) {
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError("Không thể gửi khiếu nại");
      }
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleApproveAppeal = async (appealId: string) => {
    Modal.confirm({
      title: "Xác nhận chấp nhận bằng chứng khiếu nại",
      content:
        "Bạn có chắc chắn muốn chấp nhận khiếu nại này? Báo cáo này sẽ bị hủy.",
      okText: "Chấp nhận",
      cancelText: "Đóng",
      onOk: async () => {
        try {
          const result = await approveAppeal(appealId);
          showSuccess("Chấp nhận khiếu nại thành công");
          reloadReportDetail();
        } catch (error) {
          showError("Không thể chấp nhận khiếu nại");
        }
      },
    });
  };

  const handleRejectAppeal = async (appealId: string) => {
    Modal.confirm({
      title: "Xác nhận từ chối bằng chứng khiếu nại",
      content:
        "Bạn có chắc chắn muốn từ chối khiếu nại này? Người bị báo cáo sẽ bị gán thêm 1 cờ cảnh báo",
      okText: "Từ chối",
      cancelText: "Đóng",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await rejectAppeal(appealId);
          showSuccess("Từ chối khiếu nại thành công");
          reloadReportDetail();
        } catch (error) {
          showError("Không thể từ chối khiếu nại");
        }
      },
    });
  };

  // Modal Appeal Component
  const AppealModal = () => (
    <Modal
      title="Cung cấp bằng chứng khiếu nại"
      open={appealModalVisible}
      onCancel={() => {
        setAppealModalVisible(false);
        appealForm.resetFields();
      }}
      footer={null}
      width={600}
    >
      <Alert
        message="Lưu ý quan trọng"
        description={
          <ul className="text-sm mt-2">
            <li>Bạn chỉ có thể khiếu nại 1 lần cho báo cáo này</li>
            <li>
              Thời hạn khiếu nại:{" "}
              {reportDetail &&
                dayjs(reportDetail.reportSummary.appealDeadline).format(
                  "DD/MM/YYYY HH:mm"
                )}
            </li>
            <li>
              Vui lòng cung cấp bằng chứng rõ ràng để chứng minh báo cáo là sai
            </li>
          </ul>
        }
        type="warning"
        showIcon
        className="mb-4"
      />

      <Form form={appealForm} layout="vertical" onFinish={handleSubmitAppeal}>
        <Form.Item
          name="reason"
          label="Lý do khiếu nại"
          rules={[
            { required: true, message: "Vui lòng nhập lý do khiếu nại" },
            { min: 10, message: "Lý do phải ít nhất 10 ký tự" },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Giải thích chi tiết lý do bạn cho rằng báo cáo này không chính xác..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="evidenceUrl"
          label="Link bằng chứng (không bắt buộc)"
          rules={[{ type: "url", message: "Vui lòng nhập URL hợp lệ" }]}
        >
          <Input placeholder="https://drive.google.com/... hoặc link ảnh/video..." />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button
              onClick={() => {
                setAppealModalVisible(false);
                appealForm.resetFields();
              }}
            >
              Đóng
            </Button>
            <Button type="primary" htmlType="submit" loading={submittingAppeal}>
              Gửi khiếu nại
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );

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

  // Phần return giữ nguyên như cũ, chỉ thay đổi các callback functions
  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content style={{ padding: "24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            {/* STATUS ALERT - ĐẶT NGAY SAU HEADER */}
            {reportDetail.reportSummary.hasProcessed && (
              <Alert
                message={
                  reportDetail.reportSummary.status === "APPROVED"
                    ? "Báo cáo đã được chấp nhận"
                    : "Báo cáo đã bị từ chối"
                }
                description={
                  reportDetail.reportSummary.status === "APPROVED"
                    ? "Các báo cáo này đã được xác nhận là chính xác và đã được xử lý."
                    : "Các báo cáo này đã được xác định là không chính xác và đã bị từ chối."
                }
                type={
                  reportDetail.reportSummary.status === "APPROVED"
                    ? "success"
                    : "error"
                }
                showIcon
                style={{
                  borderRadius: "8px",
                  fontSize: "15px",
                }}
              />
            )}

            {/* Card khiếu nại cho PROVIDER - ĐẶT Ở ĐẦU */}
            {reportDetail.reportSummary.type === "STAFF_REPORT" &&
              reportDetail.reportSummary.canAppeal &&
              !reportDetail.reportSummary.hasAppealed &&
              user?.role === "PROVIDER" &&
              user?.id === reportDetail.reportedUser.id && (
                <Card
                  className="border-2 border-orange-400"
                  style={{
                    background:
                      "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                    borderRadius: "12px",
                  }}
                >
                  <div className="text-center">
                    <WarningOutlined className="text-4xl text-orange-500 mb-4" />
                    <Title level={3} className="!mb-2">
                      Bạn đang bị báo cáo vi phạm
                    </Title>
                    <Text className="block text-base mb-4">
                      Bạn có quyền khiếu nại nếu cho rằng báo cáo này không
                      chính xác
                    </Text>

                    <Row justify="center" className="mb-4">
                      <Col>
                        <Alert
                          message={
                            <Space>
                              <ClockCircleOutlined />
                              <span>Thời hạn khiếu nại đến</span>
                            </Space>
                          }
                          description={
                            <div className="text-lg font-semibold">
                              {dayjs(
                                reportDetail.reportSummary.appealDeadline
                              ).format("DD/MM/YYYY HH:mm")}
                            </div>
                          }
                          type="error"
                          style={{
                            textAlign: "center",
                          }}
                        />
                      </Col>
                    </Row>

                    <Button
                      type="primary"
                      size="large"
                      danger
                      icon={<FileTextOutlined />}
                      onClick={handleOpenAppealModal}
                      className="min-w-[200px]"
                    >
                      Gửi khiếu nại ngay
                    </Button>
                  </div>
                </Card>
              )}

            {/* Header Card với 2 nút xử lý - GIỮ NGUYÊN */}
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
                    <Text style={{ fontSize: "16px" }}>
                      <UserOutlined style={{ marginRight: "8px" }} />
                      Người bị báo cáo: {reportDetail.reportedUser.fullName}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} md={12} style={{ textAlign: "right" }}>
                  {canShowActionButtons() &&
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
                          onClick={() => handleCreateStaffReport()}
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
                          khiếu nại. Tất cả báo cáo hiện tại sẽ được chấp nhận.
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
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={8}>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Text>Loại báo cáo</Text>
                    <Tag
                      color={getTypeColor(reportDetail.reportSummary.type)}
                      style={{ fontSize: "18px", padding: "4px 12px" }}
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
                      <Text>
                        Số cờ hiện tại (Đủ 3 cờ sẽ bị ban khỏi hệ thống)
                      </Text>
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
                      <Text>Thời hạn khiếu nại</Text>
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
                        <Tag color="default">Đã hết hạn khiếu nại</Tag>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>
            )}

            {/* Card hiển thị thông tin khiếu nại nếu có */}
            {reportDetail.appealInfo && (
              <Card
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>Thông tin khiếu nại</span>
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
                  <Descriptions.Item label="Người khiếu nại">
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
                      <Text>Không có</Text>
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Lý do khiếu nại" span={2}>
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
                          Chấp nhận bằng chứng khiếu nại
                        </Button>
                        <Button
                          danger
                          onClick={() =>
                            handleRejectAppeal(
                              reportDetail.appealInfo!.appealId
                            )
                          }
                        >
                          Từ chối bằng chứng khiếu nại
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
                      <Text>Báo cáo do nhân viên hệ thống tạo.</Text>
                    </Space>
                  </Space>
                ) : null}
              </Card>
            )}

            {/* Thông tin người bị báo cáo */}
            <Card
              title={
                <Space>
                  {reportDetail.reportedUser.vehicleId ? (
                    <CarOutlined />
                  ) : (
                    <UserOutlined />
                  )}
                  <span>Thông tin bị cáo</span>
                </Space>
              }
              bordered={false}
            >
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }}
                labelStyle={{ backgroundColor: "#fafafa", fontWeight: 500 }}
                contentStyle={{ backgroundColor: "#fff" }}
              >
                {/* Hiển thị thông tin xe nếu có */}
                {reportDetail.reportedUser.vehicleId ? (
                  <>
                    <Descriptions.Item label="Chủ xe">
                      <Space>
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                          size="small"
                        />
                        <Text strong style={{ fontSize: "15px" }}>
                          {reportDetail.reportedUser.fullName}
                        </Text>
                      </Space>
                    </Descriptions.Item>

                    <Descriptions.Item label="Email chủ xe">
                      <Space>
                        <MailOutlined style={{ color: "#1890ff" }} />
                        <Text>{reportDetail.reportedUser.email || "N/A"}</Text>
                      </Space>
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên đăng ký xe">
                      <Text
                        strong
                        style={{ fontSize: "15px", color: "#1890ff" }}
                      >
                        {reportDetail.reportedUser.vehicleName || "N/A"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Hình ảnh xe">
                      {reportDetail.reportedUser.vehicleImage ? (
                        <Image
                          src={reportDetail.reportedUser.vehicleImage}
                          alt="Vehicle"
                          width={120}
                          height={80}
                          style={{
                            objectFit: "cover",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          preview={{
                            maskClassName: "rounded",
                          }}
                          placeholder={
                            <div
                              style={{
                                width: 120,
                                height: 80,
                                background: "#f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "6px",
                              }}
                            >
                              <Spin />
                            </div>
                          }
                        />
                      ) : (
                        <Text>Không có ảnh</Text>
                      )}
                    </Descriptions.Item>
                  </>
                ) : (
                  // Hiển thị thông tin người nếu không phải xe
                  <>
                    <Descriptions.Item label="Họ và tên">
                      <Space>
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                          size="small"
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

                    <Descriptions.Item label="Mã người dùng">
                      <Text style={{ color: "#595959" }}>
                        {reportDetail.reportedUser.id}
                      </Text>
                    </Descriptions.Item>
                    {/* 
                    <Descriptions.Item label="Trạng thái">
                      <Tag color="green">Đang hoạt động</Tag>
                    </Descriptions.Item> */}
                  </>
                )}
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
              {user?.role &&
                ["STAFF", "ADMIN"].includes(user.role) &&
                generalType !== "STAFF_ERROR" && (
                  <Card
                    className="bg-yellow-50 border-yellow-200"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="flex items-start gap-2">
                      <WarningOutlined className="text-yellow-600 mt-1" />
                      <div className="text-sm text-yellow-800">
                        <div className="font-medium mb-1">
                          Lưu ý về báo cáo spam:
                        </div>
                        <p>
                          Bạn có thể báo cáo những người dùng có hành vi spam
                          báo cáo (báo cáo không đúng sự thật, báo cáo quá nhiều
                          lần không có căn cứ). Việc này giúp duy trì chất lượng
                          hệ thống báo cáo.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
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
                          <Text style={{ fontSize: "12px" }}>
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
                          title: "Đơn hàng liên quan",
                          dataIndex: "booking",
                          key: "booking",
                          width: 180,
                          render: (bookingId: string) => {
                            if (!bookingId) {
                              return <Text>Không có</Text>;
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
                    width: 350,
                    render: (reason: string) => (
                      <Paragraph
                        ellipsis={{
                          rows: 2, // Hiển thị tối đa 2 dòng
                          expandable: true,
                          symbol: "Xem thêm",
                          onExpand: (event) => {
                            event.stopPropagation(); // Ngăn trigger row click
                          },
                        }}
                        style={{ marginBottom: 0 }}
                      >
                        {reason}
                      </Paragraph>
                    ),
                  },
                  {
                    title: "Link bằng chứng",
                    key: "evidenceUrl",
                    width: 150,
                    render: (_, record: ReporterDetailDTO) => {
                      if (!record.evidenceUrl) {
                        return (
                          <Text style={{ fontSize: "13px" }}>Không có</Text>
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
                  ...(user?.role &&
                  ["STAFF", "ADMIN"].includes(user.role) &&
                  generalType !== "STAFF_ERROR" // Dùng generalType thay vì type
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
                rowKey={(record) =>
                  `${record.id}-${record.createdAt}-${record.reason?.substring(
                    0,
                    10
                  )}`
                }
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `Tổng ${total} báo cáo`,
                }}
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
                reloadReportDetail();
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

          {/* Modal Appeal */}
          <AppealModal />
        </div>
      </Content>
    </Layout>
  );
}
