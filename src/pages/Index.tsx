import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';
import ReactApexChart from 'react-apexcharts';
import { getFirestore, collection, onSnapshot, Timestamp, updateDoc, doc } from 'firebase/firestore';
import './Index.css';
import { format } from 'date-fns'; // You can use date-fns to format the current date.

const Index = () => {
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass === 'rtl');
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const role = sessionStorage.getItem('role');
    const userName = sessionStorage.getItem('username');
    const [notifications, setNotifications] = useState<
    { id: string; message: string; field: "taxDue" | "insuranceDue" }[]
  >([]);
  const [newNotifications, setNewNotifications] = useState<
  { message: string; id: string; field:  "vehicleServiceDue" }[]
>([]);

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
                let notificationsList: { id: string; message: string; field: "taxDue" | "insuranceDue" }[] = [];
                let dismissedMap: Record<string, boolean> = {}; // Track dismissed statuses
    
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const docRef = doc(db, `user/${uid}/taxInsurance`, docSnap.id); // Reference to document
    
                    let insuranceExpiryDate = data.insuranceExpiryDate instanceof Timestamp
                        ? data.insuranceExpiryDate.toDate()
                        : new Date(data.insuranceExpiryDate);
    
                    let taxExpiryDate = data.taxExpiryDate instanceof Timestamp
                        ? data.taxExpiryDate.toDate()
                        : new Date(data.taxExpiryDate);
    
                    const currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0); // Normalize time for date comparison
                    insuranceExpiryDate.setHours(0, 0, 0, 0);
                    taxExpiryDate.setHours(0, 0, 0, 0);
    
                    const fiveDaysBefore = new Date();
                    fiveDaysBefore.setDate(currentDate.getDate() + 5);
    
                    let updateData: any = {};
    
                    // Insurance Expiry Notification
                    if (insuranceExpiryDate <= fiveDaysBefore && !data.insuranceDue && !data.insuranceDueDismissed) {
                        updateData.insuranceDue = true; // Mark insurance as due
                    }
                    if (data.insuranceDue && !dismissedIds.includes(docSnap.id)) {
                        notificationsList.push({
                            id: docSnap.id,
                            message: `⚠️ Insurance for vehicle ${data.vehicleNumber} is expiring soon! Expiry Date: ${insuranceExpiryDate.toLocaleDateString()}`,
                            field: "insuranceDue",
                        });
                    }
    
                    // Tax Expiry Notification
                    if (taxExpiryDate <= fiveDaysBefore && !data.taxDue && !data.taxDueDismissed) {
                        updateData.taxDue = true; // Mark tax as due
                    }
                    if (data.taxDue && !dismissedIds.includes(docSnap.id)) {
                        notificationsList.push({
                            id: docSnap.id,
                            message: `⚠️ Tax for vehicle ${data.vehicleNumber} is expiring soon! Expiry Date: ${taxExpiryDate.toLocaleDateString()}`,
                            field: "taxDue",
                        });
                    }
    
                    // **New Condition: Exact Expiry Date Check**
                    if (insuranceExpiryDate.getTime() === currentDate.getTime()) {
                        notificationsList.push({
                            id: docSnap.id,
                            message: `🚨 Insurance for vehicle ${data.vehicleNumber} is expiring Today!`,
                            field: "insuranceDue",
                        });
                    }
                    if (taxExpiryDate.getTime() === currentDate.getTime()) {
                        notificationsList.push({
                            id: docSnap.id,
                            message: `🚨 Tax for vehicle ${data.vehicleNumber} is expiring Today!`,
                            field: "taxDue",
                        });
                    }
    
                    // Store dismissed status in state
                    dismissedMap[docSnap.id] = data.taxDueDismissed || data.insuranceDueDismissed;
    
                    // Update Firestore only if changes exist
                    if (Object.keys(updateData).length > 0) {
                        updateDoc(docRef, updateData)
                            .then(() => console.log(`Updated tax/insurance due for ${data.vehicleNumber}`))
                            .catch((error) => console.error("Error updating due status:", error));
                    }
                });
    
                setNotifications(notificationsList);
                setDismissedStatus(dismissedMap); // Store dismissed status
            });
    
            return () => unsubscribe();
        };
    
        fetchTaxInsuranceData();
    }, [db, uid, dismissedIds]);
    
    
    const handleCloseNotification = async (id: string, field: "taxDue" | "insuranceDue") => {
        try {
            const recordRef = doc(db, `user/${uid}/taxInsurance`, id);
            const dismissedField = field === "taxDue" ? "taxDueDismissed" : "insuranceDueDismissed";
    
            await updateDoc(recordRef, { 
                [field]: false, 
                [dismissedField]: true // Mark as dismissed 
            });
    
            setDismissedIds((prev) => [...prev, id]); // Track dismissed IDs
            setNotifications((prev) => prev.filter((n) => n.id !== id)); // Remove from UI
            setDismissedStatus((prev) => ({ ...prev, [id]: true })); // Update dismissed state
        } catch (error) {
            console.error("Error updating due status:", error);
        }
    };
    

    // -------------------------------------------------------------------------------------------
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
    {notifications.map((note, index) => (
        !dismissedStatus[note.id] && (
            <div key={index} className="notification blink bg-yellow-500 text-white p-3 rounded-lg mb-4">
                {note.message}
                <button 
                    className="ml-4 bg-red-500 px-3 py-1 rounded"
                    onClick={() => handleCloseNotification(note.id, note.field)}
                >
                    Close
                </button>
            </div>
        )
    ))}
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
