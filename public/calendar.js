document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable:true,
        dateClick: function(info) {
            //alert('Clicked on: ' + info.dateStr);
            //alert('Coordinates: ' + info.jsEvent.pageX + ',' + info.jsEvent.pageY);
            //alert('Current view: ' + info.view.type);
            // change the day's background color just for fun
            info.dayEl.style.backgroundColor = 'red';
            var month = info.date.getMonth()+1;
            var day = info.date.getDate();
            var year = info.date.getFullYear();
            window.location.href = '/newEvent/'+month+'/'+day+'/'+year;
        }
    });
    calendar.render();
});