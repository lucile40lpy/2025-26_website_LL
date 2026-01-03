"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  // 1. Menu Logic
  const dropdownTrigger = document.getElementById("dropdown-trigger");
  const dropdownMenu = document.getElementById("dropdown-menu");
  const dropdownIcon = document.querySelector(".dropdown-icon");

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
      if (dropdownIcon) {
        dropdownIcon.style.transform = dropdownMenu.classList.contains("hidden")
          ? "rotate(0deg)"
          : "rotate(180deg)";
      }
    });

    document.addEventListener("click", function () {
      dropdownMenu.classList.add("hidden");
      if (dropdownIcon) dropdownIcon.style.transform = "rotate(0deg)";
    });

    dropdownMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // 2. Fetch and Draw Data
  const apiUrl = window.flaskUrls ? window.flaskUrls.sheetApiUrl : null;

  if (apiUrl) {
    try {
      const rawData = await fetchData(apiUrl);
      if (rawData && rawData.length > 0) {
        document.getElementById("loading-message").style.display = "none";
        generateAllCharts(rawData);
      } else {
        document.getElementById("loading-message").textContent =
          "No data found.";
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      document.getElementById("loading-message").textContent =
        "Error loading data.";
    }
  } else {
    console.error("API URL not configured.");
    document.getElementById("loading-message").textContent =
      "Configuration Error.";
  }
});

// --- DATA FETCHING ---
async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// --- CHART GENERATION ---
function generateAllCharts(data) {
  const container = d3.select("#charts-container");

  // Questions Mapping
  const variables = [
    {
      key: "clear-instructions",
      title: "Clear instructions before evaluating",
    },
    { key: "grading-scale", title: "Teacher provides a grading scale" },
    { key: "eval-content", title: "Evaluated purely on course content" },
    { key: "resources", title: "Additional resources to dig further" },
    { key: "practice", title: "Practicing what was taught" },
    { key: "limit-time", title: "Produce assignments in limited time" },
    { key: "feedback", title: "Personal feedback and annotations" },
    { key: "explanation", title: "Explanations provided after assignment" },
    { key: "correction", title: "Asked to correct mistakes after evaluation" },
    { key: "interaction", title: "Interact with other students" },
    { key: "group-work", title: "Work in groups" },
  ];

  variables.forEach((v) => {
    createBarChart(container, data, v.key, v.title);
  });
}

function createBarChart(container, data, key, title) {
  // 1. Process Data
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  data.forEach((row) => {
    const strVal = String(row[key]);
    if (counts[strVal] !== undefined) counts[strVal]++;
  });
  const plotData = Object.keys(counts).map((k) => ({
    score: k,
    count: counts[k],
  }));

  const labelMap = {
    1: "Strongly Disagree",
    2: "Disagree",
    3: "Neutral",
    4: "Agree",
    5: "Strongly Agree",
  };

  // 2. MINI DIMENSIONS
  // We make the chart physically smaller to fit the 3-column grid
  const margin = { top: 20, right: 10, bottom: 70, left: 30 };
  const width = 220 - margin.left - margin.right; // Much smaller width
  const height = 200 - margin.top - margin.bottom; // Much smaller height

  // 3. Append Wrapper
  const chartDiv = container.append("div").attr("class", "chart-wrapper");

  // Title
  chartDiv
    .append("h3")
    .text(title)
    .style("font-size", "0.8rem") // Small text
    .style("text-align", "center")
    .style("margin-bottom", "5px")
    .style("min-height", "30px");

  // 4. SVG with viewBox (Responsive)
  const svg = chartDiv
    .append("svg")
    .attr(
      "viewBox",
      `0 0 ${width + margin.left + margin.right} ${
        height + margin.top + margin.bottom
      }`
    )
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 5. Scales
  const x = d3
    .scaleBand()
    .domain(["1", "2", "3", "4", "5"])
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(plotData, (d) => d.count) || 5])
    .range([height, 0]);

  // 6. Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat((d) => labelMap[d]))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)")
    .style("font-size", "9px"); // Tiny font for labels

  svg
    .append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d")))
    .style("font-size", "9px");

  // 7. Bars
  svg
    .selectAll(".bar")
    .data(plotData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.score))
    .attr("y", (d) => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.count))
    .attr("fill", "#4c282e");
}
