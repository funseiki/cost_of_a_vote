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
var margin       = {},
    width        = 0,
    height       = 0,
    node_width   = 30,
    node_padding = 14;

// Nodes
var candidates = [],
    contributors = [],
    bills      = [],
    nodeMap    = {},
    radius     = 10;

// Links
var contributorsToCandidates = [],
    candidatesToVotes    = [],
    totalLinks           = [];

// Drawing Helper Functions
var path           = null,
    formatNumber   = null,
    format         = null,
    color          = null;

function getNodeText(node)
{
    var title = "";
    if(node.name)
    {
        title = node.name;
    }
    else if(node.short_title)
    {
        title = node.short_title;
    }
    else
    {
        title = node.type + node.id;
    }
    return title;
}

function getLinkText(node)
{
    var retStr = "";
    if(node.vote)
    {
        retStr = "No vote";
        switch(node.vote)
        {
            case "+":
                retStr = "Voted for the bill"
            break;
            case "-":
                retStr = "Voted against the bill"
            break;
            default:
                break;
        }
    }
    else
    {
        retStr = format(node.value);
    }
    return retStr;
}

function requestData(url, callback)
{
    var location = "/data" + url +".json";
    $.ajax({
        url: location,
        success: function(data)
        {
            callback(null, data);
        }
    });
}

/** concatNodes
 *   Concatenates all the associative arrays together
 *   nodeList: array of objects
 *   callback: Function that takes the output
 **/
function concatNodes(nodeList, callback)
{
    var out = {};
    for(var i = 0; i < nodeList.length; i++)
    {
        var data = nodeList[i];
        for (var key in data)
        {
            out[key] = data[key];
        }
    }
    callback(out);
}

function getContributorsToCandidates(callback)
{
    /** source: industry id
     *  target: candidate id
     **/
    requestData('/contributions', function(err, data)
    {
        contributorsToCandidates = data;
        callback();
    });
    /*contributorsToCandidates = [
        {source: "#ind_" + 0, target: "#cand_" + 2, percent: 20, value: 200}
     ,  {source: "#ind_" + 0, target: "#cand_" + 8, percent: 14, value: 300}
     ,  {source: "#ind_" + 0, target: "#cand_" + 3, percent: 36, value: 200}
     ,  {source: "#ind_" + 1, target: "#cand_" + 4, percent: 10, value: 200}
     ,  {source: "#ind_" + 4, target: "#cand_" + 2, percent: 10, value: 200}
     ,  {source: "#ind_" + 5, target: "#cand_" + 8, percent: 50, value: 200}
     ,  {source: "#ind_" + 8, target: "#cand_" + 9, percent: 3, value: 200}
    ];
    callback();*/
}

function getVotes(callback)
{
    requestData('/votes', function(err, data)
    {
        candidatesToVotes = data;
        for (var i = 0; i < candidatesToVotes.length; i++)
        {
            var link = candidatesToVotes[i];
            link.vote = link.value;
            link.value = 10;
        };
        callback();
    });
    /*candidatesToVotes = [
        {source: "#cand_" + 2, target: "#bill_" + 0, value:10, vote:1}
     ,  {source: "#cand_" + 1, target: "#bill_" + 0, value:10, vote:0}
     ,  {source: "#cand_" + 2, target: "#bill_" + 1, value:10, vote:0}
     ,  {source: "#cand_" + 4, target: "#bill_" + 2, value:10, vote:-1}
     ,  {source: "#cand_" + 9, target: "#bill_" + 1, value:10, vote:1}
     ,  {source: "#cand_" + 9, target: "#bill_" + 0, value:10, vote:1}
     ,  {source: "#cand_" + 3, target: "#bill_" + 3, value:10, vote:-1}
     ,  {source: "#cand_" + 2, target: "#bill_" + 4, value:10, vote:1}
     ,  {source: "#cand_" + 5, target: "#bill_" + 4, value:10, vote:-1}
     ,  {source: "#cand_" + 4, target: "#bill_" + 3, value:10, vote:1}
    ];
    callback();*/
}

function getBills(callback)
{
    requestData('/bills', function(err, data)
    {
        bills = data;
        for(var key in data)
        {
            bills[key].type = 'Bill';
        }
        callback();
    });

    // TODO: Query database for this
    /*for(var i = 0; i < 5; i++)
    {
        var bill = {
            name: "bill_" + i,
            type: "something",
            id: i
        };
        bills.push(bill);
        nodeMap["#bill_" + bill.id] = bill;
    }
    callback();*/
}

