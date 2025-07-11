"use client";

import { createVehicle, updateVehicle } from "@/apis/vehicle.api";
import { getUserVehicleById, getUserVehicles } from "@/apis/user-vehicles.api";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { useUserState } from "@/recoils/user.state";
import { EditOutlined, PlusOutlined, CarFilled } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Spin,
  Switch,
  Table,
  message,
  Card,
  Typography,
  Empty,
  Tag,
  Tabs,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { Vehicle } from "@/types/vehicle";
import { UploadMultipleImage } from "@/components/UploadMultipleImage";
import carBrands from "@/data/car-brands.json";
import carModels from "@/data/car-models.json";
import motorbikeBrands from "@/data/motorbike-brand.json";
import { showError, showSuccess, showWarning } from "@/utils/toast.utils";
import { getPenaltiesByUserId } from "@/apis/provider.api";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

enum VehicleType {
  CAR = "Car",
  MOTORBIKE = "Motorbike",
  BICYCLE = "Bicycle",
}

interface RegisterVehicleFormProps {
  vehicleId?: string;
  onOk?: () => void;
}

function RegisterVehicleForm({ vehicleId, onOk }: RegisterVehicleFormProps) {
  const [user] = useUserState();
  const [accessToken] = useLocalStorage("access_token");
  const isInsert = !vehicleId;
  const [form] = Form.useForm();

  const [isMultipleVehicles, setIsMultipleVehicles] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const registeredVehicles = user?.registeredVehicles || [];

  const [vehicleType, setVehicleType] = useState<VehicleType>(
    registeredVehicles.includes("CAR")
      ? VehicleType.CAR
      : registeredVehicles.includes("MOTORBIKE")
      ? VehicleType.MOTORBIKE
      : VehicleType.BICYCLE
  );

  const vehicleDetail = useQuery({
    queryFn: () => getUserVehicleById(vehicleId),
    queryKey: ["GET_VEHICLE", vehicleId],
    enabled: !!vehicleId,
  });

  const apiCreateVehicle = useMutation({
    mutationFn: createVehicle,
  });

  const apiUpdateCar = useMutation({
    mutationFn: updateVehicle,
  });

  const [isActive, setIsActive] = useState<boolean>(true);
  const brandOptions =
    vehicleType === VehicleType.CAR
      ? carBrands
      : vehicleType === VehicleType.MOTORBIKE
      ? motorbikeBrands
      : [];

  const modelOptions = vehicleType === VehicleType.CAR ? carModels : [];

  const [rentalRules, setRentalRules] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRentalRules() {
      if (!user?.id) return;
      try {
        const res = await getPenaltiesByUserId(user.id);
        setRentalRules(res.penalties || []);
      } catch (error) {
        // Có thể showError nếu muốn
      }
    }
    fetchRentalRules();
  }, [user]);

  // 1. useEffect đầu: chỉ setVehicleType khi có dữ liệu
  useEffect(() => {
    if (vehicleDetail.data?.data) {
      const vehicle = vehicleDetail.data.data;
      let type = VehicleType.CAR;
      if (vehicle.vehicleType) {
        if (
          vehicle.vehicleType === "MOTORBIKE" ||
          vehicle.vehicleType === "Motorbike"
        ) {
          type = VehicleType.MOTORBIKE;
        } else if (
          vehicle.vehicleType === "BICYCLE" ||
          vehicle.vehicleType === "Bicycle"
        ) {
          type = VehicleType.BICYCLE;
        }
      } else {
        if (!vehicle.numberSeat && !vehicle.licensePlate) {
          type = VehicleType.BICYCLE;
        } else if (!vehicle.numberSeat && vehicle.licensePlate) {
          type = VehicleType.MOTORBIKE;
        }
      }
      setVehicleType(type);
      setIsActive(vehicle.status !== "UNAVAILABLE");
      setIsMultipleVehicles(false);
    }
  }, [vehicleDetail.data, form]);

  // 2. useEffect thứ hai: khi vehicleType đã đúng, mới setFieldsValue
  useEffect(() => {
    if (vehicleDetail.data?.data) {
      const vehicle = vehicleDetail.data.data;
      const imageUrls =
        vehicle.vehicleImages?.map(
          (img: { imageUrl: string }) => img.imageUrl
        ) || [];
      const featureNames =
        vehicle.vehicleFeatures?.map(
          (feature: { name: string }) => feature.name
        ) || [];
      form.setFieldsValue({
        brandId: vehicle.brandId,
        modelId: vehicle.modelId,
        brandName: vehicle.brandName,
        modelName: vehicle.modelName,
        thumb: vehicle.thumb,
        numberSeat: vehicle.numberSeat?.toString(),
        transmission: vehicle.transmission,
        licensePlate: vehicle.licensePlate,
        yearOfManufacture: vehicle.yearManufacture,
        costPerDay: vehicle.costPerDay,
        description: vehicle.description,
        images: imageUrls,
        vehicleFeatures: featureNames,
        fuelType: vehicle.fuelType,
        rentalRule: vehicle.rentalRule,
        isMultipleVehicles: false,
        haveDriver: vehicle.haveDriver || "NO",
        insuranceStatus: vehicle.insuranceStatus || "NO",
        shipToAddress: vehicle.shipToAddress || "NO",
      });
    }
    // Chỉ chạy lại khi vehicleType đổi (tức là options đã đúng)
  }, [vehicleType, vehicleDetail.data, form]);

  // Loading state for form submission

  const rentalRuleOptions = rentalRules.map((rule) => ({
    value: rule.id,
    label:
      rule.penaltyType === "FIXED"
        ? `Phạt ${rule.penaltyValue?.toLocaleString(
            "vi-VN"
          )} VNĐ nếu hủy trong vòng ${rule.minCancelHour} giờ`
        : `Phạt ${rule.penaltyValue}% nếu hủy trong vòng ${rule.minCancelHour} giờ`,
    penaltyType: rule.penaltyType,
    penaltyValue: rule.penaltyValue,
  }));

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
    { value: "DIESEL", label: "Dầu" },
    { value: "ELECTRIC", label: "Điện" },
    { value: "HYBRID", label: "Hybrid" },
  ];

  useEffect(() => {
    if (isMultipleVehicles) {
      setIsMultipleVehicles(false);
      form.setFieldsValue({
        isMultipleVehicles: false,
        vehicleQuantity: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  useEffect(() => {
    if (vehicleDetail.data?.data) {
      const vehicle = vehicleDetail.data.data;
      const imageUrls =
        vehicle.vehicleImages?.map(
          (img: { imageUrl: string }) => img.imageUrl
        ) || [];
      const featureNames =
        vehicle.vehicleFeatures?.map(
          (feature: { name: string }) => feature.name
        ) || [];

      // Map brandName/modelName sang brandId/modelId
      const brand = brandOptions.find((b) => b.label === vehicle.brandName);
      const model = modelOptions.find((m) => m.label === vehicle.modelName);

      form.setFieldsValue({
        brandId: brand?.value,
        modelId: model?.value,
        brandName: vehicle.brandName,
        modelName: vehicle.modelName,
        thumb: vehicle.thumb,
        numberSeat: vehicle.numberSeat?.toString(),
        transmission: vehicle.transmission,
        licensePlate: vehicle.licensePlate,
        yearOfManufacture: vehicle.yearManufacture,
        costPerDay: vehicle.costPerDay,
        description: vehicle.description,
        images: imageUrls,
        vehicleFeatures: featureNames,
        fuelType: vehicle.fuelType,
        rentalRule: vehicle.penalty?.id,
        isMultipleVehicles: false,
        haveDriver: vehicle.haveDriver || "NO",
        insuranceStatus: vehicle.insuranceStatus || "NO",
        shipToAddress: vehicle.shipToAddress || "NO",
      });
    }
    // Chỉ chạy lại khi vehicleType đổi
  }, [vehicleType, vehicleDetail.data, form, brandOptions, modelOptions]);

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);

    if (type === VehicleType.MOTORBIKE) {
      form.setFieldsValue({
        numberSeat: undefined,
      });
    } else if (type === VehicleType.BICYCLE) {
      form.setFieldsValue({
        numberSeat: undefined,
        licensePlate: undefined,
        transmission: undefined,
        vehicleFeatures: undefined,
        fuelType: undefined,
      });
    }
  };

  if (vehicleId && vehicleDetail.isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      className="flex flex-col gap-4"
      initialValues={{
        vehicleType: VehicleType.CAR,
        haveDriver: "NO",
        insuranceStatus: "NO",
        shipToAddress: "NO",
      }}
      onFinish={async (values) => {
        setSubmitting(true);
        try {
          const formattedFeatures =
            values.vehicleFeatures?.map((name: string) => ({ name })) || [];

          // const submitData = {
          //   ...values,
          //   vehicleFeatures: values.vehicleFeatures.join(","), // hoặc .join(",") nếu BE yêu cầu CSV
          //   vehicleType,
          //   userId: user?.id || user?.result?.id,
          //   licensePlate:
          //     isMultipleVehicles && vehicleType === VehicleType.MOTORBIKE
          //       ? "MULTIPLE_VEHICLES"
          //       : values.licensePlate,
          //   isMultipleVehicles: isMultipleVehicles,
          //   vehicleQuantity: isMultipleVehicles ? values.vehicleQuantity : 1,
          //   status: isActive ? "AVAILABLE" : "UNAVAILABLE",
          //   yearManufacture: values.yearOfManufacture,
          //   vehicleImages: JSON.stringify(values.images), // hoặc .join(",") nếu BE yêu cầu CSV
          //   numberSeat: Number(values.numberSeat), // chuyển về số
          // };
          // delete submitData.yearOfManufacture;
          // delete submitData.images;
          const submitData = {
            ...values,
            vehicleFeatures: values.vehicleFeatures.join(","),
            vehicleType,
            userId: user?.id || user?.result?.id,
            licensePlate:
              isMultipleVehicles && vehicleType === VehicleType.MOTORBIKE
                ? "MULTIPLE_VEHICLES"
                : values.licensePlate,
            isMultipleVehicles: isMultipleVehicles,
            vehicleQuantity: isMultipleVehicles ? values.vehicleQuantity : 1,
            status: isActive ? "AVAILABLE" : "UNAVAILABLE",
            yearManufacture: values.yearOfManufacture,
            vehicleImages: values.images,
            numberSeat: Number(values.numberSeat),
            penaltyId: values.rentalRule,
          };
          delete submitData.yearOfManufacture;
          delete submitData.images;

          // Thêm log này để xem request gửi lên BE
          console.log("Submit data:", submitData);

          // Kiểm tra rule loại cố định
          const selectedRule = rentalRuleOptions.find(
            (opt) => opt.value === values.rentalRule
          );
          if (
            selectedRule?.penaltyType === "FIXED" &&
            selectedRule.penaltyValue > values.costPerDay
          ) {
            showError(
              "Giá trị phí phạt cố định phải nhỏ hơn hoặc bằng giá thuê xe/ngày!"
            );
            setSubmitting(false);
            return;
          }

          if (isInsert) {
            await apiCreateVehicle.mutateAsync({
              body: submitData,
              accessToken,
            });
            showSuccess(
              isMultipleVehicles
                ? "Đăng ký nhiều xe thành công, vui lòng chờ duyệt"
                : "Đăng ký xe thành công, vui lòng chờ duyệt"
            );
          } else {
            await apiUpdateCar.mutateAsync({
              vehicleId,
              body: submitData,
              accessToken,
            });
            showSuccess("Cập nhật thông tin xe thành công");
          }

          onOk?.();
          form.resetFields();
        } catch (error) {
          showError("Có lỗi xảy ra khi đăng ký xe");
          console.error(error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Tabs
        activeKey={vehicleType}
        onChange={
          !vehicleId ? (key) => setVehicleType(key as VehicleType) : undefined
        }
        className="mb-4"
        tabBarStyle={
          vehicleId ? { pointerEvents: "none", opacity: 0.6 } : undefined
        }
      >
        {registeredVehicles.includes("CAR") && (
          <TabPane
            tab={
              <>
                <CarFilled /> Ô tô
                {vehicleId &&
                  vehicleType === VehicleType.CAR &&
                  " (Đang chỉnh sửa)"}
              </>
            }
            key={VehicleType.CAR}
          />
        )}
        {registeredVehicles.includes("MOTORBIKE") && (
          <TabPane
            tab={
              <>
                <CarFilled /> Xe máy
                {vehicleId &&
                  vehicleType === VehicleType.MOTORBIKE &&
                  " (Đang chỉnh sửa)"}
              </>
            }
            key={VehicleType.MOTORBIKE}
          />
        )}
        {registeredVehicles.includes("BICYCLE") && (
          <TabPane
            tab={
              <>
                <CarFilled /> Xe đạp
                {vehicleId &&
                  vehicleType === VehicleType.BICYCLE &&
                  " (Đang chỉnh sửa)"}
              </>
            }
            key={VehicleType.BICYCLE}
          />
        )}
      </Tabs>

      <div className="md:flex gap-6">
        <div className="md:w-2/5">
          <Card title="Hình ảnh xe" className="mb-4">
            <Form.Item
              label="Các hình ảnh xe"
              name="images"
              rules={[
                {
                  required: true,
                  message: "Vui lòng tải lên ít nhất một hình ảnh",
                },
              ]}
              tooltip="Tải lên nhiều hình ảnh để người thuê có thể thấy rõ tình trạng xe"
            >
              <UploadMultipleImage />
            </Form.Item>
          </Card>
        </div>

        <div className="md:w-3/5">
          <Card
            title={
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <span>Thông tin xe</span>
                  <Tag
                    color={isActive ? "green" : "orange"}
                    className="rounded-full px-3 py-1"
                  >
                    {isActive ? "Đang hoạt động" : "Không hoạt động"}
                  </Tag>
                </div>
                {vehicleId && (
                  <Button
                    danger={!isActive}
                    onClick={() => setIsActive((prev) => !prev)}
                    type="default"
                  >
                    {isActive ? "Ẩn xe" : "Hiện xe"}
                  </Button>
                )}
              </div>
            }
            className="mb-4"
          >
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
                <Input placeholder="Ví dụ: Toyota Camry 2022 - Sang trọng, đầy đủ tiện nghi" />
              </Form.Item>

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Loại nhiên liệu"
                  name="fuelType"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn loại nhiên liệu",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn loại nhiên liệu"
                    options={
                      vehicleType === VehicleType.MOTORBIKE
                        ? fuelTypeOptions.filter(
                            (opt) =>
                              opt.value === "GASOLINE" ||
                              opt.value === "ELECTRIC"
                          )
                        : fuelTypeOptions
                    }
                  />
                </Form.Item>
              )}

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
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
                    placeholder="Chọn các tiện ích của xe"
                    options={featureOptions}
                    optionFilterProp="label"
                    style={{ width: "100%" }}
                    tokenSeparators={[","]}
                    allowClear
                  />
                </Form.Item>
              )}

              {vehicleType !== VehicleType.BICYCLE && (
                <Form.Item
                  label="Hãng xe"
                  name="brandId"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn hãng xe",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn hãng xe"
                    options={brandOptions.map((b) => ({
                      value: b.value,
                      label: b.label,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}

              {vehicleType === VehicleType.CAR && (
                <Form.Item
                  label="Dòng xe"
                  name="modelId"
                  rules={[{ required: true, message: "Vui lòng chọn dòng xe" }]}
                >
                  <Select
                    placeholder="Chọn dòng xe"
                    options={modelOptions.map((m) => ({
                      value: m.value,
                      label: m.label,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}

              {!vehicleId &&
                (vehicleType === VehicleType.MOTORBIKE ||
                  vehicleType === VehicleType.BICYCLE) && (
                  <Form.Item
                    label="Tạo nhiều xe cùng loại"
                    name="isMultipleVehicles"
                    valuePropName="checked"
                    className="md:col-span-2"
                    tooltip={
                      vehicleType === VehicleType.MOTORBIKE
                        ? "Khi tạo nhiều xe cùng loại, bạn không cần nhập biển số cho từng xe"
                        : "Cho phép tạo nhiều xe đạp cùng loại cùng lúc"
                    }
                  >
                    <div className="flex items-center">
                      <Switch
                        checked={isMultipleVehicles}
                        onChange={(checked) => {
                          setIsMultipleVehicles(checked);
                          if (checked) {
                            form.setFieldsValue({
                              licensePlate: undefined,
                              vehicleQuantity: 2,
                            });
                          } else {
                            form.setFieldsValue({
                              vehicleQuantity: undefined,
                            });
                          }
                        }}
                      />
                      <span className="ml-2">
                        {vehicleType === VehicleType.MOTORBIKE
                          ? "Tôi muốn đăng ký nhiều xe máy cùng loại (không cần nhập biển số)"
                          : "Tôi muốn đăng ký nhiều xe đạp cùng loại"}
                      </span>
                    </div>
                  </Form.Item>
                )}
              {!vehicleId && isMultipleVehicles && (
                <Form.Item
                  label="Số lượng xe"
                  name="vehicleQuantity"
                  className="md:col-span-2"
                  rules={[
                    {
                      required: isMultipleVehicles,
                      message: "Vui lòng nhập số lượng xe cần tạo",
                    },
                    {
                      type: "number",
                      min: 2,
                      message: "Số lượng phải từ 2 xe trở lên",
                    },
                    {
                      type: "number",
                      max: 20,
                      message: "Số lượng tối đa là 20 xe",
                    },
                  ]}
                  tooltip="Nhập số lượng xe cùng loại cần đăng ký"
                  initialValue={2}
                >
                  <InputNumber
                    className="w-full"
                    min={2}
                    max={50}
                    placeholder="Nhập số lượng xe cần tạo"
                  />
                </Form.Item>
              )}

              {/* Thông báo nhắc nhở cho xe máy khi tạo nhiều */}
              {!vehicleId &&
                isMultipleVehicles &&
                vehicleType === VehicleType.MOTORBIKE && (
                  <div className="md:col-span-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                    <p>
                      <strong>Lưu ý:</strong> Khi tạo nhiều xe máy cùng loại,
                      bạn cần cập nhật biển số xe cho từng xe sau khi đăng ký
                      thành công.
                    </p>
                  </div>
                )}

              {vehicleType === VehicleType.CAR && (
                <Form.Item
                  label="Số ghế"
                  name="numberSeat"
                  rules={[
                    {
                      required: vehicleType === VehicleType.CAR,
                      message: "Vui lòng chọn số ghế của xe",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn số ghế"
                    options={[
                      { value: 2, label: "2 chỗ" },
                      { value: 4, label: "4 chỗ" },
                      { value: 5, label: "5 chỗ" },
                      { value: 7, label: "7 chỗ" },
                      { value: 9, label: "9 chỗ" },
                      { value: 12, label: "12 chỗ" },
                    ]}
                  />
                </Form.Item>
              )}

              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Truyền động"
                  name="transmission"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn loại hộp số",
                    },
                  ]}
                >
                  <Select
                    placeholder="Chọn loại hộp số"
                    options={
                      vehicleType === VehicleType.CAR
                        ? [
                            { value: "MANUAL", label: "Số sàn" },
                            { value: "AUTOMATIC", label: "Số tự động" },
                          ]
                        : [
                            { value: "MANUAL", label: "Số côn tay" },
                            { value: "AUTOMATIC", label: "Xe ga" },
                          ]
                    }
                  />
                </Form.Item>
              )}

              {(vehicleType === VehicleType.CAR ||
                (vehicleType === VehicleType.MOTORBIKE &&
                  !isMultipleVehicles)) && (
                <Form.Item
                  label="Biển số xe"
                  name="licensePlate"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập biển số xe",
                    },
                  ]}
                >
                  <Input
                    placeholder={
                      vehicleType === VehicleType.CAR
                        ? "Ví dụ: 51F-123.45"
                        : "Ví dụ: 59P1-12345"
                    }
                  />
                </Form.Item>
              )}

              <Form.Item
                label="Năm sản xuất"
                name="yearOfManufacture"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập năm sản xuất",
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={1990}
                  max={new Date().getFullYear()}
                  placeholder="Nhập năm sản xuất"
                />
              </Form.Item>

              <Form.Item
                label="Giá thuê/ngày (VNĐ)"
                name="costPerDay"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập giá thuê",
                  },
                ]}
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>

              {/* Có lái xe chỉ cho ô tô */}
              {vehicleType === VehicleType.CAR && (
                <Form.Item
                  label="Có lái xe"
                  name="haveDriver"
                  rules={[{ required: true, message: "Vui lòng chọn" }]}
                  initialValue="NO"
                >
                  <Select
                    options={[
                      { value: "YES", label: "Có" },
                      { value: "NO", label: "Không" },
                    ]}
                  />
                </Form.Item>
              )}

              {/* Bảo hiểm cho ô tô & xe máy */}
              {(vehicleType === VehicleType.CAR ||
                vehicleType === VehicleType.MOTORBIKE) && (
                <Form.Item
                  label="Bảo hiểm"
                  name="insuranceStatus"
                  rules={[{ required: true, message: "Vui lòng chọn" }]}
                  initialValue="NO"
                >
                  <Select
                    options={[
                      { value: "YES", label: "Có" },
                      { value: "NO", label: "Không" },
                    ]}
                  />
                </Form.Item>
              )}

              {/* Giao xe tận nơi cho cả 3 loại */}
              <Form.Item
                label="Giao xe tận nơi"
                name="shipToAddress"
                rules={[{ required: true, message: "Vui lòng chọn" }]}
                initialValue="NO"
              >
                <Select
                  options={[
                    { value: "YES", label: "Có" },
                    { value: "NO", label: "Không" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Quy định thuê xe"
                name="rentalRule"
                className="md:col-span-2"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn quy định thuê xe",
                  },
                ]}
                tooltip="Chọn quy định áp dụng khi khách thuê xe của bạn"
              >
                <Select
                  placeholder="Chọn quy định thuê xe"
                  options={rentalRuleOptions}
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item
                label="Mô tả xe"
                name="description"
                className="md:col-span-2"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập mô tả về xe",
                  },
                ]}
              >
                <Input.TextArea
                  rows={5}
                  placeholder="Nhập thông tin chi tiết về xe, tính năng đặc biệt, tình trạng xe..."
                />
              </Form.Item>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              disabled={submitting}
            >
              {isInsert ? "Đăng ký xe" : "Cập nhật thông tin"}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}

export default function UserRegisterVehicle() {
  const [registerVehicleModal, setRegisterVehicleModal] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<Vehicle["id"] | null>(
    null
  );
  const [accessToken] = useLocalStorage("access_token");

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);

  // Use loading state with animation delay for better user experience
  const [initialLoad, setInitialLoad] = useState(true);

  const {
    data: myCarsData,
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-vehicles", page, size],
    queryFn: () => getUserVehicles(page, size, "createdAt", "desc"),
    enabled: !!accessToken,
  });

  // Add a delay effect for smoother loading animation
  useEffect(() => {
    if (!queryLoading && initialLoad) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [queryLoading, initialLoad]);

  // Combine loading states
  const isLoading = queryLoading || initialLoad;

  const vehicles = myCarsData?.data?.content || [];

  const handleAddVehicle = () => {
    setEditVehicleId(null);
    setRegisterVehicleModal(true);
  };

  const handleEditVehicle = (vehicleId: string) => {
    setEditVehicleId(vehicleId);
    setRegisterVehicleModal(true);
  };

  const columns: ColumnsType<Vehicle> = [
    {
      title: "Hình ảnh",
      dataIndex: "vehicleImages",
      key: "vehicleImages",
      width: 120,
      render: (vehicleImages: Vehicle["vehicleImages"]) => (
        <Image
          className="w-20 h-14 rounded-lg object-cover"
          src={
            vehicleImages?.[0]?.imageUrl ||
            "/placeholder.svg?height=56&width=80"
          }
          alt="Vehicle thumbnail"
          fallback="/placeholder.svg?height=56&width=80"
        />
      ),
    },
    {
      title: "Thông tin xe",
      key: "vehicleInfo",
      render: (_, record: Vehicle) => (
        <div>
          <div className="font-medium text-gray-900">{record.thumb}</div>
          <div className="text-sm text-gray-500">
            {record.brandName} {record.modelName}
          </div>
        </div>
      ),
    },
    {
      title: "Thông số",
      key: "specs",
      render: (_, record: Vehicle) => (
        <div className="text-sm">
          {record.numberSeat && (
            <div>
              Ghế: <span className="font-medium">{record.numberSeat}</span>
            </div>
          )}
          {record.transmission && (
            <div>
              Hộp số: <span className="font-medium">{record.transmission}</span>
            </div>
          )}
          {record.licensePlate && (
            <div>
              Biển số:{" "}
              <span className="font-medium">{record.licensePlate}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Giá thuê/ngày",
      dataIndex: "costPerDay",
      key: "costPerDay",
      render: (cost: number) => (
        <div className="font-semibold text-green-600">
          {cost?.toLocaleString("vi-VN")} VNĐ
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={status === "AVAILABLE" ? "green" : "orange"}
          className="rounded-full px-3 py-1"
        >
          {status === "AVAILABLE" ? "Đang hoạt động" : "Không hoạt đ"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record: Vehicle) => (
        <Button
          type="primary"
          size="small"
          className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          onClick={() => handleEditVehicle(record.id)}
        >
          <EditOutlined /> Chỉnh sửa
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Global loading indicator */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-50"></div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="mb-2 text-gray-900">
              Danh sách xe của tôi
            </Title>
            <Text className="text-gray-600">
              Quản lý và theo dõi tình trạng các xe đã đăng ký
            </Text>
          </div>
          <Button
            type="primary"
            onClick={handleAddVehicle}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 animate-pulse hover:animate-none"
          >
            <PlusOutlined /> Đăng ký xe mới
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>
          <div className="flex items-center justify-center mb-4">
            <Spin size="small" className="mr-2" />
          </div>
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : vehicles.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table<Vehicle>
            columns={columns}
            dataSource={vehicles}
            rowKey="id"
            scroll={{ x: 1200 }}
            loading={isLoading}
            pagination={{
              current: page + 1,
              pageSize: size,
              total: myCarsData?.data?.totalElements || 0, // <-- Thêm dòng này
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ["5", "10", "20"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} xe`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage - 1);
                setSize(newPageSize);
              },
              disabled: isLoading,
            }}
            className="vehicle-table"
            locale={{
              emptyText: isLoading ? "Đang tải dữ liệu..." : "Không có dữ liệu",
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center transition-all duration-300 ease-in-out">
          <Empty
            description={
              <div className="animate-fadeIn">
                <p className="mb-4 text-lg">Bạn chưa đăng ký xe nào</p>
                <Button
                  type="primary"
                  onClick={handleAddVehicle}
                  className="animate-bounce"
                  size="large"
                >
                  Đăng ký xe ngay
                </Button>
              </div>
            }
          />
        </div>
      )}

      <Modal
        open={registerVehicleModal}
        title={editVehicleId ? "Cập nhật thông tin xe" : "Đăng ký xe mới"}
        width={1000}
        style={{ top: 20 }}
        destroyOnClose
        footer={null}
        onCancel={() => setRegisterVehicleModal(false)}
        confirmLoading={false}
      >
        <Spin
          spinning={editVehicleId ? isLoading : false}
          tip="Đang tải thông tin xe..."
        >
          <RegisterVehicleForm
            vehicleId={editVehicleId || undefined}
            onOk={() => {
              setRegisterVehicleModal(false);
              refetch();
            }}
          />
        </Spin>
      </Modal>
    </div>
  );
}

UserRegisterVehicle.Layout = ProviderLayout;
