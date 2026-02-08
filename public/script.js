fetch("/api/stats")
  .then(res => res.json())
  .then(data => {
    document.getElementById("online").textContent = data.online;
  });

fetch("/api/me")
  .then(res => res.json())
  .then(user => {
    if (!user) return;

    document.getElementById("userBox").innerHTML = `
      <p>👤 ${user.username}</p>
      ${user.isAdmin ? "<b>ADMIN PANEL AKTIV</b>" : ""}
      <br><a href="/logout">Logout</a>
    `;
  });
