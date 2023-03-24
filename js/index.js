var raw_data = [],
  planet_data = [];

var width = {
  svg: 900,
};

var height = {
  svg: 750,
};

var outerRadius = 340;

const selectedPlanetRadius = 10,
  constantRadiusMultiplier = 0.8;

var angleScale, arcMassScale, arcIncrementScale;

var svg = d3.select("svg"),
  channelSvg = d3.select("svg#channelSvg");

var getCX, getCY;

const masses = {
  Earth: {
    min: null,
    max: null,
  },
  Jupiter: {
    min: null,
    max: null,
  },
};

const distances = {
  Earth: {
    max: null,
  },
  Jupiter: {
    max: null,
  },
};

const filters = {
  selected_planet: "Earth", // 'Earth' or 'Jupiter'
  discovery_year : 2023,
  planet_type : new Set()
}

var earthData = [], jupiterData = [];

const colorFromPlanetType = (planet_type) => {
  switch (planet_type) {
    case "Terrestrial":
      return "#0E8388";
    case "Super Earth":
      return "green";
    case "Neptune-like":
      return "yellow";
    case "Gas Giant":
      return "red";
    default:
      return "white";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await getData();
  setEventListeners();
  filterPlanetList();
  calculateSVGDimentions();
  drawEverything();
  drawChannelSvg();
});

const getCSVdata = () => Promise.all([d3.csv("data/cleaned_5250.csv")]);

async function getData() {
  [raw_data] = await getCSVdata();

  const discoveryYearMinMax = [];
  raw_data = raw_data.filter((d) => {
    discoveryYearMinMax.push(+d.discovery_year);
    filters.planet_type.add(d.planet_type);
    if (
      !d.name ||
      !d.distance ||
      !d.stellar_magnitude ||
      !d.planet_type ||
      !d.discovery_year ||
      !d.mass_multiplier ||
      !d.mass_wrt ||
      !d.radius_multiplier ||
      !d.radius_wrt ||
      !d.orbital_radius ||
      !d.orbital_period ||
      !d.eccentricity ||
      !d.detection_method
    ) {
      return false;
    }
    return true;
  });

  const discoveryYearMax = d3.max(discoveryYearMinMax);
  const discoveryYearMin = d3.min(discoveryYearMinMax);

  document.getElementById("currentSelectedMaxDiscoveryYear").innerHTML = discoveryYearMax;
  document.getElementById("currentSelectedMinDiscoveryYear").innerHTML = discoveryYearMin;

  document.getElementById("discoveryYearRange").min =
  discoveryYearMin;
  document.getElementById("discoveryYearRange").max =
  discoveryYearMax;

  raw_data.forEach((d) => {
    d.distance = +d.distance;
    d.stellar_magnitude = +d.stellar_magnitude;
    d.discovery_year = +d.discovery_year;
    d.mass_multiplier = +d.mass_multiplier;
    d.radius_multiplier = +d.radius_multiplier;
    d.orbital_radius = +d.orbital_radius;
    d.orbital_period = +d.orbital_period;
    d.eccentricity = +d.eccentricity;
  });

  earthData = raw_data.filter(d => d.mass_wrt === "Earth" && d.radius_wrt === "Earth")
  jupiterData = raw_data.filter(d => d.mass_wrt === "Jupiter" && d.radius_wrt === "Jupiter")

  masses.Earth.min = d3.min(earthData, (d) => d.mass_multiplier);
  masses.Earth.max = d3.max(earthData, (d) => d.mass_multiplier);

  masses.Jupiter.min = d3.min(jupiterData, (d) => d.mass_multiplier);
  masses.Jupiter.max = d3.max(jupiterData, (d) => d.mass_multiplier);

  distances.Earth.max = d3.max(earthData, (d) => d.distance);

  distances.Jupiter.max = d3.max(jupiterData, (d) => d.distance);
}

