import { useLocation } from 'react-router-dom';

const Feedback = () => {
    const location = useLocation();
    const { bookingId } = location.state || {};

    return (
        <div>
            <h1>Feedback Form</h1>
            {bookingId ? (
                <p>Booking ID: {bookingId}</p>
            ) : (
                <p>No booking ID provided.</p>
            )}
            {/* Feedback form content */}
        </div>
    );
};

export default Feedback;
