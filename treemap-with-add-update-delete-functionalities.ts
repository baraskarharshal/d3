import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { VisualTree } from '../../../../../shared/interfaces/visual-tree.interface';
import { VisualComponent } from '../visual.component';
import { VisualTreeExploreFilterComponent } from './visual-tree-explore-filter/visual-tree-explore-filter.component';
import { isArray } from 'util';
import { VisualTreeExploreGroupbyComponent } from './visual-tree-explore-groupby/visual-tree-explore-groupby.component';
import {  OpenExploreDashboard, Open360ViewDashboard } from '../../../state/dashboard/dashboard.actions';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { ApiService } from '../../../../../shared/services/api.service';
import { DashboardState } from '../../../state/dashboard/dashboard.state';
import { Visual } from '../../../../../shared/interfaces/visual.interface';
import { IconIdReferences, NodeIcons } from '../visual-tree/icons.config';
import * as d3 from "d3";
import { CloseSidebar, OpenSidebar } from 'src/app/shared/components/sidebar/state/sidebar.action';
import { IconService } from '../../icon.service';

// declare var d3: any;

interface Cluster {
  '@type': string;
  count: number;
  label: string;
  entityType: any;
  definition: any;
  relation?: any;
}
@Component({
  selector: 'ulysses-visual-tree-explore',
  templateUrl: './visual-tree-explore.component.html',
  styleUrls: ['./visual-tree-explore.component.scss']
})
export class VisualTreeExploreComponent extends VisualComponent<VisualTree> implements OnInit, AfterViewInit {

  private clusters: Array<Cluster> = [];
  private selectedCluster: any;
  private connectedListVisual: Visual;

  @ViewChild('visualContainer')
  visualContainer: ElementRef;
  iconList: any;

  constructor(
    private actions$:Actions,
    private store: Store,
    private iconService: IconService,
    private api: ApiService) {
    super();
  }

  ngOnInit() {
    this.visual.isLoading = false;
    // load icons
    this.iconList = this.iconService.getIcons();

    const initialCluster = {
      '@type': this.visual.cluster['@type'],
      'count': this.visual.cluster['count'],
      'label': this.visual.cluster['label'],
      'entityType': this.visual.cluster['entityType'],
      'definition': this.visual.cluster['definition'],
      'relation': this.visual.cluster['relation'],
    };
    this.clusters.push(initialCluster);
    this.selectedCluster = initialCluster;
    //TODO: temp.. need to change.. this is not safe
    this.connectedListVisual = this.store.selectSnapshot(DashboardState.getSelected).visuals[1];

    this.actions$
      .pipe(ofActionSuccessful(CloseSidebar))
      //  .pipe(map(options=>options.actionType.id !== this.visual.id))
      .subscribe(options => {

        //need to handle this using custom map
        if (options.actionType.id !== this.visual.id)
          return;

        // close event
        const clusters = options.result['clusters'];

        this.selectedCluster['filters'] = options.result['filters'];
        this.selectedCluster['groupBy'] = options.result['groupBy'];

        let cleanOld = true;

        clusters.forEach(cluster => {
          cluster['exploreType'] = options.result['exploreType'];
          this.clusters.push(cluster);
          this.addNode(cluster, cleanOld);
          cleanOld = false;
        });

      });
  }


  ngAfterViewInit() {
    this.buildGraph2({});
  }
  private getSelectedCluster() {
    this.selectedCluster = this.getSelected().data[0].cluster;
    return {
      '@type': this.selectedCluster['@type'],
      'entityType': this.selectedCluster.entityType,
      'definition': this.selectedCluster['definition'],
      'relation': this.selectedCluster.relation,
      'count': this.selectedCluster.count,
      'label': this.selectedCluster.label,
    };
  }

