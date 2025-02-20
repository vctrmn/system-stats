'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const LoadingCard = () => (
    <Card className="w-full max-w-md">
      <CardContent className="p-6 min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading system information...</p>
      </CardContent>
    </Card>
  );

  const ErrorCard = ({ message }: { message: string }) => (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 text-red-500">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Error: {message}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6"><LoadingCard /></main>;
  if (error) return <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6"><ErrorCard message={error} /></main>;
  if (!systemInfo) return null;

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