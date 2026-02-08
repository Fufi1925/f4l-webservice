import express from "express";
import session from "express-session";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* Sessions */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

/* Frontend ausliefern */
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* Discord Login */
app.get("/auth/discord", (req, res) => {
  const url =
    `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}` +
    `&response_type=code&scope=identify%20guilds.members.read` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;
  res.redirect(url);
});

/* Discord Callback */
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("No code");

  const tokenRes = await axios.post(
    "https://discord.com/api/oauth2/token",
    new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.REDIRECT_URI
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const accessToken = tokenRes.data.access_token;

  const userRes = await axios.get("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const memberRes = await axios.get(
    `https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  req.session.user = {
    id: userRes.data.id,
    username: userRes.data.username,
    avatar: userRes.data.avatar,
    roles: memberRes.data.roles,
    isAdmin: memberRes.data.roles.includes(process.env.ADMIN_ROLE_ID)
  };

  res.redirect("/");
});

/* API: User */
app.get("/api/me", (req, res) => {
  res.json(req.session.user || null);
});

/* API: Discord Online Counter */
app.get("/api/stats", async (req, res) => {
  const widget = await axios.get(
    `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/widget.json`
  );
  res.json({ online: widget.data.presence_count });
});

/* Logout */
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("F4L WebService läuft"));
