const STORAGE_KEY = "gartentagebuch.v27";
const YEAR_LIST_KEY = "gartentagebuch.years.v27";
const CURRENT_YEAR_KEY = "gartentagebuch.currentYear.v27";
let currentYear = localStorage.getItem(CURRENT_YEAR_KEY) || "2026";
function yearStorageKey(year=currentYear){ return `${STORAGE_KEY}.${year}`; }
function getYearList(){
  try { const y = JSON.parse(localStorage.getItem(YEAR_LIST_KEY) || "[]"); if(y.length) return y; } catch {}
  return ["2026"];
}
function saveYearList(years){ localStorage.setItem(YEAR_LIST_KEY, JSON.stringify([...new Set(years)].sort())); }
function setCurrentYear(year){ currentYear=String(year); localStorage.setItem(CURRENT_YEAR_KEY,currentYear); }
function updateYearSelect(){
  if(!$("yearSelect")) return;
  const years=getYearList();
  $("yearSelect").innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join("");
  $("yearSelect").value=currentYear;
}

const $ = id => document.getElementById(id);

const COLLAPSE_KEY = "gartentagebuch.collapse.v26";
function loadCollapseState(){
  try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}"); }
  catch { return {}; }
}
let collapseState = loadCollapseState();
function saveCollapseState(){ localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapseState)); }
function isGroupOpen(group){
  if(collapseState[`group:${group}`] !== undefined) return Boolean(collapseState[`group:${group}`]);
  return group === "active";
}
function isEntryOpen(entry){
  const key=`entry:${entry.id}`;
  if(collapseState[key] !== undefined) return Boolean(collapseState[key]);
  return !(entry.seasonDone || Number(entry.aliveCount||0)===0);
}
function toggleGroup(group){
  collapseState[`group:${group}`]=!isGroupOpen(group);
  saveCollapseState();
  renderCategoryDetail(selectedCategory);
}
function toggleEntry(entryId){
  const e=entries.find(x=>x.id===entryId);
  if(!e) return;
  collapseState[`entry:${entryId}`]=!isEntryOpen(e);
  saveCollapseState();
  renderCategoryDetail(selectedCategory);
}


const MASTER_DATA_KEY = "gartentagebuch.masterData.v9";

function defaultMasterData(){
  return {
    "Tomate": {germinationMinDays:3,germinationMaxDays:15,plantingDepth:"0,5–1 cm",harvestMinDays:120,harvestMaxDays:190,plantingTime:"Mitte März–Anfang April vorziehen, ab Mitte Mai raus",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Mai",bloomEnd:"Juli",spacing:"50–80 cm",height:"60–250 cm",sourceNote:"stark sortenabhängig"},
    "Kohlrabi": {germinationMinDays:8,germinationMaxDays:14,plantingDepth:"0,5–1 cm",harvestMinDays:42,harvestMaxDays:84,plantingTime:"Februar–Juli",harvestSeasonStart:"Mai",harvestSeasonEnd:"Oktober",bloomStart:"",bloomEnd:"",spacing:"25–30 cm, Reihen 30 cm",height:"20–40 cm",sourceNote:"Kulturdauer je nach Sorte"},
    "Gurke": {germinationMinDays:3,germinationMaxDays:14,plantingDepth:"1–2 cm",harvestMinDays:55,harvestMaxDays:80,plantingTime:"April vorziehen, nach Eisheiligen raus",harvestSeasonStart:"Juni",harvestSeasonEnd:"September",bloomStart:"Juni",bloomEnd:"August",spacing:"50–100 cm",height:"100–300 cm rankend",sourceNote:"Rankhilfe möglich"},
    "Mais": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"3–5 cm",harvestMinDays:90,harvestMaxDays:120,plantingTime:"April/Mai",harvestSeasonStart:"August",harvestSeasonEnd:"Oktober",bloomStart:"Juli",bloomEnd:"August",spacing:"30–40 cm, Reihen 60–80 cm",height:"150–250 cm",sourceNote:"Blockpflanzung günstig"},
    "Basilikum": {germinationMinDays:5,germinationMaxDays:14,plantingDepth:"Lichtkeimer, nur andrücken",harvestMinDays:45,harvestMaxDays:80,plantingTime:"April–Juni",harvestSeasonStart:"Juni",harvestSeasonEnd:"Oktober",bloomStart:"Juli",bloomEnd:"September",spacing:"20–30 cm",height:"20–60 cm",sourceNote:"Blüten für Blatt-Ernte oft ausbrechen"},
    "Petersilie": {germinationMinDays:14,germinationMaxDays:28,plantingDepth:"1–2 cm",harvestMinDays:70,harvestMaxDays:100,plantingTime:"März–Juli",harvestSeasonStart:"Mai",harvestSeasonEnd:"November",bloomStart:"2. Jahr",bloomEnd:"2. Jahr",spacing:"10–20 cm",height:"20–50 cm",sourceNote:"langsamer Keimer"},
    "Schnittlauch": {germinationMinDays:10,germinationMaxDays:20,plantingDepth:"1–2 cm",harvestMinDays:80,harvestMaxDays:120,plantingTime:"März–Juli",harvestSeasonStart:"April",harvestSeasonEnd:"Oktober",bloomStart:"Mai",bloomEnd:"Juli",spacing:"20–30 cm",height:"20–40 cm",sourceNote:"mehrjährig"},
    "Salat": {germinationMinDays:5,germinationMaxDays:14,plantingDepth:"0,5–1 cm",harvestMinDays:35,harvestMaxDays:70,plantingTime:"März–August",harvestSeasonStart:"Mai",harvestSeasonEnd:"Oktober",bloomStart:"",bloomEnd:"",spacing:"20–30 cm",height:"15–40 cm",sourceNote:"je nach Kopf-/Pflücksalat"},
    "Ananaskirsche": {germinationMinDays:7,germinationMaxDays:21,plantingDepth:"0,5–1 cm",harvestMinDays:120,harvestMaxDays:180,plantingTime:"Februar–April vorziehen, ab Mitte Mai raus",harvestSeasonStart:"August",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"September",spacing:"50–80 cm",height:"50–100 cm",sourceNote:"warm und sonnig"},
    "Andenbeere": {germinationMinDays:7,germinationMaxDays:21,plantingDepth:"0,5–1 cm",harvestMinDays:120,harvestMaxDays:180,plantingTime:"Februar–April vorziehen, ab Mitte Mai raus",harvestSeasonStart:"August",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"September",spacing:"80–100 cm",height:"100–200 cm",sourceNote:"Physalis, viel Platz"},
    "Wassermelone": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"1–2 cm",harvestMinDays:90,harvestMaxDays:120,plantingTime:"warm vorziehen, ab Mitte Mai raus",harvestSeasonStart:"August",harvestSeasonEnd:"September",bloomStart:"Juni",bloomEnd:"August",spacing:"80–120 cm",height:"rankend",sourceNote:"sehr wärmebedürftig"},
    "Chili": {germinationMinDays:10,germinationMaxDays:28,plantingDepth:"0,5–1 cm",harvestMinDays:140,harvestMaxDays:220,plantingTime:"Januar–März vorziehen, ab Mitte Mai raus",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Mai",bloomEnd:"September",spacing:"40–60 cm",height:"30–120 cm",sourceNote:"sortenabhängig"},
    "Paprika": {germinationMinDays:10,germinationMaxDays:28,plantingDepth:"0,5–1 cm",harvestMinDays:140,harvestMaxDays:220,plantingTime:"Februar/März vorziehen, ab Mitte Mai raus",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Mai",bloomEnd:"September",spacing:"40–60 cm",height:"40–100 cm",sourceNote:"wärmeliebend"},
    "Zwiebel/Schlotten": {germinationMinDays:10,germinationMaxDays:21,plantingDepth:"1–2 cm",harvestMinDays:90,harvestMaxDays:150,plantingTime:"Frühjahr",harvestSeasonStart:"Juli",harvestSeasonEnd:"September",bloomStart:"2. Jahr",bloomEnd:"2. Jahr",spacing:"5–10 cm, Reihen 20–30 cm",height:"30–80 cm",sourceNote:"Steckzwiebeln schneller"},
    "Lauch": {germinationMinDays:10,germinationMaxDays:20,plantingDepth:"0,5–1 cm",harvestMinDays:120,harvestMaxDays:180,plantingTime:"Februar–April vorziehen",harvestSeasonStart:"August",harvestSeasonEnd:"März",bloomStart:"2. Jahr",bloomEnd:"2. Jahr",spacing:"10–15 cm, Reihen 30 cm",height:"40–80 cm",sourceNote:"Winterlauch möglich"},
    "Kürbis": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"2–3 cm",harvestMinDays:90,harvestMaxDays:130,plantingTime:"April vorziehen, ab Mitte Mai raus",harvestSeasonStart:"September",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"August",spacing:"100–150 cm",height:"rankend",sourceNote:"viel Platz"},
    "Zuckererbse": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"3–5 cm",harvestMinDays:60,harvestMaxDays:90,plantingTime:"März–Mai",harvestSeasonStart:"Juni",harvestSeasonEnd:"August",bloomStart:"Mai",bloomEnd:"Juli",spacing:"5–10 cm, Reihen 30–40 cm",height:"60–200 cm",sourceNote:"Rankhilfe je nach Sorte"},
    "Spinat": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"2 cm",harvestMinDays:42,harvestMaxDays:84,plantingTime:"Frühjahr oder Herbst",harvestSeasonStart:"April",harvestSeasonEnd:"November",bloomStart:"",bloomEnd:"",spacing:"10–15 cm, Reihen 20–30 cm",height:"20–40 cm",sourceNote:"schießt bei Hitze"},
    "Radieschen": {germinationMinDays:3,germinationMaxDays:10,plantingDepth:"0,5–1 cm",harvestMinDays:21,harvestMaxDays:56,plantingTime:"März–September Direktsaat",harvestSeasonStart:"April",harvestSeasonEnd:"Oktober",bloomStart:"",bloomEnd:"",spacing:"3–5 cm, Reihen 10–15 cm",height:"10–20 cm",sourceNote:"schnelle Kultur"},
    "Karotte": {germinationMinDays:14,germinationMaxDays:28,plantingDepth:"1–2 cm",harvestMinDays:90,harvestMaxDays:160,plantingTime:"März–Juli Direktsaat",harvestSeasonStart:"Juni",harvestSeasonEnd:"November",bloomStart:"2. Jahr",bloomEnd:"2. Jahr",spacing:"3–5 cm, Reihen 25–30 cm",height:"20–40 cm Laub",sourceNote:"langsame Keimung"},
    "Sojabohne": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"3–4 cm",harvestMinDays:80,harvestMaxDays:120,plantingTime:"Mai/Juni",harvestSeasonStart:"August",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"August",spacing:"10–15 cm, Reihen 30–50 cm",height:"40–100 cm",sourceNote:"wärmeliebend"},
    "Bohne": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"3–5 cm",harvestMinDays:60,harvestMaxDays:90,plantingTime:"ab Mitte Mai",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"August",spacing:"Busch 10–15 cm, Stange 40–60 cm",height:"40 cm bis 300 cm",sourceNote:"je nach Busch-/Stangenbohne"},
    "Zucchini": {germinationMinDays:7,germinationMaxDays:14,plantingDepth:"2–3 cm",harvestMinDays:50,harvestMaxDays:80,plantingTime:"April vorziehen, ab Mitte Mai raus",harvestSeasonStart:"Juni",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"September",spacing:"80–100 cm",height:"50–100 cm",sourceNote:"viel Platz"},
    "Rosmarin": {germinationMinDays:14,germinationMaxDays:35,plantingDepth:"0,5 cm oder Steckling",harvestMinDays:90,harvestMaxDays:150,plantingTime:"Frühjahr nach Frost oder Topfware frostfrei",harvestSeasonStart:"ganzjährig mild",harvestSeasonEnd:"Herbst",bloomStart:"März",bloomEnd:"Juni",spacing:"40–60 cm",height:"50–150 cm",sourceNote:"mehrjährig, wintergeschützt"},
    "Kartoffel": {germinationMinDays:14,germinationMaxDays:28,plantingDepth:"8–10 cm",harvestMinDays:90,harvestMaxDays:130,plantingTime:"April/Mai legen",harvestSeasonStart:"Juni",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"August",spacing:"30–40 cm, Reihen 60–70 cm",height:"40–100 cm",sourceNote:"Knollen legen"},
    "Erdbeere": {germinationMinDays:14,germinationMaxDays:42,plantingDepth:"Lichtkeimer, kaum bedecken",harvestMinDays:365,harvestMaxDays:730,plantingTime:"Pflanzung Frühjahr/Herbst",harvestSeasonStart:"Mai",harvestSeasonEnd:"Juli",bloomStart:"April",bloomEnd:"Juni",spacing:"25–30 cm, Reihen 40–60 cm",height:"10–30 cm",sourceNote:"gekaufte Pflanzen tragen schneller"},
    "Blaubeere": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, Ballen leicht erhöht",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Frühjahr oder Herbst, Topfware frostfrei",harvestSeasonStart:"Juli",harvestSeasonEnd:"September",bloomStart:"April",bloomEnd:"Mai",spacing:"80–150 cm",height:"100–200 cm",sourceNote:"Moorbeet/sauer"},
    "Himbeere": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, nicht Saat",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Herbst oder Frühjahr",harvestSeasonStart:"Juni",harvestSeasonEnd:"Oktober",bloomStart:"Mai",bloomEnd:"August",spacing:"40–80 cm",height:"120–200 cm",sourceNote:"Sommer-/Herbsthimbeere unterscheiden"},
    "Brombeere": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, nicht Saat",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Herbst oder Frühjahr",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Mai",bloomEnd:"August",spacing:"150–300 cm",height:"150–300 cm",sourceNote:"Rankhilfe sinnvoll"},
    "Apfel": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Baum, Veredlungsstelle über Erde",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Herbst ideal, Topfware auch Frühjahr",harvestSeasonStart:"August",harvestSeasonEnd:"Oktober",bloomStart:"April",bloomEnd:"Mai",spacing:"300–800 cm",height:"200–600 cm",sourceNote:"je nach Unterlage"},
    "Birne": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Baum, Veredlungsstelle über Erde",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Herbst ideal, Topfware auch Frühjahr",harvestSeasonStart:"August",harvestSeasonEnd:"Oktober",bloomStart:"April",bloomEnd:"Mai",spacing:"300–600 cm",height:"300–600 cm",sourceNote:"je nach Unterlage"},
    "Erdbeer-Himbeer": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, nicht Saat",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Frühjahr oder Herbst",harvestSeasonStart:"Juli",harvestSeasonEnd:"September",bloomStart:"Juni",bloomEnd:"August",spacing:"50–80 cm",height:"30–60 cm",sourceNote:"Rubus illecebrosus, mehrjährig"},
    "Knoblauch": {germinationMinDays:14,germinationMaxDays:35,plantingDepth:"5–7 cm",harvestMinDays:240,harvestMaxDays:300,plantingTime:"Herbstpflanzung September–November, alternativ Frühjahr",harvestSeasonStart:"Juni",harvestSeasonEnd:"Juli",bloomStart:"Mai",bloomEnd:"Juni",spacing:"10–15 cm, Reihen 20–30 cm",height:"40–90 cm",sourceNote:"Zehen im Herbst stecken, Ernte wenn Laub gelb wird"}
  };
}

