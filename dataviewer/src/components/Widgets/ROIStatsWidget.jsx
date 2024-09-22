import './ROIStatsWidget.scss';
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

const defaultData = {
  size: 1000,
  mean: 127.5,
  median: 130.0,
  stdDev: 25.3,
  min: 0,
  max: 255,
  histogram: Array.from({ length: 20 }, (_, i) => ({
    bin: i * 12.75,
    value: Math.floor(Math.random() * 100) + 10,
  })),
};

export const ROIStatsWidget = ({ stats = defaultData, onClose }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  //const [stats, setStats] = useState(initialData);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p>{`bin: ${payload[0].payload.bin.toFixed(0)}`}</p>
          <p>{`value: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="roi-stats-widget" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      <div className="widget-header" onMouseDown={handleMouseDown}>
        <h3>ROI Statistics</h3>
        <button onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <p>Size</p>
          <p>{stats.size}</p>
        </div>
        <div className="stat-card">
          <p>Mean</p>
          <p>{stats.mean.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p>Median</p>
          <p>{stats.median.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p>Std Dev</p>
          <p>{stats.stdDev.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p>Min</p>
          <p>{stats.min.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p>Max</p>
          <p>{stats.max.toFixed(2)}</p>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.histogram} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="bin" axisLine={{ stroke: '#4B5563' }} tick={false} height={1}/>
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3B82F6" minPointSize={1}>
              {stats.histogram.map((_, index) => (
                <rect key={`bar-${index}`} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ROIStatsWidget;