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
  try {
    const { stdout } = await execAsync("cat /sys/class/thermal/thermal_zone0/temp");
    // Convert millidegrees to degrees
    return parseFloat(stdout) / 1000;
  } catch (error) {
    console.error('Could not read Raspberry Pi temperature:', error);
    return null;
  }
}

function bytesToGB(bytes: number) {
  return bytes / (1024 * 1024 * 1024);
}

export async function GET() {
  try {
    // Get CPU usage
    const cpuUsage = getCpuUsage();

    // Get memory info
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