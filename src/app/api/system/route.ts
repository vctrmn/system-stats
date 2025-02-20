// route.ts
import { NextResponse } from 'next/server';
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function getCpuUsage() {
  const cpus = os.cpus();
  return cpus.map((cpu) => {
    const total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
    const usage = 100 - (100 * cpu.times.idle) / total;
    return usage.toFixed(1);
  });
}

async function getCpuTemp() {
  const platform = os.platform();
  
  try {
    if (platform === 'darwin') {
      // For MacOS (Intel and Apple Silicon)
      const { stdout } = await execAsync("sudo powermetrics --samplers smc -i1 -n1");
      const match = stdout.match(/CPU die temperature: (\d+\.\d+)/);
      return match ? parseFloat(match[1]) : null;
    } else if (platform === 'linux') {
      // For Raspberry Pi and other Linux systems
      try {
        // Try Raspberry Pi temperature file first
        const { stdout } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp");
        return parseFloat(stdout) / 1000;
      } catch {
        // Fallback to alternative temperature sources
        try {
          const { stdout } = await execAsync("sensors -j");
          const data = JSON.parse(stdout);
          // This will need to be adjusted based on your specific hardware
          const temp = data[Object.keys(data)[0]]?.["temp1"]?.["temp1_input"];
          return temp || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Could not read CPU temperature:', error);
    return null;
  }
}

function bytesToGB(bytes: number) {
  return bytes / (1024 * 1024 * 1024);
}

export async function GET() {
  try {
    const cpuUsage = getCpuUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuTemp = await getCpuTemp();

    const systemInfo = {
      os: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
      },
      cpuTemp,
      cpuUsage,
      memoryUsage: {
        total: bytesToGB(totalMem),
        used: bytesToGB(usedMem),
        free: bytesToGB(freeMem),
      },
    };

    return NextResponse.json(systemInfo);
  } catch (error) {
    console.error('Error getting system information:', error);
    return NextResponse.json(
      { error: 'Failed to get system information' },
      { status: 500 }
    );
  }
}