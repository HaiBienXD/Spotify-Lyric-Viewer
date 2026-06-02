import { Router } from "express";

const router = Router();

router.get("/spotify/callback", (req, res) => {
  const { code, state, error } = req.query;

  const params = new URLSearchParams();
  if (code) params.set("code", String(code));
  if (state) params.set("state", String(state));
  if (error) params.set("error", String(error));

  const frontendUrl = `/?${params.toString()}`;
  res.redirect(302, frontendUrl);
});

export default router;
