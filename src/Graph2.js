'use strict';

/////////////////////////////////////////////////////////////////////////////
// CommaCategory

function CommaCategory(S, T, leftObjectName, rightObjectName, morphismName, leftMorphismName, rightMorphismName) {
  assert(S.codom().equals(T.codom()));

  this.leftFunctor = function () { return S; };
  this.rightFunctor = function () { return T; };

  if (isUndefined(leftObjectName)) leftObjectName = 'left';
  if (isUndefined(rightObjectName)) rightObjectName = 'right';
  if (isUndefined(morphismName)) morphismName = 'morphism';

  this.object = function (A, B, f) {
    assert(S.dom().hasObject(A));
    assert(T.dom().hasObject(B));
    assertEqualObjects(f.dom(), this.leftFunctor().mapObject(A));
    assertEqualObjects(f.codom(), this.rightFunctor().mapObject(B));
    return new CommaObject(this, A, B, f, leftObjectName, rightObjectName, morphismName);
    // obj[leftObjectName] = A;
    // obj[rightObjectName] = B;
    // obj[morphismName] = S.codom().morphism(S.mapObject(A), T.mapObject(B));
    // return obj;
  };

  // TODO: I think such functions must replace object()
  this.hasObject = function (A) {
    return A instanceof CommaObject &&
           S.dom().hasObject(A.left()) &&
           T.dom().hasObject(A.right()) &&
           A.morphism().dom().equals(S.mapObject(A.left())) &&
           A.morphism().codom().equals(T.mapObject(A.right()));
  }

  this.domainFunctor = new DomainFunctor(this, S.dom());
  this.codomainFunctor = new CodomainFunctor(this, S.dom());

  this.leftObject = function (A) {
    return A[leftObjectName];
  };

  this.rightObject = function (A) {
    return A[rightObjectName];
  };

  this.morphism = function (A) {
    return A[morphismName];
  };

  this.morphism = function (A, B, f, g) {
    assertCommutes(this.morphism(B).compose(S.mapMorphism(f)), T.mapMorphism(g).compose(this.morphism(A)));
    var morphism = {};
    morphism[leftMorphismName] = f;
    morphism[rightMorphismName] = g;
    morphism.toString = function () { return '(f: ' + f + ', g: ' + g + ')' };
    return morphism;
  };

  this.leftMorphism = function (f) {
    return f[leftMorphismName];
  };

  this.rightMorphism = function (f) {
    return f[rightMorphismName];
  };

  //this.leftProjection
}

extend(CommaCategory, Category);

/////////////////////////////////////////////////////////////////////////////
// CommaObject

function CommaObject(cat, A, B, f, leftObjectName, rightObjectName, morphismName) {
  this._leftObjectName = !isUndefined(leftObjectName) ? leftObjectName : 'left';
  this._rightObjectName = !isUndefined(rightObjectName) ? rightObjectName : 'right';
  this._morphismName = !isUndefined(morphismName) ? morphismName : 'morphism';

  this[this._leftObjectName] = A;
  this[this._rightObjectName] = B;
  this[this._morphismName] = f;
}

CommaObject.prototype.left = function () {
  return this[this._leftObjectName];
}

CommaObject.prototype.right = function () {
  return this[this._rightObjectName];
}

CommaObject.prototype.morphism = function () {
  return this[this._morphismName];
}

CommaObject.prototype.toString = function () {
  return '(' + this._leftObjectName + ': ' + this.left() +
         ', ' + this._rightObjectName + ': ' + this.right() +
         ', ' + this._morphismName + ': ' + this.morphism() + ')';
};

/////////////////////////////////////////////////////////////////////////////
// DomainFunctor

