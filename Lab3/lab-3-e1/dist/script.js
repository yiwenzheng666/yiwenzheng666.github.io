// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoieWl3ZW56NjY2IiwiYSI6ImNtNXk1czB5bDA5bGkybHIzcWM3NzN2N3QifQ._vIiwie_QUQcaRvTYHEf_w";

//Before map02
const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/yiwenz666/cm6gj8zke00cp01pbd1yy3wg0",
  center: [-0.089932, 51.514441],
  zoom: 14
});

//After map12
const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/yiwenz666/cm6gkivol00e601s27acu55ma",
  center: [-0.089932, 51.514441],
  zoom: 14
});

const container = "#comparison-container";
const map = new mapboxgl.Compare(beforeMap, afterMap, container, {});