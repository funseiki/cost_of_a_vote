var candidates = [];
var industries = [];
var votes = [];
var industryFunding = [];
var candidateVotes = [];

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
            .attr("r", 10);
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

    drawNodes(votes, "vote");
    drawNodes(candidates, "candidate");
    drawNodes(industries, "industry");
}

setup();
