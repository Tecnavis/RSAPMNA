import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import IconSave from '../../../components/Icon/IconSave';
// import IconCancel from '../../../components/Icon/IconCancel';

interface Booking {
    id?: string;
    customerName?: string;
    pickupLocation?: {
        name?: string;
        lat?: string;
        lng?: string;
    };
    phoneNumber?: string;
    mobileNumber?: string;
    invoice?: string;
    dateTime?: string;
    fileNumber?: string;
    bookingId?: string;
    serviceType?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    updatedTotalSalary?: string;
    [key: string]: any; // To handle any additional dynamic properties
}

const Edit = () => {
    const { id } = useParams<{ id: string }>();
    const uid = sessionStorage.getItem('uid') || '';
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(false);
    const [formValues, setFormValues] = useState<Booking>({});
    const dispatch = useDispatch();
    const db = getFirestore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooking = async () => {
            setLoading(true);
            try {
                const bookingDocRef = doc(db, `user/${uid}/bookings`, id!);
                const bookingSnapshot = await getDoc(bookingDocRef);

                if (bookingSnapshot.exists()) {
                    const bookingData = bookingSnapshot.data() as Booking;
                    setBooking({ id: bookingSnapshot.id, ...bookingData });
                    setFormValues(bookingData);
                    dispatch(setPageTitle(`Edit Invoice - ${bookingSnapshot.id}`));
                } else {
                    console.log(`No booking found with ID: ${id}`);
                    setBooking(null);
                    dispatch(setPageTitle('Edit Invoice'));
                }
            } catch (error) {
                console.error('Error fetching booking:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBooking();
        }
    }, [db, id, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const bookingDocRef = doc(db, `user/${uid}/bookings`, id!);
            await updateDoc(bookingDocRef, formValues);
            navigate(`/general/sales/preview/${id}`);
        } catch (error) {
            console.error('Error updating booking:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!booking) {
        return <div>No booking found.</div>;
    }

    return (
        <div>
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                <button type="button" className="btn btn-success gap-2" onClick={handleSave}>
                    <IconSave />
                    Save
                </button>
                <Link to={`/general/sales/preview/${id}`} className="btn btn-secondary gap-2">
                    {/* <IconCancel /> */}
                    Cancel
                </Link>
            </div>
            <div className="panel">
                <div className="flex justify-between flex-wrap gap-4 px-4">
                    <div className="text-2xl font-semibold uppercase">Edit Invoice</div>
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
                            <div className="text-black dark:text-white font-semibold">
                                <input type="text" name="customerName" value={formValues.customerName || ''} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <input type="text" name="pickupLocation.name" value={formValues.pickupLocation?.name || ''} onChange={handleChange} className="form-input" />
                                <input type="text" name="pickupLocation.lat" value={formValues.pickupLocation?.lat || ''} onChange={handleChange} className="form-input" />
                                <input type="text" name="pickupLocation.lng" value={formValues.pickupLocation?.lng || ''} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                Phone :<input type="text" name="phoneNumber" value={formValues.phoneNumber || ''} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                Mobile :<input type="text" name="mobileNumber" value={formValues.mobileNumber || ''} onChange={handleChange} className="form-input" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Invoice :</div>
                                <div>
                                    <input type="text" name="invoice" value={formValues.invoice || ''} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Issue Date :</div>
                                <div>
                                    <input type="date" name="dateTime" value={formValues.dateTime || ''} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Order ID :</div>
                                <div>
                                    <input type="text" name="fileNumber" value={formValues.fileNumber || ''} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="table-responsive mt-6">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>S.NO</th>
                                <th>Service Type</th>
                                <th>Vehicle Model</th>
                                <th className="text-center">Vehicle Number</th>
                                <th className="text-center">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{formValues.bookingId || ''}</td>
                                <td>
                                    <input type="text" name="serviceType" value={formValues.serviceType || ''} onChange={handleChange} className="form-input" />
                                </td>
                                <td>
                                    <input type="text" name="vehicleModel" value={formValues.vehicleModel || ''} onChange={handleChange} className="form-input" />
                                </td>
                                <td className="text-center">
                                    <input type="text" name="vehicleNumber" value={formValues.vehicleNumber || ''} onChange={handleChange} className="form-input" />
                                </td>
                                <td className="text-center">
                                    <input type="text" name="updatedTotalSalary" value={formValues.updatedTotalSalary || ''} onChange={handleChange} className="form-input" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Edit;
