import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, getFirestore, updateDoc, doc, Timestamp } from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './custom-calendar.css';
import IconPrinter from '../../components/Icon/IconPrinter';
import IconMenuCalendar from '../../components/Icon/Menu/IconMenuCalendar';

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
  const [filteredLeaves, setFilteredLeaves] = useState<LeaveData[]>([]);

  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveData | null>(null);
  const [updatedDate, setUpdatedDate] = useState<number>(0); 
  const [updatedDriverId, setUpdatedDriverId] = useState<string>('');
  const [updatedDriverName, setUpdatedDriverName] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(''); 
  const [selectedMonth, setSelectedMonth] = useState<string>(''); 
  const leaveRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState<string>(''); // Add search term state
  const timestamp = 1731283200000;
  const date = new Date(timestamp);
  console.log("UTC time:", date.toISOString());  // This gives you the UTC time
  // This will give you the full date in local time.

  const db = getFirestore();
  const uid = sessionStorage.getItem('uid');
  
  const formatTimestamp = (seconds: number) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Use 12-hour format with AM/PM
      timeZoneName: 'short', // Optional, include the time zone if needed
    };
   // Format the date and convert 'am'/'pm' to 'AM'/'PM'
   const formattedDate = new Date(seconds * 1000).toLocaleString('en-IN', options);
   return formattedDate.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
 };
  
  
  const fetchLeaveDetails = async () => {
    try {
      if (uid) {
        const querySnapshot = await getDocs(collection(db, `user/${uid}/DriverLeaves`));
        const leaveData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as LeaveData[];
          // Sort the leave data by `createdAt` in descending order
          const sortedLeaves = leaveData.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
    
          setLeaves(sortedLeaves);
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
  useEffect(() => {
    const filtered = leaves
      .filter((leave) => {
        const leaveDate = new Date(leave.date.seconds * 1000);
        const leaveYear = leaveDate.getFullYear().toString();
        const leaveMonth = (leaveDate.getMonth() + 1).toString().padStart(2, '0');
        
        const matchesSearchTerm =
          leave.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          leaveDate.toLocaleDateString().includes(searchTerm);
  
        return (
          (selectedYear === '' || leaveYear === selectedYear) &&
          (selectedMonth === '' || leaveMonth === selectedMonth) &&
          matchesSearchTerm
        );
      })
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  
    setFilteredLeaves(filtered);
  }, [leaves, selectedYear, selectedMonth, searchTerm]);
  


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
        
        // Convert updatedDate to Firestore Timestamp (seconds)
        const timestamp = Timestamp.fromMillis(updatedDate * 1000);
  
        await updateDoc(leaveRef, {
          driverName: updatedDriverName,
          driverId: updatedDriverId,
          date: timestamp,  // Save the Firestore Timestamp here
        });
  
        // Reset states after update
        setSelectedLeave(null);
        setUpdatedDate(0);
        setUpdatedDriverId('');
        setUpdatedDriverName('');
        fetchLeaveDetails();  // Refresh the leave details
      } catch (error) {
        console.error('Error updating leave details:', error);
      }
    }
  };
  const handlePrint = () => {
    const printContent = leaveRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    }
};
// ------------------------------------
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Driver Leave Details</h2>
      <div className="mb-4 flex space-x-4">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">Select Year</option>
          <option value="2023">2023</option>
          <option value="2024">2024</option>
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">Select Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <input
          type="text"
          placeholder="Search by Driver Name or Date..."
          className="px-4 py-2 border rounded"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-4 mb-4"> {/* Container with flex and spacing */}
  <button
    onClick={() => setShowCalendar(!showCalendar)}
    className="p-2 rounded-full bg-gray-500 text-white hover:bg-blue-600"
  >
    <IconMenuCalendar />
  </button>

  <button
    type="button"
    className="p-2 rounded-full bg-gray-500 text-white hover:bg-blue-600"
    onClick={handlePrint}
    aria-label="Print"
  >
    <IconPrinter />
  </button>
</div>

{showCalendar && (
  <div className="calendar-container mb-4">
    <Calendar tileClassName={tileClassName} tileContent={tileContent} />
  </div>
)}

                <br />
      <div className="overflow-x-auto" ref={leaveRef}>
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-800 text-gray">
              <th className="py-2 px-4 text-left">Leave Applied Date</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Driver Name</th>
              <th className="py-2 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <tr key={leave.id} className="border-b hover:bg-gray-100">
                               <td className="py-2 px-4">{formatTimestamp(leave.createdAt.seconds)}</td>
                               <td className="py-2 px-4">{formatTimestamp(leave.date.seconds)}</td>

                  <td className="py-2 px-4">{leave.driverName}</td>
                 {/* -------------------------------------------------------------- */}
                 
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
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/2">
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
            <div className="flex justify-end">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedLeave(null)}
                className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
