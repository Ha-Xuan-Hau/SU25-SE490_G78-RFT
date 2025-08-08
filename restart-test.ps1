# Test và Debug Script
echo "🔧 Restarting Frontend với environment variables mới..."

# Kiểm tra environment variables
echo "Environment variables:"
echo "NEXT_PUBLIC_REACT_APP_BACKEND_URL=$env:NEXT_PUBLIC_REACT_APP_BACKEND_URL"  
echo "NEXT_PUBLIC_API_URL=$env:NEXT_PUBLIC_API_URL"

# Stop existing processes
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Start frontend
cd FE
npm run dev

echo "✅ Frontend started! Kiểm tra console cho WebSocket logs."
