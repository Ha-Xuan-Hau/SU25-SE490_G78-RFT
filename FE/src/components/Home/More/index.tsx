import Image from "next/image";

const More: React.FC = () => {
  return (
    <section id="features" className="py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="mb-16 flex flex-col gap-3 ">
          <div className="flex gap-2.5 items-center justify-center"></div>
          <h2 className="text-40 lg:text-52 font-medium text-black dark:text-white text-center tracking-tight leading-11 mb-2">
            Ưu điểm của RFT
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 relative w-60 h-60">
              <Image
                src="/more1.svg"
                alt="Lái xe an toàn cùng Mioto"
                fill
                className="object-contain"
                unoptimized={true}
              />
            </div>
            <h1 className="text-4xl font-bold mb-3">
              Lái xe an toàn cùng Mioto
            </h1>
            <p className="text-xl text-gray-600">
              Chuyến đi trên Mioto được bảo vệ với Gói bảo hiểm thuê xe từ lái
              từ MIC & VNI. Khách thuê sẽ chi bồi thường tối đa 2.000.000VNĐ
              trong trường hợp có sự cố ngoài ý muốn.
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
            <h1 className="text-4xl font-bold mb-3">An tâm đặt xe</h1>
            <p className="text-xl text-gray-600">
              Không tính phí huỷ chuyến trong vòng 1h sau khi thanh toán giữ
              chỗ. Hoàn tiền giữ chỗ và bồi thường 100% nếu chủ xe huỷ chuyến
              trong vòng 7 ngày trước chuyến đi.
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
            <h1 className="text-4xl font-bold mb-3">Thủ tục đơn giản</h1>
            <p className="text-xl text-gray-600">
              Chỉ cần có CCCD gắn chip (Hoặc Passport) & Giấy phép lái xe là bạn
              đã đủ điều kiện thuê xe trên Mioto.
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
            <h1 className="text-4xl font-bold mb-3">Thanh toán dễ dàng</h1>
            <p className="text-xl text-gray-600">
              Đa dạng hình thức thanh toán: ATM, thẻ Visa & Ví điện tử (Momo,
              VnPay, ZaloPay).
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
            <h1 className="text-4xl font-bold mb-3">Giao xe tận nơi</h1>
            <p className="text-xl text-gray-600">
              Bạn có thể lựa chọn giao xe tận nhà/sân bay... Phí tính kiểm chỉ
              từ 15k/km.
            </p>
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
            <h1 className="text-4xl font-bold mb-3">Dòng xe đa dạng</h1>
            <p className="text-xl text-gray-600">
              Hơn 100 dòng xe cho bạn tùy ý lựa chọn: Mini, Sedan, CUV, SUV,
              MPV, Bán tải.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default More;
