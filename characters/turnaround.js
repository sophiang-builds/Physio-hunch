/*
  Physio Hunch turnaround rig.

  renderView(spec, view) returns an SVG string for one angle.
  view: "front" | "right" | "back" | "left"   (left is the right view mirrored)
  Canvas: 240 x 480, feet on y = 468, body centre x = 120.
  Every character is a spec in characters.json; nothing here is per-person.
*/
(function (root) {
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    return "#" + ((1 << 24) | (c((n >> 16) & 255) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1);
  };
  const has = (s, x) => (s.extras || []).includes(x);
  const CX = 120, SHOULDER_Y = 110, HIP_Y = 236, KNEE_Y = 340, ANKLE_Y = 448, GROUND = 468;

  // ---------------- shared pieces ----------------
  function face(s, view) {
    const ink = "#2a211d", brow = shade(s.hair.colour === "#e4e1dc" ? "#9a948c" : s.hair.colour, -10);
    const mood = s.mood || "neutral";
    if (view === "front") {
      const brows = {
        neutral: "M104 52 Q111 49 117 51 M123 51 Q129 49 136 52",
        pained: "M104 51 Q111 51 117 47 M123 47 Q129 51 136 51",
        worried: "M104 53 Q111 49 117 48 M123 48 Q129 49 136 53"
      }[mood];
      const mouth = { neutral: "M113 80 Q120 85 127 80", pained: "M112 83 Q116 79 120 82 Q124 79 128 83", worried: "M113 83 Q120 79 127 83" }[mood];
      return `<ellipse cx="111" cy="62" rx="3.2" ry="4" fill="${ink}"/><ellipse cx="129" cy="62" rx="3.2" ry="4" fill="${ink}"/>
        <path d="${brows}" stroke="${brow}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M120 66 Q117 73 121 75" stroke="${shade(s.skin, -35)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="105" cy="74" r="5.5" fill="#ff8a8a" opacity=".22"/><circle cx="135" cy="74" r="5.5" fill="#ff8a8a" opacity=".22"/>
        <path d="${mouth}" stroke="#7a3b34" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    }
    if (view === "right") {
      const brows = { neutral: "M128 51 Q134 49 139 51", pained: "M128 49 Q134 51 139 50", worried: "M128 52 Q134 49 139 51" }[mood];
      const mouth = { neutral: "M133 81 Q137 83 140 81", pained: "M133 83 Q137 80 140 83", worried: "M133 83 Q137 81 140 83" }[mood];
      return `<ellipse cx="134" cy="62" rx="2.8" ry="3.8" fill="${ink}"/>
        <path d="${brows}" stroke="${brow}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="131" cy="73" r="5" fill="#ff8a8a" opacity=".22"/>
        <path d="${mouth}" stroke="#7a3b34" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    }
    return "";
  }

  function head(s, view) {
    const skinD = shade(s.skin, -28);
    if (view === "right") {
      return `<path d="M120 88 L120 110 L132 110 L132 88 Z" fill="${skinD}"/>
        <path d="M96 62 C96 40 110 31 122 31 C136 31 144 42 145 56 L148 66 L144 68 C144 82 136 92 122 93 C104 94 96 80 96 62 Z" fill="${s.skin}"/>
        <ellipse cx="113" cy="64" rx="6" ry="9" fill="${skinD}"/>`;
    }
    return `<rect x="111" y="86" width="18" height="26" rx="6" fill="${skinD}"/>
      <ellipse cx="94" cy="65" rx="6" ry="9" fill="${skinD}"/><ellipse cx="146" cy="65" rx="6" ry="9" fill="${skinD}"/>
      <ellipse cx="120" cy="62" rx="25" ry="30" fill="${s.skin}"/>`;
  }

  // Hair: returns [behindHead, overHead]
  function hair(s, view) {
    const h = s.hair.colour, d = shade(h, -22), st = s.hair.style;
    if (st === "pony") {
      if (view === "front") return [`<path d="M140 50 C156 60 158 96 150 120 C146 104 142 84 138 66 Z" fill="${d}"/>`,
        `<path d="M95 64 C92 36 108 28 121 28 C136 28 149 38 145 64 C140 48 130 42 120 44 C110 42 100 48 95 64 Z" fill="${h}"/>`];
      if (view === "right") return [`<path d="M100 44 C84 50 78 76 82 104 C88 92 94 78 102 62 Z" fill="${d}"/>`,
        `<path d="M145 52 C140 30 108 24 98 46 C94 56 95 70 100 80 L106 72 C104 62 108 54 116 50 C126 46 138 46 145 52 Z" fill="${h}"/><circle cx="101" cy="47" r="4" fill="#f3d34a"/>`];
      return [``, `<ellipse cx="120" cy="58" rx="26" ry="29" fill="${h}"/><path d="M114 60 C110 80 112 104 120 124 C128 104 130 80 126 60 Z" fill="${d}"/><circle cx="120" cy="58" r="4" fill="#f3d34a"/>`];
    }
    if (st === "crop" || st === "receding") {
      const front = st === "crop"
        ? `<path d="M95 60 C93 36 108 30 120 30 C134 30 148 36 145 60 C141 46 132 40 120 40 C108 40 99 46 95 60 Z" fill="${h}"/>`
        : `<path d="M95 66 C93 46 100 40 104 38 C104 50 100 58 98 68 Z M145 66 C147 46 140 40 136 38 C136 50 140 58 142 68 Z" fill="${h}"/><path d="M106 36 C114 33 126 33 134 36 C126 35 114 35 106 36 Z" fill="${h}" opacity=".6"/>`;
      if (view === "front") return [``, front];
      if (view === "right") return [``, st === "crop"
        ? `<path d="M144 50 C140 30 108 26 98 46 C94 56 95 70 100 80 L108 74 C106 62 110 52 118 46 C128 40 140 44 144 50 Z" fill="${h}"/>`
        : `<path d="M126 34 C112 32 100 40 97 54 C95 66 97 76 101 82 L108 76 C106 64 108 54 114 46 C118 40 122 36 126 34 Z" fill="${h}"/>`];
      return [``, `<path d="M95 62 C93 38 108 31 120 31 C133 31 147 38 145 62 C144 74 140 82 136 84 L104 84 C100 82 96 74 95 62 Z" fill="${h}"/>`];
    }
    if (st === "braid") {
      if (view === "front") return [``, `<path d="M95 66 C92 36 108 29 120 29 C133 29 148 36 145 66 C142 50 134 42 121 40 C119 46 112 50 95 66 Z" fill="${h}"/>
        <path d="M120 40 L121 52" stroke="${shade(s.skin, -20)}" stroke-width="1.5"/>
        <path d="M100 76 C92 100 96 124 104 150" stroke="${h}" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M95 96 L104 100 M96 112 L105 116 M99 128 L107 131" stroke="${d}" stroke-width="2"/>`];
      if (view === "right") return [`<path d="M100 70 C92 100 92 140 96 176" stroke="${h}" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M92 104 L101 108 M92 124 L101 127 M93 144 L102 147 M94 162 L102 164" stroke="${d}" stroke-width="2"/>`,
        `<path d="M146 52 C141 30 108 25 98 46 C94 56 95 70 100 80 L107 74 C105 62 109 52 118 47 C128 42 140 45 146 52 Z" fill="${h}"/>`];
      return [``, `<ellipse cx="120" cy="58" rx="26" ry="29" fill="${h}"/>
        <path d="M120 80 C119 120 120 160 120 196" stroke="${h}" stroke-width="11" fill="none" stroke-linecap="round"/>
        <path d="M115 100 L125 104 M115 120 L125 124 M115 140 L125 144 M115 160 L125 164 M115 180 L125 184" stroke="${d}" stroke-width="2"/>`];
    }
    if (st === "curls") {
      const ring = (pts) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${h}"/>`).join("") +
        pts.map(([x, y, r]) => `<circle cx="${x - 1}" cy="${y - 1}" r="${r * 0.45}" fill="${d}" opacity=".35"/>`).join("");
      if (view === "front") return [``, ring([[98, 50, 9], [108, 38, 10], [121, 34, 11], [134, 38, 10], [143, 50, 9], [95, 64, 7], [146, 64, 7]])];
      if (view === "right") return [``, ring([[104, 40, 10], [118, 33, 10], [132, 36, 9], [98, 54, 9], [100, 70, 8], [140, 44, 7]])];
      return [``, ring([[100, 46, 10], [114, 36, 11], [128, 36, 11], [141, 46, 10], [96, 62, 9], [108, 60, 10], [122, 58, 11], [136, 60, 10], [145, 64, 8], [104, 76, 8], [120, 76, 9], [136, 76, 8]])];
    }
    return [``, ``];
  }

  // ---------------- body by view ----------------
  function frontBody(s, back) {
    const b = s.build, sh = b.shoulder, hip = b.hip, lw = b.leg, skinD = shade(s.skin, -28);
    const top = s.top, col = top.colour, colD = shade(col, -28), acc = top.accent || "#fff";
    const legX = [CX - hip + lw / 2 + 2, CX + hip - lw / 2 - 2];
    const parts = [];
    // legs
    const legFill = s.bottom.style === "pants" ? s.bottom.colour : s.bottom.style === "stockings" ? s.bottom.colour : s.skin;
    legX.forEach((x) => parts.push(`<rect x="${x - lw / 2}" y="${HIP_Y - 6}" width="${lw}" height="${ANKLE_Y - HIP_Y + 10}" rx="${lw / 2}" fill="${legFill}"/>`));
    if (s.bottom.style === "shorts") parts.push(`<path d="M${CX - hip - 2} ${HIP_Y - 8} L${CX + hip + 2} ${HIP_Y - 8} L${CX + hip + 4} ${HIP_Y + 62} L${CX + 3} ${HIP_Y + 62} L${CX} ${HIP_Y + 20} L${CX - 3} ${HIP_Y + 62} L${CX - hip - 4} ${HIP_Y + 62} Z" fill="${s.bottom.colour}"/>`);
    if (s.socks) legX.forEach((x) => parts.push(`<rect x="${x - lw / 2}" y="${ANKLE_Y - 22}" width="${lw}" height="26" rx="6" fill="${s.socks}"/>`));
    if (has(s, "bandage-right-ankle")) {
      const x = back ? legX[1] : legX[0];
      parts.push(`<rect x="${x - lw / 2 - 2}" y="${ANKLE_Y - 30}" width="${lw + 4}" height="30" rx="7" fill="#f6efe2"/><path d="M${x - lw / 2} ${ANKLE_Y - 22} L${x + lw / 2} ${ANKLE_Y - 14} M${x - lw / 2} ${ANKLE_Y - 12} L${x + lw / 2} ${ANKLE_Y - 4}" stroke="#d9cdb6" stroke-width="2"/>`);
    }
    // shoes
    legX.forEach((x) => parts.push(`<ellipse cx="${x}" cy="${ANKLE_Y + 10}" rx="${lw / 2 + 5}" ry="9" fill="${s.shoes}"/>`));
    // arms
    const sleeveEnd = { none: SHOULDER_Y + 4, short: SHOULDER_Y + 46, long: HIP_Y + 4 }[top.sleeve || "short"];
    const armCol = top.style === "hivis" ? top.under : col;
    [-1, 1].forEach((side) => {
      const x = CX + side * (sh - 2);
      parts.push(`<rect x="${x - 8}" y="${SHOULDER_Y}" width="16" height="${HIP_Y + 14 - SHOULDER_Y}" rx="8" fill="${s.skin}" transform="rotate(${side * -4} ${x} ${SHOULDER_Y})"/>`);
      if (sleeveEnd > SHOULDER_Y + 6) parts.push(`<rect x="${x - 9.5}" y="${SHOULDER_Y - 2}" width="19" height="${sleeveEnd - SHOULDER_Y}" rx="9" fill="${armCol}" transform="rotate(${side * -4} ${x} ${SHOULDER_Y})"/>`);
      parts.push(`<circle cx="${x + side * 9}" cy="${HIP_Y + 22}" r="8.5" fill="${s.skin}"/>`);
    });
    if (has(s, "wristband")) parts.push(`<rect x="${CX - sh - 9}" y="${HIP_Y + 6}" width="16" height="6" rx="3" fill="#ffffff" stroke="#c9c9c9"/>`);
    // torso
    const torsoBottom = top.style === "gown" ? KNEE_Y + 4 : HIP_Y + 4;
    const flare = top.style === "gown" ? 10 : 0;
    parts.push(`<path d="M${CX - sh} ${SHOULDER_Y + 10} Q${CX - sh} ${SHOULDER_Y - 2} ${CX - sh + 12} ${SHOULDER_Y - 4} L${CX + sh - 12} ${SHOULDER_Y - 4} Q${CX + sh} ${SHOULDER_Y - 2} ${CX + sh} ${SHOULDER_Y + 10} L${CX + hip + 2 + flare} ${torsoBottom} L${CX - hip - 2 - flare} ${torsoBottom} Z" fill="${top.style === "hivis" ? top.under : col}"/>`);
    // garment details
    if (top.style === "jersey") {
      parts.push(`<path d="M${CX - 12} ${SHOULDER_Y - 4} L${CX} ${SHOULDER_Y + 10} L${CX + 12} ${SHOULDER_Y - 4}" fill="none" stroke="${acc}" stroke-width="4"/>`);
      parts.push(`<circle cx="${CX}" cy="${SHOULDER_Y + 50}" r="17" fill="#ffffff"/><text x="${CX}" y="${SHOULDER_Y + 56}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="15" fill="${col}">${top.label || ""}</text>`);
    }
    if (top.style === "hivis") {
      parts.push(`<path d="M${CX - sh + 4} ${SHOULDER_Y} L${CX - 8} ${SHOULDER_Y - 2} L${CX - 10} ${HIP_Y} L${CX - hip - 1} ${HIP_Y} Z" fill="${col}"/><path d="M${CX + sh - 4} ${SHOULDER_Y} L${CX + 8} ${SHOULDER_Y - 2} L${CX + 10} ${HIP_Y} L${CX + hip + 1} ${HIP_Y} Z" fill="${col}"/>`);
      if (back) parts.push(`<rect x="${CX - hip}" y="${SHOULDER_Y}" width="${hip * 2}" height="${HIP_Y - SHOULDER_Y}" fill="${col}"/>`);
      parts.push(`<rect x="${CX - hip - 1}" y="${SHOULDER_Y + 80}" width="${hip * 2 + 2}" height="9" fill="${acc}"/><rect x="${CX - hip - 1}" y="${SHOULDER_Y + 100}" width="${hip * 2 + 2}" height="9" fill="${acc}"/>`);
    }
    if (top.style === "polo") parts.push(`<path d="M${CX - 14} ${SHOULDER_Y - 4} L${CX} ${SHOULDER_Y + 12} L${CX + 14} ${SHOULDER_Y - 4} L${CX + 10} ${SHOULDER_Y - 8} L${CX} ${SHOULDER_Y + 2} L${CX - 10} ${SHOULDER_Y - 8} Z" fill="${acc}"/>` +
      (back ? "" : `<path d="M${CX} ${SHOULDER_Y + 12} L${CX} ${SHOULDER_Y + 40}" stroke="${colD}" stroke-width="2"/><circle cx="${CX}" cy="${SHOULDER_Y + 22}" r="2" fill="${acc}"/><circle cx="${CX}" cy="${SHOULDER_Y + 32}" r="2" fill="${acc}"/>`));
    if (top.style === "gown") {
      const dots = [[-20, 150], [14, 168], [-6, 200], [22, 228], [-24, 252], [8, 270], [-14, 300], [20, 312], [0, 132]];
      parts.push(dots.map(([dx, y]) => `<circle cx="${CX + dx}" cy="${y}" r="3" fill="${top.accent}" opacity=".6"/>`).join(""));
      parts.push(back ? `<path d="M${CX} ${SHOULDER_Y - 2} L${CX + 3} ${KNEE_Y}" stroke="${top.accent}" stroke-width="2.5"/><path d="M${CX - 8} 150 Q${CX} 156 ${CX + 9} 148 M${CX - 8} 220 Q${CX} 226 ${CX + 9} 218" stroke="${top.accent}" stroke-width="2.5" fill="none"/>`
        : `<path d="M${CX - 13} ${SHOULDER_Y - 4} Q${CX} ${SHOULDER_Y + 10} ${CX + 13} ${SHOULDER_Y - 4}" fill="none" stroke="${top.accent}" stroke-width="3"/>`);
    }
    if (s.bottom.style === "pants" && top.style !== "hivis") parts.push(`<rect x="${CX - hip - 2}" y="${HIP_Y - 4}" width="${hip * 2 + 4}" height="8" rx="3" fill="${shade(s.bottom.colour, -25)}"/>`);
    if (b.belly && !back && top.style !== "gown") parts.push(`<path d="M${CX - hip + 4} ${HIP_Y - 30} Q${CX} ${HIP_Y - 10} ${CX + hip - 4} ${HIP_Y - 30}" stroke="${colD}" stroke-width="2" fill="none" opacity=".5"/>`);
    return parts.join("");
  }

  function sideBody(s) {
    const b = s.build, depthF = Math.round(b.shoulder * 0.45) + b.belly, depthB = Math.round(b.shoulder * 0.42), lw = b.leg;
    const top = s.top, col = top.colour, acc = top.accent || "#fff";
    const parts = [];
    const legFill = s.bottom.style === "pants" || s.bottom.style === "stockings" ? s.bottom.colour : s.skin;
    const legsX = [CX - 8, CX + 4];
    legsX.forEach((x, i) => parts.push(`<rect x="${x - lw / 2}" y="${HIP_Y - 8}" width="${lw}" height="${ANKLE_Y - HIP_Y + 12}" rx="${lw / 2}" fill="${i === 0 ? shade(legFill, -14) : legFill}"/>`));
    if (s.bottom.style === "shorts") parts.push(`<path d="M${CX - depthB - 2} ${HIP_Y - 10} L${CX + depthF - 2} ${HIP_Y - 10} L${CX + depthF} ${HIP_Y + 62} L${CX - depthB - 4} ${HIP_Y + 62} Z" fill="${s.bottom.colour}"/>`);
    if (s.socks) legsX.forEach((x) => parts.push(`<rect x="${x - lw / 2}" y="${ANKLE_Y - 22}" width="${lw}" height="26" rx="6" fill="${s.socks}"/>`));
    if (has(s, "bandage-right-ankle")) { const x = legsX[1]; parts.push(`<rect x="${x - lw / 2 - 2}" y="${ANKLE_Y - 30}" width="${lw + 4}" height="30" rx="7" fill="#f6efe2"/><path d="M${x - lw / 2} ${ANKLE_Y - 22} L${x + lw / 2} ${ANKLE_Y - 14} M${x - lw / 2} ${ANKLE_Y - 12} L${x + lw / 2} ${ANKLE_Y - 4}" stroke="#d9cdb6" stroke-width="2"/>`); }
    legsX.forEach((x, i) => parts.push(`<ellipse cx="${x + 9}" cy="${ANKLE_Y + 10}" rx="${lw / 2 + 11}" ry="9" fill="${i === 0 ? shade(s.shoes, -18) : s.shoes}"/>`));
    const torsoBottom = top.style === "gown" ? KNEE_Y + 4 : HIP_Y + 4;
    const fill = top.style === "hivis" ? col : col;
    parts.push(`<path d="M${CX - depthB} ${SHOULDER_Y + 4} Q${CX - 2} ${SHOULDER_Y - 8} ${CX + depthF - 6} ${SHOULDER_Y + 4} Q${CX + depthF + 4} ${SHOULDER_Y + 60} ${CX + depthF} ${torsoBottom} L${CX - depthB - (top.style === "gown" ? 6 : 0)} ${torsoBottom} Q${CX - depthB - 6} ${SHOULDER_Y + 60} ${CX - depthB} ${SHOULDER_Y + 4} Z" fill="${fill}"/>`);
    if (top.style === "hivis") parts.push(`<rect x="${CX - depthB - 2}" y="${SHOULDER_Y + 80}" width="${depthB + depthF + 4}" height="9" fill="${acc}"/><rect x="${CX - depthB - 2}" y="${SHOULDER_Y + 100}" width="${depthB + depthF + 4}" height="9" fill="${acc}"/>`);
    if (top.style === "jersey") parts.push(`<text x="${CX + 2}" y="${SHOULDER_Y + 56}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="11" fill="#fff" opacity=".9">${top.label || ""}</text>`);
    if (top.style === "gown") parts.push([[-6, 150], [10, 190], [-10, 230], [6, 270], [-4, 310]].map(([dx, y]) => `<circle cx="${CX + dx}" cy="${y}" r="3" fill="${top.accent}" opacity=".6"/>`).join(""));
    if (s.bottom.style === "pants" && top.style !== "hivis") parts.push(`<rect x="${CX - depthB - 2}" y="${HIP_Y - 4}" width="${depthB + depthF + 2}" height="8" rx="3" fill="${shade(s.bottom.colour, -25)}"/>`);
    // near arm
    const sleeveEnd = { none: SHOULDER_Y + 4, short: SHOULDER_Y + 46, long: HIP_Y + 4 }[top.sleeve || "short"];
    const armCol = top.style === "hivis" ? top.under : col;
    parts.push(`<rect x="${CX - 9}" y="${SHOULDER_Y - 2}" width="17" height="${HIP_Y + 14 - SHOULDER_Y}" rx="8.5" fill="${s.skin}" transform="rotate(-5 ${CX} ${SHOULDER_Y})"/>`);
    if (sleeveEnd > SHOULDER_Y + 6) parts.push(`<rect x="${CX - 10.5}" y="${SHOULDER_Y - 4}" width="20" height="${sleeveEnd - SHOULDER_Y + 2}" rx="10" fill="${armCol}" transform="rotate(-5 ${CX} ${SHOULDER_Y})"/>`);
    parts.push(`<circle cx="${CX + 12}" cy="${HIP_Y + 20}" r="8.5" fill="${s.skin}"/>`);
    if (has(s, "wristband")) parts.push(`<rect x="${CX + 3}" y="${HIP_Y + 6}" width="16" height="6" rx="3" fill="#fff" stroke="#c9c9c9"/>`);
    return parts.join("");
  }

  function extras(s, view) {
    const out = [];
    if (has(s, "glasses")) out.push(view === "front"
      ? `<g fill="none" stroke="#5a4636" stroke-width="2.5"><circle cx="111" cy="62" r="9"/><circle cx="129" cy="62" r="9"/><path d="M120 61 Q120 58 120 61"/><path d="M102 60 L96 58 M138 60 L144 58"/></g>`
      : view === "right" ? `<g fill="none" stroke="#5a4636" stroke-width="2.5"><circle cx="136" cy="62" r="8"/><path d="M128 61 L113 60"/></g>` : `<path d="M96 60 L144 60" stroke="#5a4636" stroke-width="2.5" opacity=".7"/>`);
    if (has(s, "cannula")) out.push(view === "front"
      ? `<g fill="none" stroke="#bfe3f0" stroke-width="2.6" stroke-linecap="round"><path d="M94 70 C98 84 112 78 118 77"/><path d="M146 70 C142 84 128 78 122 77"/><path d="M95 72 C90 100 96 130 108 150"/></g>`
      : view === "right" ? `<g fill="none" stroke="#bfe3f0" stroke-width="2.6" stroke-linecap="round"><path d="M142 74 C130 80 118 76 112 70"/><path d="M112 72 C106 96 108 130 116 156"/></g>`
      : `<path d="M96 70 C104 92 120 96 120 110" stroke="#bfe3f0" stroke-width="2.6" fill="none"/>`);
    if (has(s, "moustache") && view !== "back") out.push(view === "front"
      ? `<path d="M110 76 Q120 70 130 76 Q120 79 110 76 Z" fill="${shade(s.hair.colour, -20)}"/>` : `<path d="M134 76 Q140 72 145 75 Q140 79 134 77 Z" fill="${shade(s.hair.colour, -20)}"/>`);
    if (has(s, "beard") && view !== "back") out.push(view === "front"
      ? `<path d="M96 70 C98 90 110 96 120 96 C130 96 142 90 144 70 C140 84 130 88 120 88 C110 88 100 84 96 70 Z" fill="${shade(s.hair.colour, 10)}" opacity=".55"/>`
      : `<path d="M112 74 C116 90 128 95 140 90 C138 86 134 86 130 86 C122 86 116 82 112 74 Z" fill="${shade(s.hair.colour, 10)}" opacity=".55"/>`);
    if (has(s, "sweat") && view !== "back") out.push(`<path d="M${view === "front" ? 140 : 132} 40 C143 46 146 51 143 55 C140 58 135 56 136 51 C137 47 138 44 ${view === "front" ? 140 : 132} 40 Z" fill="#9fd4f5"/>`);
    if (has(s, "earrings")) out.push(view === "front" ? `<circle cx="94" cy="76" r="2.4" fill="#e8c35a"/><circle cx="146" cy="76" r="2.4" fill="#e8c35a"/>` : view === "right" ? `<circle cx="113" cy="76" r="2.4" fill="#e8c35a"/>` : "");
    return out.join("");
  }

  function renderView(s, view) {
    const mirror = view === "left";
    const v = mirror ? "right" : view;
    const [hairBack, hairFront] = hair(s, v);
    const body = v === "right" ? sideBody(s) : frontBody(s, v === "back");
    const headLayer = v === "back"
      ? `${head(s, "back")}${hairFront}${extras(s, "back")}`
      : `${hairBack}${head(s, v)}${face(s, v)}${hairFront}${extras(s, v)}`;
    const shadow = `<ellipse cx="${CX}" cy="${GROUND}" rx="${v === "right" ? 44 : 56}" ry="7" fill="#24203c" opacity=".12"/>`;
    const scale = `translate(${CX} ${GROUND}) scale(${s.height || 1}) translate(${-CX} ${-GROUND})`;
    const inner = `${shadow}<g transform="${scale}">${body}${headLayer}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 480" width="240" height="480">${mirror ? `<g transform="translate(240 0) scale(-1 1)">${inner}</g>` : inner}</svg>`;
  }

  root.Turnaround = { renderView, views: ["front", "right", "back", "left"] };
  if (typeof module !== "undefined") module.exports = root.Turnaround;
})(typeof window !== "undefined" ? window : globalThis);
