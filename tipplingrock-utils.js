/*
 * tipplingrock-utils.js
 *
 * Javascript utility functions for Tippling Rock interface
 *
 * Michael Rosen
 * mrrosen
 * 13-09-2015
 */

//
// General utility functions
//

// Returns the time as value since epoch in seconds
function currentTime() {
  return Math.floor((new Date).getTime());
}

// Gives a number a leading 0
function twoDigit(num) {
  return ("0" + num).slice(-2);
}

// Get the lifebar "bucket" given a time
function calcLifebarIndex(t) {
  var d = new Date(t);
  var startOfCurrentDay = lastUpdate.getTime() - (lastUpdate.getTime() % ONEDAY);
  var startOfTDay = t - (t % ONEDAY);
  var diff = (startOfCurrentDay - startOfTDay) / ONEDAY;
  return d.getHours() + ((13 - diff) * 24);
}

// Returns the node with the given id
function findNodeByID(id) {
  var ret = null;
  
  $.each(nodes, function(i, node) {
    if (node['id'] == id) {
      ret = node;
    }
  });
  
  return ret;
}

// Returns the sensor within the given node with the given id
function findSensorByID(node, id) {
  var ret = null;
  
  $.each(node['sensors'], function(i, sensor) {
    if (sensor['id'] == id) {
      ret = sensor;
    }
  });
  
  return ret;
}

// Return list of nodes in both the given project and given site
function intersectProjectSite(project, site) {
  var inter = [];
  $.each(projects[project], function(i, node) {
    if (sites[site].indexOf(node) >= 0) {
      inter.push(node);
    }
  });
  
  return inter;
}
 
// 
// Drawing functions
//

// Fill in a given select list with all the keys from the given object (base being the top option)
function fillOptions(name, obj, base) {
  var options = "<option value=\"_all\" class=\"header-list-option\">" + base + "</option>";
  $.each(obj, function(key, val) {
    if (key != "_all") {
      options += "<option value=\"" + key + "\" class=\"header-list-option\">" + key + "</option>";
    }
  });
  
  $(name).html(options);
}

// Create the lifebar for a node
function generateLifebar(node) {
  var ctx = $("#bottom-bar-content-stats-lifebar").get(0).getContext("2d");
  var lifebarLength = node['lifebar'].length;
  for (var i = 1; i <= 288; i++) {
    if (node['lifebar'][lifebarLength - i] > 0) {
      ctx.fillStyle = pieChartElementOptions['green']['color'];
    }
    else {
      ctx.fillStyle = pieChartElementOptions['red']['color'];
    }
    
    ctx.fillRect((287 - i),0,1,15);
  }
}

// Create the right bar list of nodes from the given node list
function createNodeList(nodes) {
  var list = "";
  $.each(nodes, function(i, node) {
    // See if the node is alive or dead
    if (node['samples24'] > 0) {
      liveness = "alive";
    }
    else {
      liveness = "dead";
    }
    
    list += "<div class=\"node-list-item\" id=\"node-list-" + node['id'] + "\"> \
              <div class=\"node-list-item-main\"> \
                <div class=\"node-list-item-name-" + liveness + "\">" + node['name'] + "</div> \
                <div class=\"node-list-item-id\">(" + node['id'] + ")</div> \
              </div> \
              <div class=\"node-list-item-sub\"> \
                <div class=\"node-list-item-project\">" + node['project'] + "</div> | \
                <div class=\"node-list-item-site\">" + node['site'] + "</div> \
              </div> \
            </div>";
    
    $("#node-list").on('click', "#node-list-" + node['id'], node['id'], openBottomBar);
  });
  
  $("#node-list").html(list);
}

// Create the bottom bar list of sensors from the given sensor list
function createSensorList(node) {
  var list = "";
  $.each(node['sensors'], function(i, sensor) {  
    list += "<div class=\"bottom-bar-content-data-sensors-item\" id=\"sensor-list-" + sensor['id'] + "\"> \
              <div class=\"bottom-bar-content-data-sensors-name\">" + sensor['name'] + "</div> \
              <div class=\"bottom-bar-content-data-sensors-id\">(" + sensor['id'] + ")</div> \
             </div>";
    
    $("#sensor-list").on('click', "#sensor-list-" + sensor['id'], {node: node, sensorID: sensor['id']}, openSensor);
  });
  
  $("#sensor-list").html(list);
  
  if (node['sensors'][0] != undefined) {
    openSensor({data: {node: node, sensorID: node['sensors'][0]['id']}});
  }
}

