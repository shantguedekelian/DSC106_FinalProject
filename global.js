import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const width = 1200;
const height = 800;

const risk_plot = d3.select('#risk_plot')
                        .attr('width', width)
                        .attr('height', height);


// --- Load data ---
async function loadData() {
  try {
    const specieData = await d3.csv('cleaned_data.csv');
    return specieData;
  } catch (error) {
    console.error('Error loading specie data :', error);
  }
}

const specieData = await loadData();

console.log(specieData)

