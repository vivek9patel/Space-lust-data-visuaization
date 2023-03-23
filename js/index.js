var planet_data = [];

var width = {
  svg: 900,
};

var height = {
  svg: 750,
};

var outerRadius = 340;

const earthRadius = 10, constantRadiusMultiplier = 0.8;

var angleScale, arcMassScale, arcIncrementScale;

var planetToCompare = "Earth"; // 'Earth' or 'Jupiter'

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

var svg = d3.select("svg");

document.addEventListener("DOMContentLoaded", async () => {
  await modifyData();
  drawEverything();
});

const getCSVdata = () => Promise.all([d3.csv("data/cleaned_5250.csv")]);

async function modifyData() {
  const [raw_data] = await getCSVdata();

  planet_data = raw_data.filter((d) => {
    if (d.radius_wrt != planetToCompare || d.mass_wrt != planetToCompare) {
      return false;
    }
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

  planet_data.forEach((d) => {
    // convert string to number
    d.distance = +d.distance;
    d.stellar_magnitude = +d.stellar_magnitude;
    d.discovery_year = +d.discovery_year;
    d.mass_multiplier = +d.mass_multiplier;
    d.radius_multiplier = +d.radius_multiplier;
    d.orbital_radius = +d.orbital_radius;
    d.orbital_period = +d.orbital_period;
    d.eccentricity = +d.eccentricity;
  });
}

window.addEventListener("resize", () => {
  svg.selectAll("*").remove();
  drawEverything();
});

function drawEverything() {
  calculateSVGDimentions()
  svg.attr("width", width.svg).attr("height", height.svg)
  drawStaticChart();
  drawExoplanets();
}

function calculateSVGDimentions() {

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  width = {
    svg: windowWidth - Math.min(windowWidth * 0.4, 500),
  };
  
  height = {
    svg: windowHeight - 20,
  };
  
  outerRadius = height.svg / 2 - 100;
}

function drawStaticChart() {
  svg
    .append("circle")
    .attr("id", "selectedPlanet")
    .attr("cx", width.svg / 2)
    .attr("cy", height.svg / 2)
    .attr("r", earthRadius)
    .attr("fill", () => {
      if (planetToCompare == "Jupiter") {
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
    .range([Math.PI/2, 2.5 * Math.PI]);

  arcIncrementScale = d3
    .scaleLinear()
    .domain([0, maxMass])
    .range([0, 30]);


  const g = svg
    .append("g")
    .attr("id", "boundary")
    .attr("transform", `translate(${width.svg / 2}, ${height.svg / 2})`);

  const totalArcs = maxMass/100;

  for (var i = 0; i < maxMass; i += totalArcs) {
    drawBoundaryArc(i,g);
  }
}

function drawBoundaryArc(mass,g,temp=false){
  const arc = d3
  .arc()
  .innerRadius(outerRadius)
  .outerRadius(outerRadius+arcIncrementScale(mass))
  .startAngle(arcMassScale(mass))
  .endAngle(arcMassScale(mass + 0.2));

g.append("path")
  .attr("class", `boundryArc ${temp ? "tempArc" : ""}`)
  .attr("d", arc)
  .attr("fill", "none")
  .attr("stroke", "white")
  .attr("stroke-width", 1);
}

function drawExoplanets() {
  const earthPadding = 10;
  const maxDistance = d3.max(planet_data, (d) => d.distance);
  var maxPlanetRadius = d3.max(
    planet_data,
    (d) => d.radius_multiplier * earthRadius * constantRadiusMultiplier
  );
  const maxMass = d3.max(planet_data, (d) => d.mass_multiplier);
  const minMass = d3.min(planet_data, (d) => d.mass_multiplier);

  drawBoundry(minMass, maxMass);

  angleScale = d3
    .scaleLinear()
    .domain([minMass, maxMass])
    .range([0, 2 * Math.PI]);

  const xDistnaceScale = d3
    .scaleLinear()
    .domain([0, maxDistance])
    .range([
      width.svg / 2 + earthRadius + maxPlanetRadius + earthPadding,
      width.svg / 2 + outerRadius - maxPlanetRadius,
    ]);

  const yDistnaceScale = d3
    .scaleLinear()
    .domain([0, maxDistance])
    .range([
      height.svg / 2 + earthRadius + maxPlanetRadius + earthPadding,
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

  const getCX = (d) => {
    const angle = angleScale(d.mass_multiplier);
    return cosTopixelScale(xDistnaceScale(d.distance) * Math.cos(angle));
  };

  const getCY = (d) => {
    const angle = angleScale(d.mass_multiplier);
    return sinTopixelScale(yDistnaceScale(d.distance) * Math.sin(angle));
  };

  // display mass labels around the outerRedius in increasing order
  const totalDivisions = parseInt(maxMass / 6) + 1;
  for (let i = 0; i < maxMass; i += totalDivisions) {
    const angle = angleScale(i);
    const x = width.svg / 2 + (outerRadius + 50) * Math.cos(angle);
    const y = height.svg / 2 + (outerRadius + 50) * Math.sin(angle);

    drawMassLable(x, y, parseInt(i));
    drawAngleLine(
      width.svg / 2 + outerRadius * Math.cos(angle),
      height.svg / 2 + outerRadius * Math.sin(angle)
    );
  }

  // Drawing all the exoplanets
  const planet = svg
    .selectAll("circle.exoplanet")
    .data(planet_data)
    .enter()
    .append("circle")
    .attr("class", "exoplanet")
    .attr("cx", getCX)
    .attr("cy", getCY)
    .attr("r", (d) => {
      return d.radius_multiplier * earthRadius * constantRadiusMultiplier;
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

  // Drawing the max mass label
  const angle = angleScale(maxMass);
  const maxMassLabelX = width.svg / 2 + (outerRadius + 75) * Math.cos(angle);
  const maxMassLabelY = height.svg / 2 + (outerRadius + 75) * Math.sin(angle);
  drawMassLable(maxMassLabelX, maxMassLabelY, ` , ${maxMass}`);
}

function drawMassLable(x, y, label) {
  svg
    .append("text")
    .attr("class", "massLabel deaconBlue")
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
    .attr("id", "earthCenter")
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
    .attr("class", "deaconBlue")
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
          earthRadius *
          constantRadiusMultiplier +
        20
    )
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .text(`${selectedPlanetData.name}`);

  svg
    .append("text")
    .attr("id", "selectedPlanetNameText")
    .attr("x", width.svg / 2)
    .attr("y", height.svg / 2 + 30)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .text(planetToCompare);

  svg
    .append("text")
    .attr("id", "selectedPlanetMassText")
    .attr("class", "deaconBlue")
    .attr("x", width.svg / 2)
    .attr("y", height.svg / 2 - outerRadius / 2 + 40)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "white")
    .style("font-size", "24px")
    .text(`${selectedPlanetData.mass_multiplier} times heavier than ${planetToCompare}`);

    d3.selectAll("path.boundryArc").attr("opacity", 0.2);

    drawBoundaryArc(selectedPlanetData.mass_multiplier, d3.select("#boundary"),true);

}

function removeAfterHover() {
  d3.selectAll("circle.exoplanet").attr("opacity", 1);
  d3.select("#distanceAngleLine").remove();
  d3.select("#earthCenter").remove();
  d3.select("#planetCenter").remove();
  d3.select("#distanceText").remove();
  d3.select("#planetNameText").remove();
  d3.select("#selectedPlanetNameText").remove();
  d3.select("#selectedPlanetMassText").remove();
  d3.selectAll("path.boundryArc").attr("opacity", 1);
  d3.select("path.tempArc").remove();
}
