/** Globals **/
// Nodes
var candidates = [];
var industries = [];
var votes = [];
var radius = 10;

// Links
var industryToCandidates = [];
var candidatesToVotes = [];
var d3color = d3.interpolateRgb("#BAE4B3", "#006D2C");
var d3LineLinear = d3.svg.line().interpolate("linear");

var color_scale = d3.scale.linear().range([0, 1]).domain([0, d3.max(industryToCandidates, function(d) {
    return d.percent;
})]);

//GLOBAL STRENGTH SCALE
var strength_scale = d3.scale.linear().range([2, 10]) /* thickness range for flow lines */
.domain([0, d3.max(industryToCandidates, function(d) {
    return d.percent;
})]);

function getIndustryToCandidates()
{
    /** source: industry id
     *  target: candidate id
     **/
    industryToCandidates = [
        {source: 0, target: 2, percent: 20, money: 200},
        {source: 0, target: 8, percent: 14, money: 200},
        {source: 0, target: 3, percent: 16, money: 200},
        {source: 1, target: 4, percent: 10, money: 200},
        {source: 4, target: 2, percent: 10, money: 200},
        {source: 5, target: 8, percent: 30, money: 200}
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
        industries.push(ind);
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
        candidates.push(candidate);
    }
}

function drawNodes(nodeData, nodeClass)
{
    // TODO: Make this better/more declarative
    var x = 0;
    var id_pre = "";
    switch(nodeClass)
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
    }
    d3.select("svg").selectAll("circle." + nodeClass)
        .data(nodeData)
        .enter().append("circle")
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
}

function drawConnections(connectionData, connectionClass)
{
    var id_pre = "ind2cand_"
    var src_pre = "#ind_";
    var dst_pre = "#cand_";

    d3.select("svg").selectAll("path." + connectionClass)
        .data(connectionData)
        .enter().append("path")
            .attr("class", connectionClass)
            .attr("id", function(node, i)
            {
                return id_pre + i;
            })
            .attr("fill", function(d)
            {
                return d3color(color_scale(d.percent));
            })
            .attr("d", function(d)
            {
                return drawCurve(d, src_pre, dst_pre);
            })
            .attr("stroke-width", 0)
        .transition()
            .duration(1000)
            .attr("stroke-width", 1.5)
}

function drawCurve(d, src_pre, target_pre)
{
    var source_id = src_pre + d.source;
    var target_id = target_pre + d.target
    var slope = Math.atan2((+d3.select(target_id).attr("cy") - d3.select(source_id).attr("cy")), (+d3.select(target_id).attr("cx") - d3.select(source_id).attr("cx")));
    var slopePlus90 = Math.atan2((+d3.select(target_id).attr("cy") - d3.select(source_id).attr("cy")), (+d3.select(target_id).attr("cx") - d3.select(source_id).attr("cx"))) + (Math.PI / 2);

    var sourceX = +d3.select(source_id).attr("cx");
    var sourceY = +d3.select(source_id).attr("cy");
    var targetX = +d3.select(target_id).attr("cx");
    var targetY = +d3.select(target_id).attr("cy");

    var arrowOffset = 20;
    var points = [];
    var first = [sourceX + radius * Math.cos(slope) - strength_scale(d.percent) * Math.cos(slopePlus90), sourceY + radius * Math.sin(slope) - strength_scale(d.percent) * Math.sin(slopePlus90)]
    ,   second = [sourceX + radius * Math.cos(slope), sourceY + radius * Math.sin(slope)]
    ,   third = [targetX - radius * Math.cos(slope), targetY - radius * Math.sin(slope)]
    ,   fourth = [targetX - (radius + arrowOffset) * Math.cos(slope) - strength_scale(d.percent + (arrowOffset / 2)) * Math.cos(slopePlus90), targetY - (radius + arrowOffset) * Math.sin(slope) - strength_scale(d.percent+ (arrowOffset / 2)) * Math.sin(slopePlus90)]
    ,   fifth = [targetX - (radius + arrowOffset) * Math.cos(slope) - strength_scale(d.percent) * Math.cos(slopePlus90), targetY - (radius + arrowOffset) * Math.sin(slope) - strength_scale(d.percent) * Math.sin(slopePlus90)];

    points.push(first);
    points.push(second);
    points.push(third);
    points.push(fourth);
    points.push(fifth);


    return d3LineLinear(points) + "Z";
}


/** setup: grabs all the necessary data
 *
 **/
function setup()
{
    // call getters
    getCandidates();
    getIndustries();
    getVotes();
    getIndustryToCandidates();

    drawNodes(votes, "vote");
    drawNodes(candidates, "candidate");
    drawNodes(industries, "industry");

    drawConnections(industryToCandidates, "ind2cand");
}

setup();
