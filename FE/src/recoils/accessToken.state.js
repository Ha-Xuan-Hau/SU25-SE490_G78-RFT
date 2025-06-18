import { atom, useRecoilState, useRecoilValue } from "recoil";

const getAccessToken = (key) => {
  try {
    if (typeof window !== "undefined") {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
    return null;
  } catch (error) {
    console.log(error);
  }
};

export const accessTokenAtom = atom({
  key: "access_token",
  default: getAccessToken("access_token"),
});

export const useAccessTokenState = () => useRecoilState(accessTokenAtom);
export const useAccessTokenValue = () => useRecoilValue(accessTokenAtom);
