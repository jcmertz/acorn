const express = require('express');
const app = express();
const port = 2554;

const fullcalendar = require('fullcalendar');

app.set('views', __dirname + '/views');
app.set('view engine', "ejs");

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
})

app.get('/newEvent/:month/:day/:year', (req, res) => {
  res.render('newEvent',{
    month:req.params.month,
    day:req.params.day,
    year:req.params.year
  }
);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
