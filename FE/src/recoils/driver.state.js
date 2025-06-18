import { atom, useRecoilState, useRecoilValue } from "recoil";
import { apiClient } from "../apis/client";
// const getProfile = async () => {
//   try {
//     if (typeof window !== "undefined") {
//       const value = window.localStorage.getItem("access_token");
//     }
//     return null;
//   } catch (error) {
//     console.log(error);
//   }
// };
const getProfile = async () => {
  try {
    if (typeof window !== "undefined") {
      const value = window.localStorage.getItem("access_token");

      if (value !== null) {
        const { data } = await apiClient.request({
          method: "GET",
          url: "/users/get-user",
          headers: {
            Authorization: `Bearer ${JSON.parse(value)}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        console.log(data);

        return data;
      }
    }
    return null;
  } catch (error) {
    console.log(error);
  }
};

export const driverAtom = atom({
  key: "driver",
  default: getProfile(),
});
export const useDriverState = () => useRecoilState(driverAtom);
export const useDriverValue = () => useRecoilValue(driverAtom);
