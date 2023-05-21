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
        $.when()
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_pedestrians_killed'], "0"]);
    });

    $('#cyclist').click(function () {
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_cyclist_killed'], "0"]);
    });

    $('#motorist').click(function () {
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_motorist_killed'], "0"]);
    });

    $('#all').click(function () {
        map.setFilter('circle-my-points', ['!=', ['get', 'number_of_persons_killed'], "0"]);
    });

    // Add class to selected features
    $('.button').on('click', function () {
        $('.button').removeClass("selected");
        $(this).addClass("selected");
        // when button clicked, close popups
        $('.mapboxgl-popup').remove();
    })

    //add a running total to the main text
    // Convert string property to a number and sum all the values
    var count = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_persons_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    var count_ped = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_pedestrians_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    var count_bike = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_cyclist_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    var count_motor = data.features.reduce(function (sum, feature) {
        var value = parseFloat(feature.properties.number_of_motorist_killed);
        return sum + (isNaN(value) ? 0 : value);
    }, 0);

    //append all names to dom
    var classesAndVariables = [
        { className: 'count', variable: count },
        { className: 'count_ped', variable: count_ped },
        { className: 'count_bike', variable: count_bike },
        { className: 'count_motor', variable: count_motor }
    ];

    classesAndVariables.forEach(function (item) {
        var spans = document.getElementsByClassName(item.className);

        Array.from(spans).forEach(function (span) {
            span.textContent += item.variable;
        });
    });

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
                        'Traffic Control Disregarded',
                        'green',
                        'Alcohol Involvement',
                        'gold',
                        'Pedestrian/Bicyclist/Other Pedestrian Error/Confusion',
                        'blue',
                        'Failure to Yield Right-of-Way',
                        'pink',
                        'Unspecified',
                        'gray',
                    /*other*/ '#000000']
                ],
                'circle-color': [
                    'match',
                    ['get', 'contributing_factor_vehicle_1'],
                    'Unsafe Speed',
                    'red',
                    'Driver Inattention/Distraction',
                    'purple',
                    'Traffic Control Disregarded',
                    'green',
                    'Alcohol Involvement',
                    'gold',
                    'Pedestrian/Bicyclist/Other Pedestrian Error/Confusion',
                    'blue',
                    'Failure to Yield Right-of-Way',
                    'pink',
                    'Unspecified',
                    'gray',
                    /*other*/ '#000000'
                ]
            },
        })

        const layers = [
            'Unsafe Speed',
            'Driver Inattention/Distraction',
            'Traffic Control Disregarded',
            'Alcohol Involvement',
            'Pedestrian/Bicyclist/Other Pedestrian Error/Confusion',
            'Failure to Yield Right-of-Way',
            'Unspecified',
            'Other'
        ];
        const colors = [
            'red',
            'purple',
            'green',
            'gold',
            'blue',
            'pink',
            'gray',
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
        const popup = new mapboxgl.Popup()
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


    //Make D3 chart!

    // Select the existing container with the id "chart"
    const chartContainer = d3.select('#chart');

    // Define the dimensions and margins of the chart
    const margin = { top: 30, right: 20, bottom: 30, left: 136 };
    const containerWidth = chartContainer.node().getBoundingClientRect().width;
    const width = containerWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create an SVG element for the chart inside the existing container
    const svg = chartContainer
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Count the occurrences of each category
    const counts = d3.rollups(
        data.features,
        v => v.length,
        d => d.properties.contributing_factor_vehicle_1
    );

    // Combine categories with less than one observation into an "Other" category
    const minimumObservations = 2;
    let combinedCounts = counts.filter(d => d[1] >= minimumObservations);
    const otherCategories = counts.filter(d => d[1] < minimumObservations);
    if (otherCategories.length > 0) {
        const otherCount = otherCategories.reduce((acc, curr) => acc + curr[1], 0);
        combinedCounts.push(['Other', otherCount]);
    }

    combinedCounts.sort((a, b) => b[1] - a[1]);

    const colorScale = d3
        .scaleOrdinal()
        .domain([
            'Unsafe Speed',
            'Driver Inattention/Distraction',
            'Traffic Control Disregarded',
            'Alcohol Involvement',
            'Pedestrian/Bicyclist/Other Pedestrian Error/Confusion',
            'Failure to Yield Right-of-Way',
            'Unspecified',
            'Other',
        ])
        .range(['red', 'purple', 'green', 'gold', 'blue', 'pink', 'gray', '#000000']);


    // Set up the y and x scales
    const y = d3.scaleBand()
        .domain(combinedCounts.map(d => d[0]))
        .range([0, height])
        .padding(0.1);

    const x = d3.scaleLinear()
        .domain([0, d3.max(combinedCounts, d => d[1])])
        .range([0, width]);

    // Create the bars of the bar chart
    svg.selectAll('.bar')
        .data(combinedCounts)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('width', d => x(d[1]))
        .attr('y', d => y(d[0]))
        .attr('height', y.bandwidth())
        .style('fill', d => colorScale(d[0]));
        ;

    // Add y-axis to the chart
    svg.append('g')
        .call(d3.axisLeft(y))
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll('.tick text')
        .text(d => {
          if (d === 'Pedestrian/Bicyclist/Other Pedestrian Error/Confusion') {
            return 'Ped/Bike Error/Confusion';
          }
          return d;
        });

    // Add x-axis to the chart
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add a title to the chart
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0 - (margin.top / 2))
        .attr('text-anchor', 'middle')
        .text('Total accidents by cause');


});





