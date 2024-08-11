import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import IconSave from '../../components/Icon/IconSave';
// import IconCancel from '../../../components/Icon/IconCancel';

const EditSalary = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formValues, setFormValues] = useState({});
    const dispatch = useDispatch();
    const db = getFirestore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBooking = async () => {
            setLoading(true);
            try {
                const bookingDocRef = doc(db, 'bookings', id);
                const bookingSnapshot = await getDoc(bookingDocRef);

                if (bookingSnapshot.exists()) {
                    const bookingData = bookingSnapshot.data();
                    setBooking({ id: bookingSnapshot.id, ...bookingData });
                    setFormValues(bookingData); // Set form values
                    dispatch(setPageTitle(`Edit Invoice - ${bookingSnapshot.id}`));
                } else {
                    console.log(`No booking found with ID: ${id}`);
                    setBooking(null);
                    dispatch(setPageTitle('Edit Invoice'));
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues({ ...formValues, [name]: value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const bookingDocRef = doc(db, 'bookings', id);
            await updateDoc(bookingDocRef, formValues);
            setLoading(false);
            navigate(`/general/sales/preview/${id}`); // Redirect to preview page
        } catch (error) {
            console.error('Error updating booking:', error);
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
                                <input type="text" name="customerName" value={formValues.customerName} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                <input type="text" name="pickupLocation.name" value={formValues.pickupLocation?.name} onChange={handleChange} className="form-input" />
                                <input type="text" name="pickupLocation.lat" value={formValues.pickupLocation?.lat} onChange={handleChange} className="form-input" />
                                <input type="text" name="pickupLocation.lng" value={formValues.pickupLocation?.lng} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                Phone :<input type="text" name="phoneNumber" value={formValues.phoneNumber} onChange={handleChange} className="form-input" />
                            </div>
                            <div>
                                Mobile :<input type="text" name="mobileNumber" value={formValues.mobileNumber} onChange={handleChange} className="form-input" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between sm:flex-row flex-col gap-6 lg:w-2/3">
                        <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Invoice :</div>
                                <div>
                                    <input type="text" name="invoice" value={formValues.invoice} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Issue Date :</div>
                                <div>
                                    <input type="date" name="dateTime" value={formValues.dateTime} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Order ID :</div>
                                <div>
                                    <input type="text" name="fileNumber" value={formValues.fileNumber} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                        </div>
                        {/* <div className="xl:1/3 lg:w-2/5 sm:w-1/2">
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Bank Name:</div>
                                <div>
                                    <input type="text" name="bankName" value={formValues.bankName} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Account Number:</div>
                                <div>
                                    <input type="text" name="accountNumber" value={formValues.accountNumber} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">SWIFT Code:</div>
                                <div>
                                    <input type="text" name="swiftCode" value={formValues.swiftCode} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">IBAN:</div>
                                <div>
                                    <input type="text" name="iban" value={formValues.iban} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                            <div className="flex items-center w-full justify-between mb-2">
                                <div className="text-white-dark">Country:</div>
                                <div>
                                    <input type="text" name="country" value={formValues.country} onChange={handleChange} className="form-input" />
                                </div>
                            </div>
                        </div> */}
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
                                <td>{formValues.bookingId}</td>
                                <td>
                                    <input type="text" name="serviceType" value={formValues.serviceType} onChange={handleChange} className="form-input" />
                                </td>
                                <td>
                                    <input type="text" name="vehicleModel" value={formValues.vehicleModel} onChange={handleChange} className="form-input" />
                                </td>
                                <td className="text-center">
                                    <input type="text" name="vehicleNumber" value={formValues.vehicleNumber} onChange={handleChange} className="form-input" />
                                </td>
                                <td className="text-center">
                                    <input type="text" name="updatedTotalSalary" value={formValues.updatedTotalSalary} onChange={handleChange} className="form-input" />
                                </td>
                            </tr>
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

export default EditSalary;
