function randomUint8() {
  if (window.crypto) return window.crypto.getRandomValues(new Uint8Array(1))[0];
  else return Math.floor(Math.random() * 256);
}

function roll() {
  return 1 + randomUint8() % 6;
}

function number() {
  return randomUint8() % 10;
}

function letter(capital = true) {
  return String.fromCharCode((capital ? 65 : 97) + randomUint8() % 26);
}

function word(words) {
  return words[Array.from({
    length: 5
  }, roll).join("")];
}

function sauce() {
  return `${number()}${letter()}`
}

let defaults = {
  COUNT: 4,
  SAUCE_TYPE: "random",
  SAUCE_VALUE: sauce(),
  SEPARATOR: '-',
  WORDLIST: "./eff_large_wordlist.txt",
  OPTIONS_OPEN: false
}

function godango(words) {
  return Array.from({
    length: defaults.COUNT
  }, () => word(words)).join(defaults.SEPARATOR) +
    (defaults.SAUCE_TYPE !== "none" ? `${defaults.COUNT > 0 ? defaults.SEPARATOR : ''}${defaults.SAUCE_TYPE === "custom" ? defaults.SAUCE_VALUE : sauce()}` : "");
}

function entropy() {
  return Math.round(Math.log2(Math.pow(Math.pow(6, 5), defaults.COUNT) * (defaults.SAUCE_TYPE === "random" ? 10 * 26 : 1)))
}

async function main() {
  // https://www.eff.org/dice
  const text = await (await fetch("eff_large_wordlist.txt", {
    cache: "force-cache"
  })).text();

  const words = Object.fromEntries(
    [...text.matchAll(/(\d+)\t(\w+)\n/g)].map(([_, number, word]) => [
      number,
      word,
    ]),
  );

  const form = document.querySelector("form");
  const optionsDetails = document.querySelector("details.options");
  const outputBox = form.querySelector("input[name=output]");
  const entropyBox = form.querySelector("input[name=entropy]");
  const lengthBox = form.querySelector("input[name=length]");
  const copyButton = form.querySelector("input[name=copy]");
  const lastBox = document.querySelector("textarea");
  const prevDango = [];

  const countInput = form.querySelector("input[name=count]");
  const separatorInput = form.querySelector("input[name=separator]");
  const sauceRadios = form.querySelectorAll("input[name=sauce-type]");
  const sauceInput = form.querySelector("input[name=sauce-value]");

  if (!window.crypto) {
    const warning = document.createElement("details");
    warning.style.color = "orange";
    warning.innerText = "Your browser doesn't support Web Crypto. Passwords generated may not be cryptographically secure (we can't make them random enough).";
    const summary = document.createElement("summary");
    summary.textContent = "⚠️ unsafe mode";
    warning.appendChild(summary);
    document.querySelector("h1").insertAdjacentElement("afterend", warning);
  }


  function create() {
    outputBox.value = godango(words);
    entropyBox.value = entropy();
    lengthBox.value = outputBox.value.length;
    outputBox.focus();
    outputBox.select();
    lastBox.value = [...prevDango].reverse().join("\n");
    prevDango.push(outputBox.value);
    if (prevDango.length > lastBox.rows) prevDango.shift();
  }

  function updateDefaults(doCreate = true) {
    localStorage.setItem("defaults", JSON.stringify(defaults));
    if (doCreate) create();
  }

  defaults = JSON.parse(localStorage.getItem("defaults")) ?? defaults;

  optionsDetails.addEventListener("toggle", (_) => {
    defaults.OPTIONS_OPEN = optionsDetails.open;
    updateDefaults(false);
  });
  optionsDetails.open = defaults.OPTIONS_OPEN;

  countInput.addEventListener("change", (_) => {
    defaults.COUNT = countInput.value;
    updateDefaults();
  });
  countInput.value = defaults.COUNT;

  separatorInput.addEventListener("change", (_) => {
    defaults.SEPARATOR = separatorInput.value;
    updateDefaults();
  });
  separatorInput.value = defaults.SEPARATOR;


  function tryDisableCustomSauce() {
    sauceInput.disabled = defaults.SAUCE_TYPE !== "custom";
  }

  sauceInput.addEventListener("change", (_) => {
    defaults.SAUCE_VALUE = sauceInput.value;
    updateDefaults();
  });
  sauceInput.value = defaults.SAUCE_VALUE;
  tryDisableCustomSauce();

  sauceRadios.forEach(radio => radio.addEventListener("change", (_) => {
    defaults.SAUCE_TYPE = radio.value;
    tryDisableCustomSauce();
    updateDefaults();
  }));

  form.querySelector(`input[name=sauce-type][value=${defaults.SAUCE_TYPE}]`).checked = true;

  outputBox.addEventListener("click", () => outputBox.select());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    create();
  });
  copyButton.addEventListener("click", () => {
    outputBox.select();
    document.execCommand("copy");
  });
  create();
}

main();
