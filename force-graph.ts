<!DOCTYPE html>
<meta charset="utf-8">

<h2>Ontology Map</h2>
<svg></svg>
<script src="https://d3js.org/d3.v5.min.js"></script>
<script>

    /**
    * Functionalities.
    * add, update, delete nodes.
    * add, update, delete wedges.
    **/
    //d3 code goes here
    //Characters
    var nodes_data = [
        {
        "id": "1",
        },
        {
        "id": "2",
        },
        {
        "id": "3",
        },
        {
        "id": "4",
        },
        {
        "id": "5",
        },
        {
        "id": "6",
        },
        {
        "id": "7",
        },
        {
        "id": "8",
        },
        {
        "id": "9",
        },
        {
        "id": "10",
        },
        {
        "id": "11",
        },
        {
        "id": "12",
        },
        {
        "id": "13",
        },
        {
        "id": "14",
        },
        {
        "id": "15",
        },
        {
        "id": "16",
        },
        {
        "id": "17",
        },
    ]

    //Relationships
    //type: A for Ally, E for Enemy
    var links_data = [{
            "source": "1",
            "target": "2",
            "type": "A"
        }, {
            "source": "2",
            "target": "3",
            "type": "A"
        }, {
            "source": "2",
            "target": "4",
            "type": "A"
        }, {
            "source": "2",
            "target": "5",
            "type": "A"
        }, {
            "source": "1",
            "target": "6",
            "type": "A"
        }, {
            "source": "6",
            "target": "7",
            "type": "A"
        }, {
            "source": "6",
            "target": "8",
            "type": "A"
        }, {
            "source": "6",
            "target": "9",
            "type": "A"
        }, {
            "source": "1",
            "target": "10",
            "type": "A"
        }, {
            "source": "10",
            "target": "11",
            "type": "A"
        }, {
            "source": "10",
            "target": "12",
            "type": "A"
        }, {
            "source": "10",
            "target": "13",
            "type": "E"
        }, {
            "source": "1",
            "target": "14",
            "type": "A"
        }, {
            "source": "14",
            "target": "15",
            "type": "A"
        }, {
            "source": "14",
            "target": "16",
            "type": "A"
        }, {
            "source": "14",
            "target": "17",
            "type": "A"
        },
        {
            "source": "11",
            "target": "7",
            "type": "wedge"
        }
        ,
        {
            "source": "10",
            "target": "6",
            "type": "wedge"
        },
        {
            "source": "6",
            "target": "14",
            "type": "wedge"
        }
        ,
        {
            "source": "14",
            "target": "2",
            "type": "wedge"
        }
        ,
        {
            "source": "2",
            "target": "10",
            "type": "wedge"
        }
        ,
        {
            "source": "17",
            "target": "8",
            "type": "wedge"
        }
        ,
        {
            "source": "17",
            "target": "9",
            "type": "wedge"
        },
        {
            "source": "11",
            "target": "7",
            "type": "wedge"
        }
        ,
        {
            "source": "17",
            "target": "4",
            "type": "wedge"
        }
        ,
        {
            "source": "16",
            "target": "11",
            "type": "wedge"
        }
    ];

    // Initializations
    let width = 960, height = 600;
    let maxNodeCount = 17;
    const min_zoom = 0.1;
    const max_zoom = 7;
    let wedge_data = links_data.filter(link => link.type=="wedge");
    links_data = links_data.filter(link => link.type!="wedge");
    let svg = d3.select("svg")
                .attr("width", width)
                .attr("height", height)
                .style("background", "aliceblue")
                .on("click", onClick);
    
    
    /* Append svg marker */
    svg.append('svg:defs').selectAll('marker')
        .data(['end'])      // Different link/path types can be defined here
        .enter().append('svg:marker')    // This section adds in the arrows
        .attr('id', String)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 60)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .append('svg:path')
        .attr('d', 'M0,-10L10,0L0,10');

    /* Append master and parent svg groups */
    let gMaster = svg.append('g')
            .attr('class', 'gMaster');
    let gParent = gMaster.append('g')
        .attr('class', 'everythingParent');
    let g = gParent.append('g')
        .attr('class', 'everything');
    
    /* Append rectangle for zoom. */
    g.append('rect')
        .attr('class', 'zoom_rectangle')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white');

    /* zoom handling */
    function zoom_actions() {
        g.attr('transform', d3.event.transform);
    }
    let zoom_handler = d3.zoom().on('zoom', zoom_actions);
    zoom_handler(svg);
        
    //set up simulation 
    let simulation = d3.forceSimulation().nodes(nodes_data);   
    simulation.force("charge_force", d3.forceManyBody().strength([-1500]))
        .force("forceX", d3.forceX().strength(0.2).x(width * .5))
        .force("forceY", d3.forceY().strength(0.2).y(height * .5))
        .force('links', d3.forceLink(links_data.filter(link => link.type!="wedge")).id(d => d.id))
        .on("tick", tickActions);
        
    
    /* Initialize map elements */
    let link = g.append('g').selectAll('.links');
    let wedge = g.append('g').selectAll('.wedges');
    let nodeCircle = g.append('g').selectAll('.node_circle');
    let nodeLabel = g.append('g').selectAll('.node_label');
    

    function updateMap(){

        nodeCircle = nodeCircle.data(nodes_data, function (d) { return d.id; });
        nodeCircle.exit().remove();

        nodeLabel = nodeLabel.data(nodes_data, function (d) { return d.id; });
        nodeLabel.exit().remove();

        link = link.data(links_data, function (d) { return d.source.id + '-' + d.target.id; });
        link.exit().remove();

        wedge = wedge.data(wedge_data, function (d) { return d.source.id + '-' + d.target.id; });
        wedge.exit().remove();

        link = link.enter().append("line")
                .attr("stroke-width", 1)
                .attr("stroke", "green")
                .merge(link)
                .attr('marker-end', 'url(#end)');

        wedge = wedge.enter()
                .append('path')
                .attr('stroke-width', 1)
                .attr('fill', '#d9d9d9')
                .merge(wedge);

        nodeCircle = nodeCircle.enter()
                .append("circle")
                .attr("r", 15)
                .attr("fill", "white")
                .attr("stroke", "red")
                .attr("stroke-width", "1.5")
                .style("stroke-dasharray", ("4,4"))
                .merge(nodeCircle);

        nodeLabel = nodeLabel.enter()
            .append("text")
            .attr("x", "-8")
            .attr("y", 35)
            .text((d) => d.id)
            .attr("fill", "black")
            .merge(nodeLabel);
                

        // setup drag handler
        let drag_handler = d3.drag()
            .on("start", drag_start)
            .on("drag", drag_drag)
            .on("end", drag_end);

        drag_handler(nodeCircle);

        simulation.nodes(nodes_data).on('tick', tickActions);
        simulation.force('links', d3.forceLink(links_data).id(d => d.id));
        simulation.alpha(0.3).restart();
    }
    let flip = true;
    function onClick(d){
        // maxNodeCount = maxNodeCount + 1;
        // nodes_data.push({
        //     "id": maxNodeCount.toString()
        // });
        randomSource1 = Math.floor(Math.random() * Math.floor(maxNodeCount-1));
        randomSource2 = Math.floor(Math.random() * Math.floor(maxNodeCount-1));
       
        if(flip){
            wedge_data.push({
            "source": "17",//randomSource1.toString()=="0"?"1":randomSource1.toString(),
            "target": "9",//randomSource2.toString()=="0"?"1":randomSource2.toString(),
            "type": "wedge"
            });
            flip = false;
        }
        else{
            wedge_data.push({
            "source": "9",//randomSource1.toString()=="0"?"1":randomSource1.toString(),
            "target": "17",//randomSource2.toString()=="0"?"1":randomSource2.toString(),
            "type": "wedge"
            });
            flip = true;
        }
        assignWedgePosition(wedge_data);
        //console.log(maxNodeCount+" "+randomSource);
        updateMap();
    }

    //drag handler
    //d is the node 
    function drag_start(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function drag_drag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    // // for sticky behaviour
    function drag_end(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = d.x;
        d.fy = d.y;
    }

    // calculate midpoints of wedges
    function getWedgeMidpoint(x1, x2, y1, y2) {
            let k, h, l, p1, p2, p3, p4, q1, q2, q3, q4, c1, c2, d1, d2, z1, z2, j1, j2, px1 = 0, px2 = 0, py1 = 0, py2 = 0, m1, m2, angle = Math.PI / 100;
            let points = [];
            m1 = (x2 + x1) / 2;
            m2 = (y2 + y1) / 2;

            // find points using tan angle
            l = Math.sqrt((m1-x1)*(m1-x1) + (m2-y1)*(m2-y1));
            dx = -x1 + m1;
            dy = y1 - m2;
            k = dy * Math.tan(angle) * 8;
            h = dx * Math.tan(angle) * 8;
            points[0] = m1 + k;
            points[1] = m2 + h;

            return points;
        }

    // calculate positions of wedges having same source and target nodes
    function getMultiWedgeMidpoint(x1, x2, y1, y2, wedgePosition) {
            let k, h, l, p1, p2, p3, p4, q1, q2, q3, q4, c1, c2, d1, d2, z1, z2, j1, j2, px1 = 0, px2 = 0, py1 = 0, py2 = 0, m1, m2, angle = Math.PI / 100;
            let points = [];
            m1 = (x2 + x1) / 2;
            m2 = (y2 + y1) / 2;

            // find points using tan angle
            l = Math.sqrt((m1-x1)*(m1-x1) + (m2-y1)*(m2-y1));
            dx = -x1 + m1;
            dy = y1 - m2;
            k = dy * Math.tan(angle) * 8 * wedgePosition;
            h = dx * Math.tan(angle) * 8 * wedgePosition;
            points[0] = m1 + k;
            points[1] = m2 + h;

            return points;
        }


        function assignWedgePosition(wedges){
            let links = JSON.parse(JSON.stringify(wedges));
            let duplicateLinks = [];
            for(let i=0; i<links.length; i++){
                let filteredLinks = [];
                let source = links[i].source;
                let target = links[i].target;
                let link = { "source": source, "target": target};
                // check if search for the link is already done
                let searchLink = true;
                for(let i=0; i<duplicateLinks.length; i++){
                    if(duplicateLinks[i]['source'] === source && duplicateLinks[i]['target'] === target) searchLink=false;
                }

                if(searchLink){
                    duplicateLinks.push(link);
                    filteredLinks = wedges.filter(function (el) {
                        let elSource = el.source;
                        let elTarget = el.target;
                        return  elSource=== source &&
                                elTarget=== target;
                    });
                    
                    if(filteredLinks.length > 1){ 
                        // found array of links having same source and target.
                        //for(let i=0; i<filteredLinks.length; i++){
                            let wedgeCounter = 0;
                            for(let j=0; j<wedges.length; j++){
                                if(filteredLinks[0].source === wedges[j].source && filteredLinks[0].target === wedges[j].target){
                                    wedgeCounter = wedgeCounter+1;
                                    wedge_data[j].wedgePosition = wedgeCounter;
                                }
                            }
                        //}
                        
                    } 
                }
            }
        } // End of function assignWedgePosition


    // 
    function fixNodes(){
        for(let i=0; i<nodeCircle["_groups"][0].length; i++){
            nodeCircle["_groups"][0][i].__data__.fx = nodeCircle["_groups"][0][i].__data__.x;
            nodeCircle["_groups"][0][i].__data__.fy = nodeCircle["_groups"][0][i].__data__.y;
        }
    }



    function tickActions() {
        //update circle positions to reflect node updates on each tick of the simulation 

        nodeCircle.attr('transform', (d) => `translate(${d.x},${d.y})`)
            .attr('style', (d) => `transform: matrix(1, 0, 0, 1, ${d.x}, ${d.y});`)
            .style("stroke-dasharray", ("4,4"));

        nodeLabel.attr('transform', (d) => `translate(${d.x},${d.y})`)
            .attr('style', (d) => `transform: matrix(1, 0, 0, 1, ${d.x}, ${d.y});`);

        //update link positions 
        //simply tells one end of the line to follow one node around
        //and the other end of the line to follow the other node around
        link
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            })
            .attr("opacity", (d) => {
                return d.type == "wedge"? 0: 1;
            });

        wedge.attr('d', (d) => {
            let points, k, h, l, x1, x2, p1, p2, p3, p4, q1, q2, q3, q4, c1, c2, d1, d2, z1, z2, px1 = 0, px2 = 0, py1 = 0, py2 = 0, y1, y2, m1, m2, angle = Math.PI / 100;

            x1 = nodeCircle["_groups"][0][parseInt(d.source)-1].__data__.x;
            y1 = nodeCircle["_groups"][0][parseInt(d.source)-1].__data__.y;
            x2 = nodeCircle["_groups"][0][parseInt(d.target)-1].__data__.x;
            y2 = nodeCircle["_groups"][0][parseInt(d.target)-1].__data__.y;

            if(d.hasOwnProperty('wedgePosition') && d.wedgePosition<=16){
                points = getMultiWedgeMidpoint(x1, x2, y1, y2, d.wedgePosition);
            }else{
                points = getWedgeMidpoint(x1, x2, y1, y2);
            }

            //points = getWedgeMidpoint(x1, x2, y1, y2);
            z1 = points[0];
            z2 = points[1];

            // Calculate first wedge points
            l = Math.sqrt((x1 - z1) * (x1 - z1) + (y1 - z2) * (y1 - z2));
            let dy = (z2 - y1);
            let dx = (- z1 + x1);
            k = dy * Math.tan(angle) / 3
            h = dx * Math.tan(angle) / 3
            p1 = x1 + k
            p2 = x1 - k
            q1 = y1 + h
            q2 = y1 - h

            // Calculate second wedge points
            l = Math.sqrt((z1 - x2) * (z1 - x2) + (z2 - y2) * (z2 - y2));
            dy = (y2 - z2);
            dx = (- x2 + z1);
            k = dy * Math.tan(angle) / 3
            h = dx * Math.tan(angle) / 3
            p3 = z1 + k
            p4 = z1 - k
            q3 = z2 + h 
            q4 = z2 - h

            return 'M ' + p1 + ' ' + q1 +
                ' L ' + p2 + ' ' + q2 +
                'L ' + z1 + ' ' + z2 +
                
                'L ' + x2 + ' ' + y2 +
                'L ' + p3 + ' ' + q3 +
                'm -4, 0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0'
                ;

            //return 'M ' + 0 + ' ' + 0;


            })
            .attr('stroke', 'none')
            .attr('stroke-width', '1')
            .attr("opacity", (d) => {
                return d.type == "wedge"? 1: 0;
            });
    }

    updateMap();
    
    // function will wait for 3 seconds and then call fixnodes function.
    let timer = d3.interval(function(duration) {
            console.log(duration);
            if (duration > 3000){
                timer.stop();
                //fixNodes();
            } 
         }, 100)
</script>
