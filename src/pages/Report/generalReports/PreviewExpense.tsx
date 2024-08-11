
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { setPageTitle } from '../../../store/themeConfigSlice';
import IconSend from '../../../components/Icon/IconSend';
import IconPrinter from '../../../components/Icon/IconPrinter';
import IconDownload from '../../../components/Icon/IconDownload';
import IconEdit from '../../../components/Icon/IconEdit';
import IconPlus from '../../../components/Icon/IconPlus';
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
const PreviewExpense = () => {
    const { id } = useParams();
console.log("id",id)    
const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const db = getFirestore(); // Initialize Firestore
    const location = useLocation(); // Use useLocation hook to access state
    const stateId = location.state?.id; // Access id from location state
    const invoiceRef = useRef();
    useEffect(() => {
        const fetchBooking = async () => {
            setLoading(true);
            try {
                const bookingDocRef = doc(db, 'bookings', id); // Reference to the specific booking document
                const bookingSnapshot = await getDoc(bookingDocRef); // Get the document snapshot

                if (bookingSnapshot.exists()) {
                    // Document exists, extract data
                    setBooking({ id: bookingSnapshot.id, ...bookingSnapshot.data() });
                    dispatch(setPageTitle(`Invoice Preview - ${bookingSnapshot.id}`));
                } else {
                    // Document does not exist
                    console.log(`No booking found with ID: ${id}`);
                    setBooking(null);
                    dispatch(setPageTitle('Invoice Preview'));
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching booking:', error);
                setLoading(false);
            }
        };

        if (id) {
            fetchBooking();
        }
    }, [db, id, dispatch]);

    useEffect(() => {
        // Log id when component mounts or id changes
        console.log('State id:', stateId);
    }, [stateId]);
    const handlePrint = () => {
        const printContent = invoiceRef.current.innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload the page to restore the original content
    };
    const handleDownload = async () => {
        const canvas = await html2canvas(invoiceRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`invoice-${id}.pdf`);
    };
    if (loading) {
        return <div>Loading...</div>;
    }

    if (!booking) {
        return <div>No booking found.</div>;
    }
    const columns = [
        { key: 'id', label: 'S.NO' },
        { key: 'serviceType', label: 'Service Type' },
        { key: 'vehicleModel', label: 'Vehicle Model' },
        { key: 'pickupLocation', label: 'Pickup Location', class: 'text-center' },
        { key: 'dropoffLocation', label: 'DropOff Location', class: 'text-center' },


        { key: 'vehicleNumber', label: 'Vehicle Number', class: 'text-center' },
        { key: 'updatedTotalSalary', label: 'AMOUNT', class: 'text-center' },

    ];
    return (
        <div>
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                <button type="button" className="btn btn-info gap-2">
                    <IconSend />
                    Send Invoice
                </button>

                <button type="button" className="btn btn-primary gap-2" onClick={handlePrint}>
                    <IconPrinter />
                    Print
                </button>

                <button type="button" className="btn btn-success gap-2" onClick={handleDownload}>
                    <IconDownload />
                    Download
                </button>

                <Link to="/apps/invoice/add" className="btn btn-secondary gap-2">
                    <IconPlus />
                    Create
                </Link>

                <Link to={`/general/sales/preview/edit/${id}`} className="btn btn-warning gap-2">
                    <IconEdit />
                    Edit
                </Link>
            </div>
            <div className="panel"  ref={invoiceRef}>
                <div className="flex justify-between flex-wrap gap-4 px-4">
                    <div className="text-2xl font-semibold uppercase">Invoice</div>
                    <div className="shrink-0">
                        <img src="/assets/images/auth/rsa-png.png" alt="img" className="w-24 ltr:ml-auto rtl:mr-auto" />
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
                            <div className="text-black dark:text-white font-semibold">{booking.customerName}</div>
                            <div>{booking.pickupLocation.name}, {booking.pickupLocation.lat}, {booking.pickupLocation.lng}</div>
                            <div>Phone :{booking.phoneNumber}</div>
                            <div>Mobile :{booking.mobileNumber}</div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Invoice :</div>
                                <div>{booking.invoice}</div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Issue Date :</div>
                                <div>{booking.dateTime}</div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Order ID :</div>
                                <div>{booking.fileNumber}</div>
                            </div>
                          
                        </div>
                       
                    </div>
                </div>
                <div className="table-responsive mt-6">
                    <table className="table-striped">
                        <thead>
                        <tr>
                                {columns.map((column) => {
                                    return (
                                        <th key={column.key} className={column?.class}>
                                            {column.label}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                      <tbody>
                         
                              
                                        <td>{booking.bookingId}</td>
                                        <td>{booking.serviceType}</td>
                                        <td>{booking.vehicleModel}</td>
                                        <td>{booking.pickupLocation.name}</td>
                                        <td>{booking.dropoffLocation.name}</td>

                                        <td>{booking.vehicleNumber}</td>

                                        <td>{booking.updatedTotalSalary}</td>


                             
                          
                        </tbody>
                    </table>
                </div>
                <div className="grid sm:grid-cols-2 grid-cols-1 px-4 mt-6">
                    {/* Additional sections as needed */}
                </div>
            </div>
        </div>
    );
};

export default PreviewExpense;
