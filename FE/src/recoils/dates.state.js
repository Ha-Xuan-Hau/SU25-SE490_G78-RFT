import { atom, useRecoilState } from "recoil";

export const datesAtom = atom({
  key: "dates",
  default: [],
});

export const useDatesState = () => useRecoilState(datesAtom);
