import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { HeatmapDataPoint } from '../../lib/schemas';

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  currentPrice: number | null;
}

function getChartTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const styles = getComputedStyle(document.documentElement);
  
  return {
    bg: styles.getPropertyValue('--color-chart-bg').trim().split(' ').map(n => parseInt(n)),
    text: styles.getPropertyValue('--color-chart-text').trim().split(' ').map(n => parseInt(n)),
    grid: styles.getPropertyValue('--color-chart-grid').trim().split(' ').map(n => parseInt(n)),
    isDark,
  };
}

export function HeatmapChart({ data, currentPrice }: HeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Initialize chart only once
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // Update chart when data changes
  useEffect(() => {
    if (!chartInstance.current) return;

    const theme = getChartTheme();
    
    // Sort data by price
    const sortedData = [...data].sort((a, b) => a.price - b.price);

    // Create heatmap data: [x, y, value]
    // x will be time/index (we'll use a constant since we're showing snapshot)
    // y will be price level
    // value will be intensity
    const heatmapData = sortedData.map((d, index) => [0, index, d.intensity]);
    const prices = sortedData.map(d => d.price);

    // Define color ranges based on theme
    const colorStops = theme.isDark ? [
      { offset: 0, color: 'rgba(30, 41, 59, 0.8)' },      // Dark background
      { offset: 0.3, color: 'rgba(99, 102, 241, 0.4)' },  // Blue-ish
      { offset: 0.6, color: 'rgba(168, 85, 247, 0.6)' },  // Purple
      { offset: 0.8, color: 'rgba(236, 72, 153, 0.8)' },  // Pink
      { offset: 1, color: 'rgba(251, 146, 60, 1)' },      // Orange
    ] : [
      { offset: 0, color: 'rgba(255, 255, 255, 0.8)' },   // Light background
      { offset: 0.3, color: 'rgba(147, 197, 253, 0.5)' }, // Light blue
      { offset: 0.6, color: 'rgba(196, 181, 253, 0.7)' }, // Light purple
      { offset: 0.8, color: 'rgba(244, 114, 182, 0.8)' }, // Light pink
      { offset: 1, color: 'rgba(251, 146, 60, 1)' },      // Orange
    ];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '8%',
        right: '12%',
        bottom: '10%',
        top: '10%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
        textStyle: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
        },
        formatter: (params: any) => {
          const index = params.data[1];
          const dataPoint = sortedData[index];
          const direction = currentPrice && dataPoint.price > currentPrice ? 'Short' : 'Long';
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">Price: $${dataPoint.price.toLocaleString()}</div>
              <div>Intensity: ${dataPoint.intensity.toFixed(1)}</div>
              <div>USD: $${dataPoint.usd.toFixed(2)}B</div>
              <div>Status: ${dataPoint.status}</div>
              <div style="margin-top: 4px; font-size: 11px; opacity: 0.7;">
                ${direction} Liquidations
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: ['Intensity'],
        show: false,
      },
      yAxis: {
        type: 'category',
        data: prices,
        axisLabel: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
          formatter: (value: string | number) => `$${(Number(value) / 1000).toFixed(0)}K`,
          fontSize: 11,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
            opacity: 0.1,
          },
        },
      },
      visualMap: {
        min: 0,
        max: 100,
        show: true,
        orient: 'vertical',
        right: '2%',
        top: 'center',
        text: ['High', 'Low'],
        textStyle: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
        },
        inRange: {
          color: colorStops.map(s => s.color),
        },
        calculable: true,
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData,
          emphasis: {
            itemStyle: {
              borderColor: theme.isDark ? '#fff' : '#000',
              borderWidth: 1,
            },
          },
          itemStyle: {
            borderWidth: 0.5,
            borderColor: theme.isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(229, 231, 235, 0.5)',
          },
        },
      ],
    };

    // Add current price mark line if available
    if (currentPrice && option.yAxis && !Array.isArray(option.yAxis)) {
      const priceIndex = prices.findIndex(p => p >= currentPrice);
      if (priceIndex !== -1 && option.series && Array.isArray(option.series)) {
        option.series[0].markLine = {
          silent: false,
          symbol: ['none', 'arrow'],
          symbolSize: 6,
          lineStyle: {
            color: theme.isDark ? '#fbbf24' : '#f59e0b',
            width: 2,
            type: 'solid',
          },
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: `Current: $${currentPrice.toLocaleString()}`,
            color: theme.isDark ? '#fbbf24' : '#f59e0b',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            padding: [4, 8],
            borderRadius: 4,
          },
          data: [
            {
              yAxis: priceIndex,
            },
          ],
        };
      }
    }

    chartInstance.current.setOption(option, true);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    // Re-render on theme change
    const observer = new MutationObserver(() => {
      if (chartInstance.current) {
        // Fully re-render with new theme
        const newTheme = getChartTheme();
        chartInstance.current.setOption(option, true);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [data, currentPrice]);

  return <div ref={chartRef} style={{ width: '100%', height: '700px' }} />;
}

