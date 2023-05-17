// a map of all motor vehicle crashes where people were killed in the past year

//grab data from open data portal
$.ajax({
    url: "https://data.cityofnewyork.us/resource/h9gi-nx95.geojson",
    type: "GET",
    async: "false",
    data: {
        "$limit": 5000,
        "$$app_token": "2CyYsCwXD8tqO7Tn1vaeQwcxz",
        "$where": "number_of_persons_killed > 0 AND crash_date > '2023-01-01T00:00:00.000'"
    }
}).done(function (data) {

    mapboxgl.accessToken = 'pk.eyJ1IjoicHNwYXVzdGVyIiwiYSI6ImNsZ2JxN3p4djAyZDkzZ3BmOGR1ZTVhcWQifQ.499a8nIbNZgnjPf0qIGx8g';
    const NYC_COORDINATES = [-74.00214, 40.71882]

    // Attach click event handlers to the buttons
    $('#pedestrians').click(function () {
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_pedestrians_killed'], "0"]);
    });

    $('#cyclist').click(function () {
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_cyclist_killed'], "0"]);
    });

    $('#motorist').click(function () {
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_motorist_killed'], "0"]);
    });

    $('#all').click(function () {
        map.setFilter('circle-my-points', null);
    });

    // Add class to selected features
    $('.button').on('click', function () {
        $('.button').removeClass("selected")
        $(this).addClass("selected")
    })

    //add a running total to the main text
    // Convert string property to a number and sum all the values
    var count = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_persons_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    document.getElementById('count').innerHTML = count;

    var count_ped = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_pedestrians_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    document.getElementById('count_ped').innerHTML = count_ped;

    var count_bike = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_cyclist_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    document.getElementById('count_bike').innerHTML = count_bike;

    var count_motor = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_motorist_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    document.getElementById('count_motor').innerHTML = count_motor;

    //set up map
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
        style: 'mapbox://styles/mapbox/light-v11', // style URL
        center: NYC_COORDINATES, // starting position [lng, lat]
        zoom: 10, // starting zoom
        bearing: 0,
        pitch: 0
    });



    //add sources and layers
    map.on('load', function () {

        map.addSource('my-points', {
            type: 'geojson',
            data: data,
            generateId: true
        })

        map.addLayer({
            id: 'circle-my-points',
            type: 'circle',
            source: 'my-points',
            paint: {
                'circle-opacity': 0.6,
                'circle-stroke-width': 1,
                'circle-stroke-color': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    "white", //add white outline on hover
                    ['match', //otherwise outline is the same as circle color
                        ['get', 'contributing_factor_vehicle_1'],
                        'Unsafe Speed',
                        'red',
                        'Driver Inattention/Distraction',
                        'purple',
                        'Driver Inexperience',
                        'green',
                        'Traffic Control Disregarded',
                        'gold',
                        'Oversized Vehicle',
                        'blue',
                    /*other*/ '#000000']
                ],
                'circle-color': [
                    'match',
                    ['get', 'contributing_factor_vehicle_1'],
                    'Unsafe Speed',
                    'red',
                    'Driver Inattention/Distraction',
                    'purple',
                    'Driver Inexperience',
                    'green',
                    'Traffic Control Disregarded',
                    'gold',
                    'Oversized Vehicle',
                    'blue',
                    /*other*/ '#000000'
                ]
            },
        })

        const layers = [
            'Unsafe Speed',
            'Driver Inattention/Distraction',
            'Driver Inexperience',
            'Traffic Control Disregarded',
            'Oversized Vehicle',
            'Other/Unspecified',
        ];
        const colors = [
            'red',
            'purple',
            'green',
            'gold',
            'blue',
            'black'
        ];


        // create legend
        const legend = document.getElementById('legend');

        layers.forEach((layer, i) => {
            const color = colors[i];
            const item = document.createElement('div');
            const key = document.createElement('span');
            key.className = 'legend-key';
            key.style.backgroundColor = color;

            const value = document.createElement('span');
            value.innerHTML = `${layer}`;
            item.appendChild(key);
            item.appendChild(value);
            legend.appendChild(item);
        });


    })

    //create popups and conditional sentence for each point
    map.on('click', 'circle-my-points', (e) => {

        // conditional logic for sentence
        var singPlural = "people"
        var verb = "were"
        if (e.features[0].properties.number_of_persons_killed === '1') {
            var singPlural = "person"
            var verb = "was"
        }


        //popups
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`${e.features[0].properties.number_of_persons_killed} ${singPlural} ${verb} killed by a ${e.features[0].properties.vehicle_type_code1.toLowerCase()} due to ${e.features[0].properties.contributing_factor_vehicle_1.toLowerCase()} at ${moment(e.features[0].properties.crash_time, "hh:mm").format("h:mm a")} on ${moment(e.features[0].properties.crash_date).format("dddd, MMMM Do")}`)
            .addTo(map)
    });


    let hoveredStateId = null

    // update featurestate when the mouse moves around within the points layer
    map.on('mousemove', 'circle-my-points', (e) => {
        if (e.features.length > 0) {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: 'my-points', id: hoveredStateId },
                    { hover: false }
                );
                map.getCanvas().style.cursor = 'pointer';
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                { source: 'my-points', id: hoveredStateId },
                { hover: true }
            );
        }
    });

    // when the mouse leaves the points layer, make sure nothing has the hover featurestate
    map.on('mouseleave', 'circle-my-points', () => {
        if (hoveredStateId !== null) {
            map.setFeatureState(
                { source: 'my-points', id: hoveredStateId },
                { hover: false }
            );
            map.getCanvas().style.cursor = '';
        }
        hoveredStateId = null;
    });

});





