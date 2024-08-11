
// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import { useState } from "react";
// import DeckGL from "@deck.gl/react";
// import StaticMap from "react-map-gl";
// import maplibregl from "maplibre-gl";

// import "maplibre-gl/dist/maplibre-gl.css";


// function MyMapComponent() {
//   const [viewState, setViewState] = useState({
//     longitude: 76.2711,
//     latitude: 10.8505,
//     zoom: 8,
//   });

//   return (
//     <>
//       <div>
//         <DeckGL
           

//             style={{ position: 'relative', height: '50vh', width: '100%' }}
//           viewState={viewState}
//           onViewStateChange={({ viewState }) => setViewState(viewState)}
//           controller={true}
//           layers={[]}
//         >
//           <StaticMap
//             mapLib={maplibregl}
//             mapStyle="https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json"
//             transformRequest={(url, resourceType) => {
//               const apiKey = 'tS7PiwHTH37eyz3KmYaDJs1f7JJHi04CbWR3Yd4k';
//               if (url.includes('?')) {
//                 url = `${url}&api_key=${apiKey}`;
//               } else {
//                 url = `${url}?api_key=${apiKey}`;
//               }
//               return { url, resourceType };
//             }}
//           />
//         </DeckGL>
//       </div>
//     </>
//   )
// }

// export default MyMapComponent
import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { IconLayer } from '@deck.gl/layers';
import StaticMap from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function MyMapComponent({ baseLocation, onMapClick }) {
  const [viewState, setViewState] = useState({
    longitude: 76.2711,
    latitude: 10.8505,
    zoom: 8,
  });

  useEffect(() => {
    if (baseLocation) {
      setViewState({
        longitude: baseLocation.lng,
        latitude: baseLocation.lat,
        zoom: 12,
      });
    }
  }, [baseLocation]);

  const layers = baseLocation
    ? [
        new IconLayer({
          id: 'base-location-pin',
          data: [baseLocation],
          getIcon: () => ({
            url: 'https://docs.mapbox.com/help/demos/custom-markers-gl-js/mapbox-icon.png',
            width: 128,
            height: 128,
            anchorY: 128,
          }),
          getPosition: (d) => [d.lng, d.lat],
          getSize: 40,
        }),
      ]
    : [];

  return (
    <DeckGL
      style={{ position: 'relative', height: '50vh', width: '100%' }}
      viewState={viewState}
      onViewStateChange={({ viewState }) => setViewState(viewState)}
      controller={true}
      layers={layers}
      onClick={(event) => {
        if (onMapClick) {
          onMapClick(event.coordinate);
        }
      }}
    >
      <StaticMap
        mapLib={maplibregl}
        mapStyle="https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json"
        transformRequest={(url, resourceType) => {
          const apiKey = 'tS7PiwHTH37eyz3KmYaDJs1f7JJHi04CbWR3Yd4k';
          if (url.includes('?')) {
            url = `${url}&api_key=${apiKey}`;
          } else {
            url = `${url}?api_key=${apiKey}`;
          }
          return { url, resourceType };
        }}
      />
    </DeckGL>
  );
}

export default MyMapComponent;


