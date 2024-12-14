import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  getFirestore,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

interface SalaryDetail {
  id: string;
  initialAdvance?: number;
  transferAmount?: number;
  fileNumbers?: string[];
  timestamp?: {
    seconds: number;
    nanoseconds: number;
  };
}

interface SalaryDetailsTableProps {
  uid: string;
  id?: string;
  showAdvanceDetails: boolean;
}

const SalaryDetailsTable: React.FC<SalaryDetailsTableProps> = ({
  uid,
  id,
  showAdvanceDetails,
}) => {
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetail[]>([]);

  const db = getFirestore();

  const fetchSalaryDetails = async () => {
    try {
      const salaryDetailsRef = collection(
        db,
        `user/${uid}/driver/${id}/salaryAdjustments`
      );
      const q = query(salaryDetailsRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      const details: SalaryDetail[] = querySnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })
      );
      setSalaryDetails(details);
    } catch (error) {
      console.error("Error fetching salary details:", error);
    }
  };

  // Fetch details on component load
  useEffect(() => {
    if (showAdvanceDetails) {
      fetchSalaryDetails();
    }
  }, [showAdvanceDetails]);

  // Format timestamp to readable date
  const formatDate = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  // Assign colors based on unique initialAdvance values
  const advanceColorMap: { [key: number]: string } = {};
  const colors = ["#f8d7da", "#d1ecf1", "#d4edda", "#fff3cd", "#e2e3e5"];
  let colorIndex = 0;

  salaryDetails.forEach((detail) => {
    const advance = detail.initialAdvance;
    if (advance !== undefined && !(advance in advanceColorMap)) {
      advanceColorMap[advance] = colors[colorIndex];
      colorIndex = (colorIndex + 1) % colors.length;
    }
  });
  if (!showAdvanceDetails) {
    return null; // Explicitly return null when the details are not shown
  }
  return (
    showAdvanceDetails && (
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse border border-gray-300 w-full text-left text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Date and Time</th>
              <th className="border border-gray-300 px-4 py-2">Initial Advance</th>
              <th className="border border-gray-300 px-4 py-2">Transfer Amount</th>
              <th className="border border-gray-300 px-4 py-2">File Numbers</th>
            </tr>
          </thead>
          <tbody>
            {salaryDetails.length > 0 ? (
              salaryDetails.map((detail, index) => (
                <tr
                  key={detail.id}
                  style={{
                    backgroundColor:
                      detail.initialAdvance !== undefined
                        ? advanceColorMap[detail.initialAdvance]
                        : "transparent",
                  }}
                  className="hover:bg-gray-100"
                >
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatDate(detail.timestamp)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {detail.initialAdvance || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {detail.transferAmount || "N/A"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {detail.fileNumbers?.join(", ") || "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="border border-gray-300 px-4 py-2 text-center"
                  colSpan={5}
                >
                  No Salary Adjustments Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  );
};

export default SalaryDetailsTable;
