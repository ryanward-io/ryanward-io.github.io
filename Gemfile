source "https://rubygems.org"

gem "jekyll", "~> 4.3"

# Pinned to 2.x (sassc) because sass-embedded 3.x needs Ruby 3.1+ for prebuilt binaries;
# drop this pin once local Ruby is upgraded.
gem "jekyll-sass-converter", "~> 2.2"

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-redirect-from"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Not bundled with Ruby 3+, needed for `jekyll serve`
gem "webrick", "~> 1.8"
