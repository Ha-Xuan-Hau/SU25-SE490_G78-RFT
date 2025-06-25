import rawGeoData from "@/data/vietnam-provinces-array.json";

// Định nghĩa các kiểu dữ liệu cho cấu trúc mảng của bạn
type RawWard = [string, string, string, string]; // [id, name, type, name_en]
type RawDistrict = [string, string, string, string, RawWard[]]; // [id, name, type, name_en, wards]
type RawProvince = [string, string, string, string, RawDistrict[]]; // [id, name, type, name_en, districts]

// Giao diện GeoUnit được sử dụng bởi component
export interface GeoUnit {
  code: string;
  name: string;
}

const fullGeoData: RawProvince[] = rawGeoData as RawProvince[];

export const getProvinces = (): Promise<GeoUnit[]> => {
  // Ánh xạ RawProvince sang GeoUnit (id -> code, name -> name)
  const provinces = fullGeoData.map((p) => ({ code: p[0], name: p[1] }));
  return Promise.resolve(provinces);
};

export const getDistrictsByProvinceCode = (
  provinceCode: string
): Promise<GeoUnit[]> => {
  const province = fullGeoData.find((p) => p[0] === provinceCode);
  const districts = province
    ? province[4].map((d) => ({ code: d[0], name: d[1] }))
    : [];
  return Promise.resolve(districts);
};

export const getWardsByDistrictCode = (
  districtCode: string
): Promise<GeoUnit[]> => {
  let wards: GeoUnit[] = [];
  for (const province of fullGeoData) {
    const district = province[4].find((d) => d[0] === districtCode);
    if (district) {
      wards = district[4].map((w) => ({ code: w[0], name: w[1] }));
      break;
    }
  }
  return Promise.resolve(wards);
};
