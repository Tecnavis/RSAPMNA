import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import styles from './feedback.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDocs, collection, setDoc } from 'firebase/firestore';

interface FeedbackState {
    isDriverWearingUniform: string;
    driverBehaviour: string;
    isDriverWearingIdCard: string;
    isInventoryFilled: string;
    isFeedbackVideoTaken: string;
}

interface PointsState {
    isDriverWearingUniform: { yesPoints: number; noPoints: number; selected?: number };
    driverBehaviour: { yesPoints: number; noPoints: number; selected?: number };
    isDriverWearingIdCard: { yesPoints: number; noPoints: number; selected?: number };
    isInventoryFilled: { yesPoints: number; noPoints: number; selected?: number };
    isFeedbackVideoTaken: { yesPoints: number; noPoints: number; selected?: number };
}

const Feedback: React.FC = () => {
    const location = useLocation();
    const { bookingId, selectedDriver } = location.state || {};
    const db = getFirestore();
    const uid = sessionStorage.getItem('uid');
    const navigate = useNavigate();

    const [feedback, setFeedback] = useState<FeedbackState>({
        isDriverWearingUniform: '',
        driverBehaviour: '',
        isDriverWearingIdCard: '',
        isInventoryFilled: '',
        isFeedbackVideoTaken: '',
    });

    const [points, setPoints] = useState<PointsState>({
        isDriverWearingUniform: { yesPoints: 0, noPoints: 0 },
        driverBehaviour: { yesPoints: 0, noPoints: 0 },
        isDriverWearingIdCard: { yesPoints: 0, noPoints: 0 },
        isInventoryFilled: { yesPoints: 0, noPoints: 0 },
        isFeedbackVideoTaken: { yesPoints: 0, noPoints: 0 },
    });

    const [totalPoints, setTotalPoints] = useState<number>(0);

    useEffect(() => {
        const fetchPoints = async () => {
            if (!uid) {
                console.log("No UID found, skipping fetch.");
                return;
            }

            try {
                console.log("Fetching feedback points from Firestore...");

                const feedbackPointsRef = collection(db, `user/${uid}/feedbackpoints`);
                const feedbackPointsSnapshot = await getDocs(feedbackPointsRef);

                if (!feedbackPointsSnapshot.empty) {
                    const feedbackPointsData: Partial<PointsState> = {};

                    feedbackPointsSnapshot.forEach((doc) => {
                        const data = doc.data();
                        const { question, yesPoints, noPoints } = data;

                        if (question) {
                            const questionKey = mapQuestionToStateKey(question);

                            if (questionKey) {
                                feedbackPointsData[questionKey] = {
                                    yesPoints: yesPoints || 0,
                                    noPoints: noPoints || 0,
                                };
                            }
                        }
                    });

                    console.log("Feedback points data:", feedbackPointsData);
                    setPoints((prev) => ({
                        ...prev,
                        ...feedbackPointsData,
                    })); // Update the points state
                } else {
                    console.log("No feedback points found in snapshot.");
                }
            } catch (error) {
                console.error("Error fetching feedback points: ", error);
            }
        };

        fetchPoints();
    }, [db, uid]);

    const mapQuestionToStateKey = (question: string): keyof PointsState | null => {
        const questionMap: { [key: string]: keyof PointsState } = {
            "Is the driver wearing uniform?": "isDriverWearingUniform",
            "How is the driver's behavior?": "driverBehaviour",
            "Is the driver wearing ID card?": "isDriverWearingIdCard",
            "Did the driver fill the inventory sheet?": "isInventoryFilled",
            "Did the driver take a feedback video?": "isFeedbackVideoTaken",
        };

        return questionMap[question] || null;
    };

    useEffect(() => {
        const total = Object.values(points).reduce((sum, point) => {
            if (point.selected !== undefined) {
                return sum + point.selected;
            }
            return sum;
        }, 0);
        setTotalPoints(total);
    }, [points]);

    const handleChange = (question: keyof FeedbackState, value: string) => {
        setFeedback((prev) => ({
            ...prev,
            [question]: value,
        }));

        const selectedPoints =
            value === "yesPoints"
                ? points[question]?.yesPoints || 0
                : points[question]?.noPoints || 0;

        setPoints((prev) => ({
            ...prev,
            [question]: {
                ...prev[question],
                selected: selectedPoints,
            },
        }));
    };

    const validateForm = (): boolean => {
        return Object.values(feedback).every((answer) => answer !== '');
    };

    const handleSubmitAndUpdateRewardPoints = async () => {
        if (!validateForm()) {
            alert('Please fill all fields.');
            return;
        }
    
        const feedbackData = {
            feedback,
            totalPoints,
            timestamp: new Date(),
        };
    
        try {
            // Submit feedback
            const driverDocRef = doc(collection(db, `user/${uid}/driver`), selectedDriver);
            await setDoc(
                doc(driverDocRef, 'feedbacks', bookingId),
                feedbackData,
                { merge: true }
            );
    
            const bookingDocRef = doc(db, `user/${uid}/bookings`, bookingId);
            await setDoc(bookingDocRef, { feedback: true }, { merge: true });
    
            // Calculate total points from feedbacks subcollection
            const feedbacksRef = collection(driverDocRef, 'feedbacks');
            const feedbacksSnapshot = await getDocs(feedbacksRef);
    
            let totalRewardPoints = 0;
            feedbacksSnapshot.forEach((doc) => {
                const data = doc.data();
                totalRewardPoints += data.totalPoints || 0; // Sum up totalPoints
            });
    
            // Update rewardPoints in the driver document
            await setDoc(driverDocRef, { rewardPoints: totalRewardPoints }, { merge: true });
    
            alert('Feedback submitted and reward points updated successfully!');
            navigate(`/bookings/closedbooking`);
        } catch (error) {
            console.error("Error in submitting feedback and updating reward points: ", error);
            alert('Failed to submit feedback and update reward points.');
        }
    };
    
    return (
        <div className={styles['form-container']}>
            <h1>Feedback Form</h1>
            <h2>Total Points: {totalPoints}</h2>
            <form>
                <div className={styles['feedback-section']}>
                    <label>1. Is the driver wearing uniform?</label>
                    <select
                        value={feedback.isDriverWearingUniform}
                        onChange={(e) => handleChange('isDriverWearingUniform', e.target.value)}
                    >
                        <option value="">Select</option>
                        <option value="yesPoints">Yes</option>
                        <option value="noPoints">No</option>
                    </select>
                </div>
                <div className={styles['feedback-section']}>
                    <label>2. How is the driver's behavior?</label>
                    <select
                        value={feedback.driverBehaviour}
                        onChange={(e) => handleChange('driverBehaviour', e.target.value)}
                    >
                        <option value="">Select</option>
                        <option value="yesPoints">Good</option>
                        <option value="noPoints">Bad</option>
                    </select>
                </div>
                <div className={styles['feedback-section']}>
                    <label>3. Is the driver wearing ID card?</label>
                    <select
                        value={feedback.isDriverWearingIdCard}
                        onChange={(e) => handleChange('isDriverWearingIdCard', e.target.value)}
                    >
                        <option value="">Select</option>
                        <option value="yesPoints">Yes</option>
                        <option value="noPoints">No</option>
                    </select>
                </div>
                <div className={styles['feedback-section']}>
                    <label>4. Did the driver fill the inventory sheet?</label>
                    <select
                        value={feedback.isInventoryFilled}
                        onChange={(e) => handleChange('isInventoryFilled', e.target.value)}
                    >
                        <option value="">Select</option>
                        <option value="yesPoints">Filled</option>
                        <option value="noPoints">Unfilled</option>
                    </select>
                </div>
                <div className={styles['feedback-section']}>
                    <label>5. Did the driver take a feedback video?</label>
                    <select
                        value={feedback.isFeedbackVideoTaken}
                        onChange={(e) => handleChange('isFeedbackVideoTaken', e.target.value)}
                    >
                        <option value="">Select</option>
                        <option value="yesPoints">Yes</option>
                        <option value="noPoints">No</option>
                    </select>
                </div>
                <Button
    type="button"
    variant="contained"
    color="primary"
    className={styles['submit-button']}
    onClick={handleSubmitAndUpdateRewardPoints}
>
    Submit Feedback
</Button>

            </form>
        </div>
    );
};

export default Feedback;
