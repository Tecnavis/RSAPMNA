import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getFirestore, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import './Track.css';
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../../config/config';
import imageCompression from 'browser-image-compression';

interface BookingDetails {
    driver?: string;
    fileNumber?: string;
    pickupLocation?: { name?: string };
    dropoffLocation?: { name?: string };
    updatedTotalSalary?: string;
    dateTime?: string;
    totalDriverSalary?: string;
    status?: string;
    customerName?: string; // Add this
    phoneNumber?: string; // Add this
    vehicleNumber?: string;
    pickedTime?: Timestamp;
}
const Track: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const [status, setStatus] = useState<string>('');
    const [bookingDetails, setBookingDetails] = useState<BookingDetails>({});
    const [loading, setLoading] = useState<boolean>(true);
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const [serviceVehicle, setServiceVehicle] = useState<string>(''); // State for vehicle number input
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [vehicleNumber, setVehicleNumber] = useState<string>('');
    const [vehicleImageURLs, setVehicleImageURLs] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<(File | null)[]>(Array(6).fill(null));
    const [imageURLs, setImageURLs] = useState<string[]>(Array(6).fill(''));
    const [imgURLs, setImgURLs] = useState<string[]>(Array(6).fill(''));
    const [pickedTime, setPickedTime] = useState('');

    const [imgFiles, setImgFiles] = useState<(File | null)[]>(Array(6).fill(null));
    const [vehicleImgURLs, setVehicleImgURLs] = useState<string[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<string>('');
    const [companyBooking, setCompanyBooking] = useState<boolean>(false); // State for company booking
    const [amount, setAmount] = useState<string>('0');
    const [error, setError] = useState('');

    // Fetch the booking details from Firestore
    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!uid || !bookingId) {
                console.error('UID or Booking ID is missing.');
                return;
            }
            try {
                const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
                const bookingDoc = await getDoc(bookingRef);

                if (bookingDoc.exists()) {
                    const data = bookingDoc.data() as BookingDetails & { companyBooking?: boolean }; // Extend type to include companyBooking
                    setStatus(data.status || '');
                    setBookingDetails({
                        driver: data.driver,
                        fileNumber: data.fileNumber,
                        pickupLocation: data.pickupLocation,
                        dropoffLocation: data.dropoffLocation,
                        updatedTotalSalary: data.updatedTotalSalary,
                        dateTime: data.dateTime,
                        totalDriverSalary: data.totalDriverSalary,
                    });

                    setCustomerName(data.customerName || ''); // Default to empty if not found
                    setPhoneNumber(data.phoneNumber || ''); // Default to empty if not found
                    setVehicleNumber(data.vehicleNumber || ''); // Default to empty if not found

                    if (data.companyBooking) {
                        setCompanyBooking(true);
                        setAmount('0'); // Set amount to 0 for company bookings
                    } else {
                        setCompanyBooking(false);
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching booking:', error);
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId, db, uid]);

    // Update the booking status in Firestore
    const updateStatus = async (newStatus: string) => {
        if (!uid || !bookingId) {
            console.error('UID or Booking ID is missing.');
            return;
        }
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            await updateDoc(bookingRef, { status: newStatus });
            setStatus(newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }
    const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setServiceVehicle(e.target.value);
    };

    const submitVehicleNumber = async () => {
        if (!uid || !bookingId || !serviceVehicle) {
            console.error('Missing vehicle number or booking data.');
            return;
        }
        try {
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            await updateDoc(bookingRef, { serviceVehicle });
            alert('Vehicle number updated successfully!');
            // ---------------------------------------------------------------------------
            await updateDoc(bookingRef, { status: 'On the way to pickup location' });
            navigate('/bookings/newbooking');
        } catch (error) {
            console.error('Error updating vehicle number:', error);
        }
    };
    //   ----------------------------------------------dropof image------------------------------------------
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (companyBooking) return; // Prevent manual input for company bookings
    
        const newAmount = e.target.value;
    
        // If payment status is 'Not Paid', set the amount to 0
        if (paymentStatus === 'Not Paid') {
            setAmount('0');
            setError(''); // Clear any existing error
            return;
        }
    
        setAmount(newAmount);
    
        // Validate amount only if payment status is 'Paid'
        if (paymentStatus === 'Paid') {
            const salaryAmount = parseFloat(bookingDetails.updatedTotalSalary || '0'); // Default to 0 if undefined
            const enteredAmount = parseFloat(newAmount);
    
            if (enteredAmount < salaryAmount) {
                setError(`Amount must be equal to or greater than ${salaryAmount}`);
            } else {
                setError(''); // Clear error if the condition is met
            }
        }
    };
    
  
    // ---------------------------------------------------------------
    const compressImage = async (file: File, maxSizeInKB: number) => {
        const maxSizeMB = maxSizeInKB / 1024; // Convert KB to MB
        let compressedFile = file;
        const options = {
            maxSizeMB, // Set max size in MB
            maxWidthOrHeight: 800, // Adjust resolution
            useWebWorker: true, // Use Web Workers for performance
            initialQuality: 0.7, // Start with a good initial quality
        };

        try {
            do {
                compressedFile = await imageCompression(compressedFile, options);
            } while (compressedFile.size > maxSizeInKB * 1024); // Keep compressing if size exceeds 200KB
        } catch (error) {
            console.error('Error during image compression:', error);
        }

        return compressedFile;
    };