let masterData = loadMasterData();

function forceMasterV14(){
  masterData["Ananaskirsche"] = {germinationMinDays:7,germinationMaxDays:21,plantingDepth:"0,5–1 cm",harvestMinDays:90,harvestMaxDays:140,plantingTime:"Vorziehen Februar–April, nach Eisheiligen raus",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"September",spacing:"60–90 cm",height:"30–60 cm",sourceNote:"Physalis pruinosa; gekaufte Pflanze ca. 15 cm als eigener Eintrag"};
  masterData["Erdbeer-Himbeer"] = {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, nicht Saat",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Frühjahr oder Herbst",harvestSeasonStart:"August",harvestSeasonEnd:"September",bloomStart:"Juni",bloomEnd:"Juli",spacing:"60 cm, Reihen bis 300 cm",height:"30–60 cm",sourceNote:"Rubus illecebrosus, mehrjährig; kann sich ausbreiten"};
  masterData["Blaubeere"] = {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, Ballen leicht erhöht, saure Erde",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Frühjahr oder Herbst, Topfware frostfrei",harvestSeasonStart:"Juli",harvestSeasonEnd:"September",bloomStart:"April",bloomEnd:"Mai",spacing:"80–150 cm",height:"je nach Sorte 60–200 cm",sourceNote:"BerryBux kompakt, Bluecrop deutlich größer, Brigitta mittel bis hoch"};
  masterData["Knoblauch"] = {germinationMinDays:14,germinationMaxDays:35,plantingDepth:"5–7 cm",harvestMinDays:240,harvestMaxDays:300,plantingTime:"Herbstpflanzung September–November, alternativ Frühjahr",harvestSeasonStart:"Juni",harvestSeasonEnd:"Juli",bloomStart:"Mai",bloomEnd:"Juni",spacing:"10–15 cm, Reihen 20–30 cm",height:"40–90 cm",sourceNote:"Zehen im Herbst stecken; Ernte, wenn das Laub gelb wird"};
  saveMasterData();
}
forceMasterV14();


function patchMasterDataV13(){
  const updates = {
    "Ananaskirsche": {germinationMinDays:7,germinationMaxDays:21,plantingDepth:"0,5–1 cm",harvestMinDays:90,harvestMaxDays:140,plantingTime:"Vorziehen Februar–April, nach Eisheiligen raus",harvestSeasonStart:"Juli",harvestSeasonEnd:"Oktober",bloomStart:"Juni",bloomEnd:"September",spacing:"60–90 cm",height:"30–60 cm",sourceNote:"Physalis pruinosa; gekaufte Pflanze ca. 15 cm als eigene Sorte/Eintrag"},
    "Erdbeer-Himbeer": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, nicht Saat",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Frühjahr oder Herbst",harvestSeasonStart:"August",harvestSeasonEnd:"September",bloomStart:"Juni",bloomEnd:"Juli",spacing:"60 cm, Reihen bis 300 cm",height:"30–60 cm",sourceNote:"Rubus illecebrosus, mehrjährig; kann sich ausbreiten"},
    "Blaubeere": {germinationMinDays:0,germinationMaxDays:0,plantingDepth:"Pflanze, Ballen leicht erhöht, saure Erde",harvestMinDays:0,harvestMaxDays:0,plantingTime:"Frühjahr oder Herbst, Topfware frostfrei",harvestSeasonStart:"Juli",harvestSeasonEnd:"September",bloomStart:"April",bloomEnd:"Mai",spacing:"80–150 cm",height:"je nach Sorte 60–200 cm",sourceNote:"Sorten unterscheiden sich stark: BerryBux ca. 60 cm, Bluecrop bis ca. 2 m, Brigitta ca. 120–140 cm"},
    "Knoblauch": {germinationMinDays:14,germinationMaxDays:35,plantingDepth:"5–7 cm",harvestMinDays:240,harvestMaxDays:300,plantingTime:"Herbstpflanzung September–November, alternativ Frühjahr",harvestSeasonStart:"Juni",harvestSeasonEnd:"Juli",bloomStart:"Mai",bloomEnd:"Juni",spacing:"10–15 cm, Reihen 20–30 cm",height:"40–90 cm",sourceNote:"Zehen im Herbst stecken; Ernte, wenn das Laub gelb wird"}
  };
  masterData = {...masterData, ...updates};
  saveMasterData();
}
patchMasterDataV13();

function applyVarietySpecificMaster(entry){
  const n=(entry.variety||"").toLowerCase();
  if(entry.category==="Blaubeere"){
    if(n.includes("berrybux") || n.includes("angustifolium")){entry.height="30–60 cm";entry.spacing="60 cm";entry.harvestSeasonStart="Juli";entry.harvestSeasonEnd="August";entry.bloomStart="Mai";entry.bloomEnd="Mai";entry.sourceNote="BerryBux/Vaccinium angustifolium: kompakt, deutlich kleiner als Bluecrop";}
    else if(n.includes("bluecorp") || n.includes("bluecrop")){entry.height="150–200 cm";entry.spacing="120–150 cm";entry.harvestSeasonStart="Juli";entry.harvestSeasonEnd="August";entry.bloomStart="April";entry.bloomEnd="Mai";entry.sourceNote="Bluecrop: hoher Kulturheidelbeer-Strauch";}
    else if(n.includes("brigitta")){entry.height="120–180 cm";entry.spacing="100–150 cm";entry.harvestSeasonStart="August";entry.harvestSeasonEnd="September";entry.bloomStart="April";entry.bloomEnd="Mai";entry.sourceNote="Brigitta Blue: spätere, höhere Sorte";}
    else if(n.includes("hortblue")){entry.height="80–130 cm";entry.spacing="60–100 cm";entry.harvestSeasonStart="Juli";entry.harvestSeasonEnd="September";entry.bloomStart="April";entry.bloomEnd="Mai";entry.sourceNote="Hortblue Petite: kompaktere Sorte";}
  }
  if(n.includes("ananaskirsche gekauft")){entry.category="Ananaskirsche";entry.isBought=true;entry.purchaseSize=entry.purchaseSize||"ca. 15 cm beim Kauf";entry.sourceNote="Gekaufte Ananaskirsche ca. 15 cm";}
  return entry;
}


function loadMasterData(){
  const raw = localStorage.getItem(MASTER_DATA_KEY);
  const defaults = defaultMasterData();
  if(!raw) return defaults;
  try {
    return {...defaults, ...JSON.parse(raw)};
  } catch {
    return defaults;
  }
}

function saveMasterData(){
  localStorage.setItem(MASTER_DATA_KEY, JSON.stringify(masterData));
}

function getMaster(category){
  return masterData[category] || {};
}

function applyMasterToEntry(entry){
  const m = getMaster(entry.category);
  for(const key of ["germinationMinDays","germinationMaxDays","plantingDepth","harvestMinDays","harvestMaxDays","plantingTime","bloomStart","bloomEnd","harvestSeasonStart","harvestSeasonEnd","spacing","height","sourceNote"]){
    if(m[key] !== undefined) entry[key] = m[key];
  }
  return entry;
}

function applyMasterToAllEntries(category){
  entries = entries.map(e => e.category === category ? new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry({...e}))) : e);
  saveEntries();
}


class HarvestEntry {
  constructor({date="", fromDate="", toDate="", estimated=false, amount, unit="Stück", note=""}) {
    this.id = crypto.randomUUID();
    this.date = date || "";
    this.fromDate = fromDate || "";
    this.toDate = toDate || "";
    this.estimated = Boolean(estimated);
    this.amount = Number(amount || 0);
    this.unit = unit;
    this.note = note;
  }

  get displayDate() {
    if (this.fromDate && this.toDate) return `${formatDate(parseLocalDate(this.fromDate))} – ${formatDate(parseLocalDate(this.toDate))}`;
    if (this.fromDate) return `ab ${formatDate(parseLocalDate(this.fromDate))}`;
    if (this.toDate) return `bis ${formatDate(parseLocalDate(this.toDate))}`;
    if (this.date) return formatDate(parseLocalDate(this.date));
    return "ohne Datum";
  }

  get exportFromDate() {
    return this.fromDate || this.date || "";
  }

  get exportToDate() {
    return this.toDate || this.date || "";
  }
}

