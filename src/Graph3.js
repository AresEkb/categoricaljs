'use strict';

var color = d3.scale.category10();

function Morphism(A, B) {
  this.dom = function () { return A; };
  this.codom = function () { return B; };
}

function Functor(C, D) {
  NaturalTransformation.base.constructor.call(this, C, D);
}

extend(Functor, Morphism);

function NaturalTransformation(F, G) {
  assert(F.dom().equals(G.dom()) && F.codom().equals(G.codom()));
  NaturalTransformation.base.constructor.call(this, F, G);
  this.F = function () { return F; }
  this.G = function () { return G; }
  this.eta = function (A, B) { return F.codom().morphism(F.objectImage(A), G.objectImage(B)); };
}

NaturalTransformation.prototype.calculate = function (A) {
  this.eta = return this.F.codom().morphism(F.objectImage(A), G.objectImage(A));
  this.univ = function (f) {
    assert(f.dom().equals(A));
    var eta = this.F.codom().morphism(F.objectImage(f.codom()), G.objectImage(f.codom()));
    assert(this.F.morphismImage(f).compose(eta).commutes(this.eta.compose(this.G.morphismImage(f))));
    return eta;
  };
};

extend(NaturalTransformation, Morphism);

function Category() {
}

function IntervalCategory() {
  IntervalCategory.base.constructor.call(this);
}

extend(IntervalCategory, Category);

IntervalCategory.prototype.object = function (x) {
  assert(x === 0 || x === 1);
  return x;
};

IntervalCategory.prototype.initial = function () {
  return 1;
};

IntervalCategory.prototype.terminal = function () {
  return 0;
};

IntervalCategory.prototype.morphism = function (A, B) {
  assert(A === 1 && B === 0);
  return 0;
};

function Span() {
  this.A = cat.object();
  this.B = cat.object();
  this.AB = cat.object();
  this.f = cat.morphism(this.AB, this.A);
  this.g = cat.morphism(this.AB, this.B);
}

// Category
function FreeQuiver() {

}

// Functor
//   maps E to some object of cat
//   maps V to some object of cat
//   maps s to some morphism of cat
//   maps t to some morphism of cat
function Quiver(cat) {
  this.E = cat.object();
  this.V = cat.object();
  this.s = cat.morphism(this.E, this.V);
  this.t = cat.morphism(this.E, this.V);
}

function FunctorCategory(C, D) {

}

FunctorCategory.prototype.object = function (x) {
};

FunctorCategory.prototype.morphism = function (A, B) {
};


// Functor category of Quiver(cat)
function Quiv(cat) {
  Quiv.base.constructor.call(this, new FreeQuiver(), cat);
}

extend(Quiv, FunctorCategory);

Quiv.prototype.object = function () {
  return new Quiver(cat);
};

Quiv.prototype.morphism = function (A, B) {
  return new NaturalTransformation();
};

var intervalCat = new IntervalCategory();

var setCat = new SetCategory();
var graphCat = new Quiv(setCat);

var graphA = graphCat.object();
graphA.E = setCat.object([1]);
graphA.V = setCat.object([1,2]);
graphA.s = setCat.morphism({1: 1});
graphA.t = setCat.morphism({1: 2});

var graphB = graphCat.object();
graphB.E = setCat.object([1,2,3,4]);
graphB.V = setCat.object([1,2,3,4,5]);
graphB.s = setCat.morphism({1: 1, 2: 2, 3: 3, 4: 1, 5: 3});
graphB.t = setCat.morphism({1: 2, 2: 4, 3: 4, 4: 3, 5: 1});

var fEdgeMap = setCat.morphism(edgesA, edgesB, {1: 1});
var fNodeMap = setCat.morphism(nodesA, nodesB, {1: 1, 2: 2});
var f = graphCat.morphism(graphA, graphB);



var setIdFunc = new IdFunctor(setCat);
var setDiagFunc = new DiagonalFunctor(setCat);
var cc = new CommaCategory(setIdFunc, setDiagFunc);
var graphA = cc.object(edgesA, nodesA);
graphA.push(1, [1,2]);


function IdFunctor(C) {
  IdFunctor.base.constructor.call(this, C, C);
}

extend(IdFunctor, Functor);

IdFunctor.prototype.objectImage = function (A) {
  return A;
};

IdFunctor.prototype.morphismImage = function (f) {
  return f;
};

// function ProductCategory(C, D) {
//   this.object = function (A, B) {
//     return {1: A, 2: B};
//   };

//   this.morphism = function (f, g) {
//     return {1: f, 2: g};
//   };

