import React, { useState, useEffect, useCallback } from 'react';
import { HeatmapItem } from '../../types/market-data';
import { ResponsiveTreeMapHtml } from '@nivo/treemap';
import './HeatmapChart.css';

const HeatmapChart: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'chg%'>('volume');
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [maxAbsoluteValue, setMaxAbsoluteValue] = useState<number>(0); // State to store the max absolute value for dynamic coloring

  const formatVolume = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    } else {
      return `${value.toFixed(2)}`;
    }
  };

  const getColor = useCallback((value: number, percentageChange: number) => {
    if (percentageChange === 0) {
      return '#808080'; // Grey for no change
    }

    // Normalize the value to a 0-1 range based on the overall maxAbsoluteValue
    const normalizedValue = maxAbsoluteValue > 0 ? Math.min(Math.abs(value) / maxAbsoluteValue, 1) : 0;

    if (percentageChange < 0) {
      // Red gradient: from dimmest red to brightest red
      const dimmestRed = [188, 63, 68]; // #BC3F44
      const brightestRed = [230, 49, 52]; // #E63134

      const r = Math.round(dimmestRed[0] + (brightestRed[0] - dimmestRed[0]) * normalizedValue);
      const g = Math.round(dimmestRed[1] + (brightestRed[1] - dimmestRed[1]) * normalizedValue);
      const b = Math.round(dimmestRed[2] + (brightestRed[2] - dimmestRed[2]) * normalizedValue);
      return `rgb(${r}, ${g}, ${b})`;

    } else {
      // Green gradient: from dimmest green to brightest green
      const dimmestGreen = [47, 158, 79]; // #2F9E4F
      const brightestGreen = [48, 204, 90]; // #30CC5A

      const r = Math.round(dimmestGreen[0] + (brightestGreen[0] - dimmestGreen[0]) * normalizedValue);
      const g = Math.round(dimmestGreen[1] + (brightestGreen[1] - dimmestGreen[1]) * normalizedValue);
      const b = Math.round(dimmestGreen[2] + (brightestGreen[2] - dimmestGreen[2]) * normalizedValue);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }, [maxAbsoluteValue]);

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
        const apiUrl = `${import.meta.env.VITE_SYNAPSE_API_URL}/market/heatmap-data?sort_by=${sortBy}&limit=15`;
        
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

        // Calculate max absolute value for dynamic coloring
        const currentMaxAbsoluteValue = Math.max(...transformedData.map(item => Math.abs(item.value)));
        setMaxAbsoluteValue(currentMaxAbsoluteValue);

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
                return {
                  id: item.symbol,
                  value: Math.abs(item.value), // Ensure value is always positive for treemap sizing
                  percentageChange: item.percentage_change,
                };
              }),
            }}
            identity="id"
            value="value"
            colors={(node) => {
              const pc = 'percentageChange' in node.data ? (node.data as any).percentageChange ?? 0 : 0;
              return getColor((node.value as number) ?? 0, pc);
            }}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            labelSkipSize={20} // Increased to hide labels on smaller tiles
            labelTextColor="#ffffff" // Static white for better visibility
            parentLabelTextColor="#ffffff" // Static white for better visibility
            borderColor="#000000"
            enableLabel={true}
            label={(node) => {
              const symbol = node.data.id.toUpperCase();
              const pc = 'percentageChange' in node.data ? (node.data as any).percentageChange ?? 0 : 0;
              if (selectedMetric === 'volume') {
                const formattedVolume = formatVolume((node.value as number) ?? 0);
                return `${symbol}\n${formattedVolume}`;
              } else {
                const displayPercentageChange = (pc as number).toFixed(2);
                return `${symbol}\n${displayPercentageChange}%`;
              }
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
                <strong>{node.data.id.toUpperCase()}</strong><br />
                {(() => {
                  const pc = 'percentageChange' in node.data ? (node.data as any).percentageChange ?? 0 : 0;
                  return selectedMetric === 'volume'
                    ? `Volume: ${formatVolume((node.value as number) ?? 0)}`
                    : `Chg%: ${(pc as number).toFixed(2)}%`;
                })()}<br />
                {(() => {
                  const pc = 'percentageChange' in node.data ? (node.data as any).percentageChange ?? 0 : 0;
                  return `Change: ${(pc as number).toFixed(2)}%`;
                })()}
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default HeatmapChart;