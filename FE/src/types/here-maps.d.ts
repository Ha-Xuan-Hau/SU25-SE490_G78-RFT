declare namespace H {
  namespace service {
    class Platform {
      constructor(options: {
        apikey: string;
        useHTTPS?: boolean;
        useCIT?: boolean;
      });

      getDefaultMap(): H.Map;
      getSearchService(): H.service.SearchService;
      getRoutingService(): H.service.RoutingService;
    }

    interface SearchService {
      geocode(
        params: Record<string, string | number | boolean>,
        onSuccess: (result: H.service.SearchResult) => void,
        onError: (error: Error) => void
      ): void;
    }

    interface RoutingService {
      calculateRoute(
        params: Record<string, string | number | boolean>,
        onSuccess: (result: H.service.RouteResult) => void,
        onError: (error: Error) => void
      ): void;
    }

    interface SearchResult {
      Response: {
        View: Array<{
          Result: Array<{
            Location: {
              DisplayPosition: {
                Latitude: number;
                Longitude: number;
              };
            };
          }>;
        }>;
      };
    }

    interface RouteResult {
      response: {
        route: Array<{
          summary: {
            distance: number;
            travelTime: number;
          };
        }>;
      };
    }
  }

  class Map {
    constructor(
      element: HTMLElement,
      baseLayer: H.map.layer.Layer,
      options?: Record<string, string | number | boolean>
    );

    addObject(object: H.map.Marker | H.map.Polyline): void;
    removeObject(object: H.map.Marker | H.map.Polyline): void;
    getCenter(): H.geo.Point;
    setCenter(point: H.geo.Point): void;
    getZoom(): number;
    setZoom(zoom: number): void;
  }

  namespace map {
    namespace layer {
      type Layer = Record<string, unknown>;
    }

    class Marker {
      constructor(
        position: H.geo.Point,
        options?: Record<string, string | number | boolean>
      );
    }

    class Polyline {
      constructor(
        strip: H.geo.LineString,
        options?: Record<string, string | number | boolean>
      );
    }
  }

  namespace geo {
    class Point {
      constructor(lat: number, lng: number, alt?: number);
      getLat(): number;
      getLng(): number;
    }

    class LineString {
      constructor();
      pushPoint(point: H.geo.Point): void;
    }
  }
}

declare global {
  interface Window {
    H: typeof H;
  }
}

export = H;
export as namespace H;
