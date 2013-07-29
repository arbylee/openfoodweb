source 'https://rubygems.org'
ruby "1.9.3"

gem 'rails', '3.2.13'

gem 'pg'
gem 'spree', :git => 'git://github.com/spree/spree.git', :branch => '2-0-stable'
gem 'spree_i18n', :git => 'git://github.com/spree/spree_i18n.git', :branch => '2-0-stable'
gem 'spree_paypal_express', :git => 'git://github.com/spree/spree_paypal_express.git', :branch => '2-0-stable'
gem 'spree_last_address', :git => 'git://github.com/eaterprises/spree-last-address.git', :tag => 'spree-2.0'
gem 'spree_auth_devise', :git => 'https://github.com/spree/spree_auth_devise.git', :branch => '2-0-stable'

gem 'comfortable_mexican_sofa'

# Fix bug in simple_form preventing collection_check_boxes usage within form_for block
# When merged, revert to upstream gem
gem 'simple_form', :git => 'git://github.com/RohanM/simple_form.git'

gem 'unicorn'
gem 'bugsnag'
gem 'spree_heroku', :git => 'git://github.com/eaterprises/spree-heroku.git'
gem 'haml'
gem 'sass'
gem 'aws-sdk'
gem 'andand'
gem 'truncate_html'
gem 'representative_view'
gem 'rabl'
gem 'oj'

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'

  # See https://github.com/sstephenson/execjs#readme for more supported runtimes
  gem 'therubyracer'

  gem 'uglifier', '>= 1.0.3'

  gem 'turbo-sprockets-rails3'
end

gem 'jquery-rails'



group :test, :development do
  # Pretty printed test output
  gem 'turn', '~> 0.8.3', :require => false
  gem 'rspec-rails'
  gem 'shoulda-matchers'
  gem 'factory_girl_rails', :require => false
  gem 'faker'
  gem 'capybara'
  gem 'database_cleaner', '0.7.1', :require => false
  gem 'simplecov', :require => false
  gem 'awesome_print'
  gem "letter_opener"
end

group :development do
  gem 'pry-debugger'
  gem 'debugger-linecache'  
  gem "rails-erd"
end
