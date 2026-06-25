import { Queue, Worker, type ConnectionOptions } from "bullmq";

function redisConnection(): ConnectionOptions {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null,
    };
  }
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    maxRetriesPerRequest: null,
  };
}

const connection = redisConnection();

export const screeningQueue = new Queue("screening", { connection });

export function createScreeningWorker(
  processor: (job: { data: { jobId: string } }) => Promise<void>
) {
  return new Worker("screening", processor, { connection });
}
