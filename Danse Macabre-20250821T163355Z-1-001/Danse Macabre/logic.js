document.addEventListener("DOMContentLoaded", async () => {
  const url = "data/personnages/arkanis.json";
  try {
    const response = await fetch(url);
    const data = await response.json();

    normalizeCaracteristiques(data);

    renderCombat(data);
    renderSauvegardes(data); // 👈 ajouté ici
    renderCaracsEtCompetences(data);
    renderCapacites(data);
    renderTraits(data);
    renderProgression(data);
    renderEquipement(data);
    renderActions(data);

  } catch (err) {
    console.error("Erreur de chargement JSON :", err);
  }
});


function normalizeCaracteristiques(data) {
  const upper = {};
  for (let key in data.caracteristiques) {
    upper[key.toUpperCase()] = data.caracteristiques[key];
  }
  data.caracteristiques = upper;
}

function renderCombat(data) {
  const container = document.getElementById("stats-block");
  const modDex = getModificateur(data.caracteristiques?.DEXTERITE || 10);
  const modInt = getModificateur(data.caracteristiques?.INTELLIGENCE || 10);
  const aDefPred = (data.capacitesActives || []).some(c => c.nom === "Défense prédictive");

  const baseCA = 10 + (aDefPred ? modInt : modDex);
  const pvInitial = 8 + getModificateur(data.caracteristiques?.CONSTITUTION || 10);

  container.innerHTML = `
    <h2>Combat</h2>
    <p><strong>CA :</strong> ${baseCA}</p>
    <p><strong>PV :</strong> ${pvInitial}</p>
    <p><strong>Initiative :</strong> +${modDex}</p>
    <p><strong>Vitesse :</strong> 9 m</p>
    <p><strong>Dés de vie :</strong> 1d8</p>
    <p><strong>Maîtrise :</strong> +${data.bonusMaitrise || 2}</p>
  `;
}

function renderCaracsEtCompetences(data) {
  const caracsContainer = document.getElementById("caracs-block");
  const compContainer = document.getElementById("competences-block");

  const attributs = {
    FORCE: "FOR",
    DEXTERITE: "DEX",
    CONSTITUTION: "CON",
    INTELLIGENCE: "INT",
    SAGESSE: "SAG",
    CHARISME: "CHA"
  };

  const competencesParCarac = {
    FORCE: ["Athlétisme"],
    DEXTERITE: ["Acrobatie", "Discrétion", "Escamotage"],
    CONSTITUTION: [],
    INTELLIGENCE: ["Arcanes", "Histoire", "Investigation", "Nature", "Religion"],
    SAGESSE: ["Dressage", "Intuition", "Médecine", "Perception", "Survie"],
    CHARISME: ["Intimidation", "Persuasion", "Représentation", "Tromperie"]
  };

  caracsContainer.innerHTML = "";
  compContainer.innerHTML = "";

  Object.entries(attributs).forEach(([caracKey, label]) => {
    const score = data.caracteristiques?.[caracKey] || 10;
    const mod = getModificateur(score);

    const div = document.createElement("div");
    div.className = "carac-group";
    div.innerHTML = `
      <div class="carac-circle">
        <div>${label}</div>
        <div>${score}</div>
        <div>${mod >= 0 ? "+" + mod : mod}</div>
      </div>
    `;

    const ul = document.createElement("ul");
    competencesParCarac[caracKey].forEach(nom => {
      const modComp = getModificateurParCompetence(nom, data);
      const mait = data.competencesMaitrisees?.some(m => m.toLowerCase() === nom.toLowerCase()) ? "✓" : "";
      const li = document.createElement("li");
      li.textContent = `${nom} : ${modComp >= 0 ? "+" + modComp : modComp} ${mait}`;
      ul.appendChild(li);
    });
    div.appendChild(ul);
    caracsContainer.appendChild(div);
  });
}

