// MapComponent.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


interface MapComponentProps {
  lat: number;
  lon: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ lat, lon}) => {

  return (
    <MapContainer center={[lat, lon]} zoom={15} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]}>
        <Popup>
          Here is your pin!
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
