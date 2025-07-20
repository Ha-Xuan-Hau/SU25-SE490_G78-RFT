import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Divider, Table } from "antd";
import moment from "moment";
import { formatCurrency } from "@/lib/format-currency";
import { getBookingDetail } from "@/apis/booking.api";
import { BookingDetail } from "@/types/booking";
import { translateENtoVI } from "@/lib/viDictionary";

export default function BookingDetailPage() {
  const router = useRouter();
  const bookingId = router.query.id as string;
  const [data, setData] = useState<BookingDetail | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    const fetchData = async () => {
      try {
        const res = await getBookingDetail(bookingId);
        setData(res as BookingDetail);
      } catch {
        setData(null);
      }
    };
    fetchData();
  }, [bookingId]);

  // Trang chi tiết booking: lấy dữ liệu từ API, hiển thị thông tin xe, người nhận, địa điểm, bảng giá, tổng tiền

  return (
    <section>
      <div className="flex flex-col my-6 py-2 max-w-6xl mx-auto">
        <p className="flex justify-center items-center text-2xl font-bold mt-0 mb-8">
          Thông tin chi tiết
        </p>
        <div className="flex flex-row w-full gap-4">
          {/* Thông tin xe thuê */}
          <div className="flex flex-col bg-neutral-50 p-4 ml-5 mr-5 w-1/2 shadow-xl rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Thông tin xe thuê</h3>
            <div className="flex flex-col gap-2">
              {data?.vehicles?.map((vehicle) => (
                <a
                  key={vehicle.id}
                  href={`/vehicles/${vehicle.id}`}
                  className="flex flex-row items-center justify-between py-2 border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition cursor-pointer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-base text-gray-800">
                      {translateENtoVI(vehicle.vehicleTypes)}
                    </span>
                    <span className="text-base text-gray-700">
                      {vehicle.thumb}
                    </span>
                    <span className="text-base text-gray-700">
                      Biển số: {vehicle.licensePlate}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
          {/* Chi tiết đặt thuê */}
          <div className="flex flex-col gap-4 p-9 bg-neutral-50 shadow-xl rounded-lg w-1/2">
            <div className="flex flex-col">
              <div className="flex flex-col items-center w-full ">
                <div className="w-full p-4">
                  <h3 className="mt-0">Thông tin người nhận</h3>
                  <span className="font-medium text-gray-800 text-sm">
                    Tên: {data?.user?.fullName}
                  </span>
                  <p className="font-medium text-gray-800">
                    Số điện thoại: {data?.phoneNumber}
                  </p>
                  <p className="font-medium text-gray-800">
                    Địa chỉ: {data?.user?.address}
                  </p>
                </div>
                <Divider className="m-0 w-full border-1 border-gray-400" />
                <div className="p-4 w-full">
                  <h3 className="mt-0">Địa điểm giao xe cho khách</h3>
                  <span className="font-medium text-gray-800">
                    {data?.address}
                  </span>
                </div>
              </div>
            </div>
            <Divider className="m-0 w-full border-1 border-gray-400" />
            <Table
              className="bg-transparent [&_.ant-table]:bg-transparent [&_.ant-table-thead>tr>th]:border-b-gray-400 [&_.ant-table-tbody>tr>td]:border-b-gray-400"
              columns={[
                { dataIndex: "label" },
                { dataIndex: "price", className: "text-right" },
              ]}
              bordered={false}
              showHeader={false}
              pagination={false}
              rowKey={(row) => row.label}
              dataSource={[
                {
                  label: "Mã đơn hàng",
                  price: data?.id || "",
                },
                {
                  label: "Ngày nhận xe",
                  price: data?.timeBookingStart
                    ? moment(data.timeBookingStart).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )
                    : "",
                },
                {
                  label: "Ngày trả xe",
                  price: data?.timeBookingEnd
                    ? moment(data.timeBookingEnd).format("YYYY-MM-DD HH:mm:ss")
                    : "",
                },
                {
                  label: "Ngày tạo đơn",
                  price: data?.createdAt
                    ? moment(data.createdAt).format("YYYY-MM-DD HH:mm:ss")
                    : "",
                },
              ]}
            />
            <div className="pl-4 flex items-center justify-between m-0">
              <h3 className="text-green-500 text-lg m-0">Tổng giá thuê:</h3>
              <h3 className="text-green-500 text-lg m-0">
                {data?.totalCost ? formatCurrency(data.totalCost) : ""}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
