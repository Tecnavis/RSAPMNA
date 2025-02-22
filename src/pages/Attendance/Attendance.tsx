import React, { useEffect, useState } from 'react';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { FaCheckCircle } from 'react-icons/fa';

const Attendance = () => {
  const uid = sessionStorage.getItem('uid') || '';
  const role = sessionStorage.getItem('role') || '';
  const staffRole = sessionStorage.getItem('staffRole') || '';
  const [staffProfiles, setStaffProfiles] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: any[] }>({});

  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkedInStaff, setCheckedInStaff] = useState<{ [key: string]: boolean }>({}); // Tracks check-in status
  const db = getFirestore();

  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!uid || !role || !staffRole) return;
      try {
        const q = query(
          collection(db, `user/${uid}/users`),
          where("role", "==", role),
          where("staffRole", "==", staffRole)
        );
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStaffProfiles(usersData);
      } catch (error) {
        console.error("Error fetching staff details:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchStaffDetails();
  }, [uid, role, staffRole, db]);
  
  useEffect(() => {
    if (staffProfiles.length === 0) return; // Ensure staffProfiles is available before fetching attendance
  
    const unsubscribeList: (() => void)[] = []; // Store unsubscribe functions
  
    const fetchAttendanceRecords = () => {
      const records: { [key: string]: any[] } = {};
      const attendanceStatus: { [key: string]: boolean } = {};
  
      for (const user of staffProfiles) {
        const attendanceQuery = query(
          collection(db, `user/${uid}/users/${user.id}/attendance`)
        );
  
        const unsubscribe = onSnapshot(attendanceQuery, (attendanceSnapshot) => {
          records[user.id] = attendanceSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
  
          attendanceStatus[user.id] = attendanceSnapshot.docs.some(doc => !doc.data().checkOutTime);
  
          setAttendanceRecords({ ...records }); // Update state
          setCheckedInStaff({ ...attendanceStatus }); // Update state
        });
  
        unsubscribeList.push(unsubscribe); // Store unsubscribe function
      }
    };
  
    fetchAttendanceRecords();
  
    return () => {
      unsubscribeList.forEach(unsub => unsub()); // Unsubscribe when component unmounts
    };
  }, [staffProfiles, uid, db]);
  
  

  const handleCheckIn = async (staffId: string) => {
    if (!uid || !staffId) return;
    setCheckingInId(staffId);
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = await getLocationName(latitude, longitude);

        const checkInData = {
            staffId, // Add staffId here

          checkInTime: new Date().toISOString(),
          latitude,
          longitude,
          location: locationName, // Store the address

          checkOutTime: null, // Ensures check-out is pending
        };
  
        try {
          const attendanceRef = collection(db, `user/${uid}/users/${staffId}/attendance`);
          await setDoc(doc(attendanceRef), checkInData); // Creates a new entry
          setCheckedInStaff((prev) => ({ ...prev, [staffId]: true }));
          alert("Check-in successful!");
        } catch (error) {
          console.error("Error saving attendance:", error);
          alert("Failed to check in.");
        } finally {
          setCheckingInId(null);
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Failed to get location.");
        setCheckingInId(null);
      }
    );
  };
  
  const handleCheckOut = async (staffId: string) => {
    if (!uid || !staffId) return;
    setCheckingInId(staffId);
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const checkOutData = {
          checkOutTime: new Date().toISOString(),
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
        };
  
        try {
          const attendanceQuery = query(
            collection(db, `user/${uid}/users/${staffId}/attendance`),
            where("checkOutTime", "==", null) // Find the most recent check-in without a checkout
          );
          const querySnapshot = await getDocs(attendanceQuery);
  
          if (!querySnapshot.empty) {
            const latestDoc = querySnapshot.docs[0]; // Get the first (latest) check-in without check-out
            const docRef = doc(db, `user/${uid}/users/${staffId}/attendance`, latestDoc.id);
            await updateDoc(docRef, checkOutData);
            setCheckedInStaff((prev) => ({ ...prev, [staffId]: false }));
            alert("Check-out successful!");
          } else {
            alert("No active check-in found for this staff.");
          }
        } catch (error) {
          console.error("Error updating attendance:", error);
          alert("Failed to check out.");
        } finally {
          setCheckingInId(null);
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Failed to get location.");
        setCheckingInId(null);
      }
    );
  };
  const getLocationName = async (latitude: number, longitude: number) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") {
        const address = data.results[0].formatted_address;
        console.log("Location:", address);
        return address;
      } else {
        console.error("Geocoding API error:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      return null;
    }
  };
  
