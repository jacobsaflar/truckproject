function initMap () {
    // Sets up div with map element
    const map = document.getElementById('map');
    const cedcord = {lat: 32.8283571942533, lng: -116.96328834243238 }   ; 
    const displaymap = new google.maps.Map(map, {
        zoom: 8,
        center: cedcord
    });
    //Finished Map

    const addresses = [];
    const geocoder = new google.maps.Geocoder();
    const submitbutton = document.getElementById("submitbutton");
    const inputbox = [];
    const numberOfInputs = 12;
    const markers = [];

    var service = new google.maps.DistanceMatrixService();

    //iterate through inputs in Form and Saves element values
    for(i=1; i<=numberOfInputs; i++) {
        inputbox[i-1] = document.getElementById(`${i}`);
    }
    var addresscoords = [];
    submitbutton.addEventListener("click" , () => {
        var trips = [];
        //Sets up Map Markers and saves addresses
        for(i=0; i<numberOfInputs; i++) {
            if (inputbox[i].value) {
                addresses[i] = inputbox[i].value;
            }
            geocoder.geocode( { 'address': addresses[i] }, (result) => { 
                        addresscoords[i] = result;
                        markers[i] = new google.maps.Marker({
                        position: result[0].geometry.location,

                        map: displaymap
                    })
            });   
        }
        //Done Maps

        //Retrieve all the information needed to plan routes
        // May need to be upgraded to make multiple queries to get all data needed for more locations
            service.getDistanceMatrix({
                origins: addresses,
                destinations: addresses,
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.IMPERIAL,
                avoidHighways: false,
                avoidTolls: false
            }, (response, status) => {
            if (status == 'OK') {
                if (status == 'OK') {
                    var origins = response.originAddresses;
                    var destinations = response.destinationAddresses;
                    for (var i = 0; i < origins.length; i++) {
                      var results = response.rows[i].elements;
                        for (var j = 0; j < results.length; j++) { 
                                var element = results[j];
                                var distance = element.distance.text;
                                var duration = element.duration.text;
                                var from = origins[i];
                                var to = destinations[j];
                                if(!distance.includes(' ft')) {
                                    duration = duration.replace(' mins', '');
                                    if(duration.includes('hour')) { //Processing to convert hrs string to minutes
                                        var cache = duration.charAt(0);
                                        cache = Number(cache) * 60;
                                        duration = duration.substring(1);
                                        duration = duration.replace('s', '');
                                        duration = Number(duration.replace('hour', ''));
                                        duration = duration + cache;
                                    }
                                    distance = distance.replace(' mi',''); //Removes string and converts to numbers
                                    var tripobject = [Number(distance), Number(duration), from, to]; 
                                    trips.push(tripobject);
                                }
                                //  TRIP Distance = 0, TRIP Duration = 1, FROM = 2, TO = 3
                        }
                    }
                    var sortedTrips = sortDataByFrom(trips)
                    console.log(sortedTrips)
                    optimizeRoute('8406 Magnolia Ave N, Santee, CA 92071', '8406 Magnolia Ave N, Santee, CA 92071', sortedTrips);
                }
            }
            else {
                console.log(status);
            }
            return trips
        });


            
            // var cachedtrips = (The resulting trips)
            // //stores trips from this location in 0-> number of addresses-1
            // var tripinfos[i] = cachedtrips

            // read cached trips to find closest nearby location
            // store which trip that is/where the TO location is
            
            // iterationtripused.push(tripinfos[i][(Trip 3 or whatever)])
            
        //}
    
    })
    
    // addresses = [inserted addresses]
    // dataset = every trip sorted by origin


    // function optimizeRoute (raw, startlocation) {
    //     var location = '';
    //     var groupedtrips = []
    //     groupedtrips = sortDataByFrom(raw)

    //     location = startlocation;
    //     var visited = false;

    //     var visitedcities = []

    //     for (i=0; i<groupedtrips.length; i++) { //For the number of cities

    //         var lowesttime = 100000000000000000;

    //         for(j=0; j<groupedtrips[i].length; j++) { //For each trip from each city

    //             //find lowest time trip from groupedtrips[i]
    //             //check if the city destination has already been traveled to

    //             visited = hasTraveled(groupedtrips[i][3], visitedcities);

    //             if(groupedtrips[i][1]<lowesttime && visited == false ) { //If the current trip's time is lower than the last run, save its reference and time
    //                 var lowestreference = j;
    //                 lowesttime = groupedtrips[i][1]
    //             }
    //         }

    //         location = groupedtrips[i][3]
    //         visitedcities.push(location)

    //     }

    //     return(groupedtrips)
    // }
    
    function optimizeRoute (Start, End, dataset){
        var allCompleteRoutesFound = [];
        //convert from raw trip data to grouped
        for (i=0; i<dataset.length; i++) {
            let currentRoute = runRoute(addresses[i], i, dataset)
            allCompleteRoutesFound.push(currentRoute)
        }

        //Compare allRoutes to find fastest

        //Reorganize to start at CED
        return allCompleteRoutesFound
    }

    function hasTraveled (trip, visited) {
        for(k=0; i<visited.length; k++) {
            //iterate through visited cities and see if they match the current destination
            if(visited[k] == trip) { //If logged visit matches destination then disallow lowest time comparison
                return true;
            }
        }
        return false
    }

    function sortDataByFrom (rawdata) {
        var togethertrips = [];
        for(i=0; i<addresses.length; i++) {
            var tripsobject = []
            for(j=0; j<addresses.length-1; j++) {
                tripsobject.push(rawdata[j+(-i)+(addresses.length*i)])
            }
            togethertrips[i] = tripsobject
        }
        return togethertrips
    }

// if (updatedroutetime<currentroutetime) {
//  currentroute = updatedroute
// }

    function runRoute(startingaddress, arraylocation, dataset) {
        var visited = [];
        var currentRouteTesting = [];
        var routeTime = 0;
        for (l=0; l<dataset.length; l++) {
            let storedpath = findFastestTrip(visited, dataset[arraylocation])
            routeTime += storedpath[1];
            currentRouteTesting.push(storedpath)
        }
        currentRouteTesting.push(routeTime)
        return currentRouteTesting
    }

    function findFastestTrip (visited,dataset) {
        //Needs to be fed: The Array of Trips from one FROM location
        var fastesttime = 100000000000000;
        var fastesttripID = '';
        for (m=0; m<dataset.length; m++) {
            visitedBoolean = hasTraveled(dataset[m][3], visited);
            if(dataset[m][1]<fastesttime & visitedBoolean != true) {
                fastesttripID = m
                fastesttime = dataset[m][1]       
            }
        }
        // console.log(dataset[m][fastesttripID])
        return dataset[i][fastesttripID]
    }


    /* 
Big Picture:

Chunk of code to retrieve distances data, then sort in data structure
From 0: Route 1 Distance Time From To
Route 2 etc...
From 1 etc...

Once Dataset is receieved, optimizeRoute()




    //Push complete iteration onto the routes
    var allCompleteRoutesFound = []
    //Create an array with arrays of different iterations
    bestRouteID = ''
    bestRouteID = bestRoute(allCompleteRoutesFound)
    var optimalRouteToReturn = []
    optimalRouteToReturn = allCompleteRoutesFound[bestRouteID]
    //Return an array of trips that complete the route in the least time
    
    function bestRoute(allRoutes) {
        //For each route, compare total time it takes to complete
        //Return the array number for the fastest route
    }


    */

}

