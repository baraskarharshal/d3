import { Component, OnInit, ViewContainerRef, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/shared/services/api.service';
import { VisualComponent } from '../visual.component';
import { Visual } from 'src/app/shared/interfaces/visual.interface';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { DashboardState } from '../../../state/dashboard/dashboard.state';
import * as d3 from "d3";
import { IconService } from '../../icon.service';
import { Dashboard } from 'src/app/shared/interfaces/dashboard.interface';
import { UpdateOntologyOnNetwork, UpdateOntologyOnList } from './state/ontology-actions';
import { LoadClasses } from 'src/app/core/layout/entry-panel/state/entry-panel.actions';
import { EntryPanelState } from 'src/app/core/layout/entry-panel/state/entry-panel.state';
import { ULCluster } from 'src/app/shared/interfaces/ul-datatypes/ul-cluster.interface';
import { OpenExploreDashboard } from '../../../state/dashboard/dashboard.actions';

@Component({
    selector: 'ulysses-visual-ontology',
    templateUrl: './visual-ontology.component.html',
    styleUrls: ['./visual-ontology.component.scss']
})
export class VisualOntologyComponent extends VisualComponent<Visual> implements OnInit, AfterViewInit {

    @ViewChild('visualContainer')
    visualContainer: ElementRef;
    dashboard: Dashboard;
    entityInstancesCount = {};
    entityCountLoaded: boolean = false;
    width: number;
    height: number;
    nodesData: any;
    linksData: any;
    wedgeData: any;
    svg: any;
    gMaster: any;
    gParent: any;
    g: any;
    zoomHandler: any;
    simulation: any;
    link: any;
    wedge: any;
    nodeCircle: any;
    nodeLabel: any;
    dragHandler: any;
    nodeFaIcon: any;
    nodeSvgIcon: any;
    node: any;
    selectedNode: any;
    tooltipInstance: any;
    vcElement: any;
    displayTooltip: any;
    editTooltip: any;
    selectTooltip: any;
    iconList: any;
    wedgeLabel: any;
    shiftKey: any;
    nodeIdsList: Array<string> = [];

    formattedData: ({ "nodes": any; "links"?: undefined; } | { "links": any; "nodes"?: undefined; })[];
    // Map Configuration
    nodeLabelColor: any = "black";
    nodeCircleColor: any = "red";
    nodeCircleDashArray: any = ("4,4");
    nodeIconSize: number = 0.50;// Max is 0.80 for good results.
    nodeFaIconColor: any = '#00C9F4';
    nodeCircleStrokeWidth: any = "1";
    nodelabelSpace: any = 90; // Use greater than 80 for good results
    defaultIcon: string;

    linkOpacity: number = 1;
    linkStrokeWidth: any = 1;
    //linkLength: any = 2000; // force simulation parameter
    linkColor: any = "#0cc40c";
    wedgeColor: any = "#DBEDE0";
    wedgeOpacity: any = 1;
    wedgeLabelSize: number = 10;
    wedgeLabelSpace: number = 20;
    nodeSelect: any;
    //After mouseover varibles
    linkStrokeWidthMouseOver: any = 2;
    linkOpacityMouseOver: number = 0.2;
    nodeCircleStrokeWidthMouseOver: any = "3";
    nodeCircleDashArrayMouseOver: any = ("6,6");
    nodeIconSizeMouseOver: number = 0.70;// Max is 0.80 for good results.
    nodelabelSpaceMouseOver: any = 110; // Use greater than 80 for good results
    linkedByIndex: any = {};
    linkIndex: any = {};
    isNodeClicked: boolean = false;
    wedgeClicked: boolean;
    selectedWedge: any;
    propertyToolTip: any;
    selectedNodeHierarchy: string[] = [];
    selectedNodeRelation: any[];



    constructor(private api: ApiService,
        private actions$: Actions,
        private iconService: IconService,
        private store: Store) {
        super();
        //this.store.dispatch(new LoadClasses());
    }

    ngAfterViewInit() {
        this.visual.onResize = this.zoomOnWindowResize;
    }

    ngOnInit() {
        this.dashboard = this.store.selectSnapshot(DashboardState.getSelected);
        this.store.select(EntryPanelState.getInstancesCount)
        .subscribe(instanceCounts => {
            if (instanceCounts && instanceCounts.length > 0) {
            instanceCounts.forEach(instanceCount => {
                this.entityInstancesCount[instanceCount['class'].uuid.uri] = instanceCount['numInstances'];
            });
            this.entityCountLoaded = true; 
            }
        });
        
        // get node icons
        this.iconList = this.iconService.getIcons();
        this.defaultIcon = this.iconList[0].icon; // Initialize default icon
        this.actions$
            .pipe(ofActionSuccessful(UpdateOntologyOnNetwork))
            .subscribe(options => {
                //need to handle this using custom map
                if (options.actionType.id !== this.dashboard.id) return;
                if (options.data != undefined) {
                    this.formattedData = [];
                    this.nodesData = options.data.nodes;
                    this.linksData = options.data.links;
                    this.wedgeData = options.data.wedges;
                    this.nodeIdsList = options.data.nodeIds;
                    this.formattedData['nodes'] = this.nodesData;
                    this.formattedData['links'] = this.linksData;
                    this.formattedData["wedges"] = this.wedgeData;
                }
                if (options.actionType.action == "OPEN_MAP") {
                    this.initMap();
                    this.updateMap();
                }
                else if (options.actionType.action == "CREATE_NODE") {
                    this.getActiveWedges();
                    this.assignWedgePosition(this.wedgeData);
                    this.updateMap();
                }
                else if (options.actionType.action == "CREATE_OBJECT_PROPERTY") {
                    this.getActiveWedges();
                    this.assignWedgePosition(this.wedgeData);
                    this.updateMap();
                }
                else if (options.actionType.action == "UPDATE_NODE") {
                    this.getActiveWedges();
                    this.assignWedgePosition(this.wedgeData);
                    this.updateMap();
                    // Update the label of selected node in DOM
                    d3.selectAll('#' + options.data.updatedNodeId + 'label')
                        .text(options.data.updatedNodeLabel);
                    this.svgClick(null);
                }
                else if (options.actionType.action == "UPDATE_WEDGE") {
                    let d = options.data.updatedWedge;
                    this.getActiveWedges();
                    this.assignWedgePosition(this.wedgeData);
                    this.updateMap();
                    // Update the label of selected node in DOM
                    d3.selectAll('#' + d.source+d.target+d.wedgePosition + "wedgeLabel")
                        .text(d.label);
                    this.svgClick(null);
                }
                else if (options.actionType.action == "UPDATE_MAP") {
                    this.getActiveWedges();
                    this.assignWedgePosition(this.wedgeData);
                    this.updateMap();
                    this.svgClick(null);
                }
                else if (options.actionType.action == "UPDATE_ON_EXPLORE") {
                    // get icons for new classes
                    this.iconList = this.iconService.getIcons();
                    this.getActiveWedges();
                    this.assignWedgePosition(this.wedgeData);
                    // get links excluding wedges
                    this.linksData = this.linksData.filter(link => link.type != "wedge");
                    this.simulation.stop();
                    this.updateMap();
                    this.simulation.alpha(0.6).restart();
                    this.visual.isLoading = false;
                }
                else if (options.actionType.action == "UPDATE_FAILURE") {
                    this.visual.isLoading = false;
                }
            });
    }

    ngOnDestroy() {
        d3.select(this.visualContainer.nativeElement).remove();
    }

    /**
     * Initializes force graph/map elements
     */
    private initMap() {
        //remove any existing graph.
        this.width = this.visualContainer.nativeElement.offsetWidth;
        this.height = this.visualContainer.nativeElement.offsetHeight;
        this.vcElement = this.visualContainer.nativeElement
        d3.selectAll('#graphID-' + this.visual.id).select('svg').remove();
        this.visual.isLoading = false;
        // get only wedges for which source and target both nodes exists
        this.getActiveWedges();
        this.wedgeData = this.wedgeData ? this.wedgeData : [];
        this.assignWedgePosition(this.wedgeData);
        // get links excluding wedges
        this.linksData = this.linksData.filter(link => link.type != "wedge");

        // initialize tooltip
        this.tooltipInstance = d3.select('#menuInstance-' + this.visual.id);
        this.displayTooltip = d3.select('#displayMenuInstance-' + this.visual.id);
        this.editTooltip = d3.select('#editMenuInstance-' + this.visual.id);
        this.selectTooltip = d3.select('#selectMenuInstance-' + this.visual.id);
        this.propertyToolTip = d3.select('#editDeleteInstance-' + this.visual.id);

        //Open Explore Dashbaord for selected class
        d3.selectAll('#ontExplore-' + this.visual.id)
        .on('click', () => {
            const cluster = <ULCluster>{
                entityType: this.selectedNode.uuid,
                label: this.selectedNode.label,
                count: this.entityInstancesCount[this.selectedNode.uuid.uri]
              };
            cluster['@type'] = 'CLUSTER';
            this.store.dispatch(new OpenExploreDashboard(cluster));          
            this.svgClick(null);
        })

        d3.selectAll('#ontExplode-' + this.visual.id)
            .on('click', () => {
                if (this.selectedNode.isExplored != true && this.selectedNode.hasOwnProperty("subClasses") && this.selectedNode.subClasses.length > 0) {
                    this.visual.isLoading = true;
                    this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'EXPLORE_NODE' }, this.selectedNode));
                    this.hideAllContextMenu();
                }
                this.svgClick(null);
            })
        // edit delete tooltip for properties
        d3.selectAll('#ontEdit-' + this.visual.id)
            .on('click', () => {
                this.editEditHandler(); this.hideAllContextMenu(); 
            })

        d3.selectAll('#ontDelete-' + this.visual.id)
            .on('click', () => {
                this.deleteHandler(); this.hideAllContextMenu();
            })

        // display submenu tooltip on click
        d3.selectAll('#ontDisplay-' + this.visual.id)
            .on('click', () => {
                this.showSubmenuTooltip(this.displayTooltip, 'ontDisplay-', 30);
            })

        // d3.selectAll('#ontEdit-' + this.visual.id)
        //     .on('click', () => {
        //         this.showSubmenuTooltip(this.editTooltip, 'ontEdit-', 60);
        //     })

        d3.selectAll('#ontSelect-' + this.visual.id)
            .on('click', () => {
                this.showSubmenuTooltip(this.selectTooltip, 'ontSelect-', 60);
            })

        d3.selectAll('#displayHide-' + this.visual.id).on('click', () => { this.hideNodes(); this.hideAllContextMenu(); });
        d3.selectAll('#displayIsolate-' + this.visual.id).on('click', () => { alert("displayIsolate"); this.hideAllContextMenu(); });
        d3.selectAll('#displayCollapse-' + this.visual.id).on('click', () => { this.nodeCollapseHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#editMakeChildOf-' + this.visual.id).on('click', () => { this.makeChildOfHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#editMakeOrphan-' + this.visual.id).on('click', () => { this.makeOrphanHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#editAddProperty-' + this.visual.id).on('click', () => { alert("editAddProperty"); this.hideAllContextMenu(); });
        d3.selectAll('#editEdit-' + this.visual.id).on('click', () => { this.editEditHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#editDelete-' + this.visual.id).on('click', () => { this.deleteHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#editCreateChild-' + this.visual.id).on('click', () => { alert("editCreateChild"); this.hideAllContextMenu(); });
        d3.selectAll('#selectSiblings-' + this.visual.id).on('click', () => { this.selectByRelationHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#selectParent-' + this.visual.id).on('click', () => { alert("selectParent"); this.hideAllContextMenu(); });
        d3.selectAll('#selectChildrens-' + this.visual.id).on('click', () => { this.selectByHierarchyHandler(); this.hideAllContextMenu(); });
        d3.selectAll('#selectClan-' + this.visual.id).on('click', () => { alert("selectClan"); this.hideAllContextMenu(); });
        d3.selectAll('#selectRelated-' + this.visual.id).on('click', () => { alert("selectRelated"); this.hideAllContextMenu(); });

        this.svg = d3.selectAll('#graphID-' + this.visual.id)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            //.style("background", "aliceblue")
            .on("click", (d) => this.svgClick(d));

        /* Append svg marker */
        let defs = this.svg.append('svg:defs');
        defs.selectAll('marker')
            .data(['end' + this.dashboard.id])      // Different link/path types can be defined here
            .enter().append('svg:marker')    // This section adds in the arrows
            .attr('id', String)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 60)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('fill', 'none')
            .append('svg:path')
            .attr('d', 'M0,-10L10,0L0,10');

        // setup blurr effect definition
        //Filter for the outside glow
        var filter = defs.append("filter")
            .attr("id","glow");
        filter.append("feGaussianBlur")
            .attr("stdDeviation","10")
            .attr("result","coloredBlur");
        var feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode")
            .attr("in","coloredBlur");
        feMerge.append("feMergeNode")
            .attr("in","SourceGraphic");

        /* Append master and parent svg groups */
        this.gMaster = this.svg.append('g')
            .attr('class', 'gMaster');
        this.gParent = this.gMaster.append('g')
            .attr('class', 'everythingParent');
        this.g = this.gParent
            // .attr("tabindex", 1)
            // .on("keydown.brush",(d) => this.keydowned())
            // .on("keyup.brush",(d) => this.keyupped())
            // .each(function() { this.focus(); })
            .append('g')
            .attr('class', 'everything')


        /* Append rectangle for zoom. */
        this.g.append('rect')
            .attr('class', 'zoom_rectangle')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('fill', 'white')
            .on("click", (d) => this.rectClick(d));

        // let brush = this.g.append("g")
        //     .attr("class", "brush");


        this.nodesData.forEach(d => {
            d.selected = false;
            d.previouslySelected = false;
        });

        // brush.call(d3.brush()
        // .extent([[0, 0], [this.width, this.height]])
        // .on("start", (d) => this.brushstarted())
        // .on("brush", (d) => this.brushed())
        // .on("end", (d) => this.brushended()))

        /* zoom handling */
        this.zoomHandler = d3.zoom().on('zoom', this.zoomActions());
        this.zoomHandler(this.svg);

        //set up simulation
        this.simulation = d3.forceSimulation().nodes(this.nodesData);
        this.simulation.force("charge_force", d3.forceManyBody().strength([-1200]))
            .force("forceX", d3.forceX().strength(0.05).x(this.width * .5))
            .force("forceY", d3.forceY().strength(0.05).y(this.height * .5))
            .force('links', d3.forceLink(this.linksData.filter(link => link.type != "wedge")).id(d => d.id).distance((d) => {
                if (d.source.index == "0") return 150;
                let subclassCount = d.source.hasOwnProperty("subClassDetails") ? d.source.subClassDetails.length : 0;
                return subclassCount > 5 ? subclassCount * 15 : 80;
            }))

        /* Initialize map svg groups */
        this.wedge = this.g.append('g').attr("class", "wedges").selectAll('.wedges');
        this.wedgeLabel = this.g.append('g').attr("class", "wedgeLabels").selectAll('.wedgeLabels');
        this.link = this.g.append('g').attr("class", "links").selectAll('.links');
        this.nodeSelect = this.g.append('g').attr("class", "node_select").selectAll('.node_select');
        this.node = this.g.append('g').attr("class", "node_circle").selectAll('.node');
        this.nodeLabel = this.g.append('g').attr("class", "node_label").selectAll('.node_label');

    }

    /**
     * Creates new map &
     * updates existing map
     */
    private updateMap() {

        this.node = this.node.data(this.nodesData, function (d) { return d.id; });
        this.node.exit().transition().duration(1000).style("opacity", 0).remove();
        this.nodeLabel = this.nodeLabel.data(this.nodesData, function (d) { return d.id; });
        this.nodeLabel.exit().remove();
        this.nodeSelect = this.nodeSelect.data(this.nodesData, function (d) { return d.id; });
        this.nodeSelect.exit().remove();
        this.link = this.link.data(this.linksData, function (d) { return d.source.id + '-' + d.target.id; });
        this.link.exit().transition().duration(1000).style("opacity", 0).remove();
        this.wedge = this.wedge.data(this.wedgeData, function (d) { return d.source.id + '-' + d.target.id; });
        this.wedge.exit().remove();
        this.wedgeLabel = this.wedgeLabel.data(this.wedgeData, function (d) { return d.source.id + '-' + d.target.id; });
        this.wedgeLabel.exit().remove();

        this.link = this.link.enter().append("line")
            .attr("stroke-width", this.linkStrokeWidth)
            .attr("id", (d) => 'link_' + d.index)
            .attr("stroke", (d) => this.linkColor)
            .attr("opacity", (d) => this.linkOpacity)
            .attr("click", (d) => this.linkClick(d))
            .merge(this.link)
            .attr('marker-end', 'url(#end' + this.dashboard.id + ')');

        this.node = this.node.enter()
            .append('g')
            .attr("id", (d) => d.id)
            .attr('class', (d) => 'nodes ' + d.id + this.dashboard.id)
            .on("click", (d) => { return this.nodeClick(d) })
            .on('contextmenu', (d) => d.index == 0 ? null : this.nodeContextMenu(d))
            .merge(this.node)
            .call(d3.drag()
                .on("start", (d) => { return this.dragStart(d) })
                .on("drag", (d) => { return this.dragDrag(d) })
                .on("end", (d) => { return this.dragEnd(d) }));

        this.node.append("circle")
            .attr("r", (d, i) => this.dimensions(d, i))
            .attr("fill", "white")
            // .attr("stroke", (d) => d.color)
            .attr("stroke", this.nodeCircleColor)
            .attr("stroke-width", this.nodeCircleStrokeWidth)
            .style("stroke-dasharray", (d) => {
                return d.hasOwnProperty("type") && d.propertyType == "data" ? null : this.nodeCircleDashArray;
            })
            .attr("cursor", "pointer")



        //display svg icon
        this.node.append('image')
            .attr('xlink:href', (d, i) => {
                //return '/assets/svg/cluster/instances.svg';
                return this.getNodeIcon(d, true);
            })
            .attr('width', (d, i) => (this.nodeIconSize * this.dimensions(d, i)) * 2)
            .attr('height', (d, i) => (this.nodeIconSize * this.dimensions(d, i)) * 2)
            .attr('x', (d, i) => (-this.nodeIconSize * this.dimensions(d, i)))
            .attr('y', (d, i) => (-this.nodeIconSize * this.dimensions(d, i)))
            .attr('fill', '#000')
            .attr("cursor", "pointer");

        //display font awesome icon
        this.nodeFaIcon = this.node.append('svg:foreignObject')
            .html((d, i) => '<i class="'+this.getNodeIcon(d, false)+'"></i>')
            .attr('width', (d,i)=>this.dimensions(d, i) * 1.5)
            .attr('height', (d,i)=>this.dimensions(d, i) * 1.5)
            .style('font-size', (d, i) => (this.nodeIconSize * this.dimensions(d, i) * 2))
            .style('color', this.nodeFaIconColor)
            .attr('x', (d, i) => (-this.nodeIconSize * this.dimensions(d, i)))
            .attr('y', (d, i) => (-this.nodeIconSize * this.dimensions(d, i) * 1.5))
            .attr("cursor", "pointer");

        // select image
        this.nodeSelect = this.nodeSelect.enter()
            .append('image')
            .attr('class', (d) => "clickBox" + this.dashboard.id + " selectSvg" + d.id + this.dashboard.id)//(d) => `clickBox id${d.uuid.id.split(' ').join('_')}`)
            .attr('xlink:href', '/assets/img/graph-svg/mouseClick.svg')
            .attr('width', (d, i) => (1.6 * this.dimensions(d, i)) * 2)
            .attr('height', (d, i) => (1.6 * this.dimensions(d, i)) * 2)
            .attr('x', (d, i) => (- 1.6 * this.dimensions(d, i)))
            .attr('y', (d, i) => (- 1.6 * this.dimensions(d, i)))
            .attr('opacity', 0)
            .merge(this.nodeSelect);

        // displays full node label on hover
        this.node.append("title")
            .text((d) => d.label);

        // displays node label below node circle
        this.nodeLabel = this.nodeLabel.enter()
            .append("text")
            .attr('id', (d) => d.id + "label")
            .attr("x", "0")
            .attr("y", (d) => { 
                return ((this.dimensions(d, 0) * 2) * this.nodelabelSpace / 100)<=25? 25: ((this.dimensions(d, 0) * 2) * this.nodelabelSpace / 100); 
            })
            .text((d) => d.label)
            .attr('font-size', 10)
            .attr("fill", this.nodeLabelColor)
            .attr('text-anchor', 'middle')
            .merge(this.nodeLabel);

        this.wedge = this.wedge.enter()
            .append('path')
            .attr('stroke-width', 1)
            .on("click", (d) => { return this.onClickWedge(d) })
            .on('contextmenu', (d) => d.index == 0 ? null : this.wedgeContextMenu(d))
            .attr("cursor", "pointer")
            .attr('stroke', "null")
            .attr('stroke-width', '1')
            .attr("opacity", (d) => d.type == "wedge" ? this.wedgeOpacity : 0)
            .attr('fill', (d) => this.wedgeColor)
            .merge(this.wedge);

        this.wedgeLabel = this.wedgeLabel.enter()
            .append('text')
            .text(d => d.label)
            .attr('id', (d) => d.source+d.target+d.wedgePosition + "wedgeLabel")
            .on("click", (d) => { return this.onClickWedge(d) })
            .on('contextmenu', (d) => d.index == 0 ? null : this.wedgeContextMenu(d))
            .attr("cursor", "pointer")
            .attr('text-anchor', 'middle')
            .attr('font-size', this.wedgeLabelSize)
            .attr('opacity', (d) => d.type == "wedge" ? this.wedgeOpacity : 0)
            .merge(this.wedgeLabel);

        this.simulation.nodes(this.nodesData);
        this.simulation.force('links', d3.forceLink(this.linksData.filter(link => link.type != "wedge")).id(d => d.id).distance((d) => {
            if (d.source.index == "0") return 150;
            let subclassCount = d.source.hasOwnProperty("subClassDetails") ? d.source.subClassDetails.length : 0;
            return subclassCount > 5 ? subclassCount * 15 : 80;
        }))
        this.simulation.on('tick', this.tickActions());

        // create connected index array
        this.linkedByIndex = {};
        this.linkIndex = {};
        this.linksData.forEach(d => {
            this.linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
            this.linkIndex[`${d.index},${d.target.index}`] = 1;
        });

        //setTimeout(() => {
            this.simulation.alpha(0.6).restart();
        //}, 2000);

        // remove duplicate dom elements from node group
        d3.selectAll('.nodes').select('circle:nth-child(5)').remove();
        d3.selectAll('.nodes').select('image:nth-child(5)').remove();
        d3.selectAll('.nodes').select('foreignObject:nth-child(5)').remove();
        d3.selectAll('.nodes').select('title:nth-child(5)').remove();
        this.visual.isLoading = false;

    } // End of updateMap()

    /**
     * returns diameter of node circle based on node type
     */
    dimensions = (d, i) => {
        return d.hasOwnProperty("type") && d.propertyType == "data" ? 10 : d.index === 0 ? 40 : 20;
    };

    /**
     * Zoom actions
     */
    zoomActions() {
        return () => this.g.attr('transform', d3.event.transform);
    }

    /**
     * drag handling functions
     */
    dragStart(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragDrag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    dragEnd(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0);
        d.fx = d.x;
        d.fy = d.y;
    }

    /**
     * multi select
     */
    keydowned() {
        if (!d3.event.metaKey) {
            switch (d3.event.keyCode) {
                case 38: this.nudge(0, -1); break; // UP
                case 40: this.nudge(0, +1); break; // DOWN
                case 37: this.nudge(-1, 0); break; // LEFT
                case 39: this.nudge(+1, 0); break; // RIGHT
            }
        }
        this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
    }

    keyupped() {
        this.shiftKey = d3.event.shiftKey || d3.event.metaKey;
    }

    nudge(dx, dy) {
        this.node.filter(function (d) { return d.selected; })
            .attr("cx", function (d) { return d.x += dx; })
            .attr("cy", function (d) { return d.y += dy; })

        this.link.filter(function (d) { return d.source.selected; })
            .attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; });

        this.link.filter(function (d) { return d.target.selected; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });
    }

    brushstarted() {
        if (d3.event.sourceEvent.type !== "end") {
            this.node.classed("selected", (d) => {
                return d.selected = d.previouslySelected = this.shiftKey && d.selected;
            });
        }
    }

    brushed() {
        if (d3.event.sourceEvent.type !== "end") {
            let selection = d3.event.selection;
            this.node.classed("selected", (d) => {
                let factor: any = (selection != null && selection[0][0] <= d.x && d.x < selection[1][0] && selection[0][1] <= d.y && d.y < selection[1][1]);
                return d.selected = d.previouslySelected ^ factor;
            });
        }
    }

    brushended() {
        if (d3.event.selection != null) {
            d3.select(this).call(d3.event.target.move, null);
        }
    }

    /**
     * Calculates wedge midpoints based on its position
     */
    private getWedgeMidpoint(x1: number, x2: number, y1: number, y2: number, wedgePosition: number) {
        let dx, dy, m1, m2, k, h;
        let points: Array<number> = [];
        const angle = Math.PI / 100;

        //Compute midpoint between two nodes
        m1 = (x2 + x1) / 2;
        m2 = (y2 + y1) / 2;

        //Compute coordinates on tangent perpendicular to link betweeen two nodes.
        dx = -x1 + m1;
        dy = y1 - m2;
        k = dy * Math.tan(angle) * 8 * wedgePosition;
        h = dx * Math.tan(angle) * 8 * wedgePosition;
        points[0] = m1 + k;
        points[1] = m2 + h;

        return points;
    }

    /**
     * Input: wedges
     * Output: wedges with position number (If there are multiple wedges between two nodes)
     * Process: Traverse through each wedge in the list and find its duplicates.
     *          If duplicates are found then assign each wedge a unique position number.
     */
    private assignWedgePosition(wedges: any) {
        let wedgeList, source, target, wedge, searchLink = true, wedgeCounter = 0;
        let searchCompletedWedges = [], filteredLinks = [];

        wedgeList = JSON.parse(JSON.stringify(wedges));
        searchCompletedWedges = []; // Keeps track of searched wedges
        for (let i = 0; i < wedgeList.length; i++) {
            
            //Traverse through wedges and find duplicates from each wedge.
            filteredLinks = [];
            source = wedgeList[i].source;
            target = wedgeList[i].target;
            wedge = { "source": source, "target": target };
            // check if search for the link is already done
            searchLink = true;
            for (let i = 0; i < searchCompletedWedges.length; i++) {
                if (searchCompletedWedges[i]['source'] === source && searchCompletedWedges[i]['target'] === target) searchLink = false;
            }

            if (searchLink) {
                searchCompletedWedges.push(wedge);
                filteredLinks = wedges.filter(function (el) {
                    return el.source === source &&
                        el.target === target;
                });

                if (filteredLinks.length > 1) {
                    // found multiple wedges betwen two nodes.
                    wedgeCounter = 0;
                    for (let j = 0; j < wedges.length; j++) {
                        if (filteredLinks[0].source === wedges[j].source && filteredLinks[0].target === wedges[j].target) {
                            wedgeCounter = wedgeCounter + 1;
                            this.wedgeData[j].wedgePosition = wedgeCounter;
                        }
                    }
                }
            }

        } // End of for loop
    } // End of function assignWedgePosition

    /**
     * on click node
     */
    nodeClick(d) {
        this.isNodeClicked = true;
        this.selectedNode = d;
        this.selectedWedge = null;
        this.hideAllContextMenu();
        d3.selectAll(".explore").style("background", "none");
        d3.selectAll(".clickBox" + this.dashboard.id).attr("opacity", 0);
        d3.selectAll(".selectSvg" + d.id + this.dashboard.id).attr("opacity", 0.8);

        this.mouseoverNode(d);
        // Display selected node info in ontology list
        this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'ON_NODE_CLICK' }, this.selectedNode.id));
    }

    linkClick(d) {
        //this.mouseoverLink(d);
    }

    /**
     * node context menu
     */
    nodeContextMenu(d) {
        let x = d3.event.pageX - this.getOffset(this.vcElement).left;
        let y = d3.event.pageY - this.getOffset(this.vcElement).top;
        if(this.vcElement.offsetWidth - (x + 10) <= 150)
            x = x - 160;

        if (d === this.selectedNode && d.hasOwnProperty('type') && d.type == 'class') {
            this.tooltipInstance.style('display', 'inline');
            this.tooltipInstance.style('top', (y - 10) + 'px').style('left', (x + 10) + 'px');
        }
        
        if(d.type == 'wedge'){
            this.propertyToolTip.style('display', 'inline');
            this.propertyToolTip.style('top', (y - 10) + 'px').style('left', (x + 10) + 'px');
        }
    }

     /**
     * node context menu
     */
    wedgeContextMenu(d) {
        this.selectedWedge = d;
        const x = d3.event.pageX - this.getOffset(this.vcElement).left;
        const y = d3.event.pageY - this.getOffset(this.vcElement).top;
        //if (d === this.selectedNode) {
            this.propertyToolTip.style('display', 'inline');
            this.propertyToolTip.style('top', (y - 10) + 'px').style('left', (x + 10) + 'px');
        //}
    }

    getOffset(el) {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY
        };
    }

    /**
     * On click of anywhere inside svg
     */
    svgClick(d) {
        //d3.selectAll(".clickBox").attr("opacity", 0);
        this.selectedWedge = null;
        if (!this.isNodeClicked && !this.wedgeClicked) {
            d3.selectAll(".clickBox" + this.dashboard.id).attr("opacity", 0);
            this.hideAllContextMenu();
            d3.selectAll(".explore").style("background", "none");
            this.mouseoutNode(d);
            this.mouseoutWedge(null);
            //this.mouseoutLink(d);
            this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'SHOW_LIST' }, 1));
        }
        this.isNodeClicked = false;
        this.wedgeClicked = false;
        
    }

    /**
     * On click of anywhere inside zoom rectangle
     */
    rectClick(d) {
    }

    /**
     * Hide all context menus
     */
    hideAllContextMenu() {
        this.tooltipInstance.style('display', 'none');
        this.displayTooltip.style('display', 'none');
        this.editTooltip.style('display', 'none');
        this.selectTooltip.style('display', 'none');
        this.propertyToolTip.style('display', 'none');
    }

    /**
     * displays submenu tooltip
     */
    showSubmenuTooltip(tooltipInstance: any, tooltipId: string, position: number) {
        // hide all sublists
        d3.selectAll(".sublist1").style("display", "none");
        // show sublist
        let displayEl = document.getElementById(tooltipId + this.visual.id);
        tooltipInstance.style('display', 'inline');
        tooltipInstance.style('top', (displayEl.parentElement.offsetTop + position) + 'px').style('left', (displayEl.parentElement.offsetLeft + 150) + 'px');
        //show all tooltip menus unselected and current one only selected
        d3.selectAll(".explore").style("background", "none");
        d3.selectAll('#' + tooltipId + this.visual.id).style("background", "#585252");
    }

    /**
     * node icon functions
     */
    getIcon(nodeClassUri: string) {
        return this.iconList.find(image => image.uri == (nodeClassUri));
    }

    isSvgIcon(icon: string) {
        return icon.lastIndexOf('.svg') >= 0;
    }

    getNodeIcon(d: any, needSvg: boolean) {
        let nodeClassUri, iconObj;
        if (d.hasOwnProperty('uuid') && d.uuid != null) {
            // icon for nodes having class/type url
            nodeClassUri = d.uuid.uri;
        }
        iconObj = this.getIcon(nodeClassUri);
        if (iconObj !== undefined && this.isSvgIcon(iconObj.icon) === needSvg) {
            return iconObj.icon;
        }
        else if (iconObj === undefined && this.isSvgIcon(this.defaultIcon) === needSvg) {
            return this.defaultIcon;
        }
    }

    /**
     * returns 1 if connection between a & b is present in array linkedByIndex.
     * @param a - any node in map
     * @param b - Selected node in map
     */
    isConnected(a, b) {
        return (this.linkedByIndex[`${a.index},${b.index}`] || this.linkedByIndex[`${b.index},${a.index}`] || a.index === b.index);
    }

    /**
     * Highlights the network of selected node and
     * reduces the opacity of other nodes.
     */
    mouseoverNode(d) {

        // reduce opacity of unselected nodes
        this.node.attr('opacity', o => this.isConnected(o, d) ? 1 : 0.1);

        // change style of selected node circle
        this.node.selectAll('circle')
            .attr("stroke-width", o => this.isConnected(o, d) ? this.nodeCircleStrokeWidthMouseOver : this.nodeCircleStrokeWidth)
            .attr("r", (d, i) => 1.2 * (this.dimensions(d, i)))
            .attr("opacity", o => this.isConnected(o, d) ? 1 : 0.1);

        // Change size and opacity of selected node icons
        this.node.selectAll('foreignObject')
            .attr("opacity", o => this.isConnected(o, d) ? 1 : 0.1);

        // Change size and opacity of selected node labels
        this.nodeLabel.attr('font-size', o => this.isConnected(o, d) ? 12 : 10)
            .attr("y", (d) => { 
                return ((this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100)<=25? 25:((this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100); 
            })
            .attr("opacity", o => this.isConnected(o, d) ? 1 : 0.1);

        // link style changes
        this.link.attr('stroke-opacity', o => (o.source === d || o.target === d ? 1 : 0.1))
            .attr('opacity', o => (o.source === d || o.target === d ? 1 : 0.1))
            .attr("stroke-width", o => (o.source === d || o.target === d ? this.linkStrokeWidthMouseOver : 2))
            .attr('marker-end', o => (o.source === d || o.target === d ? 'url(#end' + this.dashboard.id + ')' : 'url(#end-fade)'));

        this.wedge.attr("opacity", 0.1);
        this.wedgeLabel.attr("opacity", 0.1);
        // marker style changes
        d3.select('#end' + this.dashboard.id)
            .attr('markerWidth', '5')
            .attr('markerHeight', '5');

    }

    /**
     * Resets the style of all nodes, links and wedges.
     */
    mouseoutNode(d) {

        this.node.attr('opacity', 1);

        this.node.selectAll('circle')
            .attr("stroke-width", this.nodeCircleStrokeWidth)
            .attr("r", (d, i) => this.dimensions(d, i))
            .attr("opacity", 1);

        this.node.selectAll('foreignObject')
            .attr("opacity", 1);

        this.nodeLabel.attr('font-size', 10)
            .attr("y", (o) => {
                return ((this.dimensions(o, 0) * 2) * this.nodelabelSpace / 100)<=25? 25: ((this.dimensions(o, 0) * 2) * this.nodelabelSpace / 100);
            })
            .attr("opacity", 1);

        this.link.attr('stroke-opacity', o => (o.source === d || o.target === d ? 1 : 1))
            .attr('opacity', o => (o.source === d || o.target === d ? 1 : 1))
            .attr("stroke-width", this.linkStrokeWidth)
            .attr('marker-end', 'url(#end' + this.dashboard.id + ')');

        this.wedge.attr("opacity",1);
        this.wedgeLabel.attr("opacity",1);
            
        d3.select('#end' + this.dashboard.id)
            .attr('markerWidth', '8')
            .attr('markerHeight', '8');
    }


    /**
     * fixes the position of each node after loading the graph
     * to prevent their movement.
     */
    private fixNodes() {
        for (let i = 0; i < this.node["_groups"][0].length; i++) {
            this.node["_groups"][0][i].__data__.fx = this.node["_groups"][0][i].__data__.x;
            this.node["_groups"][0][i].__data__.fy = this.node["_groups"][0][i].__data__.y;
        }
    }

    /**
     * Context menu action - node collapse/expand
     */
    nodeCollapseHandler() {
        let hasChildren = false; 
        for (let i = 0; i < this.nodesData.length; i++) {
            if (this.nodesData[i].parentId == this.selectedNode.id) {
                hasChildren = true;
                break;
            }
        }

        if (this.selectedNode.isCollapsed == true) {
            // expand collapsed node
            let collapsedNodeIds = [];
            this.nodeIdsList = this.getNodeIdsList();
            this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'GET_WEDGES' }, 1));

            this.selectedNode.collapsedNodes.forEach(node => {
                node.visibility = true;
                this.nodesData.push(node);
                if (!this.nodeIdsList.includes(node.id)) {
                    this.nodeIdsList.push(node.id);
                    collapsedNodeIds.push(node.id);
                }

            });
            this.selectedNode.collapsedLinks.forEach(link => {
                this.linksData.push(link);
            });

            this.selectedNode.collapsedNodes = [];
            this.selectedNode.collapsedLinks = [];
            this.selectedNode.isCollapsed = false;

            this.getActiveWedges();
            this.updateMap();
            this.svgClick(null);
            this.applyExpandEffect(collapsedNodeIds);

            // update ontology list
            this.formattedData["nodes"] = this.nodesData;
            this.formattedData["links"] = this.linksData;
            this.nodeIdsList = this.getNodeIdsList();
            this.formattedData["nodeIdsList"] = this.nodeIdsList;
            this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'DISPLAY_HIDE' }, this.formattedData));

        }
        else if (hasChildren) {
            // collapse selected node
            this.selectedNode.isCollapsed = true;
            if (this.selectedNode.hasOwnProperty('subClassDetails')) {
                let subclasses = this.selectedNode.subClassDetails;
                subclasses.forEach(subclass => {
                    for (let i = 0; i < this.nodesData.length; i++) {
                        if (this.nodesData[i].id == subclass.uuid.uri.replace(/[^a-zA-Z0-9]/gi, '')) {
                            this.nodesData[i].visibility = false;
                            this.nodeIdsList = this.nodeIdsList.filter(nodeId => nodeId != this.nodesData[i].id);
                            this.hideWedge(this.nodesData[i]);
                            if (this.nodesData[i].hasOwnProperty('subClassDetails')) this.hideSubclassNodes(this.nodesData[i].subClassDetails);
                            //if (this.nodesData[i].hasOwnProperty('attributes')) this.hideDPNodes(this.nodesData[i]);
                            break;
                        }
                    }
                });
            }

            // if (this.selectedNode.hasOwnProperty('attributes')) {
            //     this.hideDPNodes(this.selectedNode);
            // }
            // get collapsed nodes and links
            let collapsedNodeIds: Array<string> = [];
            let collapsedNodes = this.nodesData.filter(node => node.visibility == false);
            let collapsedLinks = this.linksData.filter(link => {
                return link.source.visibility == false || link.target.visibility == false;
            })
            collapsedNodes.forEach(node => {
                collapsedNodeIds.push(node.id);
            });
            this.selectedNode.collapsedNodes = collapsedNodes;
            this.selectedNode.collapsedLinks = collapsedLinks;

            // get uncollapsed nodes and links
            this.nodesData = this.nodesData.filter(node => node.visibility !== false);
            this.linksData = this.linksData.filter(link => {
                return link.source.visibility !== false && link.target.visibility !== false;
            })
            //this.wedgeData = this.wedgeData.filter(wedge => wedge.visibility !== false);
            // apply collapse transition
            this.applyCollapseEffect(collapsedNodeIds);
            this.getActiveWedges();
            setTimeout(() => {
                this.updateMap();
            }, 2000);
            this.svgClick(null);

            // update ontology list
            this.formattedData["nodes"] = this.nodesData;
            this.formattedData["links"] = this.linksData;
            this.nodeIdsList = this.getNodeIdsList();
            this.formattedData["nodeIdsList"] = this.nodeIdsList;
            this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'DISPLAY_HIDE' }, this.formattedData));

        }

    }

    /**
     * collapse animation
     */
    applyCollapseEffect(collapsedNodeIds: Array<string>) {
        this.simulation.stop();
        let dx = this.selectedNode.x;
        let dy = this.selectedNode.y;
        //this.selectedNode.attr("id", "collapsed");
        // change fill color of collapsed node
        d3.select("." + this.selectedNode.id + this.dashboard.id).select("circle").attr("fill", this.nodeFaIconColor);
        d3.select("." + this.selectedNode.id + this.dashboard.id).select("foreignObject").style("color", "white");

        this.nodeLabel.style("opacity", (o) => collapsedNodeIds.includes(o.id) ? 0 : 1);

        this.node
            .transition()
            .duration(2000)
            .attr('transform', (o) => collapsedNodeIds.includes(o.id) ? `translate(${dx},${dy})` : `translate(${o.x},${o.y})`)
            .attr('style', (o) => collapsedNodeIds.includes(o.id) ? `transform: matrix(1, 0, 0, 1, ${dx},${dy});` : `transform: matrix(1, 0, 0, 1, ${o.x}, ${o.y});`)

        this.link
            .transition()
            .duration(2000)
            .attr("x1", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? dx : o.source.x;
            })
            .attr("y1", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? dy : o.source.y;
            })
            .attr("x2", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? dx : o.target.x;
            })
            .attr("y2", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? dy : o.target.y;
            })
            .attr("marker-end", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? "url(#end-fade)" : "url(#end" + this.dashboard.id + ")";
            })
            .attr("opacity", 1);
    }

    /**
     * expand animation
     */
    applyExpandEffect(collapsedNodeIds: Array<string>) {
        this.simulation.stop();
        let dx = this.selectedNode.x;
        let dy = this.selectedNode.y;
        // reset fill color of collapsed node
        d3.select("." + this.selectedNode.id + this.dashboard.id).select("circle").attr("fill", "white");
        d3.select("." + this.selectedNode.id + this.dashboard.id).select("foreignObject").style("color", this.nodeFaIconColor);

        this.node
            .transition()
            .duration(2000)
            .attr('transform', (o) => collapsedNodeIds.includes(o.id) ? `translate(${dx},${dy})` : `translate(${o.x},${o.y})`)
            .attr('style', (o) => collapsedNodeIds.includes(o.id) ? `transform: matrix(1, 0, 0, 1, ${dx},${dy});` : `transform: matrix(1, 0, 0, 1, ${o.x}, ${o.y});`)

        this.node
            .transition()
            .duration(2000)
            .attr('transform', (o) => collapsedNodeIds.includes(o.id) ? `translate(${o.x},${o.y})` : `translate(${o.x},${o.y})`)
            .attr('style', (o) => collapsedNodeIds.includes(o.id) ? `transform: matrix(1, 0, 0, 1, ${o.x},${o.y});` : `transform: matrix(1, 0, 0, 1, ${o.x}, ${o.y});`)

        this.nodeLabel.attr("opacity", (o) => collapsedNodeIds.includes(o.id) ? 0 : 1);

        this.link
            .attr("x1", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? o.source.x : o.source.x;
            })
            .attr("y1", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? o.source.y : o.source.y;
            })
            .attr("x2", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? o.source.x : o.target.x;
            })
            .attr("y2", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? o.source.y : o.target.y;
            })
            .attr("marker-end", (o) => {
                return collapsedNodeIds.includes(o.source.id) || collapsedNodeIds.includes(o.target.id) ? "url(#end-fade)" : "url(#end" + this.dashboard.id + ")";
            })

        this.link
            .transition()
            .duration(2000)
            .attr("x1", (o) => o.source.x)
            .attr("y1", (o) => o.source.y)
            .attr("x2", (o) => o.target.x)
            .attr("y2", (o) => o.target.y)
            .attr("marker-end", "url(#end" + this.dashboard.id + ")")
            .attr("opacity", 1);

        setTimeout(() => {
            this.simulation.alpha(0.3).restart();
            this.nodeLabel.attr("opacity", 1);
        }, 2000);

    }

    /**
     * Context menu action - hide nodes
     */
    hideNodes() {
        this.selectedNode.visibility = false;
        this.nodeIdsList = this.nodeIdsList.filter(nodeId => nodeId != this.selectedNode.id);
        //this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'NODE_HIDE' },this.selectedNode));
        this.hideWedge(this.selectedNode);
        // hide all the subclass nodes
        if (this.selectedNode.hasOwnProperty('subClassDetails')) {
            let subclasses = this.selectedNode.subClassDetails;
            subclasses.forEach(subclass => {
                for (let i = 0; i < this.nodesData.length; i++) {
                    if (this.nodesData[i].id == subclass.uuid.uri.replace(/[^a-zA-Z0-9]/gi, '')) {
                        this.nodesData[i].visibility = false;
                        this.nodeIdsList = this.nodeIdsList.filter(nodeId => nodeId != this.nodesData[i].id);
                        this.hideWedge(this.nodesData[i]);
                        if (this.nodesData[i].hasOwnProperty('subClassDetails')) this.hideSubclassNodes(this.nodesData[i].subClassDetails);
                        //if (this.nodesData[i].hasOwnProperty('attributes')) this.hideDPNodes(this.nodesData[i]);
                        break;
                    }
                }
            });
        }

        // if (this.selectedNode.hasOwnProperty('attributes')) {
        //     this.hideDPNodes(this.selectedNode);
        // }

        this.nodesData = this.nodesData.filter(node => node.visibility !== false);
        this.linksData = this.linksData.filter(link => {
            return link.source.visibility !== false && link.target.visibility !== false;
        })
        //this.wedgeData = this.wedgeData.filter(wedge => wedge.visibility !== false);
        this.getActiveWedges();
        this.updateMap();
        this.svgClick(null);

        // update ontology list
        this.formattedData["nodes"] = this.nodesData;
        this.formattedData["links"] = this.linksData;
        //this.formattedData["wedges"] = this.wedgeData;
        this.formattedData["nodeIdsList"] = this.nodeIdsList;
        this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'DISPLAY_HIDE' }, this.formattedData));
    }

    /**
     * Sets visibility false of wedges connected to hidden node.
     */
    hideWedge(selectedNode: any) {
        this.wedgeData.forEach(wedge => {
            if (wedge.source == selectedNode.id || wedge.target == selectedNode.id) {
                //wedge.visibility = false;
            }
        });
    }

    /**
     * sets visibility of subclass nodes to false recursively
     */
    hideSubclassNodes(subClasses: any) {
        subClasses.forEach(subclass => {
            for (let i = 0; i < this.nodesData.length; i++) {
                if (this.nodesData[i].id == subclass.uuid.uri.replace(/[^a-zA-Z0-9]/gi, '')) {
                    this.nodesData[i].visibility = false;
                    this.nodeIdsList = this.nodeIdsList.filter(nodeId => nodeId != this.nodesData[i].id);
                    this.hideWedge(this.nodesData[i]);
                    if (this.nodesData[i].hasOwnProperty('subClassDetails')) this.hideSubclassNodes(this.nodesData[i].subClassDetails);
                    //if (this.nodesData[i].hasOwnProperty('attributes')) this.hideDPNodes(this.nodesData[i]);
                    break;
                }
            }
        });
        return;
    }

    /**
     * sets visibility of data property nodes to false.
     */
    // hideDPNodes(node: any) {
    //     let attributes = node.attributes;
    //     attributes.forEach(dpNode => {
    //         for (let i = 0; i < this.nodesData.length; i++) {
    //             let nodeId = this.nodesData[i].id.split("_")[0];
    //             if (nodeId == dpNode.uuid.uri.replace(/[^a-zA-Z0-9]/gi, '') && this.nodesData[i].parentId == node.id && this.nodesData[i].visibility != false) {
    //                 this.nodesData[i].visibility = false;
    //                 this.nodeIdsList = this.nodeIdsList.filter(nodeId => nodeId != this.nodesData[i].id);
    //                 break;
    //             }
    //         }
    //     });
    // }

    /**
     * Select classes by hierarchical relationship
     */
    selectByHierarchyHandler(){

        this.selectedNodeHierarchy = [];
        this.selectedNodeHierarchy.push(this.selectedNode.id);
        // collect parent node
        this.nodesData.forEach(node => {
            if(node.id == this.selectedNode.parentId && !this.selectedNodeHierarchy.includes(node.id)) this.selectedNodeHierarchy.push(node.id);
        });
        // collect all siblings
        this.nodesData.forEach(node => {
            if(node.parentId == this.selectedNode.parentId && !this.selectedNodeHierarchy.includes(node.id)) this.selectedNodeHierarchy.push(node.id);
        });
        // collect all the subclass nodes
        if (this.selectedNode.hasOwnProperty('subClassDetails')) {
            let subclasses = this.selectedNode.subClassDetails;
            subclasses.forEach(subclass => {
                this.selectedNodeHierarchy.push(subclass.id);
                if (subclass.hasOwnProperty('subClassDetails')) this.getSubclasses(subclass.subClassDetails);
            });
        }
        // highlight selected hierarchical nodes
         // reduce opacity of unselected nodes
         this.node.attr('opacity', o => this.selectedNodeHierarchy.includes(o.id) ? 1 : 0.1);

         // change style of selected node circle
         this.node.selectAll('circle')
             .attr("stroke-width", o => this.selectedNodeHierarchy.includes(o.id) ? this.nodeCircleStrokeWidthMouseOver : this.nodeCircleStrokeWidth)
             .attr("r", (d, i) => 1.2 * (this.dimensions(d, i)))
             .attr("opacity", o => this.selectedNodeHierarchy.includes(o.id) ? 1 : 0.1);
 
         // Change size and opacity of selected node icons
         this.node.selectAll('foreignObject')
             .attr("opacity", o => this.selectedNodeHierarchy.includes(o.id) ? 1 : 0.1);
 
         // Change size and opacity of selected node labels
         this.nodeLabel.attr('font-size', o => this.selectedNodeHierarchy.includes(o.id) ? 12 : 10)
             .attr("y", (d) => { 
                 return ((this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100)<=25? 25:((this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100); 
             })
             .attr("opacity", o => this.selectedNodeHierarchy.includes(o.id) ? 1 : 0.1);
 
         // link style changes
         this.link.attr('stroke-opacity', o => (this.selectedNodeHierarchy.includes(o.source.id) && this.selectedNodeHierarchy.includes(o.target.id) ? 1 : 0.1))
            .attr('opacity', o => (this.selectedNodeHierarchy.includes(o.source.id) && this.selectedNodeHierarchy.includes(o.target.id) ? 1 : 0.1))
            .attr("stroke-width", o => (this.selectedNodeHierarchy.includes(o.source.id) && this.selectedNodeHierarchy.includes(o.target.id) ? this.linkStrokeWidthMouseOver : 2))
            .attr('marker-end', o => (this.selectedNodeHierarchy.includes(o.source.id) && this.selectedNodeHierarchy.includes(o.target.id) ? 'url(#end' + this.dashboard.id + ')' : 'url(#end-fade)'));
 
         this.wedge.attr("opacity", 0.1);
         this.wedgeLabel.attr("opacity", 0.1);
         // marker style changes
         d3.select('#end' + this.dashboard.id)
             .attr('markerWidth', '5')
             .attr('markerHeight', '5');
    }

     /**
     * Select classes by object relationship
     */
    selectByRelationHandler(){
        this.selectedNodeRelation = [];
        this.selectedNodeRelation.push(this.selectedNode.id);
        // collect parent node
        this.nodesData.forEach(node => {
            if(node.id == this.selectedNode.parentId && !this.selectedNodeRelation.includes(node.id)) this.selectedNodeRelation.push(node.id);
        });
        // collect all the directly connected nodes
        if (this.selectedNode.hasOwnProperty('subClassDetails')) {
            let subclasses = this.selectedNode.subClassDetails;
            subclasses.forEach(subclass => {
                this.selectedNodeRelation.push(subclass.id);
            });
        }
        // Collect nodes connected by object relation i.e by wedges
        this.wedgeData.forEach(wedge => {
            if(wedge.source == this.selectedNode.id && !this.selectedNodeRelation.includes(wedge.target)) this.selectedNodeRelation.push(wedge.target);
            if(wedge.target == this.selectedNode.id && !this.selectedNodeRelation.includes(wedge.surce)) this.selectedNodeRelation.push(wedge.source);
        });
        // highlight selected hierarchical nodes
         // reduce opacity of unselected nodes
         this.node.attr('opacity', o => this.selectedNodeRelation.includes(o.id) ? 1 : 0.1);

         // change style of selected node circle
         this.node.selectAll('circle')
             .attr("stroke-width", o => this.selectedNodeRelation.includes(o.id) ? this.nodeCircleStrokeWidthMouseOver : this.nodeCircleStrokeWidth)
             .attr("r", (d, i) => 1.2 * (this.dimensions(d, i)))
             .attr("opacity", o => this.selectedNodeRelation.includes(o.id) ? 1 : 0.1);
 
         // Change size and opacity of selected node icons
         this.node.selectAll('foreignObject')
             .attr("opacity", o => this.selectedNodeRelation.includes(o.id) ? 1 : 0.1);
 
         // Change size and opacity of selected node labels
         this.nodeLabel.attr('font-size', o => this.selectedNodeRelation.includes(o.id) ? 12 : 10)
             .attr("y", (d) => { 
                 return ((this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100)<=25? 25:((this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100); 
             })
             .attr("opacity", o => this.selectedNodeRelation.includes(o.id) ? 1 : 0.1);
 
         // link style changes
         this.link.attr('stroke-opacity', o => (this.selectedNodeRelation.includes(o.source.id) && this.selectedNodeRelation.includes(o.target.id) ? 1 : 0.1))
            .attr('opacity', o => (this.selectedNodeRelation.includes(o.source.id) && this.selectedNodeRelation.includes(o.target.id) ? 1 : 0.1))
            .attr("stroke-width", o => (this.selectedNodeRelation.includes(o.source.id) && this.selectedNodeRelation.includes(o.target.id) ? this.linkStrokeWidthMouseOver : 1))
            .attr('marker-end', o => (this.selectedNodeRelation.includes(o.source.id) && this.selectedNodeRelation.includes(o.target.id) ? 'url(#end' + this.dashboard.id + ')' : 'url(#end-fade)'));
        
        this.wedge.attr("opacity", (o) => (this.selectedNode.id == o.source || this.selectedNode.id == o.target? 1: 0.1));
        this.wedgeLabel.attr("opacity", (o) => (this.selectedNode.id == o.source || this.selectedNode.id == o.target? 1: 0.1));
        this.wedge.attr('fill', (o) => (this.selectedNode.id == o.source || this.selectedNode.id == o.target? "#ffcc99" : this.wedgeColor)); 
        //this.wedge.attr("filter", "url(#glow)");
        // marker style changes
         d3.select('#end' + this.dashboard.id)
             .attr('markerWidth', '5')
             .attr('markerHeight', '5');
    }


    /**
     * Collects subclass node id's recursively
     */
    getSubclasses(subClasses: any) {
        subClasses.forEach(subclass => {
            this.selectedNodeHierarchy.push(subclass.id);
            if (subclass.hasOwnProperty('subClassDetails')) this.getSubclasses(subclass.subClassDetails);
        });
        return;
    }

    /**
     * edit>Edit context menu handler
     */
    editEditHandler() {
        if(this.selectedWedge){
            this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'ON_EDIT_WEDGE' }, this.selectedWedge));
        }else{
            this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'EDIT_NODE' }, this.selectedNode.id));
        }
    }

    /**
     * Edit> Make child of - context menu handler
     */
    makeChildOfHandler() {
        this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'MAKE_CHILD_OF' }, this.selectedNode.id));
    }

    /**
     * Edit > Make orphan - context menu handler
     */
    makeOrphanHandler() {
        this.formattedData["nodes"] = this.nodesData;
        this.formattedData["links"] = this.linksData;
        this.formattedData["selectedNodeId"] = this.selectedNode.id;
        this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'MAKE_ORPHAN' }, this.formattedData));
    }

    /**
     * Edit > Delete - context menu handler
     */
    deleteHandler(){
        this.formattedData["nodes"] = this.nodesData;
        this.formattedData["links"] = this.linksData;
        this.formattedData["selectedEntity"] = this.selectedWedge == null? this.selectedNode: this.selectedWedge;
        // if entity is a class and it has subclasses then return.
        if(this.formattedData["selectedEntity"].type == 'class' && this.formattedData["selectedEntity"].subClasses.length != 0) return;
        this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'DELETE_ACTION' }, this.formattedData));
    }

    /**
     * mouseoverWedge
     */
    mouseoverWedge(d){
        this.simulation.stop();
        //alert(JSON.stringify(d));
        this.wedge.attr('opacity', (o) => o.source == d.source && o.target == d.target? 1 : 0.1);
        this.wedgeLabel.attr("opacity",(o) => o.source == d.source && o.target == d.target? 1 : 0.1);
        this.wedge.attr('fill', (o) => o.source == d.source && o.target == d.target? "#ffcc99" : this.wedgeColor);
        //this.wedge.attr("filter", "url(#glow)");

         // reduce opacity of unselected nodes
         this.node.attr('opacity', o => o.id == d.source || o.id == d.target ? 1 : 0.1);

         // change style of selected node circle
         this.node.selectAll('circle')
             .attr("stroke-width", o => o.id == d.source || o.id == d.target ? this.nodeCircleStrokeWidthMouseOver : this.nodeCircleStrokeWidth)
             .attr("r", (d, i) => 1.2 * (this.dimensions(d, i)))
             .attr("opacity", o => o.id == d.source || o.id == d.target ? 1 : 0.2);
 
         // Change size and opacity of selected node icons
         this.node.selectAll('foreignObject')
             .attr("opacity", o => o.id == d.source || o.id == d.target ? 1 : 0.2);
 
         // Change size and opacity of selected node labels
         this.nodeLabel.attr('font-size', o => o.id == d.source || o.id == d.target ? 12 : 10)
             .attr("y", (d) => { return (this.dimensions(d, 0) * 2) * this.nodelabelSpaceMouseOver / 100; })
             .attr("opacity", o => o.id == d.source || o.id == d.target ? 1 : 0.2);

         // link style changes
         this.link.attr("opacity", 0.1);
 
    }

    /**
     * mouseoutWedge
     */
    mouseoutWedge(d){
        //alert(JSON.stringify(d));
        if(!this.wedgeClicked){
            this.wedge.attr('opacity',1)
            this.wedge.attr('stroke-width', '3');
            this.wedge.attr('stroke',"null");
            this.wedge.attr('fill',this.wedgeColor);
            //this.wedge.attr("filter", "none");

            this.node.attr('opacity', 1);

            this.node.selectAll('circle')
                .attr("stroke-width", this.nodeCircleStrokeWidth)
                .attr("r", (d, i) => this.dimensions(d, i))
                .attr("opacity", 1);

            this.node.selectAll('foreignObject')
                .attr("opacity", 1);

            this.nodeLabel.attr('font-size', 10)
                .attr("y", (o) => {
                    return ((this.dimensions(o, 0) * 2) * this.nodelabelSpace / 100)<=25? 25: ((this.dimensions(o, 0) * 2) * this.nodelabelSpace / 100);
                })
                .attr("opacity", 1);

            this.wedgeLabel.attr("opacity",1);

            // link style changes
            this.link.attr("opacity", 1);
        }
    }

    /**
     * onClickWedge
     */
    onClickWedge(d){
        this.selectedWedge = d;
        this.wedgeClicked = true;
        this.mouseoverWedge(d);
        this.store.dispatch(new UpdateOntologyOnList({ id: this.dashboard.id, action: 'ON_CLICK_WEDGE' }, this.selectedWedge));
    }

    /**
     * generate active wedges active wedges
     */
    getActiveWedges() {
        this.nodeIdsList = this.getNodeIdsList();
        this.wedgeData = this.wedgeData.filter(wedge => this.nodeIdsList.includes(wedge.source) && this.nodeIdsList.includes(wedge.target));
    }

    /**
     * Generate nodeIdsList
     */
    getNodeIdsList() {
        this.nodeIdsList = [];
        this.nodesData.forEach(node => {
            if (!this.nodeIdsList.includes(node.id)) {
                this.nodeIdsList.push(node.id);
            }
        });
        return this.nodeIdsList;
    }


    /**
    *  Tick actions
    */
    tickActions() {
        //update circle positions to reflect node updates on each tick of the simulation
        return () => {
            this.node.attr('transform', (d) => isNaN(d.x) ? `translate(0,0)` : `translate(${d.x},${d.y})`)
                .attr('style', (d) => isNaN(d.x) ? `transform: matrix(1, 0, 0, 1, 0, 0);` : `transform: matrix(1, 0, 0, 1, ${d.x}, ${d.y});`)

            this.nodeLabel.attr('transform', (d) => isNaN(d.x) ? `translate(0,0)` : `translate(${d.x},${d.y})`)
                .attr('style', (d) => isNaN(d.x) ? `transform: matrix(1, 0, 0, 1, 0, 0);` : `transform: matrix(1, 0, 0, 1, ${d.x}, ${d.y});`);

            this.nodeSelect.attr('transform', (d) => isNaN(d.x) ? `translate(0,0)` : `translate(${d.x},${d.y})`)
                .attr('style', (d) => isNaN(d.x) ? `transform: matrix(1, 0, 0, 1, 0, 0);` : `transform: matrix(1, 0, 0, 1, ${d.x}, ${d.y});`);

            //update link positions
            //simply tells one end of the line to follow one node around
            //and the other end of the line to follow the other node around
            this.link
                .attr("x1", function (d) {
                    return isNaN(d.source.x) ? 0 : d.source.x;
                })
                .attr("y1", function (d) {
                    return isNaN(d.source.y) ? 0 : d.source.y;
                })
                .attr("x2", function (d) {
                    return isNaN(d.target.x) ? 0 : d.target.x;
                })
                .attr("y2", function (d) {
                    return isNaN(d.target.y) ? 0 : d.target.y;
                });

            this.wedge
                .attr('d', (d) => {
                    let points, k, h, l, x1, x2, p1, p2, p3, p4, q1, q2, q3, q4, c1, c2, d1, d2, z1, z2, px1 = 0, px2 = 0, py1 = 0, py2 = 0, y1, y2, m1, m2, angle = Math.PI / 100;

                    let source = this.node["_groups"][0].filter(node => { return node.__data__.id === d.source });
                    let target = this.node["_groups"][0].filter(node => { return node.__data__.id === d.target });
                    x1 = source[0].__data__.x;
                    y1 = source[0].__data__.y;
                    x2 = target[0].__data__.x;
                    y2 = target[0].__data__.y;

                    if (d.hasOwnProperty('wedgePosition') && d.wedgePosition <= 16) {
                        points = this.getWedgeMidpoint(x1, x2, y1, y2, d.wedgePosition);
                    } else {
                        points = this.getWedgeMidpoint(x1, x2, y1, y2, 1);
                    }

                    //Compute midpoint between two nodes
                    m1 = (x2 + x1) / 2;
                    m2 = (y2 + y1) / 2;

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
                    q1 = y1 + h
                    p2 = x1 - k
                    q2 = y1 - h

                    // Calculate second wedge points
                    l = Math.sqrt((z1 - x2) * (z1 - x2) + (z2 - y2) * (z2 - y2));
                    dy = (y2 - z2);
                    dx = (- x2 + z1);
                    k = dy * Math.tan(angle) / 3
                    h = dx * Math.tan(angle) / 3
                    p3 = z1 + k
                    q3 = z2 + h
                    p4 = z1 - k
                    q4 = z2 - h

                    if (isNaN(p1) || isNaN(q1) || isNaN(p2) || isNaN(q2)|| isNaN(p3) || isNaN(q3)) {
                        return "M 0 0";
                    }

                    return 'M ' + p1 + ' ' + q1 +
                        ' L ' + p2 + ' ' + q2 +
                        'L ' + z1 + ' ' + z2 +
                        'L ' + x2 + ' ' + y2 +
                        'L ' + p3 + ' ' + q3 +
                        'm -4, 0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0';

                })
                // .attr("fill", (d) => {
                //     if (d.isNew) {
                //         return "black";
                //     }
                //     return this.wedgeColor;
                // })
                //transition from dark to faint color for new wedges
                //.transition()
                //.duration((d) => d.isNew ? 150 : 0)

            this.wedgeLabel.attr('x', (d) => {
                let points, x1, y1, x2, y2, source, target;
                source = this.node["_groups"][0].filter(node => { return node.__data__.id === d.source });
                target = this.node["_groups"][0].filter(node => { return node.__data__.id === d.target });
                x1 = source[0].__data__.x;
                y1 = source[0].__data__.y;
                x2 = target[0].__data__.x;
                y2 = target[0].__data__.y;

                if (d.hasOwnProperty('wedgePosition')) {
                    points = this.getWedgeMidpoint(x1, x2, y1, y2, d.wedgePosition);
                } else {
                    points = this.getWedgeMidpoint(x1, x2, y1, y2, 1);
                }
                let z1 = points[0];
                return z1;
                })
                .attr('y', (d) => {
                    let points, x1, y1, x2, y2, source, target;
                    source = this.node["_groups"][0].filter(node => { return node.__data__.id === d.source });
                    target = this.node["_groups"][0].filter(node => { return node.__data__.id === d.target });
                    x1 = source[0].__data__.x;
                    y1 = source[0].__data__.y;
                    x2 = target[0].__data__.x;
                    y2 = target[0].__data__.y;

                    if (d.hasOwnProperty('wedgePosition')) {
                        points = this.getWedgeMidpoint(x1, x2, y1, y2, d.wedgePosition);
                    } else {
                        points = this.getWedgeMidpoint(x1, x2, y1, y2, 1);
                    }
                    let z2 = points[1];
                    return z2 + this.wedgeLabelSpace;
                })
                
        };

    } // End of tickActions function

    /**
     * Adjust zoom of map on window resize
     */
    zoomOnWindowResize = () => {
        //console.log('d3.event.transform');
        if (this.g != undefined) {
            const tempWidth = document.getElementById('graphID-' + this.visual.id).offsetWidth;
            const tempHeight = document.getElementById('graphID-' + this.visual.id).offsetHeight;
            const scaleFactor = tempWidth / this.width;
            this.g.attr('transform', `scale(${scaleFactor}) translate(${(tempWidth - this.width) / 2}, ${(tempHeight - this.height) / 2})`);
            this.svg.attr('width', tempWidth)
                .attr('height', tempHeight);
        }
    };
}
