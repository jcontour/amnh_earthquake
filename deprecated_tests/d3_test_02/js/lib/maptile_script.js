var pi = Math.PI,
  tau = 2 * pi;

var width = Math.max(960, window.innerWidth),
  height = Math.max(500, window.innerHeight);

// Initialize the projection to fit the world in a 1×1 square centered at the origin.
var projection = d3.geoMercator()
  .scale(1 / tau)
  .translate([0, 0]);

var path = d3.geoPath()
  .projection(projection);

var tile = d3.tile()
  .size([width, height])
  .wrap();

var zoom = d3.zoom()
  .scaleExtent([1 << 11, 1 << 14])
  .on("zoom", zoomed);

var svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height);

var raster = svg.append("g");

// Compute the projected initial center.
var center = projection([-0, 0]);

// Apply a zoom transform equivalent to projection.{scale,translate,center}.
svg
  .call(zoom)
  .call(zoom.transform, d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(1 << 12)
    .translate(-center[0], -center[1]));

function zoomed() {
  var transform = d3.event.transform;

  var tiles = tile
    .scale(transform.k)
    .translate([transform.x, transform.y])
    ();
    // .wrap(true);

  projection
    .scale(transform.k / tau)
    .translate([transform.x, transform.y]);

  var image = raster
    .attr("transform", stringify(tiles.scale, tiles.translate))
    .selectAll("image")
    .data(tiles, function(d) { return d; });

  image.exit().remove();

  image.enter().append("image")
    .attr("xlink:href", function(d) { return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
    .attr("x", function(d) { return d[0] * 256; })
    .attr("y", function(d) { return d[1] * 256; })
    .attr("width", 256)
    .attr("height", 256);

  // image.enter().append("img")
  //     .attr("class", "tile")
  //     .attr("src", function(d) {
  //       var z = d[2],
  //           k = 1 << z,
  //           x = (d[0] % k + k) % k,
  //           y = d[1];
  //       return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png"; 
  //     })

}

function stringify(scale, translate) {
  var k = scale / 256, r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}