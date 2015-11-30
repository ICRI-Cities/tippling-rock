/*
 * tipplingrock.js
 *
 * Javascript for Tippling Rock interface
 *
 * Michael Rosen
 * mrrosen
 * 13-09-2015
 */

// 
// Default Parameters for Charts
//
var pieChartOptions = {
  segmentShowStroke: false,
  percentageInnerCutout: 70,
  animationSteps: 60,
  animationEasing: "easeOutQuint",
  animateRotate: true,
  animateScale: true,
  responsive: false
};

var lineChartOptions = {
  scaleShowGridLines: true,
  scaleGridLineColor: "rgba(255,255,255,.7)",
  scaleLineColor: "rgba(255,255,255,.7)",
  scaleFontColor: "rgba(255,255,255,.7)",
  scaleGridLineWidth: 1,
  scaleBeginAtZero: true,
  scaleShowHorizontalLines: true,
  scaleShowVerticalLines: true,
  bezierCurve: true,
  bezierCurveTension: 0.4,
  pointDot: true,
  pointDotRadius: 2,
  pointDotStrokeWidth: 0,
  pointHitDetectionRadius: 2,
  datasetStroke: false,
  datasetStrokeWidth: 0,
  datasetFill: true
};

var pieChartElementOptions = {
  red: {
    color: "rgba(170,0,0,1)",
    highlight: "rgba(250,0,0,1)"
  },
  blue: {
    color: "rgba(0,0,170,1)",
    highlight: "rgba(0,0,250,1)"
  },
  green: {
    color: "rgba(0,170,0,1)",
    highlight: "rgba(0,250,0,1)"
  }
};

var lineChartElementOptions = {
  green: {
    fillColor: "rgba(0,170,0,0.4)",
    strokeColor: "rgba(0,170,0,1)",
    pointColor: "rgba(0,170,0,1)",
    pointStrokeColor: "rgba(0,170,0,1)",
    pointHighlightFill: "rgba(0,170,0,1)",
    pointHighlightStroke: "rgba(0,170,0,1)"
  },
  darkgreen: {
    fillColor: "rgba(0,100,0,0.6)",
    strokeColor: "rgba(0,100,0,1)",
    pointColor: "rgba(0,100,0,1)",
    pointStrokeColor: "rgba(0,100,0,1)",
    pointHighlightFill: "rgba(0,100,0,1)",
    pointHighlightStroke: "rgba(0,100,0,1)"
  },
  lightgreen: {
    fillColor: "rgba(0,250,0,0.2)",
    strokeColor: "rgba(0,250,0,1)",
    pointColor: "rgba(0,250,0,1)",
    pointStrokeColor: "rgba(0,250,0,1)",
    pointHighlightFill: "rgba(0,250,0,1)",
    pointHighlightStroke: "rgba(0,250,0,1)"
  },
  red: {
    fillColor: "rgba(170,0,0,0.4)",
    strokeColor: "rgba(170,0,0,1)",
    pointColor: "rgba(170,0,0,1)",
    pointStrokeColor: "rgba(170,0,0,1)",
    pointHighlightFill: "rgba(170,0,0,1)",
    pointHighlightStroke: "rgba(170,0,0,1)"
  },
  darkred: {
    fillColor: "rgba(100,0,0,0.6)",
    strokeColor: "rgba(100,0,0,1)",
    pointColor: "rgba(100,0,0,1)",
    pointStrokeColor: "rgba(100,0,0,1)",
    pointHighlightFill: "rgba(100,0,0,1)",
    pointHighlightStroke: "rgba(100,0,0,1)"
  },
  lightred: {
    fillColor: "rgba(250,0,0,0.2)",
    strokeColor: "rgba(250,0,0,1)",
    pointColor: "rgba(250,0,0,1)",
    pointStrokeColor: "rgba(250,0,0,1)",
    pointHighlightFill: "rgba(250,0,0,1)",
    pointHighlightStroke: "rgba(250,0,0,1)"
  },
  blue: {
    fillColor: "rgba(0,0,170,0.4)",
    strokeColor: "rgba(0,0,170,1)",
    pointColor: "rgba(0,0,170,1)",
    pointStrokeColor: "rgba(0,0,170,1)",
    pointHighlightFill: "rgba(0,0,170,1)",
    pointHighlightStroke: "rgba(0,0,170,1)"
  },
  darkblue: {
    fillColor: "rgba(0,0,100,0.6)",
    strokeColor: "rgba(0,0,100,1)",
    pointColor: "rgba(0,0,100,1)",
    pointStrokeColor: "rgba(0,0,100,1)",
    pointHighlightFill: "rgba(0,0,100,1)",
    pointHighlightStroke: "rgba(0,0,100,1)"
  },
  lightblue: {
    fillColor: "rgba(0,0,250,0.2)",
    strokeColor: "rgba(0,0,250,1)",
    pointColor: "rgba(0,0,250,1)",
    pointStrokeColor: "rgba(0,0,250,1)",
    pointHighlightFill: "rgba(0,0,250,1)",
    pointHighlightStroke: "rgba(0,0,250,1)"
  }
};

//
// Important globals
//
var nodes;
var projects;
var sites;
var both;
var lastUpdate;

// Map
var map;

// Left side bar charts
var nodeLivenessLine;
var nodeLivenessPie;

// Bottom bar charts
var nodeData;

//
// Important constants
//
var ONEDAY = 3600 * 24 * 1000;
var ONEHR = 3600 * 1000;
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Images
var ALIVEICON = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
var DEADICON = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

