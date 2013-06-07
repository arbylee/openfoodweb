describe("Auxillary functions", function(){

	describe("sorting objects by id", function(){
		var a, b;

		beforeEach(function(){
			a = [ { id: 1, value: 10 }, { id: 2, value: 20 }, { id: 3, value: 30 }, { notanid: 4, value: 40 } ];
			b = [ { id: 3, value: 30 }, { id: 2, value: 20 }, { id: 1, value: 10 } ];
		});

		it("returns only objects with an id", function(){
			expect(sortByID(a)).toEqual( [ { id: 1, value: 10 }, { id: 2, value: 20 }, { id: 3, value: 30 } ] );
		});

		it("returns objects in a list sorted by id", function(){
			expect(sortByID(b)).toEqual( [ { id: 1, value: 10 }, { id: 2, value: 20 }, { id: 3, value: 30 } ] );
		});
	});

	describe("finding matching objects", function() {
		var a, b, c, d, e;

		beforeEach(function(){
			a = [ { id: 1, value: 10 }, { id: 2, value: 20 } ];
			b = [ { id: 1, value: 11 }, { id: 2, value: 22 } ];
			c = [ { id: 1, value: 12 }, { id: 2, value: 23 }, { id: 3, value: 34 } ];
			d = [ { id: 1, value: 13 }, { id: 2, value: 24 }, { id: 4, value: 46 } ];
			e = [ { id: 1, value: 14 }, { id: 2, value: 25 }, { id: 3, value: 34 }, { notanid: 12, value: 47 } ];

			spyOn(window, "sortByID").andCallThrough();
		});

		it("calls sortByID once for each input array", function(){
			matchedObjects = getMatchedObjects(a, b);
			expect(sortByID.calls.length).toEqual(2);
			expect(sortByID).toHaveBeenCalledWith(a);
			expect(sortByID).toHaveBeenCalledWith(b);
		});

		it("returns only objects with an id in the test list", function() { 
			expect( getMatchedObjects(a, b) ).toEqual( [ { id: 1, value: 11 }, { id: 2, value: 22 } ]);
		});

		it("returns only objects with an id in testList, ignores objects with ids which only appear in cleanlist", function(){
			expect( getMatchedObjects(b, c) ).toEqual( [ { id: 1, value: 12 }, { id: 2, value: 23 } ]);
		});

		it("creates a duplicate entry the in returned list for objects in listOne that are absent from cleanList (as determined by id)", function() { 
			expect( getMatchedObjects(c, d) ).toEqual( [ { id: 1, value: 13 }, { id: 2, value: 24 }, { id: 3, value: 34 } ]);
		});

		it("always returns a list of objects equal in length to the length of the testList, minus items without an id", function(){
			expect( getMatchedObjects(d, e) ).toEqual( [ { id: 1, value: 14 }, { id: 2, value: 25 }, { id: 4, value: 46 } ]);
			expect( getMatchedObjects(e, d) ).toEqual( [ { id: 1, value: 13 }, { id: 2, value: 24 }, { id: 3, value: 34 } ]);
		});
	});

	describe("Getting dirty properties of objects", function() {
		var a, b, c, d;

		beforeEach(function(){
			a = { id: 1, "1": 1, "2": 5, "3": 3 };
			b = { id: 1, "1": 1, "2": 2, "3": 3 };
			c = { id: 1, "1": 1, "2": 2, "3": 3, "4": 4 };
			d = { id: 2, "1": 2, "2": 6, "3": 8 };
		});

		it("returns only differing properties when object do not match", function() {
			expect( getDirtyPropertiesOfObject(a, b) ).toEqual( { "2": 5 } );
			expect( getDirtyPropertiesOfObject(b, b) ).toEqual( {} );
		});

		it("ignores properties which are not possessed by both objects", function() {
			expect( getDirtyPropertiesOfObject(b, c) ).toEqual( {} );
			expect( getDirtyPropertiesOfObject(c, b) ).toEqual( {} );
		});
		
		it("sends properties which are objects back to getDirtyPropertiesOfObject",function(){
			spyOn(window, "getDirtyPropertiesOfObject").andCallThrough();
			getDirtyPropertiesOfObject( { id: 1, num: 3, object: { id: 1, value: "something" } }, { id: 1, num: 2, object: { id: 1, value: "somethingelse" } } );
			expect(getDirtyPropertiesOfObject.calls.length).toEqual(2);
			expect(getDirtyPropertiesOfObject).toHaveBeenCalledWith( { id: 1, value: "something" }, { id: 1, value: "somethingelse" } );
		})
		
		it("sends properties which are arrays with a key of 'variants' back to getDirtyObjects, ignores other arrays",function(){
			spyOn(window, "getDirtyObjects");
			getDirtyPropertiesOfObject( { id: 1, num: 3, array: [ 1, 2, 3 ], variants: [ { id: 1, value: "something" } ] }, { id: 1, num: 2, array: [ 2, 3, 4], variants: [ { id: 1, value: "somethingelse" } ] } );
			expect(getDirtyObjects.calls.length).toEqual(1);
			expect(getDirtyObjects).toHaveBeenCalledWith( [ { id: 1, value: "something" } ], [ { id: 1, value: "somethingelse" } ] );
		})
	});

	describe("Getting dirty objects", function() {
		var a, b, c, d;
		beforeEach(function(){
			a = [ { id: 1, value: 10 }, { id: 2, value: 20 } ];
			b = [ { id: 1, value: 10 }, { id: 2, value: 15 } ];
			c = [ { id: 1, value: 10 }, { id: 2, value: 12 }, { id: 3, value1: 10, value2: 15 } ];
			d = [ { id: 1, value: 10 }, { id: 2, value: 20 }, { id: 3, value1: 10, value2: 20 } ];
		});

		it("calls getMatchedObjects() once for each call to getDirtyItems", function(){
			spyOn(window, "getMatchedObjects").andReturn(b);
			spyOn(window, "getDirtyPropertiesOfObject");
			var dirtyObjects = getDirtyObjects(a, b);

			expect(getMatchedObjects.calls.length).toEqual(1);
			expect(getMatchedObjects).toHaveBeenCalledWith(a,b);
		});

		it("calls sortByID once for the test Array", function(){
			spyOn(window, "getMatchedObjects").andReturn(b);
			spyOn(window, "sortByID");
			spyOn(window, "getDirtyPropertiesOfObject");
			var dirtyObjects = getDirtyObjects(a, b);

			expect(sortByID.calls.length).toEqual(1);
			expect(sortByID).toHaveBeenCalledWith(a);
		});

		it("returns only valid (non-empty) objects returned by getDirtyPropertiesOfObject", function(){
			expect( getDirtyObjects(a, b) ).not.toContain( {} );
		});

		it("adds an id property to any non-empty object that is returned to it", function(){
			expect( getDirtyObjects(a, b) ).toEqual( [ { id: 2, value: 20 } ] );
		});

		it("calls getDirtyPropertiesOfObject() once for each pair of objects", function(){
			spyOn(window, "getMatchedObjects").andReturn(b);
			spyOn(window, "getDirtyPropertiesOfObject").andCallThrough();
			var dirtyObjects = getDirtyObjects(a, b);

			expect(getDirtyPropertiesOfObject.calls.length).toEqual(2);
			expect(getDirtyPropertiesOfObject).toHaveBeenCalledWith(a[0],b[0]);
			expect(getDirtyPropertiesOfObject).toHaveBeenCalledWith(a[1],b[1]);
		});

		it("returns an array of objects identified by their ids, and any additional differing properties", function(){
			expect( getDirtyObjects(c, d) ).toEqual( [ { id: 2, value: 12 }, { id: 3, value2: 15 } ] );
		});
	});

	describe("filtering products", function(){
		it("accepts an object or an array and only returns an array", function(){
			expect( filterSubmitProducts( [] ) ).toEqual([]);
			expect( filterSubmitProducts( {} ) ).toEqual([]);
			expect( filterSubmitProducts( { 1: { id: 1, name: "lala" } } ) ).toEqual( [ { id: 1, name: "lala" } ] );
			expect( filterSubmitProducts( [ { id: 1, name: "lala" } ] ) ).toEqual( [ { id: 1, name: "lala" } ] );
			expect( filterSubmitProducts( 1 ) ).toEqual([]);
			expect( filterSubmitProducts( "2" ) ).toEqual([]);
			expect( filterSubmitProducts( null ) ).toEqual([]);
		});

		it("only returns products which have an id property", function(){
			expect( filterSubmitProducts( [ { id: 1, name: "p1" }, { notanid: 2, name: "p2"} ] ) ).toEqual( [ { id: 1, name: "p1" } ]);
		});

		it("does not return a product object for products which have no propeties other than an id", function(){
			expect( filterSubmitProducts( [ { id: 1, someunwantedproperty: "something" }, { id: 2, name: "p2"} ] ) ).toEqual( [ { id: 2, name: "p2" } ]);
		});

		it("does not return an on_hand count when a product has variants", function(){
			var testProduct  = {
				id: 1,
				on_hand: 5,
				variants: [ {
					id: 1,
					on_hand: 5,
					price: 12.0
				} ]
			};
			expect( filterSubmitProducts( [ testProduct ] ) ).toEqual( [ {
				id: 1,
				variants_attributes: [ {
					id: 1,
					on_hand: 5,
					price: 12.0
				} ]
			} ] );
		});

		it("returns variants as variants_attributes", function(){
			var testProduct  = {
				id: 1,
				variants: [ {
					id: 1,
					on_hand: 5,
					price: 12.0
				} ]
			};
			expect( filterSubmitProducts( [ testProduct ] ) ).toEqual( [ {
				id: 1,
				variants_attributes: [ {
					id: 1,
					on_hand: 5,
					price: 12.0
				} ]
			} ] );
		});

		it("ignores variants without an id, and those for which deleted_at is not null", function(){
			var testProduct  = {
				id: 1,
				variants: [ {
					id: 1,
					on_hand: 3,
					price: 5.0
				},
				{
					on_hand: 1,
					price: 15.0
				},
				{
					id: 2,
					on_hand: 2,
					deleted_at: new Date(),
					price: 20.0
				} ]
			};
			expect( filterSubmitProducts( [ testProduct ] ) ).toEqual( [ {
				id: 1,
				variants_attributes: [ {
					id: 1,
					on_hand: 3,
					price: 5.0
				} ]
			} ] );
		});

		it("does not return variants_attributes property if variants is an empty array", function(){
			var testProduct  = {
				id: 1,
				price: 10,
				variants: []
			};
			expect( filterSubmitProducts( [ testProduct ] ) ).toEqual( [ {
				id: 1,
				price: 10
			} ] );
		});

		// TODO Not an exhaustive test, is there a better way to do this?
		it("only returns properties the properties of products which ought to be updated", function(){
			var testProduct  = {
				id: 1,
				name: "TestProduct",
				description: "",
				available_on: new Date(),
				deleted_at: null,
				permalink: null,
				meta_description: null,
				meta_keywords: null,
				tax_category_id: null,
				shipping_category_id: null,
				created_at: null,
				updated_at: null,
				count_on_hand: 0,
				supplier_id: 5,
				group_buy: null,
				group_buy_unit_size: null,
				on_demand: false,
				variants: [ {
					id: 1,
					on_hand: 2,
					price: 10.0
				} ]						
			};

			expect(filterSubmitProducts( [ testProduct ] ) ).toEqual([
				{
					id: 1,
					name: "TestProduct",
					supplier_id: 5,
					available_on: new Date(),
					variants_attributes: [ {
						id: 1,
						on_hand: 2,
						price: 10.0
					} ]						
				} ]
			);
		});
	});
});

