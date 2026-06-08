const STORAGE_KEY = "gartentagebuch.v9";
const $ = id => document.getElementById(id);

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
    this.harvests = data.harvests || [];
  }
  get survivalRate(){ return this.sownCount ? Math.round(this.aliveCount/this.sownCount*100) : null; }
  get expectedMin(){ return this.aliveCount*this.yieldMin; }
  get expectedMed(){ return this.aliveCount*this.yieldMed; }
  get expectedMax(){ return this.aliveCount*this.yieldMax; }
  get actualHarvestTotal(){ return this.harvests.reduce((s,h)=>s+Number(h.amount||0),0); }
  get openHarvest(){ return Math.max(0, this.expectedMed-this.actualHarvestTotal); }
  get percentReached(){ return this.expectedMed ? Math.round((this.actualHarvestTotal / this.expectedMed) * 100) : 0; }
}

let entries = loadEntries().map(e => new GardenEntry(e));
let selectedCategory = "";
let selectedEntryId = "";

function loadEntries(){
  const current = localStorage.getItem(STORAGE_KEY);
  if(current) return JSON.parse(current);

  // Reparatur-Migration: Suche alle älteren Speicherstände und nimm den neuesten mit Daten.
  const oldKeys = [
    "gartentagebuch.v8",
    "gartentagebuch.v7",
    "gartentagebuch.v6",
    "gartentagebuch.v5",
    "gartentagebuch.v4",
    "gartentagebuch.v3",
    "gartentagebuch.v2",
    "gartentagebuch.v1"
  ];

  for(const key of oldKeys){
    const raw = localStorage.getItem(key);
    if(!raw) continue;
    try{
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
      if(parsed?.entries && Array.isArray(parsed.entries) && parsed.entries.length){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.entries));
        return parsed.entries;
      }
    }catch(e){
      console.warn("Alter Speicherstand konnte nicht gelesen werden:", key, e);
    }
  }

  return parseSeedCsv();
}

function saveEntries(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
  if(n.includes("sojabohne")) return "Sojabohne";
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
  const c = category.toLowerCase();
  const data = {
    "tomate": [3,15,"0,5–1 cm",120,190,"Mitte März bis Anfang April vorziehen, ab Mitte Mai raus","",""],
    "paprika": [10,28,"0,5–1 cm",140,220,"Februar/März vorziehen, ab Mitte Mai raus","",""],
    "chili": [10,28,"0,5–1 cm",140,220,"Januar–März vorziehen, ab Mitte Mai raus","",""],
    "radieschen": [3,14,"0,5–1 cm",21,56,"März–September Direktsaat","",""],
    "kohlrabi": [7,14,"0,5–1 cm",56,84,"Februar–Juli, je nach Satz","",""],
    "gurke": [3,14,"1–2 cm",55,80,"April vorziehen, nach Eisheiligen raus","",""],
    "mais": [7,14,"3–5 cm",90,120,"April/Mai","",""],
    "basilikum": [5,14,"Lichtkeimer, nur andrücken",45,80,"April–Juni","",""],
    "petersilie": [14,28,"1–2 cm",70,100,"März–Juli","",""],
    "schnittlauch": [10,20,"1–2 cm",80,120,"März–Juli","",""],
    "salat": [5,14,"0,5–1 cm",35,70,"März–August","",""],
    "spinat": [7,14,"2 cm",42,84,"Frühjahr oder Herbst","",""],
    "karotte": [14,28,"1–2 cm",90,160,"März–Juli Direktsaat","",""],
    "bohne": [7,14,"3–5 cm",60,90,"ab Mitte Mai","",""],
    "zuckererbse": [7,14,"3–5 cm",60,90,"März–Mai","",""],
    "zucchini": [7,14,"2–3 cm",50,80,"April vorziehen, ab Mitte Mai raus","",""],
    "kürbis": [7,14,"2–3 cm",90,130,"April vorziehen, ab Mitte Mai raus","",""],
    "wassermelone": [7,14,"1–2 cm",90,120,"warm vorziehen","",""],
    "zwiebel/schlotten": [10,21,"1–2 cm",90,150,"Frühjahr","",""],
    "lauch": [10,20,"0,5–1 cm",120,180,"Februar–April vorziehen","",""],
    "sojabohne": [7,14,"3–4 cm",80,120,"Mai/Juni","",""],
    "kartoffel": [14,28,"8–10 cm",90,130,"April/Mai legen","",""],
    "erdbeere": [14,42,"Lichtkeimer, kaum bedecken",365,730,"Pflanzung Frühjahr/Herbst","April","Juni"],
    "blaubeere": [0,0,"Pflanze, nicht Saat",0,0,"Frühjahr oder Herbst, Topfware auch ganzjährig frostfrei","April","Mai"],
    "himbeere": [0,0,"Pflanze, nicht Saat",0,0,"Herbst oder Frühjahr","Mai","August"],
    "brombeere": [0,0,"Pflanze, nicht Saat",0,0,"Herbst oder Frühjahr","Mai","August"],
    "apfel": [0,0,"Baum",0,0,"Herbst ideal, Topfware auch Frühjahr","April","Mai"],
    "birne": [0,0,"Baum",0,0,"Herbst ideal, Topfware auch Frühjahr","April","Mai"],
    "rosmarin": [14,35,"0,5 cm oder Steckling",90,150,"Frühjahr nach Frost oder Topfware frostfrei","März","Juni"],
    "ananaskirsche": [7,21,"0,5–1 cm",120,180,"Februar–April vorziehen, ab Mitte Mai raus","",""],
    "andenbeere": [7,21,"0,5–1 cm",120,180,"Februar–April vorziehen, ab Mitte Mai raus","",""]
  };
  const v = data[c] || [0,0,"",0,0,"","",""];
  return {germinationMinDays:v[0], germinationMaxDays:v[1], plantingDepth:v[2], harvestMinDays:v[3], harvestMaxDays:v[4], plantingTime:v[5], bloomStart:v[6], bloomEnd:v[7]};
}

