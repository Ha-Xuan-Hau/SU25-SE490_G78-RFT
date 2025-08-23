"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Tabs,
  Button,
  Input,
  Modal,
  Image,
  Tag,
  Card,
  Typography,
  Avatar,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import { getAllVehicles, getVehicleDetailAll } from "@/apis/admin.api";
import AdminLayout from "@/layouts/AdminLayout";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";
import { translateENtoVI } from "@/lib/viDictionary";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

interface VehicleFeature {
  name: string;
}

interface VehicleImage {
  imageUrl: string;
}

interface Penalty {
  id: string;
  userId?: string;
  userName?: string;
  penaltyType: string;
  penaltyValue: number;
  minCancelHour: number;
  description: string;
}

interface ExtraFeeRule {
  maxKmPerDay?: number;
  feePerExtraKm?: number;
  allowedHourLate?: number;
  feePerExtraHour?: number;
  cleaningFee?: number;
  smellRemovalFee?: number;
  batteryChargeFeePerPercent?: number;
  apply_batteryChargeFee?: boolean;
  driverFeePerDay?: number;
  hasDriverOption?: boolean;
  driverFeePerHour?: number;
  hasHourlyRental?: boolean;
}

interface Vehicle {
  id: string;
  licensePlate?: string;
  vehicleType: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userProfilePicture?: string;
  vehicleFeatures: VehicleFeature[];
  vehicleImages: VehicleImage[];
  haveDriver: string;
  insuranceStatus: string;
  shipToAddress: string;
  description: string;
  costPerDay: number;
  status: string;
  thumb: string;
  numberSeat?: number;
  yearManufacture: number;
  transmission: string;
  fuelType: string;
  numberVehicle: number;
  brandName: string;
  modelName?: string;
  totalRatings: number;
  rating?: number;
  address: string;
  openTime: string;
  closeTime: string;
  penalty: Penalty;
  extraFeeRule?: ExtraFeeRule;
  createdAt?: string;
  updatedAt?: string;
}

