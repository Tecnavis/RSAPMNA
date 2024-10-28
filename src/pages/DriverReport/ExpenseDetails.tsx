import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, Timestamp } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

// Define the type for each expense item
interface Expense {
  driverId: string;
  docId: string;
  expenseName: string;
  amount: string;
  description: string;
  createdAt: Timestamp;
  images?: string[];
}

const ExpenseDetails: React.FC = () => {
  const [expenseDetails, setExpenseDetails] = useState<Expense[]>([]);
  const db = getFirestore();
  const uid = sessionStorage.getItem('uid') || '';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
console.log("id",id)
useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (id) {  // Check if 'id' is available
          const expensesQuery = query(collection(db, `user/${uid}/driver/${id}/Expenses`));
          const expensesSnapshot = await getDocs(expensesQuery);

          const driverExpenses = expensesSnapshot.docs.map((expenseDoc) => {
            const expenseData = expenseDoc.data();
            return {
              driverId: id,
              docId: expenseDoc.id,
              expenseName: expenseData.expenseName || '',
              amount: expenseData.amount || '',
              description: expenseData.description || '',
              createdAt: expenseData.createdAt || Timestamp.now(),
              images: Array.isArray(expenseData.images)
                ? expenseData.images.map((image) => image.startsWith('http://') ? image.replace('http://', 'https://') : image)
                : [],
            } as Expense;
          });

          setExpenseDetails(driverExpenses);
        } else {
          console.error('Driver ID is not defined');
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    };

    fetchExpenses();
  }, [db, uid, id]);

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  const handleDownload = () => {
    if (selectedImage) {
      const link = document.createElement('a');
      link.href = selectedImage;
      link.download = `ExpenseImage_${new Date().toISOString()}.jpeg`;
      link.click();
    }
  };
  return (
    <div>
<h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 
              mb-8 pb-2 border-b-4 border-purple-300 shadow-md shadow-purple-200/50 
              tracking-wide uppercase transform hover:scale-105 transition-transform duration-200 ease-out">
  Expense Details
</h2>
      <table>
        <thead>
          <tr>
            <th>Created At</th>
            <th>Expense Name</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Images</th>
          </tr>
        </thead>
        <tbody>
          {expenseDetails.map((expense) => (
            <tr key={expense.docId}>
              <td>{expense.createdAt?.toDate().toLocaleString()}</td>
              <td>{expense.expenseName}</td>
              <td>{expense.amount}</td>
              <td>{expense.description}</td>
              <td>
              <div
      className="expense-images"
      style={{
        display: "flex",
        gap: "8px",
        border: "1px solid #ddd",
        padding: "8px",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
      }}
    >
      {expense.images && expense.images.length > 0 ? (
        expense.images.map((image, index) => {
          return (
            <img
              key={index}
              src={image}
              alt={`Expense ${expense.expenseName}`}
              width="60"
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
              }}
              onClick={() => handleImageClick(image)}
            />
          );
        })
      ) : (
        <span>No images available</span>
      )}

      {/* Modal for enlarged view and download */}
      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedImage(null)} // Close modal on outside click
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
          >
            <img
              src={selectedImage}
              alt="Enlarged Expense"
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px" }}
            />
            <button
              onClick={handleDownload}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "#007BFF",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Download Image
            </button>
          </div>
        </div>
      )}
    </div>
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseDetails;
