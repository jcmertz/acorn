import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import '@fullcalendar/list/main.css'; // Import necessary CSS for the list view

const BandPage = ({ band }) => {
  
  useEffect(() => {
    const calendarEl = document.getElementById('upcomingShows');
    const calendar = new FullCalendar(calendarEl, {
      plugins: [listPlugin],
      initialView: 'listYear',
      timeZone: 'America/Chicago',
      events: {
        url: '/events/getRange',
        extraParams: {
          band: band.bandName, // Inject band name from props
        },
        failure: function () {
          alert('There was an error while fetching events!');
        }
      },
      headerToolbar: {
        left: '',
        center: 'title',
        right: 'prev,next'
      }
    });
    calendar.render();

    return () => {
      calendar.destroy(); // Cleanup on unmount
    };
  }, [band.bandName]); // Re-run when the band name changes

  return (
    <div>
      <a href="/">
        <h3>Home</h3>
      </a>
      <h1>{band.bandName}</h1>
      <p>Email: {band.contactEmail}</p>
      <p>
        Instagram: 
        <a href={`https://instagram.com/${band.instagram.substring(1)}`}>
          {band.instagram}
        </a>
      </p>
      <p>Genre: {band.genre}</p>
      <p>Hometown: {band.homeTown}</p>

      <h2>Upcoming Shows</h2>
      <div id="upcomingShows"></div>
    </div>
  );
};

export default BandPage;
