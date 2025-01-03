import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import {
  memo, useCallback, useEffect, useState,
} from 'react';
import ActionButton from './ActionButton';

const defaultLocation = {
  lat: -37.8136,
  lng: 144.9631,
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const polylineOptions = {
  strokeColor: '#FF0000',
  strokeWeight: 2,
};
const polygonOptions = {
  strokeColor: '#FF0000',
  strokeWeight: 2,
  fillColor: 'yellow',
  fillOpacity: 0.3,
};

const libraries = ['marker', 'places', 'drawing'];

function Map() {
  const [center, setCenter] = useState(defaultLocation);
  const [marker, setMarker] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [isMarkMode, setIsMarkMode] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'map1',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    language: 'en',
    libraries,
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const browserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(browserLocation);
          if (marker) {
            marker.position = browserLocation;
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          console.log('use default center location');
          setCenter(defaultLocation);
        },
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
      setCenter(defaultLocation);
    }
  }, []);

  // when user select allow user location, update marker according to the browser location
  useEffect(() => {
    if (marker) {
      marker.position = center;
    }
  }, [center]);

  const handleMapClick = useCallback(
    (e) => {
      if (!isMarkMode) return;
      const newPosition = e.latLng;
      if (marker) {
        marker.position = newPosition;
      }
      setIsMarkMode(false);
    },
    [isMarkMode],
  );

  const createMarker = (mapInstance) => {
    const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapInstance,
      position: center,
      title: 'my location',
    });
    setMarker(newMarker);
  };

  const createDrawingManager = (mapInstance) => {
    const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.POLYLINE,
          window.google.maps.drawing.OverlayType.POLYGON,
        ],
      },
      polylineOptions,
      polygonOptions,
    });

    drawingManagerInstance.setMap(mapInstance);
    setDrawingManager(drawingManagerInstance);

    window.google.maps.event.addListener(
      drawingManagerInstance,
      'overlaycomplete',
      (event) => {
        const shape = event.overlay;
        setShapes((prev) => [...prev, shape]);
        drawingManagerInstance.setDrawingMode(null);
      },
    );
  };

  const onLoad = useCallback(
    (mapInstance) => {
      createMarker(mapInstance);
      createDrawingManager(mapInstance);
    },
    [center],
  );

  const onUnmount = useCallback(() => {
    if (marker) {
      marker.setMap(null);
    }
    if (drawingManager) {
      drawingManager.setMap(null);
    }
    shapes.forEach((shape) => shape.setMap(null));
  }, [marker, drawingManager, shapes]);

  const startDrawingLine = () => {
    setIsMarkMode(false);
    if (drawingManager) {
      drawingManager.setDrawingMode(
        window.google.maps.drawing.OverlayType.POLYLINE,
      );
    }
  };

  const startDrawingPolygon = () => {
    setIsMarkMode(false);
    if (drawingManager) {
      drawingManager.setDrawingMode(
        window.google.maps.drawing.OverlayType.POLYGON,
      );
    }
  };

  const clearDrawings = () => {
    shapes.forEach((shape) => shape.setMap(null));
    setShapes([]);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  };

  const startMarkMode = useCallback(() => {
    setIsMarkMode(true);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  }, [drawingManager]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className='relative h-full w-full'>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID,
          draggableCursor: isMarkMode ? 'crosshair' : 'grab',
        }}
      />
      <div className='absolute bottom-16 left-4 flex'>
        <ActionButton
          onClick={startMarkMode}
          disabled={isMarkMode}
          className={
            isMarkMode ? 'bg-lime-600' : 'bg-lime-500 hover:bg-lime-600'
          }
        >
          {isMarkMode ? 'Click on map' : 'Mark'}
        </ActionButton>
      </div>
      <div className='absolute bottom-4 left-4 flex gap-2'>
        <ActionButton
          onClick={startDrawingLine}
          className='bg-blue-500 hover:bg-blue-600'
        >
          Draw Line
        </ActionButton>
        <ActionButton
          onClick={startDrawingPolygon}
          className='bg-green-500 hover:bg-green-600'
        >
          Draw Polygon
        </ActionButton>
        <ActionButton
          onClick={clearDrawings}
          className='bg-red-500 hover:bg-red-600'
        >
          Clear
        </ActionButton>
      </div>
    </div>
  );
}

export default memo(Map);
