import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';


const width = 800;
const height = 500;
let activeTimer = null;
//let activeChart = "both"; 
let activeChart = "scrolly";
let sandboxMode = false;

let tempAnimated = false;
let habAnimated = false;
let co2Animated = false;


const vis = d3.select("#vis")
    .attr("width", width)
    .attr("height", height);

const sandboxVis = d3.select("#risk_plot")
    .attr("width", width)
    .attr("height", height);

const barLayer = vis.append("g");
const scatterLayer = vis.append("g");

const sandboxBarLayer = sandboxVis.append("g");
const sandboxScatterLayer = sandboxVis.append("g");

// interactive plots, these go below the scrollytelling
// const risk_plot = d3.select("#vis")
//     .attr("width", width)
//     .attr("height", height);


// --- Load data ---
async function loadData() {
    try {
        console.log('hello');
        const specieData = await d3.csv('cleaned_data.csv');

        specieData.forEach(d => {
            d.taxon = d.taxon.toUpperCase();
            d.risk_score = +d.risk_score;
            d.temp_sensitivity = +d.temp_sensitivity;
            d.habitat_loss_sens = +d.habitat_loss_sens;
            d.co2_sens = +d.co2_sens;
        });
        return specieData;
    } catch (error) {
        console.error('Error loading specie data :', error);
    }
}

bindSliders();
const specieData = await loadData();
const vertebrates = Array.from(new Set(specieData.map(d => d.taxon)));
const classes = ["LC", "NT", "VU", "EN", "CR", "EX"];

d3.select("#tempSlider").on("input", e => updateRiskWithTemp(+e.target.value));
d3.select("#habSlider").on("input", e => updateRiskWithHab(+e.target.value));
d3.select("#co2Slider").on("input", e => updateRiskWithCO2(+e.target.value));


// scrolly: store chart functions
const charts = {
    1: () => drawIntro(),
    2: () => drawTempIncrease(),
    3: () => drawHabLoss(),
    4: () => drawCarbonIncrease(),
    5: () => drawConclusion(),
    6: () => activateSandbox()
    // Add more steps as needed
    // 6: () => yourFunction()
};

function showChart(stepNum) {
    sandboxMode = false;

    if (activeTimer) {
        activeTimer.stop();
        activeTimer = null;
    }
    charts[stepNum]();
}

// scrolly: scrolly setup
const scroller = scrollama();
function setupScroll() {
    scroller
        .setup({
            step: ".step",
            offset: 0.6,
            debug: false
        })
        .onStepEnter(response => {

            // ---- animations ----
            document.querySelectorAll(".step")
                .forEach(s => s.classList.remove("is-active", "is-exiting"));

            response.element.classList.add("is-active");

            // ---- chart switching ----
            const stepNum = +response.element.dataset.step;
            showChart(stepNum);
        })
        .onStepExit(response => {
            response.element.classList.remove("is-active");
            response.element.classList.add("is-exiting");
        });

}
setupScroll();

function animateSlider({ sliderId, start, end, step = 0.5, delay = 30, setter }) {
    if (activeTimer) {
        activeTimer.stop();
        activeTimer = null;
    }

    let value = start;
    setter(value); // update state + graph

    activeTimer = d3.interval(() => {
        value += step;
        if (value >= end) {
            value = end;
            setter(value);
            activeTimer.stop();
            activeTimer = null;
            return;
        }
        setter(value);
    }, delay);
}

let tempVal = 0;
let habVal = 0;
let co2Val = 0;

function updateRiskWithTemp(val) {
    tempVal = val;
    d3.select("#tempSlider").property("value", val);
    d3.select("#tempValue").text(val.toFixed(1));
    updateAll();
}

function updateRiskWithHab(val) {
    habVal = val;
    d3.select("#habSlider").property("value", val);
    d3.select("#habValue").text(val);
    updateAll();
}

function updateRiskWithCO2(val) {
    co2Val = val;
    d3.select("#co2Slider").property("value", val);
    d3.select("#co2Value").text(val);
    updateAll();
}

