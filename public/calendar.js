document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        timeZone:'America/Chicago',
        dateClick: function(info) {
            //alert('Clicked on: ' + info.dateStr);
            //alert('Coordinates: ' + info.jsEvent.pageX + ',' + info.jsEvent.pageY);
            //alert('Current view: ' + info.view.type);
            // change the day's background color just for fun
            info.dayEl.style.backgroundColor = 'red';
            var month = info.date.getUTCMonth()+1;
            var day = info.date.getUTCDate();
            var year = info.date.getUTCFullYear();
            window.location.href = '/newEvent/'+month+'/'+day+'/'+year;
        },
        events: {
            url: '/events/getRange',
            failure: function() {
              alert('there was an error while fetching events!');
            }
          }
    });
    calendar.render();
});