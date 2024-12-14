import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconSend from '../../components/Icon/IconSend';
import IconPrinter from '../../components/Icon/IconPrinter';
import IconDownload from '../../components/Icon/IconDownload';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
interface Booking {
    id: string;
    serviceType: string;
    vehicleNumber: string;
    totalDriverSalary: number;
    transferedSalary: number;
    balanceSalary: number;
    driver: string;
    fileNumber: string;
    dateTime:string
  }
  
  interface LocationState {
    selectedBookings: string[];
  }
//   ---------------------------------------------------------
const DriverSalaryInvoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();
  const db = getFirestore();
  const location = useLocation(); // No type argument needed for useLocation
  const invoiceRef = useRef<HTMLDivElement>(null);

  const uid = sessionStorage.getItem('uid');
  const { selectedBookings } = location.state || { selectedBookings: [] };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingPromises = selectedBookings.map(async (bookingId: string) => { // Explicitly type bookingId
            const bookingDocRef = doc(db, `user/${uid}/bookings`, bookingId);
          const bookingSnapshot = await getDoc(bookingDocRef);
          if (bookingSnapshot.exists()) {
            return { id: bookingSnapshot.id, ...bookingSnapshot.data() } as Booking;
          } else {
            console.log(`No booking found with ID: ${bookingId}`);
            return null;
          }
        });
        const bookingResults = await Promise.all(bookingPromises);
        const validBookings = bookingResults.filter((booking) => booking !== null) as Booking[];
        setBookings(validBookings);

        dispatch(setPageTitle(`Invoice Preview - ${validBookings.length > 0 ? validBookings[0].id : ''}`));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    };

    if (selectedBookings.length > 0) {
      fetchBookings();
    }
  }, [db, selectedBookings, dispatch, uid]);


    // Function to generate automatic invoice number
    const generateInvoiceNumber = (): string => {
        // Example: Generating a sequential number or based on date/time
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
        const day = ('0' + currentDate.getDate()).slice(-2);
        const hours = ('0' + currentDate.getHours()).slice(-2);
        const minutes = ('0' + currentDate.getMinutes()).slice(-2);
        const seconds = ('0' + currentDate.getSeconds()).slice(-2);

        // Example format: INV-yyyyMMdd-HHmmss
        const invoiceNumber = `INV-${year}${month}${day}-${hours}${minutes}${seconds}`;

        return invoiceNumber;
    };

    const handlePrint = () => {
        if (invoiceRef.current) {
          const printContent = invoiceRef.current.innerHTML;
          const originalContent = document.body.innerHTML;
    
          document.body.innerHTML = printContent;
          window.print();
          document.body.innerHTML = originalContent;
          window.location.reload();
        }
      };
    
      const handleDownload = async () => {
        if (invoiceRef.current) {
          const canvas = await html2canvas(invoiceRef.current);
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`invoice-${id}.pdf`);
        }
      };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (bookings.length === 0) {
        return <div>No bookings found.</div>;
    }

    const columns = [
        { key: 'id', label: 'S.NO' },
        { key: 'dateTime', label: 'Date' },

        { key: 'serviceType', label: 'Service Type' },
        { key: 'vehicleNumber', label: 'Vehicle Number', class: 'text-center' },
        { key: 'totalDriverSalary', label: 'Salary', class: 'text-center' },
        { key: 'transferedSalary', label: 'Amount Transferred', class: 'text-center' },
        { key: 'balanceSalary', label: 'Balance', class: 'text-center' },
    ];
    // Ensure transferedSalary and balanceSalary are treated as numbers
const totalTransferred = bookings.reduce((total, booking) => total + Number(booking.transferedSalary || 0), 0);
const totalBalance = bookings.reduce((total, booking) => total + Number(booking.balanceSalary || 0), 0);

    return (
        <div>
            
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
               

                <button type="button" className="btn btn-primary gap-2" onClick={handlePrint}>
                    <IconPrinter />
                    Print
                </button>

                <button type="button" className="btn btn-success gap-2" onClick={handleDownload}>
                    <IconDownload />
                    Download
                </button>

             

                {/* <Link to={`/editsalary/${id}`} className="btn btn-warning gap-2">
                    <IconEdit />
                    Edit
                </Link> */}
            </div>
            <div className="panel" ref={invoiceRef}>
                <div className="flex justify-between flex-wrap gap-4 px-4">
                    <div className="text-2xl font-semibold uppercase">Invoice</div>
                    <div className="shrink-0">
                        <img
                            src="/assets/images/auth/rsa-png.png"
                            alt="img"
                            className="w-24 ltr:ml-auto rtl:mr-auto"
                        />
                    </div>
                </div>
                <div className="ltr:text-right rtl:text-left px-4">
                    <div className="space-y-1 mt-6 text-white-dark">
                        <div>perinthalmanna Road, kerala, 33884, India</div>
                        <div>rsa@gmail.com</div>
                        <div>+91 9817100100</div>
                    </div>
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
                <div className="flex justify-between lg:flex-row flex-col gap-6 flex-wrap">
                    <div className="flex-1">
                        <div className="space-y-1 text-white-dark">
                            <div>Issue For:</div>
                            <div className="text-black dark:text-white font-semibold">{bookings[0].driver}</div>
                            {/* Additional details can be added here */}
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Invoice :</div>
                                <div>{generateInvoiceNumber()}</div> {/* Display generated invoice number */}
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Issue Date :</div>
                                <div>{new Date().toLocaleDateString()}</div>
                            </div>

                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Order ID :</div>
                                <div>{bookings[0].fileNumber}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="table-responsive mt-6">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.key} className={column.class}>
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                        {bookings.map((booking, index) => (
                        <tr key={booking.id}>
                            <td>{index + 1}</td>
                            <td className="text-center">{booking.dateTime}</td>

                            <td className="text-center">{booking.serviceType}</td>
                            <td className="text-center">{booking.vehicleNumber}</td>
                            <td className="text-center">{booking.totalDriverSalary}</td>
                            <td className="text-center">{booking.transferedSalary}</td>
                            <td className="text-center">{booking.balanceSalary}</td>
                        </tr>
                    ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-between">
                    <div className="font-semibold">Total Amount Transferred: </div>
                    <div>{totalTransferred}</div>
                </div>
                <div className="flex justify-between">
                    <div className="font-semibold">Total Balance: </div>
                    <div>{totalBalance}</div>
                </div>
            </div>
        </div>
    );
};

export default DriverSalaryInvoice;
