
import React, { useEffect } from 'react';
import { Calendar } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../src/AuthContext';  // Import the AuthContext

const CalendarComponent = () => {
  const { isAdmin } = useAuth();  // Access isAdmin from the context

  useEffect(() => {
    if (isAdmin) {
      const calendarEl = document.getElementById('calendar');
      const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, interactionPlugin],
        initialView: 'dayGridMonth',
        timeZone: 'America/Chicago',
        events: {
          url: '/events/getRangeAdmin',
          failure: function () {
            alert('Error fetching events!');
          }
        },
        dateClick: function (info) {
          console.log('Date clicked: ', info.dateStr);
        }
      });
    } else {
      console.log('Access denied: Admins only');
    }
  }, [isAdmin]);

  return <div id="calendar"></div>;
};

export default CalendarComponent;