function drawChannelSvg() {
  const w = channelSvg.attr("width"),
    h = channelSvg.attr("height");
  channelSvg
    .append("circle")
    .attr("cx", w / 2)
    .attr("cy", h / 2)
    .attr("r", w / 2 - 10)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  channelSvg
    .append("line")
    .attr("x1", w / 2)
    .attr("y1", h / 2)
    .attr("x2", w - 10)
    .attr("y2", h / 2)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  channelSvg
    .append("line")
    .attr("x1", w / 2)
    .attr("y1", h / 2)
    .attr("x2", w - 70)
    .attr("y2", h / 2 - 85)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  channelSvg
    .append("text")
    .attr("x", w / 2 + 20)
    .attr("y", h / 2 - 15)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .attr("font-size", 20)
    .text("θ");

  channelSvg
    .append("text")
    .attr("class", "noFont")
    .attr("x", w / 2 + w / 4)
    .attr("y", h / 2 + 15)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .attr("font-size", 16)
    .text("R");
}

function filterPlanetList() {
  const dataToFilter = (filters.selected_planet === "Earth") ? earthData : jupiterData

  planet_data = dataToFilter.filter(
    (d) => (d.discovery_year <= filters.discovery_year && filters.planet_type.has(d.planet_type))
  );
}

function setEventListeners() {
  window.addEventListener("resize", () => {
    calculateSVGDimentions()
    reDrawEverything()
  });

  document
    .getElementById("selectedPlanetToggle")
    .addEventListener("change", toggleSelectedPlanet);

  document
    .getElementById("discoveryYearRange")
    .addEventListener("input", (e) => {
      document.getElementById("currentSelectedMaxDiscoveryYear").innerHTML =
        e.target.value;
      filters.discovery_year = +e.target.value;
      filterPlanetList();
      reDrawEverything();
    });
}

function reDrawEverything() {
  svg.selectAll("*").remove();
  drawEverything();
}

function drawEverything() {
  drawStaticChart();
  drawDynamicChart();
}

function toggleSelectedPlanet(e) {
  filters.selected_planet = e.target.checked ? "Earth" : "Jupiter";
  document.querySelectorAll(".selectedPlanetText").forEach((d) => {
    d.innerHTML = filters.selected_planet;
  });
  if(filters.selected_planet == "Jupiter") {
    planet_data = jupiterData
  } else {
    planet_data = earthData
  }
  filterPlanetList();
  reDrawEverything();
}

function calculateSVGDimentions() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  width = {
    svg: windowWidth * 0.6,
  };

  height = {
    svg: windowHeight - 20,
  };

  outerRadius = height.svg / 2 - 100;

  svg.attr("width", width.svg).attr("height", height.svg);
}

function drawStaticChart() {
  svg
    .append("circle")
    .attr("id", "selectedPlanet")
    .attr("cx", width.svg / 2)
    .attr("cy", height.svg / 2)
    .attr("r", selectedPlanetRadius)
    .attr("fill", () => {
      if (filters.selected_planet == "Jupiter") {
        return "orange";
      } else {
        return "blue";
      }
    })
    .attr("stroke", "white")
    .attr("stroke-width", 2);
}

function drawBoundry(minMass, maxMass) {
  arcMassScale = d3
    .scaleLinear()
    .domain([minMass, maxMass])
    .range([Math.PI / 2, 2.5 * Math.PI]);

  arcIncrementScale = d3.scaleLinear().domain([0, maxMass]).range([0, 40]);

  const g = svg
    .append("g")
    .attr("id", "boundary")
    .attr("transform", `translate(${width.svg / 2}, ${height.svg / 2})`);

  for (var i = 1; i <= maxMass; i += 0.5) {
    drawBoundaryArc(i, g);
  }
}

function drawBoundaryArc(mass, g, temp = false) {
  const intMass = parseInt(mass);
  const arc = d3
    .arc()
    .innerRadius(outerRadius)
    .outerRadius(outerRadius + arcIncrementScale(intMass))
    .startAngle(arcMassScale(intMass))
    .endAngle(arcMassScale(intMass + 0.2));

  g.append("path")
    .attr("class", `boundryArc ${temp ? "tempArc" : ""}`)
    .attr("d", arc)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", temp ? 2 : 1);

  if (temp) {
    const angle = angleScale(intMass);
    const x = width.svg / 2 + (outerRadius + 60) * Math.cos(angle);
    const y = height.svg / 2 + (outerRadius + 60) * Math.sin(angle);
    drawMassLable(x, y, mass, true);
  }
}

