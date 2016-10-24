'use strict';

///////////////////////////////////////////////////////////////////////////////
// GraphView

// TODO: Refactor everything

function GraphView(model, nodeViews, edgeViews) {

  var width,         // svg width
      height,        // svg height
      data, net, force, edgeg, links, nodeg, nodes;

  nodeViews = coalesce(nodeViews, {});
  edgeViews = coalesce(edgeViews, {});

  var vis;

  this.bind = function (svg) {
    vis = svg;
    width = svg.node().getBoundingClientRect().width;
    height = svg.node().getBoundingClientRect().height;

    vis.append('svg:defs')
         .append('svg:marker')
           .attr('id', 'arrow')
           .attr('viewBox', '0 -5 10 10')
           .attr('refX', 8)
           .attr('refY', 0)
           .attr('markerWidth', 4)
           .attr('markerHeight', 4)
           .attr('orient', 'auto')
           .append('svg:path')
             .attr('d', 'M0,-5L10,0L0,5');

    edgeg = vis.append("g").attr("class", "edges");
    nodeg = vis.append("g").attr("class", "nodes");

    vis.attr("opacity", 1e-6)
      .transition()
        .duration(1000)
        .attr("opacity", 1);
  };


  //this.force = d3.layout.force()
  //  .charge(-400)
  //  .linkDistance(100);

  this.start = function() {
    if (this.force) { this.force.stop(); }

    this.force = d3.forceSimulation()
      .force("charge", d3.forceManyBody())
      .force("link", d3.forceLink()
        .id(function (d) { return d.id; })
        .distance(function (l, i) { return 100; }))
      .force("center", d3.forceCenter(width / 2, height / 2))

    force = this.force;

    var d3nodes = [];
    var d3nodesMap = {};
    var nodeCount = 0;
    model.nodes.forEach(function (n) {
      d3nodes[nodeCount] = {'id': n};
      if (!isUndefined(model.nodeLabel)) {
        d3nodes[nodeCount].label = model.nodeLabel.image(n);
      }
      d3nodesMap[n] = nodeCount++;
    });
    var d3edges = [];
    var adjMatrix = {};
    model.edges.forEach(function (e) {
      //var s = d3nodesMap[model.source.image(e)];
      //var t = d3nodesMap[model.target.image(e)];
      var s = model.source.image(e);
      var t = model.target.image(e);
      if (!adjMatrix[s]) {
        adjMatrix[s] = {};
      }
      adjMatrix[s][t] = adjMatrix[s][t] ? adjMatrix[s][t] + 1 : 1;
      var d3edge = {'id': e, 'source': s, 'target': t, 'ordinal': adjMatrix[s][t]};
      if (!isUndefined(model.edgeLabel)) {
        d3edge.label = model.edgeLabel.image(e);
      }
      d3edges.push(d3edge);
    });

    this.force
      .nodes(d3nodes)
      .on("tick", ticked);
    this.force.force("link")
      .links(d3edges);

    //this.force.nodes(d3nodes);
    //this.force.links(d3edges);
    //console.log(this.force.links());
    //console.log(this.force.nodes());
    //var edge = vis.selectAll('.edge').data(this.force.force("link").links());
    //var node = vis.selectAll('.node').data(this.force.nodes());
/*
    var edgeg = edge.enter()
      .append('g')
        .attr('class', 'edge');
    edgeg
      .append('svg:path')
        .attr('class', 'edge-path')
        // .style('stroke', function(d) { return color[model.elementKinds.indexOf(d.kind)]; }.bind(this))
        .attr('marker-end', 'url(#arrow)');
    var edgeLabel = edgeg
      .append('text')
        .attr('class', 'edge-label');
    if (!isUndefined(model.edgeLabel)) {
      edgeLabel
        .text(function (d) { return d.label; })
          .append('tspan')
            .attr('dx', '2px')
            .text(function (d) { return d.id; });
    }
    else {
      edgeLabel.text(function (d) { return d.id; });
    }
    edge.exit().transition().style('opacity', 0).duration(1000).remove();
*/
    model.edgeLabel.codom().forEach(function (label) {
      var edge = edgeg.selectAll('.edge.label-'+label).data(this.force.force('link').links().filter(function (d) { return d.label == label; }));
      edge.exit().transition().style('opacity', 0).duration(1000).remove();
      var edgeEnter = edge.enter()
        .append('g')
          .attr('class', function (d) { return 'edge label-' + d.label; });
      var draw = edgeViews[label] || labeledEdge;
      draw(model, edgeEnter);
    }.bind(this));

    model.nodeLabel.codom().forEach(function (label) {
      var node = nodeg.selectAll('.node.label-'+label).data(this.force.nodes().filter(function (d) { return d.label == label; }));
      node.exit().transition().style('opacity', 0).duration(1000).remove();
      var nodeEnter = node.enter()
        .append('g')
          .attr('class', function (d) { return 'node label-' + d.label; })
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
      var draw = nodeViews[label] || labeledNode;
      draw(model, nodeEnter);
    }.bind(this));

    //labeledNode(model, nodeg, node.exit());
/*
    var nodeg = node.enter()
      .append('g')
        .attr('class', 'node')
        .call(d3.drag()
          .on("start", dragstarted.bind(this.force))
          .on("drag", dragged.bind(this.force))
          .on("end", dragended.bind(this.force)));
    nodeg
      .append('circle')
        .attr('r', 18)
        .style('fill', 'white');
        // .style('stroke', function(d) { return color[model.elementKinds.indexOf(d.kind)]; }.bind(this))
        // .style('stroke-width', function(d) { return model.elementKinds.indexOf(d.kind) > -1 ? '5px' : '0'; }.bind(this));
    var nodeCircle = nodeg
      .append('circle')
        .attr('r', 14)
        .attr('class', 'node-circle');
    if (!isUndefined(model.nodeLabel)) {
      nodeCircle.style('fill', function(d) {
        return color[model.nodeLabel.codom().ordinal(model.nodeLabel.image(d.id))];
      });
    }
    var nodeLabel = nodeg.append('text')
      .attr('class', 'node-label');
    if (!isUndefined(model.nodeLabel)) {
      nodeLabel
        .text(function (d) { return d.label; })
          .append('tspan')
            .attr('dx', '1px')
            .text(function (d) { return d.id; });
    }
    else {
      nodeLabel.text(function (d) { return d.id; });
    }

    node.exit().transition().style('opacity', 0).duration(1000).remove();
*/
    //this.force.start();
  };

  // TODO: Move this stuff into a Base View. 
  // If you will pass bounded function to on, you will experience strange bugs:
  // .on('start', dragstarted.bind(this.force))
  function dragstarted(d) {
    if (!d3.event.active) {
      force.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) {
      force.alphaTarget(0);
    }
    if (!d3.event.sourceEvent.ctrlKey) {
      d.fx = null;
      d.fy = null;
    }
  }

  function ticked() {
    vis.selectAll('.edge-path').attr('d', function(d) {
      if (d.source === d.target) {
        var p0 = { x: d.source.x, y: d.source.y, r: nodeRadius(d.source) + 3 };
        var p = calcLoopCurve(p0, d.ordinal);
        return 'M' + p[0].x + ',' + p[0].y +
               'Q' + p[1].x + ',' + p[1].y + ' ' + p[2].x + ',' + p[2].y +
               'T' + p[3].x + ',' + p[3].y;
      }
      else {
        var p0 = { x: d.source.x, y: d.source.y, r: nodeRadius(d.source) + 1 };
        var p2 = { x: d.target.x, y: d.target.y, r: nodeRadius(d.target) + 3 };
        var p = calcLinkCurve(p0, p2, d.ordinal);
        return 'M' + p[0].x + ',' + p[0].y +
               'Q' + p[1].x + ',' + p[1].y + ' ' + p[2].x + ',' + p[2].y;
      }
    });
    vis.selectAll('.edge-label').attr('transform', function (d) {
      var x, y;
      if (d.source == d.target) {
        var p = calcLoopCurve(d.source, d.ordinal);
        x = p[2].x;
        y = p[2].y;
      }
      else {
        var p = calcLinkCurve(d.source, d.target, d.ordinal / 1.2);
        x = p[1].x;
        y = p[1].y;
      }
      return 'translate(' + x + ',' + y + ')';
    });

    vis.selectAll('.node').attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  };
}

