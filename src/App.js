import './App.css'
import React, { useRef, useEffect, useState } from "react";
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import * as ttapi from '@tomtom-international/web-sdk-services';

const App = () => {
  const mapElement = useRef()
  const [map, setMap] = useState({})
  const [longitude, setLongitude] = useState(80.27847)
  const [latitude, setLatitude] = useState(13.08784)

  const converToPoints = (lnglat) => {
    return {
      point: {
        latitude: lnglat.lat,
        longitude: lnglat.lng,
      }
    }
  }

  const addDeliveryMarker = (lnglat, map) => {
    const element = document.createElement('div')
    element.className = 'marker-delivery'
    new tt.Marker({
      element: element
    })
      .setLngLat(lnglat)
      .addTo(map)
  }

  const drawRoute = (geojson, map) => {
    if (map.getLayer('route')) {
      map.removeLayer('route')
      map.removeSource('route')
    }
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: geojson
      },
      paint: {
        'line-color': '#4a90e2',
        'line-width': 6
      }
    })
  }

  useEffect(() => {
    const origin = {
      lng: longitude,
      lat: latitude,
    }
    const destinations = []
    let map = tt.map({
      key: 'uBSIqJb79yM8Efb3XuYYGdUJ9IxQRwIf',
      container: mapElement.current,
      stylesVisibility: {
        trafficIncidents: true,
        trafficFlow: true,
      },
      center: [longitude, latitude],
      zoom: 14
    })
    setMap(map)

    const addMarker = () => {
      const popupOffset = {
        bottom: [0, -25]
      }
      const popup = new tt.Popup({ offset: popupOffset }).setHTML('This is You!')

      const element = document.createElement('div')
      element.className = "marker"
      const marker = new tt.Marker({
        draggable: true,
        element: element
      })
        .setLngLat([longitude, latitude])
        .addTo(map)

      marker.on('dragend', () => {
        const lnglat = marker.getLngLat()
        setLongitude(lnglat.lng)
        setLatitude(lnglat.lat)
      })
      marker.setPopup(popup).togglePopup()
    }
    addMarker()

    const sortDestinations = (locations) => {
      const pointsForDestination = locations.map((destinations) => {
        return converToPoints(destinations)
      })
      const callParameters = {
        key: 'uBSIqJb79yM8Efb3XuYYGdUJ9IxQRwIf',
        destinations: pointsForDestination,
        origins: [converToPoints(origin)],
      }
      return new Promise((resolve, reject) => {
        ttapi.services
          .matrixRouting(callParameters)
          .then((matrixAPIResults) => {
            const results = matrixAPIResults.matrix[0]
            const resultsArray = results.map((result, index) => {
              return {
                location: locations[index],
                drivingtime: result.response.routeSummary.travelTimeInSeconds,
              }
            })
            resultsArray.sort((a, b) => {
              return a.drivingtime - b.drivingtime
            })
            const sortedLocations = resultsArray.map((result) => {
              return result.location
            })
            resolve(sortedLocations)
          })
      })
    }


    const recalculateRoutes = () => {
      sortDestinations(destinations).then((sorted) => {
        sorted.unshift(origin)

        ttapi.services
          .calculateRoute({
            key: 'uBSIqJb79yM8Efb3XuYYGdUJ9IxQRwIf',
            locations: sorted,
          })
          .then((routeData) => {
            const geoJson = routeData.toGeoJson()
            drawRoute(geoJson, map)
          })
      })
    }
    map.on('click', (e) => {
      destinations.push(e.lngLat)
      addDeliveryMarker(e.lngLat, map)
      recalculateRoutes()
    })

    return () => map.remove()
  }, [longitude, latitude])

  return (
    <>
      {map &&
        <div className="app">
          <div ref={mapElement} className="map">
          </div>
          <div className="search-bar">
            <h1>Where to?</h1>
            <input type="text" id="longitude" className="longitude"
              placeholder="Enter Longitude" onChange={(e) => { setLongitude(e.target.value) }} />
            <input type="text" id="latitude" className="latitude"
              placeholder="Enter Latitude" onChange={(e) => { setLatitude(e.target.value) }} />
          </div>          
          <br></br>
          <footer> <marquee><h3>Created by Aparna</h3> </marquee> </footer>
        </div>
      }
    </>
  );
}

export default App