// --------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Attendance</h2>

      {loading ? (
        <p className="text-gray-600 text-lg items-center">Loading staff profiles...</p>
      ) : staffProfiles.length > 0 ? (
<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-1 gap-6 w-full max-w-6xl mx-auto justify-center">
{staffProfiles.map((staff) => (
            <div
              key={staff.id}
              className="bg-white/80 backdrop-blur-lg shadow-lg rounded-xl p-6 flex flex-col items-center transition-transform transform hover:scale-105"
            >
              {/* Profile Avatar */}
              <div className="w-16 h-16 flex items-center justify-center bg-blue-500 text-white rounded-full text-xl font-bold mb-4">
                {staff.name.charAt(0)}
              </div>

              {/* Staff Details */}
              <h3 className="text-xl font-semibold text-gray-700">{staff.name}</h3>
              <p className="text-gray-600"><strong>Email:</strong> {staff.email}</p>
              <p className="text-gray-600"><strong>Phone:</strong> {staff.phone_number}</p>
              <p className="text-gray-600"><strong>Role:</strong> {staff.role}</p>
              <p className="text-gray-600"><strong>Staff Role:</strong> {staff.staffRole}</p>
              <p className="text-gray-600"><strong>Address:</strong> {staff.address}</p>

              {checkedInStaff[staff.id] ? (
  <button
    className="mt-4 px-6 py-3 text-white font-semibold bg-green-500 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105 hover:bg-green-700"
    onClick={() => handleCheckOut(staff.id)}
    disabled={checkingInId === staff.id}
  >
    {checkingInId === staff.id ? "Checking Out..." : "Check Out"} <FaCheckCircle />
  </button>
) : (
  <button
    className="mt-4 px-6 py-3 text-white font-semibold bg-blue-500 rounded-lg shadow-md flex items-center gap-2 transition-transform transform hover:scale-105 hover:bg-blue-700"
    onClick={() => handleCheckIn(staff.id)}
    disabled={checkingInId === staff.id}
  >
    {checkingInId === staff.id ? "Checking In..." : "Check In"} <FaCheckCircle />
  </button>
)}


            </div>
          ))}
        </div>
      ) : (
        <p className="text-lg text-gray-700">No staff profile found.</p>
      )}
       <h2 className="text-3xl font-bold text-gray-800 mb-6 mt-4">Attendance Records</h2>

{loading ? (
  <p className="text-gray-600 text-lg">Loading staff profiles...</p>
) : (
  <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6 ">
    <table className="min-w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="border border-gray-300 px-4 py-2">Staff Name</th>
          <th className="border border-gray-300 px-4 py-2">Check-in Time</th>
          <th className="border border-gray-300 px-4 py-2">Check-in Location</th>
          <th className="border border-gray-300 px-4 py-2">Check-out Time</th>
          <th className="border border-gray-300 px-4 py-2">Check-out Location</th>
        </tr>
      </thead>
      <tbody>
      {staffProfiles.map((staff:any) => (
          attendanceRecords[staff.id]?.map((record) => (
            <tr key={record.id} className="border border-gray-300">
              <td className="border border-gray-300 px-4 py-2">{staff.name}</td>
              <td className="border border-gray-300 px-4 py-2">{record.checkInTime || 'N/A'}</td>
              <td className="border border-gray-300 px-4 py-2">{record.latitude}, {record.longitude}</td>
              <td className="border border-gray-300 px-4 py-2">{record.checkOutTime || 'Pending'}</td>
              <td className="border border-gray-300 px-4 py-2">{record.checkOutLatitude ? `${record.checkOutLatitude}, ${record.checkOutLongitude}` : 'N/A'}</td>
            </tr>
          ))
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
};

export default Attendance;
