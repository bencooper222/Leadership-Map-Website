
var config;
var sigInst;
var filter;

loadJSON('resources/config.json', function (json) {
  config = JSON.parse(json);
  console.log(config);
  init();
});

function resizeContainers() {
  var sigContainer = document.getElementById("sigma-container");
  var sideBar = document.getElementById("sidebar");

  //alter leftness and width of sigma container
  sigContainer.style.left = sideBar.offsetWidth + "px";
  sigContainer.style.width = (document.body.offsetWidth - sideBar.offsetWidth) + "px";
  sigInst.refresh();
}

function init() {


  // Finds the connections of each node
  sigma.classes.graph.addMethod("neighbors", function (nodeId) {
    var k,
      neighbors = {},
      index = this.allNeighborsIndex[nodeId] || {};


    for (k in index)
      neighbors[k] = this.nodesIndex[k];

    return neighbors;
  });

  // Creates an instance of Sigma.js
  sigInst = new sigma({
    renderers: [
      {
        container: document.getElementById("sigma-container"),
        type: "canvas"
      }
    ]
  });


  // Customizes its settings 
  sigInst.settings(config.sigmasettings);
  /*
    sigInst.settings({
      // Drawing properties :
      defaultNodeColor: "#005596",
      defaultLabelColor: "#000",
      defaultLabelSize: 14,
      defaultLabelHoverColor: "#fff",
      labelThreshold: 11,
      defaultHoverLabelBGColor: "#888",
      defaultLabelBGColor: "#ddd",
      defaultEdgeType: "straight",
      // Graph properties :
      minNodeSize: 3,
      maxNodeSize: 10,
      minEdgeSize: 0.1,
      maxEdgeSize: 0.2,
      // Mouse properties :
      zoomMax: 20
    });
  */
  // Parses GEXF file to fill the graph
  sigma.parsers.gexf(
    config.datalocation,
    sigInst,
    function () {
      //  Little hack here:
      //  In the latest Sigma.js version have to delete edges" colors manually
      sigInst.graph.edges().forEach(function (e) {
        e.color = null;

      });


      sigInst.graph.nodes().forEach(function (n) {
        // convert XML attribute string to an array
        n.attributes.organizations = n.attributes.organizations.split(", ");
        // Also, to facilitate the update of node colors, store
        // their original color under the key originalColor:
        n.originalColor = n.color;
      });

      sigInst.refresh();
    }
  );




  // When a node is clicked, check for each node to see if it is connected. If not, set its color as gray
  // Do the same for the edges

  var grayColor = "#ccc";
  sigInst.bind("overNode",
    function (e) {
      var nodeId = e.data.node.id,
        toKeep = getFilteredNeighrbors(nodeId);
      // toKeep[nodeId] = e.data.node;
      console.log(e.data.node);

      sigInst.graph.nodes().forEach(function (n) {

        if (toKeep[n.id]) {

          n.color = n.originalColor;
        }
        else {

          n.color = grayColor;
        }
      });

      sigInst.graph.edges().forEach(function (e) {
        if (e.source === nodeId || e.target === nodeId)
          e.color = null;
        else
          e.color = grayColor;
      });

      // Since the data has been modified, call the refresh method to make the colors update 
      sigInst.refresh();
    });

  // When a node is no longer being hovered over, return to original colors
  sigInst.bind("outNode", function (e) {
    sigInst.graph.nodes().forEach(function (n) {
      n.color = n.originalColor;
    });

    sigInst.graph.edges().forEach(function (e) {
      e.color = null;
    });

    sigInst.refresh();
  });

  // instatiating filter
  filter = new sigma.plugins.filter(sigInst);
  sigInst.refresh();
}

//TODO: set up filter.js
function filterEdgeWeight(value) {
  filter.edgesBy(function (e) {
    return e.weight > value;
  }, 'edge-weight').apply();

}

function getFilteredNeighrbors(nodeId) {
  var neighbors = sigInst.graph.neighbors(nodeId);
  var validNodes = [];

  sigInst.graph.edges().forEach(function (e) {
    //only count visible incident edges for determining neighborhoods of nodeId
    if (e.hidden === false || typeof e.hidden === "undefined") { // if filtering hasn't started, e.hidden will be undefined 
      if (e.source === nodeId) {
        validNodes[e.target] = sigInst.graph.nodes(e.target);
      }
      if (e.target === nodeId) {
        validNodes[e.source] = sigInst.graph.nodes(e.source);
      }
    }


  });

  validNodes[nodeId] = sigInst.graph.nodes(nodeId); // add the node with id nodeId itself
  return validNodes;
}


function verifyEnter(event) {
  var obj = event.target;
  if (!event) event = window.event;
  var keyCode = event.keyCode || event.which;
  if (keyCode == '13') {
    // Enter pressed

    switch (obj.id) {
      case "edgeWeight":
        filter.undo('edge-weight').apply();
        filterEdgeWeight(parseFloat(obj.value));
        break;
    }

  }
}

// Loads a config.json file that directs to the location of various files
function loadJSON(location, callback) {

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', location, true); // Replace 'my_data' with the path to your file
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}








/*

if (document.addEventListener)
  document.addEventListener("DOMContentLoaded", init, false);
else
console.log("hi")
 // window.onload = init;
 */
