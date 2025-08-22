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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, EyeOutlined, UserOutlined } from "@ant-design/icons";
import {
  getPendingVehicles,
  getPendingStats,
  getVehicleDetail,
  updateVehicleStatus,
  updateMultipleVehicleStatuses,
} from "@/apis/admin.api"; // Ensure this path is correct
import AdminLayout from "@/layouts/AdminLayout";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";
import { translateENtoVI } from "@/lib/viDictionary";

const { Title } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

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
}

export default function VehiclePendingPage() {
  const [activeTab, setActiveTab] = useState("CAR");
  const [searchText, setSearchText] = useState("");
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
  const [pendingStats, setPendingStats] = useState({
    car: 0,
    motorbike: 0,
    bicycle: 0,
  });
  const [confirmAction, setConfirmAction] = useState<
    "APPROVE_ONE" | "APPROVE_BATCH" | "REJECT_ONE" | "REJECT_BATCH" | null
  >(null); // Cập nhật loại xác nhận
  const [rejectReason, setRejectReason] = useState("");

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPendingStats();
    loadPendingVehicles();
  }, [activeTab]); // Load vehicles when the active tab changes

  // Fetch Pending Vehicles
  const loadPendingVehicles = async () => {
    setLoading(true);
    try {
      const response = await getPendingVehicles({ type: activeTab });
      setVehicles(response.content); // Adjust based on the API response structure
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      showApiError("Có lỗi xảy ra khi lấy danh sách xe chờ duyệt."); // Show error message
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pending Stats
  const loadPendingStats = async () => {
    try {
      const response = await getPendingStats();
      setPendingStats(response);
    } catch (error) {
      console.error("Error fetching pending stats:", error);
      showApiError("Có lỗi xảy ra khi lấy thống kê xe chờ duyệt."); // Show error message
    }
  };

  // Fetch Vehicle Details
  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const response = await getVehicleDetail(vehicleId);
      return response;
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      showApiError("Có lỗi xảy ra khi lấy thông tin xe."); // Show error message
    }
  };

  const handleViewDetails = async (vehicle: Vehicle) => {
    const vehicleDetails = await fetchVehicleDetails(vehicle.id);
    setVehicleDetailModal({ open: true, vehicle: vehicleDetails });
  };

  // Update Vehicle Status
  const updateVehicleStatusAPI = async (
    vehicleId: string,
    status: string,
    rejectReason?: string
  ) => {
    try {
      await updateVehicleStatus(vehicleId, status, rejectReason);
      showApiSuccess("Cập nhật trạng thái xe thành công.");
      // Xóa các dòng reload ở đây vì sẽ được gọi từ hàm cha
      // loadPendingStats();
      // loadPendingVehicles();
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      showApiError("Có lỗi xảy ra khi cập nhật trạng thái xe.");
      throw error; // Throw error để hàm cha biết có lỗi xảy ra
    }
  };
  // const handleApprove = async (vehicleId: string) => {
  //   await updateVehicleStatusAPI(vehicleId, "AVAILABLE"); // Duyệt xe
  // };

  // const handleReject = async (vehicleId: string) => {
  //   await updateVehicleStatusAPI(vehicleId, "UNAVAILABLE", rejectReason); // Từ chối xe
  //   setRejectReason(""); // Clear reason after rejection
  // };

  const handleApprove = async (vehicleId: string) => {
    setLoading(true);
    try {
      await updateVehicleStatusAPI(vehicleId, "AVAILABLE");
      // Đảm bảo reload dữ liệu sau khi cập nhật thành công
      await Promise.all([loadPendingStats(), loadPendingVehicles()]);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (vehicleId: string) => {
    setLoading(true);
    try {
      await updateVehicleStatusAPI(vehicleId, "UNAVAILABLE", rejectReason);
      setRejectReason("");
      // Đảm bảo reload dữ liệu sau khi cập nhật thành công
      await Promise.all([loadPendingStats(), loadPendingVehicles()]);
    } finally {
      setLoading(false);
    }
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
    if (selectedVehicles.includes(vehicle)) {
      setSelectedVehicles(selectedVehicles.filter((v) => v.id !== vehicle.id));
    } else {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  const handleBatchApprove = async () => {
    try {
      await updateMultipleVehicleStatuses(
        selectedVehicles.map((vehicle) => ({
          vehicleId: vehicle.id,
          status: "AVAILABLE",
        }))
      );
      loadPendingStats(); // Reload stats after updating
      showApiSuccess("Duyệt thành công các xe đã chọn."); // Show success message
      loadPendingVehicles(); // Reload vehicles after updating
    } catch (error) {
      showApiError("Có lỗi xảy ra khi duyệt xe."); // Show error message
      console.error("Error updating multiple vehicle statuses:", error);
    } finally {
      setSelectedVehicles([]); // Clear selections after approval
    }
  };

  const handleBatchReject = async () => {
    if (rejectReason) {
      try {
        await updateMultipleVehicleStatuses(
          selectedVehicles.map((vehicle) => ({
            vehicleId: vehicle.id,
            status: "UNAVAILABLE",
            rejectReason,
          }))
        );
        loadPendingStats(); // Reload stats after updating
        showApiSuccess("Từ chối thành công các xe đã chọn."); // Show success message
        loadPendingVehicles(); // Reload vehicles after updating
      } catch (error) {
        showApiError("Có lỗi xảy ra khi từ chối xe."); // Show error message
        console.error("Error updating multiple vehicle statuses:", error);
      } finally {
        setRejectReason(""); // Clear reason after rejection
        setSelectedVehicles([]); // Clear selections after rejection
      }
    } else {
      showApiError("Vui lòng nhập lý do từ chối."); // Show error if no reason is provided
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
  }, [selectedVehicles, filteredData, activeTab]); // Columns for the vehicle table

  const carColumns: ColumnsType<Vehicle> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
      align: "center",
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <input
            ref={selectAllCheckboxRef}
            type="checkbox"
            checked={
              filteredData.filter((v) => v.vehicleType === activeTab).length >
                0 &&
              selectedVehicles.length ===
                filteredData.filter((v) => v.vehicleType === activeTab).length
            }
            onChange={(e) => {
              const currentTabVehicles = filteredData.filter(
                (v) => v.vehicleType === activeTab
              );
              if (e.target.checked) {
                // Chọn tất cả xe trong tab hiện tại
                const newSelected = [...selectedVehicles];
                currentTabVehicles.forEach((vehicle) => {
                  if (!newSelected.find((v) => v.id === vehicle.id)) {
                    newSelected.push(vehicle);
                  }
                });
                setSelectedVehicles(newSelected);
              } else {
                // Bỏ chọn tất cả xe trong tab hiện tại
                setSelectedVehicles(
                  selectedVehicles.filter(
                    (selected) =>
                      !currentTabVehicles.find(
                        (current) => current.id === selected.id
                      )
                  )
                );
              }
            }}
          />
          <span className="text-xs">Chọn</span>
        </div>
      ),
      key: "select",
      width: 80,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedVehicles.some((v) => v.id === record.id)}
          onChange={() => handleCheckboxChange(record)}
        />
      ),
      align: "center",
    },
    // {
    //   title: "Chọn",
    //   key: "select",
    //   render: (_, record) => (
    //     <input
    //       type="checkbox"
    //       checked={selectedVehicles.includes(record)}
    //       onChange={() => handleCheckboxChange(record)}
    //     />
    //   ),
    //   align: "center",
    // },
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
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Tag
          color={record.status === "PENDING" ? "orange" : "red"}
          className="rounded-full px-3 py-1"
        >
          {record.status === "PENDING" ? "Chưa duyệt" : "Lỗi"}
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
          <div className="flex-1 max-w-md">
            <Search
              placeholder="Tìm kiếm theo tên xe, biển số, chủ xe..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Button
              type="primary"
              onClick={() => setConfirmAction("APPROVE_BATCH")}
              disabled={selectedVehicles.length === 0}
            >
              Duyệt hàng loạt
            </Button>
            <Button
              danger
              onClick={() => setConfirmAction("REJECT_BATCH")}
              disabled={selectedVehicles.length === 0}
            >
              Từ chối hàng loạt
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "CAR", label: `Xe ô tô (${pendingStats.car})` },
            { key: "MOTORBIKE", label: `Xe máy (${pendingStats.motorbike})` },
            { key: "BICYCLE", label: `Xe đạp (${pendingStats.bicycle})` },
          ]}
          className="px-6 pt-4"
        />

        <div className="px-6 pb-6">
          <Table
            columns={carColumns}
            dataSource={filteredData.filter((v) => v.vehicleType === activeTab)}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            scroll={{ x: 800 }}
            className="border-0"
          />
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        open={vehicleDetailModal.open}
        vehicle={vehicleDetailModal.vehicle}
        onClose={() => setVehicleDetailModal({ open: false, vehicle: null })}
        onApprove={() => setConfirmAction("APPROVE_ONE")} // Mở modal xác nhận duyệt cho một xe
        onReject={() => setConfirmAction("REJECT_ONE")} // Mở modal xác nhận từ chối cho một xe
      />

      {/* Confirmation Modals */}
      {/* <Modal
        title="Xác nhận duyệt xe"
        open={
          confirmAction === "APPROVE_ONE" || confirmAction === "APPROVE_BATCH"
        }
        onCancel={() => setConfirmAction(null)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmAction(null)}>
            Hủy
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => {
              if (
                confirmAction === "APPROVE_ONE" &&
                vehicleDetailModal.vehicle
              ) {
                handleApprove(vehicleDetailModal.vehicle.id);
                setConfirmAction(null);
                setVehicleDetailModal({ open: false, vehicle: null }); // Đóng modal chi tiết
              } else {
                handleBatchApprove();
                setConfirmAction(null); // Đóng modal xác nhận
              }
            }}
          >
            Duyệt
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn duyệt{" "}
          {confirmAction === "APPROVE_ONE" ? "xe này" : "các xe đã chọn"} không?
        </p>
      </Modal>

      <Modal
        title="Từ chối xe"
        open={
          confirmAction === "REJECT_ONE" || confirmAction === "REJECT_BATCH"
        }
        onCancel={() => setConfirmAction(null)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmAction(null)}>
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={() => {
              if (
                confirmAction === "REJECT_ONE" &&
                vehicleDetailModal.vehicle
              ) {
                handleReject(vehicleDetailModal.vehicle.id);
                setConfirmAction(null);
                setVehicleDetailModal({ open: false, vehicle: null }); // Đóng modal chi tiết
              } else {
                handleBatchReject();
                setConfirmAction(null); // Đóng modal xác nhận
              }
            }}
            disabled={!rejectReason}
          >
            Từ chối
          </Button>,
        ]}
      >
        <p>Nhập lý do từ chối:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do..."
        />
      </Modal> */}

      <Modal
        title="Xác nhận duyệt xe"
        open={
          confirmAction === "APPROVE_ONE" || confirmAction === "APPROVE_BATCH"
        }
        onCancel={() => setConfirmAction(null)}
        zIndex={2000} // Thêm dòng này để modal xác nhận hiển thị trên modal chi tiết
        footer={[
          <Button key="cancel" onClick={() => setConfirmAction(null)}>
            Đóng
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={loading}
            onClick={async () => {
              if (
                confirmAction === "APPROVE_ONE" &&
                vehicleDetailModal.vehicle
              ) {
                await handleApprove(vehicleDetailModal.vehicle.id);
                setConfirmAction(null);
                setVehicleDetailModal({ open: false, vehicle: null });
              } else {
                await handleBatchApprove();
                setConfirmAction(null);
              }
            }}
          >
            Duyệt
          </Button>,
        ]}
      >
        <p>
          Bạn có chắc chắn muốn duyệt{" "}
          {confirmAction === "APPROVE_ONE" ? "xe này" : "các xe đã chọn"} không?
        </p>
      </Modal>

      <Modal
        title="Từ chối xe"
        open={
          confirmAction === "REJECT_ONE" || confirmAction === "REJECT_BATCH"
        }
        onCancel={() => setConfirmAction(null)}
        zIndex={2000} // Thêm dòng này
        footer={[
          <Button key="cancel" onClick={() => setConfirmAction(null)}>
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={loading}
            onClick={async () => {
              if (
                confirmAction === "REJECT_ONE" &&
                vehicleDetailModal.vehicle
              ) {
                await handleReject(vehicleDetailModal.vehicle.id);
                setConfirmAction(null);
                setVehicleDetailModal({ open: false, vehicle: null });
              } else {
                await handleBatchReject();
                setConfirmAction(null);
              }
            }}
            disabled={!rejectReason}
          >
            Từ chối
          </Button>,
        ]}
      >
        <p>Nhập lý do từ chối:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do..."
        />
      </Modal>
    </div>
  );
}