function categories(){ return [...new Set(entries.map(e=>e.category))].sort((a,b)=>a.localeCompare(b,"de")); }

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
  const totalExpected = entries.reduce((s,e)=>s+e.expectedMed,0);
  $("statHarvest").textContent = Math.round(totalHarvest);
  $("statOpen").textContent = Math.round(entries.reduce((s,e)=>s+e.openHarvest,0));
  $("statPercent").textContent = totalExpected ? `${Math.round(totalHarvest / totalExpected * 100)}%` : "0%";
}

function renderCalendar(){
  const rangeDays = Number($("calendarRange").value || 90);
  const today = startOfDay(new Date());
  const limit = addDays(today, rangeDays);
  const typeFilter = $("calendarTypeFilter") ? $("calendarTypeFilter").value : "";
  const doneFilter = $("calendarDoneFilter") ? $("calendarDoneFilter").value : "";
  const events = buildCalendarEvents()
    .filter(e=>e.date>=today && e.date<=limit)
    .filter(e=>!typeFilter || e.type.includes(typeFilter))
    .filter(e=>!doneFilter || (doneFilter === "done" ? e.done : !e.done))
    .sort((a,b)=>a.date-b.date);
  $("calendarTimeline").innerHTML = events.length ? events.map(e=>`
    <div class="timeline-item ${e.done ? "done-event" : ""}">
      <div class="timeline-date">${formatDate(e.date)}</div>
      <div>
        <div class="timeline-title">${escapeHtml(e.title)}</div>
        <div class="meta">${escapeHtml(e.subtitle)}</div>
        <span class="timeline-type">${escapeHtml(e.type)}</span>
        <label class="event-check"><input type="checkbox" data-event-done="${e.entryId}|${e.key}" ${e.done ? "checked" : ""}/> erledigt / passiert</label>
      </div>
    </div>`).join("") : `<p class="meta">Noch keine Termine im Zeitraum. Trage ein Aussaat- oder Kaufdatum ein.</p>`;

  document.querySelectorAll("[data-event-done]").forEach(cb=>{
    cb.onchange=()=>{
      const [entryId, key] = cb.dataset.eventDone.split("|");
      if(cb.checked && key.startsWith("germ")){
        cb.checked = false;
        openGerminationDialog(entryId, key);
      } else {
        toggleEventDone(entryId, key, cb.checked);
      }
    };
  });
}

