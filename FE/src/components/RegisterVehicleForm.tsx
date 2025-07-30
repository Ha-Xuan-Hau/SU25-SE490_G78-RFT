import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Button,
  Card,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Switch,
  Tabs,
  Tag,
} from "antd";
import { CarFilled } from "@ant-design/icons";
import { UploadMultipleImage } from "./UploadMultipleImage";
import { VehicleType } from "../types/vehicle";
import {
  RegisterVehicleFormProps,
  ExtraRule,
} from "../types/registerVehicleForm";
import { useUserState } from "../recoils/user.state";
import useLocalStorage from "../hooks/useLocalStorage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createCar, updateCar, createWithQuantity } from "../apis/vehicle.api";
import { getUserVehicleById } from "../apis/user-vehicles.api";
import { getPenaltiesByUserId } from "../apis/provider.api";
import { showError, showSuccess } from "../utils/toast.utils";

import carBrands from "../data/car-brands.json";
import carModels from "../data/car-models.json";
import motorbikeBrands from "../data/motorbike-brand.json";

const { TabPane } = Tabs;

const RegisterVehicleForm: React.FC<RegisterVehicleFormProps> = ({
  vehicleId,
  onOk,
}) => {
  const [user] = useUserState();
  const [accessToken] = useLocalStorage("access_token");
  const isInsert = !vehicleId;
  const [form] = Form.useForm();

  const [isMultipleVehicles, setIsMultipleVehicles] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [licensePlates, setLicensePlates] = useState<string[]>([]);
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

  const [extraRule, setExtraRule] = useState<ExtraRule>({});

  // API mutations cho từng loại xe
  const apiCreateVehicle = useMutation({ mutationFn: createCar });
  const apiUpdateCar = useMutation({ mutationFn: updateCar });
  const apiCreateMotorbike = useMutation({ mutationFn: createWithQuantity });
  const apiUpdateMotorbike = useMutation({ mutationFn: updateCar });
  const apiCreateBicycle = useMutation({ mutationFn: createWithQuantity });
  const apiUpdateBicycle = useMutation({ mutationFn: updateCar });

  const [isActive, setIsActive] = useState<boolean>(true);
  const brandOptions = useMemo(
    () =>
      vehicleType === VehicleType.CAR
        ? carBrands
        : vehicleType === VehicleType.MOTORBIKE
        ? motorbikeBrands
        : [],
    [vehicleType]
  );
  const modelOptions = useMemo(
    () => (vehicleType === VehicleType.CAR ? carModels : []),
    [vehicleType]
  );
  const [rentalRules, setRentalRules] = useState<
    {
      id: string;
      penaltyType: string;
      penaltyValue: number;
      minCancelHour: number;
    }[]
  >([]);

  useEffect(() => {
    async function fetchRentalRules() {
      if (!user?.id) return;
      try {
        const res = await getPenaltiesByUserId(user.id);
        setRentalRules(res.penalties || []);
      } catch {}
    }
    fetchRentalRules();
  }, [user]);

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
      if (type === VehicleType.CAR && vehicle.extraFeeRule) {
        setExtraRule({ ...vehicle.extraFeeRule });
      }
    }
  }, [vehicleDetail.data, form]);

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
        rentalRule: vehicle.penalty?.id,
        isMultipleVehicles: false,
        haveDriver: vehicle.haveDriver || "NO",
        insuranceStatus: vehicle.insuranceStatus || "NO",
        shipToAddress: vehicle.shipToAddress || "NO",
      });
      if (vehicle.vehicleType === "CAR" && vehicle.extraFeeRule) {
        setExtraRule({ ...vehicle.extraFeeRule });
      }
    }
  }, [vehicleType, vehicleDetail.data, form]);

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
  ];

  useEffect(() => {
    if (isMultipleVehicles) {
      setIsMultipleVehicles(false);
      form.setFieldsValue({
        isMultipleVehicles: false,
        vehicleQuantity: undefined,
      });
    }
  }, [vehicleType]);

  useEffect(() => {
    if (isMultipleVehicles && vehicleType === VehicleType.MOTORBIKE) {
      const qty = Number(form.getFieldValue("vehicleQuantity"));
      if (qty && qty > 0) {
        setLicensePlates((prev) => {
          const arr = Array(qty).fill("");
          for (let i = 0; i < Math.min(prev.length, qty); i++) {
            arr[i] = prev[i];
          }
          return arr;
        });
      } else {
        setLicensePlates([]);
      }
    } else {
      setLicensePlates([]);
    }
  }, [isMultipleVehicles, vehicleType]);

  useEffect(() => {
    if (isMultipleVehicles && vehicleType === VehicleType.MOTORBIKE) {
      const qty = Number(form.getFieldValue("vehicleQuantity"));
      if (qty && qty > 0) {
        setLicensePlates((prev) => {
          const arr = Array(qty).fill("");
          for (let i = 0; i < Math.min(prev.length, qty); i++) {
            arr[i] = prev[i];
          }
          return arr;
        });
      } else {
        setLicensePlates([]);
      }
    } else {
      setLicensePlates([]);
    }
  }, [isMultipleVehicles, vehicleType, form.getFieldValue("vehicleQuantity")]);

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
      const brand = brandOptions.find(
        (b: any) => b.label === vehicle.brandName
      );
      const model = modelOptions.find(
        (m: any) => m.label === vehicle.modelName
      );
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
  }, [vehicleType, vehicleDetail.data, form, brandOptions, modelOptions]);

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);
    if (type === VehicleType.MOTORBIKE) {
      form.setFieldsValue({ numberSeat: undefined });
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
      onValuesChange={(changed, allValues) => {
        if (
          isMultipleVehicles &&
          vehicleType === VehicleType.MOTORBIKE &&
          typeof allValues.vehicleQuantity === "number"
        ) {
          const qty = allValues.vehicleQuantity;
          setLicensePlates((prev) => {
            const arr = Array(qty).fill("");
            for (let i = 0; i < Math.min(prev.length, qty); i++) {
              arr[i] = prev[i];
            }
            return arr;
          });
        }
        if (
          Object.prototype.hasOwnProperty.call(changed, "fuelType") ||
          Object.prototype.hasOwnProperty.call(changed, "haveDriver")
        ) {
          setExtraRule((prev) => ({ ...prev }));
        }
      }}
      onFinish={async (values) => {
        setSubmitting(true);
        try {
          // Xử lý biển số xe theo loại xe
          let licensePlateData: string[] = []; // Đảm bảo licensePlateData luôn là một mảng
          let quantity = 1;

          if (vehicleType === VehicleType.CAR) {
            // Ô tô: chỉ gửi 1 biển số trong mảng
            licensePlateData = [values.licensePlate || ""]; // Đóng gói thành mảng
            quantity = 1;
          } else if (vehicleType === VehicleType.MOTORBIKE) {
            if (isMultipleVehicles) {
              // Xe máy nhiều chiếc: gửi array
              const validLicensePlates = licensePlates.filter(
                (lp) => lp && lp.trim() !== ""
              );
              licensePlateData = validLicensePlates; // Giữ nguyên mảng
              quantity = validLicensePlates.length; // Số lượng biển số
            } else {
              // Xe máy 1 chiếc: gửi mảng với một biển số
              licensePlateData = [values.licensePlate || ""]; // Đóng gói thành mảng
              quantity = 1;
            }
          } else if (vehicleType === VehicleType.BICYCLE) {
            // Xe đạp: không có biển số
            licensePlateData = []; // Xe đạp không có biển số
            quantity = isMultipleVehicles ? values.vehicleQuantity || 1 : 1;
          }

          // Xử lý vehicleImages - chuyển từ array URL thành array object
          const formattedImages =
            values.images?.map((url: string) => ({
              imageUrl: url,
            })) || [];

          // Base submit data cho tất cả loại xe
          const baseSubmitData = {
            penaltyId: values.rentalRule,
            licensePlate: licensePlateData,
            vehicleType: vehicleType, // "Car", "Motorbike", "Bicycle"
            vehicleFeatures: values.vehicleFeatures?.join(", ") || "",
            vehicleImages: formattedImages,
            haveDriver: "NO", // Xe máy và xe đạp luôn là "NO"
            insuranceStatus: values.insuranceStatus || "NO",
            shipToAddress: values.shipToAddress || "NO",
            yearManufacture: values.yearOfManufacture,
            transmission: values.transmission,
            fuelType: values.fuelType,
            description: values.description,
            numberVehicle: quantity,
            costPerDay: values.costPerDay,
            status: "PENDING", // Mặc định là PENDING
            thumb: values.thumb,
            userId: user?.id || user?.result?.id,
            isMultipleVehicles: isMultipleVehicles,
          };

          let submitData;

          if (vehicleType === VehicleType.CAR) {
            // Ô tô: có đầy đủ các field
            submitData = {
              ...baseSubmitData,
              brandId: values.brandId,
              modelId: values.modelId,
              numberSeat: Number(values.numberSeat),
              haveDriver: values.haveDriver || "NO",

              // Extra fees cho ô tô
              maxKmPerDay: extraRule.maxKmPerDay,
              feePerExtraKm: extraRule.feePerExtraKm,
              allowedHourLate: extraRule.allowedHourLate,
              feePerExtraHour: extraRule.feePerExtraHour,
              cleaningFee: extraRule.cleaningFee,
              smellRemovalFee: extraRule.smellRemovalFee,

              // Phí sạc pin cho xe điện
              batteryChargeFeePerPercent:
                values.fuelType === "ELECTRIC"
                  ? extraRule.batteryChargeFeePerPercent
                  : null,
              apply_batteryChargeFee:
                values.fuelType === "ELECTRIC"
                  ? extraRule.apply_batteryChargeFee
                  : null,

              // Phí tài xế
              driverFeePerDay:
                values.haveDriver === "YES" ? extraRule.driverFeePerDay : null,
              driverFeePerHour:
                values.haveDriver === "YES" ? extraRule.driverFeePerHour : null,
              hasDriverOption: values.haveDriver === "YES",
              hasHourlyRental:
                values.haveDriver === "YES" ? extraRule.hasHourlyRental : false,
            };
          } else if (vehicleType === VehicleType.MOTORBIKE) {
            // Xe máy: gửi tất cả field nhưng set null cho những field không dùng
            submitData = {
              ...baseSubmitData,
              brandId: values.brandId,
              modelId: null, // Xe máy không có modelId
              numberSeat: 2, // Giá trị mặc định cho xe máy

              // Tất cả extra fees đều gửi nhưng với giá trị từ ví dụ
              // maxKmPerDay: 200,
              // feePerExtraKm: 5000,
              // allowedHourLate: 2,
              // feePerExtraHour: 100000,
              // cleaningFee: 50000,
              // smellRemovalFee: 30000,
              // batteryChargeFeePerPercent: null,
              // driverFeePerDay: null,
              // hasDriverOption: false,
              // driverFeePerHour: null,
              // hasHourlyRental: false,
            };
          } else if (vehicleType === VehicleType.BICYCLE) {
            // Xe đạp: gửi tất cả field nhưng set null cho những field không dùng
            submitData = {
              ...baseSubmitData,
              brandId: null, // Xe đạp không có brandId
              modelId: null, // Xe đạp không có modelId
              numberSeat: 2, // Giá trị mặc định

              // Override một số field cho xe đạp
              // transmission: "AUTOMATIC",
              // fuelType: "GASOLINE",

              // Tất cả extra fees đều gửi nhưng với giá trị từ ví dụ
              // maxKmPerDay: 200,
              // feePerExtraKm: 5000,
              // allowedHourLate: 2,
              // feePerExtraHour: 100000,
              // cleaningFee: 50000,
              // smellRemovalFee: 30000,
              // batteryChargeFeePerPercent: null,
              // driverFeePerDay: null,
              // hasDriverOption: false,
              // driverFeePerHour: null,
              // hasHourlyRental: false,
            };
          }

          // Validation
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

          // Validation cho biển số trùng lặp (chỉ khi là xe máy nhiều chiếc)
          if (
            vehicleType === VehicleType.MOTORBIKE &&
            isMultipleVehicles &&
            Array.isArray(licensePlateData)
          ) {
            const trimmedPlates = licensePlateData
              .map((lp) => lp.trim())
              .filter((lp) => lp !== "");
            const uniquePlates = new Set(trimmedPlates);

            if (uniquePlates.size !== trimmedPlates.length) {
              showError("Các biển số xe phải khác nhau!");
              setSubmitting(false);
              return;
            }

            if (trimmedPlates.length !== licensePlateData.length) {
              showError("Vui lòng nhập đầy đủ biển số cho tất cả xe!");
              setSubmitting(false);
              return;
            }
          }

          // Validation cho phí tài xế bắt buộc khi có lái xe (chỉ ô tô)
          if (vehicleType === VehicleType.CAR && values.haveDriver === "YES") {
            if (!extraRule.driverFeePerDay || extraRule.driverFeePerDay <= 0) {
              showError("Vui lòng nhập phí tài xế/ngày!");
              setSubmitting(false);
              return;
            }

            if (extraRule.hasHourlyRental === undefined) {
              showError("Vui lòng chọn có cho thuê theo giờ không!");
              setSubmitting(false);
              return;
            }

            // Chỉ validate phí tài xế/giờ khi hasHourlyRental là true
            if (extraRule.hasHourlyRental === true) {
              if (
                !extraRule.driverFeePerHour ||
                extraRule.driverFeePerHour <= 0
              ) {
                showError("Vui lòng nhập phí tài xế/giờ!");
                setSubmitting(false);
                return;
              }
            }
          }

          console.log("Submit data:", submitData); // Debug log

          // Gửi API theo loại xe
          if (isInsert) {
            if (vehicleType === VehicleType.CAR) {
              await apiCreateVehicle.mutateAsync({
                body: submitData,
                accessToken,
              });
            } else if (vehicleType === VehicleType.MOTORBIKE) {
              await apiCreateMotorbike.mutateAsync({
                body: submitData,
                accessToken,
              });
            } else if (vehicleType === VehicleType.BICYCLE) {
              // TODO: Thay thế bằng API bicycle thực tế
              await apiCreateBicycle.mutateAsync({
                body: submitData,
                accessToken,
              });
            }

            showSuccess(
              isMultipleVehicles
                ? "Đăng ký nhiều xe thành công, vui lòng chờ duyệt"
                : "Đăng ký xe thành công, vui lòng chờ duyệt"
            );
          } else {
            // Update logic tương tự
            if (vehicleType === VehicleType.CAR) {
              await apiUpdateCar.mutateAsync({
                vehicleId,
                body: submitData,
                accessToken,
              });
            } else if (vehicleType === VehicleType.MOTORBIKE) {
              // TODO: Thay thế bằng API motorbike thực tế
              await apiUpdateCar.mutateAsync({
                vehicleId,
                body: submitData,
                accessToken,
              });
            } else if (vehicleType === VehicleType.BICYCLE) {
              // TODO: Thay thế bằng API bicycle thực tế
              await apiUpdateCar.mutateAsync({
                vehicleId,
                body: submitData,
                accessToken,
              });
            }

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
      {/* Giữ nguyên phần JSX form */}
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

        {/* Phụ phí chỉ hiển thị cho ô tô */}
        {vehicleType === VehicleType.CAR && (
          <div className="md:w-md mb-4">
            <Card title="Phụ phí có thể phát sinh">
              <Form.Item label="Số km tối đa/ngày" className="md:col-span-1">
                <InputNumber
                  className="w-full"
                  min={0}
                  value={extraRule.maxKmPerDay}
                  onChange={(v) =>
                    setExtraRule((prev) => ({
                      ...prev,
                      maxKmPerDay: v ?? undefined,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="Phí vượt km/ngày (VNĐ/km)"
                className="md:col-span-1"
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  value={extraRule.feePerExtraKm}
                  onChange={(v) =>
                    setExtraRule((prev) => ({
                      ...prev,
                      feePerExtraKm: v ?? undefined,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="Số giờ trễ cho phép" className="md:col-span-1">
                <InputNumber
                  className="w-full"
                  min={0}
                  value={extraRule.allowedHourLate}
                  onChange={(v) =>
                    setExtraRule((prev) => ({
                      ...prev,
                      allowedHourLate: v ?? undefined,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item
                label="Phí vượt giờ (VNĐ/giờ)"
                className="md:col-span-1"
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  value={extraRule.feePerExtraHour}
                  onChange={(v) =>
                    setExtraRule((prev) => ({
                      ...prev,
                      feePerExtraHour: v ?? undefined,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="Phí vệ sinh xe (VNĐ)" className="md:col-span-1">
                <InputNumber
                  className="w-full"
                  min={0}
                  value={extraRule.cleaningFee}
                  onChange={(v) =>
                    setExtraRule((prev) => ({
                      ...prev,
                      cleaningFee: v ?? undefined,
                    }))
                  }
                />
              </Form.Item>
              <Form.Item label="Phí khử mùi (VNĐ)" className="md:col-span-1">
                <InputNumber
                  className="w-full"
                  min={0}
                  value={extraRule.smellRemovalFee}
                  onChange={(v) =>
                    setExtraRule((prev) => ({
                      ...prev,
                      smellRemovalFee: v ?? undefined,
                    }))
                  }
                />
              </Form.Item>
              {/* Only show battery fields if fuelType is ELECTRIC */}
              {form.getFieldValue("fuelType") === "ELECTRIC" && (
                <>
                  <Form.Item
                    label="Phí sạc pin (VNĐ/% pin)"
                    className="md:col-span-1"
                  >
                    <InputNumber
                      className="w-full"
                      min={0}
                      value={extraRule.batteryChargeFeePerPercent}
                      onChange={(v) =>
                        setExtraRule((prev) => ({
                          ...prev,
                          batteryChargeFeePerPercent: v ?? undefined,
                        }))
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    label="Áp dụng phí sạc pin?"
                    className="md:col-span-1"
                  >
                    <Select
                      value={extraRule.apply_batteryChargeFee}
                      onChange={(v) =>
                        setExtraRule((prev) => ({
                          ...prev,
                          apply_batteryChargeFee: v,
                        }))
                      }
                      options={[
                        { value: true, label: "Có" },
                        { value: false, label: "Không" },
                      ]}
                    />
                  </Form.Item>
                </>
              )}
              {/* Only show driver fields if haveDriver is YES */}
              {form.getFieldValue("haveDriver") === "YES" && (
                <>
                  <Form.Item
                    label="Phí tài xế/ngày (VNĐ)"
                    className="md:col-span-1"
                    required
                  >
                    <InputNumber
                      className="w-full"
                      min={0}
                      value={extraRule.driverFeePerDay}
                      onChange={(v) =>
                        setExtraRule((prev) => ({
                          ...prev,
                          driverFeePerDay: v ?? undefined,
                        }))
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    label="Cho thuê theo giờ?"
                    className="md:col-span-1"
                    required
                  >
                    <Select
                      value={extraRule.hasHourlyRental}
                      onChange={(v) =>
                        setExtraRule((prev) => ({
                          ...prev,
                          hasHourlyRental: v,
                          // Reset phí tài xế/giờ khi thay đổi hasHourlyRental
                          driverFeePerHour: v
                            ? prev.driverFeePerHour
                            : undefined,
                        }))
                      }
                      options={[
                        { value: true, label: "Có" },
                        { value: false, label: "Không" },
                      ]}
                    />
                  </Form.Item>

                  {/* Chỉ hiện phí tài xế/giờ khi hasHourlyRental là true */}
                  {extraRule.hasHourlyRental === true && (
                    <Form.Item
                      label="Phí tài xế/giờ (VNĐ)"
                      className="md:col-span-1"
                      required
                    >
                      <InputNumber
                        className="w-full"
                        min={0}
                        value={extraRule.driverFeePerHour}
                        onChange={(v) =>
                          setExtraRule((prev) => ({
                            ...prev,
                            driverFeePerHour: v ?? undefined,
                          }))
                        }
                      />
                    </Form.Item>
                  )}
                </>
              )}
            </Card>
          </div>
        )}

        {/* Form nhập biển số động cho nhiều xe máy*/}
        {!vehicleId &&
          isMultipleVehicles &&
          vehicleType === VehicleType.MOTORBIKE && (
            <div className="md:w-md mb-4">
              <Card title="Nhập biển số cho từng xe">
                {licensePlates.map((lp, idx) => (
                  <Form.Item
                    key={idx}
                    label={`Biển số xe ${idx + 1}`}
                    required
                    validateStatus={lp.trim() === "" ? "error" : ""}
                    help={lp.trim() === "" ? "Vui lòng nhập biển số xe" : ""}
                  >
                    <Input
                      value={lp}
                      onChange={(e) => {
                        const arr = [...licensePlates];
                        arr[idx] = e.target.value;
                        setLicensePlates(arr);
                      }}
                      placeholder="Nhập biển số xe"
                    />
                  </Form.Item>
                ))}
                {/* Hiển thị lỗi nếu có biển số trùng nhau */}
                {(() => {
                  const trimmed = licensePlates
                    .map((lp) => lp.trim())
                    .filter((lp) => lp !== "");
                  const unique = new Set(trimmed);
                  if (
                    trimmed.length === licensePlates.length &&
                    unique.size !== licensePlates.length
                  ) {
                    return (
                      <div className="text-red-500">
                        Các biển số phải khác nhau.
                      </div>
                    );
                  }
                  return null;
                })()}
              </Card>
            </div>
          )}

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
                  rules={[{ required: true, message: "Vui lòng chọn hãng xe" }]}
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
                        ? "Khi tạo nhiều xe cùng loại, cần nhập biển số cho từng xe"
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
                            form.setFieldsValue({ vehicleQuantity: undefined });
                          }
                        }}
                      />
                      <span className="ml-2"></span>
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
                    { required: true, message: "Vui lòng chọn loại hộp số" },
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
                            { value: "MANUAL", label: "Xe côn tay" },
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
                    { required: true, message: "Vui lòng nhập biển số xe" },
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
                  { required: true, message: "Vui lòng nhập năm sản xuất" },
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
                rules={[{ required: true, message: "Vui lòng nhập giá thuê" }]}
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
                  { required: true, message: "Vui lòng chọn quy định thuê xe" },
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
                  { required: true, message: "Vui lòng nhập mô tả về xe" },
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
};

export default RegisterVehicleForm;
