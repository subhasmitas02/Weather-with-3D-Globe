// globe.js - Handling globe initialization and location plot


function showLocationOnGlobe(lat, lon) {
    const globe = new ThreeGlobe();
    console.log(globe);
    document.getElementById('globe-container').appendChild(globe);

    globe
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bubblesData([
            {
                lat: lat,
                lng: lon,
                size: 0.1,
                color: 'red'
            }
        ])
        .bubblesMaxRadius(0.1)
        .arcsData([])
        .showGraticules(true)
        .onGlobeClick(function (point) {
            console.log('Clicked on', point);
        });

    globe.controls().enableZoom = true; // Enable zooming
}
