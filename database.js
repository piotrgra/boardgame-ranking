import { db } from './firebase-init.js';
import {
    collection,
    addDoc,
    getDocs,
    query,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("bggForm");
const preview = document.getElementById("gamePreview");
const listContainer = document.getElementById("gameList");

form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gameId = document.getElementById("bggId").value.trim();
    if (!gameId) return;

    const apiUrl = `https://bgg-json.azurewebsites.net/thing/${gameId}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Nie udało się pobrać danych z BGG.");

        const game = await res.json();

        preview.innerHTML = `
      <h3>${game.name}</h3>
      <img src="${game.thumbnail}" alt="${game.name}" />
      <p>Min. gracze: ${game.minPlayers}</p>
      <p>Ocena: ${game.averageRating}</p>
      <p>Ranking BGG: ${game.rank}</p>
      <button id="confirmAdd">Dodaj do mojej bazy</button>
    `;

        document.getElementById("confirmAdd").addEventListener("click", async () => {
            try {
                const cleanGameData = {
                    gameId: game.gameId,
                    name: game.name,
                    thumbnail: game.thumbnail,
                    bggRating: game.bggRating,
                    rank: game.rank
                };

                await addDoc(collection(db, "games"), cleanGameData);
                form.reset();
                preview.innerHTML = "";
                renderGames();
            } catch (err) {
                alert("Błąd zapisu: " + err.message);
                console.error(err);
            }
        });
    } catch (err) {
        alert("Wystąpił błąd: " + err.message);
        console.error(err);
    }
});

async function renderGames() {
    try {
        const q = query(collection(db, "games"));
        const querySnapshot = await getDocs(q);

        listContainer.innerHTML = "";

        if (querySnapshot.empty) {
            listContainer.innerHTML = "<p>Brak gier w bazie.</p>";
            return;
        }

        querySnapshot.forEach((snapshotDoc) => {
            const game = snapshotDoc.data();
            const gameId = snapshotDoc.id;

            const card = document.createElement("div");
            card.className = "game-card";

            card.innerHTML = `
        <img src="${game.thumbnail}" alt="${game.name}" />
        <span>${game.name}</span>
        <button class="deleteBtn">Usuń</button>
      `;

            card.querySelector(".deleteBtn").addEventListener("click", async () => {
                if (confirm(`Na pewno usunąć "${game.name}"?`)) {
                    await deleteDoc(doc(db, "games", gameId));
                    card.remove();
                }
            });

            listContainer.appendChild(card);
        });
    } catch (err) {
        console.error("Błąd przy pobieraniu gier:", err);
        listContainer.innerHTML = "<p>Nie udało się załadować gier.</p>";
    }
}

document.addEventListener("DOMContentLoaded", renderGames);