function DomainFunctor(C, D) {
  assert(C instanceof CommaCategory);
  var mapObject = function (A) {
    return C.leftObject(A);
  };
  var mapMorphism = function (f) {
    return C.leftMorphism(f);
  };
  DomainFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(DomainFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// CodomainFunctor

function CodomainFunctor(C, D) {
  assert(C instanceof CommaCategory);
  var mapObject = function (A) {
    return C.rightObject(A);
  };
  var mapMorphism = function (f) {
    return C.rightMorphism(f);
  };
  CodomainFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(CodomainFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// CommaCoproductFunctor

function CommaCoproductFunctor(C, D) {
  assert(C instanceof CommaCategory);
  assertParallel(C.leftFunctor(), C.rightFunctor());
  var mapObject = function (A) {
    return D.coproduct(C.leftObject(A), C.rightObject(A)).apex();
  };
  var mapMorphism = function (f) {
    var g = C.leftMorphism(f);
    var h = C.rightMorphism(f);
    var cp = D.coproduct(g.codom(), h.codom());
    return D.coproduct(g.dom(), h.dom()).univ(cp.f.compose(g), cp.g.compose(h)).morphism();
  };
  CommaCoproductFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(CommaCoproductFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// OneCategory

// TODO: Inherit from IndexCategory
function OneCategory() {
}

extend(OneCategory, Category);

OneCategory.prototype.hasObject = function (A) {
  return A === 1;
}

/////////////////////////////////////////////////////////////////////////////
// LabelingFunctor

// TODO: Inherit from Diagram
function LabelingFunctor(alphabet) {
  var setCat = new SetCategory();
  assertHasObject(setCat, alphabet);
  var mapObject = function (A) {
    return alphabet;
  };
  var mapMorphism = function (f) {
    return setCat.id(alphabet);
  };
  LabelingFunctor.base.constructor.call(this, new OneCategory(), setCat, mapObject, mapMorphism);
}

extend(LabelingFunctor, Functor);

console.log('-----------------------------------------------------');

var setCat = new SetCategory();
var setIdFunc = new IdFunctor(setCat);
var setCrossProductFunc = new CrossProductFunctor(setCat);
var catGraph = new CommaCategory(setIdFunc, setCrossProductFunc, 'edges', 'nodes', 'connection', 'edgeMap', 'nodeMap');
var nodesA = setCat.object([1,2]);
var edgesA = setCat.object([1]);
var sourceA = setCat.morphism(edgesA, nodesA, {1: 1});
var targetA = setCat.morphism(edgesA, nodesA, {1: 2});
var mapA = setCat.product(nodesA, nodesA).univ(sourceA, targetA).morphism();
var graphA = catGraph.object(edgesA, nodesA, mapA);
//console.log(graphA);

var nodesB = setCat.object([1,2,3,4]);
var edgesB = setCat.object([1,2,3,4,5]);
var sourceB = setCat.morphism(edgesB, nodesB, {1: 1, 2: 2, 3: 3, 4: 1, 5: 3});
var targetB = setCat.morphism(edgesB, nodesB, {1: 2, 2: 4, 3: 4, 4: 3, 5: 1});
var mapB = setCat.product(nodesB, nodesB).univ(sourceB, targetB).morphism();
var graphB = catGraph.object(edgesB, nodesB, mapB);

var nodesC = setCat.object([1,2,5,6]);
var edgesC = setCat.object([1,2,3,4]);
var sourceC = setCat.morphism(edgesC, nodesC, {1: 5, 2: 6, 3: 1, 4: 5});
var targetC = setCat.morphism(edgesC, nodesC, {1: 6, 2: 2, 3: 2, 4: 1});
var mapC = setCat.product(nodesC, nodesC).univ(sourceC, targetC).morphism();
var graphC = catGraph.object(edgesC, nodesC, mapC);

console.log('graphA = ' + graphA);
console.log('graphB = ' + graphB);
console.log('graphC = ' + graphC);

var fEdgeMap = setCat.morphism(edgesA, edgesB, {1: 1});
var fNodeMap = setCat.morphism(nodesA, nodesB, {1: 1, 2: 2});
var f = catGraph.morphism(graphA, graphB, fEdgeMap, fNodeMap);
console.log(f);

var gEdgeMap = setCat.morphism(edgesA, edgesC, {1: 3});
var gNodeMap = setCat.morphism(nodesA, nodesC, {1: 1, 2: 2});
var g = catGraph.morphism(graphA, graphC, gEdgeMap, gNodeMap);

console.log('f = ' + f);
console.log('g = ' + g);

console.log('-----------------------------------------------------');

var edgeLabels = new Set(['f','g','h']);
var nodeLabels = new Set(['A','B','C','D','E']);

var edgeLabelingFunc = new LabelingFunctor(edgeLabels);
var catELGraph = new CommaCategory(catGraph.domainFunctor, edgeLabelingFunc, 'graph', 'edgeLabels', 'edgeLabeling', 'graphMap', 'labelMap');

var edgeLabelsLA = setCat.morphism(edgesA, edgeLabels, {1: 'f'});
var graphELA = catELGraph.object(graphA, 1, edgeLabelsLA);

//console.log(graphELA);

var nodeLabelingFunc = new LabelingFunctor(nodeLabels);
var catLGraph = new CommaCategory(catGraph.codomainFunctor.compose(catELGraph.domainFunctor), nodeLabelingFunc, 'graph', 'nodeLabels', 'nodeLabeling', 'graphMap', 'labelMap');

var nodeLabelsLA = setCat.morphism(nodesA, nodeLabels, {1: 'A', 2: 'B'});
var graphLA = catLGraph.object(graphELA, 1, nodeLabelsLA);

console.log(graphLA);

console.log('-----------------------------------------------------');

var labels = setCat.coproduct(edgeLabels, nodeLabels);
var labelNames = edgeLabels.union(nodeLabels);
var cpEdgesNodes = setCat.coproduct(edgesA, nodesA);
var labeling = cpEdgesNodes.univ(labels.component('A').compose(edgeLabelsLA), labels.component('B').compose(nodeLabelsLA)).morphism();
var edgeLabelName = setCat.morphism(edgeLabels, labelNames).initId();
var nodeLabelName = setCat.morphism(nodeLabels, labelNames).initId();
var labelName = labels.univ(edgeLabelName, nodeLabelName).morphism();

var setCommaCoproductFunc = new CommaCoproductFunctor(catGraph, setCat);
var labelingFunc2 = new LabelingFunctor(labels.apex());
var catLGraph2 = new CommaCategory(setCommaCoproductFunc, labelingFunc2, 'graph', 'labels', 'labeling', 'graphMap', 'labelMap');

var graphLA2 = catLGraph2.object(graphA, 1, labeling);

//graphLA2.labeling.image();
//graphLA2.graph.nodes

console.log(graphLA2);
