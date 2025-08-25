import Image from "next/image";

const More: React.FC = () => {
  return (
    <section id="features" className="py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center">Ưu điểm của RFT</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more1.svg"
                alt="Lái xe an toàn"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3">Lái xe an toàn</h3>
            <p className="text-base text-gray-600">
              Đảm bảo xe trong hệ thống đều phải đăng ký bảo hiểm.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more2.svg"
                alt="An tâm đặt xe"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3">An tâm đặt xe</h3>
            <p className="text-base text-gray-600">
              Hủy chuyến linh hoạt, hoàn tiền 100% nếu chủ xe hủy chuyến.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more3.svg"
                alt="Thủ tục đơn giản"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3">Thủ tục đơn giản</h3>
            <p className="text-base text-gray-600">
              Chỉ cần CCCD gắn chip và Giấy phép lái xe để thuê xe.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more4.svg"
                alt="Thanh toán dễ dàng"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3">Thanh toán dễ dàng</h3>
            <p className="text-base text-gray-600">
              Đa dạng hình thức: ATM, Visa, Momo, VnPay, ZaloPay.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more5.svg"
                alt="Giao xe tận nơi"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3">Giao xe tận nơi</h3>
            <p className="text-base text-gray-600">Hỗ trợ giao xe tận nơi</p>
          </div>

          {/* Feature 6 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more6.svg"
                alt="Dòng xe đa dạng"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3">Dòng xe đa dạng</h3>
            <p className="text-base text-gray-600">
              Đa dạng loại xe: Mini, Sedan, CUV, SUV, MPV, Bán tải tới xe côn,
              xe ga, xe số và các loại xe đạp.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default More;