describe("Maintaining a live record of dirty products and properties", function(){
	describe("adding product properties to the dirtyProducts object", function(){ // Applies to both products and variants
		it("adds the product and the property to the list if property is dirty", function(){
			var dirtyProducts = { };
			addDirtyProperty(dirtyProducts, 1, "name", "Product 1");

			expect(dirtyProducts).toEqual( { 1: { id: 1, name: "Product 1" } } );
		});

		it("adds the relevant property to a product that is already in the list but which does not yet possess it if the property is dirty", function(){
			var dirtyProducts = { 1: { id: 1, notaname: "something" } };
			addDirtyProperty(dirtyProducts, 1, "name", "Product 3");

			expect(dirtyProducts).toEqual( { 1: { id: 1, notaname: "something", name: "Product 3" } } );
		});

		it("changes the relevant property of a product that is already in the list if the property is dirty", function(){
			var dirtyProducts = { 1: { id: 1, name: "Product 1" } };
			addDirtyProperty(dirtyProducts, 1, "name", "Product 2");

			expect(dirtyProducts).toEqual( { 1: { id: 1, name: "Product 2" } } );
		});
	});

	describe("removing properties of products which are clean", function(){
		it("removes the relevant property from a product if the property is clean and the product has that property", function(){
			var dirtyProducts = { 1: { id: 1, someProperty: "something", name: "Product 1" } };
			removeCleanProperty(dirtyProducts, 1, "name", "Product 1");

			expect(dirtyProducts).toEqual( { 1: { id: 1, someProperty: "something" } } );
		});

		it("removes the product from dirtyProducts if the property is clean and by removing an existing property on an id is left", function(){
			var dirtyProducts = { 1: { id: 1, name: "Product 1" } };
			removeCleanProperty(dirtyProducts, 1, "name", "Product 1");

			expect(dirtyProducts).toEqual( { } );
		});
	});
});