class GardenEntry {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.category = data.category || guessCategory(data.name || data.variety || "");
    this.variety = data.variety || data.name || "Unbenannt";
    this.locations = data.locations || [];
    this.sownCount = Number(data.sownCount || 0);
    this.aliveCount = Number(data.aliveCount || 0);
    this.sowingDate = data.sowingDate || "";
    this.sowingEstimated = Boolean(data.sowingEstimated);
    this.isBought = Boolean(data.isBought);
    this.purchaseDate = data.purchaseDate || "";
    this.purchaseSize = data.purchaseSize || "";
    this.bloomStart = data.bloomStart || "";
    this.bloomEnd = data.bloomEnd || "";
    this.harvestSeasonStart = data.harvestSeasonStart || "";
    this.harvestSeasonEnd = data.harvestSeasonEnd || "";
    this.spacing = data.spacing || "";
    this.height = data.height || "";
    this.sourceNote = data.sourceNote || "";
    this.doneEvents = data.doneEvents || {};
    this.plantingTime = data.plantingTime || "";
    this.germinationMinDays = Number(data.germinationMinDays || 0);
    this.germinationMaxDays = Number(data.germinationMaxDays || 0);
    this.plantingDepth = data.plantingDepth || "";
    this.harvestMinDays = Number(data.harvestMinDays || 0);
    this.harvestMaxDays = Number(data.harvestMaxDays || 0);
    this.yieldMin = Number(data.yieldMin || 0);
    this.yieldMed = Number(data.yieldMed || 0);
    this.yieldMax = Number(data.yieldMax || 0);
    this.literNow = data.literNow === "" || data.literNow == null ? "" : Number(data.literNow);
    this.literLater = data.literLater === "" || data.literLater == null ? "" : Number(data.literLater);
    this.notes = data.notes || "";
    this.seasonDone = Boolean(data.seasonDone);
    this.seasonDoneDate = data.seasonDoneDate || "";
    this.seasonDoneReason = data.seasonDoneReason || "";
    this.harvests = data.harvests || [];
  }
  get survivalRate(){ return this.sownCount ? Math.round(this.aliveCount/this.sownCount*100) : null; }
  get expectedMin(){ return this.aliveCount*this.yieldMin; }
  get expectedMed(){ return this.aliveCount*this.yieldMed; }
  get expectedMax(){ return this.aliveCount*this.yieldMax; }
  get actualHarvestTotal(){ return this.harvests.reduce((s,h)=>s+Number(h.amount||0),0); }
  get activeExpectedMed(){ return this.seasonDone ? 0 : this.expectedMed; }
  get activeOpenHarvest(){ return this.seasonDone ? 0 : Math.max(0, this.expectedMed-this.actualHarvestTotal); }
  get openHarvest(){ return this.activeOpenHarvest; }
  get percentReached(){ return this.expectedMed ? Math.round((this.actualHarvestTotal / this.expectedMed) * 100) : 0; }
  get lastHarvest(){
    if(!this.harvests.length) return null;
    return this.harvests.slice().sort((a,b)=>harvestSortDate(b)-harvestSortDate(a))[0];
  }
  get harvestPeriod(){
    if(!this.harvests.length) return "";
    const starts=this.harvests.map(h=>parseLocalDate(h.fromDate||h.date||h.toDate)).filter(Boolean).sort((a,b)=>a-b);
    const ends=this.harvests.map(h=>parseLocalDate(h.toDate||h.date||h.fromDate)).filter(Boolean).sort((a,b)=>a-b);
    if(!starts.length || !ends.length) return "";
    return `${formatDate(starts[0])} – ${formatDate(ends[ends.length-1])}`;
  }
}

let entries = loadEntries().map(e => new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry(normalizeEntryCategory(e)))));
ensureDefaultGarlicEntry();
ensureBoughtGroundCherryEntry();

function normalizeEntryCategory(e){
  const guessed = guessCategory(e.variety || e.name || e.category || "");
  if(e.category === "Sojabohne") e.category = "Bohne";
  if(guessed === "Erdbeer-Himbeer" || guessed === "Knoblauch") e.category = guessed;
  return e;
}

function ensureDefaultGarlicEntry(){
  if(entries.some(e => e.category === "Knoblauch")) return;
  entries.push(new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry({
    category:"Knoblauch",
    variety:"Knoblauch Herbstpflanzung",
    locations:["Hochbeet","Boden"],
    sownCount:12,
    aliveCount:12,
    sowingEstimated:true,
    yieldMin:1,
    yieldMed:1,
    yieldMax:1,
    harvests:[],
    doneEvents:{}
  }))));
}

function ensureBoughtGroundCherryEntry(){
  if(entries.some(e => (e.variety || "").toLowerCase().includes("ananaskirsche gekauft"))) return;
  entries.push(new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry({
    category:"Ananaskirsche",
    variety:"Ananaskirsche gekauft",
    locations:["Hochbeet","Topf"],
    sownCount:1,
    aliveCount:1,
    isBought:true,
    purchaseSize:"ca. 15 cm beim Kauf",
    yieldMin:30,
    yieldMed:80,
    yieldMax:150,
    harvests:[],
    doneEvents:{}
  }))));
}
let selectedCategory = "";
let selectedEntryId = "";
let showAllCalendar = false;

function loadEntries(){
  const rawYear = localStorage.getItem(yearStorageKey());
  if(rawYear) return JSON.parse(rawYear);

  if(currentYear === "2026"){
    const old =
      localStorage.getItem("gartentagebuch.v26.2026") ||
      localStorage.getItem("gartentagebuch.v25.2026") ||
      localStorage.getItem("gartentagebuch.v24.2026") ||
      localStorage.getItem("gartentagebuch.v23.2026") ||
      localStorage.getItem("gartentagebuch.v22.2026") ||
      localStorage.getItem("gartentagebuch.v21.2026") ||
      localStorage.getItem("gartentagebuch.v20.2026") ||
      localStorage.getItem("gartentagebuch.v19.2026") ||
      localStorage.getItem("gartentagebuch.v18.2026") ||
      localStorage.getItem("gartentagebuch.v17.2026") ||
      localStorage.getItem("gartentagebuch.v26") ||
      localStorage.getItem("gartentagebuch.v25") ||
      localStorage.getItem("gartentagebuch.v24") ||
      localStorage.getItem("gartentagebuch.v23") ||
      localStorage.getItem("gartentagebuch.v22") ||
      localStorage.getItem("gartentagebuch.v21") ||
      localStorage.getItem("gartentagebuch.v20") ||
      localStorage.getItem("gartentagebuch.v19") ||
      localStorage.getItem("gartentagebuch.v18") ||
      localStorage.getItem("gartentagebuch.v17") ||
      localStorage.getItem("gartentagebuch.v16") ||
      localStorage.getItem("gartentagebuch.v15") ||
      localStorage.getItem("gartentagebuch.v14");
    if(old){
      localStorage.setItem(yearStorageKey("2026"), old);
      saveYearList([...getYearList(), "2026"]);
      return JSON.parse(old);
    }
  }

  return parseSeedCsv();
}

function saveEntries(){
  localStorage.setItem(yearStorageKey(), JSON.stringify(entries));
  render();
}

function parseSeedCsv(){
  const raw = $("seed-data").textContent.trim();
  return raw.split(/\n/).filter(Boolean).map(line => {
    const cells = line.split(";").map(x => x.trim());
    const [name, loc, sown, alive, yMin, yMed, yMax, actual, mai, juni, juli, aug, sep, okt, literNow, literLater] = cells;
    const category = guessCategory(name);
    const defaults = timingDefaults(category, name);
    const harvests = [];
    const monthMap = [
      ["2026-05-01", "2026-05-31", mai],
      ["2026-06-01", "2026-06-30", juni],
      ["2026-07-01", "2026-07-31", juli],
      ["2026-08-01", "2026-08-31", aug],
      ["2026-09-01", "2026-09-30", sep],
      ["2026-10-01", "2026-10-31", okt],
    ];
    for(const [fromDate, toDate, amount] of monthMap){
      if(amount && !isNaN(Number(amount))) harvests.push(new HarvestEntry({fromDate, toDate, estimated:true, amount:Number(amount), unit:"Stück", note:"Monat aus Starttabelle"}));
    }
    // if actual exists but no month detail, keep as estimated total
    if(Number(actual || 0) > 0 && harvests.length === 0){
      harvests.push(new HarvestEntry({fromDate:"2026-06-01", toDate:"2026-06-30", estimated:true, amount:Number(actual), unit:"Stück", note:"tatsächliche Ernte aus Starttabelle, Datum unbekannt"}));
    }

    return new GardenEntry({
      category,
      variety: name,
      locations: loc ? loc.split("|") : [],
      sownCount: cleanNumber(sown),
      aliveCount: cleanNumber(alive),
      yieldMin: cleanNumber(yMin),
      yieldMed: cleanNumber(yMed),
      yieldMax: cleanNumber(yMax),
      literNow: literNow || "",
      literLater: literLater || "",
      harvests,
      isBought: /gekauft|baum|blaubeere|himbeere|brombeere|erdbeer-himbeer/i.test(name),
      ...defaults
    });
  });
}

function cleanNumber(v){
  if(v == null || v === "" || v === "#DIV/0!") return 0;
  return Number(String(v).replace(",", ".")) || 0;
}

function guessCategory(name){
  const n = name.toLowerCase();
  if(n.includes("erdbeer-himbeer") || n.includes("rubus illecebrosus")) return "Erdbeer-Himbeer";
  if(n.includes("knoblauch")) return "Knoblauch";
  if(n.includes("tomate") || n.includes("tomaten")) return "Tomate";
  if(n.includes("kohlrabi")) return "Kohlrabi";
  if(n.includes("salatgurke") || n.includes("snackgurke") || n.includes("brotzeitgurke") || n === "gurke gekauft" || n.includes("gurke direkt")) return "Gurke";
  if(n.includes("mais")) return "Mais";
  if(n.includes("basilikum")) return "Basilikum";
  if(n.includes("petersilie")) return "Petersilie";
  if(n.includes("schnittlauch")) return "Schnittlauch";
  if(n.includes("salat")) return "Salat";
  if(n.includes("ananaskirsche")) return "Ananaskirsche";
  if(n.includes("andenbeere")) return "Andenbeere";
  if(n.includes("wassermelone")) return "Wassermelone";
  if(n.includes("chili")) return "Chili";
  if(n.includes("paprika")) return "Paprika";
  if(n.includes("zwiebel") || n.includes("schlotten")) return "Zwiebel/Schlotten";
  if(n.includes("lauch")) return "Lauch";
  if(n.includes("kürbis") || n.includes("hokkaido") || n.includes("butternut")) return "Kürbis";
  if(n.includes("zuckererbse")) return "Zuckererbse";
  if(n.includes("spinat")) return "Spinat";
  if(n.includes("radieschen")) return "Radieschen";
  if(n.includes("karotten")) return "Karotte";
  if(n.includes("sojabohne")) return "Bohne";
  if(n.includes("bohnen")) return "Bohne";
  if(n.includes("zucchini")) return "Zucchini";
  if(n.includes("rosmarin")) return "Rosmarin";
  if(n.includes("kartoffel")) return "Kartoffel";
  if(n.includes("erdbeere") || n.includes("walderdbeere")) return "Erdbeere";
  if(n.includes("blaubeere")) return "Blaubeere";
  if(n.includes("himbeere")) return "Himbeere";
  if(n.includes("brombeere")) return "Brombeere";
  if(n.includes("apfel")) return "Apfel";
  if(n.includes("birnen")) return "Birne";
  return "Sonstiges";
}

