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

interface TaxInsuranceData {
  id?: string;
  vehicleNumber: string;
  taxExpiryDate: string;
  insuranceExpiryDate: string;
  insurancePaperUrl?: string;
  taxPaperUrl?: string;
  [key: string]: any; // This allows any other properties
}

const TaxAndInsurance: React.FC = () => {
  const db = getFirestore();
  const uid = sessionStorage.getItem("uid");
  const [loading, setLoading] = useState(false);

  const [records, setRecords] = useState<TaxInsuranceData[]>([]);
  const [formData, setFormData] = useState<TaxInsuranceData & { insurancePaper?: File | null; taxPaper?: File | null }>({
    vehicleNumber: "",
    taxExpiryDate: "",
    insuranceExpiryDate: "",
    insurancePaper: null,
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

    const recordData: TaxInsuranceData = {
      vehicleNumber: formData.vehicleNumber,
      taxExpiryDate: formData.taxExpiryDate,
      insuranceExpiryDate: formData.insuranceExpiryDate,
      insurancePaperUrl: insurancePaperUrl || formData.insurancePaperUrl || "",
      taxPaperUrl: taxPaperUrl || formData.taxPaperUrl || "",
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

  return (
    <div className="vehicle-container">
      <h2 className="vehicle-heading">🚗 Manage Tax & Insurance</h2>
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
        <button type="submit" disabled={loading}>{editId ? "Update Record" : "Add Record"}</button>
      </form>

      <h3 className="vehicle-list-heading">📋 Tax & Insurance Records</h3>
      <table className="vehicle-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Vehicle Number</th>
            <th>Tax Expiry Date</th>
            <th>Insurance Expiry Date</th>
            <th>Insurance Paper</th>
            <th>Tax Paper</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={record.id}>
              <td>{index + 1}</td>
              <td>{record.vehicleNumber}</td>
              <td>{formatDate(record.taxExpiryDate)}</td> {/* Display formatted tax expiry date */}
              <td>{formatDate(record.insuranceExpiryDate)}</td> {/* Display formatted insurance expiry date */}
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