function buildCalendarEvents(){
  const events=[];
  for(const e of entries){
    const baseDate = e.isBought ? parseLocalDate(e.purchaseDate || e.sowingDate) : parseLocalDate(e.sowingDate);
    if(!baseDate) continue;
    events.push(makeEvent(e, "base", baseDate, e.isBought ? "Kauf/Pflanzung" : (e.sowingEstimated ? "Aussaat ca." : "Aussaat"), `${e.variety}`, `${e.category} · ${e.sownCount} ${e.isBought ? "gekauft/gepflanzt" : "gesät/gepflanzt"}${e.sowingEstimated ? " · geschätzt" : ""}`));
    const bloomStartDate = monthNameToDate(e.bloomStart);
    const bloomEndDate = monthNameToDate(e.bloomEnd);
    if(bloomStartDate) events.push(makeEvent(e, "bloomStart", bloomStartDate, "Blüte frühestens", `${e.variety}: Blüte frühestens`, `${e.bloomStart}${e.bloomEnd ? " bis " + e.bloomEnd : ""}`));
    if(bloomEndDate && e.bloomEnd !== e.bloomStart) events.push(makeEvent(e, "bloomEnd", bloomEndDate, "Blüte spätestens", `${e.variety}: Blüte spätestens`, `${e.bloomStart ? e.bloomStart + " bis " : ""}${e.bloomEnd}`));

    if(!e.isBought && e.germinationMinDays) events.push(makeEvent(e, "germMin", addDays(baseDate,e.germinationMinDays), "Keimung frühestens", `${e.variety}: Keimlinge frühestens`, `nach ${e.germinationMinDays} Tagen`));
    if(!e.isBought && e.germinationMaxDays && e.germinationMaxDays!==e.germinationMinDays) events.push(makeEvent(e, "germMax", addDays(baseDate,e.germinationMaxDays), "Keimung spätestens", `${e.variety}: Keimlinge spätestens`, `nach ${e.germinationMaxDays} Tagen`));
    if(e.harvestMinDays) events.push(makeEvent(e, "harvestMin", addDays(baseDate,e.harvestMinDays), "Ernte frühestens", `${e.variety}: Ernte frühestens`, `med erwartet: ${Math.round(e.expectedMed)}`));
    if(e.harvestMaxDays && e.harvestMaxDays!==e.harvestMinDays) events.push(makeEvent(e, "harvestMax", addDays(baseDate,e.harvestMaxDays), "Ernte spätestens", `${e.variety}: Ernte spätestens`, `offen med: ${Math.round(e.openHarvest)}`));
  }
  return events;
}

function monthNameToDate(monthName){
  if(!monthName) return null;
  const months = {"januar":0,"februar":1,"märz":2,"maerz":2,"april":3,"mai":4,"juni":5,"juli":6,"august":7,"september":8,"oktober":9,"november":10,"dezember":11};
  const key = String(monthName).trim().toLowerCase();
  if(!(key in months)) return null;
  const year = new Date().getFullYear();
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
  $("homeView").classList.add("hidden"); $("detailView").classList.remove("hidden");
  const list = filteredEntries().filter(e=>e.category===category);
  $("detailContent").innerHTML = `<h2>${escapeHtml(category)}</h2><p class="meta">Sorte/Aussaat öffnen für Details und Ernte.</p><div class="grid">${list.map(entryCard).join("")}</div>`;
  document.querySelectorAll("[data-entry-id]").forEach(card=>card.onclick=()=>{selectedEntryId=card.dataset.entryId; renderDetail(selectedEntryId);});
}

