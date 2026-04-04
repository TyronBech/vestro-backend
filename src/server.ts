import { createApp } from "./app";
import { HOST, PORT } from "./config/env";

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Vestro backend running at http://${HOST}:${PORT}`);
});