  onClusterSelected() {
    // TODO: should be connected from dashboard object.. create a saperate event to initialize the
    // dashboard and then create connected link.

    if (this.connectedListVisual) {
      this.getSelectedCluster();
      if (this.selectedCluster['@type'] !== 'CLUSTER') {
        return;
      }
      //TODO: cluster clean up.......
      const labels = this.selectedCluster.label.split('=');

      this.connectedListVisual.title = 'list - ' + this.selectedCluster['formattedLabel'], //this.selectedCluster.label;
        // this.connectedListVisual.config = {
        //   cluster: this.selectedCluster,
        //   listType: 'viewExplode',
        //   totalCount: this.selectedCluster.count,
        //   instance: this.selectedCluster.label, //instance.label,
        //   entity: this.selectedCluster.label//entity.label
        // };

        this.connectedListVisual.cluster = this.selectedCluster;

      if (this.connectedListVisual.onRefresh) {
        this.connectedListVisual.onRefresh();
      }
    }

  }

  openFilter(): void {
    // this.selectedCluster = this.getSelected().data[0].cluster;
    // delete this.selectedCluster["exploreType"];

    this.store.dispatch(new OpenSidebar(VisualTreeExploreFilterComponent, { id: this.visual.id, action: 'EXPLORE_FILTER' }, {
      cluster: this.getSelectedCluster(),
      filters: this.selectedCluster['filters']
    }));
  }

  openGroupBy(): void {
    // this.selectedCluster = this.getSelected().data[0].cluster;
    // delete this.selectedCluster["exploreType"];

    this.store.dispatch(new OpenSidebar(VisualTreeExploreGroupbyComponent, { id: this.visual.id, action: 'EXPLORE_GROUPBY' }, {
      cluster: this.getSelectedCluster(),
      groupBy: this.selectedCluster['groupBy']
    }));
  }


  openExplode(): void {
    // this.selectedCluster = this.getSelected().data[0].cluster;
    // delete this.selectedCluster["exploreType"];
    const data = {
      'cluster': this.getSelectedCluster(),
      'additionalAttributes': null,
      'contexts': null,
      'page': 1,
      'numRecords': 5
    };
    this.api
      .request('EXPLODE_ENTITY', { data: data })
      .subscribe(response => {
        if (response) {
          response.forEach(entity => this.addNode(entity));
        }
      });
  }

  open360View(): void {
    this.getSelectedCluster();
    const entity = this.selectedCluster;
    this.getSelected();

    this.store.dispatch(new Open360ViewDashboard(entity));
  }

  openExplore(): void {
    const cluster = this.getSelectedCluster();
    this.store.dispatch(new OpenExploreDashboard(cluster));
  }

  removeNode(): void {
    this.collapseNode();
    
  }

  private graphDataForCluster() {
    const graphData = [];
    this.clusters.forEach(cluster => {
      const node = {
        name: cluster.label,
        cluster: cluster
      };

      graphData.push(node);
    });
    return graphData;
  }

