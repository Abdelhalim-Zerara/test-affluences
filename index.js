const express = require('express');
const moment = require('moment');


const app = express();



const PORT = 5000;

app.use(express.json());




app.get('/availability', async (req, res) => {
  const datetime = req.query.datetime;
  const resourceId = req.query.resourceId;

  if (!moment(datetime, moment.ISO_8601, true).isValid()) {
    res.status(400).json({ error: 'wrong format for param datetime' });
    return;
  }

  if (resourceId != 1337) {
    res.status(404).json({ error: 'resource not found' });
    return;
  }

  const today = moment().startOf('day');
  const requestedDatetime = moment(datetime);

  if (!requestedDatetime.isSame(today, 'day')) {
    res.json({ available: false });
    return;
  }

  try {
    const [reservationsResponse, timetablesResponse] = await Promise.all([
      axios.get('http://localhost:8080/timetables?date=2020-03-19&resourceId=1337'),
      axios.get('http://localhost:8080/timetables?date=2020-03-19&resourceId=1337'),
    ]);

    const reservations = reservationsResponse.data.reservations;
    const timetables = timetablesResponse.data.timetables;

    // Check availability logic

    res.json({ available: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, (req, res) => {
    console.log('listening on port ' + PORT);
})