function entryCard(e){
  return `<article class="card" data-entry-id="${e.id}"><h3>${escapeHtml(e.variety)}</h3><p class="meta">${escapeHtml(e.locations.join(", ") || "kein Standort")}</p><div class="badges"><span class="badge">gesät: ${e.sownCount}</span><span class="badge">lebend: ${e.aliveCount}</span><span class="badge">Quote: ${e.survivalRate ?? "–"}%</span></div><p class="meta">med: ${Math.round(e.expectedMed)} · geerntet: ${Math.round(e.actualHarvestTotal)} · offen: ${Math.round(e.openHarvest)} · ${e.percentReached}% erreicht</p></article>`;
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
    <div class="badges"><span class="badge">gesät/gepflanzt: ${e.sownCount}</span><span class="badge">lebend: ${e.aliveCount}</span><span class="badge">Quote: ${e.survivalRate ?? "–"}%</span><span class="badge">offen med: ${Math.round(e.openHarvest)}</span><span class="badge">${e.percentReached}% erreicht</span></div>
    <div class="progressbar"><span style="width:${Math.min(e.percentReached,100)}%"></span></div>
    <p class="meta">Ertragsfortschritt bezogen auf den mittleren erwarteten Ertrag.</p>
    <div class="tablewrap"><table><tbody>
      <tr><th>Typ</th><td>${e.isBought ? "gekauft/gepflanzt" : "gesät"}</td></tr>
      <tr><th>Aussaatdatum</th><td>${escapeHtml(e.sowingDate || "–")} ${e.sowingEstimated ? "(geschätzt)" : ""}</td></tr>
      <tr><th>Kauf-/Pflanzdatum</th><td>${escapeHtml(e.purchaseDate || "–")}</td></tr>
      <tr><th>Größe beim Kauf</th><td>${escapeHtml(e.purchaseSize || "–")}</td></tr>
      <tr><th>Pflanzzeit</th><td>${escapeHtml(e.plantingTime || "–")}</td></tr>
      <tr><th>Blüte früh/spät</th><td>${escapeHtml(e.bloomStart || "–")} / ${escapeHtml(e.bloomEnd || "–")}</td></tr>
      <tr><th>Keimdauer früh/spät</th><td>${e.germinationMinDays || "–"} / ${e.germinationMaxDays || "–"} Tage → ${germMin} / ${germMax}</td></tr>
      <tr><th>Pflanztiefe</th><td>${escapeHtml(e.plantingDepth || "–")}</td></tr>
      <tr><th>Ernte früh/spät</th><td>${e.harvestMinDays || "–"} / ${e.harvestMaxDays || "–"} Tage → ${harvestMin} / ${harvestMax}</td></tr>
      <tr><th>Ertrag min/med/max gesamt</th><td>${Math.round(e.expectedMin)} / ${Math.round(e.expectedMed)} / ${Math.round(e.expectedMax)}</td></tr>
      <tr><th>Liter jetzt/später</th><td>${e.literNow === "" ? "–" : e.literNow} / ${e.literLater === "" ? "–" : e.literLater}</td></tr>
      <tr><th>Notizen</th><td>${escapeHtml(e.notes || "–")}</td></tr>
    </tbody></table></div>
    <div class="quick-germination">
      <button id="plusOneGerminatedBtn" class="secondary" type="button">+1 gekeimt/lebend</button>
      <input id="setGerminatedCountInput" type="number" min="0" placeholder="Anzahl lebend" />
      <button id="setGerminatedCountBtn" class="secondary" type="button">Anzahl eintragen</button>
    </div>
    <div class="actions"><button id="addHarvestBtn" type="button">+ Ernte eintragen</button><button id="editPlantBtn" class="secondary" type="button">Bearbeiten</button><button id="duplicatePlantBtn" class="secondary" type="button">Neu säen / duplizieren</button><button id="deletePlantBtn" class="danger" type="button">Löschen</button></div>
  </article>
  <h3>Ernteverlauf</h3><div class="tablewrap"><table><thead><tr><th>Datum/Zeitraum</th><th>Menge</th><th>Einheit</th><th>geschätzt</th><th>Notiz</th><th>Aktionen</th></tr></thead><tbody>${e.harvests.length ? e.harvests.map(h=>`<tr><td>${escapeHtml(new HarvestEntry(h).displayDate)}</td><td>${h.amount}</td><td>${escapeHtml(h.unit)}</td><td>${h.estimated ? "ja" : ""}</td><td>${escapeHtml(h.note||"")}</td><td><div class="small-actions"><button type="button" class="secondary" data-edit-harvest="${h.id}">✏️</button><button type="button" class="secondary" data-copy-harvest="${h.id}">⧉</button><button type="button" class="danger" data-delete-harvest="${h.id}">🗑️</button></div></td></tr>`).join("") : `<tr><td colspan="6">Noch keine Ernte eingetragen.</td></tr>`}</tbody></table></div>`;
  $("plusOneGerminatedBtn").onclick=()=>{ e.aliveCount += 1; saveEntries(); };
  $("setGerminatedCountBtn").onclick=()=>{ const val = Number($("setGerminatedCountInput").value); if(!Number.isNaN(val)) { e.aliveCount = val; saveEntries(); } };
  $("addHarvestBtn").onclick=()=>openHarvestDialog(e.id);
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
  const entry=new GardenEntry({id:id||undefined,category:$("category").value,variety:$("variety").value,locations,sownCount:$("sownCount").value,aliveCount:$("aliveCount").value,sowingDate:$("sowingDate").value,sowingEstimated:$("sowingEstimated").checked,isBought:$("isBought").checked,purchaseDate:$("purchaseDate").value,purchaseSize:$("purchaseSize").value,bloomStart:$("bloomStart").value,bloomEnd:$("bloomEnd").value,doneEvents:old?.doneEvents||{},plantingTime:$("plantingTime").value,germinationMinDays:$("germinationMinDays").value,germinationMaxDays:$("germinationMaxDays").value,plantingDepth:$("plantingDepth").value,harvestMinDays:$("harvestMinDays").value,harvestMaxDays:$("harvestMaxDays").value,yieldMin:$("yieldMin").value,yieldMed:$("yieldMed").value,yieldMax:$("yieldMax").value,literNow:$("literNow").value,literLater:$("literLater").value,notes:$("notes").value,harvests:old?.harvests||[]});
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
  const header=["Pflanze","Hochbeet","Boden","Topf","gesät","Überlebensquote","lebend","Aussaatdatum","Aussaat geschätzt","Gekauft","Kauf-/Pflanzdatum","Größe beim Kauf","Blüte frühestens","Blüte spätestens","Keimung frühestens","Keimung spätestens","Pflanzzeit","Pflanztiefe","Ernte frühestens nach Tagen","Ernte spätestens nach Tagen","Ertrag min","Ertrag med","Ertrag max","Ernte min","Ernte med","Ernte max","tatsächliche Ernte","noch offen",...months,"Liter jetzt","Liter später","Notizen"];
  const rows=entries.map(e=>{
    const monthly=monthlyHarvests(e);
    return [e.variety,e.locations.includes("Hochbeet")?"x":"",e.locations.includes("Boden")?"x":"",e.locations.includes("Topf")?"x":"",e.sownCount,e.survivalRate===null?"#DIV/0!":`${e.survivalRate}%`,e.aliveCount,e.sowingDate,e.sowingEstimated?"ja":"",e.isBought?"ja":"",e.purchaseDate,e.purchaseSize,e.bloomStart,e.bloomEnd,e.germinationMinDays,e.germinationMaxDays,e.plantingTime,e.plantingDepth,e.harvestMinDays,e.harvestMaxDays,e.yieldMin,e.yieldMed,e.yieldMax,Math.round(e.expectedMin),Math.round(e.expectedMed),Math.round(e.expectedMax),Math.round(e.actualHarvestTotal),Math.round(e.openHarvest),...months.map(m=>monthly[m]||""),e.literNow,e.literLater,e.notes];
  });
  const csv=[header,...rows].map(r=>r.map(csvCell).join(";")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`gartentagebuch-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}



