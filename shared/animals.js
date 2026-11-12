/* Shared animal drawings for WigglePlay games. All original, all drawn facing right.
   Each animal has: name, notes (three pitches for its little tune) and art (SVG shapes).
   Inside the art: .legA and .legB are the legs, .eye-open and .eye-closed are the two eye states. */
const EYE = (x, y) =>
  `<circle class="eye-open" cx="${x}" cy="${y}" r="5.5" fill="#1d1d24"></circle>` +
  `<path class="eye-closed" d="M${x - 7} ${y} q7 6 14 0" fill="none" stroke="#1d1d24" stroke-width="3.5" stroke-linecap="round" style="display:none"></path>`;
const SHADOW = `<ellipse cx="100" cy="160" rx="64" ry="8" fill="#000" opacity="0.18"></ellipse>`;

export const ANIMALS = {
  bunny: { name: "Bunny", notes: [523.25, 659.25, 783.99], art:
    `<g class="legB"><ellipse cx="70" cy="148" rx="17" ry="9" fill="#e4e4ea"></ellipse></g>
     <g class="legA"><ellipse cx="128" cy="148" rx="14" ry="9" fill="#e4e4ea"></ellipse></g>
     <circle cx="38" cy="112" r="13" fill="#ffffff"></circle>
     <ellipse cx="92" cy="110" rx="56" ry="40" fill="#f7f7fa"></ellipse>
     <ellipse cx="136" cy="32" rx="10" ry="30" fill="#f7f7fa" transform="rotate(-8 136 32)"></ellipse>
     <ellipse cx="136" cy="34" rx="5" ry="20" fill="#f6b3c6" transform="rotate(-8 136 34)"></ellipse>
     <ellipse cx="160" cy="36" rx="10" ry="30" fill="#f7f7fa" transform="rotate(14 160 36)"></ellipse>
     <ellipse cx="160" cy="38" rx="5" ry="20" fill="#f6b3c6" transform="rotate(14 160 38)"></ellipse>
     <circle cx="148" cy="80" r="32" fill="#f7f7fa"></circle>
     <circle cx="150" cy="94" r="7" fill="#f9cdd8" opacity="0.8"></circle>
     <circle cx="178" cy="86" r="4.5" fill="#ee7f9d"></circle>` + EYE(160, 76) },
  cat: { name: "Cat", notes: [440, 554.37, 659.25], art:
    `<path d="M42 112 C 10 104, 12 62, 34 56" fill="none" stroke="#f39a3d" stroke-width="13" stroke-linecap="round"></path>
     <g class="legB"><ellipse cx="68" cy="146" rx="11" ry="13" fill="#e2852a"></ellipse></g>
     <g class="legA"><ellipse cx="124" cy="146" rx="11" ry="13" fill="#e2852a"></ellipse></g>
     <ellipse cx="92" cy="108" rx="54" ry="36" fill="#f39a3d"></ellipse>
     <polygon points="124,62 128,28 150,52" fill="#f39a3d" stroke="#f39a3d" stroke-width="6" stroke-linejoin="round"></polygon>
     <polygon points="152,52 172,30 174,64" fill="#f39a3d" stroke="#f39a3d" stroke-width="6" stroke-linejoin="round"></polygon>
     <circle cx="148" cy="82" r="32" fill="#f39a3d"></circle>
     <ellipse cx="166" cy="94" rx="15" ry="11" fill="#fde3c4"></ellipse>
     <circle cx="177" cy="88" r="4" fill="#d9577a"></circle>` + EYE(158, 76) },
  duck: { name: "Duck", notes: [587.33, 739.99, 880], art:
    `<g class="legB"><ellipse cx="82" cy="151" rx="12" ry="6" fill="#f08a24"></ellipse></g>
     <g class="legA"><ellipse cx="112" cy="151" rx="12" ry="6" fill="#f08a24"></ellipse></g>
     <polygon points="44,104 20,84 50,90" fill="#ffd84d" stroke="#ffd84d" stroke-width="6" stroke-linejoin="round"></polygon>
     <ellipse cx="92" cy="114" rx="54" ry="34" fill="#ffd84d"></ellipse>
     <ellipse cx="84" cy="114" rx="27" ry="18" fill="#f2c02a"></ellipse>
     <circle cx="146" cy="72" r="29" fill="#ffd84d"></circle>
     <ellipse cx="179" cy="79" rx="17" ry="8" fill="#f08a24"></ellipse>` + EYE(155, 66) },
  puppy: { name: "Puppy", notes: [392, 493.88, 587.33], art:
    `<path d="M42 102 C 22 92, 20 70, 30 60" fill="none" stroke="#b9783f" stroke-width="11" stroke-linecap="round"></path>
     <g class="legB"><ellipse cx="68" cy="146" rx="11" ry="13" fill="#9f632d"></ellipse></g>
     <g class="legA"><ellipse cx="124" cy="146" rx="11" ry="13" fill="#9f632d"></ellipse></g>
     <ellipse cx="92" cy="108" rx="54" ry="36" fill="#b9783f"></ellipse>
     <circle cx="148" cy="82" r="32" fill="#b9783f"></circle>
     <ellipse cx="128" cy="78" rx="12" ry="25" fill="#7a481d" transform="rotate(18 128 78)"></ellipse>
     <ellipse cx="168" cy="94" rx="16" ry="12" fill="#ecd3b3"></ellipse>
     <circle cx="181" cy="88" r="5.5" fill="#2a1a10"></circle>` + EYE(158, 74) },
  pig: { name: "Pig", notes: [349.23, 440, 523.25], art:
    `<path d="M40 100 q-14 -4 -10 -16 q10 -2 8 8" fill="none" stroke="#f29bb1" stroke-width="6" stroke-linecap="round"></path>
     <g class="legB"><ellipse cx="68" cy="147" rx="11" ry="12" fill="#e07f99"></ellipse></g>
     <g class="legA"><ellipse cx="124" cy="147" rx="11" ry="12" fill="#e07f99"></ellipse></g>
     <ellipse cx="92" cy="108" rx="56" ry="38" fill="#f6a9bd"></ellipse>
     <polygon points="126,60 132,36 148,54" fill="#e07f99" stroke="#e07f99" stroke-width="6" stroke-linejoin="round"></polygon>
     <circle cx="148" cy="84" r="32" fill="#f6a9bd"></circle>
     <ellipse cx="174" cy="92" rx="13" ry="11" fill="#e07f99"></ellipse>
     <circle cx="171" cy="92" r="2.6" fill="#8f3b52"></circle><circle cx="179" cy="92" r="2.6" fill="#8f3b52"></circle>` + EYE(156, 76) },
  chick: { name: "Chick", notes: [659.25, 783.99, 987.77], art:
    `<g class="legB"><ellipse cx="88" cy="152" rx="10" ry="5" fill="#f08a24"></ellipse></g>
     <g class="legA"><ellipse cx="114" cy="152" rx="10" ry="5" fill="#f08a24"></ellipse></g>
     <circle cx="100" cy="106" r="46" fill="#ffe680"></circle>
     <ellipse cx="78" cy="112" rx="16" ry="22" fill="#f6cf45" transform="rotate(-18 78 112)"></ellipse>
     <path d="M96 60 q4 -16 10 0" fill="none" stroke="#f6cf45" stroke-width="6" stroke-linecap="round"></path>
     <polygon points="142,100 162,106 142,114" fill="#f08a24" stroke="#f08a24" stroke-width="4" stroke-linejoin="round"></polygon>` + EYE(124, 94) }
};

export const animalSVG = (key) =>
  `<svg viewBox="0 0 200 170" role="img" aria-label="${ANIMALS[key].name}">${SHADOW}<g class="body">${ANIMALS[key].art}</g></svg>`;
