// backbone-tree-model 1.1.1
(function(root, factory) {
    // Set up Backbone appropriately for the environment. Start with AMD.
        if (typeof define === 'function' && define.amd) {
            define(['underscore', 'backbone', 'exports'], function(_, Backbone, exports) {
                // Export global even in AMD case in case this script is loaded with
                // others that may still expect a global Backbone.
                    return root.BackboneTreeModel = factory(root, exports, _, Backbone);
            });

            // Next for Node.js or CommonJS.
        } else if (typeof exports !== 'undefined') {
            var _ = require('underscore');
            var Backbone = require('backbone');
            module.exports = factory(root, exports, _, Backbone);

            // Finally, as a browser global.
        } else {
            root.BackboneTreeModel = factory(root, {}, root._, root.Backbone);
        }
}(this, function(root, BackboneTreeModel, _, Backbone) {


    /**
     * @define {WrappedArray} array-like object that has special methods
     */
    var WrappedArray = {

        /**
         * Find all descendants with matching attributes
         * @return WrappedArray
         */
        where: function(attrs) {
            var nodes = [];
            _.each(this, function(model) {
                nodes = nodes.concat(model.where(attrs));
            });
            return _wrapArray(_.uniq(nodes));
        }
    };

    /**
     * extend an array with special methods
     * @param {array} array
     * @return WrappedArray
     */
    var _wrapArray = function(array) { return _.extend(array, WrappedArray); };


    /**
     * @define {TreeModel}
     */
    var TreeModel = Backbone.TreeModel = Backbone.Model.extend({

        /**
         * @constructor
         * initializes TreeModel with node data
         * @param {object} node
         */
        constructor: function tree(node) {
            Backbone.Model.prototype.constructor.apply(this, arguments);
            this._nodes = new this.collectionConstructor([], {
                model : this.constructor
            });
            this._nodes.parent = this;
            if(node && node.nodes) this.add(node.nodes);
        },

        /**
         * collectionConstructor to be assigned after TreeCollection is defined
         */
        collectionConstructor : null,

        /**
         * check if child of root node
         */
        isRootBranch: function() {
            return this.parent() && this.parent().isRoot();
        },

        /**
         * set descendant properties
         * @param {object} argument properties to set
         */
        setPropDescendants: function() {
            var args = Array.prototype.slice.call(arguments);
            this.set.apply(this, args);
            if(this.nodes()) {
                this.nodes().each(function(n) {
                    n.setPropDescendants.apply(n, args);
                });
            }
        },

        /**
         * traverse up the tree and find closest node that contains a property
         * @param {string} prop
         * @return {property}
         */
        getClosestAncestorProperty: function(prop) {
            var value = this.get(prop);
            if(this.isRoot() || !_.isUndefined(value)) {
                return value;
            } else {
                return this.parent().getClosestAncestorProperty(prop);
            }
        },


        /**
         * @return object representing tree, account for branch changes
         */
        toJSON: function() {
            var jsonObj = _.clone(_.omit(this.attributes, 'nodes'));
            var children = this._nodes.toJSON();
            if(children.length) jsonObj.nodes = children;
            return jsonObj;
        },

        /**
         * find descendants based on cid
         * @param {number} cid
         * @return TreeModel
         */
        findByCid: function(cid) {
            if(this.cid === cid) return this;
            return this.nodes() && this.nodes().findByCid(cid) || null;
        },

        /**
         * find descendant TreeModel with matching ID
         * @param {string} id
         * @return TreeModel
         */
        find: function(id) { return this.findWhere({id: id}); },

        /**
         * Find first TreeModel descendant with matching attributes
         * @param {object} attrs - key:val attributes to match
         * @return TreeModel
         */
        findWhere: function(attrs) { return this.where(attrs, true); },

        /**
         * Find all TreeModel descendants with matching attributes
         * @return WrappedArray
         */
        where: function(attrs, first, excludeCurrentNode) {
            var nodes = [], matchedNode;

            // manual (non-collection method) check on the current node
            if(!excludeCurrentNode && _.where([this.attributes], attrs)[0]) nodes.push(this);

            if(first) {
                // return if first/current node is a match
                if(nodes[0]) return nodes[0];

                // return first matched node in children collection
                matchedNode = this._nodes.where(attrs, true);
                if(_.isArray(matchedNode)) matchedNode = matchedNode[0];
                if(matchedNode instanceof Backbone.Model) return matchedNode;

                // recursive call on children nodes
                for(var i=0, len=this._nodes.length; i<len; i++) {
                    matchedNode = this._nodes.at(i).where(attrs, true, true);
                    if(matchedNode) return matchedNode;
                }
            } else {
                // add all matched children
                nodes = nodes.concat(this._nodes.where(attrs));

                // recursive call on children nodes
                this._nodes.each(function(node) {
                    nodes = nodes.concat(node.where(attrs, false, true));
                });

                // return all matched nodes
                return _wrapArray(nodes);
            }
        },

        /**
         * check if root node
         * @return boolean
         */
        isRoot: function() { return this.parent() === null; },

        /**
         * get root node from any branch node
         * @return TreeModel
         */
        root: function() { return this.parent() && this.parent().root() || this; },

        /**
         * check if a node is a descendant
         * @param {TreeModel} node
         * @return boolean
         */
        contains: function(node) {
            if(!node || !(node.isRoot && node.parent) || node.isRoot()) return false;
            var parent = node.parent();
            return (parent === this) || this.contains(parent);
        },

        /**
         * get parent node or null if parent doesn't exist (root node)
         * @return TreeModel
         */
        parent: function() { return this.collection && this.collection.parent || null; },

        /**
         * get children nodes of null if leaf node
         * @return {TreeCollection}
         */
        nodes: function() { return this._nodes.length && this._nodes || null; },

        /**
         * get index of self within parent's TreeCollection
         * @return {integer}
         */
        index: function() {
            if(this.isRoot()) return null;
            return this.collection.indexOf(this);
        },

        /**
         * get next sibling
         * @return TreeModel
         */
        next: function() {
            if(this.isRoot()) return null;
            var currentIndex = this.index();
            if(currentIndex < this.collection.length-1) {
                return this.collection.at(currentIndex+1);
            } else {
                return null;
            }
        },

        /**
         * get previous sibling
         * @return TreeModel
         */
        prev: function() {
            if(this.isRoot()) return null;
            var currentIndex = this.index();
            if(currentIndex > 0) {
                return this.collection.at(currentIndex-1);
            } else {
                return null;
            }
        },

        /**
         * removes current node if no attributes arguments is passed,
         * otherswise remove matched nodes or first matched node
         * @param {object} attrs
         * @param {boolean} first
         * @return {boolean|TreeModel} true if self-remove successful, otherwise return self
         */
        remove: function(attrs, first) {
            if(!attrs) {
                if(this.isRoot()) return false; // can't remove root node
                this.collection.remove(this);
                return true;
            } else {
                if(first) {
                    this.where(attrs, true).remove();
                } else {
                    _.each(this.where(attrs), function(node) {
                        if(node.collection) node.remove();
                    });
                }
                return this;
            }
        },

        /**
         * removes all children nodes
         * @return TreeModel
         */
        empty: function() {
            this._nodes.reset();
            return this;
        },

        /**
         * add child/children nodes to Backbone Collection
         * @param {object|array|TreeModel|TreeCollection} node
         * @return TreeModel
         */
        add: function(node) {
            if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
            this._nodes.add.apply(this._nodes, arguments);
            return this;
        },

        /**
         * inserts a node before self
         * @param {TreeModel} node
         * @return TreeModel
         */
        insertBefore: function(node) {
            if(!this.isRoot()) {
                if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
                this.parent().add(node, {at: this.index()});
            }
            return this;
        },

        /**
         * inserts a node after self
         * @param {TreeModel} node
         * @return TreeModel
         */
        insertAfter: function(node) {
            if(!this.isRoot()) {
                if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
                this.parent().add(node, {at: this.index()+1});
            }
            return this;
        },

        /**
         * shorthand for getting/inserting nodes before
         * @param {object|array|TreeModel|TreeCollection} nodes
         * @param TreeModel - self or previous node
         */
        before: function(nodes) {
            if(nodes) return this.insertBefore(nodes);
            return this.prev();
        },

        /**
         * shorthand for getting/inserting nodes after
         * @param {object|array|TreeModel|TreeCollection} nodes
         * @param TreeModel - self or next node
         */
        after: function(nodes) {
            if(nodes) return this.insertAfter(nodes);
            return this.next();
        },

        /**
         * flatten self and all descendants into single array
         * @return WrappedArray
         */
        flatten: function() {
            var nodes = [], children = this.nodes();
            nodes.push(this);
            if(children) nodes.push(children.flatten());
            return _wrapArray(_.flatten(nodes));
        },

        /**
         * alias for flatten
         */
        toArray: null
    });


    /**
     * @define {TreeCollection}
     */
    var TreeCollection = Backbone.TreeCollection = Backbone.Collection.extend({
        model: TreeModel,

        /**
         * Find all descendants with matching attributes
         * @return WrappedArray
         */
        where: function(attrs, opts) {
            if(opts && opts.deep) {
                var nodes = [];
                this.each(function(model) {
                    nodes = nodes.concat(model.where(attrs));
                });
                return _wrapArray(nodes);
            } else {
                return Backbone.Collection.prototype.where.apply(this, arguments);
            }
        },

        /**
         * find descendants based on cid
         * @param {number} cid
         * @return TreeModel
         */
        findByCid: function(cid) {
            var model = this.get({cid: cid});
            if(model) {
                return model;
            } else {
                for(var node, i = 0; i < this.length; i++) {
                    node = this.at(i);
                    model = node.findByCid(cid);
                    if(model) {
                        return model;
                    }
                }
            }
        },

        /**
         * flatten self and all descendants into single array
         * @return WrappedArray
         */
        flatten: function() {
            return _wrapArray(_.flatten(this.map(function(n) { return n.flatten(); })));
        },

        /**
         * alias for flatten
         */
        toArray: null
    });

    TreeModel._ = _;
    TreeModel.Backbone = Backbone;
    TreeModel.prototype.toArray = TreeModel.prototype.flatten;
    TreeModel.prototype.collectionConstructor = TreeCollection;
    TreeCollection.prototype.toArray = TreeCollection.prototype.flatten;

    return TreeModel;

}));
