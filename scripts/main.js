/** Globals **/
// Layer objects
var svg              = null
,   connection_layer = null
,   node_layer       = null;

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
    candidatesToVotes    = [],
    d3color              = d3.interpolateRgb("#BAE4B3", "#006D2C"),
    d3LineLinear         = d3.svg.line().interpolate("linear");

// Drawing Helper Functions
var color_scale    = null,
    strength_scale = null,
    path           = null,
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
            name: 'industry' + i
        ,   id: i
        ,   pacs: i+ 30
        ,   individual: i+10
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
        };
        candidates[i] = candidate;
        nodeMap["#cand_" + candidate.id] = candidate;
    }
}

function drawNodes(nodeData, nodeClass)
{
    // TODO: Make this better/more declarative
    var x = 0;
    var id_pre = "";
    /*switch(nodeClass)
    {
        case 'industry':
            x = 20;
            id_pre = 'ind_';
            break;
        case 'candidate':
            x = 170;
            id_pre = 'cand_';
            break;
        case 'vote':
            x = 220;
            id_pre = 'vote_';
            break;
        default:
            break;
    }*/
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
                return d.color = color(d.name.replace(/ .*/, ""));
            })
        .style("stroke", function(d)
            {
                return d3.rgb(d.color).darker(2);
            })
        .append("title")
            .text(function(d)
                {
                    return d.name + "\n" + format(d.value);
                })
        /*
                .attr("id", function(node)
                {
                    return id_pre + node.id;
                })
                .attr("class", nodeClass)
                .attr("cx", function(cand)
                {
                    return x;
                })
                .attr("cy", function(d, i)
                {
                    return i*25 + 20;
                })
                .attr("r", 0)
            .transition()
                .duration(1000)
                .attr("r", radius);
        */
}

function drawConnections(connectionData, connectionClass)
{
    var id_pre = "ind2cand_"
    var src_pre = "#ind_";
    var dst_pre = "#cand_";

    connection_layer.selectAll("." + connectionClass)
        .data(connectionData)
        .enter().append("path")
            .attr("class", connectionClass)
            .attr("d", path)
            .style("stroke-width", function(d)
                { return Math.max(1, d.dy); })
            .sort(function(a,b)
                { return b.dy - a.dy; })
            .append("title")
                .text(function(d)
                    {
                        return d.source.name + "->" +
                                d.target.name + "\n" +
                                format(d.value);
                    });
    /*
        .data(connectionData)
        .enter().append("path")
            .attr("class", connectionClass)
            .attr("id", function(node, i)
            {
                return id_pre + i;
            })
            .attr("fill", function(d)
            {
                return d3color(color_scale(0));
            })
            .attr("d", function(d)
            {
                return drawCurveStart(d, src_pre, dst_pre);
            })
            .attr("stroke-width", 0)
        .transition()
            .duration(1000)
            .attr("stroke-width", 1.5)
            .attr("d", function(d)
            {
                return drawCurve(d, src_pre, dst_pre);
            })
            .attr("fill", function(d)
            {
                return d3color(color_scale(d.percent));
            });
    */
}

function drawCurveStart(d, src_pre, target_pre)
{
    // Inspired by this: http://blog.stephenboak.com/2012/06/15/d3-flow-vis-tutorial.html
    var source_id = src_pre + d.source;
    var target_id = target_pre + d.target
    var slope = Math.atan2((+d3.select(target_id).attr("cy") - d3.select(source_id).attr("cy")),
                           (+d3.select(target_id).attr("cx") - d3.select(source_id).attr("cx")));
    var slopePlus90 = slope + (Math.PI / 2);

    var sourceX = +d3.select(source_id).attr("cx");
    var sourceY = +d3.select(source_id).attr("cy");
    var targetX = +d3.select(target_id).attr("cx");
    var targetY = +d3.select(target_id).attr("cy");

    var arrowOffset = 20;
    var points = [];
    var xTan = radius*Math.cos(slope)
    ,   xOff = radius*(d.percent/100)*Math.cos(slopePlus90)
    ,   yTan = radius*Math.sin(slope)
    ,   yOff = radius*(d.percent/100)*Math.sin(slopePlus90);

    var first = [sourceX , sourceY]
    ,   second = [sourceX, sourceY]
    ,   third = [sourceX, sourceY];
    /*var first = [sourceX + radius * Math.cos(slope) - d.percent * Math.cos(slopePlus90), sourceY + radius * Math.sin(slope) - (d.percent) * Math.sin(slopePlus90)]
    ,   second = [sourceX + radius * Math.cos(slope), sourceY + radius * Math.sin(slope)]
    ,   third = [targetX - radius * Math.cos(slope), targetY - radius * Math.sin(slope)]
    ,   fourth = [targetX - (radius + arrowOffset) * Math.cos(slope) - (d.percent + (arrowOffset / 2)) * Math.cos(slopePlus90), targetY - (radius + arrowOffset) * Math.sin(slope) - (d.percent+ (arrowOffset / 2)) * Math.sin(slopePlus90)]
    ,   fifth = [targetX - (radius + arrowOffset) * Math.cos(slope) - (d.percent) * Math.cos(slopePlus90), targetY - (radius + arrowOffset) * Math.sin(slope) - (d.percent) * Math.sin(slopePlus90)];
    */
    points.push(first);
    points.push(second);
    points.push(third);
    /*points.push(third);
    points.push(fourth);
    points.push(fifth);*/

    return d3LineLinear(points) + "Z";
}

