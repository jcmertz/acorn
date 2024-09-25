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
      showDate: `${month}/${day}/${year}`,
      reqDate,
    };
    // You can use fetch or axios to submit formData to the backend
    console.log('Form submitted:', formData);
  };

  return (
    <div>
      <h1>NEW EVENT REQUEST</h1>
      <p>New Event Request For: {bandName} on {month}/{day}/{year}</p>
      <form id="newEventForm" onSubmit={handleSubmit}>
        {bands.map((band, index) => (
          <div id={`div${index}`} key={index}>
            <input
              type="text"
              id={`band${index}`}
              name={`band${index}`}
              value={band.name}
              list="knownBands"
              onChange={(e) => handleBandChange(index, e.target.value)}
              autoComplete="off"
            />
            {index > 0 && (
              <input
                type="button"
                value="X"
                onClick={() => deleteBandField(index)}
              />
            )}
          </div>
        ))}
        <input
          type="hidden"
          id="bandCount"
          name="bandCount"
          value={bandCount}
        />
        <input type="button" className="addBand" value="Add Band" onClick={updateForm} />
        <br />
        <input
          type="checkbox"
          id="isMatinee"
          name="isMatinee"
          checked={isMatinee}
          onChange={(e) => setIsMatinee(e.target.checked)}
        />
        <label htmlFor="isMatinee"> Check this box if you'd like a Matinee</label>
        <br />
        <input type="hidden" name="showDate" value={`${month}/${day}/${year}`} />
        <input type="hidden" id="reqDate" name="reqDate" value={reqDate} />
        <input type="submit" value="Submit" />
      </form>

      <datalist id="knownBands">
        {knownBands.map((band, index) => (
          <option key={index} value={band} />
        ))}
      </datalist>
    </div>
  );
};

export default NewEventRequest;
