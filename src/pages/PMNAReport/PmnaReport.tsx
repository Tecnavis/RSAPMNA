import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore";
import { format } from "date-fns";

const PmnaReport = () => {
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: number }>({});
  const uid = sessionStorage.getItem("uid");
  const db = getFirestore();

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
      try {
        const bookingsRef = collection(db, `user/${uid}/bookings`);
        const q = query(
          bookingsRef,
          where("status", "==", "Order Completed"),
          where("companyBooking", "==", false),
          where("company", "==", "self")
        );

        const querySnapshot = await getDocs(q);
        let data: { [key: string]: number } = {};

        querySnapshot.forEach((doc) => {
          const booking = doc.data();
          const salary = parseFloat(booking.updatedTotalSalary) || 0;
          console.log("salary", salary);

          const createdAt = booking.createdAt?.toDate(); // Convert Firestore timestamp to Date
          if (!createdAt) return; // Ensure createdAt exists

          const monthYear = format(createdAt, "MMMM yyyy"); // Format as "Month Year" (e.g., "July 2024")

          if (!data[monthYear]) {
            data[monthYear] = 0;
          }
          data[monthYear] += salary;
        });

        setMonthlyData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [uid]);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Monthly Salary Report
      </h2>
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        {Object.keys(monthlyData).length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase text-sm">
                <th className="px-4 py-2 text-left">Month</th>
                <th className="px-4 py-2 text-right">Total Salary (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthlyData).map(([month, totalSalary]) => (
                <tr key={month} className="border-b">
                  <td className="px-4 py-2">{month}</td>
                  <td className="px-4 py-2 text-right font-semibold text-green-600">
                    ₹{(totalSalary as number).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center">No data available</p>
        )}
      </div>
    </div>
  );
};

export default PmnaReport;
