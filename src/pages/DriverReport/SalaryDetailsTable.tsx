import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  getFirestore,
  where,
} from "firebase/firestore";

interface SalaryDetail {
  id: string;
  initialAdvance?: number;
  transferAmount?: number;
  fileNumbers?: string[];
  totalDriverSalaries?: string[];
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
  const [transferAmounts, setTransferAmounts] = useState<string[]>([]);
  const [balanceSalaries, setBalanceSalaries] = useState<number[]>([]); // Store balance salaries here
  const [isExpanded, setIsExpanded] = useState(false); // Track table expansion
// ---------------------------------------------------------------------
  const db = getFirestore();
  useEffect(() => {
    const fetchSalaryDetailsAndAmounts = async () => {
      const fetchedSalaryDetails = await fetchSalaryDetails(); 
      const amounts = await fetchAllTransferAmounts(fetchedSalaryDetails);
    
      const calculatedBalanceSalaries = fetchedSalaryDetails.map((detail, index) => {
        const totalSalaries = (detail.totalDriverSalaries || []).map((salary) => Number(salary) || 0);
        const transferSalaries = (amounts[index] || "").split(", ").map((amt) => Number(amt) || 0);
    
        return totalSalaries.map((salary, i) => salary - (transferSalaries[i] || 0));
      }).flat();
    
      setSalaryDetails(fetchedSalaryDetails);
      setTransferAmounts(amounts);
      setBalanceSalaries(calculatedBalanceSalaries);
    };
    

    if (showAdvanceDetails) {
      fetchSalaryDetailsAndAmounts();
    }
  }, [showAdvanceDetails, uid, id]);

  const fetchTransferAmountForFileNumber = async (fileNumber: string, selectedDriver: string): Promise<string> => {
    const bookingsRef = collection(db, `user/${uid}/bookings`);
    const q = query(bookingsRef, where("fileNumber", "==", fileNumber), where("selectedDriver", "==", selectedDriver));
    const querySnapshot = await getDocs(q);
    const amounts: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.transferedSalary) {
        amounts.push(data.transferedSalary.toString());
      }
    });
    return amounts.join(", ");
  };

  const fetchAllTransferAmounts = async (salaryDetails: SalaryDetail[]): Promise<string[]> => {
    const amounts = await Promise.all(
      salaryDetails.map(async (detail) => {
        const fileNumbers = detail.fileNumbers || [];
        const transferAmounts = await Promise.all(
          fileNumbers.map((fileNumber) =>
            fetchTransferAmountForFileNumber(fileNumber, id || "")
          )
        );
        return transferAmounts.join(", ");
      })
    );
    return amounts;
  };

  const fetchSalaryDetails = async () => {
    try {
      const salaryDetailsRef = collection(db, `user/${uid}/driver/${id}/salaryAdjustments`);
      const q = query(salaryDetailsRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      const details: SalaryDetail[] = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const fileNumbers = data.fileNumbers || [];
          const totalDriverSalaries = await fetchTotalDriverSalaries(fileNumbers);

          return {
            id: doc.id,
            ...data,
            totalDriverSalaries,
          };
        })
      );
// Ensure sorting by timestamp in case Firestore doesn't return them in order
const sortedDetails = details.sort((a, b) => {
  const dateA = a.timestamp?.seconds || 0;
  const dateB = b.timestamp?.seconds || 0;
  return dateB - dateA; // Descending order
});

return groupSalaryDetails(sortedDetails);
    } catch (error) {
      console.error("Error fetching salary details:", error);
      return [];
    }
  };

  const groupSalaryDetails = (details: SalaryDetail[]): SalaryDetail[] => {
    const grouped: { [key: number]: SalaryDetail } = {};

    details.forEach((detail) => {
      const advance = detail.initialAdvance || 0;
      if (!grouped[advance]) {
        grouped[advance] = { ...detail, fileNumbers: [], totalDriverSalaries: [] };
      }
      grouped[advance].fileNumbers = [
        ...(grouped[advance].fileNumbers || []),
        ...(detail.fileNumbers || []),
      ];
      grouped[advance].totalDriverSalaries = [
        ...(grouped[advance].totalDriverSalaries || []),
        ...(detail.totalDriverSalaries || []),
      ];
      grouped[advance].transferAmount = detail.transferAmount || 0;
    });

    return Object.values(grouped);
  };

  const fetchTotalDriverSalaries = async (
    fileNumbers: string[],
  ): Promise<string[]> => {
    try {
      const totalDriverSalaries: string[] = [];
      for (const fileNumber of fileNumbers) {
        const bookingsRef = collection(db, `user/${uid}/bookings`);
        const q = query(
          bookingsRef,
          where("fileNumber", "==", fileNumber),
          where("selectedDriver", "==", id)
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.totalDriverSalary) {
            totalDriverSalaries.push(data.totalDriverSalary);
          }
        });
      }
      return totalDriverSalaries;
    } catch (error) {
      console.error("Error fetching total driver salaries:", error);
      return [];
    }
  };
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const formatDateTime = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };
  
  const formatTransferAmount = async (fileNumbers: string[], selectedDriver: string) => {
    const amounts: string[] = [];
    for (const fileNumber of fileNumbers) {
      // Await the async function call to get the transferAmount
      const amount = await fetchTransferAmountForFileNumber(fileNumber, selectedDriver);
      amounts.push(amount);
    }
    return amounts.join(", ");
  };

  useEffect(() => {
    if (showAdvanceDetails) {
      fetchSalaryDetails();
    }
  }, [showAdvanceDetails]);

  if (!showAdvanceDetails) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-300 w-full text-left text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="border border-gray-300 px-4 py-2">ID</th>
            <th className="border border-gray-300 px-4 py-2">Date and Time</th>
            <th className="border border-gray-300 px-4 py-2">File Numbers</th>
            <th className="border border-gray-300 px-4 py-2">Initial Advance</th>
            <th className="border border-gray-300 px-4 py-2">Transfer Amount</th>
            <th className="border border-gray-300 px-4 py-2">Driver Salary</th>
            <th className="border border-gray-300 px-4 py-2">Balance Salary</th>
          </tr>
        </thead>
        <tbody>
          {salaryDetails.length > 0 ? (
             salaryDetails
             .slice(0, isExpanded ? salaryDetails.length : 2) // Show all rows or first 2
             .map((detail, index) => (
               <tr key={detail.id} className="hover:bg-gray-100">
                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2">
  {formatDateTime(detail.timestamp)}
</td>

                <td className="border border-gray-300 px-4 py-2">
                  {detail.fileNumbers?.join(", ") || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {detail.initialAdvance || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {transferAmounts[index] || "Loading..."}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {detail.totalDriverSalaries?.join(", ") || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {balanceSalaries[index] || "Loading..."}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-center" colSpan={7}>
                No Salary Adjustments Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {salaryDetails.length > 2 && (
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={toggleExpanded}
        >
          {isExpanded ? "View Less" : "View More"}
        </button>
      )}
    </div>
  );
};

export default SalaryDetailsTable;
