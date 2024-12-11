import React, { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import styles from '../Service/serviceType.module.css';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPencil from '../../components/Icon/IconPencil';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import { Button } from '@mui/material';

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

interface Feedback {
    id: string;
    question: string;
    yesPoints: number;
    noPoints: number;
}

const predefinedQuestions = [
    'Is the driver wearing uniform?',
    'How is the driver\'s behavior?',
    'Is the driver wearing ID card?',
    'Did the driver fill the inventory sheet?',
    'Did the driver take a feedback video?',
];

const FeedbackTable: React.FC = () => {
    const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
    const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({ question: '', yesPoints: '', noPoints: '' });
    const uid = sessionStorage.getItem('uid');

    useEffect(() => {
        if (!uid) return;

        const fetchFeedbackItems = async () => {
            const db = getFirestore();
            const feedbackRef = collection(db, `user/${uid}/feedbackpoints`);
            try {
                const snapshot = await getDocs(feedbackRef);
                const items = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Feedback[];
                setFeedbackItems(items);
            } catch (error) {
                console.error('Error fetching feedback items:', error);
            }
        };

        fetchFeedbackItems();
    }, [uid]);

    const handleOpenModal = (item: Feedback | null = null) => {
        setCurrentFeedback(item);
        setFormData({
            question: item?.question || '',
            yesPoints: item?.yesPoints.toString() || '',
            noPoints: item?.noPoints.toString() || '',
        });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setCurrentFeedback(null);
        setFormData({ question: '', yesPoints: '', noPoints: '' });
    };

    const handleSubmit = async () => {
        if (!uid) return;
        const db = getFirestore();
        const feedbackRef = collection(db, `user/${uid}/feedbackpoints`);
        const data = {
            question: formData.question,
            yesPoints: Number(formData.yesPoints),
            noPoints: Number(formData.noPoints),
        };

        try {
            if (currentFeedback) {
                const docRef = doc(db, `user/${uid}/feedbackpoints`, currentFeedback.id);
                await updateDoc(docRef, data);
                setFeedbackItems((prev) =>
                    prev.map((item) => (item.id === currentFeedback.id ? { ...item, ...data } : item))
                );
            } else {
                const docRef = await addDoc(feedbackRef, data);
                setFeedbackItems([...feedbackItems, { id: docRef.id, ...data }]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving feedback:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!uid) return;

        const db = getFirestore();
        const docRef = doc(db, `user/${uid}/feedbackpoints`, id);

        try {
            await deleteDoc(docRef);
            setFeedbackItems((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error('Error deleting feedback item:', error);
        }
    };

    return (
        <div>
<h1 style={{
    fontSize: '36px', 
    fontWeight: 'bold', 
    color: '#4CAF50', 
    textAlign: 'center', 
    margin: '20px 0', 
    padding: '10px', 
    textTransform: 'uppercase', 
    letterSpacing: '2px'
}}>
    FeedBack Points
</h1>
            <div className="d-flex justify-content-end mb-3">
                <button
                    className={styles.addButton}
                    onClick={() => handleOpenModal()}
                >
                    Add Feedback
                </button>
            </div>
            <table className={styles.tableContainer}>
                <thead>
                    <tr>
                        <th>Question</th>
                        <th>Points (Yes)</th>
                        <th>Points (No)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {feedbackItems.map((item) => (
                        <tr key={item.id}>
                            <td>{item.question}</td>
                            <td>{item.yesPoints}</td>
                            <td>{item.noPoints}</td>
                            <td>
                                <button onClick={() => handleOpenModal(item)}>
                                    <IconPencil />
                                </button>
                                <button onClick={() => handleDelete(item.id)}>
                                    <IconTrashLines />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box sx={modalStyle}>
                    <div>
                        <label>Question</label>
                        <select
                            value={formData.question}
                            onChange={(e) =>
                                setFormData({ ...formData, question: e.target.value })
                            }
                        >
                            <option value="">Select a question</option>
                            {predefinedQuestions.map((question, index) => (
                                <option key={index} value={question}>
                                    {question}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Points (Yes)</label>
                        <input
                            type="number"
                            value={formData.yesPoints}
                            onChange={(e) =>
                                setFormData({ ...formData, yesPoints: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label>Points (No)</label>
                        <input
                            type="number"
                            value={formData.noPoints}
                            onChange={(e) =>
                                setFormData({ ...formData, noPoints: e.target.value })
                            }
                        />
                    </div>
                    <div className="d-flex justify-content-end mt-3">
                        <Button onClick={handleCloseModal}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save</Button>
                    </div>
                </Box>
            </Modal>
        </div>
    );
};

export default FeedbackTable;
