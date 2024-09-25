import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; // If you're using React Router

const ShowDetails = ({ show, isAdmin }) => {
  const [showStatus, setShowStatus] = useState(show.showStatus);
  const history = useHistory(); // For "Back" functionality

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== showStatus) {
      setShowStatus(newStatus);
      // Submit the form via a fetch or axios call to /admin/setShowStatus
      fetch(`/admin/setShowStatus?id=${show._id}&showStatus=${newStatus}`, {
        method: 'GET',
      }).then((response) => {
        // handle response
      }).catch((error) => {
        console.error('Error updating show status:', error);
      });
    }
  };

  useEffect(() => {
    setShowStatus(show.showStatus);
  }, [show.showStatus]);

  return (
    <div>
      <a href="/logout">
        <h3>LOGOUT</h3>
      </a>
      <a onClick={() => history.goBack()}>
        <h3>BACK</h3>
      </a>
      <div className="row">
        <div className="column">
          <h1>Show Details</h1>
          <p>Band: {show.contactBand.bandName}</p>
          <p>Date: {new Date(show.showDate).toLocaleDateString()}</p>
          <p>Show Status:</p>
          <form id="form" action="/admin/setShowStatus" method="get">
            <input type="hidden" name="id" value={show._id} />
            <select
              id="status"
              name="showStatus"
              value={showStatus}
              onChange={handleStatusChange}
              disabled={!isAdmin} // Disable if not admin
            >
              <option value="-1">Rejected/Canceled</option>
              <option value="0">Submitted, Not Responded To</option>
              <option value="1">In Negotiation</option>
              <option value="2">Confirmed</option>
            </select>
          </form>
        </div>
        <div className="column">
          <h2>Messages</h2>
          {/* Assuming you have a Messages component to handle message rendering */}
          {/* Replace this with your message rendering logic */}
        </div>
      </div>
    </div>
  );
};

export default ShowDetails;
