// The value for 'accessToken' begins with 'pk...'
mapboxgl.accessToken =
  "pk.eyJ1IjoieWl3ZW56NjY2IiwiYSI6ImNtNXk1czB5bDA5bGkybHIzcWM3NzN2N3QifQ._vIiwie_QUQcaRvTYHEf_w";
const style_02 = "mapbox://styles/yiwenz666/cm6gj8zke00cp01pbd1yy3wg0";
const style_12 = "mapbox://styles/yiwenz666/cm6gkivol00e601s27acu55ma";

const map = new mapboxgl.Map({
  container: "map", // container ID
  style: style_02,
  center: [-0.089932, 51.514441],
  zoom: 14
});

const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");
//On click the radio button, toggle the style of the map.
for (const input of inputs) {
  input.onclick = (layer) => {
    if (layer.target.id == "style_02") {
      map.setStyle(style_02);
    }
    if (layer.target.id == "style_12") {
      map.setStyle(style_12);
    }
  };
}