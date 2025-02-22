import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";
import "./TaxAndInsurance.css";
import IconEye from "../../components/Icon/IconEye";
import { TextField } from "@mui/material";

interface TaxInsuranceData {
  id?: string;
  vehicleNumber: string;
  taxExpiryDate: string;
  insuranceExpiryDate: string;
  pollutionExpiryDate: string;  // ✅ New field
  emiExpiryDate: string;  
  insurancePaperUrl?: string;
  taxPaperUrl?: string;
  [key: string]: any; // This allows any other properties
}

const TaxAndInsurance: React.FC = () => {
  const db = getFirestore();
  const uid = sessionStorage.getItem("uid");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [records, setRecords] = useState<TaxInsuranceData[]>([]);
  const [formData, setFormData] = useState<TaxInsuranceData & { insurancePaper?: File | null; taxPaper?: File | null }>({
    vehicleNumber: "",
    taxExpiryDate: "",
    insuranceExpiryDate: "",
    insurancePaper: null,
    pollutionExpiryDate: "",  // ✅ New field
    emiExpiryDate: "", 
    taxPaper: null,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const storage = getStorage();

  useEffect(() => {
    if (!uid) return;

    const recordsRef = collection(db, `user/${uid}/taxInsurance`);
    const unsubscribe = onSnapshot(recordsRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as TaxInsuranceData),
      }));
      setRecords(data);
    });

    return () => unsubscribe();
  }, [db, uid]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const uploadFile = async (file: File, filePath: string) => {
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid || loading) return;
  
    setLoading(true);
  
    const uploadPromises: Promise<string | null>[] = [];
  
    if (formData.insurancePaper) {
      const insuranceUpload = uploadFile(
        formData.insurancePaper,
        `insurance_papers/${uid}/${formData.insurancePaper.name}`
      );
      uploadPromises.push(insuranceUpload);
    } else {
      uploadPromises.push(Promise.resolve(null));
    }
  
    if (formData.taxPaper) {
      const taxUpload = uploadFile(
        formData.taxPaper,
        `tax_papers/${uid}/${formData.taxPaper.name}`
      );
      uploadPromises.push(taxUpload);
    } else {
      uploadPromises.push(Promise.resolve(null));
    }
  
    const [insurancePaperUrl, taxPaperUrl] = await Promise.all(uploadPromises);
  
    // Get the current date
  
    
    const recordData: TaxInsuranceData = {
      vehicleNumber: formData.vehicleNumber,
      taxExpiryDate: formData.taxExpiryDate,
      insuranceExpiryDate: formData.insuranceExpiryDate,
      pollutionExpiryDate: formData.pollutionExpiryDate,
      emiExpiryDate: formData.emiExpiryDate,
      insurancePaperUrl: insurancePaperUrl || formData.insurancePaperUrl || "",
      taxPaperUrl: taxPaperUrl || formData.taxPaperUrl || "",
      insuranceDueDismissed: false,
      taxDueDismissed: false,
      emiDueDismissed: false,
      pollutionDueDismissed: false,
    };
  
    try {
      if (editId) {
        const recordRef = doc(db, `user/${uid}/taxInsurance`, editId);
        await updateDoc(recordRef, recordData);
        setEditId(null);
      } else {
        const recordsRef = collection(db, `user/${uid}/taxInsurance`);
        await addDoc(recordsRef, recordData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  
    setFormData({
      vehicleNumber: "",
      taxExpiryDate: "",
      insuranceExpiryDate: "",
      emiExpiryDate: "",
      pollutionExpiryDate: "",
      insurancePaper: null,
      taxPaper: null,
    });
  };
  
  
  const handleEdit = (record: TaxInsuranceData) => {
    setEditId(record.id || null);
    setFormData((prev) => ({
      ...record,
      insurancePaper: prev.insurancePaper,
      taxPaper: prev.taxPaper,
    }));
  };

  // Helper function to format the date as day-month-year
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // 'en-GB' format is day/month/year
  };
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filtered records based on search term
  const filteredRecords = records.filter((record) =>
    record.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="vehicle-container">
      <h2 className="vehicle-heading">🚗 Manage Tax, Pollution, EMI & Insurance</h2>
      <form onSubmit={handleSubmit} className="vehicle-form">
        <label>
          Vehicle Number:
          <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} required />
        </label>
        <label>
          Tax Expiry Date:
          <input type="date" name="taxExpiryDate" value={formData.taxExpiryDate} onChange={handleInputChange} required />
        </label>
        <label>
          Insurance Expiry Date:
          <input type="date" name="insuranceExpiryDate" value={formData.insuranceExpiryDate} onChange={handleInputChange} required />
        </label>
        <label>
          Insurance Paper Upload:
          <input type="file" name="insurancePaper" onChange={handleFileChange} />
          {formData.insurancePaperUrl && <a href={formData.insurancePaperUrl} target="_blank" rel="noopener noreferrer">View</a>}
        </label>
        <label>
          Tax Paper Upload:
          <input type="file" name="taxPaper" onChange={handleFileChange} />
          {formData.taxPaperUrl && <a  href={formData.taxPaperUrl} target="_blank" rel="noopener noreferrer">View</a>}
        </label>
        <label>
  Pollution Expiry Date:
  <input type="date" name="pollutionExpiryDate" value={formData.pollutionExpiryDate} onChange={handleInputChange} required />
</label>

<label>
  EMI Expiry Date:
  <input type="date" name="emiExpiryDate" value={formData.emiExpiryDate} onChange={handleInputChange} required />
</label>

        <button type="submit" disabled={loading}>{editId ? "Update Record" : "Add Record"}</button>
      </form>
  
<div className='mt-2'>
            <TextField
            label="Search by Vehicle Number"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ marginBottom: 2 }}
        />
        </div>
      <h3 className="vehicle-list-heading">📋 Tax, Pollution, EMI & Insurance Records</h3>
      <table className="vehicle-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Vehicle Number</th>
            <th>Tax Expiry Date</th>
            <th>Insurance Expiry Date</th>
           
            <th>Pollution Expiry Date</th>
            <th>EMI Expiry Date</th>
            <th>Insurance Paper</th>
            <th>Tax Paper</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRecords.map((record, index) => (
            <tr key={record.id}>
              <td>{index + 1}</td>
              <td>{record.vehicleNumber}</td>
              <td
        className={record.taxDueDismissed ? "highlight-red" : ""}
      >
        {formatDate(record.taxExpiryDate)}
      </td>          
      <td
        className={record.insuranceDueDismissed ? "highlight-red" : ""}
      >
        {formatDate(record.insuranceExpiryDate)}
      </td>
                    <td>{formatDate(record.pollutionExpiryDate)}</td>
<td>{formatDate(record.emiExpiryDate)}</td>

              <td>
                {record.insurancePaperUrl ? (
                  <a style={{color:'blue'}} href={record.insurancePaperUrl} target="_blank" rel="noopener noreferrer">View Insurance Paper</a>
                ) : "N/A"}
              </td>
              <td>
                {record.taxPaperUrl ? (
                  <a  style={{color:'blue'}} href={record.taxPaperUrl} target="_blank" rel="noopener noreferrer">
                    <i className="fas fa-eye"></i> View Tax Paper
                  </a>
                ) : "N/A"}
              </td>
              <td>
                <button onClick={() => handleEdit(record)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaxAndInsurance;
