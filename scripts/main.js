/** Globals **/
// Layer objects
var svg              = null
,   connection_layer = null
,   node_layer       = null
,   node             = null
,   connection       = null;

// Sanky-fier
var sankey = null;

// Attributes
var margin       = {top: 1, right:1, bottom: 6, left:1},
    width        = 960 - margin.left - margin.right,
    height       = 500 - margin.top - margin.bottom,
    node_width   = 15,
    node_padding = 10;

// Nodes
var candidates = [],
    industries = [],
    votes      = [],
    nodeMap    = {},
    radius     = 10;

// Links
var industryToCandidates = [],
    candidatesToVotes    = [];

// Drawing Helper Functions
var path           = null,
    formatNumber   = null,
    format         = null,
    color          = null;

function getIndustryToCandidates()
{
    /** source: industry id
     *  target: candidate id
     **/
    industryToCandidates = [
        {source: "#ind_" + 0, target: "#cand_" + 2, percent: 20, value: 200}
     ,  {source: "#ind_" + 0, target: "#cand_" + 8, percent: 14, value: 300}
     ,  {source: "#ind_" + 0, target: "#cand_" + 3, percent: 36, value: 200}
     ,  {source: "#ind_" + 1, target: "#cand_" + 4, percent: 10, value: 200}
     ,  {source: "#ind_" + 4, target: "#cand_" + 2, percent: 10, value: 200}
     ,  {source: "#ind_" + 5, target: "#cand_" + 8, percent: 50, value: 200}
     ,  {source: "#ind_" + 8, target: "#cand_" + 9, percent: 3, value: 200}
    ];
}

function getVotes()
{
    // TODO: Query database for this
}

function getIndustries()
{
    // TODO: Query database for this
    for (var i = 0; i < 10; i++)
    {
        var ind = {
            name       : 'industry' + i
        ,   id         : i
        ,   pacs       : i+ 30
        ,   individual : i+10
        ,   type       : 'industry'
        };
        industries[i] = ind;
        nodeMap["#ind_" + ind.id] = ind;
    }
}

function getCandidates()
{
    // TODO: Query database for this
    for (var i = 0; i < 10; i++)
    {
        var candidate = {
            name: 'candidate' + i
        ,   id: i
        ,   type: 'candidate'
        };
        candidates[i] = candidate;
        nodeMap["#cand_" + candidate.id] = candidate;
    }
}

function drawNodes(nodeData, nodeClass)
{
    node = node_layer.selectAll("." + nodeClass)
        .data(nodeData)
        .enter().append("g")
            .attr("class", nodeClass)
            .attr("transform", function(d)
                {
                    return "translate(" + d.x + "," + d.y + ")";
                })
        .call(d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("dragstart", function(){ this.parentNode.appendChild(this); })
            .on("drag", dragmove));

    node.append("rect")
        .attr("height", function(d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d)
            {
                return d.color = color(d.type.replace(/ .*/, ""));
            })
        .append("title")
            .text(function(d)
                {
                    return d.name + "\n" + format(d.value);
                })
    node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy/2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
        .filter(function(d) { return d.x < width / 2; })
            .attr("x",  6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

}

function drawConnections(connectionData, connectionClass)
{
    connection = connection_layer.selectAll("." + connectionClass)
        .data(connectionData)
        .enter().append("path")
            .attr("class", connectionClass)
            .attr("d", path)
            .style("stroke-width", function(d)
                { return Math.max(1, d.dy); })
            .sort(function(a,b)
                { return b.dy - a.dy; })
    connection.append("title")
            .text(function(d)
                {
                    return d.source.name + "->" +
                            d.target.name + "\n" +
                            format(d.value);
                });
}

function dragmove(d)
{
    d3.select(this).attr("transform",
            "translate(" + d.x + "," +
                (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    connection.attr("d", path);
}

/** Initializes how the layering will be handled
 * Note: Order matters
 */
function initLayers()
{
    svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);
    connection_layer = svg.append("g")
        .attr("class", "connections");
    node_layer = svg.append("g")
        .attr("class", "nodes");

    sankey = d3.sankey()
        .size([width, height])
        .nodeWidth(node_width)
        .nodePadding(node_padding)

    path = sankey.link();
}

function setupFunctions()
{
    formatNumber = d3.format(",.0f");
    format = function(d) { return "$" + formatNumber(d); };
    color = d3.scale.category20();
}

/** drawSankey: Sets up the sankey object
 *      with the data
 **/
function drawSankey()
{
    sankey
        .nodes(d3.map(nodeMap))
        .links(industryToCandidates)
        .layout(32);

    drawConnections(industryToCandidates, "link");
    drawNodes(d3.values(nodeMap), "node")
}

/** setup: grabs all the necessary data
 **/
function setup()
{
    initLayers();

    // call getters
    getCandidates();
    getIndustries();
    getVotes();
    getIndustryToCandidates();

    // Setup functions
    setupFunctions();

    drawSankey();
}

setup();
