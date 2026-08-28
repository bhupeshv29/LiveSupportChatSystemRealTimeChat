import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json("ok");
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
