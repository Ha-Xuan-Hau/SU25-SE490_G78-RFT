declare namespace H {
  namespace service {
    class Platform {
      constructor(options: { apikey: string });
      createDefaultLayers(): any;
    }
    class RoutingService {
      constructor(options: { apikey: string });
      calculateRoute(params: any, callback: Function): void;
    }
  }

  namespace map {
    class Map {
      constructor(element: HTMLElement, layer: any, options?: any);
      removeObjects(objects: any[]): void;
      addObjects(objects: any[]): void;
      addObject(object: any): void;
      getObjects(): any[];
      getViewModel(): any;
      getViewPort(): any;
    }
    class Marker {
      constructor(coords: { lat: number; lng: number });
    }
    class Polyline {
      constructor(lineString: any, options?: any);
      getBoundingBox(): any;
    }
  }

  namespace mapevents {
    class Behavior {
      constructor(events: MapEvents);
    }
    class MapEvents {
      constructor(map: map.Map);
    }
  }

  namespace ui {
    class UI {
      static createDefault(map: map.Map, layers: any): any;
    }
  }

  namespace geo {
    class LineString {
      constructor();
      pushPoint(point: { lat: number; lng: number }): void;
      static fromFlexiblePolyline(polyline: string): LineString;
    }
  }
}