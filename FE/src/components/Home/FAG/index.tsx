import Image from "next/image";

const FAQ: React.FC = () => {
  return (
    <section id="faqs" className="py-16">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="lg:mx-0 mx-auto">
            <Image
              src="/images/pic1.png"
              alt="image"
              width={680}
              height={644}
              className="lg:w-full"
              unoptimized={true}
            />
          </div>
          <div className="lg:px-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              Hướng dẫn đặt xe
            </h2>

            <div className="grid grid-cols-1 grid-rows-4 gap-6">
              <div className="flex gap-4 items-center">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary flex justify-center items-center text-xl text-white font-bold">
                  01
                </div>
                <div className="text-xl font-semibold text-gray-700">
                  Đặt xe trên website RFT
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary flex justify-center items-center text-xl text-white font-bold">
                  02
                </div>
                <div className="text-xl font-semibold text-gray-700">
                  Nhận xe tại điểm hẹn
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary flex justify-center items-center text-xl text-white font-bold">
                  03
                </div>
                <div className="text-xl font-semibold text-gray-700">
                  Bắt đầu hành trình
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary flex justify-center items-center text-xl text-white font-bold">
                  04
                </div>
                <div className="text-xl font-semibold text-gray-700">
                  Trả xe & kết thúc chuyến đi
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
