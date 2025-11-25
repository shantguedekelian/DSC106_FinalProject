import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';


const width = 1200;
const height = 800;

const vis = d3.select("#vis")
    .attr("width", width)
    .attr("height", height);

// interactive plots, these go below the scrollytelling
const risk_plot = d3.select("#risk_plot")
    .attr("width", width)
    .attr("height", height);


// --- Load data ---
async function loadData() {
    try {
        const specieData = await d3.csv('cleaned_data.csv');
        specieData.forEach(d => {
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

// scrolly: store chart functions
const charts = {
    1: () => drawIntro(),
    2: () => drawRiskBars(specieData),
    3: () => drawGroupScatter(specieData),
    4: () => drawConclusion()
    // Add more steps as needed
    // 5: () => yourFunction()
};

function showChart(stepNum) {
    d3.select("#vis").selectAll("*").remove();
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

// scrolly: intro
function drawIntro() {
    vis.append("text")
        .attr("x", 100)
        .attr("y", 200)
        .style("font-size", "125%")
        .text("Scroll to explore species risk changes");
}
// scrolly: outro
function drawConclusion() {
    vis.append("text")
        .attr("x", 40)
        .attr("y", 200)
        .style("font-size", "125%")
        .text("Final insights on species risk under climate scenarios");
}


// sliders
d3.select("#tempSlider").on("input", updateAll);
d3.select("#habSlider").on("input", updateAll);
d3.select("#co2Slider").on("input", updateAll);

function updateAll() {
    d3.select("#tempValue").text(d3.select("#tempSlider").node().value);
    d3.select("#habValue").text(d3.select("#habSlider").node().value);
    d3.select("#co2Value").text(d3.select("#co2Slider").node().value);

    const updated = computeUpdatedSpecies(specieData);
    drawRiskBars(updated);
    drawGroupScatter(updated);
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
    risk_plot.selectAll("*").remove();

    const categories = ["LC", "NT", "VU", "EN", "CR", "EX"];

    let counts = d3.rollup(
        data,
        v => v.length,
        d => d.updated_category
    );

    const barData = categories.map(c => ({
        category: c,
        count: counts.get(c) || 0
    }));

    const x = d3.scaleBand()
        .domain(categories)
        .range([100, width - 100])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.count)])
        .range([height - 50, 50]);

    risk_plot.append("g")
        .attr("transform", `translate(0, ${height - 50})`)
        .call(d3.axisBottom(x));

    risk_plot.append("g")
        .attr("transform", `translate(100,0)`)
        .call(d3.axisLeft(y));

    risk_plot.selectAll("rect")
        .data(barData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.category))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => (height - 50) - y(d.count))
        .attr("fill", "steelblue");
}

function drawGroupScatter(data) {
    const svg = d3.select("#group_scatter")
        .attr("width", 500)
        .attr("height", 300);

    svg.selectAll("*").remove();

    const groups = d3.group(data, d => d.taxon);

    let result = [];
    groups.forEach((species, groupName) => {
        const worsened = species.filter(s => s.updated_category !== s.red_list_category).length;
        result.push({ group: groupName, worsened });
    });

    const x = d3.scaleBand()
        .domain(result.map(d => d.group))
        .range([50, 450])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(result, d => d.worsened)])
        .range([250, 50]);

    svg.append("g").attr("transform", "translate(0,250)").call(d3.axisBottom(x));
    svg.append("g").attr("transform", "translate(50,0)").call(d3.axisLeft(y));

    svg.selectAll("circle")
        .data(result)
        .enter().append("circle")
        .attr("cx", d => x(d.group) + x.bandwidth() / 2)
        .attr("cy", d => y(d.worsened))
        .attr("r", 8)
        .attr("fill", "red");
}

updateAll();
