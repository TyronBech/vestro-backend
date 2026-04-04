import { createApp } from "./app";
import { PORT } from "./config/env";

const app = createApp();

app.listen(PORT, () => {
  console.log(`Vestro backend running at http://localhost:${PORT}`);
});
