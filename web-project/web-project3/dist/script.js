mapboxgl.accessToken = 'pk.eyJ1IjoieWl3ZW56NjY2IiwiYSI6ImNtNXk1czB5bDA5bGkybHIzcWM3NzN2N3QifQ._vIiwie_QUQcaRvTYHEf_w'; // 替换为你的 Mapbox Token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v11',
    center: [-0.1276, 51.5074], // 这里替换为你的数据中心
    zoom: 10
});



map.addControl(new mapboxgl.NavigationControl());

const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// 颜色映射
const gradeColors = {
    'I': '#ff0000',  
    'II*': '#ffa500', 
    'II': '#008000',  
    'default': '#cccccc'
};

map.on('load', function () {
    map.addSource('parks', {
        type: 'vector',
        url: 'mapbox://yiwenz666.7qm56kvg' // 替换为你的 Tileset ID
      
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

 
  // 处理鼠标悬停的 Popup
let hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// 处理点击的 Popup
let clickPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false // 点击地图其他地方时不会自动关闭
});

map.on('mousemove', 'parks-layer', function (e) {
    if (e.features.length > 0) {
        let name = e.features[0].properties.Name;
        hoverPopup.setLngLat(e.lngLat).setHTML(`<strong>${name}</strong>`).addTo(map);
    }
});

// 当鼠标移出时，隐藏 hoverPopup
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

    // 处理日期格式
    let regDateFormatted = regDateRaw && regDateRaw.length === 8
        ? `${regDateRaw.substring(0,4)}.${regDateRaw.substring(4,6)}.${regDateRaw.substring(6,8)}`
        : "N/A";

    // 关闭之前的 popup（如果有的话）
    clickPopup.remove();

    // 创建新的 Popup
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

        // 清除之前选中的按钮样式
        document.querySelectorAll('.grade-filter button').forEach(b => b.classList.remove('active'));
        this.classList.add('active'); // 高亮当前选中的按钮

        if (selectedGrade === "ALL") {
            // 显示所有花园（取消过滤）
            map.setFilter('parks-layer', null);
        } else {
            // 只显示选中的等级花园，完全隐藏其他图斑
            map.setFilter('parks-layer', ['==', ['get', 'Grade'], selectedGrade]);
        }
    });
});



    
  
  document.getElementById('regDateSlider').min = 1980;
document.getElementById('regDateSlider').max = 2025;
document.getElementById('regDateSlider').value = 2025; // 默认值设为2025

document.getElementById('regDateSlider').addEventListener('input', function () {
    let selectedYear = parseInt(this.value);
    document.getElementById('regYearDisplay').innerText = selectedYear;

    // 只显示 <= selectedYear 的公园
    map.setFilter('parks-layer', ['<=', ['to-number', ['slice', ['get', 'RegDate'], 0, 4]], selectedYear]);
});


  document.getElementById('searchButton').addEventListener('click', function () {
    let query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert("请输入搜索地点");
        return;
    }

    // 调用 Mapbox Geocoding API 进行地点搜索
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=GB&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data.features.length > 0) {
                let place = data.features[0];
                let coordinates = place.geometry.coordinates;
                let placeName = place.place_name;

                // 如果已有 Marker，先移除
                if (window.searchMarker) {
                    window.searchMarker.remove();
                }

                // 创建新的 Marker
                window.searchMarker = new mapboxgl.Marker({ color: 'red' })
                    .setLngLat(coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(`<b>${placeName}</b>`))
                    .addTo(map);

                // 地图飞到该地点
                map.flyTo({
                    center: coordinates,
                    zoom: 14,
                    essential: true
                });

            } else {
                alert("未找到匹配地点，请尝试不同的名称");
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

    navigator.geolocation.getCurrentPosition(function (position) {
        let userLocation = [position.coords.longitude, position.coords.latitude];

        // 如果已有 Marker，先移除
        if (window.userMarker) {
            window.userMarker.remove();
        }

        // 在地图上添加用户位置的 Marker（蓝色）
        window.userMarker = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat(userLocation)
            .setPopup(new mapboxgl.Popup().setHTML(`<b>You are here!</b>`))
            .addTo(map);

        // 地图飞到用户位置
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

// 各个 Grade 的介绍信息
const gradeDescriptions = {
    "I": "Grade I: Parks and gardens of exceptional historic interest. These are the most significant landscapes, representing only a small percentage of all listed sites. They are considered of national or even international importance.",
    "II*": "Grade II*: Particularly important sites of more than special interest. These landscapes are of high historical and architectural significance, but not as rare or exceptional as Grade I sites.",
    "II": "Grade II: Parks and gardens of special interest. This is the most common grade, covering a large proportion of historically significant designed landscapes that contribute to the nation’s heritage.",
    "ALL": "Showing all historic gardens and parks."
};

// 更新介绍文本
document.querySelectorAll('.grade-filter button').forEach(btn => {
    btn.addEventListener('click', function () {
        let selectedGrade = this.getAttribute('data-grade');
        gradeInfo.innerText = gradeDescriptions[selectedGrade] || "Select a grade to see more details.";
    });
});