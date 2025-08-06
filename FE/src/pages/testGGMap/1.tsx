import { useEffect, useRef, useState } from "react";
import { AutoComplete, Input, Button, message, Spin } from "antd";
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
  position?: {
    lat: number;
    lng: number;
  };
}

declare global {
  interface Window {
    H: any;
  }
}

export default function DistancePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [userSuggestions, setUserSuggestions] = useState<AutocompleteOption[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [userInputValue, setUserInputValue] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  // Địa chỉ cố định của người cho thuê
  const landlordLocation: Location = {
    lat: 10.762622,
    lng: 106.660172,
    address: "Ho Chi Minh City, Vietnam",
  };

  // Tải và khởi tạo bản đồ HERE Maps
  useEffect(() => {
    const loadHereMaps = async () => {
      try {
        setLoading(true);
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
          message.error("Không thể khởi tạo HERE Maps. Vui lòng tải lại trang.");
        }
      } catch (error) {
        console.error("Lỗi khi tải HERE Maps:", error);
        message.error("Không thể tải bản đồ. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadHereMaps();
    return () => {
      if (map) {
        map.dispose();
      }
    };
  }, []);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Không thể tải script: ${src}`));
      document.body.appendChild(script);
    });
  };

  const initMap = () => {
    if (!mapRef.current || map) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
      if (!apiKey) {
        console.error("Không tìm thấy HERE API Key");
        message.error("Thiếu API key cho bản đồ");
        return;
      }

      const platformInstance = new window.H.service.Platform({
        apikey: apiKey,
      });
      setPlatform(platformInstance);

      const defaultLayers = platformInstance.createDefaultLayers();
      const mapInstance = new window.H.Map(
          mapRef.current,
          defaultLayers.vector.normal.map,
          {
            zoom: 12,
            center: { lat: landlordLocation.lat, lng: landlordLocation.lng },
            pixelRatio: window.devicePixelRatio || 1,
          }
      );

      const behavior = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(mapInstance));
      const ui = window.H.ui.UI.createDefault(mapInstance, defaultLayers);

      setMap(mapInstance);
      console.log("Khởi tạo bản đồ thành công");

      window.addEventListener("resize", () => mapInstance.getViewPort().resize());
    } catch (error) {
      console.error("Lỗi khi khởi tạo bản đồ:", error);
      message.error("Không thể khởi tạo bản đồ");
    }
  };

  // Hàm dự phòng để lấy tọa độ từ địa chỉ
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      setLoading(true);
      const response = await fetch(
          `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
              address
          )}&in=countryCode:VNM&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
      );
      if (!response.ok) {
        throw new Error(`Lỗi geocoding: ${response.status}`);
      }
      const data = await response.json();
      console.log("Geocoding response:", data);
      if (data.items?.[0]?.position) {
        return data.items[0].position;
      }
      return null;
    } catch (error) {
      console.error("Lỗi khi geocoding địa chỉ:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Gợi ý địa chỉ, giới hạn ở Việt Nam
  const debouncedGetAddressSuggestions = debounce(
      async (query: string, setter: (options: AutocompleteOption[]) => void) => {
        if (query.length < 3) {
          setter([]);
          return;
        }

        try {
          setLoading(true);
          const response = await fetch(
              `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
                  query
              )}&in=countryCode:VNM&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
          );

          if (!response.ok) {
            if (response.status === 429) {
              message.error("Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau vài phút.");
            }
            throw new Error(`Lỗi HTTP: ${response.status}`);
          }

          const data = await response.json();
          console.log("Dữ liệu API autocomplete:", data);
          const suggestions = data.items?.map((item: any) => ({
            value: item.address.label,
            label: item.address.label,
            position: item.position,
          })) || [];

          setter(suggestions);
          console.log("Danh sách gợi ý:", suggestions);
        } catch (error) {
          console.error("Lỗi khi lấy gợi ý địa chỉ:", error);
          message.error("Không thể tải gợi ý địa điểm. Vui lòng kiểm tra lại.");
        } finally {
          setLoading(false);
        }
      },
      500
  );

  // Tính khoảng cách và vẽ tuyến đường
  const calculateDistance = async () => {
    if (!userLocation) {
      message.error("Vui lòng chọn địa điểm của bạn");
      return;
    }

    try {
      setLoading(true);
      // Xóa tuyến đường cũ nhưng giữ marker
      if (map) {
        const objects = map.getObjects();
        const routes = objects.filter((obj: any) => !(obj instanceof window.H.map.Marker));
        map.removeObjects(routes);
        console.log("Đã xóa tuyến đường cũ");
      }

      const response = await fetch(
          `https://router.hereapi.com/v8/routes?` +
          new URLSearchParams({
            transportMode: "car",
            origin: `${landlordLocation.lat},${landlordLocation.lng}`,
            destination: `${userLocation.lat},${userLocation.lng}`,
            return: "polyline,summary",
            apikey: process.env.NEXT_PUBLIC_HERE_API_KEY || "",
          }).toString()
      );

      if (!response.ok) {
        if (response.status === 429) {
          message.error("Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau vài phút.");
        }
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (!data.routes?.[0]) {
        throw new Error("Không tìm thấy tuyến đường");
      }

      const route = data.routes[0];
      if (!route.sections?.[0]?.polyline) {
        throw new Error("Không tìm thấy dữ liệu tuyến đường");
      }

      // Vẽ tuyến đường
      const lineString = window.H.geo.LineString.fromFlexiblePolyline(route.sections[0].polyline);
      const routeLine = new window.H.map.Polyline(lineString, {
        style: {
          strokeColor: "#00A8E8",
          lineWidth: 4,
          lineCap: "round",
        },
      });

      map.addObject(routeLine);
      console.log("Đã thêm tuyến đường vào bản đồ");

      const distanceInKm = route.sections[0].summary.length / 1000;
      setDistance(`${distanceInKm.toFixed(2)} km`);

      // Hiển thị toàn bộ tuyến đường
      map.getViewModel().setLookAtData({
        bounds: routeLine.getBoundingBox(),
        padding: { top: 50, left: 50, bottom: 50, right: 50 },
      });
    } catch (error) {
      console.error("Lỗi khi tính tuyến đường:", error);
      message.error("Không thể tính tuyến đường. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn địa điểm
  const handleUserSelect = async (value: string, option: AutocompleteOption) => {
    console.log("Địa điểm được chọn:", { value, option });
    let position = option.position;

    // Nếu không có tọa độ, gọi API geocoding
    if (!position) {
      console.warn("Không có dữ liệu tọa độ, đang gọi geocoding:", value);
      message.warning("Đang tìm tọa độ cho địa điểm này...");
      position = await geocodeAddress(value);
    }

    if (position) {
      const location: Location = {
        lat: position.lat,
        lng: position.lng,
        address: value,
      };
      setUserLocation(location);
      setUserInputValue(value);
      console.log("Cập nhật userLocation:", location);
    } else {
      console.warn("Không tìm thấy tọa độ cho địa điểm:", value);
      message.error("Không thể lấy tọa độ cho địa điểm này. Vui lòng chọn địa điểm khác.");
    }
  };

  // Cập nhật marker trên bản đồ khi địa điểm thay đổi
  useEffect(() => {
    if (!map) {
      console.log("Bản đồ chưa được khởi tạo");
      return;
    }

    console.log("Cập nhật marker:", { landlordLocation, userLocation });

    // Xóa tất cả marker cũ
    const objects = map.getObjects();
    const markers = objects.filter((obj: any) => obj instanceof window.H.map.Marker);
    map.removeObjects(markers);
    console.log("Đã xóa marker cũ:", markers.length);

    const newMarkers = [];

    // Thêm marker cho địa chỉ người cho thuê
    try {
      const landlordMarker = new window.H.map.Marker(
          { lat: landlordLocation.lat, lng: landlordLocation.lng },
          { data: { label: "Người cho thuê" } }
      );
      newMarkers.push(landlordMarker);
      console.log("Đã tạo marker cho landlord:", landlordLocation);
    } catch (error) {
      console.error("Lỗi khi tạo marker cho landlord:", error);
    }

    // Thêm marker cho địa điểm người dùng
    if (userLocation) {
      try {
        const userMarker = new window.H.map.Marker(
            { lat: userLocation.lat, lng: userLocation.lng },
            { data: { label: "Địa điểm của bạn" } }
        );
        newMarkers.push(userMarker);
        console.log("Đã tạo marker cho user:", userLocation);
      } catch (error) {
        console.error("Lỗi khi tạo marker cho user:", error);
      }
    }

    // Thêm marker vào bản đồ
    if (newMarkers.length > 0) {
      try {
        map.addObjects(newMarkers);
        console.log("Đã thêm marker vào bản đồ:", newMarkers.length);

        // Nếu có cả hai điểm, hiển thị cả hai trong khung nhìn
        if (newMarkers.length === 2) {
          const group = new window.H.map.Group();
          group.addObjects(newMarkers);
          map.getViewModel().setLookAtData({
            bounds: group.getBoundingBox(),
            padding: { top: 50, left: 50, bottom: 50, right: 50 },
          });
          console.log("Đã điều chỉnh khung nhìn để hiển thị cả hai marker");
        } else {
          // Nếu chỉ có một điểm, đặt trung tâm bản đồ tại điểm đó
          map.setCenter({ lat: landlordLocation.lat, lng: landlordLocation.lng });
          map.setZoom(12);
          console.log("Đã đặt trung tâm bản đồ tại landlordLocation");
        }
      } catch (error) {
        console.error("Lỗi khi thêm marker vào bản đồ:", error);
      }
    }

    // Tính và vẽ tuyến đường nếu có userLocation
    if (userLocation) {
      calculateDistance();
    }
  }, [userLocation, map]);

  return (
      <>
        <Head>
          <title>Tính khoảng cách</title>
        </Head>

        <div className="p-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Tính khoảng cách</h1>
          <div className="mb-4">
            <p className="text-lg">
              Địa chỉ của người cho thuê: <strong>{landlordLocation.address}</strong>
            </p>
          </div>
          <Spin spinning={loading}>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <AutoComplete
                  className="flex-1"
                  value={userInputValue}
                  options={userSuggestions}
                  onSearch={(text) => {
                    setUserInputValue(text);
                    debouncedGetAddressSuggestions(text, setUserSuggestions);
                  }}
                  onSelect={handleUserSelect}
                  onChange={(value) => {
                    setUserInputValue(value);
                    if (!value) {
                      setUserLocation(null);
                      console.log("Xóa input, reset userLocation");
                    }
                  }}
              >
                <Input placeholder="Nhập địa điểm của bạn" size="large" />
              </AutoComplete>

              <Button
                  type="primary"
                  size="large"
                  onClick={calculateDistance}
                  disabled={!userLocation || loading}
              >
                Tính khoảng cách
              </Button>
            </div>
          </Spin>

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