import { useState, useEffect } from "react";

const useLocalStorage = (key, initialValue) => {
    const [state, setState] = useState(() => {
        try {
            if (typeof window !== "undefined") {
                const value = window.localStorage.getItem(key);
                return value ? JSON.parse(value) : initialValue;
            }
            return initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === key) {
                try {
                    const value = window.localStorage.getItem(key);
                    setState(value ? JSON.parse(value) : initialValue);
                } catch (error) {
                    console.log(error);
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [key, initialValue]);

    const setValue = (value) => {
        try {
            if (typeof window !== "undefined") {
                const valueToStore = value instanceof Function ? value(state) : value;
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                setState(valueToStore);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const clearValue = () => {
        try {
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(key);
                setState(initialValue);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return [state, setValue, clearValue];
};

export default useLocalStorage;
