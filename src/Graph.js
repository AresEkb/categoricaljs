'use strict';

//var color = d3.scale.category10();

///////////////////////////////////////////////////////////////////////////////
// GraphCategory

//function GraphCategory(nodeAlphabet, edgeAlphabet, elementKinds) {
function GraphCategory() {
}

extend(GraphCategory, Category, BicompleteCategory);

/*
// TODO: What is the purpose of this function?
// Maybe it must pass all arguments to Graph constructor
// Or maybe one must create objects directly?
// What we really need is to check whether object has the right type or not.
// But from the another point of view the function guarantees
// that the object will has the right type.
// In Computational Category Theory book Category has 4 functions: domain, codomain, id, compose
GraphCategory.prototype.object = function (nodes, edges, source, target) {
  //return new (Function.prototype.bind.apply(Graph, arguments));
  //return Graph.apply(null, arguments);
  return new Graph(nodes, edges, source, target);
};

// TODO: The same as for object function.
// I think this function must not create a new morphism.
// Instead we need to check whether morphism has the right type or not.
GraphCategory.prototype.morphism = function (A, B, nodeMap, edgeMap) {
  return new GraphMorphism(A, B, nodeMap, edgeMap);
};
*/

GraphCategory.prototype.compose = function (g, f) {
  return g.compose(f);
};

GraphCategory.prototype.hasObject = function(A) {
  return A instanceof Graph;
};

GraphCategory.prototype.hasMorphism = function(f) {
  return f instanceof GraphMorphism;
};

GraphCategory.prototype.areComposable = function(g, f) {
  return g.dom().equals(f.dom());
};

GraphCategory.prototype.terminal = function () {
  return new GraphTerminalObject(this).calculate();
};

GraphCategory.prototype.initial = function () {
  return new GraphInitialObject(this).calculate();
};

GraphCategory.prototype.pushout = function(f, g) {
  return new GraphPushout(this).calculate(f, g);
};

GraphCategory.prototype.pushoutComplement = function(f, p) {
  return new GraphPushout(this).complement(f, p);
};

///////////////////////////////////////////////////////////////////////////////
// Graph

// nodes and edges: [1,2,3,...]
// source: {1:1, 2:2, ...}
//         [[1,1],[2,2],...]
//         {1:[1,2], 2:[2,3], ...}
//         [[1,[1,2]], [2,[2,3]], ...]
//         [[1,1,2], [2,2,3], ...]
function Graph(nodes, edges) {
  var setCat = new SetCategory();
//console.log(nodes, edges, source, target);
  // this.nodeAlphabet = typeof nodeAlphabet != 'undefined' ? nodeAlphabet : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // this.edgeAlphabet = typeof edgeAlphabet != 'undefined' ? edgeAlphabet : 'abcdefghijklmnopqrstuvwxyz';
  // this.elementKinds = elementKinds;

  this.nodes  = new Set(nodes);
  this.edges  = new Set();
  this.source = new TotalFunction(this.edges, this.nodes);
  this.target = new TotalFunction(this.edges, this.nodes);

  edges.forEach(function (edge) {
    this.edges.add(edge[0]);
    this.source.push(edge[0], edge[1]);
    this.target.push(edge[0], edge[2]);
  }, this);

  this.equals = function (graph) {
    return this.nodes.equals(graph.nodes) && this.edges.equals(graph.edges) &&
           this.source.equals(graph.source) && this.target.equals(graph.target);
  };

  this.size = function () {
    return this.nodes.size();
  };

  this.randomInit = function(nodeCount, edgeCount, elementKind) {
    nodeCount = typeof nodeCount != 'undefined' ? nodeCount : Math.round(Math.random() * 20) + 20;
    edgeCount = typeof edgeCount != 'undefined' ? edgeCount : Math.round(Math.random() * 10) + 20;

    this.nodes = setCat.object();
    this.edges = setCat.object();
    this.source = setCat.morphism(this.edges, this.nodes);
    this.target = setCat.morphism(this.edges, this.nodes);

    for (var i = 1; i <= nodeCount; i++) {
      this.nodes.add(i);
    }
    if (nodeCount > 0) {
      for (i = 1; i <= edgeCount; i++) {
        var s = Math.round(Math.random() * (nodeCount - 1)) + 1;
        var t = Math.round(Math.random() * (nodeCount - 1)) + 1;
        this.edges.add(i);
        this.source.push(i, s);
        this.target.push(i, t);
      }
    }
  };

  // this.supplement = function(graphA, kind) {
  //   for (var i in graphA.nodes) {
  //     var label = graphA.nodes[i].label;
  //     if (!this.nodes.some(function(n) { return n.label === label; })) {
  //       this.nodes.push({'label': label, 'id': this.nodes.length, 'kind': kind});
  //     }
  //   }
  //   for (var i in graphA.edges) {
  //     var label = graphA.edges[i].label;
  //     var source = graphA.nodes[graphA.edges[i].source].label;
  //     var target = graphA.nodes[graphA.edges[i].target].label;
  //     if (!this.edges.some(function(n) {
  //           return n.label === label &&
  //                  this.nodes[n.source].label === source &&
  //                  this.nodes[n.target].label === target; }, this)) {
  //       var possibleSources = this.nodes.filter(function(n) { return n.label === source; });
  //       var s = possibleSources[Math.round(Math.random() * (possibleSources.length - 1))].id;
  //       var possibleTargets = this.nodes.filter(function(n) { return n.label === target; });
  //       var t = possibleTargets[Math.round(Math.random() * (possibleTargets.length - 1))].id;
  //       this.edges.push({'source': s, 'target': t, 'label': label, 'id': this.edges.length, 'kind': kind});
  //     }
  //   }
  //   this.updateOrdinals();
  // };
}

