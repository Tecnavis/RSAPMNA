import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, onSnapshot, setDoc } from "firebase/firestore";
import IconPrinter from "../../components/Icon/IconPrinter";
import { FaCheckCircle } from "react-icons/fa";
import './Attendance.css'
const AttendanceDetails = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const uid = sessionStorage.getItem("uid") || "";
  const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [groupedAttendance, setGroupedAttendance] = useState<Record<string, any[]>>({});
  const [staffProfiles, setStaffProfiles] = useState<any[]>([]);
  const [checkedInStaff, setCheckedInStaff] = useState<{ [key: string]: boolean }>({});
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
//  ---------------------------------------------------------
const [selectedStaff, setSelectedStaff] = useState<any>(null);
const [staffAttendance, setStaffAttendance] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const q = query(collection(db, `user/${uid}/users`));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setStaffProfiles(usersData);
      } catch (error) {
        console.error("Error fetching staff details:", error);
      }
    };

    fetchStaffDetails();
  }, [uid, db]);
  useEffect(() => {
    const fetchAttendanceDetails = async () => {
      if (!uid) return;
      const db = getFirestore();
      try {
        const usersRef = collection(db, `user/${uid}/users`);
        const usersSnapshot = await getDocs(usersRef);
        let allAttendanceRecords: any[] = [];

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const attendanceRef = collection(db, `user/${uid}/users/${userId}/attendance`);
          const attendanceSnapshot = await getDocs(attendanceRef);

          attendanceSnapshot.forEach((doc) => {
            allAttendanceRecords.push({
              userId,
              userName: userDoc.data().name || "Unknown",
              ...doc.data(),
            });
          });
        }

        // Sort by checkInTime in descending order (latest first)
        allAttendanceRecords.sort((a, b) => {
          const dateA = a.checkInTime?.seconds ? new Date(a.checkInTime.seconds * 1000) : new Date(a.checkInTime);
          const dateB = b.checkInTime?.seconds ? new Date(b.checkInTime.seconds * 1000) : new Date(b.checkInTime);
          return dateB.getTime() - dateA.getTime(); // Latest first
        });

        setAttendanceData(allAttendanceRecords);
        setFilteredData(allAttendanceRecords);
      } catch (error) {
        console.error("Error fetching attendance details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceDetails();
  }, [uid]);

  
  const handlePrint = () => {
    window.print();
  };
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    if (typeof timestamp === "string") return timestamp.split("T")[0]; // Handle string timestamps
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
  };
  

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "N/A";

    let date;
    if (typeof timestamp === "object" && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  };
  const groupAttendanceByDate = (records: any[]) => {
    return records.reduce((acc: Record<string, any[]>, record) => {
      const dateKey = formatDate(record.checkInTime); // Extract date in "YYYY-MM-DD" format
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {});
  };
  
  useEffect(() => {
    if (attendanceData.length > 0) {
      setGroupedAttendance(groupAttendanceByDate(attendanceData));
    }
  }, [attendanceData]);
  // Fetch Attendance Status
  useEffect(() => {
    if (staffProfiles.length === 0) return;
    const unsubscribeList: (() => void)[] = [];

    staffProfiles.forEach((staff) => {
      const attendanceQuery = query(collection(db, `user/${uid}/users/${staff.id}/attendance`));

      const unsubscribe = onSnapshot(attendanceQuery, (attendanceSnapshot) => {
        const hasActiveCheckIn = attendanceSnapshot.docs.some((doc) => !doc.data().checkOutTime);
        setCheckedInStaff((prev) => ({ ...prev, [staff.id]: hasActiveCheckIn }));
      });

      unsubscribeList.push(unsubscribe);
    });

    return () => unsubscribeList.forEach((unsub) => unsub());
  }, [staffProfiles, uid, db]);

  // Check-In Handler
  const handleCheckIn = async (staffId: string) => {
    if (!uid || !staffId) return;
    setCheckingInId(staffId);

    try {
      const checkInData = {
        staffId, // Store staffId in Firestore

        checkInTime: new Date().toISOString(),
        checkOutTime: null, // Ensures check-out is pending
      };

      const attendanceRef = collection(db, `user/${uid}/users/${staffId}/attendance`);
      await setDoc(doc(attendanceRef), checkInData);
      setCheckedInStaff((prev) => ({ ...prev, [staffId]: true }));
      alert("Check-in successful!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to check in.");
    } finally {
      setCheckingInId(null);
    }
  };

  // Check-Out Handler
  const handleCheckOut = async (staffId: string) => {
    if (!uid || !staffId) return;
    setCheckingInId(staffId);

    try {
      const attendanceQuery = query(
        collection(db, `user/${uid}/users/${staffId}/attendance`),
        where("checkOutTime", "==", null) // Find the latest check-in without a check-out
      );
      const querySnapshot = await getDocs(attendanceQuery);

      if (!querySnapshot.empty) {
        const latestDoc = querySnapshot.docs[0]; // Get the first (latest) check-in without check-out
        const docRef = doc(db, `user/${uid}/users/${staffId}/attendance`, latestDoc.id);
        await updateDoc(docRef, { checkOutTime: new Date().toISOString() });

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
  };
  const handleGridClick = (staff: any) => {
    setSelectedStaff(staff);
  
    // Filter attendance data for the selected staff
    const filteredAttendance = attendanceData.filter((record) => record.userId === staff.id);
  
    // Group by month
    const groupedByMonth = filteredAttendance.reduce((acc: Record<string, any[]>, record) => {
        // Check if record.checkInTime is a Firestore Timestamp or a string
        const date =
          typeof record.checkInTime === "string"
            ? new Date(record.checkInTime)
            : record.checkInTime.seconds
            ? new Date(record.checkInTime.seconds * 1000)
            : new Date(record.checkInTime);
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // Format YYYY-MM
      
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(record);
        return acc;
      }, {});
      
    setStaffAttendance(groupedByMonth);
  };
  const [selectedMonth, setSelectedMonth] = useState(""); // State for selected month

const handleMonthChange = (event:any) => {
  setSelectedMonth(event.target.value);
};

// Filter records based on selected month
const filteredAttendance = selectedMonth
  ? Object.entries(staffAttendance).filter(([month]) => month === selectedMonth)
  : Object.entries(staffAttendance);
  const formatMonth = (date:any) => {
    if (!date) return "Invalid Date"; // Prevent NaN-NaN
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // Format YYYY-MM
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Attendance Records</h2>

     

<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto print:hidden">
  {staffProfiles.map((staff) => (
    <div
  key={staff.id}
  className="bg-white shadow-md rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition"
  onClick={() => handleGridClick(staff)}
>      <h3 className="text-lg font-semibold">{staff.name}</h3>
      <p className="text-gray-600">{staff.email}</p>

      {checkedInStaff[staff.id] ? (
        <button
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition"
          onClick={() => handleCheckOut(staff.id)}
          disabled={checkingInId === staff.id}
        >
          {checkingInId === staff.id ? "Checking Out..." : "Check Out"} <FaCheckCircle />
        </button>
      ) : (
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
          onClick={() => handleCheckIn(staff.id)}
          disabled={checkingInId === staff.id}
        >
          {checkingInId === staff.id ? "Checking In..." : "Check In"} <FaCheckCircle />
        </button>
      )}
    </div>
  ))}
</div>

{selectedStaff && (
  <div className="mt-6 p-4 bg-white shadow-md rounded-lg w-full max-w-4xl">
    <h2 className="text-xl font-semibold mb-4">Attendance for {selectedStaff.name}</h2>
{/* ------------------- */}
<div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
  <label className="mr-3 font-semibold text-gray-700">Filter by Month:</label>
  <select
    value={selectedMonth}
    onChange={handleMonthChange}
    className="px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">All Months</option>
    {Object.keys(staffAttendance).map((month) => (
      <option key={month} value={month}>
        {month}
      </option>
    ))}
  </select>


<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Check-In</th>
      <th>Check-Out</th>
    </tr>
  </thead>
  <tbody>
    {filteredAttendance.length > 0 ? (
      filteredAttendance.flatMap(([month, records]) =>
        records.map((record, index) => (
          <tr key={index}>
            <td>{formatDate(record.checkInTime)}</td>
            <td>{formatDateTime(record.checkInTime)}</td>
            <td>{record.checkOutTime ? formatDateTime(record.checkOutTime) : "N/A"}</td>
          </tr>
        ))
      )
    ) : (
      <tr>
        <td colSpan={3}>No attendance records found for the selected month.</td>
      </tr>
    )}
  </tbody>
</table>

        </div>
  
  </div>
)}
 <button
  onClick={handlePrint}
  className="p-2 mt-12 text-black rounded flex items-center gap-2 hover:bg-gray-300 transition duration-200 fixed left-4 top-4 print:hidden"
>
  <span className="p-2 bg-blue-600 text-white rounded-full flex items-center justify-center">
    <IconPrinter className="w-5 h-5" />
  </span>
  Print
</button>

      {loading ? (
  <p className="text-gray-600 text-lg">Loading attendance details...</p>
) : Object.keys(groupedAttendance).length > 0 ? (
  <div className="w-full max-w-6xl overflow-x-auto">
    {Object.entries(groupedAttendance).map(([date, records]) => (
      <div key={date} className="mb-6">
        <h3 className="text-xl font-bold text-gray-700 bg-gray-200 p-2 rounded">{date}</h3>
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md mt-2">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-left">
              <th className="py-2 px-4 border-b">User Name</th>
              <th className="py-2 px-4 border-b">Check-In Time</th>
              <th className="py-2 px-4 border-b">Check-Out Time</th>
              <th className="py-2 px-4 border-b">Location</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className="border-b hover:bg-gray-100">
                <td className="py-2 px-4">{record.userName}</td>
                <td className="py-2 px-4">{formatDateTime(record.checkInTime)}</td>
                <td className="py-2 px-4">
                  {record.checkOutTime ? formatDateTime(record.checkOutTime) : <span className="text-red-600 font-semibold">Pending</span>}
                </td>
                <td className="py-2 px-4">
                  {record.latitude && record.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {record.latitude}, {record.longitude}
                    </a>
                  ) : (
                    "Admin Check"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
) : (
  <p className="text-lg text-gray-700">No attendance records found.</p>
)}


    </div>
  );
};

export default AttendanceDetails;
