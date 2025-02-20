'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SystemInfo {
  os: {
    hostname: string;
    platform: string;
    arch: string;
  };
  cpuTemp: number | null;
  cpuUsage: string[];
  memoryUsage: {
    total: number;
    used: number;
    free: number;
  };
}

export default function Home() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/system');
        if (!response.ok) {
          throw new Error('Failed to fetch system data');
        }
        const data = await response.json();
        setSystemInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-red-500">Error: {error}</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!systemInfo) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div>Loading system information...</div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[
              ["Hostname", systemInfo.os.hostname],
              ["Platform", systemInfo.os.platform],
              ["Architecture", systemInfo.os.arch],
              ["CPU Temperature", systemInfo.cpuTemp === null ? "N/A" : `${systemInfo.cpuTemp.toFixed(1)}°C`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}:</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">CPU Usage</h3>
            {systemInfo.cpuUsage.map((usage, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Core {index}</span>
                  <span>{usage}%</span>
                </div>
                <Progress value={parseFloat(usage)} className="h-2" />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Memory Usage</h3>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Used</span>
              <span>
                {systemInfo.memoryUsage.used.toFixed(2)} / {systemInfo.memoryUsage.total.toFixed(2)} GB
              </span>
            </div>
            <Progress 
              value={(systemInfo.memoryUsage.used / systemInfo.memoryUsage.total) * 100} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}