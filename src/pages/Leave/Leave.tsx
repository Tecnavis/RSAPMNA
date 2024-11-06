import React, { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore, updateDoc, doc } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './custom-calendar.css';

interface LeaveData {
  id: string;
  date: { seconds: number };
  createdAt: { seconds: number };
  driverName: string;
  driverId: string;
  userId: string;
}

interface DriverData {
  driverId: string;
  driverName: string;
}

const Leave: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveData[]>([]);
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveData | null>(null);
  const [updatedDate, setUpdatedDate] = useState<number>(0); 
  const [updatedDriverId, setUpdatedDriverId] = useState<string>('');
  const [updatedDriverName, setUpdatedDriverName] = useState<string>('');
  const db = getFirestore();
  const uid = sessionStorage.getItem('uid');
  
  // Fetch leave details function
  const fetchLeaveDetails = async () => {
    try {
      if (uid) {
        const querySnapshot = await getDocs(collection(db, `user/${uid}/DriverLeaves`));
        const leaveData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LeaveData[];
        setLeaves(leaveData);
      }
    } catch (error) {
      console.error('Error fetching leave details:', error);
    }
  };

  // Fetch driver details function
  const fetchDriverDetails = async () => {
    try {
      if (uid) {
        const querySnapshot = await getDocs(collection(db, `user/${uid}/driver`));
        const driverData = querySnapshot.docs.map((doc) => ({
          driverId: doc.id,
          driverName: doc.data().driverName,
        })) as DriverData[];
        setDrivers(driverData);
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  useEffect(() => {
    fetchLeaveDetails();
    fetchDriverDetails();
  }, [db, uid]);

  const leaveDatesMap: { [key: string]: string } = leaves.reduce((acc, leave) => {
    const leaveDate = new Date(leave.date.seconds * 1000).toDateString();
    acc[leaveDate] = leave.driverName;
    return acc;
  }, {} as { [key: string]: string });

  const tileClassName = ({ date, view }: { date: Date; view: string }): string | null => {
    if (view === 'month') {
      const isLeaveDay = leaveDatesMap.hasOwnProperty(date.toDateString());
      return isLeaveDay ? 'leave-day' : null;
    }
    return null;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && leaveDatesMap[date.toDateString()]) {
      return (
        <div className="tooltip">
          {leaveDatesMap[date.toDateString()]}
          <span className="tooltiptext">
            {leaveDatesMap[date.toDateString()]}
          </span>
        </div>
      );
    }
    return null;
  };

  const handleEdit = (leave: LeaveData) => {
    setSelectedLeave(leave);
  
    const leaveDate = new Date(leave.date.seconds * 1000);
    console.log("leaveDate",)
    setUpdatedDate(leaveDate.getTime() / 1000); 
    
    setUpdatedDriverId(leave.driverId);
    setUpdatedDriverName(leave.driverName);
  };

  const handleSaveEdit = async () => {
    if (selectedLeave) {
      try {
        const leaveRef = doc(db, `user/${uid}/DriverLeaves`, selectedLeave.id);
        await updateDoc(leaveRef, {
          driverName: updatedDriverName,
          driverId: updatedDriverId,
          date: updatedDate, 
        });
        setSelectedLeave(null); 
        setUpdatedDate(0); 
        setUpdatedDriverId('');
        setUpdatedDriverName('');
        fetchLeaveDetails();  // Now correctly calling fetchLeaveDetails
      } catch (error) {
        console.error('Error updating leave details:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Driver Leave Details</h2>
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
      </button>

      {showCalendar && (
        <div className="calendar-container mb-4">
          <Calendar tileClassName={tileClassName} tileContent={tileContent} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-800 text-gray">
              <th className="py-2 px-4 text-left">Created At</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Driver Name</th>
              <th className="py-2 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave.id} className="border-b hover:bg-gray-100">
                  <td className="py-2 px-4">
                    {new Date(leave.createdAt.seconds * 1000).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">
                    {new Date(leave.date.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">{leave.driverName}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleEdit(leave)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">No leave details available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLeave && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-100">
          <h3 className="text-xl font-bold mb-4">Edit Leave Details</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={new Date(updatedDate * 1000).toISOString().split('T')[0]} 
              onChange={(e) => setUpdatedDate(new Date(e.target.value).getTime() / 1000)} 
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Driver</label>
            <select
              value={updatedDriverId}
              onChange={(e) => {
                const driverId = e.target.value;
                setUpdatedDriverId(driverId);
                const selectedDriver = drivers.find(driver => driver.driverId === driverId);
                if (selectedDriver) {
                  setUpdatedDriverName(selectedDriver.driverName);
                }
              }}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a driver</option>
              {drivers.map(driver => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.driverName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default Leave;
