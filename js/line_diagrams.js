var branchingStrategy = {
    0: 'Most infeasible branching',
    1: 'Strong branching',
    2: 'Pseudocost branching',
    3: 'Hybrid branching',
    4: 'Random branching'
};

var diagrams = {
    'misc07_score16': 'misc07_score16',
    'misc07_score16_long': 'misc07_score16_long',
    'misc07_scorea+b': 'misc07_scoreab',
    'score_1': 'markshare_score1',
    'score_2': 'markshare_score2',
    'other_b_method': 'other_b',
    'other_node_selection': 'other_node_selection',
    'other_bb_score_min':'other_bb_score_min',
};



extractIter = d => d.iter;
extractTime = d => d.time /1000;
extractYLB = d => (d.L === "inf" ? Number.NEGATIVE_INFINITY + 50 : d.L);
extractYUB = d => (d.U === "inf" ? Number.POSITIVE_INFINITY : d.U);

function update(data, svg, activeData, extractX, extractYLB, extractYUB, xAxisTitle, yAxisTitle = 'LB / UB') {
    var bbox = d3.select('#' + svg.attr('id')).node().getBoundingClientRect();

    var margin = { top: 50, right: 50, bottom: 50, left: 50 }
        , width = +bbox.width - margin.left - margin.right // Use the window's width 
        , height = +bbox.height - margin.top - margin.bottom; // Use the window's height


    let maxX = 0;
    let maxY = 0;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;

    for (let i = 0; i < data.length; i++) {
        if (activeData[i]) {
            maxX = Math.max(maxX, ...data[i].map(extractX))
            maxY = Math.max(maxY, ...data[i].map(d => d.U === 'inf' ? d.L : d.U));
            minX = Math.min(minX, ...data[i].map(extractX));
            minY = Math.min(minY, ...data[i].map(d => d.U === 'inf' ? d.L : d.U));
        }
    }

    minX = Math.min(minX, 0);
    minY = Math.min(minY, 0);
    var xScale = d3.scaleLinear()
        .domain([minX, maxX])
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([height, 0]);

    // clear out old stuff
    svg.selectAll('*').remove()

    // diagram
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
        .text(xAxisTitle);
    g.append("g")
        .classed("y-axis", true)
        .call(d3.axisLeft(yScale));
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - (margin.left + 2))
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yAxisTitle);


    //data
    var lineIter = d3.line()
        .x(function (d, i) { return xScale(d.x); }) // set the x values for the line generator
        .y(function (d) { return yScale(d.y); }) // set the y values for the line generator 

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    var legendEntriesArr = [];

    // This allows to find the closest X index of the mouse:
    var bisect = d3.bisector(function (d) { return d.x; }).left;
    var focusText = g
        .append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle");

    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
        focusText.style("opacity", 1)
    }

    tooltipMouseOver = (d, i) => {
        const x = Math.floor(xScale.invert(d3.event.pageX - margin.left - bbox.x));
        const selectdI = bisect(d, x, 1)
        const data = d[selectdI];
        
        focusText
            .html("x:" + data.x + "  -  " + "y:" + data.y)
            .attr("x", xScale(data.x) + 15)
            .attr("y", yScale(data.y))
    };

    function mouseout() {
        focusText.style("opacity", 0)
    }
    for (let i = 0; i < data.length; i++) {

        colorScale(i)
        legendEntriesArr.splice(i, 0, branchingStrategy[i]);

        var u = g.select(`#ub-${i}.parent`);
        u.remove();
        if (!activeData[i]) {
            continue;
        }

        const ubLine = g.append("path")
            .datum(data[i].map(d => {
                return {
                    x: extractX(d),
                    y: Math.min(extractYUB(d), maxY + 50)
                };
            }))
            .attr('id', `#ub-${i}`);

        const lbLine = g.append('path')
            .datum(data[i].map(d => {
                return {
                    x: extractX(d),
                    y: Math.max(extractYLB(d), minY)
                };
            }))
            .attr('id', `#lb-${i}`)
        applyLine = (l) => l
            .classed(`line d-${i}`, true)
            .attr('stroke', colorScale(i))
            .attr("d", lineIter)
            .on('mouseover', mouseover)
            .on('mousemove', tooltipMouseOver)
            .on('mouseout', mouseout);

        applyLine(ubLine);
        applyLine(lbLine);
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
        .attr("y", (_, i) => i * 0.5 * margin.top)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", (_, i) => colorScale(i))
        .on('click', (_, i) => {
            activeData[i] = !activeData[i]
            update(data, svg, activeData, extractX, extractYLB, extractYUB, xAxisTitle, yAxisTitle)
        });
    legendEntries
        .append("text")
        .attr("x", 15)
        .attr("y", (_, i) => i * 0.5 * margin.top + 5)
        .attr("line-height", 10)
        .classed("legend-text", true)
        .text(d => d)
}

function iterDiagram(data, svg) {
    var activeData = []
    for (let i = 0; i < data.length; i++) {
        activeData[i] = true;
    }
    update(data, svg, activeData, extractIter, extractYLB, extractYUB, 'iter');
}

function timeDiagram(data, svg) {
    var activeData = []
    for (let i = 0; i < data.length; i++) {
        activeData[i] = true;
    }
    update(data, svg, activeData, extractTime, extractYLB, extractYUB, 't [s]');
}

for (const key in diagrams) {
    Promise.all([
        d3.dsv(";", `/data/${key}_0.csv`),
        d3.dsv(";", `/data/${key}_1.csv`),
        d3.dsv(";", `/data/${key}_2.csv`),
        d3.dsv(";", `/data/${key}_3.csv`),
        d3.dsv(";", `/data/${key}_4.csv`),
    ])
        .then(data => {
            var iterSvg = d3.select(`#${diagrams[key]}_iter`);
            iterDiagram(data, iterSvg)
            var timeSvg = d3.select(`#${diagrams[key]}_t`);
            timeDiagram(data, timeSvg)
        });

}