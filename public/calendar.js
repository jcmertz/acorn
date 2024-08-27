// const { data } = require("jquery");

console.log(data);
var events = [];
for (const event in data){
    console.log(data.event);
    events.push({
        title: data[event].contactBand.bandName,
        start: data[event].showDate
    })
}
document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
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
        },
        events: events
    });
    calendar.render();
});