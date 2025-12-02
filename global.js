import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';


const width = 900;
const height = 600;
let activeTimer = null;
let activeChart = "both"; 


const vis = d3.select("#vis")
    .attr("width", width)
    .attr("height", height);

const barLayer = vis.append("g");
const scatterLayer = vis.append("g");

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
const specieData = await loadData();
const vertebrates = Array.from(new Set(specieData.map(d => d.taxon)));
const classes = ["LC", "NT", "VU", "EN", "CR", "EX"];


// scrolly: store chart functions
const charts = {
    1: () => drawIntro(),
    2: () => drawTempIncrease(),
    3: () => drawHabLoss(),
    4: () => drawCarbonIncrease(),
    5: () => drawConclusion()
    // Add more steps as needed
    // 6: () => yourFunction()
};

function showChart(stepNum) {
    if (activeTimer) {
        activeTimer.stop();
        activeTimer = null;
    }

    unbindSliders();

    barLayer.selectAll("*").remove();
    scatterLayer.selectAll("*").remove();
    charts[stepNum]();
    
    bindSliders();
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

function animateSlider({
    sliderId,
    start,
    end,
    step = 0.5,
    delay = 30,
    onUpdate
}) {
    if (activeTimer) activeTimer.stop();

    const slider = d3.select(sliderId);
    let value = start;

    slider.property("value", value);
    onUpdate(value);

    activeTimer = d3.interval(() => {
        value += step;

        if (value >= end) {
            value = end;
            activeTimer.stop();
        }

        slider.property("value", value);
        onUpdate(value);
    }, delay);
}

function updateRiskWithTemp(val) {
    d3.select("#tempSlider").property("value", val);
    updateAll();
}

function updateRiskWithHab(val) {
    d3.select("#habSlider").property("value", val);
    updateAll();
}

function updateRiskWithCO2(val) {
    d3.select("#co2Slider").property("value", val);
    updateAll();
}

// scrolly: intro
function drawIntro() {
    vis.append("text")
        .attr("x", 100)
        .attr("y", 200)
        .style("font-size", "125%")
        .text("Scroll to explore species risk changes");
}
// scrolly: temp increase animation
function drawTempIncrease() {
    activeChart = "bars"; 
    drawRiskBars(specieData);
    //drawGroupScatter(specieData);

    animateSlider({
        sliderId: "#tempSlider",
        start: 0,
        end: 5,
        step: 0.05,
        delay: 30,
        onUpdate: updateRiskWithTemp
    });
}

// scrolly: habitat loss increase animation
function drawHabLoss() {
    activeChart = "bars"; 
    drawRiskBars(specieData);
    //drawGroupScatter(specieData);


    animateSlider({
        sliderId: "#habSlider",
        start: 0,
        end: 5,
        step: 0.05,
        delay: 30,
        onUpdate: updateRiskWithHab
    });
}

// scrolly: co2 increase animation
function drawCarbonIncrease() {
    activeChart = "bars"; 
    drawRiskBars(specieData);
    //drawGroupScatter(specieData);

    animateSlider({
        sliderId: "#co2Slider",
        start: 0,
        end: 5,
        step: 0.05,
        delay: 30,
        onUpdate: updateRiskWithCO2
    });
}

// scrolly: outro
function drawConclusion() {
    vis.append("text")
        .attr("x", 40)
        .attr("y", 200)
        .style("font-size", "125%")
        .text("Final insights on species risk under climate scenarios");
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
d3.select("#reptileCheck").on("change", handleCheckboxChange);
d3.select("#amphibianCheck").on("change", handleCheckboxChange);

console.log(
  "checkbox count =",
  d3.selectAll('input[type="checkbox"]').size()
);


// sliders
function bindSliders() {
    d3.select("#tempSlider").on("input", updateAll);
    d3.select("#habSlider").on("input", updateAll);
    d3.select("#co2Slider").on("input", updateAll);
}

function unbindSliders() {
    d3.select("#tempSlider").on("input", null);
    d3.select("#habSlider").on("input", null);
    d3.select("#co2Slider").on("input", null);
}

function updateAll() {
    d3.select("#tempValue").text(d3.select("#tempSlider").node().value);
    d3.select("#habValue").text(d3.select("#habSlider").node().value);
    d3.select("#co2Value").text(d3.select("#co2Slider").node().value);

    const updated = computeUpdatedSpecies(getFilteredData());

    if (activeChart === "bars") {
        drawRiskBars(updated);
    }

    if (activeChart === "scatter") {
        drawGroupScatter(updated);
    }

    if (activeChart === "both") {
        drawRiskBars(updated);
        drawGroupScatter(updated);
    }
}

function computeRisk(d) {
    const temp = +d3.select("#tempSlider").node().value;
    const hab = +d3.select("#habSlider").node().value;
    const co2 = +d3.select("#co2Slider").node().value;

    let score = d.risk_score;

    score += d.temp_sensitivity * temp;
    score += d.habitat_loss_sens * (hab / 10);
    score += d.co2_sens * (co2 / 100);

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

    const barData = [];
    vertebrates.forEach(taxon => {
        classes.forEach(cat => {
            const count = data.filter(d =>
                d.updated_category === cat &&
                d.taxon === taxon
            ).length;

            barData.push({
                category: cat,
                taxon: taxon,
                count: count
            });
        });
    });

    const x = d3.scaleBand()
        .domain(classes)
        .range([100, width - 100])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 80])
        .range([height - 50, 50]);

    barLayer.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(x));

    barLayer.append("g")
        .attr("transform", `translate(100,0)`)
        .call(d3.axisLeft(y));

    barLayer.selectAll("rect")
        .data(barData.filter(d => selectedCheck.has(d.taxon)))
        .join(
            enter => enter.append("rect"),
            update => update,
            exit => exit.remove()
        )
        .interrupt()
        .attr("x", d => x(d.category))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => (height - 50) - y(d.count))
        .attr("fill", d => color(d.taxon))
        .style("opacity", 0.5);
}


function drawGroupScatter(data) {
    const svg = d3.select("#vis")
        .attr("width", width)
        .attr("height", height);

    scatterLayer.selectAll("*").remove();

    const groups = d3.group(data, d => d.taxon);

    // NUMBER OF ANIMALS PER GROUP THAT ARE EXTINCT
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
        .attr("x", d => x(d.group))                  // LEFT EDGE
        .attr("y", d => y(d.worsened))               // TOP OF BAR
        .attr("width", x.bandwidth())                // FULL BAND
        .attr("height", d => y(0) - y(d.worsened))   // BAR HEIGHT
        .attr("fill", d => color(d.group));          // FIXED COLOR TARGET
}