//Number of trips is number of addresses * number of addresses - 1
//Number of Trips per location is total addresses - 1

/* 

Possible
Nearest Neighbor and run for every location showing different iterations, take lowest time/mileage




https://en.wikipedia.org/wiki/Travelling_salesman_problem
MY LORD MY SAVIOR
https://www.researchgate.net/publication/313898510_An_Empirical_Study_of_the_Multi-fragment_Tour_Construction_Algorithm_for_the_Travelling_Salesman_Problem
Homie pulled through

Drawing Path:
const flightPlanCoordinates = [
    { lat: 37.772, lng: -122.214 },
    { lat: 21.291, lng: -157.821 },
    { lat: -18.142, lng: 178.431 },
    { lat: -27.467, lng: 153.027 },
  ];
  const flightPath = new google.maps.Polyline({
    path: flightPlanCoordinates,
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });

  flightPath.setMap(map);
}

https://developers.google.com/maps/documentation/javascript/examples/directions-waypoints
^^^ Drawing Actual Path
https://developers.google.com/maps/documentation/javascript/examples/directions-draggable
^^^ Better Drawn path and adjusting routes


8406 Magnolia Ave N, Santee, CA 92071
8531 Ablette Rd, Santee, CA 92071
9728 Winter Gardens Blvd, Lakeside, CA 92040
10410 Ashwood St, Lakeside, CA 92040

on failure:
http://www.optimap.net/

*/


