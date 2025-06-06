import React, { useState, useEffect } from 'react';
import './App.css';
import './style.css'; 

function App() {
  const [seriesId, setSeriesId] = useState('GDP');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');

  const PROXY_SERVER_URL = 'http://localhost:3000/api/fred';

  useEffect(() => {
    const fetchFredData = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      const params = new URLSearchParams({
        series_id: seriesId,
        file_type: 'json',
        observation_start: startDate,
        observation_end: endDate,
      });

      const url = `${PROXY_SERVER_URL}?${params.toString()}`;
      console.log(`Client: Fetching from proxy: ${url}`);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(`Proxy Error: ${response.status} - ${errorBody.error || 'Unknown error'}`);
        }

        const result = await response.json();
        setData(result.observations || []);
      } catch (e) {
        console.error("Client: Failed to fetch FRED data via proxy:", e);
        setError(e.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchFredData();
  }, [seriesId, startDate, endDate]);

  return (
    <div className="container">
      <header className="header">
        <img src="/static/dSideAI_logo.svg" alt="Logo" className="logo" />
        <h1 className="title">FRED Data Explorer</h1>
      </header>

      <div className="controls">
        <label htmlFor="series-select">Series</label>
        <select id="series-select" value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
          <option value="GDP">GDP</option>
          <option value="UNRATE">Unemployment Rate</option>
          <option value="CPIAUCSL">CPI</option>
          <option value="DGS10">10-Year Treasury</option>
        </select>

        <label htmlFor="start-date">Start</label>
        <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label htmlFor="end-date">End</label>
        <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="data-display">
        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">Error: {error}</p>}
        {data && data.length === 0 && !loading && !error && <p>No data found for this range.</p>}

        {data && data.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((obs) => (
                <tr key={obs.date}>
                  <td>{obs.date}</td>
                  <td>{obs.value === '.' ? 'N/A' : obs.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