function nodeRadius(d) {
  return 18;
}

function labeledNode(model, enter, exit) {
  enter
    .append('circle')
      .attr('r', 18)
      .style('fill', 'white');
      // .style('stroke', function(d) { return color[model.elementKinds.indexOf(d.kind)]; }.bind(this))
      // .style('stroke-width', function(d) { return model.elementKinds.indexOf(d.kind) > -1 ? '5px' : '0'; }.bind(this));
  var nodeCircle = enter
    .append('circle')
      .attr('r', 14)
      .attr('class', 'node-circle');
  if (!isUndefined(model.nodeLabel)) {
    nodeCircle.style('fill', function(d) {
      return color[model.nodeLabel.codom().ordinal(model.nodeLabel.image(d.id))];
    });
  }
  var nodeLabel = enter.append('text')
    .attr('class', 'node-label');
  if (!isUndefined(model.nodeLabel)) {
    nodeLabel
      .text(function (d) { return d.label; })
        .append('tspan')
          .attr('dx', '1px')
          .text(function (d) { return d.id; });
  }
  else {
    nodeLabel.text(function (d) { return d.id; });
  }

//  exit.transition().style('opacity', 0).duration(1000).remove();
}

function labeledEdge(model, enter, exit) {
  enter
    .append('svg:path')
      .attr('class', 'edge-path')
      // .style('stroke', function(d) { return color[model.elementKinds.indexOf(d.kind)]; }.bind(this))
      .attr('marker-end', 'url(#arrow)');
  var edgeLabel = enter
    .append('text')
      .attr('class', 'edge-label');
  if (!isUndefined(model.edgeLabel)) {
    edgeLabel
      .text(function (d) { return d.label; })
        .append('tspan')
          .attr('dx', '2px')
          .text(function (d) { return d.id; });
  }
  else {
    edgeLabel.text(function (d) { return d.id; });
  }
}