function renderCapacites(data) {
  const container = document.getElementById("capacites");
  container.innerHTML = "<h2>Capacités actives</h2>";
  (data.capacitesActives || []).forEach(cap => {
    container.innerHTML += `
      <div class="box">
        <h3>${cap.nom} (niveau ${cap.niveau})</h3>
        <p><em>${cap.resume || ""}</em></p>
        <p>${cap.description || ""}</p>
      </div>
    `;
  });
}

function renderTraits(data) {
  const container = document.getElementById("traits");
  container.innerHTML = "<h2>Traits, effets et passifs</h2>";

  (data.capacitesPassives || []).forEach(trait => {
    container.innerHTML += `
      <div class="box">
        <h3>${trait.nom}</h3>
        <p>${trait.description || ""}</p>
      </div>
    `;
  });

  if (data.immunites?.length || data.resistances?.length) {
    container.innerHTML += `
      <div class="box">
        <h3>Défenses</h3>
        ${data.immunites?.length ? `<p><strong>Immunités :</strong> ${data.immunites.join(", ")}</p>` : ""}
        ${data.resistances?.length ? `<p><strong>Résistances :</strong> ${data.resistances.join(", ")}</p>` : ""}
      </div>
    `;
  }
}

function renderProgression(data) {
  const container = document.getElementById("progression");
  container.innerHTML = "<h2>Progression</h2>";
  (data.capacitesFutures || []).forEach(cap => {
    container.innerHTML += `
      <div class="box">
        <h3>${cap.nom}</h3>
        <p><strong>Niveau :</strong> ${cap.niveau}</p>
        <p><strong>Source :</strong> ${cap.source}</p>
      </div>
    `;
  });
}

function renderEquipement(data) {
  const armureBlock = document.getElementById("armure-block");
  const armesBlock = document.getElementById("armes-block");

  armureBlock.innerHTML = "";
  armesBlock.innerHTML = "";

  const armure = data.equipement?.armure;
  const armes = data.equipement?.armes || [];

  if (armure) {
    const mod = getModificateur(data.caracteristiques?.[armure.modificateur.toUpperCase()] || 10);
    const bonusCA = armure.bonusCA + mod;
    armureBlock.innerHTML = `
      <h3>Armure portée</h3>
      <p><strong>${armure.nom}</strong> (${armure.type})</p>
      <p>CA : ${armure.bonusCA} + mod(${armure.modificateur}) = <strong>${bonusCA}</strong></p>
    `;
  } else {
    armureBlock.innerHTML = `<p>Aucune armure équipée.</p>`;
  }

  if (armes.length > 0) {
    armesBlock.innerHTML = `<h3>Armes</h3>`;
    armes.forEach(arme => {
      const mod = getModificateur(data.caracteristiques?.[arme.carac.toUpperCase()] || 10);
      armesBlock.innerHTML += `
        <p><strong>${arme.nom}</strong> (${arme.type})<br>
        Dégâts : ${arme.degats} + mod(${arme.carac}) = <strong>${arme.degats} + ${mod >= 0 ? "+" : ""}${mod}</strong><br>
        Portée : ${arme.portee}</p>
        <hr>
      `;
    });
  } else {
    armesBlock.innerHTML = `<p>Aucune arme équipée.</p>`;
  }
}