function getContributors(callback)
{
    requestData('/contributors', function(err, data)
    {
        contributors = data;
        for(var key in data)
        {
            contributors[key].type = 'Contributor';
        }
        callback();
    });

    // TODO: Query database for this
    /*for (var i = 0; i < 10; i++)
    {
        var ind = {
            name       : 'industry' + i
        ,   id         : i
        ,   pacs       : i+ 30
        ,   individual : i+10
        ,   type       : 'industry'
        };
        contributors[i] = ind;
        nodeMap["#ind_" + ind.id] = ind;
    }
    callback();*/
}

function getCandidates(callback)
{
    requestData('/candidates', function(err, data)
    {
        for(var key in data)
        {
            var node = data[key];
            candidates[node.opensecrets_id] = node;
            candidates[node.opensecrets_id].type = 'Candidate';
        }
        callback();
    });

    // TODO: Query database for this
    /*for (var i = 0; i < 10; i++)
    {
        var candidate = {
            name: 'candidate' + i
        ,   id: i
        ,   type: 'candidate'
        };
        candidates[i] = candidate;
        nodeMap["#cand_" + candidate.id] = candidate;
    }
    callback();*/
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
                    var title = getNodeText(d);
                    if(d.type != "Bill")
                    {
                        title += "\n" + format(d.value);
                    }
                    return title;
                })
    node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy/2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(getNodeText)
        .filter(function(d) { return d.x < width / 2; })
            .attr("x",  6 + sankey.nodeWidth())
            .attr("text-anchor", "start");

}

function drawConnections(connectionData, connectionClass)
{
    connection = connection_layer.selectAll("." + connectionClass)
        .data(connectionData)
        .enter().append("path")
            .attr("class", function(d)
                {
                    var linkType = "money";
                    var voteType = "voteless";
                    switch(d.vote)
                    {
                        case "+":
                            linkType = "vote"
                            voteType = "vote-yes";
                            break;
                        case "-":
                            linkType = "vote"
                            voteType = "vote-no";
                            break;
                        default:
                            voteType = "voteless";
                            linkType = "money";
                            break;
                    }
                    return connectionClass + " " + linkType + " " + voteType;
                })
            .attr("d", path)
            .style("stroke-width", function(d)
                { return Math.max(1, d.dy); })
            .sort(function(a,b)
                { return b.dy - a.dy; })
    connection.append("title")
            .text(function(d)
                {
                    return getNodeText(d.source) + "->" +
                            getNodeText(d.target) + "\n" +
                            getLinkText(d);
                            //format(d.value);
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
    margin = {top: 10, right:20, bottom: 30, left:10},
    width = $(window).width() - margin.left - margin.right,
    height = $(window).height() - margin.top - margin.bottom;

    svg = d3.select("#visualization").insert("svg")
        .attr("width", width)
        .attr("height", height + 50);
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
        .links(totalLinks)
        .layout(32);

    drawConnections(totalLinks, "link");
    drawNodes(d3.values(nodeMap), "node")
}

/** setup: grabs all the necessary data
 **/
function setup()
{
    initLayers();

    // Setup functions
    setupFunctions();

    drawSankey();
}

function pruneData(oldLinks, mappings, callback)
{
    var new_links = [];
    for(var i = 0; i < oldLinks.length; i++)
    {
        var link = oldLinks[i];

        // Make sure we have all the data to make a link
        if(mappings[link.source] && mappings[link.target])
        {
            new_links.push(link);
        }
    }
    callback(new_links);
}

function getData(callback)
{
    // call getters
    getCandidates(function()
    {
        getContributors(function()
        {
            getBills(function()
            {
                getContributorsToCandidates(function()
                {
                    getVotes(function()
                    {
                        concatNodes([contributors, candidates, bills], function(nodes)
                        {
                            nodeMap = nodes;
                            var links = contributorsToCandidates.concat(candidatesToVotes);
                            pruneData(links, nodeMap, function(new_links)
                            {
                                totalLinks = new_links;
                                callback();
                            });
                        });
                    });
                });
            });
        });
    });
}

$(document).ready(function()
{
    // Grab the data and run setup
    getData(function()
    {
        setup();
    });
});