Graph.prototype.toString = function () {
  return '(nodes: ' + this.nodes + ', edges: ' + this.edges + ', source: ' + this.source + ', target: ' + this.target + ')';
};

///////////////////////////////////////////////////////////////////////////////
// GraphMorphism

// TODO: If one will change (co)domain of the morphism, then it's not
// guaranteed that mappings are not broken.
// We need either make (co)dom read-only or re-check mappings when
// (co)dom is changed.
function GraphMorphism(graphA, graphB, nodeMap, edgeMap) {
  GraphMorphism.base.constructor.call(this, graphA, graphB);
  //base(this, graphA, graphB);

  this._nodeMap = new TotalFunction(this.dom().nodes, this.codom().nodes);
  this._edgeMap = new TotalFunction(this.dom().edges, this.codom().edges);

  nodeMap.forEach(function (map) { this._nodeMap.push(map[0], map[1]); }, this);
  edgeMap.forEach(function (map) { this._edgeMap.push(map[0], map[1]); }, this);

  this.check();
}

extend(GraphMorphism, Morphism);

// TODO: It must be called after any changes
// Use Object.observe?
GraphMorphism.prototype.check = function () {
  assertCommutes(this._nodeMap.compose(this.dom().source), this.codom().source.compose(this._edgeMap));
  assertCommutes(this._nodeMap.compose(this.dom().target), this.codom().target.compose(this._edgeMap));
};

GraphMorphism.prototype.mapNode = function (source, target) {
  if (!isUndefined(target)) {
    this._nodeMap.push(source, target);
    return target;
  }
  return this._nodeMap.image(source);
}

GraphMorphism.prototype.mapEdge = function (source, target) {
  if (!isUndefined(target)) {
    this._edgeMap.push(source, target);
    return target;
  }
  return this._edgeMap.image(source);
}

GraphMorphism.prototype.init = function () {
  var tNodes = graphB.nodes.elements();
  graphA.nodes.forEach(function (s) {
    var t = tNodes[Math.round(Math.random() * tNodes.length)];
    if (isUndefined(t)) {
      t = graphB.nodes.addNext();
    }
    this._nodeMap.push(s, t);
  }.bind(this));
  graphA.edges.forEach(function (s) {
    var sn = this._nodeMap.image(graphA.source.image(s));
    var tn = this._nodeMap.image(graphA.target.image(s));
    var t = graphB.edges.random(function (e) {
      return graphB.source.image(e) === sn && graphB.target.image(e) === tn;
    });
    if (isUndefined(t)) {
      t = graphB.edges.addNext();
      graphB.source.push(t, sn);
      graphB.target.push(t, tn);
    }
    this._edgeMap.push(s, t);
  }.bind(this));
  assert(graphA.source.isTotal());
  assert(graphA.target.isTotal());
  assert(graphB.source.isTotal());
  assert(graphB.target.isTotal());
  assert(this._edgeMap.isTotal());
  assert(this._nodeMap.isTotal());
  return this;
};

GraphMorphism.prototype.isTotal = function () {
  return this._nodeMap.isTotal() && this._edgeMap.isTotal();
};

GraphMorphism.prototype.isMono = function () {
  return this._nodeMap.isMono() && this._edgeMap.isMono();
};

GraphMorphism.prototype.toString = function () {
  return '&lt;nodeMap: ' + this._nodeMap + ', edgeMap: ' + this._edgeMap + '&gt;';
};

/////////////////////////////////////////////////////////////////////////////
// GraphTerminalObject

function GraphTerminalObject(cat) {
  this.cat = function () { return cat; };
}

GraphTerminalObject.prototype.calculate = function () {
  this.obj = new Graph([1]);
  this.obj.nodes.addAll([1]);
  this.obj.edges.addAll([1]);
  this.obj.source.push(1, 1); this.obj.target.push(1, 1);
  return this;
}

GraphTerminalObject.prototype.univ = function (A) {
  var u = this.cat().morphism(A, this.obj);
  A.nodes.forEach(function (el) {
    u.nodeMap.push(ul, 1);
  });
  A.edges.forEach(function (el) {
    u.edgeMap.push(el, 1);
  });
  return u;
}

/////////////////////////////////////////////////////////////////////////////
// GraphInitialObject

function GraphInitialObject(cat) {
  this.cat = function () { return cat; };
}