// Updates and opens the bottom bar
function openBottomBar(evt) {
  var nodeID = evt.data;
  
  // Find the node object
  node = findNodeByID(nodeID);
  
  // Highlight the selected node (and not the others/previous)
  $.each(both, function(i, n) {
    if (n['id'] == node['id']) {
      $("#node-list-" + n['id']).addClass("node-list-item-selected").removeClass("node-list-item");
    }
    else {
      $("#node-list-" + n['id']).addClass("node-list-item").removeClass("node-list-item-selected");
    }
  });
  
  // Fill in the various text fields based on the node's properties
  $("#bottom-bar-title-name").text(node['name']);
  $("#bottom-bar-title-id").text("(" + node['id'] + ")");
  
  $("#bottom-bar-content-stats-site").text(node['site']);
  $("#bottom-bar-content-stats-project").text(node['project']);
  $("#bottom-bar-content-stats-hardware").text(node['hardware']);
  
  var lastUpdate = new Date(node['lastUpdate']);
  var lastUpdateStr = twoDigit(lastUpdate.getHours()) + ":" + 
                      twoDigit(lastUpdate.getMinutes()) + ":" + 
                      twoDigit(lastUpdate.getSeconds()) + "<br />" +
                      twoDigit(lastUpdate.getDate()) + " " +
                      MONTHS[lastUpdate.getMonth()] + " " +
                      lastUpdate.getFullYear();
  $("#bottom-bar-content-stats-last-update").html(lastUpdateStr);
  
  $("#bottom-bar-content-stats-latitude").text(node['lat'].toFixed(8));
  $("#bottom-bar-content-stats-longitude").text(node['long'].toFixed(8));
  
  var deployed = new Date(node['deployed']);
  var deployedStr = twoDigit(deployed.getDate()) + " " +
                    MONTHS[deployed.getMonth()] + " " +
                    deployed.getFullYear();
  $("#bottom-bar-content-stats-deployed").text(deployedStr);
  
  $("#bottom-bar-content-stats-samples24").text(node['samples24']);
    
  $("#bottom-bar").fadeIn(250);
  
  createSensorList(node);
  generateLifebar(node);
}

// Updates the sensor graph to display the data for the selected sensor
function openSensor(evt) {
  var node = evt.data['node'];
  var sensor = findSensorByID(node, evt.data['sensorID']);
  
  // Highlight the selected sensor (and not the others/previous)
  $.each(node['sensors'], function(i, s) {
    if (s['id'] == sensor['id']) {
      $("#sensor-list-" + s['id']).addClass("bottom-bar-content-data-sensors-item-selected").removeClass("bottom-bar-content-data-sensors-item");
    }
    else {
      $("#sensor-list-" + s['id']).addClass("bottom-bar-content-data-sensors-item").removeClass("bottom-bar-content-data-sensors-item-selected");
    }
  });
  
  // Create data and options objects for chart
  var sensorData = [$.extend({}, lineChartElementOptions['red'], {label: sensor['name'], data: sensor['chartData']})];
  var sensorDataOptions = $.extend({}, lineChartOptions,
    {
      scaleType: "date",
      pointDot: false,
      datasetStroke: true,
      datasetStrokeWidth: 3,
      scaleLabel: "<%=value%> " + sensor['units'],
      scaleFontSize: 10,
      scaleBeginAtZero: false,
      bezierCurve: false,
      tooltipTemplate: "<%=argLabel%>; <%=value.toFixed(5)%> " + sensor['units'],
      multiTooltipTamplate: "<%=argLabel%>; <%=value.toFixed(5)%> " + sensor['units'],
      emptyDataMessage: "Sensor has no data from the past 14 days"
    });
    
  // Draw the chart
  if (nodeData != undefined) {
    nodeData.destroy();
  }
  nodeData = new Chart($("#bottom-bar-content-data-node-data").get(0).getContext("2d")).Scatter(sensorData, sensorDataOptions);
}

