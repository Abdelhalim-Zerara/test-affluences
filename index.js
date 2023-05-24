const express = require("express");
const axios = require("axios");

const app = express();

const PORT = 5000;

app.use(express.json());

app.get("/availability", async (req, res) => {
  const datetime = req.query.datetime;
  const resourceId = req.query.resourceId;

  if (resourceId != 1337) {
    res.status(404).json({ error: "resource not found" });
    return;
  }

  const requestedDatetime = new Date(datetime);
  const date = requestedDatetime.toISOString().split("T")[0];

  try {
    const [reservationsResponse, timetablesResponse] = await Promise.all([
      axios.get(
        `http://localhost:8080/reservations?date=${date}&resourceId=1337`
      ),
      axios.get(
        `http://localhost:8080/timetables?date=${date}&resourceId=1337`
      ),
    ]);

    const reservations = reservationsResponse.data.reservations;
    const timetables = timetablesResponse.data.timetables;

    if (!timetablesResponse.data.open) {
      res.json({ available: false });
    }

    if (!reservations) {
      res.json({ available: false });
    }

    const timetable = timetables.some((timetable) => {
      const opening = new Date(timetable.opening);
      const closing = new Date(timetable.closing);
      return requestedDatetime >= opening && requestedDatetime < closing;
    });

    const reservation = reservations.every((reservation) => {
      const reservationStart = new Date(reservation.reservationStart);
      const reservationEnd = new Date(reservation.reservationEnd);

      if (
        requestedDatetime >= reservationStart &&
        requestedDatetime < reservationEnd
      ) {
        return false;
      }
      return true;
    });

    const isAvailable = reservation && timetable;

    res.json({ available: isAvailable });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});
