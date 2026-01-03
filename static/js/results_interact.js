"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  // 1. Menu Logic (Same as before)
  setupMenu();

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

  // Mapping variables to their full Question Titles
  const variables = [
    {
      key: "clear-instructions",
      title:
        "It's important for me that the teacher provides clear instructions before evaluating.",
    },
    {
      key: "grading-scale",
      title: "It's important for me that the teacher provides a grading scale.",
    },
    {
      key: "eval-content",
      title:
        "It's important for me to be evaluated purely on the course content.",
    },
    {
      key: "resources",
      title:
        "It's important for me to be given additional resources to able to dig further.",
    },
    {
      key: "practice",
      title:
        "It's important for me that the course requires practicing what was taught.",
    },
    {
      key: "limit-time",
      title: "It's important for me to produce assignments in limited time.",
    },
    {
      key: "feedback",
      title:
        "It's important for me that the teacher provides personal feedback and annotations on my work.",
    },
    {
      key: "explanation",
      title:
        "It's important for me that additional explanations for the class are provided after an assignment.",
    },
    {
      key: "correction",
      title:
        "It's important for me that I'm asked to correct my mistakes after an evaluation.",
    },
    {
      key: "interaction",
      title:
        "It's important for me to interact with other students when I'm working.",
    },
    { key: "group-work", title: "It's important for me to work in groups." },
  ];

  variables.forEach((v) => {
    createBarChart(container, data, v.key, v.title);
  });
}

function createBarChart(container, data, key, title) {
  // 1. Process Data: Count frequency of 1, 2, 3, 4, 5
  // We initialize counts to 0 to ensure all bars appear even if count is 0
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  data.forEach((row) => {
    const val = row[key];
    if (counts[val] !== undefined) {
      counts[val]++;
    }
  });

  // Convert to array for D3
  const plotData = Object.keys(counts).map((k) => ({
    score: k,
    count: counts[k],
  }));

  // 2. Setup Dimensions
  const margin = { top: 40, right: 20, bottom: 40, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  // 3. Append SVG Wrapper
  const chartDiv = container.append("div").style("margin-bottom", "60px");

  // Title
  chartDiv
    .append("h3")
    .text(title)
    .style("font-size", "1rem")
    .style("margin-bottom", "10px");

  const svg = chartDiv
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 4. Scales
  const x = d3
    .scaleBand()
    .domain(["1", "2", "3", "4", "5"]) // Explicit domain 1-5
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(plotData, (d) => d.count) || 10]) // Max count or default 10
    .range([height, 0]);

  // 5. Axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y).ticks(5));

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
    .attr("fill", "#4c282e"); // Using your brand color
}

// --- HELPER: MENU SETUP ---
function setupMenu() {
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
}
