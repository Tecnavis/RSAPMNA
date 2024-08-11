import { useState } from "react";
import DeckGL from "@deck.gl/react";
import StaticMap from "react-map-gl";
import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

function Map() {
    const [viewState, setViewState] = useState({
        longitude: 76.2711,
        latitude: 10.8505,
        zoom: 8,
    });

    return (
        <div>
            <DeckGL
                style={{ position: 'relative', height: '50vh', width: '100%'}}
                viewState={viewState}
                onViewStateChange={({ viewState }) => setViewState(viewState)}
                controller={true}
                layers={[]}
            >
                <StaticMap
                    mapLib={maplibregl}
                    mapStyle="https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json"
                    onError={(e) => console.error('Map error:', e)}
                    transformRequest={(url, resourceType) => {
                        const apiKey = import.meta.env.VITE_REACT_APP_API_KEY;
                        if (url.includes('?')) {
                            url = `${url}&api_key=${apiKey}`;
                        } else {
                            url = `${url}?api_key=${apiKey}`;
                        }
                        return { url, resourceType };
                    }}
                />
            </DeckGL>
        </div>
    );
}

export default Map;
