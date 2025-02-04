import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getFirestore, Timestamp } from 'firebase/firestore';
import './Advance.css';
import IconPrinter from '../../../components/Icon/IconPrinter';

interface DataType {
  bookingId: string;
  driver: string;
  fileNumber: string[];
  amount: number;
  receivedAmount: number;
  balance: number;
  timestamp: Timestamp | { seconds: number; nanoseconds: number };
}

const CashCollectionTable: React.FC<{ uid: string }> = ({ uid }) => {
  const [cashCollectionData, setCashCollectionData] = useState<DataType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const db = getFirestore();
    const receivedDetailsRef = collection(db, `user/${uid}/receivedDetails`);

    const unsubscribe = onSnapshot(receivedDetailsRef, (snapshot) => {
      const receivedDetails: DataType[] = snapshot.docs.map((doc) => ({
        bookingId: doc.id, // Include bookingId
        ...doc.data(),
      })) as DataType[];

      // Sort by timestamp in descending order
      receivedDetails.sort((a, b) =>
        (b.timestamp instanceof Timestamp ? b.timestamp.seconds : b.timestamp.seconds) -
        (a.timestamp instanceof Timestamp ? a.timestamp.seconds : a.timestamp.seconds)
      );

      setCashCollectionData(receivedDetails);
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

  // Filter the data based on the search term
  const filteredData = cashCollectionData.filter((item) => {
    const timestampString = formatTimestamp(item.timestamp).toLowerCase();
    const driverString = item.driver.toLowerCase();
    const fileNumberString = Array.isArray(item.fileNumber) ? item.fileNumber.join(', ').toLowerCase() : String(item.fileNumber).toLowerCase();
    const receivedAmountString = item.receivedAmount.toString();

    return (
      timestampString.includes(searchTerm.toLowerCase()) ||
      driverString.includes(searchTerm.toLowerCase()) ||
      fileNumberString.includes(searchTerm.toLowerCase()) ||
      receivedAmountString.includes(searchTerm)
    );
  });

  // Function to handle printing
  const handlePrint = () => {
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (printContents) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore original layout
    }
  };

  return (
    <div className="advance-details">
      <div className="header-container">
        <h2 className="advance-h2">CASH COLLECTION DETAILS</h2>
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

      <div id="print-section">
        {filteredData.length === 0 ? (
          <p className="no-data">No matching cash collection details found.</p>
        ) : (
          <table className="advance-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Date and Time</th>
                <th>Driver Name</th>
                <th>File Number</th>
                <th>Amount</th>
                <th>Collected Amount</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatTimestamp(item.timestamp)}</td>
                  <td>{item.driver}</td>
                  <td>{Array.isArray(item.fileNumber) ? item.fileNumber.join(', ') : String(item.fileNumber)}</td>
                  <td>₹{item.amount.toLocaleString()}</td>
                  <td>₹{item.receivedAmount.toLocaleString()}</td>
                  <td>₹{item.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CashCollectionTable;
