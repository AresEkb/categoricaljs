'use strict';

///////////////////////////////////////////////////////////////////////////////
// SetCategoryView

// Based on http://bl.ocks.org/GerHobbelt/3071239

// TODO: IE11 doesn't draw edges

// TODO: Refactor everything

function SetCategoryView(model) {

  var width,         // svg width
      height,        // svg height
      //dr = 10,       // default point radius
      off = 15,      // cluster hull offset
      expand = {},   // expanded clusters
      groups = [],
      data, net, force, hullg, hulls, linkg, links, nodeg, nodes;

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
  };

  this.start = function () {
    data = { nodes : [], links : [] };

    var objectMap = model.objectMap();
    for (var name in objectMap) {
      if (has(objectMap, name)) {
        var obj = objectMap[name];
        var groupId = groups.push(name) - 1;
        // Add the object
        var objNode = { name : name, label : name, group : groupId, object : true, size: obj.size()+1, nodes: [] };
        data.nodes.push(objNode);
        // Add the object label
        data.nodes.push({ name : '_l_'+name, label : name, group : groupId, group_data : objNode, isLabel : true });
        // Add object elements
        var prev = '_l_'+name;
        obj.forEach(function (el) {
          var elName = name+'['+el+']';
          var elNode = { name : elName, label : el, group : groupId, group_data : objNode };
          objNode.nodes.push(elNode);
          data.nodes.push(elNode);
          data.links.push({ source : prev, target : elName, inner : true, value : 1, ordinal : 0 });
          prev = name+'['+el+']';
        });
      }
    }

    var morphismMap = model.morphismMap();
    var adjMatrix = {};
    for (var src in morphismMap) {
      if (has(morphismMap, src)) {
        var dst = morphismMap[src];
        var s = dst.dom;
        var t = dst.codom;
        if (!adjMatrix[s]) {
          adjMatrix[s] = {};
        }
        if (!adjMatrix[t]) {
          adjMatrix[t] = {};
        }
        adjMatrix[s][t] = (adjMatrix[s][t] + 1) || 1;
        dst.morphism.forEach(function (a, b) {
          var s2 = dst.dom+'['+a+']';
          var t2 = dst.codom+'['+b+']';
          if (!adjMatrix[s2]) {
            adjMatrix[s2] = {};
          }
          if (!adjMatrix[t2]) {
            adjMatrix[t2] = {};
          }
          adjMatrix[s ][t2] = (adjMatrix[s ][t2] + 1) || 1;
          adjMatrix[s2][t ] = (adjMatrix[s2][t ] + 1) || 1;
          adjMatrix[s2][t2] = (adjMatrix[s2][t2] + 1) || 1;
        });
      }
    }
    var ordMatrix = {};
    //console.log(adjMatrix);
    for (var name in morphismMap) {
      if (has(morphismMap, name)) {
        var dst = morphismMap[name];
        var s = dst.dom;
        var t = dst.codom;

        //console.log(s, t, ordinal);

        // Add the morphism
        data.links.push({ name : name, label : name, source : s, target : t, morphism : true, value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, s, t) });
        // Add empty functions if needed
        if (dst.morphism.dom().isEmpty() || dst.morphism.codom().isEmpty()) {
          var sl = '_l_'+s;
          var tl = '_l_'+t;
          data.links.push({ name : name, label : name, source : sl, target : tl, empty : true, value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, s, t) });
          data.links.push({ name : name, label : name, source : s,  target : tl, empty : true, value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, s, t) });
          data.links.push({ name : name, label : name, source : sl, target : t,  empty : true, value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, s, t) });
        }
        // Add elements of the function graph
        dst.morphism.forEach(function (a, b) {
          var se = dst.dom+'['+a+']';
          var te = dst.codom+'['+b+']';
          data.links.push({ name : name, label : name, source : se, target : te, value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, se, te) });
          data.links.push({ name : name, label : name, source : s,  target : te, value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, s,  te) });
          data.links.push({ name : name, label : name, source : se, target : t,  value : 1, ordinal : calcOrdinal(adjMatrix, ordMatrix, se, t) });
        });
      }
    }
