import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { CrossSectionalDataPoint, RawLiquidation } from '../../lib/schemas';

interface CrossSectionalChartProps {
  data: CrossSectionalDataPoint[];
  currentPrice: number | null;
  rawLiquidations?: RawLiquidation[];
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

export function CrossSectionalChart({ data, currentPrice, rawLiquidations }: CrossSectionalChartProps) {
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
    
    // Use raw liquidations if available, otherwise fall back to bins
    if (!rawLiquidations || rawLiquidations.length === 0) {
      // Fallback: show aggregated bins
      console.warn('No raw liquidations data available, using bins');
      return;
    }

    // Filter active liquidations only
    const activeLiqs = rawLiquidations.filter(liq => liq.status === 'ACTIVE');
    
    // Sort by price
    const sortedLiqs = [...activeLiqs].sort((a, b) => a.price - b.price);
    
    if (sortedLiqs.length === 0) {
      return;
    }

    // Calculate price range, but exclude outliers
    // Use percentiles to focus on where the data actually clusters
    const prices = sortedLiqs.map(l => l.price);
    const usds = sortedLiqs.map(l => l.usd);
    
    // Calculate percentiles to exclude outliers
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const p5 = sortedPrices[Math.floor(sortedPrices.length * 0.05)]; // 5th percentile
    const p95 = sortedPrices[Math.floor(sortedPrices.length * 0.95)]; // 95th percentile
    
    // Use percentile range instead of absolute min/max
    const minPrice = p5;
    const maxPrice = p95;
    const priceRange = maxPrice - minPrice;
    const barWidth = priceRange * 0.0015; // 0.15% of range for skinnier bars

    // Find max USD for opacity scaling (only from visible range)
    const visibleLiqs = sortedLiqs.filter(l => l.price >= minPrice && l.price <= maxPrice);
    const maxUsd = Math.max(...visibleLiqs.map(l => l.usd));
    const minUsd = Math.min(...visibleLiqs.map(l => l.usd));
    const usdRange = maxUsd - minUsd;

    // Prepare scatter data with custom rendering and better color grading
    // Only include liquidations within the constrained range
    const scatterData = sortedLiqs
      .filter(liq => liq.price >= minPrice && liq.price <= maxPrice)
      .map(liq => {
      const isShort = currentPrice && liq.price > currentPrice;
      const baseColor = isShort ? theme.short : theme.long;
      
      // Calculate opacity based on USD value (normalized and scaled)
      // Use logarithmic scale for better visual distribution
      const normalizedValue = usdRange > 0 ? (liq.usd - minUsd) / usdRange : 0.5;
      const logScale = Math.log10(1 + normalizedValue * 9) / Math.log10(10); // Log scale 0-1
      const opacity = 0.4 + (logScale * 0.55); // Range from 0.4 to 0.95
      
      return {
        value: [liq.price, liq.usd],
        itemStyle: {
          color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${opacity})`,
        },
        liq,
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
          type: 'cross',
          lineStyle: {
            color: theme.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            width: 1,
          },
          crossStyle: {
            color: theme.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            width: 1,
          },
          label: {
            show: true,
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
            borderColor: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            borderWidth: 1,
            color: theme.isDark ? '#fff' : '#111',
          },
        },
        backgroundColor: theme.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: `rgb(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]})`,
        textStyle: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
        },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const liq = p?.data?.liq;
          if (!liq) return '';
          const side = currentPrice && liq.price > currentPrice ? 'Short' : 'Long';
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">Price: $${liq.price.toLocaleString()}</div>
              <div>Amount: $${liq.usd.toFixed(3)}B</div>
              <div>Side: ${side}</div>
              <div>Status: ${liq.status}</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        min: minPrice * 0.98, // Small padding: 2% on left
        max: maxPrice * 1.02, // Small padding: 2% on right
        axisLabel: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
          formatter: (value: number) => {
            // Avoid “everything becomes 3k” for low-priced assets like ETH.
            // Show full dollars under $10k, abbreviate above.
            const v = Number(value);
            if (!Number.isFinite(v)) return '';
            const abs = Math.abs(v);
            if (abs < 10_000) return v.toFixed(0);
            if (abs < 1_000_000) return `${(v / 1_000).toFixed(0)}k`;
            return `${(v / 1_000_000).toFixed(1)}M`;
          },
          fontSize: 10,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.3)`,
            width: 1,
          },
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.3)`,
          },
          length: 4,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.15)`,
            width: 1,
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxUsd * 1.15, // Add 15% padding above max value to show the peaks better
        axisLabel: {
          color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
          formatter: (value: number) => {
            // Handle different scales - check if value is very large (raw USD) or in billions
            // If value > 1000, assume it's raw USD and convert to billions
            if (value >= 1000000000) {
              // Value is in raw USD, convert to billions
              return `${(value / 1000000000).toFixed(1)}B`;
            } else if (value >= 1000000) {
              // Value is in raw USD, convert to millions
              return `${(value / 1000000).toFixed(0)}M`;
            } else if (value >= 1) {
              // Value is already in billions
              return `${value.toFixed(1)}B`;
            } else if (value >= 0.001) {
              // Value is in billions, convert to millions
              return `${(value * 1000).toFixed(0)}M`;
            } else {
              // Value is in billions, convert to thousands
              return `${(value * 1000000).toFixed(0)}K`;
            }
          },
          fontSize: 11,
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.3)`,
            width: 1,
          },
        },
        axisTick: {
          show: true,
          lineStyle: {
            color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.3)`,
          },
          length: 4,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.15)`,
            width: 1,
            type: 'dashed',
          },
        },
      },
      series: [
        {
          type: 'custom',
          renderItem: (params: any, api: any) => {
            const point = api.coord([api.value(0), api.value(1)]);
            const zeroPoint = api.coord([api.value(0), 0]);
            const size = api.size([barWidth, api.value(1)]);
            
            return {
              type: 'rect',
              shape: {
                x: point[0] - size[0] / 2,
                y: point[1],
                width: size[0],
                height: zeroPoint[1] - point[1],
              },
              style: api.style(),
            };
          },
          data: scatterData,
          encode: {
            x: 0,
            y: 1,
          },
        },
      ],
    };

    // Add purple dashed current price line
    if (currentPrice && option.series && Array.isArray(option.series)) {
      option.series[0].markLine = {
        silent: false,
        symbol: ['none', 'none'],
        animation: false,
        lineStyle: {
          color: '#a855f7', // Purple-500
          width: 2,
          type: [8, 6], // Dashed pattern
        },
        label: {
          show: true,
          position: 'insideEndTop', // Horizontal label at the top of the line
          formatter: `Current Price: $${currentPrice.toLocaleString()}`,
          color: '#fff',
          fontSize: 11,
          fontWeight: '600',
          backgroundColor: '#a855f7',
          padding: [4, 10],
          borderRadius: 4,
          shadowBlur: 2,
          shadowColor: 'rgba(168, 85, 247, 0.4)',
        },
        data: [
          {
            xAxis: currentPrice,
          },
        ],
      };
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
  }, [data, currentPrice, rawLiquidations]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '600px' }} />;
}
