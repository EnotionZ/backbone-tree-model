/*global mocha, describe, beforeEach, it*/

function runTests(BackboneTreeModel, expect) {

    var _ = BackboneTreeModel._, Backbone = BackboneTreeModel.Backbone, tree;

    describe('Backbone Tree', function() {
        beforeEach(function() {
            tree = new Backbone.TreeModel({
                id: 'root',
                tagname: 'body',
                nodes: [
                    {
                        id: 'wrapper',
                        tagname: 'div',
                        nodes: [
                            {
                                id: 'sidebar',
                                tagname: 'div',
                                width: 300,
                                nodes: [
                                    { tagname: 'p' },
                                    {
                                        tagname: 'ul',
                                        nodes: [
                                            { tagname: 'li' },
                                            { tagname: 'li' },
                                            { tagname: 'li' }
                                        ]
                                    },
                                    { tagname: 'span' }
                                ]
                            },
                            {
                                id: 'content',
                                tagname: 'div',
                                width: 600,
                                nodes: [
                                    {
                                        id: 'title',
                                        tagname: 'h2'
                                    },
                                    {
                                        tagname: 'p',
                                        nodes: [
                                            {
                                                tagname: 'anchor',
                                                nodes: [
                                                    { tagname: 'span' }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });
        });

        describe('#find', function() {
            it('Should return matched node', function() {
                var sidebar = tree.find('sidebar');
                expect(sidebar).to.be.ok();
                expect(sidebar.get('width')).to.be(300);
                expect(sidebar.get('tagname')).to.be('div');

                expect(tree.find('title').get('tagname')).to.be('h2');
            });
            it('should return root node if id matches root', function() {
                expect(tree.find('root')).to.be(tree);
            });
        });

        describe('#where', function() {
            it('Should return all matched descendants', function() {
                expect(tree.where({tagname: 'body'}).length).to.be(1);

                expect(tree.where({tagname: 'div'}).length).to.be(3);
            });
            it('Should support #find/#where context chaining', function() {
                expect(tree.find('sidebar').where({tagname: 'div'}).length).to.be(1);
            });
        });

        describe('#isRoot', function() {
            it('Should return true when current node is root node', function() {
                expect(tree.isRoot()).to.be.ok();
                expect(tree.find('title').root().isRoot()).to.be.ok();
                expect(tree.find('title').isRoot()).to.not.be.ok();
                expect(tree.find('sidebar').isRoot()).to.not.be.ok();
            });
        });

        describe('#root', function() {
            it('Should return the root node', function() {
                var sidebar = tree.find('sidebar');
                var content = tree.find('content');

                expect(sidebar.root().get('tagname')).to.be('body');
                expect(content.root().get('tagname')).to.be('body');
            });
        });

        describe('#contains', function() {
            it('Should return true if node is a descendant of current node', function() {
                expect(tree.contains(tree.find('sidebar'))).to.be.ok();
            });
            it('Should return false if node is not a descendant of current node', function() {
                expect(tree.find('sidebar').contains(tree)).to.not.be.ok();
            });
        });

        describe('#parent', function() {
            it('Should return the parent node', function() {
                var sidebar = tree.find('sidebar');
                var content = tree.find('content');

                expect(sidebar.parent().get('id')).to.be('wrapper');
                expect(content.parent().get('id')).to.be('wrapper');
            });
        });

        describe('#nodes', function() {
            it('Should return backbone collection consisting of children nodes if children exist', function() {
                var titleNodes = tree.find('title').nodes();
                expect(titleNodes).to.not.be.ok();

                var sidebarNodes = tree.find('sidebar').nodes();
                expect(sidebarNodes).to.be.ok();
                expect(sidebarNodes.length).to.be(3);
                expect(sidebarNodes instanceof Backbone.Collection).to.be.ok();
            });
        });

        describe('#add', function() {
            it('Should support adding single node', function() {
                var sidebar = tree.find('sidebar').add({id: 'title_1'});
                expect(sidebar.nodes().length).to.be(4);
                expect(sidebar.find('title_1')).to.be.ok();
            });

            it('Should support adding array of nodes', function() {
                var sidebar = tree.find('sidebar').add([
                    {
                        id: 'title_2',
                        tagname: 'h1',
                        nodes: [
                            {
                                id: 'anchor',
                                tagname: 'a',
                                nodes: [
                                    { tagname: 'span' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'title_3',
                        tagname: 'h2'
                    }
                ]);
                expect(sidebar.nodes().length).to.be(5);
                expect(sidebar.find('title_2')).to.be.ok();
                expect(sidebar.find('title_3')).to.be.ok();
                expect(sidebar.find('anchor')).to.be.ok();
                expect(sidebar.find('anchor').nodes().length).to.be(1);
            });

            it('Should support adding TreeModel nodes', function() {
                // place sidebar before title node
                tree.find('content').add(tree.find('sidebar'));
                expect(tree.find('content').nodes().length).to.be(3);
                expect(tree.find('wrapper').nodes().length).to.be(1);
                expect(tree.find('sidebar').parent()).to.be(tree.find('content'));
            });
        });

        describe('#insertBefore', function() {
            it('Should support adding objects to the left of a node', function() {
                var wrapper = tree.find('wrapper').insertBefore({id: 'left_wrapper'});
                expect(tree.nodes().length).to.be(2);
                expect(tree.nodes().first().id).to.be('left_wrapper');
                expect(wrapper.prev().id).to.be('left_wrapper');
            });

            it('Should support inserting TreeModel nodes', function() {
                // place sidebar before title node
                tree.find('title').insertBefore(tree.find('sidebar'));
                expect(tree.find('content').nodes().length).to.be(3);
                expect(tree.find('wrapper').nodes().length).to.be(1);
                expect(tree.find('sidebar').parent()).to.be(tree.find('content'));
            });
        });

        describe('#insertAfter', function() {
            it('Should support adding objects to the right of a node', function() {
                var wrapper = tree.find('wrapper').insertAfter({id: 'right_wrapper'});
                expect(tree.nodes().length).to.be(2);
                expect(tree.nodes().last().id).to.be('right_wrapper');
                expect(wrapper.next().id).to.be('right_wrapper');
            });

            it('Should support inserting TreeModel nodes', function() {
                // place sidebar before title node
                tree.find('title').insertAfter(tree.find('sidebar'));
                expect(tree.find('content').nodes().length).to.be(3);
                expect(tree.find('wrapper').nodes().length).to.be(1);
                expect(tree.find('sidebar').parent()).to.be(tree.find('content'));
            });
        });

        describe('#next', function() {
            it('Should return the node on the right', function() {
                expect(tree.find('sidebar').next().id).to.be('content');
            });
        });

        describe('#prev', function() {
            it('Should return the node on the left', function() {
                expect(tree.find('content').prev().id).to.be('sidebar');
            });
        });

        describe('#remove', function() {
            it('Should remove current node', function() {
                tree.find('sidebar').remove();
                expect(tree.find('wrapper').nodes().length).to.be(1);
                expect(tree.find('wrapper').nodes().first().id).to.be('content');
            });

            it('Should remove first matched descedant', function() {
                tree.remove({tagname: 'p'}, true);
                expect(tree.where({tagname: 'p'}).length).to.be(1);
            });

            it('Should remove all matched descedants', function() {
                tree.remove({tagname: 'p'});
                expect(tree.where({tagname: 'p'}).length).to.be(0);
            });
        });

        describe('#empty', function() {
            it('Should remove all children in current node', function() {
                tree.empty();
                expect(tree.find('wrapper')).to.not.be.ok();
                expect(tree.nodes()).to.not.be.ok();
            });
        });

        describe('#where for Collection/Array', function() {
            it('Should be supported for node children collection', function() {
                expect(tree.nodes().where({tagname: 'p'}, {deep: true}).length).to.be(2);
                expect(tree.find('sidebar').nodes().where({tagname: 'p'}, {deep: true}).length).to.be(1);
            });

            it('Should be supported from a chained #where call', function() {
                expect(tree.where({tagname: 'div'}).where({tagname: 'span'}).length).to.be(2);
                expect(tree.where({tagname: 'anchor'}).where({tagname: 'span'}).length).to.be(1);
            });
        });

        describe('#toJSON', function() {
            it('Should return JSON starting from node, account for node changes', function() {
                tree.find('sidebar').remove(); // perform a change

                var treeJSON = tree.toJSON();
                expect(treeJSON.nodes[0].nodes.length).to.be(1);
                expect(treeJSON.nodes[0].nodes[0].id).to.be('content');

                var wrapperJSON = tree.find('wrapper').toJSON();
                expect(wrapperJSON.nodes.length).to.be(1);
                expect(wrapperJSON.nodes[0].id).to.be('content');
            });
        });

        describe('should be able to specify model constructor with Model', function() {
            var MyCollection = Backbone.TreeCollection.extend({}),
                MyModel = Backbone.TreeModel.extend({
                collectionConstructor : MyCollection
            }),

            tree = new MyModel({
                id: 'root',
                tagname: 'body',
                nodes: [
                    {
                        id: 'wrapper',
                        tagname: 'div',
                        nodes: [
                            { tagname: 'p' }
                        ]
                    }
                ]
            });

            it('Children should be instance of MyModel', function() {
                expect(tree instanceof MyModel).to.be.ok();

                tree.nodes().forEach(function(child) {
                    expect(child instanceof MyModel).to.be.ok();
                });
            });

            it('Child collection should be instance of MyCollection', function() {
                expect(tree.nodes() instanceof MyCollection).to.be.ok();

                tree.nodes().forEach(function(child) {
                    expect(child.nodes() instanceof MyCollection).to.be.ok();
                });
            });
        });

        describe('toJSON should consider tree changes', function() {
            it('toJSON should return tree without Sydney', function() {
                tree = new Backbone.TreeCollection([
                    {
                        id:1,
                        title:'Australia',
                        nodes: [
                            {
                                id: 2,
                                title : 'Sydney'
                            }
                        ]
                    },
                ]);

                //tree without changes:
                expect(tree.toJSON()).eql([
                    {
                        id:1,
                        title:'Australia',
                        nodes: [
                            {
                                id: 2,
                                title : 'Sydney'
                            }
                        ]
                    }
                ]);

                var Sydney = tree.at(0).nodes().at(0);
                Sydney.collection.remove(Sydney);

                //tree after changes:
                expect(tree.toJSON()).eql([
                    {
                        id:1,
                        title:'Australia'
                    }
                ]);
            });
        });
    });
}


if(typeof define === 'function' && define.amd) {
    define(['treemodel'], function(TreeModel) {
        mocha.setup('bdd');
        runTests(TreeModel, window.expect);
        mocha.run();
    });
} else if(typeof exports !== 'undefined') {
    runTests(require('../src/backbone.treemodel'), require('expect.js'));
} else {
    runTests(window.BackboneTreeModel, window.expect);
}
