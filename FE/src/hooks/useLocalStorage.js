import { useState } from "react";
const useLocalStorage = (key, initialValue) => {
    const [state, setState] = useState(() => {
        try {
            if (typeof window !== "undefined") {
                const value = window.localStorage.getItem(key);
                return value ? JSON.parse(value) : initialValue;
            }
            return null;
        } catch (error) {
            console.log(error);
        }
    });

    const setValue = (value) => {
        try {
            if (typeof window !== "undefined") {
                const valueToStore = value instanceof Function ? value(state) : value;
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                setState(value);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const clearValue = () => {
        try {
            if (typeof window !== "undefined") {
                return window.localStorage.removeItem(key);
            }
            return null;
        } catch (error) {
            console.log(error);
        }
    };

    return [state, setValue, clearValue];
};

export default useLocalStorage;
