document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        timeZone:'America/Chicago',
        dateClick: function(info) {
            //alert('Clicked on: ' + info.dateStr);
            //alert('Coordinates: ' + info.jsEvent.pageX + ',' + info.jsEvent.pageY);
            //alert('Current view: ' + info.view.type);
            if (info.date.getDay()==0){ //Blockout Mondays
                console.log("TEST");
                return;
            }
            else{
                var month = info.date.getUTCMonth()+1;
                var day = info.date.getUTCDate();
                var year = info.date.getUTCFullYear();
                window.location.href = '/newEvent/'+month+'/'+day+'/'+year;
            }
        },
        events: {
            url: '/events/getRange',
            failure: function() {
                alert('there was an error while fetching events!');
            }
        },
        dayCellDidMount: function (arg) { //Color background of Mondays
            if (arg.dow == 1) {
                arg.el.bgColor="gray";
            }
        },
        firstDay:1
    });
    calendar.render();
});