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
const tierToValue = {S: 1, A: 2, B: 3, C: 4, D: 5};
const valueToTier = value =>
    value <= 1.5 ? "S" :
        value <= 2.5 ? "A" :
            value <= 3.5 ? "B" :
                value <= 4.5 ? "C" : "D";

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
    section.className = "other-user-tierlist";
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

    const html = wrapper.outerHTML;
    const accordionItem = createAccordionItem(username, html);
    document.getElementById("otherTierLists").appendChild(accordionItem);
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

async function renderConsensusTierList() {
    const consensusContainer = document.getElementById("consensusTierList");
    consensusContainer.innerHTML = "";

    const tierlistsSnap = await getDocs(collection(db, "tierlists"));
    const gameMap = await fetchGamesMap();

    const tierVotes = {}; // gameId -> [1, 3, 2, ...]

    tierlistsSnap.forEach(docSnap => {
        const data = docSnap.data();
        ["S", "A", "B", "C", "D"].forEach(tier => {
            (data[tier] || []).forEach(gameId => {
                const id = gameId.toString();
                if (!tierVotes[id]) {
                    tierVotes[id] = [];
                }
                tierVotes[id].push(tierToValue[tier]);
            });
        });
    });

    const consensusTierMap = {S: [], A: [], B: [], C: [], D: []};

    for (const [gameId, votes] of Object.entries(tierVotes)) {
        const avg = votes.reduce((a, b) => a + b, 0) / votes.length;
        const consensusTier = valueToTier(avg);
        const game = gameMap[gameId];
        if (game) {
            consensusTierMap[consensusTier].push(game);
        }
    }

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

        consensusTierMap[tier].forEach(game => {
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

    consensusContainer.appendChild(wrapper);
}

function createAccordionItem(username, tierHtmlContent) {
    const item = document.createElement("div");
    item.className = "accordion-item";

    const header = document.createElement("div");
    header.className = "accordion-header";
    header.textContent = username;

    const content = document.createElement("div");
    content.className = "accordion-content";
    content.innerHTML = tierHtmlContent;

    header.addEventListener("click", () => {
        const all = document.querySelectorAll(".accordion-content");
        all.forEach(el => el !== content && el.classList.remove("open"));
        content.classList.toggle("open");
    });

    item.appendChild(header);
    item.appendChild(content);
    return item;
}

document.addEventListener("DOMContentLoaded", async () => {
    await renderOtherUsersTierLists();
    await renderConsensusTierList();
});