//   this.id = function (A) {
//     return {1: C.id(A[1]), 2: D.id(A[2])};
//   };

//   this.compose = function (f, g) {
//     return {1: C.compose(f[1], g[1]), 2: C.compose(f[2], g[2])};
//   };
// }

function DiagonalFunctor(C) {
  // DiagonalFunctor.base.constructor.call(this, C, new ProductCategory(C));
  DiagonalFunctor.base.constructor.call(this, C, C);
}

extend(DiagonalFunctor, Functor);

DiagonalFunctor.prototype.objectImage = function (A) {
  return this.dom().product(A, A).obj;
};

DiagonalFunctor.prototype.morphismImage = function (f) {
  var pa = this.dom().product(f.dom(), f.dom());
  var pb = this.dom().product(f.codom(), f.codom());
  return pb.univ(pa.f.compose(f), pa.g.compose(f));
};

// DiagonalFunctor.prototype.image = function (f) {
//   return this.C().morphism(f.dom(), );
// };


function CommaCategory(S, T) {
  // assert(S.codom().equals(T.codom()));

  this.object = function (A, B) {
    return S.codom().morphism(S.objectImage(A), T.objectImage(B));
  };

  this.morphism = function (A, B, f, g) {
    console.log('f; B = ' + S.morphismImage(f).compose(B));
    console.log('A; g = ' + A.compose(T.morphismImage(g)));
    // assert(S.morphismImage(f).compose(B).commutes(A.compose(T.morphismImage(g))));
    return {'f': f, 'g': g, 'toString': function () { return '(f: ' + f + ', g: ' + g + ')' }};
  };
}

console.log('-----------------------------------------------------');

var setCat = new SetCategory();
var setIdFunc = new IdFunctor(setCat);
var setDiagFunc = new DiagonalFunctor(setCat);
var cc = new CommaCategory(setIdFunc, setDiagFunc);
var nodesA = setCat.object([1,2]);
var edgesA = setCat.object([1]);
var graphA = cc.object(edgesA, nodesA);
graphA.push(1, [1,2]);

var nodesB = setCat.object([1,2,3,4]);
var edgesB = setCat.object([1,2,3,4,5]);
var graphB = cc.object(edgesB, nodesB);
graphB.push(1, [1,2]);
graphB.push(2, [2,4]);
graphB.push(3, [3,4]);
graphB.push(4, [1,3]);
graphB.push(5, [3,1]);

var nodesC = setCat.object([1,2,5,6]);
var edgesC = setCat.object([1,2,3,4]);
var graphC = cc.object(edgesC, nodesC);
graphC.push(1, [5,6]);
graphC.push(2, [6,2]);
graphC.push(3, [1,2]);
graphC.push(4, [5,1]);

console.log('graphA = ' + graphA);
console.log('graphB = ' + graphB);
console.log('graphC = ' + graphC);

var fEdgeMap = setCat.morphism(edgesA, edgesB, {1: 1});
var fNodeMap = setCat.morphism(nodesA, nodesB, {1: 1, 2: 2});
var f = cc.morphism(graphA, graphB, fEdgeMap, fNodeMap);

var gEdgeMap = setCat.morphism(edgesA, edgesC, {1: 3});
var gNodeMap = setCat.morphism(nodesA, nodesC, {1: 1, 2: 2});
var g = cc.morphism(graphA, graphC, gEdgeMap, gNodeMap);

console.log('f = ' + f);
console.log('g = ' + g);

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
  assert(this.dom().source.compose(this.nodeMap).commutes(this.edgeMap.compose(this.codom().source)));
  assert(this.dom().target.compose(this.nodeMap).commutes(this.edgeMap.compose(this.codom().target)));
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
  D.source = epo.univ(this.B().source.compose(npo.p), this.C().source.compose(npo.q));
  D.target = epo.univ(this.B().target.compose(npo.p), this.C().target.compose(npo.q));
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
    var r1 = f.nodeMap.compose(p.nodeMap).decomposeToEM().e.inv().compose(npc.g);
    var r2 = ncp.g.compose(npc.q).decomposeToEM().e.inv().compose(ncp.g);
    var beta = r1.union(r2);
    var gamma = ecp.g.compose(epc.q).compose(mapD).composePartial(beta);
    // console.log('r1 = ' + r1);
    // console.log('r2 = ' + r2);
    // console.log('beta = ' + beta);
    // console.log('gamma = ' + gamma);
    return ecp.univ(mapA.compose(npc.g), gamma);
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
