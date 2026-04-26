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
  shoot: ["shoot", "Shoot", "shooting", "Shooting", "finishing", "Finishing"],
  dribble: ["dribble", "Dribble", "dribbling", "Dribbling"],
  firstTouch: ["firstTouch", "FirstTouch"],
  ballControl: ["ballControl", "BallControl"],
  pass: ["pass", "Pass", "passing", "Passing"],
  speed: ["speed", "Speed", "pace", "Pace"],
  strength: ["strength", "Strength", "physical", "Physical", "physicality", "Physicality"],
  team: ["team", "Team", "club", "Club"],
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

const OMITTED_PLAYER_FIELDS = ["position", "Position", "role", "Role"];

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function omitPlayerFields(source) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !OMITTED_PLAYER_FIELDS.includes(key)),
  );
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
  const sanitizedPlayer = omitPlayerFields(player);
  const id = pickFirst(player, PLAYER_ALIAS_GROUPS.id) ?? index + 1;
  const name = pickFirst(player, PLAYER_ALIAS_GROUPS.name) ?? `Player ${index + 1}`;
  const overall = pickFirst(player, PLAYER_ALIAS_GROUPS.overall);
  const imageUrl = pickFirst(player, PLAYER_ALIAS_GROUPS.imageUrl) ?? "";
  const team = pickFirst(player, PLAYER_ALIAS_GROUPS.team) ?? "";
  const shoot = pickFirst(player, PLAYER_ALIAS_GROUPS.shoot);
  const dribble = pickFirst(player, PLAYER_ALIAS_GROUPS.dribble);
  const firstTouch = pickFirst(player, PLAYER_ALIAS_GROUPS.firstTouch);
  const ballControl = pickFirst(player, PLAYER_ALIAS_GROUPS.ballControl);
  const pass = pickFirst(player, PLAYER_ALIAS_GROUPS.pass);
  const speed = pickFirst(player, PLAYER_ALIAS_GROUPS.speed);
  const defense = pickFirst(player, PLAYER_ALIAS_GROUPS.defense);
  const strength = pickFirst(player, PLAYER_ALIAS_GROUPS.strength);

  return {
    ...sanitizedPlayer,
    __raw: sanitizedPlayer,
    id,
    idLabel: String(id),
    name,
    overall,
    imageUrl,
    team,
    shoot,
    dribble,
    firstTouch,
    ballControl,
    pass,
    speed,
    defense,
    strength,
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

export function isOmittedPlayerField(key) {
  return OMITTED_PLAYER_FIELDS.includes(key);
}

export function formatOverall(value, fallback = "-") {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return String(value);
  }

  return String(Math.round(numeric));
}

export function getDisplayEntries(player) {
  if (!isPlainObject(player)) {
    return [];
  }

  return Object.entries(player)
    .filter(([key, value]) => {
      if (key.startsWith("__") || isOmittedPlayerField(key)) {
        return false;
      }

      return value !== undefined && value !== null && value !== "";
    })
    .map(([key, value]) => ({
      key,
      label: formatFieldLabel(key),
      value: key.toLowerCase() === "overall" ? formatOverall(value) : value,
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
      "shoot",
      "dribble",
      "firstTouch",
      "ballControl",
      "pass",
      "speed",
      "strength",
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

  return omitPlayerFields(payload);
}

export function getTeamCollection(result) {
  return extractCollection(result, ["teams", "Teams"]);
}

export function getPlayerImageUrl(player) {
  return player?.imageUrl ?? "";
}
