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
  // During build time or if we can't access hardware, return null
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const platform = os.platform();
    
    if (platform === 'darwin') {  // macOS
      try {
        const { stdout } = await execAsync("sudo powermetrics --samplers smc -i1 -n1");
        const match = stdout.match(/CPU die temperature: (\d+\.\d+)/);
        if (match && match[1]) {
          return parseFloat(match[1]);
        }
      } catch (error) {
        console.debug('Could not read macOS temperature:', error);
        return null;
      }
    } 
    else if (platform === 'linux') {  // Raspberry Pi
      try {
        const { stdout } = await execAsync("vcgencmd measure_temp");
        return parseFloat(stdout.replace("temp=", "").replace("'C", ""));
      } catch (error) {
        console.debug('Could not read Raspberry Pi temperature:', error);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.debug("Error reading CPU temperature:", error);
    return null;
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