import { useState } from 'react';
import { Box, Paper, Typography, Stack, Tooltip, useTheme } from '@mui/material';

// 1. Custom Responsive Bar Chart
export function CustomBarChart({ data = [], title, xKey = 'month', yKey = 'amount', color = '#1e3c72' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const maxVal = Math.max(...data.map(d => d[yKey] || 0), 1000) * 1.1;
  const height = 180;
  const barWidth = 28;
  const gap = 20;
  const paddingX = 36;
  const paddingY = 16;

  const width = data.length * (barWidth + gap) - gap + paddingX * 2;

  // Softer dark colors for bars if brand defaults are stark
  const resolvedBarColor = isDark ? (color === '#1e3c72' ? '#3B82F6' : (color === '#ed213a' ? '#EF4444' : color)) : color;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', fontSize: '0.85rem' }}>{title}</Typography>
      <Box sx={{ width: '100%', overflowX: 'auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${width} ${height + paddingY * 2}`} width={width} height={height + paddingY * 2} style={{ overflow: 'visible' }}>
          {/* Y Axis Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height + paddingY - ratio * height;
            const gridVal = Math.round(ratio * maxVal);
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />
                <text x={paddingX - 8} y={y + 4} textAnchor="end" fill={theme.palette.text.secondary} fontSize="9px">
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
                    rx={5}
                    ry={5}
                    fill={hoveredIndex === index ? '#F4A623' : resolvedBarColor}
                    style={{ transition: 'all 0.2s ease' }}
                  />
                </Tooltip>
                <text x={x + barWidth / 2} y={height + paddingY + 14} textAnchor="middle" fill={theme.palette.text.secondary} fontSize="9px" fontWeight={500}>
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);

  // Soft modern pastel color palettes for dark theme
  const lightColors = ['#1e3c72', '#11998e', '#606c88', '#ed213a', '#f12711', '#93291e', '#2a5298', '#38ef7d'];
  const darkColors = ['#60A5FA', '#34D399', '#9CA3AF', '#F87171', '#FB923C', '#F472B6', '#818CF8', '#A7F3D0'];
  const colors = isDark ? darkColors : lightColors;

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
    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.85rem', color: 'text.primary' }}>{title}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center" justifyContent="center">
        {/* SVG Donut */}
        <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke={theme.palette.divider} strokeWidth="3.5" />
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
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.62rem' }}>Total</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem', color: 'text.primary' }}>₹{Math.round(total).toLocaleString('en-IN')}</Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 120 }}>
          {segments.map((seg, idx) => (
            <Stack
              key={idx}
              direction="row"
              spacing={1}
              alignItems="center"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              sx={{ cursor: 'pointer', py: 0.25, px: 0.5, borderRadius: 1.5, bgcolor: hoveredIdx === idx ? 'action.hover' : 'transparent', transition: 'background-color 0.15s' }}
            >
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: seg.color, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.72rem', color: 'text.primary' }}>
                {seg[nameKey]}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}>
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const values = data.map(d => d[yKey] || 0);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 1000) * 1.15;
  const valRange = maxVal - minVal;

  const height = 165;
  const width = 340;
  const paddingX = 36;
  const paddingY = 16;

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

  const activeColor = isDark ? '#3B82F6' : '#1e3c72';

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.85rem', color: 'text.primary' }}>{title}</Typography>
      <Box sx={{ width: '100%', overflowX: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox={`0 0 ${width} ${height + paddingY * 2}`} width={width} height={height + paddingY * 2} style={{ overflow: 'visible' }}>
          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity={isDark ? "0.2" : "0.35"} />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height + paddingY - ratio * height;
            const gridVal = minVal + ratio * valRange;
            return (
              <g key={i}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke={theme.palette.divider} />
                <text x={paddingX - 8} y={y + 4} textAnchor="end" fill={theme.palette.text.secondary} fontSize="8px">
                  {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Area */}
          {points.length > 0 && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* Line */}
          {points.length > 0 && <path d={linePath} fill="none" stroke={activeColor} strokeWidth="2" />}

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
                  r={hoveredIndex === index ? 5 : 3.5}
                  fill={hoveredIndex === index ? '#F4A623' : activeColor}
                  stroke={isDark ? '#161B22' : '#ffffff'}
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />
              </Tooltip>
              {index % 2 === 0 && (
                <text x={p.x} y={height + paddingY + 12} textAnchor="middle" fill={theme.palette.text.secondary} fontSize="8px">
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
