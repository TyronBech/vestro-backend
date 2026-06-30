import { createApp } from "./app";
import { env } from "./config/env";
import { SchedulerService } from "./services/scheduler.service";

const app = createApp();

app.listen(Number(env.PORT), env.HOST, () => {
  console.log(`Vestro backend running at http://${env.HOST}:${env.PORT}`);
  SchedulerService.initialize();
});