function drawDynamicChart() {
  const selectedPlanetPadding = 10;
  const maxDistance = distances[filters.selected_planet].max
  var maxPlanetRadius = d3.max(
    planet_data,
    (d) => d.radius_multiplier * selectedPlanetRadius * constantRadiusMultiplier
  );

  const minMass = masses[filters.selected_planet].min;
  const maxMass = masses[filters.selected_planet].max;

  drawBoundry(minMass, maxMass);

  angleScale = d3
    .scaleLinear()
    .domain([minMass, maxMass])
    .range([0, 2 * Math.PI]);

  const xDistnaceScale = d3
    .scaleLinear()
    .domain([0, maxDistance])
    .range([
      width.svg / 2,
      width.svg / 2 + outerRadius - maxPlanetRadius,
    ]);

  const yDistnaceScale = d3
    .scaleLinear()
    .domain([0, maxDistance])
    .range([
      height.svg / 2,
      height.svg / 2 + outerRadius - maxPlanetRadius,
    ]);

  const cosTopixelScale = d3
    .scaleLinear()
    .domain([-1 * xDistnaceScale(maxDistance), xDistnaceScale(maxDistance)])
    .range([
      xDistnaceScale(maxDistance) - 2 * outerRadius,
      xDistnaceScale(maxDistance),
    ]);

  const sinTopixelScale = d3
    .scaleLinear()
    .domain([-1 * yDistnaceScale(maxDistance), yDistnaceScale(maxDistance)])
    .range([
      yDistnaceScale(maxDistance) - 2 * outerRadius,
      yDistnaceScale(maxDistance),
    ]);

  getCX = (d) => {
    const angle = angleScale(d.mass_multiplier);
    return cosTopixelScale(xDistnaceScale(d.distance) * Math.cos(angle));
  };

  getCY = (d) => {
    const angle = angleScale(d.mass_multiplier);
    return sinTopixelScale(yDistnaceScale(d.distance) * Math.sin(angle));
  };

  // display mass labels around the outerRedius in increasing order
  const totalDivisions = parseInt(maxMass / 6) + 1;
  for (let i = 0; i < maxMass; i += totalDivisions) {
    const angle = angleScale(i);
    const x = width.svg / 2 + (outerRadius + 60) * Math.cos(angle);
    const y = height.svg / 2 + (outerRadius + 60) * Math.sin(angle);

    drawMassLable(x, y, parseInt(i));
    drawAngleLine(
      width.svg / 2 + outerRadius * Math.cos(angle),
      height.svg / 2 + outerRadius * Math.sin(angle)
    );
  }

  drawExoplanets();

  // Drawing the max mass label
  const angle = angleScale(maxMass);
  const maxMassLabelX = width.svg / 2 + (outerRadius + 85) * Math.cos(angle);
  const maxMassLabelY = height.svg / 2 + (outerRadius + 85) * Math.sin(angle);
  drawMassLable(maxMassLabelX, maxMassLabelY, ` , ${maxMass}`);
}

function drawExoplanets() {
  svg.selectAll("circle.exoplanet").remove();
  svg
    .selectAll("circle.exoplanet")
    .data(planet_data)
    .enter()
    .append("circle")
    .attr("class", "exoplanet")
    .attr("cx", getCX)
    .attr("cy", getCY)
    .attr("r", (d) => {
      return (
        d.radius_multiplier * selectedPlanetRadius * constantRadiusMultiplier
      );
    })
    .attr("fill", (d) => {
      return colorFromPlanetType(d.planet_type);
    })
    .attr("stroke", (d) => {
      return "white";
    })
    .attr("stroke-width", 1)
    .on("mouseover", (e, d) => {
      drawOnHoverData(d, getCX(d), getCY(d));
    })
    .on("mouseout", (e, d) => {
      removeAfterHover();
    });
}

