'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

interface RawData {
  time: string
  open: number
  high: number
  low: number
  close: number
}

interface FVG {
  startTime: Time
  endTime: Time
  high: number
  low: number
  type: 'bullish' | 'bearish'
}

export default function Home() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [data, setData] = useState<RawData[]>([])
  const [fvgs, setFvgs] = useState<FVG[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableDates, setAvailableDates] = useState<string[]>([])

  useEffect(() => {
    fetch('/banknifty-data.csv')
      .then(res => res.text())
      .then(csvText => {
        const lines = csvText.trim().split('\n')
        const headers = lines[0].split(',')
        
        const parsed: RawData[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',')
          if (values.length >= 5) {
            parsed.push({
              time: values[0].trim(),
              open: parseFloat(values[1]),
              high: parseFloat(values[2]),
              low: parseFloat(values[3]),
              close: parseFloat(values[4])
            })
          }
        }
        
        // Get unique dates
        const dateSet = new Set(parsed.map(d => d.time.split('T')[0]))
        const dates = Array.from(dateSet).sort()
        setAvailableDates(dates)
        setSelectedDate(dates[dates.length - 1]) // Latest date
        
        setData(parsed)
      })
  }, [])

  useEffect(() => {
    if (!chartContainerRef.current || !selectedDate || data.length === 0) return

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove()
    }

    // Filter data for selected date
    const dayData = data.filter(d => d.time.startsWith(selectedDate))
    
    if (dayData.length === 0) return

    // Calculate FVG for current day only
    const calculatedFvgs: FVG[] = []
    
    for (let i = 2; i < dayData.length; i++) {
      const prev1 = dayData[i - 1]
      const prev2 = dayData[i - 2]
      const current = dayData[i]
      
      // Bullish FVG: low of current > high of 2 candles ago
      if (current.low > prev2.high) {
        calculatedFvgs.push({
          startTime: prev2.time as Time,
          endTime: current.time as Time,
          high: current.low,
          low: prev2.high,
          type: 'bullish'
        })
      }
      
      // Bearish FVG: high of current < low of 2 candles ago
      if (current.high < prev2.low) {
        calculatedFvgs.push({
          startTime: prev2.time as Time,
          endTime: current.time as Time,
          high: prev2.low,
          low: current.high,
          type: 'bearish'
        })
      }
    }
    
    setFvgs(calculatedFvgs)

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#1a1a2e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2b2b43' },
        horzLines: { color: '#2b2b43' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    const chartData: CandlestickData[] = dayData.map(d => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    }))

    candleSeries.setData(chartData)
    candleSeriesRef.current = candleSeries

    // Fit content
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [selectedDate, data])

  return (
    <main style={{ padding: '20px', background: '#0f0f1a', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>🇮🇳 BankNifty 15-Min Chart</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label>Select Date:</label>
        <select 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: '1px solid #3a3a5c',
            background: '#1a1a2e',
            color: '#fff',
            fontSize: '14px'
          }}
        >
          {availableDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
        
        <span style={{ color: '#888', fontSize: '14px' }}>
          {data.filter(d => d.time.startsWith(selectedDate)).length} candles
        </span>
      </div>

      {/* FVG Legend */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a2e', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📊 Fair Value Gaps (FVG) - {selectedDate}</h3>
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
          <span style={{ color: '#26a69a' }}>● Bullish FVG: {fvgs.filter(f => f.type === 'bullish').length}</span>
          <span style={{ color: '#ef5350' }}>● Bearish FVG: {fvgs.filter(f => f.type === 'bearish').length}</span>
        </div>
        
        {fvgs.length > 0 && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
            {fvgs.slice(0, 5).map((fvg, i) => (
              <div key={i} style={{ display: 'inline-block', margin: '2px 8px 2px 0', padding: '2px 6px', background: fvg.type === 'bullish' ? '#26a691' : '#ef5360', borderRadius: '4px' }}>
                {fvg.type.toUpperCase()}: {fvg.low.toFixed(2)} - {fvg.high.toFixed(2)}
              </div>
            ))}
            {fvgs.length > 5 && <span>...+{fvgs.length - 5} more</span>}
          </div>
        )}
      </div>

      {/* Chart */}
      <div 
        ref={chartContainerRef} 
        style={{ 
          background: '#1a1a2e', 
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Data: BankNifty 15-min OHLC • Powered by LightWeight Charts
      </div>
    </main>
  )
}
