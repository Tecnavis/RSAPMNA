import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import './Track.css'
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../../config/config';
interface BookingDetails {
    driver?: string;
    fileNumber?: string;
    pickupLocation?: { name?: string };
    dropoffLocation?: { name?: string };
    updatedTotalSalary?: string;
    dateTime?: string;
    totalDriverSalary?: string;
    status?: string; 
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
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null,null,null,null]); // for 3 images

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
          const data = bookingDoc.data() as BookingDetails;
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
      await updateDoc(bookingRef, { status: 'On the way to pickup location' });
      navigate('/bookings/newbooking');
    } catch (error) {
      console.error('Error updating vehicle number:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = [...imageFiles];
    files[index] = e.target.files ? e.target.files[0] : null;
    setImageFiles(files);
  };

  const uploadImages = async () => {
    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      if (imageFiles[i]) {
        const storageRef = ref(storage, `images/${imageFiles[i]!.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFiles[i]!);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            () => {},
            (error) => {
              console.error("Error uploading image", error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              urls.push(downloadURL);
              resolve();
            }
          );
        });
      }
    }
    return urls;
  };

  const submitBookingDetails = async () => {
    if (!customerName || !phoneNumber || !vehicleNumber) {
      console.error('Missing fields.');
      return;
    }

    try {
      const imageUrls = await uploadImages();
      setVehicleImageURLs(imageUrls);

      if (bookingId && uid) {
        const bookingRef = doc(db, `user/${uid}/bookings`, bookingId);

        await updateDoc(bookingRef, {
          customerName,
          phoneNumber,
          vehicleNumber,
          vehicleImageURLs: imageUrls,
          status: 'Vehicle Confirmed',
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

  if (loading) {
    return <p>Loading...</p>;
  }

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
<p><strong>Booking Date and Time:</strong> {new Date(bookingDetails.dateTime || '').toLocaleString()}</p>
<p><strong>File Number:</strong> {bookingDetails.fileNumber}</p>
        <p><strong>Pickup Location:</strong> {bookingDetails.pickupLocation?.name || 'N/A'}</p>
        <p><strong>Dropoff Location:</strong> {bookingDetails.dropoffLocation?.name || 'N/A'}</p>
        <p><strong>Updated Total Salary:</strong> {bookingDetails.updatedTotalSalary}</p>
        <p><strong>Total Driver Salary:</strong> {bookingDetails.totalDriverSalary}</p>
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
    <h3 className="vehicle-number-heading">Vehicle Information</h3>
    <p className="vehicle-number-subheading">Please enter the vehicle number to proceed.</p>
    
    <div className="vehicle-number-input">
      <label htmlFor="serviceVehicle" className="input-label">Enter Vehicle Number:</label>
      <input
        type="text"
        id="serviceVehicle"
        value={serviceVehicle}
        onChange={handleVehicleNumberChange}
        placeholder="Enter vehicle number"
        className="input-field"
      />
      <button onClick={submitVehicleNumber} className="btn-submit">Submit</button>
    </div>
  </div>
)}
      <div className="track-container">
      {(status === 'On the way to pickup location' || status === 'Vehicle Picked') && (
        <div className="track-details">
          <h2>Enter Vehicle Information</h2>
          
          <div className="input-group">
                    <label htmlFor="customerName">Customer Name:</label>
                    <input 
                        type="text" 
                        id="customerName" 
                        value={customerName} 
                        onChange={(e) => setCustomerName(e.target.value)} 
                        placeholder="Enter customer name" 
                        className="input-field"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="phoneNumber">Phone Number:</label>
                    <input 
                        type="text" 
                        id="phoneNumber" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)} 
                        placeholder="Enter phone number" 
                        className="input-field"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="vehicleNumber">Vehicle Number:</label>
                    <input 
                        type="text" 
                        id="vehicleNumber" 
                        value={vehicleNumber} 
                        onChange={(e) => setVehicleNumber(e.target.value)} 
                        placeholder="Enter vehicle number" 
                        className="input-field"
                    />
                </div>

                <div className="image-upload-container">
  <h2 className="upload-title">Upload Vehicle Images</h2>
  <p className="upload-subtitle">Please upload images for Dashboard, Front, Rear, and Scratches</p>
  <div className="image-upload-grid">
    {["Dashboard", "Front", "Rear", "Scratch 1", "Scratch 2", "Scratch 3"].map((label, index) => (
      <div key={index} className="image-upload-card">
        <label className="image-label">{label}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, index)}
          disabled={imageFiles[index] !== null}
          className="image-input"
        />
        {imageFiles[index] && <p className="uploaded-notice">Image Uploaded</p>}
      </div>
    ))}
  </div>
</div>


        <button onClick={submitBookingDetails} className="btn-submit">Submit</button>

        </div>
      )}
    </div>

    </div>
  );
};

export default Track;
