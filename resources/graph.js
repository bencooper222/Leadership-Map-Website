
var config;

loadJSON('resources/config.json',function(json){
  config=JSON.parse(json);
  console.log(config);
  init();
});

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
  var sigInst = new sigma({
    renderers: [
      {
        container: document.getElementById("sigma-container"),
        type: "canvas"
      }
    ]
  });

  
  // Customizes its settings 
  sigInst.settings(config.sigmasettings);



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

      // Also, to facilitate the update of node colors, store
      // their original color under the key originalColor:
      sigInst.graph.nodes().forEach(function (n) {
        n.originalColor = n.color;
      });

      sigInst.refresh();
    }
  );


  // When a node is clicked, check for each node to see if it is connected. If not, set its color as gray
  // Do the same for the edges

  var grayColor = "#ccc";
  sigInst.bind("overNode", function (e) {
    var nodeId = e.data.node.id,
      toKeep = sigInst.graph.neighbors(nodeId);
    toKeep[nodeId] = e.data.node;

    sigInst.graph.nodes().forEach(function (n) {
      if (toKeep[n.id])
        n.color = n.originalColor;
      else
        n.color = grayColor;
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
}



// Loads a config.json file that directs to the location of various files
 function loadJSON(location,callback) {   

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
