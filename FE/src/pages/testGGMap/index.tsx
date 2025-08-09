// pages/test-map.tsx
import { useEffect, useRef, useState } from "react";
import { AutoComplete, Input, Button, message } from "antd";
import Head from "next/head";
import { debounce } from "lodash";

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface AutocompleteOption {
  value: string;
  label: string;
  position: {
    lat: number;
    lng: number;
  };
}

declare global {
  interface Window {
    H: any;
  }
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [startSuggestions, setStartSuggestions] = useState<
    AutocompleteOption[]
  >([]);
  const [endSuggestions, setEndSuggestions] = useState<AutocompleteOption[]>(
    []
  );
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [startInputValue, setStartInputValue] = useState("");
  const [endInputValue, setEndInputValue] = useState("");

  // Load HERE Maps scripts and initialize map
  useEffect(() => {
    const loadHereMaps = async () => {
      try {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = "https://js.api.here.com/v3/3.1/mapsjs-ui.css";
        document.head.appendChild(link);

        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-core.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-service.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-ui.js");
        await loadScript("https://js.api.here.com/v3/3.1/mapsjs-mapevents.js");

        if (window.H?.service?.Platform) {
          initMap();
        } else {
          message.error(
            "HERE Maps không thể khởi tạo. Vui lòng tải lại trang."
          );
        }
      } catch (error) {
        console.error("Error loading HERE Maps:", error);
        message.error("Không thể tải bản đồ. Vui lòng thử lại.");
      }
    };

    loadHereMaps();
    return () => {
      if (map) {
        map.dispose();
      }
    };
    // eslint-disable-next-line
  }, []);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(script);
    });
  };

  const initMap = () => {
    if (!mapRef.current || map) return;

    try {
      const platformInstance = new window.H.service.Platform({
        apikey: process.env.NEXT_PUBLIC_HERE_API_KEY,
      });
      setPlatform(platformInstance);

      const defaultLayers = platformInstance.createDefaultLayers();

      const mapInstance = new window.H.Map(
        mapRef.current,
        defaultLayers.raster.normal.map, // Use raster layer to avoid TypeError
        {
          zoom: 12,
          center: { lat: 10.762622, lng: 106.660172 }, // Default center (Ho Chi Minh City)
          pixelRatio: window.devicePixelRatio || 1,
        }
      );

      const behavior = new window.H.mapevents.Behavior(
        new window.H.mapevents.MapEvents(mapInstance)
      );
      const ui = window.H.ui.UI.createDefault(mapInstance, defaultLayers);

      setMap(mapInstance);

      window.addEventListener("resize", () =>
        mapInstance.getViewPort().resize()
      );

      return () => {
        window.removeEventListener("resize", () =>
          mapInstance.getViewPort().resize()
        );
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      message.error("Không thể khởi tạo bản đồ");
    }
  };

  // Debounced address suggestions
  const debouncedGetAddressSuggestions = debounce(
    async (query: string, setter: (options: AutocompleteOption[]) => void) => {
      if (query.length < 3) {
        setter([]);
        return;
      }

      try {
        const response = await fetch(
          `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
            query
          )}&in=countryCode:VNM&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
        );

        if (!response.ok) {
          if (response.status === 429) {
            message.error("Quá nhiều yêu cầu. Vui lòng thử lại sau.");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const suggestions = data.items.map((item: any) => ({
          value: item.address.label,
          label: item.address.label,
          position: item.position,
        }));

        setter(suggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        message.error("Không thể tải gợi ý địa điểm. Vui lòng thử lại.");
      }
    },
    500
  );

  // Update map markers and center on start location when selected
  const updateMapMarkers = () => {
    if (!map) return;

    map.removeObjects(map.getObjects());

    const markers = [];
    if (startLocation) {
      const marker = new window.H.map.Marker(
        { lat: startLocation.lat, lng: startLocation.lng },
        { data: { type: "start", address: startLocation.address } }
      );
      markers.push(marker);
      // Center map on start location
      map.setCenter({ lat: startLocation.lat, lng: startLocation.lng });
      map.setZoom(15); // Zoom in when start location is selected
    }
    if (endLocation) {
      const marker = new window.H.map.Marker(
        { lat: endLocation.lat, lng: endLocation.lng },
        { data: { type: "end", address: endLocation.address } }
      );
      markers.push(marker);
    }

    if (markers.length > 0) {
      map.addObjects(markers);

      if (markers.length === 2) {
        const group = new window.H.map.Group();
        group.addObjects(markers);
        map.getViewModel().setLookAtData({
          bounds: group.getBoundingBox(),
          padding: { top: 50, left: 50, bottom: 50, right: 50 },
        });
      }
    }
  };

  // Calculate and draw route
  const calculateRoute = async () => {
    if (!startLocation || !endLocation || !map) {
      message.error("Vui lòng chọn cả điểm xuất phát và điểm đến");
      return;
    }

    try {
      map.removeObjects(
        map
          .getObjects()
          .filter((obj: any) => !(obj instanceof window.H.map.Marker))
      );

      const response = await fetch(
        `https://router.hereapi.com/v8/routes?` +
          new URLSearchParams({
            transportMode: "car",
            origin: `${startLocation.lat},${startLocation.lng}`,
            destination: `${endLocation.lat},${endLocation.lng}`,
            return: "polyline,summary",
            apikey: process.env.NEXT_PUBLIC_HERE_API_KEY || "",
          }).toString()
      );

      if (!response.ok) {
        if (response.status === 429) {
          message.error("Quá nhiều yêu cầu. Vui lòng thử lại sau.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes?.[0]) {
        throw new Error("Không tìm thấy tuyến đường");
      }

      const route = data.routes[0];
      if (!route.sections?.[0]?.polyline) {
        throw new Error("Không tìm thấy dữ liệu tuyến đường");
      }

      const lineString = window.H.geo.LineString.fromFlexiblePolyline(
        route.sections[0].polyline
      );
      const routeLine = new window.H.map.Polyline(lineString, {
        style: {
          strokeColor: "#00A8E8",
          lineWidth: 4,
          lineCap: "round",
        },
      });

      map.addObject(routeLine);

      const distanceInKm = route.sections[0].summary.length / 1000;
      setDistance(`${distanceInKm.toFixed(2)} km`);

      map.getViewModel().setLookAtData({
        bounds: routeLine.getBoundingBox(),
        padding: { top: 50, left: 50, bottom: 50, right: 50 },
      });

      updateMapMarkers();
    } catch (error) {
      console.error("Routing error:", error);
      message.error("Không thể tính tuyến đường");
    }
  };

  // Handle address selection
  const handleStartSelect = (value: string) => {
    const option = startSuggestions.find((opt) => opt.value === value);
    if (option?.position) {
      const location = {
        lat: option.position.lat,
        lng: option.position.lng,
        address: value,
      };
      setStartLocation(location);
      setStartInputValue(value);
    }
  };

  const handleEndSelect = (value: string) => {
    const option = endSuggestions.find((opt) => opt.value === value);
    if (option?.position) {
      const location = {
        lat: option.position.lat,
        lng: option.position.lng,
        address: value,
      };
      setEndLocation(location);
      setEndInputValue(value);
    }
  };

  useEffect(() => {
    updateMapMarkers();
    if (startLocation && endLocation) {
      calculateRoute();
    }
    // eslint-disable-next-line
  }, [startLocation, endLocation, map]);

  return (
    <>
      <Head>
        <title>Tính khoảng cách</title>
      </Head>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Tính khoảng cách</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <AutoComplete
            className="flex-1"
            value={startInputValue}
            options={startSuggestions}
            onSearch={(text) => {
              setStartInputValue(text);
              debouncedGetAddressSuggestions(text, setStartSuggestions);
            }}
            onSelect={handleStartSelect}
            onChange={(value) => setStartInputValue(value)}
          >
            <Input placeholder="Điểm đi" />
          </AutoComplete>

          <AutoComplete
            className="flex-1"
            value={endInputValue}
            options={endSuggestions}
            onSearch={(text) => {
              setEndInputValue(text);
              debouncedGetAddressSuggestions(text, setEndSuggestions);
            }}
            onSelect={handleEndSelect}
            onChange={(value) => setEndInputValue(value)}
          >
            <Input placeholder="Điểm đến" />
          </AutoComplete>

          <Button
            type="primary"
            onClick={calculateRoute}
            disabled={!startLocation || !endLocation}
          >
            Tính khoảng cách
          </Button>
        </div>

        {distance && (
          <div className="text-lg font-semibold mb-4">
            Khoảng cách: {distance}
          </div>
        )}

        <div
          ref={mapRef}
          style={{ width: "100%", height: "500px" }}
          className="rounded-lg shadow-lg"
        />
      </div>
    </>
  );
}