// VehicleDetailModal Component
const VehicleDetailModal: React.FC<{
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}> = ({ open, vehicle, onClose, onApprove, onReject }) => {
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
        <Button key="approve" type="primary" onClick={onApprove}>
          Duyệt
        </Button>,
        <Button key="reject" danger onClick={onReject}>
          Từ chối
        </Button>,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width="95vw"
      // ✅ CÁCH 2: Sửa style và bodyStyle để loại bỏ scroll riêng
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
      {/* ✅ LOẠI BỎ div wrapper có scroll, chỉ giữ nội dung */}
      <div className="space-y-4 sm:space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biển số
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {vehicle.licensePlate || "Không có"}
                </div>
              </div>

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
                  {translateENtoVI(vehicle.transmission)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhiên liệu
                </label>
                <div className="p-2 bg-gray-50 rounded text-gray-900 text-sm">
                  {translateENtoVI(vehicle.fuelType)}
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
                    color={vehicle.status === "AVAILABLE" ? "green" : "orange"}
                    className="text-xs"
                  >
                    {vehicle.status === "AVAILABLE"
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
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

              {/* Thêm phí sạc pin cho xe điện */}
              {vehicle.fuelType === "ELECTRIC" &&
                vehicle.extraFeeRule.apply_batteryChargeFee && (
                  <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="text-yellow-700">
                          ⚡ Phí sạc pin (Xe điện)
                        </span>
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="text-sm text-gray-600">
                            Phí sạc:
                          </span>
                          <span className="ml-2 font-semibold text-yellow-700">
                            {vehicle.extraFeeRule.batteryChargeFeePerPercent?.toLocaleString(
                              "vi-VN"
                            ) || 0}{" "}
                            VNĐ/% pin
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Khách thuê thanh toán phí sạc pin theo % pin đã sử
                          dụng trong quá trình thuê xe
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
      </div>
    </Modal>
  );
};

VehiclePendingPage.Layout = AdminLayout;
