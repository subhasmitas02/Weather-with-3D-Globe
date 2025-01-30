const apiKey = "69c8728e6343f9187a87b69393c3d4b6"; // OpenWeatherMap API key
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&"; // Weather API URL
const geoApiUrl = "https://open-weather13.p.rapidapi.com/city"; // Corrected RapidAPI Geo API URL
const rapidApiHost = "open-weather13.p.rapidapi.com"; // RapidAPI Geo API host
const rapidApiKey = "82e863c681msh6372ba0a68a7558p17dff3jsn18d20463ae73"; //"8ff80481a7msha6df5f218296c87p1dac6cjsne40a0442185d"; // RapidAPI key

const searchBox = document.querySelector("#searchBox");
const searchBtn = document.querySelector(".search-button");
const weatherIcon = document.querySelector(".weather-now-img");

// Function to show suggestions
function showSuggestions(cities, value) {
    let autocompleteList = document.getElementById('autocomplete-list');
    let filteredCities = cities.filter(city => city.name.toLowerCase().startsWith(value)).slice(0, 5);
    filteredCities.forEach(city => {
        let item = document.createElement('div');
        item.innerHTML = `<strong>${city.name.substr(0, value.length)}</strong>${city.name.substr(value.length)}`;
        item.innerHTML += `<input type='hidden' value='${city.name}'>`;
        item.addEventListener('click', function() {
            searchBox.value = this.getElementsByTagName('input')[0].value;
            closeAllLists();
            checkWeather(this.getElementsByTagName('input')[0].value);
        });
        autocompleteList.appendChild(item);
    });
}

// Function to close all autocomplete lists
function closeAllLists(elmnt) {
    const items = document.querySelectorAll('.autocomplete-items div');
    for (let i = 0; i < items.length; i++) {
        if (elmnt != items[i] && elmnt != searchBox) {
            items[i].parentNode.removeChild(items[i]);
        }
    }
}

// Load the JSON data
fetch('cities_data.json')
    .then(response => response.json())
    .then(cities => {
        searchBox.addEventListener('input', function() {
            let value = this.value.toLowerCase();
            closeAllLists();
            if (value) {
                showSuggestions(cities, value);
            }
        });

        // Show suggestions for cities starting with 'A' when the search box is clicked
        searchBox.addEventListener('click', function() {
            showSuggestions(cities, 'a');
        });

        // Close the list if the user clicks outside of it
        document.addEventListener('click', function (e) {
            closeAllLists(e.target);
        });

        // Load initial state
        window.addEventListener('load', () => {
            document.querySelector('.before-search').style.display = 'block';
            document.querySelector('.after-search').style.display = 'none';
            document.querySelector('.error').style.display = 'none';
        });
    })
    .catch(error => console.error('Error loading JSON:', error));

