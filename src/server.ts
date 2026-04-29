import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Vestro backend running at http://localhost:${env.PORT}`);
});
