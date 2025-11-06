import React, { useState, useEffect, useCallback } from 'react';
import { HeatmapItem } from '../../types/market-data';
import { ResponsiveTreeMapHtml } from '@nivo/treemap';
import './HeatmapChart.css';

const HeatmapChart: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'chg%'>('volume');
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if API URL environment variable is set
        if (!import.meta.env.VITE_SYNAPSE_API_URL) {
          throw new Error("Missing VITE_SYNAPSE_API_URL environment variable. Please set it in your .env file.");
        }

        const sortBy = selectedMetric === 'volume' ? 'volume' : 'price_change';
        const apiUrl = `${import.meta.env.VITE_SYNAPSE_API_URL}/market/heatmap-data?sort_by=${sortBy}&limit=10`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`API endpoint not found: ${apiUrl}. Verify the backend endpoint exists.`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();

        const transformedData: HeatmapItem[] = rawData.map((item: any) => ({
          symbol: item.symbol,
          percentage_change: item.price_change_percentage_24h ?? 0, // Default to 0 if undefined or null
          value: selectedMetric === 'volume' ? (item.total_volume ?? 0) : (item.price_change_percentage_24h ?? 0), // Default to 0 if undefined or null
        }));
        setHeatmapData(transformedData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedMetric]);

  return (
    <div className="heatmap-container">
      <h2>Heatmap (24 hour)</h2>
      <div className="metric-selector">
        <button
          className={selectedMetric === 'volume' ? 'active' : ''}
          onClick={() => setSelectedMetric('volume')}
        >
          Volume
        </button>
        <button
          className={selectedMetric === 'chg%' ? 'active' : ''}
          onClick={() => setSelectedMetric('chg%')}
        >
          Chg%
        </button>
      </div>
      {loading && <p>Loading heatmap data...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      {!loading && !error && heatmapData.length === 0 && <p>No heatmap data available.</p>}
      {!loading && !error && heatmapData.length > 0 && (
        <div style={{ width: '100%', height: '500px' }}>
          <ResponsiveTreeMapHtml
            data={{
              id: 'root',
              children: heatmapData.map((item: any) => {
                let color = '#808080'; // Default to grey
                if (item.percentage_change < 0) {
                  color = '#FF4560'; // Red
                } else if (item.percentage_change > 0) {
                  color = '#00E396'; // Green
                }
                return {
                  id: item.symbol,
                  value: Math.abs(item.value), // Ensure value is always positive for treemap sizing
                  percentageChange: item.percentage_change,
                  color: color,
                };
              }),
            }}
            identity="id"
            value="value"
            colors={(node) => node.data.color}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            labelSkipSize={20} // Increased to hide labels on smaller tiles
            labelTextColor={{
              from: 'color',
              modifiers: [['brighter', 3]],
            }}
            parentLabelTextColor={{
              from: 'color',
              modifiers: [['brighter', 3]],
            }}
            borderColor="#000000"
            enableLabel={true}
            label={(node) => {
              const displayPercentageChange = (node.data.percentageChange ?? 0).toFixed(2);
              return `${node.data.id}\n${displayPercentageChange}%`;
            }}
            tooltip={({ node }) => (
              <div
                style={{
                  background: 'white',
                  padding: '12px 16px',
                  border: '1px solid #ccc',
                  color: 'black',
                }}
              >
                <strong>{node.data.id}</strong><br />
                {selectedMetric === 'volume' ? 'Volume' : 'Chg%'}: {(node.data.value ?? 0).toFixed(2)}{selectedMetric === 'volume' ? 'B' : '%'}<br />
                Change: {(node.data.percentageChange ?? 0).toFixed(2)}%
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default HeatmapChart;