//console.log(data);

    hullg = vis.append("g").attr("class", "hulls");
    linkg = vis.append("g").attr("class", "links");
    nodeg = vis.append("g").attr("class", "nodes");

    init();
    
    vis.attr("opacity", 1e-6)
      .transition()
        .duration(1000)
        .attr("opacity", 1);
  };

  function init() {
    if (force) { force.stop(); }

    force = d3.forceSimulation();
    //this.force = force;

    net = network(data, net, groups, getGroup, expand);
  
    hullg.selectAll("path.hull").remove();
    var hullData = hullg.selectAll("path.hull").data(convexHulls(net.nodes, getGroup, off));
    hullData.enter()
      .append("path")
        .attr("class", "hull")
        .attr("d", function (d) { return hullCurve(d.path); })
        .style("fill", function (d) { return brighter(color[d.group]); })
        .on("dblclick", function (d) { expand[d.group] = false; init(); });
    hulls = hullg.selectAll("path.hull");

    var visible_links = net.links.filter(function (l) { return !l.inner; });
    var linkData = linkg.selectAll("g.link").data(visible_links, linkid);
    linkData.exit().remove();
    var linkEnter = linkData.enter()
      .append('g')
        .attr('class', function (d) { return "link"; });
    linkEnter
      .append('svg:path')
        .attr('class', 'link-path')
        .attr('marker-end', 'url(#arrow)');
    var linkLabel = linkEnter
      .append('g')
        .attr('class', 'link-label');
    linkLabel
      .append('circle')
        .attr("r", '7')
        .style("fill", 'white');
    linkLabel
      .append('text')
        .text(function (d) { return d.label; });
    links = linkg.selectAll("g.link");

    var elements = net.nodes.filter(function (n) { return !n.isLabel; });
    var nodeData = nodeg.selectAll("g.node").data(elements, nodeid);
    nodeData.exit().remove();
    var nodeEnter = nodeData.enter()
      .append('g')
        .attr('class', 'node')
        .on("dblclick", function (d) { expand[d.group] = !expand[d.group]; init(); })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
    nodeEnter
      .append('circle')
        .attr("class", function (d) { return "node-circle" + (d.size ? "" : " leaf"); })
        .attr("r", nodeRadius)
        .style("fill", function (d) { return color[d.group]; });
    nodeEnter
      .append('text')
        .attr('class', 'node-label')
        .text(function (d) { return d.label; });
    var labels = net.nodes.filter(function (n) { return n.isLabel; });
    nodeData = nodeg.selectAll("g.label").data(labels, nodeid);
    nodeData.exit().remove();
    nodeEnter = nodeData.enter()
      .append('g')
        .attr('class', 'node')
        .on("dblclick", function (d) { expand[d.group] = !expand[d.group]; init(); })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
    nodeEnter
      .append('circle')
        .attr("class", function (d) { return "group-title"; })
        .attr("r", nodeRadius)
        .style("fill", function (d) { return brighter(color[d.group]); });
    nodeEnter
      .append('text')
        .attr('class', 'node-label')
        .text(function (d) { return d.label; });
    nodes = nodeg.selectAll("g.node");

    force
      .force("charge", d3.forceManyBody())
      .force("link", d3.forceLink().id(function (d) { return d.name; })
        .distance(function (l, i) {
          if (l.inner) {
            return 20;
          }
          var n1 = l.source, n2 = l.target;
          // larger distance for bigger groups:
          // both between single nodes and _other_ groups (where size of own node group still counts),
          // and between two group nodes.
          //
          // reduce distance for groups with very few outer links,
          // again both in expanded and grouped form, i.e. between individual nodes of a group and
          // nodes of another group or other group node or between two group nodes.
          //
          // The latter was done to keep the single-link groups ('blue', rose, ...) close.
          return 50 +
            Math.min(20 * Math.min((n1.size || (n1.group != n2.group ? n1.group_data.size : 0)),
                                   (n2.size || (n1.group != n2.group ? n2.group_data.size : 0))),
                 -30 +
                 50 * Math.min((n1.link_count || (n1.group != n2.group ? n1.group_data.link_count : 0)),
                               (n2.link_count || (n1.group != n2.group ? n2.group_data.link_count : 0))),
                 100);
        })
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      /*.force("ltr", function force(alpha) {
        for (var i = 0; i < net.links.length; i++) {
          d = net.links[i];
          if (!d.inner) {
            d.source.x -= alpha * 6;
            d.target.x += alpha * 6;
          }
          else {
            d.target.x += (d.source.x - d.target.x) * alpha;
            d.source.y -= alpha * 2;
            d.target.y += alpha * 2;
          }
        }
      })*/;
//console.log(net.links);
    force
      .nodes(net.nodes)
      .on("tick", ticked);
    force.force("link")
      .links(net.links);
  }

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
    if (!hulls.empty()) {
      hulls.data(convexHulls(net.nodes, getGroup, off))
        .attr("d", function (d) { return hullCurve(d.path); });
    }

    links.selectAll('.link-path').attr('d', function (d) {
      if (d.source === d.target) {
        var p0 = { x: d.source.x, y: d.source.y, r: nodeRadius(d.source) + 3 };
        var p = loopCurve(p0, d.ordinal);
        return 'M' + p[0].x + ',' + p[0].y +
               'Q' + p[1].x + ',' + p[1].y + ' ' + p[2].x + ',' + p[2].y +
               'T' + p[3].x + ',' + p[3].y;
      }
      else {
        var p0 = { x: d.source.x, y: d.source.y, r: nodeRadius(d.source) + 1 };
        var p2 = { x: d.target.x, y: d.target.y, r: nodeRadius(d.target) + 3 };
        var p = linkCurve(p0, p2, d.ordinal);
        return 'M' + p[0].x + ',' + p[0].y +
               'Q' + p[1].x + ',' + p[1].y + ' ' + p[2].x + ',' + p[2].y;
      }
    });

    links.selectAll('.link-label').attr('transform', function (d) {
      var x, y;
      if (d.source == d.target) {
        var p = loopCurve(d.source, d.ordinal);
        x = p[2].x;
        y = p[2].y;
      }
      else {
        var p0 = { x: d.source.x, y: d.source.y, r: nodeRadius(d.source) + 1 };
        var p2 = { x: d.target.x, y: d.target.y, r: nodeRadius(d.target) + 3 };
        var p = linkCurve(p0, p2, d.ordinal / 1.2);
        x = p[1].x;
        y = p[1].y;
      }
      return 'translate(' + x + ',' + y + ')';
    });

    nodes.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  }
}