function timingDefaults(category, name){
  const m = defaultMasterData()[category] || {};
  return {
    germinationMinDays:m.germinationMinDays || 0,
    germinationMaxDays:m.germinationMaxDays || 0,
    plantingDepth:m.plantingDepth || "",
    harvestMinDays:m.harvestMinDays || 0,
    harvestMaxDays:m.harvestMaxDays || 0,
    plantingTime:m.plantingTime || "",
    bloomStart:m.bloomStart || "",
    bloomEnd:m.bloomEnd || "",
    harvestSeasonStart:m.harvestSeasonStart || "",
    harvestSeasonEnd:m.harvestSeasonEnd || "",
    spacing:m.spacing || "",
    height:m.height || "",
    sourceNote:m.sourceNote || ""
  };
}

function categories(){ return [...new Set(entries.map(e=>e.category))].sort((a,b)=>a.localeCompare(b,"de")); }



function isWoodyOrPerennialPurchase(entry){
  const cat = entry.category;
  return ["Blaubeere","Himbeere","Brombeere","Erdbeer-Himbeer","Apfel","Birne","Erdbeere"].includes(cat);
}

function boughtPlantDefaults(entry){
  if(!entry.isBought || isWoodyOrPerennialPurchase(entry)) return entry;
  const cat = entry.category;
  const defaults = {
    "Tomate": {purchaseSize:"gekaufte Jungpflanze ca. 40–100 cm, meist kurz vor/bei Blüte", harvestMinDays:35, harvestMaxDays:90, bloomStart:"Mai", bloomEnd:"Juli"},
    "Paprika": {purchaseSize:"gekaufte Jungpflanze ca. 20–50 cm, oft kurz vor Blüte", harvestMinDays:50, harvestMaxDays:110, bloomStart:"Mai", bloomEnd:"August"},
    "Chili": {purchaseSize:"gekaufte Jungpflanze ca. 20–50 cm, oft kurz vor Blüte", harvestMinDays:50, harvestMaxDays:120, bloomStart:"Mai", bloomEnd:"September"},
    "Gurke": {purchaseSize:"gekaufte Jungpflanze ca. 15–40 cm, schnell blüh-/erntereif", harvestMinDays:25, harvestMaxDays:60, bloomStart:"Mai", bloomEnd:"August"},
    "Zucchini": {purchaseSize:"gekaufte Jungpflanze ca. 20–40 cm, schnell blüh-/erntereif", harvestMinDays:25, harvestMaxDays:60, bloomStart:"Mai", bloomEnd:"September"},
    "Kohlrabi": {purchaseSize:"gekaufte Jungpflanze ca. 10–20 cm", harvestMinDays:25, harvestMaxDays:50, bloomStart:"", bloomEnd:""},
    "Salat": {purchaseSize:"gekaufte Jungpflanze ca. 8–15 cm", harvestMinDays:20, harvestMaxDays:45, bloomStart:"", bloomEnd:""},
    "Rosmarin": {purchaseSize:"gekaufte Topfpflanze, Größe je nach Topf", harvestMinDays:0, harvestMaxDays:0, bloomStart:"März", bloomEnd:"Juni"},
    "Ananaskirsche": {purchaseSize:"gekaufte Jungpflanze ca. 15 cm", harvestMinDays:60, harvestMaxDays:110, bloomStart:"Juni", bloomEnd:"September"}
  };
  const d = defaults[cat];
  if(!d) return entry;
  entry.purchaseSize = entry.purchaseSize || d.purchaseSize;
  // Kaufdatum nicht automatisch wieder setzen, wenn du es bewusst gelöscht hast.
  // Leer bleibt leer; nur Größe/Entwicklungsstand wird ergänzt.
  entry.harvestMinDays = d.harvestMinDays;
  entry.harvestMaxDays = d.harvestMaxDays;
  entry.bloomStart = d.bloomStart;
  entry.bloomEnd = d.bloomEnd;
  entry.sourceNote = `${entry.sourceNote || ""} Gekauft: Entwicklungsstand als Jungpflanze berücksichtigt.`.trim();
  return entry;
}

function applyBoughtDefaultsToAll(){
  entries = entries.map(e => new GardenEntry(boughtPlantDefaults(e)));
  localStorage.setItem(yearStorageKey(), JSON.stringify(entries));
}

function forceV14DataFixes(){
  // vorhandene lokale Daten korrigieren, nicht nur neue Startdaten
  entries = entries.map(raw => {
    let e = new GardenEntry(raw);
    if((e.variety || "").toLowerCase().includes("erdbeer-himbeer") || (e.variety || "").toLowerCase().includes("rubus illecebrosus")){
      e.category = "Erdbeer-Himbeer";
    }
    if((e.variety || "").toLowerCase().includes("knoblauch")){
      e.category = "Knoblauch";
    }
    e = new GardenEntry(boughtPlantDefaults(applyVarietySpecificMaster(applyMasterToEntry(e))));
    return e;
  });

  if(!entries.some(e => (e.variety || "").toLowerCase().includes("ananaskirsche gekauft"))){
    entries.push(new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry({
      category:"Ananaskirsche",
      variety:"Ananaskirsche gekauft",
      locations:["Hochbeet","Topf"],
      sownCount:1,
      aliveCount:1,
      isBought:true,
      purchaseSize:"ca. 15 cm beim Kauf",
      yieldMin:30,
      yieldMed:80,
      yieldMax:150,
      harvests:[],
      doneEvents:{}
    }))));
  }

  if(!entries.some(e => e.category === "Knoblauch")){
    entries.push(new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry({
      category:"Knoblauch",
      variety:"Knoblauch Herbstpflanzung",
      locations:["Hochbeet","Boden"],
      sownCount:12,
      aliveCount:12,
      sowingEstimated:true,
      yieldMin:1,
      yieldMed:1,
      yieldMax:1,
      harvests:[],
      doneEvents:{}
    }))));
  }
}
forceV14DataFixes();
applyBoughtDefaultsToAll();
localStorage.setItem(yearStorageKey(), JSON.stringify(entries));

function filteredEntries(){
  const q = $("searchInput").value.trim().toLowerCase();
  const filter = $("categoryFilter").value;
  return entries.filter(e=>{
    const hay = `${e.category} ${e.variety} ${e.locations.join(" ")} ${e.notes}`.toLowerCase();
    return (!filter || e.category===filter) && (!selectedCategory || e.category===selectedCategory) && (!q || hay.includes(q));
  });
}

function render(){
  renderStats(); renderCalendar(); renderCategoryFilter();
  if(selectedEntryId) renderDetail(selectedEntryId);
  else if(selectedCategory) renderCategoryDetail(selectedCategory);
  else renderHome();
}

function renderStats(){
  if($("statPlants")) $("statPlants").textContent = entries.length;
  $("statAlive").textContent = entries.reduce((s,e)=>s+e.aliveCount,0);
  const totalHarvest = entries.reduce((s,e)=>s+e.actualHarvestTotal,0);
  const totalExpected = entries.reduce((s,e)=>s+(e.seasonDone ? 0 : e.expectedMed),0);
  $("statHarvest").textContent = Math.round(totalHarvest);
  $("statOpen").textContent = Math.round(entries.reduce((s,e)=>s+e.activeOpenHarvest,0));
  $("statPercent").textContent = totalExpected ? `${Math.round(totalHarvest / totalExpected * 100)}%` : "0%";
}

function renderCalendar(){
  const rangeDays=Number($("calendarRange").value||30);
  const today=startOfDay(new Date());
  const limit=addDays(today,rangeDays);
  const typeFilter=$("calendarTypeFilter") ? $("calendarTypeFilter").value : "";
  const doneFilter=$("calendarDoneFilter") ? $("calendarDoneFilter").value : "";

  const allEvents=buildCalendarEvents();
  const openCount=allEvents.filter(e=>!e.done).length;
  const doneCount=allEvents.filter(e=>e.done).length;
  const germCount=allEvents.filter(e=>e.type.toLowerCase().includes("keim")).length;
  const bloomCount=allEvents.filter(e=>e.type.toLowerCase().includes("blüte")).length;
  const harvestCount=allEvents.filter(e=>e.type.toLowerCase().includes("ernte")).length;
  const plantableCount=allEvents.filter(e=>e.type.toLowerCase().includes("pflanzbar")).length;

  const events=allEvents
    // offene überfällige Termine anzeigen; erledigte nur im gewählten Zeitraum
    .filter(e=>(!e.done && e.date<=limit) || (e.done && e.date>=today && e.date<=limit))
    .filter(e=>!typeFilter || e.type.toLowerCase().includes(typeFilter.toLowerCase()))
    .filter(e=>!doneFilter || (doneFilter==="done" ? e.done : !e.done))
    .sort((a,b)=>{
      const aOverdue=!a.done && a.date<today;
      const bOverdue=!b.done && b.date<today;
      if(aOverdue!==bOverdue) return aOverdue ? -1 : 1;
      return a.date-b.date;
    });

  const visibleEvents=showAllCalendar ? events : events.slice(0,5);

  $("calendarTimeline").innerHTML=`
    <div class="calendar-summary">
      <div><strong>${openCount}</strong> offene Termine</div>
      <div><strong>${doneCount}</strong> erledigte Termine</div>
      <div><strong>${allEvents.length}</strong> insgesamt</div>
      <div class="calendar-breakdown">🌱 Keimung: ${germCount} · 🌸 Blüte: ${bloomCount} · 🥕 Ernte: ${harvestCount} · 📅 Pflanzbar: ${plantableCount}</div>
      ${events.length>5 && !showAllCalendar ? `<div class="meta">Es werden 5 von ${events.length} gefilterten Terminen angezeigt.</div>` : ""}
    </div>
  ` + (visibleEvents.length ? visibleEvents.map(e=>{
    const overdue=!e.done && e.date<today;
    return `
      <div class="timeline-item ${e.done ? "done-event" : ""} ${overdue ? "overdue-event" : ""}">
        <div class="timeline-date">${formatDate(e.date)}${overdue ? `<div class="overdue-label">überfällig</div>` : ""}</div>
        <div>
          <div class="timeline-title">${escapeHtml(e.title)}</div>
          <div class="meta">${escapeHtml(e.subtitle)}</div>
          <span class="timeline-type">${escapeHtml(e.type)}</span>
          <label class="event-check"><input type="checkbox" data-event-done="${e.entryId}|${e.key}" ${e.done ? "checked" : ""}/> erledigt / passiert</label>
        </div>
      </div>`;
  }).join("") : `<p class="meta">Keine Termine für die aktuellen Filter vorhanden.</p>`);

  if($("showAllCalendarBtn")){
    $("showAllCalendarBtn").classList.toggle("hidden",events.length<=5);
    $("showAllCalendarBtn").textContent=showAllCalendar ? "Nur 5 anzeigen" : `Alle ${events.length} anzeigen`;
  }

  document.querySelectorAll("[data-event-done]").forEach(cb=>{
    cb.onchange=()=>{
      const [entryId,key]=cb.dataset.eventDone.split("|");
      if(cb.checked && key.startsWith("germ")){
        cb.checked=false;
        openGerminationDialog(entryId,key);
      } else {
        toggleEventDone(entryId,key,cb.checked);
      }
    };
  });
}