GraphInitialObject.prototype.calculate = function () {
  this.obj = new Graph();
  return this;
}

GraphInitialObject.prototype.univ = function (A) {
  return this.cat().morphism(this.obj, A);
}

///////////////////////////////////////////////////////////////////////////////
// GraphPushout

function GraphPushout(cat) {
  this.cat = function () { return cat; };
}

GraphPushout.prototype.A = function () {
  return this.f.dom();
};

GraphPushout.prototype.B = function () {
  return this.f.codom();
};

GraphPushout.prototype.C = function () {
  return this.g.codom();
};

GraphPushout.prototype.D = function () {
  return this.p.codom();
};

GraphPushout.prototype.check = function () {
  return this;
};

GraphPushout.prototype.calculate = function (f, g) {
  return this.calculateWOCheck(f, g).check();
};

GraphPushout.prototype.calculateWOCheck = function (f, g) {
  assert(f.dom().equals(g.dom()), 'Morphisms must have a same source');
  assert(f.isTotal(), 'Morphism f must not be partial: ' + f);
  assert(g.isTotal(), 'Morphism g must not be partial: ' + g);
  this.f = f;
  this.g = g;

  var setCat = new SetCategory();
  var npo = setCat.pushout(f.nodeMap, g.nodeMap);
  var epo = setCat.pushout(f.edgeMap, g.edgeMap);
  this._npo = npo;
  this._epo = epo;

  // console.log('npo = ' + npo);
  // console.log('epo = ' + epo);

  // this.obj = new Graph(graphA.nodeAlphabet, graphA.edgeAlphabet, graphA.elementKinds);
  var D = this.cat().object();
  D.nodes = npo.obj;
  D.edges = epo.obj;
  D.source = epo.univ(npo.p.compose(this.B().source), npo.q.compose(this.C().source));
  D.target = epo.univ(npo.p.compose(this.B().target), npo.q.compose(this.C().target));
  // this.p = new GraphMorphism(graphB, this.obj);
  this.p = this.cat().morphism(this.B(), D);
  this.p.nodeMap = npo.p;
  this.p.edgeMap = epo.p;
  // this.q = new GraphMorphism(graphC, this.obj);
  this.q = this.cat().morphism(this.C(), D);
  this.q.nodeMap = npo.q;
  this.q.edgeMap = epo.q;
  // this.p.check();
  // this.q.check();
  return this;
};

GraphPushout.prototype.complement = function (f, g) {
  return this.complementWOCheck(f, g);//.check();
};

GraphPushout.prototype.complementWOCheck = function (f, p) {
  assert(f.codom().equals(p.dom()));
  assert(f.isTotal(), 'Morphism f must not be partial: ' + f);
  assert(p.isTotal(), 'Morphism g must not be partial: ' + p);

  this.f = f;
  this.p = p;

  var setCat = new SetCategory();
  var npc = setCat.pushoutComplement(f.nodeMap, p.nodeMap);
  var epc = setCat.pushoutComplement(f.edgeMap, p.edgeMap);

  // console.log('npc = ' + npc);
  // console.log('epc = ' + epc);

  //this.obj = new Graph(this.A().nodeAlphabet, graphA.edgeAlphabet, graphA.elementKinds);
  var C = this.cat().object();
  C.nodes = npc.obj;
  C.edges = epc.obj;

  function calcEdgeToNodeMap(mapA, mapD) {
    var ncp = setCat.coproductComplement(npc.g);
    var ecp = setCat.coproductComplement(epc.g);
    var r1 = npc.g.compose(p.nodeMap.compose(f.nodeMap).decomposeToEM().e.inv());
    var r2 = ncp.g.compose(npc.q.compose(ncp.g).decomposeToEM().e.inv());
    var beta = r1.union(r2);
    var gamma = mapD.compose(epc.q).compose(ecp.g).composePartial(beta); // TODO: Check composePartial!!!
    // console.log('r1 = ' + r1);
    // console.log('r2 = ' + r2);
    // console.log('beta = ' + beta);
    // console.log('gamma = ' + gamma);
    return ecp.univ(npc.g.compose(mapA), gamma);
  }
  C.source = calcEdgeToNodeMap(this.A().source, this.D().source);
  C.target = calcEdgeToNodeMap(this.A().target, this.D().target);
  // console.log('source = ' + this.obj.source);
  // console.log('target = ' + this.obj.target);
  // console.log(this.obj.toString());
  
  // this.g = new GraphMorphism(this.A(), this.obj);
  this.g = this.cat().morphism(this.A(), C);
  this.g.nodeMap = npc.g;
  this.g.edgeMap = epc.g;
  // this.q = new GraphMorphism(this.obj, this.D());
  this.q = this.cat().morphism(C, this.D());
  this.q.nodeMap = npc.q;
  this.q.edgeMap = epc.q;
  return this;
};

GraphPushout.prototype.toString = function () {
  return '<f: ' + this.f + ', g: ' + this.g + ', p: ' + this.p + ', q: ' + this.q + '>';
};
