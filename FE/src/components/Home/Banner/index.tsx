"use client";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Link from "next/link";

const Banner: React.FC = () => {
  return (
    <section className="relative min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/bg-landing.png"
          alt="RFT Background"
          fill
          priority={true}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-20 items-center">
          {/* Column 1: Text Content */}
          <div className="text-white lg:col-span-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              RFT - Cùng Bạn
              <br />
              Đến Mọi Hành Trình
            </h1>
            <p className="text-lg md:text-xl font-medium mb-8">
              Trải nghiệm sự khác biệt từ{" "}
              <span className="text-yellow-400 font-semibold">hơn 10.000</span>{" "}
              xe gia đình đời mới khắp Việt Nam
            </p>
          </div>

          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Column 2: Service Showcase */}
          <div className="bg-white rounded-xl shadow-2xl p-6 lg:col-span-2">
            {/* Header - Giới thiệu dịch vụ */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bạn đang tìm xe?
              </h2>
            </div>

            {/* Service Options - Showcase style */}
            <div className="space-y-4 mb-6">
              {/* Self Drive Service */}
              <div className="rounded-lg border-2 border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Icon icon="mdi:car-key" width={24} height={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold  text-gray-800 mb-1">Xe Tự Lái</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Tự do lái xe theo lịch trình của bạn
                    </p>
                    {/* Vehicle types for self-drive */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                        <Icon icon="mdi:car" width={12} />Ô tô
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                        <Icon icon="mdi:motorcycle" width={12} />
                        Xe máy
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                        <Icon icon="mdi:bicycle" width={12} />
                        Xe đạp
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Service */}
              <div className="rounded-lg border-2 border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Icon icon="mdi:account-tie-hat" width={24} height={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">
                      Xe Có Tài Xế
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Thoải mái tận hưởng chuyến đi
                    </p>
                    {/* Vehicle types for driver service */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-200">
                        <Icon icon="mdi:car" width={12} />Ô tô
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-3">
              <Link href="/vehicles" className="block">
                <button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-lg py-4 px-6 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group">
                  <Icon icon="mdi:magnify" width={20} />
                  Khám Phá Xe Ngay
                  <Icon
                    icon="mdi:arrow-right"
                    width={16}
                    className="group-hover:translate-x-1 transition-transform duration-200"
                  />
                </button>
              </Link>

              <p className="text-center text-xs text-gray-500">
                Tìm kiếm và đặt xe phù hợp với nhu cầu của bạn
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
