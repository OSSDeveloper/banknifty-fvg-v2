# BankNifty Charts - Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   cd banknifty-charts
   git init
   git add .
   git commit -m "BankNifty chart with FVG"
   # Create a new repo on GitHub and push
   git remote add origin https://github.com/YOUR_USERNAME/banknifty-charts.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Click "Deploy"

## Features

- 📈 Interactive candlestick chart using LightWeight Charts
- 📊 Fair Value Gap (FVG) detection for current day
- 🗓️ Date picker to select any available date
- 🔴🟢 Bullish/Bearish FVG indicators

## FVG Detection Logic

- **Bullish FVG**: When current candle's low > high of 2 candles ago
- **Bearish FVG**: When current candle's high < low of 2 candles ago

## Data

The chart loads BankNifty 15-minute OHLC data from `public/banknifty-data.csv`

To update data, replace `public/banknifty-data.csv` with new CSV in format:
```
time,open,high,low,close
2022-11-01T09:15:00+05:30,41485.85,41548.55,41393.55,41478.35
```
# BankNifty FVG Charts
