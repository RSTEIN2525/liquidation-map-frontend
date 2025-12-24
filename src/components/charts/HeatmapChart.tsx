import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { RawLiquidation } from '../../lib/schemas';
import { fetchHistoricalPrice, type Candlestick } from '../../lib/priceApi';

interface HeatmapChartProps {
  ticker?: string;
  lookbackDays?: number;
  rawLiquidations: RawLiquidation[];
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
    isDark,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickCoingeckoDays(days?: number) {
  const d = days ?? 1;
  if (d <= 1) return 1;
  if (d <= 7) return 7;
  if (d <= 14) return 14;
  if (d <= 30) return 30;
  if (d <= 90) return 90;
  if (d <= 180) return 180;
  if (d <= 365) return 365;
  return 365;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

export function HeatmapChart({ ticker = 'BTC', lookbackDays = 1, rawLiquidations, currentPrice }: HeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [priceData, setPriceData] = useState<Candlestick[]>([]);

  // Fetch historical price data
  useEffect(() => {
    const days = pickCoingeckoDays(lookbackDays);
    fetchHistoricalPrice(ticker, days).then(setPriceData);
  }, [ticker, lookbackDays]);

  // Initialize chart only once
  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  const seriesData = useMemo(() => {
    if (rawLiquidations.length === 0 || priceData.length < 2) {
      return null;
    }

    const liqs = rawLiquidations.filter((l) => typeof l.entry_time === 'number' && Number.isFinite(l.entry_time));
    if (liqs.length === 0) {
      return null;
    }

    // Use price range from liquidations (trim outliers)
    const liqPrices = liqs.map((l) => l.price).sort((a, b) => a - b);
    const p5 = liqPrices[Math.floor(liqPrices.length * 0.05)];
    const p95 = liqPrices[Math.floor(liqPrices.length * 0.95)];
    const minPrice = p5;
    const maxPrice = p95;
    const priceRange = maxPrice - minPrice;
    if (!Number.isFinite(priceRange) || priceRange <= 0) return null;

    const times = priceData.map((c) => c.time);
    const closes = priceData.map((c) => c.close);

    // Pixel grid resolution (controls "cleanliness")
    const timeBins = priceData.length; // one column per candle
    const priceBins = 120; // more bins = more detail, still clean
    const priceStep = priceRange / priceBins;

    // Matrix: priceBins x timeBins
    const grid = new Float32Array(priceBins * timeBins);

    const maxUsd = Math.max(...liqs.map((l) => l.usd));
    const kernel = [0.06, 0.24, 0.4, 0.24, 0.06]; // tiny vertical gaussian spread (keeps it clean)
    const kRadius = 2;

    // Build step-function bands from raw liquidations.
    // Cutoff is PER liquidation: render from entry_time until the first candle that crosses that price.
    for (const liq of liqs) {
      if (liq.price < minPrice || liq.price > maxPrice) continue;

      const entry = liq.entry_time as number;
      // find first candle >= entry
      let startIdx = 0;
      // small fast scan from end if most entries are recent
      for (let i = 0; i < times.length; i++) {
        if (times[i] >= entry) {
          startIdx = i;
          break;
        }
      }

      const b0 = clamp(Math.floor((liq.price - minPrice) / priceStep), 0, priceBins - 1);

      // Render to end unless price crosses this exact level after it exists
      let endIdx = timeBins;
      for (let i = startIdx; i < priceData.length; i++) {
        const c = priceData[i];
        if (c.low <= liq.price && c.high >= liq.price) {
          endIdx = i;
          break;
        }
      }

      if (endIdx <= startIdx) continue;

      // Normalize usd -> weight (log-ish)
      const v = maxUsd > 0 ? liq.usd / maxUsd : 0;
      const w = Math.pow(v, 0.65);

      // ramp-in to create “left tail” accumulation (first few candles fade in)
      const rampLen = 6;

      for (let t = startIdx; t < endIdx; t++) {
        const ramp = t < startIdx + rampLen ? (t - startIdx + 1) / rampLen : 1;
        const base = w * ramp;
        for (let dy = -kRadius; dy <= kRadius; dy++) {
          const b = b0 + dy;
          if (b < 0 || b >= priceBins) continue;
          const k = kernel[dy + kRadius];
          grid[b * timeBins + t] += base * k;
        }
      }
    }

    // Convert grid -> rect cells (custom series)
    let maxCell = 0;
    for (let i = 0; i < grid.length; i++) maxCell = Math.max(maxCell, grid[i]);
    if (maxCell <= 0) return null;

    const cells: Array<[number, number, number, number]> = []; // [timeIndex, p0, p1, intensity]

    for (let b = 0; b < priceBins; b++) {
      const p0 = minPrice + b * priceStep;
      const p1 = p0 + priceStep;

      for (let t = 0; t < timeBins; t++) {
        const v = grid[b * timeBins + t];
        if (v <= 0) continue;

        const norm = v / maxCell;
        // keep it airy/clean
        const intensity = Math.pow(norm, 0.55);
        if (intensity < 0.015) continue;

        cells.push([t, p0, p1, intensity]);
      }
    }

    return {
      minPrice,
      maxPrice,
      times,
      closes,
      cells,
    };
  }, [rawLiquidations, priceData]);

  // Update chart when data changes (and on theme changes via MutationObserver)
  useEffect(() => {
    if (!chartInstance.current || !seriesData) return;

    const render = () => {
      if (!chartInstance.current) return;
      const theme = getChartTheme();

      // Muted, powerful purple ramp (sophisticated, not neon)
      const purpleHi: [number, number, number] = [246, 114, 107]; // Soft lavender-purple
      const purpleMid: [number, number, number] = [182, 55, 117]; // Rich deep purple
      const purpleLo: [number, number, number] = [51, 13, 90]; // Powerful violet-purple

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
          // Keep the crosshair, but remove the popup (too noisy for this view)
          showContent: false,
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
          // Still used by axisPointer label styling in some themes
          backgroundColor: theme.isDark ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.25)`,
          textStyle: { color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})` },
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: seriesData.times.map((t) => {
            const d = new Date(t * 1000);
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
          }),
          axisLabel: {
            color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
            fontSize: 10,
            rotate: 25,
          },
          axisLine: {
            show: true,
            lineStyle: { color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.25)`, width: 1 },
          },
          axisTick: { show: false },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          scale: true,
          min: seriesData.minPrice,
          max: seriesData.maxPrice,
          axisLabel: {
            color: `rgb(${theme.text[0]}, ${theme.text[1]}, ${theme.text[2]})`,
            formatter: (value: any) => {
              const v = Number(value);
              if (!Number.isFinite(v)) return '';
              return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0);
            },
            fontSize: 11,
          },
          axisLine: {
            show: true,
            lineStyle: { color: `rgba(${theme.grid[0]}, ${theme.grid[1]}, ${theme.grid[2]}, 0.25)`, width: 1 },
          },
          axisTick: { show: false },
          // Hide chart grid lines entirely (they read as a “grid pattern” over the heatmap)
          splitLine: { show: false },
        },
        series: [
          {
            name: 'Liquidity',
            type: 'custom',
            silent: true,
            renderItem: (params: any, api: any) => {
              const t = api.value(0);
              const p0 = api.value(1);
              const p1 = api.value(2);
              const intensity = api.value(3);

              const c0 = api.coord([t, p0]);
              const c1 = api.coord([t + 1, p1]);

              // Use overlap-friendly rounding to avoid 1px gaps between rows/columns.
              const x = Math.floor(c0[0]);
              const y = Math.floor(c1[1]); // y decreases upward
              const w = Math.max(1, Math.ceil(c1[0] - c0[0]) + 1);
              const h = Math.max(1, Math.ceil(c0[1] - c1[1]) + 1);

              // clean monochrome purple shading - full power!
              const intensityNorm = clamp(Number(intensity), 0, 1);
              const rgb = intensityNorm < 0.5 ? lerpRgb(purpleLo, purpleMid, intensityNorm / 0.5) : lerpRgb(purpleMid, purpleHi, (intensityNorm - 0.5) / 0.5);
              // Maximum opacity - 100% powerful colors
              const alpha = theme.isDark 
                ? (0.50 + 0.50 * Math.pow(intensityNorm, 0.75)) // 0.50-1.0 range
                : (0.60 + 0.40 * Math.pow(intensityNorm, 0.75)); // 0.60-1.0 range

              return {
                type: 'rect',
                shape: { x, y, width: w, height: h },
                style: {
                  fill: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`,
                  stroke: 'transparent', // No borders - smooth heatmap
                  lineWidth: 0,
                },
              };
            },
            data: seriesData.cells,
            encode: { x: 0, y: [1, 2] },
            z: 1,
          },
          {
            name: 'Price',
            type: 'line',
            showSymbol: false,
            data: seriesData.closes,
            lineStyle: {
              color: theme.isDark ? '#ffffff' : '#000000',
              width: 2,
            },
            z: 2,
          },
        ],
      };

      chartInstance.current.setOption(option, { notMerge: true, lazyUpdate: true });
    };

    render();

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    const observer = new MutationObserver(() => {
      render();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [seriesData, currentPrice]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '600px' }} />;
}
