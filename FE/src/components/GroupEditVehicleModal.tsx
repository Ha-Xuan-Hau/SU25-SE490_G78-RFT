import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Button, Select, Card } from "antd";
import type { Vehicle } from "@/types/vehicle";

type VehicleWithExtra = Vehicle & {
  insuranceStatus?: string;
  rentalRule?: string;
};

interface GroupEditVehicleModalProps {
  open: boolean;
  vehicle: Vehicle | null;
  loading?: boolean;
  onCancel: () => void;
  onOk: (values: Record<string, unknown>) => void;
}

const featureOptions = [
  { label: "GPS", value: "GPS" },
  { label: "Bluetooth", value: "Bluetooth" },
  { label: "Điều hoà khí", value: "Air Conditioning" },
  { label: "Ghế da", value: "Leather Seats" },
  { label: "Cảm biến đỗ xe", value: "Parking Sensors" },
  { label: "Camera hành trình", value: "Backup Camera" },
  { label: "Kính chống nắng", value: "Sunroof" },
  { label: "Ghế sưởi", value: "Heated Seats" },
];
const fuelTypeOptions = [
  { value: "GASOLINE", label: "Xăng" },
  { value: "ELECTRIC", label: "Điện" },
];
const insuranceOptions = [
  { value: "YES", label: "Có" },
  { value: "NO", label: "Không" },
];
const deliveryOptions = [
  { value: "YES", label: "Có" },
  { value: "NO", label: "Không" },
];
// rentalRuleOptions sẽ lấy từ API

import { useState } from "react";
// Giả định có hook useUserState và API getPenaltiesByUserId
import { useUserState } from "@/recoils/user.state";
import { getPenaltiesByUserId } from "../apis/provider.api";

