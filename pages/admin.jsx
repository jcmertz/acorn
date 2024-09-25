import React, { useEffect } from 'react';
import { Calendar } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react'; // Ensure you install @fullcalendar/react
import '@fullcalendar/daygrid/main.css'; // Import CSS for FullCalendar

const CalendarComponent = () => {
  
  useEffect(() => {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      timeZone: 'America/Chicago',
      events: {
        url: '/events/getRangeAdmin',
        failure: function () {
          alert('there was an error while fetching events!');
        }
      },
      dateClick: function (info) {
        console.log('Date clicked: ', info.dateStr);
      },
      dayCellDidMount: function (arg) {
        if (arg.dow === 1) { // Monday
          arg.el.style.backgroundColor = 'gray'; // Apply background color
        }
      },
      firstDay: 1
    });
    calendar.render();

    return () => {
      calendar.destroy(); // Cleanup on unmount
    };
  }, []);

  return (
    <div>
      <a href="/logout">
        <h3>LOGOUT</h3>
      </a>
      <a href="/">
        <h3>User View</h3>
      </a>
      <div id="calendar"></div>
    </div>
  );
};

export default CalendarComponent;