function updateAll() {
    const updated = computeUpdatedSpecies(getFilteredData());

    if (sandboxMode || activeChart === "both") {
        drawRiskBars(updated);
        drawGroupBars(updated);
    } else if (activeChart === "bars" || activeChart === "intro") {
        drawRiskBars(updated);
    } else if (activeChart === "scatter") {
        drawGroupBars(updated);
    }
}




// scrolly: intro
function drawIntro() {
    if (activeChart === "intro") return;
    
    activeChart = "intro";
    vis.append("text")
        .attr("x", 100)
        .attr("y", 200)
        .style("font-size", "125%");
    
    drawRiskBars(getFilteredData());

    tempAnimated = false;
    habAnimated = false;
    co2Animated = false;

    tempVal = 0;
    habVal = 0;
    co2Val = 0;

    updateRiskWithTemp(tempVal)
    updateRiskWithHab(habVal)
    updateRiskWithCO2(co2Val)

}
// scrolly: temp increase animation
function drawTempIncrease() {
    if (tempAnimated) return;
    
    activeChart = "bars"; 
    drawRiskBars(getFilteredData());

    //drawGroupScatter(specieData);

    animateSlider({
        sliderId: "#tempSlider",
        start: tempVal,
        end: 4,
        step: 0.05,
        delay: 30,
        setter: updateRiskWithTemp
    });    

    tempAnimated = true;
    
}

// scrolly: habitat loss increase animation
function drawHabLoss() {
    if (habAnimated) return;

    activeChart = "bars"; 
    drawRiskBars(getFilteredData());

    //drawGroupScatter(specieData);

    animateSlider({
        sliderId: "#habSlider",
        start: habVal,
        end: 50,
        step: 0.5,
        delay: 30,
        setter: updateRiskWithHab
    });

    habAnimated = true;

}

// scrolly: co2 increase animation
function drawCarbonIncrease() {
    if (co2Animated) {
        return;
    }

    activeChart = "bars"; 
    drawRiskBars(specieData);

    //drawGroupScatter(specieData);

    animateSlider({
        sliderId: "#co2Slider",
        start: co2Val,
        end: 200,
        step: 2,
        delay: 30,
        setter: updateRiskWithCO2
    });

    co2Animated = true;

}

// scrolly: outro
function drawConclusion() {
    vis.append("text")
        .attr("x", 40)
        .attr("y", 200)
        .style("font-size", "125%");

    drawRiskBars(getFilteredData());

    
    tempAnimated = false;
    habAnimated = false;
    co2Animated = false;

    tempVal = 0;
    habVal = 0;
    co2Val = 0;

    updateRiskWithTemp(tempVal)
    updateRiskWithHab(habVal)
    updateRiskWithCO2(co2Val)
}

function activateSandbox() {
    sandboxMode = true;
    activeChart = "both";

    if (activeTimer) {
        activeTimer.stop();
        activeTimer = null;
    }

    drawRiskBars(getFilteredData());
    drawGroupBars(getFilteredData());

}


const color = d3.scaleOrdinal()
    .domain(vertebrates)
    .range(["steelblue", "hotpink"]);

let selectedCheck = new Set(vertebrates);  // e.g. {"AMPHIBIAN", "REPTILE"}

function getFilteredData() {
    return specieData.filter(d => selectedCheck.has(d.taxon));
}
    
function handleCheckboxChange() {
    const taxon = this.value;   // "REPTILE" or "AMPHIBIAN"

    if (this.checked) {
        selectedCheck.add(taxon);
    } else {
        selectedCheck.delete(taxon);
    }

    console.log("Checkbox changed:", this.id, "checked:", this.checked);
    console.log("selectedCheck =", Array.from(selectedCheck));

    updateAll();
}

// explicit bindings
d3.select("body").on("change", function(event) {
    const target = event.target;
    if (target.id === "reptileCheck" || target.id === "amphibianCheck") {
        handleCheckboxChange.call(target, event);
    }
});

console.log(
  "checkbox count =",
  d3.selectAll('input[type="checkbox"]').size()
);


