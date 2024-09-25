
import React, { useState, useEffect } from 'react';

const NewEventRequest = ({ bandName, month, day, year, knownBands }) => {
  const [bandCount, setBandCount] = useState(1);
  const [bands, setBands] = useState([{ name: bandName }]);
  const [isMatinee, setIsMatinee] = useState(false);
  const [reqDate, setReqDate] = useState('');

  useEffect(() => {
    const date = new Date().toLocaleDateString();
    setReqDate(date);
  }, []);

  const updateForm = () => {
    setBands([...bands, { name: '' }]);
    setBandCount(bandCount + 1);
  };

  const deleteBandField = (index) => {
    setBands(bands.filter((_, i) => i !== index));
    setBandCount(bandCount - 1);
  };

  const handleBandChange = (index, value) => {
    const newBands = [...bands];
    newBands[index].name = value;
    setBands(newBands);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      bands: bands.map(band => band.name),
      isMatinee,
      showDate: `${month}/${day}/${year}`
    };

    // Send form data to the server
    fetch('/events/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    }).then(response => {
      if (response.ok) {
        alert('Event created successfully');
      } else {
        alert('Failed to create event');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Band and event form structure */}
    </form>
  );
};

export default NewEventRequest;
