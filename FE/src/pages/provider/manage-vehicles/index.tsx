"use client";

import { translateENtoVI } from "@/lib/viDictionary";

import {
  getUserCars,
  getUserBicycles,
  getUserMotorbike,
} from "@/apis/user-vehicles.api";
import { ProviderLayout } from "@/layouts/ProviderLayout";
import { useUserState } from "@/recoils/user.state";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Image,
  Modal,
  Skeleton,
  Spin,
  Table,
  Typography,
  Empty,
  Tag,
  Tabs,
} from "antd";
import type { ColumnsType } from "antd/es/table";

// --- Types for vehicle management ---
import type { VehicleGroup } from "@/types/registerVehicleForm";
import { useEffect, useState } from "react";
import type { Vehicle as VehicleType } from "@/types/vehicle";
import useLocalStorage from "@/hooks/useLocalStorage";
import type { Vehicle } from "@/types/vehicle";

import RegisterVehicleForm from "../../../components/RegisterVehicleForm";
import EditSingleVehicleInGroupModal from "../../../components/EditSingleVehicleInGroupModal";
import GroupEditVehicleModal from "../../../components/GroupEditVehicleModal";
import { updateSingleMotorbikeInGroup, updateCar } from "@/apis/vehicle.api";

export default function UserRegisterVehicle() {
  const { Title, Text } = Typography;
  const { TabPane } = Tabs;

  const [groupEditModal, setGroupEditModal] = useState<{
    open: boolean;
    vehicle: Vehicle | null;
    group: VehicleGroup | null;
  }>({ open: false, vehicle: null, group: null });
  const [groupEditLoading, setGroupEditLoading] = useState(false);
  const [editSingleModal, setEditSingleModal] = useState<{
    open: boolean;
    vehicle: VehicleType | null;
  }>({ open: false, vehicle: null });
  const [editSingleLoading, setEditSingleLoading] = useState(false);
  const [registerVehicleModal, setRegisterVehicleModal] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<Vehicle["id"] | null>(
    null
  );
  const [groupDetail, setGroupDetail] = useState<VehicleGroup | null>(null);
  const [user] = useUserState();
  const registeredVehicles = user?.registeredVehicles || [];
  // Set default activeType to the first registered vehicle type if any, else 'CAR'
  const [activeType, setActiveType] = useState<string>(
    registeredVehicles.length > 0 ? registeredVehicles[0] : "CAR"
  );
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [groupList, setGroupList] = useState<VehicleGroup[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken] = useLocalStorage("access_token");

  // Fetch group vehicles by type
  const fetchGroupVehicles = async (type: string) => {
    setIsLoading(true);
    try {
      let apiFn;
      if (type === "CAR") apiFn = getUserCars;
      else if (type === "MOTORBIKE") apiFn = getUserMotorbike;
      else if (type === "BICYCLE") apiFn = getUserBicycles;
      else apiFn = getUserCars;
      const res = await apiFn(page, size);
      setGroupList(res?.data?.content || []);
      setTotalElements(res?.data?.totalElements || 0);
    } catch {
      setGroupList([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (registeredVehicles.length > 0) {
      // If activeType is not in registeredVehicles, reset to first
      if (!registeredVehicles.includes(activeType)) {
        setActiveType(registeredVehicles[0]);
        // fetchGroupVehicles will be called again due to activeType change
        return;
      }
      fetchGroupVehicles(activeType);
    }
    // eslint-disable-next-line
  }, [activeType, page, size, registeredVehicles]);

  const handleTabChange = (key: string) => {
    setActiveType(key);
    setPage(0);
  };

  const handleAddVehicle = () => {
    setEditVehicleId(null);
    setRegisterVehicleModal(true);
  };

  const handleEditVehicle = (vehicleId: string) => {
    setEditVehicleId(vehicleId);
    setRegisterVehicleModal(true);
  };

  return (
    <div>
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

      <Tabs activeKey={activeType} onChange={handleTabChange} className="mb-4">
        {registeredVehicles.includes("CAR") && <TabPane tab="Ô tô" key="CAR" />}
        {registeredVehicles.includes("MOTORBIKE") && (
          <TabPane tab="Xe máy" key="MOTORBIKE" />
        )}
        {registeredVehicles.includes("BICYCLE") && (
          <TabPane tab="Xe đạp" key="BICYCLE" />
        )}
      </Tabs>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>
          <div className="flex items-center justify-center mb-4">
            <Spin size="small" className="mr-2" />
          </div>
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : groupList.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table
            columns={
              [
                {
                  title: "Hình ảnh",
                  dataIndex: "vehicleImages",
                  key: "vehicleImages",
                  width: 120,
                  render: (_: unknown, record: VehicleGroup) => {
                    const v = record.vehicle[0];
                    return (
                      <Image
                        className="w-20 h-14 rounded-lg object-cover"
                        src={
                          v.vehicleImages?.[0]?.imageUrl ||
                          "/placeholder.svg?height=56&width=80"
                        }
                        alt="Vehicle thumbnail"
                        fallback="/placeholder.svg?height=56&width=80"
                      />
                    );
                  },
                },
                {
                  title: "Thông tin xe",
                  key: "vehicleInfo",
                  render: (_: unknown, record: VehicleGroup) => {
                    const v = record.vehicle[0];
                    return (
                      <div>
                        <div className="font-medium text-gray-900">
                          {v.thumb}
                        </div>
                        <div className="text-sm text-gray-500">
                          {v.brandName} {v.modelName}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: "Thông số",
                  key: "specs",
                  render: (_: unknown, record: VehicleGroup) => {
                    const v = record.vehicle[0];
                    return (
                      <div className="text-sm">
                        {v.numberSeat && (
                          <div>
                            Nhiên liệu:{" "}
                            <span className="font-medium">
                              {translateENtoVI(v.fuelType)}
                            </span>
                          </div>
                        )}
                        {v.transmission && (
                          <div>
                            Truyền động:{" "}
                            <span className="font-medium">
                              {translateENtoVI(v.transmission)}
                            </span>
                          </div>
                        )}
                        {v.licensePlate && record.vehicleNumber === 1 && (
                          <div>
                            Biển số:{" "}
                            <span className="font-medium">
                              {v.licensePlate}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  title: "Số lượng",
                  dataIndex: "vehicleNumber",
                  key: "vehicleNumber",
                  width: 90,
                  render: (num: number) => <span>{num}</span>,
                },
                {
                  title: "Giá thuê/ngày",
                  dataIndex: "costPerDay",
                  key: "costPerDay",
                  render: (_: unknown, record: VehicleGroup) => {
                    const v = record.vehicle[0];
                    return (
                      <div className="font-semibold text-green-600">
                        {v.costPerDay?.toLocaleString("vi-VN")} VNĐ
                      </div>
                    );
                  },
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  key: "status",
                  render: (_: unknown, record: VehicleGroup) => {
                    const v = record.vehicle[0];
                    return (
                      <Tag
                        color={v.status === "AVAILABLE" ? "green" : "orange"}
                        className="rounded-full px-3 py-1"
                      >
                        {v.status === "AVAILABLE"
                          ? "Đang hoạt động"
                          : "Không hoạt động"}
                      </Tag>
                    );
                  },
                },
                {
                  title: "Thao tác",
                  key: "action",
                  render: (_: unknown, record: VehicleGroup) => {
                    if (record.vehicleNumber === 1) {
                      const v = record.vehicle[0];
                      return (
                        <Button
                          type="primary"
                          size="small"
                          className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                          onClick={() => handleEditVehicle(v.id)}
                        >
                          <EditOutlined /> Chỉnh sửa
                        </Button>
                      );
                    }
                    return (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <Button
                          type="default"
                          size="small"
                          className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                          style={{ width: 100 }}
                          onClick={() => setGroupDetail(record)}
                        >
                          Xem
                        </Button>
                        {/* Nút chỉnh sửa toàn bộ nhóm xe máy */}
                        <Button
                          type="primary"
                          size="small"
                          className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                          style={{ width: 100 }}
                          onClick={() => {
                            // Lấy 1 xe đầu tiên trong nhóm để hiển thị dữ liệu
                            setGroupEditModal({
                              open: true,
                              vehicle: record.vehicle[0],
                              group: record,
                            });
                          }}
                        >
                          <EditOutlined />
                          Chỉnh sửa
                        </Button>
                        {/* Modal chỉnh sửa nhóm xe */}
                        <GroupEditVehicleModal
                          open={groupEditModal.open}
                          vehicle={groupEditModal.vehicle}
                          loading={groupEditLoading}
                          onCancel={() =>
                            setGroupEditModal({
                              open: false,
                              vehicle: null,
                              group: null,
                            })
                          }
                          onOk={async (values) => {
                            if (!groupEditModal.group) return;
                            setGroupEditLoading(true);
                            try {
                              // Gọi update cho từng xe trong nhóm
                              await Promise.all(
                                groupEditModal.group.vehicle.map((v) =>
                                  updateCar({
                                    vehicleId: v.id,
                                    body: { ...v, ...values },
                                    accessToken,
                                  })
                                )
                              );
                              setGroupEditModal({
                                open: false,
                                vehicle: null,
                                group: null,
                              });
                              fetchGroupVehicles(activeType);
                            } finally {
                              setGroupEditLoading(false);
                            }
                          }}
                        />
                      </div>
                    );
                  },
                },
              ] as ColumnsType<VehicleGroup>
            }
            dataSource={groupList}
            rowKey={(record) => record.thumb + "-" + record.vehicleNumber}
            scroll={{ x: 1200 }}
            loading={isLoading}
            pagination={{
              current: page + 1,
              pageSize: size,
              total: totalElements,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ["5", "10", "20"],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} nhóm xe`,
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

      {/* Modal hiển thị chi tiết các xe cùng thumb */}

      <Modal
        open={!!groupDetail}
        title={groupDetail?.thumb}
        onCancel={() => setGroupDetail(null)}
        footer={null}
        width={1000}
      >
        {groupDetail && (
          <Table
            columns={
              [
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
                  render: (_: unknown, record: Vehicle) => (
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.thumb}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.brandName} {record.modelName}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Thông số",
                  key: "specs",
                  render: (_: unknown, record: Vehicle) => (
                    <div className="text-sm">
                      {record.licensePlate && (
                        <div>
                          Biển số:{" "}
                          <span className="font-medium">
                            {record.licensePlate}
                          </span>
                        </div>
                      )}
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
                      {status === "AVAILABLE"
                        ? "Đang hoạt động"
                        : "Không hoạt động"}
                    </Tag>
                  ),
                },
                {
                  title: "Thao tác",
                  key: "action",
                  render: (_: unknown, record: Vehicle) => (
                    <Button
                      type="primary"
                      size="small"
                      className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
                      onClick={() =>
                        setEditSingleModal({ open: true, vehicle: record })
                      }
                    >
                      <EditOutlined />
                      Chỉnh sửa
                    </Button>
                  ),
                },
              ] as ColumnsType<Vehicle>
            }
            dataSource={groupDetail.vehicle}
            rowKey={(v) => v.id}
            pagination={false}
          />
        )}
        {/* Modal chỉnh sửa 1 xe máy trong nhóm */}
        <EditSingleVehicleInGroupModal
          open={editSingleModal.open}
          initialImages={
            editSingleModal.vehicle && editSingleModal.vehicle.vehicleImages
              ? editSingleModal.vehicle.vehicleImages.map(
                  (img: { imageUrl: string }) => img.imageUrl
                )
              : []
          }
          initialLicensePlate={editSingleModal.vehicle?.licensePlate || ""}
          loading={editSingleLoading}
          onCancel={() => setEditSingleModal({ open: false, vehicle: null })}
          onOk={async ({ images, licensePlate }) => {
            setEditSingleLoading(true);
            try {
              if (!editSingleModal.vehicle) return;
              await updateSingleMotorbikeInGroup({
                vehicleId: editSingleModal.vehicle.id,
                images,
                licensePlate,
                accessToken,
              });
              setEditSingleModal({ open: false, vehicle: null });
              // Cập nhật lại groupDetail
              if (groupDetail) {
                const updatedVehicles = groupDetail.vehicle.map((v) =>
                  v.id === editSingleModal.vehicle!.id
                    ? {
                        ...v,
                        vehicleImages: images.map((url: string) => ({
                          imageUrl: url,
                        })),
                        licensePlate,
                      }
                    : v
                );
                setGroupDetail({ ...groupDetail, vehicle: updatedVehicles });
              }
              // Cập nhật lại danh sách nhóm xe
              fetchGroupVehicles(activeType);
            } catch {
              // Có thể showError ở đây nếu muốn
            } finally {
              setEditSingleLoading(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={registerVehicleModal}
        title={
          editVehicleId &&
          typeof editVehicleId === "string" &&
          editVehicleId.startsWith("GROUP-")
            ? "Chỉnh sửa"
            : editVehicleId
            ? "Cập nhật thông tin xe"
            : "Đăng ký xe mới"
        }
        width={1400}
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
            vehicleId={
              editVehicleId &&
              typeof editVehicleId === "string" &&
              editVehicleId.startsWith("GROUP-")
                ? undefined
                : editVehicleId || undefined
            }
            groupEdit={
              editVehicleId &&
              typeof editVehicleId === "string" &&
              editVehicleId.startsWith("GROUP-")
                ? groupDetail
                : undefined
            }
            onOk={() => {
              setRegisterVehicleModal(false);
              fetchGroupVehicles(activeType);
            }}
          />
        </Spin>
      </Modal>
    </div>
  );
}
UserRegisterVehicle.Layout = ProviderLayout;
