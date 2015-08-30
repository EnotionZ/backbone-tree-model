(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['backbone'], function(Backbone) {
            return factory(Backbone);
        });
    } else if (typeof exports !== 'undefined') {
        var Backbone = require('backbone');
        module.exports = factory(Backbone);
    } else {
        factory(root.Backbone);
    }
}(this, function(Backbone) {

    var ArrMethods = {
        where: function(attrs) {
            var nodes = [];
            _.each(this, function(model) {
                nodes = nodes.concat(model.where(attrs));
            });
            return wrapArray(_.uniq(nodes));
        }
    };
    var wrapArray = function(array) { return _.extend(array, ArrMethods); };
    
    var bubbleNodeEvent = function(eventName) {
        eventName = 'node:' + eventName;
        return function(model, collection, opts) {
            var parent = this.parent();
            if (parent) {
                parent.trigger(eventName, model, collection, opts);
            } else if (this.collection) {
                this.collection.trigger(eventName, model, collection, opts);
            }
        }
    };

    var TreeModel = Backbone.TreeModel = Backbone.Model.extend({
        constructor: function tree(node) {
            Backbone.Model.prototype.constructor.apply(this, arguments);
            this._nodes = new this.collectionConstructor([], {
                model : this.constructor,
            });
            this._nodes.parent = this;
            if(node && node[this.nodesAttribute]) this.add(node[this.nodesAttribute]);
            
            this.once('sync', function(model, node) {
                if (node[this.nodesAttribute]) this.add(node[this.nodesAttribute]);
            });
            
            this.on('node:change', function(model, collection, opts) {
                var parent = this.parent();
                if (parent) {
                    parent.trigger('node:change', model, collection, opts);
                } else if (this.collection) {
                    this.collection.trigger('node:change', model, collection, opts);
                }
            });
            
            this.on('node:add', bubbleNodeEvent('add'));
            this.on('node:remove', bubbleNodeEvent('remove'));
            this.on('node:change', bubbleNodeEvent('change'));
            
            this.listenTo(this._nodes, 'add', bubbleNodeEvent('add'));
            this.listenTo(this._nodes, 'remove', bubbleNodeEvent('remove'));
            this.listenTo(this._nodes, 'change', bubbleNodeEvent('change'));
        },

        collectionConstructor : null,
        
        nodesAttribute: 'nodes',

        /**
         * returns JSON object representing tree, account for branch changes
         */
        toJSON: function(opts) {
            var flatten = opts && opts.deep === false;
            var omit = [this.nodesAttribute].concat((opts && opts.omit) || []);
            var jsonObj = _.clone(_.omit(this.attributes, omit));
            var children = this._nodes.toJSON(opts);
            if(children.length && !flatten) jsonObj[this.nodesAttribute] = children;
            return jsonObj;
        },

        /**
         * returns descendant matching :id
         */
        find: function(id) { return this.findWhere({id: id}); },

        /**
         * return first matched descendant
         */
        findWhere: function(attrs) { return this.where(attrs, true); },
        
        /**
         * return first matched descendant
         */
        walk: function(callback, skipSelf) {
            if (!skipSelf && callback(this) === false) return this;
            var lastNode;
            this._nodes.every(function(node) {
                lastNode = node.walk(callback);
                return !lastNode;
            });
            return lastNode;
        },
        
        /**
         * return first matched ancestor
         */
        leap: function(callback, skipSelf) {
            if (!skipSelf && callback(this) === false) return this;
            var lastNode = this.parent();
            if (lastNode) {
                lastNode = lastNode.leap(callback);
            }
            return lastNode || this;
        },

        /**
         * return all matched descendants
         */
        where: function(attrs, first, excludeCurrentNode) {
            var nodes = [], matchedNode;

            // manual (non-collection method) check on the current node
            if(!excludeCurrentNode && _.where([this.toJSON()], attrs)[0]) nodes.push(this);

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
                return wrapArray(nodes);
            }
        },

        /**
         * returns true if current node is root node
         */
        isRoot: function() { return this.parent() === null; },

        /**
         * returns the root for any node
         */
        root: function() { return this.parent() && this.parent().root() || this; },

        /**
         * checks if current node contains argument node
         */
        contains: function(node) {
            if(!node || !(node.isRoot && node.parent) || node.isRoot()) return false;
            var parent = node.parent();
            return (parent === this) || this.contains(parent);
        },

        /**
         * returns the parent node
         */
        parent: function() { return this.collection && this.collection.parent || null; },

        /**
         * returns the children Backbone Collection if children nodes exist
         */
        nodes: function() { return this._nodes.length && this._nodes || null; },
        
        /**
         * return ancestors
         */
        ancestors: function(skipSelf) {
            var nodes = [];
            this.leap(function(node) {
                nodes.unshift(node);
            }, skipSelf);
            return nodes;
        },
        
        /**
         * return ancestor values
         */
        path: function(attribute, skipSelf) {
            return _.map(this.ancestors(), function(ancestor) {
                return ancestor.get(attribute);
            }, skipSelf);
        },

        /**
         * returns index of node relative to collection
         */
        index: function() {
            if(this.isRoot()) return null;
            return this.collection.indexOf(this);
        },

        /**
         * returns the node to the right
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
         * returns the node to the left
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
         */
        empty: function() {
            this._nodes.reset();
            return this;
        },

        /**
         * add child/children nodes to Backbone Collection
         */
        add: function(node) {
            if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
            this._nodes.add.apply(this._nodes, arguments);
            return this;
        },

        /**
         * inserts a node before the current node
         */
        insertBefore: function(node) {
            if(!this.isRoot()) {
                if(node instanceof Backbone.Model && node.collection) node.collection.remove(node);
                this.parent().add(node, {at: this.index()});
            }
            return this;
        },

        /**
         * inserts a node after the current node
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
         */
        before: function(nodes) {
            if(nodes) return this.insertBefore(nodes);
            return this.prev();
        },

        /**
         * shorthand for getting/inserting nodes before
         */
        after: function(nodes) {
            if(nodes) return this.insertAfter(nodes);
            return this.next();
        }
    });
    
    TreeModel.prototype.findById = TreeModel.prototype.find;

    var TreeCollection = Backbone.TreeCollection = Backbone.Collection.extend({
        
        model: TreeModel,
        
        get: function(id, opts) {
            if(opts && opts.deep) {
                return this.findById(id);
            } else {
                return Backbone.Collection.prototype.get.apply(this, arguments);
            }
        },
        
        findById: function(id) {
            var node;
            this.walk(function(n) {
                if (n.id === id) node = n;
                return !node;
            });
            return node;
        },
        
        where: function(attrs, opts) {
            if(opts && opts.deep) {
                var nodes = [];
                this.each(function(model) {
                    nodes = nodes.concat(model.where(attrs));
                });
                return wrapArray(nodes);
            } else {
                return Backbone.Collection.prototype.where.apply(this, arguments);
            }
        },
        
        walk: function(callback) {
            var lastNode;
            this.every(function(node) {
                lastNode = node.walk(callback);
                return !lastNode;
            });
            return lastNode;
        }
        
    });

    Backbone.TreeModel.prototype.collectionConstructor = TreeCollection
    
    return Backbone.TreeModel;

}));
