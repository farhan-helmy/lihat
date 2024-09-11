import { Hono } from "hono";
import * as si from "systeminformation";
import { streamSSE } from "hono/streaming";
import { cors } from 'hono/cors'
import { CpuData } from "./types";

const app = new Hono();
let id = 0;

app.use(cors({
  origin: ["http://localhost:5173"],
}))

app.get("/", async (c) => {
  const cpu = await si.cpu();
  const cpuCurrSpeed = await si.cpuCurrentSpeed();
  const cpuTemperature = await si.cpuTemperature();
  const osInfo = await si.osInfo();

  const cpuData: CpuData = {
    manufacturer: cpu.manufacturer ?? "",
    brand: cpu.brand ?? "",
    speed: cpu.speed ?? 0,
    cores: cpu.cores ?? 0,
    physicalCores: cpu.physicalCores ?? 0,
  };

  return c.json({
    cpu: cpuData,
    cpuCurrSpeed,
    cpuTemperature,
    osInfo,
  });
});

app.get("/realtime", async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const cpuTemperature = await si.cpuTemperature();
      const cpuUsage = await si.currentLoad();
      const memoryUsage = await si.mem();
      const time = new Date().toISOString();
      await stream.writeSSE({
        data: JSON.stringify({
          cpuTemperature,
          cpuUsage,
          memoryUsage,
          time
        }),
        event: "metrics",
        id: String(id++),
      });
      await stream.sleep(1000);
    }
  });
});

export default {
  port: 6969,
  fetch: app.fetch,
};