// --------------------------------------------------------------------------
const handleImgChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
  if (e.target.files && e.target.files[0]) {
    const originalFile = e.target.files[0];
    try {
        const compressedFile = await compressImage(originalFile, 500); // Adjust max size in KB as needed
        const files = [...imgFiles];
        files[index] = compressedFile;
        setImgFiles(files);
        console.log('Updated imgFiles:', files);
        // Preview the compressed image
        const previewURL = URL.createObjectURL(compressedFile);
        const updatedImgURLs = [...imgURLs];
        updatedImgURLs[index] = previewURL;
        setImgURLs(updatedImgURLs);
        console.log('Updated imgURLs:', updatedImgURLs);    } catch (error) {
        console.error('Error handling image change', error);
    }
}
};

// Upload Images to Firebase
const uploadImgs = async () => {
  const urls: string[] = [];
  const uploadPromises = imgFiles.map((file, index) => {
      if (file) {
          const storageRef = ref(storage, `images/${file.name}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          return new Promise<void>((resolve, reject) => {
              uploadTask.on(
                  'state_changed',
                  (snapshot) => {
                      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                      console.log(`Image ${index + 1} Upload Progress: ${progress.toFixed(2)}%`);
                  },
                  (error) => {
                      console.error('Error uploading image', error);
                      reject(error);
                  },
                  async () => {
                      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                      urls[index] = downloadURL;
                      resolve();
                  }
              );
          });
      }
      return Promise.resolve();
  });

  await Promise.all(uploadPromises);
  setImgURLs(urls);
  return urls;
};

const submitBookingComplete = async () => {
    if (!companyBooking && !amount) {
        console.error('Missing fields.');
        return;
    }

    // Set amount to 0 if payment status is 'Not Paid'
    const finalAmount = paymentStatus === 'Not Paid' ? 0 : parseFloat(amount);

    const salaryAmount = parseFloat(bookingDetails.updatedTotalSalary || '0');

    // Validate only if it's not a company booking
    if (!companyBooking && paymentStatus === 'Paid' && finalAmount < salaryAmount) {
        alert(`Amount must be at least ${salaryAmount}`);
        return;
    }

    try {
        setLoading(true);
        const uploadedImgURLs = await uploadImgs();
        setLoading(false);

        if (bookingId && uid) {
            const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);
            const totalDriverSalaryString = String(bookingDetails.totalDriverSalary || '0');
            const updatedTotalSalaryString = String(bookingDetails.updatedTotalSalary || '0');

            await updateDoc(bookingRef, {
                paymentStatus,
                amount: finalAmount,
                vehicleImgURLs: uploadedImgURLs,
                status: 'Order Completed',
                totalDriverSalary: totalDriverSalaryString,
                updatedTotalSalary: updatedTotalSalaryString,
            });

            alert('Booking details updated successfully!');
            navigate('/bookings/newbooking');
        } else {
            console.error('Booking ID or UID is missing.');
        }
    } catch (error) {
        console.error('Error adding booking details:', error);
    }
};


    // -------------------------------------------------------------------------------------
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      if (e.target.files && e.target.files[0]) {
          const originalFile = e.target.files[0];
          try {
              const compressedFile = await compressImage(originalFile, 500); // Adjust max size in KB as needed
              const files = [...imageFiles];
              files[index] = compressedFile;
              setImageFiles(files);
  
              // Preview the compressed image
              const previewURL = URL.createObjectURL(compressedFile);
              const updatedImageURLs = [...imageURLs];
              updatedImageURLs[index] = previewURL;
              setImageURLs(updatedImageURLs);
          } catch (error) {
              console.error('Error handling image change', error);
          }
      }
  };
  
  const uploadImages = async () => {
      const urls: string[] = [];
      const uploadPromises = imageFiles.map((file, index) => {
          if (file) {
              const storageRef = ref(storage, `images/${file.name}`);
              const uploadTask = uploadBytesResumable(storageRef, file);
  
              return new Promise<void>((resolve, reject) => {
                  uploadTask.on(
                      'state_changed',
                      (snapshot) => {
                          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                          console.log(`Image ${index + 1} Upload Progress: ${progress.toFixed(2)}%`);
                      },
                      (error) => {
                          console.error('Error uploading image', error);
                          reject(error);
                      },
                      async () => {
                          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                          urls[index] = downloadURL;
                          resolve();
                      }
                  );
              });
          }
          return Promise.resolve();
      });
  
      await Promise.all(uploadPromises);
      setImageURLs(urls);
      return urls;
  };
    // -----------------------------------------------------------------------
    const submitBookingDetails = async () => {
        if (!customerName || !phoneNumber || !vehicleNumber || !pickedTime) {
            console.error('Missing fields.');
            return;
        }

        try {
            // Convert pickedTime to a Firestore Timestamp
            const pickedTimeDate = new Date(pickedTime);
            if (isNaN(pickedTimeDate.getTime())) {
                alert('Invalid Picked Time format. Please enter a valid date and time.');
                return;
            }
            const pickedTimeTimestamp = Timestamp.fromDate(pickedTimeDate);
    
            setLoading(true);
            const uploadedImageURLs = await uploadImages();
            setLoading(false);

            if (bookingId && uid) {
                const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);

                await updateDoc(bookingRef, {
                    customerName,
                    phoneNumber,
                    vehicleNumber,
                    pickedTime: pickedTimeTimestamp, // Save as Firestore Timestamp
                    vehicleImageURLs: uploadedImageURLs,
                    status: 'Vehicle Confirmed',
                });

                alert('Booking details updated successfully!');
                navigate('/bookings/newbooking');
            } else {
                console.error('Booking ID or UID is missing.');
            }
        } catch (error) {
            console.error('Error adding booking details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }
    // ----------------------------------------------------------------------------------

   
    const submitBookingDrop = async () => {
        if (!uid || !bookingId) {
            console.error('UID or Booking ID is not defined');
            return;
        }
        try {
            const bookingDocRef = doc(db, `user/${uid}/bookings`, bookingId); // Replace `uid` and `bookingId` with actual variables if they are defined outside
            await updateDoc(bookingDocRef, {
                status: 'Vehicle Dropped',
                droppedTime: serverTimestamp(),
                advancePayment:"",
                balance:"",
                balanceSalary:"",
                transferedSalary:"",
                
            });
            navigate('/bookings/newbooking');

            console.log('Booking status updated to "Vehicle Dropped"');
        } catch (error) {
            console.error('Error updating booking status:', error);
        }
    };
    return (
        <div className="track-container">
            <>
                <h1 className="track-title">
                    Track Booking: <span>{bookingDetails.driver}</span>
                </h1>
                <p className="track-status">
                    Current Status: <strong>{status}</strong>
                </p>
                {(status === 'booking added' || status === 'called to customer') && (
                    <div className="track-details">
                        <p>
                            <strong>Booking Date and Time:</strong> {new Date(bookingDetails.dateTime || '').toLocaleString()}
                        </p>
                        <p>
                            <strong>File Number:</strong> {bookingDetails.fileNumber}
                        </p>
                        <p>
                            <strong>Pickup Location:</strong> {bookingDetails.pickupLocation?.name || 'N/A'}
                        </p>
                        <p>
                            <strong>Dropoff Location:</strong> {bookingDetails.dropoffLocation?.name || 'N/A'}
                        </p>
                        <p>
                            <strong>Updated Total Salary:</strong> {bookingDetails.updatedTotalSalary}
                        </p>
                        <p>
                            <strong>Total Driver Salary:</strong> {bookingDetails.totalDriverSalary}
                        </p>
                    </div>
                )}
            </>
            {(status === 'booking added' || status === 'called to customer') && (
                <div className="track-buttons">
                    <button onClick={() => updateStatus('Order Received')} className="btn accept">
                        Accept
                    </button>
                    <button onClick={() => updateStatus('called to customer')} className="btn call">
                        Call
                    </button>
                    <button onClick={() => updateStatus('Cancelled')} className="btn reject">
                        Reject
                    </button>
                </div>
            )}
            {status === 'Order Received' && (
                <div className="vehicle-number-input-container">
                    <p>
                        <strong>File Number:</strong> <span style={{ color: 'red', fontSize: '20px' }}>{bookingDetails.fileNumber}</span>
                    </p>
                    <br />

                    <h3 className="vehicle-number-heading">Vehicle Information</h3>
                    <p className="vehicle-number-subheading">Please enter the vehicle number to proceed.</p>

                    <div className="vehicle-number-input">
                        <label htmlFor="serviceVehicle" className="input-label">
                            Enter Vehicle Number:
                        </label>
                        <input type="text" id="serviceVehicle" value={serviceVehicle} onChange={handleVehicleNumberChange} placeholder="Enter vehicle number" className="input-field" />
                        <button onClick={submitVehicleNumber} className="btn-submit">
                            Submit
                        </button>
                    </div>
                </div>
            )}

            {/* -------------------------------dropoff------------ */}
            {status === 'Vehicle Dropped' && (
    <div className="image-upload-container">
        <p>
            <strong>File Number:</strong>
            <span style={{ color: 'red', fontSize: '20px' }}>{bookingDetails.fileNumber}</span>
        </p>
        <br />
        <h2 className="upload-title">Upload Vehicle Images</h2>
        <p className="upload-subtitle">
            Please upload images for Front, Rear, LeftSide, RightSide, Inventory Sheet, and Sticker
        </p>

        <div className="image-upload-grid">
            {['Front', 'Rear', 'Left Side', 'Right Side', 'Inventory Sheet', 'Sticker'].map((label, index) => (
                <div key={index} className="image-upload-card">
                    <label className="image-label">{label}</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImgChange(e, index)}
                        className="image-input"
                    />
                    {imgURLs[index] && (
                        <div className="image-preview">
                            <img src={imgURLs[index]} alt={`${label} Preview`} className="image-thumbnail" />
                        </div>
                    )}
                </div>
            ))}

            {/* Payment Type and Amount Input */}
            {!companyBooking && (
                <div className="payment-type-input">
                    <label htmlFor="paymentStatus" className="input-label">Payment Type:</label>
                    <select
                        id="paymentStatus"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Select Payment Type</option>
                        <option value="Paid">Paid</option>
                        <option value="Not Paid">Not Paid</option>
                        <option value="UPI">UPI</option>
                        <option value="CompanyBooking">CompanyBooking</option>
                    </select>
                </div>
            )}

{!companyBooking && paymentStatus !== 'Not Paid' && (
                <div className="payment-amount-input">
                    <p>
                        <strong>Payable Amount From Customer:</strong>
                        <span style={{ color: 'red', padding: '5px', fontSize: '20px' }}>
                            {bookingDetails.updatedTotalSalary}
                        </span>
                    </p>
                    <label htmlFor="amount" className="input-label">Payment Amount:</label>
                    <input
                        type="text"
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Enter payment amount"
                        className="input-field"
                    />
                    {error && <p className="error-message">{error}</p>}
                </div>
            )}

            {/* Automatically set for CompanyBooking */}
            {companyBooking && (
                <>
                    <input type="hidden" id="paymentStatus" value="CompanyBooking" />
                    <input type="hidden" id="amount" value="0" />
                </>
            )}
        </div>

        <button onClick={submitBookingComplete} className="btn-submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Submit'}
        </button>
    </div>
)}

            {/* ---------------------------------------------------end dropoff-------------------------------- */}
            <div className="track-container">
                {status === 'On the way to pickup location' && (
                    <div className="track-details">
                        <h2>Enter Vehicle Information</h2>

                        <div className="input-group">
                            <label htmlFor="customerName">Customer Name:</label>
                            <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" className="input-field" />
                        </div>

                        <div className="input-group">
                            <label htmlFor="phoneNumber">Phone Number:</label>
                            <input type="text" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter phone number" className="input-field" />
                        </div>

                        <div className="input-group">
                            <label htmlFor="vehicleNumber">Vehicle Number:</label>
                            <input type="text" id="vehicleNumber" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Enter vehicle number" className="input-field" />
                        </div>
                        <div className="input-group">
                            <label htmlFor="pickedTime">Picked Time:</label>
                            <input type="datetime-local" id="pickedTime" value={pickedTime} onChange={(e) => setPickedTime(e.target.value)} placeholder="Set Picked Time" className="input-field" />
                        </div>
                        <div className="image-upload-container">
                            <h2 className="upload-title">Upload Vehicle Images</h2>
                            <p className="upload-subtitle">Please upload images for Dashboard, Front, Rear, and Scratches</p>
                            <div className="image-upload-grid">
                                {['Dashboard', 'Front', 'Rear', 'Scratch 1', 'Scratch 2', 'Scratch 3'].map((label, index) => (
                                    <div key={index} className="image-upload-card">
                                        <label className="image-label">{label}</label>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, index)} className="image-input" />
                                        {imageURLs[index] && (
                                            <div className="image-preview">
                                                <img src={imageURLs[index]} alt={`${label} Preview`} className="image-thumbnail" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={submitBookingDetails} className="btn-submit" disabled={loading}>
                                {loading ? 'Uploading...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {(status === 'Vehicle Confirmed' || status === 'On the way to dropoff location' || status === 'Vehicle Picked') && (
                <div className="track-details">
                    <p>
                        <strong>Booking Date and Time:</strong> {new Date(bookingDetails.dateTime || '').toLocaleString()}
                    </p>
                    <p>
                        <strong>File Number:</strong> <span style={{ color: 'red' }}>{bookingDetails.fileNumber}</span>
                    </p>
                    <p>
                        <strong>Dropoff Location:</strong> {bookingDetails.dropoffLocation?.name || 'N/A'}
                    </p>
                    <p>
                        <strong>Payable Amount From Customer/Company:</strong> {bookingDetails.updatedTotalSalary}
                    </p>
                    <div>
                        <button onClick={submitBookingDrop} className="btn-drop">
                            Vehicle Dropped
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Track;
