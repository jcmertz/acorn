import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarPage = ({ isLoggedIn, isAdmin }) => {
  const handleDateClick = (info) => {
    if (info.date.getDay() === 1) { // Blockout Mondays
      return;
    } else {
      const month = info.date.getUTCMonth() + 1;
      const day = info.date.getUTCDate();
      const year = info.date.getUTCFullYear();
      window.location.href = `/newEvent/${month}/${day}/${year}`;
    }
  };

  const handleEventFetchError = () => {
    alert('There was an error while fetching events!');
  };

  return (
    <div>
      {!isLoggedIn ? (
        <>
          <a href="/login">
            <h3>LOGIN</h3>
          </a>
          <a href="/register">
            <h3>REGISTER</h3>
          </a>
        </>
      ) : (
        <>
          <a href="/logout">
            <h3>LOGOUT</h3>
          </a>
          <a href="/profile">
            <h3>My Profile</h3>
          </a>
        </>
      )}

      <div id="calendar">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          timeZone="America/Chicago"
          dateClick={handleDateClick}
          events={{
            url: isAdmin ? '/events/getRangeAdmin' : '/events/getRange',
            failure: handleEventFetchError
          }}
          dayCellDidMount={(arg) => {
            if (arg.dow === 1) {
              arg.el.style.backgroundColor = 'gray'; // Color background of Mondays
            }
          }}
          firstDay={1}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
