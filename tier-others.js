import {db} from './firebase-init.js';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const currentUser = localStorage.getItem("loggedInUser");
const otherTierListsContainer = document.getElementById("otherTierLists");

async function fetchGamesMap() {
    const gamesSnap = await getDocs(collection(db, "games"));
    const gameMap = {};
    gamesSnap.forEach(doc => {
        const data = doc.data();
        gameMap[data.gameId.toString()] = data;
    });
    return gameMap;
}

function renderUserTierList(username, tierData, gameMap) {
    const section = document.createElement("div");
    section.className = "tierlist";
    section.innerHTML = `<h3>Tier Lista: ${username}</h3>`;

    const wrapper = document.createElement("div");
    wrapper.className = "tier-rankings";

    ["S", "A", "B", "C", "D"].forEach(tier => {
        const row = document.createElement("div");
        row.className = "tier-row";
        row.dataset.tier = tier;

        const label = document.createElement("span");
        label.className = "tier-label";
        label.dataset.tier = tier;
        label.textContent = tier;

        const slot = document.createElement("div");
        slot.className = "tier-slot";

        (tierData[tier] || []).forEach(gameId => {
            const game = gameMap[gameId.toString()];
            if (!game) {
                return;
            }

            const card = document.createElement("div");
            card.className = "game-card";
            card.innerHTML = `
        <img src="${game.thumbnail}" alt="${game.name}" />
      `;
            slot.appendChild(card);
        });

        row.appendChild(label);
        row.appendChild(slot);
        wrapper.appendChild(row);
    });

    section.appendChild(wrapper);
    otherTierListsContainer.appendChild(section);
}

async function renderOtherUsersTierLists() {
    const q = query(collection(db, "tierlists"));
    const snapshot = await getDocs(q);
    const gameMap = await fetchGamesMap();

    snapshot.forEach(docSnap => {
        const username = docSnap.id;
        if (username === currentUser) {
            return;
        } // pomiń samego siebie

        const tierData = docSnap.data();
        renderUserTierList(username, tierData, gameMap);
    });
}

document.addEventListener("DOMContentLoaded", renderOtherUsersTierLists);