function drawMassLable(x, y, label, temp = false) {
  svg
    .append("text")
    .attr(
      "class",
      `massLabel font-bold ${temp ? "hoverMassLabel" : "permanentMassLabel"}`
    )
    .attr("x", x)
    .attr("y", y)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .attr("font-size", 20)
    .text(label);
}

function drawAngleLine(x, y) {
  svg
    .append("line")
    .attr("id", "startAngleLine")
    .attr("x1", width.svg / 2)
    .attr("y1", height.svg / 2)
    .attr("x2", x)
    .attr("y2", y)
    .attr("stroke", "white")
    .attr("stroke-width", 0.15);
}

function drawOnHoverData(selectedPlanetData, x, y) {
  // blur all other planets
  d3.selectAll("circle.exoplanet").attr("opacity", (d) => {
    if (d.name === selectedPlanetData.name) {
      return 1;
    }
    return 0;
  });

  svg
    .append("circle")
    .attr("id", "selectedPlanetCenter")
    .attr("cx", width.svg / 2)
    .attr("cy", height.svg / 2)
    .attr("r", 2)
    .attr("fill", "white")
    .attr("stroke", "white")
    .attr("stroke-width", 0.2);

  svg
    .append("circle")
    .attr("id", "planetCenter")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", 2)
    .attr("fill", "white")
    .attr("stroke", "white")
    .attr("stroke-width", 0.2);

  svg
    .append("line")
    .attr("id", "distanceAngleLine")
    .attr("x1", width.svg / 2)
    .attr("y1", height.svg / 2)
    .attr("x2", x)
    .attr("y2", y)
    .attr("stroke", "white")
    .attr("stroke-width", 1);

  // add outline to text
  svg
    .append("text")
    .attr("id", "distanceText")
    .attr("class", "font-extra-bold")
    .attr("x", width.svg / 2)
    .attr("y", height.svg / 2 - outerRadius / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .style("font-size", "40px")
    .style("font-weight", "bold")
    .text(`${selectedPlanetData.distance} light years`);

  svg
    .append("text")
    .attr("id", "planetNameText")
    .attr("x", x)
    .attr(
      "y",
      y +
        selectedPlanetData.radius_multiplier *
          selectedPlanetRadius *
          constantRadiusMultiplier +
        20
    )
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .style("font-size", "20px")
    .text(`${selectedPlanetData.name}`);

  svg
    .append("text")
    .attr("id", "selectedPlanetNameText")
    .attr("x", width.svg / 2)
    .attr("y", height.svg / 2 + 30)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .style("font-size", "20px")
    .text(filters.selected_planet);

  svg
    .append("text")
    .attr("id", "selectedPlanetMassText")
    .attr("class", "")
    .attr("x", width.svg / 2)
    .attr("y", height.svg / 2 - outerRadius / 2 + 40)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .style("font-size", "24px")
    .text(
      `${selectedPlanetData.mass_multiplier} times heavier than ${filters.selected_planet}`
    );

  d3.selectAll("path.boundryArc").attr("opacity", 0.2);
  d3.selectAll("text.permanentMassLabel").attr("opacity", 0);

  drawBoundaryArc(
    selectedPlanetData.mass_multiplier,
    d3.select("#boundary"),
    true
  );
}

function removeAfterHover() {
  d3.selectAll("circle.exoplanet").attr("opacity", 1);
  d3.select("#distanceAngleLine").remove();
  d3.select("#selectedPlanetCenter").remove();
  d3.select("#planetCenter").remove();
  d3.select("#distanceText").remove();
  d3.select("#planetNameText").remove();
  d3.select("#selectedPlanetNameText").remove();
  d3.select("#selectedPlanetMassText").remove();
  d3.selectAll("path.boundryArc").attr("opacity", 1);
  d3.selectAll("text.permanentMassLabel").attr("opacity", 1);
  d3.selectAll("text.hoverMassLabel").remove();
  d3.select("path.tempArc").remove();
}