// sliders
function bindSliders() {
    d3.select("#tempSlider").on("input", e => updateRiskWithTemp(+e.target.value));
    d3.select("#habSlider").on("input", e => updateRiskWithHab(+e.target.value));
    d3.select("#co2Slider").on("input", e => updateRiskWithCO2(+e.target.value));
}


function computeRisk(d) {
    let score = d.risk_score;
    score += d.temp_sensitivity * tempVal;
    score += d.habitat_loss_sens * (habVal / 10);
    score += d.co2_sens * (co2Val / 100);
    return score;
}


function scoreToCategory(score) {
    if (score < 1) return "LC";
    if (score < 2) return "NT";
    if (score < 3) return "VU";
    if (score < 4) return "EN";
    if (score < 5) return "CR";
    return "EX";
}

function computeUpdatedSpecies(data) {
    return data.map(d => {
        const score = computeRisk(d);
        return {
            ...d,
            updated_category: scoreToCategory(score)
        };
    });
}


function drawRiskBars(data) {
    barLayer.selectAll("*").remove();
    data = computeUpdatedSpecies(data);

    // --- Step 1: Aggregate counts per category ---
    const barData = d3.rollup(
        data,
        v => ({
            REPTILIA: v.filter(d => d.taxon === "REPTILIA").length,
            AMPHIBIA: v.filter(d => d.taxon === "AMPHIBIA").length
        }),
        d => d.updated_category
    );

    const categories = classes;
    const taxa = ["REPTILIA", "AMPHIBIA"];

    // --- Step 2: Build stacked input (respect checkboxes) ---
    const stackedInput = categories.map(cat => {
        const counts = barData.get(cat) || { REPTILIA: 0, AMPHIBIA: 0 };
        return {
            category: cat,
            REPTILIA: selectedCheck.has("REPTILIA") ? counts.REPTILIA : 0,
            AMPHIBIA: selectedCheck.has("AMPHIBIA") ? counts.AMPHIBIA : 0
        };
    });

    const stackGen = d3.stack().keys(taxa);
    const series = stackGen(stackedInput);

    // --- Step 3: Scales ---
    const x = d3.scaleBand()
        .domain(categories)
        .range([100, width - 100])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([
            0,
            d3.max(series, s => d3.max(s, d => d[1]))
        ])
        .nice()
        .range([height - 50, 50]);

    // --- Step 4: Axes ---
    barLayer.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(x));

    barLayer.append("g")
        .attr("transform", `translate(100,0)`)
        .call(d3.axisLeft(y));

    // --- Step 5: Draw stacked bars ---
    const groups = barLayer.selectAll("g.layer")
        .data(series)
        .join("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .style("opacity", 0.7);

    groups.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => x(d.data.category))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    // --- Step 6: Add top labels (total for each bar) ---
    const totals = stackedInput.map(d => ({
        category: d.category,
        total: d.REPTILIA + d.AMPHIBIA
    }));

    barLayer.selectAll("text.total-label")
        .data(totals)
        .join("text")
        .attr("class", "total-label")
        .attr("x", d => x(d.category) + x.bandwidth() / 2)
        .attr("y", d => y(d.total) - 6)   // put slightly above the bar
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text(d => d.total > 0 ? d.total : "");
}





function drawGroupBars(data) {
    scatterLayer.selectAll("*").remove();

    const groups = d3.group(data, d => d.taxon);

    let result = [];
    groups.forEach((species, groupName) => {
        const worsened = species.filter(s => s.updated_category === 'EX').length;
        result.push({ group: groupName, worsened });
    });

    const x = d3.scaleBand()
        .domain(result.map(d => d.group))
        .range([100, width - 100])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, 80])
        .range([height - 50, 50]);

    scatterLayer.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(x));

    scatterLayer.append("g")
        .attr("transform", `translate(100,0)`)
        .call(d3.axisLeft(y));

    scatterLayer.selectAll("rect")
        .data(result)
        .join("rect")
        .attr("x", d => x(d.group))
        .attr("y", d => y(d.worsened))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.worsened))
        .attr("fill", d => color(d.group));
}