const GroupEditVehicleModal: React.FC<GroupEditVehicleModalProps> = ({
  open,
  vehicle,
  loading = false,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const [user] = useUserState();
  type RentalRuleOption = {
    value: string;
    label: string;
    penaltyType: string;
    penaltyValue: number;
  };
  const [rentalRuleOptions, setRentalRuleOptions] = useState<
    RentalRuleOption[]
  >([]);

  useEffect(() => {
    async function fetchRentalRules() {
      if (!user?.id) return;
      try {
        const res = await getPenaltiesByUserId(user.id);
        type Rule = {
          id: string;
          penaltyType: string;
          penaltyValue: number;
          minCancelHour: number;
        };
        const options: RentalRuleOption[] = (res.penalties || []).map(
          (rule: Rule) => ({
            value: rule.id,
            label:
              rule.penaltyType === "FIXED"
                ? `Phạt ${rule.penaltyValue?.toLocaleString(
                    "vi-VN"
                  )} VNĐ nếu hủy trong vòng ${rule.minCancelHour} giờ`
                : `Phạt ${rule.penaltyValue}% nếu hủy trong vòng ${rule.minCancelHour} giờ`,
            penaltyType: rule.penaltyType,
            penaltyValue: rule.penaltyValue,
          })
        );
        setRentalRuleOptions(options);
      } catch {}
    }
    if (open) fetchRentalRules();
  }, [open, user]);

  useEffect(() => {
    if (vehicle) {
      // Nếu là group, lấy penalty id từ vehicle[0].penalty?.id hoặc penaltyId hoặc rentalRule
      const v = vehicle as VehicleWithExtra & {
        penalty?: { id: string };
        penaltyId?: string;
        rentalRule?: string;
      };
      let penaltyId: string | undefined = undefined;
      if (v.penalty && typeof v.penalty.id === "string") {
        penaltyId = v.penalty.id;
      } else if (typeof v.penaltyId === "string") {
        penaltyId = v.penaltyId;
      } else if (typeof v.rentalRule === "string") {
        penaltyId = v.rentalRule;
      }
      form.setFieldsValue({
        thumb: v.thumb,
        fuelType: v.fuelType,
        vehicleFeatures: v.vehicleFeatures?.map((f) => f.name) || [],
        brandName: v.brandName,
        transmission: v.transmission,
        yearManufacture: v.yearManufacture,
        costPerDay: v.costPerDay,
        insuranceStatus: v.insuranceStatus ?? "NO",
        shipToAddress: v.shipToAddress || "NO",
        rentalRule: penaltyId,
        description: v.description,
      });
    } else {
      form.resetFields();
    }
  }, [vehicle, form]);

  return (
    <Modal
      open={open}
      title="Chỉnh sửa thông tin nhóm xe máy"
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onOk}>
        <Card title={<span>Thông tin xe máy</span>} className="mb-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Form.Item
              label="Tên hiển thị xe"
              name="thumb"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên hiển thị cho xe",
                },
              ]}
            >
              <Input placeholder={vehicle?.thumb || "Nhập tên hiển thị xe"} />
            </Form.Item>
            <Form.Item
              label="Loại nhiên liệu"
              name="fuelType"
              rules={[
                { required: true, message: "Vui lòng chọn loại nhiên liệu" },
              ]}
            >
              <Select
                placeholder={
                  vehicle?.fuelType ? undefined : "Chọn loại nhiên liệu"
                }
                options={fuelTypeOptions}
              />
            </Form.Item>
            <Form.Item
              label="Tiện ích xe"
              name="vehicleFeatures"
              className="md:col-span-2"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn ít nhất một tiện ích",
                },
              ]}
              tooltip="Chọn các tiện ích có sẵn trên xe của bạn"
            >
              <Select
                mode="multiple"
                placeholder={
                  vehicle?.vehicleFeatures?.map((f) => f.name).join(", ") ||
                  "Chọn các tiện ích của xe"
                }
                options={featureOptions}
                optionFilterProp="label"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
                allowClear
              />
            </Form.Item>
            <Form.Item
              label="Hãng xe"
              name="brandName"
              rules={[{ required: true, message: "Vui lòng nhập hãng xe" }]}
            >
              <Input placeholder={vehicle?.brandName || "Nhập hãng xe"} />
            </Form.Item>
            <Form.Item
              label="Truyền động"
              name="transmission"
              rules={[
                { required: true, message: "Vui lòng nhập loại truyền động" },
              ]}
            >
              <Input
                placeholder={vehicle?.transmission || "Nhập loại truyền động"}
              />
            </Form.Item>
            <Form.Item
              label="Năm sản xuất"
              name="yearManufacture"
              rules={[
                { required: true, message: "Vui lòng nhập năm sản xuất" },
              ]}
            >
              <InputNumber
                className="w-full"
                min={1990}
                max={new Date().getFullYear()}
                placeholder={
                  vehicle?.yearManufacture?.toString() || "Nhập năm sản xuất"
                }
              />
            </Form.Item>
            <Form.Item
              label="Giá thuê/ngày (VNĐ)"
              name="costPerDay"
              rules={[{ required: true, message: "Vui lòng nhập giá thuê" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder={
                  vehicle?.costPerDay?.toString() || "Nhập giá thuê/ngày"
                }
              />
            </Form.Item>
            <Form.Item
              label="Bảo hiểm"
              name="insuranceStatus"
              rules={[{ required: true, message: "Vui lòng chọn bảo hiểm" }]}
            >
              <Select
                placeholder={
                  form.getFieldValue("insuranceStatus")
                    ? undefined
                    : "Chọn bảo hiểm"
                }
                options={insuranceOptions}
              />
            </Form.Item>
            <Form.Item
              label="Giao xe tận nơi"
              name="shipToAddress"
              rules={[
                { required: true, message: "Vui lòng chọn giao xe tận nơi" },
              ]}
            >
              <Select
                placeholder={
                  vehicle?.shipToAddress ? undefined : "Chọn giao xe tận nơi"
                }
                options={deliveryOptions}
              />
            </Form.Item>
            <Form.Item
              label="Quy định thuê xe"
              name="rentalRule"
              className="md:col-span-2"
              rules={[
                { required: true, message: "Vui lòng chọn quy định thuê xe" },
              ]}
              tooltip="Chọn quy định áp dụng khi khách thuê xe của bạn"
            >
              <Select
                placeholder={
                  form.getFieldValue("rentalRule")
                    ? undefined
                    : "Chọn quy định thuê xe"
                }
                options={rentalRuleOptions}
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              label="Mô tả xe"
              name="description"
              className="md:col-span-2"
              rules={[{ required: true, message: "Vui lòng nhập mô tả về xe" }]}
            >
              <Input.TextArea
                rows={4}
                placeholder={vehicle?.description || "Nhập mô tả xe"}
              />
            </Form.Item>
          </div>
        </Card>
        <div className="flex justify-end">
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default GroupEditVehicleModal;
