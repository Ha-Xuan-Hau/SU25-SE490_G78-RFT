"use client";
import Image from "next/image";
// import Link from "next/link";
import { Icon } from "@iconify/react";
import { useState } from "react";
import Link from "next/link";

const Banner: React.FC = () => {
  const [activeTab, setActiveTab] = useState("self-drive");
  const [vehicleType, setVehicleType] = useState("car");
  const [location, setLocation] = useState("Hà Nội");
  const [priceRange, setPriceRange] = useState("0-500");

  return (
    <section className="relative min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/bg-demo.png"
          alt="RFT Background"
          fill
          priority={true}
          unoptimized={true}
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
              <span className="text-green-400 font-semibold">hơn 10.000</span>{" "}
              xe gia đình đời mới khắp Việt Nam
            </p>
          </div>

          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Column 2: Search Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
            <h2 className="text-4xl font-semibold text-center mb-6">
              Bạn cần thuê xe?
            </h2>

            {/* Service Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveTab("self-drive")}
                className={`text-base flex items-center justify-center gap-2 py-3 px-6 flex-1 rounded-md border ${
                  activeTab === "self-drive"
                    ? "bg-primary text-white border-primary font-medium"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                } transition-all duration-200`}
              >
                <Icon icon="mdi:car" width={20} height={20} />
                Xe tự lái
              </button>
              <button
                onClick={() => setActiveTab("driver")}
                className={`text-base flex items-center justify-center gap-2 py-3 px-6 flex-1 rounded-md border ${
                  activeTab === "driver"
                    ? "bg-primary text-white border-primary font-medium"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                } transition-all duration-200`}
              >
                <Icon
                  icon="mdi:account-tie-hat-outline"
                  width={20}
                  height={20}
                />
                Xe có lái
              </button>
            </div>

            {/* Vehicle Type Selection */}
            <div className="mb-4">
              <label className="text-base text-gray-500 mb-2 block">
                Loại phương tiện
              </label>
              <div className="grid grid-cols-3 gap-2">
                {activeTab === "self-drive" ? (
                  <>
                    <button
                      onClick={() => setVehicleType("car")}
                      className={`flex flex-col items-center py-3 px-2 border rounded-md ${
                        vehicleType === "car"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-primary"
                      }`}
                    >
                      <Icon
                        icon="mdi:car"
                        width={24}
                        height={24}
                        className="mb-1"
                      />
                      <span className="text-base font-medium">Ô tô</span>
                    </button>
                    <button
                      onClick={() => setVehicleType("motorcycle")}
                      className={`flex flex-col items-center py-3 px-2 border rounded-md ${
                        vehicleType === "motorcycle"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-primary"
                      }`}
                    >
                      <Icon
                        icon="mdi:motorcycle"
                        width={24}
                        height={24}
                        className="mb-1"
                      />
                      <span className="text-base font-medium">Xe máy</span>
                    </button>
                    <button
                      onClick={() => setVehicleType("bicycle")}
                      className={`flex flex-col items-center py-3 px-2 border rounded-md ${
                        vehicleType === "bicycle"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-primary"
                      }`}
                    >
                      <Icon
                        icon="mdi:bicycle"
                        width={24}
                        height={24}
                        className="mb-1"
                      />
                      <span className="text-base font-medium">Xe đạp</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setVehicleType("car")}
                      className={`flex flex-col items-center py-3 px-2 border rounded-md ${
                        vehicleType === "car"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-primary"
                      }`}
                    >
                      <Icon
                        icon="mdi:car"
                        width={24}
                        height={24}
                        className="mb-1"
                      />
                      <span className="text-base font-medium">Ô tô</span>
                    </button>
                    <button
                      onClick={() => setVehicleType("motorcycle")}
                      className={`flex flex-col items-center py-3 px-2 border rounded-md ${
                        vehicleType === "motorcycle"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-primary"
                      }`}
                    >
                      <Icon
                        icon="mdi:motorcycle"
                        width={24}
                        height={24}
                        className="mb-1"
                      />
                      <span className="text-base font-medium">Xe máy</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Location Selector */}
            <div className="relative mb-4">
              <label
                htmlFor="location"
                className="text-base text-gray-500 mb-2 block"
              >
                Địa điểm
              </label>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <div className="flex items-center bg-gray-50 px-3 py-3 border-r border-gray-300">
                  <Icon
                    icon="mdi:map-marker"
                    className="text-gray-500"
                    width={20}
                    height={20}
                  />
                </div>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nhập địa điểm"
                  className="flex-1 px-3 py-3 outline-none text-gray-700"
                />
              </div>
            </div>

            {/* Search Button */}
            <button className="w-full bg-primary hover:bg-primary/90 text-white rounded-md py-3 px-6 text-lg font-medium transition duration-300 mb-6">
              <Link href={`/vehicles`}>Tìm kiếm</Link>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
