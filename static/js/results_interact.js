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
  // Using the global variable injected by app.context_processor
  // (We check window.flaskUrls just in case, or fallback to config)
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
    const val = row[key];
    // Convert numbers to strings safely (e.g. 1 -> "1")
    const strVal = String(val);
    if (counts[strVal] !== undefined) {
      counts[strVal]++;
    }
  });

  const plotData = Object.keys(counts).map((k) => ({
    score: k,
    count: counts[k],
  }));

  // Label Mapping
  const labelMap = {
    1: "Strongly Disagree",
    2: "Disagree",
    3: "Neutral",
    4: "Agree",
    5: "Strongly Agree",
  };

  // 2. Setup Dimensions
  // Increased bottom margin to fit rotated text
  const margin = { top: 30, right: 20, bottom: 80, left: 40 };
  const width = 400 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // 3. Append Wrapper (Grid Item)
  const chartDiv = container.append("div").attr("class", "chart-wrapper");

  // Title
  chartDiv
    .append("h3")
    .text(title)
    .style("font-size", "1rem")
    .style("text-align", "center")
    .style("margin-bottom", "15px")
    .style("min-height", "40px"); // Aligns titles in grid

  const svg = chartDiv
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 4. Scales
  const x = d3
    .scaleBand()
    .domain(["1", "2", "3", "4", "5"])
    .range([0, width])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(plotData, (d) => d.count) || 5])
    .range([height, 0]);

  // 5. Axes
  // X Axis with Text Formatting and Rotation
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat((d) => labelMap[d]))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-25)"); // Rotate text to fit

  // Y Axis
  svg.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d"))); // Integers only

  // 6. Bars
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