function buildCalendarEvents(){
  const events=[];
  const plantingWindowSeen=new Set();

  for(const e of entries){
    const alive=Number(e.aliveCount||0);

    // "Noch pflanzbar" bleibt auch bei 0 lebend oder Saison fertig sichtbar.
    const plantUntil=plantingEndDateFromText(e.plantingTime);
    if(plantUntil && !plantingWindowSeen.has(e.category)){
      plantingWindowSeen.add(e.category);
      events.push(makeEvent(
        e,
        "plantingWindow",
        plantUntil,
        "Noch pflanzbar",
        `${e.category}: noch pflanzbar bis ${formatDate(plantUntil)}`,
        e.plantingTime || "Pflanzzeit"
      ));
    }

    // Für tote oder abgeschlossene Pflanzen keine weiteren Entwicklungs-/Erntetermine.
    if(alive<=0 || e.seasonDone) continue;

    // Basisdatum: echte Aussaat/Kauf; sonst Standard aus Pflanzzeit.
    let baseDate=null;
    if(e.isBought){
      baseDate=parseLocalDate(e.purchaseDate) || defaultDateFromPlantingTime(e.plantingTime);
    } else {
      baseDate=parseLocalDate(e.sowingDate) || defaultDateFromPlantingTime(e.plantingTime);
    }

    // Kauf-/Aussaatereignis wird intern weiter erzeugt, aber im Filter nicht extra angeboten.
    if(baseDate){
      events.push(makeEvent(
        e,
        "base",
        baseDate,
        e.isBought ? "Kauf/Pflanzung" : (e.sowingEstimated ? "Aussaat ca." : "Aussaat"),
        e.variety,
        `${e.category} · ${e.sownCount} ${e.isBought ? "gekauft/gepflanzt" : "gesät/gepflanzt"}`
      ));
    }

    // Keimung: nur bei nicht gekauften Pflanzen und vorhandenen Keimdaten.
    if(!e.isBought && baseDate){
      if(Number(e.germinationMinDays||0)>0){
        events.push(makeEvent(
          e,
          "germMin",
          addDays(baseDate,Number(e.germinationMinDays)),
          "Keimung frühestens",
          `${e.variety}: Keimung frühestens`,
          `nach ${e.germinationMinDays} Tagen`
        ));
      }
      if(Number(e.germinationMaxDays||0)>0 && Number(e.germinationMaxDays)!==Number(e.germinationMinDays)){
        events.push(makeEvent(
          e,
          "germMax",
          addDays(baseDate,Number(e.germinationMaxDays)),
          "Keimung spätestens",
          `${e.variety}: Keimung spätestens`,
          `nach ${e.germinationMaxDays} Tagen`
        ));
      }
    }

    // Blüte aus saisonalen Stammdaten.
    const bloomStartDate=monthNameToDate(e.bloomStart);
    const bloomEndDate=monthNameToDate(e.bloomEnd);
    if(bloomStartDate){
      events.push(makeEvent(
        e,
        "bloomStart",
        bloomStartDate,
        "Blüte frühestens",
        `${e.variety}: Blüte frühestens`,
        `${e.bloomStart}${e.bloomEnd ? " bis "+e.bloomEnd : ""}`
      ));
    }
    if(bloomEndDate && (!bloomStartDate || bloomEndDate.getTime()!==bloomStartDate.getTime())){
      events.push(makeEvent(
        e,
        "bloomEnd",
        bloomEndDate,
        "Blüte spätestens",
        `${e.variety}: Blüte spätestens`,
        `${e.bloomStart ? e.bloomStart+" bis " : ""}${e.bloomEnd}`
      ));
    }

    // Ernte bevorzugt relativ zu Aussaat/Kaufdatum.
    let relativeHarvestAdded=false;
    if(baseDate && Number(e.harvestMinDays||0)>0){
      events.push(makeEvent(
        e,
        "harvestMin",
        addDays(baseDate,Number(e.harvestMinDays)),
        "Ernte frühestens",
        `${e.variety}: Ernte frühestens`,
        `mittlerer Ertrag erwartet: ${Math.round(e.expectedMed)}`
      ));
      relativeHarvestAdded=true;
    }
    if(baseDate && Number(e.harvestMaxDays||0)>0 && Number(e.harvestMaxDays)!==Number(e.harvestMinDays)){
      events.push(makeEvent(
        e,
        "harvestMax",
        addDays(baseDate,Number(e.harvestMaxDays)),
        "Ernte spätestens",
        `${e.variety}: Ernte spätestens`,
        `noch offen: ${Math.round(e.activeOpenHarvest)}`
      ));
      relativeHarvestAdded=true;
    }

    // Falls keine relative Ernte berechenbar ist: saisonale Erntezeit aus Stammdaten nutzen.
    if(!relativeHarvestAdded){
      const harvestStartDate=monthNameToDate(e.harvestSeasonStart);
      const harvestEndDate=monthNameToDate(e.harvestSeasonEnd);
      if(harvestStartDate){
        events.push(makeEvent(
          e,
          "harvestSeasonStart",
          harvestStartDate,
          "Ernte frühestens",
          `${e.variety}: Erntezeit beginnt`,
          `${e.harvestSeasonStart}${e.harvestSeasonEnd ? " bis "+e.harvestSeasonEnd : ""}`
        ));
      }
      if(harvestEndDate && (!harvestStartDate || harvestEndDate.getTime()!==harvestStartDate.getTime())){
        events.push(makeEvent(
          e,
          "harvestSeasonEnd",
          harvestEndDate,
          "Ernte spätestens",
          `${e.variety}: Erntezeit endet`,
          `${e.harvestSeasonStart ? e.harvestSeasonStart+" bis " : ""}${e.harvestSeasonEnd}`
        ));
      }
    }
  }

  return events;
}

function defaultDateFromPlantingTime(text){
  if(!text) return null;
  const monthMap={"januar":0,"februar":1,"märz":2,"maerz":2,"april":3,"mai":4,"juni":5,"juli":6,"august":7,"september":8,"oktober":9,"november":10,"dezember":11};
  const lower=String(text).toLowerCase();
  for(const [name, idx] of Object.entries(monthMap)){
    if(lower.includes(name)) return new Date(Number(currentYear), idx, 15);
  }
  return null;
}

function plantingEndDateFromText(text){
  if(!text) return null;
  const monthMap = {"januar":0,"februar":1,"märz":2,"maerz":2,"april":3,"mai":4,"juni":5,"juli":6,"august":7,"september":8,"oktober":9,"november":10,"dezember":11};
  const lower = String(text).toLowerCase();
  let lastIndex = -1;
  for(const [name, idx] of Object.entries(monthMap)){
    if(lower.includes(name)) lastIndex = Math.max(lastIndex, idx);
  }
  if(lastIndex < 0) return null;
  const now = new Date();
  const end = new Date(now.getFullYear(), lastIndex + 1, 0);
  if(end < startOfDay(now)) return null;
  return end;
}

function monthNameToDate(monthName){
  if(!monthName) return null;
  const months = {"januar":0,"februar":1,"märz":2,"maerz":2,"april":3,"mai":4,"juni":5,"juli":6,"august":7,"september":8,"oktober":9,"november":10,"dezember":11};
  const key = String(monthName).trim().toLowerCase();
  if(!(key in months)) return null;
  const year = Number(currentYear);
  return new Date(year, months[key], key === "mai" ? 15 : 1);
}

function makeEvent(entry, key, date, type, title, subtitle){
  return {entryId: entry.id, key, date, type, title, subtitle, done: Boolean(entry.doneEvents?.[key])};
}

function toggleEventDone(entryId, key, done){
  const e = entries.find(x=>x.id===entryId);
  if(!e) return;
  e.doneEvents = e.doneEvents || {};
  if(done) e.doneEvents[key] = true;
  else delete e.doneEvents[key];
  saveEntries();
}

function renderCategoryFilter(){
  const current=$("categoryFilter").value;
  $("categoryFilter").innerHTML = `<option value="">Alle Pflanzenarten</option>` + categories().map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  $("categoryFilter").value=current;
}

function renderHome(){
  $("homeView").classList.remove("hidden"); $("detailView").classList.add("hidden");
  $("categoryGrid").innerHTML = categories().map(cat=>{
    const list=entries.filter(e=>e.category===cat);
    const alive=list.reduce((s,e)=>s+e.aliveCount,0);
    const med=list.reduce((s,e)=>s+e.expectedMed,0);
    const actual=list.reduce((s,e)=>s+e.actualHarvestTotal,0);
    return `<article class="card" data-category="${escapeHtml(cat)}"><h3>${escapeHtml(cat)}</h3><p class="meta">${list.length} Sorten/Einträge · ${alive} lebend</p><div class="badges"><span class="badge">med: ${Math.round(med)}</span><span class="badge">geerntet: ${Math.round(actual)}</span></div></article>`;
  }).join("");
  document.querySelectorAll("[data-category]").forEach(card=>card.onclick=()=>{selectedCategory=card.dataset.category; selectedEntryId=""; renderCategoryDetail(selectedCategory);});
}

function renderCategoryDetail(category){
  $("homeView").classList.add("hidden");
  $("detailView").classList.remove("hidden");
  const list=filteredEntries().filter(e=>e.category===category);
  $("detailContent").innerHTML=`<h2>${escapeHtml(category)}</h2><p class="meta">Aktive Pflanzen oben, abgeschlossene Pflanzen automatisch eingeklappt.</p>${renderGroupedEntries(list)}`;
  bindGroupedEntryEvents();
}


function groupForEntry(e){
  if(e.seasonDone) return "season";
  if(Number(e.aliveCount||0)===0) return "dead";
  return "active";
}
function groupTitle(group,count){
  if(group==="active") return `🌱 Aktiv (${count})`;
  if(group==="season") return `🌾 Saison beendet (${count})`;
  return `☠ Keine lebenden Pflanzen (${count})`;
}
function compactLastHarvest(e){
  if(!e.lastHarvest) return "keine Ernte";
  return `${e.lastHarvest.amount} ${e.lastHarvest.unit} · ${new HarvestEntry(e.lastHarvest).displayDate}`;
}
function groupedEntryCard(e){
  const open=isEntryOpen(e);
  const status=e.seasonDone ? "Saison beendet" : Number(e.aliveCount||0)===0 ? "0 lebend" : `${e.aliveCount} lebend`;
  return `<article class="card grouped-card ${e.seasonDone || Number(e.aliveCount||0)===0 ? "inactive-card" : ""}">
    <button type="button" class="entry-toggle" data-toggle-entry="${e.id}">
      <span>${open ? "▼" : "▶"} ${escapeHtml(e.variety)}</span>
      <span class="status-badge">${escapeHtml(status)}</span>
    </button>
    <div class="compact-entry-summary">
      <span>Geerntet: ${Math.round(e.actualHarvestTotal)}</span>
      <span>Letzte Ernte: ${escapeHtml(compactLastHarvest(e))}</span>
    </div>
    <div class="${open ? "" : "hidden"} entry-expanded">
      <div class="badges">
        <span class="badge">gesät: ${e.sownCount}</span>
        <span class="badge">lebend: ${e.aliveCount}</span>
        <span class="badge">offen: ${Math.round(e.activeOpenHarvest)}</span>
      </div>
      <button type="button" data-open-entry="${e.id}">Details öffnen</button>
    </div>
  </article>`;
}
function renderGroupedEntries(list){
  const groups={
    active:list.filter(e=>groupForEntry(e)==="active"),
    season:list.filter(e=>groupForEntry(e)==="season"),
    dead:list.filter(e=>groupForEntry(e)==="dead")
  };
  return ["active","season","dead"].map(group=>{
    const open=isGroupOpen(group);
    const items=groups[group];
    return `<section class="plant-group">
      <button type="button" class="group-toggle" data-toggle-group="${group}">
        ${open ? "▼" : "▶"} ${groupTitle(group,items.length)}
      </button>
      <div class="${open ? "" : "hidden"}">
        ${items.length ? items.map(groupedEntryCard).join("") : `<p class="meta">Keine Einträge</p>`}
      </div>
    </section>`;
  }).join("");
}
function bindGroupedEntryEvents(){
  document.querySelectorAll("[data-toggle-group]").forEach(btn=>btn.onclick=()=>toggleGroup(btn.dataset.toggleGroup));
  document.querySelectorAll("[data-toggle-entry]").forEach(btn=>btn.onclick=()=>toggleEntry(btn.dataset.toggleEntry));
  document.querySelectorAll("[data-open-entry]").forEach(btn=>btn.onclick=()=>{selectedEntryId=btn.dataset.openEntry;renderDetail(selectedEntryId);});
}

