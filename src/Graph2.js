'use strict';

/////////////////////////////////////////////////////////////////////////////
// CommaCategory

function CommaCategory(S, T, leftObjName, rightObjName, mappingName, leftArrName, rightArrName) {
  assert(S.codom().equals(T.codom()));

  this.leftFunctor = function () { return S; };
  this.rightFunctor = function () { return T; };

  if (isUndefined(leftObjName)) leftObjName = 'left';
  if (isUndefined(rightObjName)) rightObjName = 'right';
  if (isUndefined(mappingName)) mappingName = 'morphism';

  this.object = function (A, B, f) {
    assert(S.dom().hasObject(A));
    assert(T.dom().hasObject(B));
    assertEqualObjects(f.dom(), this.leftFunctor().mapObject(A));
    assertEqualObjects(f.codom(), this.rightFunctor().mapObject(B));
    return new CommaObject(this, A, B, f, leftObjName, rightObjName, mappingName);
    // obj[leftObjName] = A;
    // obj[rightObjName] = B;
    // obj[mappingName] = S.codom().morphism(S.mapObject(A), T.mapObject(B));
    // return obj;
  };

  // TODO: I think such functions must replace object()
  this.hasObject = function (A) {
    return A instanceof CommaObject &&
           S.dom().hasObject(A.left()) &&
           T.dom().hasObject(A.right()) &&
           A.mapping().dom().equals(S.mapObject(A.left())) &&
           A.mapping().codom().equals(T.mapObject(A.right()));
  }

  this.domainFunctor = new DomainFunctor(this, S.dom());
  this.codomainFunctor = new CodomainFunctor(this, S.dom());

  this.leftObj = function (A) {
    return A[leftObjName];
  };

  this.rightObj = function (A) {
    return A[rightObjName];
  };

  this.mapping = function (A) {
    return A[mappingName];
  };

  this.morphism = function (A, B, f, g) {
    assertCommutes(this.mapping(B).compose(S.mapMorphism(f)), T.mapMorphism(g).compose(this.mapping(A)));
    var morphism = {};
    morphism[leftArrName] = f;
    morphism[rightArrName] = g;
    morphism.toString = function () { return '(f: ' + f + ', g: ' + g + ')' };
    return morphism;
  };

  this.leftArr = function (f) {
    return f[leftArrName];
  };

  this.rightArr = function (f) {
    return f[rightArrName];
  };

  //this.leftProjection
}

extend(CommaCategory, Category);

/////////////////////////////////////////////////////////////////////////////
// CommaObject

function CommaObject(cat, A, B, f, leftObjName, rightObjName, mappingName) {
  this._leftObjName = !isUndefined(leftObjName) ? leftObjName : 'left';
  this._rightObjName = !isUndefined(rightObjName) ? rightObjName : 'right';
  this._mappingName = !isUndefined(mappingName) ? mappingName : 'morphism';

  this[this._leftObjName] = A;
  this[this._rightObjName] = B;
  this[this._mappingName] = f;
}

CommaObject.prototype.left = function () {
  return this[this._leftObjName];
}

CommaObject.prototype.right = function () {
  return this[this._rightObjName];
}

CommaObject.prototype.mapping = function () {
  return this[this._mappingName];
}

CommaObject.prototype.toString = function () {
  return '(' + this._leftObjName + ': ' + this.left() +
         ', ' + this._rightObjName + ': ' + this.right() +
         ', ' + this._mappingName + ': ' + this.mapping() + ')';
};

/////////////////////////////////////////////////////////////////////////////
// DomainFunctor

function DomainFunctor(C, D) {
  assert(C instanceof CommaCategory);
  var mapObject = function (A) {
    return C.leftObj(A);
  };
  var mapMorphism = function (f) {
    return C.leftArr(f);
  };
  DomainFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(DomainFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// CodomainFunctor

function CodomainFunctor(C, D) {
  assert(C instanceof CommaCategory);
  var mapObject = function (A) {
    return C.rightObj(A);
  };
  var mapMorphism = function (f) {
    return C.rightArr(f);
  };
  CodomainFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(CodomainFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// CommaCategoryCoproductFunctor

function CommaCategoryCoproductFunctor(C, D) {
  assert(C instanceof CommaCategory);
  assertParallel(C.leftFunctor(), C.rightFunctor());
  var mapObject = function (A) {
    return D.coproduct(C.leftObj(A), C.rightObj(A)).apex();
  };
  var mapMorphism = function (f) {
    var g = C.leftArr(f);
    var h = C.rightArr(f);
    var cp = D.coproduct(g.codom(), h.codom());
    return D.coproduct(g.dom(), h.dom()).univ(cp.f.compose(g), cp.g.compose(h)).morphism();
  };
  CommaCategoryCoproductFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(CommaCategoryCoproductFunctor, Functor);

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

//var catLGraph = new CommaCategory(new GetLeftObj(catGraph, setCat), );

var nodesB = setCat.object([1,2,3,4]);
var edgesB = setCat.object([1,2,3,4,5]);
var sourceB = setCat.morphism(edgesB, nodesB, {1: 1, 2: 2, 3: 3, 4: 1, 5: 3});
var targetB = setCat.morphism(edgesB, nodesB, {1: 2, 2: 4, 3: 4, 4: 3, 5: 1});
var mapB = setCat.product(nodesB, nodesB).univ(sourceB, targetB).morphism();
var graphB = catGraph.object(edgesB, nodesB, mapB);
//var graphB = catGraph.object(edgesB, nodesB, objToPairMapping({1: [1,2], 2: [2,4], 3: [3,4], 4: [1,3], 5: [3,1]}));

var nodesC = setCat.object([1,2,5,6]);
var edgesC = setCat.object([1,2,3,4]);
var sourceC = setCat.morphism(edgesC, nodesC, {1: 5, 2: 6, 3: 1, 4: 5});
var targetC = setCat.morphism(edgesC, nodesC, {1: 6, 2: 2, 3: 2, 4: 1});
var mapC = setCat.product(nodesC, nodesC).univ(sourceC, targetC).morphism();
var graphC = catGraph.object(edgesC, nodesC, mapC);
//var graphC = catGraph.object(edgesC, nodesC, objToPairMapping({1: [5,6], 2: [6,2], 3: [1,2], 4: [5,1]}));

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

var setCommaCoproductFunc = new CommaCategoryCoproductFunctor(catGraph, setCat);
var labelingFunc2 = new LabelingFunctor(labels.apex());
var catLGraph2 = new CommaCategory(setCommaCoproductFunc, labelingFunc2, 'graph', 'labels', 'labeling', 'graphMap', 'labelMap');

var graphLA2 = catLGraph2.object(graphA, 1, labeling);

//graphLA2.labeling.image();
//graphLA2.graph.nodes

console.log(graphLA2);
