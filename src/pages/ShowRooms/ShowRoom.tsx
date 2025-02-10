import React, { useState, useEffect, useRef, Fragment } from 'react';
import { addDoc, collection, getFirestore, getDocs, doc, updateDoc, serverTimestamp, query, orderBy, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IoIosCloseCircle } from "react-icons/io";

import './ShowRoom.css';
import { ChangeEvent, FormEvent } from 'react';
import IconPrinter from '../../components/Icon/IconPrinter';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { Autocomplete, TextField, Box, Typography, Modal, Button } from '@mui/material';
import axios from 'axios';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import ConfirmationModal from '../../pages/Users/ConfirmationModal/ConfirmationModal';
import QRCode from 'qrcode.react';
import IconMapPin from '../../components/Icon/IconMapPin';
import IconMenuScrumboard from '../../components/Icon/Menu/IconMenuScrumboard';
import { FaPrint, FaQrcode } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Dialog, Transition } from '@headlessui/react';

interface ShowRoomType {
    [key: string]: any;
    img: string;
    ShowRoom: string;
    description: string;
    Location: string;
    locationLatLng: { lat: number | null; lng: number | null };
        lat: string;
    lng: string;
    userName: string;
    password: string;
    tollfree: string;
    showroomId: string;
    phoneNumber: string;
    availableServices: string[];
    mobileNumber: string;
    manualLat: number;
    manualLng: number;
    state: string;
    district: string;
    hasInsurance: string;
    insuranceAmount: string;
    hasInsuranceBody: string;
    manualLocationName: string;
    insuranceAmountBody: string;
    showroomLink?: string;
    qrCode?: string;
    createdAt?: any;
    status?: string;
    newShowRoom?: string;
}

interface ShowRoomRecord extends ShowRoomType {
    id: string;
}

interface AutocompleteResult {
    label: string;
    lat: number;
    lng: number;
    value: string;
}

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    maxHeight: '80vh',
    overflowY: 'auto',
    bgcolor: 'background.paper',
    boxShadow: 24,
};

const keralaDistricts = [
    'Alappuzha',
    'Ernakulam',
    'Idukki',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Kottayam',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Pathanamthitta',
    'Thiruvananthapuram',
    'Thrissur',
    'Wayanad',
];