function entryCard(e){
  return `<article class="card" data-entry-id="${e.id}"><h3>${escapeHtml(e.variety)}</h3><p class="meta">${escapeHtml(e.locations.join(", ") || "kein Standort")}</p><div class="badges"><span class="badge">gesät: ${e.sownCount}</span><span class="badge">lebend: ${e.aliveCount}</span><span class="badge">Quote: ${e.survivalRate ?? "–"}%</span></div><p class="meta">med: ${Math.round(e.expectedMed)} · geerntet: ${Math.round(e.actualHarvestTotal)} · offen: ${Math.round(e.activeOpenHarvest)} · ${e.percentReached}% erreicht${e.seasonDone ? " · Saison fertig" : ""}</p></article>`;
}

function renderDetail(id){
  const e=entries.find(x=>x.id===id); if(!e) return;
  $("homeView").classList.add("hidden"); $("detailView").classList.remove("hidden");
  const sow=parseLocalDate(e.sowingDate);
  const germMin=sow&&e.germinationMinDays?formatDate(addDays(sow,e.germinationMinDays)):"–";
  const germMax=sow&&e.germinationMaxDays?formatDate(addDays(sow,e.germinationMaxDays)):"–";
  const harvestMin=sow&&e.harvestMinDays?formatDate(addDays(sow,e.harvestMinDays)):"–";
  const harvestMax=sow&&e.harvestMaxDays?formatDate(addDays(sow,e.harvestMaxDays)):"–";
  $("detailContent").innerHTML = `
  <article class="card">
    <h2>${escapeHtml(e.category)} – ${escapeHtml(e.variety)}</h2>
    <p class="meta">${escapeHtml(e.locations.join(", ") || "kein Standort")}</p>
    <div class="badges"><span class="badge">gesät/gepflanzt: ${e.sownCount}</span><span class="badge">lebend: ${e.aliveCount}</span><span class="badge">Quote: ${e.survivalRate ?? "–"}%</span><span class="badge">offen med: ${Math.round(e.activeOpenHarvest)}</span><span class="badge">${e.percentReached}% erreicht</span></div>
    <div class="progressbar"><span style="width:${Math.min(e.percentReached,100)}%"></span></div>
    <p class="meta">Ertragsfortschritt bezogen auf den mittleren erwarteten Ertrag.</p>
    <div class="tablewrap"><table><tbody>
      <tr><th>Typ</th><td>${e.isBought ? "gekauft/gepflanzt" : "gesät"}</td></tr>
      <tr><th>Aussaatdatum</th><td>${escapeHtml(e.sowingDate || "–")} ${e.sowingEstimated ? "(geschätzt)" : ""}</td></tr>
      <tr><th>Kauf-/Pflanzdatum</th><td>${escapeHtml(e.purchaseDate || "–")}</td></tr>
      <tr><th>Größe beim Kauf</th><td>${escapeHtml(e.purchaseSize || "–")}</td></tr>
      <tr><th>Pflanzzeit</th><td>${escapeHtml(e.plantingTime || "–")}</td></tr>
      <tr><th>Blüte früh/spät</th><td>${escapeHtml(e.bloomStart || "–")} / ${escapeHtml(e.bloomEnd || "–")}</td></tr>
      <tr><th>Erntezeit früh/spät</th><td>${escapeHtml(e.harvestSeasonStart || "–")} / ${escapeHtml(e.harvestSeasonEnd || "–")}</td></tr>
      <tr><th>Pflanzabstand</th><td>${escapeHtml(e.spacing || "–")}</td></tr>
      <tr><th>Wuchshöhe</th><td>${escapeHtml(e.height || "–")}</td></tr>
      <tr><th>Stammdaten-Hinweis</th><td>${escapeHtml(e.sourceNote || "–")}</td></tr>
      <tr><th>Keimdauer früh/spät</th><td>${e.germinationMinDays || "–"} / ${e.germinationMaxDays || "–"} Tage → ${germMin} / ${germMax}</td></tr>
      <tr><th>Pflanztiefe</th><td>${escapeHtml(e.plantingDepth || "–")}</td></tr>
      <tr><th>Ernte früh/spät</th><td>${e.harvestMinDays || "–"} / ${e.harvestMaxDays || "–"} Tage → ${harvestMin} / ${harvestMax}</td></tr>
      <tr><th>Ertrag min/med/max gesamt</th><td>${Math.round(e.expectedMin)} / ${Math.round(e.expectedMed)} / ${Math.round(e.expectedMax)}</td></tr>
      <tr><th>Liter jetzt/später</th><td>${e.literNow === "" ? "–" : e.literNow} / ${e.literLater === "" ? "–" : e.literLater}</td></tr>
      <tr><th>Saisonstatus</th><td>${e.seasonDone ? `fertig seit ${escapeHtml(e.seasonDoneDate || "–")} · ${escapeHtml(e.seasonDoneReason || "")}` : "aktiv"}</td></tr>
      <tr><th>Letzte Ernte</th><td>${e.lastHarvest ? `${escapeHtml(new HarvestEntry(e.lastHarvest).displayDate)} · ${e.lastHarvest.amount} ${escapeHtml(e.lastHarvest.unit)}` : "–"}</td></tr>
      <tr><th>Erntezeitraum bisher</th><td>${escapeHtml(e.harvestPeriod || "–")}</td></tr>
      <tr><th>Notizen</th><td>${escapeHtml(e.notes || "–")}</td></tr>
    </tbody></table></div>
    <div class="quick-germination">
      <button id="plusOneGerminatedBtn" class="secondary" type="button">+1 gekeimt/lebend</button>
      <input id="setGerminatedCountInput" type="number" min="0" placeholder="Anzahl lebend" />
      <button id="setGerminatedCountBtn" class="secondary" type="button">Anzahl eintragen</button>
    </div>
    <div class="actions"><button id="addHarvestBtn" type="button">+ Ernte eintragen</button><button id="seasonDoneBtn" class="secondary" type="button">${e.seasonDone ? "Saison reaktivieren" : "Saison fertig"}</button><button id="suggestYieldBtn" class="secondary" type="button">Ertrag anpassen?</button><button id="editPlantBtn" class="secondary" type="button">Bearbeiten</button><button id="duplicatePlantBtn" class="secondary" type="button">Neu säen / duplizieren</button><button id="deletePlantBtn" class="danger" type="button">Löschen</button></div>
  </article>
  <h3>Ernteverlauf</h3><div class="tablewrap"><table><thead><tr><th>Datum/Zeitraum</th><th>Menge</th><th>Einheit</th><th>geschätzt</th><th>Notiz</th><th>Aktionen</th></tr></thead><tbody>${e.harvests.length ? e.harvests.slice().sort((a,b)=>harvestSortDate(b)-harvestSortDate(a)).map(h=>`<tr><td>${escapeHtml(new HarvestEntry(h).displayDate)}</td><td>${h.amount}</td><td>${escapeHtml(h.unit)}</td><td>${h.estimated ? "ja" : ""}</td><td>${escapeHtml(h.note||"")}</td><td><div class="small-actions"><button type="button" class="secondary" data-edit-harvest="${h.id}">✏️</button><button type="button" class="secondary" data-copy-harvest="${h.id}">⧉</button><button type="button" class="danger" data-delete-harvest="${h.id}">🗑️</button></div></td></tr>`).join("") : `<tr><td colspan="6">Noch keine Ernte eingetragen.</td></tr>`}</tbody></table></div>`;
  $("plusOneGerminatedBtn").onclick=()=>{ e.aliveCount += 1; saveEntries(); };
  $("setGerminatedCountBtn").onclick=()=>{ const val = Number($("setGerminatedCountInput").value); if(!Number.isNaN(val)) { e.aliveCount = val; saveEntries(); } };
  $("addHarvestBtn").onclick=()=>openHarvestDialog(e.id);
  $("seasonDoneBtn").onclick=()=>toggleSeasonDone(e.id);
  $("suggestYieldBtn").onclick=()=>suggestYieldAdjustment(e.id);
  $("editPlantBtn").onclick=()=>openPlantDialog(e);
  $("duplicatePlantBtn").onclick=()=>{
    const today = new Date().toISOString().slice(0,10);
    const copy=new GardenEntry({...e,id:undefined,variety:e.isBought ? `${e.variety} gekauft ${today}` : today,sownCount:0,aliveCount:0,harvests:[],doneEvents:{},sowingDate:e.isBought ? "" : today,purchaseDate:e.isBought ? today : "",notes:""});
    entries.push(copy); saveEntries(); selectedEntryId=copy.id;
  };
  $("deletePlantBtn").onclick=()=>{if(confirm(`${e.variety} wirklich löschen?`)){entries=entries.filter(x=>x.id!==e.id); selectedEntryId=""; saveEntries();}};

  document.querySelectorAll("[data-edit-harvest]").forEach(btn=>{
    btn.onclick=(ev)=>{
      ev.stopPropagation();
      openHarvestDialog(e.id, btn.dataset.editHarvest);
    };
  });
  document.querySelectorAll("[data-copy-harvest]").forEach(btn=>{
    btn.onclick=(ev)=>{
      ev.stopPropagation();
      copyHarvest(e.id, btn.dataset.copyHarvest);
    };
  });
  document.querySelectorAll("[data-delete-harvest]").forEach(btn=>{
    btn.onclick=(ev)=>{
      ev.stopPropagation();
      deleteHarvest(e.id, btn.dataset.deleteHarvest);
    };
  });
}

function openPlantDialog(e=null){
  $("dialogTitle").textContent=e?"Eintrag bearbeiten":"Neuer Pflanzen-Eintrag";
  $("plantId").value=e?.id||""; $("category").value=e?.category||""; $("variety").value=e?.variety||"";
  $("locHochbeet").checked=e?.locations?.includes("Hochbeet")||false; $("locBoden").checked=e?.locations?.includes("Boden")||false; $("locTopf").checked=e?.locations?.includes("Topf")||false;
  $("sownCount").value=e?.sownCount??""; $("aliveCount").value=e?.aliveCount??""; $("sowingDate").value=e?.sowingDate||""; $("sowingEstimated").checked=e?.sowingEstimated||false; $("isBought").checked=e?.isBought||false; $("purchaseDate").value=e?.purchaseDate||""; $("purchaseSize").value=e?.purchaseSize||""; $("bloomStart").value=e?.bloomStart||""; $("bloomEnd").value=e?.bloomEnd||""; $("plantingTime").value=e?.plantingTime||"";
  $("germinationMinDays").value=e?.germinationMinDays??""; $("germinationMaxDays").value=e?.germinationMaxDays??""; $("plantingDepth").value=e?.plantingDepth||"";
  $("harvestMinDays").value=e?.harvestMinDays??""; $("harvestMaxDays").value=e?.harvestMaxDays??""; $("yieldMin").value=e?.yieldMin??""; $("yieldMed").value=e?.yieldMed??""; $("yieldMax").value=e?.yieldMax??"";
  $("literNow").value=e?.literNow??""; $("literLater").value=e?.literLater??""; $("notes").value=e?.notes||"";
  $("plantDialog").showModal();
}