function drawCurve(d, src_pre, target_pre)
{
    // Inspired by this: http://blog.stephenboak.com/2012/06/15/d3-flow-vis-tutorial.html
    var source_id = src_pre + d.source;
    var target_id = target_pre + d.target
    var slope = Math.atan2((+d3.select(target_id).attr("cy") - d3.select(source_id).attr("cy")),
                           (+d3.select(target_id).attr("cx") - d3.select(source_id).attr("cx")));
    var slopePlus90 = slope + (Math.PI / 2);

    var sourceX = +d3.select(source_id).attr("cx");
    var sourceY = +d3.select(source_id).attr("cy");
    var targetX = +d3.select(target_id).attr("cx");
    var targetY = +d3.select(target_id).attr("cy");

    var arrowOffset = 20;
    var points = [];
    var xTan = radius*Math.cos(slope)
    ,   xOff = radius*(d.percent/100)*Math.cos(slopePlus90)
    ,   yTan = radius*Math.sin(slope)
    ,   yOff = radius*(d.percent/100)*Math.sin(slopePlus90);

    var first = [sourceX + xOff, sourceY + yOff]
    ,   second = [sourceX - xOff, sourceY - yOff]
    ,   third = [targetX, targetY];
    /*var first = [sourceX + radius * Math.cos(slope) - d.percent * Math.cos(slopePlus90), sourceY + radius * Math.sin(slope) - (d.percent) * Math.sin(slopePlus90)]
    ,   second = [sourceX + radius * Math.cos(slope), sourceY + radius * Math.sin(slope)]
    ,   third = [targetX - radius * Math.cos(slope), targetY - radius * Math.sin(slope)]
    ,   fourth = [targetX - (radius + arrowOffset) * Math.cos(slope) - (d.percent + (arrowOffset / 2)) * Math.cos(slopePlus90), targetY - (radius + arrowOffset) * Math.sin(slope) - (d.percent+ (arrowOffset / 2)) * Math.sin(slopePlus90)]
    ,   fifth = [targetX - (radius + arrowOffset) * Math.cos(slope) - (d.percent) * Math.cos(slopePlus90), targetY - (radius + arrowOffset) * Math.sin(slope) - (d.percent) * Math.sin(slopePlus90)];
	*/
    points.push(first);
    points.push(second);
    points.push(third);
    /*points.push(third);
    points.push(fourth);
    points.push(fifth);*/

    return d3LineLinear(points) + "Z";
}

function dragmove(d)
{
    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
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
    color_scale = d3.scale.linear()
    .range([0, 1])
    .domain([0, d3.max(industryToCandidates, function(d) {
        return d.percent;
    })]);

    //GLOBAL STRENGTH SCALE
    strength_scale = d3.scale.linear().range([2, 10]) /* thickness range for flow lines */
    .domain([0, d3.max(industryToCandidates, function(d) {
        return d.percent;
    })]);

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

    /*drawNodes(votes, "vote");
    drawNodes(candidates, "candidate");
    drawNodes(industries, "industry");

    drawConnections(industryToCandidates, "ind2cand");*/

    drawSankey();
}

setup();
