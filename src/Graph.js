'use strict';

//var color = d3.scale.category10();

///////////////////////////////////////////////////////////////////////////////
// GraphCategory

//function GraphCategory(nodeAlphabet, edgeAlphabet, elementKinds) {
function GraphCategory() {
  this.object = function() {
    return new Graph();
  };

  this.morphism = function(objA, objB) {
    return new GraphMorphism(objA, objB);
  };

  this.pushout = function(f, g) {
    return new GraphPushout(this).calculate(f, g);
  };

  this.pushoutComplement = function(f, p) {
    return new GraphPushout(this).complement(f, p);
    // return new GraphPushoutComplement(this, f, p);
  };
}

///////////////////////////////////////////////////////////////////////////////
// Graph

//function Graph(nodeAlphabet, edgeAlphabet, elementKinds) {
function Graph() {
  var setCat = new SetCategory();

  // this.nodeAlphabet = typeof nodeAlphabet != 'undefined' ? nodeAlphabet : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // this.edgeAlphabet = typeof edgeAlphabet != 'undefined' ? edgeAlphabet : 'abcdefghijklmnopqrstuvwxyz';
  // this.elementKinds = elementKinds;

  this.nodes = setCat.object();
  this.edges = setCat.object();
  this.source = setCat.morphism(this.edges, this.nodes);
  this.target = setCat.morphism(this.edges, this.nodes);

  this.equals = function (graph) {
    return this.nodes.equals(graph.nodes) && this.edges.equals(graph.edges) &&
           this.source.equals(graph.source) && this.target.equals(graph.target);
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

function GraphMorphism(graphA, graphB) {
  var setCat = new SetCategory();

  this.source = graphA;
  this.target = graphB;
  this.nodeMap = setCat.morphism(this.source.nodes, this.target.nodes);
  this.edgeMap = setCat.morphism(this.source.edges, this.target.edges);

  this.dom = function () { return graphA; };
  
  this.codom = function () { return graphB; };

  // console.log('graphA = ' + graphA);
  // console.log('graphB = ' + graphB);
  this.init = function () {
    var tNodes = graphB.nodes.elements();
    graphA.nodes.forEach(function (s) {
      var t = tNodes[Math.round(Math.random() * tNodes.length)];
      if (isUndefined(t)) {
        t = graphB.nodes.addNext();
      }
      this.nodeMap.push(s, t);
    }.bind(this));
    graphA.edges.forEach(function (s) {
      var sn = this.nodeMap.image(graphA.source.image(s));
      var tn = this.nodeMap.image(graphA.target.image(s));
      var t = graphB.edges.random(function (e) {
        return graphB.source.image(e) === sn && graphB.target.image(e) === tn;
      });
      if (isUndefined(t)) {
        t = graphB.edges.addNext();
        graphB.source.push(t, sn);
        graphB.target.push(t, tn);
      }
      this.edgeMap.push(s, t);
    }.bind(this));
    // console.log('graphA\' = ' + graphA);
    // console.log('graphB\' = ' + graphB);
    // console.log('graphA\'.source = ' + graphA.source);
    // console.log('graphA\'.target = ' + graphA.target);
    // console.log('graphB\'.source = ' + graphB.source);
    // console.log('graphB\'.target = ' + graphB.target);
    // console.log('this.edgeMap = ' + this.edgeMap);
    // console.log('this.nodeMap = ' + this.nodeMap);
    // console.log('p = ' + graphA.source.compose(this.nodeMap));
    // console.log('q = ' + this.edgeMap.compose(graphB.source));
    assert(graphA.source.isTotal());
    assert(graphA.target.isTotal());
    assert(graphB.source.isTotal());
    assert(graphB.target.isTotal());
    assert(this.edgeMap.isTotal());
    assert(this.nodeMap.isTotal());
    return this;
  };

  this.isTotal = function () {
    return this.nodeMap.isTotal() && this.edgeMap.isTotal();
  };

  this.isMono = function () {
    return this.nodeMap.isMono() && this.edgeMap.isMono();
  };

}

GraphMorphism.prototype.toString = function () {
    // function sub(text) {
    //   return '<sub>' + text + '</sub>';
    // }
    // function mapToString(m) {
    //   return '(' + m.source.label + sub(m.source.id) + ',' + m.target.label + sub(m.target.id) + ')';
    // };
    // return '&lt;nodeMap: {' + this.nodeMap.map(mapToString).join() + '}, edgeMap: {' + this.edgeMap.map(mapToString).join() + '}&gt;';
  return '&lt;nodeMap: ' + this.nodeMap + ', edgeMap: ' + this.edgeMap + '&gt;';
};

GraphMorphism.prototype.check = function () {
  // console.log('>>> check GraphMorphism');
  //assert(this.dom().source.compose(this.nodeMap).commutes(this.edgeMap.compose(this.codom().source)));
  assertCommutes(this.nodeMap.compose(this.dom().source), this.codom().source.compose(this.edgeMap));
  assertCommutes(this.nodeMap.compose(this.dom().target), this.codom().target.compose(this.edgeMap));
};

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
    var gamma = mapD.compose(epc.q).compose(ecp.g).composePartial(beta); // ???
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
