require 'spec_helper'

module Spree
  describe OrderPopulator do
    let(:order) { double(:order, id: 123) }
    let(:currency) { double(:currency) }
    let(:params) { double(:params) }
    let(:distributor) { double(:distributor) }
    let(:order_cycle) { double(:order_cycle) }
    let(:op) { OrderPopulator.new(order, currency) }

    describe "populate" do

      it "checks that distributor can supply all products in the cart" do
        op.should_receive(:load_distributor_and_order_cycle).with(params).
          and_return([distributor, order_cycle])
        op.should_receive(:distributor_can_supply_products_in_cart).with(distributor).
          and_return(false)
        op.should_receive(:populate_without_distribution_validation).never
        op.should_receive(:set_cart_distributor_and_order_cycle).never

        op.populate(params).should be_false
        op.errors.to_a.should == ["That distributor can't supply all the products in your cart. Please choose another."]
      end

      it "doesn't set cart distributor and order cycle if populate fails" do
        op.should_receive(:load_distributor_and_order_cycle).with(params).
          and_return([distributor, order_cycle])
        op.should_receive(:distributor_can_supply_products_in_cart).with(distributor).
          and_return(true)

        op.class_eval do
          def populate_without_distribution_validation(from_hash)
            errors.add(:base, "Something went wrong.")
          end
        end

        op.should_receive(:set_cart_distributor_and_order_cycle).never

        op.populate(params).should be_false
        op.errors.to_a.should == ["Something went wrong."]
      end

      it "sets cart distributor and order cycle when populate succeeds" do
        op.should_receive(:load_distributor_and_order_cycle).with(params).
          and_return([distributor, order_cycle])
        op.should_receive(:distributor_can_supply_products_in_cart).with(distributor).
          and_return(true)
        op.should_receive(:populate_without_distribution_validation).with(params)
        op.should_receive(:set_cart_distributor_and_order_cycle).with(distributor, order_cycle)

        op.populate(params).should be_true
      end
    end

    describe "attempt_cart_add" do
      it "performs additional validations" do
        variant = double(:variant)
        quantity = 123
        Spree::Variant.stub(:find).and_return(variant)

        op.should_receive(:check_stock_levels).with(variant, quantity).and_return(true)
        op.should_receive(:check_distribution_provided_for).with(variant).and_return(true)
        op.should_receive(:check_variant_available_under_distributor).with(variant).
          and_return(true)
        order.should_receive(:add_variant).with(variant, quantity, currency)

        op.attempt_cart_add(333, quantity.to_s)
      end
    end

    describe "support" do
      describe "loading distributor and order cycle from hash" do
        it "loads distributor and order cycle when present" do
          params = {distributor_id: 1, order_cycle_id: 2}
          distributor = double(:distributor)
          order_cycle = double(:order_cycle)

          enterprise_scope = double(:enterprise_scope)
          enterprise_scope.should_receive(:find).with(1).and_return(distributor)
          Enterprise.should_receive(:is_distributor).and_return(enterprise_scope)
          OrderCycle.should_receive(:find).with(2).and_return(order_cycle)

          op.send(:load_distributor_and_order_cycle, params).should ==
            [distributor, order_cycle]
        end

        it "returns nil when not present" do
          op.send(:load_distributor_and_order_cycle, {}).should == [nil, nil]
        end
      end

      it "sets cart distributor and order cycle" do
        Spree::Order.should_receive(:find).with(order.id).and_return(order)
        order.should_receive(:set_distributor!).with(distributor)
        order.should_receive(:set_order_cycle!).with(order_cycle)

        op.send(:set_cart_distributor_and_order_cycle, distributor, order_cycle)
      end

      describe "checking if distribution is provided for a variant" do
        let(:variant) { double(:variant) }

        it "returns false when distributor is nil" do
          op.instance_eval { @distributor = nil }
          op.send(:distribution_provided_for, variant).should be_false
        end

        it "returns false when order cycle is nil when it's required" do
          op.instance_eval { @distributor = 1; @order_cycle = nil }
          op.should_receive(:order_cycle_required_for).with(variant).and_return(true)
          op.send(:distribution_provided_for, variant).should be_false
        end

        it "returns true when distributor is present and order cycle is not required" do
          op.instance_eval { @distributor = 1; @order_cycle = nil }
          op.should_receive(:order_cycle_required_for).with(variant).and_return(false)
          op.send(:distribution_provided_for, variant).should be_true
        end

        it "returns true when distributor is present and order cycle is required and present" do
          op.instance_eval { @distributor = 1; @order_cycle = 1 }
          op.should_receive(:order_cycle_required_for).with(variant).and_return(true)
          op.send(:distribution_provided_for, variant).should be_true
        end
      end

      describe "checking if order cycle is required for a variant" do
        it "requires an order cycle when the product has no product distributions" do
          product = double(:product, product_distributions: [])
          variant = double(:variant, product: product)
          op.send(:order_cycle_required_for, variant).should be_true
        end

        it "does not require an order cycle when the product has product distributions" do
          product = double(:product, product_distributions: [1])
          variant = double(:variant, product: product)
          op.send(:order_cycle_required_for, variant).should be_false
        end
      end

    end

    describe "validations" do
      describe "determining if distributor can supply products in cart" do
        it "returns true if no distributor is supplied" do
          op.send(:distributor_can_supply_products_in_cart, nil).should be_true
        end

        it "returns true if the order can be changed to that distributor" do
          dcv = double(:dcv)
          dcv.should_receive(:can_change_to_distributor?).with(distributor).and_return(true)
          DistributionChangeValidator.should_receive(:new).with(order).and_return(dcv)
          op.send(:distributor_can_supply_products_in_cart, distributor).should be_true
        end

        it "returns false otherwise" do
          dcv = double(:dcv)
          dcv.should_receive(:can_change_to_distributor?).with(distributor).and_return(false)
          DistributionChangeValidator.should_receive(:new).with(order).and_return(dcv)
          op.send(:distributor_can_supply_products_in_cart, distributor).should be_false
        end
      end

      describe "checking distribution is provided for a variant" do
        let(:variant) { double(:variant) }

        it "returns false and errors when distribution is not provided and order cycle is required" do
          op.should_receive(:distribution_provided_for).with(variant).and_return(false)
          op.should_receive(:order_cycle_required_for).with(variant).and_return(true)

          op.send(:check_distribution_provided_for, variant).should be_false
          op.errors.to_a.should == ["Please choose a distributor and order cycle for this order."]
        end

        it "returns false and errors when distribution is not provided and order cycle is not required" do
          op.should_receive(:distribution_provided_for).with(variant).and_return(false)
          op.should_receive(:order_cycle_required_for).with(variant).and_return(false)

          op.send(:check_distribution_provided_for, variant).should be_false
          op.errors.to_a.should == ["Please choose a distributor for this order."]
        end

        it "returns true and does not error otherwise" do
          op.should_receive(:distribution_provided_for).with(variant).and_return(true)

          op.send(:check_distribution_provided_for, variant).should be_true
          op.errors.should be_empty
        end
      end

      describe "checking variant is available under the distributor" do
        let(:product) { double(:product) }
        let(:variant) { double(:variant, product: product) }

        it "is available if the distributor is distributing this product" do
          op.instance_eval { @distributor = 123 }
          Enterprise.should_receive(:distributing_product).with(variant.product).and_return [123]

          op.send(:check_variant_available_under_distributor, variant).should be_true
          op.errors.should be_empty
        end

        it "returns false and errors otherwise" do
          op.instance_eval { @distributor = 123 }
          Enterprise.should_receive(:distributing_product).with(variant.product).and_return [456]

          op.send(:check_variant_available_under_distributor, variant).should be_false
          op.errors.to_a.should == ["That product is not available from the chosen distributor."]
        end
      end
    end
  end
end