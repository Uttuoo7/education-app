import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import axios from "axios";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

export default function SchedulePage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/schedule",
        { withCredentials: true }
      );

      const formatted = res.data.map(event => {
        const now = new Date();
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);

        let status = "Upcoming";

        if (now >= start && now <= end) {
          status = "Live";
        } else if (now > end) {
          status = "Completed";
        }

        return {
          title: `${event.title} (${status})`,
          start,
          end,
        };
      });

      setEvents(formatted);

    } catch (err) {
      console.error("Schedule fetch error:", err);
    }
  };

  const handleSelectSlot = async ({ start, end }) => {
    const title = prompt("Enter class title:");
    if (!title) return;

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/schedule",
        {
          title,
          description: "",
          start_time: start,
          end_time: end,
          meeting_link: ""
        },
        { withCredentials: true }
      );

      fetchSchedules();
    } catch (err) {
      console.error("Create schedule error:", err);
    }
  };

  const handleSelectEvent = (event) => {
    alert(
      `Title: ${event.title}\nStart: ${event.start}\nEnd: ${event.end}`
    );
  };

  return (
    <div className="h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Class Schedule</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        style={{ height: "85vh" }}
      />
    </div>
  );
}