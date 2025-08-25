import Image from "next/image";

const InfoSections: React.FC = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Section 1 - Bạn muốn biết thêm về RFT? */}
          <div className="bg-green-50 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 h-full">
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                    Bạn muốn biết thêm về RFT?
                  </h2>
                  <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
                    RFT kết nối khách hàng có nhu cầu thuê xe với các chủ xe
                    trên khắp cả nước. Hỗ trợ đa dạng thanh toán, RFT hướng đến
                    việc xây dựng và phát triển nền tảng cho thuê xe an toàn tại
                    các điểm du lịch trên toàn quốc
                  </p>
                </div>
              </div>
              <div className="relative h-64 md:h-full">
                <Image
                  src="/images/dulich.png"
                  alt="Người lái xe vui vẻ"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Section 2 - Bạn muốn cho thuê xe? */}
          <div className="bg-blue-50 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 h-full">
              <div className="p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                    Bạn muốn cho thuê xe?
                  </h2>
                  <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
                    Đăng ký trở thành đối tác của chúng tôi ngay hôm nay để gia
                    tăng thu nhập hàng tháng.
                  </p>
                </div>
              </div>
              <div className="relative h-64 md:h-full order-1 md:order-2">
                <Image
                  src="/images/pic2.png"
                  alt="Tay lái xe"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSections;
