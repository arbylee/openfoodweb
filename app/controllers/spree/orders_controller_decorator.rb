require 'spree/core/controller_helpers/order_decorator'

Spree::OrdersController.class_eval do
  before_filter :populate_order_distributor,  :only => :populate
  before_filter :populate_order_count_on_hand,  :only => :populate
  after_filter  :populate_variant_attributes, :only => :populate

  def populate_order_distributor
    @distributor = params[:distributor_id].present? ? Enterprise.is_distributor.find(params[:distributor_id]) : nil

    if populate_valid? @distributor
      order = current_order(true)
      order.set_distributor! @distributor

    else
      flash[:error] = "Please choose a distributor for this order." if @distributor.nil?
      redirect_populate_to_first_product
    end
  end

  def populate_order_count_on_hand
    params[:products].each do |product_id, variant_id|
      product = Spree::Product.find product_id
      if product.total_on_hand < params[:quantity].to_i && product.has_variants? == false
        flash[:error] = "Unfortunately " + (product.total_on_hand == 0 ? "no" : "only" + product.total_on_hand.to_s ) + " units of the selected item remain."
        redirect_populate_to_first_product
      end
    end if params[:products]

    params[:variants].each do |variant_id, quantity|
      variant = Spree::Variant.find variant_id
      variant_total_on_hand = variant.stock_items.sum(&:count_on_hand)
      if variant_total_on_hand < params[:quantity].to_i
        flash[:error] = "Unfortunately " + (variant_total_on_hand == 0 ? "no" : "only" + variant_total_on_hand.to_s ) + " units of the selected item remain."
        redirect_populate_to_first_product
      end
    end if params[:variants]
  end

  def populate_variant_attributes
    if params.key? :variant_attributes
      params[:variant_attributes].each do |variant_id, attributes|
        current_order.set_variant_attributes(Spree::Variant.find(variant_id), attributes)
      end
    end

    if params.key? :quantity
      params[:products].each do |product_id, variant_id|
        max_quantity = params[:max_quantity].to_i
        current_order.set_variant_attributes(Spree::Variant.find(variant_id), {:max_quantity => max_quantity})
      end
    end
  end

  def select_distributor
    distributor = Enterprise.is_distributor.find params[:id]

    order = current_order(true)
    order.distributor = distributor
    order.save!

    redirect_to main_app.enterprise_path(distributor)
  end

  def deselect_distributor
    order = current_order(true)

    order.distributor = nil
    order.save!

    redirect_to root_path
  end

  private

  def populate_valid? distributor
    # -- Distributor must be specified
    return false if distributor.nil?

    # -- All products must be available under that distributor
    params[:products].each do |product_id, variant_id|
      product = Spree::Product.find product_id
      return false unless product.distributors.include? distributor
    end if params[:products]

    params[:variants].each do |variant_id, quantity|
      variant = Spree::Variant.find variant_id
      return false unless variant.product.distributors.include? distributor
    end if params[:variants]

    # -- If products in cart, distributor can't be changed
    order = current_order(false)
    if !order.nil? && !DistributorChangeValidator.new(order).can_change_to_distributor?(distributor) 
      return false
    end

    true
  end

  def redirect_populate_to_first_product
    product = if params[:products].present?
                Spree::Product.find(params[:products].keys.first)
              else
                Spree::Variant.find(params[:variants].keys.first).product
              end

    redirect_to product
  end
end
