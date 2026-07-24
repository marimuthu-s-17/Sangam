import { useState } from 'react';
import { Box, Paper, Typography, Stack, Tooltip } from '@mui/material';

// 1. Custom Responsive Bar Chart
export function CustomBarChart({ data = [], title, xKey = 'month', yKey = 'amount', color = '#1e3c72' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxVal = Math.max(...data.map(d => d[yKey] || 0), 1000) * 1.1;
  const height = 200;
  const barWidth = 32;
  const gap = 24;
  const paddingX = 40;
  const paddingY = 20;

  const width = data.length * (barWidth + gap) - gap + paddingX * 2;

  return (
    <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#1A1A1A' }}>{title}</Typography>
      <Box sx={{ width: '100%', overflowX: 'auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${width} ${height + paddingY * 2}`} width={width} height={height + paddingY * 2} style={{ overflow: 'visible' }}>
          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height + paddingY - ratio * height;
            const gridVal = Math.round(ratio * maxVal);
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#EFE9DE" strokeDasharray="4 4" />
                <text x={paddingX - 8} y={y + 4} textAnchor="end" fill="#8A8A8A" fontSize="10px">
                  {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, index) => {
            const val = d[yKey] || 0;
            const barHeight = (val / maxVal) * height;
            const x = paddingX + index * (barWidth + gap);
            const y = height + paddingY - barHeight;

            return (
              <g
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                <Tooltip
                  title={`${d[xKey]}: ₹${val.toLocaleString('en-IN')}`}
                  open={hoveredIndex === index}
                  arrow
                  placement="top"
                >
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, 2)}
                    rx={6}
                    ry={6}
                    fill={hoveredIndex === index ? '#f5af19' : color}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                </Tooltip>
                <text x={x + barWidth / 2} y={height + paddingY + 16} textAnchor="middle" fill="#8A8A8A" fontSize="10px" fontWeight={500}>
                  {d[xKey]}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Paper>
  );
}

// 2. Custom Donut / Pie Chart
export function CustomPieChart({ data = [], title, nameKey = 'category', valueKey = 'amount' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
  const colors = ['#1e3c72', '#11998e', '#606c88', '#ed213a', '#f12711', '#93291e', '#2a5298', '#38ef7d'];

  let accumulatedPercent = 0;

  const segments = data.map((d, index) => {
    const value = d[valueKey] || 0;
    const percent = total > 0 ? (value / total) * 100 : 0;
    const startPercent = accumulatedPercent;
    accumulatedPercent += percent;
    return {
      ...d,
      percent,
      startPercent,
      color: colors[index % colors.length]
    };
  });

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent="center">
        {/* SVG Donut */}
        <Box sx={{ position: 'relative', width: 160, height: 160 }}>
          <svg width="100%" height="100%" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#F3EBDD" strokeWidth="3.5" />
            {segments.map((seg, idx) => {
              const dashArray = `${seg.percent} ${100 - seg.percent}`;
              const dashOffset = 100 - seg.startPercent + 25; // start from top (12 o'clock)
              return (
                <circle
                  key={idx}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredIdx === idx ? '4.5' : '3.5'}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                />
              );
            })}
          </svg>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Total</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>₹{Math.round(total).toLocaleString('en-IN')}</Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Stack spacing={1} sx={{ flex: 1, minWidth: 140 }}>
          {segments.map((seg, idx) => (
            <Stack
              key={idx}
              direction="row"
              spacing={1}
              alignItems="center"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              sx={{ cursor: 'pointer', p: 0.5, borderRadius: 1, bgcolor: hoveredIdx === idx ? 'action.hover' : 'transparent', transition: 'background-color 0.2s' }}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: seg.color }} />
              <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {seg[nameKey]}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {seg.percent.toFixed(0)}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

// 3. Custom Area Chart (Profit/Loss or Collections)
export function CustomAreaChart({ data = [], title, xKey = 'month', yKey = 'amount' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const values = data.map(d => d[yKey] || 0);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 1000) * 1.15;
  const valRange = maxVal - minVal;

  const height = 180;
  const width = 360;
  const paddingX = 40;
  const paddingY = 20;

  // Generate SVG path points
  const points = data.map((d, index) => {
    const val = d[yKey] || 0;
    const x = paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
    const y = height + paddingY - ((val - minVal) / valRange) * height;
    return { x, y, val, label: d[xKey] };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height + paddingY} L ${points[0].x} ${height + paddingY} Z`
    : '';

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>
      <Box sx={{ width: '100%', overflowX: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${width} ${height + paddingY * 2}`} width={width} height={height + paddingY * 2} style={{ overflow: 'visible' }}>
          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3c72" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2a5298" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height + paddingY - ratio * height;
            const gridVal = minVal + ratio * valRange;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#F3EBDD" />
                <text x={paddingX - 8} y={y + 4} textAnchor="end" fill="#8A8A8A" fontSize="9px">
                  {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Area */}
          {points.length > 0 && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* Line */}
          {points.length > 0 && <path d={linePath} fill="none" stroke="#1e3c72" strokeWidth="2.5" />}

          {/* Data Points / Circles */}
          {points.map((p, index) => (
            <g
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <Tooltip
                title={`${p.label}: ₹${p.val.toLocaleString('en-IN')}`}
                open={hoveredIndex === index}
                arrow
                placement="top"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredIndex === index ? 6 : 4}
                  fill={hoveredIndex === index ? '#f5af19' : '#1e3c72'}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  style={{ transition: 'all 0.2s ease' }}
                />
              </Tooltip>
              {index % 2 === 0 && (
                <text x={p.x} y={height + paddingY + 14} textAnchor="middle" fill="#8A8A8A" fontSize="9px">
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </Box>
    </Paper>
  );
}