function renderCatalog(){
  const rows = entries.slice().sort((a,b)=>`${a.category} ${a.variety}`.localeCompare(`${b.category} ${b.variety}`,"de"));
  $("catalogContent").innerHTML = `<table>
    <thead><tr><th>Pflanzenart</th><th>Sorte/Eintrag</th><th>Typ</th><th>Keimung</th><th>Pflanztiefe</th><th>Pflanzzeit</th><th>Blüte früh/spät</th><th>Ernte früh/spät</th><th>Größe/Kauf</th></tr></thead>
    <tbody>${rows.map(e=>`<tr>
      <td>${escapeHtml(e.category)}</td>
      <td>${escapeHtml(e.variety)}</td>
      <td>${e.isBought ? "gekauft" : "gesät"}</td>
      <td>${e.isBought ? "–" : `${e.germinationMinDays || "–"} / ${e.germinationMaxDays || "–"} Tage`}</td>
      <td>${escapeHtml(e.plantingDepth || "–")}</td>
      <td>${escapeHtml(e.plantingTime || "–")}</td>
      <td>${escapeHtml(e.bloomStart || "–")} / ${escapeHtml(e.bloomEnd || "–")}</td>
      <td>${e.harvestMinDays || "–"} / ${e.harvestMaxDays || "–"} Tage</td>
      <td>${escapeHtml(e.purchaseSize || "–")}</td>
    </tr>`).join("")}</tbody>
  </table>`;
}

