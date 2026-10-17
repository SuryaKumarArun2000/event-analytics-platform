
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import "./Dashboard.css";

let API_URL = import.meta.env.VITE_API_URL;

API_URL = `${API_URL}/api/analytics`;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getInitialDates() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  return {
    startDate: formatDate(start),
    endDate: formatDate(today)
  };
}

function Dashboard() {
  const initialDates = getInitialDates();

  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  const [summary, setSummary] = useState(null);
  const [pages, setPages] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        startDate,
        endDate
      });

      try {
        const responses = await Promise.all([
          fetch(`${API_URL}/summary?${params}`),
          fetch(`${API_URL}/pages?${params}`),
          fetch(`${API_URL}/trends?${params}`)
        ]);

        const results = await Promise.all(
          responses.map(async (response) => {
            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message || "Failed to load dashboard"
              );
            }

            return data;
          })
        );

        if (cancelled) return;

        setSummary(results[0].data);
        setPages(results[1].data);
        setTrends(results[2].data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  function applyDateFilter(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const start = form.elements.startDate.value;
    const end = form.elements.endDate.value;

    if (!start || !end || start > end) {
      setError("Please select a valid date range.");
      return;
    }

    setStartDate(start);
    setEndDate(end);
  }

  const cards = [
    {
      label: "Total Events",
      value: summary?.totalEvents ?? 0
    },
    {
      label: "Unique Visitors",
      value: summary?.uniqueVisitors ?? 0
    },
    {
      label: "Page Views",
      value: summary?.pageViews ?? 0
    },
    {
      label: "Orders Created",
      value: summary?.ordersCreated ?? 0
    }
  ];

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Understand your restaurant website activity.</p>
        </div>

        <a href="/">Visit Restaurant</a>
      </header>

      <form className="date-filter" onSubmit={applyDateFilter}>
        <label>
          Start date
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            max={endDate}
            required
          />
        </label>

        <label>
          End date
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            min={startDate}
            required
          />
        </label>

        <button type="submit">Apply Filter</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Loading analytics...</p>
      ) : (
        <>
          <section className="summary-grid">
            {cards.map((card) => (
              <article className="summary-card" key={card.label}>
                <p>{card.label}</p>
                <h2>{card.value.toLocaleString()}</h2>
              </article>
            ))}
          </section>

          <section className="dashboard-panel">
            <h2>Daily Event Trends</h2>

            {trends.length === 0 ? (
              <p>No events found for this date range.</p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="events"
                      name="Events"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <h2>Popular Pages</h2>

            {pages.length === 0 ? (
              <p>No page views found for this date range.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Views</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pages.map((page) => (
                      <tr key={page.path}>
                        <td>{page.path}</td>
                        <td>{page.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;
