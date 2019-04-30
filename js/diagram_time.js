var branchingStrategy = {
    0: 'Most infeasible branching',
    1: 'Strong branching',
    2: 'Pseudocost branching',
    3: 'Hybrid branching',
    4: 'Random branching'
};

function diagramTime(data, svg) {

    var margin = { top: 50, right: 50, bottom: 50, left: 50 }
        , width = svg.attr("width") - margin.left - margin.right // Use the window's width 
        , height = svg.attr("height") - margin.top - margin.bottom; // Use the window's height

    let maxTime = 0;
    let maxY = 0;
    for (let i = 0; i < data.length; i++) {
        maxTime = Math.max(maxTime, ...data[i].map(d => d.time));
        maxY = Math.max(maxY, ...data[i].map(d => d.U === 'inf' ? 0 : d.U));
    }

    var xScale = d3.scaleLinear()
        .domain([0, maxTime])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0]);

    // time diagram
    var g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    //axis
    g.append("g")
        .classed("x-axis", true)
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    g.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.top})`)
        .style("text-anchor", "middle")
        .text("t");

    g.append("g")
        .classed("y-axis", true)
        .call(d3.axisLeft(yScale));
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - (margin.left + 2))
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("UB");

    //data
    var lineTime = d3.line()
        .x(function (d, i) { return xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return yScale(d.y); }) // set the y values for the line generator 
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    var legendEntriesArr = [];

    for (let i = 0; i < data.length; i++) {
        g.append("path")
            .datum(data[i].map(d => {
                return {
                    x: d.time,
                    y: (d.U === "inf" ? Number.MAX_SAFE_INTEGER : d.U)
                };
            }))
            .classed('line', true)
            .attr('stroke', colorScale(i))
            .attr("d", lineTime);

        legendEntriesArr.splice(i, 0, branchingStrategy[i]);
    }

    // legend
    const legend = g.append("g")
        .attr('id', 'legend')
        .attr('transform', `translate(${width - 3 * margin.right}, 0)`);

    const legendEntries = legend.selectAll()
        .data(legendEntriesArr)
        .enter();

    legendEntries
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 0.5 * margin.top)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", (d, i) => colorScale(i));
    legendEntries
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 0.5 * margin.top + 5)
        .attr("line-height", 10)
        .classed("legend-text", true)
        .text(d => d)
}

Promise.all([
    d3.dsv(";", "/data/score_1_0.csv"),
    d3.dsv(";", "/data/score_1_1.csv"),
    d3.dsv(";", "/data/score_1_2.csv"),
    d3.dsv(";", "/data/score_1_3.csv"),
    d3.dsv(";", "/data/score_1_4.csv"),
])
    .then(data => {
        var svg = d3.select('#diagram_time_1');
        diagramTime(data, svg);
    });

Promise.all([
    d3.dsv(";", "/data/score_2_0.csv"),
    d3.dsv(";", "/data/score_2_1.csv"),
    d3.dsv(";", "/data/score_2_2.csv"),
    d3.dsv(";", "/data/score_2_3.csv"),
    d3.dsv(";", "/data/score_2_4.csv"),
])
    .then(data => {
        var svg = d3.select('#diagram_time_2');
        diagramTime(data, svg);
    });


    Promise.all([
        d3.dsv(";", "/data/score_2_long_0.csv"),
        d3.dsv(";", "/data/score_2_long_1.csv"),
        d3.dsv(";", "/data/score_2_long_2.csv"),
        d3.dsv(";", "/data/score_2_long_3.csv"),
        d3.dsv(";", "/data/score_2_long_4.csv"),
    ])
        .then(data => {
            var svg = d3.select('#diagram_time_3');
            diagramTime(data, svg)
        });