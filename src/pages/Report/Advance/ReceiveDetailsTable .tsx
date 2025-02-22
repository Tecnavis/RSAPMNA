import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getFirestore, Timestamp } from 'firebase/firestore';
import './Advance.css';
import IconPrinter from '../../../components/Icon/IconPrinter';

interface DataType {
  bookingId: string;
  driverName: string;
  amount: number;
  receivedAmount: number;
  timestamp: Timestamp | { seconds: number; nanoseconds: number };
}

const ReceiveDetailsTable: React.FC<{ uid: string }> = ({ uid }) => {
  const [receiveDetailsData, setReceiveDetailsData] = useState<DataType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const db = getFirestore();
    const collectedDetailsRef = collection(db, `user/${uid}/collectedDetails`);

    const unsubscribe = onSnapshot(collectedDetailsRef, (snapshot) => {
      const collectedDetails: DataType[] = snapshot.docs.map((doc) => ({
        bookingId: doc.id,
        ...doc.data(),
      })) as DataType[];

      // Sort by timestamp in descending order
      collectedDetails.sort((a, b) =>
        (b.timestamp instanceof Timestamp ? b.timestamp.seconds : b.timestamp.seconds) -
        (a.timestamp instanceof Timestamp ? a.timestamp.seconds : a.timestamp.seconds)
      );

      setReceiveDetailsData(collectedDetails);
    });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  const formatTimestamp = (timestamp: Timestamp | { seconds: number; nanoseconds: number }): string => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return 'Invalid Date';
  };

  const filteredData = receiveDetailsData.filter((item) => {
    const timestampString = formatTimestamp(item.timestamp).toLowerCase();
    const driverString = item.driverName ? item.driverName.toLowerCase() : '';
    const receivedAmountString = item.receivedAmount?.toString() || '';
  
    return (
      timestampString.includes(searchTerm.toLowerCase()) ||
      driverString.includes(searchTerm.toLowerCase()) ||
      receivedAmountString.includes(searchTerm)
    );
  });
  

  const handlePrint = () => {
    const printContents = document.getElementById('print-section-receive')?.innerHTML;
    if (printContents) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  return (
    <div className="advance-details">
      <div className="header-container">
        <h2 className="advance-h2">RECEIVED DETAILS</h2>
        <button onClick={handlePrint} className="print-button">
          <IconPrinter />
        </button>
      </div>
      <input
        type="text"
        placeholder="Search by Date, Driver, File Number, or Received Amount..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ccc',
          width: '100%',
          boxSizing: 'border-box',
          marginBottom: '10px',
        }}
      />

      <div id="print-section-receive">
        {filteredData.length === 0 ? (
          <p className="no-data">No matching received details found.</p>
        ) : (
          <table className="advance-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Date and Time</th>
                <th>Driver Name</th>
                <th>Received Amount</th>

              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatTimestamp(item.timestamp)}</td>
                  <td>{item.driverName}</td>
                  
                  <td>₹{item.receivedAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReceiveDetailsTable;