export default function VehicleManagementPage() {
  const [activeTab, setActiveTab] = useState("CAR");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [vehicleDetailModal, setVehicleDetailModal] = useState<{
    open: boolean;
    vehicle: Vehicle | null;
  }>({
    open: false,
    vehicle: null,
  });

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVehicles();
  }, [activeTab, statusFilter]);

  // Fetch All Vehicles - Cách 1 với path variable
  const loadVehicles = async () => {
    setLoading(true);
    try {
      const { type, ...otherParams } = { type: activeTab };
      const params: Record<string, unknown> = {};

      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await getAllVehicles({
        type: activeTab,
        ...params,
      });
      setVehicles(response.content || response);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      showApiError("Có lỗi xảy ra khi lấy danh sách xe.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vehicle Details
  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const response = await getVehicleDetailAll(vehicleId);
      return response;
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      showApiError("Có lỗi xảy ra khi lấy thông tin xe.");
    }
  };

  const handleViewDetails = async (vehicle: Vehicle) => {
    const vehicleDetails = await fetchVehicleDetails(vehicle.id);
    setVehicleDetailModal({ open: true, vehicle: vehicleDetails });
  };

  const filteredData = vehicles.filter((item) => {
    const matchesSearch =
      item.thumb.toLowerCase().includes(searchText.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.licensePlate &&
        item.licensePlate.toLowerCase().includes(searchText.toLowerCase()));
    return matchesSearch;
  });

  // Handle Checkbox Change
  const handleCheckboxChange = (vehicle: Vehicle) => {
    if (selectedVehicles.find((v) => v.id === vehicle.id)) {
      setSelectedVehicles(selectedVehicles.filter((v) => v.id !== vehicle.id));
    } else {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  useEffect(() => {
    const currentTabVehicles = filteredData.filter(
      (v) => v.vehicleType === activeTab
    );
    const isIndeterminate =
      selectedVehicles.length > 0 &&
      selectedVehicles.length < currentTabVehicles.length;

    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedVehicles, filteredData, activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "AVAILABLE":
        return "green";
      case "UNAVAILABLE":
        return "red";
      case "SUSPENDED":
        return "volcano";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ duyệt";
      case "AVAILABLE":
        return "Đang hoạt động";
      case "UNAVAILABLE":
        return "Không khả dụng";
      case "SUSPENDED":
        return "Tạm ngưng";
      default:
        return status;
    }
  };

  // Count vehicles by status for current tab
  const getVehicleCount = () => {
    const tabVehicles = vehicles.filter((v) => v.vehicleType === activeTab);
    return tabVehicles.length;
  };

  // Columns for the vehicle table
  const vehicleColumns: ColumnsType<Vehicle> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },

    {
      title: "Hình ảnh",
      key: "image",
      width: 100,
      render: (_, record) => (
        <Image
          src={record.vehicleImages?.[0]?.imageUrl || "/placeholder-car.jpg"}
          alt="Vehicle"
          width={60}
          height={45}
          className="rounded-lg object-cover"
          fallback="/placeholder-car.jpg"
        />
      ),
      align: "center",
    },
    {
      title: "Tên xe",
      key: "vehicleName",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.thumb}</div>
          <div className="text-sm text-gray-500">
            {record.brandName} {record.modelName && `• ${record.modelName}`}
          </div>
        </div>
      ),
    },
    ...(activeTab !== "BICYCLE"
      ? [
          {
            title: "Biển số",
            dataIndex: "licensePlate",
            key: "licensePlate",
            render: (licensePlate: string) => (
              <Tag color="blue" className="font-mono">
                {licensePlate}
              </Tag>
            ),
          },
        ]
      : []),

    {
      title: "Chủ xe",
      key: "owner",
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.userName}</div>
          <div className="text-sm text-gray-500">{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: "Giá thuê/ngày",
      key: "price",
      render: (_, record) => (
        <div className="font-semibold text-green-600">
          {record.costPerDay.toLocaleString("vi-VN")} VNĐ
        </div>
      ),
    },
    // {
    //   title: "Đánh giá",
    //   key: "rating",
    //   render: (_, record) => (
    //     <div className="text-center">
    //       <div className="font-medium">
    //         {record.rating ? `${record.rating.toFixed(1)} ⭐` : "Chưa có"}
    //       </div>
    //       <div className="text-xs text-gray-500">
    //         ({record.totalRatings} đánh giá)
    //       </div>
    //     </div>
    //   ),
    // },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag
          color={getStatusColor(record.status)}
          className="rounded-full px-3 py-1"
        >
          {getStatusText(record.status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record)}
        >
          Xem chi tiết
        </Button>
      ),
      align: "center",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} className="!mb-2">
          Quản lý phương tiện
        </Title>
        <p className="text-gray-600">
          Xem và giám sát tất cả phương tiện trong hệ thống
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex gap-3 items-center">
            <Search
              placeholder="Tìm kiếm theo tên xe, biển số, chủ xe..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-40"
              size="large"
            >
              <Option value="ALL">Tất cả</Option>
              <Option value="PENDING">Chờ duyệt</Option>
              <Option value="AVAILABLE">Đang hoạt động</Option>
              <Option value="UNAVAILABLE">Không khả dụng</Option>
              <Option value="SUSPENDED">Tạm ngưng</Option>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "CAR",
              label: (
                <span>
                  Xe ô tô
                  {/* (
                  {vehicles.filter((v) => v.vehicleType === "CAR").length}) */}
                </span>
              ),
            },
            {
              key: "MOTORBIKE",
              label: (
                <span>
                  Xe máy
                  {/* (
                  {vehicles.filter((v) => v.vehicleType === "MOTORBIKE").length}
                  ) */}
                </span>
              ),
            },
            {
              key: "BICYCLE",
              label: (
                <span>
                  Xe đạp
                  {/* (
                  {vehicles.filter((v) => v.vehicleType === "BICYCLE").length}) */}
                </span>
              ),
            },
          ]}
          className="px-6 pt-4"
        />

        <div className="px-6 pb-6">
          <Table
            columns={vehicleColumns}
            dataSource={filteredData.filter((v) => v.vehicleType === activeTab)}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} xe`,
            }}
            scroll={{ x: 1200 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        open={vehicleDetailModal.open}
        vehicle={vehicleDetailModal.vehicle}
        onClose={() => setVehicleDetailModal({ open: false, vehicle: null })}
      />
    </div>
  );
}

// VehicleDetailModal Component (giữ nguyên từ code cũ)
const VehicleDetailModal: React.FC<{
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}> = ({ open, vehicle, onClose }) => {
  if (!vehicle) return null;

  let features: VehicleFeature[] = [];
  if (
    typeof vehicle.vehicleFeatures === "string" &&
    vehicle.vehicleFeatures !== undefined &&
    vehicle.vehicleFeatures !== null
  ) {
    features = (vehicle.vehicleFeatures as string)
      .split(",")
      .map((name) => ({ name: name.trim() }))
      .filter((f) => f.name);
  } else if (Array.isArray(vehicle.vehicleFeatures)) {
    features = vehicle.vehicleFeatures;
  }

  return (
    <Modal
      title={
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4 border-b border-gray-100">
          <Avatar
            src={vehicle?.userProfilePicture}
            icon={<UserOutlined />}
            size={40}
          />
          <div className="flex-1">
            <div className="font-semibold text-base sm:text-lg">
              Chi tiết phương tiện
            </div>
            <div className="text-sm text-gray-500 break-words">
              {vehicle.thumb}
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width="95vw"
      style={{
        maxWidth: "1200px",
        top: 20,
        maxHeight: "calc(100vh - 40px)",
        overflow: "visible",
      }}
      // ✅ QUAN TRỌNG: Loại bỏ bodyStyle có scroll riêng
      bodyStyle={{
        overflow: "visible",
        maxHeight: "none",
        padding: "24px",
      }}
      // ✅ Thêm modalRender để control scroll
      modalRender={(modal) => (
        <div style={{ overflow: "visible" }}>{modal}</div>
      )}
      className="top-4 sm:top-8"
    >
      {/* ✅ Loại bỏ div wrapper có scroll, chỉ giữ nội dung */}
      <div className="space-y-4 sm:space-y-6">
        {/* Tất cả nội dung modal giữ nguyên */}
        {/* Vehicle Images */}
        <Card title="Hình ảnh xe" size="small">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {vehicle.vehicleImages?.map((img, index) => (
              <div key={index} className="relative">
                <Image
                  src={img.imageUrl}
                  alt={`Vehicle ${index + 1}`}
                  className="rounded-lg object-cover w-full h-24 sm:h-32"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Basic Info */}
          <Card title="Thông tin cơ bản" size="small" className="lg:col-span-1">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                  {vehicle.thumb}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.vehicleType === "CAR"
                    ? "Ô tô"
                    : vehicle.vehicleType === "MOTORBIKE"
                    ? "Xe máy"
                    : "Xe đạp"}
                </div>
              </div>

              {/* Chỉ hiển thị biển số cho xe ô tô và xe máy */}
              {vehicle.vehicleType !== "BICYCLE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biển số
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.licensePlate || "Không có"}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hãng xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.brandName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.modelName || "Không có"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Năm sản xuất
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.yearManufacture}
                </div>
              </div>

              {vehicle.numberSeat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số ghế
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.numberSeat}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Truyền động
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.transmission}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhiên liệu
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.fuelType}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thuê/ngày
                </label>
                <div className="p-2 bg-gray-50 rounded font-semibold text-green-600 text-sm">
                  {vehicle.costPerDay.toLocaleString("vi-VN")} VNĐ
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={
                      vehicle.status === "AVAILABLE"
                        ? "green"
                        : vehicle.status === "PENDING"
                        ? "orange"
                        : vehicle.status === "SUSPENDED"
                        ? "volcano"
                        : "red"
                    }
                    className="text-xs"
                  >
                    {vehicle.status === "AVAILABLE"
                      ? "Đang hoạt động"
                      : vehicle.status === "PENDING"
                      ? "Chờ duyệt"
                      : vehicle.status === "SUSPENDED"
                      ? "Tạm ngưng"
                      : "Không khả dụng"}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>

          {/* Middle Column - Owner Info */}
          <Card title="Thông tin chủ xe" size="small" className="lg:col-span-1">
            <div className="text-center mb-4">
              <Avatar
                size={60}
                src={vehicle.userProfilePicture}
                icon={<UserOutlined />}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chủ xe
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                  {vehicle.userName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-all">
                  {vehicle.userEmail}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                  {vehicle.address}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ hoạt động
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.openTime} - {vehicle.closeTime}
                </div>
              </div>
            </div>
          </Card>

          {/* Right Column - Services & Features */}
          <Card
            title="Dịch vụ & Tiện ích"
            size="small"
            className="lg:col-span-1"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Có lái xe
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.haveDriver === "YES" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.haveDriver === "YES" ? "Có" : "Không"}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bảo hiểm
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.insuranceStatus === "YES" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.insuranceStatus === "YES" ? "Có" : "Không"}
                  </Tag>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giao xe tận nơi
                </label>
                <div className="p-2 bg-gray-50 rounded">
                  <Tag
                    color={vehicle.shipToAddress === "YES" ? "green" : "red"}
                    className="text-xs"
                  >
                    {vehicle.shipToAddress === "YES" ? "Có" : "Không"}
                  </Tag>
                </div>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đánh giá
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.rating ? (
                    <span>
                      {vehicle.rating.toFixed(1)} ⭐ ({vehicle.totalRatings}{" "}
                      đánh giá)
                    </span>
                  ) : (
                    "Chưa có đánh giá"
                  )}
                </div>
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiện ích xe
                </label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {features.map((feature, index) => (
                    <Tag key={index} color="blue" className="text-xs mb-1">
                      {translateENtoVI(feature.name)}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Extra Fees for Cars */}
        {vehicle.vehicleType === "CAR" && vehicle.extraFeeRule && (
          <Card title="Phụ phí có thể phát sinh" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Km tối đa/ngày
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.maxKmPerDay || "Không giới hạn"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vượt km
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.feePerExtraKm?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ/km
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ trễ cho phép
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.allowedHourLate || 0} giờ
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vượt giờ
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.feePerExtraHour?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ/giờ
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí vệ sinh
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.cleaningFee?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phí khử mùi
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {vehicle.extraFeeRule.smellRemovalFee?.toLocaleString(
                      "vi-VN"
                    ) || 0}{" "}
                    VNĐ
                  </div>
                </div>
              </div>
            </div>

            {vehicle.extraFeeRule.hasDriverOption && (
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3 text-sm sm:text-base">
                  Dịch vụ tài xế
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Phí tài xế/ngày
                    </label>
                    <div className="p-2 bg-white rounded text-gray-900 text-sm">
                      {vehicle.extraFeeRule.driverFeePerDay?.toLocaleString(
                        "vi-VN"
                      ) || 0}{" "}
                      VNĐ
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Phí tài xế/giờ
                    </label>
                    <div className="p-2 bg-white rounded text-gray-900 text-sm">
                      {vehicle.extraFeeRule.driverFeePerHour?.toLocaleString(
                        "vi-VN"
                      ) || 0}{" "}
                      VNĐ
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Cho thuê theo giờ
                    </label>
                    <div className="p-2 bg-white rounded">
                      <Tag
                        color={
                          vehicle.extraFeeRule.hasHourlyRental ? "green" : "red"
                        }
                        className="text-xs"
                      >
                        {vehicle.extraFeeRule.hasHourlyRental ? "Có" : "Không"}
                      </Tag>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Penalty Rules */}
        <Card title="Quy định thuê xe" size="small">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại phạt
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                {vehicle.penalty?.penaltyType === "PERCENT"
                  ? "Phần trăm"
                  : "Cố định"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị phạt
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                {vehicle.penalty?.penaltyType === "PERCENT"
                  ? `${vehicle.penalty.penaltyValue}%`
                  : `${vehicle.penalty?.penaltyValue?.toLocaleString(
                      "vi-VN"
                    )} VNĐ`}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian hủy tối thiểu
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                {vehicle.penalty?.minCancelHour} giờ
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm break-words">
                {vehicle.penalty?.description}
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card title="Mô tả xe" size="small">
          <div
            className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm leading-relaxed break-words"
            style={{ whiteSpace: "pre-line" }}
          >
            {vehicle.description}
          </div>
        </Card>

        {/* Timestamps */}
        {(vehicle.createdAt || vehicle.updatedAt) && (
          <Card title="Thông tin hệ thống" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicle.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày tạo
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {new Date(vehicle.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              )}
              {vehicle.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cập nhật lần cuối
                  </label>
                  <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                    {new Date(vehicle.updatedAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

VehicleManagementPage.Layout = AdminLayout;