//
// Generate the map
//
var mapCanvas = $("#map").get(0);
var mapOptions = {
  center: new google.maps.LatLng(42.3557402, -71.4429875),
  zoom: 14,
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  streetViewControl: false,
  zoomControl: true,
  zoomControlOptions: {
    style: google.maps.ZoomControlStyle.SMALL,
    position: google.maps.ControlPosition.TOP_LEFT
  },
  panControl: false,
  mapTypeControl: false,
  styles: [
    {
      featureType: "all",
      elementType: "all",
      stylers: [
        {
          saturation: -50
        }
      ]
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "all",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "administrative.neighborhood",
      elementType: "labels",
      stylers: [
        {
          visibility: "off"
        }
      ]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [
        {
          saturation: -70
        }
      ]
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [
        {
          visibility: "off"
        }
      ]
    }
  ]
}
map = new google.maps.Map(mapCanvas, mapOptions);

//
// Read JSON file and process it
//
$.getJSON("nodes.internal.json", function(data) {

  nodes = data['nodes'];
  projects = {_all: nodes};
  sites = {_all: nodes};
  
  // Update time of last update
  lastUpdate = new Date(data['lastUpdate']);
  var lastUpdateStr = "Last Update: " +
                      twoDigit(lastUpdate.getHours()) + ":" + 
                      twoDigit(lastUpdate.getMinutes()) + ":" + 
                      twoDigit(lastUpdate.getSeconds()) + " " +
                      twoDigit(lastUpdate.getDate()) + " " +
                      MONTHS[lastUpdate.getMonth()] + " " +
                      lastUpdate.getFullYear();
  $("#footer-last-update").text(lastUpdateStr);

  // Do pre-processing on the data to fill in important data structures
  $.each(nodes, function(i, node) {
  
    // Initialize lifebar
    /*node['lifebar'] = [];
    for (var i = 0; i < (24 * 13 + lastUpdate.getHours() + 1); i++) {
      node['lifebar'].push(0);
    }
    
    // Initialize the sample counter
    var samples24 = 0;

    // Loop through sensors of node, and process their data
    for (var sensor of node['sensors']) {
    
      // Sort the list in ascending order
      sensor['data'].sort(function(a, b) {
        if (a['ts'] > b['ts']) {
          return 1;
        }
        if (a['ts'] < b['ts']) {
          return -1;
        }
        return 0;
      });
      
      // Initialize list for sensor data chart
      sensor['chartData'] = [];
      
      // Determine how many data points to average and set it up to do so
      var numToAvg = Math.ceil(sensor['data'].length / 50);
      var avgCount = 0;
      var avgVal = 0;
      var avgTS = 0;
      
      // Loop through the data and process it, created needed fields to maximize performance
      for (var pt of sensor['data']) {
        var lifebarIndex = calcLifebarIndex(pt['ts']);
        if (lifebarIndex >= 0) {
          node['lifebar'][lifebarIndex] = 1;
        }
        if (pt['ts'] >= (lastUpdate.getTime() - ONEDAY)) {
          samples24++;
        }
        avgVal += pt['value'];
        avgTS += pt['ts'];
        avgCount++;
        if (avgCount == numToAvg) {
          avgVal /= avgCount;
          avgTS /= avgCount;
          sensor['chartData'].push({x: avgTS, y: avgVal.toFixed(3)});
          avgVal = 0;
          avgTS = 0;
          avgCount = 0;
        }
      }
      
      // Add in the remaining
      if (avgCount > 0) {
        avgVal /= avgCount;
        avgTS /= avgCount
        sensor['chartData'].push({x: avgTS, y: avgVal});
      }
    }
  
    node['samples24'] = samples24;*/
    
    // Fill in projects and sites arrays
    if (node['project'] in projects) {
      projects[node['project']].push(node);
    }
    else {
      projects[node['project']] = [node];
    }
    
    if (node['site'] in sites) {
      sites[node['site']].push(node);
    }
    else {
      sites[node['site']] = [node];
    }
    
    // Add node markers to map (And to the dataset)
    if (node['samples24'] > 0) {
      nodeIcon = ALIVEICON;
    }
    else {
      nodeIcon = DEADICON;
    }
    nodeMarker = new google.maps.Marker({
      position: new google.maps.LatLng(node['lat'], node['long']),
      icon: nodeIcon
    });
    nodeMarker.setMap(map);
    node['marker'] = nodeMarker;
    
    // Set up the click handler for the marker
    with ({n: node, m: nodeMarker}) {
      google.maps.event.addListener(m, 'click', function() {
        openBottomBar({data: n['id']});
      });
    }
  });
  
  // Add all projects and sites to top dropdown lists
  fillOptions("#header-projects-list", projects, "Projects");
  fillOptions("#header-sites-list", sites, "Sites");
  
  // Assign callbacks to change data on event of dropdown list changing
  $("#header-projects-list").on('change', projectSiteChange);
  $("#header-sites-list").on('change', projectSiteChange);
  
  // Call it once to update everything
  projectSiteChange();
  
}).fail(function(jqxhr, textStatus, error) {
   var err = textStatus + ', ' + error;
   console.log( "Request Failed: " + err);
});

//
// Bottom bar control
//
$("#bottom-bar").hide();

$("#bottom-bar-close").click(function() {
  $("#bottom-bar").fadeOut(250);
  
  // Unighlight the selected node
  $.each(both, function(i, n) {
    if (n['id'] == node['id']) {
      $("#node-list-" + n['id']).addClass("node-list-item").removeClass("node-list-item-selected");
    }
  });
});