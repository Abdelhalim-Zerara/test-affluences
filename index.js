const express = require('express');
const moment = require('moment');
const axios = require('axios');

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
  const isAvailable = reservations.every((reservation) => {
  const reservationStart = moment(reservation.reservationStart);
  const reservationEnd = moment(reservation.reservationEnd);
  // Check if the given datetime falls within any existing reservation
  if (requestedDatetime.isBetween(reservationStart, reservationEnd, null, '[]')) {
    return false; // Not available
  }

  // Check if the given datetime falls within any opening hours
  const timetable = timetables.find((timetable) => {
    const opening = moment(timetable.opening);
    const closing = moment(timetable.closing);
    return requestedDatetime.isBetween(opening, closing, null, '[]');
  });

  if (!timetable) {
    return false; // Not available
  }

  return true; // Available
  });
    res.json({ available: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});





app.listen(PORT, (req, res) => {
    console.log('listening on port ' + PORT);
})

