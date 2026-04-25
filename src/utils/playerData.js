// File: src/utils/playerData.js
const COLLECTION_KEYS = [
  "$values",
  "items",
  "Items",
  "players",
  "Players",
  "data",
  "Data",
  "results",
  "Results",
  "teams",
  "Teams",
];

const PLAYER_ALIAS_GROUPS = {
  id: ["id", "Id", "playerId", "PlayerId", "playerID", "PlayerID"],
  name: ["name", "Name", "playerName", "PlayerName"],
  overall: ["overall", "Overall"],
  imageUrl: ["imageUrl", "ImageUrl", "photoUrl", "PhotoUrl", "avatarUrl", "AvatarUrl"],
  team: ["team", "Team", "club", "Club"],
  position: ["position", "Position", "role", "Role"],
  nationality: ["nationality", "Nationality", "country", "Country"],
  age: ["age", "Age"],
  height: ["height", "Height"],
  weight: ["weight", "Weight"],
  pace: ["pace", "Pace", "speed", "Speed"],
  shooting: ["shooting", "Shooting", "finishing", "Finishing"],
  passing: ["passing", "Passing"],
  dribbling: ["dribbling", "Dribbling"],
  defense: ["defense", "Defense", "defending", "Defending"],
  physical: ["physical", "Physical", "physicality", "Physicality"],
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickFirst(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "") {
      return source[key];
    }
  }

  return undefined;
}

export function extractCollection(payload, preferredKeys = []) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload)) {
    return [];
  }

  const keysToCheck = [...preferredKeys, ...COLLECTION_KEYS];

  for (const key of keysToCheck) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value;
    }

    if (isPlainObject(value)) {
      const nested = extractCollection(value);

      if (nested.length > 0) {
        return nested;
      }
    }
  }

  const nestedArrays = Object.values(payload).filter(Array.isArray);

  if (nestedArrays.length === 1) {
    return nestedArrays[0];
  }

  return [];
}

export function normalizePlayer(rawPlayer, index = 0) {
  const player = isPlainObject(rawPlayer) ? rawPlayer : {};
  const id = pickFirst(player, PLAYER_ALIAS_GROUPS.id) ?? index + 1;
  const name = pickFirst(player, PLAYER_ALIAS_GROUPS.name) ?? `Player ${index + 1}`;
  const overall = pickFirst(player, PLAYER_ALIAS_GROUPS.overall);
  const imageUrl = pickFirst(player, PLAYER_ALIAS_GROUPS.imageUrl) ?? "";
  const position = pickFirst(player, PLAYER_ALIAS_GROUPS.position) ?? "";
  const team = pickFirst(player, PLAYER_ALIAS_GROUPS.team) ?? "";

  return {
    ...player,
    __raw: player,
    id,
    idLabel: String(id),
    name,
    overall,
    imageUrl,
    position,
    team,
  };
}

export function normalizePlayers(payload) {
  return extractCollection(payload, ["players", "Players"]).map(normalizePlayer);
}

export function toFormValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

export function formatFieldLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (match) => match.toUpperCase())
    .trim();
}

export function getDisplayEntries(player) {
  if (!isPlainObject(player)) {
    return [];
  }

  return Object.entries(player)
    .filter(([key, value]) => {
      if (key.startsWith("__")) {
        return false;
      }

      return value !== undefined && value !== null && value !== "";
    })
    .map(([key, value]) => ({
      key,
      label: formatFieldLabel(key),
      value,
    }));
}

function resolveTargetKey(original, aliases) {
  return aliases.find((alias) => Object.prototype.hasOwnProperty.call(original, alias)) ?? aliases[0];
}

function coerceValue(fieldKey, value) {
  if (value === "") {
    return null;
  }

  if (
    [
      "overall",
      "age",
      "height",
      "weight",
      "pace",
      "shooting",
      "passing",
      "dribbling",
      "defense",
      "physical",
    ].includes(fieldKey)
  ) {
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
  }

  return value;
}

export function buildPlayerPayload(formValues, originalPlayer = {}, templatePlayer = {}) {
  const payload = {
    ...(isPlainObject(templatePlayer) ? templatePlayer : {}),
    ...(isPlainObject(originalPlayer) ? originalPlayer : {}),
  };

  for (const [fieldKey, aliases] of Object.entries(PLAYER_ALIAS_GROUPS)) {
    if (!Object.prototype.hasOwnProperty.call(formValues, fieldKey)) {
      continue;
    }

    const targetKey = resolveTargetKey(payload, aliases);
    payload[targetKey] = coerceValue(fieldKey, formValues[fieldKey]);
  }

  for (const [fieldKey, value] of Object.entries(formValues)) {
    if (PLAYER_ALIAS_GROUPS[fieldKey]) {
      continue;
    }

    payload[fieldKey] = value === "" ? null : value;
  }

  return payload;
}

export function getTeamCollection(result) {
  return extractCollection(result, ["teams", "Teams"]);
}

export function getPlayerImageUrl(player) {
  return player?.imageUrl ?? "";
}