// Initialize the globe
const globeContainer = document.getElementById("globe-container");
if (globeContainer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, globeContainer.clientWidth / globeContainer.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
    globeContainer.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(50, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg', (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const globe = new THREE.Mesh(geometry, material);
        scene.add(globe);

        camera.position.z = 150;

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        async function addWeatherMarker(lat, lon) {
            // Remove existing markers
            scene.children = scene.children.filter(child => !(child instanceof THREE.Mesh && child !== globe));
        
            // Create new marker
            const markerGeometry = new THREE.SphereGeometry(2, 32, 32); // Larger marker
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 'red' });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
            // Accurate conversion of lat/lon to spherical coordinates
            const radius = 50; // Radius of the globe
            const phi = (90 - lat) * Math.PI / 180;
            const theta = (lon + 180) * Math.PI / 180;
        
            marker.position.x = radius * Math.sin(phi) * Math.cos(theta);
            marker.position.y = radius * Math.cos(phi);
            marker.position.z = radius * Math.sin(phi) * Math.sin(theta);
        
            scene.add(marker);
        
            // Rotate and zoom the globe to the location
            gsap.to(camera.position, {
                duration: 2,
                x: marker.position.x * 2.5,
                y: marker.position.y * 2.5,
                z: marker.position.z * 2.5,
                onUpdate: () => {
                    camera.lookAt(marker.position);
                    controls.update();
                }
            });
        
            // Optionally add a label or icon for better visibility
            const labelDiv = document.createElement('div');
            labelDiv.style.position = 'absolute';
            labelDiv.style.color = 'red';
            labelDiv.style.fontSize = '24px';
            labelDiv.innerHTML = '';
            document.body.appendChild(labelDiv);
        
            function updateLabelPosition() {
                const vector = marker.position.clone();
                vector.project(camera);
                const x = Math.round((0.5 + vector.x / 2) * globeContainer.clientWidth);
                const y = Math.round((0.5 - vector.y / 2) * globeContainer.clientHeight);
                labelDiv.style.left = `${x}px`;
                labelDiv.style.top = `${y}px`;
            }
        
            renderer.domElement.addEventListener('mousemove', updateLabelPosition);
            updateLabelPosition();
        }
        
        
        
        
        

        // Fetching weather details from weather API
        async function checkWeather(city) {
            console.log("Checking weather for:", city);

            try {
                // Fetch geo coordinates for the city using RapidAPI Geo API
                const geoResponse = await fetch(`${geoApiUrl}/${city}/EN`, {
                    method: "GET",
                    headers: {
                        "X-RapidAPI-Host": rapidApiHost,
                        "X-RapidAPI-Key": rapidApiKey
                    }
                });

                if (!geoResponse.ok) {
                    throw new Error(`GeoAPI request failed with status ${geoResponse.status}`);
                }

                const geoData = await geoResponse.json();
                console.log("GeoAPI response:", geoData);

                if (geoData.name.toLowerCase() === city.toLowerCase()) {
                    const { name, coord: { lat, lon } } = geoData;
                    console.log(`Using location: ${name}, lat: ${lat}, lon: ${lon}`);

                    // Fetch weather data using coordinates
                    const weatherResponse = await fetch(apiUrl + `lat=${lat}&lon=${lon}&appid=${apiKey}`);
                    if (!weatherResponse.ok) {
                        throw new Error(`Weather API request failed with status ${weatherResponse.status}`);
                    }

                    const weatherData = await weatherResponse.json();
                    console.log("Weather data received:", weatherData);

                    // Display weather information
                    const cityElem = document.querySelector(".city");
                    const tempElem = document.querySelector(".temp");
                    const humidityElem = document.querySelector(".humidity-amount");
                    const windElem = document.querySelector(".wind-amount");

                    if (cityElem && tempElem && humidityElem && windElem) {
                        cityElem.innerHTML = weatherData.name;
                        tempElem.innerHTML = Math.round(weatherData.main.temp) + "°c";
                        humidityElem.innerHTML = weatherData.main.humidity + "%";
                        windElem.innerHTML = weatherData.wind.speed + " km/h";
                    } else {
                        console.error("Some elements are missing in the DOM.");
                    }

                    // Set weather icon
                    if (weatherData.weather[0].main === "Clouds")
                        weatherIcon.src = "assets/weather images/cloud.png";
                    else if (weatherData.weather[0].main === "Haze")
                        weatherIcon.src = "assets/weather images/haze.png";
                    else if (weatherData.weather[0].main === "Mist")
                        weatherIcon.src = "assets/weather images/mist.png";
                    else if (weatherData.weather[0].main === "Rain")
                        weatherIcon.src = "assets/weather images/rain.png";
                    else if (weatherData.weather[0].main === "Snow")
                        weatherIcon.src = "assets/weather images/snow.png";
                    else if (weatherData.weather[0].main === "Clear")
                        weatherIcon.src = "assets/weather images/sun.png";
                    else if (weatherData.weather[0].main === "Wind")
                        weatherIcon.src = "assets/weather images/wind.png";
        

                    // Display sections
                    document.querySelector(".after-search").style.display = "block";
                    document.querySelector(".error").style.display = "none";
                    document.querySelector(".before-search").style.display = "none";

                    // Add marker to globe and rotate to it
                    addWeatherMarker(lat, lon);
                } else {
                    console.log("City not found:", city);
                    console.log("City not found:", city);
                    document.querySelector(".error").style.display = "block";
                    document.querySelector(".after-search").style.display = "none";
                    document.querySelector(".before-search").style.display = "none";
                }
            } catch (error) {
                console.error("Error:", error.message);
                document.querySelector(".error").style.display = "block";
                document.querySelector(".after-search").style.display = "none";
                document.querySelector(".before-search").style.display = "none";
            }
        }

        // Adding event listener for clicking search button
        searchBtn.addEventListener("click", () => {
            console.log("Search button clicked");
            console.log("Input value:", searchBox.value);
            const city = searchBox.value.trim(); // Trim any whitespace from the input
            if (city) {
                checkWeather(city);
            } else {
                console.log("No city name entered");
                // Optionally show an error message or feedback to the user
            }
        });

        // Adding event listener for Enter key press
        searchBox.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                console.log("Enter key pressed");
                const city = searchBox.value.trim(); // Trim any whitespace from the input
                if (city)
                    checkWeather(city);
                else
                    console.log("No city name entered"); // Optionally show an error message or feedback to the user
            }
        });

        // Adding event listener for refreshing the web page
        window.addEventListener("load", () => {
            console.log("Window loaded");
            document.querySelector(".before-search").style.display = "block";
            document.querySelector(".after-search").style.display = "none";
            document.querySelector(".error").style.display = "none";
        });

        // Function to set sun or moon image as per day/night at the top left corner
        function setDayNightIcon() {
            const hour = new Date().getHours();
            const dayNightIcon = document.querySelector(".header img");
            if (hour >= 6 && hour < 18) {
                dayNightIcon.src = "assets/images/sun.png";
            } else {
                dayNightIcon.src = "assets/images/moon1.png";
            }
        }
    });
}
