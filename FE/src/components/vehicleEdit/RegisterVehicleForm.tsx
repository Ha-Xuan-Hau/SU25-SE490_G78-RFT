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
  Divider,
} from "antd";
import { CarFilled } from "@ant-design/icons";
import { UploadMultipleImage } from "../uploadImage/UploadMultipleImage";
import { VehicleType } from "../../types/vehicle";
import {
  RegisterVehicleFormProps,
  ExtraRule,
} from "../../types/registerVehicleForm";
import { useUserState } from "../../recoils/user.state";
import useLocalStorage from "../../hooks/useLocalStorage";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createCar,
  updateCar,
  createWithQuantity,
} from "../../apis/vehicle.api";
import { getUserVehicleById } from "../../apis/user-vehicles.api";
import { getPenaltiesByUserId } from "../../apis/provider.api";
import { showApiError, showError, showSuccess } from "../../utils/toast.utils";

import carBrands from "../../data/car-brands.json";
import carModels from "../../data/car-models.json";
import motorbikeBrands from "../../data/motorbike-brand.json";
import { UploadSingleImage } from "../uploadImage/UploadSingleImage";
import {
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { toggleVehicleStatus } from "../../apis/vehicle.api";
import { Modal } from "antd";

const { TabPane } = Tabs;

const RegisterVehicleForm: React.FC<RegisterVehicleFormProps> = ({
  vehicleId,
  onOk,
  onStatusChanged,
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

  // Thêm state cho toggle loading
  const [toggleLoading, setToggleLoading] = useState(false);

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

  // Thêm hàm xử lý toggle status
  const handleToggleStatus = async () => {
    if (!vehicleId || !vehicleDetail.data?.data) return;

    const vehicle = vehicleDetail.data.data;
    const currentStatus = vehicle.status;

    if (currentStatus !== "AVAILABLE" && currentStatus !== "SUSPENDED") {
      showError(
        "Chỉ có thể thay đổi trạng thái của xe đang hoạt động hoặc tạm dừng"
      );
      return;
    }

    const isSuspended = currentStatus === "SUSPENDED";
    const actionText = isSuspended ? "đưa vào hoạt động" : "tạm dừng hoạt động";

    Modal.confirm({
      title: `Xác nhận ${actionText}`,
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Bạn có chắc chắn muốn {actionText} xe &quot;{vehicle.thumb}&quot;?
          </p>
          <p className="mt-2 text-gray-500">
            Trạng thái hiện tại:{" "}
            <Tag color={isSuspended ? "volcano" : "green"}>
              {isSuspended ? "Tạm dừng" : "Đang hoạt động"}
            </Tag>
          </p>
          <p className="text-gray-500">
            Trạng thái mới:{" "}
            <Tag color={isSuspended ? "green" : "volcano"}>
              {isSuspended ? "Đang hoạt động" : "Tạm dừng"}
            </Tag>
          </p>
        </div>
      ),
      okText: "Đồng ý",
      cancelText: "Hủy",
      onOk: async () => {
        setToggleLoading(true);
        try {
          const result = await toggleVehicleStatus(vehicleId);

          // Kiểm tra response từ backend
          if (result.success === false) {
            // showApiError sẽ tự động lấy message từ result
            showApiError(result, `Không thể ${actionText}`);
            return;
          }

          showSuccess(result.message || `Đã ${actionText} thành công`);

          // Refresh data và đóng modal
          if (onStatusChanged) {
            onStatusChanged();
          }

          if (onOk) {
            setTimeout(() => {
              onOk();
            }, 500);
          }
        } catch (error) {
          console.error("Toggle error:", error);
          // showApiError sẽ tự động extract message từ error
          showApiError(error, `Không thể ${actionText}`);
        } finally {
          setToggleLoading(false);
        }
      },
    });
  };

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

      const allImages =
        vehicle.vehicleImages?.map(
          (img: { imageUrl: string }) => img.imageUrl
        ) || [];

      // Tách ảnh xe và ảnh giấy tờ dựa trên loại xe
      let vehicleImages, documentImage;

      if (type === VehicleType.BICYCLE) {
        // Xe đạp: tất cả ảnh đều là ảnh xe (không có ảnh giấy tờ)
        vehicleImages = allImages.slice(0, 4);
        documentImage = "";
      } else {
        // Ô tô/xe máy: 4 ảnh đầu là ảnh xe, ảnh thứ 5 là ảnh giấy tờ
        vehicleImages = allImages.slice(0, 4);
        documentImage = allImages[4] || "";
      }

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
        images: vehicleImages,
        documents: documentImage, // Sẽ là "" cho xe đạp
        vehicleFeatures: featureNames,
        fuelType: vehicle.fuelType,
        rentalRule: vehicle.penalty?.id,
        isMultipleVehicles: false,
        haveDriver: vehicle.haveDriver || "NO",
        insuranceStatus: vehicle.insuranceStatus || "NO",
        shipToAddress: vehicle.shipToAddress || "NO",
      });

      setIsMultipleVehicles(false);
      if (type === VehicleType.CAR && vehicle.extraFeeRule) {
        // setExtraRule({ ...vehicle.extraFeeRule });
        setExtraRule({
          maxKmPerDay: vehicle.extraFeeRule.maxKmPerDay || 0,
          feePerExtraKm: vehicle.extraFeeRule.feePerExtraKm || 0,
          allowedHourLate: vehicle.extraFeeRule.allowedHourLate || 0,
          feePerExtraHour: vehicle.extraFeeRule.feePerExtraHour || 0,
          cleaningFee: vehicle.extraFeeRule.cleaningFee || 0,
          smellRemovalFee: vehicle.extraFeeRule.smellRemovalFee || 0,
          // Quan trọng: khởi tạo đúng giá trị cho phí sạc pin
          batteryChargeFeePerPercent:
            vehicle.extraFeeRule.batteryChargeFeePerPercent || 0,
          applyBatteryChargeFee:
            vehicle.extraFeeRule.applyBatteryChargeFee === true,
          // Driver fees
          driverFeePerDay: vehicle.extraFeeRule.driverFeePerDay || 0,
          driverFeePerHour: vehicle.extraFeeRule.driverFeePerHour || 0,
          hasDriverOption: vehicle.extraFeeRule.hasDriverOption === true,
          hasHourlyRental: vehicle.extraFeeRule.hasHourlyRental === true,
        });
      }
    }
  }, [vehicleDetail.data, form]);

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

  //featureOptions
  const featureOptions = useMemo(() => {
    switch (vehicleType) {
      case VehicleType.CAR:
        return [
          { label: "GPS", value: "GPS" },
          { label: "Bluetooth", value: "Bluetooth" },
          { label: "Điều hòa khí", value: "Air Conditioning" },
          { label: "Ghế da", value: "Leather Seats" },
          { label: "Cảm biến đỗ xe", value: "Parking Sensors" },
          { label: "Camera hành trình", value: "Backup Camera" },
          { label: "Kính chống nắng", value: "Sunroof" },
          { label: "Ghế sưởi", value: "Heated Seats" },
          { label: "Hệ thống âm thanh cao cấp", value: "Premium Audio" },
          { label: "Cửa sổ trời", value: "Panoramic Roof" },
          { label: "Hệ thống khởi động từ xa", value: "Remote Start" },
          { label: "Cảnh báo điểm mù", value: "Blind Spot Monitor" },
          { label: "Cruise Control", value: "Cruise Control" },
          { label: "Hệ thống phanh ABS", value: "ABS Braking" },
          { label: "Cảm biến áp suất lốp", value: "TPMS" },
          { label: "Camera lùi", value: "Back Camera" },
          { label: "Khe cắm USB", value: "USB Port" },
          { label: "Màn hình DVD", value: "DVD Screen" },
          { label: "Túi khí an toàn", value: "Safety Airbag" },
          { label: "Cảnh báo tốc độ", value: "Speed Alert" },
        ];

      case VehicleType.MOTORBIKE:
        return [
          { label: "GPS", value: "GPS" },
          { label: "Bluetooth", value: "Bluetooth" },
          { label: "Khóa từ xa", value: "Remote Lock" },
          { label: "Báo động chống trộm", value: "Anti-theft Alarm" },
          { label: "Đèn LED", value: "LED Lights" },
          { label: "Cốp xe", value: "Storage Box" },
          { label: "Phanh ABS", value: "ABS Braking" },
          { label: "Khởi động điện", value: "Electric Start" },
          { label: "Sạc điện thoại USB", value: "USB Charging" },
          { label: "Đồng hồ kỹ thuật số", value: "Digital Dashboard" },
          { label: "Hệ thống định vị", value: "GPS Tracking" },

          //THEM MOI FEATURE
          { label: "Kính chắn gió", value: "Windshield" },
          { label: "Yên xe êm ái", value: "Comfort Seat" },
          { label: "Hệ thống chống trượt", value: "Traction Control" },
          { label: "Hệ thống treo cải tiến", value: "Advanced Suspension" },
          { label: "Khóa bánh trước", value: "Front Wheel Lock" },
          { label: "Gác chân cho người ngồi sau", value: "Passenger Footrest" },
          { label: "Lốp không săm", value: "Tubeless Tires" },
          { label: "Khóa cổ", value: "Steering Lock" },
          { label: "Chống nghiêng tự động", value: "Auto Side Stand" },
          {
            label: "Hệ thống tiết kiệm nhiên liệu",
            value: "Fuel-saving System",
          },
          { label: "Hệ thống làm mát", value: "Cooling System" },
        ];

      case VehicleType.BICYCLE:
        return [
          { label: "Đèn LED", value: "LED Lights" },
          { label: "Khóa chống trộm", value: "Anti-theft Lock" },
          { label: "Giỏ xe", value: "Basket" },
          { label: "Baga sau", value: "Rear Rack" },
          { label: "Chuông xe", value: "Bell" },
          { label: "Phanh đĩa", value: "Disc Brake" },
          { label: "Bánh xe dự phòng", value: "Spare Tire" },
          { label: "Bơm xe mini", value: "Mini Pump" },
          { label: "Yên xe êm ái", value: "Comfortable Seat" },
          { label: "Chắn bùn", value: "Mudguard" },
          { label: "Gương chiếu hậu", value: "Mirror" },
        ];

      default:
        return [];
    }
  }, [vehicleType]);

  const fuelTypeOptions = [
    { value: "GASOLINE", label: "Xăng" },
    // { value: "DIESEL", label: "Dầu" },
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
      let type = VehicleType.CAR;

      // Xác định loại xe
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

      const allImages =
        vehicle.vehicleImages?.map(
          (img: { imageUrl: string }) => img.imageUrl
        ) || [];

      // Tách ảnh xe và ảnh giấy tờ
      let vehicleImages, documentImage;
      if (type === VehicleType.BICYCLE) {
        vehicleImages = allImages.slice(0, 4);
        documentImage = "";
      } else {
        vehicleImages = allImages.slice(0, 4);
        documentImage = allImages[4] || "";
      }

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
        images: vehicleImages, // ✅ 4 ảnh xe
        documents: documentImage, // ✅ Ảnh giấy tờ
        vehicleFeatures: featureNames,
        fuelType: vehicle.fuelType,
        rentalRule: vehicle.penalty?.id,
        isMultipleVehicles: false,
        haveDriver: vehicle.haveDriver || "NO",
        insuranceStatus: vehicle.insuranceStatus || "NO",
        shipToAddress: vehicle.shipToAddress || "NO",
      });

      setIsMultipleVehicles(false);
      if (type === VehicleType.CAR && vehicle.extraFeeRule) {
        setExtraRule({ ...vehicle.extraFeeRule });
      }
    }
  }, [vehicleDetail.data, form, brandOptions, modelOptions]);

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
        documents: undefined, // Reset ảnh giấy tờ khi chuyển sang xe đạp
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
          //Xử lý biển số xe theo loại xe VÀ theo insert/update
          let licensePlateData: string | string[] = ""; // Có thể là string hoặc array
          let quantity = 1;

          if (isInsert) {
            // CREATE: Luôn gửi array
            if (vehicleType === VehicleType.CAR) {
              licensePlateData = [values.licensePlate || ""]; // Array với 1 phần tử
              quantity = 1;
            } else if (vehicleType === VehicleType.MOTORBIKE) {
              if (isMultipleVehicles) {
                // Xe máy nhiều chiếc: gửi array
                const validLicensePlates = licensePlates.filter(
                  (lp) => lp && lp.trim() !== ""
                );
                licensePlateData = validLicensePlates; // Array
                quantity = validLicensePlates.length;
              } else {
                // Xe máy 1 chiếc: gửi array với 1 phần tử
                licensePlateData = [values.licensePlate || ""]; // Array với 1 phần tử
                quantity = 1;
              }
            } else if (vehicleType === VehicleType.BICYCLE) {
              // Xe đạp: không có biển số
              licensePlateData = []; // Array rỗng
              quantity = isMultipleVehicles ? values.vehicleQuantity || 1 : 1;
            }
          } else {
            // UPDATE: Luôn gửi string
            if (vehicleType === VehicleType.CAR) {
              licensePlateData = values.licensePlate || ""; // String
              quantity = 1;
            } else if (vehicleType === VehicleType.MOTORBIKE) {
              licensePlateData = values.licensePlate || ""; // String (update không hỗ trợ multiple)
              quantity = 1;
            } else if (vehicleType === VehicleType.BICYCLE) {
              licensePlateData = ""; // String rỗng
              quantity = 1;
            }
          }

          // Xử lý vehicleImages - gộp ảnh xe và ảnh giấy tờ thành 1 array
          const vehicleImages = values.images || []; // 4 ảnh xe
          const documentImage =
            vehicleType !== VehicleType.BICYCLE ? values.documents || "" : ""; // Chỉ có ảnh giấy tờ khi không phải xe đạp

          // Tạo array cuối cùng: 4 ảnh xe + (1 ảnh giấy tờ nếu không phải xe đạp)
          const allImages = [...vehicleImages];
          if (documentImage && vehicleType !== VehicleType.BICYCLE) {
            allImages.push(documentImage); // Thêm ảnh giấy tờ vào vị trí thứ 5
          }

          // Xử lý vehicleImages - chuyển từ array URL thành array object
          const formattedImages = allImages.map((url: string) => ({
            imageUrl: url,
          }));

          const processedDescription = values.description
            ? values.description.replace(/\n/g, "\n") // Đảm bảo \n được giữ nguyên
            : "";

          // Base submit data cho tất cả loại xe
          const baseSubmitData = {
            penaltyId: values.rentalRule,
            licensePlate: licensePlateData, //Có thể là string hoặc array tùy theo insert/update
            vehicleType: vehicleType,
            vehicleFeatures: values.vehicleFeatures?.join(", ") || "",
            vehicleImages: formattedImages,
            haveDriver: "NO", // Xe máy và xe đạp luôn là "NO"
            insuranceStatus: values.insuranceStatus || "NO",
            shipToAddress: values.shipToAddress || "NO",
            yearManufacture: values.yearOfManufacture,
            transmission: values.transmission,
            fuelType: values.fuelType,
            description: processedDescription,
            numberVehicle: quantity,
            costPerDay: values.costPerDay,
            //status: "PENDING",
            thumb: values.thumb,
            userId: user?.id || user?.id,
            isMultipleVehicles: isMultipleVehicles,
          };

          let submitData;

          // Log để kiểm tra extraRule trước khi submit
          console.log("ExtraRule before submit:", extraRule);
          console.log(
            "Battery charge fee:",
            extraRule.batteryChargeFeePerPercent
          );
          console.log("Apply battery charge:", extraRule.applyBatteryChargeFee);

          if (vehicleType === VehicleType.CAR) {
            submitData = {
              ...baseSubmitData,
              brandId: values.brandId,
              modelId: values.modelId,
              numberSeat: Number(values.numberSeat),
              haveDriver: values.haveDriver || "NO",

              // Extra fees cho ô tô
              maxKmPerDay: extraRule.maxKmPerDay || 0,
              feePerExtraKm: extraRule.feePerExtraKm || 0,
              allowedHourLate: extraRule.allowedHourLate || 0,
              feePerExtraHour: extraRule.feePerExtraHour || 0,
              cleaningFee: extraRule.cleaningFee || 0,
              smellRemovalFee: extraRule.smellRemovalFee || 0,

              // Phí sạc pin - đảm bảo lấy từ extraRule
              applyBatteryChargeFee:
                values.fuelType === "ELECTRIC"
                  ? Boolean(extraRule.applyBatteryChargeFee)
                  : false,
              batteryChargeFeePerPercent:
                values.fuelType === "ELECTRIC"
                  ? extraRule.batteryChargeFeePerPercent
                  : 0,

              // Phí tài xế
              driverFeePerDay:
                values.haveDriver === "YES"
                  ? extraRule.driverFeePerDay || 0
                  : 0,
              driverFeePerHour:
                values.haveDriver === "YES"
                  ? extraRule.driverFeePerHour || 0
                  : 0,
              hasDriverOption: values.haveDriver === "YES",
              hasHourlyRental:
                values.haveDriver === "YES"
                  ? Boolean(extraRule.hasHourlyRental)
                  : false,
            };
          } else if (vehicleType === VehicleType.MOTORBIKE) {
            // Xe máy
            submitData = {
              ...baseSubmitData,
              brandId: values.brandId,
              modelId: null,
              numberSeat: 2,
            };
          } else if (vehicleType === VehicleType.BICYCLE) {
            // Xe đạp
            submitData = {
              ...baseSubmitData,
              brandId: null,
              modelId: null,
              numberSeat: 2,
            };
          }

          // ✅ Validation cho biển số trùng lặp (chỉ khi CREATE và xe máy nhiều chiếc)
          if (
            isInsert && // ✅ Chỉ validate khi CREATE
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

          // ✅ Debug log
          console.log("Submit data:", {
            ...submitData,
            licensePlateType: Array.isArray(licensePlateData)
              ? "array"
              : "string",
            licensePlateValue: licensePlateData,
            isInsert,
            vehicleImagesCount: formattedImages.length,
          });

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
            // Update logic
            if (vehicleType === VehicleType.CAR) {
              await apiUpdateCar.mutateAsync({
                vehicleId,
                body: submitData,
                accessToken,
              });
            } else if (vehicleType === VehicleType.MOTORBIKE) {
              await apiUpdateCar.mutateAsync({
                vehicleId,
                body: submitData,
                accessToken,
              });
            } else if (vehicleType === VehicleType.BICYCLE) {
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
          {/* Chỉ hiển thị card giấy tờ cho ô tô và xe máy, không cho xe đạp */}
          {vehicleType !== VehicleType.BICYCLE && (
            <>
              <Divider />
              {/*   card giấy tờ khi tạo nhiều xe máy cùng loại */}
              {!(
                vehicleType === VehicleType.MOTORBIKE &&
                isMultipleVehicles &&
                !vehicleId
              ) ? (
                <Card title="Giấy tờ sở hữu xe" className="mb-4">
                  <Form.Item
                    label="Hình ảnh giấy tờ"
                    name="documents"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng tải lên hình ảnh giấy tờ sở hữu xe",
                      },
                    ]}
                    tooltip="Tải lên hình ảnh giấy tờ sở hữu xe (giấy đăng ký, hoá đơn mua xe,...) để xác minh quyền sở hữu"
                  >
                    <UploadSingleImage />
                  </Form.Item>
                </Card>
              ) : (
                //Hiển thị thông báo khi tạo nhiều xe máy cùng loại
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <span className="text-orange-500"></span>
                      <span>Giấy tờ sở hữu xe</span>
                    </div>
                  }
                  className="mb-4"
                >
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-500 text-xl"></div>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">
                          Thông báo quan trọng
                        </h4>
                        <p className="text-blue-700 mb-3">
                          Khi đăng ký nhiều xe máy cùng loại, bạn cần cập nhật
                          giấy tờ sở hữu cho từng xe riêng lẻ sau khi hoàn tất
                          đăng ký.
                        </p>

                        <div className="space-y-2 text-sm text-blue-600">
                          <p>
                            <strong>Các bước thực hiện:</strong>
                          </p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Hoàn tất đăng ký nhóm xe máy này</li>
                            <li>Vào danh sách xe đã đăng ký</li>
                            <li>
                              Nhấn &quot;Xem&quot; để xem chi tiết nhóm xe
                            </li>
                            <li>
                              Chỉnh sửa từng xe để upload giấy tờ sở hữu riêng
                            </li>
                          </ol>
                        </div>

                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-yellow-800 text-sm">
                            <strong>⚠️ Lưu ý:</strong> Xe sẽ không được duyệt
                            nếu thiếu giấy tờ sở hữu. Vui lòng cập nhật đầy đủ
                            giấy tờ cho tất cả xe trong nhóm.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
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
                          batteryChargeFeePerPercent: v ?? 0,
                        }))
                      }
                    />
                  </Form.Item>
                  <Form.Item
                    label="Áp dụng phí sạc pin?"
                    className="md:col-span-1"
                  >
                    <Select
                      value={extraRule.applyBatteryChargeFee}
                      onChange={(v) =>
                        setExtraRule((prev) => ({
                          ...prev,
                          applyBatteryChargeFee: v,
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
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <span>Thông tin xe</span>
                  {vehicleId && (
                    <Tag
                      color={
                        vehicleDetail.data?.data?.status === "PENDING"
                          ? "orange"
                          : vehicleDetail.data?.data?.status === "AVAILABLE"
                          ? "green"
                          : vehicleDetail.data?.data?.status === "SUSPENDED"
                          ? "volcano"
                          : "red"
                      }
                      className="rounded-full px-3 py-1"
                    >
                      {vehicleDetail.data?.data?.status === "PENDING"
                        ? "Chờ duyệt"
                        : vehicleDetail.data?.data?.status === "AVAILABLE"
                        ? "Đang hoạt động"
                        : vehicleDetail.data?.data?.status === "SUSPENDED"
                        ? "Tạm ẩn"
                        : "Không khả dụng"}
                    </Tag>
                  )}
                </div>
                {/* Thêm nút ẩn/hiện xe */}
                {vehicleId &&
                  (vehicleDetail.data?.data?.status === "AVAILABLE" ||
                    vehicleDetail.data?.data?.status === "SUSPENDED") && (
                    <Button
                      size="small"
                      danger={vehicleDetail.data?.data?.status === "AVAILABLE"}
                      type={
                        vehicleDetail.data?.data?.status === "SUSPENDED"
                          ? "primary"
                          : "default"
                      }
                      loading={toggleLoading}
                      onClick={handleToggleStatus}
                      icon={
                        vehicleDetail.data?.data?.status === "SUSPENDED" ? (
                          <EyeOutlined />
                        ) : (
                          <EyeInvisibleOutlined />
                        )
                      }
                    >
                      {vehicleDetail.data?.data?.status === "SUSPENDED"
                        ? "Đưa vào hoạt động"
                        : "Tạm dừng hoạt động"}
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

              {
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
              }

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
                            { value: "MANUAL", label: "Xe số sàn" },
                            { value: "AUTOMATIC", label: "Xe số tự động" },
                          ]
                        : [
                            { value: "MANUAL", label: "Xe số sàn" },
                            { value: "CLUTCH", label: "Xe côn tay" },
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
