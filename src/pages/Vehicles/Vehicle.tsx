import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  getFirestore,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
import "./Vehicle.css";
import { TextField } from "@mui/material";

interface VehicleData {
  id?: string;
  vehicleName: string;
  serviceVehicle: string;
  serviceKM: string;
  totalOdometer: number;
}

const Vehicle: React.FC = () => {
  const db = getFirestore();
  const uid = sessionStorage.getItem("uid");
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [formData, setFormData] = useState<VehicleData>({
    vehicleName: "",
    serviceVehicle: "",
    serviceKM: "",
    totalOdometer: 0,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search state

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!uid) return;
  
      const vehicleRef = collection(db, `user/${uid}/vehicle`);
      const snapshot = await getDocs(vehicleRef);
  
      const vehicleData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const vehicle = { id: docSnapshot.id, ...(docSnapshot.data() as VehicleData) };
  
          const bookingsRef = collection(db, `user/${uid}/bookings`);
          const bookingsQuery = query(bookingsRef, where("serviceVehicle", "==", vehicle.serviceVehicle));
          const bookingsSnapshot = await getDocs(bookingsQuery);
  
          // Calculate totalOdometer from booking data
          const totalOdometer = bookingsSnapshot.docs.reduce((sum, bookingDoc) => {
            const bookingData = bookingDoc.data();
            return sum + Number(bookingData.totalDriverDistance || 0);
          }, 0);
  
          console.log("Total Odometer for", vehicle.serviceVehicle, ":", totalOdometer);
  
          // Update Firestore if totalOdometer changes
          if (totalOdometer !== vehicle.totalOdometer) {
            const vehicleDocRef = doc(db, `user/${uid}/vehicle`, vehicle.id);
            await updateDoc(vehicleDocRef, { totalOdometer });
          }
  
          return { ...vehicle, totalOdometer };
        })
      );
  
      setVehicles(vehicleData);
    };
  
    fetchVehicles();
  }, [db, uid]);
  

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formattedData = { ...formData } as Record<string, any>;

    if (editId) {
      const vehicleRef = doc(db, `user/${uid}/vehicle`, editId);
      await updateDoc(vehicleRef, formattedData);
      setEditId(null);
    } else {
      const vehicleRef = collection(db, `user/${uid}/vehicle`);
      await addDoc(vehicleRef, formData);
    }
    setFormData({ vehicleName: "", serviceVehicle: "", serviceKM: "", totalOdometer: 0 });
    const vehicleRef = collection(db, `user/${uid}/vehicle`);
    const snapshot = await getDocs(vehicleRef);
    const vehicleData = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as VehicleData) }));
    setVehicles(vehicleData);
  };

  const handleEdit = (vehicle: VehicleData) => {
    setEditId(vehicle.id || null);
    setFormData(vehicle);
  };
  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.serviceVehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className="vehicle-container">
<div className="vehicle-container">
  <h2 className="vehicle-heading">🚗 Manage Vehicles</h2>
</div> 
  
  <form onSubmit={handleSubmit} className="vehicle-form">
        <label>
          Vehicle Name:
          <input
            type="text"
            name="vehicleName"
            value={formData.vehicleName}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Vehicle Number:
          <input
            type="text"
            name="serviceVehicle"
            value={formData.serviceVehicle}
            onChange={handleInputChange}
            required
          />
        </label>
        <label>
          Service KM:
          <input
            type="text"
            name="serviceKM"
            value={formData.serviceKM}
            onChange={handleInputChange}
            required
          />
        </label>
      
        <button type="submit">{editId ? "Update Vehicle" : "Add Vehicle"}</button>
      </form>

      <div className="vehicle-container">
  <h3 className="vehicle-list-heading">📋 Vehicle List</h3>
</div>    

       <div className='mt-2'>
                  <TextField
                  label="Search Vehicles..."
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={handleSearchChange}
                  sx={{ marginBottom: 2 }}
              />
              </div>
  <table className="vehicle-table">
<thead>
  <tr>
    <th>#</th> {/* Added index column */}
    <th>Vehicle Name</th>
    <th>Vehicle Number</th>
    <th>Service KM</th>
    <th>Total Runned KM</th>
    <th>Actions</th>
  </tr>
</thead>
<tbody>
  {filteredVehicles.map((vehicle, index) => (
    <tr key={vehicle.id}>
      <td>{index + 1}</td> {/* Display the index */}
      <td>{vehicle.vehicleName}</td>
      <td>{vehicle.serviceVehicle}</td>
      <td>{vehicle.serviceKM}</td>
      <td>{vehicle.totalOdometer}</td>
      <td>
        <button onClick={() => handleEdit(vehicle)}>Edit</button>
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
};

export default Vehicle;
