import {db} from './firebase-init.js';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    query,
    deleteDoc,
    doc,
    setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const form = document.getElementById("bggForm");
const preview = document.getElementById("gamePreview");
const listContainer = document.getElementById("gameList");
const user = localStorage.getItem('loggedInUser');
let draggedCard = null;

async function renderTierList(games) {
    const user = localStorage.getItem("loggedInUser");
    const tiers = ["S", "A", "B", "C", "D"];
    const tierMap = {S: [], A: [], B: [], C: [], D: []};

    try {
        const savedDoc = await getDoc(doc(db, "tierlists", user));
        if (savedDoc.exists()) {
            const data = savedDoc.data();
            for (const tier of tiers) {
                if (Array.isArray(data[tier])) {
                    tierMap[tier] = data[tier].map(id => id.toString());
                }
            }
        }
    } catch (err) {
        console.error("Nie udało się pobrać tier listy:", err);
    }

    tiers.concat("unassigned").forEach(tier => {
        const slot = document.getElementById(`tier-${tier}`);
        if (slot) {
            slot.innerHTML = "";
        }
    });

    games.forEach((game) => {
        const card = document.createElement("div");
        card.className = "game-card";
        card.setAttribute("draggable", "true");
        card.dataset.gameId = game.gameId;

        card.innerHTML = `
      <img src="${game.thumbnail}" alt="${game.name}" />
    `;

        addDragEvents(card);

        let placed = false;
        for (const tier of tiers) {
            if (tierMap[tier].includes(game.gameId.toString())) {
                document.getElementById(`tier-${tier}`).appendChild(card);
                placed = true;
                break;
            }
        }

        if (!placed) {
            document.getElementById("tier-unassigned").appendChild(card);
        }
    });
}

form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gameId = document.getElementById("bggId").value.trim();
    if (!gameId) {
        return;
    }

    const apiUrl = `https://bgg-json.azurewebsites.net/thing/${gameId}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
            throw new Error("Nie udało się pobrać danych z BGG.");
        }

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
                    rank: game.rank,
                };

                const gamesRef = collection(db, "games");
                const snapshot = await getDocs(gamesRef);
                const existing = snapshot.docs.find(doc => doc.data().gameId === game.gameId);

                if (existing) {
                    alert("Ta gra już istnieje w bazie.");
                    return;
                }

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

document.getElementById("saveTierListBtn").addEventListener("click", async () => {
    const user = localStorage.getItem("loggedInUser");
    if (!user) {
        alert("Musisz być zalogowany, aby zapisać tier listę.");
        return;
    }

    const tiers = ["S", "A", "B", "C", "D"];
    const tierData = {};

    tiers.forEach((tier) => {
        const slot = document.getElementById(`tier-${tier}`);
        const gameIds = Array.from(slot.querySelectorAll(".game-card"))
            .map(card => card.dataset.gameId);
        tierData[tier] = gameIds;
    });

    try {
        await setDoc(doc(db, "tierlists", user), tierData);
        alert("Tier lista została zapisana!");
    } catch (err) {
        console.error("Błąd zapisu tier listy:", err);
        alert("Wystąpił błąd przy zapisie tier listy.");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const q = query(collection(db, "games"));
    const snapshot = await getDocs(q);
    const games = snapshot.docs.map(doc => doc.data());

    renderGames();
    renderTierList(games);
});


document.querySelectorAll(".tier-slot").forEach((slot) => {
    slot.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    slot.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedCard) {
            slot.appendChild(draggedCard);
        }
    });
});

function addDragEvents(card) {
    card.addEventListener("dragstart", (e) => {
        draggedCard = card;
        setTimeout(() => (card.style.display = "none"), 0);
    });

    card.addEventListener("dragend", () => {
        draggedCard.style.display = "flex";
        draggedCard = null;
    });
}

if (!user) {
    window.location.href = "index.html";
} else {
    document.getElementById("loggedUser").textContent = `Cześć ${user}`;
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
});


