import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { CrossSectionalDataPoint } from '../../lib/schemas';

interface CrossSectionalChartProps {
  data: CrossSectionalDataPoint[];
  currentPrice: number | null;
}

function getChartTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const styles = getComputedStyle(document.documentElement);
  
  return {
    bg: styles.getPropertyValue('--color-chart-bg').trim().split(' ').map(n => parseInt(n)),
    text: styles.getPropertyValue('--color-chart-text').trim().split(' ').map(n => parseInt(n)),
    grid: styles.getPropertyValue('--color-chart-grid').trim().split(' ').map(n => parseInt(n)),
    long: styles.getPropertyValue('--color-chart-long').trim().split(' ').map(n => parseInt(n)),
    short: styles.getPropertyValue('--color-chart-short').trim().split(' ').map(n => parseInt(n)),
    cleared: styles.getPropertyValue('--color-chart-cleared').trim().split(' ').map(n => parseInt(n)),
    isDark,
  };
}

export function CrossSectionalChart({ data, currentPrice }: CrossSectionalChartProps) {
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

    // Prepare chart data
    const prices = sortedData.map(d => d.price);
    const values = sortedData.map(d => d.usd);
    
    // Find max USD value for normalization
    const maxUsd = Math.max(...values);
    
    // Color each bar based on position relative to current price and status
    const itemStyles = sortedData.map(d => {
      let baseColor: number[];
      
      if (d.status === 'CLEARED') {
        baseColor = theme.cleared;
      } else if (d.aboveCurrentPrice) {
        // Above current price = SHORTS = GREEN
        baseColor = theme.short;
      } else {
        // Below current price = LONGS = RED
        baseColor = theme.long;
      }

      // Adjust opacity based on liquidation USD amount
      let opacity = d.usd / maxUsd; // Normalize to 0-1 based on USD amount
      opacity = Math.max(0.2, Math.min(1, opacity)); // Clamp between 0.2 and 1
      
      if (d.status === 'CLEARED') {
        opacity *= 0.3;
      } else if (d.status === 'PARTIAL') {
        opacity *= 0.7;
      }

      return {
        color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${opacity})`,
      };
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: '8%',
        right: '4%',
        bottom: '12%',
        top: '8%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            width: 1,
          },
        },
        backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
        textStyle: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
        },
        formatter: (params: any) => {
          const p = params[0];
          const dataPoint = sortedData[p.dataIndex];
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">Price: $${dataPoint.price.toLocaleString()}</div>
              <div>Liquidation: $${dataPoint.usd.toFixed(2)}M</div>
              <div>Intensity: ${dataPoint.intensity.toFixed(1)}</div>
              <div>Status: ${dataPoint.status}</div>
              <div style="margin-top: 4px; font-size: 11px; opacity: 0.7;">
                ${dataPoint.aboveCurrentPrice ? 'Short Liquidations' : 'Long Liquidations'}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: prices,
        axisLabel: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
          formatter: (value: string | number) => {
            const num = Number(value);
            return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num.toString();
          },
          fontSize: 10,
          interval: Math.floor(prices.length / 12), // Show ~12 labels
          rotate: 0,
        },
        axisLine: {
          lineStyle: {
            color: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
          formatter: (value: number) => {
            if (value >= 1000) return `${(value / 1000).toFixed(1)}B`;
            return `${value.toFixed(0)}M`;
          },
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
            opacity: 0.2,
          },
        },
      },
      series: [
        {
          type: 'bar',
          data: values.map((value, index) => ({
            value,
            itemStyle: itemStyles[index],
          })),
          barWidth: '85%', // Make bars thinner and more numerous
          barGap: '10%',
        },
      ],
    };

    // Add vibrant current price mark line in the center
    if (currentPrice && option.series && Array.isArray(option.series)) {
      const priceIndex = prices.findIndex(p => p >= currentPrice);
      if (priceIndex !== -1) {
        option.series[0].markLine = {
          silent: false,
          symbol: ['none', 'none'],
          animation: false,
          lineStyle: {
            color: '#f59e0b', // Vibrant amber/orange
            width: 3,
            type: [8, 6], // Dotted line pattern (dash, gap)
          },
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: `Current Price: $${currentPrice.toLocaleString()}`,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: '#f59e0b',
            padding: [6, 12],
            borderRadius: 6,
            shadowBlur: 4,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
          emphasis: {
            disabled: false,
            lineStyle: {
              width: 4,
            },
          },
          data: [
            {
              xAxis: priceIndex,
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
        const newTheme = getChartTheme();
        // Update colors without recreating the chart
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

  return <div ref={chartRef} style={{ width: '100%', height: '600px' }} />;
}