function openCatalog(){
  $("catalogView").classList.remove("hidden");
  renderCatalog();
  $("catalogView").scrollIntoView({behavior:"smooth", block:"start"});
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


function exportAllLocalStorageForRescue(){
  const data = {};
  for(let i=0; i<localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.startsWith("gartentagebuch.")){
      data[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify({exportedAt:new Date().toISOString(), storage:data}, null, 2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gartentagebuch-rettung-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportBackup(){
  const backup = {
    app: "gartentagebuch-pwa",
    version: 5,
    exportedAt: new Date().toISOString(),
    entries
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
      const importedEntries = Array.isArray(parsed) ? parsed : parsed.entries;

      if (!Array.isArray(importedEntries)) {
        alert("Die Datei sieht nicht wie ein Gartentagebuch-Backup aus.");
        return;
      }

      const ok = confirm("Backup importieren? Dadurch werden die aktuellen lokalen Daten ersetzt.");
      if (!ok) return;

      entries = importedEntries.map(e => new GardenEntry(e));
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

$("menuBtn").onclick=()=>$("menuPanel").classList.toggle("hidden");
document.addEventListener("click",(ev)=>{
  if($("menuPanel") && !$("menuPanel").contains(ev.target) && ev.target !== $("menuBtn")) $("menuPanel").classList.add("hidden");
});
$("catalogBtn").onclick=()=>{ $("menuPanel").classList.add("hidden"); openCatalog(); };
$("closeCatalogBtn").onclick=()=> $("catalogView").classList.add("hidden");
$("germinationForm").onsubmit=(ev)=>{ev.preventDefault(); completeGerminationEvent(true);};
$("germinationOnlyDoneBtn").onclick=()=>completeGerminationEvent(false);
$("cancelGerminationBtn").onclick=()=>$("germinationDialog").close();
$("newPlantBtn").onclick=()=>openPlantDialog();
$("cancelPlantBtn").onclick=()=>$("plantDialog").close();
$("cancelHarvestBtn").onclick=()=>$("harvestDialog").close();
$("plantForm").onsubmit=savePlantFromForm;
$("harvestForm").onsubmit=saveHarvestFromForm;
$("exportCsvBtn").onclick=exportCsv;
$("exportBackupBtn").onclick=exportBackup;
$("rescueBackupBtn").onclick=exportAllLocalStorageForRescue;
$("importBackupBtn").onclick=()=>$("backupFileInput").click();
$("backupFileInput").onchange=(ev)=>{
  const file = ev.target.files?.[0];
  if(file) importBackupFile(file);
  ev.target.value = "";
};
$("resetBtn").onclick=()=>{if(confirm("Startdaten neu laden? Deine lokalen Änderungen werden überschrieben.")){localStorage.removeItem(STORAGE_KEY); entries=parseSeedCsv(); saveEntries(); selectedCategory=""; selectedEntryId="";}};
$("calendarRange").onchange=renderCalendar;
$("calendarTypeFilter").onchange=renderCalendar;
$("calendarDoneFilter").onchange=renderCalendar;
$("searchInput").oninput=()=>{if(selectedCategory) renderCategoryDetail(selectedCategory); else renderHome();};
$("categoryFilter").onchange=()=>{selectedCategory=$("categoryFilter").value; selectedEntryId=""; selectedCategory?renderCategoryDetail(selectedCategory):renderHome();};
$("backBtn").onclick=()=>{if(selectedEntryId){selectedEntryId=""; renderCategoryDetail(selectedCategory);} else {selectedCategory=""; $("categoryFilter").value=""; renderHome();}};

let deferredPrompt; window.addEventListener("beforeinstallprompt", ev=>{ev.preventDefault(); deferredPrompt=ev; $("installBtn").classList.remove("hidden");});
$("installBtn").onclick=async()=>{if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("installBtn").classList.add("hidden");};
if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js");
render();