function savePlantFromForm(ev){
  ev.preventDefault();
  const id=$("plantId").value; const old=entries.find(e=>e.id===id);
  const locations=[]; if($("locHochbeet").checked) locations.push("Hochbeet"); if($("locBoden").checked) locations.push("Boden"); if($("locTopf").checked) locations.push("Topf");
  let entry=new GardenEntry({id:id||undefined,category:$("category").value,variety:$("variety").value,locations,sownCount:$("sownCount").value,aliveCount:$("aliveCount").value,sowingDate:$("sowingDate").value,sowingEstimated:$("sowingEstimated").checked,isBought:$("isBought").checked,purchaseDate:$("purchaseDate").value,purchaseSize:$("purchaseSize").value,bloomStart:$("bloomStart").value,bloomEnd:$("bloomEnd").value,doneEvents:old?.doneEvents||{},seasonDone:old?.seasonDone||false,seasonDoneDate:old?.seasonDoneDate||"",seasonDoneReason:old?.seasonDoneReason||"",plantingTime:$("plantingTime").value,germinationMinDays:$("germinationMinDays").value,germinationMaxDays:$("germinationMaxDays").value,plantingDepth:$("plantingDepth").value,harvestMinDays:$("harvestMinDays").value,harvestMaxDays:$("harvestMaxDays").value,yieldMin:$("yieldMin").value,yieldMed:$("yieldMed").value,yieldMax:$("yieldMax").value,literNow:$("literNow").value,literLater:$("literLater").value,notes:$("notes").value,harvests:old?.harvests||[]});
  entry = new GardenEntry(boughtPlantDefaults(applyVarietySpecificMaster(applyMasterToEntry(entry))));
  if(old) entries=entries.map(e=>e.id===id?entry:e); else entries.push(entry);
  selectedCategory=entry.category; selectedEntryId=entry.id; $("plantDialog").close(); saveEntries();
}

function openHarvestDialog(entryId, harvestId=""){
  const entry = entries.find(x=>x.id===entryId);
  const harvest = entry?.harvests?.find(h=>h.id===harvestId);

  $("harvestPlantId").value=entryId;
  $("harvestId").value=harvestId || "";
  $("harvestDate").value=harvest?.date || (harvestId ? "" : new Date().toISOString().slice(0,10));
  $("harvestFromDate").value=harvest?.fromDate || "";
  $("harvestToDate").value=harvest?.toDate || "";
  $("harvestEstimated").checked=harvest?.estimated || false;
  $("harvestAmount").value=harvest?.amount ?? "";
  $("harvestUnit").value=harvest?.unit || "Stück";
  $("harvestNote").value=harvest?.note || "";
  $("harvestDialog").showModal();
}
function saveHarvestFromForm(ev){
  ev.preventDefault();
  const e=entries.find(x=>x.id===$("harvestPlantId").value);
  if(e){
    const harvestId = $("harvestId").value;
    const data = new HarvestEntry({
      date:$("harvestDate").value,
      fromDate:$("harvestFromDate").value,
      toDate:$("harvestToDate").value,
      estimated:$("harvestEstimated").checked,
      amount:$("harvestAmount").value,
      unit:$("harvestUnit").value,
      note:$("harvestNote").value
    });

    if(harvestId){
      data.id = harvestId;
      e.harvests = e.harvests.map(h=>h.id===harvestId ? data : h);
    } else {
      e.harvests.push(data);
    }

    $("harvestDialog").close();
    saveEntries();
  }
}

function deleteHarvest(entryId, harvestId){
  const e = entries.find(x=>x.id===entryId);
  if(!e) return;
  if(confirm("Ernteeintrag wirklich löschen?")){
    e.harvests = e.harvests.filter(h=>h.id!==harvestId);
    saveEntries();
  }
}

function copyHarvest(entryId, harvestId){
  const e = entries.find(x=>x.id===entryId);
  const h = e?.harvests?.find(x=>x.id===harvestId);
  if(!e || !h) return;
  const copy = new HarvestEntry({...h, note: h.note ? h.note + " (Kopie)" : "Kopie"});
  e.harvests.push(copy);
  saveEntries();
}