  getSelected = null;
  buildGraph2(datax): void {

    const data = this.graphDataForCluster();
    let selectedNode: any;
    const icons = this.iconList;

    // ### DATA MODEL END

    // Set the dimensions and margins of the diagram
    const margin = {
      top: 20,
      right: 90,
      bottom: 30,
      left: 10
    };
    const self = this;
    // width = 960 - margin.left - margin.right,
    // height = 500 - margin.top - margin.bottom;
    const width = this.visualContainer.nativeElement.offsetWidth,
      height = this.visualContainer.nativeElement.offsetHeight,
      visualId = this.visual.id;

    const root_node_radius = 150;
    const root_cluster_count = this.clusters[0].count;
    const object_size = root_node_radius * 40 / 100; // 60% of root cluster size
    const min_cluster_count = root_cluster_count / 2;
    const node_size_mul_factor = root_node_radius / root_cluster_count;

    const normal_wedge_length = 180;
    const wedge_width_factor = 10;
    const wedge_width_rate = wedge_width_factor / normal_wedge_length;
    const max_label_length = 35;

    // Declare zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', zoomed);

     // Set the class icon
    let defaultIcon;
    if(this.visual.cluster.entityType !== undefined){
      defaultIcon = getIcon(this.visual.cluster.entityType.uri);
    }
    if (defaultIcon != undefined) {
      defaultIcon = defaultIcon.icon;
    }
    else{
      defaultIcon = "fas fa-cube";
    }

    function getIcon(nodeClassUri){
      return icons.find(image => image.uri == nodeClassUri);
    }

    function isSvgIcon(icon){
        return icon.lastIndexOf('.svg')>=0;
    }

    function getNodeIcon(d, needSvg){
      let nodeClassUri, iconObj;
      if ((d.data[0].cluster['@type'] === 'ULCluster' || d.data[0].cluster['@type'] === 'CLUSTER') && d.data[0].cluster.entityType) {
        // icon for ULCluster and CLUSTER
        nodeClassUri = d.data[0].cluster.entityType.uri;  
      }
      else if (d.data[0].cluster['@type'] === 'OBJECT') {
        // icon for object
        nodeClassUri = d.uuid.uri;
      }
      else if(isSvgIcon(defaultIcon) === needSvg){
        // icon for others
        return defaultIcon;
      }

      iconObj = getIcon(nodeClassUri);
      if(iconObj !== undefined && isSvgIcon(iconObj.icon) === needSvg){
        return iconObj.icon;
      }
      else if(iconObj === undefined && isSvgIcon(defaultIcon) === needSvg){
        return defaultIcon;
      }
    }



    const svg = d3.select('#graphId-' + visualId)
      .append('div')
      .classed('svg-container', true) // container class to make it
      .append('svg')
      // .style("border", "1px solid #e2c7c7")
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 900 900')
      .attr('id', 'view_box')
      // .attr("width", width )
      // .attr("height", height)
      .classed('svg-content-responsive', true)
      .append('g')
      .attr('transform', 'translate(' + 400 + ',' + 300 + ')')
      .call(zoom);

    this.visual.onResize = () => {
      //if (h > 400) {
      // let width = this.visualContainer.nativeElement.offsetWidth;
      const height = this.visualContainer.nativeElement.offsetHeight;

      let temp = height - 400;
      temp = temp * 1.5;
      const new_width = 900 - temp;
      //}
      // d3.select('#view_box')
      //   .attr('viewBox', '0 0 ' + new_width + ' 600');

    };

    const rect = svg.append('rect')
      .attr('x', 0)
      .attr('y', -200)
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .style('fill', 'none')
      .style('pointer-events', 'all');


    const container = svg.append('g')
      .attr('id', 'zoom_container');

    // Container x axis lines
    container.append('g')
      .attr('class', 'x axis')
      .selectAll('line')
      .data(d3.range(0, width, 10))
      .enter().append('line')
      .attr('style', '1px solid #e2c7c7')
      .attr('x1', function (d) {
        return d;
      })
      .attr('y1', 0)
      .attr('x2', function (d) {
        return d;
      })
      .attr('y2', height);

    // Container y axis lines
    container.append('g')
      .attr('class', 'y axis')
      .attr('id', 'y_axis')
      .selectAll('line')
      .data(d3.range(0, height, 10))
      .enter().append('line')
      .attr('x1', 0)
      .attr('y1', function (d) {
        return d;
      })
      .attr('x2', width)
      .attr('y2', function (d) {
        return d;
      });


    let i = 0,
      duration = 750,
      root;

    // declares a tree layout and assigns the size
    // var treemap = d3.tree().size([height, width]);
    const treemap = d3.tree().nodeSize([170, 170]).separation(function (a, b) {
      if (a.parent === b.parent) {
        return 1;
      } else if (a.children === b.children) {
        return 1;
      } else {
        return 1;
      }

    });

    // Assigns parent, children, height, depth
    root = d3.hierarchy(data, function (d) {
      return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    update(root);

    let selected = null;
    this.getSelected = () => selected;

    function update(source) {
      // Compute the new tree layout.
      const treeData = treemap(root);

      // Compute the new tree layout.
      const nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

      // Normalize for fixed-depth.
      nodes.forEach(function (d) {
        d.y = d.depth * 280;

      });

      // ### LINKS
      // Update the links...
      const link = container.selectAll('path.link').
        data(links, function (d) {
          return d.id;
        });
      const radius = 35;


      const linkEnter = link.enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', '#ddd')
        .attr('stroke-width', 1)
        .attr('d', function (d) {
          const dist = getDistance(d.x, d.y, d.parent.x, d.parent.y);
          let width_factor = 0;
          if (dist > normal_wedge_length) {
            width_factor = dist * wedge_width_rate * 1.5;
          } else {
            width_factor = wedge_width_factor;
          }
          //console.log(width_factor);
          return 'M' + d.y + ' ' + d.x +
            ' L' + (d.parent.y) + ' ' + d.parent.x +
            ' L' + (d.parent.y) + ' ' + (d.parent.x + width_factor);
        });


      const linkUpdate = linkEnter.merge(link);




      linkUpdate.transition().
        duration(duration)
        .attr('d', function (d) {
          const dist = getDistance(d.x, d.y, d.parent.x, d.parent.y);
          let width_factor = 0;
          if (dist > normal_wedge_length) {
            width_factor = dist * wedge_width_rate * 1.5;
          } else {
            width_factor = wedge_width_factor;
          }
          return 'M' + d.y + ' ' + d.x +
            ' L' + (d.parent.y) + ' ' + d.parent.x +
            ' L' + (d.parent.y) + ' ' + (d.parent.x + width_factor);

        });

      // Transition back to the parent element position
      linkUpdate.transition().
        duration(duration)
        .attr('d', function (d) {
          const dist = getDistance(d.x, d.y, d.parent.x, d.parent.y);
          let width_factor = 0;
          if (dist > normal_wedge_length) {
            width_factor = dist * wedge_width_rate * 1.5;
          } else {
            width_factor = wedge_width_factor;
          }
          return 'M' + d.y + ' ' + d.x +
            ' L' + (d.parent.y) + ' ' + d.parent.x +
            ' L' + (d.parent.y) + ' ' + (d.parent.x + width_factor);

        });

      // Remove any exiting links
      const linkExit = link.exit().
        transition().
        duration(duration).
        attr('x1', function (d) {
          return source.x;
        }).
        attr('y1', function (d) {
          return source.y;
        }).
        attr('x2', function (d) {
          return source.x;
        }).
        attr('y2', function (d) {
          return source.y;
        }).
        remove();

      // ### CIRCLES

      // Update the nodes...
      const node = container.selectAll('g.node')
        .data(nodes, function (d) {
          return d.id || (d.id = ++i);
        });

      // Enter any new modes at the parent's previous position.
      const nodeEnter = node.enter().
        append('g').
        attr('class', 'node').
        attr('transform', function (d) {
          return 'translate(' + source.y0 + ',' + source.x0 + ')';
        }).
        on('click', click);



      const getSize = (d) => {
        if (d.data[0].cluster['@type'] === 'OBJECT') {
          return 60;
        } else {

          const count = d.data[0].cluster['count'];

          if (count >= min_cluster_count) {
            let radius = node_size_mul_factor * count;
            return radius <= 150? radius: 150;
          } else {
            let radius = node_size_mul_factor * min_cluster_count;
            return radius <= 150? radius: 150;
          }

        }
        // return 100;
      };

      nodeEnter.append("circle")        // attach a circle
        .attr('x', (d) => '-' + getSize(d) / 2 + 'px')
        .attr('y', (d) => '-' + getSize(d) / 2 + 'px')
        .attr("r", (d) => (getSize(d) / 2) + 8)             // set the radius
        .style("stroke", "#00c9f4")    // set the line colour
        .style("stroke-width", "5")  
        .style("fill", "#00c9f4")

      // append svg icon
      nodeEnter.append('image')
      .attr('xlink:href', d => {
        return getNodeIcon(d, true);
      })
      .attr('x', (d) => '-' + getSize(d) / 2 + 'px')
      .attr('y', (d) => '-' + getSize(d) / 2 + 'px')
      .attr('width', (d) => getSize(d) + 'px')
      .attr('height', (d) => getSize(d) + 'px')
      .attr('fill', 'white');      ;

      // Append font awesome icon
      nodeEnter.append('svg:foreignObject')
      .html((d, i) => '<i class="'+getNodeIcon(d, false)+'"></i>')
      .attr('width', (d,i)=>getSize(d) * 1.5)
      .attr('height', (d,i)=>getSize(d) * 1.5)
      .style('font-size',(d, i) => ( 0.26 * getSize(d)) * 2)
      .style('color','white')
      .attr('x', (d, i) => (-1 * ( 0.26 * getSize(d))))
      .attr('y', (d, i) => (-1.5 * ( 0.26 * getSize(d))))


     
      nodeEnter.append('text')
        .text(d => {
          const cluster = d.data[0].cluster;
          let label: string = cluster.label;
          if (label.indexOf('=') >= 0) {
            const labels = label.split('=');
            label = labels[labels.length - 1];
          }
          if (cluster['exploreType'] === 'filter' || cluster['exploreType'] === 'group') {
            label = cluster.label.split(":").pop();
          }
          cluster['formattedLabel'] = label;
          if (cluster['count']) {
            label = cluster['count'] + ' - ' + label;
          }

          // format label
          if (label != undefined) {
            label = label.toString();
            label = label.length <= max_label_length ? label : label.substring(0, max_label_length) + "...";
            return label;
          }
          else {
              return label;
          }
        })
        .attr('text-anchor', 'middle')
        .attr('x', 10)
        .attr('y', (d) =>{
          let radius = (getSize(d)/2)+8;
          return (1.54 * radius) + 'px';
        })
        .call(wrap, 200);


      //Set node title
      nodeEnter.append('title')
        .text(d => {
          const cluster = d.data[0].cluster;
          let label: string = cluster.label;
          if (label.indexOf('=') >= 0) {
            const labels = label.split('=');
            label = labels[labels.length - 1];
          }
          if (cluster['exploreType'] === 'filter' || cluster['exploreType'] === 'group') {
            label = cluster.label.split(":").pop();
          }
          cluster['formattedLabel'] = label;
          if (cluster['count']) {
            label =  cluster['count'] + ' - ' + label;
          }

          return label;
        });
     

        // set image for selected node
        nodeEnter.append('image')
        .attr('xlink:href', '/assets/img/graph-svg/mouseClick.svg')
        .attr('width', (d) => {
          let radius = (getSize(d)/2)+8;
          return ((radius + 0.24 * radius) * 2) + 'px';
        })
        .attr('height', (d) => {
          let radius = (getSize(d)/2)+8;
          return ((radius + 0.24 * radius) * 2) + 'px';
        })
        .attr('x', (d) => {
          let radius = (getSize(d)/2)+8;
          return - radius - (0.24 * radius) + 'px';
        })
        .attr('y', (d) => {
          let radius = (getSize(d)/2)+8;
          return - radius - (0.24 * radius) + 'px';
        })
        .attr('opacity', 0)
        .on('click', function (d) {
          d3.selectAll('#selected_node').attr('opacity', '0').attr('id', '');
          selected = d;
          // if (!d.children) {
          d3.select(this).attr('id', 'selected_node');
          d3.select(this).attr('opacity', '0.5');
          // }
        })
        .on('contextmenu', function (d) {
          selected = d;
          d3.selectAll('#selected_node').attr('opacity', '0').attr('id', '');
          // if (!d.children) {
          d3.select(this).attr('id', 'selected_node');
          d3.select(this).attr('opacity', '0.5');
          // }
          //var position = d3.mouse(this);
          // if (!d.children) {

          d3.event.preventDefault();
          const el = document.getElementById('graphId-' + visualId);

          const x = d3.event.pageX - getOffset(el).left;
          const y = d3.event.pageY - getOffset(el).top;

          if (d.data[0].cluster['@type'] === 'OBJECT') {
            d3.select('#menuInstance-' + visualId)
              .style('position', 'absolute')
              .style('left', x + 'px')
              .style('top', y + 'px')
              .style('display', 'block');
          } else {

            d3.select('#menu-' + visualId)
              .style('position', 'absolute')
              .style('left', x + 'px')
              .style('top', y + 'px')
              .style('display', 'block');
          }

          if(d.id == 1){
            // hide remove option from menu for root node
            d3.select("#remove-"+visualId)
              .style("display", "none");
          }

        });

        nodeEnter.append('image')
        .attr('xlink:href', '/assets/img/icons/filter_icon.svg')
        .attr('width', '30px')
        .attr('height', '30px')
        .attr('cursor', 'pointer')
        .attr('x', (d) => ((getSize(d) / 2) - 10) + 'px')
        .attr('y', '-10px')
        .attr('id', (d) => 'filter-' + d.id)
        .attr('opacity', '0')
        .on('click', function (d) {

          selected = d;

          if (d.data[0].cluster['filters']) {
            self.openFilter();
          } else {
            self.openGroupBy();
          }

        });

      // Update
      const nodeUpdate = nodeEnter.merge(node);

      // Transition to the proper position for the node
      nodeUpdate.transition().
        duration(duration).
        attr('transform', function (d) {
          return 'translate(' + d.y + ',' + d.x + ')';
        });
      ////change readius variable
      // Update the node attributes and style
      nodeUpdate.select('circle.node').
        attr('r', radius).
        style('fill', function (d) {
          return '#0e4677';
        }).
        attr('cursor', 'pointer');

      // Remove any exiting nodes
      const nodeExit = node.exit().
        transition().
        duration(duration).
        attr('transform', function (d) {
          return 'translate(' + source.y + ',' + source.x + ')';
        }).
        remove();

      // On exit reduce the node circles size to 0
      nodeExit.select('circle').attr('r', 0);

      // Store the old positions for transition.
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      d3.selectAll('.node').raise();


      // Toggle children on click.
      function click(d) {
        selected = d;
        self.onClusterSelected();
        if (!selected.children) {

        }

        selectedNode = d;
        // Unhide remove option from menu
        d3.select("#remove-"+visualId)
              .style("display", "block");

        // d3.select(this).select('#filter').attr("opacity","1");
      }

          // function to wrap the text

      function wrap(text, width) {
        text.each(function () {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              x = text.attr("x"),
              y = text.attr("y"),
              dy = 0, //parseFloat(text.attr("dy")),
              tspan = text.text(null)
                          .append("tspan")
                          .attr("x", x)
                          .attr("y", y)
                          .attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                .text(word);
                }
            }
        });
      } // End of wrap function

    }


     //function to collapse node and its childrens
     this.collapseNode = () => {
      let d = selectedNode;
      // collapse childrens
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        
        // Update parent if its not root node
        let parentNode = d.parent;
        let parentChildrens = [];

        for(let i=0; i< parentNode.children.length; i++){
          if(d.id != parentNode.children[i].id){
            parentChildrens.push(parentNode.children[i]);
          }
        }

        if(parentChildrens === undefined || parentChildrens.length == 0){
          parentChildrens = null;
        }

        d.parent.children = parentChildrens;
        update(d.parent);
        
    }

    //function add_node()
    this.addNode = (cluster, clean = false) => {

      //creates New OBJECT
      const newNodeObj = {
        name: cluster.label,
        cluster: cluster,
        children: []
      };
      //Creates new Node
      const newNode = d3.hierarchy(newNodeObj);
      newNode.depth = selected.depth + 1;
      newNode.height = selected.height - 1;
      newNode.parent = selected;
      newNode.id = Date.now();
      //temp fix by u
      if (!isArray(newNode.data)) {
        newNode.data = [newNode.data];
      }

      if (!selected.children || clean) {
        selected.children = [];
        selected.data.children = [];
      }
      selected.children.push(newNode);
      selected.data.children.push(newNode.data);

      if (cluster['@type'] === 'CLUSTER') {
        d3.select('#filter-' + selected.id).attr('opacity', '1');
      }

      update(selected);
      d3.selectAll('#selected_node').attr('opacity', '0').attr('id', '');
    };

    function getOffset(el) {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
      };
    }

    // Function to get wedge length
    function getDistance(x1, y1, x2, y2) {
      // Input: coordinates of parent and child nodes
      // Output: Returns distance between two points in svg
      let xs = 0;
      let ys = 0;

      xs = x2 - x1;
      xs = xs * xs;

      ys = y2 - y1;
      ys = ys * ys;

      return Math.sqrt(xs + ys);
    }

    function zoomed() {
      container.attr('transform', d3.event.transform);
    }

    function get_node_radius(d) {
      if (d.data.type === 'CLUSTER') {
        if (d.data.count >= min_cluster_count) {
          return node_size_mul_factor * d.data.count;
        } else {
          return node_size_mul_factor * min_cluster_count;
        }
      } else {
        return object_size;
      }
    }

    // handle anywhere click event. To hide selected image and options.
    document.body.addEventListener('click', function () {
      d3.select('#menu-' + visualId)
        .style('display', 'none');
      d3.select('#menuInstance-' + visualId)
        .style('display', 'none');
      /// d3.selectAll("#selected_node").attr("opacity", "0").attr("id", "");
    }, true);
  }

  addNode;
  collapseNode;


}
