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
import {
  updateSingleMotorbikeInGroup,
  updateCar,
  updateCommon,
} from "@/apis/vehicle.api";
import { showApiError, showApiSuccess } from "@/utils/toast.utils";

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

  // modal nội quy
  const [rulesModal, setRulesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"create" | "edit" | null>(
    null
  );

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
    setPendingAction("create");
    setRulesModal(true);
  };

  const handleAcceptRules = () => {
    setRulesModal(false);

    if (pendingAction === "create") {
      setEditVehicleId(null);
      setRegisterVehicleModal(true);
    }

    setPendingAction(null);
  };

  const handleRejectRules = () => {
    setRulesModal(false);
    setPendingAction(null);
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
                              const currentVehicle = groupEditModal.vehicle; // Xe hiện tại được chỉnh sửa
                              if (!currentVehicle) {
                                showApiError("Không tìm thấy xe để cập nhật");
                                setGroupEditLoading(false);
                                return;
                              }

                              // Chuyển đổi vehicleFeatures thành chuỗi
                              const updatedVehicleData = {
                                ...currentVehicle,
                                ...values,
                                vehicleFeatures: (
                                  values.vehicleFeatures as string[]
                                ).join(", "), // Chuyển đổi mảng thành chuỗi
                              };

                              // Gọi API để cập nhật cho xe hiện tại
                              await updateCommon({
                                vehicleId: currentVehicle.id,
                                body: updatedVehicleData,
                                accessToken,
                              });

                              setGroupEditModal({
                                open: false,
                                vehicle: null,
                                group: null,
                              });

                              // Cập nhật lại nhóm xe sau khi cập nhật
                              // const updatedGroupVehicles =
                              //   groupEditModal.group.vehicle.map((v) =>
                              //     v.id === currentVehicle.id
                              //       ? updatedVehicleData
                              //       : v
                              //   );

                              // setGroupDetail({
                              //   ...groupEditModal.group,
                              //   vehicle: updatedGroupVehicles,
                              // });
                              fetchGroupVehicles(activeType); // Cập nhật lại danh sách nhóm xe
                              showApiSuccess("Cập nhật nhóm xe thành công");
                            } catch (error) {
                              console.error("Cập nhật xe thất bại:", error);
                              showApiError("Cập nhật xe thất bại");
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
              ? (() => {
                  const allImages = editSingleModal.vehicle.vehicleImages.map(
                    (img: { imageUrl: string }) => img.imageUrl
                  );
                  // Tách 4 ảnh xe đầu tiên
                  return allImages.slice(0, 4);
                })()
              : []
          }
          initialDocuments={
            editSingleModal.vehicle && editSingleModal.vehicle.vehicleImages
              ? (() => {
                  const allImages = editSingleModal.vehicle.vehicleImages.map(
                    (img: { imageUrl: string }) => img.imageUrl
                  );
                  // Lấy ảnh thứ 5 (ảnh giấy tờ)
                  return allImages[4] || "";
                })()
              : ""
          }
          initialLicensePlate={editSingleModal.vehicle?.licensePlate || ""}
          loading={editSingleLoading}
          onCancel={() => setEditSingleModal({ open: false, vehicle: null })}
          onOk={async ({ images, documents, licensePlate }) => {
            setEditSingleLoading(true);
            try {
              if (!editSingleModal.vehicle) return;

              // Gộp ảnh xe và ảnh giấy tờ thành 1 array
              const allImages = [...images];
              if (documents) {
                allImages.push(documents); // Thêm ảnh giấy tờ vào vị trí thứ 5
              }

              // Chuyển đổi images thành định dạng mà backend yêu cầu
              const formattedImages = allImages.map((url: string) => ({
                imageUrl: url,
              }));

              await updateSingleMotorbikeInGroup({
                vehicleId: editSingleModal.vehicle.id,
                images: formattedImages, // Gửi tất cả ảnh (bao gồm cả ảnh giấy tờ)
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
                        vehicleImages: formattedImages, // Cập nhật tất cả ảnh
                        licensePlate,
                      }
                    : v
                );
                setGroupDetail({ ...groupDetail, vehicle: updatedVehicles });
                showApiSuccess("Cập nhật xe thành công");
              }

              // Cập nhật lại danh sách nhóm xe
              fetchGroupVehicles(activeType);
            } catch {
              showApiError("Cập nhật xe thất bại");
            } finally {
              setEditSingleLoading(false);
            }
          }}
        />
      </Modal>

      {/* Modal nội quy đăng ký xe */}
      <Modal
        open={rulesModal}
        title={
          <div className="flex items-center gap-2">
            <span className="text-orange-500 text-xl">⚠️</span>
            <span>Nội quy đăng ký xe</span>
          </div>
        }
        onCancel={handleRejectRules}
        width={1000}
        footer={[
          <Button key="cancel" onClick={handleRejectRules}>
            Hủy bỏ
          </Button>,
          <Button key="accept" type="primary" onClick={handleAcceptRules}>
            Tôi đã đọc và đồng ý
          </Button>,
        ]}
      >
        <div className="space-y-4 max-h-[700px] overflow-y-auto">
          {" "}
          {/* ✅ Tăng height từ 96 lên 700px */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-800 font-medium">
              Vui lòng đọc kỹ các quy định sau trước khi đăng ký xe:
            </p>
          </div>
          <div className="space-y-4">
            {" "}
            {/* ✅ Tăng spacing từ 3 lên 4 */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                1. Về thông tin xe:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Thông tin xe phải chính xác và trung thực</li>
                <li>Hình ảnh xe phải rõ ràng, không được chỉnh sửa quá mức</li>
                <li>
                  Xe phải trong tình trạng an toàn, có đầy đủ giấy tờ pháp lý
                </li>
                <li>Xe phải được bảo dưỡng định kỳ và đảm bảo chất lượng</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                2. Về giá cả và phí dịch vụ:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Giá thuê phải hợp lý và cạnh tranh</li>
                <li>Không được thay đổi giá sau khi khách đã đặt</li>
                <li>Các phí phát sinh phải được thông báo rõ ràng</li>
                <li>Không được tính phí ẩn hoặc phí không hợp lý</li>
              </ul>
            </div>
            {/* ✅ Thêm mục mới về định vị */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                3. Về thiết bị định vị và nhận diện:
              </h4>
              <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-3">
                <p className="text-red-800 font-medium">
                  <strong>BẮT BUỘC:</strong> Tất cả các xe cho thuê phải tuân
                  thủ các quy định sau:
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Gắn thiết bị định vị GPS:</strong> Xe phải được lắp
                  đặt thiết bị định vị để theo dõi vị trí và đảm bảo an toàn
                </li>
                <li>
                  <strong>Dán decal nhận diện:</strong> Phải dán sticker/decal
                  có nội dung
                  <span className="bg-yellow-200 px-2 py-1 rounded font-semibold mx-1">
                    &quot;ĐÂY LÀ XE CHO THUÊ - NẾU CÓ NGƯỜI YÊU CẦU CHỈNH SỬA
                    XE, VUI LÒNG LIÊN HỆ NGAY 0947495583&quot;
                  </span>
                  ở vị trí dễ nhìn thấy (kính sau hoặc cửa xe)
                </li>
                <li>
                  <strong>Kích thước decal:</strong> Tối thiểu 15cm x 5cm, chữ
                  rõ ràng, dễ đọc
                </li>
                <li>
                  <strong>Vị trí đặt decal:</strong> Góc dưới bên phải kính lái
                  hoặc kính sau
                </li>
                <li>
                  <strong>Thông tin liên hệ:</strong> Decal phải có số điện
                  thoại hotline hỗ trợ
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 p-3 mt-3 rounded">
                <p className="text-blue-800 text-sm">
                  <strong>💡 Ghi chú:</strong> Thiết bị định vị và decal nhận
                  diện giúp bảo vệ cả chủ xe và khách thuê, đồng thời tuân thủ
                  quy định pháp luật về kinh doanh vận tải.
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                4. Về trách nhiệm:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Chủ xe chịu trách nhiệm về tình trạng xe trước khi giao</li>
                <li>Phải có mặt đúng giờ khi giao/nhận xe</li>
                <li>Hỗ trợ khách hàng trong trường hợp khẩn cấp</li>
                <li>Đảm bảo xe luôn trong tình trạng sẵn sàng cho thuê</li>
                <li>Thông báo ngay khi xe gặp sự cố hoặc không thể cho thuê</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                5. Về vi phạm và xử lý:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Vi phạm nội quy có thể dẫn đến khóa tài khoản</li>
                <li>Cung cấp thông tin sai lệch sẽ bị xử lý nghiêm khắc</li>
                <li>Không tuân thủ cam kết sẽ ảnh hưởng đến uy tín</li>
                <li>
                  <strong className="text-red-600">
                    Không gắn định vị hoặc decal nhận diện sẽ bị từ chối duyệt
                    xe
                  </strong>
                </li>
                <li>Tái phạm nhiều lần có thể bị cấm vĩnh viễn</li>
              </ul>
            </div>
            {/* ✅ Thêm mục về hỗ trợ */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                6. Hỗ trợ và liên hệ:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>
                  Liên hệ hotline <strong>0947495583</strong> để được hỗ trợ gắn
                  về các nội quy nếu cần trao đổi thêm
                </li>
                <li>Hướng dẫn chi tiết về quy trình đăng ký xe</li>
              </ul>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-blue-800">
              <strong>Lưu ý quan trọng:</strong> Bằng việc nhấn &quot;Tôi đã đọc
              và đồng ý&quot;, bạn xác nhận đã hiểu và cam kết tuân thủ tất cả
              các quy định trên,
              <strong className="text-red-600">
                đặc biệt là việc gắn định vị GPS và dán decal &quot;ĐÂY LÀ XE
                CHO THUÊ&quot;
              </strong>
              trước khi đưa xe vào hoạt động.
            </p>
          </div>
          {/* ✅ Thêm warning cuối */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded">
            <div className="flex items-start gap-2">
              <span className="text-orange-500 text-lg">⚠️</span>
              <div>
                <p className="text-orange-800 font-medium mb-1">
                  Cảnh báo quan trọng:
                </p>
                <p className="text-orange-700 text-sm">
                  Xe không tuân thủ quy định về định vị và decal nhận diện sẽ
                  không được duyệt hoặc bị gỡ khỏi hệ thống. Vui lòng chuẩn bị
                  đầy đủ trước khi đăng ký.
                </p>
              </div>
            </div>
          </div>
        </div>
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
              setTimeout(() => {
                window.location.reload();
              }, 1000); // Delay 1s để modal đóng trước
            }}
          />
        </Spin>
      </Modal>
    </div>
  );
}
UserRegisterVehicle.Layout = ProviderLayout;