describe("AdminBulkProductsCtrl", function(){
	describe("loading data upon initialisation", function(){
		ctrl = null;
		scope = null;
		httpBackend = null;

		beforeEach(function(){
			module('bulk_product_update');
		});

		beforeEach(inject(function($controller,$rootScope,$httpBackend) {
			scope = $rootScope.$new();
			ctrl = $controller;
			httpBackend = $httpBackend;

			ctrl('AdminBulkProductsCtrl', { $scope: scope } );
		}));

		it("gets a list of suppliers", function(){
			httpBackend.expectGET('/enterprises/suppliers.json').respond("list of suppliers");
			scope.refreshSuppliers();
			httpBackend.flush();
			expect(scope.suppliers).toEqual("list of suppliers");
		});

		it("gets a list of products and stores a clean list of products", function(){
			httpBackend.expectGET('/admin/products/bulk_index.json').respond("list of products");
			scope.refreshProducts();
			httpBackend.flush();
			expect(scope.products).toEqual("list of products");
			expect(scope.cleanProducts).toEqual("list of products");
		});

		it("does not affect clean products list when products list is altered", function(){
			httpBackend.expectGET('/admin/products/bulk_index.json').respond( [1,2,3,4,5] );
			scope.refreshProducts();
			httpBackend.flush();
			expect(scope.products).toEqual( [1,2,3,4,5] );
			expect(scope.cleanProducts).toEqual( [1,2,3,4,5] );
			scope.products.push(6);
			expect(scope.products).toEqual( [1,2,3,4,5,6] );
			expect(scope.cleanProducts).toEqual( [1,2,3,4,5] );
		});
	});
	
	describe("getting on_hand counts when products have variants", function(){		
		var p1, p2, p3;
		beforeEach(function(){
			p1 = { variants: [ { on_hand: 1 }, { on_hand: 2 }, { on_hand: 3 } ] };
			p2 = { variants: [ { not_on_hand: 1 }, { on_hand: 2 }, { on_hand: 3 } ] };
			p3 = { not_variants: [ { on_hand: 1 }, { on_hand: 2 } ], variants: [ { on_hand: 3 } ] };
		});

		it("sums variant on_hand properties", function(){
			expect(onHand(p1)).toEqual(6);
		});

		it("ignores items in variants without an on_hand property (adds 0)", function(){
			expect(onHand(p2)).toEqual(5);
		});

		it("ignores on_hand properties of objects in arrays which are not named 'variants' (adds 0)", function(){
			expect(onHand(p3)).toEqual(3);
		});

		it("returns 'error' if not given an object with a variants property that is an array", function(){
			expect( onHand([]) ).toEqual('error');
			expect( onHand( { not_variants: [] } ) ).toEqual('error');
			expect( onHand( { variants: {} } ) ).toEqual('error');
		});
	});

	describe("submitting products to be updated", function(){
		ctrl = null;
		scope = null;
		timeout = null;
		httpBackend = null;

		beforeEach(function(){
			module('bulk_product_update');
		});

		beforeEach(inject(function($controller,$rootScope,$timeout,$httpBackend) {
			scope = $rootScope.$new();
			ctrl = $controller;
			timeout = $timeout;
			httpBackend = $httpBackend;
		}));

		describe("preparing products for submit",function(){
			beforeEach(function(){
				ctrl('AdminBulkProductsCtrl', { $scope: scope } );
				spyOn(window, "filterSubmitProducts").andReturn( [ { id: 1, value: 3 }, { id: 2, value: 4 } ] );
				spyOn(scope, "updateProducts");
				scope.dirtyProducts = { 1: { id: 1 }, 2: { id: 2 } };
				scope.prepareProductsForSubmit();
			});

			it("filters returned dirty products", function(){
				expect(filterSubmitProducts).toHaveBeenCalledWith( { 1: { id: 1 }, 2: { id: 2 } } );
			});

			it("sends dirty and filtered objects to submitProducts()", function(){
				expect(scope.updateProducts).toHaveBeenCalledWith( [ { id: 1, value: 3 }, { id: 2, value: 4 } ] );
			});
		});
		
		describe("updating products",function(){
			beforeEach(function(){
				ctrl('AdminBulkProductsCtrl', { $scope: scope, $timeout: timeout } );
			});

			it("submits products to be updated with a http post request to /admin/products/bulk_update", function(){
				httpBackend.expectPOST('/admin/products/bulk_update').respond("list of products");
				scope.updateProducts("list of products");
				httpBackend.flush();
			});

			it("runs displaySuccess() when post returns success",function(){
				spyOn(scope, "displaySuccess");
				scope.products = "updated list of products";
				httpBackend.expectPOST('/admin/products/bulk_update').respond(200, "updated list of products");
				scope.updateProducts("updated list of products");
				httpBackend.flush();
				expect(scope.displaySuccess).toHaveBeenCalled();
			});

			it("runs displayFailure() when post return data does not match $scope.products",function(){
				spyOn(scope, "displayFailure");
				scope.products = "current list of products";
				httpBackend.expectPOST('/admin/products/bulk_update').respond(200, "returned list of products");
				scope.updateProducts("updated list of products");
				httpBackend.flush();
				expect(scope.displayFailure).toHaveBeenCalled();
			});

			it("runs displayFailure() when post returns error",function(){
				spyOn(scope, "displayFailure");
				scope.products = "updated list of products";
				httpBackend.expectPOST('/admin/products/bulk_update').respond(404, "updated list of products");
				scope.updateProducts("updated list of products");
				httpBackend.flush();
				expect(scope.displayFailure).toHaveBeenCalled();
			});
		});
	});

	/*describe("directives",function(){
		scope = null;
		compiler = null;
		
		beforeEach(function(){
			module('bulk_product_update');
		});

		beforeEach(inject(function($rootScope,$compile) {
			compiler = $compile;
			scope = $rootScope;
		}));
		
		it("should format numeric strings in ngDecimal fields as decimals in the associated model",function(){
			scope.$apply(function() { scope.testValue = "123"; });
		    
			var field = angular.element("<input type='text' ng-demical='true' ng-model='testValue'>");
			compiler(field)(scope);
			
		    scope.$apply();

			expect(field.text()).toBe("123");
		});
	});*/
});