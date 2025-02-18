mapboxgl.accessToken = 'pk.eyJ1IjoieWl3ZW56NjY2IiwiYSI6ImNtNXk1czB5bDA5bGkybHIzcWM3NzN2N3QifQ._vIiwie_QUQcaRvTYHEf_w'; // Mapbox Token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: [-0.1276, 51.5074], 
    zoom: 10
});



map.addControl(new mapboxgl.NavigationControl());

const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// Color mapping
const gradeColors = {
    'I': '#ff0000',  
    'II*': '#ffa500', 
    'II': '#008000',  
    'default': '#cccccc'
};

map.on('load', function () {
    map.addSource('parks', {
        type: 'vector',
        url: 'mapbox://yiwenz666.7qm56kvg' // Tileset ID
      
    });

    map.addLayer({
        'id': 'parks-layer',
        'type': 'fill',
        'source': 'parks',
        'source-layer': 'park-64h0dw', 
      'paint': {
           'fill-color': [
               'match',
               ['get', 'Grade'],
                'I', gradeColors['I'],
                'II*', gradeColors['II*'],
                'II', gradeColors['II'],
               gradeColors['default']
            ],
            'fill-opacity': 0.6,
            'fill-outline-color': '#000000'
        }
    });

 
  // Handles Popup for mouse hover
let hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// Handle the Popup of the click
let clickPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false // Clicking elsewhere on the map does not automatically close
});

map.on('mousemove', 'parks-layer', function (e) {
    if (e.features.length > 0) {
        let name = e.features[0].properties.Name;
        hoverPopup.setLngLat(e.lngLat).setHTML(`<strong>${name}</strong>`).addTo(map);
    }
});

// Hide the hoverPopup when the mouse moves out
map.on('mouseleave', 'parks-layer', function () {
    hoverPopup.remove();
});

map.on('click', 'parks-layer', function (e) {
    let feature = e.features[0];
    let name = feature.properties.Name;
    let regDateRaw = feature.properties.RegDate;
    let area = feature.properties.area_ha.toFixed(2);
    let grade = feature.properties.Grade;
    let link = feature.properties.hyperlink;

    // Processing date format
    let regDateFormatted = regDateRaw && regDateRaw.length === 8
        ? `${regDateRaw.substring(0,4)}.${regDateRaw.substring(4,6)}.${regDateRaw.substring(6,8)}`
        : "N/A";

    // Close previous popup (if any)
    clickPopup.remove();

    // create new Popup
    clickPopup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false })
        .setLngLat(e.lngLat)
        .setHTML(`
            <strong>${name}</strong><br>
            📅 Registration Date: ${regDateFormatted}<br>
            📏 Area: ${area} ha<br>
            🏛️ Grade: ${grade}<br>
            🔗 <a href="${link}" target="_blank">More Info</a>
        `)
        .addTo(map);
});


 
document.querySelectorAll('.grade-filter button').forEach(btn => {
    btn.addEventListener('click', function () {
        let selectedGrade = this.getAttribute('data-grade');

        // Clear the previously selected button style
        document.querySelectorAll('.grade-filter button').forEach(b => b.classList.remove('active'));
        this.classList.add('active'); // high light the current button

        if (selectedGrade === "ALL") {
            // Show all gardens (unfiltered)
            map.setFilter('parks-layer', null);
        } else {
            // Show only the selected rank garden, completely hiding other patches
            map.setFilter('parks-layer', ['==', ['get', 'Grade'], selectedGrade]);
        }
    });
});



    
  
  document.getElementById('regDateSlider').min = 1980;
document.getElementById('regDateSlider').max = 2025;
document.getElementById('regDateSlider').value = 2025; // The default value is 2025

document.getElementById('regDateSlider').addEventListener('input', function () {
    let selectedYear = parseInt(this.value);
    document.getElementById('regYearDisplay').innerText = selectedYear;

    // Only parks for <= selectedYear are displayed
    map.setFilter('parks-layer', ['<=', ['to-number', ['slice', ['get', 'RegDate'], 0, 4]], selectedYear]);
});


  document.getElementById('searchButton').addEventListener('click', function () {
    let query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert("Please enter the search location");
        return;
    }

    // Call the Mapbox Geocoding API for location search
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=GB&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                let place = data.features[0];
                let coordinates = place.geometry.coordinates;
                let placeName = place.place_name;

                // If there are already markers, remove them first
                if (window.searchMarker) {
                    window.searchMarker.remove();
                }

                // Create new Marker
                window.searchMarker = new mapboxgl.Marker({ color: 'red' })
                    .setLngLat(coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(`<b>${placeName}</b>`))
                    .addTo(map);

                // Map fly to the location
                map.flyTo({
                    center: coordinates,
                    zoom: 14,
                    essential: true
                });

            } else {
                alert("No matching location found, please try a different name");
            }
        })
        .catch(error => console.error('Error fetching location:', error));
});

  // Custom legend
    const legend = document.getElementById('legend');
    Object.keys(gradeColors).forEach(grade => {
        let color = gradeColors[grade];
        let item = document.createElement('div');
        item.innerHTML = `<span style="background-color:${color};width:15px;height:15px;display:inline-block;margin-right:5px;"></span> ${grade}`;
        legend.appendChild(item);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const helpButton = document.getElementById("help-button");
    const helpSidebar = document.getElementById("help-sidebar");
    const closeHelpButton = document.getElementById("close-help");

    // Show help sidebar
    helpButton.addEventListener("click", function () {
        helpSidebar.style.right = "0"; // Slide in
    });

    // Hide help sidebar
    closeHelpButton.addEventListener("click", function () {
        helpSidebar.style.right = "-320px"; // Slide out
    });
});

document.getElementById('locateMe').addEventListener('click', function () {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
  
 //current loction    
  navigator.geolocation.getCurrentPosition(function (position) {
        let userLocation = [position.coords.longitude, position.coords.latitude];

        // If there are already markers, remove them first
        if (window.userMarker) {
            window.userMarker.remove();
        }

        // Add a Marker of the user's location on the map (blue)
        window.userMarker = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat(userLocation)
            .setPopup(new mapboxgl.Popup().setHTML(`<b>You are here!</b>`))
            .addTo(map);

        // Map flies to user location
        map.flyTo({
            center: userLocation,
            zoom: 14,
            essential: true
        });

    }, function () {
        alert("Unable to retrieve your location");
    });
});


const gradeInfo = document.getElementById("grade-info");

// Information about each Grade
const gradeDescriptions = {
    "I": "Grade I: Parks and gardens of exceptional historic interest. These are the most significant landscapes, representing only a small percentage of all listed sites. They are considered of national or even international importance.",
    "II*": "Grade II*: Particularly important sites of more than special interest. These landscapes are of high historical and architectural significance, but not as rare or exceptional as Grade I sites.",
    "II": "Grade II: Parks and gardens of special interest. This is the most common grade, covering a large proportion of historically significant designed landscapes that contribute to the nation’s heritage.",
    "ALL": "Showing all historic gardens and parks."
};

// Update introductory text
document.querySelectorAll('.grade-filter button').forEach(btn => {
    btn.addEventListener('click', function () {
        let selectedGrade = this.getAttribute('data-grade');
        gradeInfo.innerText = gradeDescriptions[selectedGrade] || "Select a grade to see more details.";
    });
});