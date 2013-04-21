var candidates = [];
var industries = [];
var votes = [];

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
        };
        candidates.push(candidate);
    }
}

function drawNodes(nodeData, nodeClass)
{
    d3.select("svg").selectAll("circle." + nodeClass)
        .data(nodeData)
        .enter().append("circle")
        .attr("class", nodeClass)
        .attr("cx", function(d)
        {
            var x = 0;
            switch(nodeClass)
            {
                case 'industry':
                    x = 20;
                    break;
                case 'candidate':
                    x = 170;
                    break;
                case 'vote':
                    x = 220;
                    break;
                default:
                    break;
            }
            return x;
        })
        .attr("cy", function(d, i)
        {
            return i*25 + 20;
        })
        .attr("r", 10)
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
