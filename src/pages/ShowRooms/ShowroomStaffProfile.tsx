import React, { useEffect, useState } from 'react';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { NavLink } from 'react-router-dom';

interface StaffData {
  id: string;
  designation: string;
  name: string;
  phoneNumber: string;
  showroomId: string;
  whatsappNumber: string;
}
interface ShowroomData {
    id: string;
    ShowRoom: string;
  }
const ShowroomStaffProfile: React.FC = () => {
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const showroomId = sessionStorage.getItem('showroomId');
  const [showroom, setShowroom] = useState<ShowroomData | null>(null);

  const staffId = sessionStorage.getItem('staffId');
  const uid = sessionStorage.getItem('uid');
  const db = getFirestore();

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffRef = collection(db, `user/${uid}/showroomStaff`);
        const querySnapshot = await getDocs(staffRef);
        // Find the staff document matching the staffId (or use the first document if not matching)
        const docData = querySnapshot.docs.find((doc) => doc.id === staffId)?.data() ||
                        querySnapshot.docs[0]?.data();
        if (docData) {
          setStaff({
            id: staffId || querySnapshot.docs[0].id,
            designation: docData.designation,
            name: docData.name,
            phoneNumber: docData.phoneNumber,
            showroomId: docData.showroomId,
            whatsappNumber: docData.whatsappNumber,
          });
        }
      } catch (error) {
        console.error('Error fetching staff profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [db, uid, staffId]);
  useEffect(() => {
    const fetchShowroom = async () => {
      if (!staff?.showroomId) return;
      try {
        const showroomRef = collection(db, `user/${uid}/showroom`);
        const q = query(showroomRef, where('id', '==', staff.showroomId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const showroomData = querySnapshot.docs[0].data() as ShowroomData;
          setShowroom(showroomData);
        }
      } catch (error) {
        console.error('Error fetching showroom data:', error);
      }
    };

    fetchShowroom();
  }, [db, uid, staff?.showroomId]);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
       {/* Navbar */}
                 <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-black text-white shadow-lg py-5 z-50">
         <div className="max-w-6xl mx-auto flex justify-between items-center px-6">
             <div className="text-2xl font-bold tracking-wide uppercase">
                 Showroom Dashboard
             </div>
             <ul className="flex space-x-8 text-lg font-medium">
                 <li>
                     <NavLink 
                         to="https://rsapmna-de966.web.app/showrooms/showroom/showroomDetails"
                         className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                     >
                         Home
                     </NavLink>
                 </li>
                 <li>
                     <NavLink 
                         to="/showroomstaffdashboard"
                         state={{ showroomId, staffId }}
                         className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                     >
                         Dashboard
                     </NavLink>
                 </li>
                 <li>
                     <NavLink 
                         to="/showroomstaffprofile"
                         className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                     >
                         Profile
                     </NavLink>
                 </li>
                 <li>
                     <NavLink 
                         to="/addbook"
                         className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                     >
                         Add Book
                     </NavLink>
                 </li>
                 <li>
                     <NavLink 
                         to="/showroomstaffreward"
                         className={({ isActive }) => `relative pb-2 transition-all duration-300 ${isActive ? 'text-yellow-400' : 'hover:text-yellow-400'}`}
                     >
                         Reward
                     </NavLink>
                 </li>
             </ul>
         </div>
     </nav>

      {/* Profile Card */}
      <div className="flex-grow flex justify-center items-center p-4 mt-32">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            {/* Profile Avatar */}
            <div className="w-24 h-24 bg-blue-500 rounded-full flex justify-center items-center text-white text-3xl font-bold">
              {staff?.name.charAt(0)}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-800">{staff?.name}</h2>
            <p className="text-gray-500">{staff?.designation}</p>
          </div>
          <div className="mt-6 space-y-4">
            {/* Phone Number */}
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l.4 2M7 5h2l.4 2M11 5h2l.4 2M15 5h2l.4 2M19 5h2l.4 2M3 10h2l.4 2M7 10h2l.4 2M11 10h2l.4 2M15 10h2l.4 2M19 10h2l.4 2" />
              </svg>
              <span className="text-gray-700">{staff?.phoneNumber}</span>
            </div>
            {/* WhatsApp Number */}
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 16v-6a2 2 0 00-2-2h-1V7a4 4 0 10-8 0v1H7a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2z" />
              </svg>
              <span className="text-gray-700">{staff?.whatsappNumber}</span>
            </div>
            {/* Showroom ID */}
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.84 6.188L12 21.5 5 16.766a12.083 12.083 0 01.84-6.188L12 14z" />
              </svg>
              <span className="text-gray-700">
                {showroom ? showroom.ShowRoom : `Showroom ID: ${staff?.showroomId}`}
              </span>            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowroomStaffProfile;
