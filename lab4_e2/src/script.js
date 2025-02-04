// config map
let config = {
  minZoom: 2,
  maxZoom: 18
};
// magnification with which the map will start
const zoom = 4;
// co-ordinates
const lat = 37.8;
const lng = -96;

// calling map, "map-linked" is your map div's id
const map = L.map("map", config).setView([lat, lng], zoom);

// Used to load and display tile layers on the map
// Most tile servers require attribution, which you can set under `Layer`
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//For online GeoJSON file, we will need to fetch it from the source.
const data_url =
  "https://raw.githubusercontent.com/mingshuwang/UoG-GEOG5015/main/features.geojson";

//Define an empty html for the list
let html_list = "";

//Define an empty layer for the GeoJSON
let geoJson;

fetch(data_url)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    //All the later code will go into this function

    //Define the classification and color first
    function getColor(d) {
      return d > 1000
        ? "#800026"
        : d > 500
        ? "#BD0026"
        : d > 200
        ? "#E31A1C"
        : d > 100
        ? "#FC4E2A"
        : d > 50
        ? "#FD8D3C"
        : d > 20
        ? "#FEB24C"
        : d > 10
        ? "#FED976"
        : "#FFEDA0";
    }

    //Apply this to the data
    function style(feature) {
      return {
        fillColor: getColor(feature.properties.density), //this is the field to be colored
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7
      };
    }

    //Add this to the map using the style defined above
    geoJson = L.geoJson(data, { style: style, onEachFeature }).addTo(map);

    //Legend code goes below
    var legend = L.control({ position: "bottomright" });

    legend.onAdd = function (map) {
      //using JS to create a div with id "info legend"
      var div = L.DomUtil.create("div", "info legend");
      const classes = [0, 10, 20, 50, 100, 200, 500, 1000];
      var labels = [];

      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < classes.length; i++) {
        //generate the div for the legend key and label using html
        div.innerHTML +=
          '<i style="background:' +
          getColor(classes[i] + 1) +
          '"></i> ' +
          classes[i] +
          (classes[i + 1] ? "&ndash;" + classes[i + 1] + "<br>" : "+");
      }

      return div;
    };

    //Add legend to map
    legend.addTo(map);

    //Code for the linked panel
    document.getElementById("panel").innerHTML = html_list;

    // Bind event listeners to list items
    //query all the HTML elements for the tag li with class panel.
    let el = document.querySelectorAll("#panel li");

    //Loop over  the list
    for (let i = 0; i < el.length; i++) {
      //For each bullet point in the list, define a mouse over event.
      el[i].addEventListener("mouseover", function (e) {
        //What is being hovered
        const hoveredItem = e.target;
        const layer = geoJson.getLayers();

        //highlight the state by setting its style to the highlight style above.
        layer[i].setStyle(highlightStyle);

        //At the same time, add the CSS with class anme highlight to the list
        hoveredItem.classList.add("highlight");
      });

      //Define behaviour when mouse out.
      el[i].addEventListener("mouseout", function (e) {
        const hoveredItem = e.target;
        const hoveredId = hoveredItem.id;

        //Resetting the styles for both list and map.
        geoJson.resetStyle(geoJson.getLayer(hoveredId));
        hoveredItem.classList.remove("highlight");
      });
    }
  });

//Set a style when the state is hovered
const highlightStyle = {
  weight: 2,
  fillOpacity: 1
};

// Function applied on each polygon load
function onEachFeature(feature, layer) {
  const id = feature.id;
  const name = feature.properties.name;

  //Adding each bullet point in the list and specify the id the same as the id in the dataset
  html_list += `<li id="${id}">${name}</li>`;
  layer.leafletId = id;
  console.log("loading " + id);
  //Define the behaviour when the mouse is on the feature
  layer.addEventListener("mouseover", function (e) {
    //Get the current feature
    let hoveredFeature = e.target;

    //Set the feature to the highlight style
    hoveredFeature.setStyle(highlightStyle);

    console.log(layer.leafletId);
    //Sroll the list to centre on the state being hovered by finding it using its id
    let el = document.getElementById(hoveredFeature.leafletId);
    //sroll the list
    el.scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "center"
    });

    //Make the list item (i.e. state name highlighted) by adding the highlight CSS class
    el.classList.add("highlight");
  });

  //Define the behaviour when the mouse is moving outside of the feature
  layer.addEventListener("mouseout", function (e) {
    //Get the current feature
    let hoveredFeature = e.target;
    //Reset the style for the hovered feature
    geoJson.resetStyle(hoveredFeature);
    //Remove the highlight by finding the right list with id and removing the CSS highlight
    let el = document.getElementById(hoveredFeature.leafletId);
    el.classList.remove("highlight");
  });
}