function exportCsv(){
  const months=["Mai","Juni","Juli","August","September","Oktober"];
  const header=["Pflanze","Hochbeet","Boden","Topf","gesät","Überlebensquote","lebend","Aussaatdatum","Aussaat geschätzt","Gekauft","Kauf-/Pflanzdatum","Größe beim Kauf","Blüte frühestens","Blüte spätestens","Erntezeit frühestens","Erntezeit spätestens","Pflanzabstand","Wuchshöhe","Keimung frühestens","Keimung spätestens","Pflanzzeit","Pflanztiefe","Ernte frühestens nach Tagen","Ernte spätestens nach Tagen","Ertrag min","Ertrag med","Ertrag max","Ernte min","Ernte med","Ernte max","tatsächliche Ernte","noch offen",...months,"Liter jetzt","Liter später","Notizen"];
  const rows=entries.map(e=>{
    const monthly=monthlyHarvests(e);
    return [e.variety,e.locations.includes("Hochbeet")?"x":"",e.locations.includes("Boden")?"x":"",e.locations.includes("Topf")?"x":"",e.sownCount,e.survivalRate===null?"#DIV/0!":`${e.survivalRate}%`,e.aliveCount,e.sowingDate,e.sowingEstimated?"ja":"",e.isBought?"ja":"",e.purchaseDate,e.purchaseSize,e.bloomStart,e.bloomEnd,e.harvestSeasonStart,e.harvestSeasonEnd,e.spacing,e.height,e.germinationMinDays,e.germinationMaxDays,e.plantingTime,e.plantingDepth,e.harvestMinDays,e.harvestMaxDays,e.yieldMin,e.yieldMed,e.yieldMax,Math.round(e.expectedMin),Math.round(e.expectedMed),Math.round(e.expectedMax),Math.round(e.actualHarvestTotal),Math.round(e.openHarvest),...months.map(m=>monthly[m]||""),e.literNow,e.literLater,e.notes];
  });
  const csv=[header,...rows].map(r=>r.map(csvCell).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`gartentagebuch-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}



function renderCatalog(){
  const cats = categories();

  $("catalogEditButtons").innerHTML = `
    <h3>Stammdaten bearbeiten</h3>
    <p class="meta">Klicke auf eine Pflanzenart, um Keimdauer, Pflanztiefe, Abstand, Wuchshöhe, Blüte und Erntezeit global zu ändern.</p>
    <div class="catalog-button-grid">
      ${cats.map(cat=>`<button type="button" class="secondary catalog-edit-card" data-edit-master="${escapeHtml(cat)}">${escapeHtml(cat)} bearbeiten</button>`).join("")}
    </div>
  `;

  $("catalogContent").innerHTML = `<table>
    <thead><tr><th>Pflanzenart</th><th>Keimung</th><th>Pflanztiefe</th><th>Pflanzzeit</th><th>Abstand</th><th>Wuchshöhe</th><th>Blüte</th><th>Erntezeit</th><th>Ernte nach Tagen</th></tr></thead>
    <tbody>${cats.map(cat=>{
      const m = getMaster(cat);
      return `<tr>
        <td><strong>${escapeHtml(cat)}</strong><div class="source-note">${escapeHtml(m.sourceNote || "")}</div></td>
        <td>${m.germinationMinDays || "–"} / ${m.germinationMaxDays || "–"} Tage</td>
        <td>${escapeHtml(m.plantingDepth || "–")}</td>
        <td>${escapeHtml(m.plantingTime || "–")}</td>
        <td>${escapeHtml(m.spacing || "–")}</td>
        <td>${escapeHtml(m.height || "–")}</td>
        <td>${escapeHtml(m.bloomStart || "–")} / ${escapeHtml(m.bloomEnd || "–")}</td>
        <td>${escapeHtml(m.harvestSeasonStart || "–")} / ${escapeHtml(m.harvestSeasonEnd || "–")}</td>
        <td>${m.harvestMinDays || "–"} / ${m.harvestMaxDays || "–"}</td>
      </tr>`;
    }).join("")}</tbody>
  </table>`;

  document.querySelectorAll("[data-edit-master]").forEach(btn=>{
    btn.onclick=()=>openMasterDataDialog(btn.dataset.editMaster);
  });
}

function openCatalog(){
  $("catalogView").classList.remove("hidden");
  renderCatalog();
  $("catalogView").scrollIntoView({behavior:"smooth", block:"start"});
}



function openMasterDataDialog(category){
  const m = getMaster(category);
  $("masterCategory").value = category;
  $("masterCategoryLabel").value = category;
  $("masterPlantingTime").value = m.plantingTime || "";
  $("masterGerminationMinDays").value = m.germinationMinDays || "";
  $("masterGerminationMaxDays").value = m.germinationMaxDays || "";
  $("masterPlantingDepth").value = m.plantingDepth || "";
  $("masterHarvestMinDays").value = m.harvestMinDays || "";
  $("masterHarvestMaxDays").value = m.harvestMaxDays || "";
  $("masterHarvestSeasonStart").value = m.harvestSeasonStart || "";
  $("masterHarvestSeasonEnd").value = m.harvestSeasonEnd || "";
  $("masterBloomStart").value = m.bloomStart || "";
  $("masterBloomEnd").value = m.bloomEnd || "";
  $("masterSpacing").value = m.spacing || "";
  $("masterHeight").value = m.height || "";
  $("masterSourceNote").value = m.sourceNote || "";
  $("masterDataDialog").showModal();
}

function saveMasterDataFromForm(ev){
  ev.preventDefault();
  const category = $("masterCategory").value;
  masterData[category] = {
    plantingTime:$("masterPlantingTime").value,
    germinationMinDays:Number($("masterGerminationMinDays").value || 0),
    germinationMaxDays:Number($("masterGerminationMaxDays").value || 0),
    plantingDepth:$("masterPlantingDepth").value,
    harvestMinDays:Number($("masterHarvestMinDays").value || 0),
    harvestMaxDays:Number($("masterHarvestMaxDays").value || 0),
    harvestSeasonStart:$("masterHarvestSeasonStart").value,
    harvestSeasonEnd:$("masterHarvestSeasonEnd").value,
    bloomStart:$("masterBloomStart").value,
    bloomEnd:$("masterBloomEnd").value,
    spacing:$("masterSpacing").value,
    height:$("masterHeight").value,
    sourceNote:$("masterSourceNote").value
  };
  saveMasterData();
  $("masterDataDialog").close();
  applyMasterToAllEntries(category);
  renderCatalog();
}

function openGerminationDialog(entryId, eventKey){
  const e = entries.find(x=>x.id===entryId);
  if(!e) return;
  $("germinationPlantId").value = entryId;
  $("germinationEventKey").value = eventKey;
  $("germinationAliveCount").value = e.aliveCount || "";
  $("germinationDialog").showModal();
}

function completeGerminationEvent(updateCount){
  const entryId = $("germinationPlantId").value;
  const eventKey = $("germinationEventKey").value;
  const e = entries.find(x=>x.id===entryId);
  if(!e) return;
  if(updateCount){
    const val = Number($("germinationAliveCount").value);
    if(!Number.isNaN(val)) e.aliveCount = val;
  }
  e.doneEvents = e.doneEvents || {};
  e.doneEvents[eventKey] = true;
  $("germinationDialog").close();
  saveEntries();
}


function toggleSeasonDone(entryId){
  const e=entries.find(x=>x.id===entryId);
  if(!e) return;
  if(e.seasonDone){
    e.seasonDone=false; e.seasonDoneDate=""; e.seasonDoneReason=""; saveEntries(); return;
  }
  const reason=prompt("Warum ist die Saison fertig? z. B. abgestorben, keine Früchte mehr, entfernt", "keine Früchte mehr");
  if(reason===null) return;
  e.seasonDone=true;
  e.seasonDoneDate=new Date().toISOString().slice(0,10);
  e.seasonDoneReason=reason;
  saveEntries();
}

function suggestYieldAdjustment(entryId){
  const e = entries.find(x => x.id === entryId);
  if(!e) return;

  if(!e.actualHarvestTotal || !e.aliveCount){
    alert("Für einen Vorschlag brauche ich tatsächliche Ernte und lebende Pflanzen.");
    return;
  }

  const actualPerPlant = e.actualHarvestTotal / e.aliveCount;
  const suggestedMin = Math.max(0, Math.round(actualPerPlant * 0.7 * 10) / 10);
  const suggestedMed = Math.max(0, Math.round(actualPerPlant * 10) / 10);
  const suggestedMax = Math.max(0, Math.round(actualPerPlant * 1.3 * 10) / 10);

  $("yieldPlantId").value = entryId;
  $("yieldSuggestMin").value = suggestedMin;
  $("yieldSuggestMed").value = suggestedMed;
  $("yieldSuggestMax").value = suggestedMax;

  $("yieldSummary").innerHTML = `
    <div class="yield-summary-row"><span>Pflanze</span><strong>${escapeHtml(e.variety)}</strong></div>
    <div class="yield-summary-row"><span>Bisher geerntet</span><strong>${Math.round(e.actualHarvestTotal)}</strong></div>
    <div class="yield-summary-row"><span>Erntezeitraum</span><strong>${escapeHtml(e.harvestPeriod || "unbekannt")}</strong></div>
    <div class="yield-summary-row"><span>Lebend</span><strong>${e.aliveCount}</strong></div>
    <div class="yield-summary-row"><span>Aktuell min/med/max</span><strong>${e.yieldMin} / ${e.yieldMed} / ${e.yieldMax}</strong></div>
  `;

  $("yieldDialog").showModal();
}

function saveYieldAdjustment(ev){
  ev.preventDefault();
  const e = entries.find(x => x.id === $("yieldPlantId").value);
  if(!e) return;

  e.yieldMin = Number($("yieldSuggestMin").value || 0);
  e.yieldMed = Number($("yieldSuggestMed").value || 0);
  e.yieldMax = Number($("yieldSuggestMax").value || 0);

  $("yieldDialog").close();
  saveEntries();
}

function exportBackup(){
  const backup = {
    app: "gartentagebuch-pwa",
    version: 5,
    exportedAt: new Date().toISOString(),
    year: currentYear,
    entries,
    masterData,
    years: getYearList(),
    allYearData: Object.fromEntries(getYearList().map(y => [y, JSON.parse(localStorage.getItem(yearStorageKey(y)) || "[]")]))
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gartentagebuch-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importBackupFile(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if(parsed.allYearData){
        const importedYears = Object.keys(parsed.allYearData);
        saveYearList(importedYears.length ? importedYears : ["2026"]);
        for(const y of importedYears){
          localStorage.setItem(yearStorageKey(y), JSON.stringify(parsed.allYearData[y]));
        }
        setCurrentYear(parsed.year || importedYears[0] || "2026");
        updateYearSelect();
      }
      const importedEntries = Array.isArray(parsed) ? parsed : parsed.entries;

      if (!Array.isArray(importedEntries)) {
        alert("Die Datei sieht nicht wie ein Gartentagebuch-Backup aus.");
        return;
      }

      const ok = confirm("Backup importieren? Dadurch werden die aktuellen lokalen Daten ersetzt.");
      if (!ok) return;

      if(parsed.masterData) {
        masterData = {...defaultMasterData(), ...parsed.masterData};
        saveMasterData();
      }
      entries = importedEntries.map(e => new GardenEntry(applyMasterToEntry(e)));
      selectedCategory = "";
      selectedEntryId = "";
      saveEntries();
      alert("Backup wurde importiert.");
    } catch (error) {
      alert("Backup konnte nicht gelesen werden. Prüfe, ob es eine JSON-Datei ist.");
    }
  };
  reader.readAsText(file);
}

function harvestSortDate(h){
  const d = parseLocalDate(h.toDate || h.date || h.fromDate);
  return d ? d.getTime() : 0;
}

function monthlyHarvests(e){
  const names=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const out={};
  for(const h of e.harvests){
    const d=parseLocalDate(h.fromDate || h.date || h.toDate);
    if(!d) continue;
    const m=names[d.getMonth()];
    out[m]=(out[m]||0)+Number(h.amount||0);
  }
  return out;
}
function csvCell(v){const s=String(v??""); return /[;"\n\r]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
function parseLocalDate(v){if(!v) return null; const [y,m,d]=v.split("-").map(Number); if(!y||!m||!d) return null; return new Date(y,m-1,d);}
function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function addDays(d,days){const out=new Date(d); out.setDate(out.getDate()+Number(days||0)); return out;}
function formatDate(d){return d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});}
function escapeHtml(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}


function openNewYearDialog(){
  const years = getYearList();
  const nums = years.map(Number).filter(Boolean);
  const suggested = String((nums.length ? Math.max(...nums) : 2026) + 1);
  $("newYearInput").value = suggested;
  $("yearDialog").showModal();
}

function createNewYearFromValue(yearValue){
  const years = getYearList();
  const cleanYear = String(yearValue || "").trim();

  if(!/^\d{4}$/.test(cleanYear)){
    alert("Bitte ein vierstelliges Jahr eingeben, z. B. 2027.");
    return;
  }

  if(years.includes(cleanYear)){
    setCurrentYear(cleanYear);
    $("yearDialog").close();
    loadYear(cleanYear);
    return;
  }

  const template = entries.map(e => {
    const copy = {
      ...e,
      id: crypto.randomUUID(),
      harvests: [],
      doneEvents: {}, seasonDone:false, seasonDoneDate:"", seasonDoneReason:"",
      sownCount: 0,
      aliveCount: 0,
      sowingDate: "",
      purchaseDate: "",
      sowingEstimated: false,
      notes: "",
      variety: e.isBought ? e.variety : e.category
    };
    return new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry(copy)));
  });

  saveYearList([...years, cleanYear]);
  localStorage.setItem(yearStorageKey(cleanYear), JSON.stringify(template));
  setCurrentYear(cleanYear);
  entries = template;
  updateYearSelect();
  $("yearDialog").close();
  saveEntries();
  alert(`Gartenjahr ${cleanYear} wurde erstellt.`);
}

function openNewYearDialog(){
  const years = getYearList();
  const nums = years.map(Number).filter(Boolean);
  const suggested = String((nums.length ? Math.max(...nums) : 2026) + 1);
  $("newYearInput").value = suggested;
  $("yearDialog").showModal();
}

function createNewYearFromValue(yearValue){
  const years = getYearList();
  const cleanYear = String(yearValue || "").trim();

  if(!/^\d{4}$/.test(cleanYear)){
    alert("Bitte ein vierstelliges Jahr eingeben, z. B. 2027.");
    return;
  }

  if(years.includes(cleanYear)){
    setCurrentYear(cleanYear);
    $("yearDialog").close();
    loadYear(cleanYear);
    return;
  }

  const template = entries.map(e => {
    const copy = {
      ...e,
      id: crypto.randomUUID(),
      harvests: [],
      doneEvents: {},
      sownCount: 0,
      aliveCount: 0,
      sowingDate: "",
      purchaseDate: "",
      sowingEstimated: false,
      notes: "",
      variety: e.isBought ? e.variety : e.category
    };
    return new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry(copy)));
  });

  saveYearList([...years, cleanYear]);
  localStorage.setItem(yearStorageKey(cleanYear), JSON.stringify(template));
  setCurrentYear(cleanYear);
  entries = template;
  updateYearSelect();
  $("yearDialog").close();
  saveEntries();
  alert(`Gartenjahr ${cleanYear} wurde erstellt.`);
}

function createNewYear(){
  openNewYearDialog();
}

function loadYear(year){
  setCurrentYear(year);
  entries = loadEntries().map(e => new GardenEntry(applyVarietySpecificMaster(applyMasterToEntry(normalizeEntryCategory(e)))));
  if(typeof forceV14DataFixes === "function") forceV14DataFixes();
  if(typeof applyBoughtDefaultsToAll === "function") applyBoughtDefaultsToAll();
  updateYearSelect();
  render();
}

$("menuBtn").onclick=()=>$("menuPanel").classList.toggle("hidden");
document.addEventListener("click",(ev)=>{
  if($("menuPanel") && !$("menuPanel").contains(ev.target) && ev.target !== $("menuBtn")) $("menuPanel").classList.add("hidden");
});
if($("yearSelect")) $("yearSelect").onchange=(ev)=>loadYear(ev.target.value);
if($("newYearBtn")) $("newYearBtn").onclick=()=>createNewYear();
if($("yearForm")) $("yearForm").onsubmit=(ev)=>{ev.preventDefault(); createNewYearFromValue($("newYearInput").value);};
if($("cancelYearBtn")) $("cancelYearBtn").onclick=()=>$("yearDialog").close();
$("catalogBtn").onclick=()=>{ $("menuPanel").classList.add("hidden"); openCatalog(); };
$("closeCatalogBtn").onclick=()=> $("catalogView").classList.add("hidden");
$("masterDataForm").onsubmit=saveMasterDataFromForm;
$("cancelMasterDataBtn").onclick=()=>$("masterDataDialog").close();
$("germinationForm").onsubmit=(ev)=>{ev.preventDefault(); completeGerminationEvent(true);};
$("germinationOnlyDoneBtn").onclick=()=>completeGerminationEvent(false);
$("cancelGerminationBtn").onclick=()=>$("germinationDialog").close();
$("newPlantBtn").onclick=()=>openPlantDialog();
$("cancelPlantBtn").onclick=()=>$("plantDialog").close();
$("cancelHarvestBtn").onclick=()=>$("harvestDialog").close();
$("plantForm").onsubmit=savePlantFromForm;
$("harvestForm").onsubmit=saveHarvestFromForm;
if($("yieldForm")) $("yieldForm").onsubmit=saveYieldAdjustment;
if($("cancelYieldBtn")) $("cancelYieldBtn").onclick=()=>$("yieldDialog").close();
$("exportCsvBtn").onclick=exportCsv;
$("exportBackupBtn").onclick=exportBackup;
$("importBackupBtn").onclick=()=>$("backupFileInput").click();
$("backupFileInput").onchange=(ev)=>{
  const file = ev.target.files?.[0];
  if(file) importBackupFile(file);
  ev.target.value = "";
};
$("resetBtn").onclick=()=>{if(confirm("Startdaten neu laden? Deine lokalen Änderungen werden überschrieben.")){localStorage.removeItem(STORAGE_KEY); entries=parseSeedCsv(); saveEntries(); selectedCategory=""; selectedEntryId="";}};
$("calendarRange").onchange=()=>{showAllCalendar=false; renderCalendar();};
$("calendarTypeFilter").onchange=()=>{showAllCalendar=false; renderCalendar();};
$("calendarDoneFilter").onchange=()=>{showAllCalendar=false; renderCalendar();};
if($("showAllCalendarBtn")) $("showAllCalendarBtn").onclick=()=>{showAllCalendar=!showAllCalendar; renderCalendar();};
$("searchInput").oninput=()=>{if(selectedCategory) renderCategoryDetail(selectedCategory); else renderHome();};
$("searchInput").onkeydown=(ev)=>{
  if(ev.key === "Enter"){
    ev.preventDefault();
    if(selectedCategory) renderCategoryDetail(selectedCategory); else renderHome();
    $("searchInput").blur();
  }
};
$("categoryFilter").onchange=()=>{selectedCategory=$("categoryFilter").value; selectedEntryId=""; selectedCategory?renderCategoryDetail(selectedCategory):renderHome();};
$("backBtn").onclick=()=>{if(selectedEntryId){selectedEntryId=""; renderCategoryDetail(selectedCategory);} else {selectedCategory=""; $("categoryFilter").value=""; renderHome();}};

let deferredPrompt; window.addEventListener("beforeinstallprompt", ev=>{ev.preventDefault(); deferredPrompt=ev; $("installBtn").classList.remove("hidden");});
$("installBtn").onclick=async()=>{if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("installBtn").classList.add("hidden");};
if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js");

// Startansicht soll wirklich nur offene Kalenderpunkte zeigen.
if($("calendarDoneFilter")) $("calendarDoneFilter").value = "open";
saveYearList([...getYearList(), "2026", currentYear]);
updateYearSelect();

render();
