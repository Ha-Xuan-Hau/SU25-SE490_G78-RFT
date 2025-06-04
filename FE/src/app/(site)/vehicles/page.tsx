import VehicleListing from "@/components/Vehicles/VehicleList";
import React from "react";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Vehicle List | RFT",
};

const page = () => {
  return (
    <>
      <VehicleListing />
    </>
  );
};

export default page;
