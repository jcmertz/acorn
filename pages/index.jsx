
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../src/AuthContext';  // Use the AuthContext for authentication status
import FullCalendar from '@fullcalendar/react'; // Import FullCalendar React component
import dayGridPlugin from '@fullcalendar/daygrid'; // Import dayGrid plugin

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();  // Access authentication status
  const calendarRef = useRef(null);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarEl = calendarRef.current;

      // FullCalendar instance
      const calendar = new FullCalendar.Calendar(calendarEl, {
        plugins: [dayGridPlugin],
        initialView: 'dayGridMonth',
        timeZone: 'America/Chicago',
        dateClick: function(info) {
          if (info.date.getDay() === 0) {  // Block Sundays (or Mondays in the original)
            return;
          } else {
            const month = info.date.getUTCMonth() + 1;
            const day = info.date.getUTCDate();
            const year = info.date.getUTCFullYear();
            window.location.href = `/newEvent/${month}/${day}/${year}`;
          }
        },
        events: {
          url: isAdmin ? '/events/getRangeAdmin' : '/events/getRange',
          failure: function() {
            alert('There was an error while fetching events!');
          }
        },
        dayCellDidMount: function(arg) {  // Color background of Mondays
          if (arg.dow === 1) {
            arg.el.style.backgroundColor = 'gray';
          }
        },
        firstDay: 1
      });
      calendar.render();
    }
  }, [isAdmin]);

  return (
    <div>
      {!isAuthenticated ? (
        <>
          <a href="/login"><h3>LOGIN</h3></a>
          <a href="/register"><h3>REGISTER</h3></a>
        </>
      ) : (
        <>
          <a href="/logout"><h3>LOGOUT</h3></a>
          <a href="/profile"><h3>My Profile</h3></a>
        </>
      )}
      <div id="calendar" ref={calendarRef}></div>
    </div>
  );
};

export default Home;