// Callback function if the site or project change
function projectSiteChange() {

  //
  // Left side bar
  //
  
  // First, fill in the names
  if ($("#header-projects-list").val() == "_all") {
    $("#left-side-bar-stats-project").text("All Projects");
  }
  else {
    $("#left-side-bar-stats-project").text($("#header-projects-list").val());
  }
  
  if ($("#header-sites-list").val() == "_all") {
    $("#left-side-bar-stats-site").text("All Sites");
  }
  else {
    $("#left-side-bar-stats-site").text($("#header-sites-list").val());
  }
  
  // Fill in the actual numbers
  both = intersectProjectSite($("#header-projects-list").val(), $("#header-sites-list").val());
  
  var totalNodes = nodes.length;
  var projectSiteNodes = both.length;
  var projectSiteLiveNodes = 0;
  var projectSiteDeadNodes = 0;
  $.each(both, function(i, node) {
    if (node['samples24'] > 0) {
      projectSiteLiveNodes++;
    }
    else {
      projectSiteDeadNodes++;
    }
  });
  
  $("#left-side-bar-stats-nodes-in-system").text(totalNodes);
  $("#left-side-bar-stats-nodes-in-project").text(projectSiteNodes);
  $("#left-side-bar-stats-nodes-in-project-live").text(projectSiteNodes);
  $("#left-side-bar-stats-nodes-in-project-dead").text(projectSiteNodes);
  $("#left-side-bar-stats-live-nodes-in-project").text(projectSiteLiveNodes);
  $("#left-side-bar-stats-dead-nodes-in-project").text(projectSiteDeadNodes);
  
  // Create charts
  
  // Pie Chart
  var livenessData;
  var livenessChartOptions;
  if (projectSiteNodes > 0) {
    livenessData = [
      $.extend({}, pieChartElementOptions['green'], {label: "% Nodes Alive", value: (projectSiteLiveNodes * 100 / projectSiteNodes).toFixed(2)}), 
      $.extend({}, pieChartElementOptions['red'], {label: "Nodes Dead", value: (projectSiteDeadNodes * 100 / projectSiteNodes).toFixed(2)})
    ];
    livenessChartOptions = pieChartOptions;
  }
  else {
    livenessData = [
      $.extend({}, pieChartElementOptions['red'], {label: "% Nodes Dead", value: 1})
    ];
    livenessChartOptions = $.extend({}, pieChartOptions, {showTooltips: false});
  }
  
  if (nodeLivenessPie != undefined) {
    nodeLivenessPie.destroy();
  }
  nodeLivenessPie = new Chart($("#node-liveness-pie").get(0).getContext("2d")).Doughnut(livenessData, livenessChartOptions);
  
  // Line Chart
  livenessData = {labels: [], datasets: [
    $.extend({}, lineChartElementOptions['lightgreen'], {label: "Max Nodes Alive", data: []}),
    $.extend({}, lineChartElementOptions['green'], {label: "Avg Nodes Alive", data: []}),
    $.extend({}, lineChartElementOptions['darkgreen'], {label: "Min Nodes Alive", data: []})
  ]};
  for (var d = 0; d < 14; d++) {
    var labelTime = new Date(lastUpdate.getTime() - (ONEDAY * (13 - d)));
    livenessData.labels.push(labelTime.getDate() + "/" + (labelTime.getMonth() + 1));
    
    var avgNodesAlive = 0;
    var minNodesAlive = projectSiteNodes;
    var maxNodesAlive = 0;
    for (var h = 0; (h < 24) && ((d < 13) || (h < lastUpdate.getHours())); h++) {
      var nodesAlive = 0;
      
      $.each(both, function(i, node) {
        if ((node['lifebar'].length > ((d * 24) + h)) && (node['lifebar'][(d * 24) + h] > 0)) {
          nodesAlive++;
        }
      });

      avgNodesAlive += nodesAlive;
      if (minNodesAlive > nodesAlive) {
        minNodesAlive = nodesAlive;
      }
      if (maxNodesAlive < nodesAlive) {
        maxNodesAlive = nodesAlive;
      }
    }
    avgNodesAlive /= h;
    
    livenessData.datasets[0].data.push(maxNodesAlive.toFixed(1));
    livenessData.datasets[1].data.push(avgNodesAlive.toFixed(1));
    livenessData.datasets[2].data.push(minNodesAlive.toFixed(1));
  }
  livenessChartOptions = $.extend({}, lineChartOptions, {pointDot: false});

  if (nodeLivenessLine != undefined) {
    nodeLivenessLine.destroy();
  }
  nodeLivenessLine = new Chart($("#node-liveness-line").get(0).getContext("2d")).Line(livenessData, livenessChartOptions);
  
  // 
  // Right side bar
  //
  createNodeList(both);
  
  //
  // Map
  //
  var mapBounds = new google.maps.LatLngBounds();
  $.each(nodes, function(i, node) {
    if (both.indexOf(node) >= 0) {
      node['marker'].setOpacity(1.0);
      mapBounds.extend(node['marker'].getPosition());
    }
    else {
      node['marker'].setOpacity(0.45);
    }
  });
  
  map.fitBounds(mapBounds);
}