function renderActions(data) {
  const container = document.getElementById("action");
  container.innerHTML = "<h2>Actions</h2>";

  const armes = data.equipement?.armes || [];
  const actionsBonus = (data.capacitesActives || []).filter(c => c.resume?.toLowerCase().includes("action bonus"));
  const autres = [
    "Attaquer", "Esquiver", "Se désengager", "Se cacher",
    "Aider", "Se relever", "S'équiper/déséquiper", "Lire/boire un objet"
  ];
  const autresBonus = ["Dégainer", "Interagir avec un objet", "Activer un pouvoir passif"];

  container.innerHTML += `<div class="actions-row">`;

  // Attaques
  container.innerHTML += `<div class="action-box"><h3>Attaques</h3>`;
  if (armes.length > 0) {
    armes.forEach(arme => {
      const mod = getModificateur(data.caracteristiques?.[arme.carac.toUpperCase()] || 10);
      container.innerHTML += `
        <div class="sub-box">
          <strong>${arme.nom}</strong> (${arme.type})<br>
          Dégâts : ${arme.degats} + ${mod >= 0 ? "+" : ""}${mod}<br>
          Portée : ${arme.portee}
        </div>
      `;
    });
  } else {
    container.innerHTML += `<p class="sub-box">Aucune arme équipée.</p>`;
  }
  container.innerHTML += `</div>`;

  // Actions bonus
  container.innerHTML += `<div class="action-box"><h3>Actions Bonus</h3>`;
  if (actionsBonus.length > 0) {
    actionsBonus.forEach(cap => {
      container.innerHTML += `
        <div class="sub-box">
          <strong>${cap.nom}</strong><br>
          <em>${cap.resume}</em><br>
          ${cap.description}
        </div>
      `;
    });
  } else {
    container.innerHTML += `<p class="sub-box">Aucune action bonus connue.</p>`;
  }
  container.innerHTML += `</div>`;

  // Autres
  container.innerHTML += `<div class="action-box"><h3>Autres Actions</h3><div class="sub-box">${autres.join(", ")}.</div></div>`;
  container.innerHTML += `<div class="action-box"><h3>Autres Actions Bonus</h3><div class="sub-box">${autresBonus.join(", ")}.</div></div>`;

  container.innerHTML += `</div>`; // end .actions-row
}

function getModificateur(score) {
  return Math.floor((score - 10) / 2);
}

function getModificateurParCompetence(nom, data) {
  const table = {
    "Athlétisme": "FORCE",
    "Acrobatie": "DEXTERITE",
    "Discrétion": "DEXTERITE",
    "Escamotage": "DEXTERITE",
    "Arcanes": "INTELLIGENCE",
    "Histoire": "INTELLIGENCE",
    "Investigation": "INTELLIGENCE",
    "Nature": "INTELLIGENCE",
    "Religion": "INTELLIGENCE",
    "Dressage": "SAGESSE",
    "Intuition": "SAGESSE",
    "Médecine": "SAGESSE",
    "Perception": "SAGESSE",
    "Survie": "SAGESSE",
    "Intimidation": "CHARISME",
    "Persuasion": "CHARISME",
    "Représentation": "CHARISME",
    "Tromperie": "CHARISME"
  };

  const carac = table[nom];
  const base = getModificateur(data.caracteristiques?.[carac] || 10);
  const bonusMaitrise = data.competencesMaitrisees?.some(m => m.toLowerCase() === nom.toLowerCase()) ? (data.bonusMaitrise || 2) : 0;
  return base + bonusMaitrise;
}

function renderSauvegardes(data) {
  const container = document.getElementById("sauvegardes-block");
  if (!container) return;

  const caracs = ["FORCE", "DEXTERITE", "CONSTITUTION", "INTELLIGENCE", "SAGESSE", "CHARISME"];
  container.innerHTML = `<h2>Jets de sauvegarde</h2>`;

  caracs.forEach(carac => {
    const mod = getModificateur(data.caracteristiques?.[carac] || 10);
    const maitrise = (data.sauvegardesMaitrisees || []).includes(carac);
    const total = mod + (maitrise ? (data.bonusMaitrise || 0) : 0);
    const signe = total >= 0 ? "+" : "";

    container.innerHTML += `
      <p><strong>${carac} :</strong> ${signe}${total} ${maitrise ? "✓" : ""}</p>
    `;
  });

  // Affichage du DD si défini
  if (data.jetDeSauvegarde) {
    const base = data.jetDeSauvegarde.baseDD || 8;
    const mod = getModificateur(data.caracteristiques?.[data.jetDeSauvegarde.modificateur?.toUpperCase()] || 10);
    const bonusMaitrise = data.jetDeSauvegarde.ajouterBonusDeMaitrise ? (data.bonusMaitrise || 0) : 0;
    const ddSort = base + mod + bonusMaitrise;
    container.innerHTML += `<p><strong>DD des pouvoirs :</strong> ${ddSort}</p>`;
  }
}

