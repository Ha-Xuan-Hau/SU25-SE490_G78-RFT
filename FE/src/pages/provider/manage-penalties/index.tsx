"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { useUserState } from "@/recoils/user.state";
import {
  getPenaltiesByUserId,
  createPenalty,
  updatePenalty,
  deletePenalty,
  getPenaltyById,
} from "@/apis/provider.api";
import { showError, showSuccess } from "@/utils/toast.utils";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Interface cho penalty rule dựa trên cấu trúc bảng
interface PenaltyRule {
  id: string;
  penalty_type: "PERCENT" | "FIXED";
  penalty_value: number;
  min_cancel_hour: number;
  description: string;
  user_id: string;
}

export default function ManagePenaltiesPage() {
  const [user] = useUserState();
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentRule, setCurrentRule] = useState<PenaltyRule | null>(null);
  const [form] = Form.useForm();

  // Map dữ liệu từ BE sang FE
  function mapBackendPenalties(penalties: any[]): PenaltyRule[] {
    return (penalties || []).map((item: any) => ({
      id: item.id,
      penalty_type: item.penaltyType,
      penalty_value: item.penaltyValue,
      min_cancel_hour: item.minCancelHour,
      description: item.description,
      user_id: item.userId,
      user_name: item.userName,
    }));
  }

  // Fetch penalty rules from BE
  useEffect(() => {
    const fetchPenaltyRules = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await getPenaltiesByUserId(user.id);
        setPenaltyRules(mapBackendPenalties(res.penalties));
      } catch (error) {
        showError("Không lấy được danh sách quy định phạt");
      }
      setLoading(false);
    };
    fetchPenaltyRules();
  }, [user]);

  // Format tiền VNĐ
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Xử lý mở modal để thêm rule mới
  const handleAddRule = () => {
    setModalMode("add");
    setCurrentRule(null);
    form.resetFields();
    // Thiết lập mô tả mặc định dựa trên giá trị ban đầu
    setTimeout(() => {
      const penaltyType = form.getFieldValue("penalty_type");
      const penaltyValue = form.getFieldValue("penalty_value");
      const minCancelHour = form.getFieldValue("min_cancel_hour");
      const description = generateDescription(
        penaltyType,
        penaltyValue,
        minCancelHour
      );
      form.setFieldValue("description", description);
    }, 0);
    setModalVisible(true);
  };

  // Xử lý mở modal để sửa rule
  const handleEditRule = (record: PenaltyRule) => {
    setModalMode("edit");
    setCurrentRule(record);
    form.setFieldsValue({
      penalty_type: record.penalty_type,
      penalty_value: record.penalty_value,
      min_cancel_hour: record.min_cancel_hour,
      description: record.description,
    });
    setModalVisible(true);
  };

  // Xử lý lưu rule
  // Hàm tạo mô tả tự động dựa trên các giá trị của form
  const generateDescription = (type: string, value: number, hours: number) => {
    if (type === "PERCENT") {
      return `Phí phạt ${value}% giá trị đơn hàng áp dụng khi hủy đơn trong vòng ${hours} giờ trước giờ nhận xe`;
    } else {
      return `Phí phạt cố định ${formatCurrency(
        value
      )} áp dụng khi hủy đơn trong vòng ${hours} giờ trước giờ nhận xe`;
    }
  };

  const handleSaveRule = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (!values.description || values.description.trim() === "") {
          values.description = generateDescription(
            values.penalty_type,
            values.penalty_value,
            values.min_cancel_hour
          );
        }
        setLoading(true);
        try {
          if (modalMode === "add") {
            await createPenalty({
              userId: user.id,
              penaltyType: values.penalty_type,
              penaltyValue: values.penalty_value,
              minCancelHour: values.min_cancel_hour,
              description: values.description,
            });
            showSuccess("Thêm quy định phạt mới thành công!");
          } else if (modalMode === "edit" && currentRule) {
            await updatePenalty(currentRule.id, {
              userId: user.id,
              penaltyType: values.penalty_type,
              penaltyValue: values.penalty_value,
              minCancelHour: values.min_cancel_hour,
              description: values.description,
            });
            showSuccess("Cập nhật quy định phạt thành công!");
          }
          setModalVisible(false);
          // Reload list
          const res = await getPenaltiesByUserId(user.id);
          setPenaltyRules(mapBackendPenalties(res.penalties));
        } catch (error) {
          showError("Lưu quy định phạt thất bại!");
        }
        setLoading(false);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  // Xử lý xóa rule
  const handleDeleteRule = async (id: string) => {
    setLoading(true);
    try {
      await deletePenalty(id);
      showSuccess("Xóa quy định phạt thành công!");
      const res = await getPenaltiesByUserId(user.id);
      setPenaltyRules(mapBackendPenalties(res.penalties));
    } catch (error) {
      showError("Xóa quy định phạt thất bại!");
    }
    setLoading(false);
  };

  // Columns cho bảng
  const columns = [
    {
      title: "Loại phí phạt",
      dataIndex: "penalty_type",
      key: "penalty_type",
      render: (type: string) => (
        <span>
          {type === "PERCENT" ? "Phần trăm (%) giá trị đơn" : "Phí cố định"}
        </span>
      ),
    },
    {
      title: "Giá trị phí phạt",
      dataIndex: "penalty_value",
      key: "penalty_value",
      render: (value: number, record: PenaltyRule) => (
        <span>
          {record.penalty_type === "PERCENT"
            ? `${value}%`
            : formatCurrency(value)}
        </span>
      ),
    },
    {
      title: "Thời gian tối đa cho phép hủy tự do",
      dataIndex: "min_cancel_hour",
      key: "min_cancel_hour",
      render: (hours: number) => (
        <span>{hours} giờ trước thời gian nhận xe trên đơn</span>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: PenaltyRule) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditRule(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa quy định phạt"
            description="Bạn có chắc chắn muốn xóa quy định phạt này không?"
            onConfirm={() => handleDeleteRule(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="penalty-rules-management">
      <div className="flex justify-between items-center mb-6">
        <Title level={4}>Quản lý quy định phạt hủy đơn</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddRule}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Thêm quy định mới
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Text>
            Thiết lập các quy định phạt khi khách hàng hủy đơn đặt xe của bạn.
            Bạn có thể tạo nhiều quy định với các mức phạt và thời gian khác
            nhau.
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={penaltyRules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          locale={{
            emptyText: "Chưa có quy định phạt nào được thiết lập",
          }}
        />
      </Card>

      {/* Modal thêm/sửa quy định phạt */}
      <Modal
        title={
          modalMode === "add" ? "Thêm quy định phạt mới" : "Sửa quy định phạt"
        }
        open={modalVisible}
        onOk={handleSaveRule}
        onCancel={() => setModalVisible(false)}
        okText={modalMode === "add" ? "Thêm" : "Lưu"}
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            penalty_type: "PERCENT",
            penalty_value: 0,
            min_cancel_hour: 1,
          }}
        >
          <Form.Item
            name="penalty_type"
            label="Loại phí phạt"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn loại phí phạt",
              },
            ]}
          >
            <Select placeholder="Chọn loại phí phạt">
              <Option value="PERCENT">Phần trăm (%) giá trị đơn</Option>
              <Option value="FIXED">Phí cố định (VNĐ)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="penalty_value"
            label="Giá trị phí phạt"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập giá trị phí phạt",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue("penalty_type") === "PERCENT") {
                    if (value <= 0 || value > 100) {
                      return Promise.reject(
                        "Phần trăm phải nằm trong khoảng từ 1% đến 100%"
                      );
                    }
                  } else {
                    if (value <= 0) {
                      return Promise.reject(
                        "Giá trị phí phạt phải lớn hơn 0 VNĐ"
                      );
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Nhập giá trị phí phạt"
              addonAfter={
                form.getFieldValue("penalty_type") === "PERCENT" ? "%" : "VNĐ"
              }
              formatter={(value) =>
                form.getFieldValue("penalty_type") === "FIXED"
                  ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  : `${value}`
              }
              min={1}
            />
          </Form.Item>

          <Form.Item
            name="min_cancel_hour"
            label={
              <span>
                Giờ tối thiểu để hủy miễn phí
                <Tooltip title="Khách hàng sẽ bị tính phí nếu hủy đơn trong khoảng thời gian trước thời gian nhận xe">
                  <QuestionCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
              </span>
            }
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số giờ tối thiểu",
              },
              {
                type: "number",
                min: 1,
                message: "Số giờ phải lớn hơn 0",
              },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ví dụ: 24"
              formatter={(value) => `${value}`}
              addonAfter="giờ"
            />
          </Form.Item>

          <Form.Item
            shouldUpdate={(prevValues, curValues) =>
              prevValues.penalty_type !== curValues.penalty_type ||
              prevValues.penalty_value !== curValues.penalty_value ||
              prevValues.min_cancel_hour !== curValues.min_cancel_hour
            }
            noStyle
          >
            {({ getFieldValue }) => {
              const penaltyType = getFieldValue("penalty_type");
              const penaltyValue = getFieldValue("penalty_value") || 0;
              const minCancelHour = getFieldValue("min_cancel_hour") || 0;
              const description = generateDescription(
                penaltyType,
                penaltyValue,
                minCancelHour
              );

              // Tự động cập nhật trường mô tả khi các giá trị khác thay đổi
              // Sử dụng setTimeout để đảm bảo việc cập nhật xảy ra sau khi getFieldValue đã được xử lý
              setTimeout(() => {
                form.setFieldValue("description", description);
              }, 0);

              return null;
            }}
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả quy định"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập mô tả cho quy định",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Mô tả quy định phạt sẽ được tự động điền dựa trên các thông tin bạn đã nhập"
              readOnly
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

ManagePenaltiesPage.Layout = ProviderLayout;