///////////////////////////////////////////////////////////////////////////////
// Helpers

function nodeid(n) {
  return n.name;
}

function linkid(l) {
  var u = nodeid(l.source),
      v = nodeid(l.target);
  return l.name+"|"+(u<v ? u+"|"+v : v+"|"+u);
}

function getGroup(n) { return n.group; }

function nodeRadius(d) {
  var dr = 10;
  return Math.min(d.size ? d.size + dr : dr + 1, dr + 5);
}

// constructs the network to visualize
function network(data, prev, groups, index, expand) {
  expand = expand || {};
  var gm = {},    // group map
      gn = {},    // previous group nodes
      gc = {},    // previous group centroids
      nodes = [], // output nodes
      links = []; // output links

  // process previous nodes for reuse or centroid calculation
  // TODO: Refactor it
  if (prev) {
    prev.nodes.forEach(function (n) {
      var i = index(n);
      if (n.size > 0) {
        gn[i] = n;
        //n.size = 0;
      }
      else {
        var o = gc[i] || (gc[i] = {x: 0, y: 0, count: 0});
        o.x += n.x;
        o.y += n.y;
        o.count += 1;
      }
    });
  }
//console.log(gn);
  // determine nodes
  for (var k = 0; k < data.nodes.length; k++) {
    var n = data.nodes[k],
        i = index(n),
        l = gm[i] || (gm[i] = gn[i]) || (gm[i] = findNode(data.nodes, n.name));
    if (expand[i] && !n.object) {
      nodes.push(n);
      // TODO: Refactor it
      if (gn[i]) {
        // place new nodes at cluster location (plus jitter)
        n.x = gn[i].x + Math.random();
        n.y = gn[i].y + Math.random();
      }
    }
    else if (!expand[i] && n.object) {
      nodes.push(n);
      // TODO: Refactor it
      if (gc[i]) {
        n.x = gc[i].x / gc[i].count;
        n.y = gc[i].y / gc[i].count;
      }
    }
  }

  for (i in gm) { gm[i].link_count = 0; }

  // determine links
  for (k = 0; k < data.links.length; k++) {
    var e = data.links[k],
        s = typeof e.source === 'object' ? e.source : findNode(data.nodes, e.source),
        t = typeof e.target === 'object' ? e.target : findNode(data.nodes, e.target),
        u = index(s),
        v = index(t);

    // TODO: Refactor it
    if (u != v) {
      gm[u].link_count++;
      gm[v].link_count++;
    }

    if (tryFindNode(nodes, typeof e.source === 'object' ? e.source.name : e.source) &&
        tryFindNode(nodes, typeof e.target === 'object' ? e.target.name : e.target)) {
      //e.size += 1;
      links.push(e);
    }
  }
  //console.log(links);

  return {nodes: nodes, links: links};
}

function findNode(nodes, name) {
  var result = tryFindNode(nodes, name);
  assert(!isUndefined(result), "Node with name '" + name + "' not found");
  return result;
}

function tryFindNode(nodes, name) {
  var result = nodes.filter(function (n) { return n.name == name; });
  if (result.length > 0) {
    assert(result.length == 1, "Found " + result.length + " multiple nodes with name '" + name + "'");
    return result[0];
  }
}

function convexHulls(nodes, index, offset) {
  var hulls = {};

  // create point sets
  for (var k=0; k<nodes.length; ++k) {
    var n = nodes[k];
    if (n.size) continue;
    var i = index(n),
        l = hulls[i] || (hulls[i] = []);
    l.push([n.x-offset, n.y-offset]);
    l.push([n.x-offset, n.y+offset]);
    l.push([n.x+offset, n.y-offset]);
    l.push([n.x+offset, n.y+offset]);
  }

  // create convex hulls
  var hullset = [];
  for (i in hulls) {
    hullset.push({group: i, path: d3.polygonHull(hulls[i])});
  }

  return hullset;
}

function showSetCategoryView(viewId, category, objects, morphisms) {
  var diagram = new Diagram(null, category);
  for (var name in objects) {
    if (has(objects, name)) {
      diagram.addObjectMap(name, objects[name]);
    }
  }
  for (var name in morphisms) {
    if (has(morphisms, name)) {
      var morphism = morphisms[name];
      diagram.addMorphismMap(name, morphism.dom, morphism.codom, morphism.morphism);
    }
  }
  var view = new SetCategoryView(diagram);
  view.bind(d3.select('#' + viewId));
  view.start();
}
