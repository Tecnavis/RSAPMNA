import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import ReactApexChart from 'react-apexcharts';
import { getFirestore, collection, onSnapshot, Timestamp, updateDoc, doc } from 'firebase/firestore';
import './Index.css';
import { format } from 'date-fns'; // You can use date-fns to format the current date.
import IndexModal from "./IndexModal"; // Import your modal

const Index = () => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass === 'rtl');
    const db = getFirestore();
    const navigate = useNavigate(); // Initialize useNavigate

    const uid = sessionStorage.getItem('uid');
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    // -------------------------------------------------------------------
    const [notifications, setNotifications] = useState<
    { id: string; message: string; field: "taxDue" | "insuranceDue" | "pollutionDue" | "emiDue" }[]
  >([]);
  
  const [newNotifications, setNewNotifications] = useState<
  { message: string; id: string; field:  "vehicleServiceDue" }[]
>([]);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [selectedNotification, setSelectedNotification] = useState<{ id: string; field: "taxDue" | "insuranceDue" | "pollutionDue" | "emiDue" } | null>(null);

const staffRole = sessionStorage.getItem('staffRole');
console.log("staffRole",staffRole)
      const [dismissedIds, setDismissedIds] = useState<string[]>([]);
      const [dismissedStatus, setDismissedStatus] = useState<Record<string, boolean>>({}); 

    const [loading, setLoading] = useState(true);
    const [blink, setBlink] = useState(false); // New state for blinking
    const [salesByCategory, setSalesByCategory] = useState({
        series: [0, 0, 0, 0],
        options: { /* Initial chart options */ }
    });

    useEffect(() => {
        const fetchBookings = () => {
            const unsubscribe = onSnapshot(collection(db, `user/${uid}/bookings`), (querySnapshot) => {
                const bookings = querySnapshot.docs.map(doc => doc.data());

                const newBookingsShowRoom = bookings.filter(booking => booking.status === 'booking added' && booking.bookingStatus === 'ShowRoom Booking').length;
                const newBookingsOther = bookings.filter(booking => booking.status === 'booking added' && booking.bookingStatus !== 'ShowRoom Booking').length;
                const pendingBookings = bookings.filter(booking => [
                   'called to customer',
                    'Order Received',
                    'On the way to pickup location',
                    'Vehicle Picked',
                    'Vehicle Confirmed',
                    'To DropOff Location',
                    'On the way to dropoff location',
                    'Vehicle Dropped'
                ].includes(booking.status)).length;
                const completedBookings = bookings.filter(booking => booking.status === 'Order Completed').length;

                // Update the blinking state based on the ShowRoom bookings count
                setBlink(newBookingsShowRoom > 0);

                setSalesByCategory({
                    series: [newBookingsShowRoom, newBookingsOther, pendingBookings, completedBookings],
                    options: {
                        chart: {
                            type: 'donut',
                            height: 460,
                            fontFamily: 'Nunito, sans-serif',
                        },
                        dataLabels: {
                            enabled: false,
                        },
                        stroke: {
                            show: true,
                            width: 25,
                            colors: isDark ? '#0e1726' : '#fff',
                        },
                        colors: isDark ? ['#5c1ac3', '#e2a03f', '#e7515a', '#3182ce'] : ['#e2a03f', '#5c1ac3', '#e7515a', '#3182ce'],
                        legend: {
                            position: 'bottom',
                            horizontalAlign: 'center',
                            fontSize: '14px',
                            markers: {
                                width: 10,
                                height: 10,
                                offsetX: -2,
                            },
                            height: 50,
                            offsetY: 20,
                        },
                        plotOptions: {
                            pie: {
                                donut: {
                                    size: '65%',
                                    background: 'transparent',
                                    labels: {
                                        show: true,
                                        name: {
                                            show: true,
                                            fontSize: '29px',
                                            offsetY: -10,
                                        },
                                        value: {
                                            show: true,
                                            fontSize: '26px',
                                            color: isDark ? '#bfc9d4' : undefined,
                                            offsetY: 16,
                                            formatter: (val: any) => {
                                                return val;
                                            },
                                        },
                                        total: {
                                            show: true,
                                            label: 'Total',
                                            color: '#888ea8',
                                            fontSize: '29px',
                                            formatter: (w: any) => {
                                                return w.globals.seriesTotals.reduce(function (a: any, b: any) {
                                                    return a + b;
                                                }, 0);
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        labels: ['ShowRoom Booking', 'Other New Bookings', 'Pending Bookings', 'Completed Bookings'],
                        states: {
                            hover: {
                                filter: {
                                    type: 'none',
                                    value: 0.15,
                                },
                            },
                            active: {
                                filter: {
                                    type: 'none',
                                    value: 0.15,
                                },
                            },
                        },
                    }
                });
                setLoading(false);
            });

            return () => unsubscribe();
        };

        fetchBookings();
    }, [isDark, db]);
    useEffect(() => {
        const fetchVehicleData = () => {
            const unsubscribe = onSnapshot(collection(db, `user/${uid}/vehicle`), (querySnapshot) => {
                let notifications: { message: string; id: string; field: "vehicleServiceDue" }[] = [];
                let dismissedMap: Record<string, boolean> = {}; // Track dismissed statuses
    
                querySnapshot.forEach((docSnap) => {
                    const vehicle = docSnap.data();
                    const { totalOdometer, serviceKM, serviceVehicle, vehicleServiceDue, vehicleServiceDismissed } = vehicle;
                    const vehicleId = docSnap.id;
    
                    // Check if service is due
                    if (serviceKM > 0 && totalOdometer % serviceKM === 0 && totalOdometer !== 0) {
                        if (!vehicleServiceDue) {
                            updateDoc(doc(db, `user/${uid}/vehicle`, vehicleId), {
                                vehicleServiceDue: true,
                            }).catch(error => console.error("Error updating vehicle service status:", error));
                        }
    
                        // Add notification if not dismissed
                        if (vehicleServiceDue && !vehicleServiceDismissed) {
                            notifications.push({
                                message: `🚗 Vehicle ${serviceVehicle} is due for service. Odometer: ${totalOdometer} km.`,
                                id: vehicleId,
                                field: "vehicleServiceDue",
                            });
                        }
                    }
    
                    // Store dismissed status in state
                    dismissedMap[vehicleId] = vehicleServiceDismissed || false;
                });
    
                setNewNotifications(notifications);
                setDismissedStatus(dismissedMap); // Store dismissed status
            });
    
            return () => unsubscribe();
        };
    
        fetchVehicleData();
    }, [db, uid]);
    
    const handleClose = async (id: string, field:  "vehicleServiceDue") => {
        try {
            let updateData: any = {};
            if (field === "vehicleServiceDue") {
                updateData.vehicleServiceDismissed = true; // Dismiss vehicle service notification
            }
    
            await updateDoc(doc(db, `user/${uid}/vehicle`, id), updateData);
    
            // Remove notification from state
            setNewNotifications((prev) => prev.filter((note) => note.id !== id));
            setNotifications((prev) => prev.filter((note) => note.id !== id));
            setDismissedStatus((prev) => ({ ...prev, [id]: true }));
        } catch (error) {
            console.error("Error updating notification status:", error);
        }
    };
    
    
    
    useEffect(() => {
        const fetchTaxInsuranceData = () => {
            const unsubscribe = onSnapshot(collection(db, `user/${uid}/taxInsurance`), (querySnapshot) => {
                let notificationsList: { id: string; message: string; field: "taxDue" | "insuranceDue" | "pollutionDue" | "emiDue" }[] = [];
                let dismissedMap: Record<string, boolean> = {}; // Track dismissed statuses
    
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const docRef = doc(db, `user/${uid}/taxInsurance`, docSnap.id);
    
                    const currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
    
                    const fiveDaysBefore = new Date();
                    fiveDaysBefore.setDate(currentDate.getDate() + 7);
    
                    let updateData: any = {};
    
                    // Function to generate messages based on expiry date
                    const getExpiryMessage = (expiryDate: Date, type: string) => {
                        if (expiryDate > currentDate && expiryDate <= fiveDaysBefore) {
                            return `⚠️ ${type} for vehicle ${data.vehicleNumber} is expiring soon! Expiry Date: ${expiryDate.toLocaleDateString()}`;
                        } else if (expiryDate.getTime() === currentDate.getTime()) {
                            return `${type} for vehicle ${data.vehicleNumber} is expiring today! Expiry Date: ${expiryDate.toLocaleDateString()}`;
                        } else if (expiryDate < currentDate) {
                            return `${type} for vehicle ${data.vehicleNumber} is expired! Expiry Date: ${expiryDate.toLocaleDateString()}`;
                        }
                        return null;
                    };
    
                    // 🏷 Tax Notification Logic
                    let taxExpiryDate = data.taxExpiryDate instanceof Timestamp ? data.taxExpiryDate.toDate() : new Date(data.taxExpiryDate);
                    taxExpiryDate.setHours(0, 0, 0, 0);
    
                    if (!data.taxDueDismissed) {
                        let taxMessage = getExpiryMessage(taxExpiryDate, "Tax");
                        if (taxMessage) {
                            updateData.taxDue = true;
                            notificationsList.push({ id: docSnap.id, message: taxMessage, field: "taxDue" });
                        }
                    }
    
                    // 🏷 Insurance Notification Logic
                    let insuranceExpiryDate = data.insuranceExpiryDate instanceof Timestamp ? data.insuranceExpiryDate.toDate() : new Date(data.insuranceExpiryDate);
                    insuranceExpiryDate.setHours(0, 0, 0, 0);
    
                    if (!data.insuranceDueDismissed) {
                        let insuranceMessage = getExpiryMessage(insuranceExpiryDate, "Insurance");
                        if (insuranceMessage) {
                            updateData.insuranceDue = true;
                            notificationsList.push({ id: docSnap.id, message: insuranceMessage, field: "insuranceDue" });
                        }
                    }
    
                    // 🏷 Pollution Notification Logic
                    let pollutionExpiryDate = data.pollutionExpiryDate instanceof Timestamp ? data.pollutionExpiryDate.toDate() : new Date(data.pollutionExpiryDate);
                    pollutionExpiryDate.setHours(0, 0, 0, 0);
    
                    if (!data.pollutionDueDismissed) {
                        let pollutionMessage = getExpiryMessage(pollutionExpiryDate, "Pollution check");
                        if (pollutionMessage) {
                            updateData.pollutionDue = true;
                            notificationsList.push({ id: docSnap.id, message: pollutionMessage, field: "pollutionDue" });
                        }
                    }
    
                    // 🏷 EMI Notification Logic
                    let emiExpiryDate = data.emiExpiryDate instanceof Timestamp ? data.emiExpiryDate.toDate() : new Date(data.emiExpiryDate);
                    emiExpiryDate.setHours(0, 0, 0, 0);
    
                    if (!data.emiDueDismissed) {
                        let emiMessage = getExpiryMessage(emiExpiryDate, "EMI");
                        if (emiMessage) {
                            updateData.emiDue = true;
                            notificationsList.push({ id: docSnap.id, message: emiMessage, field: "emiDue" });
                        }
                    }
    
                    dismissedMap[docSnap.id] = data.taxDueDismissed || data.insuranceDueDismissed || data.pollutionDueDismissed || data.emiDueDismissed;
    
                    if (Object.keys(updateData).length > 0) {
                        updateDoc(docRef, updateData)
                            .then(() => console.log(`Updated due status for ${data.vehicleNumber}`))
                            .catch((error) => console.error("Error updating due status:", error));
                    }
                });
    
                setNotifications(notificationsList);
                setDismissedStatus(dismissedMap);
            });
    
            return () => unsubscribe();
        };
    
        fetchTaxInsuranceData();
    }, [db, uid, dismissedIds]);
    
    
    const handleCloseNotification = async (id: string, field: "taxDue" | "insuranceDue" | "emiDue" | "pollutionDue") => {
        try {
            const dismissedBy = role === "admin" ? role : `${role} ${userName}`; // Exclude userName if role is "admin"

            const recordRef = doc(db, `user/${uid}/taxInsurance`, id);
            await updateDoc(recordRef, { [`${field}Dismissed`]: true, [field]: false, 
                [`${field}DismissedBy`]: dismissedBy   });
    
            setDismissedIds((prev) => [...prev, id]);
            setNotifications((prev) => prev.filter((notification) => notification.id !== id));
            navigate("/taxandinsurance"); 
        } catch (error) {
            console.error("Error dismissing notification:", error);
        }
    };
    
   
    const confirmCloseNotification = (id: string, field: "taxDue" | "insuranceDue" | "emiDue" | "pollutionDue") => {
        setSelectedNotification({ id, field });
        setShowConfirmModal(true);
    };
    
// ---------------------------------------------------
    return (
        <div className="container mx-auto p-6 bg-cover bg-center bg-no-repeat">

            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Bookings</span>
                </li>
            </ul>

            <div className="pt-5">
                <div className="grid xl:grid-cols-1 gap-6 mb-6">
                    <div className="grid xl:grid-cols-4 gap-6 mb-6">
                        <div className={`panel bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg shadow-lg p-6 ${blink ? 'blink' : ''}`}>
                            <Link to="/bookings/newbooking" className="block">
                                <h5 className="font-semibold text-lg mb-3">ShowRoom Booking</h5>
                                <p className="text-2xl">{salesByCategory.series[0]}</p>
                            </Link>
                        </div>
                        <div className="panel bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-lg p-6">
                            <h5 className="font-semibold text-lg mb-3">New Bookings</h5>
                            <p className="text-2xl">{salesByCategory.series[1]}</p>
                        </div>
                        <div className="panel bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-lg shadow-lg p-6">
                            <h5 className="font-semibold text-lg mb-3">Pending Bookings</h5>
                            <p className="text-2xl">{salesByCategory.series[2]}</p>
                        </div>
                        <div className="panel bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg shadow-lg p-6">
                            <h5 className="font-semibold text-lg mb-3">Completed Bookings</h5>
                            <p className="text-2xl">{salesByCategory.series[3]}</p>
                        </div>
                    </div>
                    
                    <>
                    {notifications.map((notification) => (
    <div
        key={notification.id}
        className={`notification ${
            notification.field === "taxDue" ? "taxDue" :
            notification.field === "insuranceDue" ? "insuranceDue" :
            notification.field === "emiDue" ? "emiDue" :
            "pollutionDue"
        }`}
    >
        <p>🔔 {notification.message}</p>
        {(role === 'admin' || staffRole === 'secondary admin'|| staffRole === 'verifier') && (

        <button
            onClick={() =>
                confirmCloseNotification(notification.id, notification.field)
            }
        >
            Dismiss
        </button>
        )}
    </div>
))}



    {showConfirmModal && selectedNotification && (
        <IndexModal
            title="Confirm Dismissal"
            message={`Are you sure you want to dismiss this ${
                selectedNotification.field === "taxDue" ? "Tax" : "Insurance"
            } notification?`}
            onConfirm={() => {
                handleCloseNotification(selectedNotification.id, selectedNotification.field);
                setShowConfirmModal(false);
            }}
            onCancel={() => setShowConfirmModal(false)}
        />
    )}
</>



<div>
      {newNotifications.map((note) => (
        <div
          key={note.id}
          className="notification blink bg-red-500 text-white p-3 rounded-lg mb-4"
        >
          {note.message}
          <button onClick={() => handleClose(note.id, note.field)}
            className="ml-4 bg-white text-red-500 px-2 py-1 rounded"
          >
            Close
          </button>
        </div>
      ))}
    </div>
                    <div className="panel h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg">Bookings By Category</h5>
                            <div className="flex space-x-2 rtl:space-x-reverse">
                                <button className="bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-700">Refresh</button>
                                <button className="bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-700">Export</button>
                            </div>
                        </div>
                        <div>
                            <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                                {loading ? (
                                    <div className="min-h-[325px] grid place-content-center bg-white dark:bg-gray-900 dark:bg-opacity-[0.08]">
                                        <span className="animate-spin border-2 border-gray-300 dark:border-gray-700 !border-l-transparent rounded-full w-5 h-5 inline-flex"></span>
                                    </div>
                                ) : (
                                    <ReactApexChart series={salesByCategory.series} options={salesByCategory.options} type="donut" height={460} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
