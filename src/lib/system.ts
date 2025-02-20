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
    const platform = os.platform();
    
    if (platform === 'darwin') {  // macOS
      const { stdout } = await execAsync("sudo powermetrics --samplers smc -i1 -n1");
      const match = stdout.match(/CPU die temperature: (\d+\.\d+)/);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
      throw new Error("Could not parse CPU temperature");
    } 
    else if (platform === 'linux') {  // Raspberry Pi
      const { stdout } = await execAsync("vcgencmd measure_temp");
      return parseFloat(stdout.replace("temp=", "").replace("'C", ""));
    }
    else {
      throw new Error(`CPU temperature reading not supported on ${platform}`);
    }
  } catch (error) {
    console.error("Error reading CPU temperature:", error);
    return null;  // Return null if temperature cannot be read
  }
}

function bytesToGB(bytes: number) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

export async function getSystemDetails() {
  // Get CPU usage
  const cpuUsage = getCpuUsage();

  // Get memory info
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
 
  const cpuTemp = await getCpuTemp();

  return {
    os: {
      hostname: os.hostname,
      platform: os.platform,
      arch: os.arch,
    },
    cpuTemp,
    cpuUsage,
    memoryUsage: {
      total: parseFloat(bytesToGB(totalMem)),
      used: parseFloat(bytesToGB(usedMem)),
      free: parseFloat(bytesToGB(freeMem)),
    },
  };
}