import React, { useState } from 'react';
import MapBooking from './MapBooking';
import WithoutMapBooking from './WithoutMapBooking';
 const Booking = () => {
    const [activeForm, setActiveForm] = useState('map');

        const handleWithMapClick = () => {
          setActiveForm('map');
        };
      
        const handleWithoutMapClick = () => {
          setActiveForm('withoutMap');
        };
      
    return (
        <div style={{ backgroundColor: '#e6f7ff', padding: '2rem', borderRadius: '10px', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="flex space-x-4">
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
          onClick={handleWithMapClick}
        >
          With Using Map
        </button>
        <button 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
          onClick={handleWithoutMapClick}
        >
          Without Using Map
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
        <h5 className="font-semibold text-lg dark:text-white-light">Add Bookings</h5>
        {activeForm === 'map' && <MapBooking />}
        {activeForm === 'withoutMap' && <WithoutMapBooking />}
              
            </div>
        </div>
    );
};

export default Booking;
