/* Builds a smooth vector portrait for a case from its "look" settings. */
window.renderCharacter = function (look) {
  const L = Object.assign({ skin: "#e9c19f", hair: "#333", hairStyle: "short", shirt: "#4a7", accent: "#fff", top: "tee", bg: "#eef", mood: "neutral" }, look);
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
    const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  };
  const skinD = shade(L.skin, -28), hairD = shade(L.hair, -25), shirtD = shade(L.shirt, -30);

  const hairBack = {
    pony: `<path d="M92 128 C88 70 130 52 150 52 C176 52 214 66 210 130 L214 196 C200 182 196 150 196 140 L104 140 C104 156 100 182 86 196 Z" fill="${L.hair}"/>
           <path d="M206 92 C236 100 246 150 232 200 C224 178 214 150 206 132 Z" fill="${hairD}"/>`,
    bob: `<path d="M84 150 C76 80 120 56 150 56 C182 56 226 80 216 150 C218 178 212 196 204 204 L196 150 L104 150 L96 204 C88 196 82 178 84 150 Z" fill="${L.hair}"/>`,
    short: ``, balding: ``
  }[L.hairStyle] || "";

  const hairFront = {
    pony: `<path d="M94 132 C92 82 126 64 152 64 C184 64 210 86 206 132 C196 108 176 92 150 96 C128 98 108 112 94 132 Z" fill="${L.hair}"/>`,
    bob: `<path d="M90 140 C88 86 122 64 152 64 C184 64 214 88 210 140 C200 112 186 96 168 92 C150 104 118 112 90 140 Z" fill="${L.hair}"/>`,
    short: `<path d="M94 126 C90 80 122 62 152 62 C186 62 212 84 206 126 C202 110 196 100 186 96 C160 88 128 92 106 104 C100 110 96 118 94 126 Z" fill="${L.hair}"/>`,
    balding: `<path d="M92 150 C88 128 92 112 100 104 C104 120 104 136 104 150 Z" fill="${L.hair}"/>
              <path d="M208 150 C212 128 208 112 200 104 C196 120 196 136 196 150 Z" fill="${L.hair}"/>
              <path d="M112 92 C128 82 172 82 188 92 C170 88 130 88 112 92 Z" fill="${hairD}" opacity=".5"/>`
  }[L.hairStyle] || "";

  const brows = {
    neutral: `<path d="M118 132 Q130 127 142 131" /><path d="M158 131 Q170 127 182 132" />`,
    pained: `<path d="M118 130 Q131 131 142 125" /><path d="M158 125 Q169 131 182 130" />`,
    worried: `<path d="M118 133 Q130 128 142 126" /><path d="M158 126 Q170 128 182 133" />`
  }[L.mood];
  const mouth = {
    neutral: `<path d="M136 190 Q150 198 164 190" />`,
    pained: `<path d="M134 194 Q142 188 150 192 Q158 188 166 194" />`,
    worried: `<path d="M136 194 Q150 188 164 194" />`
  }[L.mood];

  const tops = {
    sport: `<path d="M40 360 C40 282 92 252 150 252 C208 252 260 282 260 360 Z" fill="${L.shirt}"/>
            <path d="M118 256 L150 290 L182 256" fill="none" stroke="${L.accent}" stroke-width="8" stroke-linejoin="round"/>
            <path d="M60 300 C70 290 80 284 92 280" stroke="${L.accent}" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M240 300 C230 290 220 284 208 280" stroke="${L.accent}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    hivis: `<path d="M40 360 C40 282 92 252 150 252 C208 252 260 282 260 360 Z" fill="#3a4250"/>
            <path d="M62 360 C62 300 84 270 118 258 L134 300 L134 360 Z" fill="${L.shirt}"/>
            <path d="M238 360 C238 300 216 270 182 258 L166 300 L166 360 Z" fill="${L.shirt}"/>
            <rect x="62" y="318" width="72" height="12" fill="${L.accent}"/><rect x="166" y="318" width="72" height="12" fill="${L.accent}"/>`,
    gown: `<path d="M40 360 C40 282 92 252 150 252 C208 252 260 282 260 360 Z" fill="${L.shirt}"/>
           <path d="M120 256 Q150 282 180 256" fill="none" stroke="${shirtD}" stroke-width="5"/>
           ${[[80,300],[120,320],[170,306],[214,322],[100,345],[150,342],[200,350],[234,298]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="${shirtD}" opacity=".55"/>`).join("")}`,
    polo: `<path d="M40 360 C40 282 92 252 150 252 C208 252 260 282 260 360 Z" fill="${L.shirt}"/>
           <path d="M124 254 L150 276 L176 254 L168 248 L150 262 L132 248 Z" fill="${L.accent}"/>
           <path d="M150 276 L150 310" stroke="${shirtD}" stroke-width="3"/><circle cx="150" cy="290" r="2.5" fill="${L.accent}"/><circle cx="150" cy="302" r="2.5" fill="${L.accent}"/>`
  };

  const extras = [];
  if (L.glasses) extras.push(`<g fill="none" stroke="#5a4636" stroke-width="3.5"><circle cx="130" cy="150" r="15"/><circle cx="170" cy="150" r="15"/><path d="M145 149 Q150 145 155 149"/></g>`);
  if (L.cannula) extras.push(`<g fill="none" stroke="#bfe3f0" stroke-width="4" stroke-linecap="round"><path d="M92 160 C100 186 124 180 140 178"/><path d="M208 160 C200 186 176 180 160 178"/><path d="M92 162 C86 200 96 240 120 262"/></g>`);
  if (L.sweat) extras.push(`<path d="M196 112 C200 120 204 126 200 131 C196 135 190 132 191 126 C192 121 194 117 196 112 Z" fill="#9fd4f5"/>`);
  if (L.stubble) extras.push(`<path d="M112 184 C118 214 138 226 150 226 C162 226 182 214 188 184 C176 200 164 206 150 206 C136 206 124 200 112 184 Z" fill="${shade(L.hair,-10)}" opacity=".22"/>`);

  return `
<svg viewBox="0 0 300 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Patient">
  <circle cx="150" cy="176" r="140" fill="${L.bg}"/>
  <g class="breathe">
    ${hairBack}
    ${tops[L.top] || tops.sport}
    <path d="M128 200 L128 250 Q150 266 172 250 L172 200 Z" fill="${skinD}"/>
    <ellipse cx="94" cy="156" rx="11" ry="17" fill="${skinD}"/>
    <ellipse cx="206" cy="156" rx="11" ry="17" fill="${skinD}"/>
    <ellipse cx="150" cy="150" rx="58" ry="70" fill="${L.skin}"/>
    ${hairFront}
    <g class="eyes"><ellipse cx="130" cy="151" rx="5" ry="6.5" fill="#2a211d"/><ellipse cx="170" cy="151" rx="5" ry="6.5" fill="#2a211d"/></g>
    <g fill="none" stroke="${hairD}" stroke-width="4.5" stroke-linecap="round">${brows}</g>
    <path d="M150 158 Q146 172 151 176" fill="none" stroke="${skinD}" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="118" cy="176" r="9" fill="#ff8a8a" opacity=".22"/><circle cx="182" cy="176" r="9" fill="#ff8a8a" opacity=".22"/>
    <g fill="none" stroke="#7a3b34" stroke-width="4" stroke-linecap="round">${mouth}</g>
    ${extras.join("")}
  </g>
</svg>`;
};