const ShowRoom: React.FC = () => {
    const [showRoom, setShowRoom] = useState<ShowRoomType>({
        img: '',
        ShowRoom: '',
        description: '',
        Location: '',
        userName: '',
        password: '',
        tollfree: '',
        showroomId: '',
        phoneNumber: '',
        availableServices: [],
        mobileNumber: '',
        locationLatLng: { lat: 0, lng: 0 },
        state: '',
        manualLocationName: '',
        qrCode: '',
        showroomLink: '',
        district: '',
        hasInsurance: '',
        insuranceAmount: '',
        hasInsuranceBody: '',
        insuranceAmountBody: '',
        manualLat: 0,
        manualLng: 0,
        lat: '',
        lng: '',
    });

    const [existingShowRooms, setExistingShowRooms] = useState<ShowRoomRecord[]>([]);
    const [editRoomId, setEditRoomId] = useState<string | null>(null);
    const [open, setOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredRecords, setFilteredRecords] = useState<ShowRoomRecord[]>([]);
    const listRef = useRef<HTMLDivElement | null>(null);
    const qrCodeRef = useRef<HTMLDivElement | null>(null);

    const formRef = useRef<HTMLFormElement | null>(null);
    const [baseLocation, setBaseLocation] = useState<AutocompleteResult | null>(null);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [manualLocationName, setManualLocationName] = useState<string>('');
    const [manualLat, setManualLat] = useState<string>('');
    const [manualLng, setManualLng] = useState<string>('');
    const [generatedLink, setGeneratedLink] = useState<string>('');
    const qrRef = useRef<HTMLDivElement>(null); // Change the type to HTMLDivElement
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const [manualLatLng, setManualLatLng] = useState<string>(''); // Initialize with an empty string



    console.log(baseLocation, 'the baseLocation');
    const uid = sessionStorage.getItem('uid');
    const userRole = sessionStorage.getItem('role'); // Assume 'role' is stored in sessionStorage
console.log("userRole",userRole)
    // Role-based access control
    useEffect(() => {
        if (userRole !== 'admin' && userRole !== 'staff') {
            toast.error('You are an unauthorized user', { autoClose: 3000 });
        }
    }, [userRole]);

    // Only allow access if role is 'admin' or 'staff'
    if (userRole !== 'admin' && userRole !== 'staff') {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>You are an unauthorized user</h1>
            </div>
        );
    }

   
    
    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = existingShowRooms.filter((record) => {
            const toLower = (value: string | undefined) => (value || '').toLowerCase();

            return (
                toLower(record.availableServices?.join(', '))?.includes(term) ||
                toLower(record.hasInsurance)?.includes(term) ||
                toLower(record.insuranceAmount)?.includes(term) ||
                toLower(record.hasInsuranceBody)?.includes(term) ||
                toLower(record.insuranceAmountBody)?.includes(term) ||
                toLower(record.ShowRoom)?.includes(term) ||
                toLower(record.showroomId)?.includes(term) ||
                toLower(record.description)?.includes(term) ||
                toLower(record.Location)?.includes(term) ||
                toLower(record.userName)?.includes(term) ||
                toLower(record.password)?.includes(term) ||
                toLower(record.tollfree)?.includes(term) ||
                toLower(record.phoneNumber)?.includes(term) ||
                toLower(record.mobileNumber)?.includes(term) ||
                toLower(record.state)?.includes(term) ||
                toLower(record.district)?.includes(term)
            );
        });
        setFilteredRecords(filtered);
    }, [searchTerm, existingShowRooms]);

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setShowRoom({ ...showRoom, [name]: value });
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShowRoom({ ...showRoom, [name]: value });
    };

    const handleBodyChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShowRoom({ ...showRoom, [name]: value });
    };
    const handleServiceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setShowRoom((prevShowRoom) => {
            let updatedServices = [...prevShowRoom.availableServices];
            if (checked && !updatedServices.includes(value)) {
                updatedServices.push(value);
            } else if (!checked) {
                updatedServices = updatedServices.filter((service) => service !== value);
            }
            return { ...prevShowRoom, availableServices: updatedServices };
        });
    };

    const handleInsuranceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setShowRoom({ ...showRoom, hasInsurance: e.target.value, insuranceAmount: e.target.value === 'No' ? '' : showRoom.insuranceAmount });
    };

    const handleBodyInsuranceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setShowRoom((prevShowRoom) => ({
            ...prevShowRoom,
            [name]: value,
            insuranceAmountBody: value === 'No' ? '' : prevShowRoom.insuranceAmountBody,
        }));
    };

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const storage = getStorage();
        const storageRef = ref(storage, `showroomImages/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        console.log('Image uploaded, URL:', downloadURL); // Debugging line

        setShowRoom({ ...showRoom, img: downloadURL });
    };
    // ------------------------------------------------------------------------------

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const db = getFirestore();
        const timestamp = serverTimestamp();
        const baseUrl = `https://rsapmna-de966.web.app/showrooms/showroom/showroomDetails`;
        const uid = sessionStorage.getItem('uid') || '';

        const queryParams = new URLSearchParams({
            id: showRoom.showroomId,
            name: showRoom.ShowRoom,
            location: showRoom.manualLocationName,
            img: showRoom.img,
            tollfree: showRoom.tollfree,
            phoneNumber: showRoom.phoneNumber,
            state: showRoom.state,
            district: showRoom.district,
            uid: uid,
        }).toString();
        const generatedLink = `${baseUrl}?${queryParams}`;
    setGeneratedLink(generatedLink); // Store generated link

        let qrCodeBase64 = '';
        if (qrRef.current) {
            const canvas = qrRef.current.querySelector('canvas');
            if (canvas) {
                qrCodeBase64 = canvas.toDataURL('image/png'); // Convert canvas to Base64
            }
        }
        const baseLocation = showRoom.Location.split(',')[0];
        const [manualLat, manualLng] = manualLatLng.split(',').map(coord => coord.trim());

        const newShowRoom: ShowRoomType = {
            ...showRoom,
            createdAt: timestamp,
            status: 'admin added showroom',
            showroomLink: generatedLink || '',
            qrCode: qrCodeBase64,
            Location: `${baseLocation}, ${showRoom.locationLatLng.lat}, ${showRoom.locationLatLng.lng}`,
            manualLocationName: manualLocationName, // Add manual location name
            manualLat: parseFloat(manualLat), // Add manual latitude and ensure it's a number
            manualLng: parseFloat(manualLng), // Add manual longitude and ensure it's a number
        };

        try {
            if (editRoomId) {
                const roomRef = doc(db, `user/${uid}/showroom`, editRoomId);
                const docSnapshot = await getDoc(roomRef);
    
                if (docSnapshot.exists()) {
                    await updateDoc(roomRef, newShowRoom as { [key: string]: any });
                    toast.success('Showroom updated successfully', { autoClose: 3000 });
                } else {
                    toast.error('No document found to update', { autoClose: 3000 });
                }
    
                setEditRoomId(null);
            } else {
                await addDoc(collection(db, `user/${uid}/showroom`), newShowRoom as { [key: string]: any });
                toast.success('Showroom added successfully', { autoClose: 3000 });
            }
            setShowRoom({
                img: '',
                ShowRoom: '',
                description: '',
                Location: '',
                userName: '',
                password: '',
                tollfree: '',
                showroomId: '',
                phoneNumber: '',
                availableServices: [],
                mobileNumber: '',
                manualLocationName: '',
                manualLat: 0,
                manualLng: 0,
                locationLatLng: { lat: 0, lng: 0 },
                state: '',
                district: '',
                qrCode: editRoomId ? showRoom.qrCode : '',
                showroomLink: editRoomId ? showRoom.showroomLink : '',
                hasInsurance: '',
                insuranceAmount: '',
                hasInsuranceBody: '',
                insuranceAmountBody: '',
                lat: '',
                lng: '',
            });

            fetchShowRooms();
            window.location.reload();
        } catch (error) {
            console.error('Error adding/updating showroom:', error);
        }
    };

    const fetchShowRooms = async () => {
        const db = getFirestore();
        try {
            const querySnapshot = await getDocs(query(collection(db, `user/${uid}/showroom`), orderBy('createdAt', 'desc')));
            const showRoomsData: ShowRoomRecord[] = [];
            querySnapshot.forEach((doc) => {
                showRoomsData.push({
                    id: doc.id,
                    ...(doc.data() as ShowRoomType), // Ensure 'id' is included
                });
            });
            console.log('Fetched showrooms:', showRoomsData); // Debugging line

            setExistingShowRooms(showRoomsData);
        } catch (error) {
            console.error('Error fetching showrooms:', error);
        }
    };

    const handleEdit = (roomId: string) => {
        setCurrentRoomId(roomId);
        setIsEditing(true);
        setIsModalVisible(true);
    };

    const handleDelete = (roomId: string) => {
        setCurrentRoomId(roomId);
        console.log("Deleting showroom with ID:", currentRoomId);

        setIsEditing(false);
        setIsModalVisible(true);
    };
    const onConfirmAction = async () => {
        if (isEditing) {
            const roomToEdit = existingShowRooms.find((room) => room.id === currentRoomId);
            console.log('Editing room:', roomToEdit); // Debugging line
            if (!roomToEdit) {
                console.error("Room to edit not found!");
                return;
            }
            setOpen(true);
            setShowRoom(roomToEdit!);
            setManualLocationName(roomToEdit?.manualLocationName || '');
             // Split manualLatLng here and set state
        const { manualLat, manualLng } = roomToEdit!;
        setManualLat(manualLat.toString()); // Convert to string for input
        setManualLng(manualLng.toString()); // Convert to string for input
        setManualLatLng(`${manualLat},${manualLng}`); // Set combined input

            
            console.log('Set showroom state:', roomToEdit); // Debugging line
            setEditRoomId(currentRoomId);
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else {
            if (!currentRoomId) {
                console.error('Invalid currentRoomId');
                toast.error('Invalid showroom ID, cannot delete!', { autoClose: 3000 });
                return;
            }           
            
            const db = getFirestore();
            const roomRef = doc(db, `user/${uid}/showroom`, currentRoomId);
            try {
                const roomSnap = await getDoc(roomRef);
                if (!roomSnap.exists()) {
                    console.error("Room does not exist, cannot delete!");
                    toast.error("Showroom not found!", { autoClose: 3000 });
                    return;
                }
    
                console.log("Deleting showroom with ID:", currentRoomId);
                // Update the state after deletion
                setExistingShowRooms((prevShowRooms) => prevShowRooms.filter((room) => room.id !== currentRoomId));
                await deleteDoc(roomRef);

                toast.success('Showroom removed successfully!', { autoClose: 3000 });
            } catch (error) {
                console.error('Error deleting showroom:', error);
                toast.error('Failed to remove showroom!', { autoClose: 3000 });
            }
            setIsModalVisible(false);
        }
    };
    const onCancelAction = () => {
        setIsModalVisible(false);
    };

    useEffect(() => {
        fetchShowRooms();
    }, []);
    // const handlePrinter = (room: { showroomLink: string; ShowRoom: string }) => {
    //     if (!room) {
    //         console.error("Room data is missing");
    //         return;
    //     }
    
    //     if (modalContentRef.current) {
    //         const printWindow = window.open('', '_blank');
    
    //         if (printWindow) {
    //             printWindow.document.open();
    //             printWindow.document.write(`
    //                 <html>
    //                   <head>
    //                     <title>Print Modal</title>
    //                     <style>
    //                       @page {
    //                         size: A4 portrait; /* Ensures the print is in A4 size */
    //                         margin: 10mm; /* Adds a small margin */
    //                       }
    //                       body {
    //                         margin: 0;
    //                         padding: 0;
    //                         font-family: Arial, sans-serif;
    //                         background: #fff;
    //                         width: 210mm;
    //                         height: 297mm;
    //                         display: flex;
    //                         justify-content: center;
    //                         align-items: center;
    //                         flex-direction: column;
    //                         text-align: center;
    //                       }
    //                       .modal-content {
    //                         width: 180mm; /* Slightly smaller than A4 to fit within margins */
    //                         height: 260mm;
    //                         padding: 20px;
    //                         display: flex;
    //                         flex-direction: column;
    //                         align-items: center;
    //                         justify-content: center;
    //                         border: 1px solid #000; /* Optional border for print clarity */
    //                       }
    //                       .qr-container {
    //                         width: 100%;
    //                         display: flex;
    //                         flex-direction: column;
    //                         align-items: center;
    //                         justify-content: space-between;
    //                       }
    //                       .qr-code {
    //                         margin: 20px 0;
    //                       }
    //                       h2 {
    //                         font-size: 20px;
    //                         margin-bottom: 10px;
    //                       }
    //                     </style>
    //                   </head>
    //                   <body>
    //                     <div class="modal-content">
    //                       <h2>${room.ShowRoom.toUpperCase()}</h2>
    //                       <div class="qr-container">
    //                         <div class="qr-code" id="qrCode1"></div>
    //                         <div class="qr-code" id="qrCode2"></div>
    //                       </div>
    //                     </div>
    //                   </body>
    //                 </html>
    //             `);
    
    //             printWindow.document.close();
    //             printWindow.focus();
    
    //             printWindow.onload = () => {
    //                 const qrCodeContainer1 = printWindow.document.getElementById('qrCode1');
    //                 const qrCodeContainer2 = printWindow.document.getElementById('qrCode2');
    
    //                 if (qrCodeContainer1 && qrCodeContainer2) {
    //                     new (QRCode as any)(qrCodeContainer1, {
    //                         text: room.showroomLink ?? '',
    //                         width: 120,
    //                         height: 120,
    //                     });
                    
    //                     new (QRCode as any)(qrCodeContainer2, {
    //                         text: room.showroomLink ?? '',
    //                         width: 120,
    //                         height: 120,
    //                     });
    //                 }
                    
                    
    
    //                 printWindow.print();
    //                 printWindow.close();
    //             };
    //         }
    //     }
    // };
    
    const handlePrintPDF = () => {
        const modalContent = document.getElementById("modal-content");
      
        if (!modalContent) return;
      
        // Use a higher scale for better quality
        html2canvas(modalContent, { scale: 4 }).then((canvas) => { // Increase scale for higher resolution
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const imgWidth = 190; // Adjust width to fit A4
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
          pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
          pdf.save("showroom-details.pdf");
        });
      };
      
    const handlePrint = () => {
        const originalContents = document.body.innerHTML;
        const printContents = listRef.current?.innerHTML || '';
        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
    };
    const handleManualInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
    
        if (name === 'manualLocationName') {
            setManualLocationName(value);
            setShowRoom((prevShowRoom) => ({
                ...prevShowRoom,
                manualLocationName: value,
                Location: value,
            }));
        } else if (name === 'manualLatLng') {
            // Split the input into latitude and longitude
            const [lat, lng] = value.split(',').map((coord) => parseFloat(coord.trim()));
            
            // Update the state regardless of validity
            setManualLatLng(value);
    
            // Update showRoom only if valid latitude and longitude are present
            if (!isNaN(lat) && !isNaN(lng)) {
                setShowRoom((prevShowRoom) => ({
                    ...prevShowRoom,
                    locationLatLng: { lat, lng },
                }));
            } else {
                setShowRoom((prevShowRoom) => ({
                    ...prevShowRoom,
                    locationLatLng: { lat: null, lng: null },
                }));
            }
        }
    };
    
    
    // -----------------------------------------------------------------

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    

    return (
        <div className="mb-5">
            <h5 className="font-semibold text-lg dark:text-white-light mb-5">Showroom Details</h5>

            <br />
            <div className="search-bar-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    style={{
                        padding: '10px',
                        borderRadius: '5px 0 0 5px',
                        border: '1px solid #ccc',
                        width: '80%',
                        fontSize: '16px',
                    }}
                />
                <button
                    style={{
                        padding: '10px 15px',
                        borderRadius: '0 5px 5px 0',
                        border: '1px solid #007bff',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        fontSize: '16px',
                        cursor: 'pointer',
                    }}
                >
                    Search
                </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '40px', paddingRight: '40px', marginBottom: '16px' }}>
                <div className="tooltip">
                    <button
                        onClick={handlePrint}
                        style={{
                            backgroundColor: 'gray',
                            color: '#fff',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        <IconPrinter />
                    </button>
                    <span className="tooltip-text">Print here</span>
                </div>
                <Button variant="contained" color="success" onClick={handleOpen}>
                    Create showroom
                </Button>
            </div>

            <div className="tableContainer overflow-x-auto" style={{ overflowX: 'auto' }} ref={listRef}>
                <table className="tableContainer">
                    <thead className="tableHeader">
                        <tr>
                        <th className="tableCell">#</th>

                            <th className="tableCell">Image</th>
                            <th className="tableCell">Showroom Name</th>
                            <th className="tableCell">Showroom Id</th>
                            <th className="tableCell">Location</th>
                            <th className="tableCell">User Name</th>
                            <th className="tableCell">Password</th>
                            <th className="tableCell">Help Line Number</th>
                            <th className="tableCell">Phone Number</th>
                            <th className="tableCell">Mobile Number</th>
                            <th className="tableCell">State</th>
                            <th className="tableCell">District</th>
                            <th className="tableCell">QR</th>
                            <th className="tableCell">Available Services</th>
                            <th className="tableCell">
                                Has Insurance
                                <br />
                                (Service Center)
                            </th>
                            <th className="tableCell">Insurance Amount Service Center</th>
                            <th className="tableCell">
                                Has Insurance
                                <br />
                                (Body Shop)
                            </th>
                            <th className="tableCell">Insurance Amount Body Shop</th>
                            <th className="tableCell">Description</th>
                            <th className="tableCell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((room,index) => (
                            <tr
                                key={room.id}
                                className="tableRow"
                                style={{ backgroundColor: room.status === 'admin added showroom' ? '#e6f7ff' : room.status === 'new showroom' ? '#f2f9ff' : 'transparent' }}
                            >
                                <td>{index+1}</td>
                                <td className="tableCell" data-label="Image">
                                    {/* Ensure room.img is properly defined */}
                                    {room.img ? (
                                        <img src={room.img} alt="ShowRoom" className="w-16 h-16 object-cover" style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
                                    ) : (
                                        'No Image Available'
                                    )}
                                </td>
                                <td className="tableCell" data-label="Showroom Name">
                                    {room.ShowRoom.toUpperCase()}
                                </td>
                                <td className="tableCell" data-label="Showroom Id">
                                    {room.showroomId}
                                </td>
                                <td className="tableCell" data-label="Location">
                                    {room.Location}
                                </td>
                                <td className="tableCell" data-label="User Name">
                                    {room.userName}
                                </td>
                                <td className="tableCell" data-label="Password">
                                    {room.password}
                                </td>
                                <td className="tableCell" data-label="Help Line Number">
                                    {room.tollfree}
                                </td>
                                <td className="tableCell" data-label="Phone Number">
                                    {room.phoneNumber}
                                </td>
                                <td className="tableCell" data-label="Mobile Number">
                                    {room.mobileNumber}
                                </td>
                                <td className="tableCell" data-label="State">
                                    {room.state}
                                </td>
                                <td className="tableCell" data-label="District">
                                    {room.district}
                                </td>
                              

                                <td className="tableCell" data-label="QR">
                {room.showroomLink ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/* View QR Button (Opens Modal) */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    padding: '10px 14px',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease-in-out',
                                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                            >
                                <FaQrcode size={18} /> View QR
                            </button>

                            {/* Print QR Button */}
                            {/* <button
onClick={handlePrinter}
style={{
                                    backgroundColor: '#28a745',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    padding: '10px 14px',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease-in-out',
                                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                            >
                                <FaPrint size={18} /> Print
                            </button> */}
                        </div>
                    </div>
                ) : (
                    <p>No QR Available</p>
                )}
            </td>

            {isModalOpen && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(40, 29, 29, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px",
    }}
    onClick={() => setIsModalOpen(false)}
  >
    <div>
      <div
        id="modal-content"
        ref={modalContentRef}
        className="modal-content"
        style={{
          backgroundImage: "url('/rsaqr.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "1588px", // A4 width (2x scale)
          height: "2246px", // A4 height (2x scale)
          overflowY: "auto",
          padding: "80px",
          borderRadius: "10px",
          position: "relative",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-around",
          backgroundColor: "#fff",
          transform: "scale(0.5)", // Scale down for screen preview
          transformOrigin: "top center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
            gap: "34%",
          }}
        >
          {/* QR Code 1 */}
          <div>
            <QRCode renderAs="svg" value={room.showroomLink ?? ""} size={400} />
            <div style={{ fontSize: "30px", fontWeight: "bold", marginTop: "10px" }}>
              {room.ShowRoom.toUpperCase()}
            </div>
          </div>

          {/* QR Code 2 */}
          <div>
            <QRCode renderAs="svg" value={room.showroomLink ?? ""} size={400} />
            <div style={{ fontSize: "30px", fontWeight: "bold", marginTop: "10px" }}>
              {room.ShowRoom.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsModalOpen(false)}
        style={{
          backgroundColor: "#dc3545",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          position: "absolute",
          bottom: "20px",
          left: "20px",
        }}
      >
        x
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrintPDF}
        style={{
          backgroundColor: "#007bff",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          position: "absolute",
          bottom: "20px",
          right: "20px",
        }}
      >
        Print PDF
      </button>
    </div>
  </div>
)}







                                <td className="tableCell" data-label="Available Services">
                                    {room.availableServices}
                                </td>
                                <td className="tableCell" data-label="Has Insurance(Service Center)">
                                    {room.hasInsurance}
                                </td>
                                <td className="tableCell" data-label="Insurance Amount Service Center">
                                    {room.insuranceAmount}
                                </td>
                                <td className="tableCell" data-label="Has Insurance(Body Shop)">
                                    {room.hasInsuranceBody}
                                </td>
                                <td className="tableCell" data-label="Insurance Amount Body Shop">
                                    {room.insuranceAmountBody}
                                </td>
                                <td className="tableCell" data-label="Description">
                                    {room.description}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', width: '100%' }}>
                                        <button onClick={() => handleEdit(room.id)}>
                                            <IconPencil className="text-primary" />
                                        </button>
                                        <button onClick={() => handleDelete(room.id)}>
                                            <IconTrashLines className="text-danger" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
                <Box sx={style}>
                    <form onSubmit={handleSubmit} ref={formRef} style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', borderRadius: '5px' }}>
                        <div className="mb-2" style={{ alignItems: 'center', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                            <h1 style={{ marginRight: '10px', fontSize: '1.2em', color: '#333' }}>Service type</h1>
                            <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                                <input
                                    type="checkbox"
                                    name="availableServices"
                                    value="Service Center"
                                    checked={showRoom.availableServices.includes('Service Center')}
                                    onChange={handleServiceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                Service Center
                            </label>
                            {showRoom.availableServices.includes('Service Center') && (
                                <div className="mb-2" style={{ marginLeft: '10px', backgroundColor: '#ffeeba', padding: '10px', borderRadius: '5px', fontSize: '0.9em' }}>
                                    <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Do you have insurance?</p>
                                    <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                        <input
                                            type="checkbox"
                                            name="hasInsurance"
                                            value="Yes"
                                            checked={showRoom.hasInsurance === 'Yes'}
                                            onChange={handleInsuranceChange}
                                            className="mr-1"
                                            style={{ marginRight: '5px' }}
                                        />
                                        Yes
                                    </label>
                                    <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                        <input
                                            type="checkbox"
                                            name="hasInsurance"
                                            value="No"
                                            checked={showRoom.hasInsurance === 'No'}
                                            onChange={handleInsuranceChange}
                                            className="mr-1"
                                            style={{ marginRight: '5px' }}
                                        />
                                        No
                                    </label>
                                    {showRoom.hasInsurance === 'Yes' && (
                                        <div className="mt-2" style={{ marginTop: '10px' }}>
                                            <label style={{ fontSize: '1em', color: '#333' }}>
                                                Insurance Amount:
                                                <input
                                                    type="text"
                                                    name="insuranceAmount"
                                                    value={showRoom.insuranceAmount}
                                                    onChange={handleChange}
                                                    className="form-input w-full mb-2"
                                                    required
                                                    style={{ width: '100%', padding: '5px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                            <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                                <input
                                    type="checkbox"
                                    name="availableServices"
                                    value="Body Shop"
                                    checked={showRoom.availableServices.includes('Body Shop')}
                                    onChange={handleServiceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                Body Shop
                            </label>
                            {showRoom.availableServices.includes('Body Shop') && (
                                <div className="mb-2" style={{ marginLeft: '10px', backgroundColor: '#ffeeba', padding: '10px', borderRadius: '5px', fontSize: '0.9em' }}>
                                    <p style={{ marginBottom: '5px', fontWeight: 'bold' }}>Do you have insurance?</p>
                                    <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                        <input
                                            type="checkbox"
                                            name="hasInsuranceBody"
                                            value="Yes"
                                            checked={showRoom.hasInsuranceBody === 'Yes'}
                                            onChange={handleBodyInsuranceChange}
                                            className="mr-1"
                                            style={{ marginRight: '5px' }}
                                        />
                                        Yes
                                    </label>
                                    <label className="mr-2" style={{ marginRight: '10px', fontSize: '1em' }}>
                                        <input
                                            type="checkbox"
                                            name="hasInsuranceBody"
                                            value="No"
                                            checked={showRoom.hasInsuranceBody === 'No'}
                                            onChange={handleBodyInsuranceChange}
                                            className="mr-1"
                                            style={{ marginRight: '5px' }}
                                        />
                                        No
                                    </label>
                                    {showRoom.hasInsuranceBody === 'Yes' && (
                                        <div className="mt-2" style={{ marginTop: '10px' }}>
                                            <label style={{ fontSize: '1em', color: '#333' }}>
                                                Insurance Amount:
                                                <input
                                                    type="text"
                                                    name="insuranceAmountBody"
                                                    value={showRoom.insuranceAmountBody}
                                                    onChange={handleBodyChange}
                                                    className="form-input w-full mb-2"
                                                    required
                                                    style={{ width: '100%', padding: '5px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                            <label className="mr-4" style={{ marginRight: '10px', fontSize: '1em', color: '#333' }}>
                                <input
                                    type="checkbox"
                                    name="availableServices"
                                    value="Showroom"
                                    checked={showRoom.availableServices.includes('Showroom')}
                                    onChange={handleServiceChange}
                                    className="mr-1"
                                    style={{ marginRight: '5px' }}
                                />
                                Showroom
                            </label>
                        </div>

                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                Showroom Name
                            </label>
                            <input
                                type="text"
                                name="ShowRoom"
                                value={showRoom.ShowRoom}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>
                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                ShowroomId
                            </label>
                            <input
                                type="text"
                                name="showroomId"
                                value={showRoom.showroomId}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>
                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={showRoom.description}
                                onChange={handleTextareaChange}
                                className="form-textarea w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em', minHeight: '100px' }}
                            />
                        </div>
                        <div className="mb-4" style={{ marginBottom: '16px' }}>
    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
        Location
    </label>
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" sx={{ gap: 2 }}>
        <TextField
            label="Manual Location Name"
            name="manualLocationName"
            value={manualLocationName}
            onChange={handleManualInputChange}
            fullWidth
            variant="outlined"
        />
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(manualLocationName)}`} target="_blank" rel="noopener noreferrer">
            <IconMapPin />
        </a>
        <TextField
            label="Latitude,Longitude"
            name="manualLatLng" // Ensure the name matches the handler
            value={manualLatLng} // Use the state variable
            onChange={handleManualInputChange} // Use the updated handler
            placeholder="e.g. 40.7128,-74.0060"
            fullWidth
            variant="outlined"
        />
        {showRoom.locationLatLng.lat && showRoom.locationLatLng.lng && (
            <Typography>{`Location Lat/Lng: ${showRoom.locationLatLng.lat}, ${showRoom.locationLatLng.lng}`}</Typography>
        )}
    </Box>
</div>


                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                User Name
                            </label>
                            <input
                                type="text"
                                name="userName"
                                value={showRoom.userName}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>

                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={showRoom.password}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>
                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                Help Line Number
                            </label>
                            <input
                                type="text"
                                name="tollfree"
                                value={showRoom.tollfree}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>

                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                Phone Number
                            </label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={showRoom.phoneNumber}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>

                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                name="mobileNumber"
                                value={showRoom.mobileNumber}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>

                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                State
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={showRoom.state}
                                onChange={handleChange}
                                className="form-input w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            />
                        </div>

                        <div className="mb-4" style={{ marginBottom: '16px' }}>
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '1em', color: '#333' }}>
                                District
                            </label>
                            <select
                                name="district"
                                value={showRoom.district}
                                onChange={handleChange}
                                className="form-select w-full"
                                required
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' }}
                            >
                                <option value="">Select District</option>
                                {keralaDistricts.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="image">Image</label>
                            <input type="file" name="img" onChange={handleImageUpload} />
                            {showRoom.img && <img src={showRoom.img} alt="Showroom Image" width="100" />}
                        </div>
                        {/* Display the generated link */}
                        {generatedLink && (
                            <div ref={qrRef}>
                                <p>Scan the QR code below to view the showroom details:</p>
                                <QRCode value={generatedLink} size={256} />
                                <p>{generatedLink}</p>
                            </div>
                        )}
                        {/* <div className="mb-4" style={{ marginBottom: '16px', textAlign: 'center' }}>
                            <Button
                                onClick={generateShowRoomLink}
                                variant="contained"
                                color="primary"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '1em',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Generate Showroom Link
                            </Button>
                        </div> */}
                        <div className="mb-4" style={{ marginBottom: '16px', textAlign: 'center' }}>
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1em',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {editRoomId ? 'Update Showroom' : 'Add Showroom'}
                            </button>
                        </div>
                    </form>
                </Box>
            </Modal>
            {isModalVisible && <ConfirmationModal isVisible={isModalVisible} onConfirm={onConfirmAction} onCancel={onCancelAction} />}
            <ToastContainer />
        </div>
    );
};

export default ShowRoom;