require 'open_food_web/distributor_change_validator'

Spree::Order.class_eval do
  belongs_to :distributor, :class_name => 'Enterprise'

  before_validation :shipping_address_from_distributor
  validate :products_available_from_new_distributor, :if => :distributor_id_changed?
  attr_accessible :distributor_id

  after_create :set_default_shipping_method

  
  def products_available_from_new_distributor
    # Check that the line_items in the current order are available from a newly selected distributor
    errors.add(:distributor_id, "cannot supply the products in your cart") unless DistributorChangeValidator.new(self).can_change_to_distributor?(distributor)
  end

  def set_distributor!(distributor)
    self.distributor = distributor
    save!
  end

  def set_variant_attributes(variant, attributes)
    line_item = find_line_item_by_variant(variant)

    if attributes.key?(:max_quantity) && attributes[:max_quantity].to_i < line_item.quantity
      attributes[:max_quantity] = line_item.quantity
    end

    line_item.assign_attributes(attributes)
    line_item.save!
  end
  
  def line_item_variants
    line_items.map{ |li| li.variant }
  end


  private

  # On creation of the order (when the first item is added to the user's cart), create a shipment 
  # (with the default shipping method).
  # self.shipments.create! creates an adjustment for the shipping cost on the order,
  # which means that the customer can see their shipping cost at every step of the
  # checkout process, not just after the delivery step.
  # This is based on the assumption that there's only one shipping method visible to the user,
  # which is a method using the itemwise shipping calculator.
  def set_default_shipping_method
    self.shipments.create!
    if self.shipment
      self.save!
    else
      raise 'No default shipping method found'
    end
  end

  def shipping_address_from_distributor
    if distributor
      self.ship_address = distributor.address.clone

      if bill_address
        self.ship_address.firstname = bill_address.firstname
        self.ship_address.lastname = bill_address.lastname
        self.ship_address.phone = bill_address.phone
      end
    end
  end
end
