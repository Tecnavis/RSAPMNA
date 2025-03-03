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
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import "./TaxAndInsurance.css";

interface TaxInsuranceData {
  id?: string;
  vehicleNumber: string;
  taxExpiryDate: string;
  insuranceExpiryDate: string;
  pollutionExpiryDate: string;
  emiExpiryDate: string;
  insurancePaperUrl?: string | null;  // <-- Allow null
  taxPaperUrl?: string | null; 
  [key: string]: any;
}

const TaxAndInsurance: React.FC = () => {
  const db = getFirestore();
  const uid = sessionStorage.getItem("uid");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<TaxInsuranceData[]>([]);
  const [modalOpen, setModalOpen] = useState(false); // ✅ State for Modal
  const [formData, setFormData] = useState<TaxInsuranceData & { insurancePaper?: File | null; taxPaper?: File | null }>({
    vehicleNumber: "",
    taxExpiryDate: "",
    insuranceExpiryDate: "",
    pollutionExpiryDate: "",
    emiExpiryDate: "",
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
  
    const dueDismissedFields: Record<string, string> = {
      taxExpiryDate: "taxDueDismissed",
      insuranceExpiryDate: "insuranceDueDismissed",
      pollutionExpiryDate: "pollutionDueDismissed",
      emiExpiryDate: "emiDueDismissed",
    };
  
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(dueDismissedFields[name] && { [dueDismissedFields[name]]: false }),
    }));
  };
  
  

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  
  const uploadFile = async (file: File | null, filePath: string) => {
    if (!file) return null; // Prevents uploadBytes from breaking
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid || loading) return;
    setLoading(true);
  
    try {
      const insurancePaperUrl = formData.insurancePaper
        ? await uploadFile(formData.insurancePaper, `insurance_papers/${uid}/${formData.insurancePaper.name}`)
        : formData.insurancePaperUrl || undefined;
  
      const taxPaperUrl = formData.taxPaper
        ? await uploadFile(formData.taxPaper, `tax_papers/${uid}/${formData.taxPaper.name}`)
        : formData.taxPaperUrl || undefined;
  
      const updatedFields: Partial<TaxInsuranceData> = {
        vehicleNumber: formData.vehicleNumber,
        taxExpiryDate: formData.taxExpiryDate,
        insuranceExpiryDate: formData.insuranceExpiryDate,
        pollutionExpiryDate: formData.pollutionExpiryDate,
        emiExpiryDate: formData.emiExpiryDate,
        insurancePaperUrl,
        taxPaperUrl,
      };
  
      // Dynamically track which dueDismissedFields to update
      const dueDismissedFields: Record<string, string> = {
        taxExpiryDate: "taxDueDismissed",
        insuranceExpiryDate: "insuranceDueDismissed",
        pollutionExpiryDate: "pollutionDueDismissed",
        emiExpiryDate: "emiDueDismissed",
      };
  
      Object.keys(dueDismissedFields).forEach((key) => {
        if (formData[key] !== records.find((r) => r.id === editId)?.[key]) {
          updatedFields[dueDismissedFields[key]] = false; // Update only if changed
        }
      });
  
      if (editId) {
        await updateDoc(doc(db, `user/${uid}/taxInsurance`, editId), updatedFields);
        setEditId(null);
      } else {
        await addDoc(collection(db, `user/${uid}/taxInsurance`), updatedFields);
      }
  
      setModalOpen(false);
      setFormData({
        vehicleNumber: "",
        taxExpiryDate: "",
        insuranceExpiryDate: "",
        pollutionExpiryDate: "",
        emiExpiryDate: "",
        insurancePaper: null,
        taxPaper: null,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };
  

 const handleEdit = (record: TaxInsuranceData) => {
  setEditId(record.id || null);
  setFormData({
    ...record,
    insurancePaper: null, // Ensure it's reset
    taxPaper: null, // Ensure it's reset
  });
  setModalOpen(true);
};


  return (
    <div className="vehicle-container">
      <h2 className="vehicle-heading">🚗 Manage Tax, Pollution, EMI & Insurance</h2>

      {/* ✅ Button to Open Modal */}
      <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
        Add Vehicle Details
      </Button>

      {/* ✅ Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{ width: 500, p: 4, backgroundColor: "white", margin: "auto", marginTop: "10%", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {editId ? "Edit Vehicle Details" : "Add Vehicle Details"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Vehicle Number" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} required sx={{ mb: 2 }} />
            <TextField fullWidth type="date" label="Tax Expiry Date" name="taxExpiryDate" value={formData.taxExpiryDate} onChange={handleInputChange} required sx={{ mb: 2 }} />
            <TextField fullWidth type="date" label="Insurance Expiry Date" name="insuranceExpiryDate" value={formData.insuranceExpiryDate} onChange={handleInputChange} required sx={{ mb: 2 }} />
            <TextField fullWidth type="date" label="Pollution Expiry Date" name="pollutionExpiryDate" value={formData.pollutionExpiryDate} onChange={handleInputChange} required sx={{ mb: 2 }} />
            <TextField fullWidth type="date" label="EMI Expiry Date" name="emiExpiryDate" value={formData.emiExpiryDate} onChange={handleInputChange} required sx={{ mb: 2 }} />
           {/* Insurance Paper Upload */}
<Typography variant="body1" sx={{ mt: 2 }}>Upload Insurance Paper</Typography>
<input type="file" name="insurancePaper" accept="application/pdf,image/*" onChange={handleFileChange} />
{formData.insurancePaperUrl && (
  <Typography variant="body2">
    <a href={formData.insurancePaperUrl} target="_blank" rel="noopener noreferrer">
      View Existing Insurance Paper
    </a>
  </Typography>
)}

{/* Tax Paper Upload */}
<Typography variant="body1" sx={{ mt: 2 }}>Upload Tax Paper</Typography>
<input type="file" name="taxPaper" accept="application/pdf,image/*" onChange={handleFileChange} />
{formData.taxPaperUrl && (
  <Typography variant="body2">
    <a href={formData.taxPaperUrl} target="_blank" rel="noopener noreferrer">
      View Existing Tax Paper
    </a>
  </Typography>
)}

  <Button type="submit" variant="contained" color="success" fullWidth disabled={loading}>
    {editId ? "Update Record" : "Add Record"}
  </Button>
          </form>
        </Box>
      </Modal>

      {/* ✅ Search Input */}
      <TextField label="Search by Vehicle Number" variant="outlined" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ marginTop: 2, marginBottom: 2 }} />

      {/* ✅ Table to Display Records */}
      <h3 className="vehicle-list-heading">📋 Tax, Pollution, EMI & Insurance Records</h3>
      <table className="vehicle-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Vehicle Number</th>
      <th>Tax Expiry</th>
      <th>Insurance Expiry</th>
      <th>Pollution Expiry</th>
      <th>EMI Expiry</th>
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
        <td className={new Date(record.taxExpiryDate) < new Date() ? "highlight-red" : ""}>
          {formatDate(record.taxExpiryDate)}
          {record.taxDueDismissedBy && (
          <div className="dismissed-by">Dismissed by: {record.taxDueDismissedBy}</div>
        )}
        </td>
        <td className={new Date(record.insuranceExpiryDate) < new Date() ? "highlight-red" : ""}>
          {formatDate(record.insuranceExpiryDate)}
          {record.insuranceDueDismissedBy && (
          <div className="dismissed-by">Dismissed by: {record.insuranceDueDismissedBy}</div>
        )}
        </td>
        <td>{formatDate(record.pollutionExpiryDate)}
        {record.pollutionDueDismissedBy && (
          <div className="dismissed-by">Dismissed by: {record.pollutionDueDismissedBy}</div>
        )}
        </td>
        <td>{formatDate(record.emiExpiryDate)} {record.emiDueDismissedBy && (
          <div className="dismissed-by">Dismissed by: {record.emiDueDismissedBy}</div>
        )}
        </td>
        <td>
          {record.insurancePaperUrl ? (
            <a style={{ color: "blue" }} href={record.insurancePaperUrl} target="_blank" rel="noopener noreferrer">
              View Insurance Paper
            </a>
          ) : (
            "N/A"
          )}
        </td>
        <td>
          {record.taxPaperUrl ? (
            <a style={{ color: "blue" }} href={record.taxPaperUrl} target="_blank" rel="noopener noreferrer">
              View Tax Paper
            </a>
          ) : (
            "N/A"
          )}
        </td>
        <td>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
};

export default TaxAndInsurance;
