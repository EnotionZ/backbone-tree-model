var tree;
describe('Backbone Tree', function() {
	beforeEach(function() {
		tree = new Backbone.TreeModel({
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
	});

	describe('#insertBefore', function() {
		it('Should support adding objects to the left of a node', function() {
			var wrapper = tree.find('wrapper').insertBefore({id: 'left_wrapper'});
			expect(tree.nodes().length).to.be(2);
			expect(tree.nodes().first().id).to.be('left_wrapper');
			expect(wrapper.prev().id).to.be('left_wrapper');
		});
	});

	describe('#insertAfter', function() {
		it('Should support adding objects to the right of a node', function() {
			var wrapper = tree.find('wrapper').insertAfter({id: 'right_wrapper'});
			expect(tree.nodes().length).to.be(2);
			expect(tree.nodes().last().id).to.be('right_wrapper');
			expect(wrapper.next().id).to.be('right_wrapper');
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

});
