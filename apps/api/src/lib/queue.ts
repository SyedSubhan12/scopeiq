import { Queue } from "bullmq";
import { Redis } from "ioredis";

let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
    connection.on("error", (err) => {
      console.error("[Queue] Redis connection error:", err.message);
    });
  }
  return connection;
}

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: getConnection() });
    queues.set(name, queue);
  }
  return queue;
}

export async function dispatchJob(
  queueName: string,
  jobName: string,
  data: Record<string, unknown>,
  options?: { delay?: number; priority?: number },
): Promise<string> {
  const queue = getQueue(queueName);
  const jobOptions: Record<string, unknown> = {
    removeOnComplete: 100,
    removeOnFail: 500,
  };
  if (options?.delay !== undefined) jobOptions["delay"] = options.delay;
  if (options?.priority !== undefined) jobOptions["priority"] = options.priority;

  const job = await queue.add(jobName, data, jobOptions);
  return job.id ?? "";
}
