import { Modal, Button, Space } from "antd";
import { useState } from "react";
import { getCoupons } from "@/apis/user-vehicles.api";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Coupon as CouponType } from "@/types/Coupon";

interface CouponProps {
  applyCoupon: (coupon: CouponType | null) => void;
}

const Coupon: React.FC<CouponProps> = ({ applyCoupon }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null);

  const showModal = (): void => {
    setIsModalOpen(true);
  };

  const handleCouponClick = (coupon: CouponType): void => {
    setSelectedCoupon(coupon);
    setIsModalOpen(false);
    applyCoupon(coupon);
  };

  const handleCancelSelection = (): void => {
    setSelectedCoupon(null);
    applyCoupon(null);
  };

  const handleCancel = (): void => {
    setIsModalOpen(false);
  };

  const {
    data: coupons,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["get-coupons"],
    queryFn: getCoupons,
  });

  // Hiển thị loading nếu đang tải
  if (isLoading) return <div>Đang tải mã giảm giá...</div>;

  // Hiển thị lỗi nếu có
  if (error) return <div>Không thể tải mã giảm giá</div>;

  return (
    <div className="">
      {selectedCoupon ? (
        <Space>
          <span>{selectedCoupon.name}</span>
          <span className="text-green-400">-{selectedCoupon.discount}%</span>
          <Icon
            icon="mdi:close-circle"
            className="cursor-pointer text-red-500 text-lg"
            onClick={handleCancelSelection}
          />
        </Space>
      ) : (
        <div
          onClick={showModal}
          className="w-full h-12 flex items-center cursor-pointer"
        >
          <Icon icon="mdi:ticket-percent-outline" className="text-2xl mr-2" />
          <div className="text-base p-2">Sử dụng mã giảm giá</div>
        </div>
      )}
      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        width={500}
        style={{ maxHeight: "400px", overflowY: "auto" }}
      >
        <div>
          <h2 className="text-lg text-center font-bold mb-4">
            Chọn mã giảm giá
          </h2>
          <div className="coupon-options">
            {coupons?.result && coupons.result.length > 0 ? (
              coupons.result.map((coupon: CouponType, index: number) => (
                <div
                  key={coupon.id || index}
                  className="coupon-option cursor-pointer mb-2"
                >
                  <div className="flex w-full pb-4 border-b">
                    <Icon
                      icon="mdi:sale"
                      className="text-2xl text-green-500 mt-1"
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col pl-4 justify-between">
                        <div className="flex">
                          <h3 className="m-0">{coupon.name}</h3>
                          <span className="text-xs ml-2 text-green-400">
                            -{coupon.discount}%
                          </span>
                        </div>
                        <p className="m-0 max-w-lg text-gray-500 text-sm">
                          {coupon.description}
                        </p>
                      </div>
                      <Button
                        className="bg-green-400 text-white hover:bg-green-500"
                        onClick={() => handleCouponClick(coupon)}
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">Không có mã giảm giá</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Coupon;
